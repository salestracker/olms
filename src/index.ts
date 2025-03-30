import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { t, createContext } from './core/trpc';
import { ordersRouter } from './modules/orders';
import { usersRouter } from './modules/users';
import { erpRouter } from './modules/erp';
import { erpService } from './integrations/erp';
import { initDatabase } from './database';

// Assemble the root router with lumos‑ts integration.
const appRouter = t.router({
  orders: ordersRouter,
  users: usersRouter,
  erp: erpRouter,
});

export type AppRouter = typeof appRouter;

// Initialize the database.
console.log('Initializing database...');
initDatabase();
console.log('Database initialized!');

const app = express();

// Set up essential middleware.
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(express.static('public'));

// Log each request with a timestamp.
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Test endpoint to verify server health.
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Server is running',
    version: '1.0.0',
    auth: 'enabled',
  });
});

// Example: Additional request body logging for debugging login requests.
app.use((req: any, res: any, next: any) => {
  if (req.method === 'POST' && req.url.includes('/trpc/users.login')) {
    let data = '';
    req.on('data', (chunk: any) => {
      data += chunk;
    });
    req.on('end', () => {
      if (data) {
        console.log('Raw login request body:', data);
      }
    });
  }
  next();
});

// Bind the TRPC middleware with the lumos‑ts context.
app.use(
  '/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// ERP integration endpoints using lumos‑ts ERP service.
app.get('/api/erp/logicmate/status', async (req, res) => {
  try {
    const logicMateStatus = await erpService.logicMate.syncOrders();
    res.json({
      connected: true,
      lastSync: new Date().toISOString(),
      data: logicMateStatus,
    });
  } catch (error) {
    res.status(500).json({ connected: false, error: 'Failed to connect to LogicMate ERP' });
  }
});

app.get('/api/erp/suntec/status', async (req, res) => {
  try {
    const suntecStatus = await erpService.suntec.getFactoryStatus();
    res.json({
      connected: true,
      lastSync: new Date().toISOString(),
      data: suntecStatus,
    });
  } catch (error) {
    res.status(500).json({ connected: false, error: 'Failed to connect to Suntec ERP' });
  }
});

// A combined ERP sync endpoint.
app.get('/api/erp/sync', async (req, res) => {
  try {
    const syncResult = await erpService.syncAllSystems();
    res.json(syncResult);
  } catch (error) {
    res.status(500).json({ success: false, error: 'ERP sync failed' });
  }
});

const port = 4000;
app.listen(port, () => {
  console.log(`Zenith OLMS server running on port ${port} with lumos-ts integration`);
});