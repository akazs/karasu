<script module>
  import { structured_groups } from './groups.js';
  import { createGroupState } from './group-state.js';
  import { CUTS, STORAGE_KEY } from './storage.js';

  // Reactive group state (mutable via Svelte 5 $state)
  export let groupState = $state(createGroupState(structured_groups));

  // Backward-compatible: returns generations for the active group.
  // Exported as a function since $derived cannot be exported from module scripts.
  export function getActiveGenerations() {
    const activeGroup = groupState.groups.find((g) => g.id === groupState.activeGroupId);
    return activeGroup ? activeGroup.generations : [];
  }

  // Returns the primary theme group ID based on enabled groups.
  // Defaults to sakurazaka if enabled, otherwise first enabled group.
  export function getPrimaryThemeGroup() {
    const sakurazaka = groupState.groups.find((g) => g.id === 'sakurazaka');
    if (sakurazaka?.enabled) {
      return 'sakurazaka';
    }
    const firstEnabled = groupState.groups.find((g) => g.enabled);
    return firstEnabled?.id || 'sakurazaka';
  }

  export const cuts = CUTS;
  export const sortedPhotosKey = STORAGE_KEY;
  export let editMode = $state({ enabled: false });
</script>
