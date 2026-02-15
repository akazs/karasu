import { BasePage } from './BasePage.js';

/**
 * ManagementPage - Page Object for the Management (管理) tab
 *
 * Handles:
 * - Creating new tables
 * - Switching between tables
 * - Renaming tables
 * - Duplicating tables
 * - Deleting tables
 * - Exporting table data to CSV
 * - Opening edit overlay for table settings
 */
export class ManagementPage extends BasePage {
  constructor(page) {
    super(page);
  }

  /**
   * Navigate to Management tab
   */
  async goto() {
    await this.navigateToTab('管理');
  }

  /**
   * Create a new table with the given name
   * @param {string} name - Table name (max 30 characters)
   */
  async createTable(name) {
    await this.handleDialog(
      async () => await this.page.click('button:has-text("新規テーブル")'),
      name
    );
    await this.waitForDebounce();
  }

  /**
   * Switch to a specific table by name
   * @param {string} tableName - Name of the table to switch to
   */
  async switchToTable(tableName) {
    const tableCard = this.page.locator('.border.rounded', { hasText: tableName });
    await tableCard.locator('button:has-text("切替")').click();
    await this.waitForDebounce();
  }

  /**
   * Export a table to CSV (copies to clipboard)
   * @param {string} tableName - Name of the table to export
   */
  async exportTableCSV(tableName) {
    const tableCard = this.page.locator('.border.rounded', { hasText: tableName });

    // Handle the alert that appears after copying
    this.page.once('dialog', dialog => dialog.accept());

    await tableCard.locator('button:has-text("CSV")').click();
    await this.waitForDebounce();
  }

  /**
   * Open the edit overlay for a table
   * @param {string} tableName - Name of the table to edit
   */
  async openEditOverlay(tableName) {
    const tableCard = this.page.locator('.border.rounded', { hasText: tableName });
    await tableCard.locator('button:has-text("編集")').click();
    await this.waitForVisible('[role="dialog"]');
  }

  /**
   * Rename a table via the edit overlay
   * @param {string} oldName - Current table name
   * @param {string} newName - New table name
   */
  async renameTable(oldName, newName) {
    await this.openEditOverlay(oldName);
    const input = this.page.locator('input[type="text"]').first();
    await input.clear();
    await input.fill(newName);
    await this.page.click('button:has-text("保存")');
    await this.waitForHidden('[role="dialog"]');
    await this.waitForDebounce();
  }

  /**
   * Duplicate a table
   * @param {string} tableName - Name of the table to duplicate
   */
  async duplicateTable(tableName) {
    const tableCard = this.page.locator('.border.rounded', { hasText: tableName });
    await tableCard.locator('button:has-text("コピー")').click();
    await this.waitForDebounce();
  }

  /**
   * Delete a table (with confirmation)
   * @param {string} tableName - Name of the table to delete
   */
  async deleteTable(tableName) {
    const tableCard = this.page.locator('.border.rounded', { hasText: tableName });
    await tableCard.locator('button:has-text("削除")').click();

    // Wait for ConfirmDialog to appear
    await this.waitForVisible('[role="dialog"]');

    // Click confirm button in dialog
    await this.page.locator('[role="dialog"] button:has-text("削除する")').click();
    await this.waitForHidden('[role="dialog"]');
    await this.waitForDebounce();
  }

  /**
   * Check if a table exists by name
   * @param {string} tableName - Table name to check
   * @returns {Promise<boolean>}
   */
  async tableExists(tableName) {
    const count = await this.page.locator('.border.rounded', { hasText: tableName }).count();
    return count > 0;
  }

  /**
   * Check if a table is currently active (has "使用中" badge)
   * @param {string} tableName - Table name to check
   * @returns {Promise<boolean>}
   */
  async isTableActive(tableName) {
    const tableCard = this.page.locator('.border.rounded', { hasText: tableName });
    const badge = tableCard.locator('text=使用中');
    const count = await badge.count();
    return count > 0;
  }

  /**
   * Get the count of all tables
   * @returns {Promise<number>}
   */
  async getTableCount() {
    return await this.page.locator('.border.rounded').count();
  }

  /**
   * Check if create button is disabled
   * @returns {Promise<boolean>}
   */
  async isCreateButtonDisabled() {
    const button = this.page.locator('button:has-text("新規テーブル")');
    return await button.isDisabled();
  }

  /**
   * Clear all data in a table via edit overlay
   * @param {string} tableName - Table name
   */
  async clearTableData(tableName) {
    await this.openEditOverlay(tableName);
    await this.handleDialog(
      async () => await this.page.click('button:has-text("消去")'),
      null
    );
    await this.page.click('button:has-text("保存")');
    await this.waitForHidden('[role="dialog"]');
    await this.waitForDebounce();
  }

  /**
   * Toggle a group in the edit overlay
   * @param {string} tableName - Table name
   * @param {string} groupName - Group name (e.g., "櫻坂46", "日向坂46")
   */
  async toggleGroup(tableName, groupName) {
    await this.openEditOverlay(tableName);
    const checkbox = this.page.locator(`input[type="checkbox"]`, { has: this.page.locator(`text=${groupName}`) }).first();
    await checkbox.click();
    await this.page.click('button:has-text("保存")');
    await this.waitForHidden('[role="dialog"]');
    await this.waitForDebounce();
  }

  /**
   * Cancel edit overlay without saving
   */
  async cancelEdit() {
    await this.page.click('button:has-text("キャンセル")');
    await this.waitForHidden('[role="dialog"]');
  }
}
