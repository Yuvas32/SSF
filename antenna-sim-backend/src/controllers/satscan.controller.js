import asyncHandler from "../utils/asyncHandler.js";
import {
  countFilesInInputDir,
  getOutputStatusForScanId,
  readSpectrumAsJson,
  readTmpTxtAsText,
  getResultXmlForScanId,
  monitorScanOutput,
} from "../services/satscan.service.js";

export const inputCount = asyncHandler(async (req, res) => {
  const result = await countFilesInInputDir();
  res.json({ ok: true, ...result });
});

export const outputStatus = asyncHandler(async (req, res) => {
  const scanId = req.params.scanId;
  if (!scanId || scanId.trim() === '') {
    return res.status(400).json({ ok: false, error: "scanId must be a non-empty string" });
  }

  const status = await getOutputStatusForScanId(scanId);
  res.json({ ok: true, ...status });
});

export const spectrumFile = asyncHandler(async (req, res) => {
  const scanId = req.params.scanId;
  if (!scanId || scanId.trim() === '') {
    return res.status(400).json({ ok: false, error: "scanId must be a non-empty string" });
  }

  const data = await readSpectrumAsJson(scanId);
  res.json(data);
});

export const tmptxtFile = asyncHandler(async (req, res) => {
  const scanId = req.params.scanId;
  if (!scanId || scanId.trim() === '') {
    return res.status(400).json({ ok: false, error: "scanId must be a non-empty string" });
  }

  const data = await readTmpTxtAsText(scanId);
  res.json(data);
});

export const resultXmlDownloadFile = asyncHandler(async (req, res) => {
  const scanId = req.params.scanId;
  if (!scanId || scanId.trim() === '') {
    return res.status(400).json({ ok: false, error: "scanId must be a non-empty string" });
  }

  const file = await getResultXmlForScanId(scanId);
  return res.download(file.source, file.fileName || "result.xml");
});

export const monitorScan = asyncHandler(async (req, res) => {
  const scanId = req.params.scanId;
  if (!scanId || scanId.trim() === '') {
    return res.status(400).json({ ok: false, error: "scanId must be a non-empty string" });
  }

  const result = await monitorScanOutput(scanId);
  if (result.status === "completed") {
    res.json({ ok: true, status: "completed", spectrumPath: result.spectrumPath });
  } else {
    res.status(408).json({ ok: false, status: "timeout", error: result.error });
  }
});