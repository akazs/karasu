import { test, expect } from '@playwright/test';

/**
 * Flow 7: Photo Draw Simulator
 *
 * Tests the photo draw simulator tool:
 * - Default values display correctly
 * - Changing input values updates results
 * - Results contain expected statistical output
 * - Edge cases (0 packs, large values)
 */

test.describe('Photo Draw Simulator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Navigate to その他 tab
    await page.click('button.tab:has-text("その他")');
    await page.waitForTimeout(200);
  });

  test('should display simulator section', async ({ page }) => {
    await expect(page.locator('text=シミュレーション')).toBeVisible();

    // Should have input fields
    await expect(page.locator('label', { hasText: 'メンバー数' })).toBeVisible();
    await expect(page.locator('label', { hasText: 'カット数' })).toBeVisible();
    await expect(page.locator('label', { hasText: 'パックあたりの枚数' })).toBeVisible();
    await expect(page.locator('label', { hasText: '購入パック数' })).toBeVisible();

    await page.screenshot({
      path: 'test-results/screenshots/simulator.png'
    });
  });

  test('should have default values', async ({ page }) => {
    // Check default values
    const cutsInput = page.locator('#n_cuts');
    const sheetsInput = page.locator('#n_onedraw');
    const packsInput = page.locator('#n_packs');

    await expect(cutsInput).toHaveValue('4');
    await expect(sheetsInput).toHaveValue('5');
    await expect(packsInput).toHaveValue('10');
  });

  test('should auto-calculate member count from enabled groups', async ({ page }) => {
    const membersInput = page.locator('#n_members');
    const value = await membersInput.inputValue();

    // With both groups and all generations enabled, total members should be > 0
    const numMembers = parseInt(value);
    expect(numMembers).toBeGreaterThan(0);

    // Total members: sakurazaka (13+11+9=33) + hinatazaka (3+4+11+10=28) = 61
    expect(numMembers).toBe(61);
  });

  test('should display simulation results', async ({ page }) => {
    // Results section should be visible with default values
    const resultsSection = page.locator('.bg-gray-50.rounded');
    await expect(resultsSection).toBeVisible();

    // Wait for async simulation (debounce + worker) to complete
    await expect(resultsSection).not.toContainText('計算中', { timeout: 5000 });

    const resultText = await resultsSection.textContent();

    // Should contain statistical result text
    expect(resultText).toContain('95%');
    expect(resultText).toContain('コンプ');
    expect(resultText).toContain('カット');
  });

  test('should update results when changing pack count', async ({ page }) => {
    const resultsSection = page.locator('.bg-gray-50.rounded');

    // Get initial results
    const initialResult = await resultsSection.textContent();

    // Change pack count to a larger number
    const packsInput = page.locator('#n_packs');
    await packsInput.clear();
    await packsInput.fill('100');
    await page.waitForTimeout(500);

    // Get updated results
    const updatedResult = await resultsSection.textContent();

    // Results should change
    expect(updatedResult).not.toBe(initialResult);
  });

  test('should update results when changing cuts count', async ({ page }) => {
    const resultsSection = page.locator('.bg-gray-50.rounded');

    // Change cuts to 2
    const cutsInput = page.locator('#n_cuts');
    await cutsInput.clear();
    await cutsInput.fill('2');
    await page.waitForTimeout(500);

    const resultText = await resultsSection.textContent();
    expect(resultText).toContain('95%');
  });

  test('should handle zero packs input', async ({ page }) => {
    const packsInput = page.locator('#n_packs');
    await packsInput.clear();
    await packsInput.fill('0');
    await page.waitForTimeout(500);

    // Should still display results (0 packs = 0 comp)
    const resultsSection = page.locator('.bg-gray-50.rounded');
    const resultText = await resultsSection.textContent();
    expect(resultText).toContain('0.00');
  });

  test('should handle large pack count', async ({ page }) => {
    const packsInput = page.locator('#n_packs');
    await packsInput.clear();
    await packsInput.fill('1000');

    // Large pack count simulation takes longer - wait for async completion
    const resultsSection = page.locator('.bg-gray-50.rounded');
    await expect(resultsSection).not.toContainText('計算中', { timeout: 10000 });

    // Should compute without errors
    await expect(resultsSection).toBeVisible();
    const resultText = await resultsSection.textContent();
    expect(resultText).toContain('95%');
  });

  test('should update member count display format', async ({ page }) => {
    // The total cuts calculation should use members * cuts
    const resultsSection = page.locator('.bg-gray-50.rounded');

    // Wait for async simulation (debounce + worker) to complete
    await expect(resultsSection).not.toContainText('計算中', { timeout: 5000 });

    const resultText = await resultsSection.textContent();

    // With 61 members and 4 cuts = 244 total cuts
    expect(resultText).toContain('244');
  });
});
