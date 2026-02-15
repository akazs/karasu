import { BasePage } from './BasePage.js';

/**
 * UtilsPage - Page Object for the Utils (ツール) tab
 *
 * Handles:
 * - Photo draw simulator
 * - Language switching (i18n)
 * - Clear all data
 */
export class UtilsPage extends BasePage {
  constructor(page) {
    super(page);
  }

  /**
   * Navigate to Utils tab
   */
  async goto() {
    await this.navigateToTab('ツール');
  }

  /**
   * Switch language using the language selector
   * @param {string} locale - Locale code (e.g., "ja-JP", "zh-TW")
   */
  async switchLanguage(locale) {
    const select = this.page.locator('select');
    await select.selectOption(locale);
    await this.waitForDebounce();
  }

  /**
   * Get current language from selector
   * @returns {Promise<string>} Current locale (e.g., "ja-JP")
   */
  async getCurrentLanguage() {
    const select = this.page.locator('select');
    return await select.inputValue();
  }

  /**
   * Clear all data (with confirmation)
   */
  async clearAllData() {
    await this.handleDialog(
      async () => await this.page.click('button:has-text("全て消去")'),
      null
    );
    await this.waitForDebounce();
  }

  /**
   * Get text content of a specific UI element to verify i18n
   * @param {string} selector - CSS selector
   * @returns {Promise<string>}
   */
  async getUIText(selector) {
    return await this.page.locator(selector).textContent();
  }

  /**
   * Check if a tab exists with specific text (for i18n verification)
   * @param {string} tabText - Tab text to check
   * @returns {Promise<boolean>}
   */
  async tabExists(tabText) {
    const count = await this.page.locator(`button.tab:has-text("${tabText}")`).count();
    return count > 0;
  }

  /**
   * Enter value in photo draw simulator input
   * @param {number} count - Number of photos to simulate
   */
  async enterPhotoDrawCount(count) {
    const input = this.page.locator('input[type="number"]').first();
    await input.clear();
    await input.fill(count.toString());
  }

  /**
   * Get photo draw simulation results
   * @returns {Promise<string>} Simulation result text
   */
  async getPhotoDrawResults() {
    const results = this.page.locator('.results'); // Adjust selector as needed
    return await results.textContent();
  }
}
