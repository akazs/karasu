/**
 * Debounce utility for delaying function execution.
 * Returns a debounced function with cancel() and flush() methods.
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function with cancel() and flush()
 */
export function debounce(fn, delay = 300) {
  let timeoutId = null;
  let lastArgs = null;
  let lastThis = null;

  function debounced(...args) {
    lastArgs = args;
    lastThis = this;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      const args = lastArgs;
      const thisArg = lastThis;
      timeoutId = null;
      lastArgs = null;
      lastThis = null;
      fn.apply(thisArg, args);
    }, delay);
  }

  debounced.cancel = function () {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
      lastArgs = null;
      lastThis = null;
    }
  };

  debounced.flush = function () {
    if (timeoutId) {
      clearTimeout(timeoutId);
      const args = lastArgs;
      const thisArg = lastThis;
      timeoutId = null;
      lastArgs = null;
      lastThis = null;
      fn.apply(thisArg, args);
    }
  };

  return debounced;
}
