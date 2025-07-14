<script>
  import { SvelteMap } from 'svelte/reactivity';
  import Sorter from './sorter.svelte';
  import Table from './table.svelte';
  import Utils from './utils.svelte';

  let sortedPhotos = new SvelteMap();

  let tabs = [
    {
      name: '集計',
      component: Sorter,
      props: sortedPhotos
    },
    {
      name: '結果',
      component: Table,
      props: sortedPhotos
    },
    {
      name: 'その他',
      component: Utils,
      props: sortedPhotos
    }
  ];
  let activeTab = $state('集計');
  const handleClick = (tabName) => () => (activeTab = tabName);
</script>

<ul>
  {#each tabs as tab (tab.name)}
    <li class={activeTab == tab.name ? 'active' : ''}>
      <button class="tab" onclick={handleClick(tab.name)}>{tab.name}</button>
    </li>
  {/each}
</ul>

{#each tabs as tab (tab.name)}
  {#if activeTab == tab.name}
    {@const Component = tab.component}
    <div class="box p-4 md:p-9">
      <Component sortedPhotos={tab.props} />
    </div>
  {/if}
{/each}

<style>
  @import './tabs.css';
</style>
