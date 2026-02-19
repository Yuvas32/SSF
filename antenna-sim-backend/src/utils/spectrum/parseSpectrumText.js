export function parseSpectrumTextToPoints({ text, startHz, deltaHz }) {
  const lines = String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // each line => p
  const points = [];
  for (let i = 0; i < lines.length; i++) {
    const p = Number(lines[i]);
    if (!Number.isFinite(p)) continue;

    const fHz = startHz + i * deltaHz;
    const fMHz = fHz / 1e6;

    points.push({ f: fMHz, p });
  }

  return points;
}
