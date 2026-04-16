import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import { initDatabase } from "./config/db.js";
import routes from "./routes/index.js";
import env from "./config/env.js";

const PORT = env.PORT || 5000;

function createApp(): Application {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Routes
  app.use("/api", routes);

  // 404 handler for API routes
  app.use("/api/*", (req: Request, res: Response) => {
    res.status(404).json({ error: "API endpoint not found" });
  });

  // Global error handler for API routes
  app.use("/api", (err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error("API Error:", err);
    res.status(500).json({ 
      error: "Internal Server Error", 
      message: err.message 
    });
  });

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