import { errorBoxStyle } from "./xmlStyles";

export default function XmlToolbar({
  xmlUrl,
  loading,
  saving,
  xmlHealth,
  query,
  setQuery,
  hasPairs,
  onSaveNow,
  error,
}) {
  return (
    <>
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ fontSize: 12, opacity: 0.8 }}>
          Source: <b>{xmlUrl}</b> {loading ? "• Loading..." : ""}{" "}
          {saving ? "• Auto-saving to PC folders..." : ""}
        </div>

        <input
          className="input"
          style={{ maxWidth: 360 }}
          placeholder="Search Name / Val..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={!hasPairs}
        />

        <button
          className="btnSmall"
          onClick={onSaveNow}
          disabled={!hasPairs}
          title="Download XML to your default Downloads folder"
        >
          Download XML (Downloads)
        </button>
      </div>

      {error && (
        <div style={errorBoxStyle}>
          <b>Error:</b> {error}
        </div>
      )}
    </>
  );
}
