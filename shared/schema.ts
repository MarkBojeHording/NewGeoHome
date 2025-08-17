import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Centralized Reports table for all report types
export const reports = pgTable("reports", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: text("title").notNull(),
  reportType: text("report_type").notNull(), // 'general', 'base', 'action'
  reportSubType: text("report_sub_type"), // 'pvp-general', 'spotted-enemy', 'raid-counter', etc.
  locationName: text("location_name"), // Associated location/base name
  locationCoords: text("location_coords"), // Grid coordinates like "A1"
  baseId: text("base_id"), // Unique base identifier for reliable linking
  notes: text("notes"), // Main text content from notes field
  outcome: text("outcome"), // 'good', 'neutral', 'bad' for event reports
  
  // Tagging system for different entity types
  playerTags: text("player_tags").array().default(sql`'{}'`), // Players involved in report
  baseTags: text("base_tags").array().default(sql`'{}'`), // Bases associated with report
  userTags: text("user_tags").array().default(sql`'{}'`), // Users who created/completed (for action reports)
  
  // Media support
  screenshots: text("screenshots").array().default(sql`'{}'`), // Array of screenshot file paths
  hasMedia: boolean("has_media").default(false), // Quick check for media presence
  
  // Legacy support and flexible content
  content: jsonb("content"), // Flexible JSON for type-specific data
  tags: text("tags").array(), // Legacy tags field
  
  priority: text("priority").default("medium"), // low, medium, high, critical
  status: text("status").default("active"), // active, completed, archived
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Standard report templates
export const reportTemplates = pgTable("report_templates", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  reportType: text("report_type").notNull(),
  template: jsonb("template").notNull(), // JSON structure defining fields
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertReportSchema = createInsertSchema(reports).omit({ id: true, createdAt: true, updatedAt: true });
export const selectReportSchema = createInsertSchema(reports);
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;

export const insertReportTemplateSchema = createInsertSchema(reportTemplates).omit({ id: true, createdAt: true });
export const selectReportTemplateSchema = createInsertSchema(reportTemplates);
export type InsertReportTemplate = z.infer<typeof insertReportTemplateSchema>;
export type ReportTemplate = typeof reportTemplates.$inferSelect;

// Premium players table for tracking Battlemetrics premium users
export const premiumPlayers = pgTable("premium_players", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  playerName: text("player_name").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPremiumPlayerSchema = createInsertSchema(premiumPlayers).omit({ id: true, createdAt: true });
export type InsertPremiumPlayer = z.infer<typeof insertPremiumPlayerSchema>;
export type PremiumPlayer = typeof premiumPlayers.$inferSelect;

// Player base associations table for tracking which players are tagged with which bases
export const playerBaseTags = pgTable("player_base_tags", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  playerName: text("player_name").notNull(),
  baseId: text("base_id").notNull(), // Links to the base unique ID
  baseName: text("base_name").notNull(), // Base name for display (e.g., "A1", "B3(2)")
  baseType: text("base_type").notNull(), // enemy-small, friendly-main, etc.
  taggedAt: timestamp("tagged_at").defaultNow(),
});

export const insertPlayerBaseTagSchema = createInsertSchema(playerBaseTags).omit({ id: true, taggedAt: true });
export type InsertPlayerBaseTag = z.infer<typeof insertPlayerBaseTagSchema>;
export type PlayerBaseTag = typeof playerBaseTags.$inferSelect;

// External player data structure to match your API
export const externalPlayerSchema = z.object({
  playerName: z.string(),
  isOnline: z.boolean(),
  totalSessions: z.number(),
  // Add other fields as needed from your API
});

export type ExternalPlayer = z.infer<typeof externalPlayerSchema>;
