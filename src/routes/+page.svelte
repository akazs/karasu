<script>
  import { t } from '$lib/i18n/store.svelte.js';
  import { activeTableStore, updateActiveTableGroupSettings } from '$lib/table-state.js';
  import {
    loadSortedPhotosFromActiveTable,
    saveSortedPhotosToActiveTable
  } from '$lib/table-sortedphotos.svelte';
  import { createGroupState } from '$lib/group-state.js';
  import { structured_groups } from '$lib/groups.js';
  import { debounce } from '$lib/debounce.js';
  import Management from './management.svelte';
  import Sorter from './sorter.svelte';
  import Table from './table.svelte';
  import Utils from './utils.svelte';
  import Instruction from './instruction.svelte';

  // Debounced save functions for better performance
  const debouncedSavePhotos = debounce((photos) => {
    saveSortedPhotosToActiveTable(photos);
  }, 500);

  const debouncedSaveGroupSettings = debounce((settings) => {
    updateActiveTableGroupSettings(settings);
  }, 500);

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

  // Auto-save sortedPhotos when it changes (debounced, but not during loading)
  $effect(() => {
    // Touch sortedPhotos to establish reactivity
    sortedPhotos.size;
    if (!isLoading) {
      debouncedSavePhotos(sortedPhotos);
    }
  });

  // Auto-save groupState when it changes (debounced, but not during loading)
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
      debouncedSaveGroupSettings(savedSettings);
    }
  });

  let tabs = $derived([
    {
      id: 'management',
      name: t('app.tabs.management'),
      component: Management,
      props: { sortedPhotos, groupState }
    },
    {
      id: 'sorter',
      name: t('app.tabs.sorter'),
      component: Sorter,
      props: { sortedPhotos, groupState }
    },
    {
      id: 'results',
      name: t('app.tabs.results'),
      component: Table,
      props: { sortedPhotos, groupState }
    },
    {
      id: 'utils',
      name: t('app.tabs.utils'),
      component: Utils,
      props: { groupState }
    },
    {
      id: 'help',
      name: t('app.tabs.help'),
      component: Instruction,
      props: {}
    }
  ]);

  let activeTab = $state('management');
  const handleClick = (tabId) => () => (activeTab = tabId);

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

<ul>
  {#each tabs as tab (tab.id)}
    <li
      class:active={activeTab == tab.id}
      class:active-sakurazaka={activeTab == tab.id && primaryTheme === 'sakurazaka'}
      class:active-hinatazaka={activeTab == tab.id && primaryTheme === 'hinatazaka'}
    >
      <button class="tab" onclick={handleClick(tab.id)}>{tab.name}</button>
    </li>
  {/each}
</ul>

{#each tabs as tab (tab.id)}
  {#if activeTab == tab.id}
    {@const Component = tab.component}
    <div class="box p-4 md:p-9">
      <Component {...tab.props} />
    </div>
  {/if}
{/each}

<style>
  @import './tabs.css';
</style>
