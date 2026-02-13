<script>
  import { simulate } from '$lib/simulate.svelte';
  import { countEnabledMembers } from '$lib/group-state.js';

  let { groupState } = $props();

  let n_members = $derived(countEnabledMembers(groupState));
  let n_cuts = $state(4);
  let n_onedraw = $state(5);
  let n_packs = $state(10);
  let simulate_result = $derived(
    simulate(Number(n_packs), Number(n_members), Number(n_cuts), Number(n_onedraw))
  );
</script>

<section class="mb-6">
  <h2 class="text-lg font-bold mb-3 border-gray-300 pb-2">シミュレーション</h2>
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
