<script>
  import { SvelteMap } from 'svelte/reactivity';
  import { structured_members, cuts } from './Constants.svelte';

  let { sortedPhotos } = $props();
  let selectedGeneration = $state('');
  let selectedMember = $state('');

  const states = [
    {
      name: 'GenerationSelection'
    },
    {
      name: 'MemberSelection'
    },
    {
      name: 'CutSelection'
    }
  ];
  let currentState = $state(0);
</script>

{#if currentState % 3 == 0}
  <div id="generation-buttons">
    {#each structured_members as generation}
      <button
        class="bg-pink-300"
        aria-label={generation.name}
        onclick={() => {
          selectedGeneration = generation.name;
          currentState += 1;
        }}>{generation.name}</button
      >
    {/each}
  </div>
{/if}

{#if currentState % 3 == 1}
  <div id="member-buttons">
    {#each structured_members as generation}
      {#if generation.name == selectedGeneration}
        {#each generation.members as member}
          <button
            class="bg-pink-300"
            aria-label={member}
            onclick={() => {
              selectedMember = member;
              currentState += 1;
            }}>{member}</button
          >
        {/each}
      {/if}
    {/each}
    <button
      class="bg-indigo-200"
      aria-label="back"
      onclick={() => {
        currentState -= 1;
      }}>戻る</button
    >
  </div>
{/if}

{#if currentState % 3 == 2}
  <div id="cut-buttons">
    {#each cuts as cut, i}
      <button
        class="bg-pink-300"
        aria-label={cut}
        onclick={() => {
          let data = $state([0, 0, 0, 0]);
          if (sortedPhotos.has(selectedMember)) {
            data = sortedPhotos.get(selectedMember);
          }
          data[i] += 1;
          sortedPhotos.set(selectedMember, data);
          currentState += 1;
        }}>{cut}</button
      >
    {/each}
    <button
      class="bg-indigo-200"
      aria-label="back"
      onclick={() => {
        currentState -= 1;
      }}>戻る</button
    >
  </div>
{/if}

<style>
  #member-buttons {
    display: grid;
    grid-gap: 1em;
    grid-template-columns: repeat(6, 1fr);
  }

  @media (max-width: 1000px) {
    #member-buttons {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  #cut-buttons,
  #generation-buttons {
    display: grid;
    grid-gap: 1em;
  }
  /* 
  button {
    padding: 10px 20px;
    border-radius: 10px;
    cursor: pointer;
  } */
</style>
