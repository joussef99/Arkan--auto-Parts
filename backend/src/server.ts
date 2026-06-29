import express, { Application } from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { initDatabase } from "./config/db.js";
import routes from "./routes/index.js";
import env from "./config/env.js";
import {
  errorHandler,
  notFoundHandler,
} from "./middlewares/error.middleware.js";

const PORT = env.PORT || 5000;

function createApp(): Application {
  const app = express();
  const frontendDist = process.env.FRONTEND_DIST;
  const shouldServeFrontend =
    typeof frontendDist === "string" && frontendDist.length > 0;

  // Middleware
  app.disable("x-powered-by");
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  // API Routes
  app.get("/api/health", (_req, res) => {
    res.status(200).json({ ok: true });
  });

  app.get("/health", (_req, res) => {
    res.status(200).json({ ok: true, service: "backend" });
  });

  app.use("/api", routes);

  // 404 handler for API routes
  app.use("/api/*", notFoundHandler);

  if (shouldServeFrontend && frontendDist) {
    app.use(express.static(frontendDist));
    app.get("*", (_req, res) => {
      const indexPath = path.join(frontendDist, "index.html");
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
        return;
      }
      res.status(404).json({ message: "Frontend bundle not found" });
    });
  }

  if (!shouldServeFrontend) {
    app.get("/", (_req, res) => {
      res.status(200).json({ ok: true, message: "Backend is running" });
    });
  }

  app.use(errorHandler);

  return app;
}

function startServer(): void {
  console.log("Starting server initialization...");

  // Initialize database
  try {
    initDatabase();
    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Database initialization failed:", error);
    process.exit(1);
  }

  // Create and configure Express app
  const app = createApp();

  // Start server
  app.listen(PORT, "0.0.0.0", () => {
    console.log("Backend server running on http://0.0.0.0:" + PORT);
  });
}

// Start the server
console.log("Calling startServer()...");
startServer();
