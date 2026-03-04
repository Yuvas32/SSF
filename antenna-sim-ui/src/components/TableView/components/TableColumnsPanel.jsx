export default function TableColumnsPanel({
  allHeaders,
  showColumnsView,
  colSearch,
  setColSearch,
  visibleHeaders,
  filteredAvailable,
  selected,
  toggleHeader,
  move,
}) {
  if (!allHeaders.length || !showColumnsView) return null;

  return (
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
                  onClick={() => move(h, 1)}
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
  );
}