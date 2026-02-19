// antenna-sim-backend/src/app.js
import express from "express";
import cors from "cors";

import { port } from "./config/env.js";
import { sequelize } from "./db/sequelize.js";

import healthRoutes from "./routes/health.routes.js";
import frequenciesRoutes from "./routes/frequencies.routes.js";
import scansRoutes from "./routes/scans.routes.js";
import satscanRoutes from "./routes/satscan.routes.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Routes
  app.use(healthRoutes);
  app.use(frequenciesRoutes);
  app.use(scansRoutes);
  app.use(satscanRoutes);

    // Error handler (so thrown errors return JSON)
  app.use((err, req, res, next) => {
    const code = Number(err?.statusCode || 500);
    res.status(code).json({
      ok: false,
      error: err?.message || "server error",
    });
  });


  return app;
}


export async function startServer() {
  const app = createApp();

  // Start HTTP first (works even if DB down)
  app.listen(port, () => {
    console.log(`Backend listening on http://localhost:${port}`);
  });

  // Non-fatal DB connect
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    console.log("✅ DB connected and synced");
  } catch (e) {
    console.error("⚠️ DB connection failed (server still running):", e?.message || e);
    console.error("⚠️ Fix MySQL and restart to enable DB endpoints fully.");
  }
}
