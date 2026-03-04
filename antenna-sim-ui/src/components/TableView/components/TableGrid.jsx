export default function TableGrid({
  hasData,
  visibleHeaders,
  rows,
  colIndexByHeader,
  maxHeight = 520,
}) {
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
                colSpan={Math.max(1, visibleHeaders.length)}
              >
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
  );
}