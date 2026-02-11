<script>
  import { groupState, cuts, editMode } from '$lib/configs.svelte';
  import { clearSortedPhotos } from '$lib/sortedphotos.svelte';
  import { simulate } from '$lib/simulate.svelte';
  import { photosToCSV } from '$lib/csv.js';
  import {
    countEnabledMembers,
    setGroupEnabled,
    setGenerationEnabled,
    saveGroupStateToLocalStorage
  } from '$lib/group-state.js';

  let { sortedPhotos } = $props();

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

  function toggleGroupEnabled(groupId, enabled) {
    const newState = setGroupEnabled(groupState, groupId, enabled);
    groupState.groups = newState.groups;
    saveGroupStateToLocalStorage(groupState);
  }

  function toggleGenerationEnabled(groupId, genName, enabled) {
    const newState = setGenerationEnabled(groupState, groupId, genName, enabled);
    groupState.groups = newState.groups;
    saveGroupStateToLocalStorage(groupState);
  }
</script>

<div>
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
</div>

{#each groupState.groups as group (group.id)}
  <div class="my-3 ml-2">
    <label class="font-bold">
      <input
        type="checkbox"
        checked={group.enabled}
        onchange={(e) => toggleGroupEnabled(group.id, e.target.checked)}
      />
      {group.name}を含む
    </label>
    <div class="ml-6">
      {#each group.generations as generation (generation.name)}
        <label class="block">
          <input
            type="checkbox"
            checked={generation.enabled}
            onchange={(e) => toggleGenerationEnabled(group.id, generation.name, e.target.checked)}
          />
          {generation.name}
        </label>
      {/each}
    </div>
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
