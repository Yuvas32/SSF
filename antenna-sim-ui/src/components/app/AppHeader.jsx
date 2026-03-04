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

export default function AppHeader({
  theme,
  onToggleTheme,
  onOpenScanPopup,
  detectedDevicesText = "0/2",
  devicesOk = false,
  apiOk = false,
  apiMessage = "",
  resultMessage = "",
}) {
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