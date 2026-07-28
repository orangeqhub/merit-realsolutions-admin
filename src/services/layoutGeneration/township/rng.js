/** Seeded pseudo-random generator for reproducible township layouts. */
export function createSeededRng(seedInput = 1) {
  let seed = Math.abs(Math.floor(Number(seedInput) || Date.now())) >>> 0;
  if (seed === 0) seed = 1;

  const next = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0x100000000;
  };

  return {
    seed,
    next,
    float(min = 0, max = 1) {
      return min + next() * (max - min);
    },
    int(min, max) {
      const lo = Math.ceil(min);
      const hi = Math.floor(max);
      return lo + Math.floor(next() * (hi - lo + 1));
    },
    pick(arr) {
      if (!arr?.length) return undefined;
      return arr[Math.floor(next() * arr.length)];
    },
    bool(probability = 0.5) {
      return next() < probability;
    },
    shuffle(arr) {
      const copy = [...arr];
      for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(next() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    },
  };
}
