<script>
  import {
    getTablesState,
    getActiveTableData,
    updateActiveTableGroupSettings
  } from '$lib/table-state.svelte';
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

  // Load sortedPhotos from active table
  let sortedPhotos = loadSortedPhotosFromActiveTable();

  // Get active table
  let activeTable = $derived(getActiveTableData());

  // Initialize groupState from active table's groupSettings
  // This is mutable so child components can modify it
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

  // Auto-save sortedPhotos when it changes
  $effect(() => {
    // Touch sortedPhotos to establish reactivity
    const size = sortedPhotos.size;
    saveSortedPhotosToActiveTable(sortedPhotos);
  });

  // Auto-save groupState when it changes
  $effect(() => {
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
