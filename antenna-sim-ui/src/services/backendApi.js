const BASE = "http://localhost:8080";

async function httpJson(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || `HTTP ${res.status}`);
  }
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res.text();
}

export async function getDevicesHealth() {
  return httpJson(`${BASE}/health/devices`, { cache: "no-store" });
}

export async function createFrequency({ start, end }) {
  return httpJson(`${BASE}/frequencies`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ start, end }),
  });
}

export async function listFrequencies(limit = 200) {
  return httpJson(`${BASE}/frequencies?limit=${encodeURIComponent(limit)}`);
}

export async function deleteFrequency(id) {
  return httpJson(`${BASE}/frequencies/${id}`, { method: "DELETE" });
}

export async function saveScanXmlToFolder({ scanName, xml }) {
  return httpJson(`${BASE}/scans/xml`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scanName, xml }),
  });
}
