// antenna-sim-backend/src/routes/scans.routes.js
import { Router } from "express";
import { saveXml, startScan, listScans, updateScan, deleteScan, getProgress } from "../controllers/scans.controller.js";
import { OUT_DIRS, SATSCAN_OUTPUT_DIR, SATSCAN_INPUT_DIR } from "../config/env.js";

const router = Router();

router.post("/scans/xml", saveXml);
router.post("/scans/start", startScan);
router.get("/scans/list", listScans);
router.put("/scans/:scanName", updateScan);
router.delete("/scans/:scanName", deleteScan);
router.get("/scans/progress", getProgress);

// sanity endpoints
router.get("/scans/outdir", (req, res) =>
  res.json({
    outDirs: OUT_DIRS,
    primaryOutDir: SATSCAN_OUTPUT_DIR,
    inputDir: SATSCAN_INPUT_DIR,
  })
);

export default router;
