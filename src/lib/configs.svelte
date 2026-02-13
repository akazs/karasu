<script module>
  import { CUTS, STORAGE_KEY } from './storage.js';

  // Global constants
  export const cuts = CUTS;
  export const sortedPhotosKey = STORAGE_KEY;

  // Global edit mode state (not table-specific)
  export let editMode = $state({ enabled: false });
</script>
