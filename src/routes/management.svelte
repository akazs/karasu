<script>
  import { t } from '$lib/i18n/store.svelte.js';
  import {
    tablesStore,
    switchTable,
    createTable,
    deleteTableById,
    duplicateTableById
  } from '$lib/table-state.js';
  import { cuts } from '$lib/configs.svelte';
  import { photosToCSV } from '$lib/csv.js';
  import { structured_groups } from '$lib/groups.js';
  import { photoDataToMap } from '$lib/table-photo-converter.js';
  import { createGroupStateFromSettings } from '$lib/group-state.js';
  import { getBorderClass, getBgClass, getBadgeClass } from '$lib/theme-utils.js';
  import { showToast } from '$lib/toast-store.svelte.js';
  import TableEditOverlay from '../components/TableEditOverlay.svelte';
  import ConfirmDialog from '../components/ui/ConfirmDialog.svelte';

  // Table management state
  let tables = $derived($tablesStore.tables);
  let activeTableId = $derived($tablesStore.activeTableId);
  let canCreateNew = $derived($tablesStore.tables.length < 10);

  // State for edit overlay
  let editingTable = $state(null);

  // State for delete confirmation
  let deletingTableId = $state(null);

  // State for inline table creation
  let creatingNewTable = $state(false);
  let newTableName = $state('');
  let newTableInputRef = $state(null);

  // State for inline table copying
  let copyingTableId = $state(null);
  let copyTableName = $state('');
  let copyTableInputRef = $state(null);

  // Determine theme for a table based on its group settings
  function getTableTheme(table) {
    const sakurazakaEnabled = table.groupSettings?.sakurazaka?.enabled ?? true;
    const hinataEnabled = table.groupSettings?.hinatazaka?.enabled ?? true;

    if (sakurazakaEnabled && !hinataEnabled) return 'sakurazaka';
    if (!sakurazakaEnabled && hinataEnabled) return 'hinatazaka';
    return 'sakurazaka'; // Default or both enabled
  }

  function handleCreateNew() {
    if (!canCreateNew) {
      return;
    }

    creatingNewTable = true;
    newTableName = t('alerts.defaultTableName');
  }

  function handleSaveNewTable() {
    const trimmedName = newTableName.trim();

    if (!trimmedName) {
      showToast(t('alerts.tableNameRequired'), 'error');
      return;
    }

    if (trimmedName.length > 30) {
      showToast(t('alerts.tableNameTooLong'), 'error');
      return;
    }

    try {
      createTable(trimmedName, ['sakurazaka']);
      creatingNewTable = false;
      newTableName = '';
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  function handleCancelNewTable() {
    creatingNewTable = false;
    newTableName = '';
  }

  // Auto-focus input when creating new table
  $effect(() => {
    if (creatingNewTable && newTableInputRef) {
      newTableInputRef.focus();
      newTableInputRef.select();
      newTableInputRef.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });

  // Auto-focus input when copying table
  $effect(() => {
    if (copyingTableId && copyTableInputRef) {
      copyTableInputRef.focus();
      copyTableInputRef.select();
      copyTableInputRef.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });

  function openEditOverlay(table) {
    editingTable = table;
  }

  function closeEditOverlay() {
    editingTable = null;
  }

  function startDelete(tableId) {
    deletingTableId = tableId;
  }

  function confirmDelete() {
    if (deletingTableId) {
      try {
        deleteTableById(deletingTableId);
        deletingTableId = null;
      } catch (error) {
        showToast(error.message, 'error');
        deletingTableId = null;
      }
    }
  }

  function cancelDelete() {
    deletingTableId = null;
  }

  function handleDuplicate(tableId) {
    if (!canCreateNew) {
      return;
    }

    const table = tables.find((t) => t.id === tableId);
    if (!table) {
      return;
    }

    copyingTableId = tableId;
    copyTableName = table.name;
  }

  function handleSaveCopy() {
    const trimmedName = copyTableName.trim();

    if (!trimmedName) {
      showToast(t('alerts.tableNameRequired'), 'error');
      return;
    }

    if (trimmedName.length > 30) {
      showToast(t('alerts.tableNameTooLong'), 'error');
      return;
    }

    try {
      duplicateTableById(copyingTableId, {
        name: trimmedName,
        switchToNew: false,
        insertAfterSource: true
      });
      copyingTableId = null;
      copyTableName = '';
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  function handleCancelCopy() {
    copyingTableId = null;
    copyTableName = '';
  }

  function handleSwitchTable(tableId) {
    switchTable(tableId);
  }

  function handleExport(table) {
    // Reuse utilities to convert photoData and groupSettings
    const photoMap = photoDataToMap(table.photoData, structured_groups);
    const groupState = createGroupStateFromSettings(structured_groups, table.groupSettings);
    const groups = groupState.groups;

    const csv = photosToCSV(photoMap, groups, cuts(), t('table.member'));
    navigator.clipboard
      .writeText(csv)
      .then(() => {
        showToast(t('alerts.csvCopied', { name: table.name }), 'success');
      })
      .catch(() => {
        showToast(t('alerts.csvFailed'), 'error');
      });
  }

  function formatDate(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
</script>

<div class="management-container">
  <!-- Table Management Section -->
  <section class="mb-6">
    <div class="flex items-center justify-between mb-3">
      <h2 class="text-lg font-bold">{t('management.title')}</h2>
      <button
        onclick={handleCreateNew}
        disabled={!canCreateNew}
        class="px-3 py-2 border rounded {canCreateNew
          ? 'bg-blue-500 text-white hover:bg-blue-600'
          : 'opacity-50 cursor-not-allowed bg-gray-200'}"
        title={canCreateNew ? t('management.newTable') : t('alerts.maxTables')}
      >
        + <span class="hidden md:inline">{t('management.newTableShort')}</span>
      </button>
    </div>

    <div class="mb-4 text-sm text-gray-600">
      <span>{t('management.tableCount')}:</span>
      {tables.length}/10
      {#if !canCreateNew}
        <span class="text-red-600">{t('management.maxReached')}</span>
      {/if}
    </div>

    <!-- Table List -->
    <div class="space-y-1.5">
      {#each tables as table (table.id)}
        {@const theme = getTableTheme(table)}
        {@const isActive = table.id === activeTableId}
        {@const borderColor = isActive ? getBorderClass(theme) : 'border-gray-300'}
        {@const bgColor = isActive ? getBgClass(theme) : ''}
        {@const badgeColor = getBadgeClass(theme)}
        <div class="border rounded p-2.5 {borderColor} {bgColor}">
          <div class="flex items-start gap-2">
            <!-- Status Badge / Use Button (Top-Left) -->
            {#if isActive}
              <span
                class="text-xs {badgeColor} text-white px-2.5 py-2 md:py-3 rounded flex-shrink-0 min-w-17 text-center"
              >
                {t('management.inUse')}
              </span>
            {:else}
              <button
                onclick={() => handleSwitchTable(table.id)}
                class="px-2.5 py-2 md:py-3 text-xs bg-gray-100 rounded hover:bg-gray-200 flex-shrink-0 min-w-17 text-center"
                title={t('management.switchTooltip')}
              >
                {t('management.switchButton')}
              </button>
            {/if}

            <!-- Table Info (Middle) -->
            <div class="flex-1 min-w-0">
              <!-- Table Name -->
              <div class="font-medium text-sm mb-0.5 truncate" title={table.name}>
                {table.name}
              </div>
              <!-- Table Metadata -->
              <div class="text-xs text-gray-500">
                {t('management.updated')}: {formatDate(table.lastModified)}
              </div>
            </div>

            <!-- Action Buttons (Right) -->
            <div class="flex flex-col md:flex-row gap-1 flex-shrink-0">
              <button
                onclick={() => openEditOverlay(table)}
                class="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200 md:w-16"
                title={t('management.renameTooltip')}
              >
                {t('management.editButton')}
              </button>
              <button
                onclick={() => handleDuplicate(table.id)}
                class="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200 md:w-16"
                title={t('management.duplicateTooltip')}
                disabled={!canCreateNew}
              >
                {t('management.copyButton')}
              </button>
              <button
                onclick={() => handleExport(table)}
                class="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200 md:w-16"
                title={t('management.csvTooltip')}
              >
                {t('management.csvButton')}
              </button>
              <button
                onclick={() => startDelete(table.id)}
                class="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 md:w-16"
                title={t('management.deleteTooltip')}
                disabled={tables.length === 1}
              >
                {t('management.deleteButton')}
              </button>
            </div>
          </div>
        </div>

        <!-- Inline Copy Table UI (shown right after source table) -->
        {#if copyingTableId === table.id}
          <div class="border rounded p-2.5 border-blue-400 bg-blue-50">
            <div class="flex flex-col md:flex-row md:items-center gap-2">
              <span
                class="text-xs bg-blue-500 text-white px-2.5 py-2 md:py-3 rounded flex-shrink-0 min-w-17 text-center self-start"
              >
                {t('management.copying')}
              </span>
              <input
                bind:this={copyTableInputRef}
                bind:value={copyTableName}
                type="text"
                maxlength="30"
                class="!w-full md:flex-1 !mx-0 !text-left px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('alerts.enterTableName')}
                onkeydown={(e) => {
                  if (e.key === 'Enter') handleSaveCopy();
                  if (e.key === 'Escape') handleCancelCopy();
                }}
              />
              <div class="flex gap-2 flex-shrink-0 self-end md:self-auto">
                <button
                  onclick={handleSaveCopy}
                  class="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  {t('management.save')}
                </button>
                <button
                  onclick={handleCancelCopy}
                  class="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200"
                >
                  {t('management.cancel')}
                </button>
              </div>
            </div>
          </div>
        {/if}
      {/each}

      <!-- Inline Create Table UI -->
      {#if creatingNewTable}
        <div class="border rounded p-2.5 border-blue-400 bg-blue-50">
          <div class="flex flex-col md:flex-row md:items-center gap-2">
            <span
              class="text-xs bg-blue-500 text-white px-2.5 py-2 md:py-3 rounded flex-shrink-0 min-w-17 text-center self-start"
            >
              {t('management.creating')}
            </span>
            <input
              bind:this={newTableInputRef}
              bind:value={newTableName}
              type="text"
              maxlength="30"
              class="!w-full md:flex-1 !mx-0 !text-left px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t('alerts.enterTableName')}
              onkeydown={(e) => {
                if (e.key === 'Enter') handleSaveNewTable();
                if (e.key === 'Escape') handleCancelNewTable();
              }}
            />
            <div class="flex gap-2 flex-shrink-0 self-end md:self-auto">
              <button
                onclick={handleSaveNewTable}
                class="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                {t('management.save')}
              </button>
              <button
                onclick={handleCancelNewTable}
                class="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200"
              >
                {t('management.cancel')}
              </button>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </section>
</div>

<!-- Edit Overlay -->
{#if editingTable}
  <TableEditOverlay table={editingTable} onClose={closeEditOverlay} />
{/if}

<!-- Delete Confirmation Dialog -->
{#if deletingTableId}
  {@const deletingTable = tables.find((t) => t.id === deletingTableId)}
  {@const deleteMessage = `${t('alerts.confirmDeleteTablePrefix')}${deletingTable?.name}${t('alerts.confirmDeleteTableSuffix')}\n\n${t('alerts.deleteWarning')}`}
  <ConfirmDialog
    isOpen={true}
    title={t('management.deleteConfirmTitle')}
    message={deleteMessage}
    confirmText={t('alerts.confirmDelete')}
    cancelText={t('management.cancel')}
    onConfirm={confirmDelete}
    onCancel={cancelDelete}
    variant="danger"
  />
{/if}

<style>
  @import './buttons.css';

  /* Ensure disabled buttons look disabled */
  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
