import fs from "fs/promises";
import path from "path";
import { SATSCAN_INPUT_DIR, SATSCAN_OUTPUT_DIR } from "../config/env.js";

export async function countFilesInInputDir() {
  const dir = SATSCAN_INPUT_DIR;
  const entries = await safeReadDir(dir);
  const files = entries.filter((e) => e.isFile());
  return {
    dir,
    count: files.length,
    names: files.map((f) => f.name),
  };
}

export async function getOutputStatusForScanId(scanId) {
  const folderName = `Scan_${scanId}`;
  const folderPath = path.join(SATSCAN_OUTPUT_DIR, folderName);

  const folderExists = await exists(folderPath);
  if (!folderExists) {
    return {
      scanId,
      folderName,
      folderPath,
      folderExists: false,
      spectrumFound: false,
      spectrumPath: null,
      spectrumFileName: null,
      completed: false,
    };
  }

  const spectrumPath = await findSpectrumFile(folderPath);
  const spectrumFound = Boolean(spectrumPath);

  return {
    scanId,
    folderName,
    folderPath,
    folderExists: true,
    spectrumFound,
    spectrumPath: spectrumPath || null,
    spectrumFileName: spectrumPath ? path.basename(spectrumPath) : null,
    completed: spectrumFound,
  };
}

export async function readSpectrumAsJson(scanId) {
  const status = await getOutputStatusForScanId(scanId);

  if (!status.folderExists) {
    const err = new Error(`Output folder not found: ${status.folderPath}`);
    err.statusCode = 404;
    throw err;
  }
  if (!status.spectrumFound || !status.spectrumPath) {
    const err = new Error(`.spectrum not found yet in ${status.folderPath}`);
    err.statusCode = 404;
    throw err;
  }

  const spectrumPath = status.spectrumPath;

  // read file
  const raw = await fs.readFile(spectrumPath, "utf8");

  // derive startHz and deltaHz from filename
  const meta = parseSpectrumFileName(path.basename(spectrumPath));
  // meta = { startHz, deltaHz } or null

  const parsed = tryParseSpectrum(raw, meta);

  // file mtime is a better "updatedAt"
  let updatedAt = new Date().toISOString();
  try {
    const st = await fs.stat(spectrumPath);
    updatedAt = new Date(st.mtimeMs).toISOString();
  } catch {
    // keep fallback
  }

  return {
    ok: true,
    scanId,
    source: spectrumPath,
    updatedAt,
    unit: parsed.unit || "MHz",
    points: parsed.points || [],
    parseMode: parsed.parseMode,
    meta: meta || null,
  };
}

/**
 * ✅ NEW:
 * Read Scan_<id>.tmptxt and return as text for the UI TableView panel.
 * We search in:
 * 1) SATSCAN_OUTPUT_DIR root
 * 2) inside SATSCAN_OUTPUT_DIR/Scan_<id> (including subfolders depth 3)
 */
export async function readTmpTxtAsText(scanId) {
  const preferredName = `Scan_${scanId}.tmptxt`;

  // 1) output root
  const rootCandidate = path.join(SATSCAN_OUTPUT_DIR, preferredName);
  if (await exists(rootCandidate)) {
    const text = await fs.readFile(rootCandidate, "utf8");
    return { ok: true, scanId, source: rootCandidate, updatedAt: new Date().toISOString(), text };
  }

  // 2) inside Scan_<id> folder
  const folderPath = path.join(SATSCAN_OUTPUT_DIR, `Scan_${scanId}`);
  if (await exists(folderPath)) {
    const found = await findTmpTxtFile(folderPath, scanId);
    if (found) {
      const text = await fs.readFile(found, "utf8");
      return { ok: true, scanId, source: found, updatedAt: new Date().toISOString(), text };
    }
  }

  const err = new Error(`.tmptxt not found for Scan_${scanId}`);
  err.statusCode = 404;
  throw err;
}

/* ---------------- helpers ---------------- */

async function safeReadDir(dir) {
  try {
    return await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function findSpectrumFile(rootDir) {
  const rootEntries = await safeReadDir(rootDir);

  for (const e of rootEntries) {
    if (e.isFile() && e.name.toLowerCase().endsWith(".spectrum")) {
      return path.join(rootDir, e.name);
    }
  }

  const dirs = rootEntries
    .filter((e) => e.isDirectory())
    .map((d) => path.join(rootDir, d.name));

  for (const d of dirs) {
    const found = await findSpectrumFileDepth(d, 2);
    if (found) return found;
  }

  return null;
}

async function findSpectrumFileDepth(dir, depthLeft) {
  const entries = await safeReadDir(dir);

  for (const e of entries) {
    if (e.isFile() && e.name.toLowerCase().endsWith(".spectrum")) {
      return path.join(dir, e.name);
    }
  }

  if (depthLeft <= 0) return null;

  const subDirs = entries
    .filter((e) => e.isDirectory())
    .map((d) => path.join(dir, d.name));

  for (const sd of subDirs) {
    const found = await findSpectrumFileDepth(sd, depthLeft - 1);
    if (found) return found;
  }
  return null;
}

// ✅ NEW: find tmptxt near/under Scan_<id> folder
async function findTmpTxtFile(rootDir, scanId) {
  const preferredLower = `scan_${scanId}.tmptxt`;

  // 1) root files
  const rootEntries = await safeReadDir(rootDir);

  // prefer exact name
  for (const e of rootEntries) {
    if (e.isFile() && e.name.toLowerCase() === preferredLower) {
      return path.join(rootDir, e.name);
    }
  }
  // otherwise any tmptxt at root
  for (const e of rootEntries) {
    if (e.isFile() && e.name.toLowerCase().endsWith(".tmptxt")) {
      return path.join(rootDir, e.name);
    }
  }

  // 2) subfolders depth 3
  const dirs = rootEntries
    .filter((e) => e.isDirectory())
    .map((d) => path.join(rootDir, d.name));

  for (const d of dirs) {
    const found = await findTmpTxtFileDepth(d, 2, scanId);
    if (found) return found;
  }

  return null;
}

async function findTmpTxtFileDepth(dir, depthLeft, scanId) {
  const preferredLower = `scan_${scanId}.tmptxt`;

  const entries = await safeReadDir(dir);

  for (const e of entries) {
    if (e.isFile() && e.name.toLowerCase() === preferredLower) {
      return path.join(dir, e.name);
    }
  }
  for (const e of entries) {
    if (e.isFile() && e.name.toLowerCase().endsWith(".tmptxt")) {
      return path.join(dir, e.name);
    }
  }

  if (depthLeft <= 0) return null;

  const subDirs = entries
    .filter((e) => e.isDirectory())
    .map((d) => path.join(dir, d.name));

  for (const sd of subDirs) {
    const found = await findTmpTxtFileDepth(sd, depthLeft - 1, scanId);
    if (found) return found;
  }
  return null;
}

/**
 * Example filename:
 * Scan_27_PSD_1230000000_delta_f_3333.333.spectrum
 *
 * Rules:
 * - startHz = number after PSD_
 * - deltaHz = number after delta_f_
 */
function parseSpectrumFileName(fileName) {
  const s = String(fileName || "");

  const mStart = s.match(/PSD_(\d+)/i);
  const mDelta = s.match(/delta[_-]?f_(\d+(?:\.\d+)?)/i);

  if (!mStart || !mDelta) return null;

  const startHz = Number(mStart[1]);
  const deltaHz = Number(mDelta[1]);

  if (!Number.isFinite(startHz) || !Number.isFinite(deltaHz) || startHz <= 0 || deltaHz <= 0) {
    return null;
  }

  return { startHz, deltaHz };
}

/**
 * Supports:
 * 1) JSON {points:[{f,p}]}
 * 2) lines with "freq power" or "freq,power"
 * 3) IMPORTANT: power-only lines:
 *    - one number per row (p)
 *    - frequency derived from filename startHz/deltaHz
 */
function tryParseSpectrum(rawText, meta) {
  const text = String(rawText || "").trim();
  if (!text) return { points: [], parseMode: "empty", unit: "MHz" };

  // JSON?
  try {
    const j = JSON.parse(text);
    if (Array.isArray(j)) {
      return { points: normalizePoints(j), parseMode: "json-array", unit: "MHz" };
    }
    if (j && typeof j === "object" && Array.isArray(j.points)) {
      return {
        points: normalizePoints(j.points),
        parseMode: "json-object",
        unit: j.unit || "MHz",
      };
    }
  } catch {
    // not json
  }

  // line-based
  const lines = text.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);

  // detect if it's "power only" (most lines have 1 number)
  const singleNumberCount = lines.reduce((acc, line) => {
    const parts = line.split(/[,\s]+/).filter(Boolean);
    if (parts.length === 1 && Number.isFinite(Number(parts[0]))) return acc + 1;
    return acc;
  }, 0);

  const looksLikePowerOnly = singleNumberCount >= Math.max(3, Math.floor(lines.length * 0.7));

  // ✅ Power-only mode (your required format)
  if (looksLikePowerOnly) {
    if (!meta?.startHz || !meta?.deltaHz) {
      return {
        points: [],
        parseMode: "power-only-missing-meta",
        unit: "MHz",
      };
    }

    const { startHz, deltaHz } = meta;
    const points = [];

    for (let i = 0; i < lines.length; i++) {
      const p = Number(lines[i].split(/[,\s]+/)[0]);
      if (!Number.isFinite(p)) continue;

      const fHz = startHz + i * deltaHz;
      const fMHz = fHz / 1e6;

      points.push({ f: fMHz, p });
    }

    return { points, parseMode: "power-only", unit: "MHz" };
  }

  // pairs mode: "freq,power" or "freq power"
  const points = [];
  for (const line of lines) {
    const parts = line.split(/[,\s]+/).filter(Boolean);
    if (parts.length < 2) continue;

    const f = Number(parts[0]);
    const p = Number(parts[1]);
    if (!Number.isFinite(f) || !Number.isFinite(p)) continue;

    points.push({ f, p });
  }

  return { points, parseMode: "lines", unit: "MHz" };
}

function normalizePoints(arr) {
  const out = [];
  for (const item of arr) {
    if (!item) continue;

    if (Array.isArray(item) && item.length >= 2) {
      const f = Number(item[0]);
      const p = Number(item[1]);
      if (Number.isFinite(f) && Number.isFinite(p)) out.push({ f, p });
      continue;
    }

    if (typeof item === "object") {
      const f = Number(item.f ?? item.freq ?? item.frequency);
      const p = Number(item.p ?? item.power ?? item.db);
      if (Number.isFinite(f) && Number.isFinite(p)) out.push({ f, p });
    }
  }
  return out;
}
