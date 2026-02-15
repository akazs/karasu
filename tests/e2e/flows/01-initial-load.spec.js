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

    // Should have 5 tabs: 管理, 集計, 結果, その他, ヘルプ
    expect(tabCount).toBe(5);

    // Verify each tab text
    const expectedTabs = ['管理', '集計', '結果', 'その他', 'ヘルプ'];
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
      { name: '結果', expected: 'メンバー' },  // Table shows member header
      { name: 'その他', expected: 'シミュレーション' },  // Utils shows simulation
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

  test('should display edit mode section', async ({ page }) => {
    await expect(page.locator('h2', { hasText: '編集モード' })).toBeVisible();
    const editLabel = page.locator('label', { hasText: '編集モード' });
    await expect(editLabel).toBeVisible();
    const editCheckbox = editLabel.locator('input[type="checkbox"]');
    await expect(editCheckbox).toBeVisible();
    expect(await editCheckbox.isChecked()).toBe(false);
  });

  test('should display language settings section', async ({ page }) => {
    await expect(page.locator('text=言語設定')).toBeVisible();

    // Japanese should be selected by default
    const jaRadio = page.locator('input[type="radio"][value="ja-JP"]');
    await expect(jaRadio).toBeVisible();
    expect(await jaRadio.isChecked()).toBe(true);
  });

  test('should display data management section', async ({ page }) => {
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
