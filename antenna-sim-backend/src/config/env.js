// antenna-sim-backend/src/config/env.js
import dotenv from "dotenv";
import os from "os";
import path from "path";

dotenv.config();

export const port = Number(process.env.PORT || 8080);

// Your current main output dir (kept)
export const OUT_DIR ="C:\\Satscan\\antenna_sim_scans";

// NEW: satscandata dirs
export const SATSCAN_INPUT_DIR ="C:\\Satscan\\satscandata\\input";

export const SATSCAN_OUTPUT_DIR ="C:\\Satscan\\satscandata\\output";

function getDownloadsDir() {
  // Windows-friendly: USERPROFILE\Downloads
  // Fallback: HOME / os.homedir()
  const home =
    process.env.USERPROFILE || process.env.HOME || os.homedir() || "";
  return path.join(home, "Downloads");
}

// Optional override if you want later:
// SCAN_OUT_DIRS="C:\A;C:\B;C:\C"
export const OUT_DIRS = (() => {
  const fromEnv = process.env.SCAN_OUT_DIRS;
  if (fromEnv && String(fromEnv).trim()) {
    return String(fromEnv)
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  return [getDownloadsDir(), SATSCAN_INPUT_DIR, OUT_DIR];
})();

// NEW: satscan api-call exe name (process name)
export const SATSCAN_API_EXE =
  process.env.SATSCAN_API_EXE || "API_Call_Satscan.exe";

