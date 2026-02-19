export function safeFileName(name) {
  return String(name || "controller")
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "_");
}
