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
    <p>
      {t('instruction.warningText5')}<br />
      {t('instruction.warningText6')}
    </p>
  </div>
  <div class="section">
    <h1>{t('instruction.usageTitle')}</h1>
    <h2>{t('instruction.managementTabTitle')}</h2>
    <p>
      <b>{t('instruction.tableManagementTitle')}</b>: {t('instruction.tableManagementDesc')}
    </p>
    <h2>{t('instruction.sorterTabTitle')}</h2>
    <p>{t('instruction.sorterTabDesc1')}</p>
    <p>{t('instruction.sorterTabDesc2')}</p>
    <h2>{t('instruction.tableTabTitle')}</h2>
    <p>{t('instruction.tableTabDesc1')}</p>
    <p>
      {t('instruction.tableTabDesc2')}
    </p>
    <p>
      <b>{t('instruction.editModeTitle')}</b>: {t('instruction.editModeDesc')}
    </p>
    <h2>{t('instruction.utilsTabTitle')}</h2>
    <p>{t('instruction.utilsTabDesc1')}</p>
    <p>{t('instruction.utilsTabDesc2')}</p>
    <h2>{t('instruction.settingsTabTitle')}</h2>
    <p>{t('instruction.settingsTabDesc1')}</p>
    <p>{t('instruction.settingsTabDesc2')}</p>
  </div>
</div>

<style>
  @import './instruction.css';
</style>
