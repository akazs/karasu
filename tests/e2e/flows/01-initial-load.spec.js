import { test, expect } from '@playwright/test';

/**
 * Flow 2: Initial Load & UI
 *
 * Tests that the app loads correctly with all main UI elements:
 * - Tab navigation visible
 * - Default tab content renders
 * - All tabs are accessible
 * - Page title and structure
 */

test.describe('Initial Load & UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('should load the app without errors', async ({ page }) => {
    // Verify no console errors during load
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Allow time for any async errors
    await page.waitForTimeout(500);

    expect(errors.length).toBe(0);

    await page.screenshot({ path: 'test-results/screenshots/initial-load.png' });
  });

  test('should display all navigation tabs', async ({ page }) => {
    const tabs = page.locator('button.tab');
    const tabCount = await tabs.count();

    // Should have 6 tabs: 管理, 集計, テーブル, その他, 設定, ヘルプ
    expect(tabCount).toBe(6);

    // Verify each tab text
    const expectedTabs = ['管理', '集計', 'テーブル', 'その他', '設定', 'ヘルプ'];
    for (let i = 0; i < expectedTabs.length; i++) {
      const tabText = await tabs.nth(i).textContent();
      expect(tabText.trim()).toBe(expectedTabs[i]);
    }
  });

  test('should show management tab as default active tab', async ({ page }) => {
    // The management tab should be active by default
    const activeTab = page.locator('li.active button.tab');
    await expect(activeTab).toHaveText('管理');

    // Management content should be visible
    await expect(page.locator('text=テーブル管理')).toBeVisible();
  });

  test('should display default table on first load', async ({ page }) => {
    // A default table should exist
    const tableCard = page.locator('.border.rounded').first();
    await expect(tableCard).toBeVisible();

    // Should show "使用中" badge for the active table
    await expect(page.locator('text=使用中')).toBeVisible();
  });

  test('should navigate to all tabs', async ({ page }) => {
    // Navigate to each tab and verify content loads
    const tabTests = [
      { name: '管理', expected: 'テーブル管理' },
      { name: '集計', expected: '櫻坂46' },  // Sorter shows group buttons
      { name: 'テーブル', expected: 'メンバー' },  // Table shows member header
      { name: 'その他', expected: 'シミュレーション' },  // Utils shows simulation
      { name: '設定', expected: '言語設定' },  // Settings shows language settings
      { name: 'ヘルプ', expected: '注意事項' },  // Instruction shows warnings
    ];

    for (const tabTest of tabTests) {
      await page.click(`button.tab:has-text("${tabTest.name}")`);
      await page.waitForTimeout(200);
      await expect(page.locator(`text=${tabTest.expected}`).first()).toBeVisible();
    }
  });

  test('should have correct table count display', async ({ page }) => {
    // Should show "1/10" for table count
    await expect(page.locator('text=1/10')).toBeVisible();
  });

  test('should display edit mode section in results tab', async ({ page }) => {
    // Navigate to テーブル (results) tab
    await page.click('button.tab:has-text("テーブル")');
    await page.waitForTimeout(200);

    // Check for edit mode button (not checkbox)
    const editButton = page.locator('button', { hasText: '編集' });
    await expect(editButton).toBeVisible();

    // Verify it's not currently in edit mode (button should say "編集" not "編集終了")
    await expect(page.locator('button', { hasText: '編集終了' })).not.toBeVisible();
  });

  test('should display language settings section in settings tab', async ({ page }) => {
    // Navigate to 設定 (settings) tab
    await page.click('button.tab:has-text("設定")');
    await page.waitForTimeout(200);

    await expect(page.locator('text=言語設定')).toBeVisible();

    // Japanese should be selected by default
    const jaRadio = page.locator('input[type="radio"][value="ja-JP"]');
    await expect(jaRadio).toBeVisible();
    expect(await jaRadio.isChecked()).toBe(true);
  });

  test('should display data management section in settings tab', async ({ page }) => {
    // Navigate to 設定 (settings) tab
    await page.click('button.tab:has-text("設定")');
    await page.waitForTimeout(200);

    await expect(page.locator('text=データ管理')).toBeVisible();
    await expect(page.locator('text=すべてのデータをクリア')).toBeVisible();
  });

  test('should take full-page screenshot for visual verification', async ({ page }) => {
    await page.screenshot({
      path: 'test-results/screenshots/full-page-initial.png',
      fullPage: true
    });
  });
});
