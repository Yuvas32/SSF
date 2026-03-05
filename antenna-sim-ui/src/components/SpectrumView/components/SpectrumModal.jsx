import { useState } from "react";
import { fmtTime } from "../spectrumMath";
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
} from "../spectrumStyles";

export default function SpectrumModal({
  isOpen,
  onClose,
  isDark,

  hasScan,
  isLive,
  startFreq,
  endFreq,
  lastScan,

  unitToShow,
  svg,
  pointsToShow,

  demoUrl,
  live,

  statusText,
  elapsedSec,
  waitingSecLeft,
  error,

  frameRef,
  zoomPan,
  hoverApi,
}) {
  const [boxZoom, setBoxZoom] = useState(null); 
  // boxZoom: { active, x0, y0, x1, y1 } in screen coords relative to frame

  if (!isOpen) return null;

  const { zoom, pan, isZoomed, transform, zoomIn, zoomOut, resetView, zoomToScreenRect } = zoomPan;
  const { onPointerDown, onPointerMove, onPointerUp, onWheel, onMouseMove, onMouseLeave } = hoverApi;

  function getLocalPoint(e) {
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function handlePointerDown(e) {
    // ✅ Shift + drag = box zoom selection
    if (e.button === 0 && e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();

      const pt = getLocalPoint(e);
      setBoxZoom({ active: true, x0: pt.x, y0: pt.y, x1: pt.x, y1: pt.y });

      try {
        e.currentTarget.setPointerCapture?.(e.pointerId);
      } catch {}
      return;
    }

    // otherwise keep existing behavior (pan handler lives in other code / existing wiring)
    onPointerDown?.(e);
  }

  function handlePointerMove(e) {
    if (boxZoom?.active) {
      e.preventDefault();
      e.stopPropagation();

      const pt = getLocalPoint(e);
      setBoxZoom((b) => (b ? { ...b, x1: pt.x, y1: pt.y } : b));
      return;
    }

    onPointerMove?.(e);
  }

  function handlePointerUp(e) {
    if (boxZoom?.active) {
      e.preventDefault();
      e.stopPropagation();

      const b = boxZoom;
      setBoxZoom(null);

      // zoom into selected rect
      zoomToScreenRect({ x0: b.x0, y0: b.y0, x1: b.x1, y1: b.y1 });

      try {
        e.currentTarget.releasePointerCapture?.(e.pointerId);
      } catch {}
      return;
    }

    onPointerUp?.(e);
  }

  const selectionStyle =
    boxZoom?.active
      ? {
          position: "absolute",
          left: Math.min(boxZoom.x0, boxZoom.x1),
          top: Math.min(boxZoom.y0, boxZoom.y1),
          width: Math.abs(boxZoom.x1 - boxZoom.x0),
          height: Math.abs(boxZoom.y1 - boxZoom.y0),
          border: "1px solid rgba(59,130,246,0.95)",
          background: "rgba(59,130,246,0.18)",
          borderRadius: 6,
          pointerEvents: "none",
          zIndex: 5,
        }
      : null;

  return (
    <div
      style={modalOverlayStyle}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div style={isDark ? modalBoxStyleDark : modalBoxStyleLight}>
        <div style={isDark ? modalHeaderStyleDark : modalHeaderStyleLight}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontWeight: 900 }}>Spectrum</div>
            <span style={badgeStyle}>{hasScan ? (isLive ? "LIVE" : "SEARCHING") : "DEMO"}</span>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ fontSize: 12, opacity: 0.8 }}>
              {lastScan ? `${startFreq} → ${endFreq}` : ""}
            </div>
            <button className="btnSmall" onClick={onClose} type="button">
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

          <div style={zoomBarStyle}>
            <button className="btnSmall" style={zoomBtnStyle} onClick={zoomOut} disabled={zoom <= 1} type="button">
              −
            </button>
            <div style={zoomLabelStyle}>{Number.isFinite(zoom) ? Math.round(zoom * 100) : 100}%</div>
            <button className="btnSmall" style={zoomBtnStyle} onClick={zoomIn} disabled={zoom >= 8} type="button">
              +
            </button>
            <button
              className="btnSmall"
              style={{ ...zoomBtnStyle, marginLeft: 8 }}
              onClick={resetView}
              disabled={zoom === 1 && pan.x === 0 && pan.y === 0}
              type="button"
            >
              Reset
            </button>

            <div style={{ fontSize: 12, opacity: 0.7, marginLeft: 10 }}>
              {boxZoom?.active
                ? "Release to zoom into selection"
                : isZoomed
                  ? "Drag to pan • Wheel to zoom • Shift+Drag to box-zoom • Double-click reset • Hover for values"
                  : "Wheel to zoom • Shift+Drag to box-zoom • Hover for values"}
            </div>
          </div>

          <div
            ref={frameRef}
            style={{
              ...chartFrameStyle,
              position: "relative", // ✅ ensures selection box overlays correctly
              cursor: boxZoom?.active ? "crosshair" : isZoomed ? (zoomPan.isPanningRef.current ? "grabbing" : "grab") : "default",
              touchAction: "none",
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onWheel={onWheel}
            onDoubleClick={resetView}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
          >
            {/* ✅ blue selection rectangle */}
            {selectionStyle ? <div style={selectionStyle} /> : null}

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

            {zoomPan.hover ? (
              <>
                <div style={{ ...markerDotStyle, left: zoomPan.hover.px, top: zoomPan.hover.py }} />
                <div
                  style={{
                    ...tooltipStyle,
                    left: Math.min(zoomPan.hover.px + 12, (frameRef.current?.clientWidth || 760) - 10),
                    top: Math.max(zoomPan.hover.py - 34, 8),
                  }}
                >
                  F: {zoomPan.hover.f.toFixed(3)} {unitToShow} • P: {zoomPan.hover.p.toFixed(1)} dB
                </div>
              </>
            ) : null}

            {hasScan && !live?.points?.length ? (
              <div style={placeholderStyle}>Searching for .spectrum file…</div>
            ) : null}
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
  );
}