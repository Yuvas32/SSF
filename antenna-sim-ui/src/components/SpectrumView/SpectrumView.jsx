import { forwardRef, useMemo, useRef, useImperativeHandle } from "react";
import { buildPolyline } from "./spectrumMath";

import SpectrumPanel from "./components/SpectrumPanel";
import SpectrumModal from "./components/SpectrumModal";

import useSpectrumDemo from "./hooks/useSpectrumDemo";
import useSpectrumWatcher from "./hooks/useSpectrumWatcher";
import useZoomPan from "./hooks/useZoomPan";
import useHoverTooltip from "./hooks/useHoverTooltip";
import useModalEscClose from "./hooks/useModalEscClose";

import { normalizeSpectrumPoints } from "./utils/spectrumHelpers";

const SpectrumView = forwardRef(({ startFreq, endFreq, lastScan, scanId, mode = "scan" }, ref) => {
  const isDark = document?.querySelector?.(".app")?.classList?.contains("dark");

  const sid = scanId;
  const hasScan = sid && typeof sid === 'string' && sid.trim() !== '';

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

  // Expose modal open function to parent via ref
  useImperativeHandle(ref, () => ({
    openModal: open,
  }), [open]);

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
});

SpectrumView.displayName = 'SpectrumView';

export default SpectrumView;