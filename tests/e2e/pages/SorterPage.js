import { BasePage } from './BasePage.js';

/**
 * SorterPage - Page Object for the Sorter (仕分け) tab
 *
 * Handles:
 * - 4-step photo selection: Group → Generation → Member → Cut
 * - Auto-skip logic when only one option is enabled
 * - Back button navigation
 * - Photo count updates
 */
export class SorterPage extends BasePage {
  constructor(page) {
    super(page);
  }

  /**
   * Navigate to Sorter tab
   */
  async goto() {
    await this.navigateToTab('集計');
  }

  /**
   * Add a photo using the full 4-step selection process
   * @param {string} groupName - Group name (e.g., "櫻坂46", "日向坂46")
   * @param {string} genName - Generation name (e.g., "二期生", "三期生")
   * @param {string} memberName - Member name (e.g., "井上 梨名")
   * @param {string} cutName - Cut type (e.g., "ヨリ", "チュウ", "ヒキ", "座り")
   */
  async addPhoto(groupName, genName, memberName, cutName) {
    // Step 1: Select group (may be auto-skipped if only one enabled)
    const groupButtons = await this.page
      .locator('button[aria-label]')
      .filter({ hasText: groupName })
      .count();
    if (groupButtons > 0) {
      await this.page.click(`button[aria-label="${groupName}"]`);
      await this.page.waitForTimeout(100);
    }

    // Step 2: Select generation (may be auto-skipped if only one enabled)
    const genButtons = await this.page
      .locator('button[aria-label]')
      .filter({ hasText: genName })
      .count();
    if (genButtons > 0) {
      await this.page.click(`button[aria-label="${genName}"]`);
      await this.page.waitForTimeout(100);
    }

    // Step 3: Select member
    await this.page.click(`button[aria-label="${memberName}"]`);
    await this.page.waitForTimeout(100);

    // Step 4: Select cut type
    await this.page.click(`button[aria-label="${cutName}"]`);
    await this.waitForDebounce();
  }

  /**
   * Click the back button to go to previous step
   */
  async goBack() {
    await this.page.click('button:has-text("戻る")');
    await this.page.waitForTimeout(100);
  }

  /**
   * Get current step indicator text
   * @returns {Promise<string>} Step text (e.g., "グループ選択", "期選択")
   */
  async getCurrentStep() {
    const heading = await this.page.locator('h2').first().textContent();
    return heading.trim();
  }

  /**
   * Check if group selection is visible
   * @returns {Promise<boolean>}
   */
  async isGroupSelectionVisible() {
    const count = await this.page.locator('button[aria-label]').filter({ hasText: '坂46' }).count();
    return count > 0;
  }

  /**
   * Check if generation selection is visible
   * @returns {Promise<boolean>}
   */
  async isGenerationSelectionVisible() {
    const count = await this.page.locator('button[aria-label]').filter({ hasText: '期生' }).count();
    return count > 0;
  }

  /**
   * Check if member selection is visible
   * @returns {Promise<boolean>}
   */
  async isMemberSelectionVisible() {
    const heading = await this.page.locator('h2').first().textContent();
    return heading.includes('メンバー選択');
  }

  /**
   * Check if cut selection is visible
   * @returns {Promise<boolean>}
   */
  async isCutSelectionVisible() {
    const count = await this.page.locator('button[aria-label="ヨリ"]').count();
    return count > 0;
  }

  /**
   * Get count of available buttons at current step
   * @returns {Promise<number>}
   */
  async getAvailableOptionsCount() {
    return await this.page.locator('button[aria-label]').count();
  }
}
