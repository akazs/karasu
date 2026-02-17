/**
 * Group state management with immutable updates.
 * Pure logic module -- no Svelte dependencies.
 * All functions return new state objects (no mutation).
 */

const GROUP_STATE_KEY = 'karasu-group-state';

/**
 * Save group enabled state to localStorage.
 * @param {object} state
 */
export function saveGroupStateToLocalStorage(state) {
  const savedState = {};
  for (const group of state.groups) {
    savedState[group.id] = {
      enabled: group.enabled,
      generations: {}
    };
    for (const gen of group.generations) {
      savedState[group.id].generations[gen.name] = gen.enabled;
    }
    if (group.disabledMembers && group.disabledMembers.length > 0) {
      savedState[group.id].disabledMembers = [...group.disabledMembers];
    }
  }
  localStorage.setItem(GROUP_STATE_KEY, JSON.stringify(savedState));
}

/**
 * Load group enabled state from localStorage.
 * @returns {object|null}
 */
export function loadGroupStateFromLocalStorage() {
  try {
    const saved = localStorage.getItem(GROUP_STATE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Failed to load group state from localStorage:', error);
    }
    return null;
  }
}

/**
 * Create initial group state from structured_groups config.
 * Merges with saved state from localStorage if available.
 * @param {Array} groups - Frozen group config from groups.js
 * @returns {{groups: Array, activeGroupId: string}}
 */
export function createGroupState(groups) {
  const savedState = loadGroupStateFromLocalStorage();

  return {
    activeGroupId: groups.length > 0 ? groups[0].id : '',
    groups: groups.map((group) => {
      const savedGroup = savedState?.[group.id];
      return {
        id: group.id,
        name: group.name,
        enabled: savedGroup?.enabled ?? group.enabled,
        disabledMembers: savedGroup?.disabledMembers ?? [],
        generations: group.generations.map((gen) => ({
          name: gen.name,
          members: gen.members,
          enabled: savedGroup?.generations?.[gen.name] ?? gen.enabled
        }))
      };
    })
  };
}

/**
 * Enable or disable a group (cascades to all generations).
 * Returns a new state object.
 * @param {object} state
 * @param {string} groupId
 * @param {boolean} enabled
 * @returns {object}
 */
export function setGroupEnabled(state, groupId, enabled) {
  return {
    ...state,
    groups: state.groups.map((group) =>
      group.id === groupId
        ? {
            ...group,
            enabled,
            disabledMembers: enabled ? [] : group.disabledMembers,
            generations: group.generations.map((gen) => ({
              ...gen,
              enabled
            }))
          }
        : group
    )
  };
}

/**
 * Enable or disable a single generation within a group.
 * Auto-updates the parent group enabled state:
 * - If all generations become disabled, the group becomes disabled
 * - If any generation becomes enabled, the group becomes enabled
 * Returns a new state object.
 * @param {object} state
 * @param {string} groupId
 * @param {string} generationName
 * @param {boolean} enabled
 * @returns {object}
 */
export function setGenerationEnabled(state, groupId, generationName, enabled) {
  return {
    ...state,
    groups: state.groups.map((group) => {
      if (group.id !== groupId) {
        return group;
      }
      const updatedGenerations = group.generations.map((gen) =>
        gen.name === generationName ? { ...gen, enabled } : gen
      );
      const anyEnabled = updatedGenerations.some((gen) => gen.enabled);

      // When enabling a generation, clear disabledMembers for that generation's members
      let updatedDisabledMembers = group.disabledMembers || [];
      if (enabled) {
        const gen = group.generations.find((g) => g.name === generationName);
        if (gen && gen.members) {
          const genMemberNames = new Set(gen.members.map((m) => m.fullname));
          updatedDisabledMembers = updatedDisabledMembers.filter(
            (name) => !genMemberNames.has(name)
          );
        }
      }

      return {
        ...group,
        enabled: anyEnabled,
        disabledMembers: updatedDisabledMembers,
        generations: updatedGenerations
      };
    })
  };
}

/**
 * Enable or disable a single member within a group.
 * Uses the disabledMembers array (opt-in exclusion pattern).
 * Returns a new state object.
 * @param {object} state
 * @param {string} groupId
 * @param {string} fullname
 * @param {boolean} enabled
 * @returns {object}
 */
export function setMemberEnabled(state, groupId, fullname, enabled) {
  return {
    ...state,
    groups: state.groups.map((group) => {
      if (group.id !== groupId) {
        return group;
      }
      const currentDisabled = group.disabledMembers || [];
      const updatedDisabledMembers = enabled
        ? currentDisabled.filter((name) => name !== fullname)
        : currentDisabled.includes(fullname)
          ? currentDisabled
          : [...currentDisabled, fullname];
      return {
        ...group,
        disabledMembers: updatedDisabledMembers
      };
    })
  };
}

/**
 * Check if a member is enabled (not in the disabledMembers list).
 * @param {object} state
 * @param {string} groupId
 * @param {string} fullname
 * @returns {boolean}
 */
export function isMemberEnabled(state, groupId, fullname) {
  const group = state.groups.find((g) => g.id === groupId);
  if (!group) {
    return false;
  }
  const disabledMembers = group.disabledMembers || [];
  return !disabledMembers.includes(fullname);
}

/**
 * Get all enabled generations for a group.
 * @param {object} state
 * @param {string} groupId
 * @returns {Array}
 */
export function getEnabledGenerations(state, groupId) {
  const group = state.groups.find((g) => g.id === groupId);
  if (!group) {
    return [];
  }
  return group.generations.filter((gen) => gen.enabled);
}

/**
 * Get the active group id.
 * @param {object} state
 * @returns {string}
 */
export function getActiveGroupId(state) {
  return state.activeGroupId;
}

/**
 * Set the active group id. Returns a new state object.
 * @param {object} state
 * @param {string} groupId
 * @returns {object}
 */
export function setActiveGroupId(state, groupId) {
  return {
    ...state,
    activeGroupId: groupId
  };
}

/**
 * Count total enabled members across all enabled groups/generations.
 * @param {object} state
 * @returns {number}
 */
export function countEnabledMembers(state) {
  let count = 0;
  for (const group of state.groups) {
    if (!group.enabled) {
      continue;
    }
    const disabledSet = new Set(group.disabledMembers || []);
    for (const gen of group.generations) {
      if (!gen.enabled) {
        continue;
      }
      for (const member of gen.members) {
        if (!disabledSet.has(member.fullname)) {
          count += 1;
        }
      }
    }
  }
  return count;
}

/**
 * Create a default group state purely from config (no localStorage).
 * Used as the base for table-specific settings to ensure per-table isolation.
 * @param {Array} groups - Frozen group config from groups.js
 * @returns {{groups: Array, activeGroupId: string}}
 */
function createDefaultGroupState(groups) {
  return {
    activeGroupId: groups.length > 0 ? groups[0].id : '',
    groups: groups.map((group) => ({
      id: group.id,
      name: group.name,
      enabled: true,
      disabledMembers: [],
      generations: group.generations.map((gen) => ({
        name: gen.name,
        members: gen.members,
        enabled: gen.enabled
      }))
    }))
  };
}

/**
 * Create group state from custom saved settings (e.g., from table-specific settings).
 * Builds base state from config defaults only (no localStorage), then overlays
 * table-specific settings on top to ensure per-table isolation.
 * @param {Array} groups - Frozen group config from groups.js
 * @param {object} savedSettings - Custom settings object (e.g., from table.groupSettings)
 * @returns {{groups: Array, activeGroupId: string}}
 */
export function createGroupStateFromSettings(groups, savedSettings) {
  const baseState = createDefaultGroupState(groups);
  const settings = savedSettings || {};

  return {
    ...baseState,
    groups: baseState.groups.map((group) => {
      const saved = settings[group.id];
      if (!saved) {
        return {
          ...group,
          enabled: false,
          disabledMembers: [],
          generations: group.generations.map((gen) => ({
            ...gen,
            enabled: false
          }))
        };
      }

      return {
        ...group,
        enabled: saved.enabled ?? group.enabled,
        disabledMembers: saved.disabledMembers ?? [],
        generations: group.generations.map((gen) => ({
          ...gen,
          enabled: saved.generations?.[gen.name] ?? gen.enabled
        }))
      };
    })
  };
}

/**
 * Create an editable group state array from custom saved settings.
 * Used for table edit overlays where only group/generation structure is needed.
 * Returns an array of groups (not the full state object with activeGroupId).
 * @param {Array} groups - Frozen group config from groups.js
 * @param {object} savedSettings - Custom settings object (e.g., from table.groupSettings)
 * @returns {Array} Array of group objects
 */
export function createEditableGroupState(groups, savedSettings) {
  return groups.map((group) => {
    const savedGroup = savedSettings[group.id];
    // If the group has no saved settings at all, default to disabled.
    // This ensures that when a table is created with only specific groups
    // (e.g., ['sakurazaka']), omitted groups start as disabled.
    const groupHasSettings = savedGroup !== undefined;
    const defaultEnabled = groupHasSettings;
    return {
      id: group.id,
      name: group.name,
      enabled: savedGroup?.enabled ?? defaultEnabled,
      disabledMembers: savedGroup?.disabledMembers ?? [],
      generations: group.generations.map((gen) => ({
        name: gen.name,
        members: gen.members,
        enabled: savedGroup?.generations?.[gen.name] ?? (defaultEnabled && gen.enabled)
      }))
    };
  });
}
