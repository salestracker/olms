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

// Create root router combining various modules - similar to lumos-ts router registry
const appRouter = t.router({
  orders: ordersRouter,
  users: usersRouter,
  erp: erpRouter
});

// Export type definition of API
export type AppRouter = typeof appRouter;

// Initialize database
console.log('Initializing database...');
initDatabase();
console.log('Database initialized!');

// Initialize Express app with middleware
const app = express();

// Configure middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(express.static('public')); // Serve files from public directory

// Add lumos-ts-like request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Add a test endpoint to verify the server is working
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    version: '1.0.0',
    auth: 'enabled'
  });
});

// Configure TRPC with auth context
// Add middleware to log raw request bodies for debugging
app.use((req: any, res: any, next: any) => {
  // Store original body parser methods
  const originalJson = req.json;
  const originalRaw = req.raw;
  
  // Log raw request bodies
  if (req.method === 'POST' && req.url.includes('/trpc/users.login')) {
    let data = '';
    req.on('data', (chunk: any) => {
      data += chunk;
    });
    
    req.on('end', () => {
      if (data) {
        console.log('Raw request body for login:', data);
        try {
          const parsedData = JSON.parse(data);
          console.log('Parsed login request:', parsedData);
          if (parsedData.json) {
            console.log('Login credentials found:', parsedData.json);
          } else {
            console.log('Missing json field in request body');
          }
        } catch (e) {
          console.error('Could not parse request body as JSON');
        }
      }
    });
  }
  
  next();
});

app.use(
  '/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext, // Using lumos-ts auth context
  })
);

// Setup ERP endpoints with lumos-ts ERP integration service
app.get('/api/erp/logicmate/status', async (req, res) => {
  try {
    const logicMateStatus = await erpService.logicMate.syncOrders();
    res.json({
      connected: true,
      lastSync: new Date().toISOString(),
      data: logicMateStatus
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
      data: suntecStatus
    });
  } catch (error) {
    res.status(500).json({ connected: false, error: 'Failed to connect to Suntec ERP' });
  }
});

// Combined ERP sync endpoint
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
