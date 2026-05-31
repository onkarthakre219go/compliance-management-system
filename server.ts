import dotenv from 'dotenv';
import express from 'express';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();
import { createServer as createViteServer } from 'vite';
import { connectDB } from './server/config/db';
import { logger } from './server/utils/logger';
import { requestLogger } from './server/middleware/loggerMiddleware';
import { errorHandler } from './server/middleware/errorMiddleware';
import { ComplianceService } from './server/services/complianceService';
import { startReminderCron } from './server/services/reminderCron';

// Route Imports
import authRoutes from './server/routes/authRoutes';
import clientRoutes from './server/routes/clientRoutes';
import taskRoutes from './server/routes/taskRoutes';
import complianceRoutes from './server/routes/complianceRoutes';
import invoiceRoutes from './server/routes/invoiceRoutes';
import notificationRoutes from './server/routes/notificationRoutes';
import calendarRoutes from './server/routes/calendarRoutes';
import reportRoutes from './server/routes/reportRoutes';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // 1. Initialise system logging & connect database
  logger.info('Initializing Compliance Management System Backend...');
  await connectDB();
  await ComplianceService.ensureDefaultTemplates();
  // Start reminder cron (scans for upcoming due dates and creates notifications)
  startReminderCron();

  // 2. Setup generic middlewares
  app.use(express.json());
  app.use(requestLogger);

  // 3. Mount Backend API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/clients', clientRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/compliance', complianceRoutes);
  app.use('/api/invoices', invoiceRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/calendar', calendarRoutes);
  app.use('/api/reports', reportRoutes);
  // app.use('/api/expenses', require('./server/routes/expenseRoutes').default);

  // Endpoint to fetch recent backend logger events in real-time
  app.get('/api/logs', (req, res) => {
    res.json({
      status: 'success',
      data: {
        logs: logger.getLogs()
      }
    });
  });

  // 4. Vite middleware for frontend SPA integration
  if (process.env.NODE_ENV !== 'production') {
    logger.info('Vite bundler mounted in Development express middleware.');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    logger.info('Asset server mounted in Production express static.');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // 5. Centralized Express Error Handling (must be registered last)
  app.use(errorHandler);

  // 6. Bind listener on configured port
  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Server successfully bound to http://0.0.0.0:${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
  });
}

startServer().catch((err) => {
  console.error('Fatal crash on server lifecycle boot:', err);
});
