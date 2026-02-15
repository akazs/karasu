import { BasePage } from './BasePage.js';

/**
 * TablePage - Page Object for the Table (表) tab
 *
 * Handles:
 * - Viewing photo counts in table format
 * - Edit mode (toggle, increment/decrement)
 * - Group tab switching
 * - Cell value validation
 */
export class TablePage extends BasePage {
  constructor(page) {
    super(page);
  }

  /**
   * Navigate to Table tab
   */
  async goto() {
    await this.navigateToTab('結果');
  }

  /**
   * Enable edit mode (shows +/- buttons)
   */
  async enableEditMode() {
    const checkbox = this.page.locator('input[type="checkbox"]').first();
    const isChecked = await checkbox.isChecked();
    if (!isChecked) {
      await checkbox.check();
      await this.page.waitForTimeout(100);
    }
  }

  /**
   * Disable edit mode
   */
  async disableEditMode() {
    const checkbox = this.page.locator('input[type="checkbox"]').first();
    const isChecked = await checkbox.isChecked();
    if (isChecked) {
      await checkbox.uncheck();
      await this.page.waitForTimeout(100);
    }
  }

  /**
   * Increment a cell value using the + button
   * @param {string} memberName - Member name
   * @param {number} cutIndex - Cut index (0=ヨリ, 1=チュウ, 2=ヒキ, 3=座り)
   */
  async incrementCell(memberName, cutIndex) {
    const row = this.page.locator('tr', { hasText: memberName });
    const cells = row.locator('td');
    // Member name is in a <th>, so td cells start at index 0 for first cut
    const cell = cells.nth(cutIndex);
    await cell.locator('button:has-text("+")').click();
    await this.waitForDebounce();
  }

  /**
   * Decrement a cell value using the - button
   * @param {string} memberName - Member name
   * @param {number} cutIndex - Cut index (0=ヨリ, 1=チュウ, 2=ヒキ, 3=座り)
   */
  async decrementCell(memberName, cutIndex) {
    const row = this.page.locator('tr', { hasText: memberName });
    const cells = row.locator('td');
    // Member name is in a <th>, so td cells start at index 0 for first cut
    const cell = cells.nth(cutIndex);
    await cell.locator('button:has-text("-")').click();
    await this.waitForDebounce();
  }

  /**
   * Get a cell value
   * @param {string} memberName - Member name
   * @param {number} cutIndex - Cut index (0=ヨリ, 1=チュウ, 2=ヒキ, 3=座り)
   * @returns {Promise<number>}
   */
  async getCellValue(memberName, cutIndex) {
    const row = this.page.locator('tr', { hasText: memberName });
    const cells = row.locator('td');
    // Member name is in a <th>, so td cells start at index 0 for first cut
    const cell = cells.nth(cutIndex);
    const text = await cell.textContent();
    // Extract number from text (may include +/- buttons in edit mode)
    const match = text.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  }

  /**
   * Switch to a group tab
   * @param {string} groupName - Group name (e.g., "櫻坂46", "日向坂46")
   */
  async switchToGroupTab(groupName) {
    await this.page.click(`button.tab:has-text("${groupName}")`);
    await this.page.waitForTimeout(100);
  }

  /**
   * Check if a member row exists in the table
   * @param {string} memberName - Member name
   * @returns {Promise<boolean>}
   */
  async memberRowExists(memberName) {
    const count = await this.page.locator('tr', { hasText: memberName }).count();
    return count > 0;
  }

  /**
   * Get all member names visible in the current table
   * @returns {Promise<string[]>}
   */
  async getVisibleMemberNames() {
    const rows = this.page.locator('tbody tr');
    const count = await rows.count();
    const names = [];
    for (let i = 0; i < count; i++) {
      const firstCell = rows.nth(i).locator('td').first();
      const text = await firstCell.textContent();
      names.push(text.trim());
    }
    return names;
  }

  /**
   * Get generation section headers
   * @returns {Promise<string[]>}
   */
  async getGenerationHeaders() {
    const headers = this.page.locator('h3');
    const count = await headers.count();
    const titles = [];
    for (let i = 0; i < count; i++) {
      const text = await headers.nth(i).textContent();
      titles.push(text.trim());
    }
    return titles;
  }

  /**
   * Check if edit mode is enabled
   * @returns {Promise<boolean>}
   */
  async isEditModeEnabled() {
    const checkbox = this.page.locator('input[type="checkbox"]').first();
    return await checkbox.isChecked();
  }

  /**
   * Check if group tabs are visible
   * @returns {Promise<boolean>}
   */
  async areGroupTabsVisible() {
    const tabs = this.page.locator('button.tab').filter({ hasText: '坂46' });
    const count = await tabs.count();
    return count > 1; // More than just the main navigation tabs
  }

  /**
   * Get total photo count for a member
   * @param {string} memberName - Member name
   * @returns {Promise<number>}
   */
  async getMemberTotalCount(memberName) {
    const row = this.page.locator('tr', { hasText: memberName });
    const cells = row.locator('td');
    let total = 0;
    for (let i = 0; i < 4; i++) { // td cells start at 0 (member name is in th)
      const cell = cells.nth(i);
      const text = await cell.textContent();
      const match = text.match(/\d+/);
      if (match) {
        total += parseInt(match[0]);
      }
    }
    return total;
  }
}
