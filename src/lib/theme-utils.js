/**
 * Theme utility functions for sakurazaka (pink) and hinatazaka (sky) themes.
 * Centralizes all theme-based class selection logic to eliminate scattered ternary expressions.
 */

/**
 * Returns the appropriate button class based on theme
 * @param {string} theme - 'sakurazaka' or 'hinatazaka'
 * @param {{ focusActive?: boolean }} [options={}] - Optional configuration
 * @returns {string} Button class name
 */
export function getButtonClass(theme, options = {}) {
	const baseClass = theme === 'sakurazaka' ? 'btn-pink' : 'btn-sky';
	if (options.focusActive) {
		return theme === 'sakurazaka' ? 'btn-pink btn-pink-focus-active' : 'btn-sky btn-sky-focus-active';
	}
	return baseClass;
}

/**
 * Returns the appropriate background class based on theme and intensity
 * @param {string} theme - 'sakurazaka' or 'hinatazaka'
 * @param {'light' | 'lighter'} [intensity='light'] - Background intensity level
 * @returns {string} Background class name
 */
export function getBgClass(theme, intensity = 'light') {
	if (intensity === 'light') {
		return theme === 'sakurazaka' ? 'bg-pink-50' : 'bg-sky-50';
	}
	// 'lighter' intensity
	return theme === 'sakurazaka' ? 'bg-rose-100' : 'bg-sky-100';
}

/**
 * Returns the appropriate border class based on theme
 * @param {string} theme - 'sakurazaka' or 'hinatazaka'
 * @param {'default'} [intensity='default'] - Border intensity level
 * @returns {string} Border class name
 */
export function getBorderClass(theme, intensity = 'default') {
	return theme === 'sakurazaka' ? 'border-pink-400' : 'border-sky-400';
}

/**
 * Returns the appropriate badge background class based on theme
 * @param {string} theme - 'sakurazaka' or 'hinatazaka'
 * @returns {string} Badge background class name
 */
export function getBadgeClass(theme) {
	return theme === 'sakurazaka' ? 'bg-pink-400' : 'bg-sky-400';
}

/**
 * Returns the appropriate active tab class based on theme
 * @param {string} theme - 'sakurazaka' or 'hinatazaka'
 * @returns {string} Active tab class name
 */
export function getTabActiveClass(theme) {
	return theme === 'sakurazaka' ? 'active-sakurazaka' : 'active-hinatazaka';
}
