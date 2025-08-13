import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertReportSchema, insertReportTemplateSchema } from "@shared/schema";

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
        throw new Error(`External API error: ${response.status}`);
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
      console.error('Failed to fetch external players:', error);
      res.status(500).json({ error: "Failed to fetch players from external API" });
    }
  });

  // Note: Individual player routes removed - using external API for all player data

  const httpServer = createServer(app);

  return httpServer;
}
