import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import { config } from './config';
import { requestIdMiddleware } from './middleware/requestId.middleware';
import { errorHandler } from './middleware/errorHandler.middleware';
import aiRoutes from './routes/ai.routes';
import healthRoutes from './routes/health.routes';
import { logger } from './utils/logger';

// ─────────────────────────────────────────────────────────────
// App factory – exported for use in tests
// ─────────────────────────────────────────────────────────────

export function createApp(): Application {
  const app = express();

  // ── Security headers ─────────────────────────────────────
  app.use(helmet());

  // ── CORS ─────────────────────────────────────────────────
  // Android native apps don't send an Origin header, so CORS
  // mainly protects future web clients.
  const allowedOrigins = config.cors.allowedOrigins;

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, Postman)
        if (!origin) return callback(null, true);
        // Allow configured origins
        if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        callback(new Error(`CORS: origin ${origin} is not allowed.`));
      },
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type'],
    })
  );

  // ── Request ID ───────────────────────────────────────────
  app.use(requestIdMiddleware);

  // ── Body parsing (with size limit) ───────────────────────
  app.use(express.json({ limit: '16kb' }));
  app.use(express.urlencoded({ extended: false, limit: '16kb' }));

  // ── Rate limiting ─────────────────────────────────────────
  const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        error: 'Too many requests. Please slow down.',
      });
    },
  });

  app.use('/api', limiter);

  // ── Routes ────────────────────────────────────────────────
  app.use('/health', healthRoutes);
  app.use('/api/ai', aiRoutes);

  // ── 404 handler ───────────────────────────────────────────
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ success: false, error: 'Route not found.' });
  });

  // ── Central error handler ─────────────────────────────────
  // Must be registered last and have 4 parameters
  app.use(errorHandler);

  return app;
}

const app = createApp();

export default app;

// ─────────────────────────────────────────────────────────────
// Start server (only when this file is the entry point)
// ─────────────────────────────────────────────────────────────

if (require.main === module) {
  const port = config.server.port;

  // Bind to 0.0.0.0 so Android devices on the same LAN can reach the server.
  // - Android Emulator uses: http://10.0.2.2:5000
  // - Physical device on same Wi-Fi uses: http://<YOUR_LAN_IP>:5000
  //   Find your LAN IP with: ipconfig (Windows) or ifconfig (Mac/Linux)
  app.listen(port, '0.0.0.0', () => {
    logger.info('server_started', {
      port,
      env: config.server.nodeEnv,
      provider: config.ai.provider,
    });
    console.log(`\n🚀  AI Keyboard Backend running`);
    console.log(`   Local    : http://localhost:${port}`);
    console.log(`   LAN      : http://0.0.0.0:${port}  (use your PC's LAN IP for physical devices)`);
    console.log(`   Emulator : http://10.0.2.2:${port}`);
    console.log(`   Provider : ${config.ai.provider}`);
    console.log(`   Env      : ${config.server.nodeEnv}`);
    console.log(`   Health   : GET  http://localhost:${port}/health`);
    console.log(`   Rewrite  : POST http://localhost:${port}/api/ai/rewrite\n`);
  });
}
