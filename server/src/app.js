import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import authRoutes from './routes/auth.js';
import employeeRoutes from './routes/employees.js';
import attendanceRoutes from './routes/attendance.js';
import leaveRoutes from './routes/leave.js';
import payrollRoutes from './routes/payroll.js';
import performanceRoutes from './routes/performance.js';
import recruitmentRoutes from './routes/recruitment.js';
import dashboardRoutes from './routes/dashboard.js';
import aiRoutes from './routes/ai.js';
import { notFound, errorHandler } from './middleware/error.js';

export function createApp() {
  const app = express();

  // CSP disabled so the bundled SPA's assets load without extra config.
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(
    cors({
      origin: process.env.CLIENT_URL || '*',
      credentials: true,
    })
  );
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

  // Basic rate limit to protect against abuse at scale.
  app.use(
    '/api',
    rateLimit({ windowMs: 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false })
  );

  app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

  app.use('/api/auth', authRoutes);
  app.use('/api/employees', employeeRoutes);
  app.use('/api/attendance', attendanceRoutes);
  app.use('/api/leave', leaveRoutes);
  app.use('/api/payroll', payrollRoutes);
  app.use('/api/performance', performanceRoutes);
  app.use('/api/recruitment', recruitmentRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/ai', aiRoutes);

  // In production, serve the built React app from the same origin so the
  // frontend, API and Socket.io all share one URL (no CORS / proxy needed).
  if (process.env.NODE_ENV === 'production') {
    const clientDist = path.resolve(__dirname, '../../client/dist');
    app.use(express.static(clientDist));
    // SPA fallback: any non-API GET returns index.html so client-side routing works.
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) return next();
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
