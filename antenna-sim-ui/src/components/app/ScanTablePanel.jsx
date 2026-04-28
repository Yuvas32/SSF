import { useEffect, useState } from "react";
import { API_BASE } from "../../config/api";
import TableView from "../TableView/TableView";

export default function ScanTablePanel({ scanId, tableText, onClear }) {
  const [carriersProgress, setCarriersProgress] = useState(0);
  const [apiOk, setApiOk] = useState(false);
  const [cerberusOk, setCerberusOk] = useState(true);

  useEffect(() => {
    let alive = true;

    async function loadStatus() {
      try {
        const [progressRes, apiRes, cerberusRes] = await Promise.all([
          fetch(`${API_BASE}/scans/progress`, { cache: "no-store" }),
          fetch(`${API_BASE}/health/satscan-api`, { cache: "no-store" }),
          fetch(`${API_BASE}/health/cerberus`, { cache: "no-store" }),
        ]);

        const progressJson = await progressRes.json();
        const apiJson = await apiRes.json();
        const cerberusJson = await cerberusRes.json();

        if (!alive) return;
        setCarriersProgress(Number.isFinite(Number(progressJson.percentage)) ? progressJson.percentage : 100);
        setApiOk(Boolean(apiJson.ok));
        setCerberusOk(Boolean(cerberusJson.ok));
      } catch {
        if (!alive) return;
        setApiOk(false);
        setCerberusOk(false);
      }
    }

    loadStatus();
    const interval = setInterval(loadStatus, 5000);
    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, []);

  async function handleOpenSatprobe() {
    if (carriersProgress !== 100) {
      window.alert("Can't Open SatProbe, Abort the runnung Scan first");
      return;
    }

    let shouldOpen = true;

    if (apiOk) {
      shouldOpen = window.confirm("Would you like to Task Kill the api_call_satscan ?");
      if (shouldOpen) {
        try {
          await fetch(`${API_BASE}/health/satscan-api/kill`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });
        } catch {
          // ignore kill errors and still attempt to open the probe page afterward
        }
      }
    }

    if (shouldOpen && !cerberusOk) {
      try {
        await fetch(`${API_BASE}/health/cerberus/start`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
      } catch {
        // ignore start errors and still attempt to open the probe page
      }
    }

    if (shouldOpen) {
      window.open("http://localhost:50000", "satprobe");
    }
  }

  return (
    <div className="panel">
      <div className="panelHeader">
        <div>
          <div className="panelTitle">Scan Table View</div>
          <div className="panelMeta">
            Shows Scan_{scanId ?? "-"} .tmptxt (auto-loaded when you click Display in Frequencies)
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* <button className="btnSmall" onClick={handleOpenApi}>
            Open API
          </button> */}
          <button className="btnSmall" onClick={handleOpenSatprobe}>
            Open Satprobe
          </button>
          <button className="btnSmall" onClick={onClear}>
            Clear
          </button>
        </div>
      </div>

      <div className="panelBody">
        <TableView
          title="Parsed Table"
          text={tableText}
          maxHeight={520}
          scanId={scanId}
        />
      </div>
    </div>
  );
}