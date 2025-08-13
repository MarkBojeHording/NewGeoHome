import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertReportSchema, insertReportTemplateSchema, insertPremiumPlayerSchema, insertPlayerBaseTagSchema } from "@shared/schema";

// TEMPORARY FAKE DATA FUNCTIONS - TO BE DELETED LATER
function getTempFakePlayers() {
  const onlinePlayers = ["timtom", "billybob", "123", "jack56", "deeznutz yomumma", "IaMyOuRdAdDy", "stimsack", "bobthebuilder", "chax"];
  const offlinePlayers = ["Fanbo", "Rickybobby", "elflord", "i8urmomsbutt", "rockstar", "scubasteffan"];
  
  const players = [];
  let id = 1;
  
  // Add online players
  onlinePlayers.forEach(name => {
    players.push({
      id: id++,
      playerName: name,
      isOnline: true,
      totalSessions: Math.floor(Math.random() * (100 - 30) + 30) // Random 30-100 hours
    });
  });
  
  // Add offline players
  offlinePlayers.forEach(name => {
    players.push({
      id: id++,
      playerName: name,
      isOnline: false,
      totalSessions: Math.floor(Math.random() * (100 - 30) + 30) // Random 30-100 hours
    });
  });
  
  return players;
}

function generateFakeSessionHistory(playerName: string) {
  const sessions = [];
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  // Generate 5-15 random sessions over the last week
  const sessionCount = Math.floor(Math.random() * 11) + 5;
  
  for (let i = 0; i < sessionCount; i++) {
    // Random date within the last week
    const sessionDate = new Date(oneWeekAgo.getTime() + Math.random() * (now.getTime() - oneWeekAgo.getTime()));
    
    // Random session duration between 1-8 hours
    const durationHours = Math.floor(Math.random() * 8) + 1;
    
    sessions.push({
      id: i + 1,
      playerName,
      startTime: sessionDate.toISOString(),
      endTime: new Date(sessionDate.getTime() + durationHours * 60 * 60 * 1000).toISOString(),
      durationHours,
      server: "US West",
      status: "completed"
    });
  }
  
  // Sort by most recent first
  return sessions.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
}
// END TEMPORARY FAKE DATA FUNCTIONS

export async function registerRoutes(app: Express): Promise<Server> {
  // Reports API routes
  
  // Get all reports
  app.get("/api/reports", async (req, res) => {
    try {
      const reports = await storage.getAllReports();
      res.json(reports);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reports" });
    }
  });

  // Get reports by type
  app.get("/api/reports/type/:type", async (req, res) => {
    try {
      const { type } = req.params;
      const reports = await storage.getReportsByType(type);
      res.json(reports);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reports by type" });
    }
  });

  // Get reports by location
  app.get("/api/reports/location/:location", async (req, res) => {
    try {
      const { location } = req.params;
      const reports = await storage.getReportsByLocation(location);
      res.json(reports);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reports by location" });
    }
  });

  // Get specific report
  app.get("/api/reports/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const report = await storage.getReport(id);
      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch report" });
    }
  });

  // Create new report
  app.post("/api/reports", async (req, res) => {
    try {
      const validatedData = insertReportSchema.parse(req.body);
      const report = await storage.createReport(validatedData);
      res.status(201).json(report);
    } catch (error) {
      res.status(400).json({ error: "Invalid report data" });
    }
  });

  // Update report
  app.put("/api/reports/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertReportSchema.partial().parse(req.body);
      const report = await storage.updateReport(id, validatedData);
      res.json(report);
    } catch (error) {
      res.status(400).json({ error: "Failed to update report" });
    }
  });

  // Delete report
  app.delete("/api/reports/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteReport(id);
      if (!success) {
        return res.status(404).json({ error: "Report not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete report" });
    }
  });

  // Report Templates API routes
  
  // Get all templates
  app.get("/api/report-templates", async (req, res) => {
    try {
      const templates = await storage.getAllReportTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  });

  // Get template by type
  app.get("/api/report-templates/:type", async (req, res) => {
    try {
      const { type } = req.params;
      const template = await storage.getReportTemplateByType(type);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch template" });
    }
  });

  // Create new template
  app.post("/api/report-templates", async (req, res) => {
    try {
      const validatedData = insertReportTemplateSchema.parse(req.body);
      const template = await storage.createReportTemplate(validatedData);
      res.status(201).json(template);
    } catch (error) {
      res.status(400).json({ error: "Invalid template data" });
    }
  });

  // Players API routes
  
  // Get all players from external API
  app.get("/api/players", async (req, res) => {
    try {
      // Fetch from your external API
      const response = await fetch('https://3de60948-f8d7-4a5d-9537-2286d058f7c0-00-2uooy61mnqc4.janeway.replit.dev/api/public/servers/2933470/profiles');
      
      if (!response.ok) {
        console.log(`External API temporarily unavailable: ${response.status}`);
        // TEMPORARY FAKE DATA - TO BE DELETED LATER
        // Return fake player data while external API is down
        return res.json(getTempFakePlayers());
      }
      
      const externalPlayers = await response.json();
      
      // Transform external data to match our interface
      const players = externalPlayers.map((player: any, index: number) => ({
        id: index + 1, // Generate temporary ID for UI
        playerName: player.playerName,
        isOnline: player.isOnline,
        totalSessions: player.totalSessions,
        // Add any other fields you want to display
      }));
      
      res.json(players);
    } catch (error) {
      console.log('External API temporarily unavailable, returning fake data');
      // TEMPORARY FAKE DATA - TO BE DELETED LATER
      // Return fake player data instead of empty array to keep app functional
      res.json(getTempFakePlayers());
    }
  });

  // TEMPORARY: Get player session history - TO BE DELETED LATER
  app.get("/api/players/:playerName/sessions", async (req, res) => {
    const { playerName } = req.params;
    // Generate fake session history (30-100 hours over last week)
    const sessions = generateFakeSessionHistory(playerName);
    res.json(sessions);
  });

  // Premium Players API routes
  
  // Get all premium players
  app.get("/api/premium-players", async (req, res) => {
    try {
      const premiumPlayers = await storage.getAllPremiumPlayers();
      res.json(premiumPlayers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch premium players" });
    }
  });

  // Create premium player
  app.post("/api/premium-players", async (req, res) => {
    try {
      const validatedData = insertPremiumPlayerSchema.parse(req.body);
      const premiumPlayer = await storage.createPremiumPlayer(validatedData);
      res.status(201).json(premiumPlayer);
    } catch (error) {
      res.status(400).json({ error: "Invalid premium player data" });
    }
  });

  // Get premium player by name
  app.get("/api/premium-players/:name", async (req, res) => {
    try {
      const { name } = req.params;
      const player = await storage.getPremiumPlayerByName(name);
      if (!player) {
        return res.status(404).json({ error: "Premium player not found" });
      }
      res.json(player);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch premium player" });
    }
  });

  // Delete premium player
  app.delete("/api/premium-players/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deletePremiumPlayer(id);
      if (!success) {
        return res.status(404).json({ error: "Premium player not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete premium player" });
    }
  });

  // Player Base Tags API routes
  
  // Get all player base tags
  app.get("/api/player-base-tags", async (req, res) => {
    try {
      const tags = await storage.getAllPlayerBaseTags();
      res.json(tags);
    } catch (error) {
      console.error("Error getting player base tags:", error);
      res.status(500).json({ error: "Failed to get player base tags" });
    }
  });

  // Get tags for a specific player
  app.get("/api/player-base-tags/player/:playerName", async (req, res) => {
    try {
      const tags = await storage.getPlayerBaseTags(req.params.playerName);
      res.json(tags);
    } catch (error) {
      console.error("Error getting player tags:", error);
      res.status(500).json({ error: "Failed to get player tags" });
    }
  });

  // Get tags for a specific base
  app.get("/api/player-base-tags/base/:baseId", async (req, res) => {
    try {
      const tags = await storage.getBasePlayerTags(req.params.baseId);
      res.json(tags);
    } catch (error) {
      console.error("Error getting base tags:", error);
      res.status(500).json({ error: "Failed to get base tags" });
    }
  });

  // Create player base tag
  app.post("/api/player-base-tags", async (req, res) => {
    try {
      const validatedTag = insertPlayerBaseTagSchema.parse(req.body);
      const tag = await storage.createPlayerBaseTag(validatedTag);
      res.status(201).json(tag);
    } catch (error) {
      console.error("Error creating player base tag:", error);
      res.status(400).json({ error: "Failed to create player base tag" });
    }
  });

  // Delete player base tag
  app.delete("/api/player-base-tags/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deletePlayerBaseTag(id);
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Player base tag not found" });
      }
    } catch (error) {
      console.error("Error deleting player base tag:", error);
      res.status(500).json({ error: "Failed to delete player base tag" });
    }
  });

  // Delete all tags for a specific base (used when base is deleted)
  app.delete("/api/player-base-tags/base/:baseId", async (req, res) => {
    try {
      const success = await storage.deletePlayerBaseTagsByBaseId(req.params.baseId);
      res.json({ success });
    } catch (error) {
      console.error("Error deleting base tags:", error);
      res.status(500).json({ error: "Failed to delete base tags" });
    }
  });

  // Note: Individual player routes removed - using external API for regular player data

  const httpServer = createServer(app);

  return httpServer;
}
