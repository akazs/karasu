/**
 * CSV export utilities for photo count data.
 * Pure logic module -- no Svelte dependencies.
 */

import { makeCompositeKey } from './groups.js';

/**
 * Escape a CSV field to prevent formula injection and handle special characters.
 * Wraps field in quotes if it contains special characters or starts with dangerous characters.
 * @param {string|number} field - The field value to escape
 * @returns {string} Escaped CSV field
 */
export function escapeCSVField(field) {
  const str = String(field);

  // Check if field needs escaping
  const needsEscaping =
    str.includes(',') || str.includes('"') || str.includes('\n') || /^[=+\-@\t\r]/.test(str);

  if (needsEscaping) {
    const escaped = str.replace(/"/g, '""');
    // Prefix with tab to prevent formula injection in spreadsheets (OWASP recommendation)
    if (/^[=+\-@\t\r]/.test(str)) {
      return '"\t' + escaped + '"';
    }
    return '"' + escaped + '"';
  }

  return str;
}

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
  const escapedCuts = cuts.map(escapeCSVField);
  const header = escapeCSVField(memberHeader) + ',' + escapedCuts.join(',');
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
        lines.push(escapeCSVField(member.fullname) + ',' + counts.join(','));
      }
    }
  }

  return lines.join('\n') + '\n';
}
