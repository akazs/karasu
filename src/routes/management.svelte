<script>
  import { editMode } from '$lib/configs.svelte';
  import { i18n, t } from '$lib/i18n/store.svelte.js';
  import { clearSortedPhotos } from '$lib/table-sortedphotos.svelte';
  import { setGroupEnabled, setGenerationEnabled } from '$lib/group-state.js';
  import {
    tablesStore,
    switchTable,
    createTable,
    renameTableById,
    deleteTableById,
    duplicateTableById
  } from '$lib/table-state.js';
  import { clearAllData } from '$lib/table-manager.js';
  import { cuts } from '$lib/configs.svelte';
  import { photosToCSV } from '$lib/csv.js';
  import { structured_groups } from '$lib/groups.js';

  let { sortedPhotos, groupState } = $props();

  // Table management state
  let tables = $derived($tablesStore.tables);
  let activeTableId = $derived($tablesStore.activeTableId);
  let canCreateNew = $derived($tablesStore.tables.length < 10);

  // State for rename dialog
  let renamingTableId = $state(null);
  let newTableName = $state('');

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

  function startRename(table) {
    renamingTableId = table.id;
    newTableName = table.name;
  }

  function confirmRename() {
    if (newTableName.trim() && renamingTableId) {
      try {
        renameTableById(renamingTableId, newTableName.trim());
        renamingTableId = null;
        newTableName = '';
      } catch (error) {
        alert(error.message);
      }
    }
  }

  function cancelRename() {
    renamingTableId = null;
    newTableName = '';
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

  function toggleGroupEnabled(groupId, enabled) {
    const newState = setGroupEnabled(groupState, groupId, enabled);
    groupState.groups = newState.groups;
  }

  function toggleGenerationEnabled(groupId, genName, enabled) {
    const newState = setGenerationEnabled(groupState, groupId, genName, enabled);
    groupState.groups = newState.groups;
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
            {#if renamingTableId !== table.id}
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
            {/if}

            <!-- Table Info (Middle) -->
            <div class="flex-1 min-w-0">
              {#if renamingTableId === table.id}
                <!-- Rename Input -->
                <div class="flex gap-1.5">
                  <input
                    type="text"
                    bind:value={newTableName}
                    class="flex-1 px-2 py-1 text-sm border rounded"
                    placeholder={t('management.tableName')}
                    maxlength="30"
                    onkeydown={(e) => {
                      if (e.key === 'Enter') confirmRename();
                      if (e.key === 'Escape') cancelRename();
                    }}
                    autofocus
                  />
                  <button
                    onclick={confirmRename}
                    class="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                    disabled={!newTableName.trim()}
                  >
                    {t('management.save')}
                  </button>
                  <button
                    onclick={cancelRename}
                    class="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
                  >
                    {t('management.cancel')}
                  </button>
                </div>
              {:else}
                <!-- Table Name -->
                <div class="font-medium text-sm mb-0.5 truncate" title={table.name}>
                  {table.name}
                </div>
                <!-- Table Metadata -->
                <div class="text-xs text-gray-500">
                  {t('management.updated')}: {formatDate(table.lastModified)}
                </div>
              {/if}
            </div>

            <!-- Action Buttons (Right) -->
            {#if renamingTableId !== table.id}
              <div class="flex flex-col md:flex-row gap-1 flex-shrink-0">
                <button
                  onclick={() => startRename(table)}
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
            {/if}
          </div>
        </div>
      {/each}
    </div>
  </section>

  <!-- Group Selection Section -->
  <section class="mb-6">
    <h2 class="text-lg font-bold mb-3">{t('management.groupSelection')}</h2>
    {#each groupState.groups as group (group.id)}
      <div class="my-3 ml-2">
        <label class="font-bold">
          <input
            type="checkbox"
            checked={group.enabled}
            onchange={(e) => toggleGroupEnabled(group.id, e.target.checked)}
          />
          {group.name}
        </label>
        <div class="ml-6">
          {#each group.generations as generation (generation.name)}
            <label class="block">
              <input
                type="checkbox"
                checked={generation.enabled}
                onchange={(e) =>
                  toggleGenerationEnabled(group.id, generation.name, e.target.checked)}
              />
              {generation.name}
            </label>
          {/each}
        </div>
      </div>
    {/each}
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
    <div class="flex flex-col gap-3">
      <button
        class="btn-red text-center"
        aria-label="clear current table"
        onclick={() => {
          if (confirm(t('alerts.confirmClearCurrentTable'))) {
            clearSortedPhotos(sortedPhotos);
          }
        }}>{t('management.clearCurrentTable')}</button
      >
      <button
        class="btn-red text-center"
        aria-label="clear all data"
        onclick={() => {
          if (confirm(t('alerts.confirmClearAllData'))) {
            clearAllData();
            window.location.reload();
          }
        }}>{t('management.clearAllData')}</button
      >
    </div>
  </section>
</div>

<!-- Delete Confirmation Dialog -->
{#if deletingTableId}
  {@const deletingTable = tables.find((t) => t.id === deletingTableId)}
  <div
    class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60]"
    onclick={cancelDelete}
    role="button"
    tabindex="-1"
  >
    <div
      class="bg-white rounded-lg p-6 max-w-md w-full mx-4"
      onclick={(e) => e.stopPropagation()}
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
