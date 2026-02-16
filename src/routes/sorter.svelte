<script>
  import { t } from '$lib/i18n/store.svelte.js';
  import { cuts } from '$lib/configs.svelte';
  import { getPhotoData, setPhotoData } from '$lib/table-sortedphotos.svelte';
  import { getButtonClass } from '$lib/theme-utils.js';

  let { sortedPhotos, groupState } = $props();

  let currentState = $state(0);
  let selectedGroupId = $state('');
  let selectedGeneration = $state('');
  let selectedMember = $state('');

  // Determine enabled groups
  let enabledGroups = $derived(groupState.groups.filter((g) => g.enabled));
  let oneGroupMode = $derived(enabledGroups.length === 1);

  // If only one group, auto-select it
  $effect(() => {
    if (oneGroupMode && currentState % 4 === 0) {
      selectedGroupId = enabledGroups[0].id;
      currentState += 1;
    }
  });

  // Determine enabled generations for the selected group
  let selectedGroupData = $derived(groupState.groups.find((g) => g.id === selectedGroupId));
  let disabledMemberSet = $derived(
    selectedGroupData ? new Set(selectedGroupData.disabledMembers || []) : new Set()
  );

  let enabledGenerations = $derived(
    selectedGroupData ? selectedGroupData.generations.filter((g) => g.enabled) : []
  );
  let oneGenerationMode = $derived(enabledGenerations.length === 1);

  // If only one generation, auto-select it
  $effect(() => {
    if (oneGenerationMode && currentState % 4 === 1) {
      selectedGeneration = enabledGenerations[0].name;
      currentState += 1;
    }
  });

  // Determine primary theme: use selected group if set, otherwise sakurazaka if enabled
  let primaryTheme = $derived(
    selectedGroupId ||
      (groupState.groups.find((g) => g.id === 'sakurazaka')?.enabled
        ? 'sakurazaka'
        : groupState.groups.find((g) => g.enabled)?.id || 'sakurazaka')
  );
</script>

{#if currentState % 4 === 0}
  <div class="grid gap-2 md:gap-4">
    {#each enabledGroups as group (group.id)}
      <button
        class={getButtonClass(group.id)}
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
        class={getButtonClass(primaryTheme)}
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
        }}>{t('sorter.back')}</button
      >
    </div>
  {/if}
{/if}

{#if currentState % 4 === 2}
  <div class="grid grid-cols-2 md:grid-cols-7 gap-2 md:gap-4">
    {#each enabledGenerations as generation (generation.name)}
      {#if generation.name === selectedGeneration}
        {#each generation.members.filter((m) => !disabledMemberSet.has(m.fullname)) as member (member.fullname)}
          <button
            class={getButtonClass(primaryTheme)}
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
  {#if !(oneGroupMode && oneGenerationMode)}
    <div class="grid grid-cols-1 mt-2 md:mt-4">
      <button
        class="btn-indigo"
        aria-label="back"
        onclick={() => {
          // Go back, skipping auto-selected screens
          if (oneGenerationMode) {
            currentState -= 2; // Skip generation selection, go to group
          } else {
            currentState -= 1; // Go to generation selection
          }
        }}>{t('sorter.back')}</button
      >
    </div>
  {/if}
{/if}

{#if currentState % 4 === 3}
  <div class="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
    {#each cuts() as cut, i (cut)}
      <button
        class={getButtonClass(primaryTheme, { focusActive: true })}
        aria-label={cut}
        onclick={() => {
          let data = getPhotoData(sortedPhotos, selectedGroupId, selectedMember);
          const updated = data.map((v, idx) => (idx === i ? v + 1 : v));
          setPhotoData(sortedPhotos, selectedGroupId, selectedMember, updated);
          // Loop back to the appropriate starting screen
          // Both auto-selected: go to member (state 2)
          // Only group auto-selected: go to generation (state 1)
          // Otherwise: go to group (state 0)
          let nextScreen = oneGroupMode && oneGenerationMode ? 2 : oneGroupMode ? 1 : 0;
          currentState += 1 + nextScreen;
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
      }}>{t('sorter.back')}</button
    >
  </div>
{/if}

<style>
  @import './buttons.css';
</style>
