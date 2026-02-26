import React from "react";

export default function ExportSatProbeButton({ scanId = null }) {
  const canDownload = Number.isFinite(Number(scanId)) && Number(scanId) > 0;

  async function onDownload() {
    if (!canDownload) return;

    try {
      const res = await fetch(
        `http://localhost:8080/satscan/output/${scanId}/resultxml/download`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      if (!res.ok) {
        let msg = `HTTP ${res.status}`;

        try {
          const j = await res.json();
          msg = j?.error || msg;
        } catch {
          try {
            msg = await res.text();
          } catch {
            // ignore
          }
        }

        throw new Error(msg || "Failed to download result.xml");
      }

      const blob = await res.blob();

      let filename = "result.xml";
      const cd = res.headers.get("content-disposition");
      const match = cd && cd.match(/filename="?([^"]+)"?/i);
      if (match?.[1]) {
        filename = match[1];
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();

      setTimeout(() => window.URL.revokeObjectURL(url), 5000);
    } catch (err) {
      alert(err?.message || "Failed to download result.xml");
    }
  }

  return (
    <button
      className="btn"
      onClick={onDownload}
      disabled={!canDownload}
      title={!canDownload ? "No scan selected" : ""}
      type="button"
    >
      Get satProbe info
    </button>
  );
}