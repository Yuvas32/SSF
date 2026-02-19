import { norm } from "./string";
import { splitPreamble, parseNameValPairsFromXml } from "./xmlParse";

export function getValByExactOrNormalizedName(pairs, name) {
  const exact = pairs.find((p) => p.Name === name);
  if (exact) return exact.Val ?? "";
  const n = norm(name);
  const found = pairs.find((p) => norm(p.Name) === n);
  return found?.Val ?? "";
}

export function extractScanBase(scanName) {
  const s = String(scanName || "").trim();
  const m = s.match(/^(.*?)(?:[_\-\s]?)(\d+)\s*$/);
  return m ? m[1] : s;
}

export function readScanNameFromRawXml(rawXmlText) {
  let scanName = "controller";
  try {
    const { xmlPart } = splitPreamble(rawXmlText);
    const parsedPairs = parseNameValPairsFromXml(xmlPart);
    scanName = getValByExactOrNormalizedName(parsedPairs, "Scan_Name") || scanName;
  } catch {
    // ignore
  }
  return scanName;
}
