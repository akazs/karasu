<script>
  import { SvelteMap } from 'svelte/reactivity';
  import Sorter from './Sorter.svelte';
  import Table from './Table.svelte';
  import Utils from './Utils.svelte';

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
  {#each tabs as tab}
    <li class={activeTab == tab.name ? 'active' : ''}>
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <span onclick={handleClick(tab.name)}>{tab.name}</span>
    </li>
  {/each}
</ul>

{#each tabs as tab}
  {#if activeTab == tab.name}
    {@const Component = tab.component}
    <div class="box">
      <Component sortedPhotos={tab.props} />
    </div>
  {/if}
{/each}

<style>
  .box {
    margin-bottom: 10px;
    padding: 40px;
    border: 1px solid #dee2e6;
    border-radius: 0 0 0.5rem 0.5rem;
    border-top: 0;
  }

  ul {
    display: flex;
    flex-wrap: wrap;
    padding-left: 0;
    margin-bottom: 0;
    list-style: none;
    border-bottom: 1px solid #dee2e6;
  }

  li {
    margin-bottom: -1px;
  }

  span {
    border: 1px solid transparent;
    border-top-left-radius: 0.25rem;
    border-top-right-radius: 0.25rem;
    display: block;
    padding: 0.5rem 1rem;
    cursor: pointer;
  }

  span:hover {
    border-color: #e9ecef #e9ecef #dee2e6;
  }

  li.active > span {
    color: #495057;
    background-color: #f19db5;
    border-color: #dee2e6 #dee2e6 #fff;
  }
</style>
