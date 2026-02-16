import { writable } from 'svelte/store';

// Toast shape: { id, message, type: 'success' | 'error', duration }
export const toastsStore = writable([]);

let nextId = 0;

export function showToast(message, type = 'success', duration = 3000) {
	const id = nextId++;
	toastsStore.update((toasts) => [...toasts, { id, message, type, duration }]);

	// Auto-dismiss
	if (duration > 0) {
		setTimeout(() => dismissToast(id), duration);
	}
}

export function dismissToast(id) {
	toastsStore.update((toasts) => toasts.filter((t) => t.id !== id));
}
