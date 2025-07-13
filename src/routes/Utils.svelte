<script>
  import { structured_members, cuts } from './Defaults.svelte';
  let { sortedPhotos } = $props();

  function sortedPhotosToCSV(sortedPhotos) {
    let CSV = 'メンバー';
    cuts.forEach((cut) => {
      CSV += ',' + cut;
    });
    CSV += '\n';
    structured_members
      .filter((gen) => gen.enabled)
      .forEach((gen) => {
        gen.members.forEach((member) => {
          CSV += member;
          let counts = sortedPhotos.get(member) || [0, 0, 0, 0];
          counts.forEach((count) => {
            CSV += ',' + count;
          });
          CSV += '\n';
        });
      });
    return CSV;
  }
  let CSVButtonText = $state('CSVをコピー');
</script>

<div id="output">
  <button
    id="copy-csv"
    class="bg-pink-300"
    aria-label="CSV"
    onclick={() => {
      let CSV = sortedPhotosToCSV(sortedPhotos);
      navigator.clipboard
        .writeText(CSV)
        .then(() => {})
        .catch((err) => {
          console.error(err);
        });
      CSVButtonText = 'コピーしました';
    }}
    >{CSVButtonText}
  </button>
</div>

{#each structured_members as generation (generation.name)}
  <div class="options">
    <label>
      <input type="checkbox" bind:checked={generation.enabled} />
      {generation.name}を含む
    </label>
  </div>
{/each}

<style>
  div.options {
    margin-top: 1em;
  }
</style>
