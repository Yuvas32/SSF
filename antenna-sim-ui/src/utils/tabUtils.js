export function labelForTab(tab) {
  switch (tab) {
    case "spectrum":
      return "Spectrum";
    case "frequencies":
      return "Frequencies";
    case "table":
      return "Scan Table";
    case "xml":
      return "Controller XML";
    default:
      return tab;
  }
}