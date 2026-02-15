import { test, expect } from '@playwright/test';
import { ManagementPage } from '../pages/ManagementPage.js';
import { SorterPage } from '../pages/SorterPage.js';
import { assertCSVFormat, assertCSVContainsMember } from '../helpers/assertions.js';

/**
 * Flow 6: CSV Export
 *
 * Tests exporting table data to CSV:
 * - CSV format: メンバー,ヨリ,チュウ,ヒキ,座り
 * - CSV contains correct member data
 * - CSV only includes enabled groups/generations
 * - CSV export from management tab (copies to clipboard)
 * - Empty table CSV export
 */

test.describe('CSV Export', () => {
  let managementPage;
  let sorterPage;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');

    managementPage = new ManagementPage(page);
    sorterPage = new SorterPage(page);
  });

  test('should export CSV to clipboard', async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    // Add some photo data first
    await sorterPage.goto();
    await sorterPage.addPhoto('櫻坂46', '二期生', '井上 梨名', 'ヨリ');
    await sorterPage.addPhoto('櫻坂46', '二期生', '井上 梨名', 'チュウ');

    // Go to management and export CSV
    await managementPage.goto();

    const DEFAULT_TABLE_NAME = '新しいテーブル';
    await managementPage.exportTableCSV(DEFAULT_TABLE_NAME);

    // Read clipboard content
    const clipboardContent = await page.evaluate(() => navigator.clipboard.readText());

    // Verify CSV format
    expect(clipboardContent).toContain('メンバー');
    expect(clipboardContent).toContain('ヨリ');
    expect(clipboardContent).toContain('チュウ');
    expect(clipboardContent).toContain('ヒキ');
    expect(clipboardContent).toContain('座り');
  });

  test('should include correct member data in CSV', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    // Add data for specific members
    await sorterPage.goto();
    await sorterPage.addPhoto('櫻坂46', '二期生', '井上 梨名', 'ヨリ');
    await sorterPage.addPhoto('櫻坂46', '二期生', '井上 梨名', 'ヨリ');
    await sorterPage.addPhoto('櫻坂46', '二期生', '遠藤 光莉', 'チュウ');

    // Export CSV
    await managementPage.goto();
    await managementPage.exportTableCSV('新しいテーブル');

    const csv = await page.evaluate(() => navigator.clipboard.readText());

    // Verify member data
    await assertCSVContainsMember(csv, '井上 梨名', [2, 0, 0, 0]);
    await assertCSVContainsMember(csv, '遠藤 光莉', [0, 1, 0, 0]);
  });

  test('should include all enabled group members in CSV', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    // Add data for both groups
    await sorterPage.goto();
    await sorterPage.addPhoto('櫻坂46', '二期生', '井上 梨名', 'ヨリ');
    await sorterPage.addPhoto('日向坂46', '二期生', '金村 美玖', 'ヒキ');

    // Export CSV
    await managementPage.goto();
    await managementPage.exportTableCSV('新しいテーブル');

    const csv = await page.evaluate(() => navigator.clipboard.readText());

    // Should contain members from both groups
    expect(csv).toContain('井上 梨名');
    expect(csv).toContain('金村 美玖');

    // Verify correct counts
    await assertCSVContainsMember(csv, '井上 梨名', [1, 0, 0, 0]);
    await assertCSVContainsMember(csv, '金村 美玖', [0, 0, 1, 0]);
  });

  test('should export empty table CSV with headers and zero counts', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    // Export CSV without adding any data
    await managementPage.goto();
    await managementPage.exportTableCSV('新しいテーブル');

    const csv = await page.evaluate(() => navigator.clipboard.readText());

    // Should have header
    await assertCSVFormat(csv);

    // Members should have all zeros
    const lines = csv.trim().split('\n');
    // All data lines should end with 0,0,0,0
    for (let i = 1; i < lines.length; i++) {
      expect(lines[i]).toMatch(/,0,0,0,0$/);
    }
  });

  test('should exclude disabled group members from CSV', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    // Disable hinatazaka
    await managementPage.goto();
    await managementPage.openEditOverlay('新しいテーブル');
    const hinatazakaLabel = page.locator('[role="dialog"] label.font-bold', {
      hasText: '日向坂46'
    });
    await hinatazakaLabel.locator('input[type="checkbox"]').uncheck();
    await page.click('[role="dialog"] button:has-text("保存")');
    await page.waitForTimeout(600);

    // Export CSV
    await managementPage.exportTableCSV('新しいテーブル');

    const csv = await page.evaluate(() => navigator.clipboard.readText());

    // Should NOT contain hinatazaka members
    expect(csv).not.toContain('金村 美玖');

    // Should contain sakurazaka members
    expect(csv).toContain('井上 梨名');
  });

  test('should have correct CSV header format', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await managementPage.goto();
    await managementPage.exportTableCSV('新しいテーブル');

    const csv = await page.evaluate(() => navigator.clipboard.readText());
    const header = csv.trim().split('\n')[0];

    // Verify header format
    expect(header).toBe('メンバー,ヨリ,チュウ,ヒキ,座り');
  });
});
