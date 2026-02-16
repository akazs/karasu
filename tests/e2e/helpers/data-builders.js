import { randomUUID } from 'crypto';

/**
 * Data builder utilities for creating test data
 */

/**
 * Create a table object for seeding localStorage
 * @param {string} name - Table name
 * @param {object} options - Optional configuration
 * @param {object} options.photoData - Photo data by group
 * @param {object} options.groupSettings - Group settings
 * @param {string} options.id - Table ID (auto-generated if not provided)
 * @returns {object} Table object
 */
export function createTable(name, options = {}) {
  const now = new Date().toISOString();
  return {
    id: options.id || randomUUID(),
    name,
    createdAt: now,
    lastModified: now,
    photoData: options.photoData || {
      sakurazaka: {},
      hinatazaka: {}
    },
    groupSettings: options.groupSettings || {
      sakurazaka: {
        enabled: true,
        generations: {
          二期生: true,
          三期生: true,
          四期生: true,
          五期生: true
        }
      },
      hinatazaka: {
        enabled: true,
        generations: {
          二期生: true,
          三期生: true,
          四期生: true,
          五期生: true
        }
      }
    }
  };
}

/**
 * Create tables data structure for localStorage
 * @param {object[]} tables - Array of table objects
 * @param {string} activeTableId - Active table ID (defaults to first table)
 * @returns {object} Tables data structure
 */
export function createTablesData(tables, activeTableId = null) {
  return {
    tables,
    activeTableId: activeTableId || (tables.length > 0 ? tables[0].id : null)
  };
}

/**
 * Create photo data for a single member
 * @param {number} yori - ヨリ count
 * @param {number} chu - チュウ count
 * @param {number} hiki - ヒキ count
 * @param {number} suwari - 座り count
 * @returns {number[]} Photo counts array
 */
export function createPhotoCounts(yori = 0, chu = 0, hiki = 0, suwari = 0) {
  return [yori, chu, hiki, suwari];
}

/**
 * Create group settings
 * @param {boolean} sakurazakaEnabled - Sakurazaka46 enabled
 * @param {boolean} hinatazakaEnabled - Hinatazaka46 enabled
 * @param {object} sakurazakaGenerations - Sakurazaka generation settings
 * @param {object} hinatazakaGenerations - Hinatazaka generation settings
 * @returns {object} Group settings object
 */
export function createGroupSettings(
  sakurazakaEnabled = true,
  hinatazakaEnabled = true,
  sakurazakaGenerations = {},
  hinatazakaGenerations = {}
) {
  return {
    sakurazaka: {
      enabled: sakurazakaEnabled,
      generations: {
        二期生: true,
        三期生: true,
        四期生: true,
        五期生: true,
        ...sakurazakaGenerations
      }
    },
    hinatazaka: {
      enabled: hinatazakaEnabled,
      generations: {
        二期生: true,
        三期生: true,
        四期生: true,
        五期生: true,
        ...hinatazakaGenerations
      }
    }
  };
}

/**
 * Create a table with pre-populated photo data
 * @param {string} name - Table name
 * @param {object} members - Member data: { groupId: { memberName: [counts] } }
 * @returns {object} Table object with photo data
 */
export function createTableWithPhotos(name, members) {
  const photoData = {
    sakurazaka: members.sakurazaka || {},
    hinatazaka: members.hinatazaka || {}
  };

  return createTable(name, { photoData });
}

/**
 * Create sample photo data for testing
 * @returns {object} Photo data with several members
 */
export function createSamplePhotoData() {
  return {
    sakurazaka: {
      '井上 梨名': [1, 2, 0, 0],
      '遠藤 光莉': [0, 1, 1, 0],
      '大園 玲': [2, 0, 0, 1]
    },
    hinatazaka: {
      '金村 美玖': [1, 0, 2, 0],
      '河田 陽菜': [0, 0, 1, 1]
    }
  };
}

/**
 * Create empty photo data structure
 * @returns {object} Empty photo data
 */
export function createEmptyPhotoData() {
  return {
    sakurazaka: {},
    hinatazaka: {}
  };
}
