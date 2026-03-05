import { clamp, nearestByFreq } from "../utils/spectrumHelpers";

export default function useHoverTooltip({ frameRef, svg, pointsToShow, zoom, pan, setHover }) {
  function onMouseMove(e) {
    if (!frameRef.current) return;
    if (
      svg?.minFNum == null ||
      svg?.maxFNum == null ||
      svg?.minPNum == null ||
      svg?.maxPNum == null
    )
      return;
    if (!pointsToShow?.length) return;

    const rect = frameRef.current.getBoundingClientRect();

    // mouse position in screen coords (relative to frame)
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const cx = rect.width / 2;
    const cy = rect.height / 2;

    // ✅ inverse transform: from screen -> "world" (unzoomed) coords
    const invScale = 1 / (zoom || 1);
    const worldX = cx + (px - cx - pan.x) * invScale;
    const worldY = cy + (py - cy - pan.y) * invScale;

    // map worldX to spectrum frequency
    const sx = (worldX / rect.width) * 760;
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

    // compute marker in "world" SVG coords (0..760, 0..240)
    const mxSvg = pad + ((best.f - svg.minFNum) / (svg.maxFNum - svg.minFNum || 1)) * innerW;
    const innerH = 240 - pad * 2;
    const mySvg =
      pad + (1 - (best.p - svg.minPNum) / (svg.maxPNum - svg.minPNum || 1)) * innerH;

    // convert SVG coords -> world pixels inside frame
    const markerWorldPx = (mxSvg / 760) * rect.width;
    const markerWorldPy = (mySvg / 240) * rect.height;

    // ✅ forward transform: world -> screen (so dot stays on the line when zoom != 1)
    const markerScreenPx = cx + (markerWorldPx - cx) * zoom + pan.x;
    const markerScreenPy = cy + (markerWorldPy - cy) * zoom + pan.y;

    setHover({
      f: best.f,
      p: best.p,
      px: markerScreenPx,
      py: markerScreenPy,
    });
  }

  function onMouseLeave() {
    setHover(null);
  }

  // panning + wheel zoom are still handled elsewhere (zoomPan / modal),
  // this hook only fixes hover mapping.
  return {
    onPointerDown: () => {},
    onPointerMove: () => {},
    onPointerUp: () => {},
    onWheel: () => {},
    onMouseMove,
    onMouseLeave,
  };
}