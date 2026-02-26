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

  const raw = await fs.readFile(spectrumPath, "utf8");
  const meta = parseSpectrumFileName(path.basename(spectrumPath));
  const parsed = tryParseSpectrum(raw, meta);

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

export async function readTmpTxtAsText(scanId) {
  const preferredName = `Scan_${scanId}.tmptxt`;

  const rootCandidate = path.join(SATSCAN_OUTPUT_DIR, preferredName);
  if (await exists(rootCandidate)) {
    const text = await fs.readFile(rootCandidate, "utf8");
    return { ok: true, scanId, source: rootCandidate, updatedAt: new Date().toISOString(), text };
  }

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

export async function getResultXmlForScanId(scanId) {
  const status = await getOutputStatusForScanId(scanId);

  if (!status.folderExists) {
    const err = new Error(`Output folder not found: ${status.folderPath}`);
    err.statusCode = 404;
    throw err;
  }

  if (status.spectrumFound && status.spectrumPath) {
    const spectrumDir = path.dirname(status.spectrumPath);
    const siblingResult = await findResultXmlInDir(spectrumDir);
    if (siblingResult) {
      return {
        scanId,
        source: siblingResult,
        fileName: path.basename(siblingResult),
      };
    }
  }

  const fallback = await findResultXmlFile(status.folderPath);
  if (fallback) {
    return {
      scanId,
      source: fallback,
      fileName: path.basename(fallback),
    };
  }

  const err = new Error(`result.xml not found for Scan_${scanId}`);
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

async function findTmpTxtFile(rootDir, scanId) {
  const preferredLower = `scan_${scanId}.tmptxt`;
  const rootEntries = await safeReadDir(rootDir);

  for (const e of rootEntries) {
    if (e.isFile() && e.name.toLowerCase() === preferredLower) {
      return path.join(rootDir, e.name);
    }
  }

  for (const e of rootEntries) {
    if (e.isFile() && e.name.toLowerCase().endsWith(".tmptxt")) {
      return path.join(rootDir, e.name);
    }
  }

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

async function findResultXmlInDir(dir) {
  const entries = await safeReadDir(dir);

  for (const e of entries) {
    if (e.isFile() && e.name.toLowerCase() === "result.xml") {
      return path.join(dir, e.name);
    }
  }

  return null;
}

async function findResultXmlFile(rootDir) {
  const rootEntries = await safeReadDir(rootDir);

  for (const e of rootEntries) {
    if (e.isFile() && e.name.toLowerCase() === "result.xml") {
      return path.join(rootDir, e.name);
    }
  }

  const dirs = rootEntries
    .filter((e) => e.isDirectory())
    .map((d) => path.join(rootDir, d.name));

  for (const d of dirs) {
    const found = await findResultXmlFileDepth(d, 2);
    if (found) return found;
  }

  return null;
}

async function findResultXmlFileDepth(dir, depthLeft) {
  const entries = await safeReadDir(dir);

  for (const e of entries) {
    if (e.isFile() && e.name.toLowerCase() === "result.xml") {
      return path.join(dir, e.name);
    }
  }

  if (depthLeft <= 0) return null;

  const subDirs = entries
    .filter((e) => e.isDirectory())
    .map((d) => path.join(dir, d.name));

  for (const sd of subDirs) {
    const found = await findResultXmlFileDepth(sd, depthLeft - 1);
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
  const m = s.match(/PSD_(\d+(?:\.\d+)?)_delta_f_(\d+(?:\.\d+)?)/i);
  if (!m) return null;

  const startHz = Number(m[1]);
  const deltaHz = Number(m[2]);

  if (!Number.isFinite(startHz) || !Number.isFinite(deltaHz)) return null;
  return { startHz, deltaHz };
}

function tryParseSpectrum(raw, meta) {
  const lines = String(raw || "")
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean);

  const numericValues = [];
  for (const line of lines) {
    const n = Number(line);
    if (Number.isFinite(n)) numericValues.push(n);
  }

  if (numericValues.length && meta?.startHz != null && meta?.deltaHz != null) {
    const points = numericValues.map((y, i) => ({
      x: (meta.startHz + i * meta.deltaHz) / 1e6,
      y,
    }));

    return {
      unit: "MHz",
      points,
      parseMode: "filename-derived-x",
    };
  }

  const pairs = [];
  for (const line of lines) {
    const parts = line.split(/[\s,;]+/).filter(Boolean);
    if (parts.length < 2) continue;

    const a = Number(parts[0]);
    const b = Number(parts[1]);
    if (Number.isFinite(a) && Number.isFinite(b)) {
      pairs.push({ x: a, y: b });
    }
  }

  if (pairs.length) {
    return {
      unit: "MHz",
      points: pairs,
      parseMode: "xy-pairs",
    };
  }

  return {
    unit: "MHz",
    points: [],
    parseMode: "unparsed",
  };
}