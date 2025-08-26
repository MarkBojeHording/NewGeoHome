import type { Express } from "express";
import type { IStorage } from "../storage/storage";

export function setupBattleMetricsRoutes(app: Express, storage: IStorage) {
  // Server management routes
  app.get('/api/servers', async (req, res) => {
    try {
      const servers = await storage.getAllServers();
      res.json(servers);
    } catch (error) {
      console.error('Error fetching servers:', error);
      res.status(500).json({ error: 'Failed to fetch servers' });
    }
  });

  app.post('/api/servers', async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: 'URL is required' });
      }
      
      const server = await storage.createServer({ url });
      res.status(201).json(server);
    } catch (error) {
      console.error('Error creating server:', error);
      res.status(500).json({ error: 'Failed to create server' });
    }
  });

  app.delete('/api/servers/:id', async (req, res) => {
    try {
      await storage.deleteServer(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting server:', error);
      res.status(500).json({ error: 'Failed to delete server' });
    }
  });

  // Player profile routes
  app.get('/api/servers/:serverId/profiles', async (req, res) => {
    try {
      const profiles = await storage.getPlayerProfiles(req.params.serverId);
      res.json(profiles);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      res.status(500).json({ error: 'Failed to fetch profiles' });
    }
  });

  app.get('/api/profiles/:profileId/sessions', async (req, res) => {
    try {
      const sessions = await storage.getPlayerSessions(req.params.profileId);
      res.json(sessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      res.status(500).json({ error: 'Failed to fetch sessions' });
    }
  });

  // Public routes (no auth required)
  app.get('/api/public/servers/:serverId/profiles', async (req, res) => {
    try {
      const profiles = await storage.getPlayerProfiles(req.params.serverId);
      res.json(profiles);
    } catch (error) {
      console.error('Error fetching public profiles:', error);
      res.status(500).json({ error: 'Failed to fetch profiles' });
    }
  });

  // Database metrics
  app.get('/api/database/metrics', async (req, res) => {
    try {
      const metrics = await storage.getDatabaseMetrics();
      res.json(metrics);
    } catch (error) {
      console.error('Error fetching database metrics:', error);
      res.status(500).json({ error: 'Failed to fetch metrics' });
    }
  });
}