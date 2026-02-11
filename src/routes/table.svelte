<script>
  import { groupState, cuts, editMode } from '$lib/configs.svelte';
  import {
    saveSortedPhotosToLocalStorage,
    getPhotoData,
    setPhotoData
  } from '$lib/sortedphotos.svelte';

  let { sortedPhotos } = $props();

  let activeTableGroup = $state(groupState.activeGroupId);

  let enabledGroups = $derived(groupState.groups.filter((g) => g.enabled));

  // Auto-switch to first enabled group if current group becomes disabled
  $effect(() => {
    const currentGroup = groupState.groups.find((g) => g.id === activeTableGroup);
    if (!currentGroup?.enabled && enabledGroups.length > 0) {
      activeTableGroup = enabledGroups[0].id;
    }
  });

  let activeGroupData = $derived(
    groupState.groups.find((g) => g.id === activeTableGroup)
  );

  let enabledGenerations = $derived(
    activeGroupData
      ? activeGroupData.generations.filter((g) => g.enabled)
      : []
  );

  // Determine primary theme: sakurazaka if enabled, otherwise first enabled group
  let primaryTheme = $state('sakurazaka');

  $effect(() => {
    const sakurazakaEnabled = groupState.groups.find((g) => g.id === 'sakurazaka')?.enabled;
    const result = sakurazakaEnabled
      ? 'sakurazaka'
      : groupState.groups.find((g) => g.enabled)?.id || 'sakurazaka';
    primaryTheme = result;
  });

  const increase = (groupId, memberName, cut) => () => {
    let data = getPhotoData(sortedPhotos, groupId, memberName);
    const updated = data.map((v, idx) => idx === cut ? v + 1 : v);
    setPhotoData(sortedPhotos, groupId, memberName, updated);
    saveSortedPhotosToLocalStorage(sortedPhotos);
  };

  const decrease = (groupId, memberName, cut) => () => {
    let data = getPhotoData(sortedPhotos, groupId, memberName);
    if (data[cut] < 1) {
      return;
    }
    const updated = data.map((v, idx) => idx === cut ? v - 1 : v);
    setPhotoData(sortedPhotos, groupId, memberName, updated);
    saveSortedPhotosToLocalStorage(sortedPhotos);
  };
</script>

{#if enabledGroups.length > 1}
  <div class="group-tabs mb-4">
    {#each enabledGroups as group (group.id)}
      <button
        class="tab-button"
        class:active={activeTableGroup === group.id}
        class:tab-sakurazaka={group.id === 'sakurazaka'}
        class:tab-hinatazaka={group.id === 'hinatazaka'}
        onclick={() => { activeTableGroup = group.id; }}
      >{group.name}</button>
    {/each}
  </div>
{/if}

<table
  class="table-fixed w-full text-sm md:text-base break-keep border-collapse border-2 border-gray-500"
>
  <thead class={activeTableGroup === 'sakurazaka' ? 'bg-rose-100' : 'bg-sky-100'}>
    <tr>
      <th scope="col" class="th-col">メンバー</th>
      {#each cuts as cut (cut)}
        <th scope="col" class="th-col">{cut}</th>
      {/each}
    </tr>
  </thead>
  <tbody>
    {#each enabledGenerations as generation (generation.name)}
      {#each generation.members as member (member.fullname)}
        <tr class="odd:bg-white even:bg-gray-100">
          <th scope="row" class="th-row">
            <span class="fullname">{member.fullname}</span>
            <span class="shortname">{member.shortname}</span>
          </th>
          <!-- eslint-disable-next-line -->
          {#each getPhotoData(sortedPhotos, activeTableGroup, member.fullname) as cut, i}
            <td
              ><div class="cell-layout">
                {#if editMode.enabled}
                  <button
                    class="btn-edit"
                    aria-label="increase"
                    onclick={increase(activeTableGroup, member.fullname, i)}>+</button
                  >
                {/if}
                {cut}
                {#if editMode.enabled}
                  <button
                    class="btn-edit"
                    aria-label="decrease"
                    onclick={decrease(activeTableGroup, member.fullname, i)}>-</button
                  >
                {/if}
              </div></td
            >
          {/each}
        </tr>
      {/each}
    {/each}
  </tbody>
</table>

<style>
  @import './table.css';

  .group-tabs {
    display: flex;
    gap: 0.5rem;
  }

  .tab-button {
    padding: 0.5rem 1rem;
    border: 2px solid #e5e7eb;
    border-radius: 0.5rem;
    background: white;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.15s;
  }

  .tab-button.tab-sakurazaka:hover:not(.active) {
    background: #fce7f3; /* pink-100 */
  }

  .tab-button.tab-hinatazaka:hover:not(.active) {
    background: #e0f2fe; /* sky-100 */
  }

  .tab-button.active.tab-sakurazaka {
    background: #fda4af; /* pink-300 */
    border-color: #fda4af;
    color: white;
  }

  .tab-button.active.tab-hinatazaka {
    background: #7dd3fc; /* sky-300 */
    border-color: #7dd3fc;
    color: white;
  }
</style>
