import { Router } from "express";
import {
  inputCount,
  outputStatus,
  spectrumFile,
  spectrumExists,
  tmptxtFile,
  resultXmlDownloadFile,
  monitorScan,
} from "../controllers/satscan.controller.js";

const router = Router();

router.get("/satscan/input/count", inputCount);
router.get("/satscan/output/:scanId/status", outputStatus);
router.get("/satscan/output/:scanId/spectrum", spectrumFile);
router.get("/satscan/output/:scanId/spectrum-exists", spectrumExists);
router.get("/satscan/output/:scanId/tmptxt", tmptxtFile);
router.get("/satscan/output/:scanId/resultxml/download", resultXmlDownloadFile);
router.post("/satscan/monitor/:scanId", monitorScan);

export default router;