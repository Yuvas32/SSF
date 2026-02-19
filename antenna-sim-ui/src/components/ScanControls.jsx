import { useMemo, useState } from "react";

export default function ScanControls({
  onScan,
  isScanning,
  cooldownLeftMs = 0,

  // Device Manager health
  systemOk = false,
  missingTokens = [],

  // NEW: API_Call_Satscan.exe health
  apiOk = false,
  apiMessage = "satscan api call not running",
}) {
  const [startFreq, setStartFreq] = useState("");
  const [stopFreq, setStopFreq] = useState("");

  const isCooldownActive = cooldownLeftMs > 0;

  const validationError = useMemo(() => {
    if (!startFreq && !stopFreq) return "";
    if (!startFreq) return "Start frequency is required.";
    if (!stopFreq) return "Stop frequency is required.";

    const s = Number(startFreq);
    const e = Number(stopFreq);

    if (!Number.isFinite(s) || !Number.isFinite(e)) return "Frequencies must be valid numbers.";
    if (s <= 0 || e <= 0) return "Frequencies must be > 0.";
    if (s >= e) return "Start frequency must be smaller than stop frequency.";

    return "";
  }, [startFreq, stopFreq]);

  function handleScanClick() {
    if (!systemOk) return;
    if (!apiOk) return;
    if (validationError) return;
    if (isScanning) return;
    if (isCooldownActive) return;

    onScan?.({ start: Number(startFreq), stop: Number(stopFreq) });
  }

  const disabled =
    !systemOk || !apiOk || Boolean(validationError) || Boolean(isScanning) || isCooldownActive;

  const buttonText = isScanning
    ? "Saving..."
    : isCooldownActive
      ? `Wait ${(cooldownLeftMs / 1000).toFixed(1)}s`
      : "Scan";

  const title = !systemOk
    ? `Missing: ${missingTokens.join(", ")}`
    : !apiOk
      ? apiMessage
      : validationError || (isScanning ? "Saving scan..." : isCooldownActive ? "Cooldown" : "Run scan");

  const detectedCount = Math.max(0, 2 - (missingTokens?.length || 0));

  return (
    <div className="toolbar">
      <div className="toolbarGroup">
        <label className="field">
          <span className="fieldLabel">Start frequency</span>
          <input
            className="input"
            type="number"
            placeholder="e.g. 10700"
            value={startFreq}
            onChange={(e) => setStartFreq(e.target.value)}
            disabled={isScanning}
          />
        </label>

        <label className="field">
          <span className="fieldLabel">Stop frequency</span>
          <input
            className="input"
            type="number"
            placeholder="e.g. 12750"
            value={stopFreq}
            onChange={(e) => setStopFreq(e.target.value)}
            disabled={isScanning}
          />
        </label>

        <button
          className={`btn ${disabled ? "btnDisabled" : ""}`}
          onClick={handleScanClick}
          disabled={disabled}
          title={title}
        >
          {buttonText}
        </button>
      </div>

      {/* Devices status */}
      <div className="toolbarError" style={{ background: "transparent", color: "inherit" }}>
        <b>Detected devices:</b> {detectedCount}/2{" "}
        {systemOk ? (
          <b style={{ color: "green" }}>OK</b>
        ) : (
          <b style={{ color: "crimson" }}>ERROR</b>
        )}
      </div>

      {/* NEW: Satscan API call process status */}
      <div className="toolbarError" style={{ background: "transparent", color: "inherit" }}>
        <b>API_Call_Satscan:</b>{" "}
        {apiOk ? (
          <b style={{ color: "green" }}>api call satscan ok</b>
        ) : (
          <b style={{ color: "crimson" }}>satscan api call not running</b>
        )}
      </div>

      {/* Existing errors */}
      {!systemOk && missingTokens.length > 0 && (
        <div className="toolbarError">
          Health check failed: missing <b>{missingTokens.join(", ")}</b>
        </div>
      )}

      {!apiOk && (
        <div className="toolbarError">
          satscan api call not running
        </div>
      )}

      {validationError && <div className="toolbarError">{validationError}</div>}
    </div>
  );
}
