/**
 * Table state management using Svelte writable store.
 * Provides reactive state that can be accessed from any component.
 */

import { writable, derived, get } from 'svelte/store';
import {
  loadTablesFromLocalStorage,
  saveTablesToLocalStorage,
  createNewTable as createNewTableLogic,
  canCreateNewTable,
  setActiveTable as setActiveTableLogic,
  renameTable as renameTableLogic,
  deleteTable as deleteTableLogic,
  duplicateTable as duplicateTableLogic,
  migrateFromLegacyStorage,
  getActiveTable,
  MAX_TABLES
} from './table-manager.js';
import { i18n } from './i18n/store.svelte.js';

/**
 * Load and initialize tables from localStorage.
 */
function loadAndInitializeTables() {
  if (typeof localStorage === 'undefined') {
    const now = new Date().toISOString();
    const emptyTable = {
      id: 'default',
      name: i18n.translations.alerts?.defaultTableName || 'デフォルト',
      createdAt: now,
      lastModified: now,
      photoData: {},
      groupSettings: {}
    };
    return {
      version: 1,
      tables: [emptyTable],
      activeTableId: 'default',
      maxTables: MAX_TABLES
    };
  }

  const existing = loadTablesFromLocalStorage();
  if (existing) {
    return existing;
  }

  const migrated = migrateFromLegacyStorage();
  saveTablesToLocalStorage(migrated);
  return migrated;
}

// Create writable store for table state
export const tablesStore = writable(loadAndInitializeTables());

// Auto-save to localStorage whenever store changes
tablesStore.subscribe((state) => {
  if (typeof localStorage !== 'undefined') {
    saveTablesToLocalStorage(state);
  }
});

// Derived store for active table
export const activeTableStore = derived(tablesStore, ($tables) => getActiveTable($tables));

/**
 * Get the current tables state (synchronous).
 */
export function getTablesState() {
  return get(tablesStore);
}

/**
 * Get the active table object (synchronous).
 */
export function getActiveTableData() {
  return get(activeTableStore);
}

/**
 * Check if a new table can be created.
 */
export function canCreate() {
  return canCreateNewTable(get(tablesStore));
}

/**
 * Create a new table and switch to it.
 */
export function createTable(name, groupIds = []) {
  tablesStore.update((state) => {
    if (!canCreateNewTable(state)) {
      throw new Error('Maximum table limit reached');
    }

    const newTable = createNewTableLogic(name, groupIds);
    return {
      ...state,
      tables: [...state.tables, newTable],
      activeTableId: newTable.id
    };
  });
}

/**
 * Switch to a different table.
 */
export function switchTable(tableId) {
  tablesStore.update((state) => setActiveTableLogic(state, tableId));
}

/**
 * Delete the current active table.
 */
export function deleteCurrentTable() {
  tablesStore.update((state) => {
    const activeId = state.activeTableId;
    return deleteTableLogic(state, activeId);
  });
}

/**
 * Delete a specific table by ID.
 */
export function deleteTableById(tableId) {
  tablesStore.update((state) => deleteTableLogic(state, tableId));
}

/**
 * Rename the current active table.
 */
export function renameCurrentTable(newName) {
  tablesStore.update((state) => {
    const activeId = state.activeTableId;
    return renameTableLogic(state, activeId, newName);
  });
}

/**
 * Rename a specific table by ID.
 */
export function renameTableById(tableId, newName) {
  tablesStore.update((state) => renameTableLogic(state, tableId, newName));
}

/**
 * Duplicate the current active table.
 */
export function duplicateCurrentTable() {
  tablesStore.update((state) => {
    const activeId = state.activeTableId;
    return duplicateTableLogic(state, activeId);
  });
}

/**
 * Duplicate a specific table by ID.
 */
export function duplicateTableById(tableId) {
  tablesStore.update((state) => duplicateTableLogic(state, tableId));
}

/**
 * Update photo data for the active table.
 */
export function updateActiveTablePhotoData(newPhotoData) {
  tablesStore.update((state) => {
    const activeTable = getActiveTable(state);
    if (!activeTable) {
      return state;
    }

    return {
      ...state,
      tables: state.tables.map((table) =>
        table.id === activeTable.id
          ? {
              ...table,
              photoData: newPhotoData,
              lastModified: new Date().toISOString()
            }
          : table
      )
    };
  });
}

/**
 * Update group settings for the active table.
 */
export function updateActiveTableGroupSettings(newGroupSettings) {
  tablesStore.update((state) => {
    const activeTable = getActiveTable(state);
    if (!activeTable) {
      return state;
    }

    return {
      ...state,
      tables: state.tables.map((table) =>
        table.id === activeTable.id
          ? {
              ...table,
              groupSettings: newGroupSettings,
              lastModified: new Date().toISOString()
            }
          : table
      )
    };
  });
}
