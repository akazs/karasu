<script>
  import {
    tablesStore,
    renameTableById,
    deleteTableById,
    duplicateTableById,
    canCreate
  } from '$lib/table-state.js';
  import { cuts } from '$lib/configs.svelte';
  import { photosToCSV } from '$lib/csv.js';
  import { structured_groups } from '$lib/groups.js';

  let { onClose } = $props();

  let tables = $derived($tablesStore.tables);
  let activeTableId = $derived($tablesStore.activeTableId);
  let canCreateNew = $derived($tablesStore.tables.length < 10);

  // State for rename dialog
  let renamingTableId = $state(null);
  let newTableName = $state('');

  // State for delete confirmation
  let deletingTableId = $state(null);

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

  function handleExport(table) {
    // Convert table's photoData to SvelteMap format for CSV export
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

    // Convert groupSettings to groups array format
    const groups = structured_groups.map(group => {
      const saved = table.groupSettings[group.id];
      return {
        id: group.id,
        name: group.name,
        enabled: saved?.enabled ?? true,
        generations: group.generations.map(gen => ({
          name: gen.name,
          members: gen.members,
          enabled: saved?.generations?.[gen.name] ?? true
        }))
      };
    });

    const csv = photosToCSV(photoMap, groups, cuts);
    navigator.clipboard.writeText(csv)
      .then(() => {
        alert(`「${table.name}」のCSVをクリップボードにコピーしました`);
      })
      .catch(() => {
        alert('CSVのコピーに失敗しました');
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

<!-- Modal Overlay -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
  onclick={onClose}
  role="button"
  tabindex="-1"
>
  <!-- Modal Content -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
    onclick={(e) => e.stopPropagation()}
    role="dialog"
    aria-labelledby="modal-title"
    tabindex="0"
  >
    <div class="flex items-center justify-between mb-4">
      <h2 id="modal-title" class="text-xl font-bold">テーブル管理</h2>
      <button
        onclick={onClose}
        class="text-gray-500 hover:text-gray-700 text-2xl leading-none"
        aria-label="閉じる"
      >
        ×
      </button>
    </div>

    <div class="mb-4 text-sm text-gray-600">
      {tables.length}/10 テーブル
      {#if !canCreateNew}
        <span class="text-red-600">（最大数に達しました）</span>
      {/if}
    </div>

    <!-- Table List -->
    <div class="space-y-2">
      {#each tables as table (table.id)}
        <div
          class="border rounded-lg p-4 {table.id === activeTableId ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1 min-w-0">
              {#if renamingTableId === table.id}
                <!-- Rename Input -->
                <div class="flex gap-2 mb-2">
                  <input
                    type="text"
                    bind:value={newTableName}
                    class="flex-1 px-3 py-1 border rounded"
                    placeholder="テーブル名"
                    maxlength="30"
                    onkeydown={(e) => {
                      if (e.key === 'Enter') confirmRename();
                      if (e.key === 'Escape') cancelRename();
                    }}
                    autofocus
                  />
                  <button
                    onclick={confirmRename}
                    class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    disabled={!newTableName.trim()}
                  >
                    保存
                  </button>
                  <button
                    onclick={cancelRename}
                    class="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    キャンセル
                  </button>
                </div>
              {:else}
                <!-- Table Name -->
                <div class="font-semibold text-lg mb-1 truncate" title={table.name}>
                  {table.name}
                  {#if table.id === activeTableId}
                    <span class="text-xs bg-blue-500 text-white px-2 py-0.5 rounded ml-2">
                      使用中
                    </span>
                  {/if}
                </div>
              {/if}

              <!-- Table Metadata -->
              <div class="text-xs text-gray-600 space-y-0.5">
                <div>作成: {formatDate(table.createdAt)}</div>
                <div>更新: {formatDate(table.lastModified)}</div>
              </div>
            </div>

            <!-- Action Buttons -->
            {#if renamingTableId !== table.id}
              <div class="flex flex-col gap-2 flex-shrink-0">
                <button
                  onclick={() => startRename(table)}
                  class="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
                  title="名前変更"
                >
                  ✏️ 名前変更
                </button>
                <button
                  onclick={() => handleDuplicate(table.id)}
                  class="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
                  title="複製"
                  disabled={!canCreateNew}
                >
                  📋 複製
                </button>
                <button
                  onclick={() => handleExport(table)}
                  class="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
                  title="CSVエクスポート"
                >
                  📤 CSV
                </button>
                <button
                  onclick={() => startDelete(table.id)}
                  class="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                  title="削除"
                  disabled={tables.length === 1}
                >
                  🗑️ 削除
                </button>
              </div>
            {/if}
          </div>
        </div>
      {/each}
    </div>

    <!-- Close Button -->
    <div class="mt-6 flex justify-end">
      <button
        onclick={onClose}
        class="px-6 py-2 bg-gray-200 rounded hover:bg-gray-300"
      >
        閉じる
      </button>
    </div>
  </div>
</div>

<!-- Delete Confirmation Dialog -->
{#if deletingTableId}
  {@const deletingTable = tables.find(t => t.id === deletingTableId)}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60]"
    onclick={cancelDelete}
    role="button"
    tabindex="-1"
  >
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="bg-white rounded-lg p-6 max-w-md w-full mx-4"
      onclick={(e) => e.stopPropagation()}
      role="dialog"
      aria-labelledby="delete-title"
      tabindex="0"
    >
      <h3 id="delete-title" class="text-lg font-bold mb-4 text-red-700">⚠️ 削除の確認</h3>
      <p class="mb-4">
        テーブル「<strong>{deletingTable?.name}</strong>」を削除してもよろしいですか？
      </p>
      <p class="text-sm text-gray-600 mb-6">
        この操作は取り消せません。すべての写真カウントとグループ設定が失われます。
      </p>
      <div class="flex gap-3 justify-end">
        <button
          onclick={cancelDelete}
          class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          キャンセル
        </button>
        <button
          onclick={confirmDelete}
          class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          削除する
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Ensure disabled buttons look disabled */
  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
