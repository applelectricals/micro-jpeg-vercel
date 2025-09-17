import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { TestPremiumExpiryManager } from "./testPremiumExpiry";
import { initializeQueueService, shutdownQueueService } from "./queueService";

const app = express();
app.set('etag', false); // Disable ETags to prevent 304 responses
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ extended: false, limit: '200mb' }));

// Force all traffic to serve the React app (prevent external redirects)
app.use((req, res, next) => {
  // Add security headers to prevent external redirects
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
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
  // Initialize Redis and queue services
  try {
    const queueInitialized = await initializeQueueService();
    if (!queueInitialized) {
      console.warn('⚠️  Queue service failed to initialize - will fallback to direct processing');
    }
  } catch (error) {
    console.error('❌ Queue service initialization error:', error);
    console.log('📝 Note: Set REDIS_URL environment variable for queue functionality');
  }

  // 301 redirects for legacy URLs (SEO-friendly permanent redirects)
  app.use((req, res, next) => {
    // Normalize path by removing trailing slash for consistent matching
    const normalizedPath = req.path.endsWith('/') && req.path !== '/' ? req.path.slice(0, -1) : req.path;
    
    const redirectMap: Record<string, string> = {
      '/compress-free': '/compress/free',
      '/compress-premium': '/compress/pro',
      '/compress-enterprise': '/compress/enterprise',
      '/wordpress/details': '/wordpress-plugin',
      '/wordpress/installation': '/wordpress-plugin/install',
      '/wordpress-installation': '/wordpress-plugin/install',
      '/wordpress/development': '/wordpress-plugin/development',
      '/wordpress-development': '/wordpress-plugin/development',
      '/wordpress-image-plugin': '/wordpress-plugin',
      '/web/overview': '/tools',
      '/web/compress': '/tools',
      '/web/convert': '/tools',
      '/compress-raw-files': '/tools',
      '/bulk-image-compression': '/tools',
      '/terms-of-service': '/legal/terms',
      '/privacy-policy': '/legal/privacy',
      '/cookie-policy': '/legal/cookies',
      '/cancellation-policy': '/legal/cancellation',
      '/payment-protection': '/legal/payment-protection'
    };

    const redirectTo = redirectMap[normalizedPath];
    if (redirectTo) {
      // Preserve query parameters if any
      const queryString = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
      return res.redirect(301, redirectTo + queryString);
    }
    
    next();
  });

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
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
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    
    // Start test-premium expiry checker
    TestPremiumExpiryManager.startExpiryChecker();
  });

  // Graceful shutdown handling
  process.on('SIGTERM', async () => {
    console.log('🔄 Received SIGTERM, shutting down gracefully...');
    await shutdownQueueService();
    server.close(() => {
      console.log('✅ Server shut down gracefully');
      process.exit(0);
    });
  });

  process.on('SIGINT', async () => {
    console.log('🔄 Received SIGINT, shutting down gracefully...');
    await shutdownQueueService();
    server.close(() => {
      console.log('✅ Server shut down gracefully');
      process.exit(0);
    });
  });
})();
