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
 * Serialize a photos Map to JSON string.
 * Only includes entries with at least one non-zero count.
 * Iterates in group/generation/member order for deterministic output.
 * @param {Map<string, number[]>} photos
 * @param {Array} groups
 * @returns {string}
 */
export function serializePhotos(photos, groups) {
  const obj = {};
  for (const group of groups) {
    for (const gen of group.generations) {
      for (const member of gen.members) {
        const key = makeCompositeKey(group.id, member.fullname);
        if (photos.has(key)) {
          const counts = photos.get(key);
          if (!counts.every((v) => v === 0)) {
            obj[key] = counts;
          }
        }
      }
    }
  }
  return JSON.stringify(obj);
}

/**
 * Deserialize a JSON string to a photos Map.
 * Handles legacy format (plain fullname keys) by auto-migrating.
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

    const data = isLegacyFormat(parsed) ? migrateToCompositeKeys(parsed) : parsed;

    const photos = new Map();
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
    return photos;
  } catch {
    return buildEmptyPhotos(groups);
  }
}
