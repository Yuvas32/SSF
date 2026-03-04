import XmlTableViewer from "../XmlTableViewer/XmlTableViewer";

export default function XmlPanel({ scan, onExpose, onAutoSaveMsg }) {
  return (
    <div className="panel">
      <div className="panelHeader">
        <div>
          <div className="panelTitle">Controller XML</div>
          <div className="panelMeta">
            Reads <b>/controller.xml</b> • Updates start/stop + sets Scan_Name/tandem from DB id
          </div>
        </div>
      </div>

      <div className="panelBody">
        <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 10 }}>
          Optional: Use this tab to manually edit controller.xml and click <b>Apply</b>.
        </div>

        <XmlTableViewer
          scanParams={scan ? { start: scan.start, stop: scan.stop, tandemId: scan.dbId } : null}
          onExpose={onExpose}
          onAutoSaveResult={(result) => {
            if (!result) return;

            const failed = result.failed || [];
            if (failed.length) {
              onAutoSaveMsg(
                `⚠️ XML saved partially. Saved to: ${result.savedTo.join(" , ")}. Failed: ` +
                  failed.map((f) => `${f.dir}: ${f.error}`).join(" | ")
              );
            } else {
              onAutoSaveMsg(`✅ XML saved to: ${result.savedTo.join(" , ")}`);
            }
          }}
          showManualSave={false}
        />

        {scan?.error && (
          <div className="errorBox" style={{ marginTop: 12 }}>
            {scan.error}
          </div>
        )}
      </div>
    </div>
  );
}