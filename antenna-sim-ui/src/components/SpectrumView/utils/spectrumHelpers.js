export function normalizeSpectrumPoints(points) {
  if (!Array.isArray(points)) return [];

  return points
    .map((pt) => {
      const f = Number.isFinite(Number(pt?.f)) ? Number(pt.f) : Number(pt?.x);
      const p = Number.isFinite(Number(pt?.p)) ? Number(pt.p) : Number(pt?.y);
      return { f, p };
    })
    .filter((pt) => Number.isFinite(pt.f) && Number.isFinite(pt.p));
}

export function cleanupTimers(timersRef) {
  if (!timersRef?.current) return;
  for (const k of ["elapsedTimer", "waitTimer", "pollTimer"]) {
    if (timersRef.current[k]) {
      clearInterval(timersRef.current[k]);
      timersRef.current[k] = null;
    }
  }
}

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export function clamp(v, a, b) {
  return Math.min(b, Math.max(a, v));
}

export function round2(n) {
  return Math.round(n * 100) / 100;
}

export function getClientPoint(e) {
  return { x: e.clientX, y: e.clientY };
}

export function nearestByFreq(points, targetF) {
  let best = null;
  let bestD = Infinity;
  for (const d of points || []) {
    const f = Number(d?.f);
    const p = Number(d?.p);
    if (!Number.isFinite(f) || !Number.isFinite(p)) continue;
    const dist = Math.abs(f - targetF);
    if (dist < bestD) {
      bestD = dist;
      best = { f, p };
    }
  }
  return best;
}