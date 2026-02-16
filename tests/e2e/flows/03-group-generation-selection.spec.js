import { test, expect } from '@playwright/test';
import { ManagementPage } from '../pages/ManagementPage.js';
import { SorterPage } from '../pages/SorterPage.js';
import { TablePage } from '../pages/TablePage.js';

/**
 * Flow 3: Group/Generation Selection
 *
 * Tests selecting different groups and generations:
 * - Toggle groups (sakurazaka/hinatazaka) on/off in edit overlay
 * - Toggle generations within groups
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

  test('should show both groups enabled by default in edit overlay', async ({ page }) => {
    await managementPage.openEditOverlay(DEFAULT_TABLE_NAME);

    // Both group checkboxes should be checked
    const checkboxes = page.locator('[role="dialog"] input[type="checkbox"]');
    const count = await checkboxes.count();

    // There should be group checkboxes + generation checkboxes
    // sakurazaka (1 group + 3 gens) + hinatazaka (1 group + 4 gens) = 9
    // But could be different if group definitions changed
    expect(count).toBeGreaterThanOrEqual(2); // At minimum 2 group checkboxes

    // Verify group names are visible
    await expect(page.locator('[role="dialog"]').locator('text=櫻坂46')).toBeVisible();
    await expect(page.locator('[role="dialog"]').locator('text=日向坂46')).toBeVisible();

    // Verify both groups are checked
    const sakurazakaLabel = page.locator('[role="dialog"] label.font-bold', { hasText: '櫻坂46' });
    const hinatazakaLabel = page.locator('[role="dialog"] label.font-bold', {
      hasText: '日向坂46'
    });
    expect(await sakurazakaLabel.locator('input[type="checkbox"]').isChecked()).toBe(true);
    expect(await hinatazakaLabel.locator('input[type="checkbox"]').isChecked()).toBe(true);

    await managementPage.cancelEdit();
  });

  test('should show generation checkboxes for each group', async ({ page }) => {
    await managementPage.openEditOverlay(DEFAULT_TABLE_NAME);

    const dialog = page.locator('[role="dialog"]');

    // All generation checkboxes should be visible in the dialog
    // Sakurazaka has: 二期生, 三期生, 四期生
    // Hinatazaka has: 二期生, 三期生, 四期生, 五期生
    const genCheckboxLabels = dialog.locator('.ml-6 label');
    const genCount = await genCheckboxLabels.count();

    // Should have at least 7 generation checkboxes total
    expect(genCount).toBeGreaterThanOrEqual(7);

    // Verify specific generation text is present
    await expect(dialog.locator('text=四期生').first()).toBeVisible();
    await expect(dialog.locator('text=五期生')).toBeVisible();

    // Verify all generation checkboxes are checked by default
    const checkboxes = dialog.locator('.ml-6 input[type="checkbox"]');
    const checkboxCount = await checkboxes.count();
    for (let i = 0; i < checkboxCount; i++) {
      expect(await checkboxes.nth(i).isChecked()).toBe(true);
    }

    await page.screenshot({
      path: 'test-results/screenshots/group-generation-overlay.png'
    });

    await managementPage.cancelEdit();
  });

  test('should disable a group and reflect in sorter', async ({ page }) => {
    // Open edit overlay and disable hinatazaka
    await managementPage.openEditOverlay(DEFAULT_TABLE_NAME);

    // Find the hinatazaka group checkbox (the bold label next to 日向坂46)
    const hinatazakaLabel = page.locator('[role="dialog"] label.font-bold', {
      hasText: '日向坂46'
    });
    const checkbox = hinatazakaLabel.locator('input[type="checkbox"]');
    await checkbox.uncheck();

    // Save
    await page.click('[role="dialog"] button:has-text("保存")');
    await page.waitForTimeout(600);

    // Go to sorter tab - should auto-skip group selection since only sakurazaka
    await sorterPage.goto();
    await page.waitForTimeout(200);

    // Should NOT show group selection (auto-skipped to generation)
    // Since sakurazaka has multiple generations, we should see generation buttons
    const sakurazakaButton = page.locator('button[aria-label="櫻坂46"]');
    expect(await sakurazakaButton.count()).toBe(0);

    // Should see generation buttons for sakurazaka
    await expect(page.locator('button[aria-label="二期生"]')).toBeVisible();
  });

  test('should disable a generation and reflect in table', async ({ page }) => {
    // Open edit overlay and disable sakurazaka 四期生
    await managementPage.openEditOverlay(DEFAULT_TABLE_NAME);

    // The overlay has .border.rounded blocks for each group
    // Sakurazaka is the first block, hinatazaka second
    const dialog = page.locator('[role="dialog"]');
    const sakurazakaBlock = dialog.locator('.space-y-3 > .border.rounded').first();
    const fourthGenLabel = sakurazakaBlock.locator('.ml-6 label', { hasText: '四期生' });
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

    await page.screenshot({
      path: 'test-results/screenshots/generation-disabled-table.png'
    });
  });

  test('should auto-skip group selection when only one group enabled', async ({ page }) => {
    // Disable hinatazaka
    await managementPage.openEditOverlay(DEFAULT_TABLE_NAME);
    const hinatazakaLabel = page.locator('[role="dialog"] label.font-bold', {
      hasText: '日向坂46'
    });
    await hinatazakaLabel.locator('input[type="checkbox"]').uncheck();
    await page.click('[role="dialog"] button:has-text("保存")');
    await page.waitForTimeout(600);

    // Go to sorter - should skip group, show generations
    await sorterPage.goto();
    await page.waitForTimeout(300);

    // Should be at generation selection (not group)
    const genButton = page.locator('button[aria-label="二期生"]');
    await expect(genButton).toBeVisible();
  });

  test('should auto-skip generation when only one generation enabled', async ({ page }) => {
    // Disable hinatazaka and disable all sakurazaka generations except 二期生
    await managementPage.openEditOverlay(DEFAULT_TABLE_NAME);

    const dialog = page.locator('[role="dialog"]');

    // Disable hinatazaka
    const hinatazakaLabel = dialog.locator('label.font-bold', { hasText: '日向坂46' });
    await hinatazakaLabel.locator('input[type="checkbox"]').uncheck();

    // Disable sakurazaka 三期生 and 四期生
    const sakurazakaBlock = dialog.locator('.space-y-3 > .border.rounded').first();
    const thirdGenLabel = sakurazakaBlock.locator('.ml-6 label', { hasText: '三期生' });
    const fourthGenLabel = sakurazakaBlock.locator('.ml-6 label', { hasText: '四期生' });
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

  test('should show group tabs in table when both groups enabled', async ({ page }) => {
    await tablePage.goto();
    await page.waitForTimeout(200);

    // Should see group tabs: 櫻坂46 and 日向坂46
    const groupTabs = page.locator('.tab-button');
    const tabCount = await groupTabs.count();
    expect(tabCount).toBe(2);

    await expect(page.locator('.tab-button', { hasText: '櫻坂46' })).toBeVisible();
    await expect(page.locator('.tab-button', { hasText: '日向坂46' })).toBeVisible();
  });

  test('should switch between group tabs in table', async ({ page }) => {
    await tablePage.goto();
    await page.waitForTimeout(200);

    // Default should show sakurazaka members
    expect(await tablePage.memberRowExists('井上 梨名')).toBe(true);

    // Switch to hinatazaka
    await page.click('.tab-button:has-text("日向坂46")');
    await page.waitForTimeout(200);

    // Should now show hinatazaka members
    expect(await tablePage.memberRowExists('金村 美玖')).toBe(true);
    // Sakurazaka members should not be visible
    expect(await tablePage.memberRowExists('井上 梨名')).toBe(false);

    await page.screenshot({
      path: 'test-results/screenshots/hinatazaka-table.png'
    });
  });

  test('should persist group settings to localStorage', async ({ page }) => {
    // Disable hinatazaka
    await managementPage.openEditOverlay(DEFAULT_TABLE_NAME);
    const hinatazakaLabel = page.locator('[role="dialog"] label.font-bold', {
      hasText: '日向坂46'
    });
    await hinatazakaLabel.locator('input[type="checkbox"]').uncheck();
    await page.click('[role="dialog"] button:has-text("保存")');
    await page.waitForTimeout(600);

    // Check localStorage
    const tables = await page.evaluate(() => {
      const data = localStorage.getItem('karasu-tables');
      return data ? JSON.parse(data) : null;
    });

    expect(tables).not.toBeNull();
    const activeTable = tables.tables.find((t) => t.id === tables.activeTableId);
    expect(activeTable.groupSettings.hinatazaka.enabled).toBe(false);
    expect(activeTable.groupSettings.sakurazaka.enabled).toBe(true);
  });

  test('should disabling group checkbox disables all its generation checkboxes', async ({
    page
  }) => {
    await managementPage.openEditOverlay(DEFAULT_TABLE_NAME);

    const dialog = page.locator('[role="dialog"]');

    // Uncheck hinatazaka group
    const hinatazakaLabel = dialog.locator('label.font-bold', { hasText: '日向坂46' });
    await hinatazakaLabel.locator('input[type="checkbox"]').uncheck();
    await page.waitForTimeout(200);

    // All hinatazaka generation checkboxes should be unchecked
    const hinatazakaBlock = dialog.locator('.space-y-3 > .border.rounded').nth(1);
    const genCheckboxes = hinatazakaBlock.locator('.ml-6 input[type="checkbox"]');
    const genCount = await genCheckboxes.count();

    expect(genCount).toBeGreaterThan(0);
    for (let i = 0; i < genCount; i++) {
      expect(await genCheckboxes.nth(i).isChecked()).toBe(false);
    }

    await managementPage.cancelEdit();
  });
});
