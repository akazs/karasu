<script>
  import {
    tablesStore,
    switchTable,
    createTable,
    canCreate
  } from '$lib/table-state.js';
  import TableManagerModal from './table-manager-modal.svelte';

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

    const tableName = prompt('テーブル名を入力してください (最大30文字):', '新しいテーブル');
    if (tableName && tableName.trim()) {
      const trimmedName = tableName.trim();
      if (trimmedName.length > 30) {
        alert('テーブル名は30文字以内で入力してください。');
        return;
      }
      try {
        createTable(trimmedName, ['sakurazaka', 'hinatazaka']);
      } catch (error) {
        alert(error.message);
      }
    }
  }

  function openManageModal() {
    showManageModal = true;
  }

  function closeManageModal() {
    showManageModal = false;
  }

  // Keyboard shortcuts
  function handleKeydown(event) {
    // Cmd/Ctrl + K to toggle manage modal
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault();
      showManageModal = !showManageModal;
    }
    // Escape to close modal
    if (event.key === 'Escape' && showManageModal) {
      closeManageModal();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="table-switcher">
  <div class="flex items-center gap-2">
    <select
      value={activeTableId}
      onchange={handleSwitchTable}
      class="px-3 py-2 border rounded"
      title={tables.find(t => t.id === activeTableId)?.name || ''}
    >
      {#each tables as table (table.id)}
        <option value={table.id} title={table.name}>{table.name}</option>
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
      class="px-3 py-2 border rounded hover:bg-gray-100 flex items-center gap-1"
      title="テーブル管理 (Ctrl+K)"
    >
      ⚙️
      <span class="text-xs text-gray-500 hidden md:inline">Ctrl+K</span>
    </button>

    <span class="text-sm text-gray-600">
      {tables.length}/10 テーブル
    </span>
  </div>
</div>

{#if showManageModal}
  <TableManagerModal onClose={closeManageModal} />
{/if}

<style>
  .table-switcher {
    padding: 1rem;
    border-bottom: 1px solid #e0e0e0;
    background-color: #f9f9f9;
  }
</style>
