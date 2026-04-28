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

export function killSatscanApi() {
  return new Promise((resolve, reject) => {
    const cmd = `taskkill /IM ${SATSCAN_API_EXE} /F`;

    exec(cmd, { windowsHide: true, maxBuffer: 2 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) {
        return reject(new Error(String(stderr || err.message || err)));
      }
      resolve({ ok: true, message: String(stdout || "").trim() });
    });
  });
}

export function isCerberusServiceRunning() {
  return new Promise((resolve, reject) => {
    const cmd = `powershell -NoProfile -Command "Get-Service -Name Cerberus -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Status"`;

    exec(cmd, { windowsHide: true, maxBuffer: 2 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) {
        return reject(new Error(String(stderr || err.message || err)));
      }

      const status = String(stdout || "").trim().toLowerCase();
      const running = status === "running";

      resolve({
        ok: running,
        service: "Cerberus",
        status: status || "not found",
        message: running ? "Cerberus service running" : "Cerberus service not running",
      });
    });
  });
}

export function startCerberusService() {
  return new Promise((resolve, reject) => {
    const cmd = `powershell -NoProfile -Command "Start-Service -Name Cerberus -ErrorAction SilentlyContinue; Start-Sleep -Seconds 1; Get-Service -Name Cerberus -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Status"`;

    exec(cmd, { windowsHide: true, maxBuffer: 2 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) {
        return reject(new Error(String(stderr || err.message || err)));
      }

      const status = String(stdout || "").trim().toLowerCase();
      const running = status === "running";

      resolve({
        ok: running,
        service: "Cerberus",
        status: status || "unknown",
        message: running ? "Cerberus service started" : "Failed to start Cerberus service",
      });
    });
  });
}

export function launchSatscanApi() {
  return new Promise((resolve, reject) => {
    const exePath = `C:\\Satscan\\${SATSCAN_API_EXE}`;
    const cmd = `start "" "${exePath}"`;

    exec(cmd, { windowsHide: true, maxBuffer: 2 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) {
        return reject(new Error(String(stderr || err.message || err)));
      }
      resolve({ ok: true, message: `${SATSCAN_API_EXE} launched` });
    });
  });
}
