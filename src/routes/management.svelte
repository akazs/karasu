<script>
  import { editMode } from '$lib/configs.svelte';
  import { i18n, t } from '$lib/i18n/store.svelte.js';
  import {
    tablesStore,
    switchTable,
    createTable,
    deleteTableById,
    duplicateTableById
  } from '$lib/table-state.js';
  import { clearAllData } from '$lib/table-manager.js';
  import { cuts } from '$lib/configs.svelte';
  import { photosToCSV } from '$lib/csv.js';
  import { structured_groups } from '$lib/groups.js';
  import TableEditOverlay from '../components/TableEditOverlay.svelte';

  let { sortedPhotos } = $props();

  // Table management state
  let tables = $derived($tablesStore.tables);
  let activeTableId = $derived($tablesStore.activeTableId);
  let canCreateNew = $derived($tablesStore.tables.length < 10);

  // State for edit overlay
  let editingTable = $state(null);

  // State for delete confirmation
  let deletingTableId = $state(null);

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
      alert(t('alerts.maxTables'));
      return;
    }

    const tableName = prompt(t('alerts.enterTableName'), t('alerts.defaultTableName'));
    if (tableName && tableName.trim()) {
      const trimmedName = tableName.trim();
      if (trimmedName.length > 30) {
        alert(t('alerts.tableNameTooLong'));
        return;
      }
      try {
        createTable(trimmedName, ['sakurazaka', 'hinatazaka']);
      } catch (error) {
        alert(error.message);
      }
    }
  }

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
        alert(error.message);
        deletingTableId = null;
      }
    }
  }

  function cancelDelete() {
    deletingTableId = null;
  }

  function handleDuplicate(tableId) {
    try {
      duplicateTableById(tableId);
    } catch (error) {
      alert(error.message);
    }
  }

  function handleSwitchTable(tableId) {
    switchTable(tableId);
  }

  function handleExport(table) {
    const photoMap = new Map();
    for (const group of structured_groups) {
      const groupData = table.photoData[group.id] || {};
      for (const gen of group.generations) {
        for (const member of gen.members) {
          const key = `${group.id}:${member.fullname}`;
          const counts = groupData[member.fullname] || [0, 0, 0, 0];
          photoMap.set(key, counts);
        }
      }
    }

    const groups = structured_groups.map((group) => {
      const saved = table.groupSettings[group.id];
      return {
        id: group.id,
        name: group.name,
        enabled: saved?.enabled ?? true,
        generations: group.generations.map((gen) => ({
          name: gen.name,
          members: gen.members,
          enabled: saved?.generations?.[gen.name] ?? true
        }))
      };
    });

    const csv = photosToCSV(photoMap, groups, cuts(), t('table.member'));
    navigator.clipboard
      .writeText(csv)
      .then(() => {
        alert(t('alerts.csvCopied', { name: table.name }));
      })
      .catch(() => {
        alert(t('alerts.csvFailed'));
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
      {tables.length}/10 <span class="hidden md:inline">{t('management.tableCount')}</span>
      {#if !canCreateNew}
        <span class="text-red-600">{t('management.maxReached')}</span>
      {/if}
    </div>

    <!-- Table List -->
    <div class="space-y-1.5">
      {#each tables as table (table.id)}
        {@const theme = getTableTheme(table)}
        {@const isActive = table.id === activeTableId}
        {@const borderColor = isActive
          ? theme === 'sakurazaka'
            ? 'border-pink-400'
            : 'border-sky-400'
          : 'border-gray-300'}
        {@const bgColor = isActive ? (theme === 'sakurazaka' ? 'bg-pink-50' : 'bg-sky-50') : ''}
        {@const badgeColor = theme === 'sakurazaka' ? 'bg-pink-400' : 'bg-sky-400'}
        <div class="border rounded p-2.5 {borderColor} {bgColor}">
          <div class="flex items-start gap-2">
            <!-- Status Badge / Use Button (Top-Left) -->
            {#if isActive}
              <span
                class="text-xs {badgeColor} text-white px-2.5 py-2 md:py-3 rounded flex-shrink-0"
              >
                {t('management.inUse')}
              </span>
            {:else}
              <button
                onclick={() => handleSwitchTable(table.id)}
                class="px-1.5 py-0.5 text-xs bg-gray-100 rounded hover:bg-gray-200 flex-shrink-0"
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
      {/each}
    </div>
  </section>

  <!-- Edit Mode Section -->
  <section class="mb-6">
    <h2 class="text-lg font-bold mb-3">{t('management.editMode')}</h2>
    <div class="ml-2">
      <label>
        <input type="checkbox" bind:checked={editMode.enabled} />
        {t('management.editModeLabel')}
      </label>
    </div>
  </section>

  <!-- Language Settings Section -->
  <section class="mb-6">
    <h2 class="text-lg font-bold mb-3">{t('management.language')}</h2>
    <div class="ml-2 flex gap-3">
      <label class="cursor-pointer">
        <input
          type="radio"
          name="language"
          value="ja-JP"
          checked={i18n.locale === 'ja-JP'}
          onchange={() => i18n.setLocale('ja-JP')}
        />
        <span class="ml-1">{t('management.languageJa')}</span>
      </label>
      <label class="cursor-pointer">
        <input
          type="radio"
          name="language"
          value="zh-TW"
          checked={i18n.locale === 'zh-TW'}
          onchange={() => i18n.setLocale('zh-TW')}
        />
        <span class="ml-1">{t('management.languageZh')}</span>
      </label>
    </div>
  </section>

  <!-- Data Management Section -->
  <section class="mb-6">
    <h2 class="text-lg font-bold mb-3">{t('management.dataManagement')}</h2>
    <button
      class="btn-red text-center w-full"
      aria-label="clear all data"
      onclick={() => {
        if (confirm(t('alerts.confirmClearAllData'))) {
          clearAllData();
          window.location.reload();
        }
      }}>{t('management.clearAllData')}</button
    >
  </section>
</div>

<!-- Edit Overlay -->
{#if editingTable}
  <TableEditOverlay table={editingTable} {sortedPhotos} onClose={closeEditOverlay} />
{/if}

<!-- Delete Confirmation Dialog -->
{#if deletingTableId}
  {@const deletingTable = tables.find((t) => t.id === deletingTableId)}
  <div
    class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60]"
    onclick={cancelDelete}
    onkeydown={(e) => {
      if (e.key === 'Escape') cancelDelete();
    }}
    role="button"
    tabindex="-1"
  >
    <div
      class="bg-white rounded-lg p-6 max-w-md w-full mx-4"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
      role="dialog"
      aria-labelledby="delete-title"
      tabindex="0"
    >
      <h3 id="delete-title" class="text-lg font-bold mb-4 text-red-700">
        {t('management.deleteConfirmTitle')}
      </h3>
      <p class="mb-4">
        {t('alerts.confirmDeleteTablePrefix')}<strong>{deletingTable?.name}</strong>{t(
          'alerts.confirmDeleteTableSuffix'
        )}
      </p>
      <p class="text-sm text-gray-600 mb-6">
        {t('alerts.deleteWarning')}
      </p>
      <div class="flex gap-3 justify-end">
        <button onclick={cancelDelete} class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
          {t('management.cancel')}
        </button>
        <button
          onclick={confirmDelete}
          class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          {t('alerts.confirmDelete')}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  @import './buttons.css';

  .management-container {
    max-width: 900px;
  }

  /* Ensure disabled buttons look disabled */
  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
