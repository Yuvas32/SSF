import { useEffect, useRef, useState } from "react";
import { runSpectrumWatcherEpic } from "../epics/spectrumWatcherEpic";
import { cleanupTimers } from "../utils/spectrumHelpers";

export default function useSpectrumWatcher({ sid, hasScan, mode }) {
  const [live, setLive] = useState(null);
  const [statusText, setStatusText] = useState("");
  const [elapsedSec, setElapsedSec] = useState(0);
  const [waitingSecLeft, setWaitingSecLeft] = useState(0);
  const [error, setError] = useState("");

  const timersRef = useRef({ elapsedTimer: null, waitTimer: null, pollTimer: null });
  const startTsRef = useRef(0);
  const activeScanIdRef = useRef(null);

  useEffect(() => {
    cleanupTimers(timersRef);

    setError("");
    setLive(null);
    setElapsedSec(0);
    setWaitingSecLeft(0);
    setStatusText("");

    if (!hasScan) return;

    activeScanIdRef.current = sid;
    startTsRef.current = Date.now();

    timersRef.current.elapsedTimer = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startTsRef.current) / 1000));
    }, 1000);

    const ctx = {
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
    };

    let cancelled = false;

    (async () => {
      try {
        await runSpectrumWatcherEpic(ctx, () => cancelled);
      } catch (e) {
        if (cancelled) return;
        setError(e?.message || "Watcher failed");
      }
    })();

    return () => {
      cancelled = true;
      activeScanIdRef.current = null;
      cleanupTimers(timersRef);
    };
  }, [sid, hasScan, mode]);

  return { live, statusText, elapsedSec, waitingSecLeft, error };
}