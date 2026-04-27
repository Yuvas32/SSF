import { useState } from "react";

export default function TableGrid({
  hasData,
  visibleHeaders,
  rows,
  colIndexByHeader,
  maxHeight = 520,
}) {
  const [selectedRows, setSelectedRows] = useState(new Set());

  function toggleRowSelection(rowIdx) {
    const newSet = new Set(selectedRows);
    if (newSet.has(rowIdx)) {
      newSet.delete(rowIdx);
    } else {
      newSet.add(rowIdx);
    }
    setSelectedRows(newSet);
  }

  function toggleAllRows() {
    if (selectedRows.size === rows.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(rows.map((_, idx) => idx)));
    }
  }

  return (
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
            <th
              style={{
                position: "sticky",
                top: 0,
                zIndex: 1,
                textAlign: "center",
                padding: "8px 10px",
                fontSize: 12,
                borderBottom: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(0,0,0,0.35)",
                whiteSpace: "nowrap",
                width: 40,
              }}
            >
              <input
                type="checkbox"
                checked={selectedRows.size === rows.length && rows.length > 0}
                onChange={toggleAllRows}
                title="Select all rows"
                style={{ cursor: "pointer" }}
              />
            </th>
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
              <td
                style={{ padding: 12, opacity: 0.75 }}
                colSpan={visibleHeaders.length + 1}
              >
                No rows to display.
              </td>
            </tr>
          )}

          {rows.map((r, rowIdx) => (
            <tr
              key={rowIdx}
              style={{
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                backgroundColor: selectedRows.has(rowIdx) ? "rgba(59,130,246,0.1)" : "transparent",
              }}
            >
              <td
                style={{
                  textAlign: "center",
                  padding: "6px 8px",
                  fontSize: 12,
                  whiteSpace: "nowrap",
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedRows.has(rowIdx)}
                  onChange={() => toggleRowSelection(rowIdx)}
                  title={`Select row ${rowIdx + 1}`}
                  style={{ cursor: "pointer" }}
                />
              </td>
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
  );
}