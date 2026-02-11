import { describe, it, expect } from 'vitest';
import { migrateToCompositeKeys, isLegacyFormat, DEFAULT_GROUP_ID } from '../migration.js';

describe('migration', () => {
  describe('isLegacyFormat', () => {
    it('returns true for object with plain fullname keys', () => {
      const legacy = {
        '井上 梨名': [1, 2, 3, 0],
        '大園 玲': [0, 0, 1, 0]
      };
      expect(isLegacyFormat(legacy)).toBe(true);
    });

    it('returns false for object with composite keys', () => {
      const modern = {
        'sakurazaka:井上 梨名': [1, 2, 3, 0],
        'sakurazaka:大園 玲': [0, 0, 1, 0]
      };
      expect(isLegacyFormat(modern)).toBe(false);
    });

    it('returns false for empty object', () => {
      expect(isLegacyFormat({})).toBe(false);
    });

    it('returns false for null', () => {
      expect(isLegacyFormat(null)).toBe(false);
    });

    it('returns true when mixed - if any key lacks colon', () => {
      const mixed = {
        '井上 梨名': [1, 0, 0, 0],
        'sakurazaka:大園 玲': [0, 0, 1, 0]
      };
      expect(isLegacyFormat(mixed)).toBe(true);
    });
  });

  describe('migrateToCompositeKeys', () => {
    it('prefixes legacy keys with the default group id', () => {
      const legacy = {
        '井上 梨名': [1, 2, 3, 0],
        '大園 玲': [0, 0, 1, 0]
      };
      const migrated = migrateToCompositeKeys(legacy);
      expect(migrated).toEqual({
        [`${DEFAULT_GROUP_ID}:井上 梨名`]: [1, 2, 3, 0],
        [`${DEFAULT_GROUP_ID}:大園 玲`]: [0, 0, 1, 0]
      });
    });

    it('does not modify already-migrated data', () => {
      const modern = {
        'sakurazaka:井上 梨名': [1, 2, 3, 0],
        'hinatazaka:佐々木 久美': [0, 0, 1, 0]
      };
      const result = migrateToCompositeKeys(modern);
      expect(result).toEqual(modern);
    });

    it('returns empty object for empty input', () => {
      expect(migrateToCompositeKeys({})).toEqual({});
    });

    it('returns empty object for null input', () => {
      expect(migrateToCompositeKeys(null)).toEqual({});
    });

    it('preserves count arrays without mutation', () => {
      const counts = [1, 2, 3, 4];
      const legacy = { '井上 梨名': counts };
      const migrated = migrateToCompositeKeys(legacy);
      const migratedCounts = migrated[`${DEFAULT_GROUP_ID}:井上 梨名`];
      expect(migratedCounts).toEqual([1, 2, 3, 4]);
      expect(migratedCounts).not.toBe(counts);
    });

    it('handles mixed format by migrating only non-composite keys', () => {
      const mixed = {
        '井上 梨名': [1, 0, 0, 0],
        'sakurazaka:大園 玲': [0, 0, 1, 0]
      };
      const migrated = migrateToCompositeKeys(mixed);
      expect(migrated).toEqual({
        'sakurazaka:井上 梨名': [1, 0, 0, 0],
        'sakurazaka:大園 玲': [0, 0, 1, 0]
      });
    });

    it('migrates old hinata: keys to hinatazaka: for consistency', () => {
      const oldHinata = {
        'hinata:金村 美玖': [2, 1, 0, 0],
        'sakurazaka:井上 梨名': [1, 2, 3, 0]
      };
      const migrated = migrateToCompositeKeys(oldHinata);
      expect(migrated).toEqual({
        'hinatazaka:金村 美玖': [2, 1, 0, 0],
        'sakurazaka:井上 梨名': [1, 2, 3, 0]
      });
    });
  });
});
