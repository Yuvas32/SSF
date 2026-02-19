// antanna-sim-backend/src/services/scans.service.js
import fs from "fs/promises";
import path from "path";
import { OUT_DIRS } from "../config/env.js";
import { safeFileName } from "../utils/safeFileName.js";

export async function saveXmlToFolder({ scanName, xml }) {
  if (!xml || typeof xml !== "string") {
    const err = new Error("xml must be a string");
    err.statusCode = 400;
    throw err;
  }

  const base = safeFileName(scanName);
  const fileName = base.toLowerCase().endsWith(".xml") ? base : `${base}.xml`;

  // Write to all output dirs, collect successes + failures
  const results = await Promise.allSettled(
    OUT_DIRS.map(async (dir) => {
      await fs.mkdir(dir, { recursive: true });
      const fullPath = path.join(dir, fileName);
      await fs.writeFile(fullPath, xml, "utf8");
      return fullPath;
    })
  );

  const savedTo = [];
  const failed = [];

  results.forEach((r, idx) => {
    const dir = OUT_DIRS[idx];
    if (r.status === "fulfilled") savedTo.push(r.value);
    else failed.push({ dir, error: r.reason?.message || String(r.reason) });
  });

  // If ALL failed -> error
  if (savedTo.length === 0) {
    const err = new Error("Failed to save XML to all output folders");
    err.statusCode = 500;
    err.details = { failed, outDirs: OUT_DIRS, fileName };
    throw err;
  }

  return { savedTo, failed, outDirs: OUT_DIRS, fileName };
}
