<script>
  import {
    tablesStore,
    activeTableStore,
    updateActiveTableGroupSettings
  } from '$lib/table-state.js';
  import {
    loadSortedPhotosFromActiveTable,
    saveSortedPhotosToActiveTable
  } from '$lib/table-sortedphotos.svelte';
  import { createGroupState } from '$lib/group-state.js';
  import { structured_groups } from '$lib/groups.js';
  import TableSwitcher from './table-switcher.svelte';
  import Sorter from './sorter.svelte';
  import Table from './table.svelte';
  import Utils from './utils.svelte';
  import Instruction from './instruction.svelte';

  // Subscribe to active table store
  let activeTable = $derived($activeTableStore);

  // Initialize sortedPhotos and groupState from active table
  let sortedPhotos = $state(loadSortedPhotosFromActiveTable());

  function initializeGroupState() {
    const baseState = createGroupState(structured_groups);
    const savedSettings = activeTable?.groupSettings || {};

    return {
      ...baseState,
      groups: baseState.groups.map((group) => {
        const saved = savedSettings[group.id];
        if (!saved) {
          return group;
        }

        return {
          ...group,
          enabled: saved.enabled ?? group.enabled,
          generations: group.generations.map((gen) => ({
            ...gen,
            enabled: saved.generations?.[gen.name] ?? gen.enabled
          }))
        };
      })
    };
  }

  let groupState = $state(initializeGroupState());

  // Track if we're currently loading to prevent save during load
  let isLoading = $state(false);
  let currentTableId = $state($activeTableStore?.id);

  // Reload sortedPhotos and groupState when active table changes
  $effect(() => {
    const tableId = $activeTableStore?.id;
    if (tableId && tableId !== currentTableId) {
      isLoading = true;
      currentTableId = tableId;

      // Reload sortedPhotos from the new active table
      sortedPhotos = loadSortedPhotosFromActiveTable();
      // Reload groupState from the new active table
      groupState = initializeGroupState();

      // Use setTimeout to defer setting isLoading to false
      setTimeout(() => {
        isLoading = false;
      }, 0);
    }
  });

  // Auto-save sortedPhotos when it changes (but not during loading)
  $effect(() => {
    // Touch sortedPhotos to establish reactivity
    const size = sortedPhotos.size;
    if (!isLoading) {
      saveSortedPhotosToActiveTable(sortedPhotos);
    }
  });

  // Auto-save groupState when it changes (but not during loading)
  $effect(() => {
    if (!isLoading) {
      const savedSettings = {};
      for (const group of groupState.groups) {
        savedSettings[group.id] = {
          enabled: group.enabled,
          generations: {}
        };
        for (const gen of group.generations) {
          savedSettings[group.id].generations[gen.name] = gen.enabled;
        }
      }
      updateActiveTableGroupSettings(savedSettings);
    }
  });

  let tabs = $derived([
    {
      name: '集計',
      component: Sorter,
      props: { sortedPhotos, groupState }
    },
    {
      name: '結果',
      component: Table,
      props: { sortedPhotos, groupState }
    },
    {
      name: 'その他',
      component: Utils,
      props: { sortedPhotos, groupState }
    },
    {
      name: 'ヘルプ',
      component: Instruction,
      props: {}
    }
  ]);

  let activeTab = $state('集計');
  const handleClick = (tabName) => () => (activeTab = tabName);

  // Determine primary theme: sakurazaka if enabled, otherwise first enabled group
  let primaryTheme = $state('sakurazaka');

  $effect(() => {
    const sakurazakaEnabled = groupState.groups.find((g) => g.id === 'sakurazaka')?.enabled;
    const result = sakurazakaEnabled
      ? 'sakurazaka'
      : groupState.groups.find((g) => g.enabled)?.id || 'sakurazaka';
    primaryTheme = result;
  });
</script>

<TableSwitcher />

<ul>
  {#each tabs as tab (tab.name)}
    <li
      class:active={activeTab == tab.name}
      class:active-sakurazaka={activeTab == tab.name && primaryTheme === 'sakurazaka'}
      class:active-hinatazaka={activeTab == tab.name && primaryTheme === 'hinatazaka'}
    >
      <button class="tab" onclick={handleClick(tab.name)}>{tab.name}</button>
    </li>
  {/each}
</ul>

{#each tabs as tab (tab.name)}
  {#if activeTab == tab.name}
    {@const Component = tab.component}
    <div class="box p-4 md:p-9">
      <Component {...tab.props} />
    </div>
  {/if}
{/each}

<style>
  @import './tabs.css';
</style>
