<script module>
  import {
    loadTablesFromLocalStorage,
    saveTablesToLocalStorage,
    createNewTable,
    canCreateNewTable,
    setActiveTable,
    renameTable,
    deleteTable,
    duplicateTable,
    migrateFromLegacyStorage,
    getActiveTable,
    MAX_TABLES
  } from './table-manager.js';

  /**
   * Load and initialize tables from localStorage.
   * If karasu-tables exists, load it.
   * Otherwise, migrate from legacy storage format.
   * @returns {object} Tables state object
   */
  function loadAndInitializeTables() {
    if (typeof localStorage === 'undefined') {
      // Server-side rendering fallback
      const now = new Date().toISOString();
      const emptyTable = {
        id: 'default',
        name: '既存データ',
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

    // No tables storage found - migrate from legacy
    const migrated = migrateFromLegacyStorage();
    saveTablesToLocalStorage(migrated);
    return migrated;
  }

  /**
   * Reactive table state with auto-save.
   * Internal state - not exported directly to avoid reassignment issues.
   */
  let tableState = $state(loadAndInitializeTables());

  /**
   * Auto-save to localStorage whenever tableState changes.
   */
  $effect(() => {
    saveTablesToLocalStorage(tableState);
  });

  /**
   * Get the current tables state (read-only access).
   * @returns {object} Tables state object
   */
  export function getTablesState() {
    return tableState;
  }

  /**
   * Create a new table and switch to it.
   * @param {string} name - Table name
   * @param {string[]} groupIds - Array of group IDs to enable
   * @throws {Error} If at MAX_TABLES limit
   */
  export function createTable(name, groupIds = []) {
    if (!canCreateNewTable(tableState)) {
      throw new Error('Maximum table limit reached');
    }

    const newTable = createNewTable(name, groupIds);
    tableState = {
      ...tableState,
      tables: [...tableState.tables, newTable],
      activeTableId: newTable.id
    };
  }

  /**
   * Switch to a different table.
   * @param {string} tableId - Table ID to switch to
   */
  export function switchTable(tableId) {
    tableState = setActiveTable(tableState, tableId);
  }

  /**
   * Delete the current active table.
   * @throws {Error} If attempting to delete the last table
   */
  export function deleteCurrentTable() {
    const activeId = tableState.activeTableId;
    tableState = deleteTable(tableState, activeId);
  }

  /**
   * Delete a specific table by ID.
   * @param {string} tableId - Table ID to delete
   * @throws {Error} If attempting to delete the last table
   */
  export function deleteTableById(tableId) {
    tableState = deleteTable(tableState, tableId);
  }

  /**
   * Rename the current active table.
   * @param {string} newName - New table name
   */
  export function renameCurrentTable(newName) {
    const activeId = tableState.activeTableId;
    tableState = renameTable(tableState, activeId, newName);
  }

  /**
   * Rename a specific table by ID.
   * @param {string} tableId - Table ID to rename
   * @param {string} newName - New table name
   */
  export function renameTableById(tableId, newName) {
    tableState = renameTable(tableState, tableId, newName);
  }

  /**
   * Duplicate the current active table.
   * @throws {Error} If at MAX_TABLES limit
   */
  export function duplicateCurrentTable() {
    const activeId = tableState.activeTableId;
    tableState = duplicateTable(tableState, activeId);
  }

  /**
   * Duplicate a specific table by ID.
   * @param {string} tableId - Table ID to duplicate
   * @throws {Error} If at MAX_TABLES limit
   */
  export function duplicateTableById(tableId) {
    tableState = duplicateTable(tableState, tableId);
  }

  /**
   * Get the active table object.
   * @returns {object|undefined}
   */
  export function getActiveTableData() {
    return getActiveTable(tableState);
  }

  /**
   * Check if a new table can be created.
   * @returns {boolean}
   */
  export function canCreate() {
    return canCreateNewTable(tableState);
  }

  /**
   * Update photo data for the active table.
   * @param {object} newPhotoData - New photo data object
   */
  export function updateActiveTablePhotoData(newPhotoData) {
    const activeTable = getActiveTable(tableState);
    if (!activeTable) {
      return;
    }

    tableState = {
      ...tableState,
      tables: tableState.tables.map(table =>
        table.id === activeTable.id
          ? {
              ...table,
              photoData: newPhotoData,
              lastModified: new Date().toISOString()
            }
          : table
      )
    };
  }

  /**
   * Update group settings for the active table.
   * @param {object} newGroupSettings - New group settings object
   */
  export function updateActiveTableGroupSettings(newGroupSettings) {
    const activeTable = getActiveTable(tableState);
    if (!activeTable) {
      return;
    }

    tableState = {
      ...tableState,
      tables: tableState.tables.map(table =>
        table.id === activeTable.id
          ? {
              ...table,
              groupSettings: newGroupSettings,
              lastModified: new Date().toISOString()
            }
          : table
      )
    };
  }
</script>
