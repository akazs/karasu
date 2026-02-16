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

  test.beforeEach(async ({ page, browserName }) => {
    // Skip clipboard tests on WebKit/Safari - they don't support clipboard API in automation
    // The functionality works fine for real users, but automated testing has browser restrictions
    if (browserName === 'webkit') {
      test.skip();
    }

    // Mock clipboard API BEFORE any page load (for browsers that don't support it in automation)
    await page.addInitScript(() => {
      window.__clipboardData = '';
      const originalClipboard = navigator.clipboard;
      navigator.clipboard = {
        writeText: async (text) => {
          window.__clipboardData = text;
          if (originalClipboard && originalClipboard.writeText) {
            try {
              await originalClipboard.writeText(text);
            } catch {
              // Ignore clipboard write errors in automation
            }
          }
          return Promise.resolve();
        },
        readText: async () => {
          if (originalClipboard && originalClipboard.readText) {
            try {
              return await originalClipboard.readText();
            } catch {
              // Fall back to mock data if real clipboard is unavailable
              return window.__clipboardData;
            }
          }
          return window.__clipboardData;
        }
      };
    });

    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');

    managementPage = new ManagementPage(page);
    sorterPage = new SorterPage(page);
  });

  test('should export CSV to clipboard', async ({ page, context }) => {
    // Grant clipboard permissions (silently ignore if unsupported - clipboard API still works)
    try {
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    } catch {
      // Firefox/WebKit/Safari don't support grantPermissions, but clipboard API works anyway
    }

    // Add some photo data first
    await sorterPage.goto();
    await sorterPage.addPhoto('櫻坂46', '二期生', '井上 梨名', 'ヨリ');
    await sorterPage.addPhoto('櫻坂46', '二期生', '井上 梨名', 'チュウ');

    // Go to management and export CSV
    await managementPage.goto();

    const DEFAULT_TABLE_NAME = '新しいテーブル';
    await managementPage.exportTableCSV(DEFAULT_TABLE_NAME);

    // Read clipboard content (from mock or real clipboard)
    const clipboardContent = await page.evaluate(async () => {
      // Try to read from mock storage first (for WebKit/Safari)
      if (window.__clipboardData) {
        return window.__clipboardData;
      }
      // Fall back to real clipboard (for Chromium/Firefox)
      try {
        return await navigator.clipboard.readText();
      } catch {
        // If clipboard API fails, return mock data
        return window.__clipboardData || '';
      }
    });

    // Verify CSV format
    expect(clipboardContent).toContain('メンバー');
    expect(clipboardContent).toContain('ヨリ');
    expect(clipboardContent).toContain('チュウ');
    expect(clipboardContent).toContain('ヒキ');
    expect(clipboardContent).toContain('座り');
  });

  test('should include correct member data in CSV', async ({ page, context }) => {
    try {
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    } catch {
      // Firefox/WebKit/Safari don't support grantPermissions, but clipboard API works anyway
    }

    // Add data for specific members
    await sorterPage.goto();
    await sorterPage.addPhoto('櫻坂46', '二期生', '井上 梨名', 'ヨリ');
    await sorterPage.addPhoto('櫻坂46', '二期生', '井上 梨名', 'ヨリ');
    await sorterPage.addPhoto('櫻坂46', '二期生', '遠藤 光莉', 'チュウ');

    // Export CSV
    await managementPage.goto();
    await managementPage.exportTableCSV('新しいテーブル');

    const csv = await page.evaluate(async () => {
      if (window.__clipboardData) return window.__clipboardData;
      try {
        return await navigator.clipboard.readText();
      } catch {
        return window.__clipboardData || '';
      }
    });

    // Verify member data
    await assertCSVContainsMember(csv, '井上 梨名', [2, 0, 0, 0]);
    await assertCSVContainsMember(csv, '遠藤 光莉', [0, 1, 0, 0]);
  });

  test('should include all enabled group members in CSV', async ({ page, context }) => {
    try {
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    } catch {
      // Firefox/WebKit/Safari don't support grantPermissions, but clipboard API works anyway
    }

    // Add data for both groups
    await sorterPage.goto();
    await sorterPage.addPhoto('櫻坂46', '二期生', '井上 梨名', 'ヨリ');
    await sorterPage.addPhoto('日向坂46', '二期生', '金村 美玖', 'ヒキ');

    // Export CSV
    await managementPage.goto();
    await managementPage.exportTableCSV('新しいテーブル');

    const csv = await page.evaluate(async () => {
      if (window.__clipboardData) return window.__clipboardData;
      try {
        return await navigator.clipboard.readText();
      } catch {
        return window.__clipboardData || '';
      }
    });

    // Should contain members from both groups
    expect(csv).toContain('井上 梨名');
    expect(csv).toContain('金村 美玖');

    // Verify correct counts
    await assertCSVContainsMember(csv, '井上 梨名', [1, 0, 0, 0]);
    await assertCSVContainsMember(csv, '金村 美玖', [0, 0, 1, 0]);
  });

  test('should export empty table CSV with headers and zero counts', async ({ page, context }) => {
    try {
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    } catch {
      // Firefox/WebKit/Safari don't support grantPermissions, but clipboard API works anyway
    }

    // Export CSV without adding any data
    await managementPage.goto();
    await managementPage.exportTableCSV('新しいテーブル');

    const csv = await page.evaluate(async () => {
      if (window.__clipboardData) return window.__clipboardData;
      try {
        return await navigator.clipboard.readText();
      } catch {
        return window.__clipboardData || '';
      }
    });

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
    try {
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    } catch {
      // Firefox/WebKit/Safari don't support grantPermissions, but clipboard API works anyway
    }

    // Disable hinatazaka via edit overlay:
    // 1. Switch to hinatazaka radio (enables it, disables sakurazaka)
    // 2. Uncheck all hinatazaka generations (disables hinatazaka)
    // 3. Switch back to sakurazaka radio (re-enables it)
    // 4. Save
    await managementPage.goto();
    await managementPage.openEditOverlay('新しいテーブル');
    const dialog = page.locator('[role="dialog"]');

    // Switch to hinatazaka and uncheck all its generations
    await dialog.locator('input[type="radio"][value="hinatazaka"]').check();
    await page.waitForTimeout(200);
    const genCheckboxes = dialog.locator('.border.rounded.bg-gray-50 input[type="checkbox"]');
    const genCount = await genCheckboxes.count();
    for (let i = 0; i < genCount; i++) {
      await genCheckboxes.nth(i).uncheck();
    }
    await page.waitForTimeout(100);

    // Switch back to sakurazaka (re-enables sakurazaka with all generations)
    await dialog.locator('input[type="radio"][value="sakurazaka"]').check();
    await page.waitForTimeout(200);

    await page.click('[role="dialog"] button:has-text("保存")');
    await page.waitForTimeout(600);

    // Export CSV
    await managementPage.exportTableCSV('新しいテーブル');

    const csv = await page.evaluate(async () => {
      if (window.__clipboardData) return window.__clipboardData;
      try {
        return await navigator.clipboard.readText();
      } catch {
        return window.__clipboardData || '';
      }
    });

    // Should NOT contain hinatazaka members
    expect(csv).not.toContain('金村 美玖');

    // Should contain sakurazaka members
    expect(csv).toContain('井上 梨名');
  });

  test('should have correct CSV header format', async ({ page, context }) => {
    try {
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    } catch {
      // Firefox/WebKit/Safari don't support grantPermissions, but clipboard API works anyway
    }

    await managementPage.goto();
    await managementPage.exportTableCSV('新しいテーブル');

    const csv = await page.evaluate(async () => {
      if (window.__clipboardData) return window.__clipboardData;
      try {
        return await navigator.clipboard.readText();
      } catch {
        return window.__clipboardData || '';
      }
    });
    const header = csv.trim().split('\n')[0];

    // Verify header format
    expect(header).toBe('メンバー,ヨリ,チュウ,ヒキ,座り');
  });
});
