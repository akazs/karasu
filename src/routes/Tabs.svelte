<script>
  export let tabs = [];
  export let activeTab = '';

  const handleClick = (tabName) => () => (activeTab = tabName);
</script>

<ul>
  {#each tabs as tab}
    <li class={activeTab === tab.Name ? 'active' : ''}>
      <button onclick={handleClick(tab.Name)}>{tab.Name}</button>
    </li>
  {/each}
</ul>

{#each tabs as tab}
  {#if activeTab == tab.Name}
    <div class="box">
      <svelte:component this={tab.component} />
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

  button {
    border: 1px solid transparent;
    border-top-left-radius: 0.25rem;
    border-top-right-radius: 0.25rem;
    display: block;
    padding: 0.5rem 1rem;
    cursor: pointer;
  }

  button:hover {
    border-color: #e9ecef #e9ecef #dee2e6;
  }

  li.active > button {
    color: #495057;
    background-color: #fff;
    border-color: #dee2e6 #dee2e6 #fff;
  }
</style>
