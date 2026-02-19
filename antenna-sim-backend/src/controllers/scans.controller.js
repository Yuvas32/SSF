// antenna-sim-backend/src/controllers/scans.controller.js
import asyncHandler from "../utils/asyncHandler.js";
import { saveXmlToFolder } from "../services/scans.service.js";

export const saveXml = asyncHandler(async (req, res) => {
  const { scanName, xml } = req.body;

  const { savedTo, failed, outDirs, fileName } = await saveXmlToFolder({ scanName, xml });

  res.json({
    ok: failed.length === 0,       // true only if all 3 succeeded
    fileName,
    savedTo,                       // array of full paths
    failed,                        // any failed directories
    outDirs,                       // the 3 dirs being used
  });
});
