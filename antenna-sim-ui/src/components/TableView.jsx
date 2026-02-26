import { useEffect, useMemo, useState } from "react";
import ExportSatProbeButton from "./ExportSatProbeButton";

/**
 * TableView (Scan Table View)
 * - Parses TSV / spaced-columns text and renders a table
 * - Default: only "main columns" are active; the rest inactive
 * - Lets user choose + reorder visible columns
 * - Remembers selection/order in localStorage
 */

const LS_COLS_KEY = "scanTableView.columns.v2";

const DEFAULT_ACTIVE = [
  "frequency (mhz)",
  "symbolrate (ks/s)",
  "bw (khz)",
  "code rate",
  "system",
  "vendor & system",
  "snr (db)",
  "modulation",
  "signal level",
  "crc ok",
  "nr uws",
  "FECtype",
  "Inverted",
  "Blocksize",
];

export default function TableView({ title = "Table", text = "", maxHeight = 520, scanId = null }) {
  const parsed = useMemo(() => parseTextToTable(text), [text]);
  const allHeaders = parsed.headers;
  const rows = parsed.rows;

  const defaultSelected = useMemo(() => {
    if (!allHeaders.length) return [];
    return pickHeadersByPreference(allHeaders, DEFAULT_ACTIVE);
  }, [allHeaders]);

  const [selected, setSelected] = useState([]);
  const [colSearch, setColSearch] = useState("");
  const [showColumnsView, setShowColumnsView] = useState(false);

  useEffect(() => {
    if (!allHeaders.length) {
      setSelected([]);
      return;
    }

    const saved = safeJsonParse(localStorage.getItem(LS_COLS_KEY));
    if (Array.isArray(saved) && saved.length) {
      const existing = new Set(allHeaders);

      const revived = [];
      for (const s of saved) {
        if (existing.has(s)) {
          revived.push(s);
          continue;
        }
        const targetNorm = norm(s);
        const idx = allHeaders.findIndex((h) => norm(h) === targetNorm);
        if (idx >= 0) revived.push(allHeaders[idx]);
      }

      setSelected(revived.length ? unique(revived) : unique(defaultSelected));
    } else {
      setSelected(unique(defaultSelected));
    }
  }, [allHeaders, defaultSelected]);

  useEffect(() => {
    if (!allHeaders.length) return;
    localStorage.setItem(LS_COLS_KEY, JSON.stringify(selected));
  }, [selected, allHeaders.length]);

  const visibleHeaders = useMemo(() => {
    const set = new Set(allHeaders);
    return selected.filter((h) => set.has(h));
  }, [selected, allHeaders]);

  const colIndexByHeader = useMemo(() => {
    const m = new Map();
    allHeaders.forEach((h, i) => m.set(h, i));
    return m;
  }, [allHeaders]);

  const filteredAvailable = useMemo(() => {
    const q = colSearch.trim().toLowerCase();
    if (!q) return allHeaders;
    return allHeaders.filter((h) => String(h).toLowerCase().includes(q));
  }, [allHeaders, colSearch]);

  const hasData = Boolean(allHeaders.length) && Boolean(rows.length);

  function toggleHeader(h) {
    setSelected((prev) => {
      const has = prev.includes(h);
      if (has) return prev.filter((x) => x !== h);
      return [...prev, h];
    });
  }

  function move(h, dir) {
    setSelected((prev) => {
      const idx = prev.indexOf(h);
      if (idx < 0) return prev;

      const nextIdx = idx + dir;
      if (nextIdx < 0 || nextIdx >= prev.length) return prev;

      const copy = [...prev];
      const tmp = copy[idx];
      copy[idx] = copy[nextIdx];
      copy[nextIdx] = tmp;
      return copy;
    });
  }

  function resetToDefault() {
    setSelected(unique(defaultSelected));
  }

  function showAll() {
    setSelected(unique(allHeaders));
  }

  function hideAll() {
    setSelected([]);
    localStorage.removeItem(LS_COLS_KEY);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, minHeight: 0 }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontWeight: 700 }}>{title}</div>
          <div style={{ fontSize: 12, opacity: 0.85 }}>
            {hasData ? `${rows.length} rows • ${allHeaders.length} columns` : "No data"}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <ExportSatProbeButton scanId={scanId} />

          <button className="btn" onClick={resetToDefault} disabled={!allHeaders.length}>
            Reset to default columns
          </button>

          <button
            className="btn"
            onClick={() => setShowColumnsView((v) => !v)}
            disabled={!allHeaders.length}
          >
            {showColumnsView ? "Hide columns" : "Show columns"}
          </button>

          <button className="btn" onClick={showAll} disabled={!allHeaders.length}>
            Show all
          </button>

          <button className="btn" onClick={hideAll} disabled={!allHeaders.length}>
            Hide all
          </button>
        </div>
      </div>

      {Boolean(allHeaders.length) && showColumnsView && (
        <div
          style={{
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 12,
            padding: 10,
            background: "rgba(255,255,255,0.03)",
            maxHeight: 220,
            overflow: "auto",
            flex: "0 0 auto",
          }}
        >
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ fontWeight: 700 }}>Columns</div>
            <input
              value={colSearch}
              onChange={(e) => setColSearch(e.target.value)}
              placeholder="Search columns…"
              style={{
                flex: "1 1 220px",
                minWidth: 200,
                padding: "8px 10px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(0,0,0,0.15)",
                color: "inherit",
              }}
            />
            <div style={{ fontSize: 12, opacity: 0.85 }}>
              Visible: <b>{visibleHeaders.length}</b> / {allHeaders.length}
            </div>
          </div>

          <div
            style={{
              marginTop: 10,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 8,
            }}
          >
            {filteredAvailable.map((h) => {
              const checked = selected.includes(h);
              return (
                <div
                  key={h}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                    padding: "6px 8px",
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: checked ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)",
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                      cursor: "pointer",
                      flex: 1,
                    }}
                  >
                    <input type="checkbox" checked={checked} onChange={() => toggleHeader(h)} />
                    <span
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {h}
                    </span>
                  </label>

                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      className="btn"
                      style={{ padding: "2px 8px" }}
                      title="Move up"
                      onClick={() => move(h, -1)}
                      disabled={!checked}
                    >
                      ↑
                    </button>
                    <button
                      className="btn"
                      style={{ padding: "2px 8px" }}
                      title="Move down"
                      onClick={() => move(h, +1)}
                      disabled={!checked}
                    >
                      ↓
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "auto",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 12,
          background: "rgba(0,0,0,0.10)",
          maxHeight,
        }}
      >
        <table style={{ width: "max-content", minWidth: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {visibleHeaders.map((h) => (
                <th
                  key={h}
                  style={{
                    position: "sticky",
                    top: 0,
                    zIndex: 1,
                    textAlign: "left",
                    padding: "8px 10px",
                    fontSize: 12,
                    borderBottom: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(0,0,0,0.35)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {!hasData && (
              <tr>
                <td style={{ padding: 12, opacity: 0.75 }} colSpan={Math.max(1, visibleHeaders.length)}>
                  No rows to display.
                </td>
              </tr>
            )}

            {rows.map((r, rowIdx) => (
              <tr key={rowIdx} style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {visibleHeaders.map((h) => {
                  const idx = colIndexByHeader.get(h);
                  const val = idx == null ? "" : r[idx] ?? "";
                  return (
                    <td
                      key={h}
                      style={{
                        padding: "6px 8px",
                        fontSize: 12,
                        whiteSpace: "nowrap",
                      }}
                      title={String(val)}
                    >
                      {String(val)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Utilities **/

function parseTextToTable(text) {
  if (!text || typeof text !== "string") return { headers: [], rows: [] };

  const rawLines = text.split(/\r?\n/);

  const lines = rawLines
    .map((l) => l.replace(/\r/g, ""))
    .filter((l, idx, arr) => {
      if (l.trim().length) return true;
      for (let j = idx; j < arr.length; j++) {
        if (arr[j].trim().length) return true;
      }
      return false;
    });

  if (!lines.length) return { headers: [], rows: [] };

  const headerLine = lines[0];
  const delim = detectDelimiter(headerLine, lines);

  const headers = splitLine(headerLine, delim)
    .map((h) => h.trim())
    .filter(Boolean);

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const ln = lines[i];
    if (!ln.trim()) continue;

    const parts = splitLine(ln, delim).map((x) => x.trim());

    const row = new Array(headers.length).fill("");
    for (let c = 0; c < headers.length; c++) row[c] = parts[c] ?? "";
    rows.push(row);
  }

  return { headers, rows };
}

function detectDelimiter(headerLine, allLines) {
  if (headerLine.includes("\t")) return "\t";

  const has2Spaces =
    /\s{2,}/.test(headerLine) || allLines.slice(1, 20).some((l) => /\s{2,}/.test(l));
  if (has2Spaces) return /\s{2,}/;

  if (headerLine.includes(",")) {
    const headerParts = headerLine.split(",");
    if (headerParts.length > 1) {
      const expected = headerParts.length;
      const sample = allLines.slice(1, 10).filter((l) => l.trim().length);
      const ok = sample.every((l) => l.split(",").length === expected);
      if (ok) return ",";
    }
  }

  return /\s+/;
}

function splitLine(line, delim) {
  if (delim instanceof RegExp) return line.split(delim).filter((x) => x !== "");
  return line.split(delim);
}

function safeJsonParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function norm(s) {
  return String(s).trim().toLowerCase().replace(/\s+/g, " ");
}

function unique(arr) {
  const out = [];
  const seen = new Set();
  for (const x of arr) {
    if (seen.has(x)) continue;
    seen.add(x);
    out.push(x);
  }
  return out;
}

function pickHeadersByPreference(headers, preferred) {
  const out = [];
  const headerByNorm = new Map();
  for (const h of headers) headerByNorm.set(norm(h), h);

  for (const p of preferred) {
    const match = headerByNorm.get(norm(p));
    if (match) out.push(match);
  }
  return out;
}