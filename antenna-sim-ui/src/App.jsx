import { useMemo, useState } from "react";
import "./App.css";

import { FrequenciesTable, ScanControls, SpectrumView } from "./components";
import { AppHeader, AppTabs, AutoSaveMessage, ScanTablePanel, XmlPanel } from "./components";

import { useCooldown, usePcHealth, useAppTheme, useActiveTab, useScanActions } from "./hooks";

import { COOLDOWN_MS } from "./utils/appConstants";

export default function App() {
  const { theme, toggleTheme } = useAppTheme();
  const { activeTab, setActiveTab } = useActiveTab();

  const pcHealth = usePcHealth(3000);
  const cooldown = useCooldown(COOLDOWN_MS);

  const app = useScanActions({
    pcHealth,
    cooldown,
    setActiveTab,
  });

  const [isScanPopupOpen, setIsScanPopupOpen] = useState(false);

  const detectedDevicesCount = Math.max(0, 2 - (pcHealth.missingDevices?.length || 0));
  const detectedDevicesText = `${detectedDevicesCount}/2`;

  const resultMessage = useMemo(() => {
    if (!pcHealth.devicesOk && pcHealth.missingDevices?.length) {
      return `missing ${pcHealth.missingDevices.join(", ")}`;
    }

    if (!pcHealth.apiOk) {
      return pcHealth.apiMessage || "API error";
    }

    return "ok";
  }, [pcHealth]);

  return (
    <div className={`app ${theme}`}>
      <AppHeader
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenScanPopup={() => setIsScanPopupOpen(true)}
        detectedDevicesText={detectedDevicesText}
        devicesOk={pcHealth.devicesOk}
        apiOk={pcHealth.apiOk}
        apiMessage={pcHealth.apiMessage || "unknown"}
        resultMessage={resultMessage}
      />

      <ScanControls
        isOpen={isScanPopupOpen}
        onClose={() => setIsScanPopupOpen(false)}
        onScan={app.handleScan}
        isScanning={app.isScanning}
        cooldownLeftMs={cooldown.cooldownLeftMs}
        systemOk={pcHealth.devicesOk}
        missingTokens={pcHealth.missingDevices}
        apiOk={pcHealth.apiOk}
        apiMessage={pcHealth.apiMessage}
      />

      <div className="container">
        <div className="stack">
          <AutoSaveMessage message={app.autoSaveMsg} />

          <AppTabs
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            scanId={app.scan?.dbId}
          />

          {activeTab === "spectrum" && (
            <SpectrumView
              startFreq={app.scan?.start ?? "-"}
              endFreq={app.scan?.stop ?? "-"}
              lastScan={app.scan?.ts ?? ""}
              scanId={app.scan?.dbId ?? null}
              mode={app.spectrumMode}
            />
          )}

          {activeTab === "frequencies" && (
            <FrequenciesTable onDisplay={app.handleDisplayRow} />
          )}

          {activeTab === "table" && (
            <ScanTablePanel
              scanId={app.scan?.dbId ?? null}
              tableText={app.tableText}
              onClear={() => app.setTableText("")}
            />
          )}

          {activeTab === "xml" && (
            <XmlPanel
              scan={app.scan}
              onExpose={app.setXmlApi}
              onAutoSaveMsg={app.setAutoSaveMsg}
            />
          )}
        </div>
      </div>
    </div>
  );
}