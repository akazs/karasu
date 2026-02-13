/**
 * CSV export utilities for photo count data.
 * Pure logic module -- no Svelte dependencies.
 */

import { makeCompositeKey } from './groups.js';

/**
 * Convert photo data to CSV string.
 * Respects group.enabled and generation.enabled flags.
 * Format: メンバー,ヨリ,チュウ,ヒキ,座り (or translated equivalents)
 * @param {Map<string, number[]>} photos
 * @param {Array} groups - Group config array with enabled flags
 * @param {string[]} cuts - Cut type labels
 * @param {string} memberHeader - Translated "member" header (default: 'メンバー')
 * @returns {string}
 */
export function photosToCSV(photos, groups, cuts, memberHeader = 'メンバー') {
  const header = memberHeader + ',' + cuts.join(',');
  const lines = [header];

  for (const group of groups) {
    if (!group.enabled) {
      continue;
    }
    for (const gen of group.generations) {
      if (!gen.enabled) {
        continue;
      }
      for (const member of gen.members) {
        const key = makeCompositeKey(group.id, member.fullname);
        const counts = photos.get(key) || [0, 0, 0, 0];
        lines.push(member.fullname + ',' + counts.join(','));
      }
    }
  }

  return lines.join('\n') + '\n';
}
