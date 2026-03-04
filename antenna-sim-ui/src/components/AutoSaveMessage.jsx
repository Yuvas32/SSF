export default function AutoSaveMessage({ message }) {
  if (!message) return null;

  return (
    <div className="panel" style={{ padding: 10 }}>
      <div style={{ fontSize: 13 }}>{message}</div>
    </div>
  );
}