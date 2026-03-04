export function parseTextToTable(text) {
  if (!text || typeof text !== "string") {
    return { headers: [], rows: [] };
  }

  const rawLines = text.split(/\r?\n/);

  const lines = rawLines
    .map((line) => line.replace(/\r/g, ""))
    .filter((line, idx, arr) => {
      if (line.trim().length) return true;

      for (let j = idx; j < arr.length; j++) {
        if (arr[j].trim().length) return true;
      }
      return false;
    });

  if (!lines.length) return { headers: [], rows: [] };

  const headerLine = lines[0];
  const delim = detectDelimiter(headerLine, lines);

  const headers = splitLine(headerLine, delim)
    .map((h) => h.trim())
    .filter(Boolean);

  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const parts = splitLine(line, delim).map((x) => x.trim());
    const row = new Array(headers.length).fill("");

    for (let c = 0; c < headers.length; c++) {
      row[c] = parts[c] ?? "";
    }

    rows.push(row);
  }

  return { headers, rows };
}

function detectDelimiter(headerLine, allLines) {
  if (headerLine.includes("\t")) return "\t";

  const has2Spaces =
    /\s{2,}/.test(headerLine) || allLines.slice(1, 20).some((line) => /\s{2,}/.test(line));

  if (has2Spaces) return /\s{2,}/;

  if (headerLine.includes(",")) {
    const headerParts = headerLine.split(",");
    if (headerParts.length > 1) {
      const expected = headerParts.length;
      const sample = allLines.slice(1, 10).filter((line) => line.trim().length);
      const ok = sample.every((line) => line.split(",").length === expected);
      if (ok) return ",";
    }
  }

  return /\s+/;
}

function splitLine(line, delim) {
  if (delim instanceof RegExp) {
    return line.split(delim).filter((x) => x !== "");
  }
  return line.split(delim);
}