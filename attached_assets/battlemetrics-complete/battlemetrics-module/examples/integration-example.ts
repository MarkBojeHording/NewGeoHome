// Example: How to integrate BattleMetrics module into your application
import express from 'express';
import { BattleMetricsModule } from '../index.js';

// Basic Express app setup
const app = express();
app.use(express.json());

// Initialize BattleMetrics module
const battlemetricsModule = new BattleMetricsModule({
  database: {
    url: process.env.DATABASE_URL || 'postgresql://localhost/myapp'
  },
  session: {
    secret: process.env.SESSION_SECRET || 'your-secret-key'
  }
});

// Initialize the module (starts WebSocket monitoring)
await battlemetricsModule.initialize();

// Setup BattleMetrics routes on your app
battlemetricsModule.setupExpressRoutes(app);

// Your existing app routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Access the module's services in your own routes
app.get('/api/my-custom-stats', async (req, res) => {
  const storage = battlemetricsModule.getStorage();
  const servers = await storage.getAllServers();
  
  // Your custom logic here
  const stats = {
    totalServers: servers.length,
    // Add your own statistics
  };
  
  res.json(stats);
});

// Start your server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('BattleMetrics monitoring active');
});

export default app;