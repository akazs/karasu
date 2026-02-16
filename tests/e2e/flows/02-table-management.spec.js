import { test, expect } from '@playwright/test';
import { ManagementPage } from '../pages/ManagementPage.js';
import { assertTableCount, assertActiveTable } from '../helpers/assertions.js';

/**
 * Flow 1: Table Management
 *
 * Tests critical table management operations:
 * - Create new table
 * - Switch between tables
 * - Rename table
 * - Duplicate table
 * - Delete table
 * - Max table limit (10 tables)
 * - Validation (empty names, max 30 chars)
 */

test.describe('Table Management', () => {
  let managementPage;
  const DEFAULT_TABLE_NAME = '新しいテーブル'; // Default table name from ja-JP locale

  test.beforeEach(async ({ page }) => {
    // Clear localStorage to ensure clean state for each test
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');

    managementPage = new ManagementPage(page);
    await managementPage.goto();
  });

  test('should create a new table', async ({ page }) => {
    // Initial state should have 1 default table
    await assertTableCount(page, 1);

    // Create new table
    await managementPage.createTable('テスト表');

    // Verify table was created
    expect(await managementPage.tableExists('テスト表')).toBe(true);
    await assertTableCount(page, 2);

    // Verify new table is automatically active
    expect(await managementPage.isTableActive('テスト表')).toBe(true);
    await assertActiveTable(page, 'テスト表');
  });

  test('should switch between tables', async ({ page }) => {
    // Create second table (which becomes active)
    await managementPage.createTable('表2');

    // Verify new table is active
    expect(await managementPage.isTableActive('表2')).toBe(true);

    // Switch back to default table
    await managementPage.switchToTable(DEFAULT_TABLE_NAME);

    // Verify active table changed
    expect(await managementPage.isTableActive(DEFAULT_TABLE_NAME)).toBe(true);
    expect(await managementPage.isTableActive('表2')).toBe(false);
    await assertActiveTable(page, DEFAULT_TABLE_NAME);

    // Switch to table 2 again
    await managementPage.switchToTable('表2');
    expect(await managementPage.isTableActive('表2')).toBe(true);
    await assertActiveTable(page, '表2');
  });

  test('should rename a table', async () => {
    const oldName = DEFAULT_TABLE_NAME;
    const newName = '新しい名前';

    // Rename table
    await managementPage.renameTable(oldName, newName);

    // Verify table was renamed
    expect(await managementPage.tableExists(newName)).toBe(true);
    expect(await managementPage.tableExists(oldName)).toBe(false);

    // Verify data persisted
    const tables = await managementPage.getLocalStorage('karasu-tables');
    const table = tables.tables.find(t => t.name === newName);
    expect(table).toBeDefined();
  });

  test('should validate table name length (max 30 chars)', async ({ page }) => {
    const longName = 'あ'.repeat(31); // 31 characters

    // Click to show inline creation UI
    await page.click('button:has-text("新規テーブル")');
    await page.waitForTimeout(200);

    // Try to fill in a name longer than 30 chars
    const input = page.locator('input[type="text"]').first();
    await input.clear();
    await input.fill(longName);

    // Check that input enforces maxlength (should be truncated to 30)
    const actualValue = await input.inputValue();
    expect(actualValue.length).toBeLessThanOrEqual(30);

    // Cancel the creation
    await page.click('button:has-text("キャンセル")');
    await page.waitForTimeout(200);

    // Remove listeners
    page.removeAllListeners('dialog');

    // Verify table was not created (still only 1 table)
    await assertTableCount(page, 1);
  });

  test('should duplicate a table', async () => {
    // Get initial table count from localStorage (more reliable than UI count)
    const initialTables = await managementPage.getLocalStorage('karasu-tables');
    const initialCount = initialTables.tables.length;

    // Duplicate the default table
    await managementPage.duplicateTable(DEFAULT_TABLE_NAME);

    // Verify duplicate was created in localStorage
    const finalTables = await managementPage.getLocalStorage('karasu-tables');
    const finalCount = finalTables.tables.length;

    // The duplicate keeps the same name as the original
    expect(finalCount).toBe(initialCount + 1);

    // Verify both tables exist (duplicate has same name)
    const tableNames = finalTables.tables.map(t => t.name);
    expect(tableNames.filter(n => n === DEFAULT_TABLE_NAME).length).toBe(2);
  });

  test('should delete a table', async ({ page }) => {
    // Create additional table (so we have 2)
    await managementPage.createTable('削除予定');

    // Verify we have 2 tables
    await assertTableCount(page, 2);

    // Delete the new table
    await managementPage.deleteTable('削除予定');

    // Verify table was deleted
    expect(await managementPage.tableExists('削除予定')).toBe(false);
    await assertTableCount(page, 1);
  });

  test('should prevent deleting the last table', async ({ page }) => {
    // Verify we only have 1 table
    await assertTableCount(page, 1);

    // Try to delete it - button should be disabled
    const deleteButton = page.locator('.border.rounded', { hasText: DEFAULT_TABLE_NAME })
      .locator('button:has-text("削除")');

    // Check if button is disabled
    const isDisabled = await deleteButton.isDisabled();
    expect(isDisabled).toBe(true);
  });

  test('should enforce max table limit (10 tables)', async ({ page }) => {
    // Create 9 more tables (we already have 1 default)
    for (let i = 2; i <= 10; i++) {
      await managementPage.createTable(`表${i}`);
    }

    // Verify we have 10 tables
    await assertTableCount(page, 10);

    // Create button should now be disabled
    expect(await managementPage.isCreateButtonDisabled()).toBe(true);
  });

  test('should preserve table data when switching', async () => {
    // Create table 2
    await managementPage.createTable('表2');

    // Switch back to default table
    await managementPage.switchToTable(DEFAULT_TABLE_NAME);

    // Get initial localStorage state
    const initialTables = await managementPage.getLocalStorage('karasu-tables');
    const defaultTableData = initialTables.tables.find(t => t.name === DEFAULT_TABLE_NAME).photoData;

    // Switch to table 2 and back
    await managementPage.switchToTable('表2');
    await managementPage.switchToTable(DEFAULT_TABLE_NAME);

    // Verify data is unchanged
    const finalTables = await managementPage.getLocalStorage('karasu-tables');
    const finalDefaultData = finalTables.tables.find(t => t.name === DEFAULT_TABLE_NAME).photoData;

    expect(finalDefaultData).toEqual(defaultTableData);
  });

  test('should cancel edit without saving changes', async ({ page }) => {
    const originalName = DEFAULT_TABLE_NAME;

    // Open edit overlay
    await managementPage.openEditOverlay(originalName);

    // Verify overlay is visible
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Modify name (but don't save)
    const input = page.locator('input[type="text"]').first();
    await input.clear();
    await input.fill('変更後の名前');

    // Cancel edit
    await managementPage.cancelEdit();

    // Verify name was not changed
    expect(await managementPage.tableExists(originalName)).toBe(true);
    expect(await managementPage.tableExists('変更後の名前')).toBe(false);
  });

  test('should update lastModified timestamp on table operations', async ({ page }) => {
    const tableName = DEFAULT_TABLE_NAME;

    // Get initial timestamp
    const initialTables = await managementPage.getLocalStorage('karasu-tables');
    const initialTimestamp = initialTables.tables.find(t => t.name === tableName).lastModified;

    // Wait a bit to ensure timestamp difference
    await page.waitForTimeout(100);

    // Rename table
    await managementPage.renameTable(tableName, '新しい名前');

    // Get updated timestamp
    const updatedTables = await managementPage.getLocalStorage('karasu-tables');
    const updatedTimestamp = updatedTables.tables.find(t => t.name === '新しい名前').lastModified;

    // Verify timestamp was updated
    expect(new Date(updatedTimestamp).getTime()).toBeGreaterThan(new Date(initialTimestamp).getTime());
  });
});
