<script>
  import {
    tablesStore,
    switchTable,
    createTable,
    canCreate
  } from '$lib/table-state.js';

  // Subscribe to tables store using $ prefix
  let tables = $derived($tablesStore.tables);
  let activeTableId = $derived($tablesStore.activeTableId);
  let canCreateNew = $derived(canCreate());

  // Modal state
  let showManageModal = $state(false);

  function handleSwitchTable(event) {
    const newTableId = event.target.value;
    switchTable(newTableId);
  }

  function handleCreateNew() {
    if (!canCreateNew) {
      alert('最大10個のテーブルに達しました。新しいテーブルを作成するには、既存のテーブルを削除してください。');
      return;
    }

    const tableName = prompt('テーブル名を入力してください:', '新しいテーブル');
    if (tableName) {
      createTable(tableName, ['sakurazaka', 'hinatazaka']);
    }
  }

  function openManageModal() {
    showManageModal = true;
  }

  function closeManageModal() {
    showManageModal = false;
  }
</script>

<div class="table-switcher">
  <div class="flex items-center gap-2">
    <select
      value={activeTableId}
      onchange={handleSwitchTable}
      class="px-3 py-2 border rounded"
    >
      {#each tables as table (table.id)}
        <option value={table.id}>{table.name}</option>
      {/each}
    </select>

    <button
      onclick={handleCreateNew}
      disabled={!canCreateNew}
      class="px-3 py-2 border rounded {canCreateNew ? 'hover:bg-gray-100' : 'opacity-50 cursor-not-allowed'}"
      title={canCreateNew ? '新しいテーブルを作成' : '最大10個のテーブルに達しました'}
    >
      + 新規
    </button>

    <button
      onclick={openManageModal}
      class="px-3 py-2 border rounded hover:bg-gray-100"
      title="テーブル管理"
    >
      ⚙️
    </button>

    <span class="text-sm text-gray-600">
      {tables.length}/10 テーブル
    </span>
  </div>
</div>

{#if showManageModal}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    onclick={closeManageModal}
    role="button"
    tabindex="-1"
  >
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="bg-white rounded-lg p-6 max-w-md w-full mx-4"
      onclick={(e) => e.stopPropagation()}
      role="dialog"
      aria-labelledby="manage-modal-title"
      tabindex="0"
    >
      <h2 id="manage-modal-title" class="text-xl font-bold mb-4">テーブル管理</h2>
      <p class="text-gray-600 mb-4">
        テーブル管理機能は次のフェーズで実装予定です。
      </p>
      <button
        onclick={closeManageModal}
        class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
      >
        閉じる
      </button>
    </div>
  </div>
{/if}

<style>
  .table-switcher {
    padding: 1rem;
    border-bottom: 1px solid #e0e0e0;
    background-color: #f9f9f9;
  }
</style>
