import { useEffect, useState } from "react";
import { API_BASE } from "../config/api";

export default function FrequenciesTable({ onDisplay }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [collapsed, setCollapsed] = useState(() => {
    const v = localStorage.getItem("freqTableCollapsed");
    return v === null ? true : v === "true"; // ✅ default minimized
  });

  function toggleCollapsed() {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem("freqTableCollapsed", String(next));
      return next;
    });
  }

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch(`${API_BASE}/scans/list`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e?.message || "Failed to load scans");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="panel">
      <div className="panelHeader">
        <div>
          <div className="panelTitle">Scan Table</div>
          <div className="panelMeta">
            {rows.length} scans {loading ? "• Loading…" : ""}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className="btnSmall" onClick={load}>
            Refresh
          </button>

          <button className="btnSmall" onClick={toggleCollapsed}>
            {collapsed ? "Expand" : "Minimize"}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="panelBody" style={{ padding: 0 }}>
          {err && <div className="errorBox">{err}</div>}

          <div className="tableWrap">
            <table className="dbTable">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((r) => (
                  <Row
                    key={r.id}
                    row={r}
                    onDisplay={() => onDisplay?.(r)}
                  />
                ))}

                {rows.length === 0 && !err && (
                  <tr>
                    <td colSpan={4} style={{ padding: 14, opacity: 0.7, textAlign: "center" }}>
                      No scans yet. Click Scan to start a new scan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ row, onDisplay }) {
  return (
    <tr>
      <td>{row.id}</td>
      <td>{row.name}</td>
      <td>{formatDt(row.createdAt)}</td>
      <td style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button className="btnSmall" onClick={onDisplay}>
          Load
        </button>
      </td>
    </tr>
  );
}

function formatDt(s) {
  if (!s) return "-";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return String(s);
  return d.toLocaleString();
}
