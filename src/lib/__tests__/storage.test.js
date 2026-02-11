import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  serializePhotos,
  deserializePhotos,
  buildEmptyPhotos,
  CUTS,
  STORAGE_KEY
} from '../storage.js';
import { structured_groups } from '../groups.js';

describe('storage', () => {
  describe('CUTS', () => {
    it('exports the 4 cut types', () => {
      expect(CUTS).toEqual(['ヨリ', 'チュウ', 'ヒキ', '座り']);
    });

    it('is frozen (immutable)', () => {
      expect(Object.isFrozen(CUTS)).toBe(true);
    });
  });

  describe('STORAGE_KEY', () => {
    it('exports a storage key string', () => {
      expect(typeof STORAGE_KEY).toBe('string');
      expect(STORAGE_KEY.length).toBeGreaterThan(0);
    });
  });

  describe('buildEmptyPhotos', () => {
    it('returns a Map with composite keys for all members across all groups', () => {
      const photos = buildEmptyPhotos(structured_groups);
      expect(photos instanceof Map).toBe(true);

      let totalMembers = 0;
      for (const group of structured_groups) {
        for (const gen of group.generations) {
          totalMembers += gen.members.length;
        }
      }
      expect(photos.size).toBe(totalMembers);
    });

    it('each entry has [0,0,0,0] counts', () => {
      const photos = buildEmptyPhotos(structured_groups);
      for (const [, counts] of photos) {
        expect(counts).toEqual([0, 0, 0, 0]);
      }
    });

    it('keys are composite keys (groupId:fullname)', () => {
      const photos = buildEmptyPhotos(structured_groups);
      for (const key of photos.keys()) {
        expect(key).toMatch(/^[a-z]+:/);
      }
    });

    it('can build photos for a single group by filtering', () => {
      const sakuraOnly = structured_groups.filter((g) => g.id === 'sakurazaka');
      const photos = buildEmptyPhotos(sakuraOnly);
      for (const key of photos.keys()) {
        expect(key.startsWith('sakurazaka:')).toBe(true);
      }
    });
  });

  describe('serializePhotos', () => {
    it('converts a Map to a JSON string with composite keys', () => {
      const photos = new Map();
      photos.set('sakurazaka:井上 梨名', [1, 2, 3, 0]);
      photos.set('sakurazaka:大園 玲', [0, 0, 0, 0]);

      const json = serializePhotos(photos, structured_groups);
      const parsed = JSON.parse(json);

      expect(parsed['sakurazaka:井上 梨名']).toEqual([1, 2, 3, 0]);
    });

    it('omits entries that are all zeros', () => {
      const photos = new Map();
      photos.set('sakurazaka:井上 梨名', [1, 0, 0, 0]);
      photos.set('sakurazaka:大園 玲', [0, 0, 0, 0]);

      const json = serializePhotos(photos, structured_groups);
      const parsed = JSON.parse(json);

      expect(parsed['sakurazaka:井上 梨名']).toEqual([1, 0, 0, 0]);
      expect(parsed['sakurazaka:大園 玲']).toBeUndefined();
    });

    it('returns empty object JSON when all zeros', () => {
      const photos = buildEmptyPhotos(structured_groups);
      const json = serializePhotos(photos, structured_groups);
      expect(JSON.parse(json)).toEqual({});
    });
  });

  describe('deserializePhotos', () => {
    it('restores a Map from JSON', () => {
      const input = JSON.stringify({
        'sakurazaka:井上 梨名': [1, 2, 3, 0]
      });
      const photos = deserializePhotos(input, structured_groups);
      expect(photos.get('sakurazaka:井上 梨名')).toEqual([1, 2, 3, 0]);
    });

    it('fills missing members with zeros', () => {
      const input = JSON.stringify({});
      const photos = deserializePhotos(input, structured_groups);

      let totalMembers = 0;
      for (const group of structured_groups) {
        for (const gen of group.generations) {
          totalMembers += gen.members.length;
        }
      }
      expect(photos.size).toBe(totalMembers);

      for (const [, counts] of photos) {
        expect(counts).toEqual([0, 0, 0, 0]);
      }
    });

    it('returns empty photos for null JSON', () => {
      const photos = deserializePhotos(null, structured_groups);
      expect(photos.size).toBeGreaterThan(0);
      for (const [, counts] of photos) {
        expect(counts).toEqual([0, 0, 0, 0]);
      }
    });

    it('returns empty photos for invalid JSON', () => {
      const photos = deserializePhotos('not-json', structured_groups);
      expect(photos.size).toBeGreaterThan(0);
      for (const [, counts] of photos) {
        expect(counts).toEqual([0, 0, 0, 0]);
      }
    });

    it('migrates legacy format (plain fullname keys) to composite keys', () => {
      const legacy = JSON.stringify({
        '井上 梨名': [5, 3, 1, 0]
      });
      const photos = deserializePhotos(legacy, structured_groups);
      expect(photos.get('sakurazaka:井上 梨名')).toEqual([5, 3, 1, 0]);
      // The old key should not exist
      expect(photos.has('井上 梨名')).toBe(false);
    });

    it('handles composite keys correctly (no double migration)', () => {
      const modern = JSON.stringify({
        'sakurazaka:井上 梨名': [5, 3, 1, 0],
        'hinatazaka:金村 美玖': [2, 1, 0, 0]
      });
      const photos = deserializePhotos(modern, structured_groups);
      expect(photos.get('sakurazaka:井上 梨名')).toEqual([5, 3, 1, 0]);
      expect(photos.get('hinatazaka:金村 美玖')).toEqual([2, 1, 0, 0]);
    });
  });
});
