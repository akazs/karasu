/**
 * i18n Core Utilities
 * Pure JavaScript utilities for internationalization
 */

/**
 * Detects the user's browser language and returns the appropriate locale.
 * @returns {'ja-JP' | 'zh-TW'} The detected locale
 */
export function detectBrowserLanguage() {
  const lang = navigator.language || navigator.userLanguage;
  if (lang.startsWith('ja')) return 'ja-JP';
  if (lang.startsWith('zh')) return 'zh-TW';
  return 'ja-JP'; // default fallback
}

/**
 * Loads the user's locale preference from localStorage.
 * @returns {string | null} The saved locale or null if not set
 */
export function loadLocaleFromStorage() {
  return localStorage.getItem('karasu-locale');
}

/**
 * Saves the user's locale preference to localStorage.
 * @param {string} locale - The locale to save
 */
export function saveLocaleToStorage(locale) {
  localStorage.setItem('karasu-locale', locale);
}

/**
 * Gets a nested value from an object using dot notation.
 * @param {object} obj - The object to traverse
 * @param {string} path - The dot-separated path (e.g., 'app.tabs.management')
 * @returns {any} The value at the path, or undefined if not found
 */
export function getNestedValue(obj, path) {
  return path.split('.').reduce((curr, key) => curr?.[key], obj);
}

/**
 * Interpolates placeholders in a template string with actual values.
 * @param {string} template - The template string with {placeholder} syntax
 * @param {object} params - Object with key-value pairs for interpolation
 * @returns {string} The interpolated string
 *
 * @example
 * interpolate('Hello {name}!', { name: 'World' }) // => 'Hello World!'
 */
export function interpolate(template, params = {}) {
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    params[key] !== undefined ? String(params[key]) : match
  );
}
