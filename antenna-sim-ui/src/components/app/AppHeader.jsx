import React, { useState } from "react";
import { useScanStatus } from "../../hooks/scanStatusContext.jsx";
import { API_BASE } from "../../config/api";

function DeviceIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="statusIconSvg">
      <rect x="3" y="6" width="18" height="12" rx="2"></rect>
      <path d="M8 18v2M16 18v2M9 10h6M9 14h6"></path>
    </svg>
  );
}

function SatelliteIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="statusIconSvg">
      <path d="M7 7l4-4 6 6-4 4z"></path>
      <path d="M14 10l4 4"></path>
      <path d="M6 14l4 4"></path>
      <path d="M5 19l3-3"></path>
      <path d="M16 8l3-3"></path>
    </svg>
  );
}

function ScanIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="statusIconSvg">
      <path d="M4 12a8 8 0 0 1 8-8"></path>
      <path d="M20 12a8 8 0 0 1-8 8"></path>
      <path d="M12 4h4v4"></path>
      <path d="M12 20H8v-4"></path>
    </svg>
  );
}

function LoadingIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="statusIconSvg" style={{ animation: "spin 1s linear infinite" }}>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="statusIconSvg">
      <path d="M20 6L9 17l-5-5"></path>
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="statusIconSvg">
      <circle cx="12" cy="12" r="10"></circle>
      <path d="M15 9l-6 6M9 9l6 6"></path>
    </svg>
  );
}

function BatteryIcon({ percentage = 50 }) {
  // iPhone-style progress colors: green (0-33%), yellow (34-66%), red (67-100%)
  const getProgressColor = (pct) => {
    if (pct <= 33) return "#FF3B30"; // Red
    if (pct <= 66) return "#FFCC02"; // Yellow
    return "#34C759"; // Green
  };

  const progressColor = getProgressColor(percentage);
  const fillWidth = Math.max(2, 14 * (percentage / 100)); // Minimum 2px for visibility

  return (
    <div style={{ position: "relative", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {/* Battery outline */}
      <svg viewBox="0 0 24 24" style={{ position: "absolute", width: "100%", height: "100%" }}>
        <rect x="3" y="6" width="16" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <rect x="19" y="8" width="2" height="8" rx="0.5" fill="currentColor" />
      </svg>
      
      {/* Battery fill with progress color */}
      <svg viewBox="0 0 24 24" style={{ position: "absolute", width: "100%", height: "100%" }}>
        <rect x="4" y="7" width={fillWidth} height="10" fill={progressColor} rx="1" />
      </svg>
      
      {/* Percentage text in center */}
      <div style={{
        position: "absolute",
        fontSize: "9px",
        fontWeight: "bold",
        color: "white",
        textShadow: "0 0 2px rgba(0,0,0,0.8)",
        zIndex: 1
      }}>
        {percentage}%
      </div>
    </div>
  );
}

export default function AppHeader({
  theme,
  onToggleTheme,
  onOpenScanPopup,
  detectedDevicesText = "0/2",
  devicesOk = false,
  apiOk = false,
  apiMessage = "",
  resultMessage = "",
  currentScanId = null,
}) {
  const { scanStatus } = useScanStatus();
  const [progress, setProgress] = useState(0);
  const [spectrumExists, setSpectrumExists] = useState(false);

  // Check spectrum existence when scan changes
  React.useEffect(() => {
    if (!currentScanId) {
      setSpectrumExists(false);
      return;
    }

    const checkSpectrum = async () => {
      try {
        const res = await fetch(`${API_BASE}/satscan/output/${currentScanId}/spectrum-exists`);
        const data = await res.json();
        setSpectrumExists(data.exists || false);
      } catch (e) {
        console.error("Spectrum existence check error:", e);
        setSpectrumExists(false);
      }
    };

    checkSpectrum();
  }, [currentScanId]);

  // Fetch progress when scan is loading
  React.useEffect(() => {
    if (scanStatus !== "loading") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/scans/progress`);
        const data = await res.json();
        setProgress(data.percentage || 0);
      } catch (e) {
        console.error("Progress fetch error:", e);
      }
    }, 5000); // 5 seconds as requested

    return () => clearInterval(interval);
  }, [scanStatus]);

  // Determine display progress: 100% if spectrum exists, actual progress if loading
  const displayProgress = spectrumExists ? 100 : (scanStatus === "loading" ? progress : 0);

  return (
    <header className="topbar">
      <div className="topbarLeft">
        <div className="topbarTitle">Satellite Signal Finder</div>

        <div className="topbarStatusRow">
          <div
            className={`topbarStatusItem ${devicesOk ? "isOk" : "isError"}`}
            title="Detected devices"
          >
            <span className="statusIconWrap" aria-label="Detected devices">
              <DeviceIcon />
            </span>
            <span className="statusCompactText">{detectedDevicesText}</span>
          </div>

          <div
            className={`topbarStatusItem ${apiOk ? "isOk" : "isError"}`}
            title="API_Call_Satscan"
          >
            <span className="statusIconWrap" aria-label="API_Call_Satscan">
              <SatelliteIcon />
            </span>
            <span className="statusCompactText">{apiMessage}</span>
          </div>

          <div
            className={`topbarStatusItem ${devicesOk && apiOk ? "isOk" : "isError"}`}
            title="Result message"
          >
            <span className="statusCompactText">{resultMessage}</span>
          </div>
        </div>
      </div>

      <div className="topbarActions">
        {currentScanId && (
          <div
            className={`topbarStatusItem ${spectrumExists ? "isOk" : scanStatus === "error" ? "isError" : "isWarning"}`}
            style={{ display: "flex", alignItems: "center", gap: 8, marginRight: 8 }}
            title={`Spectrum Existence: ${spectrumExists ? "Found" : scanStatus === "loading" ? "Loading" : "Not Found"}`}
          >
            <span className="statusIconWrap" aria-label={`Spectrum ${spectrumExists ? "found" : "not found"}`}>
              {spectrumExists && <CheckIcon />}
              {scanStatus === "loading" && !spectrumExists && <LoadingIcon />}
              {scanStatus === "error" && !spectrumExists && <ErrorIcon />}
              {scanStatus === "idle" && !spectrumExists && <ScanIcon />}
            </span>
            <span className="statusCompactText">Spectrum Existence</span>
            
            {(scanStatus === "loading" || spectrumExists) && (
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: 4 }}>
                <div style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <BatteryIcon percentage={displayProgress} />
                </div>
              </div>
            )}
          </div>
        )}

        <button
          className="openScanBtn"
          onClick={onOpenScanPopup}
          title="Open scan settings"
          type="button"
        >
          <span className="statusIconWrap" aria-hidden="true">
            <ScanIcon />
          </span>
          <span>Scan</span>
        </button>

        <button className="themeBtn" onClick={onToggleTheme} type="button">
          {theme === "light" ? "Dark mode" : "Light mode"}
        </button>
      </div>
    </header>
  );
}