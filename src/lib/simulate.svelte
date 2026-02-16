<script module>
  let worker = null;
  let requestId = 0;

  function getWorker() {
    if (!worker) {
      worker = new Worker(new URL('./simulate-worker.js', import.meta.url), { type: 'module' });
    }
    return worker;
  }

  /**
   * Run the Monte Carlo simulation off the main thread via Web Worker.
   * Returns a Promise that resolves with the simulation results.
   * Each call gets a unique ID so stale results are discarded.
   */
  export function simulate(n_packs, n_members, n_cuts, n_onedraw) {
    const id = ++requestId;
    return new Promise((resolve, reject) => {
      const w = getWorker();
      const handler = (e) => {
        if (e.data.id === id) {
          w.removeEventListener('message', handler);
          w.removeEventListener('error', errorHandler);
          if (e.data.error) {
            reject(new Error(e.data.error));
          } else {
            resolve(e.data.result);
          }
        }
      };
      const errorHandler = (e) => {
        w.removeEventListener('message', handler);
        w.removeEventListener('error', errorHandler);
        reject(new Error(e.message || 'Worker error'));
      };
      w.addEventListener('message', handler);
      w.addEventListener('error', errorHandler);
      w.postMessage({ id, n_packs, n_members, n_cuts, n_onedraw });
    });
  }
</script>
