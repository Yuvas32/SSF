import { useEffect, useMemo, useRef, useState } from "react";

import XmlToolbar from "./XmlToolbar";
import XmlPairsTable from "./XmlPairsTable";

import { splitPreamble, parseNameValPairsFromXml } from "../../utils/xml/xmlParse";
import { norm } from "../../utils/xml/string";
import { getValByExactOrNormalizedName, extractScanBase } from "../../utils/xml/xmlScanName";
import { updateExistingOnlyByExactName, upsertByExactName } from "../../utils/xml/xmlUpdate";
import { saveRawXmlToPcFolder } from "../../services/xmlService";

const XML_URL = "/controller.xml";

export default function XmlTableViewer({ scanParams, onExpose }) {
  const [rawText, setRawText] = useState("");
  const [preamble, setPreamble] = useState("");
  const [xmlPart, setXmlPart] = useState("");
  const [pairs, setPairs] = useState([]);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  // backend auto-save status (for scan flow only)
  const [savingToPc, setSavingToPc] = useState(false);

  // Save AFTER the next apply (used by Scan)
  const pendingSaveRef = useRef(false);

  // Load base XML once
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(XML_URL, { cache: "no-store" });
        if (!res.ok) throw new Error(`Failed to load ${XML_URL} (HTTP ${res.status})`);
        const text = await res.text();

        const { preamble: pre, xmlPart: xml } = splitPreamble(text);
        const parsed = parseNameValPairsFromXml(xml);

        setPreamble(pre);
        setXmlPart(xml);
        setRawText(pre + xml);
        setPairs(parsed);
      } catch (e) {
        console.error(e);
        setError(e?.message || "Failed to load XML from public folder");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // XML health (display only)
  const xmlHealth = useMemo(() => {
    const REQUIRED = ["DEVICE", "PSSR4"];
    const hasToken = (token) => {
      const t = norm(token);
      return pairs.some((p) => {
        const n = norm(p?.Name ?? "");
        const v = norm(p?.Val ?? "");
        return n.includes(t) || v.includes(t);
      });
    };
    const missing = REQUIRED.filter((t) => !hasToken(t));
    return { ok: missing.length === 0, missing };
  }, [pairs]);

  // Expose API to parent (App)
  useEffect(() => {
    onExpose?.({
      // ✅ used by App on Scan flow
      saveAfterNextApply: () => {
        pendingSaveRef.current = true;
      },

      // optional: manual backend save (if you ever want it elsewhere)
      saveToPcNow: async () => {
        if (!rawText) return;
        await saveToPcFolders(rawText, setSavingToPc, setError);
      },
    });
  }, [onExpose, rawText]);

  // Apply scan params (start/stop + Scan_Name/tandem from DB id)
  useEffect(() => {
    if (!scanParams) return;
    if (!xmlPart) return;

    const { start, stop, tandemId } = scanParams;

    if (!Number.isFinite(start) || !Number.isFinite(stop)) return;

    const dbId = Number(tandemId);
    if (!Number.isFinite(dbId) || dbId <= 0) {
      return;
    }

    const currentPairs = parseNameValPairsFromXml(xmlPart);

    // Always name based on tandem/dbId (ignore any existing Scan_Name)
    const tandemNew = String(dbId);
    const scanNameNew = `Scan_${tandemNew}`;


    let updated = xmlPart;

    updated = updateExistingOnlyByExactName(
      updated,
      currentPairs,
      "L-Band_Start_frequency",
      String(start)
    );

    updated = updateExistingOnlyByExactName(
      updated,
      currentPairs,
      "L-Band_Stop_frequency",
      String(stop)
    );

    updated = upsertByExactName(updated, currentPairs, "Scan_Name", scanNameNew);
    updated = upsertByExactName(updated, currentPairs, "tandem", tandemNew);

    const updatedPairs = parseNameValPairsFromXml(updated);
    const updatedRaw = preamble + updated;

    setXmlPart(updated);
    setRawText(updatedRaw);
    setPairs(updatedPairs);

    // ✅ Scan flow auto-save to backend (3 dirs)
    if (pendingSaveRef.current) {
      pendingSaveRef.current = false;
      saveToPcFolders(updatedRaw, setSavingToPc, setError).catch((e) => {
        console.error(e);
        setError(e?.message || "Failed to save XML to PC folders");
      });
    }
  }, [scanParams, xmlPart, preamble]);

  const filteredPairs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pairs;
    return pairs.filter(
      (p) =>
        String(p.Name).toLowerCase().includes(q) ||
        String(p.Val).toLowerCase().includes(q)
    );
  }, [pairs, query]);

  return (
    <div>
      <XmlToolbar
        xmlUrl={XML_URL}
        loading={loading}
        saving={savingToPc} // shows "Saving to folder..." ONLY for scan auto-save
        xmlHealth={xmlHealth}
        query={query}
        setQuery={setQuery}
        hasPairs={Boolean(pairs.length)}
        onSaveNow={() => rawText && downloadXmlToDownloads(rawText)}
        error={error}
      />

      {!!pairs.length && <XmlPairsTable pairs={filteredPairs} />}
    </div>
  );
}

/* -----------------------
   Scan flow: backend save
   ----------------------- */
async function saveToPcFolders(rawXmlText, setSaving, setError) {
  setError?.("");
  setSaving?.(true);
  try {
    await saveRawXmlToPcFolder(rawXmlText);
  } finally {
    setSaving?.(false);
  }
}

/* ---------------------------------------------
   Manual button: browser download to Downloads
   --------------------------------------------- */
function downloadXmlToDownloads(rawXmlText) {
  // IMPORTANT: get newest Scan_Name from the XML TEXT itself
  let scanName = "controller";
  try {
    const { xmlPart } = splitPreamble(rawXmlText);
    const parsedPairs = parseNameValPairsFromXml(xmlPart);
    scanName = getValByExactOrNormalizedName(parsedPairs, "Scan_Name") || scanName;
  } catch {
    // keep fallback
  }

  const safe = (s) =>
    String(s || "")
      .trim()
      .replace(/[\\/:*?"<>|]+/g, "-")
      .replace(/\s+/g, "_");

  const fileName = `${safe(scanName)}.xml`;

  const blob = new Blob([rawXmlText], { type: "text/xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = fileName; // ✅ goes to default Downloads
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}
