<script>
  import { t } from '$lib/i18n/store.svelte.js';
  import { activeTableStore, updateTableGroupSettingsById } from '$lib/table-state.js';
  import { loadSortedPhotosFromActiveTable } from '$lib/table-sortedphotos.svelte';
  import { createGroupStateFromSettings } from '$lib/group-state.js';
  import { structured_groups } from '$lib/groups.js';
  import { debounce } from '$lib/debounce.js';
  import { getTabActiveClass } from '$lib/theme-utils.js';
  import Management from './management.svelte';
  import Sorter from './sorter.svelte';
  import Table from './table.svelte';
  import Utils from './utils.svelte';
  import Settings from './settings.svelte';
  import Instruction from './instruction.svelte';
  import ToastContainer from '../components/ui/ToastContainer.svelte';

  // Debounced save functions for better performance
  // Captures tableId at call time to prevent cross-table race conditions
  const debouncedSaveGroupSettings = debounce((tableId, settings) => {
    updateTableGroupSettingsById(tableId, settings);
  }, 500);

  // Initialize sortedPhotos and groupState from active table
  let sortedPhotos = $state(loadSortedPhotosFromActiveTable());

  let groupState = $state(
    createGroupStateFromSettings(structured_groups, $activeTableStore?.groupSettings || {})
  );

  // Track if we're currently loading to prevent save during load
  let isLoading = $state(false);
  let currentTableId = $state($activeTableStore?.id);

  // Track groupSettings separately to detect changes without watching entire table
  let currentGroupSettings = $state(JSON.stringify($activeTableStore?.groupSettings || {}));

  // Reload sortedPhotos and groupState when active table changes
  $effect(() => {
    const tableId = $activeTableStore?.id;
    if (tableId && tableId !== currentTableId) {
      // Flush any pending save for the previous table before switching
      debouncedSaveGroupSettings.flush();
      isLoading = true;
      currentTableId = tableId;
      currentGroupSettings = JSON.stringify($activeTableStore?.groupSettings || {});

      // Reload sortedPhotos from the new active table
      sortedPhotos = loadSortedPhotosFromActiveTable();
      // Reload groupState from the new active table
      groupState = createGroupStateFromSettings(
        structured_groups,
        $activeTableStore?.groupSettings || {}
      );

      // Use setTimeout to defer setting isLoading to false
      setTimeout(() => {
        isLoading = false;
      }, 0);
    }
  });

  // Reload groupState when groupSettings change (but not on other table updates)
  $effect(() => {
    const newSettings = JSON.stringify($activeTableStore?.groupSettings || {});
    if (!isLoading && newSettings !== currentGroupSettings) {
      currentGroupSettings = newSettings;
      groupState = createGroupStateFromSettings(
        structured_groups,
        $activeTableStore?.groupSettings || {}
      );
    }
  });

  // Auto-save groupState when it changes (debounced, but not during loading)
  // Captures currentTableId at call time to prevent cross-table race conditions
  // Note: sortedPhotos are saved directly in setPhotoData(), so no auto-save effect needed
  $effect(() => {
    if (!isLoading) {
      const tableId = currentTableId;
      const savedSettings = {};
      for (const group of groupState.groups) {
        savedSettings[group.id] = {
          enabled: group.enabled,
          generations: {}
        };
        for (const gen of group.generations) {
          savedSettings[group.id].generations[gen.name] = gen.enabled;
        }
        if (group.disabledMembers && group.disabledMembers.length > 0) {
          savedSettings[group.id].disabledMembers = [...group.disabledMembers];
        }
      }
      debouncedSaveGroupSettings(tableId, savedSettings);
    }
  });

  let tabs = $derived([
    {
      id: 'management',
      name: t('app.tabs.management'),
      component: Management,
      props: {}
    },
    {
      id: 'sorter',
      name: t('app.tabs.sorter'),
      component: Sorter,
      props: { sortedPhotos, groupState }
    },
    {
      id: 'table',
      name: t('app.tabs.table'),
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
      id: 'settings',
      name: t('app.tabs.settings'),
      component: Settings,
      props: {}
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
      class={activeTab == tab.id ? getTabActiveClass(primaryTheme) : ''}
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

<ToastContainer />

<style>
  @import './tabs.css';
</style>
