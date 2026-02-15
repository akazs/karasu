<script module>
  import { SvelteMap } from 'svelte/reactivity';
  import { structured_groups } from './groups.js';
  import { makeCompositeKey } from './groups.js';
  import { mapToPhotoData } from './table-photo-converter.js';
  import { getActiveTableData, updateActiveTablePhotoData } from './table-state.js';

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
   * Reuses mapToPhotoData utility from table-photo-converter.js.
   * @param {SvelteMap} map - SvelteMap with composite keys
   * @returns {object}
   */
  function svelteMapToPhotoData(map) {
    // SvelteMap is compatible with Map interface
    return mapToPhotoData(map, structured_groups);
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
    // Manually trigger save since SvelteMap value updates don't trigger size changes
    saveSortedPhotosToActiveTable(sortedPhotos);
  }
</script>
