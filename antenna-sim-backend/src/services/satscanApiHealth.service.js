import { exec } from "child_process";
import { SATSCAN_API_EXE } from "../config/env.js";

export function isSatscanApiRunning() {
  return new Promise((resolve, reject) => {
    // tasklist is simplest + reliable on Windows
    // /NH = no header
    const cmd = `tasklist /FI "IMAGENAME eq ${SATSCAN_API_EXE}" /NH`;

    exec(cmd, { windowsHide: true, maxBuffer: 2 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) {
        return reject(new Error(String(stderr || err.message || err)));
      }

      const out = String(stdout || "").trim().toLowerCase();

      // When not found, tasklist typically prints:
      // "INFO: No tasks are running which match the specified criteria."
      const running =
        out.includes(SATSCAN_API_EXE.toLowerCase()) && !out.includes("no tasks are running");

      resolve({
        ok: running,
        exe: SATSCAN_API_EXE,
        message: running ? "api call satscan ok" : "satscan api call not running",
      });
    });
  });
}
