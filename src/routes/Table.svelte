<script>
  import { structured_members, cuts } from './Defaults.svelte';
  let { sortedPhotos } = $props();
</script>

<table>
  <thead class="bg-rose-100">
    <tr>
      <th scope="col">メンバー</th>
      {#each cuts as cut (cut)}
        <th scope="col" style="text-align: center">{cut}</th>
      {/each}
    </tr>
  </thead>
  <tbody>
    {#each structured_members as generation (generation.name)}
      {#if generation.enabled}
        {#each generation.members as member (member)}
          <tr>
            <th scope="row">{member}</th>
            {#each sortedPhotos.get(member) || [0, 0, 0, 0] as cut (cut)}
              <td>{cut}</td>
            {/each}
          </tr>
        {/each}
      {/if}
    {/each}
  </tbody>
</table>

<style>
  table {
    border-collapse: collapse;
    border: 2px solid rgb(140 140 140);
    font-family: sans-serif;
    font-size: 1rem;
    letter-spacing: 1px;
  }

  th,
  td {
    border: 1px solid rgb(160 160 160);
    padding: 8px 10px;
  }

  td {
    text-align: center;
    font-weight: bold;
    width: 20%;
  }

  th {
    text-align: left;
  }

  tbody > tr:nth-of-type(even) {
    background-color: rgb(237 238 242);
  }
</style>
