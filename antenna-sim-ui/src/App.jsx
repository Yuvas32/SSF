// antenna-sim-ui/src/App.jsx
import { useEffect, useMemo, useState } from "react";
import "./App.css";

import ScanControls from "./components/ScanControls";
import SpectrumView from "./components/SpectrumView/SpectrumView";
import XmlTableViewer from "./components/XmlTableViewer/XmlTableViewer";
import FrequenciesTable from "./components/FrequenciesTable";
import TableView from "./components/TableView";

import useCooldown from "./hooks/useCooldown";
import usePcHealth from "./hooks/usePcHealth";
import { createFrequency, saveScanXmlAfterCreate } from "./services/backendApi";

const COOLDOWN_MS = 3000;
const LS_ACTIVE_TAB = "activeTab"; // remember tab after refresh

export default function App() {
  const [scan, setScan] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  const [tableText, setTableText] = useState("");
  const [spectrumMode, setSpectrumMode] = useState("scan");

  const [activeTab, setActiveTab] = useState(
    () => localStorage.getItem(LS_ACTIVE_TAB) || "spectrum"
  );
  useEffect(() => localStorage.setItem(LS_ACTIVE_TAB, activeTab), [activeTab]);

  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  useEffect(() => localStorage.setItem("theme", theme), [theme]);

  const pcHealth = usePcHealth(3000);
  const { cooldownLeftMs, isCooldownActive, startCooldown } = useCooldown(COOLDOWN_MS);

  const [xmlApi, setXmlApi] = useState({ saveAfterNextApply: null });
  const [autoSaveMsg, setAutoSaveMsg] = useState("");

  const canScan = useMemo(() => {
    return !isScanning && !isCooldownActive && pcHealth.ok;
  }, [isScanning, isCooldownActive, pcHealth.ok]);

  async function handleScan({ start, stop }) {
    if (!canScan) return;

    setAutoSaveMsg("");
    startCooldown();
    setIsScanning(true);

    await new Promise(requestAnimationFrame);

    try {
      // 1) create DB row
      const saved = await createFrequency({ start, end: stop });

      // 2) ✅ immediately save Scan_<id>.xml based on public/controller.xml template
      const xmlResult = await saveScanXmlAfterCreate({
        scanId: saved.id,
        start: saved.start,
        stop: saved.end,
      });

      const failed = xmlResult?.failed || [];
      if (failed.length) {
        setAutoSaveMsg(
          `⚠️ XML saved partially. Saved to: ${(xmlResult.savedTo || []).join(" , ")}. Failed: ` +
            failed.map((f) => `${f.dir}: ${f.error}`).join(" | ")
        );
      } else {
        setAutoSaveMsg(`✅ XML saved to: ${(xmlResult.savedTo || []).join(" , ")}`);
      }

      const nextScan = {
        dbId: saved.id,
        start: saved.start,
        stop: saved.end,
        ts: new Date(saved.createdAt).toLocaleString(),
      };

      setSpectrumMode("scan");
      setScan(nextScan);
      setActiveTab("spectrum");
    } catch (e) {
      console.error(e);
      setScan({
        dbId: null,
        start,
        stop,
        ts: new Date().toLocaleString(),
        error: e?.message || "Failed to save scan",
      });
      setActiveTab("spectrum");
      setAutoSaveMsg(`❌ ${e?.message || "Scan failed"}`);
    } finally {
      setIsScanning(false);
    }
  }

  async function handleDisplayRow(row) {
    setSpectrumMode("display");

    setScan({
      dbId: row.id,
      start: row.start,
      stop: row.end,
      ts: new Date(row.createdAt).toLocaleString(),
    });

    setActiveTab("spectrum");

    try {
      const res = await fetch(`http://localhost:8080/satscan/output/${row.id}/tmptxt`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
      }
      const j = await res.json();
      setTableText(String(j.text || ""));
    } catch (e) {
      setTableText(`ERROR loading tmptxt for Scan_${row.id}:\n${e?.message || e}`);
    }
  }

  function toggleTheme() {
    setTheme((t) => (t === "light" ? "dark" : "light"));
  }

  return (
    <div className={`app ${theme}`}>
      <header className="topbar">
        <div>
          <div className="topbarTitle">Satellite Signal Finder</div>
        </div>

        <button className="themeBtn" onClick={toggleTheme}>
          {theme === "light" ? "Dark mode" : "Light mode"}
        </button>
      </header>

      <div className="container">
        <div className="stack">
          <ScanControls
            onScan={handleScan}
            isScanning={isScanning}
            cooldownLeftMs={cooldownLeftMs}
            systemOk={pcHealth.ok}
            missingTokens={pcHealth.missingDevices}
            apiOk={pcHealth.apiOk}
            apiMessage={pcHealth.apiMessage}
          />

          {autoSaveMsg && (
            <div className="panel" style={{ padding: 10 }}>
              <div style={{ fontSize: 13 }}>{autoSaveMsg}</div>
            </div>
          )}

          <div className="panel" style={{ padding: 10 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <TabButton id="spectrum" activeTab={activeTab} setActiveTab={setActiveTab}>
                Spectrum
              </TabButton>
              <TabButton id="frequencies" activeTab={activeTab} setActiveTab={setActiveTab}>
                Scan Table
              </TabButton>
              <TabButton id="table" activeTab={activeTab} setActiveTab={setActiveTab}>
                Scan Result
              </TabButton>
              <TabButton id="xml" activeTab={activeTab} setActiveTab={setActiveTab}>
                Controller XML
              </TabButton>
            </div>

            <div style={{ marginTop: 8, fontSize: 12, opacity: 0.75 }}>
              Active: <b>{labelForTab(activeTab)}</b>
              {scan?.dbId ? (
                <>
                  {" "}
                  • Current Scan ID: <b>{scan.dbId}</b>
                </>
              ) : null}
            </div>
          </div>

          {activeTab === "spectrum" && (
            <SpectrumView
              startFreq={scan?.start ?? "-"}
              endFreq={scan?.stop ?? "-"}
              lastScan={scan?.ts ?? ""}
              scanId={scan?.dbId ?? null}
              mode={spectrumMode}
            />
          )}

          {activeTab === "frequencies" && <FrequenciesTable onDisplay={handleDisplayRow} />}

          {activeTab === "table" && (
            <div className="panel">
              <div className="panelHeader">
                <div>
                  <div className="panelTitle">Scan Table View</div>
                  <div className="panelMeta">
                    Shows Scan_{scan?.dbId ?? "-"} .tmptxt (auto-loaded when you click Display in Frequencies)
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button className="btnSmall" onClick={() => setTableText("")}>
                    Clear
                  </button>
                </div>
              </div>

              <div className="panelBody">
                <TableView title="Parsed Table" text={tableText} maxHeight={520} />
              </div>
            </div>
          )}

          {activeTab === "xml" && (
            <div className="panel">
              <div className="panelHeader">
                <div>
                  <div className="panelTitle">Controller XML</div>
                  <div className="panelMeta">
                    Reads <b>/controller.xml</b> • Updates start/stop + sets Scan_Name/tandem from DB id
                  </div>
                </div>
              </div>

              <div className="panelBody">
                <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 10 }}>
                  Optional: Use this tab to manually edit controller.xml and click <b>Apply</b>.
                </div>

                <XmlTableViewer
                  scanParams={scan ? { start: scan.start, stop: scan.stop, tandemId: scan.dbId } : null}
                  onExpose={setXmlApi}
                  onAutoSaveResult={(result) => {
                    if (!result) return;
                    const failed = result.failed || [];
                    if (failed.length) {
                      setAutoSaveMsg(
                        `⚠️ XML saved partially. Saved to: ${result.savedTo.join(" , ")}. Failed: ` +
                          failed.map((f) => `${f.dir}: ${f.error}`).join(" | ")
                      );
                    } else {
                      setAutoSaveMsg(`✅ XML saved to: ${result.savedTo.join(" , ")}`);
                    }
                  }}
                  showManualSave={false}
                />

                {scan?.error && (
                  <div className="errorBox" style={{ marginTop: 12 }}>
                    {scan.error}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TabButton({ id, activeTab, setActiveTab, children }) {
  const active = id === activeTab;
  return (
    <button
      className={active ? "btnTabActive" : "btnTab"}
      onClick={() => setActiveTab(id)}
      type="button"
    >
      {children}
    </button>
  );
}

function labelForTab(tab) {
  switch (tab) {
    case "spectrum":
      return "Spectrum";
    case "frequencies":
      return "Frequencies";
    case "table":
      return "Scan Table";
    case "xml":
      return "Controller XML";
    default:
      return tab;
  }
}