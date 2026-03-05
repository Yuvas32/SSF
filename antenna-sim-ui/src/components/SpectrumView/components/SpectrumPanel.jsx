import { badgeStyle } from "../spectrumStyles";

export default function SpectrumPanel({ startFreq, endFreq, lastScan, hasScan, isLive, onOpen }) {
  return (
    <div className="panel">
      <div className="panelHeader">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="panelTitle">Spectrum View</div>
          <span style={badgeStyle}>{hasScan ? (isLive ? "LIVE" : "SEARCHING") : "DEMO"}</span>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div className="panelMeta">
            {lastScan ? `Scan: ${startFreq} → ${endFreq} • ${lastScan}` : "No scan yet"}
          </div>
          <button className="btnSmall" onClick={onOpen} type="button">
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
  );
}