export default function TableToolbar({
  title,
  hasData,
  rowsCount,
  headersCount,
  allHeaders,
  resetToDefault,
  showColumnsView,
  setShowColumnsView,
  showAll,
  hideAll,
  children,
}) {
  return (
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
          {hasData ? `${rowsCount} rows • ${headersCount} columns` : "No data"}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
        {children}

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
  );
}