import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  detectBrowserLanguage,
  loadLocaleFromStorage,
  saveLocaleToStorage,
  getNestedValue,
  interpolate
} from '../index.js';

describe('i18n utilities', () => {
  describe('detectBrowserLanguage', () => {
    let originalNavigator;

    beforeEach(() => {
      originalNavigator = global.navigator;
    });

    afterEach(() => {
      global.navigator = originalNavigator;
    });

    it('returns ja-JP for Japanese browser (ja)', () => {
      global.navigator = { language: 'ja' };
      expect(detectBrowserLanguage()).toBe('ja-JP');
    });

    it('returns ja-JP for Japanese browser (ja-JP)', () => {
      global.navigator = { language: 'ja-JP' };
      expect(detectBrowserLanguage()).toBe('ja-JP');
    });

    it('returns zh-TW for Chinese browser (zh)', () => {
      global.navigator = { language: 'zh' };
      expect(detectBrowserLanguage()).toBe('zh-TW');
    });

    it('returns zh-TW for Chinese browser (zh-TW)', () => {
      global.navigator = { language: 'zh-TW' };
      expect(detectBrowserLanguage()).toBe('zh-TW');
    });

    it('returns zh-TW for Chinese browser (zh-CN)', () => {
      global.navigator = { language: 'zh-CN' };
      expect(detectBrowserLanguage()).toBe('zh-TW');
    });

    it('returns ja-JP (default) for English browser', () => {
      global.navigator = { language: 'en-US' };
      expect(detectBrowserLanguage()).toBe('ja-JP');
    });

    it('returns ja-JP (default) for French browser', () => {
      global.navigator = { language: 'fr-FR' };
      expect(detectBrowserLanguage()).toBe('ja-JP');
    });

    it('uses userLanguage as fallback if language is not available', () => {
      global.navigator = { userLanguage: 'zh-TW' };
      expect(detectBrowserLanguage()).toBe('zh-TW');
    });
  });

  describe('localStorage operations', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    afterEach(() => {
      localStorage.clear();
    });

    it('saveLocaleToStorage saves locale to localStorage', () => {
      saveLocaleToStorage('zh-TW');
      expect(localStorage.getItem('karasu-locale')).toBe('zh-TW');
    });

    it('loadLocaleFromStorage loads locale from localStorage', () => {
      localStorage.setItem('karasu-locale', 'ja-JP');
      expect(loadLocaleFromStorage()).toBe('ja-JP');
    });

    it('loadLocaleFromStorage returns null if not set', () => {
      expect(loadLocaleFromStorage()).toBeNull();
    });

    it('saveLocaleToStorage overwrites existing value', () => {
      localStorage.setItem('karasu-locale', 'ja-JP');
      saveLocaleToStorage('zh-TW');
      expect(localStorage.getItem('karasu-locale')).toBe('zh-TW');
    });
  });

  describe('getNestedValue', () => {
    const testObj = {
      app: {
        tabs: {
          management: '管理',
          sorter: '集計'
        },
        cuts: {
          yori: 'ヨリ'
        }
      },
      simple: 'value'
    };

    it('gets top-level value', () => {
      expect(getNestedValue(testObj, 'simple')).toBe('value');
    });

    it('gets nested value (2 levels)', () => {
      expect(getNestedValue(testObj, 'app.tabs')).toEqual({
        management: '管理',
        sorter: '集計'
      });
    });

    it('gets nested value (3 levels)', () => {
      expect(getNestedValue(testObj, 'app.tabs.management')).toBe('管理');
    });

    it('returns undefined for non-existent key', () => {
      expect(getNestedValue(testObj, 'nonexistent')).toBeUndefined();
    });

    it('returns undefined for non-existent nested key', () => {
      expect(getNestedValue(testObj, 'app.nonexistent')).toBeUndefined();
    });

    it('returns undefined for non-existent deep nested key', () => {
      expect(getNestedValue(testObj, 'app.tabs.nonexistent')).toBeUndefined();
    });

    it('handles null object gracefully', () => {
      expect(getNestedValue(null, 'app.tabs')).toBeUndefined();
    });

    it('handles undefined object gracefully', () => {
      expect(getNestedValue(undefined, 'app.tabs')).toBeUndefined();
    });
  });

  describe('interpolate', () => {
    it('replaces single placeholder', () => {
      expect(interpolate('Hello {name}', { name: 'World' })).toBe('Hello World');
    });

    it('replaces multiple placeholders', () => {
      const template = '{greeting} {name}, you have {count} messages';
      const params = { greeting: 'Hello', name: 'Alice', count: 5 };
      expect(interpolate(template, params)).toBe('Hello Alice, you have 5 messages');
    });

    it('replaces same placeholder multiple times', () => {
      expect(interpolate('{name} loves {name}', { name: 'Bob' })).toBe('Bob loves Bob');
    });

    it('keeps unreplaced placeholders if param is missing', () => {
      expect(interpolate('Hello {name} and {other}', { name: 'Alice' })).toBe(
        'Hello Alice and {other}'
      );
    });

    it('handles empty params object', () => {
      expect(interpolate('Hello {name}', {})).toBe('Hello {name}');
    });

    it('handles template with no placeholders', () => {
      expect(interpolate('Hello World', { name: 'Alice' })).toBe('Hello World');
    });

    it('converts non-string params to strings', () => {
      expect(interpolate('Count: {count}', { count: 42 })).toBe('Count: 42');
    });

    it('handles boolean params', () => {
      expect(interpolate('Active: {active}', { active: true })).toBe('Active: true');
    });

    it('handles 0 as valid parameter', () => {
      expect(interpolate('Count: {count}', { count: 0 })).toBe('Count: 0');
    });

    it('handles empty string as valid parameter', () => {
      expect(interpolate('Name: {name}', { name: '' })).toBe('Name: ');
    });

    it('does not replace undefined params', () => {
      expect(interpolate('Name: {name}', { name: undefined })).toBe('Name: {name}');
    });

    it('does not replace null params', () => {
      expect(interpolate('Name: {name}', { name: null })).toBe('Name: null');
    });

    it('handles real-world CSV export message (Japanese)', () => {
      const template = '「{name}」のCSVをクリップボードにコピーしました';
      const params = { name: 'テーブル1' };
      expect(interpolate(template, params)).toBe(
        '「テーブル1」のCSVをクリップボードにコピーしました'
      );
    });

    it('handles real-world simulation result (Japanese)', () => {
      const template =
        '平均して 95% の確率で {compMean} ± {compStderr} コンプ、{totalCuts} カット中 {coverageMean} ± {coverageStderr} カットが出ます';
      const params = {
        compMean: '2.50',
        compStderr: '0.10',
        totalCuts: 120,
        coverageMean: '45.20',
        coverageStderr: '1.50'
      };
      expect(interpolate(template, params)).toBe(
        '平均して 95% の確率で 2.50 ± 0.10 コンプ、120 カット中 45.20 ± 1.50 カットが出ます'
      );
    });
  });
});
