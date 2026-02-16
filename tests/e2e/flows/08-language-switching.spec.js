import { test, expect } from '@playwright/test';

/**
 * Flow 8: Language Switching (i18n)
 *
 * Tests internationalization functionality:
 * - Switch from Japanese (ja-JP) to Chinese (zh-TW)
 * - UI text updates correctly
 * - Language persists after page reload
 * - All tabs update their text
 */

test.describe('Language Switching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('should default to Japanese', async ({ page }) => {
    // Tab names should be in Japanese
    await expect(page.locator('button.tab:has-text("管理")')).toBeVisible();
    await expect(page.locator('button.tab:has-text("集計")')).toBeVisible();
    await expect(page.locator('button.tab:has-text("テーブル")')).toBeVisible();
    await expect(page.locator('button.tab:has-text("その他")')).toBeVisible();
    await expect(page.locator('button.tab:has-text("設定")')).toBeVisible();
    await expect(page.locator('button.tab:has-text("ヘルプ")')).toBeVisible();

    // Management text should be in Japanese
    await expect(page.locator('text=テーブル管理')).toBeVisible();

    // Japanese radio should be checked (in settings tab)
    await page.click('button.tab:has-text("設定")');
    await page.waitForTimeout(200);
    const jaRadio = page.locator('input[type="radio"][value="ja-JP"]');
    expect(await jaRadio.isChecked()).toBe(true);
  });

  test('should switch to Chinese (zh-TW)', async ({ page }) => {
    // Navigate to settings tab first
    await page.click('button.tab:has-text("設定")');
    await page.waitForTimeout(200);

    // Click Chinese radio button
    const zhRadio = page.locator('input[type="radio"][value="zh-TW"]');
    await zhRadio.click();
    await page.waitForTimeout(300);

    // Tab names should update to Chinese
    await expect(page.locator('button.tab:has-text("管理")')).toBeVisible();  // Same in zh-TW
    await expect(page.locator('button.tab:has-text("統計")')).toBeVisible();  // 集計 -> 統計
    await expect(page.locator('button.tab:has-text("表格")')).toBeVisible();  // テーブル -> 表格
    await expect(page.locator('button.tab:has-text("其他")')).toBeVisible();  // その他 -> 其他
    await expect(page.locator('button.tab:has-text("設定")')).toBeVisible();  // Same in zh-TW
    await expect(page.locator('button.tab:has-text("說明")')).toBeVisible();  // ヘルプ -> 說明

    // Navigate back to management tab
    await page.click('button.tab:has-text("管理")');
    await page.waitForTimeout(200);

    // Management text should be in Chinese
    await expect(page.locator('text=表格管理')).toBeVisible();

    await page.screenshot({
      path: 'test-results/screenshots/language-chinese.png'
    });
  });

  test('should update section text in Chinese across tabs', async ({ page }) => {
    // Navigate to settings tab
    await page.click('button.tab:has-text("設定")');
    await page.waitForTimeout(200);

    // Switch to Chinese
    const zhRadio = page.locator('input[type="radio"][value="zh-TW"]');
    await zhRadio.click();
    await page.waitForTimeout(500);

    // Verify settings tab text changed
    await expect(page.locator('h2', { hasText: '語言設定' })).toBeVisible();   // 言語設定 -> 語言設定
    await expect(page.locator('h2', { hasText: '資料管理' })).toBeVisible();   // データ管理 -> 資料管理

    // Navigate to management tab
    await page.click('button.tab:has-text("管理")');
    await page.waitForTimeout(200);
    await expect(page.locator('h2', { hasText: '表格管理' })).toBeVisible();   // テーブル管理 -> 表格管理

    // Navigate to table tab
    await page.click('button.tab:has-text("表格")');
    await page.waitForTimeout(200);

    // Verify edit mode button text changed
    await expect(page.locator('button', { hasText: '編輯' })).toBeVisible();   // 編集 -> 編輯
  });

  test('should update simulator text when language changes', async ({ page }) => {
    // Navigate to settings tab
    await page.click('button.tab:has-text("設定")');
    await page.waitForTimeout(200);

    // Switch to Chinese
    const zhRadio = page.locator('input[type="radio"][value="zh-TW"]');
    await zhRadio.click();
    await page.waitForTimeout(300);

    // Navigate to utils tab (its name changed to 其他)
    await page.click('button.tab:has-text("其他")');
    await page.waitForTimeout(200);

    // Verify Chinese text
    await expect(page.locator('text=模擬')).toBeVisible();           // シミュレーション -> 模擬
    await expect(page.locator('text=成員人數')).toBeVisible();       // メンバー数 -> 成員人數
    await expect(page.locator('text=生寫種類')).toBeVisible();       // カット数 -> 生寫種類
    await expect(page.locator('text=購買包數')).toBeVisible();       // 購入パック数 -> 購買包數
  });

  test('should update table header when language changes', async ({ page }) => {
    // Navigate to settings tab
    await page.click('button.tab:has-text("設定")');
    await page.waitForTimeout(200);

    // Switch to Chinese
    const zhRadio = page.locator('input[type="radio"][value="zh-TW"]');
    await zhRadio.click();
    await page.waitForTimeout(300);

    // Navigate to table tab (テーブル -> 表格)
    await page.click('button.tab:has-text("表格")');
    await page.waitForTimeout(200);

    // Table header should be in Chinese
    await expect(page.locator('th', { hasText: '成員' })).toBeVisible();  // メンバー -> 成員
    // Cut names change too
    await expect(page.locator('th', { hasText: '大頭' })).toBeVisible();  // ヨリ -> 大頭
    await expect(page.locator('th', { hasText: '半身' })).toBeVisible();  // チュウ -> 半身
    await expect(page.locator('th', { hasText: '全身' })).toBeVisible();  // ヒキ -> 全身
    await expect(page.locator('th', { hasText: '坐姿' })).toBeVisible();  // 座り -> 坐姿

    await page.screenshot({
      path: 'test-results/screenshots/language-chinese-table.png'
    });
  });

  test('should persist language after page reload', async ({ page }) => {
    // Navigate to settings tab
    await page.click('button.tab:has-text("設定")');
    await page.waitForTimeout(200);

    // Switch to Chinese
    const zhRadio = page.locator('input[type="radio"][value="zh-TW"]');
    await zhRadio.click();
    await page.waitForTimeout(600);

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should still be in Chinese
    await expect(page.locator('text=表格管理')).toBeVisible();

    // Navigate to settings tab to check radio
    await page.click('button.tab:has-text("設定")');
    await page.waitForTimeout(200);

    // Chinese radio should still be checked
    const zhRadioAfterReload = page.locator('input[type="radio"][value="zh-TW"]');
    expect(await zhRadioAfterReload.isChecked()).toBe(true);
  });

  test('should switch back to Japanese from Chinese', async ({ page }) => {
    // Navigate to Settings tab
    await page.click('button.tab:has-text("設定")');
    await page.waitForTimeout(200);

    // Switch to Chinese first
    const zhRadio = page.locator('input[type="radio"][value="zh-TW"]');
    await zhRadio.click();
    await page.waitForTimeout(300);

    // Verify Chinese
    await expect(page.locator('text=語言設定')).toBeVisible();

    // Switch back to Japanese
    const jaRadio = page.locator('input[type="radio"][value="ja-JP"]');
    await jaRadio.click();
    await page.waitForTimeout(300);

    // Navigate to management tab to verify Japanese
    await page.click('button.tab:has-text("管理")');
    await page.waitForTimeout(200);

    await expect(page.locator('text=テーブル管理')).toBeVisible();
    await expect(page.locator('button.tab:has-text("集計")')).toBeVisible();
  });

  test('should update help page text when language changes', async ({ page }) => {
    // Navigate to help tab
    await page.click('button.tab:has-text("ヘルプ")');
    await page.waitForTimeout(200);

    // Should see Japanese help content
    await expect(page.locator('text=注意事項')).toBeVisible();
    await expect(page.locator('text=使い方')).toBeVisible();

    // Go to Settings and switch language
    await page.click('button.tab:has-text("設定")');
    await page.waitForTimeout(200);

    const zhRadio = page.locator('input[type="radio"][value="zh-TW"]');
    await zhRadio.click();
    await page.waitForTimeout(300);

    // Navigate back to help
    await page.click('button.tab:has-text("說明")');
    await page.waitForTimeout(200);

    // Should see Chinese help content
    await expect(page.locator('text=注意事項')).toBeVisible();  // Same in Chinese
    await expect(page.locator('text=使用方法')).toBeVisible();   // 使い方 -> 使用方法
  });
});
