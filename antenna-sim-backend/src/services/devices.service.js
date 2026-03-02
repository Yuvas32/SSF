import { exec } from "child_process";

function runCommand(cmd) {
  return new Promise((resolve, reject) => {
    exec(
      cmd,
      {
        windowsHide: true,
        maxBuffer: 20 * 1024 * 1024,
      },
      (err, stdout, stderr) => {
        if (err) {
          return reject(new Error(String(stderr || err.message || err)));
        }
        resolve(String(stdout || ""));
      }
    );
  });
}

function normalize(value) {
  return String(value || "")
    .replace(/\u0000/g, "")
    .trim()
    .toUpperCase();
}

function uniqueStrings(arr) {
  return Array.from(new Set((arr || []).map((x) => String(x).trim()).filter(Boolean)));
}

async function getDeviceNamesFromPowerShellCim() {
  const ps = [
    "$ErrorActionPreference = 'Stop'",
    "$items = Get-CimInstance Win32_PnPEntity | ForEach-Object { $_.Name }",
    "if ($null -eq $items) { '[]' } else { @($items) | ConvertTo-Json -Compress }",
  ].join("; ");

  const cmd = `powershell -NoProfile -ExecutionPolicy Bypass -Command "${ps.replace(/"/g, '\\"')}"`;
  const stdout = await runCommand(cmd);

  const parsed = JSON.parse(stdout || "[]");
  const arr = Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];

  return uniqueStrings(arr);
}

async function getDeviceNamesFromPowerShellPnp() {
  const ps = [
    "$ErrorActionPreference = 'Stop'",
    "$items = Get-PnpDevice -PresentOnly | ForEach-Object { if ($_.FriendlyName) { $_.FriendlyName } elseif ($_.Name) { $_.Name } else { $null } }",
    "if ($null -eq $items) { '[]' } else { @($items) | ConvertTo-Json -Compress }",
  ].join("; ");

  const cmd = `powershell -NoProfile -ExecutionPolicy Bypass -Command "${ps.replace(/"/g, '\\"')}"`;
  const stdout = await runCommand(cmd);

  const parsed = JSON.parse(stdout || "[]");
  const arr = Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];

  return uniqueStrings(arr);
}

async function getAllDetectedNames() {
  try {
    const cimNames = await getDeviceNamesFromPowerShellCim();
    if (cimNames.length) {
      return {
        source: "powershell:Get-CimInstance Win32_PnPEntity",
        detectedNames: cimNames,
      };
    }
  } catch {
    // fallback below
  }

  try {
    const pnpNames = await getDeviceNamesFromPowerShellPnp();
    if (pnpNames.length) {
      return {
        source: "powershell:Get-PnpDevice -PresentOnly",
        detectedNames: pnpNames,
      };
    }
  } catch {
    // fallback below
  }

  return {
    source: "none",
    detectedNames: [],
  };
}

function hasExactName(names, token) {
  const wanted = normalize(token);
  return (names || []).some((name) => normalize(name) === wanted);
}

export async function checkRequiredDevices(requiredTokens = ["device", "pssr4"]) {
  const result = await getAllDetectedNames();
  const allNames = result.detectedNames || [];

  const present = [];
  const missing = [];
  const detectedNames = [];

  for (const token of requiredTokens) {
    if (hasExactName(allNames, token)) {
      present.push(token);

      const matched = allNames.find((name) => normalize(name) === normalize(token));
      if (matched) detectedNames.push(matched);
    } else {
      missing.push(token);
    }
  }

  return {
    ok: missing.length === 0,
    source: result.source,
    className: "Jungo Connectivity",
    required: requiredTokens,
    present,
    missing,
    detectedNames,
    detectedCount: present.length,
    requiredCount: requiredTokens.length,
  };
}