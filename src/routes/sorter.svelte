<script>
  import { structured_members, cuts } from '$lib/defaults.svelte';
  import { saveSortedPhotosToLocalStorage } from '$lib/sortedphotos.svelte';

  let { sortedPhotos } = $props();

  let currentState = $state(0);
  let selectedGeneration = $state('');
  let selectedMember = $state('');

  let oneGenerationMode = structured_members.filter((gen) => gen.enabled).length == 1;
  if (oneGenerationMode) {
    currentState = 1;
    selectedGeneration = structured_members.find((gen) => gen.enabled).name;
  }
</script>

{#if currentState % 3 == 0}
  <div class="grid gap-2 md:gap-4">
    {#each structured_members as generation (generation.name)}
      {#if generation.enabled}
        <button
          class="btn-pink"
          aria-label={generation.name}
          onclick={() => {
            selectedGeneration = generation.name;
            currentState += 1;
          }}>{generation.name}</button
        >
      {/if}
    {/each}
  </div>
{/if}

{#if currentState % 3 == 1}
  <div class="grid grid-cols-2 md:grid-cols-7 gap-2 md:gap-4">
    {#each structured_members as generation (generation.name)}
      {#if generation.name == selectedGeneration}
        {#each generation.members as member (member.fullname)}
          <button
            class="btn-pink"
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

{#if currentState % 3 == 2}
  <div class="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
    {#each cuts as cut, i (cut)}
      <button
        class="btn-pink"
        aria-label={cut}
        onclick={() => {
          let data = $state([0, 0, 0, 0]);
          if (sortedPhotos.has(selectedMember)) {
            data = sortedPhotos.get(selectedMember);
          }
          data[i] += 1;
          sortedPhotos.set(selectedMember, data);
          saveSortedPhotosToLocalStorage(sortedPhotos);
          currentState += oneGenerationMode ? 2 : 1;
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
