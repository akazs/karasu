/**
 * Integration tests for multi-table workflow
 * Tests the complete user journey with table management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  loadTablesFromLocalStorage,
  saveTablesToLocalStorage,
  createNewTable,
  setActiveTable,
  renameTable,
  deleteTable,
  duplicateTable,
  migrateFromLegacyStorage,
  getActiveTable,
  canCreateNewTable,
  MAX_TABLES
} from '../table-manager.js';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

global.localStorage = localStorageMock;

describe('Multi-Table Workflow Integration Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Complete User Journey', () => {
    it('should handle full workflow: create → add data → switch → verify independence', () => {
      // 1. Start with migrated data
      localStorage.setItem('sortedPhotos20250716', JSON.stringify({
        sakurazaka: { '井上 梨名': [1, 2, 0, 0] }
      }));

      let state = migrateFromLegacyStorage();
      expect(state.tables).toHaveLength(1);
      expect(state.tables[0].name).toBe('デフォルト');
      expect(state.tables[0].photoData.sakurazaka['井上 梨名']).toEqual([1, 2, 0, 0]);

      // 2. Create second table
      const table2 = createNewTable('Wishlist', ['sakurazaka']);
      state = {
        ...state,
        tables: [...state.tables, table2],
        activeTableId: table2.id
      };
      expect(state.tables).toHaveLength(2);

      // 3. Add data to second table
      state = {
        ...state,
        tables: state.tables.map(t =>
          t.id === table2.id
            ? {
                ...t,
                photoData: {
                  sakurazaka: { '遠藤 光莉': [0, 0, 1, 0] }
                }
              }
            : t
        )
      };

      // 4. Switch back to first table
      state = setActiveTable(state, state.tables[0].id);
      const activeTable = getActiveTable(state);

      // 5. Verify data independence
      expect(activeTable.photoData.sakurazaka['井上 梨名']).toEqual([1, 2, 0, 0]);
      expect(activeTable.photoData.sakurazaka['遠藤 光莉']).toBeUndefined();

      // 6. Switch to second table
      state = setActiveTable(state, table2.id);
      const activeTable2 = getActiveTable(state);
      expect(activeTable2.photoData.sakurazaka['遠藤 光莉']).toEqual([0, 0, 1, 0]);
      expect(activeTable2.photoData.sakurazaka['井上 梨名']).toBeUndefined();
    });

    it('should handle rename → duplicate → delete workflow', () => {
      // 1. Create initial table
      const table1 = createNewTable('Original', ['sakurazaka']);
      let state = {
        version: 1,
        tables: [table1],
        activeTableId: table1.id,
        maxTables: MAX_TABLES
      };

      // 2. Rename table
      state = renameTable(state, table1.id, 'Renamed Table');
      expect(state.tables[0].name).toBe('Renamed Table');

      // 3. Duplicate table
      state = duplicateTable(state, table1.id);
      expect(state.tables).toHaveLength(2);
      expect(state.tables[1].name).toBe('Renamed Table (Copy)');
      expect(state.activeTableId).toBe(state.tables[1].id);

      // 4. Delete duplicate
      const duplicateId = state.tables[1].id;
      state = deleteTable(state, duplicateId);
      expect(state.tables).toHaveLength(1);
      expect(state.tables.find(t => t.id === duplicateId)).toBeUndefined();
    });

    it('should handle group settings independence across tables', () => {
      // 1. Create two tables
      const table1 = createNewTable('Table 1', ['sakurazaka', 'hinatazaka']);
      const table2 = createNewTable('Table 2', ['sakurazaka', 'hinatazaka']);

      let state = {
        version: 1,
        tables: [table1, table2],
        activeTableId: table1.id,
        maxTables: MAX_TABLES
      };

      // 2. Update group settings for table 1
      state = {
        ...state,
        tables: state.tables.map(t =>
          t.id === table1.id
            ? {
                ...t,
                groupSettings: {
                  sakurazaka: { enabled: true, generations: { '二期生': true } },
                  hinatazaka: { enabled: false, generations: {} }
                }
              }
            : t
        )
      };

      // 3. Update group settings for table 2 (different settings)
      state = {
        ...state,
        tables: state.tables.map(t =>
          t.id === table2.id
            ? {
                ...t,
                groupSettings: {
                  sakurazaka: { enabled: false, generations: {} },
                  hinatazaka: { enabled: true, generations: { '二期生': true } }
                }
              }
            : t
        )
      };

      // 4. Verify independence
      const t1 = state.tables.find(t => t.id === table1.id);
      const t2 = state.tables.find(t => t.id === table2.id);

      expect(t1.groupSettings.sakurazaka.enabled).toBe(true);
      expect(t1.groupSettings.hinatazaka.enabled).toBe(false);

      expect(t2.groupSettings.sakurazaka.enabled).toBe(false);
      expect(t2.groupSettings.hinatazaka.enabled).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle corrupted table data gracefully', () => {
      // Set corrupted data
      localStorage.setItem('karasu-tables', 'invalid json');

      const loaded = loadTablesFromLocalStorage();
      expect(loaded).toBeNull();

      // Should fall back to migration
      const migrated = migrateFromLegacyStorage();
      expect(migrated.tables).toHaveLength(1);
    });

    it('should handle missing photoData fields', () => {
      const table = createNewTable('Test', ['sakurazaka']);
      expect(table.photoData).toEqual({ sakurazaka: {} });
      expect(table.groupSettings).toEqual({
        sakurazaka: { enabled: true, generations: {} }
      });
    });

    it('should handle rapid table switching', () => {
      const table1 = createNewTable('Table 1', ['sakurazaka']);
      const table2 = createNewTable('Table 2', ['sakurazaka']);
      const table3 = createNewTable('Table 3', ['sakurazaka']);

      let state = {
        version: 1,
        tables: [table1, table2, table3],
        activeTableId: table1.id,
        maxTables: MAX_TABLES
      };

      // Rapid switching
      state = setActiveTable(state, table2.id);
      expect(state.activeTableId).toBe(table2.id);

      state = setActiveTable(state, table3.id);
      expect(state.activeTableId).toBe(table3.id);

      state = setActiveTable(state, table1.id);
      expect(state.activeTableId).toBe(table1.id);

      // Verify no data loss
      expect(state.tables).toHaveLength(3);
    });

    it('should prevent creating more than MAX_TABLES', () => {
      const tables = Array(MAX_TABLES)
        .fill(null)
        .map((_, i) => createNewTable(`Table ${i}`, ['sakurazaka']));

      let state = {
        version: 1,
        tables,
        activeTableId: tables[0].id,
        maxTables: MAX_TABLES
      };

      expect(canCreateNewTable(state)).toBe(false);

      // Trying to duplicate should fail
      expect(() => duplicateTable(state, tables[0].id)).toThrow('Maximum table limit reached');
    });

    it('should handle empty table names gracefully', () => {
      const table = createNewTable('', ['sakurazaka']);
      expect(table.name).toBe('');

      // Renaming to non-empty
      let state = {
        version: 1,
        tables: [table],
        activeTableId: table.id,
        maxTables: MAX_TABLES
      };

      state = renameTable(state, table.id, 'Valid Name');
      expect(state.tables[0].name).toBe('Valid Name');
    });

    it('should preserve table order when deleting middle table', () => {
      const table1 = createNewTable('Table 1', ['sakurazaka']);
      const table2 = createNewTable('Table 2', ['sakurazaka']);
      const table3 = createNewTable('Table 3', ['sakurazaka']);

      let state = {
        version: 1,
        tables: [table1, table2, table3],
        activeTableId: table2.id,
        maxTables: MAX_TABLES
      };

      // Delete middle table
      state = deleteTable(state, table2.id);

      expect(state.tables).toHaveLength(2);
      expect(state.tables[0].id).toBe(table1.id);
      expect(state.tables[1].id).toBe(table3.id);
      expect(state.activeTableId).toBe(table1.id); // Switched to first
    });
  });

  describe('Persistence', () => {
    it('should persist data across save/load cycles', () => {
      // Create and save state
      const table1 = createNewTable('Table 1', ['sakurazaka']);
      const table2 = createNewTable('Table 2', ['hinatazaka']);

      const originalState = {
        version: 1,
        tables: [table1, table2],
        activeTableId: table1.id,
        maxTables: MAX_TABLES
      };

      saveTablesToLocalStorage(originalState);

      // Load state
      const loadedState = loadTablesFromLocalStorage();

      expect(loadedState).toEqual(originalState);
      expect(loadedState.tables).toHaveLength(2);
      expect(loadedState.activeTableId).toBe(table1.id);
    });

    it('should preserve lastModified timestamp on updates', () => {
      const table = createNewTable('Test', ['sakurazaka']);
      const originalModified = table.lastModified;

      let state = {
        version: 1,
        tables: [table],
        activeTableId: table.id,
        maxTables: MAX_TABLES
      };

      // Wait a bit to ensure timestamp difference
      const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      return delay(10).then(() => {
        state = renameTable(state, table.id, 'Renamed');
        expect(state.tables[0].lastModified).not.toBe(originalModified);
      });
    });
  });

  describe('Migration Scenarios', () => {
    it('should migrate nested format correctly', () => {
      localStorage.setItem('sortedPhotos20250716', JSON.stringify({
        sakurazaka: {
          '井上 梨名': [1, 2, 0, 0],
          '遠藤 光莉': [0, 0, 3, 0]
        },
        hinatazaka: {
          '金村 美玖': [1, 1, 1, 1]
        }
      }));

      const migrated = migrateFromLegacyStorage();

      expect(migrated.tables[0].photoData).toEqual({
        sakurazaka: {
          '井上 梨名': [1, 2, 0, 0],
          '遠藤 光莉': [0, 0, 3, 0]
        },
        hinatazaka: {
          '金村 美玖': [1, 1, 1, 1]
        }
      });
    });

    it('should migrate with group settings', () => {
      localStorage.setItem('sortedPhotos20250716', JSON.stringify({
        sakurazaka: { '井上 梨名': [1, 0, 0, 0] }
      }));
      localStorage.setItem('karasu-group-state', JSON.stringify({
        sakurazaka: {
          enabled: true,
          generations: { '二期生': true, '三期生': false }
        }
      }));

      const migrated = migrateFromLegacyStorage();

      expect(migrated.tables[0].groupSettings).toEqual({
        sakurazaka: {
          enabled: true,
          generations: { '二期生': true, '三期生': false }
        }
      });
    });

    it('should create empty table when no legacy data exists', () => {
      const migrated = migrateFromLegacyStorage();

      expect(migrated.tables).toHaveLength(1);
      expect(migrated.tables[0].name).toBe('デフォルト');
      expect(migrated.tables[0].photoData).toEqual({});
      expect(migrated.tables[0].groupSettings).toEqual({});
    });
  });

  describe('Boundary Conditions', () => {
    it('should handle table with maximum data size', () => {
      // Create table with lots of data
      const largePhotoData = {
        sakurazaka: {},
        hinatazaka: {}
      };

      // Add 100 members with data
      for (let i = 0; i < 50; i++) {
        largePhotoData.sakurazaka[`Member ${i}`] = [99, 99, 99, 99];
        largePhotoData.hinatazaka[`Member ${i}`] = [99, 99, 99, 99];
      }

      const table = createNewTable('Large Table', ['sakurazaka', 'hinatazaka']);
      const state = {
        version: 1,
        tables: [{
          ...table,
          photoData: largePhotoData
        }],
        activeTableId: table.id,
        maxTables: MAX_TABLES
      };

      saveTablesToLocalStorage(state);
      const loaded = loadTablesFromLocalStorage();

      expect(loaded.tables[0].photoData).toEqual(largePhotoData);
    });

    it('should handle duplicate names correctly', () => {
      const table1 = createNewTable('Same Name', ['sakurazaka']);
      const table2 = createNewTable('Same Name', ['sakurazaka']);

      let state = {
        version: 1,
        tables: [table1, table2],
        activeTableId: table1.id,
        maxTables: MAX_TABLES
      };

      // Both should keep same name (UUIDs ensure uniqueness)
      expect(state.tables[0].name).toBe('Same Name');
      expect(state.tables[1].name).toBe('Same Name');
      expect(state.tables[0].id).not.toBe(state.tables[1].id);
    });
  });
});
