import { describe, it, expect } from 'vitest';
import { photosToCSV } from '../csv.js';
import { structured_groups } from '../groups.js';
import { CUTS, buildEmptyPhotos } from '../storage.js';

describe('csv', () => {
  describe('photosToCSV', () => {
    it('generates CSV header with member column and cut columns', () => {
      const photos = buildEmptyPhotos(structured_groups);
      const csv = photosToCSV(photos, structured_groups, CUTS);
      const lines = csv.split('\n');
      expect(lines[0]).toBe('メンバー,ヨリ,チュウ,ヒキ,座り');
    });

    it('includes all enabled members across all groups', () => {
      const photos = buildEmptyPhotos(structured_groups);
      const csv = photosToCSV(photos, structured_groups, CUTS);
      const lines = csv.split('\n').filter((l) => l.length > 0);
      // header + all members
      let totalMembers = 0;
      for (const group of structured_groups) {
        for (const gen of group.generations) {
          totalMembers += gen.members.length;
        }
      }
      expect(lines.length).toBe(1 + totalMembers);
    });

    it('writes correct count values', () => {
      const photos = buildEmptyPhotos(structured_groups);
      photos.set('sakurazaka:井上 梨名', [1, 2, 3, 4]);
      const csv = photosToCSV(photos, structured_groups, CUTS);
      const inoue_line = csv.split('\n').find((l) => l.includes('井上 梨名'));
      expect(inoue_line).toBe('井上 梨名,1,2,3,4');
    });

    it('respects group enabled flag', () => {
      const photos = buildEmptyPhotos(structured_groups);
      // Create groups config with hinatazaka disabled
      const groups = structured_groups.map((g) =>
        g.id === 'hinatazaka' ? { ...g, enabled: false } : g
      );
      const csv = photosToCSV(photos, groups, CUTS);
      // Hinatazaka member should not appear
      expect(csv).not.toContain('金村 美玖');
      // But sakurazaka member should
      expect(csv).toContain('井上 梨名');
    });

    it('respects generation enabled flag', () => {
      const photos = buildEmptyPhotos(structured_groups);
      const groups = structured_groups.map((g) =>
        g.id === 'sakurazaka'
          ? {
              ...g,
              generations: g.generations.map((gen) =>
                gen.name === '四期生' ? { ...gen, enabled: false } : gen
              )
            }
          : g
      );
      const csv = photosToCSV(photos, groups, CUTS);
      // sakurazaka 4th gen member should not appear
      expect(csv).not.toContain('浅井 恋乃未');
      // but 2nd gen member should
      expect(csv).toContain('井上 梨名');
    });

    it('returns only header when all groups are disabled', () => {
      const photos = buildEmptyPhotos(structured_groups);
      const groups = structured_groups.map((g) => ({ ...g, enabled: false }));
      const csv = photosToCSV(photos, groups, CUTS);
      const lines = csv.split('\n').filter((l) => l.length > 0);
      expect(lines.length).toBe(1);
      expect(lines[0]).toContain('メンバー');
    });

    it('handles missing photo data gracefully with zeros', () => {
      const photos = new Map();
      const csv = photosToCSV(photos, structured_groups, CUTS);
      // All members should have 0,0,0,0
      const dataLines = csv
        .split('\n')
        .filter((l) => l.length > 0)
        .slice(1);
      for (const line of dataLines) {
        expect(line).toMatch(/,0,0,0,0$/);
      }
    });
  });
});
