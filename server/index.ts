import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupOpenGraph } from "./openGraph";
import { storage } from "./storage";
import { validateEnvironment, logValidationResults } from "./startup-validation";
import { errorHandler, notFoundHandler, StructuredLogger } from "./errorHandler";

const app = express();
// Increase body size limit to 50MB to handle image data
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

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
  // Validate environment on startup
  const validationResult = validateEnvironment();
  logValidationResults(validationResult);
  
  // In production, exit if critical errors exist
  if (process.env.NODE_ENV === 'production' && !validationResult.isValid) {
    console.error('Exiting due to environment validation errors in production mode.');
    process.exit(1);
  }
  
  // Setup Open Graph middleware before other routes
  setupOpenGraph(app);
  
  const server = await registerRoutes(app);

  // Use structured error handler
  app.use(errorHandler);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, async () => {
    log(`serving on port ${port}`);
    
    // Run cleanup of duplicate likes on startup
    try {
      StructuredLogger.info("Running duplicate likes cleanup");
      const cleanupResult = await storage.cleanupDuplicateLikes();
      StructuredLogger.info("Cleanup completed", {
        duplicatesRemoved: cleanupResult.duplicatesRemoved,
        promptsFixed: cleanupResult.promptsFixed
      });
    } catch (error) {
      StructuredLogger.error("Error during likes cleanup", error as Error);
      // Don't crash the server if cleanup fails
    }
  });
})();
