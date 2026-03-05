import { useMemo, useRef } from "react";
import { buildPolyline } from "./spectrumMath";

import SpectrumPanel from "./components/SpectrumPanel";
import SpectrumModal from "./components/SpectrumModal";

import useSpectrumDemo from "./hooks/useSpectrumDemo";
import useSpectrumWatcher from "./hooks/useSpectrumWatcher";
import useZoomPan from "./hooks/useZoomPan";
import useHoverTooltip from "./hooks/useHoverTooltip";
import useModalEscClose from "./hooks/useModalEscClose";

import { normalizeSpectrumPoints } from "./utils/spectrumHelpers";

export default function SpectrumView({ startFreq, endFreq, lastScan, scanId, mode = "scan" }) {
  const isDark = document?.querySelector?.(".app")?.classList?.contains("dark");

  const sid = Number(scanId);
  const hasScan = Number.isFinite(sid) && sid > 0;

  // UI modal state
  const { isOpen, open, close } = useModalEscClose();

  // Demo data (only when no scan yet)
  const demo = useSpectrumDemo({ enabled: !hasScan });

  // Live watcher (when scanId changes)
  const watcher = useSpectrumWatcher({ sid, hasScan, mode });

  // Points to show
  const pointsToShow = hasScan ? (watcher.live?.points || []) : (demo.points || []);
  const unitToShow = hasScan ? (watcher.live?.unit || "MHz") : (demo.unit || "MHz");

  // Build polyline + axes info
  const svg = useMemo(() => buildPolyline(pointsToShow, 760, 240), [pointsToShow]);

  // Zoom/pan (only used in modal)
  const frameRef = useRef(null);
  const zoomPan = useZoomPan({ frameRef });

  // Hover tooltip mapping
  const hoverApi = useHoverTooltip({
    frameRef,
    svg,
    pointsToShow,
    zoom: zoomPan.zoom,
    pan: zoomPan.pan,
    setHover: zoomPan.setHover,
  });

  return (
    <>
      <SpectrumPanel
        startFreq={startFreq}
        endFreq={endFreq}
        lastScan={lastScan}
        hasScan={hasScan}
        isLive={Boolean(watcher.live)}
        onOpen={open}
      />

      <SpectrumModal
        isOpen={isOpen}
        onClose={close}
        isDark={Boolean(isDark)}
        hasScan={hasScan}
        isLive={Boolean(watcher.live)}
        startFreq={startFreq}
        endFreq={endFreq}
        lastScan={lastScan}
        unitToShow={unitToShow}
        svg={svg}
        pointsToShow={pointsToShow}
        demoUrl={demo.demoUrl}
        live={watcher.live}
        statusText={watcher.statusText}
        elapsedSec={watcher.elapsedSec}
        waitingSecLeft={watcher.waitingSecLeft}
        error={watcher.error}
        frameRef={frameRef}
        zoomPan={zoomPan}
        hoverApi={hoverApi}
      />
    </>
  );
}