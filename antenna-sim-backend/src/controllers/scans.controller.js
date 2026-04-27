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
          frequencyData = {
            start: freqRecord.start,
            end: freqRecord.end
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

export const getProgress = asyncHandler(async (req, res) => {
  try {
    const progressFilePath = path.join(SATSCAN_STATUS_DIR, "progress.txt");
    
    // Check if progress file exists
    try {
      await fs.access(progressFilePath);
    } catch {
      return res.json({ percentage: 0, status: "idle" });
    }

    const content = await fs.readFile(progressFilePath, "utf8");
    const lines = content.trim().split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      return res.json({ percentage: 0, status: "idle" });
    }

    // Get the last line (most recent progress)
    const lastLine = lines[lines.length - 1].trim();
    
    // Check if it contains "end" - if so, it's completed
    if (lastLine.toLowerCase().includes("end")) {
      return res.json({ percentage: 100, status: "completed" });
    }

    // Parse two numbers from the line
    const numbers = lastLine.match(/\d+/g);
    if (!numbers || numbers.length < 2) {
      return res.json({ percentage: 0, status: "loading" });
    }

    const num1 = parseFloat(numbers[0]);
    const num2 = parseFloat(numbers[1]);
    
    if (isNaN(num1) || isNaN(num2) || num2 === 0) {
      return res.json({ percentage: 0, status: "loading" });
    }

    // Calculate percentage (assuming num1 is current, num2 is total)
    const percentage = Math.min(100, Math.max(0, Math.round((num1 / num2) * 100)));
    
    res.json({ percentage, status: "loading" });
  } catch (error) {
    console.error("Error reading progress file:", error);
    res.json({ percentage: 0, status: "error" });
  }
});
