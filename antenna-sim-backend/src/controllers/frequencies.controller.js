import asyncHandler from "../utils/asyncHandler.js";
import { Frequency } from "../models/Frequency.js";

function validateRange(start, end) {
  const s = Number(start);
  const e = Number(end);

  if (!Number.isFinite(s) || !Number.isFinite(e)) {
    const err = new Error("start and end must be valid numbers");
    err.statusCode = 400;
    throw err;
  }
  if (s <= 0 || e <= 0) {
    const err = new Error("start and end must be > 0");
    err.statusCode = 400;
    throw err;
  }
  if (s >= e) {
    const err = new Error("start must be smaller than end");
    err.statusCode = 400;
    throw err;
  }

  return { s, e };
}

export const createFrequency = asyncHandler(async (req, res) => {
  const { start, end } = req.body;
  const { s, e } = validateRange(start, end);

  const row = await Frequency.create({ start: s, end: e });
  res.status(201).json(row);
});

export const deleteFrequency = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ error: "id must be a positive number" });
  }

  const deletedCount = await Frequency.destroy({ where: { id } });

  if (deletedCount === 0) {
    return res.status(404).json({ error: `frequency id ${id} not found` });
  }

  res.json({ ok: true, deletedId: id });
});

export const listFrequencies = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit || 50), 200);

  const rows = await Frequency.findAll({
    order: [["id", "DESC"]],
    limit,
  });

  res.json(rows);
});

export const latestFrequency = asyncHandler(async (req, res) => {
  const row = await Frequency.findOne({ order: [["id", "DESC"]] });
  res.json(row || null);
});
