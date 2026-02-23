import { useEffect, useMemo, useRef, useState } from "react";
import { fetchInputCountSafe, fetchOutputStatus, fetchSpectrum } from "./spectrumApi";
import { buildPolyline, fmtTime } from "./spectrumMath";
import {
  badgeStyle,
  chartFrameStyle,
  errorBoxStyle,
  metaRowStyle,
  placeholderStyle,
  zoomBarStyle,
  zoomBtnStyle,
  zoomLabelStyle,
  markerDotStyle,
  tooltipStyle,
  modalOverlayStyle,
  modalBodyStyle,
  modalBoxStyleDark,
  modalBoxStyleLight,
  modalHeaderStyleDark,
  modalHeaderStyleLight,
} from "./spectrumStyles";

export default function SpectrumView({ startFreq, endFreq, lastScan, scanId, mode = "scan" }) {

  const isDark = document?.querySelector?.(".app")?.classList?.contains("dark");


  const [demo, setDemo] = useState({ points: [], unit: "MHz", updatedAt: "" });
  const [live, setLive] = useState(null);
  const [statusText, setStatusText] = useState("");
  const [elapsedSec, setElapsedSec] = useState(0);
  const [waitingSecLeft, setWaitingSecLeft] = useState(0);
  const [error, setError] = useState("");

  // Popup control
  const [isOpen, setIsOpen] = useState(false);

  // Zoom + pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Hover tooltip
  const [hover, setHover] = useState(null);

  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const frameRef = useRef(null);

  const demoUrl = useMemo(() => "/spectrum-demo.json", []);
  const timersRef = useRef({ elapsedTimer: null, waitTimer: null, pollTimer: null });
  const startTsRef = useRef(0);
  const activeScanIdRef = useRef(null);

  const sid = Number(scanId);
  const hasScan = Number.isFinite(sid) && sid > 0;

  // Close on Esc
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  // Load demo only before any scan
  useEffect(() => {
    if (hasScan) return;
    let alive = true;

    (async () => {
      try {
        const res = await fetch(`${demoUrl}?t=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`Failed to load demo spectrum (${res.status})`);
        const json = await res.json();
        if (!alive) return;

        setDemo({
          points: Array.isArray(json.points) ? json.points : [],
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

  // Watcher after pressing Scan (scanId changes)
  useEffect(() => {
    cleanupTimers(timersRef);

    setError("");
    setLive(null);
    setElapsedSec(0);
    setWaitingSecLeft(0);
    setStatusText("");
    setHover(null);

    if (!hasScan) return;

    activeScanIdRef.current = sid;
    startTsRef.current = Date.now();

    timersRef.current.elapsedTimer = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startTsRef.current) / 1000));
    }, 1000);

    let cancelled = false;

    (async () => {
      try {
        if (mode === "scan") {
          const inputCount = await fetchInputCountSafe();
          if (cancelled || activeScanIdRef.current !== sid) return;

          if (inputCount === 0) {
            setStatusText(`Input folder has 0 files. Waiting 60s before checking for .spectrum…`);
            setWaitingSecLeft(60);

            timersRef.current.waitTimer = setInterval(() => {
              setWaitingSecLeft((prev) => Math.max(0, prev - 1));
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

        setStatusText(`Searching for .spectrum file… (Scan_${sid})`);

        const pollOnce = async () => {
          try {
            const st = await fetchOutputStatus(sid);
            if (cancelled || activeScanIdRef.current !== sid) return;

            if (st?.spectrumFound) {
              const spectrum = await fetchSpectrum(sid);
              if (cancelled || activeScanIdRef.current !== sid) return;

              const pts = Array.isArray(spectrum.points) ? spectrum.points : [];
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
            if (cancelled || activeScanIdRef.current !== sid) return;
            setError(e?.message || "Failed to check .spectrum status");
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

  // Zoom helpers
  const clampZoom = (z) => Math.min(8, Math.max(1, z));
  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setHover(null);
  };
  const zoomIn = () => setZoom((z) => clampZoom(round2(z * 1.25)));
  const zoomOut = () => setZoom((z) => clampZoom(round2(z / 1.25)));

  useEffect(() => {
    const maxPan = 220 * (zoom - 1);
    setPan((p) => ({
      x: clamp(p.x, -maxPan * 2, maxPan * 2),
      y: clamp(p.y, -maxPan, maxPan),
    }));
  }, [zoom]);

  function onPointerDown(e) {
    if (zoom <= 1) return;
    isPanningRef.current = true;
    const pt = getClientPoint(e);
    panStartRef.current = { x: pt.x, y: pt.y, panX: pan.x, panY: pan.y };
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {}
  }

  function onPointerMove(e) {
    if (!isPanningRef.current) return;
    const pt = getClientPoint(e);
    const dx = pt.x - panStartRef.current.x;
    const dy = pt.y - panStartRef.current.y;
    setPan({ x: panStartRef.current.panX + dx, y: panStartRef.current.panY + dy });
  }

  function onPointerUp(e) {
    isPanningRef.current = false;
    try {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    } catch {}
  }

  function onWheel(e) {
    if (!frameRef.current) return;
    e.preventDefault();

    const dir = Math.sign(e.deltaY);
    const nextZoom = clampZoom(round2(dir > 0 ? zoom / 1.15 : zoom * 1.15));

    const rect = frameRef.current.getBoundingClientRect();
    const cx = e.clientX - rect.left - rect.width / 2;
    const cy = e.clientY - rect.top - rect.height / 2;

    const ratio = nextZoom / zoom;
    setPan((p) => ({
      x: (p.x - cx) * ratio + cx,
      y: (p.y - cy) * ratio + cy,
    }));
    setZoom(nextZoom);
  }

  function onMouseMove(e) {
    if (!frameRef.current) return;
    if (svg?.minFNum == null || svg?.maxFNum == null || svg?.minPNum == null || svg?.maxPNum == null) return;
    if (!pointsToShow?.length) return;

    const rect = frameRef.current.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const cx0 = px - rect.width / 2;
    const cy0 = py - rect.height / 2;

    const invScale = 1 / (zoom || 1);
    const cx = (cx0 - pan.x) * invScale + rect.width / 2;
    const cy = (cy0 - pan.y) * invScale + rect.height / 2;

    const sx = (cx / rect.width) * 760;
    const pad = 12;
    const innerW = 760 - pad * 2;

    const clampedX = clamp(sx, pad, pad + innerW);
    const t = (clampedX - pad) / (innerW || 1);
    const fAtMouse = svg.minFNum + t * (svg.maxFNum - svg.minFNum);

    const best = nearestByFreq(pointsToShow, fAtMouse);
    if (!best) {
      setHover(null);
      return;
    }

    const mx = pad + ((best.f - svg.minFNum) / (svg.maxFNum - svg.minFNum || 1)) * innerW;
    const innerH = 240 - pad * 2;
    const my = pad + (1 - (best.p - svg.minPNum) / (svg.maxPNum - svg.minPNum || 1)) * innerH;

    const markerPx = (mx / 760) * rect.width;
    const markerPy = (my / 240) * rect.height;

    setHover({ f: best.f, p: best.p, px: markerPx, py: markerPy });
  }

  function onMouseLeave() {
    setHover(null);
  }

  const transform = `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`;
  const isZoomed = zoom > 1.01;

  // --- Small "card" UI on the page (no big chart here) ---
  return (
    <>
      <div className="panel">
        <div className="panelHeader">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="panelTitle">Spectrum View</div>
            <span style={badgeStyle}>{hasScan ? (live ? "LIVE" : "SEARCHING") : "DEMO"}</span>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div className="panelMeta">
              {lastScan ? `Scan: ${startFreq} → ${endFreq} • ${lastScan}` : "No scan yet"}
            </div>
            <button className="btnSmall" onClick={() => setIsOpen(true)}>
              Open
            </button>
          </div>
        </div>

        <div className="panelBody" style={{ paddingTop: 10 }}>
          <div style={{ fontSize: 12, opacity: 0.8 }}>
            Click <b>Open</b> to view the spectrum in a popup (zoom / pan / hover values).
          </div>
        </div>
      </div>

      {/* ---------- Popup Modal ---------- */}
      {isOpen && (
        <div
          style={modalOverlayStyle}
          onMouseDown={(e) => {
            // click outside closes
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
<div style={isDark ? modalBoxStyleDark : modalBoxStyleLight}>
  <div style={isDark ? modalHeaderStyleDark : modalHeaderStyleLight}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ fontWeight: 900 }}>Spectrum</div>
                <span style={badgeStyle}>{hasScan ? (live ? "LIVE" : "SEARCHING") : "DEMO"}</span>
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ fontSize: 12, opacity: 0.8 }}>
                  {lastScan ? `${startFreq} → ${endFreq}` : ""}
                </div>
                <button className="btnSmall" onClick={() => setIsOpen(false)}>
                  Close
                </button>
              </div>
            </div>

            <div style={modalBodyStyle}>
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

              {/* Zoom toolbar */}
              <div style={zoomBarStyle}>
                <button className="btnSmall" style={zoomBtnStyle} onClick={zoomOut} disabled={zoom <= 1}>
                  −
                </button>
                <div style={zoomLabelStyle}>{Math.round(zoom * 100)}%</div>
                <button className="btnSmall" style={zoomBtnStyle} onClick={zoomIn} disabled={zoom >= 8}>
                  +
                </button>
                <button
                  className="btnSmall"
                  style={{ ...zoomBtnStyle, marginLeft: 8 }}
                  onClick={resetView}
                  disabled={zoom === 1 && pan.x === 0 && pan.y === 0}
                >
                  Reset
                </button>
                <div style={{ fontSize: 12, opacity: 0.7, marginLeft: 10 }}>
                  {isZoomed
                    ? "Drag to pan • Wheel to zoom • Double-click reset • Hover for values"
                    : "Wheel to zoom • Hover for values"}
                </div>
              </div>

              {/* Chart */}
              <div
                ref={frameRef}
                style={{
                  ...chartFrameStyle,
                  cursor: isZoomed ? (isPanningRef.current ? "grabbing" : "grab") : "default",
                  touchAction: "none",
                }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onWheel={onWheel}
                onDoubleClick={resetView}
                onMouseMove={onMouseMove}
                onMouseLeave={onMouseLeave}
              >
                <div style={{ transform, transformOrigin: "center center", width: "100%", height: "100%" }}>
                  <svg viewBox="0 0 760 240" width="100%" height="100%" role="img" aria-label="spectrum">
                    {svg.gridLines.map((line, i) => (
                      <line key={i} {...line} stroke="rgba(0,0,0,0.08)" strokeWidth="1" />
                    ))}

                    <polyline fill="none" stroke="rgba(17,24,39,0.9)" strokeWidth="2" points={svg.polylinePoints} />

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
                </div>

                {/* Hover marker + tooltip */}
                {hover ? (
                  <>
                    <div style={{ ...markerDotStyle, left: hover.px, top: hover.py }} />
                    <div
                      style={{
                        ...tooltipStyle,
                        left: Math.min(hover.px + 12, (frameRef.current?.clientWidth || 760) - 10),
                        top: Math.max(hover.py - 34, 8),
                      }}
                    >
                      F: {hover.f.toFixed(3)} {unitToShow} • P: {hover.p.toFixed(1)} dB
                    </div>
                  </>
                ) : null}

                {hasScan && !live?.points?.length ? <div style={placeholderStyle}>Searching for .spectrum file…</div> : null}
                {!hasScan && !pointsToShow?.length ? <div style={placeholderStyle}>No demo points…</div> : null}
              </div>

              {live?.source ? (
                <div style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>
                  LIVE source: <b>{live.source}</b>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ---------- helpers ---------- */

function cleanupTimers(timersRef) {
  if (!timersRef?.current) return;
  for (const k of ["elapsedTimer", "waitTimer", "pollTimer"]) {
    if (timersRef.current[k]) {
      clearInterval(timersRef.current[k]);
      timersRef.current[k] = null;
    }
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function clamp(v, a, b) {
  return Math.min(b, Math.max(a, v));
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function getClientPoint(e) {
  return { x: e.clientX, y: e.clientY };
}

function nearestByFreq(points, targetF) {
  let best = null;
  let bestD = Infinity;
  for (const d of points || []) {
    const f = Number(d?.f);
    const p = Number(d?.p);
    if (!Number.isFinite(f) || !Number.isFinite(p)) continue;
    const dist = Math.abs(f - targetF);
    if (dist < bestD) {
      bestD = dist;
      best = { f, p };
    }
  }
  return best;
}
