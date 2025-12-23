<script module>
  import { SvelteMap } from 'svelte/reactivity';
  import { structured_members, sortedPhotosKey } from './configs.svelte';

  function newSortedPhotos() {
    let sortedPhotos = new SvelteMap();
    structured_members.forEach((gen) => {
      gen.members.forEach((member) => {
        let data = $state([0, 0, 0, 0]);
        sortedPhotos.set(member.fullname, data);
      });
    });
    return sortedPhotos;
  }

  function sortedPhotosToJSON(sortedPhotos) {
    let obj = {};
    structured_members.forEach((gen) => {
      gen.members.forEach((member) => {
        if (sortedPhotos.has(member.fullname)) {
          const counts = sortedPhotos.get(member.fullname);
          if (!counts.every((v) => v == 0)) {
            obj[member.fullname] = counts;
          }
        }
      });
    });
    return JSON.stringify(obj);
  }

  function JSONToSortedPhotos(json) {
    let sortedPhotos = new SvelteMap();
    try {
      const obj = JSON.parse(json);
      if (obj === null) {
        return newSortedPhotos();
      }
      structured_members.forEach((gen) => {
        gen.members.forEach((member) => {
          if (member.fullname in obj) {
            let data = $state(obj[member.fullname]);
            sortedPhotos.set(member.fullname, data);
          } else {
            let data = $state([0, 0, 0, 0]);
            sortedPhotos.set(member.fullname, data);
          }
        });
      });
      return sortedPhotos;
    } catch (err) {
      console.log('Error restoring data from localStorage:', err);
      return newSortedPhotos();
    }
  }

  export function saveSortedPhotosToLocalStorage(sortedPhotos) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(sortedPhotosKey, sortedPhotosToJSON(sortedPhotos));
    }
  }

  export function loadSortedPhotosFromLocalStorageOrNew() {
    let sortedPhotos;
    if (typeof localStorage !== 'undefined') {
      const localStorageItem = localStorage.getItem(sortedPhotosKey);
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
    sortedPhotos.forEach((_, member) => {
      let data = $state([0, 0, 0, 0]);
      sortedPhotos.set(member, data);
    });
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(sortedPhotosKey);
    }
  }
</script>
