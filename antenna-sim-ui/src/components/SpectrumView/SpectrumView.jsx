import { forwardRef, useMemo, useRef, useImperativeHandle } from "react";
import { buildPolyline } from "./spectrumMath";

import SpectrumModal from "./components/SpectrumModal";

import useSpectrumDemo from "./hooks/useSpectrumDemo";
import useSpectrumWatcher from "./hooks/useSpectrumWatcher";
import useZoomPan from "./hooks/useZoomPan";
import useHoverTooltip from "./hooks/useHoverTooltip";
import useModalEscClose from "./hooks/useModalEscClose";

import { normalizeSpectrumPoints } from "./utils/spectrumHelpers";

const SpectrumView = forwardRef(({ startFreq, endFreq, lastScan, scanId, mode = "scan", onClose }, ref) => {
  const isDark = document?.querySelector?.(".app")?.classList?.contains("dark");

  const sid = scanId;
  const hasScan = sid && typeof sid === 'string' && sid.trim() !== '';

  // UI modal state
  const { isOpen, open, close } = useModalEscClose();

  // Wrap close to call parent's onClose handler
  const handleModalClose = () => {
    close();
    onClose?.();
  };

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
      <SpectrumModal
        isOpen={isOpen}
        onClose={handleModalClose}
        isDark={Boolean(isDark)}
        hasScan={hasScan}
        isLive={Boolean(watcher.live)}
        startFreq={startFreq}
        endFreq={endFreq}
        lastScan={lastScan}
        scanId={sid}
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