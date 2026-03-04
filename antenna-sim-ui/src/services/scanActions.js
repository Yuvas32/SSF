import { createFrequency, saveScanXmlAfterCreate } from "./backendApi";

export async function runScanAction({ start, stop }) {
  const saved = await createFrequency({ start, end: stop });

  const xmlResult = await saveScanXmlAfterCreate({
    scanId: saved.id,
    start: saved.start,
    stop: saved.end,
  });

  const nextScan = {
    dbId: saved.id,
    start: saved.start,
    stop: saved.end,
    ts: new Date(saved.createdAt).toLocaleString(),
  };

  return {
    saved,
    xmlResult,
    nextScan,
  };
}

export function buildAutoSaveMessage(xmlResult) {
  const failed = xmlResult?.failed || [];

  if (failed.length) {
    return (
      `⚠️ XML saved partially. Saved to: ${(xmlResult.savedTo || []).join(" , ")}. Failed: ` +
      failed.map((f) => `${f.dir}: ${f.error}`).join(" | ")
    );
  }

  return `✅ XML saved to: ${(xmlResult?.savedTo || []).join(" , ")}`;
}

export function buildScanErrorState({ start, stop, error }) {
  return {
    dbId: null,
    start,
    stop,
    ts: new Date().toLocaleString(),
    error: error?.message || "Failed to save scan",
  };
}