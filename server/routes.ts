import type { Express } from "express";
import { createServer, type Server } from "http";
import path from "path";

import { BattleMetricsService } from "./services/battlemetrics";
import { PlayerActivityTracker } from "./services/playerActivityTracker";
import { mapStorageService } from "./services/mapStorage";
import { globalWebSocketManager } from "./services/websocketManager";
import { BackupManager } from "./services/backupManager";
import {
  serverSchema,
  playerSchema,
  addServerSchema,
  serverStatsSchema,
  createTeamSchema,
  createUserSchema,
  addTeamMemberSchema,
} from "@shared/schema";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { storage } from "./storage";
import { buildMapImage } from "./services/tile";
import { db } from "./db";
import { servers, playerActivities, playerSessions, playerProfiles, maps } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

// Initialize the player activity tracker
const playerActivityTracker = new PlayerActivityTracker();

// Initialize the backup manager with fallback support
const backupManager = new BackupManager(globalWebSocketManager);

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication middleware
  try {
    await setupAuth(app);
  } catch (error) {
    console.log('⚠️ Authentication setup failed, continuing without auth:', error.message);
  }

  // Initialize services with error handling
  let battleMetricsService: any = null;
  try {
    battleMetricsService = new BattleMetricsService();
  } catch (error) {
    console.log('⚠️ BattleMetrics service failed to initialize:', error.message);
  }

  // Initialize backup manager system
  try {
    console.log('🚀 [Startup] Starting backup management system...');
    backupManager.start();
  } catch (error) {
    console.log('⚠️ Backup manager failed to start:', error.message);
  }

  // Authentication routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Team Management Routes - PROTECTED

  // Get all users
  app.get('/api/admin/users', isAuthenticated, async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Create a new user
  app.post('/api/admin/users', isAuthenticated, async (req: any, res) => {
    try {
      const userData = createUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(400).json({
        message: error instanceof Error ? error.message : "Failed to create user"
      });
    }
  });

  // Update user
  app.put('/api/admin/users/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const userData = createUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(userId, userData);
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(400).json({
        message: error instanceof Error ? error.message : "Failed to update user"
      });
    }
  });

  // Delete user (soft delete)
  app.delete('/api/admin/users/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const { userId } = req.params;
      await storage.deleteUser(userId);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Get all teams
  app.get('/api/admin/teams', isAuthenticated, async (req: any, res) => {
    try {
      const teams = await storage.getAllTeams();
      res.json(teams);
    } catch (error) {
      console.error("Error fetching teams:", error);
      res.status(500).json({ message: "Failed to fetch teams" });
    }
  });

  // Create a new team
  app.post('/api/admin/teams', isAuthenticated, async (req: any, res) => {
    try {
      const teamData = createTeamSchema.parse(req.body);
      const team = await storage.createTeam(teamData);
      res.status(201).json(team);
    } catch (error) {
      console.error("Error creating team:", error);
      res.status(400).json({
        message: error instanceof Error ? error.message : "Failed to create team"
      });
    }
  });

  // Update team
  app.put('/api/admin/teams/:teamId', isAuthenticated, async (req: any, res) => {
    try {
      const { teamId } = req.params;
      const teamData = createTeamSchema.partial().parse(req.body);
      const team = await storage.updateTeam(teamId, teamData);
      res.json(team);
    } catch (error) {
      console.error("Error updating team:", error);
      res.status(400).json({
        message: error instanceof Error ? error.message : "Failed to update team"
      });
    }
  });

  // Delete team
  app.delete('/api/admin/teams/:teamId', isAuthenticated, async (req: any, res) => {
    try {
      const { teamId } = req.params;
      await storage.deleteTeam(teamId);
      res.json({ message: "Team deleted successfully" });
    } catch (error) {
      console.error("Error deleting team:", error);
      res.status(500).json({ message: "Failed to delete team" });
    }
  });

  // Get team members
  app.get('/api/admin/teams/:teamId/members', isAuthenticated, async (req: any, res) => {
    try {
      const { teamId } = req.params;
      const members = await storage.getTeamMembers(teamId);
      res.json(members);
    } catch (error) {
      console.error("Error fetching team members:", error);
      res.status(500).json({ message: "Failed to fetch team members" });
    }
  });

  // Add team member
  app.post('/api/admin/teams/:teamId/members', isAuthenticated, async (req: any, res) => {
    try {
      const { teamId } = req.params;
      const memberData = addTeamMemberSchema.parse(req.body);
      const member = await storage.addTeamMember(teamId, memberData);
      res.status(201).json(member);
    } catch (error) {
      console.error("Error adding team member:", error);
      res.status(400).json({
        message: error instanceof Error ? error.message : "Failed to add team member"
      });
    }
  });

  // Update team member role
  app.put('/api/admin/teams/:teamId/members/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const { teamId, userId } = req.params;
      const { role } = req.body;
      const member = await storage.updateTeamMemberRole(teamId, userId, role);
      res.json(member);
    } catch (error) {
      console.error("Error updating team member role:", error);
      res.status(400).json({
        message: error instanceof Error ? error.message : "Failed to update team member role"
      });
    }
  });

  // Remove team member
  app.delete('/api/admin/teams/:teamId/members/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const { teamId, userId } = req.params;
      await storage.removeTeamMember(teamId, userId);
      res.json({ message: "Team member removed successfully" });
    } catch (error) {
      console.error("Error removing team member:", error);
      res.status(500).json({ message: "Failed to remove team member" });
    }
  });

  // Server Management Routes

  // Get all servers
  app.get('/api/servers', async (req, res) => {
    try {
      const serverList = await db.select().from(servers);
      res.json(serverList);
    } catch (error) {
      console.error("Error fetching servers:", error);
      res.status(500).json({ message: "Failed to fetch servers" });
    }
  });

  // Add a new server
  app.post('/api/servers', async (req, res) => {
    try {
      const serverData = addServerSchema.parse(req.body);

      // Validate server with BattleMetrics
      const serverInfo = await battleMetricsService.getServer(serverData.id);
      if (!serverInfo) {
        return res.status(400).json({ message: "Invalid server ID or server not found" });
      }

      // Store server in database
      const [server] = await db.insert(servers).values({
        id: serverData.id,
        name: serverInfo.name || `Server ${serverData.id}`,
        game: 'rust',
        status: 'online',
        players: 0,
        max_players: serverInfo.maxPlayers || 100,
        battle_metrics_url: serverInfo.url || '',
        map_info: {
          map: serverInfo.map || 'Unknown',
          seed: serverInfo.seed || 0,
          size: serverInfo.size || 0
        },
        last_checked: new Date(),
        added_at: new Date(),
        is_active: true
      }).returning();

      // Subscribe to real-time updates
      globalWebSocketManager.subscribeToServer(server.id);

      res.status(201).json(server);
    } catch (error) {
      console.error("Error adding server:", error);
      res.status(400).json({
        message: error instanceof Error ? error.message : "Failed to add server"
      });
    }
  });

  // Delete a server
  app.delete('/api/servers/:serverId', async (req, res) => {
    try {
      const { serverId } = req.params;

      // Unsubscribe from real-time updates
      globalWebSocketManager.unsubscribeFromServer(serverId);

      // Remove from database
      await db.delete(servers).where(eq(servers.id, serverId));

      res.json({ message: "Server removed successfully" });
    } catch (error) {
      console.error("Error removing server:", error);
      res.status(500).json({ message: "Failed to remove server" });
    }
  });

  // Get server players
  app.get('/api/servers/:serverId/players', async (req, res) => {
    try {
      const { serverId } = req.params;
      const players = await battleMetricsService.getPlayers(serverId);
      res.json(players);
    } catch (error) {
      console.error("Error fetching server players:", error);
      res.status(500).json({ message: "Failed to fetch server players" });
    }
  });

  // Get server stats
  app.get('/api/servers/:serverId/stats', async (req, res) => {
    try {
      const { serverId } = req.params;
      const stats = await battleMetricsService.getServerStats(serverId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching server stats:", error);
      res.status(500).json({ message: "Failed to fetch server stats" });
    }
  });

  // Get server map image
  app.get('/api/servers/:serverId/map', async (req, res) => {
    try {
      const { serverId } = req.params;
      const { width = 1024, height = 1024 } = req.query;

      // Check if we have a cached map
      const existingMap = await mapStorageService.getMapImage(serverId);
      if (existingMap) {
        return res.json({
          image: existingMap.image,
          width: existingMap.width,
          height: existingMap.height,
          cached: true
        });
      }

      // Fetch from RustMaps if not cached
      const mapImage = await buildMapImage(serverId, parseInt(width as string), parseInt(height as string));
      if (!mapImage) {
        return res.status(404).json({ message: "Map not found" });
      }

      // Store in cache - convert buffer to base64 string
      const base64Image = mapImage.toString('base64');
      await mapStorageService.storeMapImage({
        serverId,
        imageData: base64Image,
        imageUrl: `https://maps.rustmaps.com/map/${serverId}`,
        size: parseInt(width as string)
      });

      res.json({
        image: mapImage,
        width: parseInt(width as string),
        height: parseInt(height as string),
        cached: false
      });
    } catch (error) {
      console.error("Error fetching server map:", error);
      res.status(500).json({ message: "Failed to fetch server map" });
    }
  });

  // Database Metrics
  app.get('/api/database/metrics', async (req, res) => {
    try {
      const [serverCount] = await db.select({ count: sql`count(*)` }).from(servers);
      const [playerCount] = await db.select({ count: sql`count(*)` }).from(playerProfiles);
      const [sessionCount] = await db.select({ count: sql`count(*)` }).from(playerSessions);
      const [activityCount] = await db.select({ count: sql`count(*)` }).from(playerActivities);
      const [mapCount] = await db.select({ count: sql`count(*)` }).from(maps);

      res.json({
        servers: serverCount.count,
        players: playerCount.count,
        sessions: sessionCount.count,
        activities: activityCount.count,
        maps: mapCount.count,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error fetching database metrics:", error);
      res.status(500).json({ message: "Failed to fetch database metrics" });
    }
  });

  // Admin cleanup route
  app.delete("/api/admin/delete-all-data", isAuthenticated, async (req, res) => {
    try {
      // Clear all data (use with caution!)
      await db.delete(servers);
      await db.delete(playerProfiles);
      await db.delete(playerSessions);
      await db.delete(playerActivities);
      await db.delete(maps);

      res.json({ message: "All data cleared successfully" });
    } catch (error) {
      console.error("Error clearing data:", error);
      res.status(500).json({ message: "Failed to clear data" });
    }
  });

  // WebSocket endpoint
  app.get('/api/ws', (req, res) => {
    res.json({ message: "WebSocket endpoint - use ws:// protocol" });
  });

    // Health check
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version
    });
  });

  // Serve admin interface - serve the built frontend for admin routes
  app.get('/admin', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'dist/public/index.html'));
  });

  app.get('/admin/*', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'dist/public/index.html'));
  });

  // Create HTTP server
  const server = createServer(app);

  // Setup WebSocket handlers
  globalWebSocketManager.attach(server);

  return server;
}
