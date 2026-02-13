<script module>
  import { STORAGE_KEY } from './storage.js';
  import { t } from './i18n/store.svelte.js';

  // Global constants
  export function cuts() {
    return [t('app.cuts.yori'), t('app.cuts.chu'), t('app.cuts.hiki'), t('app.cuts.suwari')];
  }
  export const sortedPhotosKey = STORAGE_KEY;

  // Global edit mode state (not table-specific)
  export let editMode = $state({ enabled: false });
</script>
