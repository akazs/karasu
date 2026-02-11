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
    console.error('Failed to load group state from localStorage:', error);
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
      return {
        ...group,
        enabled: anyEnabled,
        generations: updatedGenerations
      };
    })
  };
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
    for (const gen of group.generations) {
      if (!gen.enabled) {
        continue;
      }
      count += gen.members.length;
    }
  }
  return count;
}
