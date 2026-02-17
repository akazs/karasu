<script>
  import { untrack } from 'svelte';
  import { t, tGenerationName } from '$lib/i18n/store.svelte.js';
  import {
    renameTableById,
    updateTableGroupSettingsById,
    clearTablePhotoData
  } from '$lib/table-state.js';
  import { structured_groups } from '$lib/groups.js';
  import { createEditableGroupState, toggleMemberInEditGroups } from '$lib/group-state.js';
  import { showToast } from '$lib/toast-store.svelte.js';
  import ConfirmDialog from './ui/ConfirmDialog.svelte';

  let { table, onClose } = $props();

  // Local state for editing - capture initial values
  let newTableName = $state(untrack(() => table.name));
  let localGroupState = $state(createEditableGroupState(structured_groups, table.groupSettings));

  // State for clear table confirmation
  let clearingTable = $state(false);

  // State for selected group in radio button UI
  let selectedGroupId = $state(
    untrack(() =>
      localGroupState.find((g) => g.enabled)?.id || localGroupState[0]?.id || 'sakurazaka'
    )
  );

  // Track which generations have their member list expanded
  let expandedGenerations = $state({});

  // Initialize: Ensure only the selected group is enabled (radio button semantics)
  untrack(() => {
    localGroupState = localGroupState.map((group) => {
      if (group.id === selectedGroupId) {
        // Keep the selected group and its current generation settings
        return {
          ...group,
          enabled: true
        };
      } else {
        // Disable all other groups and their generations
        return {
          ...group,
          enabled: false,
          generations: group.generations.map((gen) => ({ ...gen, enabled: false }))
        };
      }
    });
  });

  /**
   * Switch selected group (radio button handler)
   * Enables all generations of the newly selected group and disables all others
   */
  function switchSelectedGroup(groupId) {
    localGroupState = localGroupState.map((group) => {
      if (group.id === groupId) {
        // Enable this group and all its generations, clear disabled members
        return {
          ...group,
          enabled: true,
          disabledMembers: [],
          generations: group.generations.map((gen) => ({ ...gen, enabled: true }))
        };
      } else {
        // Disable this group and all its generations
        return {
          ...group,
          enabled: false,
          generations: group.generations.map((gen) => ({ ...gen, enabled: false }))
        };
      }
    });

    selectedGroupId = groupId;
    expandedGenerations = {};
  }

  /**
   * Toggle generation enabled state
   */
  function toggleGenerationEnabled(genName, enabled) {
    localGroupState = localGroupState.map((group) => {
      if (group.id !== selectedGroupId) {
        return group;
      }
      const updatedGenerations = group.generations.map((gen) =>
        gen.name === genName ? { ...gen, enabled } : gen
      );
      const anyEnabled = updatedGenerations.some((gen) => gen.enabled);

      // When enabling a generation, clear disabled members for that generation
      let updatedDisabledMembers = group.disabledMembers || [];
      if (enabled) {
        const gen = group.generations.find((g) => g.name === genName);
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
    });
  }

  /**
   * Toggle individual member enabled state.
   * Delegates to the extracted pure function in group-state.js.
   */
  function toggleMemberEnabled(fullname, enabled) {
    localGroupState = toggleMemberInEditGroups(localGroupState, selectedGroupId, fullname, enabled);
  }

  /**
   * Toggle expanded state for a generation's member list
   */
  function toggleGenerationExpanded(genName) {
    expandedGenerations = {
      ...expandedGenerations,
      [genName]: !expandedGenerations[genName]
    };
  }

  /**
   * Save all changes
   */
  function saveChanges() {
    // 1. Update table name if changed
    if (newTableName.trim() && newTableName.trim() !== table.name) {
      try {
        renameTableById(table.id, newTableName.trim());
      } catch (error) {
        showToast(error.message, 'error');
        return;
      }
    }

    // 2. Update group settings for THIS specific table
    const newGroupSettings = {};
    for (const group of localGroupState) {
      newGroupSettings[group.id] = {
        enabled: group.enabled,
        generations: {}
      };
      for (const gen of group.generations) {
        newGroupSettings[group.id].generations[gen.name] = gen.enabled;
      }
      if (group.disabledMembers && group.disabledMembers.length > 0) {
        newGroupSettings[group.id].disabledMembers = [...group.disabledMembers];
      }
    }
    updateTableGroupSettingsById(table.id, newGroupSettings);

    // 3. Close overlay
    onClose();
  }

  /**
   * Clear table data
   */
  function clearTable() {
    clearingTable = true;
  }

  function confirmClear() {
    clearTablePhotoData(table.id);
    clearingTable = false;
  }

  function cancelClear() {
    clearingTable = false;
  }

  /**
   * Compute indeterminate state per generation.
   * A generation is indeterminate when it's enabled but some members are disabled.
   */
  let generationIndeterminate = $derived.by(() => {
    const selectedGroup = localGroupState.find((g) => g.id === selectedGroupId);
    if (!selectedGroup) return {};
    const disabledSet = new Set(selectedGroup.disabledMembers || []);
    const result = {};
    for (const gen of selectedGroup.generations) {
      if (!gen.enabled || !gen.members) {
        result[gen.name] = false;
        continue;
      }
      const hasDisabled = gen.members.some((m) => disabledSet.has(m.fullname));
      const hasEnabled = gen.members.some((m) => !disabledSet.has(m.fullname));
      result[gen.name] = hasDisabled && hasEnabled;
    }
    return result;
  });

  /**
   * Check if save should be disabled
   */
  let canSave = $derived(newTableName.trim().length > 0);
</script>

<!-- Overlay Backdrop -->
<div
  class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60]"
  onclick={onClose}
  onkeydown={(e) => {
    if (e.key === 'Escape') onClose();
  }}
  role="button"
  tabindex="-1"
>
  <!-- Dialog Box -->
  <div
    class="bg-white rounded-lg p-6 max-w-xl w-full mx-4 max-h-[90vh] overflow-y-auto relative"
    onclick={(e) => e.stopPropagation()}
    onkeydown={(e) => e.stopPropagation()}
    role="dialog"
    aria-labelledby="edit-title"
    tabindex="0"
  >
    <!-- Close Button -->
    <button
      onclick={onClose}
      class="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
      aria-label="Close"
      title={t('management.cancel')}
    >
      <svg
        class="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M6 18L18 6M6 6l12 12"
        ></path>
      </svg>
    </button>

    <!-- Header -->
    <h2 id="edit-title" class="text-lg font-bold mb-4 pr-8">
      {t('management.editButton')} - {table.name}
    </h2>

    <!-- Section 1: Table Name -->
    <div class="mb-6">
      <label for="table-name-input" class="block text-sm font-medium mb-2"
        >{t('management.tableName')}</label
      >
      <div class="-ml-1 mr-0.5">
        <input
          id="table-name-input"
          type="text"
          bind:value={newTableName}
          class="block min-w-0 px-3 py-3 text-base border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          style="width: 100%; text-align: left;"
          placeholder={t('management.tableName')}
          maxlength="30"
          autocomplete="off"
          autocorrect="off"
          autocapitalize="off"
          spellcheck="false"
          data-form-type="other"
          data-lpignore="true"
          data-1p-ignore="true"
          data-bwignore="true"
          onkeydown={(e) => {
            if (e.key === 'Enter' && canSave) saveChanges();
            if (e.key === 'Escape') onClose();
          }}
        />
      </div>
      <p class="text-xs text-gray-500 mt-1">{newTableName.length}/30</p>
    </div>

    <!-- Section 2: Group Selection -->
    <div class="mb-6">
      <h3 class="text-sm font-medium mb-3">{t('management.groupSelection')}</h3>

      <!-- Group Radio Buttons - Horizontal Layout -->
      <div class="flex gap-4 mb-4">
        {#each localGroupState as group (group.id)}
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="selectedGroup"
              value={group.id}
              checked={selectedGroupId === group.id}
              onchange={() => switchSelectedGroup(group.id)}
              class="w-4 h-4"
            />
            <span class="font-medium">{group.name}</span>
          </label>
        {/each}
      </div>

      <!-- Generation Checkboxes for Selected Group -->
      {#if localGroupState.find((g) => g.id === selectedGroupId)}
        {@const selectedGroup = localGroupState.find((g) => g.id === selectedGroupId)}
        {@const disabledSet = new Set(selectedGroup.disabledMembers || [])}
        <div class="border rounded p-3 bg-gray-50">
          <div class="space-y-2">
            {#each selectedGroup.generations as generation (generation.name)}
              <div>
                <div class="flex items-center gap-1">
                  <label class="flex items-center gap-2 cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      checked={generation.enabled}
                      indeterminate={generationIndeterminate[generation.name] || false}
                      onchange={(e) => toggleGenerationEnabled(generation.name, e.target.checked)}
                      class="w-4 h-4"
                    />
                    <span class="text-sm">{tGenerationName(generation.name)}</span>
                  </label>
                  {#if generation.members}
                    <button
                      type="button"
                      onclick={() => toggleGenerationExpanded(generation.name)}
                      class="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label={t('management.memberSelection')}
                      title={t('management.memberSelection')}
                    >
                      <svg
                        class="w-4 h-4 transition-transform {expandedGenerations[generation.name]
                          ? 'rotate-90'
                          : ''}"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M9 5l7 7-7 7"
                        ></path>
                      </svg>
                    </button>
                  {/if}
                </div>
                {#if generation.members && expandedGenerations[generation.name]}
                  <div class="ml-6 mt-1 space-y-1">
                    {#each generation.members as member (member.fullname)}
                      <label class="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={generation.enabled && !disabledSet.has(member.fullname)}
                          onchange={(e) =>
                            toggleMemberEnabled(member.fullname, e.target.checked)}
                          class="w-3.5 h-3.5"
                        />
                        <span class="text-xs">{member.fullname}</span>
                      </label>
                    {/each}
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>

    <!-- Section 3: Danger Zone -->
    <div class="mb-6 border border-red-200 rounded p-4 bg-red-50">
      <h3 class="text-sm font-medium text-red-700 mb-2">
        {t('management.dataManagement')}
      </h3>
      <button
        class="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        onclick={clearTable}
      >
        {t('management.clearCurrentTable')}
      </button>
    </div>

    <!-- Actions -->
    <div class="flex gap-3 justify-end">
      <button
        onclick={onClose}
        class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
      >
        {t('management.cancel')}
      </button>
      <button
        onclick={saveChanges}
        disabled={!canSave}
        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {t('management.save')}
      </button>
    </div>
  </div>
</div>

<!-- Clear Table Confirmation Dialog -->
{#if clearingTable}
  <ConfirmDialog
    isOpen={true}
    title={t('management.clearCurrentTable')}
    message={t('alerts.confirmClearCurrentTable')}
    confirmText={t('alerts.confirmDelete')}
    cancelText={t('management.cancel')}
    onConfirm={confirmClear}
    onCancel={cancelClear}
    variant="danger"
  />
{/if}
