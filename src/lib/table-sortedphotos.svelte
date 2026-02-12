<script module>
  import { SvelteMap } from 'svelte/reactivity';
  import { structured_groups } from './groups.js';
  import { makeCompositeKey } from './groups.js';
  import { getActiveTableData, updateActiveTablePhotoData } from './table-state.svelte';

  /**
   * Convert nested photoData to SvelteMap with composite keys.
   * @param {object} photoData - Nested photo data from table
   * @returns {SvelteMap}
   */
  function photoDataToSvelteMap(photoData) {
    const map = new SvelteMap();

    for (const group of structured_groups) {
      const groupData = photoData[group.id] || {};

      for (const gen of group.generations) {
        for (const member of gen.members) {
          const key = makeCompositeKey(group.id, member.fullname);
          const counts = groupData[member.fullname] || [0, 0, 0, 0];
          let data = $state([...counts]);
          map.set(key, data);
        }
      }
    }

    return map;
  }

  /**
   * Convert SvelteMap with composite keys to nested photoData.
   * @param {SvelteMap} map - SvelteMap with composite keys
   * @returns {object}
   */
  function svelteMapToPhotoData(map) {
    const photoData = {};

    for (const group of structured_groups) {
      const groupData = {};

      for (const gen of group.generations) {
        for (const member of gen.members) {
          const key = makeCompositeKey(group.id, member.fullname);
          if (map.has(key)) {
            const counts = map.get(key);
            // Only include non-zero counts
            if (!counts.every(v => v === 0)) {
              groupData[member.fullname] = [...counts];
            }
          }
        }
      }

      if (Object.keys(groupData).length > 0) {
        photoData[group.id] = groupData;
      }
    }

    return photoData;
  }

  /**
   * Load sortedPhotos from the active table.
   * @returns {SvelteMap}
   */
  export function loadSortedPhotosFromActiveTable() {
    const activeTable = getActiveTableData();
    if (!activeTable) {
      // No active table - return empty map
      return photoDataToSvelteMap({});
    }

    return photoDataToSvelteMap(activeTable.photoData);
  }

  /**
   * Save sortedPhotos to the active table.
   * @param {SvelteMap} sortedPhotos
   */
  export function saveSortedPhotosToActiveTable(sortedPhotos) {
    const photoData = svelteMapToPhotoData(sortedPhotos);
    updateActiveTablePhotoData(photoData);
  }

  /**
   * Clear all photo counts in sortedPhotos.
   * @param {SvelteMap} sortedPhotos
   */
  export function clearSortedPhotos(sortedPhotos) {
    sortedPhotos.forEach((_, key) => {
      let data = $state([0, 0, 0, 0]);
      sortedPhotos.set(key, data);
    });
    saveSortedPhotosToActiveTable(sortedPhotos);
  }

  /**
   * Helper to get photo data by groupId and fullname.
   * @param {SvelteMap} sortedPhotos
   * @param {string} groupId
   * @param {string} fullname
   * @returns {number[]}
   */
  export function getPhotoData(sortedPhotos, groupId, fullname) {
    const key = makeCompositeKey(groupId, fullname);
    return sortedPhotos.get(key) || [0, 0, 0, 0];
  }

  /**
   * Helper to set photo data by groupId and fullname.
   * @param {SvelteMap} sortedPhotos
   * @param {string} groupId
   * @param {string} fullname
   * @param {number[]} data
   */
  export function setPhotoData(sortedPhotos, groupId, fullname, data) {
    const key = makeCompositeKey(groupId, fullname);
    sortedPhotos.set(key, data);
  }
</script>
