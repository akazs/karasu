<script>
  import { structured_members, cuts, editMode } from '$lib/configs.svelte';
  import { saveSortedPhotosToLocalStorage } from '$lib/sortedphotos.svelte';

  let { sortedPhotos } = $props();

  const increase = (sortedPhotos, memberName, cut) => () => {
    let data = sortedPhotos.get(memberName);
    data[cut]++;
    sortedPhotos.set(memberName, data);
    saveSortedPhotosToLocalStorage(sortedPhotos);
  };

  const decrease = (sortedPhotos, memberName, cut) => () => {
    let data = sortedPhotos.get(memberName);
    if (data[cut] < 1) {
      return;
    }
    data[cut]--;
    sortedPhotos.set(memberName, data);
    saveSortedPhotosToLocalStorage(sortedPhotos);
  };
</script>

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
            <th scope="row" class="th-row">
              <span class="fullname">{member.fullname}</span>
              <span class="shortname">{member.shortname}</span>
            </th>
            <!-- eslint-disable-next-line -->
            {#each sortedPhotos.get(member.fullname) || [0, 0, 0, 0] as cut, i}
              <td><div class="cell-layout">
                {#if editMode.enabled}
                  <button
                    class="btn-edit"
                    aria-label="increase"
                    onclick={increase(sortedPhotos, member.fullname, i)}>+</button
                  >
                {/if}
                {cut}
                {#if editMode.enabled}
                  <button
                    class="btn-edit"
                    aria-label="decrease"
                    onclick={decrease(sortedPhotos, member.fullname, i)}>-</button
                  >
                {/if}
              </div></td>
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
