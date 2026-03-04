export function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function norm(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function unique(arr) {
  const out = [];
  const seen = new Set();

  for (const item of arr || []) {
    if (seen.has(item)) continue;
    seen.add(item);
    out.push(item);
  }

  return out;
}

export function pickHeadersByPreference(headers, preferred) {
  const out = [];
  const headerByNorm = new Map();

  for (const h of headers || []) {
    headerByNorm.set(norm(h), h);
  }

  for (const p of preferred || []) {
    const match = headerByNorm.get(norm(p));
    if (match) out.push(match);
  }

  return out;
}