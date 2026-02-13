<script>
  import { t } from '$lib/i18n/store.svelte.js';
</script>

<div class="w-full text-left break-normal tracking-tight">
  <div class="section">
    <h1>{t('instruction.warningTitle')}</h1>
    <p>
      {t('instruction.warningText1')}<br />{t('instruction.warningText2')}
    </p>
    <p>
      {t('instruction.warningText3')}<br />
      {t('instruction.warningText4')}
    </p>
  </div>
  <div class="section">
    <h1>{t('instruction.usageTitle')}</h1>
    <h2>{t('instruction.managementTabTitle')}</h2>
    <p>
      <b>{t('instruction.tableManagementTitle')}</b>: {t('instruction.tableManagementDesc')}
    </p>
    <p>
      <b>{t('instruction.groupSelectionTitle')}</b>: {t('instruction.groupSelectionDesc')}
    </p>
    <p>
      <b>{t('instruction.editModeTitle')}</b>: {t('instruction.editModeDesc')}
    </p>
    <p>
      <b>{t('instruction.dataManagementTitle')}</b>: {t('instruction.dataManagementDesc')}
    </p>
    <h2>{t('instruction.sorterTabTitle')}</h2>
    <p>{t('instruction.sorterTabDesc1')}</p>
    <p>{t('instruction.sorterTabDesc2')}</p>
    <h2>{t('instruction.resultsTabTitle')}</h2>
    <p>{t('instruction.resultsTabDesc1')}</p>
    <p>
      {t('instruction.resultsTabDesc2')}
    </p>
    <h2>{t('instruction.utilsTabTitle')}</h2>
    <p>{t('instruction.utilsTabDesc1')}</p>
    <p>{t('instruction.utilsTabDesc2')}</p>
  </div>
</div>

<style>
  @import './instruction.css';
</style>
