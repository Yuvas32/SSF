import { API_BASE } from "../config/api";

export function buildDisplayedScan(row) {
  return {
    dbId: row.id,
    start: null, // Not available
    stop: null, // Not available
    ts: new Date(row.createdAt).toLocaleString(),
  };
}

export async function loadTmptxtByScanId(scanId) {
  const res = await fetch(`${API_BASE}/satscan/output/${scanId}/tmptxt`, {
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }

  const json = await res.json();
  return String(json.text || "");
}

export function buildTmptxtError(scanId, error) {
  return `ERROR loading tmptxt for Scan_${scanId}:\n${error?.message || error}`;
}