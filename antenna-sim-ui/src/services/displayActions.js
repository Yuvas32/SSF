export function buildDisplayedScan(row) {
  return {
    dbId: row.id,
    start: row.start,
    stop: row.end,
    ts: new Date(row.createdAt).toLocaleString(),
  };
}

export async function loadTmptxtByScanId(scanId) {
  const res = await fetch(`http://localhost:8080/satscan/output/${scanId}/tmptxt`, {
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