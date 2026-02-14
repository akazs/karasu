/**
 * Table management logic for multi-table feature.
 * Pure logic module -- no Svelte dependencies.
 * All functions return new objects (immutable updates).
 */

import { i18n } from './i18n/store.svelte.js';

const TABLES_STORAGE_KEY = 'karasu-tables';
const LEGACY_PHOTOS_KEY = 'sortedPhotos20250716';
const LEGACY_GROUP_STATE_KEY = 'karasu-group-state';

export const MAX_TABLES = 10;
export const MAX_TABLE_NAME_LENGTH = 30;

/**
 * Get the default table name in the current locale.
 * @returns {string}
 */
function getDefaultTableName() {
  const translations = i18n.translations;
  return translations.alerts?.defaultTableName || 'デフォルト';
}

/**
 * Generate a unique table ID using crypto.randomUUID()
 * @returns {string}
 */
export function generateTableId() {
  return crypto.randomUUID();
}

/**
 * Create a new table with empty data structure.
 * @param {string} name - Table name
 * @param {string[]} groupIds - Array of group IDs to enable (e.g., ['sakurazaka', 'hinatazaka'])
 * @returns {object} New table object
 * @throws {Error} If name exceeds MAX_TABLE_NAME_LENGTH
 */
export function createNewTable(name, groupIds = []) {
  if (name.length > MAX_TABLE_NAME_LENGTH) {
    throw new Error(`Table name must not exceed ${MAX_TABLE_NAME_LENGTH} characters`);
  }

  const now = new Date().toISOString();
  const photoData = {};
  const groupSettings = {};

  for (const groupId of groupIds) {
    photoData[groupId] = {};
    groupSettings[groupId] = {
      enabled: true,
      generations: {}
    };
  }

  return {
    id: generateTableId(),
    name,
    createdAt: now,
    lastModified: now,
    photoData,
    groupSettings
  };
}

/**
 * Check if a new table can be created (under MAX_TABLES limit).
 * @param {object} tables - Tables state object
 * @returns {boolean}
 */
export function canCreateNewTable(tables) {
  return tables.tables.length < MAX_TABLES;
}

/**
 * Get a table by its ID.
 * @param {object} tables - Tables state object
 * @param {string} id - Table ID
 * @returns {object|undefined}
 */
export function getTableById(tables, id) {
  return tables.tables.find((t) => t.id === id);
}

/**
 * Get the currently active table.
 * @param {object} tables - Tables state object
 * @returns {object|undefined}
 */
export function getActiveTable(tables) {
  return getTableById(tables, tables.activeTableId);
}

/**
 * Set the active table ID (immutable).
 * @param {object} tables - Tables state object
 * @param {string} id - Table ID to activate
 * @returns {object} New tables state
 */
export function setActiveTable(tables, id) {
  return {
    ...tables,
    activeTableId: id
  };
}

/**
 * Rename a table (immutable).
 * @param {object} tables - Tables state object
 * @param {string} id - Table ID to rename
 * @param {string} newName - New table name
 * @returns {object} New tables state
 * @throws {Error} If newName exceeds MAX_TABLE_NAME_LENGTH
 */
export function renameTable(tables, id, newName) {
  if (newName.length > MAX_TABLE_NAME_LENGTH) {
    throw new Error(`Table name must not exceed ${MAX_TABLE_NAME_LENGTH} characters`);
  }

  const tableIndex = tables.tables.findIndex((t) => t.id === id);
  if (tableIndex === -1) {
    return tables;
  }

  return {
    ...tables,
    tables: tables.tables.map((table, index) =>
      index === tableIndex
        ? {
            ...table,
            name: newName,
            lastModified: new Date().toISOString()
          }
        : table
    )
  };
}

/**
 * Delete a table (immutable).
 * Prevents deleting the last table.
 * If deleting the active table, switches to the first remaining table.
 * @param {object} tables - Tables state object
 * @param {string} id - Table ID to delete
 * @returns {object} New tables state
 * @throws {Error} If attempting to delete the last table
 */
export function deleteTable(tables, id) {
  const tableIndex = tables.tables.findIndex((t) => t.id === id);
  if (tableIndex === -1) {
    return tables;
  }

  if (tables.tables.length === 1) {
    throw new Error('Cannot delete the last table');
  }

  const newTables = tables.tables.filter((t) => t.id !== id);
  const newActiveId = tables.activeTableId === id ? newTables[0].id : tables.activeTableId;

  return {
    ...tables,
    tables: newTables,
    activeTableId: newActiveId
  };
}

/**
 * Duplicate a table (immutable).
 * Keeps the same name as the original (users can rename afterward).
 * Sets the duplicated table as active.
 * @param {object} tables - Tables state object
 * @param {string} id - Table ID to duplicate
 * @returns {object} New tables state
 * @throws {Error} If at MAX_TABLES limit
 */
export function duplicateTable(tables, id) {
  if (!canCreateNewTable(tables)) {
    throw new Error('Maximum table limit reached');
  }

  const tableIndex = tables.tables.findIndex((t) => t.id === id);
  if (tableIndex === -1) {
    return tables;
  }

  const original = tables.tables[tableIndex];
  const now = new Date().toISOString();

  const duplicate = {
    id: generateTableId(),
    name: original.name,
    createdAt: now,
    lastModified: now,
    photoData: JSON.parse(JSON.stringify(original.photoData)),
    groupSettings: JSON.parse(JSON.stringify(original.groupSettings))
  };

  return {
    ...tables,
    tables: [...tables.tables, duplicate],
    activeTableId: duplicate.id
  };
}

/**
 * Save tables to localStorage.
 * @param {object} tables - Tables state object
 */
export function saveTablesToLocalStorage(tables) {
  if (typeof localStorage === 'undefined') {
    return;
  }
  localStorage.setItem(TABLES_STORAGE_KEY, JSON.stringify(tables));
}

/**
 * Create initial default table with proper group settings.
 * All groups and generations are enabled by default.
 * @returns {object} Initial tables state
 */
export function createInitialState() {
  const now = new Date().toISOString();

  // Create default group settings with all groups and generations enabled
  const groupSettings = {
    sakurazaka: {
      enabled: true,
      generations: {
        二期生: true,
        三期生: true,
        四期生: true
      }
    },
    hinatazaka: {
      enabled: true,
      generations: {
        一期生: true,
        二期生: true,
        三期生: true,
        四期生: true,
        五期生: true
      }
    }
  };

  const firstTable = {
    id: generateTableId(),
    name: getDefaultTableName(),
    createdAt: now,
    lastModified: now,
    photoData: {},
    groupSettings
  };

  return {
    version: 1,
    tables: [firstTable],
    activeTableId: firstTable.id,
    maxTables: MAX_TABLES
  };
}

/**
 * Clear all data from localStorage except language setting.
 * Removes tables, legacy photos, and legacy group state.
 * Sets a flag to indicate data was cleared, so migration creates initial state.
 */
export function clearAllData() {
  if (typeof localStorage === 'undefined') {
    return;
  }

  // Save language setting before clearing
  const locale = localStorage.getItem('karasu-locale');

  // Clear all karasu-related data
  localStorage.removeItem(TABLES_STORAGE_KEY);
  localStorage.removeItem(LEGACY_PHOTOS_KEY);
  localStorage.removeItem(LEGACY_GROUP_STATE_KEY);

  // Restore language setting
  if (locale) {
    localStorage.setItem('karasu-locale', locale);
  }
}

/**
 * Load tables from localStorage.
 * @returns {object|null} Tables state object or null if not found
 */
export function loadTablesFromLocalStorage() {
  if (typeof localStorage === 'undefined') {
    return null;
  }

  try {
    const stored = localStorage.getItem(TABLES_STORAGE_KEY);
    if (!stored) {
      return null;
    }
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load tables from localStorage:', error);
    return null;
  }
}

/**
 * Migrate from legacy localStorage format to tables format.
 * If legacy data exists, creates a table with that data.
 * If no legacy data exists, returns initial state with proper defaults.
 * @returns {object} Tables state object
 */
export function migrateFromLegacyStorage() {
  let photoData = {};
  let groupSettings = {};
  let hasLegacyData = false;

  if (typeof localStorage !== 'undefined') {
    // Load legacy photo data
    try {
      const legacyPhotos = localStorage.getItem(LEGACY_PHOTOS_KEY);
      if (legacyPhotos) {
        photoData = JSON.parse(legacyPhotos);
        hasLegacyData = true;
      }
    } catch (error) {
      console.error('Failed to load legacy photo data:', error);
    }

    // Load legacy group state
    try {
      const legacyGroupState = localStorage.getItem(LEGACY_GROUP_STATE_KEY);
      if (legacyGroupState) {
        groupSettings = JSON.parse(legacyGroupState);
        hasLegacyData = true;
      }
    } catch (error) {
      console.error('Failed to load legacy group state:', error);
    }
  }

  // If no legacy data exists, return initial state with proper defaults
  if (!hasLegacyData) {
    return createInitialState();
  }

  // Create table with legacy data
  const now = new Date().toISOString();
  const firstTable = {
    id: generateTableId(),
    name: getDefaultTableName(),
    createdAt: now,
    lastModified: now,
    photoData,
    groupSettings
  };

  return {
    version: 1,
    tables: [firstTable],
    activeTableId: firstTable.id,
    maxTables: MAX_TABLES
  };
}
