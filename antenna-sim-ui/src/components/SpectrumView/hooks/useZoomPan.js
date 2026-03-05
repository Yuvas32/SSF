import { useEffect, useRef, useState } from "react";
import { clamp, round2 } from "../utils/spectrumHelpers";

export default function useZoomPan({ frameRef }) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [hover, setHover] = useState(null);

  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  const clampZoom = (z) => Math.min(8, Math.max(1, z));
  const zoomIn = () => setZoom((z) => clampZoom(round2(z * 1.25)));
  const zoomOut = () => setZoom((z) => clampZoom(round2(z / 1.25)));

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setHover(null);
  };

  // keep pan bounded based on zoom
  useEffect(() => {
    const maxPan = 220 * (zoom - 1);
    setPan((p) => ({
      x: clamp(p.x, -maxPan * 2, maxPan * 2),
      y: clamp(p.y, -maxPan, maxPan),
    }));
  }, [zoom]);

  const isZoomed = zoom > 1.01;
  const transform = `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`;

  /**
   * ✅ Box-zoom into a screen-rectangle (rubber-band selection).
   * rect is in FRAME screen coords (pixels), relative to the frame top-left:
   * { x0, y0, x1, y1 }
   */
  function zoomToScreenRect(rect) {
    if (!frameRef.current) return;

    const r = frameRef.current.getBoundingClientRect();
    const W = r.width;
    const H = r.height;

    const x0 = Math.max(0, Math.min(W, rect.x0));
    const x1 = Math.max(0, Math.min(W, rect.x1));
    const y0 = Math.max(0, Math.min(H, rect.y0));
    const y1 = Math.max(0, Math.min(H, rect.y1));

    const left = Math.min(x0, x1);
    const right = Math.max(x0, x1);
    const top = Math.min(y0, y1);
    const bottom = Math.max(y0, y1);

    const selW = right - left;
    const selH = bottom - top;

    // tiny selection -> ignore
    if (selW < 8 || selH < 8) return;

    const cx = W / 2;
    const cy = H / 2;

    // ✅ inverse transform (screen -> world)
    // world = center + (screen - center - pan) / zoom
    const inv = 1 / (zoom || 1);
    const worldLeft = cx + (left - cx - pan.x) * inv;
    const worldRight = cx + (right - cx - pan.x) * inv;
    const worldTop = cy + (top - cy - pan.y) * inv;
    const worldBottom = cy + (bottom - cy - pan.y) * inv;

    const worldW = worldRight - worldLeft;
    const worldH = worldBottom - worldTop;

    // guard against division by zero / NaN
    if (!Number.isFinite(worldW) || !Number.isFinite(worldH) || worldW <= 0 || worldH <= 0) return;

    // ✅ compute target zoom to fit selection (NO extra "* zoom" here!)
    const margin = 0.92; // small padding
    const fitZoom = Math.min(W / worldW, H / worldH) * margin;
    const nextZoom = clampZoom(round2(fitZoom));

    // center of selection in world coords
    const rectCx = (worldLeft + worldRight) / 2;
    const rectCy = (worldTop + worldBottom) / 2;

    // ✅ choose pan so that rect center lands on screen center:
    // screen = center + zoom*(world - center) + pan
    // => pan = -zoom*(rectCenter - center)
    const nextPan = {
      x: (cx - rectCx) * nextZoom,
      y: (cy - rectCy) * nextZoom,
    };

    if (!Number.isFinite(nextZoom) || !Number.isFinite(nextPan.x) || !Number.isFinite(nextPan.y)) return;

    setZoom(nextZoom);
    setPan(nextPan);
    setHover(null);
  }

  return {
    zoom,
    setZoom,
    pan,
    setPan,
    hover,
    setHover,

    isZoomed,
    transform,

    isPanningRef,
    panStartRef,
    frameRef,

    zoomIn,
    zoomOut,
    resetView,
    clampZoom,

    zoomToScreenRect,
  };
}