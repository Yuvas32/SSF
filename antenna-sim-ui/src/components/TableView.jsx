import { useMemo } from "react";

/**
 * TableView (simple)
 * - Parses TSV/CSV text and renders a plain table
 * - No filters, no meta header
 */
export default function TableView({ text = "", maxHeight = 320 }) {
  const { headers, rows } = useMemo(() => parseTextToTable(text), [text]);

  return (
    <div className="tableViewWrap">
      <div className="tableViewScroller" style={{ maxHeight }}>
        <table className="tableViewTable">
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th key={i}>{h || `Col ${i + 1}`}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((r, ri) => (
              <tr key={ri}>
                {headers.map((_, ci) => (
                  <td key={ci}>{r[ci] ?? ""}</td>
                ))}
              </tr>
            ))}

            {!rows.length ? (
              <tr>
                <td colSpan={headers.length || 1} style={{ padding: 12, opacity: 0.75 }}>
                  No data yet. Paste TSV/CSV text above.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* =========================
   Parsing helpers
   ========================= */

function parseTextToTable(text) {
  const raw = String(text || "").trim();
  if (!raw) return { headers: [], rows: [] };

  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length);
  if (!lines.length) return { headers: [], rows: [] };

  const delimiter = detectDelimiter(lines);
  const parsed = lines.map((line) => splitLine(line, delimiter));

  const first = parsed[0] || [];
  const isHeader = looksLikeHeaderRow(first);

  const headers = isHeader ? first : first.map((_, i) => `Col ${i + 1}`);
  const dataRows = isHeader ? parsed.slice(1) : parsed;

  // normalize row lengths
  const colCount = Math.max(headers.length, ...dataRows.map((r) => r.length), 0);
  const normHeaders = normalizeToLen(headers, colCount, (i) => `Col ${i + 1}`);
  const normRows = dataRows.map((r) => normalizeToLen(r, colCount, () => ""));

  return { headers: normHeaders, rows: normRows };
}

function detectDelimiter(lines) {
  const sample = lines.slice(0, 10).join("\n");
  if (sample.includes("\t")) return "\t";

  const comma = countChar(sample, ",");
  const semi = countChar(sample, ";");
  if (semi > comma) return ";";
  return ",";
}

function countChar(s, ch) {
  let c = 0;
  for (let i = 0; i < s.length; i++) if (s[i] === ch) c++;
  return c;
}

/**
 * Split a line with basic CSV quoting support:
 * - supports "a,b" where comma inside quotes doesn't split
 */
function splitLine(line, delimiter) {
  const s = String(line ?? "");
  const out = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];

    if (ch === '"') {
      const next = s[i + 1];
      if (inQuotes && next === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && ch === delimiter) {
      out.push(cur.trim());
      cur = "";
      continue;
    }

    cur += ch;
  }

  out.push(cur.trim());
  return out;
}

function looksLikeHeaderRow(cells) {
  if (!cells?.length) return false;
  return cells.some((x) => /[a-zA-Z]/.test(String(x)));
}

function normalizeToLen(arr, len, fillFn) {
  const out = Array.isArray(arr) ? [...arr] : [];
  while (out.length < len) out.push(fillFn(out.length));
  return out.slice(0, len);
}
