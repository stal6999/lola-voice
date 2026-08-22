// hooks/useOrganicMotion.ts
// Simplex-like noise sans dépendance externe (version allégée)
// Source: Guide comportements humains arXiv 2025

let p: number[] | null = null

function initP() {
  if (p) return
  const arr = Array.from({ length: 256 }, (_, i) => i)
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  p = [...arr, ...arr]
}

function fade(t: number) { return t * t * t * (t * (t * 6 - 15) + 10) }
function lerp(t: number, a: number, b: number) { return a + t * (b - a) }
function grad(hash: number, x: number): number {
  return (hash & 1) === 0 ? x : -x
}

export function noise1d(x: number): number {
  initP()
  const X = Math.floor(x) & 255
  x -= Math.floor(x)
  const u = fade(x)
  return lerp(u, grad(p![X], x), grad(p![X + 1], x - 1))
}

export interface OrganicState {
  breathY: number      // -1 à +1, cycle ~4.5s
  swayX: number        // -1 à +1, cycle ~10s
  headTiltX: number    // -1 à +1, cycle ~7s + micro
  microX: number       // micro-tremblements ~0.4s
  weightShiftY: number // weight shift lent ~20s
}

export function useOrganicMotion(): OrganicState {
  // Return null-safe initial state — will be animated via rAF in page.tsx
  return { breathY: 0, swayX: 0, headTiltX: 0, microX: 0, weightShiftY: 0 }
}
