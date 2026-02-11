<script>
  import { loadSortedPhotosFromLocalStorageOrNew } from '$lib/sortedphotos.svelte';
  import { groupState } from '$lib/configs.svelte';
  import Sorter from './sorter.svelte';
  import Table from './table.svelte';
  import Utils from './utils.svelte';
  import Instruction from './instruction.svelte';

  let sortedPhotos = loadSortedPhotosFromLocalStorageOrNew();

  let tabs = [
    {
      name: '集計',
      component: Sorter,
      props: { sortedPhotos: sortedPhotos }
    },
    {
      name: '結果',
      component: Table,
      props: { sortedPhotos: sortedPhotos }
    },
    {
      name: 'その他',
      component: Utils,
      props: { sortedPhotos: sortedPhotos }
    },
    {
      name: 'ヘルプ',
      component: Instruction,
      props: {}
    }
  ];
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

<ul>
  {#each tabs as tab (tab.name)}
    <li class:active={activeTab == tab.name} class:active-sakurazaka={activeTab == tab.name && primaryTheme === 'sakurazaka'} class:active-hinatazaka={activeTab == tab.name && primaryTheme === 'hinatazaka'}>
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
