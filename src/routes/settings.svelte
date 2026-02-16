<script>
  import { i18n, t } from '$lib/i18n/store.svelte.js';
  import { resetToInitialState } from '$lib/table-state.js';
  import { showToast } from '$lib/toast-store.svelte.js';
  import ConfirmDialog from '../components/ui/ConfirmDialog.svelte';

  // State for clear all confirmation
  let clearingAll = $state(false);

  function handleClearAll() {
    clearingAll = true;
  }

  function confirmClearAll() {
    try {
      // Reset store and localStorage to initial state
      resetToInitialState();

      // Reload page to refresh all components
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to clear data:', error);
      }
      showToast(t('alerts.clearFailed'), 'error');
      clearingAll = false;
    }
  }

  function cancelClearAll() {
    clearingAll = false;
  }
</script>

<div class="settings-container">
  <!-- Language Settings Section -->
  <section class="mb-6">
    <h2 class="text-lg font-bold mb-3">{t('management.language')}</h2>
    <div class="ml-2 flex gap-3">
      <label class="cursor-pointer">
        <input
          type="radio"
          name="language"
          value="ja-JP"
          checked={i18n.locale === 'ja-JP'}
          onchange={() => i18n.setLocale('ja-JP')}
        />
        <span class="ml-1">{t('management.languageJa')}</span>
      </label>
      <label class="cursor-pointer">
        <input
          type="radio"
          name="language"
          value="zh-TW"
          checked={i18n.locale === 'zh-TW'}
          onchange={() => i18n.setLocale('zh-TW')}
        />
        <span class="ml-1">{t('management.languageZh')}</span>
      </label>
    </div>
  </section>

  <!-- Data Management Section -->
  <section class="mb-6">
    <h2 class="text-lg font-bold mb-3">{t('management.dataManagement')}</h2>
    <button class="btn-red text-center w-full" aria-label="clear all data" onclick={handleClearAll}>
      {t('management.clearAllData')}
    </button>
  </section>
</div>

<!-- Clear All Confirmation Dialog -->
{#if clearingAll}
  <ConfirmDialog
    isOpen={true}
    title={t('management.clearAllData')}
    message={t('alerts.confirmClearAllData')}
    confirmText={t('alerts.confirmDelete')}
    cancelText={t('management.cancel')}
    onConfirm={confirmClearAll}
    onCancel={cancelClearAll}
    variant="danger"
  />
{/if}

<style>
  @import './buttons.css';

  .settings-container {
    max-width: 900px;
  }
</style>
