<script>
  import { structured_members, cuts } from './Constants.svelte';
  let { sortedPhotos } = $props();

  function sortedPhotosToCSV(sortedPhotos) {
    let CSV = 'メンバー';
    cuts.forEach((cut) => {
      CSV += ',' + cut;
    });
    CSV += '\n';
    structured_members.forEach((gen) => {
      gen.members.forEach((member) => {
        CSV += member;
        let counts = sortedPhotos[member] || [0, 0, 0, 0];
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
