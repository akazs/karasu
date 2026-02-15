/**
 * BasePage - Base class for all Page Object Model classes
 *
 * Provides common functionality:
 * - Tab navigation
 * - localStorage helpers
 * - Debounce handling (500ms save debounce)
 * - Common wait patterns
 */
export class BasePage {
  constructor(page) {
    this.page = page;
  }

  /**
   * Navigate to a specific tab by name
   * @param {string} tabName - Tab name (e.g., "管理", "仕分け", "表", "ツール")
   */
  async navigateToTab(tabName) {
    await this.page.click(`button.tab:has-text("${tabName}")`);
    await this.page.waitForTimeout(100);
  }

  /**
   * Wait for debounced save to complete
   * The app uses 500ms debounce for localStorage saves
   * @param {number} ms - Milliseconds to wait (default: 600ms = 500ms debounce + 100ms buffer)
   */
  async waitForDebounce(ms = 600) {
    await this.page.waitForTimeout(ms);
  }

  /**
   * Get value from localStorage
   * @param {string} key - localStorage key
   * @returns {Promise<any>} Parsed JSON value or null
   */
  async getLocalStorage(key) {
    const value = await this.page.evaluate((k) => localStorage.getItem(k), key);
    return value ? JSON.parse(value) : null;
  }

  /**
   * Set value in localStorage
   * @param {string} key - localStorage key
   * @param {any} value - Value to store (will be JSON stringified)
   */
  async setLocalStorage(key, value) {
    await this.page.evaluate(
      ({ k, v }) => localStorage.setItem(k, JSON.stringify(v)),
      { k: key, v: value }
    );
  }

  /**
   * Clear all localStorage data
   */
  async clearLocalStorage() {
    await this.page.evaluate(() => localStorage.clear());
  }

  /**
   * Reload the page and wait for it to be ready
   */
  async reload() {
    await this.page.reload();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get clipboard content (requires clipboard-read permission)
   * @returns {Promise<string>} Clipboard text content
   */
  async getClipboardContent() {
    return await this.page.evaluate(() => navigator.clipboard.readText());
  }

  /**
   * Wait for a dialog (prompt/confirm) and handle it
   * @param {Function} action - Action that triggers the dialog
   * @param {string} response - Text to enter (for prompt) or null for confirm
   * @returns {Promise<void>}
   */
  async handleDialog(action, response = null) {
    const dialogPromise = this.page.waitForEvent('dialog');
    action(); // Don't await - let it run in parallel
    const dialog = await dialogPromise;
    if (response !== null) {
      await dialog.accept(response);
    } else {
      await dialog.accept();
    }
  }

  /**
   * Wait for element to be visible
   * @param {string} selector - CSS selector
   * @param {object} options - Playwright locator options
   */
  async waitForVisible(selector, options = {}) {
    await this.page.locator(selector, options).waitFor({ state: 'visible' });
  }

  /**
   * Wait for element to be hidden
   * @param {string} selector - CSS selector
   * @param {object} options - Playwright locator options
   */
  async waitForHidden(selector, options = {}) {
    await this.page.locator(selector, options).waitFor({ state: 'hidden' });
  }
}
