import { describe, it, expect } from 'vitest';
import {
  structured_groups,
  getAllMembers,
  getGroupById,
  getGroupMembers,
  makeCompositeKey,
  parseCompositeKey,
  DEFAULT_GROUP_ID
} from '../groups.js';

describe('groups', () => {
  describe('structured_groups', () => {
    it('contains sakurazaka group', () => {
      const sakura = structured_groups.find((g) => g.id === 'sakurazaka');
      expect(sakura).toBeDefined();
      expect(sakura.name).toBe('櫻坂46');
      expect(sakura.enabled).toBe(true);
    });

    it('contains hinatazaka group', () => {
      const hinatazaka = structured_groups.find((g) => g.id === 'hinatazaka');
      expect(hinatazaka).toBeDefined();
      expect(hinatazaka.name).toBe('日向坂46');
      expect(hinatazaka.enabled).toBe(true);
    });

    it('each group has generations with members', () => {
      for (const group of structured_groups) {
        expect(group.generations.length).toBeGreaterThan(0);
        for (const gen of group.generations) {
          expect(gen.name).toBeTruthy();
          expect(gen.members.length).toBeGreaterThan(0);
          expect(gen.enabled).toBe(true);
          for (const member of gen.members) {
            expect(member.fullname).toBeTruthy();
            expect(member.shortname).toBeTruthy();
          }
        }
      }
    });

    it('sakurazaka has 3 generations', () => {
      const sakura = structured_groups.find((g) => g.id === 'sakurazaka');
      expect(sakura.generations).toHaveLength(3);
      expect(sakura.generations.map((g) => g.name)).toEqual(['二期生', '三期生', '四期生']);
    });

    it('hinatazaka has at least one generation', () => {
      const hinatazaka = structured_groups.find((g) => g.id === 'hinatazaka');
      expect(hinatazaka.generations.length).toBeGreaterThan(0);
    });

    it('is frozen (immutable)', () => {
      expect(Object.isFrozen(structured_groups)).toBe(true);
      for (const group of structured_groups) {
        expect(Object.isFrozen(group)).toBe(true);
        for (const gen of group.generations) {
          expect(Object.isFrozen(gen)).toBe(true);
          for (const member of gen.members) {
            expect(Object.isFrozen(member)).toBe(true);
          }
        }
      }
    });
  });

  describe('DEFAULT_GROUP_ID', () => {
    it('is sakurazaka', () => {
      expect(DEFAULT_GROUP_ID).toBe('sakurazaka');
    });
  });

  describe('getGroupById', () => {
    it('returns the group for a valid id', () => {
      const sakura = getGroupById('sakurazaka');
      expect(sakura).toBeDefined();
      expect(sakura.name).toBe('櫻坂46');
    });

    it('returns the hinatazaka group', () => {
      const hinatazaka = getGroupById('hinatazaka');
      expect(hinatazaka).toBeDefined();
      expect(hinatazaka.name).toBe('日向坂46');
    });

    it('returns undefined for unknown id', () => {
      expect(getGroupById('nonexistent')).toBeUndefined();
    });
  });

  describe('getAllMembers', () => {
    it('returns all members across all groups', () => {
      const members = getAllMembers();
      expect(members.length).toBeGreaterThan(30);
    });

    it('each member has groupId, fullname, shortname', () => {
      const members = getAllMembers();
      for (const member of members) {
        expect(member.groupId).toBeTruthy();
        expect(member.fullname).toBeTruthy();
        expect(member.shortname).toBeTruthy();
      }
    });

    it('includes members from both sakurazaka and hinatazaka', () => {
      const members = getAllMembers();
      const groupIds = new Set(members.map((m) => m.groupId));
      expect(groupIds.has('sakurazaka')).toBe(true);
      expect(groupIds.has('hinatazaka')).toBe(true);
    });
  });

  describe('getGroupMembers', () => {
    it('returns only members for the specified group', () => {
      const members = getGroupMembers('sakurazaka');
      expect(members.length).toBeGreaterThan(0);
      for (const member of members) {
        expect(member.groupId).toBe('sakurazaka');
      }
    });

    it('returns empty array for unknown group', () => {
      expect(getGroupMembers('nonexistent')).toEqual([]);
    });
  });

  describe('makeCompositeKey', () => {
    it('creates a groupId:fullname key', () => {
      expect(makeCompositeKey('sakurazaka', '井上 梨名')).toBe('sakurazaka:井上 梨名');
    });

    it('works with hinatazaka group', () => {
      expect(makeCompositeKey('hinatazaka', '佐々木 久美')).toBe('hinatazaka:佐々木 久美');
    });
  });

  describe('parseCompositeKey', () => {
    it('parses a composite key into groupId and fullname', () => {
      const result = parseCompositeKey('sakurazaka:井上 梨名');
      expect(result).toEqual({ groupId: 'sakurazaka', fullname: '井上 梨名' });
    });

    it('handles fullnames that contain colons', () => {
      const result = parseCompositeKey('sakurazaka:名前:特殊');
      expect(result).toEqual({ groupId: 'sakurazaka', fullname: '名前:特殊' });
    });

    it('returns null for invalid key with no colon', () => {
      expect(parseCompositeKey('invalidkey')).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(parseCompositeKey('')).toBeNull();
    });

    it('returns null for undefined', () => {
      expect(parseCompositeKey(undefined)).toBeNull();
    });

    it('returns null for null', () => {
      expect(parseCompositeKey(null)).toBeNull();
    });

    it('returns null for number', () => {
      expect(parseCompositeKey(123)).toBeNull();
    });

    it('returns null for object', () => {
      expect(parseCompositeKey({})).toBeNull();
    });
  });
});
