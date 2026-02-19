export default function XmlPairsTable({ pairs }) {
  return (
    <div className="tableWrap" style={{ marginTop: 12 }}>
      <table className="dbTable">
        <thead>
          <tr>
            <th>Name</th>
            <th>Val</th>
          </tr>
        </thead>
        <tbody>
          {pairs.map((p, idx) => (
            <tr key={`${p.Name}-${idx}`}>
              <td>{p.Name}</td>
              <td>{p.Val}</td>
            </tr>
          ))}

          {pairs.length === 0 && (
            <tr>
              <td colSpan={2} style={{ padding: 14, opacity: 0.7, textAlign: "center" }}>
                No matches.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
