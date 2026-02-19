import { Router } from "express";
import {
  inputCount,
  outputStatus,
  spectrumFile,
  tmptxtFile,
} from "../controllers/satscan.controller.js";

const router = Router();

// Input dir count
router.get("/satscan/input/count", inputCount);

// Output folder + spectrum detection
router.get("/satscan/output/:scanId/status", outputStatus);

// Read/parse spectrum file
router.get("/satscan/output/:scanId/spectrum", spectrumFile);

// ✅ Read Scan_<id>.tmptxt (or any .tmptxt inside Scan_<id> folder tree)
router.get("/satscan/output/:scanId/tmptxt", tmptxtFile);

export default router;
