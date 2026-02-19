import asyncHandler from "../utils/asyncHandler.js";
import { sequelize } from "../db/sequelize.js";
import { checkRequiredDevices } from "../services/devices.service.js";

export const basicHealth = (req, res) => {
  res.json({ ok: true });
};

export const dbHealth = asyncHandler(async (req, res) => {
  try {
    await sequelize.authenticate();
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      error: e?.message || String(e),
    });
  }
});

export const devicesHealth = asyncHandler(async (req, res) => {
  const result = await checkRequiredDevices(["device", "pssr4"]);
  res.json(result);
});
