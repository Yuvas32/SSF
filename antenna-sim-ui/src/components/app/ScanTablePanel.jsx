import TableView from "../TableView/TableView";

export default function ScanTablePanel({ scanId, tableText, onClear }) {
  return (
    <div className="panel">
      <div className="panelHeader">
        <div>
          <div className="panelTitle">Scan Table View</div>
          <div className="panelMeta">
            Shows Scan_{scanId ?? "-"} .tmptxt (auto-loaded when you click Display in Frequencies)
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className="btnSmall" onClick={onClear}>
            Clear
          </button>
        </div>
      </div>

      <div className="panelBody">
        <TableView
          title="Parsed Table"
          text={tableText}
          maxHeight={520}
          scanId={scanId}
        />
      </div>
    </div>
  );
}