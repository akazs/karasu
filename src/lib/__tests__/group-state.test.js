import { describe, it, expect, beforeEach } from 'vitest';
import {
  createGroupState,
  setGroupEnabled,
  setGenerationEnabled,
  getEnabledGenerations,
  getActiveGroupId,
  setActiveGroupId,
  countEnabledMembers,
  saveGroupStateToLocalStorage,
  createGroupStateFromSettings,
  createEditableGroupState
} from '../group-state.js';
import { structured_groups } from '../groups.js';

describe('group-state', () => {
  describe('createGroupState', () => {
    it('creates state from structured_groups with all groups enabled', () => {
      const state = createGroupState(structured_groups);
      expect(state.groups.length).toBe(structured_groups.length);
      for (const group of state.groups) {
        expect(group.enabled).toBe(true);
        for (const gen of group.generations) {
          expect(gen.enabled).toBe(true);
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

    it('disabling all generations auto-disables the group', () => {
      let state = createGroupState(structured_groups);
      state = setGenerationEnabled(state, 'sakurazaka', '二期生', false);
      state = setGenerationEnabled(state, 'sakurazaka', '三期生', false);
      state = setGenerationEnabled(state, 'sakurazaka', '四期生', false);
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
    it('returns all generations when all enabled', () => {
      const state = createGroupState(structured_groups);
      const gens = getEnabledGenerations(state, 'sakurazaka');
      expect(gens.length).toBe(3);
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
    });

    it('should merge with localStorage state first, then apply custom settings', () => {
      // Set localStorage state
      localStorage.setItem(
        'karasu-group-state',
        JSON.stringify({
          sakurazaka: {
            enabled: true,
            generations: {
              二期生: true,
              三期生: false
            }
          }
        })
      );

      // Custom settings should override localStorage
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
      // 三期生 not in custom settings, should use localStorage value
      expect(sanKisei.enabled).toBe(false);
    });

    it('should handle empty saved settings', () => {
      const state = createGroupStateFromSettings(structured_groups, {});

      // Should fall back to localStorage or defaults
      expect(state).toHaveProperty('groups');
      expect(state).toHaveProperty('activeGroupId');
    });

    it('should handle null saved settings', () => {
      const state = createGroupStateFromSettings(structured_groups, null);

      expect(state).toHaveProperty('groups');
      expect(state).toHaveProperty('activeGroupId');
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

    it('should only include id, name, enabled fields (not members)', () => {
      const result = createEditableGroupState(structured_groups, {});

      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('enabled');
      expect(result[0]).toHaveProperty('generations');
      expect(result[0].generations[0]).toHaveProperty('name');
      expect(result[0].generations[0]).toHaveProperty('enabled');
      expect(result[0].generations[0]).not.toHaveProperty('members');
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
  });
});
