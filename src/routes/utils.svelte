<script>
  import { cuts } from '$lib/configs.svelte';
  import { simulate } from '$lib/simulate.svelte';
  import { photosToCSV } from '$lib/csv.js';
  import { countEnabledMembers } from '$lib/group-state.js';

  let { sortedPhotos, groupState } = $props();

  let CSVButtonText = $state('CSVをコピー');

  let n_members = $derived(countEnabledMembers(groupState));
  let n_cuts = $state(4);
  let n_onedraw = $state(5);
  let n_packs = $state(10);
  let simulate_result = $derived(
    simulate(Number(n_packs), Number(n_members), Number(n_cuts), Number(n_onedraw))
  );

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

<section class="mb-6">
  <h2 class="text-lg font-bold mb-3 border-b-2 border-gray-300 pb-2">CSV エクスポート</h2>
  <button
    id="copy-csv"
    class="{primaryTheme === 'sakurazaka'
      ? 'btn-pink btn-pink-focus-active'
      : 'btn-sky btn-sky-focus-active'} w-40 text-center"
    aria-label="CSV"
    onclick={() => {
      let CSV = photosToCSV(sortedPhotos, groupState.groups, cuts);
      navigator.clipboard
        .writeText(CSV)
        .then(() => {
          CSVButtonText = 'コピーしました';
        })
        .catch(() => {
          CSVButtonText = 'コピー失敗';
        });
    }}
    >{CSVButtonText}
  </button>
</section>

<section class="mb-6">
  <h2 class="text-lg font-bold mb-3 border-b-2 border-gray-300 pb-2">シミュレーション（試験機能）</h2>
  <div class="ml-2">
    <input type="text" bind:value={n_members} />名 ×
    <input type="text" bind:value={n_cuts} />カット ×
    <input type="text" bind:value={n_onedraw} />枚 1 セットの生写真を
    <input type="text" bind:value={n_packs} />パック買うと<br />
    平均して 95% の確率で {simulate_result.comp_mean.toFixed(2)} ±
    {(simulate_result.comp_stderr * 2).toFixed(2)} コンプ、
    {n_members * n_cuts} カット中 {simulate_result.coverage_mean.toFixed(2)} ±
    {(simulate_result.coverage_stderr * 2).toFixed(2)} カットが出ます
  </div>
</section>

<style>
  @import './buttons.css';
  @import './utils.css';
</style>
