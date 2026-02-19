import asyncHandler from "../utils/asyncHandler.js";
import {
  countFilesInInputDir,
  getOutputStatusForScanId,
  readSpectrumAsJson,
  readTmpTxtAsText,
} from "../services/satscan.service.js";

export const inputCount = asyncHandler(async (req, res) => {
  const result = await countFilesInInputDir();
  res.json({ ok: true, ...result });
});

export const outputStatus = asyncHandler(async (req, res) => {
  const scanId = Number(req.params.scanId);
  if (!Number.isFinite(scanId) || scanId <= 0) {
    return res.status(400).json({ ok: false, error: "scanId must be a positive number" });
  }

  const status = await getOutputStatusForScanId(scanId);
  res.json({ ok: true, ...status });
});

export const spectrumFile = asyncHandler(async (req, res) => {
  const scanId = Number(req.params.scanId);
  if (!Number.isFinite(scanId) || scanId <= 0) {
    return res.status(400).json({ ok: false, error: "scanId must be a positive number" });
  }

  const data = await readSpectrumAsJson(scanId);
  res.json(data);
});

// ✅ NEW: tmptxt reader
export const tmptxtFile = asyncHandler(async (req, res) => {
  const scanId = Number(req.params.scanId);
  if (!Number.isFinite(scanId) || scanId <= 0) {
    return res.status(400).json({ ok: false, error: "scanId must be a positive number" });
  }

  const data = await readTmpTxtAsText(scanId);
  res.json(data);
});
