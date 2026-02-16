/** @param {MessageEvent<{id: number, n_packs: number, n_members: number, n_cuts: number, n_onedraw: number}>} e */
self.onmessage = function (e) {
  const { id, n_packs, n_members, n_cuts, n_onedraw } = e.data;
  try {
    const result = simulate(n_packs, n_members, n_cuts, n_onedraw);
    self.postMessage({ id, result });
  } catch (err) {
    self.postMessage({ id, error: err.message || 'Simulation failed' });
  }
};

/**
 * Optimized Monte Carlo simulation for photo draw estimation.
 * Uses typed arrays and reused allocations to minimize GC pressure.
 */
function simulate(n_packs, n_members, n_cuts, n_onedraw) {
  n_packs = Math.max(0, Math.min(n_packs, 1000));
  n_members = Math.max(1, Math.min(n_members, 500));
  n_cuts = Math.max(1, Math.min(n_cuts, 10));
  n_onedraw = Math.max(1, Math.min(n_onedraw, n_members));

  const iterations = 10000;

  // Pre-allocate typed arrays outside the loop (reused each iteration)
  const results = new Int32Array(n_members * n_cuts);
  const indices = new Int32Array(n_members);
  const comps = new Float64Array(iterations);
  const coverages = new Float64Array(iterations);

  for (let it = 0; it < iterations; it++) {
    // Zero-fill results for this iteration
    results.fill(0);

    for (let i = 0; i < n_packs; i++) {
      // Initialize indices [0, 1, 2, ..., n_members-1]
      for (let k = 0; k < n_members; k++) indices[k] = k;

      // Fisher-Yates partial shuffle (only first n_onedraw elements)
      for (let j = 0; j < n_onedraw; j++) {
        const randIndex = j + Math.floor(Math.random() * (n_members - j));
        const tmp = indices[j];
        indices[j] = indices[randIndex];
        indices[randIndex] = tmp;
      }

      // Read directly from indices array (no .slice() needed)
      for (let j = 0; j < n_onedraw; j++) {
        const memberIdx = indices[j];
        const cutIdx = Math.floor(Math.random() * n_cuts);
        results[memberIdx * n_cuts + cutIdx] += 1;
      }
    }

    let n_comp = 0;
    let coverage = 0;

    for (let m = 0; m < n_members; m++) {
      const base = m * n_cuts;

      // Manual min loop (avoids Math.min(...spread) overhead)
      let minVal = results[base];
      for (let c = 1; c < n_cuts; c++) {
        const v = results[base + c];
        if (v < minVal) minVal = v;
      }
      n_comp += minVal;

      for (let c = 0; c < n_cuts; c++) {
        if (results[base + c] > 0) coverage += 1;
      }
    }

    comps[it] = n_comp;
    coverages[it] = coverage;
  }

  let compSum = 0;
  let coverageSum = 0;
  for (let i = 0; i < iterations; i++) {
    compSum += comps[i];
    coverageSum += coverages[i];
  }
  const comp_mean = compSum / iterations;
  const coverage_mean = coverageSum / iterations;

  let compSumSq = 0;
  let coverageSumSq = 0;
  for (let i = 0; i < iterations; i++) {
    compSumSq += (comps[i] - comp_mean) ** 2;
    coverageSumSq += (coverages[i] - coverage_mean) ** 2;
  }
  const comp_stdev = Math.sqrt(compSumSq / iterations);
  const coverage_stdev = Math.sqrt(coverageSumSq / iterations);

  return {
    comp_mean,
    coverage_mean,
    comp_stderr: comp_stdev / Math.sqrt(iterations),
    coverage_stderr: coverage_stdev / Math.sqrt(iterations)
  };
}
