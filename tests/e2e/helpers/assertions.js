import { expect } from '@playwright/test';

/**
 * Custom assertion helpers for karasu E2E tests
 */

/**
 * Assert that localStorage contains expected data
 * @param {Page} page - Playwright page
 * @param {string} key - localStorage key
 * @param {object} expectedSubset - Expected data (partial match)
 */
export async function assertLocalStorageContains(page, key, expectedSubset) {
  const stored = await page.evaluate((k) => localStorage.getItem(k), key);
  expect(stored).not.toBeNull();
  const data = JSON.parse(stored);
  expect(data).toMatchObject(expectedSubset);
}

/**
 * Assert that localStorage key exists
 * @param {Page} page - Playwright page
 * @param {string} key - localStorage key
 */
export async function assertLocalStorageExists(page, key) {
  const stored = await page.evaluate((k) => localStorage.getItem(k), key);
  expect(stored).not.toBeNull();
}

/**
 * Assert that localStorage key does not exist
 * @param {Page} page - Playwright page
 * @param {string} key - localStorage key
 */
export async function assertLocalStorageNotExists(page, key) {
  const stored = await page.evaluate((k) => localStorage.getItem(k), key);
  expect(stored).toBeNull();
}

/**
 * Assert CSV format is correct
 * @param {string} csvText - CSV content
 * @param {number} expectedRows - Expected number of data rows (excluding header)
 */
export async function assertCSVFormat(csvText, expectedRows) {
  const lines = csvText.trim().split('\n');
  expect(lines.length).toBeGreaterThan(0);
  // Header should contain the photo type columns
  expect(lines[0]).toMatch(/メンバー.*ヨリ.*チュウ.*ヒキ.*座り/);
  // Check row count if specified
  if (expectedRows !== undefined) {
    expect(lines.length).toBe(expectedRows + 1); // +1 for header
  }
}

/**
 * Assert CSV contains specific member data
 * @param {string} csvText - CSV content
 * @param {string} memberName - Member name to find
 * @param {number[]} expectedCounts - Expected counts [ヨリ, チュウ, ヒキ, 座り]
 */
export async function assertCSVContainsMember(csvText, memberName, expectedCounts) {
  const lines = csvText.trim().split('\n');
  const memberLine = lines.find((line) => line.startsWith(memberName));
  expect(memberLine).toBeDefined();

  const expected = `${memberName},${expectedCounts.join(',')}`;
  expect(memberLine).toBe(expected);
}

/**
 * Assert photo count in localStorage
 * @param {Page} page - Playwright page
 * @param {string} group - Group ID (sakurazaka/hinatazaka)
 * @param {string} memberName - Member name
 * @param {number[]} expectedCounts - Expected counts [ヨリ, チュウ, ヒキ, 座り]
 */
export async function assertPhotoCount(page, group, memberName, expectedCounts) {
  const tables = await page.evaluate(() => {
    const data = localStorage.getItem('karasu-tables');
    return data ? JSON.parse(data) : null;
  });

  expect(tables).not.toBeNull();
  expect(tables.tables).toBeDefined();
  expect(tables.tables.length).toBeGreaterThan(0);

  const activeTable = tables.tables.find((t) => t.id === tables.activeTableId);
  expect(activeTable).toBeDefined();

  const photoData = activeTable.photoData;
  expect(photoData[group]).toBeDefined();
  expect(photoData[group][memberName]).toEqual(expectedCounts);
}

/**
 * Assert table count in localStorage
 * @param {Page} page - Playwright page
 * @param {number} expectedCount - Expected number of tables
 */
export async function assertTableCount(page, expectedCount) {
  const tables = await page.evaluate(() => {
    const data = localStorage.getItem('karasu-tables');
    return data ? JSON.parse(data) : null;
  });

  expect(tables).not.toBeNull();
  expect(tables.tables).toBeDefined();
  expect(tables.tables.length).toBe(expectedCount);
}

/**
 * Assert active table by name
 * @param {Page} page - Playwright page
 * @param {string} tableName - Expected active table name
 */
export async function assertActiveTable(page, tableName) {
  const tables = await page.evaluate(() => {
    const data = localStorage.getItem('karasu-tables');
    return data ? JSON.parse(data) : null;
  });

  expect(tables).not.toBeNull();
  const activeTable = tables.tables.find((t) => t.id === tables.activeTableId);
  expect(activeTable).toBeDefined();
  expect(activeTable.name).toBe(tableName);
}
