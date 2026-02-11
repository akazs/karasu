/**
 * Serialization and deserialization for photo count data.
 * Pure logic module -- no Svelte dependencies.
 * Uses plain Map (not SvelteMap) for testability.
 */

import { makeCompositeKey } from './groups.js';
import { isLegacyFormat, migrateToCompositeKeys } from './migration.js';

export const CUTS = Object.freeze(['ヨリ', 'チュウ', 'ヒキ', '座り']);

export const STORAGE_KEY = 'sortedPhotos20250716';

/**
 * Build an empty photos Map with composite keys for all members
 * in the provided groups. Each entry is initialized to [0,0,0,0].
 * @param {Array} groups - Array of group objects with generations and members
 * @returns {Map<string, number[]>}
 */
export function buildEmptyPhotos(groups) {
  const photos = new Map();
  for (const group of groups) {
    for (const gen of group.generations) {
      for (const member of gen.members) {
        const key = makeCompositeKey(group.id, member.fullname);
        photos.set(key, [0, 0, 0, 0]);
      }
    }
  }
  return photos;
}

/**
 * Serialize a photos Map to JSON string in nested format.
 * Only includes entries with at least one non-zero count.
 * Format: { "groupId": { "memberName": [0,0,0,0], ... }, ... }
 * Iterates in group/generation/member order for deterministic output.
 * @param {Map<string, number[]>} photos
 * @param {Array} groups
 * @returns {string}
 */
export function serializePhotos(photos, groups) {
  const obj = {};
  for (const group of groups) {
    const groupData = {};
    for (const gen of group.generations) {
      for (const member of gen.members) {
        const key = makeCompositeKey(group.id, member.fullname);
        if (photos.has(key)) {
          const counts = photos.get(key);
          if (!counts.every((v) => v === 0)) {
            groupData[member.fullname] = counts;
          }
        }
      }
    }
    if (Object.keys(groupData).length > 0) {
      obj[group.id] = groupData;
    }
  }
  return JSON.stringify(obj);
}

/**
 * Check if data is in nested format: { "groupId": { "memberName": [...] } }
 * @param {object} data
 * @returns {boolean}
 */
function isNestedFormat(data) {
  const values = Object.values(data);
  return values.length > 0 && values.every((v) => typeof v === 'object' && !Array.isArray(v));
}

/**
 * Deserialize a JSON string to a photos Map.
 * Supports three formats:
 * 1. New nested: { "groupId": { "memberName": [0,0,0,0] } }
 * 2. Flat composite: { "groupId:memberName": [0,0,0,0] }
 * 3. Legacy: { "memberName": [0,0,0,0] } (auto-migrated)
 * Missing members are filled with [0,0,0,0].
 * @param {string|null} json
 * @param {Array} groups
 * @returns {Map<string, number[]>}
 */
export function deserializePhotos(json, groups) {
  try {
    const parsed = JSON.parse(json);
    if (parsed === null || typeof parsed !== 'object') {
      return buildEmptyPhotos(groups);
    }

    const photos = new Map();

    if (isNestedFormat(parsed)) {
      // New nested format: { "groupId": { "memberName": [...] } }
      for (const group of groups) {
        const groupData = parsed[group.id] || {};
        for (const gen of group.generations) {
          for (const member of gen.members) {
            const key = makeCompositeKey(group.id, member.fullname);
            if (member.fullname in groupData) {
              photos.set(key, [...groupData[member.fullname]]);
            } else {
              photos.set(key, [0, 0, 0, 0]);
            }
          }
        }
      }
    } else {
      // Flat format (with or without composite keys)
      const data = isLegacyFormat(parsed) ? migrateToCompositeKeys(parsed) : parsed;
      for (const group of groups) {
        for (const gen of group.generations) {
          for (const member of gen.members) {
            const key = makeCompositeKey(group.id, member.fullname);
            if (key in data) {
              photos.set(key, [...data[key]]);
            } else {
              photos.set(key, [0, 0, 0, 0]);
            }
          }
        }
      }
    }
    return photos;
  } catch {
    return buildEmptyPhotos(groups);
  }
}
