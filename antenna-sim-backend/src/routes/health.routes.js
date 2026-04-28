import { Router } from "express";
import { basicHealth, devicesHealth } from "../controllers/health.controller.js";
import { isSatscanApiRunning, killSatscanApi, isCerberusServiceRunning, startCerberusService, launchSatscanApi } from "../services/satscanApiHealth.service.js";

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

router.post("/health/satscan-api/kill", async (req, res) => {
  try {
    const result = await killSatscanApi();
    return res.json(result);
  } catch (e) {
    return res.status(500).json({
      ok: false,
      message: "Failed to kill api_call_satscan",
      error: e?.message || String(e),
    });
  }
});

router.get("/health/cerberus", async (req, res) => {
  try {
    const result = await isCerberusServiceRunning();
    return res.json(result);
  } catch (e) {
    return res.status(500).json({
      ok: false,
      service: "Cerberus",
      message: "Cerberus service not running",
      error: e?.message || String(e),
    });
  }
});

router.post("/health/cerberus/start", async (req, res) => {
  try {
    const result = await startCerberusService();
    return res.json(result);
  } catch (e) {
    return res.status(500).json({
      ok: false,
      service: "Cerberus",
      message: "Failed to start Cerberus service",
      error: e?.message || String(e),
    });
  }
});

router.post("/health/satscan-api/launch", async (req, res) => {
  try {
    const result = await launchSatscanApi();
    return res.json(result);
  } catch (e) {
    return res.status(500).json({
      ok: false,
      message: "Failed to launch api_call_satscan",
      error: e?.message || String(e),
    });
  }
});

export default router;