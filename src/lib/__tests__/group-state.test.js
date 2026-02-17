import { describe, it, expect, beforeEach } from 'vitest';
import {
  createGroupState,
  setGroupEnabled,
  setGenerationEnabled,
  setMemberEnabled,
  isMemberEnabled,
  getEnabledGenerations,
  getActiveGroupId,
  setActiveGroupId,
  countEnabledMembers,
  saveGroupStateToLocalStorage,
  createGroupStateFromSettings,
  createEditableGroupState,
  toggleMemberInEditGroups
} from '../group-state.js';
import { structured_groups } from '../groups.js';

describe('group-state', () => {
  describe('createGroupState', () => {
    it('creates state from structured_groups with config-defined enabled values', () => {
      const state = createGroupState(structured_groups);
      expect(state.groups.length).toBe(structured_groups.length);
      for (const group of state.groups) {
        expect(group.enabled).toBe(true);
        for (const gen of group.generations) {
          if (gen.name === '卒業生') {
            expect(gen.enabled).toBe(false);
          } else {
            expect(gen.enabled).toBe(true);
          }
        }
      }
    });

    it('preserves group ids and names', () => {
      const state = createGroupState(structured_groups);
      expect(state.groups[0].id).toBe('sakurazaka');
      expect(state.groups[0].name).toBe('櫻坂46');
      expect(state.groups[1].id).toBe('hinatazaka');
      expect(state.groups[1].name).toBe('日向坂46');
    });

    it('sets activeGroupId to the first group', () => {
      const state = createGroupState(structured_groups);
      expect(state.activeGroupId).toBe('sakurazaka');
    });

    it('does not mutate the original structured_groups', () => {
      const state = createGroupState(structured_groups);
      // structured_groups is frozen, this just confirms state is a copy
      expect(state.groups).not.toBe(structured_groups);
    });

    it('handles empty groups array', () => {
      const state = createGroupState([]);
      expect(state.groups).toEqual([]);
      expect(state.activeGroupId).toBe('');
    });
  });

  describe('setGroupEnabled', () => {
    it('disabling a group disables all its generations', () => {
      const state = createGroupState(structured_groups);
      const updated = setGroupEnabled(state, 'sakurazaka', false);
      const sakura = updated.groups.find((g) => g.id === 'sakurazaka');
      expect(sakura.enabled).toBe(false);
      for (const gen of sakura.generations) {
        expect(gen.enabled).toBe(false);
      }
    });

    it('enabling a group enables all its generations', () => {
      const state = createGroupState(structured_groups);
      const disabled = setGroupEnabled(state, 'sakurazaka', false);
      const enabled = setGroupEnabled(disabled, 'sakurazaka', true);
      const sakura = enabled.groups.find((g) => g.id === 'sakurazaka');
      expect(sakura.enabled).toBe(true);
      for (const gen of sakura.generations) {
        expect(gen.enabled).toBe(true);
      }
    });

    it('does not affect other groups', () => {
      const state = createGroupState(structured_groups);
      const updated = setGroupEnabled(state, 'sakurazaka', false);
      const hinatazaka = updated.groups.find((g) => g.id === 'hinatazaka');
      expect(hinatazaka.enabled).toBe(true);
    });

    it('returns a new object (no mutation)', () => {
      const state = createGroupState(structured_groups);
      const updated = setGroupEnabled(state, 'sakurazaka', false);
      expect(updated).not.toBe(state);
      // Original state should remain unchanged
      const originalSakura = state.groups.find((g) => g.id === 'sakurazaka');
      expect(originalSakura.enabled).toBe(true);
    });
  });

  describe('setGenerationEnabled', () => {
    it('disables a single generation within a group', () => {
      const state = createGroupState(structured_groups);
      const updated = setGenerationEnabled(state, 'sakurazaka', '二期生', false);
      const sakura = updated.groups.find((g) => g.id === 'sakurazaka');
      const gen2 = sakura.generations.find((g) => g.name === '二期生');
      const gen3 = sakura.generations.find((g) => g.name === '三期生');
      expect(gen2.enabled).toBe(false);
      expect(gen3.enabled).toBe(true);
    });

    it('disabling all enabled generations auto-disables the group', () => {
      let state = createGroupState(structured_groups);
      state = setGenerationEnabled(state, 'sakurazaka', '二期生', false);
      state = setGenerationEnabled(state, 'sakurazaka', '三期生', false);
      state = setGenerationEnabled(state, 'sakurazaka', '四期生', false);
      // 卒業生 is already disabled by default
      const sakura = state.groups.find((g) => g.id === 'sakurazaka');
      expect(sakura.enabled).toBe(false);
    });

    it('enabling one generation in a disabled group re-enables the group', () => {
      let state = createGroupState(structured_groups);
      state = setGroupEnabled(state, 'sakurazaka', false);
      state = setGenerationEnabled(state, 'sakurazaka', '二期生', true);
      const sakura = state.groups.find((g) => g.id === 'sakurazaka');
      expect(sakura.enabled).toBe(true);
      // Only the enabled generation should be true
      const gen2 = sakura.generations.find((g) => g.name === '二期生');
      const gen3 = sakura.generations.find((g) => g.name === '三期生');
      expect(gen2.enabled).toBe(true);
      expect(gen3.enabled).toBe(false);
    });

    it('returns a new object (no mutation)', () => {
      const state = createGroupState(structured_groups);
      const updated = setGenerationEnabled(state, 'sakurazaka', '二期生', false);
      expect(updated).not.toBe(state);
    });
  });

  describe('getEnabledGenerations', () => {
    it('returns all enabled generations (excludes graduated by default)', () => {
      const state = createGroupState(structured_groups);
      const gens = getEnabledGenerations(state, 'sakurazaka');
      expect(gens.length).toBe(3);
      expect(gens.map((g) => g.name)).not.toContain('卒業生');
    });

    it('returns only enabled generations', () => {
      let state = createGroupState(structured_groups);
      state = setGenerationEnabled(state, 'sakurazaka', '四期生', false);
      const gens = getEnabledGenerations(state, 'sakurazaka');
      expect(gens.length).toBe(2);
      expect(gens.map((g) => g.name)).toEqual(['二期生', '三期生']);
    });

    it('returns empty array when group not found', () => {
      const state = createGroupState(structured_groups);
      expect(getEnabledGenerations(state, 'nonexistent')).toEqual([]);
    });
  });

  describe('getActiveGroupId / setActiveGroupId', () => {
    it('defaults to sakurazaka', () => {
      const state = createGroupState(structured_groups);
      expect(getActiveGroupId(state)).toBe('sakurazaka');
    });

    it('can change active group', () => {
      const state = createGroupState(structured_groups);
      const updated = setActiveGroupId(state, 'hinatazaka');
      expect(getActiveGroupId(updated)).toBe('hinatazaka');
    });

    it('does not mutate original state', () => {
      const state = createGroupState(structured_groups);
      const updated = setActiveGroupId(state, 'hinatazaka');
      expect(getActiveGroupId(state)).toBe('sakurazaka');
      expect(updated).not.toBe(state);
    });
  });

  describe('countEnabledMembers', () => {
    it('counts all members when everything is enabled', () => {
      const state = createGroupState(structured_groups);
      let totalMembers = 0;
      for (const group of structured_groups) {
        for (const gen of group.generations) {
          totalMembers += gen.members.length;
        }
      }
      expect(countEnabledMembers(state)).toBe(totalMembers);
    });

    it('excludes members from disabled groups', () => {
      let state = createGroupState(structured_groups);
      state = setGroupEnabled(state, 'hinatazaka', false);
      let sakuraMembers = 0;
      for (const gen of structured_groups.find((g) => g.id === 'sakurazaka').generations) {
        sakuraMembers += gen.members.length;
      }
      expect(countEnabledMembers(state)).toBe(sakuraMembers);
    });

    it('excludes members from disabled generations', () => {
      let state = createGroupState(structured_groups);
      state = setGenerationEnabled(state, 'sakurazaka', '四期生', false);
      // Should have all hinatazaka + sakurazaka gen 2 and 3
      const sakuraGen2 = structured_groups
        .find((g) => g.id === 'sakurazaka')
        .generations.find((g) => g.name === '二期生').members.length;
      const sakuraGen3 = structured_groups
        .find((g) => g.id === 'sakurazaka')
        .generations.find((g) => g.name === '三期生').members.length;
      let hinatazakaMembers = 0;
      for (const gen of structured_groups.find((g) => g.id === 'hinatazaka').generations) {
        hinatazakaMembers += gen.members.length;
      }
      expect(countEnabledMembers(state)).toBe(sakuraGen2 + sakuraGen3 + hinatazakaMembers);
    });

    it('returns 0 when everything is disabled', () => {
      let state = createGroupState(structured_groups);
      state = setGroupEnabled(state, 'sakurazaka', false);
      state = setGroupEnabled(state, 'hinatazaka', false);
      expect(countEnabledMembers(state)).toBe(0);
    });
  });

  describe('localStorage persistence', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('saves group state to localStorage', () => {
      let state = createGroupState(structured_groups);
      state = setGroupEnabled(state, 'sakurazaka', false);
      saveGroupStateToLocalStorage(state);

      const saved = JSON.parse(localStorage.getItem('karasu-group-state'));
      expect(saved.sakurazaka.enabled).toBe(false);
      expect(saved.hinatazaka.enabled).toBe(true);
    });

    it('loads group state from localStorage on init', () => {
      // Save a state with sakurazaka disabled
      let state = createGroupState(structured_groups);
      state = setGroupEnabled(state, 'sakurazaka', false);
      saveGroupStateToLocalStorage(state);

      // Create a new state - should load from localStorage
      const newState = createGroupState(structured_groups);
      const sakura = newState.groups.find((g) => g.id === 'sakurazaka');
      expect(sakura.enabled).toBe(false);
    });

    it('saves and loads generation state', () => {
      let state = createGroupState(structured_groups);
      state = setGenerationEnabled(state, 'sakurazaka', '四期生', false);
      saveGroupStateToLocalStorage(state);

      const newState = createGroupState(structured_groups);
      const sakura = newState.groups.find((g) => g.id === 'sakurazaka');
      const gen4 = sakura.generations.find((g) => g.name === '四期生');
      expect(gen4.enabled).toBe(false);
    });

    it('merges saved state with defaults for new groups', () => {
      // Save state with only sakurazaka
      localStorage.setItem(
        'karasu-group-state',
        JSON.stringify({
          sakurazaka: { enabled: false, generations: {} }
        })
      );

      // Load with both groups - hinatazaka should use defaults
      const state = createGroupState(structured_groups);
      const sakura = state.groups.find((g) => g.id === 'sakurazaka');
      const hinata = state.groups.find((g) => g.id === 'hinatazaka');
      expect(sakura.enabled).toBe(false);
      expect(hinata.enabled).toBe(true); // Default
    });

    it('handles corrupt localStorage data gracefully', () => {
      localStorage.setItem('karasu-group-state', 'invalid json{');
      const state = createGroupState(structured_groups);
      // Should use defaults
      expect(state.groups[0].enabled).toBe(true);
    });
  });

  describe('createGroupStateFromSettings', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('should create group state with custom saved settings', () => {
      const customSettings = {
        sakurazaka: {
          enabled: false,
          generations: {
            二期生: false,
            三期生: true
          }
        }
      };

      const state = createGroupStateFromSettings(structured_groups, customSettings);

      expect(state.groups[0].enabled).toBe(false);
      // Find the specific generations by name
      const niKisei = state.groups[0].generations.find((g) => g.name === '二期生');
      const sanKisei = state.groups[0].generations.find((g) => g.name === '三期生');
      expect(niKisei.enabled).toBe(false);
      expect(sanKisei.enabled).toBe(true);

      // hinatazaka has no entry in customSettings, should default to disabled
      const hinata = state.groups.find((g) => g.id === 'hinatazaka');
      expect(hinata.enabled).toBe(false);
      for (const gen of hinata.generations) {
        expect(gen.enabled).toBe(false);
      }
    });

    it('should not be polluted by localStorage global state', () => {
      // Set localStorage with sakurazaka disabled globally
      localStorage.setItem(
        'karasu-group-state',
        JSON.stringify({
          sakurazaka: {
            enabled: false,
            generations: {
              二期生: false,
              三期生: false,
              四期生: false
            }
          }
        })
      );

      // Table settings only specify hinatazaka; sakurazaka should default to disabled
      const customSettings = {
        hinatazaka: {
          enabled: true,
          generations: {
            二期生: true
          }
        }
      };

      const state = createGroupStateFromSettings(structured_groups, customSettings);

      // sakurazaka has no table-specific settings, should default to disabled,
      // NOT localStorage global state nor config defaults
      const sakura = state.groups.find((g) => g.id === 'sakurazaka');
      expect(sakura.enabled).toBe(false);
      for (const gen of sakura.generations) {
        expect(gen.enabled).toBe(false);
      }
    });

    it('should apply custom settings on top of config defaults', () => {
      const customSettings = {
        sakurazaka: {
          enabled: false,
          generations: {
            二期生: false
          }
        }
      };

      const state = createGroupStateFromSettings(structured_groups, customSettings);

      expect(state.groups[0].enabled).toBe(false);
      const niKisei = state.groups[0].generations.find((g) => g.name === '二期生');
      const sanKisei = state.groups[0].generations.find((g) => g.name === '三期生');
      expect(niKisei.enabled).toBe(false);
      // 三期生 not in custom settings, should use config default (enabled)
      expect(sanKisei.enabled).toBe(true);
    });

    it('should handle empty saved settings by disabling all groups', () => {
      const state = createGroupStateFromSettings(structured_groups, {});

      expect(state).toHaveProperty('groups');
      expect(state).toHaveProperty('activeGroupId');
      for (const group of state.groups) {
        expect(group.enabled).toBe(false);
        for (const gen of group.generations) {
          expect(gen.enabled).toBe(false);
        }
      }
    });

    it('should handle null saved settings by disabling all groups', () => {
      const state = createGroupStateFromSettings(structured_groups, null);

      expect(state).toHaveProperty('groups');
      expect(state).toHaveProperty('activeGroupId');
      for (const group of state.groups) {
        expect(group.enabled).toBe(false);
        for (const gen of group.generations) {
          expect(gen.enabled).toBe(false);
        }
      }
    });
  });

  describe('createEditableGroupState', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('should create editable group state array', () => {
      const savedSettings = {
        sakurazaka: {
          enabled: false,
          generations: {
            二期生: false,
            三期生: true
          }
        }
      };

      const result = createEditableGroupState(structured_groups, savedSettings);

      expect(Array.isArray(result)).toBe(true);
      expect(result[0].id).toBe('sakurazaka');
      expect(result[0].enabled).toBe(false);
      const niKisei = result[0].generations.find((g) => g.name === '二期生');
      const sanKisei = result[0].generations.find((g) => g.name === '三期生');
      expect(niKisei.enabled).toBe(false);
      expect(sanKisei.enabled).toBe(true);
    });

    it('should default to enabled:false when group has no saved settings', () => {
      const result = createEditableGroupState(structured_groups, {});

      // Groups not present in savedSettings default to disabled
      expect(result[0].enabled).toBe(false);
      expect(result[0].generations[0].enabled).toBe(false);
    });

    it('should include id, name, enabled, disabledMembers, and members fields', () => {
      const result = createEditableGroupState(structured_groups, {});

      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('enabled');
      expect(result[0]).toHaveProperty('disabledMembers');
      expect(result[0]).toHaveProperty('generations');
      expect(result[0].generations[0]).toHaveProperty('name');
      expect(result[0].generations[0]).toHaveProperty('enabled');
      expect(result[0].generations[0]).toHaveProperty('members');
    });

    it('should merge saved settings correctly', () => {
      const savedSettings = {
        sakurazaka: {
          enabled: false,
          generations: {
            二期生: true
          }
        }
      };

      const result = createEditableGroupState(structured_groups, savedSettings);

      expect(result[0].enabled).toBe(false);
      const niKisei = result[0].generations.find((g) => g.name === '二期生');
      const sanKisei = result[0].generations.find((g) => g.name === '三期生');
      expect(niKisei.enabled).toBe(true);
      // 三期生 not in saved settings, should default to true
      expect(sanKisei.enabled).toBe(true);
    });

    it('should include members in generation objects', () => {
      const savedSettings = {
        sakurazaka: {
          enabled: true,
          generations: { 二期生: true }
        }
      };

      const result = createEditableGroupState(structured_groups, savedSettings);

      const niKisei = result[0].generations.find((g) => g.name === '二期生');
      expect(niKisei.members).toBeDefined();
      expect(niKisei.members.length).toBeGreaterThan(0);
      expect(niKisei.members[0]).toHaveProperty('fullname');
    });

    it('should include disabledMembers from saved settings', () => {
      const savedSettings = {
        sakurazaka: {
          enabled: true,
          generations: { 二期生: true },
          disabledMembers: ['井上 梨名']
        }
      };

      const result = createEditableGroupState(structured_groups, savedSettings);

      expect(result[0].disabledMembers).toEqual(['井上 梨名']);
    });

    it('should default disabledMembers to empty array when not in saved settings', () => {
      const savedSettings = {
        sakurazaka: {
          enabled: true,
          generations: { 二期生: true }
        }
      };

      const result = createEditableGroupState(structured_groups, savedSettings);

      expect(result[0].disabledMembers).toEqual([]);
    });
  });

  describe('setMemberEnabled', () => {
    it('disabling a member adds to disabledMembers', () => {
      const state = createGroupState(structured_groups);
      const updated = setMemberEnabled(state, 'sakurazaka', '井上 梨名', false);
      const sakura = updated.groups.find((g) => g.id === 'sakurazaka');
      expect(sakura.disabledMembers).toContain('井上 梨名');
    });

    it('enabling a member removes from disabledMembers', () => {
      let state = createGroupState(structured_groups);
      state = setMemberEnabled(state, 'sakurazaka', '井上 梨名', false);
      state = setMemberEnabled(state, 'sakurazaka', '井上 梨名', true);
      const sakura = state.groups.find((g) => g.id === 'sakurazaka');
      expect(sakura.disabledMembers).not.toContain('井上 梨名');
    });

    it('does not duplicate entries when disabling already disabled member', () => {
      let state = createGroupState(structured_groups);
      state = setMemberEnabled(state, 'sakurazaka', '井上 梨名', false);
      state = setMemberEnabled(state, 'sakurazaka', '井上 梨名', false);
      const sakura = state.groups.find((g) => g.id === 'sakurazaka');
      const count = sakura.disabledMembers.filter((n) => n === '井上 梨名').length;
      expect(count).toBe(1);
    });

    it('does not affect other groups', () => {
      const state = createGroupState(structured_groups);
      const updated = setMemberEnabled(state, 'sakurazaka', '井上 梨名', false);
      const hinata = updated.groups.find((g) => g.id === 'hinatazaka');
      expect(hinata.disabledMembers).toEqual([]);
    });

    it('returns a new object (no mutation)', () => {
      const state = createGroupState(structured_groups);
      const updated = setMemberEnabled(state, 'sakurazaka', '井上 梨名', false);
      expect(updated).not.toBe(state);
      const originalSakura = state.groups.find((g) => g.id === 'sakurazaka');
      expect(originalSakura.disabledMembers).toEqual([]);
    });
  });

  describe('isMemberEnabled', () => {
    it('returns true for enabled member', () => {
      const state = createGroupState(structured_groups);
      expect(isMemberEnabled(state, 'sakurazaka', '井上 梨名')).toBe(true);
    });

    it('returns false for disabled member', () => {
      let state = createGroupState(structured_groups);
      state = setMemberEnabled(state, 'sakurazaka', '井上 梨名', false);
      expect(isMemberEnabled(state, 'sakurazaka', '井上 梨名')).toBe(false);
    });

    it('returns false for nonexistent group', () => {
      const state = createGroupState(structured_groups);
      expect(isMemberEnabled(state, 'nonexistent', '井上 梨名')).toBe(false);
    });
  });

  describe('countEnabledMembers with disabledMembers', () => {
    it('excludes individually disabled members', () => {
      let state = createGroupState(structured_groups);
      const totalBefore = countEnabledMembers(state);
      state = setMemberEnabled(state, 'sakurazaka', '井上 梨名', false);
      expect(countEnabledMembers(state)).toBe(totalBefore - 1);
    });

    it('excludes multiple disabled members', () => {
      let state = createGroupState(structured_groups);
      const totalBefore = countEnabledMembers(state);
      state = setMemberEnabled(state, 'sakurazaka', '井上 梨名', false);
      state = setMemberEnabled(state, 'sakurazaka', '遠藤 光莉', false);
      expect(countEnabledMembers(state)).toBe(totalBefore - 2);
    });
  });

  describe('setGenerationEnabled clears disabledMembers', () => {
    it('enabling a generation clears disabledMembers for that generation', () => {
      let state = createGroupState(structured_groups);
      // Disable a member in 二期生
      state = setMemberEnabled(state, 'sakurazaka', '井上 梨名', false);
      const sakuraBefore = state.groups.find((g) => g.id === 'sakurazaka');
      expect(sakuraBefore.disabledMembers).toContain('井上 梨名');

      // Re-enable the generation
      state = setGenerationEnabled(state, 'sakurazaka', '二期生', true);
      const sakuraAfter = state.groups.find((g) => g.id === 'sakurazaka');
      expect(sakuraAfter.disabledMembers).not.toContain('井上 梨名');
    });

    it('enabling a generation does not clear disabledMembers for other generations', () => {
      let state = createGroupState(structured_groups);
      // Disable members in different generations
      state = setMemberEnabled(state, 'sakurazaka', '井上 梨名', false); // 二期生
      state = setMemberEnabled(state, 'sakurazaka', '石森 璃花', false); // 三期生

      // Re-enable 二期生
      state = setGenerationEnabled(state, 'sakurazaka', '二期生', true);
      const sakura = state.groups.find((g) => g.id === 'sakurazaka');
      expect(sakura.disabledMembers).not.toContain('井上 梨名');
      expect(sakura.disabledMembers).toContain('石森 璃花');
    });

    it('disabling a generation does not modify disabledMembers', () => {
      let state = createGroupState(structured_groups);
      state = setMemberEnabled(state, 'sakurazaka', '井上 梨名', false);

      state = setGenerationEnabled(state, 'sakurazaka', '二期生', false);
      const sakura = state.groups.find((g) => g.id === 'sakurazaka');
      expect(sakura.disabledMembers).toContain('井上 梨名');
    });
  });

  describe('setMemberEnabled auto-disables generation when all members disabled', () => {
    it('auto-disables generation when all its members are disabled', () => {
      let state = createGroupState(structured_groups);
      const sakura = state.groups.find((g) => g.id === 'sakurazaka');
      const gen = sakura.generations.find((g) => g.name === '二期生');

      for (const member of gen.members) {
        state = setMemberEnabled(state, 'sakurazaka', member.fullname, false);
      }

      const updated = state.groups.find((g) => g.id === 'sakurazaka');
      const updatedGen = updated.generations.find((g) => g.name === '二期生');
      expect(updatedGen.enabled).toBe(false);
    });

    it('cleans up disabledMembers for the auto-disabled generation', () => {
      let state = createGroupState(structured_groups);
      const sakura = state.groups.find((g) => g.id === 'sakurazaka');
      const gen = sakura.generations.find((g) => g.name === '二期生');

      for (const member of gen.members) {
        state = setMemberEnabled(state, 'sakurazaka', member.fullname, false);
      }

      const updated = state.groups.find((g) => g.id === 'sakurazaka');
      for (const member of gen.members) {
        expect(updated.disabledMembers).not.toContain(member.fullname);
      }
    });

    it('auto-disables group when last enabled generation is auto-disabled', () => {
      let state = createGroupState(structured_groups);

      // Disable all generations except 二期生
      const sakura = state.groups.find((g) => g.id === 'sakurazaka');
      for (const gen of sakura.generations) {
        if (gen.name !== '二期生' && gen.enabled) {
          state = setGenerationEnabled(state, 'sakurazaka', gen.name, false);
        }
      }

      // Now disable all members of 二期生
      const lastGen = state.groups.find((g) => g.id === 'sakurazaka').generations.find((g) => g.name === '二期生');
      for (const member of lastGen.members) {
        state = setMemberEnabled(state, 'sakurazaka', member.fullname, false);
      }

      const updated = state.groups.find((g) => g.id === 'sakurazaka');
      expect(updated.enabled).toBe(false);
    });

    it('does not auto-disable generation when some members remain enabled', () => {
      let state = createGroupState(structured_groups);
      const sakura = state.groups.find((g) => g.id === 'sakurazaka');
      const gen = sakura.generations.find((g) => g.name === '二期生');

      // Disable all but the last member
      for (let i = 0; i < gen.members.length - 1; i++) {
        state = setMemberEnabled(state, 'sakurazaka', gen.members[i].fullname, false);
      }

      const updated = state.groups.find((g) => g.id === 'sakurazaka');
      const updatedGen = updated.generations.find((g) => g.name === '二期生');
      expect(updatedGen.enabled).toBe(true);
    });

    it('preserves disabledMembers from other generations during auto-disable', () => {
      let state = createGroupState(structured_groups);

      // Disable a member from 三期生
      state = setMemberEnabled(state, 'sakurazaka', '石森 璃花', false);

      // Disable all members of 二期生
      const sakura = state.groups.find((g) => g.id === 'sakurazaka');
      const gen = sakura.generations.find((g) => g.name === '二期生');
      for (const member of gen.members) {
        state = setMemberEnabled(state, 'sakurazaka', member.fullname, false);
      }

      const updated = state.groups.find((g) => g.id === 'sakurazaka');
      expect(updated.disabledMembers).toContain('石森 璃花');
      expect(updated.disabledMembers).toHaveLength(1);
    });
  });

  describe('setGroupEnabled clears disabledMembers', () => {
    it('enabling a group clears all disabledMembers', () => {
      let state = createGroupState(structured_groups);
      state = setMemberEnabled(state, 'sakurazaka', '井上 梨名', false);
      state = setGroupEnabled(state, 'sakurazaka', true);
      const sakura = state.groups.find((g) => g.id === 'sakurazaka');
      expect(sakura.disabledMembers).toEqual([]);
    });
  });

  describe('backward compatibility', () => {
    it('state without disabledMembers treats all members as enabled', () => {
      const state = createGroupState(structured_groups);
      for (const group of state.groups) {
        expect(group.disabledMembers).toEqual([]);
      }
      // All members should be enabled
      expect(isMemberEnabled(state, 'sakurazaka', '井上 梨名')).toBe(true);
    });

    it('createGroupStateFromSettings without disabledMembers defaults to empty', () => {
      const settings = {
        sakurazaka: {
          enabled: true,
          generations: { 二期生: true }
        }
      };
      const state = createGroupStateFromSettings(structured_groups, settings);
      const sakura = state.groups.find((g) => g.id === 'sakurazaka');
      expect(sakura.disabledMembers).toEqual([]);
    });

    it('createGroupStateFromSettings preserves disabledMembers from settings', () => {
      const settings = {
        sakurazaka: {
          enabled: true,
          generations: { 二期生: true },
          disabledMembers: ['井上 梨名']
        }
      };
      const state = createGroupStateFromSettings(structured_groups, settings);
      const sakura = state.groups.find((g) => g.id === 'sakurazaka');
      expect(sakura.disabledMembers).toEqual(['井上 梨名']);
    });
  });

  describe('graduated generation defaults', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('graduated generation defaults to disabled in createGroupState', () => {
      const state = createGroupState(structured_groups);
      for (const group of state.groups) {
        const graduated = group.generations.find((g) => g.name === '卒業生');
        expect(graduated).toBeDefined();
        expect(graduated.enabled).toBe(false);
      }
    });

    it('graduated generation defaults to disabled in createGroupStateFromSettings when not in saved settings', () => {
      const settings = {
        sakurazaka: {
          enabled: true,
          generations: {
            二期生: true,
            三期生: true,
            四期生: true
          }
        }
      };
      const state = createGroupStateFromSettings(structured_groups, settings);
      const sakura = state.groups.find((g) => g.id === 'sakurazaka');
      const graduated = sakura.generations.find((g) => g.name === '卒業生');
      expect(graduated.enabled).toBe(false);
    });

    it('graduated generation defaults to disabled in createEditableGroupState when not in saved settings', () => {
      const savedSettings = {
        sakurazaka: {
          enabled: true,
          generations: {
            二期生: true,
            三期生: true,
            四期生: true
          }
        }
      };
      const result = createEditableGroupState(structured_groups, savedSettings);
      const sakura = result.find((g) => g.id === 'sakurazaka');
      const graduated = sakura.generations.find((g) => g.name === '卒業生');
      expect(graduated.enabled).toBe(false);
    });

    it('graduated generation can be explicitly enabled via saved settings', () => {
      const settings = {
        sakurazaka: {
          enabled: true,
          generations: {
            二期生: true,
            三期生: true,
            四期生: true,
            卒業生: true
          }
        }
      };
      const state = createGroupStateFromSettings(structured_groups, settings);
      const sakura = state.groups.find((g) => g.id === 'sakurazaka');
      const graduated = sakura.generations.find((g) => g.name === '卒業生');
      expect(graduated.enabled).toBe(true);
    });
  });

  describe('localStorage persistence with disabledMembers', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('saves disabledMembers to localStorage', () => {
      let state = createGroupState(structured_groups);
      state = setMemberEnabled(state, 'sakurazaka', '井上 梨名', false);
      saveGroupStateToLocalStorage(state);

      const saved = JSON.parse(localStorage.getItem('karasu-group-state'));
      expect(saved.sakurazaka.disabledMembers).toEqual(['井上 梨名']);
    });

    it('does not save disabledMembers when empty', () => {
      const state = createGroupState(structured_groups);
      saveGroupStateToLocalStorage(state);

      const saved = JSON.parse(localStorage.getItem('karasu-group-state'));
      expect(saved.sakurazaka.disabledMembers).toBeUndefined();
    });

    it('loads disabledMembers from localStorage on init', () => {
      let state = createGroupState(structured_groups);
      state = setMemberEnabled(state, 'sakurazaka', '井上 梨名', false);
      saveGroupStateToLocalStorage(state);

      const newState = createGroupState(structured_groups);
      const sakura = newState.groups.find((g) => g.id === 'sakurazaka');
      expect(sakura.disabledMembers).toEqual(['井上 梨名']);
    });
  });

  describe('toggleMemberInEditGroups', () => {
    /** Helper: create editable groups with sakurazaka enabled, all gens enabled */
    function createTestGroups() {
      return createEditableGroupState(structured_groups, {
        sakurazaka: {
          enabled: true,
          generations: {
            二期生: true,
            三期生: true,
            四期生: true,
            卒業生: false
          }
        }
      });
    }

    it('disabling a member in an enabled generation adds to disabledMembers', () => {
      const groups = createTestGroups();
      const updated = toggleMemberInEditGroups(groups, 'sakurazaka', '井上 梨名', false);
      const sakura = updated.find((g) => g.id === 'sakurazaka');
      expect(sakura.disabledMembers).toContain('井上 梨名');
    });

    it('enabling a member in an enabled generation removes from disabledMembers', () => {
      let groups = createTestGroups();
      groups = toggleMemberInEditGroups(groups, 'sakurazaka', '井上 梨名', false);
      groups = toggleMemberInEditGroups(groups, 'sakurazaka', '井上 梨名', true);
      const sakura = groups.find((g) => g.id === 'sakurazaka');
      expect(sakura.disabledMembers).not.toContain('井上 梨名');
    });

    it('auto-disables generation when all its members are individually disabled', () => {
      let groups = createTestGroups();
      const sakura = groups.find((g) => g.id === 'sakurazaka');
      const gen2 = sakura.generations.find((g) => g.name === '二期生');

      for (const member of gen2.members) {
        groups = toggleMemberInEditGroups(groups, 'sakurazaka', member.fullname, false);
      }

      const updated = groups.find((g) => g.id === 'sakurazaka');
      const updatedGen2 = updated.generations.find((g) => g.name === '二期生');
      expect(updatedGen2.enabled).toBe(false);
      // disabledMembers should be cleaned up for that generation
      for (const member of gen2.members) {
        expect(updated.disabledMembers).not.toContain(member.fullname);
      }
    });

    it('enabling a member in a disabled generation auto-enables the generation', () => {
      // Start with 二期生 disabled
      const groups = createEditableGroupState(structured_groups, {
        sakurazaka: {
          enabled: true,
          generations: {
            二期生: false,
            三期生: true,
            四期生: true,
            卒業生: false
          }
        }
      });

      const updated = toggleMemberInEditGroups(groups, 'sakurazaka', '井上 梨名', true);
      const sakura = updated.find((g) => g.id === 'sakurazaka');
      const gen2 = sakura.generations.find((g) => g.name === '二期生');

      expect(gen2.enabled).toBe(true);
      expect(sakura.enabled).toBe(true);
      // The enabled member should NOT be in disabledMembers
      expect(sakura.disabledMembers).not.toContain('井上 梨名');
      // All other 二期生 members should be in disabledMembers
      const gen2Members = groups
        .find((g) => g.id === 'sakurazaka')
        .generations.find((g) => g.name === '二期生').members;
      for (const member of gen2Members) {
        if (member.fullname !== '井上 梨名') {
          expect(sakura.disabledMembers).toContain(member.fullname);
        }
      }
    });

    it('BUG FIX: re-enabling a member after generation auto-disables removes member from disabledMembers', () => {
      let groups = createTestGroups();
      const sakura = groups.find((g) => g.id === 'sakurazaka');
      const gen2 = sakura.generations.find((g) => g.name === '二期生');

      // Step 1: Disable member A (井上 梨名)
      groups = toggleMemberInEditGroups(groups, 'sakurazaka', '井上 梨名', false);
      expect(groups.find((g) => g.id === 'sakurazaka').disabledMembers).toContain('井上 梨名');

      // Step 2: Disable remaining members so generation auto-disables
      for (const member of gen2.members) {
        if (member.fullname !== '井上 梨名') {
          groups = toggleMemberInEditGroups(groups, 'sakurazaka', member.fullname, false);
        }
      }

      // Generation should be auto-disabled, disabledMembers cleaned up
      const afterAutoDisable = groups.find((g) => g.id === 'sakurazaka');
      const gen2After = afterAutoDisable.generations.find((g) => g.name === '二期生');
      expect(gen2After.enabled).toBe(false);
      expect(afterAutoDisable.disabledMembers).not.toContain('井上 梨名');

      // Step 3: Re-enable member A -> should work correctly
      groups = toggleMemberInEditGroups(groups, 'sakurazaka', '井上 梨名', true);

      const final = groups.find((g) => g.id === 'sakurazaka');
      const gen2Final = final.generations.find((g) => g.name === '二期生');

      // Generation should be re-enabled
      expect(gen2Final.enabled).toBe(true);
      // Member A should NOT be in disabledMembers (this was the bug)
      expect(final.disabledMembers).not.toContain('井上 梨名');
      // Other 二期生 members should be in disabledMembers
      for (const member of gen2.members) {
        if (member.fullname !== '井上 梨名') {
          expect(final.disabledMembers).toContain(member.fullname);
        }
      }
    });

    it('does not affect other groups', () => {
      const groups = createTestGroups();
      const updated = toggleMemberInEditGroups(groups, 'sakurazaka', '井上 梨名', false);
      const hinata = updated.find((g) => g.id === 'hinatazaka');
      expect(hinata.disabledMembers).toEqual([]);
    });

    it('returns a new array (no mutation)', () => {
      const groups = createTestGroups();
      const updated = toggleMemberInEditGroups(groups, 'sakurazaka', '井上 梨名', false);
      expect(updated).not.toBe(groups);
      // Original should be unchanged
      const originalSakura = groups.find((g) => g.id === 'sakurazaka');
      expect(originalSakura.disabledMembers).toEqual([]);
    });
  });
});
