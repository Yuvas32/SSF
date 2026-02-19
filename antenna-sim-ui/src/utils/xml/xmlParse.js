export function splitPreamble(text) {
  const idx = text.indexOf("<");
  if (idx < 0) throw new Error("No XML tags found.");
  return { preamble: text.slice(0, idx), xmlPart: text.slice(idx) };
}

export function parseNameValPairsFromXml(xmlText) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, "text/xml");
  const parseError = doc.querySelector("parsererror");
  if (parseError) throw new Error("XML parse error. Make sure the file is valid.");

  const elementsNode = doc.querySelector("Elements");
  if (!elementsNode) throw new Error("Unsupported XML: missing <Elements> root.");

  const children = Array.from(elementsNode.children);
  const out = [];

  for (let i = 0; i < children.length; i++) {
    const el = children[i];
    if (el.tagName === "Name") {
      const name = el.textContent ?? "";
      const next = children[i + 1];
      const val = next?.tagName === "Val" ? (next.textContent ?? "") : "";
      out.push({ Name: name, Val: val });
    }
  }

  return out;
}
