import { describe, it, expect } from 'vitest';
import {
	getButtonClass,
	getBgClass,
	getBorderClass,
	getBadgeClass,
	getTabActiveClass
} from '../theme-utils.js';

describe('theme-utils', () => {
	describe('getButtonClass', () => {
		it('should return btn-pink for sakurazaka theme', () => {
			expect(getButtonClass('sakurazaka')).toBe('btn-pink');
		});

		it('should return btn-sky for hinatazaka theme', () => {
			expect(getButtonClass('hinatazaka')).toBe('btn-sky');
		});

		it('should return btn-pink with focus-active classes for sakurazaka', () => {
			expect(getButtonClass('sakurazaka', { focusActive: true })).toBe(
				'btn-pink btn-pink-focus-active'
			);
		});

		it('should return btn-sky with focus-active classes for hinatazaka', () => {
			expect(getButtonClass('hinatazaka', { focusActive: true })).toBe(
				'btn-sky btn-sky-focus-active'
			);
		});

		it('should handle empty options object', () => {
			expect(getButtonClass('sakurazaka', {})).toBe('btn-pink');
		});
	});

	describe('getBgClass', () => {
		it('should return bg-pink-50 for sakurazaka with light intensity', () => {
			expect(getBgClass('sakurazaka', 'light')).toBe('bg-pink-50');
		});

		it('should return bg-sky-50 for hinatazaka with light intensity', () => {
			expect(getBgClass('hinatazaka', 'light')).toBe('bg-sky-50');
		});

		it('should return bg-rose-100 for sakurazaka with lighter intensity', () => {
			expect(getBgClass('sakurazaka', 'lighter')).toBe('bg-rose-100');
		});

		it('should return bg-sky-100 for hinatazaka with lighter intensity', () => {
			expect(getBgClass('hinatazaka', 'lighter')).toBe('bg-sky-100');
		});

		it('should default to light intensity when not specified', () => {
			expect(getBgClass('sakurazaka')).toBe('bg-pink-50');
			expect(getBgClass('hinatazaka')).toBe('bg-sky-50');
		});
	});

	describe('getBorderClass', () => {
		it('should return border-pink-400 for sakurazaka theme', () => {
			expect(getBorderClass('sakurazaka')).toBe('border-pink-400');
		});

		it('should return border-sky-400 for hinatazaka theme', () => {
			expect(getBorderClass('hinatazaka')).toBe('border-sky-400');
		});

		it('should handle intensity parameter (future-proofing)', () => {
			expect(getBorderClass('sakurazaka', 'default')).toBe('border-pink-400');
			expect(getBorderClass('hinatazaka', 'default')).toBe('border-sky-400');
		});
	});

	describe('getBadgeClass', () => {
		it('should return bg-pink-400 for sakurazaka theme', () => {
			expect(getBadgeClass('sakurazaka')).toBe('bg-pink-400');
		});

		it('should return bg-sky-400 for hinatazaka theme', () => {
			expect(getBadgeClass('hinatazaka')).toBe('bg-sky-400');
		});
	});

	describe('getTabActiveClass', () => {
		it('should return active-sakurazaka for sakurazaka theme', () => {
			expect(getTabActiveClass('sakurazaka')).toBe('active-sakurazaka');
		});

		it('should return active-hinatazaka for hinatazaka theme', () => {
			expect(getTabActiveClass('hinatazaka')).toBe('active-hinatazaka');
		});
	});

	describe('edge cases', () => {
		it('should handle undefined theme gracefully (defaults to hinatazaka)', () => {
			expect(getButtonClass(undefined)).toBe('btn-sky');
			expect(getBgClass(undefined)).toBe('bg-sky-50');
			expect(getBorderClass(undefined)).toBe('border-sky-400');
			expect(getBadgeClass(undefined)).toBe('bg-sky-400');
			expect(getTabActiveClass(undefined)).toBe('active-hinatazaka');
		});

		it('should handle unknown theme gracefully (defaults to hinatazaka)', () => {
			expect(getButtonClass('unknown')).toBe('btn-sky');
			expect(getBgClass('unknown', 'light')).toBe('bg-sky-50');
			expect(getBorderClass('unknown')).toBe('border-sky-400');
			expect(getBadgeClass('unknown')).toBe('bg-sky-400');
			expect(getTabActiveClass('unknown')).toBe('active-hinatazaka');
		});
	});
});
