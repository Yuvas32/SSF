import { fetchInputCountSafe, fetchOutputStatus, fetchSpectrum, fetchMonitor } from "../spectrumApi";
import { fmtTime } from "../spectrumMath";
import { cleanupTimers, normalizeSpectrumPoints, sleep } from "../utils/spectrumHelpers";

export async function runSpectrumWatcherEpic(ctx, isCancelled) {
  const {
    sid,
    mode,
    timersRef,
    startTsRef,
    activeScanIdRef,

    setLive,
    setStatusText,
    setWaitingSecLeft,
    setElapsedSec,
    setError,

    completeScan,
    errorScan,
  } = ctx;

  const stillValid = () => !isCancelled() && activeScanIdRef.current === sid;

  if (mode === "scan") {
    const inputCount = await fetchInputCountSafe();
    if (!stillValid()) return;

    if (inputCount === 0) {
      setStatusText(`Input folder has 0 files. Waiting 60s before checking for .spectrum…`);
      setWaitingSecLeft(60);

      timersRef.current.waitTimer = setInterval(() => {
        setWaitingSecLeft((prev) => Math.max(0, prev - 1));
      }, 1000);

      await sleep(60_000);
      if (!stillValid()) return;

      if (timersRef.current.waitTimer) {
        clearInterval(timersRef.current.waitTimer);
        timersRef.current.waitTimer = null;
      }
      setWaitingSecLeft(0);
    }
  }

  setStatusText(`Searching for .spectrum file… (Scan_${sid})`);

  try {
    let isCompleted = false;
    if (mode === "display") {
      const status = await fetchOutputStatus(sid);
      if (!stillValid()) return;
      isCompleted = status.completed;
    } else {
      const monitorResult = await fetchMonitor(sid);
      if (!stillValid()) return;
      isCompleted = monitorResult.status === "completed";
    }

    if (isCompleted) {
      const spectrum = await fetchSpectrum(sid);
      if (!stillValid()) return;

      const pts = normalizeSpectrumPoints(spectrum.points);
      if (!pts.length) {
        setError(`⚠️ .spectrum found but returned 0 points`);
        return;
      }

      setLive({
        points: pts,
        unit: spectrum.unit || "MHz",
        updatedAt: spectrum.updatedAt || "",
        source: spectrum.source || "",
      });

      const elapsedNow = Math.floor((Date.now() - startTsRef.current) / 1000);
      setElapsedSec(elapsedNow);
      setStatusText(`✅ .spectrum found after ${fmtTime(elapsedNow)} — showing real spectrum`);

      completeScan();
      cleanupTimers(timersRef);
    } else {
      if (mode === "display") {
        setError("Scan not completed yet");
      } else {
        setError(monitorResult.error || "Monitoring timed out");
      }
      errorScan();
    }
  } catch (e) {
    if (!stillValid()) return;
    setError(e?.message || "Failed to monitor scan");
    errorScan();
  }
}