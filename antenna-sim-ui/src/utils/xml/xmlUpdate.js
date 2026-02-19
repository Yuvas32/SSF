import { escapeRegex } from "./string";

export function escapeXmlText(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function detectIndent(xmlText) {
  const m = xmlText.match(/\n([ \t]*)<Name>/g);
  if (!m || m.length === 0) return "\n  ";
  const last = m[m.length - 1];
  const indent = last.replace(/\n/g, "").replace("<Name>", "");
  return `\n${indent}`;
}

export function updateExistingOnlyByExactName(xmlText, currentPairs, exactName, newVal) {
  const found = currentPairs.find((p) => p.Name === exactName);
  if (!found) return xmlText;

  const re = new RegExp(
    `(<Name>\\s*${escapeRegex(exactName)}\\s*<\\/Name>\\s*<Val>)([\\s\\S]*?)(<\\/Val>)`,
    "i"
  );
  return re.test(xmlText) ? xmlText.replace(re, `$1${escapeXmlText(newVal)}$3`) : xmlText;
}

export function upsertByExactName(xmlText, currentPairs, exactName, newVal) {
  const re = new RegExp(
    `(<Name>\\s*${escapeRegex(exactName)}\\s*<\\/Name>\\s*<Val>)([\\s\\S]*?)(<\\/Val>)`,
    "i"
  );

  const found = currentPairs.find((p) => p.Name === exactName);
  if (found) {
    return re.test(xmlText) ? xmlText.replace(re, `$1${escapeXmlText(newVal)}$3`) : xmlText;
  }

  const indent = detectIndent(xmlText);
  const insertion =
    `${indent}<Name>${exactName}</Name>\n` +
    `${indent}<Val>${escapeXmlText(newVal)}</Val>\n`;

  const endTag = /<\/Elements>\s*$/i;
  if (!endTag.test(xmlText)) throw new Error("Unsupported XML: missing </Elements> end tag.");

  return xmlText.replace(endTag, `${insertion}</Elements>`);
}
