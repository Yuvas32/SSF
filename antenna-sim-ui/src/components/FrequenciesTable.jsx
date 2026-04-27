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
                  <th>Name</th>
                  <th>Start (MHz)</th>
                  <th>Stop (MHz)</th>
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
                    onRefresh={load}
                  />
                ))}

                {rows.length === 0 && !err && (
                  <tr>
                    <td colSpan={5} style={{ padding: 14, opacity: 0.7, textAlign: "center" }}>
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

function Row({ row, onDisplay, onRefresh }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(row.name || "");
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!window.confirm(`Delete scan "${row.name}"?`)) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/scans/${encodeURIComponent(row.name)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
      onRefresh?.();
    } catch (e) {
      alert(`Error deleting scan: ${e?.message || "Unknown error"}`);
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleSaveEdit() {
    if (!editName.trim()) {
      alert("Scan name cannot be empty");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/scans/${encodeURIComponent(row.name)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });
      if (!res.ok) throw new Error(`Update failed: ${res.status}`);
      setIsEditing(false);
      onRefresh?.();
    } catch (e) {
      alert(`Error updating scan: ${e?.message || "Unknown error"}`);
    }
  }

  if (isEditing) {
    return (
      <tr>
        <td>
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            style={{
              width: "100%",
              padding: "4px 6px",
              fontSize: 12,
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 4,
              backgroundColor: "rgba(0,0,0,0.2)",
              color: "inherit",
            }}
            autoFocus
          />
        </td>
        <td style={{ opacity: 0.6 }}>{row.start ? `${row.start} MHz` : "-"}</td>
        <td style={{ opacity: 0.6 }}>{row.end ? `${row.end} MHz` : "-"}</td>
        <td>{formatDt(row.createdAt)}</td>
        <td style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <button
            className="btnSmall"
            onClick={handleSaveEdit}
            style={{ fontSize: 11, padding: "4px 8px" }}
          >
            Save
          </button>
          <button
            className="btnSmall"
            onClick={() => setIsEditing(false)}
            style={{ fontSize: 11, padding: "4px 8px" }}
          >
            Cancel
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td>{row.name}</td>
      <td>{row.start ? `${row.start} MHz` : "-"}</td>
      <td>{row.end ? `${row.end} MHz` : "-"}</td>
      <td>{formatDt(row.createdAt)}</td>
      <td style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <button className="btnSmall" onClick={onDisplay} style={{ fontSize: 11, padding: "4px 8px" }}>
          Load
        </button>
        <button
          className="btnSmall"
          onClick={() => setIsEditing(true)}
          style={{ fontSize: 11, padding: "4px 8px" }}
          disabled={isDeleting}
        >
          Edit
        </button>
        <button
          className="btnSmall"
          onClick={handleDelete}
          style={{ fontSize: 11, padding: "4px 8px", color: "#ff6b6b" }}
          disabled={isDeleting}
        >
          {isDeleting ? "Deleting…" : "Delete"}
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
