const API_BASE = "http://localhost:8080";

export async function fetchInputCountSafe() {
  try {
    const res = await fetch(`${API_BASE}/satscan/input/count`, { cache: "no-store" });
    if (!res.ok) return 0;
    const j = await res.json();
    return Number(j.count || 0);
  } catch {
    return 0;
  }
}

export async function fetchOutputStatus(scanId) {
  const res = await fetch(`${API_BASE}/satscan/output/${scanId}/status`, { cache: "no-store" });
  if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`);
  return await res.json();
}

export async function fetchSpectrum(scanId) {
  const res = await fetch(`${API_BASE}/satscan/output/${scanId}/spectrum`, { cache: "no-store" });
  if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`);
  return await res.json();
}
