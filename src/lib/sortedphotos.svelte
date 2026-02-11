<script module>
  import { SvelteMap } from 'svelte/reactivity';
  import { structured_groups } from './groups.js';
  import { makeCompositeKey } from './groups.js';
  import { buildEmptyPhotos, serializePhotos, deserializePhotos, STORAGE_KEY } from './storage.js';

  function newSortedPhotos() {
    const plain = buildEmptyPhotos(structured_groups);
    const sortedPhotos = new SvelteMap();
    for (const [key, value] of plain) {
      let data = $state(value);
      sortedPhotos.set(key, data);
    }
    return sortedPhotos;
  }

  function sortedPhotosToJSON(sortedPhotos) {
    return serializePhotos(sortedPhotos, structured_groups);
  }

  function JSONToSortedPhotos(json) {
    try {
      const plain = deserializePhotos(json, structured_groups);
      const sortedPhotos = new SvelteMap();
      for (const [key, value] of plain) {
        let data = $state(value);
        sortedPhotos.set(key, data);
      }
      return sortedPhotos;
    } catch (err) {
      return newSortedPhotos();
    }
  }

  export function saveSortedPhotosToLocalStorage(sortedPhotos) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, sortedPhotosToJSON(sortedPhotos));
    }
  }

  export function loadSortedPhotosFromLocalStorageOrNew() {
    let sortedPhotos;
    if (typeof localStorage !== 'undefined') {
      const localStorageItem = localStorage.getItem(STORAGE_KEY);
      if (localStorageItem === null) {
        sortedPhotos = newSortedPhotos();
      } else {
        sortedPhotos = JSONToSortedPhotos(localStorageItem);
      }
    } else {
      sortedPhotos = newSortedPhotos();
    }
    return sortedPhotos;
  }

  export function clearSortedPhotos(sortedPhotos) {
    sortedPhotos.forEach((_, key) => {
      let data = $state([0, 0, 0, 0]);
      sortedPhotos.set(key, data);
    });
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  /**
   * Helper to get photo data by groupId and fullname.
   * Falls back to [0,0,0,0] if not found.
   */
  export function getPhotoData(sortedPhotos, groupId, fullname) {
    const key = makeCompositeKey(groupId, fullname);
    return sortedPhotos.get(key) || [0, 0, 0, 0];
  }

  /**
   * Helper to set photo data by groupId and fullname.
   */
  export function setPhotoData(sortedPhotos, groupId, fullname, data) {
    const key = makeCompositeKey(groupId, fullname);
    sortedPhotos.set(key, data);
  }
</script>
