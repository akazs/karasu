import { test, expect } from '@playwright/test';
import { ManagementPage } from '../pages/ManagementPage.js';
import { SorterPage } from '../pages/SorterPage.js';
import { TablePage } from '../pages/TablePage.js';

/**
 * Flow 3: Group/Generation Selection
 *
 * Tests selecting different groups and generations:
 * - Switch group via radio buttons in edit overlay (single group at a time)
 * - Toggle generations within the selected group
 * - Verify sorter reflects enabled/disabled groups
 * - Verify table reflects enabled/disabled groups and generations
 * - Auto-skip behavior when only one group/generation is enabled
 */

test.describe('Group/Generation Selection', () => {
  let managementPage;
  let sorterPage;
  let tablePage;
  const DEFAULT_TABLE_NAME = '新しいテーブル';

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');

    managementPage = new ManagementPage(page);
    sorterPage = new SorterPage(page);
    tablePage = new TablePage(page);

    await managementPage.goto();
  });

  test('should show radio buttons for group selection in edit overlay', async ({ page }) => {
    await managementPage.openEditOverlay(DEFAULT_TABLE_NAME);

    const dialog = page.locator('[role="dialog"]');

    // Should have radio buttons for group selection (not checkboxes for groups)
    const radioButtons = dialog.locator('input[type="radio"][name="selectedGroup"]');
    const radioCount = await radioButtons.count();
    expect(radioCount).toBe(2);

    // Verify group names are visible
    await expect(dialog.locator('text=櫻坂46')).toBeVisible();
    await expect(dialog.locator('text=日向坂46')).toBeVisible();

    // The first enabled group should be selected by default (sakurazaka)
    const sakurazakaRadio = dialog.locator('input[type="radio"][value="sakurazaka"]');
    await expect(sakurazakaRadio).toBeChecked();

    await managementPage.cancelEdit();
  });

  test('should show generation checkboxes for selected group', async ({ page }) => {
    await managementPage.openEditOverlay(DEFAULT_TABLE_NAME);

    const dialog = page.locator('[role="dialog"]');

    // Sakurazaka is selected by default, should show its generation checkboxes
    // Sakurazaka has: 二期生, 三期生, 四期生
    const genCheckboxes = dialog.locator('.border.rounded.bg-gray-50 input[type="checkbox"]');
    const genCount = await genCheckboxes.count();
    expect(genCount).toBe(3);

    // Verify specific generation text is present
    await expect(dialog.locator('.border.rounded.bg-gray-50 :text("二期生")')).toBeVisible();
    await expect(dialog.locator('.border.rounded.bg-gray-50 :text("三期生")')).toBeVisible();
    await expect(dialog.locator('.border.rounded.bg-gray-50 :text("四期生")')).toBeVisible();

    // All generation checkboxes should be checked by default
    for (let i = 0; i < genCount; i++) {
      await expect(genCheckboxes.nth(i)).toBeChecked();
    }

    await managementPage.cancelEdit();
  });

  test('should switch group via radio button and show its generations', async ({ page }) => {
    await managementPage.openEditOverlay(DEFAULT_TABLE_NAME);

    const dialog = page.locator('[role="dialog"]');

    // Switch to hinatazaka
    const hinatazakaRadio = dialog.locator('input[type="radio"][value="hinatazaka"]');
    await hinatazakaRadio.check();

    // Should now show hinatazaka generations (二期生, 三期生, 四期生, 五期生)
    const genCheckboxes = dialog.locator('.border.rounded.bg-gray-50 input[type="checkbox"]');
    const genCount = await genCheckboxes.count();
    expect(genCount).toBe(4);

    await expect(dialog.locator('.border.rounded.bg-gray-50 :text("五期生")')).toBeVisible();

    // All should be checked (switching enables all generations)
    for (let i = 0; i < genCount; i++) {
      await expect(genCheckboxes.nth(i)).toBeChecked();
    }

    await managementPage.cancelEdit();
  });

  test('should save group selection and reflect in sorter', async ({ page }) => {
    // Open edit overlay and switch to hinatazaka (disabling sakurazaka)
    await managementPage.openEditOverlay(DEFAULT_TABLE_NAME);

    const dialog = page.locator('[role="dialog"]');
    const hinatazakaRadio = dialog.locator('input[type="radio"][value="hinatazaka"]');
    await hinatazakaRadio.check();

    // Save
    await dialog.locator('button:has-text("保存")').click();
    await page.waitForTimeout(600);

    // Go to sorter tab - should auto-skip group selection since only hinatazaka
    await sorterPage.goto();
    await page.waitForTimeout(200);

    // Should NOT show group selection (auto-skipped to generation)
    const hinatazakaButton = page.locator('button[aria-label="日向坂46"]');
    expect(await hinatazakaButton.count()).toBe(0);

    // Should see generation buttons for hinatazaka
    await expect(page.locator('button[aria-label="二期生"]')).toBeVisible();
  });

  test('should disable a generation and reflect in table', async ({ page }) => {
    // Open edit overlay - sakurazaka is selected by default
    await managementPage.openEditOverlay(DEFAULT_TABLE_NAME);

    const dialog = page.locator('[role="dialog"]');

    // Disable sakurazaka 四期生
    const fourthGenLabel = dialog.locator('.border.rounded.bg-gray-50 label', {
      hasText: '四期生'
    });
    await fourthGenLabel.locator('input[type="checkbox"]').uncheck();

    // Save
    await dialog.locator('button:has-text("保存")').click();
    await page.waitForTimeout(800);

    // Go to results tab
    await tablePage.goto();
    await page.waitForTimeout(300);

    // 四期生 members should NOT be visible
    expect(await tablePage.memberRowExists('浅井 恋乃未')).toBe(false);

    // But 二期生 members should be visible
    expect(await tablePage.memberRowExists('井上 梨名')).toBe(true);
  });

  test('should auto-skip group selection when only one group enabled', async ({ page }) => {
    // Select sakurazaka (default) and save
    await managementPage.openEditOverlay(DEFAULT_TABLE_NAME);
    await page.locator('[role="dialog"] button:has-text("保存")').click();
    await page.waitForTimeout(600);

    // Go to sorter - should skip group since only one is enabled, show generations
    await sorterPage.goto();
    await page.waitForTimeout(300);

    // Should be at generation selection (not group)
    const genButton = page.locator('button[aria-label="二期生"]');
    await expect(genButton).toBeVisible();
  });

  test('should auto-skip generation when only one generation enabled', async ({ page }) => {
    // Keep sakurazaka selected but disable all generations except 二期生
    await managementPage.openEditOverlay(DEFAULT_TABLE_NAME);

    const dialog = page.locator('[role="dialog"]');

    // Disable sakurazaka 三期生 and 四期生
    const thirdGenLabel = dialog.locator('.border.rounded.bg-gray-50 label', {
      hasText: '三期生'
    });
    const fourthGenLabel = dialog.locator('.border.rounded.bg-gray-50 label', {
      hasText: '四期生'
    });
    await thirdGenLabel.locator('input[type="checkbox"]').uncheck();
    await fourthGenLabel.locator('input[type="checkbox"]').uncheck();

    // Save
    await dialog.locator('button:has-text("保存")').click();
    await page.waitForTimeout(800);

    // Go to sorter - should skip both group AND generation, show members directly
    await sorterPage.goto();
    await page.waitForTimeout(500);

    // Should be at member selection (both group and generation auto-skipped)
    const memberButton = page.locator('button[aria-label="井上 梨名"]');
    await expect(memberButton).toBeVisible();
  });

  test('should show only selected group in table', async ({ page }) => {
    // Default table has both groups in initial state, but after edit overlay
    // only one group is selected at a time (radio button)
    await tablePage.goto();
    await page.waitForTimeout(200);

    // Default should show sakurazaka members
    expect(await tablePage.memberRowExists('井上 梨名')).toBe(true);
  });

  test('should persist group settings to localStorage', async ({ page }) => {
    // Switch to hinatazaka
    await managementPage.openEditOverlay(DEFAULT_TABLE_NAME);
    const dialog = page.locator('[role="dialog"]');
    const hinatazakaRadio = dialog.locator('input[type="radio"][value="hinatazaka"]');
    await hinatazakaRadio.check();
    await dialog.locator('button:has-text("保存")').click();
    await page.waitForTimeout(600);

    // Check localStorage
    const tables = await page.evaluate(() => {
      const data = localStorage.getItem('karasu-tables');
      return data ? JSON.parse(data) : null;
    });

    expect(tables).not.toBeNull();
    const activeTable = tables.tables.find((t) => t.id === tables.activeTableId);
    expect(activeTable.groupSettings.hinatazaka.enabled).toBe(true);
    expect(activeTable.groupSettings.sakurazaka.enabled).toBe(false);
  });

  test('should switching group via radio enables all its generations', async ({ page }) => {
    await managementPage.openEditOverlay(DEFAULT_TABLE_NAME);

    const dialog = page.locator('[role="dialog"]');

    // Switch to hinatazaka
    const hinatazakaRadio = dialog.locator('input[type="radio"][value="hinatazaka"]');
    await hinatazakaRadio.check();
    await page.waitForTimeout(200);

    // All hinatazaka generation checkboxes should be checked
    const genCheckboxes = dialog.locator('.border.rounded.bg-gray-50 input[type="checkbox"]');
    const genCount = await genCheckboxes.count();

    expect(genCount).toBeGreaterThan(0);
    for (let i = 0; i < genCount; i++) {
      await expect(genCheckboxes.nth(i)).toBeChecked();
    }

    await managementPage.cancelEdit();
  });
});
