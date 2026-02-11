/**
 * Migration utilities for converting legacy localStorage format
 * (plain fullname keys) to composite keys (groupId:fullname).
 * Pure logic module -- no Svelte dependencies.
 */

export { DEFAULT_GROUP_ID } from './groups.js';
import { DEFAULT_GROUP_ID } from './groups.js';

/**
 * Check if a key is already in composite format (contains a colon).
 * @param {string} key
 * @returns {boolean}
 */
function isCompositeKey(key) {
  return typeof key === 'string' && key.includes(':');
}

/**
 * Determine if a serialized photo object uses the legacy format.
 * Legacy format uses plain fullname keys (no colon prefix).
 * Returns true if any key lacks a colon separator.
 * @param {object|null} obj
 * @returns {boolean}
 */
export function isLegacyFormat(obj) {
  if (obj === null || typeof obj !== 'object') {
    return false;
  }
  const keys = Object.keys(obj);
  if (keys.length === 0) {
    return false;
  }
  return keys.some((key) => !isCompositeKey(key));
}

/**
 * Migrate a photo data object from legacy format to composite keys.
 * Legacy keys (without colon) are prefixed with the default group id.
 * Old 'hinata:' keys are renamed to 'hinatazaka:' for consistency.
 * Already-composite keys are preserved as-is.
 * Returns a new object (no mutation).
 * @param {object|null} obj
 * @returns {object}
 */
export function migrateToCompositeKeys(obj) {
  if (obj === null || typeof obj !== 'object') {
    return {};
  }

  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    let newKey;
    if (isCompositeKey(key)) {
      // Handle hinata -> hinatazaka rename
      newKey = key.startsWith('hinata:') ? key.replace('hinata:', 'hinatazaka:') : key;
    } else {
      // Legacy format: add default group prefix
      newKey = `${DEFAULT_GROUP_ID}:${key}`;
    }
    result[newKey] = Array.isArray(value) ? [...value] : [0, 0, 0, 0];
  }
  return result;
}
