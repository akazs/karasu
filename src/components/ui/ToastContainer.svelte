<script>
  import { toastsStore, dismissToast } from '$lib/toast-store.svelte.js';
  import Toast from './Toast.svelte';
</script>

<div class="fixed top-4 right-4 z-50 flex flex-col gap-2">
  {#each $toastsStore as toast (toast.id)}
    <Toast {...toast} onDismiss={dismissToast} />
  {/each}
</div>
