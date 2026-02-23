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

/* ---------------- NEW LOGIC: use public/controller.xml template ---------------- */

let controllerTemplateCache = null;

async function loadControllerTemplate() {
  if (controllerTemplateCache) return controllerTemplateCache;

  // Vite public file: served from "/controller.xml"
  const res = await fetch(`/controller.xml?t=${Date.now()}`, { cache: "no-store" });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || `Failed to load /controller.xml (HTTP ${res.status})`);
  }
  const text = await res.text();
  controllerTemplateCache = text;
  return text;
}

/**
 * Heuristic:
 * - If value looks like MHz (e.g., 1290, 1310, 1290.5) -> convert to Hz
 * - If already looks like Hz (>= 10,000,000) -> keep as-is
 */
function toHzString(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v);

  // If it's small, assume MHz
  if (Math.abs(n) < 10_000_000) {
    return String(Math.round(n * 1_000_000));
  }
  return String(Math.round(n));
}

/**
 * Replace the <Val> that immediately follows a specific <Name>...</Name>
 */
function replaceNameVal(xmlText, name, newVal) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(
    `(<Name>\\s*${escapedName}\\s*<\\/Name>\\s*<Val>)([\\s\\S]*?)(<\\/Val>)`,
    "i"
  );
  if (!re.test(xmlText)) {
    // Don't crash; just return unchanged (but you’ll see missing tag behavior)
    return xmlText;
  }
  return xmlText.replace(re, `$1${newVal}$3`);
}

/**
 * ✅ New helper:
 * After DB row is created, load controller.xml template and replace the 4 required fields,
 * then save as Scan_<id>.xml via backend.
 */
export async function saveScanXmlAfterCreate({ scanId, start, stop }) {
  const scanName = `Scan_${scanId}`;

  const template = await loadControllerTemplate();

  // Replace fields exactly as you requested
  let xml = template;
  xml = replaceNameVal(xml, "Scan_Name", scanName);
  xml = replaceNameVal(xml, "tandem", String(scanId));
  xml = replaceNameVal(xml, "L-Band_Start_frequency", toHzString(start));
  xml = replaceNameVal(xml, "L-Band_Stop_frequency", toHzString(stop));

  return saveScanXmlToFolder({ scanName, xml });
}