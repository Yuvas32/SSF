import React from "react";

const DEFAULTS = {
  Burst: "No",
  IF_Freqency: "",
  RollOff: "0.20",
  SISMIS: "Multiple Input Stream",
  TGGS: "Generic continuous",
  ISSYI: "0",
  NPD: "0",
  file_sample_rate: "60000000",
  file_data_format: "28",
  file_path: "",
  IP_address_list_file: "",
  Terminal_list_file: "",
  Pcap_file: "",
  CarrierState: "Full",
  Classification_Result: "2",
  GoldCode: "0",
};

export default function ConvertToXmlButton({ headers = [], rows = [], scanId = null }) {
  const canConvert = Array.isArray(headers) && headers.length > 0 && Array.isArray(rows) && rows.length > 0;

  function onConvert() {
    if (!canConvert) return;

    try {
      const xml = buildXmlFromTable(headers, rows);
      const filename = Number.isFinite(Number(scanId)) && Number(scanId) > 0
        ? `Scan_${scanId}_converted.xml`
        : "converted_carriers.xml";

      downloadTextFile(xml, filename, "application/xml;charset=utf-8");
    } catch (err) {
      alert(err?.message || "Failed to convert table to XML");
    }
  }

  return (
    <button
      className="btn"
      onClick={onConvert}
      disabled={!canConvert}
      title={!canConvert ? "No parsed table rows available" : ""}
      type="button"
    >
      Convert to XML
    </button>
  );
}

/* ----------------------------- core logic ----------------------------- */

function buildXmlFromTable(headers, rows) {
  const carriersXml = rows
    .map((row, idx) => buildCarrierXml(mapRowToCarrier(headers, row, idx)))
    .join("\n");

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<Carriers>`,
    carriersXml,
    `</Carriers>`,
    ``,
  ].join("\n");
}

function mapRowToCarrier(headers, row, idx) {
  const obj = rowToObject(headers, row);

  const frequency = getVal(obj, "frequency (mhz)");
  const symbolrate = getVal(obj, "symbolrate (ks/s)");
  const bw = getVal(obj, "bw (khz)");
  const codeRate = getVal(obj, "code rate");
  const system = getVal(obj, "system");
  const vendorSystem = getVal(obj, "vendor & system");
  const esNo = getVal(obj, "snr (db)");
  const modulation = getVal(obj, "modulation");
  const signalRes = getVal(obj, "signal level");
  const crcOk = getVal(obj, "crc ok");
  const nrUws = getVal(obj, "nr uws");
  const fecType = getVal(obj, "fectype");
  const inverted = getVal(obj, "inverted");
  const blocksize = getVal(obj, "blocksize");

  const comment = fecType ? `, (SW-tuner)FEC = ${fecType}` : "";

  return {
    Frequency: normalizeCell(frequency),
    Symbolrate: normalizeCell(symbolrate),
    BW: normalizeCell(bw),
    Code_Rate: normalizeCell(codeRate),
    System: normalizeCell(system),
    Vendor_System: normalizeCell(vendorSystem),
    Es_no: normalizeCell(esNo),
    Modulation: normalizeCell(modulation),
    Signal_Res: normalizeCell(signalRes),
    comment,
    Burst: DEFAULTS.Burst,
    IF_Freqency: DEFAULTS.IF_Freqency,
    Inverted_Spectrum: normalizeYesNo(inverted),
    UW_type: normalizeCell(nrUws),
    RollOff: DEFAULTS.RollOff,
    FECtype: normalizeCell(fecType),
    SISMIS: DEFAULTS.SISMIS,
    TGGS: DEFAULTS.TGGS,
    CCMACM: normalizeCcmAcm(codeRate),
    ISSYI: DEFAULTS.ISSYI,
    NPD: DEFAULTS.NPD,
    INDEX: String(idx + 1),
    file_sample_rate: DEFAULTS.file_sample_rate,
    file_data_format: DEFAULTS.file_data_format,
    file_path: DEFAULTS.file_path,
    IP_address_list_file: DEFAULTS.IP_address_list_file,
    Terminal_list_file: DEFAULTS.Terminal_list_file,
    Pcap_file: DEFAULTS.Pcap_file,
    Description_No_Result: buildDescription(system, modulation, vendorSystem),
    CarrierState: DEFAULTS.CarrierState,
    Classification_Result: DEFAULTS.Classification_Result,
    GoldCode: DEFAULTS.GoldCode,
    CRC_OK: normalizeCell(crcOk),
    Blocksize: normalizeCell(blocksize),
  };
}

function buildCarrierXml(carrier) {
  const orderedTags = [
    "Frequency",
    "Symbolrate",
    "BW",
    "Code_Rate",
    "System",
    "Vendor_System",
    "Es_no",
    "Modulation",
    "Signal_Res",
    "comment",
    "Burst",
    "IF_Freqency",
    "Inverted_Spectrum",
    "UW_type",
    "RollOff",
    "FECtype",
    "SISMIS",
    "TGGS",
    "CCMACM",
    "ISSYI",
    "NPD",
    "INDEX",
    "file_sample_rate",
    "file_data_format",
    "file_path",
    "IP_address_list_file",
    "Terminal_list_file",
    "Pcap_file",
    "Description_No_Result",
    "CarrierState",
    "Classification_Result",
    "GoldCode",
    "CRC_OK",
    "Blocksize",
  ];

  const lines = ["  <Carrier>"];

  for (const tag of orderedTags) {
    const value = carrier[tag] ?? "";
    lines.push(`    <${tag}>${escapeXml(String(value))}</${tag}>`);
  }

  lines.push("  </Carrier>");
  return lines.join("\n");
}

/* ----------------------------- helpers ----------------------------- */

function rowToObject(headers, row) {
  const out = {};
  for (let i = 0; i < headers.length; i++) {
    out[String(headers[i] || "")] = row?.[i] ?? "";
  }
  return out;
}

function getVal(obj, wantedHeader) {
  const wanted = norm(wantedHeader);
  for (const [k, v] of Object.entries(obj || {})) {
    if (norm(k) === wanted) return v;
  }
  return "";
}

function normalizeCell(value) {
  const s = String(value ?? "").trim();
  if (!s) return "";
  if (s === "— — —" || s === "— —" || s === "—" || s === "---") return "";
  return s;
}

function normalizeYesNo(value) {
  const s = String(value ?? "").trim().toLowerCase();
  if (!s) return "";
  if (["yes", "true", "1"].includes(s)) return "Yes";
  if (["no", "false", "0"].includes(s)) return "No";
  return String(value).trim();
}

function normalizeCcmAcm(codeRate) {
  const s = String(codeRate ?? "").trim().toUpperCase();
  if (s === "ACM" || s === "VCM" || s === "CCM") return s;
  return "";
}

function buildDescription(system, modulation, vendorSystem) {
  const parts = [
    normalizeCell(system),
    normalizeCell(modulation),
    normalizeCell(vendorSystem),
  ].filter(Boolean);

  if (!parts.length) return "";
  return `${parts.join(" ")} no-ip`;
}

function norm(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function downloadTextFile(text, filename, mimeType) {
  const blob = new Blob([text], { type: mimeType });
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  setTimeout(() => {
    window.URL.revokeObjectURL(url);
  }, 5000);
}