export function norm(s) {
  return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
