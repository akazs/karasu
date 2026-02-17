import { test, expect } from '@playwright/test';
import { TablePage } from '../pages/TablePage.js';
import { ManagementPage } from '../pages/ManagementPage.js';
import { assertPhotoCount } from '../helpers/assertions.js';

/**
 * Flow 5: Edit Mode
 *
 * Tests the edit mode for modifying data directly in tables:
 * - Enable/disable edit mode via checkbox on management tab
 * - Increment (+) buttons in table cells
 * - Decrement (-) buttons in table cells
 * - Cannot decrement below 0
 * - Changes persist to localStorage
 * - Edit mode state is separate from table data
 */

test.describe('Edit Mode', () => {
  let tablePage;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');

    tablePage = new TablePage(page);
  });

  test('should enable edit mode via checkbox', async ({ page }) => {
    // Navigate to テーブル tab where edit mode toggle is located
    await tablePage.goto();
    await page.waitForTimeout(200);

    // Enable edit mode by clicking the "編集" button
    await tablePage.enableEditMode();
    await page.waitForTimeout(100);

    // Should see + and - buttons
    const plusButtons = page.locator('button[aria-label="increase"]');
    const minusButtons = page.locator('button[aria-label="decrease"]');

    expect(await plusButtons.count()).toBeGreaterThan(0);
    expect(await minusButtons.count()).toBeGreaterThan(0);

    await page.screenshot({
      path: 'test-results/screenshots/edit-mode-enabled.png'
    });
  });

  test('should hide +/- buttons when edit mode is disabled', async ({ page }) => {
    await tablePage.goto();
    await page.waitForTimeout(200);

    // Edit mode should be off by default
    const plusButtons = page.locator('button[aria-label="increase"]');
    expect(await plusButtons.count()).toBe(0);
  });

  test('should increment cell value using + button', async ({ page }) => {
    // Navigate to table and enable edit mode
    await tablePage.goto();
    await page.waitForTimeout(200);

    await tablePage.enableEditMode();
    await page.waitForTimeout(300);

    // Increment ヨリ for 井上 梨名 (first member, first cut)
    await tablePage.incrementCell('井上 梨名', 0);

    // Wait for debounced save
    await page.waitForTimeout(800);

    // Verify value increased to 1
    const value = await tablePage.getCellValue('井上 梨名', 0);
    expect(value).toBe(1);

    // Verify in localStorage
    await assertPhotoCount(page, 'sakurazaka', '井上 梨名', [1, 0, 0, 0]);
  });

  test('should increment multiple times', async ({ page }) => {
    // Navigate to table and enable edit mode
    await tablePage.goto();
    await page.waitForTimeout(200);

    await tablePage.enableEditMode();

    // Increment 5 times
    for (let i = 0; i < 5; i++) {
      await tablePage.incrementCell('井上 梨名', 0);
    }

    const value = await tablePage.getCellValue('井上 梨名', 0);
    expect(value).toBe(5);
  });

  test('should decrement cell value using - button', async ({ page }) => {
    // Navigate to table and enable edit mode
    await tablePage.goto();
    await page.waitForTimeout(200);

    await tablePage.enableEditMode();

    // First increment to 3
    for (let i = 0; i < 3; i++) {
      await tablePage.incrementCell('井上 梨名', 0);
    }

    // Then decrement by 1
    await tablePage.decrementCell('井上 梨名', 0);

    const value = await tablePage.getCellValue('井上 梨名', 0);
    expect(value).toBe(2);
  });

  test('should not decrement below 0', async ({ page }) => {
    // Navigate to table and enable edit mode
    await tablePage.goto();
    await page.waitForTimeout(200);

    await tablePage.enableEditMode();

    // Try to decrement from 0
    await tablePage.decrementCell('井上 梨名', 0);

    // Should remain 0
    const value = await tablePage.getCellValue('井上 梨名', 0);
    expect(value).toBe(0);
  });

  test('should edit different cut types independently', async ({ page }) => {
    // Navigate to table and enable edit mode
    await tablePage.goto();
    await page.waitForTimeout(300);

    await tablePage.enableEditMode();

    // Increment different cuts for same member
    await tablePage.incrementCell('井上 梨名', 0); // ヨリ
    await tablePage.incrementCell('井上 梨名', 0); // ヨリ again
    await tablePage.incrementCell('井上 梨名', 1); // チュウ
    await tablePage.incrementCell('井上 梨名', 3); // 座り

    // Wait for debounced save
    await page.waitForTimeout(800);

    // Verify each cut
    expect(await tablePage.getCellValue('井上 梨名', 0)).toBe(2); // ヨリ
    expect(await tablePage.getCellValue('井上 梨名', 1)).toBe(1); // チュウ
    expect(await tablePage.getCellValue('井上 梨名', 2)).toBe(0); // ヒキ
    expect(await tablePage.getCellValue('井上 梨名', 3)).toBe(1); // 座り

    await assertPhotoCount(page, 'sakurazaka', '井上 梨名', [2, 1, 0, 1]);
  });

  test('should toggle edit mode on and off', async ({ page }) => {
    // Navigate to table and enable edit mode
    await tablePage.goto();
    await page.waitForTimeout(200);

    await tablePage.enableEditMode();
    expect(await page.locator('button[aria-label="increase"]').count()).toBeGreaterThan(0);

    // Disable edit mode (stay on same tab)
    await tablePage.disableEditMode();
    await page.waitForTimeout(200);

    // Should NOT have edit buttons anymore
    expect(await page.locator('button[aria-label="increase"]').count()).toBe(0);
  });

  test('should edit hinatazaka members in edit mode', async ({ page }) => {
    // Navigate to table and enable edit mode
    await tablePage.goto();
    await page.waitForTimeout(300);

    await tablePage.enableEditMode();

    // Switch to hinatazaka tab
    await page.waitForTimeout(200);
    await page.click('.tab-button:has-text("日向坂46")');
    await page.waitForTimeout(300);

    // Increment 金村 美玖's ヨリ
    await tablePage.incrementCell('金村 美玖', 0);
    await tablePage.incrementCell('金村 美玖', 0);

    // Wait for debounced save
    await page.waitForTimeout(800);

    const value = await tablePage.getCellValue('金村 美玖', 0);
    expect(value).toBe(2);

    await assertPhotoCount(page, 'hinatazaka', '金村 美玖', [2, 0, 0, 0]);
  });

  test('should preserve data when toggling edit mode', async ({ page }) => {
    // Navigate to table and enable edit mode
    await tablePage.goto();
    await page.waitForTimeout(200);

    await tablePage.enableEditMode();

    // Add data
    await tablePage.incrementCell('井上 梨名', 0);
    await tablePage.incrementCell('井上 梨名', 1);
    await page.waitForTimeout(800);

    // Toggle edit mode off and on (stay on table tab)
    await tablePage.disableEditMode();
    await page.waitForTimeout(200);
    await tablePage.enableEditMode();
    await page.waitForTimeout(200);

    // Data should still be there
    expect(await tablePage.getCellValue('井上 梨名', 0)).toBe(1);
    expect(await tablePage.getCellValue('井上 梨名', 1)).toBe(1);
  });

  test('should re-enable a member after its generation was auto-disabled', async ({ page }) => {
    const managementPage = new ManagementPage(page);

    // Go to management tab and open edit overlay for the default table
    await managementPage.goto();
    await page.waitForTimeout(200);

    // Open edit overlay for the default table
    await managementPage.openEditOverlay('新しいテーブル');
    await page.waitForTimeout(200);

    const dialog = page.locator('[role="dialog"]');

    // Find 二期生 generation and expand its member list
    const gen2Label = dialog.locator('label', { hasText: '二期生' });
    const gen2Container = gen2Label.locator('..');

    // Click the expand arrow button next to 二期生
    const expandButton = gen2Container.locator('button[aria-label="メンバー選択"]');
    await expandButton.click();
    await page.waitForTimeout(200);

    // Get all member checkboxes in the expanded list
    const memberCheckboxes = gen2Container.locator('..').locator('.ml-6 input[type="checkbox"]');
    const memberCount = await memberCheckboxes.count();
    expect(memberCount).toBeGreaterThan(0);

    // Uncheck all members one by one (this should auto-disable the generation)
    for (let i = 0; i < memberCount; i++) {
      const checkbox = memberCheckboxes.nth(i);
      if (await checkbox.isChecked()) {
        await checkbox.click();
        await page.waitForTimeout(50);
      }
    }
    await page.waitForTimeout(200);

    // The 二期生 generation checkbox should now be unchecked (auto-disabled)
    const gen2Checkbox = gen2Label.locator('input[type="checkbox"]');
    expect(await gen2Checkbox.isChecked()).toBe(false);

    // Re-expand the member list (it may have collapsed)
    const memberListVisible = await gen2Container.locator('..').locator('.ml-6').count();
    if (memberListVisible === 0) {
      await expandButton.click();
      await page.waitForTimeout(200);
    }

    // Re-enable the first member (井上 梨名)
    const firstMemberCheckbox = gen2Container
      .locator('..')
      .locator('.ml-6 input[type="checkbox"]')
      .first();
    await firstMemberCheckbox.click();
    await page.waitForTimeout(200);

    // The first member should now be checked (this was the bug - it stayed unchecked)
    expect(await firstMemberCheckbox.isChecked()).toBe(true);

    // The generation checkbox should be re-enabled (checked, possibly indeterminate)
    expect(await gen2Checkbox.isChecked()).toBe(true);
  });
});
