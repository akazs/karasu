import { test, expect } from '@playwright/test';
import { SorterPage } from '../pages/SorterPage.js';
import { TablePage } from '../pages/TablePage.js';
import { assertPhotoCount } from '../helpers/assertions.js';

/**
 * Flow 4: Sorter Photo Input (Member Selection & Photo Count)
 *
 * Tests the 4-step photo selection: Group -> Generation -> Member -> Cut
 * - Full selection flow
 * - Back button navigation
 * - Photo count increments correctly
 * - Multiple photos for same member
 * - Verify counts appear in table view
 */

test.describe('Sorter Photo Input', () => {
  let sorterPage;
  let tablePage;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');

    sorterPage = new SorterPage(page);
    tablePage = new TablePage(page);
  });

  test('should show group selection as first step', async ({ page }) => {
    await sorterPage.goto();
    await page.waitForTimeout(200);

    // Both groups should be visible
    const sakurazakaButton = page.locator('button[aria-label="櫻坂46"]');
    const hinatazakaButton = page.locator('button[aria-label="日向坂46"]');

    await expect(sakurazakaButton).toBeVisible();
    await expect(hinatazakaButton).toBeVisible();

    await page.screenshot({
      path: 'test-results/screenshots/sorter-step1-group.png'
    });
  });

  test('should navigate to generation selection after group', async ({ page }) => {
    await sorterPage.goto();
    await page.waitForTimeout(200);

    // Click sakurazaka
    await page.click('button[aria-label="櫻坂46"]');
    await page.waitForTimeout(200);

    // Should see generation buttons
    await expect(page.locator('button[aria-label="二期生"]')).toBeVisible();
    await expect(page.locator('button[aria-label="三期生"]')).toBeVisible();
    await expect(page.locator('button[aria-label="四期生"]')).toBeVisible();

    // Should see back button
    await expect(page.locator('button[aria-label="back"]')).toBeVisible();

    await page.screenshot({
      path: 'test-results/screenshots/sorter-step2-generation.png'
    });
  });

  test('should navigate to member selection after generation', async ({ page }) => {
    await sorterPage.goto();
    await page.waitForTimeout(200);

    // Select sakurazaka -> 二期生
    await page.click('button[aria-label="櫻坂46"]');
    await page.waitForTimeout(100);
    await page.click('button[aria-label="二期生"]');
    await page.waitForTimeout(200);

    // Should see member buttons for 二期生
    await expect(page.locator('button[aria-label="井上 梨名"]')).toBeVisible();
    await expect(page.locator('button[aria-label="遠藤 光莉"]')).toBeVisible();
    await expect(page.locator('button[aria-label="山﨑 天"]')).toBeVisible();

    await page.screenshot({
      path: 'test-results/screenshots/sorter-step3-member.png'
    });
  });

  test('should navigate to cut selection after member', async ({ page }) => {
    await sorterPage.goto();
    await page.waitForTimeout(200);

    // Select sakurazaka -> 二期生 -> 井上 梨名
    await page.click('button[aria-label="櫻坂46"]');
    await page.waitForTimeout(100);
    await page.click('button[aria-label="二期生"]');
    await page.waitForTimeout(100);
    await page.click('button[aria-label="井上 梨名"]');
    await page.waitForTimeout(200);

    // Should see cut buttons
    await expect(page.locator('button[aria-label="ヨリ"]')).toBeVisible();
    await expect(page.locator('button[aria-label="チュウ"]')).toBeVisible();
    await expect(page.locator('button[aria-label="ヒキ"]')).toBeVisible();
    await expect(page.locator('button[aria-label="座り"]')).toBeVisible();

    await page.screenshot({
      path: 'test-results/screenshots/sorter-step4-cut.png'
    });
  });

  test('should add photo and return to group selection', async ({ page }) => {
    await sorterPage.goto();

    // Full selection flow: sakurazaka -> 二期生 -> 井上 梨名 -> ヨリ
    await sorterPage.addPhoto('櫻坂46', '二期生', '井上 梨名', 'ヨリ');

    // Should return to group selection
    const sakurazakaButton = page.locator('button[aria-label="櫻坂46"]');
    await expect(sakurazakaButton).toBeVisible();

    // Verify photo count in localStorage
    await assertPhotoCount(page, 'sakurazaka', '井上 梨名', [1, 0, 0, 0]);
  });

  test('should increment photo count for same member', async ({ page }) => {
    await sorterPage.goto();

    // Add 3 ヨリ photos for 井上 梨名
    for (let i = 0; i < 3; i++) {
      await sorterPage.addPhoto('櫻坂46', '二期生', '井上 梨名', 'ヨリ');
    }

    // Verify photo count is 3
    await assertPhotoCount(page, 'sakurazaka', '井上 梨名', [3, 0, 0, 0]);
  });

  test('should add different cut types for same member', async ({ page }) => {
    await sorterPage.goto();

    // Add different cuts for 井上 梨名
    await sorterPage.addPhoto('櫻坂46', '二期生', '井上 梨名', 'ヨリ');
    await sorterPage.addPhoto('櫻坂46', '二期生', '井上 梨名', 'チュウ');
    await sorterPage.addPhoto('櫻坂46', '二期生', '井上 梨名', 'ヒキ');
    await sorterPage.addPhoto('櫻坂46', '二期生', '井上 梨名', '座り');

    // Verify all cut types
    await assertPhotoCount(page, 'sakurazaka', '井上 梨名', [1, 1, 1, 1]);
  });

  test('should add photos for different members', async ({ page }) => {
    await sorterPage.goto();

    // Add for sakurazaka member
    await sorterPage.addPhoto('櫻坂46', '二期生', '井上 梨名', 'ヨリ');

    // Add for hinatazaka member
    await sorterPage.addPhoto('日向坂46', '二期生', '金村 美玖', 'チュウ');

    // Verify both
    await assertPhotoCount(page, 'sakurazaka', '井上 梨名', [1, 0, 0, 0]);
    await assertPhotoCount(page, 'hinatazaka', '金村 美玖', [0, 1, 0, 0]);
  });

  test('should reflect photo counts in table view', async ({ page }) => {
    await sorterPage.goto();

    // Add photos via sorter
    await sorterPage.addPhoto('櫻坂46', '二期生', '井上 梨名', 'ヨリ');
    await sorterPage.addPhoto('櫻坂46', '二期生', '井上 梨名', 'ヨリ');
    await sorterPage.addPhoto('櫻坂46', '二期生', '井上 梨名', 'チュウ');

    // Wait for debounced save to complete
    await page.waitForTimeout(800);

    // Switch to table view
    await tablePage.goto();
    await page.waitForTimeout(300);

    // Verify counts in table
    const yoriCount = await tablePage.getCellValue('井上 梨名', 0);
    const chuCount = await tablePage.getCellValue('井上 梨名', 1);
    const hikiCount = await tablePage.getCellValue('井上 梨名', 2);
    const suwariCount = await tablePage.getCellValue('井上 梨名', 3);

    expect(yoriCount).toBe(2);
    expect(chuCount).toBe(1);
    expect(hikiCount).toBe(0);
    expect(suwariCount).toBe(0);

    await page.screenshot({
      path: 'test-results/screenshots/sorter-result-in-table.png'
    });
  });

  test('should navigate back using back button', async ({ page }) => {
    await sorterPage.goto();
    await page.waitForTimeout(200);

    // Go to generation selection
    await page.click('button[aria-label="櫻坂46"]');
    await page.waitForTimeout(200);

    // Verify at generation step
    await expect(page.locator('button[aria-label="二期生"]')).toBeVisible();

    // Go back to group selection
    await page.click('button[aria-label="back"]');
    await page.waitForTimeout(200);

    // Should be back at group selection
    await expect(page.locator('button[aria-label="櫻坂46"]')).toBeVisible();
  });

  test('should navigate back from member selection', async ({ page }) => {
    await sorterPage.goto();
    await page.waitForTimeout(200);

    // Navigate to member selection
    await page.click('button[aria-label="櫻坂46"]');
    await page.waitForTimeout(100);
    await page.click('button[aria-label="二期生"]');
    await page.waitForTimeout(200);

    // Verify at member step
    await expect(page.locator('button[aria-label="井上 梨名"]')).toBeVisible();

    // Go back to generation selection
    await page.click('button[aria-label="back"]');
    await page.waitForTimeout(200);

    // Should be at generation step
    await expect(page.locator('button[aria-label="二期生"]')).toBeVisible();
  });

  test('should navigate back from cut selection', async ({ page }) => {
    await sorterPage.goto();
    await page.waitForTimeout(200);

    // Navigate to cut selection
    await page.click('button[aria-label="櫻坂46"]');
    await page.waitForTimeout(100);
    await page.click('button[aria-label="二期生"]');
    await page.waitForTimeout(100);
    await page.click('button[aria-label="井上 梨名"]');
    await page.waitForTimeout(200);

    // Verify at cut step
    await expect(page.locator('button[aria-label="ヨリ"]')).toBeVisible();

    // Go back to member selection
    await page.click('button[aria-label="back"]');
    await page.waitForTimeout(200);

    // Should be at member step
    await expect(page.locator('button[aria-label="井上 梨名"]')).toBeVisible();
  });

  test('should show hinatazaka members correctly', async ({ page }) => {
    await sorterPage.goto();
    await page.waitForTimeout(200);

    // Navigate to hinatazaka -> 四期生
    await page.click('button[aria-label="日向坂46"]');
    await page.waitForTimeout(100);
    await page.click('button[aria-label="四期生"]');
    await page.waitForTimeout(200);

    // Should show hinatazaka 四期生 members
    await expect(page.locator('button[aria-label="石塚 瑶季"]')).toBeVisible();
    await expect(page.locator('button[aria-label="正源司 陽子"]')).toBeVisible();

    await page.screenshot({
      path: 'test-results/screenshots/sorter-hinatazaka-members.png'
    });
  });
});
