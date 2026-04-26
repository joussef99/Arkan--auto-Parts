import express, { Application } from "express";
import cors from "cors";
import { initDatabase } from "./config/db.js";
import routes from "./routes/index.js";
import env from "./config/env.js";
import { enforceSubscription } from "./middlewares/subscription.middleware.js";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware.js";

const PORT = env.PORT || 5000;

function createApp(): Application {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(enforceSubscription);

  // API Routes
  app.use("/api", routes);

  // 404 handler for API routes
  app.use("/api/*", notFoundHandler);
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