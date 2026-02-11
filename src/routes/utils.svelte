<script>
  import { structured_members, cuts, editMode } from '$lib/configs.svelte';
  import { clearSortedPhotos } from '$lib/sortedphotos.svelte';
  import { simulate } from '$lib/simulate.svelte';

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

  let n_members = $state(
    structured_members
      .values()
      .map((gen) => gen.members.length)
      .reduce((a, b) => a + b)
  );
  let n_cuts = $state(4);
  let n_onedraw = $state(5);
  let n_packs = $state(10);
  let simulate_result = $derived(
    simulate(Number(n_packs), Number(n_members), Number(n_cuts), Number(n_onedraw))
  );
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
        .then(() => {
          CSVButtonText = 'コピーしました';
        })
        .catch((err) => {
          console.error(err);
          CSVButtonText = 'コピー失敗';
        });
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
    aria-label="clear"
    onclick={() => {
      if (confirm('データをクリアします。よろしいですか？')) {
        clearSortedPhotos(sortedPhotos);
      }
    }}>データをクリア</button
  >
</div>

<div class="my-3 ml-2">
  <label>
    <input type="checkbox" bind:checked={editMode.enabled} />
    編集モード（試験機能）
  </label>
</div>

<div class="my-3 ml-2">
  <h2>シミュレーション（試験機能）</h2>
  <input type="text" bind:value={n_members} />名 ×
  <input type="text" bind:value={n_cuts} />カット ×
  <input type="text" bind:value={n_onedraw} />枚 1 セットの生写真を
  <input type="text" bind:value={n_packs} />パック買うと<br />
  平均して 95% の確率で {simulate_result.comp_mean.toFixed(2)} ±
  {(simulate_result.comp_stderr * 2).toFixed(2)} コンプ、
  {n_members * n_cuts} カット中 {simulate_result.coverage_mean.toFixed(2)} ±
  {(simulate_result.coverage_stderr * 2).toFixed(2)} カットが出ます
</div>

<style>
  @import './buttons.css';
  @import './utils.css';
</style>
