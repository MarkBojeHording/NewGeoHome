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
  try {
    console.log('🚀 Starting ServerBeacon system...');

    const server = await registerRoutes(app);
    console.log('✅ Routes registered successfully');

  // Seed report templates on startup
  await seedReportTemplates();

  // Initialize BattleMetrics WebSocket in background (non-blocking)
  console.log('🔧 Initializing BattleMetrics WebSocket in background...');

  const maxRetries = 3;
  let retryCount = 0;

  const attemptConnection = async (): Promise<void> => {
    try {
      console.log(`🔄 Attempting WebSocket connection (attempt ${retryCount + 1}/${maxRetries})...`);

      // Create a promise that resolves on connection or rejects on timeout
      const connectionPromise = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('WebSocket connection timeout (10s)'));
        }, 10000);

        globalWebSocketManager.connect()
          .then(() => {
            clearTimeout(timeout);
            resolve();
          })
          .catch((error) => {
            clearTimeout(timeout);
            reject(error);
          });
      });

      await connectionPromise;

      console.log("✅ BattleMetrics WebSocket manager initialized successfully");

      // Auto-subscribe to all stored servers for real-time events
      try {
        const allServers = await db.select().from(serversTable);
        for (const s of allServers) {
          if (s.id) {
            globalWebSocketManager.subscribeToServer(s.id);
          }
        }
        console.log(`📡 Subscribed to ${allServers.length} server(s) for real-time events`);
      } catch (e) {
        console.log("⚠️ Failed to subscribe servers:", e);
      }

    } catch (error) {
      console.log(`❌ WebSocket connection attempt ${retryCount + 1} failed:`, error);

      if (retryCount < maxRetries - 1) {
        retryCount++;
        const delay = 10000; // 10 second delay
        console.log(`⏳ Retrying in ${delay/1000} seconds...`);
        setTimeout(attemptConnection, delay);
      } else {
        console.log("⚠️ Max retries reached. Continuing without BattleMetrics WebSocket.");
        console.log("💡 Server will continue running normally. WebSocket can be retried later.");
      }
    }
  };

  // Start connection attempts in background (non-blocking)
  attemptConnection();

  console.log('🔧 Setting up error handling middleware...');

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    console.error('Request error:', err);
  });

  // Serve the built frontend
  app.use(express.static('dist/public'));

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Use PORT environment variable or default to 3003 for development
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '3003', 10);
  server.listen({
    port,
    host: "0.0.0.0",
  }, () => {
    log(`serving on port ${port}`);
    console.log('🎉 ServerBeacon system is now running!');
    console.log(`🌐 Access points:`);
    console.log(`   - GeoHome: http://localhost:${port}/`);
    console.log(`   - Admin: http://localhost:${port}/admin`);
  });

  // Keep the process alive
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down ServerBeacon...');
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  });

  } catch (error) {
    console.error('❌ Fatal error during startup:', error);
    process.exit(1);
  }
})();
