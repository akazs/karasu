import { SvelteMap } from 'svelte/reactivity';
import { structured_members } from './defaults.svelte';

export function sortedPhotosToJSON(sortedPhotos) {
  let obj = {};
  structured_members.forEach((gen) => {
    gen.members.forEach((member) => {
      if (sortedPhotos.has(member.fullname)) {
        let counts = sortedPhotos.get(member.fullname);
        obj[member.fullname] = counts;
      }
    });
  });
  return JSON.stringify(obj);
}

export function JSONToSortedPhotos(json) {
  let sortedPhotos = new SvelteMap();
  let obj = JSON.parse(json);
  if (obj === null) {
    return sortedPhotos;
  }
  structured_members.forEach((gen) => {
    gen.members
      .filter((member) => member.fullname in obj)
      .forEach((member) => {
        sortedPhotos.set(member.fullname, obj[member.fullname]);
      });
  });
  return sortedPhotos;
}
