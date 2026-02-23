export function fmtTime(sec) {
  const s = Math.max(0, Number(sec) || 0);
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export function buildPolyline(points, width, height) {
  const safe = Array.isArray(points) ? points : [];
  if (safe.length < 2) {
    return {
      polylinePoints: "",
      minF: "-",
      maxF: "-",
      minP: "-",
      maxP: "-",
      minFNum: null,
      maxFNum: null,
      minPNum: null,
      maxPNum: null,
      gridLines: defaultGrid(width, height),
    };
  }

  const freqs = safe.map((d) => Number(d.f)).filter(Number.isFinite);
  const powers = safe.map((d) => Number(d.p)).filter(Number.isFinite);

  const minFNum = Math.min(...freqs);
  const maxFNum = Math.max(...freqs);
  const minPNum = Math.min(...powers);
  const maxPNum = Math.max(...powers);

  const pad = 12;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;

  const scaleX = (f) => pad + ((f - minFNum) / (maxFNum - minFNum || 1)) * innerW;
  const scaleY = (p) => pad + (1 - (p - minPNum) / (maxPNum - minPNum || 1)) * innerH;

  const polylinePoints = safe
    .map((d) => {
      const f = Number(d.f);
      const p = Number(d.p);
      if (!Number.isFinite(f) || !Number.isFinite(p)) return null;
      return `${scaleX(f).toFixed(2)},${scaleY(p).toFixed(2)}`;
    })
    .filter(Boolean)
    .join(" ");

  return {
    polylinePoints,
    minF: roundSmart(minFNum),
    maxF: roundSmart(maxFNum),
    minP: roundSmart(minPNum),
    maxP: roundSmart(maxPNum),
    minFNum,
    maxFNum,
    minPNum,
    maxPNum,
    gridLines: defaultGrid(width, height),
  };
}


function defaultGrid(width, height) {
  const lines = [];
  for (let i = 1; i <= 5; i++) {
    const x = (width * i) / 6;
    lines.push({ x1: x, y1: 0, x2: x, y2: height });
  }
  for (let i = 1; i <= 3; i++) {
    const y = (height * i) / 4;
    lines.push({ x1: 0, y1: y, x2: width, y2: y });
  }
  return lines;
}

function roundSmart(n) {
  if (!Number.isFinite(n)) return "-";
  if (Math.abs(n) >= 1000) return Math.round(n);
  return Math.round(n * 10) / 10;
}
