<script>
  /**
   * Reusable confirmation dialog component
   * Supports keyboard (Escape), click-outside-to-close, and accessibility
   */

  let {
    isOpen = false,
    title = '',
    message = '',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm = () => {},
    onCancel = () => {},
    variant = 'default' // 'default' or 'danger'
  } = $props();

  /**
   * Handle escape key press to close dialog
   * @param {KeyboardEvent} event
   */
  function handleKeydown(event) {
    if (event.key === 'Escape' && isOpen) {
      onCancel();
    }
  }

  /**
   * Handle backdrop click to close dialog
   * @param {MouseEvent} event
   */
  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      onCancel();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
  <div
    class="fixed inset-0 z-[70] flex items-center justify-center bg-black bg-opacity-50"
    onclick={handleBackdropClick}
    role="presentation"
  >
    <div
      class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      <h2 id="dialog-title" class="text-xl font-semibold mb-4">
        {title}
      </h2>

      <p class="text-gray-700 mb-6">
        {message}
      </p>

      <div class="flex justify-end gap-3">
        <button
          type="button"
          class="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 transition-colors"
          onclick={onCancel}
        >
          {cancelText}
        </button>

        <button
          type="button"
          class={variant === 'danger'
            ? 'px-4 py-2 rounded bg-red-500 hover:bg-red-600 text-white transition-colors'
            : 'px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white transition-colors'}
          onclick={onConfirm}
        >
          {confirmText}
        </button>
      </div>
    </div>
  </div>
{/if}
