<script>
	import { fly } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	let { id, message, type = 'success', onDismiss } = $props();

	let styles = $derived(
		type === 'success'
			? 'bg-white border border-gray-300 border-l-4 border-l-blue-500 text-gray-800'
			: 'bg-white border border-gray-300 border-l-4 border-l-red-500 text-gray-800'
	);
</script>

<div
	role="status"
	aria-live="polite"
	transition:fly={{ x: 300, duration: 300, easing: quintOut }}
	class="min-w-72 max-w-md p-4 rounded shadow-lg {styles}"
>
	<div class="flex items-center justify-between gap-3">
		<span class="flex-1">{message}</span>
		<button
			type="button"
			class="text-gray-400 hover:text-gray-600 font-bold text-xl leading-none flex-shrink-0"
			onclick={() => onDismiss(id)}
			aria-label="Close notification"
		>
			×
		</button>
	</div>
</div>
