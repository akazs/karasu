import { test as base } from '@playwright/test';

/**
 * localStorage Fixture
 *
 * Provides utilities for managing localStorage in tests:
 * - cleanLocalStorage: Clear all localStorage before test
 * - seedTables: Seed localStorage with table data
 * - seedPhotos: Seed localStorage with photo data
 */
export const test = base.extend({
  /**
   * Clean localStorage before each test
   */
  cleanLocalStorage: async ({ page }, use) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await use(page);
  },

  /**
   * Seed tables into localStorage
   * Usage: await seedTables({ tables: [...], activeTableId: '...' })
   */
  seedTables: async ({ page }, use) => {
    const seeder = async (data) => {
      await page.goto('/');
      await page.evaluate((d) => {
        localStorage.setItem('karasu-tables', JSON.stringify(d));
      }, data);
      await page.reload();
    };
    await use(seeder);
  },

  /**
   * Seed photo data into localStorage (legacy format)
   * Usage: await seedPhotos({ sakurazaka: { '井上 梨名': [1,0,0,0] } })
   */
  seedPhotos: async ({ page }, use) => {
    const seeder = async (data) => {
      await page.goto('/');
      await page.evaluate((d) => {
        localStorage.setItem('sortedPhotos20250716', JSON.stringify(d));
      }, data);
      await page.reload();
    };
    await use(seeder);
  },

  /**
   * Seed group settings into localStorage
   * Usage: await seedGroupSettings({ sakurazaka: { enabled: true, generations: {...} } })
   */
  seedGroupSettings: async ({ page }, use) => {
    const seeder = async (data) => {
      await page.goto('/');
      await page.evaluate((d) => {
        localStorage.setItem('karasu-group-state', JSON.stringify(d));
      }, data);
      await page.reload();
    };
    await use(seeder);
  },

  /**
   * Seed locale preference into localStorage
   * Usage: await seedLocale('zh-TW')
   */
  seedLocale: async ({ page }, use) => {
    const seeder = async (locale) => {
      await page.goto('/');
      await page.evaluate((l) => {
        localStorage.setItem('karasu-locale', l);
      }, locale);
      await page.reload();
    };
    await use(seeder);
  }
});

export { expect } from '@playwright/test';
