<script>
  import { groupState, cuts } from '$lib/configs.svelte';
  import {
    saveSortedPhotosToLocalStorage,
    getPhotoData,
    setPhotoData
  } from '$lib/sortedphotos.svelte';

  let { sortedPhotos } = $props();

  let currentState = $state(0);
  let selectedGroupId = $state('');
  let selectedGeneration = $state('');
  let selectedMember = $state('');

  // Determine enabled groups
  let enabledGroups = $derived(groupState.groups.filter((g) => g.enabled));
  let oneGroupMode = $derived(enabledGroups.length === 1);

  // If only one group, auto-select it
  $effect(() => {
    if (oneGroupMode && currentState === 0) {
      selectedGroupId = enabledGroups[0].id;
      currentState = 1;
    }
  });

  // Determine enabled generations for the selected group
  let selectedGroupData = $derived(
    groupState.groups.find((g) => g.id === selectedGroupId)
  );
  let enabledGenerations = $derived(
    selectedGroupData
      ? selectedGroupData.generations.filter((g) => g.enabled)
      : []
  );
  let oneGenerationMode = $derived(enabledGenerations.length === 1);

  // If only one generation, auto-select it
  $effect(() => {
    if (oneGenerationMode && currentState === 1) {
      selectedGeneration = enabledGenerations[0].name;
      currentState = 2;
    }
  });

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

{#if currentState % 4 === 0}
  <div class="grid gap-2 md:gap-4">
    {#each enabledGroups as group (group.id)}
      <button
        class={group.id === 'sakurazaka' ? 'btn-pink' : 'btn-sky'}
        aria-label={group.name}
        onclick={() => {
          selectedGroupId = group.id;
          currentState += 1;
        }}>{group.name}</button
      >
    {/each}
  </div>
{/if}

{#if currentState % 4 === 1}
  <div class="grid gap-2 md:gap-4">
    {#each enabledGenerations as generation (generation.name)}
      <button
        class={primaryTheme === 'sakurazaka' ? 'btn-pink' : 'btn-sky'}
        aria-label={generation.name}
        onclick={() => {
          selectedGeneration = generation.name;
          currentState += 1;
        }}>{generation.name}</button
      >
    {/each}
  </div>
  {#if !oneGroupMode}
    <div class="grid grid-cols-1 mt-2 md:mt-4">
      <button
        class="btn-indigo"
        aria-label="back"
        onclick={() => {
          currentState -= 1;
        }}>戻る</button
      >
    </div>
  {/if}
{/if}

{#if currentState % 4 === 2}
  <div class="grid grid-cols-2 md:grid-cols-7 gap-2 md:gap-4">
    {#each enabledGenerations as generation (generation.name)}
      {#if generation.name === selectedGeneration}
        {#each generation.members as member (member.fullname)}
          <button
            class={primaryTheme === 'sakurazaka' ? 'btn-pink' : 'btn-sky'}
            aria-label={member.fullname}
            onclick={() => {
              selectedMember = member.fullname;
              currentState += 1;
            }}>{member.fullname}</button
          >
        {/each}
      {/if}
    {/each}
  </div>
  {#if !oneGenerationMode}
    <div class="grid grid-cols-1 mt-2 md:mt-4">
      <button
        class="btn-indigo"
        aria-label="back"
        onclick={() => {
          currentState -= 1;
        }}>戻る</button
      >
    </div>
  {/if}
{/if}

{#if currentState % 4 === 3}
  <div class="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
    {#each cuts as cut, i (cut)}
      <button
        class={primaryTheme === 'sakurazaka' ? 'btn-pink btn-pink-focus-active' : 'btn-sky btn-sky-focus-active'}
        aria-label={cut}
        onclick={() => {
          let data = getPhotoData(sortedPhotos, selectedGroupId, selectedMember);
          const updated = data.map((v, idx) => idx === i ? v + 1 : v);
          setPhotoData(sortedPhotos, selectedGroupId, selectedMember, updated);
          saveSortedPhotosToLocalStorage(sortedPhotos);
          let stepsBack = 1;
          if (oneGenerationMode) stepsBack += 1;
          if (oneGroupMode) stepsBack += 1;
          currentState += (4 - stepsBack);
        }}>{cut}</button
      >
    {/each}
  </div>
  <div class="grid grid-cols-1 mt-2 md:mt-4">
    <button
      class="btn-indigo"
      aria-label="back"
      onclick={() => {
        currentState -= 1;
      }}>戻る</button
    >
  </div>
{/if}

<style>
  @import './buttons.css';
</style>
