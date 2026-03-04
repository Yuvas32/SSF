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

  return (
    <div className={`app ${theme}`}>
      <AppHeader theme={theme} onToggleTheme={toggleTheme} />

      <div className="container">
        <div className="stack">
          <ScanControls
            onScan={app.handleScan}
            isScanning={app.isScanning}
            cooldownLeftMs={cooldown.cooldownLeftMs}
            systemOk={pcHealth.devicesOk}
            missingTokens={pcHealth.missingDevices}
            apiOk={pcHealth.apiOk}
            apiMessage={pcHealth.apiMessage}
          />

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