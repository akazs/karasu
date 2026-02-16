<script>
  import { t } from '$lib/i18n/store.svelte.js';
  import { cuts, editMode } from '$lib/configs.svelte';
  import { getPhotoData, setPhotoData } from '$lib/table-sortedphotos.svelte';
  import { getBgClass } from '$lib/theme-utils.js';

  let { sortedPhotos, groupState } = $props();

  let enabledGroups = $derived(groupState.groups.filter((g) => g.enabled));

  // Track active table group locally - initialized via effect
  let activeTableGroup = $state('sakurazaka');

  // Initialize and auto-switch to first enabled group if current group becomes disabled
  $effect(() => {
    const currentGroup = groupState.groups.find((g) => g.id === activeTableGroup);
    if (!currentGroup?.enabled && enabledGroups.length > 0) {
      activeTableGroup = enabledGroups[0].id;
    } else if (!activeTableGroup && enabledGroups.length > 0) {
      // Initial setup
      activeTableGroup = enabledGroups[0].id;
    }
  });

  let activeGroupData = $derived(groupState.groups.find((g) => g.id === activeTableGroup));

  let disabledMemberSet = $derived(
    activeGroupData ? new Set(activeGroupData.disabledMembers || []) : new Set()
  );

  let enabledGenerations = $derived(
    activeGroupData ? activeGroupData.generations.filter((g) => g.enabled) : []
  );

  const increase = (groupId, memberName, cut) => () => {
    let data = getPhotoData(sortedPhotos, groupId, memberName);
    const updated = data.map((v, idx) => (idx === cut ? v + 1 : v));
    setPhotoData(sortedPhotos, groupId, memberName, updated);
  };

  const decrease = (groupId, memberName, cut) => () => {
    let data = getPhotoData(sortedPhotos, groupId, memberName);
    if (data[cut] < 1) {
      return;
    }
    const updated = data.map((v, idx) => (idx === cut ? v - 1 : v));
    setPhotoData(sortedPhotos, groupId, memberName, updated);
  };

  const toggleEditMode = () => {
    editMode.enabled = !editMode.enabled;
  };
</script>

<!-- Edit Mode Toggle Container -->
<div class="flex items-center justify-between mb-4">
  <!-- Group tabs or spacer -->
  {#if enabledGroups.length > 1}
    <div class="group-tabs">
      {#each enabledGroups as group (group.id)}
        <button
          class="tab-button"
          class:active={activeTableGroup === group.id}
          class:tab-sakurazaka={group.id === 'sakurazaka'}
          class:tab-hinatazaka={group.id === 'hinatazaka'}
          onclick={() => {
            activeTableGroup = group.id;
          }}>{group.name}</button
        >
      {/each}
    </div>
  {:else}
    <div></div>
  {/if}

  <!-- Edit mode toggle with auto-save message -->
  <div class="flex items-center gap-2">
    {#if editMode.enabled}
      <span class="text-xs text-gray-600" role="status"
        >{t('table.autoSaveMessage')}</span
      >
    {/if}
    <button
      onclick={toggleEditMode}
      class="px-3 py-1.5 text-sm rounded border transition-colors {editMode.enabled
        ? activeTableGroup === 'sakurazaka'
          ? 'bg-pink-300 hover:bg-pink-400 border-pink-400 text-white'
          : 'bg-sky-300 hover:bg-sky-400 border-sky-400 text-white'
        : 'bg-gray-100 hover:bg-gray-200 border-gray-300'}"
      aria-label={editMode.enabled ? t('table.endEditButton') : t('table.editButton')}
    >
      {editMode.enabled ? t('table.endEditButton') : t('table.editButton')}
    </button>
  </div>
</div>

<table
  class="table-fixed w-full text-sm md:text-base break-keep border-collapse border-2 border-gray-500"
>
  <thead class={getBgClass(activeTableGroup, 'lighter')}>
    <tr>
      <th scope="col" class="th-col">{t('table.member')}</th>
      {#each cuts() as cut (cut)}
        <th scope="col" class="th-col">{cut}</th>
      {/each}
    </tr>
  </thead>
  <tbody>
    {#each enabledGenerations as generation (generation.name)}
      {#each generation.members.filter((m) => !disabledMemberSet.has(m.fullname)) as member (member.fullname)}
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
