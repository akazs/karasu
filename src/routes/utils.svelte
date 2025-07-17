<script>
  import { structured_members, cuts } from '$lib/defaults.svelte';
  import { clearSortedPhotos } from '$lib/sortedphotos.svelte';

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
          CSV += member.fullname;
          let counts = sortedPhotos.get(member.fullname) || [0, 0, 0, 0];
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

<div>
  <button
    id="copy-csv"
    class="btn-pink btn-pink-focus-active w-40 text-center"
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
  <div class="my-3 ml-2">
    <label>
      <input type="checkbox" bind:checked={generation.enabled} />
      {generation.name}を含む
    </label>
  </div>
{/each}

<div>
  <button
    class="btn-red w-40 text-center"
    aira-label="clear"
    onclick={() => {
      if (confirm('データをクリアします。よろしいですか？')) {
        clearSortedPhotos(sortedPhotos);
      }
    }}>データをクリア</button
  >
</div>

<style>
  @import './buttons.css';
</style>
