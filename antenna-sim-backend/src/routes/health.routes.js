import { Router } from "express";
import { basicHealth, devicesHealth } from "../controllers/health.controller.js";
import { isSatscanApiRunning } from "../services/satscanApiHealth.service.js";

const router = Router();

router.get("/health", basicHealth);
router.get("/health/devices", devicesHealth);

router.get("/health/satscan-api", async (req, res) => {
  try {
    const result = await isSatscanApiRunning();
    return res.json(result);
  } catch (e) {
    return res.status(500).json({
      ok: false,
      message: "satscan api call not running",
      error: e?.message || String(e),
    });
  }
});

export default router;