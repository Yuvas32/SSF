// antenna-sim-backend/src/controllers/scans.controller.js
import asyncHandler from "../utils/asyncHandler.js";
import { saveXmlToFolder } from "../services/scans.service.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { SATSCAN_OUTPUT_DIR } from "../config/env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const saveXml = asyncHandler(async (req, res) => {
  const { scanName, xml } = req.body;

  const { savedTo, failed, outDirs, fileName } = await saveXmlToFolder({ scanName, xml });

  res.json({
    ok: failed.length === 0,       // true only if all 3 succeeded
    fileName,
    savedTo,                       // array of full paths
    failed,                        // any failed directories
    outDirs,                       // the 3 dirs being used
  });
});

// Helper functions
function toHzString(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v);

  // If it's small, assume MHz
  if (Math.abs(n) < 10_000_000) {
    return String(Math.round(n * 1_000_000));
  }
  return String(Math.round(n));
}

function replaceNameVal(xmlText, name, newVal) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(
    `(<Name>\\s*${escapedName}\\s*<\\/Name>\\s*<Val>)([\\s\\S]*?)(<\\/Val>)`,
    "i"
  );
  if (!re.test(xmlText)) {
    return xmlText;
  }
  return xmlText.replace(re, `$1${newVal}$3`);
}

async function loadControllerTemplate() {
  const templatePath = path.join(__dirname, "../../../antenna-sim-ui/public/controller.xml");
  return await fs.readFile(templatePath, "utf8");
}

export const startScan = asyncHandler(async (req, res) => {
  const { freqStart, freqEnd, scanName } = req.body;

  if (!freqStart || !freqEnd) {
    return res.status(400).json({ ok: false, error: "freqStart and freqEnd are required" });
  }

  if (!scanName || typeof scanName !== 'string' || scanName.trim() === '') {
    return res.status(400).json({ ok: false, error: "scanName is required and must be a non-empty string" });
  }

  const trimmedScanName = scanName.trim();
  const scanFolderName = `Scan_${trimmedScanName}`;
  const scanFolderPath = path.join(SATSCAN_OUTPUT_DIR, scanFolderName);

  try {
    await fs.access(scanFolderPath);
    return res.status(409).json({ ok: false, error: `Scan with name '${trimmedScanName}' already exists. Please choose a different name.` });
  } catch {
    // Folder doesn't exist, good
  }

  // Use scanName as scanId
  const scanId = trimmedScanName;

  // Load template
  const template = await loadControllerTemplate();

  // Replace fields
  let xml = template;
  xml = replaceNameVal(xml, "Scan_Name", scanId);
  xml = replaceNameVal(xml, "tandem", String(scanId));
  xml = replaceNameVal(xml, "L-Band_Start_frequency", toHzString(freqStart));
  xml = replaceNameVal(xml, "L-Band_Stop_frequency", toHzString(freqEnd));

  // Save to folders
  const { savedTo, failed, outDirs, fileName } = await saveXmlToFolder({ scanName: scanId, xml });

  res.json({
    ok: failed.length === 0,
    scanId,
    scanName: scanId,
    fileName,
    savedTo,
    failed,
    outDirs,
  });
});

export const listScans = asyncHandler(async (req, res) => {
  const entries = await fs.readdir(SATSCAN_OUTPUT_DIR, { withFileTypes: true });
  const scans = [];

  for (const entry of entries) {
    if (entry.isDirectory() && entry.name.startsWith('Scan_')) {
      const scanName = entry.name.substring(5); // Remove 'Scan_'
      const folderPath = path.join(SATSCAN_OUTPUT_DIR, entry.name);
      const stat = await fs.stat(folderPath);
      scans.push({
        id: scanName,
        name: scanName,
        createdAt: stat.birthtime.toISOString(),
      });
    }
  }

  // Sort by createdAt desc
  scans.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json(scans);
});
