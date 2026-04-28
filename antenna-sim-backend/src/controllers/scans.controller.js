// antenna-sim-backend/src/controllers/scans.controller.js
import asyncHandler from "../utils/asyncHandler.js";
import { saveXmlToFolder } from "../services/scans.service.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { SATSCAN_OUTPUT_DIR, SATSCAN_STATUS_DIR } from "../config/env.js";
import { Frequency } from "../models/Frequency.js";

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

  // Save frequency data to database
  try {
    await Frequency.create({
      name: scanId,
      start: parseFloat(freqStart),
      end: parseFloat(freqEnd)
    });
  } catch (dbError) {
    console.error("Failed to save frequency data:", dbError);
    // Don't fail the scan if DB save fails, but log it
  }

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

      // Get frequency data from database
      let frequencyData = null;
      try {
        const freqRecord = await Frequency.findOne({
          where: { name: scanName }
        });
        if (freqRecord) {
          const startValue = Number(freqRecord.start);
          const endValue = Number(freqRecord.end);
          frequencyData = {
            start: Math.abs(startValue) > 10_000_000 ? startValue / 1000000 : startValue,
            end: Math.abs(endValue) > 10_000_000 ? endValue / 1000000 : endValue,
          };
        }
      } catch (dbError) {
        console.error(`Failed to get frequency data for ${scanName}:`, dbError);
      }

      scans.push({
        id: scanName,
        name: scanName,
        createdAt: stat.birthtime.toISOString(),
        start: frequencyData?.start || null,
        end: frequencyData?.end || null,
      });
    }
  }

  // Sort by createdAt desc
  scans.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json(scans);
});

export const updateScan = asyncHandler(async (req, res) => {
  const scanName = (req.params.scanName || "").trim();
  const newName = (req.body?.name || "").trim();

  if (!scanName) {
    return res.status(400).json({ ok: false, error: "scanName parameter is required" });
  }
  if (!newName) {
    return res.status(400).json({ ok: false, error: "New scan name is required" });
  }
  if (scanName === newName) {
    return res.json({ ok: true, scanName });
  }

  const oldFolder = path.join(SATSCAN_OUTPUT_DIR, `Scan_${scanName}`);
  const newFolder = path.join(SATSCAN_OUTPUT_DIR, `Scan_${newName}`);

  try {
    await fs.access(oldFolder);
  } catch {
    return res.status(404).json({ ok: false, error: `Scan '${scanName}' not found` });
  }

  try {
    await fs.access(newFolder);
    return res.status(409).json({ ok: false, error: `Scan '${newName}' already exists` });
  } catch {
    // expected
  }

  await fs.rename(oldFolder, newFolder);

  try {
    await Frequency.update({ name: newName }, { where: { name: scanName } });
  } catch (dbError) {
    console.error(`Failed to update scan name in database from ${scanName} to ${newName}:`, dbError);
  }

  res.json({ ok: true, scanName: newName });
});

export const deleteScan = asyncHandler(async (req, res) => {
  const scanName = (req.params.scanName || "").trim();
  if (!scanName) {
    return res.status(400).json({ ok: false, error: "scanName parameter is required" });
  }

  const folderPath = path.join(SATSCAN_OUTPUT_DIR, `Scan_${scanName}`);
  try {
    await fs.access(folderPath);
  } catch {
    return res.status(404).json({ ok: false, error: `Scan '${scanName}' not found` });
  }

  try {
    await Frequency.destroy({ where: { name: scanName } });
  } catch (dbError) {
    console.error(`Failed to delete frequency record for ${scanName}:`, dbError);
  }

  await fs.rm(folderPath, { recursive: true, force: true });

  res.json({ ok: true });
});

export const getProgress = asyncHandler(async (req, res) => {
  try {
    // Look for progress files matching the pattern "progress_*_of_*_end"
    const statusDir = SATSCAN_STATUS_DIR;
    
    try {
      await fs.access(statusDir);
    } catch {
      return res.json({ percentage: 0, status: "idle" });
    }

    // Read all files in the status directory
    const files = await fs.readdir(statusDir);
    
    // Find files matching the progress pattern
    const progressFiles = files.filter(file => {
      const match = file.match(/^progress_(\d+)_of_(\d+)_end\.txt$/);
      return match !== null;
    });

    if (progressFiles.length === 0) {
      return res.json({ percentage: 0, status: "idle" });
    }

    // Get the most recent progress file (by modification time)
    let latestFile = null;
    let latestTime = 0;
    
    for (const file of progressFiles) {
      const filePath = path.join(statusDir, file);
      const stats = await fs.stat(filePath);
      if (stats.mtime.getTime() > latestTime) {
        latestTime = stats.mtime.getTime();
        latestFile = file;
      }
    }

    if (!latestFile) {
      return res.json({ percentage: 0, status: "idle" });
    }

    // Parse the numbers from the filename
    const match = latestFile.match(/^progress_(\d+)_of_(\d+)_end\.txt$/);
    if (!match) {
      return res.json({ percentage: 0, status: "idle" });
    }

    const current = parseFloat(match[1]);
    const total = parseFloat(match[2]);
    
    if (isNaN(current) || isNaN(total)) {
      return res.json({ percentage: 0, status: "loading" });
    }

    if (current === 0 && total === 0) {
      return res.json({ percentage: 100, status: "completed" });
    }

    if (total === 0) {
      return res.json({ percentage: 0, status: "loading" });
    }

    // Calculate percentage
    const percentage = Math.min(100, Math.max(0, Math.round((current / total) * 100)));
    
    // If current equals total, it's completed
    const status = current >= total ? "completed" : "loading";
    
    res.json({ percentage, status });
  } catch (error) {
    console.error("Error reading progress files:", error);
    res.json({ percentage: 0, status: "error" });
  }
});
