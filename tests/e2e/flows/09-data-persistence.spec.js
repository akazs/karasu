import { test, expect } from '@playwright/test';
import { ManagementPage } from '../pages/ManagementPage.js';
import { SorterPage } from '../pages/SorterPage.js';
import { TablePage } from '../pages/TablePage.js';
import {
  assertPhotoCount,
  assertTableCount,
  assertLocalStorageExists
} from '../helpers/assertions.js';

/**
 * Flow 9: Data Persistence
 *
 * Tests that data is saved to localStorage correctly and loaded on page refresh:
 * - Photo counts persist (stored in karasu-tables -> tables[].photoData)
 * - Group settings persist (stored in karasu-tables -> tables[].groupSettings)
 * - Table management data persists
 * - Language preference persists
 * - Data survives page reload
 */

test.describe('Data Persistence', () => {
  let managementPage;
  let sorterPage;
  let tablePage;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');

    managementPage = new ManagementPage(page);
    sorterPage = new SorterPage(page);
    tablePage = new TablePage(page);
  });

  test('should create karasu-tables key on first load', async ({ page }) => {
    await assertLocalStorageExists(page, 'karasu-tables');

    const tables = await managementPage.getLocalStorage('karasu-tables');
    expect(tables).not.toBeNull();
    expect(tables.tables).toBeDefined();
    expect(tables.tables.length).toBe(1);
    expect(tables.activeTableId).toBeDefined();
  });

  test('should persist photo counts after page reload', async ({ page }) => {
    // Add photos via sorter
    await sorterPage.goto();
    await sorterPage.addPhoto('櫻坂46', '二期生', '井上 梨名', 'ヨリ');
    await sorterPage.addPhoto('櫻坂46', '二期生', '井上 梨名', 'チュウ');
    await sorterPage.addPhoto('日向坂46', '二期生', '金村 美玖', 'ヒキ');

    // Wait for debounced save (500ms debounce + buffer)
    await page.waitForTimeout(1000);

    // Verify data before reload
    await assertPhotoCount(page, 'sakurazaka', '井上 梨名', [1, 1, 0, 0]);
    await assertPhotoCount(page, 'hinatazaka', '金村 美玖', [0, 0, 1, 0]);

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify data after reload
    await assertPhotoCount(page, 'sakurazaka', '井上 梨名', [1, 1, 0, 0]);
    await assertPhotoCount(page, 'hinatazaka', '金村 美玖', [0, 0, 1, 0]);

    // Navigate to table and verify UI shows correct values
    await tablePage.goto();
    await page.waitForTimeout(300);

    expect(await tablePage.getCellValue('井上 梨名', 0)).toBe(1); // ヨリ
    expect(await tablePage.getCellValue('井上 梨名', 1)).toBe(1); // チュウ
  });

  test('should persist table management data after reload', async ({ page }) => {
    // Create additional tables
    await managementPage.goto();
    await managementPage.createTable('テスト表1');
    await managementPage.createTable('テスト表2');

    // Wait for save
    await page.waitForTimeout(800);

    // Reload
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify tables still exist
    await assertTableCount(page, 3);

    // Verify table names
    const tables = await managementPage.getLocalStorage('karasu-tables');
    const tableNames = tables.tables.map((t) => t.name);
    expect(tableNames).toContain('テスト表1');
    expect(tableNames).toContain('テスト表2');
  });

  test('should persist active table selection after reload', async ({ page }) => {
    // Create second table
    await managementPage.goto();
    await managementPage.createTable('アクティブ表');

    // The newly created table should be active
    await page.waitForTimeout(800);

    // Reload
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify active table persisted
    const tables = await managementPage.getLocalStorage('karasu-tables');
    const activeTable = tables.tables.find((t) => t.id === tables.activeTableId);
    expect(activeTable.name).toBe('アクティブ表');
  });

  test('should persist group settings after reload', async ({ page }) => {
    // Modify group settings: disable 四期生 generation in sakurazaka
    await managementPage.goto();
    await managementPage.openEditOverlay('新しいテーブル');

    const dialog = page.locator('[role="dialog"]');
    // Sakurazaka is selected by default; uncheck 四期生
    const gen4Label = dialog.locator('label').filter({ hasText: '四期生' });
    await gen4Label.locator('input[type="checkbox"]').uncheck();
    await page.click('[role="dialog"] button:has-text("保存")');
    await page.waitForTimeout(800);

    // Verify before reload
    let tables = await managementPage.getLocalStorage('karasu-tables');
    let activeTable = tables.tables.find((t) => t.id === tables.activeTableId);
    expect(activeTable.groupSettings.sakurazaka.generations['四期生']).toBe(false);

    // Reload
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify after reload
    tables = await managementPage.getLocalStorage('karasu-tables');
    activeTable = tables.tables.find((t) => t.id === tables.activeTableId);
    expect(activeTable.groupSettings.sakurazaka.generations['四期生']).toBe(false);
    expect(activeTable.groupSettings.sakurazaka.enabled).toBe(true);
  });

  test('should persist language preference after reload', async ({ page }) => {
    // Navigate to Settings tab
    await page.click('button.tab:has-text("設定")');
    await page.waitForTimeout(200);

    // Switch to Chinese
    const zhRadio = page.locator('input[type="radio"][value="zh-TW"]');
    await zhRadio.click();
    await page.waitForTimeout(600);

    // Verify locale in localStorage
    const locale = await page.evaluate(() => localStorage.getItem('karasu-locale'));
    expect(locale).toContain('zh-TW');

    // Reload
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should still be in Chinese
    await expect(page.locator('text=表格管理')).toBeVisible();
  });

  test('should persist renamed table after reload', async ({ page }) => {
    // Rename the default table
    await managementPage.goto();
    await managementPage.renameTable('新しいテーブル', 'リネーム済み');
    await page.waitForTimeout(800);

    // Reload
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify renamed table exists
    const tables = await managementPage.getLocalStorage('karasu-tables');
    const renamedTable = tables.tables.find((t) => t.name === 'リネーム済み');
    expect(renamedTable).toBeDefined();
  });

  test('should persist independent photo data per table', async ({ page }) => {
    // Add data to default table
    await sorterPage.goto();
    await sorterPage.addPhoto('櫻坂46', '二期生', '井上 梨名', 'ヨリ');
    await page.waitForTimeout(1000);

    // Create second table (becomes active)
    await managementPage.goto();
    await managementPage.createTable('別の表');
    await page.waitForTimeout(800);

    // Add different data to second table (new tables only have sakurazaka enabled)
    await sorterPage.goto();
    await sorterPage.addPhoto('櫻坂46', '二期生', '遠藤 光莉', 'チュウ');
    await page.waitForTimeout(1000);

    // Reload
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify each table has independent data
    const tables = await managementPage.getLocalStorage('karasu-tables');

    const defaultTable = tables.tables.find((t) => t.name === '新しいテーブル');
    const secondTable = tables.tables.find((t) => t.name === '別の表');

    expect(defaultTable).toBeDefined();
    expect(secondTable).toBeDefined();

    // Default table should have 井上 梨名 data
    expect(defaultTable.photoData.sakurazaka['井上 梨名']).toEqual([1, 0, 0, 0]);

    // Second table should have 遠藤 光莉 data
    expect(secondTable.photoData.sakurazaka['遠藤 光莉']).toEqual([0, 1, 0, 0]);

    // Cross-check: default table should NOT have 遠藤 光莉 data
    expect(defaultTable.photoData.sakurazaka['遠藤 光莉']).toBeUndefined();
  });

  test('should persist data after editing via edit mode', async ({ page }) => {
    // Go to table and enable edit mode
    await tablePage.goto();
    await page.waitForTimeout(300);
    await tablePage.enableEditMode();

    // Edit data
    await tablePage.incrementCell('井上 梨名', 0);
    await tablePage.incrementCell('井上 梨名', 2);

    // Wait for debounced save
    await page.waitForTimeout(1000);

    // Reload
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify data persisted
    await assertPhotoCount(page, 'sakurazaka', '井上 梨名', [1, 0, 1, 0]);
  });

  test('should clear all data correctly', async ({ page }) => {
    // Add some data first
    await sorterPage.goto();
    await sorterPage.addPhoto('櫻坂46', '二期生', '井上 梨名', 'ヨリ');
    await page.waitForTimeout(1000);

    // Create extra table
    await managementPage.goto();
    await managementPage.createTable('削除される表');
    await page.waitForTimeout(800);

    // Navigate to Settings tab and clear all data
    await page.click('button.tab:has-text("設定")');
    await page.waitForTimeout(200);

    // Click clear all button (shows ConfirmDialog)
    await page.locator('button[aria-label="clear all data"]').click();
    await page.waitForTimeout(200);

    // Confirm in the ConfirmDialog
    await page.click('button:has-text("削除する")');

    // Wait for page reload (the app calls window.location.reload after clearing)
    await page.waitForLoadState('load');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // After clear, should be back to initial state with 1 default table
    const tables = await managementPage.getLocalStorage('karasu-tables');
    expect(tables).not.toBeNull();
    expect(tables.tables.length).toBe(1);

    // Photo data should be empty (initial state may have {} or { sakurazaka: {}, hinatazaka: {} })
    const activeTable = tables.tables.find((t) => t.id === tables.activeTableId);
    const sakurazakaData = activeTable.photoData.sakurazaka || {};
    const hinatazakaData = activeTable.photoData.hinatazaka || {};
    expect(Object.keys(sakurazakaData).length).toBe(0);
    expect(Object.keys(hinatazakaData).length).toBe(0);
  });
});
