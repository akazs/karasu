import { test, expect } from '@playwright/test';
import { ManagementPage } from '../pages/ManagementPage.js';
import { SorterPage } from '../pages/SorterPage.js';
import { TablePage } from '../pages/TablePage.js';
import { assertTableCount } from '../helpers/assertions.js';

/**
 * Flow 10: Edge Cases
 *
 * Tests boundary conditions, error scenarios, and unusual states:
 * - Empty states (no data)
 * - Max table limit (10)
 * - Empty table name
 * - Table name at max length (30 chars)
 * - All groups disabled
 * - Rapid actions (double clicks, fast switching)
 * - Large photo counts
 */

test.describe('Edge Cases', () => {
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

  test('should handle empty table (all zeros)', async ({ page }) => {
    // Go to table view without adding any data
    await tablePage.goto();
    await page.waitForTimeout(200);

    // All members should have 0 counts
    const members = await tablePage.getVisibleMemberNames();
    expect(members.length).toBeGreaterThan(0);

    // Check first member has all zeros
    for (let i = 0; i < 4; i++) {
      const value = await tablePage.getCellValue(members[0], i);
      expect(value).toBe(0);
    }

    await page.screenshot({
      path: 'test-results/screenshots/empty-table.png'
    });
  });

  test('should enforce max 10 tables', async ({ page }) => {
    await managementPage.goto();

    // Create 9 more tables (1 default + 9 = 10)
    for (let i = 2; i <= 10; i++) {
      await managementPage.createTable(`表${i}`);
    }

    // Should have 10 tables
    await assertTableCount(page, 10);

    // Create button should be disabled
    expect(await managementPage.isCreateButtonDisabled()).toBe(true);

    // Should show max reached text
    await expect(page.locator('text=最大数に達しました')).toBeVisible();

    await page.screenshot({
      path: 'test-results/screenshots/max-tables.png'
    });
  });

  test('should not create table when prompt is dismissed', async ({ page }) => {
    await managementPage.goto();

    // Set up dialog handler before clicking
    page.once('dialog', async (dialog) => {
      await dialog.dismiss();
    });

    await page.locator('button', { hasText: '新規テーブル' }).click();
    await page.waitForTimeout(600);

    // Should still have only 1 table
    await assertTableCount(page, 1);
  });

  test('should handle table name at exactly 30 characters', async ({ page }) => {
    await managementPage.goto();

    const exactName = 'あ'.repeat(30); // Exactly 30 chars
    await managementPage.createTable(exactName);

    // Should succeed
    expect(await managementPage.tableExists(exactName)).toBe(true);
    await assertTableCount(page, 2);
  });

  test('should reject table name over 30 characters', async ({ page }) => {
    await managementPage.goto();

    const longName = 'あ'.repeat(31); // 31 chars

    // Handle both dialogs (prompt + alert)
    let dialogCount = 0;
    page.on('dialog', async (dialog) => {
      dialogCount++;
      if (dialog.type() === 'prompt') {
        await dialog.accept(longName);
      } else {
        await dialog.accept();
      }
    });

    await page.click('button:has-text("新規テーブル")');
    await page.waitForTimeout(1000);

    page.removeAllListeners('dialog');

    // Should still have only 1 table
    await assertTableCount(page, 1);
  });

  test('should not create table with whitespace-only name', async ({ page }) => {
    await managementPage.goto();

    // Set up dialog handler before clicking
    page.once('dialog', async (dialog) => {
      await dialog.accept('   ');  // Whitespace-only
    });

    await page.locator('button', { hasText: '新規テーブル' }).click();
    await page.waitForTimeout(600);

    // Whitespace-only name is treated as empty after trim, so no table created
    await assertTableCount(page, 1);
  });

  test('should prevent deleting last table', async ({ page }) => {
    await managementPage.goto();

    // Only 1 table - delete button should be disabled
    const tableCard = page.locator('.border.rounded', { hasText: '使用中' });
    const deleteButton = tableCard.locator('button:has-text("削除")');

    expect(await deleteButton.isDisabled()).toBe(true);
  });

  test('should handle rapid table switching', async ({ page }) => {
    await managementPage.goto();

    // Create 3 tables
    await managementPage.createTable('表A');
    await managementPage.createTable('表B');
    await managementPage.createTable('表C');

    // Rapidly switch between tables
    await managementPage.switchToTable('表A');
    await managementPage.switchToTable('表B');
    await managementPage.switchToTable('表C');
    await managementPage.switchToTable('新しいテーブル');

    // Should settle on the last switched table
    expect(await managementPage.isTableActive('新しいテーブル')).toBe(true);

    // No errors should have occurred
    const tables = await managementPage.getLocalStorage('karasu-tables');
    expect(tables.tables.length).toBe(4);
  });

  test('should handle large photo count values', async ({ page }) => {
    // Enable edit mode and increment many times
    const editCheckbox = page.locator('label', { hasText: '編集モード' }).locator('input[type="checkbox"]');
    await editCheckbox.check();

    await tablePage.goto();
    await page.waitForTimeout(200);

    // Increment 20 times
    for (let i = 0; i < 20; i++) {
      await tablePage.incrementCell('井上 梨名', 0);
    }

    const value = await tablePage.getCellValue('井上 梨名', 0);
    expect(value).toBe(20);

    await page.screenshot({
      path: 'test-results/screenshots/large-count.png'
    });
  });

  test('should handle clear current table data', async ({ page }) => {
    // Add some data first
    await sorterPage.goto();
    await sorterPage.addPhoto('櫻坂46', '二期生', '井上 梨名', 'ヨリ');
    await sorterPage.addPhoto('櫻坂46', '二期生', '遠藤 光莉', 'チュウ');
    await page.waitForTimeout(800);

    // Open edit overlay and clear data
    await managementPage.goto();
    await managementPage.openEditOverlay('新しいテーブル');

    // Click clear button and accept confirmation
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    await page.click('[role="dialog"] button:has-text("現在のテーブルをクリア")');
    await page.waitForTimeout(600);

    // Save and close
    await page.click('[role="dialog"] button:has-text("保存")');
    await page.waitForTimeout(600);

    page.removeAllListeners('dialog');

    // Verify data was cleared
    await tablePage.goto();
    await page.waitForTimeout(200);

    expect(await tablePage.getCellValue('井上 梨名', 0)).toBe(0);
    expect(await tablePage.getCellValue('遠藤 光莉', 1)).toBe(0);
  });

  test('should handle duplicate table correctly', async ({ page }) => {
    // Add data to the default table
    await sorterPage.goto();
    await sorterPage.addPhoto('櫻坂46', '二期生', '井上 梨名', 'ヨリ');
    await page.waitForTimeout(800);

    // Duplicate the table
    await managementPage.goto();
    await managementPage.duplicateTable('新しいテーブル');
    await page.waitForTimeout(600);

    // Should have 2 tables
    await assertTableCount(page, 2);

    // Both tables should have the data
    const tables = await managementPage.getLocalStorage('karasu-tables');
    for (const table of tables.tables) {
      expect(table.photoData.sakurazaka['井上 梨名']).toEqual([1, 0, 0, 0]);
    }
  });

  test('should handle renaming table to empty string via overlay', async ({ page }) => {
    await managementPage.goto();
    await managementPage.openEditOverlay('新しいテーブル');

    // Clear the name input
    const input = page.locator('input[type="text"]').first();
    await input.clear();

    // Save button should be disabled
    const saveButton = page.locator('[role="dialog"] button:has-text("保存")');
    expect(await saveButton.isDisabled()).toBe(true);

    await managementPage.cancelEdit();
  });

  test('should handle quick navigation between all tabs', async ({ page }) => {
    const tabNames = ['管理', '集計', '結果', 'その他', 'ヘルプ'];

    // Quickly navigate through all tabs
    for (const tab of tabNames) {
      await page.click(`button.tab:has-text("${tab}")`);
      await page.waitForTimeout(100);
    }

    // Go back to first tab
    await page.click('button.tab:has-text("管理")');
    await page.waitForTimeout(200);

    // App should still work correctly
    await expect(page.locator('text=テーブル管理')).toBeVisible();
  });

  test('should handle closing edit overlay via backdrop click', async ({ page }) => {
    await managementPage.goto();
    await managementPage.openEditOverlay('新しいテーブル');

    // Verify overlay is open
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Click backdrop (the fixed overlay)
    await page.locator('.fixed.inset-0').click({ position: { x: 10, y: 10 } });
    await page.waitForTimeout(200);

    // Overlay should be closed
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('should handle closing edit overlay via Escape key', async ({ page }) => {
    await managementPage.goto();
    await managementPage.openEditOverlay('新しいテーブル');

    // Verify overlay is open
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Focus the name input inside the dialog, then press Escape
    // The overlay's onkeydown handler on the input checks for Escape
    const nameInput = page.locator('[role="dialog"] input[type="text"]');
    await nameInput.focus();
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Overlay should be closed
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });
});
