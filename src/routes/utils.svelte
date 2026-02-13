<script>
  import { t } from '$lib/i18n/store.svelte.js';
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
  <h2 class="text-lg font-bold mb-3 border-gray-300 pb-2">{t('utils.simulation')}</h2>
  <div class="ml-2 space-y-3">
    <div class="flex items-center gap-2">
      <label for="n_members" class="w-40">{t('utils.labelPeople')}:</label>
      <input id="n_members" type="text" bind:value={n_members} class="w-20" />
    </div>

    <div class="flex items-center gap-2">
      <label for="n_cuts" class="w-40">{t('utils.labelCuts')}:</label>
      <input id="n_cuts" type="text" bind:value={n_cuts} class="w-20" />
    </div>

    <div class="flex items-center gap-2">
      <label for="n_onedraw" class="w-40">{t('utils.labelSheetsPerPack')}:</label>
      <input id="n_onedraw" type="text" bind:value={n_onedraw} class="w-20" />
    </div>

    <div class="flex items-center gap-2">
      <label for="n_packs" class="w-40">{t('utils.labelPacksToBuy')}:</label>
      <input id="n_packs" type="text" bind:value={n_packs} class="w-20" />
    </div>

    <div class="mt-4 p-3 bg-gray-50 rounded">
      {t('utils.resultText', {
        compMean: simulate_result.comp_mean.toFixed(2),
        compStderr: (simulate_result.comp_stderr * 2).toFixed(2),
        totalCuts: n_members * n_cuts,
        coverageMean: simulate_result.coverage_mean.toFixed(2),
        coverageStderr: (simulate_result.coverage_stderr * 2).toFixed(2)
      })}
    </div>
  </div>
</section>

<style>
  @import './buttons.css';
  @import './utils.css';
</style>
