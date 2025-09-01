import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { seedReportTemplates } from "./seed-templates";
import { globalWebSocketManager } from "./services/websocketManager";
import { db } from "./db";
import { servers as serversTable } from "@shared/schema";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {


  const server = await registerRoutes(app);

  // Seed report templates on startup
  await seedReportTemplates();

  // Initialize BattleMetrics WebSocket manager
  try {
    await globalWebSocketManager.connect();
    log("✓ BattleMetrics WebSocket manager initialized");
    // Auto-subscribe to all stored servers for real-time events
    try {
      const allServers = await db.select().from(serversTable);
      for (const s of allServers) {
        if (s.id) {
          globalWebSocketManager.subscribeToServer(s.id);
        }
      }
      log(`Subscribed to ${allServers.length} server(s) for real-time events`);
    } catch (e) {
      log("⚠️ Failed to subscribe servers:", e);
    }
  } catch (error) {
    log("⚠️ Failed to initialize BattleMetrics WebSocket manager:", error);
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    console.error('Request error:', err);
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Use PORT environment variable or default to 3002 for development
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '3002', 10);
  server.listen({
    port,
    host: "0.0.0.0",
  }, () => {
    log(`serving on port ${port}`);
  });
})();
