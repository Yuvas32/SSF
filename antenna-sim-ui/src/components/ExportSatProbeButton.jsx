import React, { useMemo } from "react";

/**
 * rows: array of objects from your parsed Scan Result / TableView
 * filenamePrefix: string
 * meta: optional { networkName, rfBand, captureMode }
 */
export default function ExportSatProbeButton({
  rows = [],
  filenamePrefix = "satprobe_carriers",
  meta = { networkName: "Network", rfBand: "Ku Band", captureMode: "RL Based" },
}) {
  const canExport = Array.isArray(rows) && rows.length > 0;

  const payload = useMemo(() => {
    const carriers = (rows || []).map((r, idx) => toSatProbeCarrier(r, idx));

    return {
      ...meta,
      exportedAt: new Date().toISOString(),
      carriers,
    };
  }, [rows, meta]);

  function onExport() {
    const name = `${filenamePrefix}_${new Date()
      .toISOString()
      .replace(/[:.]/g, "-")}.json`;

    downloadJson(payload, name);
  }

  return (
    <button className="btnSmall" onClick={onExport} disabled={!canExport} title={!canExport ? "No rows to export" : ""}>
      Export to SatProbe
    </button>
  );
}

/* ------------------- mapping logic ------------------- */

/**
 * Map YOUR row -> SatProbe column-like structure.
 * Adjust the "pick(...)" keys to match your real parsed columns.
 */
function toSatProbeCarrier(row, idx) {
  // Helpers: read a value from many possible keys
  const frequencyMHz = toNumber(
    pick(row, ["Frequency (MHz)", "frequency_mhz", "frequency", "freq_mhz", "Freq (MHz)", "Freq"])
  );

  const symbolRateKsps = toNumber(
    pick(row, ["Symbolrate (Ks/s)", "Symbolrate (ksps)", "symbolrate_ksps", "sr_ksps", "SymbolRate"])
  );

  const systemType = String(
    pick(row, ["System Type", "system", "System", "Vendor & System"]) ?? ""
  );

  const modulation = String(pick(row, ["Modulation", "modulation"]) ?? "");
  const codeRate = String(pick(row, ["Code Rate", "code_rate", "CodeRate"]) ?? "");

  const frameFormat = String(
    pick(row, ["Frame Format", "uw type", "UW Type", "frame_format"]) ?? ""
  );

  const blockSize = toNumber(pick(row, ["Block Size", "blocksize", "Blocksize"]) );
  const fecType = String(pick(row, ["FEC Type", "fec", "FEC"]) ?? "");

  const spectrumInversion = toBool(
    pick(row, ["Spectrum Inversion", "inverted", "Inverted"]) // you already renamed inversion => inverted
  );

  const isEnabled = toBool(pick(row, ["Is Enabled", "enabled", "Enabled"]) ?? true);
  const isSignaling = toBool(pick(row, ["Is signaling", "is_signaling", "signaling"]) ?? false);

  const demodName = String(pick(row, ["Demodulator Name", "demod_name", "Demod"]) ?? "");

  // Create a stable carrier object
  return {
    // SatProbe-like columns:
    isEnabled,
    demodulatorName: demodName || `Carrier_${idx + 1}`,
    frequencyMHz: frequencyMHz ?? null,
    systemType: systemType || null,
    symbolRateKsps: symbolRateKsps ?? null,
    modulation: modulation || null,
    codeRate: codeRate || null,
    frameFormat: frameFormat || null,
    blockSize: blockSize ?? null,
    fecType: fecType || null,
    spectrumInversion: spectrumInversion, // boolean
    isSignaling: isSignaling, // boolean

    // Optional: keep the original row for debugging / later mapping
    _raw: row,
  };
}

/* ------------------- utilities ------------------- */

function pick(obj, keys) {
  if (!obj || typeof obj !== "object") return undefined;
  for (const k of keys) {
    if (k in obj && obj[k] !== undefined && obj[k] !== null && String(obj[k]).trim() !== "") {
      return obj[k];
    }
  }
  return undefined;
}

function toNumber(v) {
  if (v === undefined || v === null) return null;
  const n = Number(String(v).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function toBool(v) {
  if (v === undefined || v === null) return false;
  if (typeof v === "boolean") return v;
  const s = String(v).trim().toLowerCase();
  if (["1", "true", "yes", "y", "on", "enabled"].includes(s)) return true;
  if (["0", "false", "no", "n", "off", "disabled"].includes(s)) return false;
  // If it’s something like "MISSION"/"DEGRADED" – treat non-empty as true:
  return Boolean(s);
}

function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  setTimeout(() => URL.revokeObjectURL(url), 5000);
}