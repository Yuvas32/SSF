import { useEffect, useMemo, useRef, useState } from "react";

export default function SpectrumView({ startFreq, endFreq, lastScan, scanId, mode = "scan" }) {
  // demo spectrum (ONLY when there is NO scanId)
  const [demo, setDemo] = useState({ points: [], unit: "MHz", updatedAt: "" });

  // live spectrum (from .spectrum)
  const [live, setLive] = useState(null); // {points, unit, updatedAt, source}
  const [statusText, setStatusText] = useState(""); // UI message
  const [elapsedSec, setElapsedSec] = useState(0);
  const [waitingSecLeft, setWaitingSecLeft] = useState(0);
  const [error, setError] = useState("");

  const demoUrl = useMemo(() => "/spectrum-demo.json", []);

  const timersRef = useRef({
    elapsedTimer: null,
    waitTimer: null,
    pollTimer: null,
  });

  const startTsRef = useRef(0);
  const activeScanIdRef = useRef(null);

  const sid = Number(scanId);
  const hasScan = Number.isFinite(sid) && sid > 0;

  // ✅ Load demo ONLY if there is NO scan yet
  useEffect(() => {
    if (hasScan) return;

    let alive = true;
    (async () => {
      try {
        const res = await fetch(`${demoUrl}?t=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`Failed to load demo spectrum (${res.status})`);
        const json = await res.json();
        if (!alive) return;

        const points = Array.isArray(json.points) ? json.points : [];
        setDemo({
          points,
          unit: json.unit || "MHz",
          updatedAt: json.updatedAt || "",
        });
      } catch (e) {
        console.warn(e);
      }
    })();

    return () => {
      alive = false;
    };
  }, [demoUrl, hasScan]);

  // Trigger watcher AFTER pressing Scan (scanId changes)
  useEffect(() => {
    cleanupTimers(timersRef);

    setError("");
    setLive(null);
    setElapsedSec(0);
    setWaitingSecLeft(0);
    setStatusText("");

    if (!hasScan) {
      return;
    }

    activeScanIdRef.current = sid;
    startTsRef.current = Date.now();

    timersRef.current.elapsedTimer = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startTsRef.current) / 1000));
    }, 1000);

    let cancelled = false;

    (async () => {
      try {
        // ✅ Only in normal "scan" mode we do the inputCount + wait 60 logic
        if (mode === "scan") {
          const inputCount = await fetchInputCountSafe();
          if (cancelled || activeScanIdRef.current !== sid) return;

          if (inputCount === 0) {
            setStatusText(`Input folder has 0 files. Waiting 60s before checking for .spectrum…`);
            setWaitingSecLeft(60);

            timersRef.current.waitTimer = setInterval(() => {
              setWaitingSecLeft((prev) => {
                const next = prev - 1;
                return next <= 0 ? 0 : next;
              });
            }, 1000);

            await sleep(60_000);
            if (cancelled || activeScanIdRef.current !== sid) return;

            if (timersRef.current.waitTimer) {
              clearInterval(timersRef.current.waitTimer);
              timersRef.current.waitTimer = null;
            }
            setWaitingSecLeft(0);
          }
        }

        // Poll output every 20 seconds
        setStatusText(`Searching for .spectrum file… (Scan_${sid})`);

        const pollOnce = async () => {
          try {
            const st = await fetchOutputStatus(sid);
            if (cancelled || activeScanIdRef.current !== sid) return;

            if (st?.spectrumFound) {
              const spectrum = await fetchSpectrum(sid);
              if (cancelled || activeScanIdRef.current !== sid) return;

              const pts = Array.isArray(spectrum.points) ? spectrum.points : [];

              // If spectrum exists but empty -> keep searching
              if (!pts.length) {
                setStatusText(
                  `⚠️ .spectrum found but returned 0 points — waiting for valid data… (Scan_${sid})`
                );
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
            if (cancelled || activeScanIdRef.current !== sid) return;
            setError(e?.message || "Failed to check .spectrum status");
            setStatusText(`Searching for .spectrum file… (Scan_${sid})`);
          }
        };

        await pollOnce();
        if (cancelled || activeScanIdRef.current !== sid) return;

        timersRef.current.pollTimer = setInterval(pollOnce, 20_000);
      } catch (e) {
        if (cancelled || activeScanIdRef.current !== sid) return;
        setError(e?.message || "Watcher failed");
      }
    })();

    return () => {
      cancelled = true;
      activeScanIdRef.current = null;
      cleanupTimers(timersRef);
    };
  }, [scanId, hasScan, sid, mode]);

  const pointsToShow = hasScan ? (live?.points || []) : (demo.points || []);
  const unitToShow = hasScan ? (live?.unit || "MHz") : (demo.unit || "MHz");

  const svg = useMemo(() => buildPolyline(pointsToShow, 760, 240), [pointsToShow]);

  return (
    <div className="panel">
      <div className="panelHeader">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="panelTitle">Spectrum View</div>
          <span style={badgeStyle}>{hasScan ? (live ? "LIVE" : "SEARCHING") : "DEMO"}</span>
        </div>

        <div className="panelMeta">
          {lastScan ? `Scan: ${startFreq} → ${endFreq} • ${lastScan}` : "No scan yet"}
        </div>
      </div>

      <div className="panelBody" style={{ paddingTop: 10 }}>
        {hasScan ? (
          <div style={metaRowStyle}>
            <div style={{ opacity: 0.85 }}>
              <b>Status:</b> {statusText || "Preparing…"}
            </div>
            <div style={{ opacity: 0.75 }}>
              <b>Elapsed:</b> {fmtTime(elapsedSec)}
              {waitingSecLeft > 0 ? (
                <>
                  {" "}
                  • <b>Waiting:</b> {waitingSecLeft}s
                </>
              ) : null}
            </div>
          </div>
        ) : (
          <div style={metaRowStyle}>
            <div style={{ opacity: 0.75 }}>
              Source: <b>{demoUrl}</b>
            </div>
          </div>
        )}

        {error ? <div style={errorBoxStyle}>{error}</div> : null}

        <div className="spectrumCanvas" style={{ padding: 0 }}>
          <div style={chartFrameStyle}>
            <svg viewBox="0 0 760 240" width="100%" height="240" role="img" aria-label="spectrum">
              {svg.gridLines.map((line, i) => (
                <line
                  key={i}
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke="rgba(0,0,0,0.08)"
                  strokeWidth="1"
                />
              ))}

              <polyline
                fill="none"
                stroke="rgba(17,24,39,0.9)"
                strokeWidth="2"
                points={svg.polylinePoints}
              />

              <text x="10" y="20" fontSize="12" fill="rgba(0,0,0,0.55)">
                Power (dB) vs Frequency ({unitToShow})
              </text>

              <text x="10" y="232" fontSize="11" fill="rgba(0,0,0,0.55)">
                {svg.minF} – {svg.maxF} {unitToShow}
              </text>
              <text x="680" y="232" fontSize="11" fill="rgba(0,0,0,0.55)">
                {svg.minP} – {svg.maxP} dB
              </text>
            </svg>

            {hasScan && !live?.points?.length ? (
              <div style={placeholderStyle}>Searching for .spectrum file…</div>
            ) : null}

            {!hasScan && !pointsToShow?.length ? (
              <div style={placeholderStyle}>No demo points…</div>
            ) : null}
          </div>
        </div>

        {live?.source ? (
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>
            LIVE source: <b>{live.source}</b>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ---------------- backend calls ---------------- */

async function fetchInputCountSafe() {
  try {
    const res = await fetch("http://localhost:8080/satscan/input/count", { cache: "no-store" });
    if (!res.ok) return 0;
    const j = await res.json();
    return Number(j.count || 0);
  } catch {
    return 0;
  }
}

async function fetchOutputStatus(scanId) {
  const res = await fetch(`http://localhost:8080/satscan/output/${scanId}/status`, {
    cache: "no-store",
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `HTTP ${res.status}`);
  }
  return await res.json();
}

async function fetchSpectrum(scanId) {
  const res = await fetch(`http://localhost:8080/satscan/output/${scanId}/spectrum`, {
    cache: "no-store",
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `HTTP ${res.status}`);
  }
  return await res.json();
}

/* ---------------- helpers ---------------- */

function cleanupTimers(timersRef) {
  if (!timersRef?.current) return;

  if (timersRef.current.elapsedTimer) {
    clearInterval(timersRef.current.elapsedTimer);
    timersRef.current.elapsedTimer = null;
  }
  if (timersRef.current.waitTimer) {
    clearInterval(timersRef.current.waitTimer);
    timersRef.current.waitTimer = null;
  }
  if (timersRef.current.pollTimer) {
    clearInterval(timersRef.current.pollTimer);
    timersRef.current.pollTimer = null;
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function fmtTime(sec) {
  const s = Math.max(0, Number(sec) || 0);
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function buildPolyline(points, width, height) {
  const safe = Array.isArray(points) ? points : [];
  if (safe.length < 2) {
    return {
      polylinePoints: "",
      minF: "-",
      maxF: "-",
      minP: "-",
      maxP: "-",
      gridLines: defaultGrid(width, height),
    };
  }

  const freqs = safe.map((d) => Number(d.f)).filter(Number.isFinite);
  const powers = safe.map((d) => Number(d.p)).filter(Number.isFinite);

  const minF = Math.min(...freqs);
  const maxF = Math.max(...freqs);
  const minP = Math.min(...powers);
  const maxP = Math.max(...powers);

  const pad = 12;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;

  const scaleX = (f) => pad + ((f - minF) / (maxF - minF || 1)) * innerW;
  const scaleY = (p) => pad + (1 - (p - minP) / (maxP - minP || 1)) * innerH;

  const polylinePoints = safe
    .map((d) => {
      const f = Number(d.f);
      const p = Number(d.p);
      if (!Number.isFinite(f) || !Number.isFinite(p)) return null;
      return `${scaleX(f).toFixed(2)},${scaleY(p).toFixed(2)}`;
    })
    .filter(Boolean)
    .join(" ");

  return {
    polylinePoints,
    minF: roundSmart(minF),
    maxF: roundSmart(maxF),
    minP: roundSmart(minP),
    maxP: roundSmart(maxP),
    gridLines: defaultGrid(width, height),
  };
}

function defaultGrid(width, height) {
  const lines = [];
  for (let i = 1; i <= 5; i++) {
    const x = (width * i) / 6;
    lines.push({ x1: x, y1: 0, x2: x, y2: height });
  }
  for (let i = 1; i <= 3; i++) {
    const y = (height * i) / 4;
    lines.push({ x1: 0, y1: y, x2: width, y2: y });
  }
  return lines;
}

function roundSmart(n) {
  if (!Number.isFinite(n)) return "-";
  if (Math.abs(n) >= 1000) return Math.round(n);
  return Math.round(n * 10) / 10;
}

const badgeStyle = {
  fontSize: 11,
  fontWeight: 800,
  padding: "3px 8px",
  borderRadius: 999,
  border: "1px solid rgba(0,0,0,0.15)",
  background: "rgba(0,0,0,0.06)",
};

const metaRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  fontSize: 12,
  marginBottom: 10,
};

const chartFrameStyle = {
  position: "relative",
  border: "1px dashed rgba(0,0,0,0.18)",
  borderRadius: 12,
  background: "#FAFAFA",
  overflow: "hidden",
};

const placeholderStyle = {
  position: "absolute",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "rgba(0,0,0,0.55)",
  fontSize: 14,
};

const errorBoxStyle = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #FCA5A5",
  background: "#FEE2E2",
  color: "#991B1B",
  fontSize: 13,
};
