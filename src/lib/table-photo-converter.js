/**
 * Convert between table photoData format and SvelteMap sortedPhotos format.
 * Pure logic module -- no Svelte dependencies.
 */

import { makeCompositeKey } from './groups.js';

/**
 * Convert nested photoData to flat Map with composite keys.
 * Format: { groupId: { memberName: [counts] } } -> Map<"groupId:memberName", [counts]>
 * @param {object} photoData - Nested photo data from table
 * @param {Array} groups - Group definitions from structured_groups
 * @returns {Map<string, number[]>}
 */
export function photoDataToMap(photoData, groups) {
  const map = new Map();

  for (const group of groups) {
    const groupData = photoData[group.id] || {};

    for (const gen of group.generations) {
      for (const member of gen.members) {
        const key = makeCompositeKey(group.id, member.fullname);
        const counts = groupData[member.fullname] || [0, 0, 0, 0];
        map.set(key, counts);
      }
    }
  }

  return map;
}

/**
 * Convert flat Map with composite keys to nested photoData.
 * Format: Map<"groupId:memberName", [counts]> -> { groupId: { memberName: [counts] } }
 * Only includes non-zero counts.
 * @param {Map<string, number[]>} map - Flat map with composite keys
 * @param {Array} groups - Group definitions from structured_groups
 * @returns {object}
 */
export function mapToPhotoData(map, groups) {
  const photoData = {};

  for (const group of groups) {
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
