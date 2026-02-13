/**
 * i18n Reactive Store
 * Svelte 5 runes-based internationalization store
 */

import {
  detectBrowserLanguage,
  loadLocaleFromStorage,
  saveLocaleToStorage,
  getNestedValue,
  interpolate
} from './index.js';
import jaJP from './locales/ja-JP.json';
import zhTW from './locales/zh-TW.json';

const TRANSLATIONS = {
  'ja-JP': jaJP,
  'zh-TW': zhTW
};

const SUPPORTED_LOCALES = ['ja-JP', 'zh-TW'];

/**
 * Initializes the locale based on localStorage or browser detection.
 * @returns {'ja-JP' | 'zh-TW'} The initial locale
 */
function initializeLocale() {
  const saved = loadLocaleFromStorage();
  if (saved && SUPPORTED_LOCALES.includes(saved)) {
    return saved;
  }
  return detectBrowserLanguage();
}

/**
 * Reactive i18n state using Svelte 5 runes
 */
class I18nState {
  locale = $state(initializeLocale());

  get translations() {
    return TRANSLATIONS[this.locale] || TRANSLATIONS['ja-JP'];
  }

  setLocale(newLocale) {
    if (!SUPPORTED_LOCALES.includes(newLocale)) {
      console.warn(`Unsupported locale: ${newLocale}`);
      return;
    }
    this.locale = newLocale;
    saveLocaleToStorage(newLocale);
  }
}

/**
 * Singleton i18n store instance
 */
export const i18n = new I18nState();

/**
 * Translation function with interpolation support.
 * @param {string} key - Dot-separated translation key (e.g., 'app.tabs.management')
 * @param {object} params - Optional parameters for interpolation
 * @returns {string} The translated string
 *
 * @example
 * t('app.tabs.management') // => '管理' (in ja-JP)
 * t('alerts.csvCopied', { name: 'Table 1' }) // => '「Table 1」のCSVをクリップボードにコピーしました'
 */
export function t(key, params = {}) {
  const value = getNestedValue(i18n.translations, key);
  if (value === undefined) {
    console.warn(`Missing translation key: ${key}`);
    return key;
  }
  return interpolate(value, params);
}
