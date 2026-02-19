import { useEffect, useState } from "react";

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
      const res = await fetch("http://localhost:8080/frequencies?limit=200");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e?.message || "Failed to load frequencies");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="panel">
      <div className="panelHeader">
        <div>
          <div className="panelTitle">Frequencies (DB)</div>
          <div className="panelMeta">
            {rows.length} rows {loading ? "• Loading…" : ""}
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
                  <th>Start</th>
                  <th>End</th>
                  <th>Created</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((r) => (
                  <Row
                    key={r.id}
                    row={r}
                    onDeleted={() => setRows((prev) => prev.filter((x) => x.id !== r.id))}
                    onDisplay={() => onDisplay?.(r)}
                  />
                ))}

                {rows.length === 0 && !err && (
                  <tr>
                    <td colSpan={6} style={{ padding: 14, opacity: 0.7, textAlign: "center" }}>
                      No rows yet. Click Scan to insert into DB.
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

function Row({ row, onDeleted, onDisplay }) {
  async function deleteRow(id) {
    const ok = window.confirm(`Delete row #${id}?`);
    if (!ok) return;

    try {
      const res = await fetch(`http://localhost:8080/frequencies/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `HTTP ${res.status}`);
      }

      onDeleted?.();
    } catch (e) {
      alert(e?.message || "Failed to delete row");
    }
  }

  return (
    <tr>
      <td>{row.id}</td>
      <td>{row.start}</td>
      <td>{row.end}</td>
      <td>{formatDt(row.createdAt)}</td>
      <td>{formatDt(row.updatedAt)}</td>
      <td style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button className="btnSmall" onClick={onDisplay}>
          Display
        </button>

        <button className="btnDangerSmall" onClick={() => deleteRow(row.id)}>
          Delete
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
