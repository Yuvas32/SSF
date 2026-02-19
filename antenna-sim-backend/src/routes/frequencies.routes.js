import { Router } from "express";
import {
  createFrequency,
  deleteFrequency,
  latestFrequency,
  listFrequencies,
} from "../controllers/frequencies.controller.js";

const router = Router();

router.post("/frequencies", createFrequency);
router.delete("/frequencies/:id", deleteFrequency);
router.get("/frequencies", listFrequencies);
router.get("/frequencies/latest", latestFrequency);

export default router;
