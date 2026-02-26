import { Router } from "express";
import {
  inputCount,
  outputStatus,
  spectrumFile,
  tmptxtFile,
  resultXmlDownloadFile,
} from "../controllers/satscan.controller.js";

const router = Router();

router.get("/satscan/input/count", inputCount);
router.get("/satscan/output/:scanId/status", outputStatus);
router.get("/satscan/output/:scanId/spectrum", spectrumFile);
router.get("/satscan/output/:scanId/tmptxt", tmptxtFile);
router.get("/satscan/output/:scanId/resultxml/download", resultXmlDownloadFile);

export default router;