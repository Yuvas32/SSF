export const badgeStyle = {
  fontSize: 11,
  fontWeight: 800,
  padding: "3px 8px",
  borderRadius: 999,
  border: "1px solid rgba(0,0,0,0.15)",
  background: "rgba(0,0,0,0.06)",
};

export const metaRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  fontSize: 12,
  marginBottom: 10,
};

export const chartFrameStyle = {
  position: "relative",
  border: "1px dashed rgba(0,0,0,0.18)",
  borderRadius: 12,
  background: "#FAFAFA",
  overflow: "hidden",
};

export const placeholderStyle = {
  position: "absolute",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "rgba(0,0,0,0.55)",
  fontSize: 14,
};

export const errorBoxStyle = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #FCA5A5",
  background: "#FEE2E2",
  color: "#991B1B",
  fontSize: 13,
};

export const zoomBarStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginBottom: 8,
};

export const zoomBtnStyle = {
  height: 30,
  padding: "0 10px",
  borderRadius: 10,
  fontWeight: 900,
};

export const zoomLabelStyle = {
  minWidth: 60,
  textAlign: "center",
  fontSize: 12,
  opacity: 0.85,
  fontWeight: 800,
};
export const tooltipStyle = {
  position: "absolute",
  pointerEvents: "none",
  padding: "6px 8px",
  borderRadius: 10,
  border: "1px solid rgba(0,0,0,0.15)",
  background: "rgba(255,255,255,0.92)",
  color: "rgba(17,24,39,0.95)",
  fontSize: 12,
  fontWeight: 700,
  boxShadow: "0 10px 25px rgba(0,0,0,0.10)",
  whiteSpace: "nowrap",
};

export const tooltipStyleDark = {
  ...tooltipStyle,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(17,26,46,0.92)",
  color: "rgba(233,238,249,0.95)",
};


export const markerDotStyle = {
  position: "absolute",
  width: 10,
  height: 10,
  borderRadius: 999,
  transform: "translate(-50%, -50%)",
  border: "2px solid rgba(37,99,235,0.95)",
  background: "rgba(255,255,255,0.9)",
  pointerEvents: "none",
};
export const modalOverlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.55)",
  zIndex: 9999,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
};

export const modalBoxStyleLight = {
  width: "min(1200px, 96vw)",
  height: "min(760px, 92vh)",
  background: "#fff",
  color: "rgba(17,24,39,0.95)",
  borderRadius: 16,
  overflow: "hidden",
  boxShadow: "0 25px 60px rgba(0,0,0,0.35)",
  border: "1px solid rgba(0,0,0,0.10)",
  display: "flex",
  flexDirection: "column",
};

export const modalBoxStyleDark = {
  ...modalBoxStyleLight,
  background: "#0B1220",
  color: "rgba(233,238,249,0.95)",
  boxShadow: "0 25px 60px rgba(0,0,0,0.60)",
  border: "1px solid rgba(255,255,255,0.10)",
};

export const modalHeaderStyleLight = {
  padding: "12px 14px",
  borderBottom: "1px solid rgba(0,0,0,0.12)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  background: "rgba(0,0,0,0.02)",
};

export const modalHeaderStyleDark = {
  ...modalHeaderStyleLight,
  borderBottom: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.04)",
};

export const modalBodyStyle = {
  padding: 14,
  minHeight: 0,
  flex: 1,
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

