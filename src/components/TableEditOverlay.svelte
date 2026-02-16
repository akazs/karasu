<script>
  import { untrack } from 'svelte';
  import { t } from '$lib/i18n/store.svelte.js';
  import { renameTableById, updateActiveTableGroupSettings } from '$lib/table-state.js';
  import { clearSortedPhotos } from '$lib/table-sortedphotos.svelte';
  import { structured_groups } from '$lib/groups.js';
  import { createEditableGroupState } from '$lib/group-state.js';
  import { showToast } from '$lib/toast-store.svelte.js';
  import ConfirmDialog from './ui/ConfirmDialog.svelte';

  let { table, sortedPhotos, onClose } = $props();

  // Local state for editing - capture initial values
  let newTableName = $state(untrack(() => table.name));
  let localGroupState = $state(createEditableGroupState(structured_groups, table.groupSettings));

  // State for clear table confirmation
  let clearingTable = $state(false);

  /**
   * Toggle group enabled state
   */
  function toggleGroupEnabled(groupId, enabled) {
    localGroupState = localGroupState.map((group) =>
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
    );
  }

  /**
   * Toggle generation enabled state
   */
  function toggleGenerationEnabled(groupId, genName, enabled) {
    localGroupState = localGroupState.map((group) => {
      if (group.id !== groupId) {
        return group;
      }
      const updatedGenerations = group.generations.map((gen) =>
        gen.name === genName ? { ...gen, enabled } : gen
      );
      const anyEnabled = updatedGenerations.some((gen) => gen.enabled);
      return {
        ...group,
        enabled: anyEnabled,
        generations: updatedGenerations
      };
    });
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

    // 2. Update group settings
    const newGroupSettings = {};
    for (const group of localGroupState) {
      newGroupSettings[group.id] = {
        enabled: group.enabled,
        generations: {}
      };
      for (const gen of group.generations) {
        newGroupSettings[group.id].generations[gen.name] = gen.enabled;
      }
    }
    updateActiveTableGroupSettings(newGroupSettings);

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
    clearSortedPhotos(sortedPhotos);
    clearingTable = false;
  }

  function cancelClear() {
    clearingTable = false;
  }

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
      <div class="space-y-3">
        {#each localGroupState as group (group.id)}
          <div class="border rounded p-3">
            <!-- Group Checkbox -->
            <label class="font-bold flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={group.enabled}
                onchange={(e) => toggleGroupEnabled(group.id, e.target.checked)}
                class="w-4 h-4"
              />
              <span>{group.name}</span>
            </label>

            <!-- Generation Checkboxes -->
            <div class="ml-6 mt-2 space-y-1">
              {#each group.generations as generation (generation.name)}
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={generation.enabled}
                    onchange={(e) =>
                      toggleGenerationEnabled(group.id, generation.name, e.target.checked)}
                    class="w-4 h-4"
                  />
                  <span class="text-sm">{generation.name}</span>
                </label>
              {/each}
            </div>
          </div>
        {/each}
      </div>
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
