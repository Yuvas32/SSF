import { fetchInputCountSafe, fetchOutputStatus, fetchSpectrum } from "../spectrumApi";
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

  const pollOnce = async () => {
    try {
      const st = await fetchOutputStatus(sid);
      if (!stillValid()) return;

      if (st?.spectrumFound) {
        const spectrum = await fetchSpectrum(sid);
        if (!stillValid()) return;

        const pts = normalizeSpectrumPoints(spectrum.points);
        if (!pts.length) {
          setStatusText(`⚠️ .spectrum found but returned 0 points — waiting for valid data… (Scan_${sid})`);
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

        cleanupTimers(timersRef);
        return;
      }

      setStatusText(`Searching for .spectrum file… (Scan_${sid})`);
    } catch (e) {
      if (!stillValid()) return;
      setError(e?.message || "Failed to check .spectrum status");
    }
  };

  await pollOnce();
  if (!stillValid()) return;

  timersRef.current.pollTimer = setInterval(pollOnce, 20_000);
}