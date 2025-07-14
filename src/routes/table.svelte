<script>
  import { structured_members, cuts } from './defaults.svelte';
  let { sortedPhotos } = $props();

  let innerWidth = $state(0);
</script>

<svelte:window bind:innerWidth />

<table
  class="table-fixed w-full text-sm md:text-base break-keep border-collapse border-2 border-gray-500"
>
  <thead class="bg-rose-100">
    <tr>
      <th scope="col" class="th-col">メンバー</th>
      {#each cuts as cut (cut)}
        <th scope="col" class="th-col">{cut}</th>
      {/each}
    </tr>
  </thead>
  <tbody>
    {#each structured_members as generation (generation.name)}
      {#if generation.enabled}
        {#each generation.members as member (member.fullname)}
          <tr class="odd:bg-white even:bg-gray-100">
            {#if innerWidth >= 768}
              <th scope="row" class="th-row">{member.fullname}</th>
            {:else}
              <th scope="row" class="th-row">{member.shortname}</th>
            {/if}
            <!-- eslint-disable-next-line -->
            {#each sortedPhotos.get(member.fullname) || [0, 0, 0, 0] as cut}
              <td>{cut}</td>
            {/each}
          </tr>
        {/each}
      {/if}
    {/each}
  </tbody>
</table>

<style>
  @import './table.css';
</style>
