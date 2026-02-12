/**
 * Tests for table-manager.js
 * Following TDD - write tests first, then implement
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  loadTablesFromLocalStorage,
  saveTablesToLocalStorage,
  createNewTable,
  canCreateNewTable,
  getTableById,
  getActiveTable,
  setActiveTable,
  renameTable,
  deleteTable,
  duplicateTable,
  migrateFromLegacyStorage,
  generateTableId,
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

describe('table-manager', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('generateTableId', () => {
    it('should generate a valid UUID', () => {
      const id1 = generateTableId();
      const id2 = generateTableId();

      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      expect(id1).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });
  });

  describe('createNewTable', () => {
    it('should create a new table with default structure', () => {
      const table = createNewTable('My Collection', ['sakurazaka']);

      expect(table.id).toBeTruthy();
      expect(table.name).toBe('My Collection');
      expect(table.createdAt).toBeTruthy();
      expect(table.lastModified).toBeTruthy();
      expect(table.photoData).toEqual({ sakurazaka: {} });
      expect(table.groupSettings).toEqual({
        sakurazaka: { enabled: true, generations: {} }
      });
    });

    it('should support multiple groups', () => {
      const table = createNewTable('Both Groups', ['sakurazaka', 'hinatazaka']);

      expect(table.photoData).toEqual({
        sakurazaka: {},
        hinatazaka: {}
      });
      expect(table.groupSettings).toEqual({
        sakurazaka: { enabled: true, generations: {} },
        hinatazaka: { enabled: true, generations: {} }
      });
    });

    it('should handle empty group array', () => {
      const table = createNewTable('Empty Table', []);

      expect(table.photoData).toEqual({});
      expect(table.groupSettings).toEqual({});
    });
  });

  describe('canCreateNewTable', () => {
    it('should return true when tables count is less than MAX_TABLES', () => {
      const tables = {
        version: 1,
        tables: Array(5).fill(null).map((_, i) => ({ id: `id-${i}`, name: `Table ${i}` })),
        activeTableId: 'id-0',
        maxTables: MAX_TABLES
      };

      expect(canCreateNewTable(tables)).toBe(true);
    });

    it('should return false when tables count equals MAX_TABLES', () => {
      const tables = {
        version: 1,
        tables: Array(MAX_TABLES).fill(null).map((_, i) => ({ id: `id-${i}`, name: `Table ${i}` })),
        activeTableId: 'id-0',
        maxTables: MAX_TABLES
      };

      expect(canCreateNewTable(tables)).toBe(false);
    });

    it('should return false when tables count exceeds MAX_TABLES', () => {
      const tables = {
        version: 1,
        tables: Array(MAX_TABLES + 1).fill(null).map((_, i) => ({ id: `id-${i}`, name: `Table ${i}` })),
        activeTableId: 'id-0',
        maxTables: MAX_TABLES
      };

      expect(canCreateNewTable(tables)).toBe(false);
    });
  });

  describe('getTableById', () => {
    it('should return table by id', () => {
      const tables = {
        version: 1,
        tables: [
          { id: 'uuid-1', name: 'Table 1' },
          { id: 'uuid-2', name: 'Table 2' }
        ],
        activeTableId: 'uuid-1',
        maxTables: MAX_TABLES
      };

      const table = getTableById(tables, 'uuid-2');
      expect(table).toEqual({ id: 'uuid-2', name: 'Table 2' });
    });

    it('should return undefined for non-existent id', () => {
      const tables = {
        version: 1,
        tables: [{ id: 'uuid-1', name: 'Table 1' }],
        activeTableId: 'uuid-1',
        maxTables: MAX_TABLES
      };

      expect(getTableById(tables, 'non-existent')).toBeUndefined();
    });
  });

  describe('getActiveTable', () => {
    it('should return the active table', () => {
      const tables = {
        version: 1,
        tables: [
          { id: 'uuid-1', name: 'Table 1' },
          { id: 'uuid-2', name: 'Table 2' }
        ],
        activeTableId: 'uuid-2',
        maxTables: MAX_TABLES
      };

      const active = getActiveTable(tables);
      expect(active).toEqual({ id: 'uuid-2', name: 'Table 2' });
    });

    it('should return undefined if active table not found', () => {
      const tables = {
        version: 1,
        tables: [{ id: 'uuid-1', name: 'Table 1' }],
        activeTableId: 'non-existent',
        maxTables: MAX_TABLES
      };

      expect(getActiveTable(tables)).toBeUndefined();
    });
  });

  describe('setActiveTable', () => {
    it('should set the active table id (immutably)', () => {
      const original = {
        version: 1,
        tables: [
          { id: 'uuid-1', name: 'Table 1' },
          { id: 'uuid-2', name: 'Table 2' }
        ],
        activeTableId: 'uuid-1',
        maxTables: MAX_TABLES
      };

      const updated = setActiveTable(original, 'uuid-2');

      expect(updated.activeTableId).toBe('uuid-2');
      expect(original.activeTableId).toBe('uuid-1'); // Original unchanged
      expect(updated).not.toBe(original); // New object
    });
  });

  describe('renameTable', () => {
    it('should rename table (immutably)', () => {
      const original = {
        version: 1,
        tables: [
          { id: 'uuid-1', name: 'Old Name', createdAt: '2026-01-01', lastModified: '2026-01-01' }
        ],
        activeTableId: 'uuid-1',
        maxTables: MAX_TABLES
      };

      const updated = renameTable(original, 'uuid-1', 'New Name');

      expect(updated.tables[0].name).toBe('New Name');
      expect(updated.tables[0].lastModified).not.toBe(original.tables[0].lastModified);
      expect(original.tables[0].name).toBe('Old Name'); // Original unchanged
      expect(updated).not.toBe(original); // New object
    });

    it('should allow duplicate names', () => {
      const original = {
        version: 1,
        tables: [
          { id: 'uuid-1', name: 'Table 1', lastModified: '2026-01-01' },
          { id: 'uuid-2', name: 'Table 2', lastModified: '2026-01-01' }
        ],
        activeTableId: 'uuid-1',
        maxTables: MAX_TABLES
      };

      const updated = renameTable(original, 'uuid-2', 'Table 1');

      expect(updated.tables[0].name).toBe('Table 1');
      expect(updated.tables[1].name).toBe('Table 1');
    });

    it('should return original if table not found', () => {
      const original = {
        version: 1,
        tables: [{ id: 'uuid-1', name: 'Table 1' }],
        activeTableId: 'uuid-1',
        maxTables: MAX_TABLES
      };

      const updated = renameTable(original, 'non-existent', 'New Name');

      expect(updated).toBe(original);
    });
  });

  describe('deleteTable', () => {
    it('should delete table and switch to first remaining (immutably)', () => {
      const original = {
        version: 1,
        tables: [
          { id: 'uuid-1', name: 'Table 1' },
          { id: 'uuid-2', name: 'Table 2' },
          { id: 'uuid-3', name: 'Table 3' }
        ],
        activeTableId: 'uuid-2',
        maxTables: MAX_TABLES
      };

      const updated = deleteTable(original, 'uuid-2');

      expect(updated.tables).toHaveLength(2);
      expect(updated.tables.find(t => t.id === 'uuid-2')).toBeUndefined();
      expect(updated.activeTableId).toBe('uuid-1'); // Switched to first
      expect(original.tables).toHaveLength(3); // Original unchanged
    });

    it('should prevent deleting the last table', () => {
      const original = {
        version: 1,
        tables: [{ id: 'uuid-1', name: 'Last Table' }],
        activeTableId: 'uuid-1',
        maxTables: MAX_TABLES
      };

      expect(() => deleteTable(original, 'uuid-1')).toThrow('Cannot delete the last table');
    });

    it('should maintain activeTableId if deleting a different table', () => {
      const original = {
        version: 1,
        tables: [
          { id: 'uuid-1', name: 'Table 1' },
          { id: 'uuid-2', name: 'Table 2' }
        ],
        activeTableId: 'uuid-1',
        maxTables: MAX_TABLES
      };

      const updated = deleteTable(original, 'uuid-2');

      expect(updated.activeTableId).toBe('uuid-1');
    });

    it('should return original if table not found', () => {
      const original = {
        version: 1,
        tables: [{ id: 'uuid-1', name: 'Table 1' }],
        activeTableId: 'uuid-1',
        maxTables: MAX_TABLES
      };

      const updated = deleteTable(original, 'non-existent');

      expect(updated).toBe(original);
    });
  });

  describe('duplicateTable', () => {
    it('should duplicate table with new id and "(Copy)" suffix', () => {
      const original = {
        version: 1,
        tables: [
          {
            id: 'uuid-1',
            name: 'Original',
            photoData: { sakurazaka: { '井上 梨名': [1, 2, 0, 0] } },
            groupSettings: { sakurazaka: { enabled: true, generations: {} } },
            createdAt: '2026-01-01T00:00:00Z',
            lastModified: '2026-01-01T00:00:00Z'
          }
        ],
        activeTableId: 'uuid-1',
        maxTables: MAX_TABLES
      };

      const updated = duplicateTable(original, 'uuid-1');

      expect(updated.tables).toHaveLength(2);
      expect(updated.tables[1].name).toBe('Original (Copy)');
      expect(updated.tables[1].id).not.toBe('uuid-1');
      expect(updated.tables[1].photoData).toEqual(original.tables[0].photoData);
      expect(updated.tables[1].photoData).not.toBe(original.tables[0].photoData); // Deep copy
      expect(updated.activeTableId).toBe(updated.tables[1].id); // Switched to new table
    });

    it('should prevent duplicating when at MAX_TABLES', () => {
      const tables = {
        version: 1,
        tables: Array(MAX_TABLES).fill(null).map((_, i) => ({
          id: `id-${i}`,
          name: `Table ${i}`,
          photoData: {},
          groupSettings: {}
        })),
        activeTableId: 'id-0',
        maxTables: MAX_TABLES
      };

      expect(() => duplicateTable(tables, 'id-0')).toThrow('Maximum table limit reached');
    });

    it('should return original if table not found', () => {
      const original = {
        version: 1,
        tables: [{ id: 'uuid-1', name: 'Table 1', photoData: {}, groupSettings: {} }],
        activeTableId: 'uuid-1',
        maxTables: MAX_TABLES
      };

      const updated = duplicateTable(original, 'non-existent');

      expect(updated).toBe(original);
    });
  });

  describe('localStorage operations', () => {
    it('should save and load tables from localStorage', () => {
      const tables = {
        version: 1,
        tables: [
          {
            id: 'uuid-1',
            name: 'My Table',
            createdAt: '2026-02-12T10:00:00Z',
            lastModified: '2026-02-12T10:00:00Z',
            photoData: { sakurazaka: { '井上 梨名': [1, 2, 0, 0] } },
            groupSettings: { sakurazaka: { enabled: true, generations: {} } }
          }
        ],
        activeTableId: 'uuid-1',
        maxTables: MAX_TABLES
      };

      saveTablesToLocalStorage(tables);
      const loaded = loadTablesFromLocalStorage();

      expect(loaded).toEqual(tables);
    });

    it('should return null if localStorage is empty', () => {
      const loaded = loadTablesFromLocalStorage();
      expect(loaded).toBeNull();
    });

    it('should return null if localStorage contains invalid JSON', () => {
      localStorage.setItem('karasu-tables', 'invalid json');
      const loaded = loadTablesFromLocalStorage();
      expect(loaded).toBeNull();
    });
  });

  describe('migrateFromLegacyStorage', () => {
    it('should migrate legacy data to first table', () => {
      // Setup legacy localStorage
      localStorage.setItem('sortedPhotos20250716', JSON.stringify({
        sakurazaka: { '井上 梨名': [1, 2, 0, 0] }
      }));
      localStorage.setItem('karasu-group-state', JSON.stringify({
        sakurazaka: { enabled: true, generations: { '二期生': true } }
      }));

      const tables = migrateFromLegacyStorage();

      expect(tables.version).toBe(1);
      expect(tables.tables).toHaveLength(1);
      expect(tables.tables[0].name).toBe('既存データ');
      expect(tables.tables[0].photoData).toEqual({
        sakurazaka: { '井上 梨名': [1, 2, 0, 0] }
      });
      expect(tables.tables[0].groupSettings).toEqual({
        sakurazaka: { enabled: true, generations: { '二期生': true } }
      });
      expect(tables.activeTableId).toBe(tables.tables[0].id);
    });

    it('should create empty table if no legacy data exists', () => {
      const tables = migrateFromLegacyStorage();

      expect(tables.version).toBe(1);
      expect(tables.tables).toHaveLength(1);
      expect(tables.tables[0].name).toBe('既存データ');
      expect(tables.tables[0].photoData).toEqual({});
      expect(tables.tables[0].groupSettings).toEqual({});
    });

    it('should handle nested format for photoData', () => {
      localStorage.setItem('sortedPhotos20250716', JSON.stringify({
        sakurazaka: { '井上 梨名': [1, 2, 0, 0] },
        hinatazaka: { '金村 美玖': [0, 1, 0, 0] }
      }));

      const tables = migrateFromLegacyStorage();

      expect(tables.tables[0].photoData).toEqual({
        sakurazaka: { '井上 梨名': [1, 2, 0, 0] },
        hinatazaka: { '金村 美玖': [0, 1, 0, 0] }
      });
    });
  });
});
