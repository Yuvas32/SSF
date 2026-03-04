import { useMemo, useState } from "react";
import {
  buildAutoSaveMessage,
  buildScanErrorState,
  runScanAction,
} from "../services/scanActions";
import {
  buildDisplayedScan,
  buildTmptxtError,
  loadTmptxtByScanId,
} from "../services/displayActions";

export default function useScanActions({ pcHealth, cooldown, setActiveTab }) {
  const [scan, setScan] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [tableText, setTableText] = useState("");
  const [spectrumMode, setSpectrumMode] = useState("scan");
  const [xmlApi, setXmlApi] = useState({ saveAfterNextApply: null });
  const [autoSaveMsg, setAutoSaveMsg] = useState("");

  const canScan = useMemo(() => {
    return !isScanning && !cooldown.isCooldownActive && pcHealth.ok;
  }, [isScanning, cooldown.isCooldownActive, pcHealth.ok]);

  async function handleScan({ start, stop }) {
    if (!canScan) return;

    setAutoSaveMsg("");
    cooldown.startCooldown();
    setIsScanning(true);

    await new Promise(requestAnimationFrame);

    try {
      const { xmlResult, nextScan } = await runScanAction({ start, stop });

      setAutoSaveMsg(buildAutoSaveMessage(xmlResult));
      setSpectrumMode("scan");
      setScan(nextScan);
      setActiveTab("spectrum");
    } catch (error) {
      console.error(error);
      setScan(buildScanErrorState({ start, stop, error }));
      setActiveTab("spectrum");
      setAutoSaveMsg(`❌ ${error?.message || "Scan failed"}`);
    } finally {
      setIsScanning(false);
    }
  }

  async function handleDisplayRow(row) {
    setSpectrumMode("display");
    setScan(buildDisplayedScan(row));
    setActiveTab("spectrum");

    try {
      const text = await loadTmptxtByScanId(row.id);
      setTableText(text);
    } catch (error) {
      setTableText(buildTmptxtError(row.id, error));
    }
  }

  return {
    scan,
    setScan,
    isScanning,
    tableText,
    setTableText,
    spectrumMode,
    setSpectrumMode,
    xmlApi,
    setXmlApi,
    autoSaveMsg,
    setAutoSaveMsg,
    canScan,
    handleScan,
    handleDisplayRow,
  };
}