import { startScan } from "./backendApi";

export async function runScanAction({ start, stop, scanName }) {
  const result = await startScan({ freqStart: start, freqEnd: stop, scanName });

  const nextScan = {
    dbId: result.scanId,
    start: start,
    stop: stop,
    ts: new Date().toLocaleString(),
  };

  return {
    xmlResult: result,
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

export function buildScanErrorState({ start, stop, scanName, error }) {
  return {
    dbId: null,
    start,
    stop,
    scanName,
    ts: new Date().toLocaleString(),
    error: error?.message || "Failed to save scan",
  };
}