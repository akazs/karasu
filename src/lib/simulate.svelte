<script module>
  export function simulate(n_packs, n_members, n_cuts, n_onedraw) {
    // Clamp inputs to reasonable bounds to prevent browser freeze
    n_packs = Math.max(0, Math.min(n_packs, 1000));
    n_members = Math.max(1, Math.min(n_members, 500));
    n_cuts = Math.max(1, Math.min(n_cuts, 10));
    n_onedraw = Math.max(1, Math.min(n_onedraw, n_members)); // Prevents Fisher-Yates out-of-bounds

    const iterations = 10000;
    let comps = [];
    let coverages = [];

    for (let it = 0; it < iterations; it++) {
      const results = Array.from({ length: n_members }, () => Array(n_cuts).fill(0));

      for (let i = 0; i < n_packs; i++) {
        const indices = Array.from({ length: n_members }, (_, k) => k);

        for (let j = 0; j < n_onedraw; j++) {
          const randIndex = j + Math.floor(Math.random() * (n_members - j));
          [indices[j], indices[randIndex]] = [indices[randIndex], indices[j]];
        }

        const member_draws = indices.slice(0, n_onedraw);

        for (let j = 0; j < n_onedraw; j++) {
          const memberIdx = member_draws[j];
          const cutIdx = Math.floor(Math.random() * n_cuts);
          results[memberIdx][cutIdx] += 1;
        }
      }

      let n_comp = 0;
      let coverage = 0;

      for (const result of results) {
        n_comp += Math.min(...result);
        for (const v of result) {
          if (v > 0) {
            coverage += 1;
          }
        }
      }
      comps.push(n_comp);
      coverages.push(coverage);
    }

    const comp_mean = comps.reduce((acc, val) => acc + val, 0) / iterations;
    const coverage_mean = coverages.reduce((acc, val) => acc + val, 0) / iterations;
    const comp_stdev = Math.sqrt(
      comps
        .reduce((acc, val) => acc.concat(Math.pow(val - comp_mean, 2)), [])
        .reduce((acc, val) => acc + val, 0) / iterations
    );
    const coverage_stdev = Math.sqrt(
      coverages
        .reduce((acc, val) => acc.concat(Math.pow(val - coverage_mean, 2)), [])
        .reduce((acc, val) => acc + val, 0) / iterations
    );

    return {
      comp_mean,
      coverage_mean,
      comp_stderr: comp_stdev / Math.sqrt(iterations),
      coverage_stderr: coverage_stdev / Math.sqrt(iterations)
    };
  }
</script>
