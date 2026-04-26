import { useEffect, useMemo, useState } from "react";

export default function ScanControls({
  isOpen = false,
  onClose,
  onScan,
  isScanning,
  cooldownLeftMs = 0,

  systemOk = false,
  missingTokens = [],

  apiOk = false,
  apiMessage = "satscan api call not running",
}) {
  const [startFreq, setStartFreq] = useState("");
  const [stopFreq, setStopFreq] = useState("");
  const [scanName, setScanName] = useState("");

  const isCooldownActive = cooldownLeftMs > 0;

  const validationError = useMemo(() => {
    if (!startFreq && !stopFreq && !scanName) return "";
    if (!scanName) return "Scan name is required.";
    if (!startFreq) return "Start frequency is required.";
    if (!stopFreq) return "Stop frequency is required.";

    const s = Number(startFreq);
    const e = Number(stopFreq);

    if (!Number.isFinite(s) || !Number.isFinite(e)) return "Frequencies must be valid numbers.";
    if (s <= 0 || e <= 0) return "Frequencies must be > 0.";
    if (s >= e) return "Start frequency must be smaller than stop frequency.";

    return "";
  }, [startFreq, stopFreq, scanName]);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e) {
      if (e.key === "Escape") {
        onClose?.();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  async function handleScanClick() {
    if (!systemOk) return;
    if (!apiOk) return;
    if (validationError) return;
    if (isScanning) return;
    if (isCooldownActive) return;

    await onScan?.({ start: Number(startFreq), stop: Number(stopFreq), scanName });
    onClose?.();
  }

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) {
      onClose?.();
    }
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

  if (!isOpen) return null;

  return (
    <div className="scanModalOverlay" onClick={handleOverlayClick}>
      <div className="scanModalCard" role="dialog" aria-modal="true" aria-label="Scan settings">
        <div className="scanModalHeader">
          <div className="scanModalTitle">Scan settings</div>

          <button className="scanModalCloseBtn" onClick={onClose} type="button" title="Close">
            ×
          </button>
        </div>

        <div className="scanModalBody">
          <div className="toolbarGroup scanModalToolbarGroup">
            <label className="field">
              <span className="fieldLabel">Scan name</span>
              <input
                className="input"
                type="text"
                placeholder="e.g. MyScan"
                value={scanName}
                onChange={(e) => setScanName(e.target.value)}
                disabled={isScanning}
              />
            </label>

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
              type="button"
            >
              {buttonText}
            </button>
          </div>

          {!systemOk && missingTokens.length > 0 && (
            <div className="toolbarError">
              Health check failed: missing <b>{missingTokens.join(", ")}</b>
            </div>
          )}

          {!apiOk && (
            <div className="toolbarError">
              {apiMessage || "satscan api call not running"}
            </div>
          )}

          {validationError && <div className="toolbarError">{validationError}</div>}
        </div>
      </div>
    </div>
  );
}