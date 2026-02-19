import { Router } from "express";
import { exec } from "child_process";
import { isSatscanApiRunning } from "../services/satscanApiHealth.service.js";

const router = Router();

// basic
router.get("/health", (req, res) => res.json({ ok: true }));

// existing: /health/devices (keep yours as-is)
// If you already have it here, do NOT duplicate it.
// (Leaving out to avoid conflicts)

// NEW: Satscan API call process health
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
