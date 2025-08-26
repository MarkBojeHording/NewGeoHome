import { pgTable, text, integer, timestamp, boolean, real, uuid, primaryKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table - for authentication
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Bases table - for tactical map bases
export const bases = pgTable("bases", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  position: text("position").notNull(), // JSON string for coordinates
  type: text("type").notNull(), // "friendly", "enemy", "neutral"
  description: text("description"),
  rocketCount: integer("rocket_count").default(0),
  ammoCount: integer("ammo_count").default(0),
  upkeepDays: integer("upkeep_days").default(0),
  heat: real("heat").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  owners: text("owners").array().default([]), // Array of owner names
});

// Reports table - for tactical reports
export const reports = pgTable("reports", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  reportType: text("report_type").notNull(), // "general", "base", "action"
  reportDate: timestamp("report_date").notNull(),
  reportTime: text("report_time").notNull(), // "24hr_format"
  taggedPlayers: text("tagged_players").array().default([]), // Array of player names
  taggedBases: text("tagged_bases").array().default([]), // Array of base IDs
  outcome: text("outcome"), // For action reports only
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Report templates table
export const reportTemplates = pgTable("report_templates", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  reportType: text("report_type").notNull().unique(),
  template: text("template").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Premium players table
export const premiumPlayers = pgTable("premium_players", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  playerName: text("player_name").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastSeen: timestamp("last_seen"),
});

// Player base tags table - for tracking which players are associated with which bases
export const playerBaseTags = pgTable("player_base_tags", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  playerName: text("player_name").notNull(),
  baseId: text("base_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Player profiles table - for tracking player statistics
export const playerProfiles = pgTable("player_profiles", {
  id: text("id").primaryKey(),
  playerName: text("player_name").notNull().unique(),
  serverId: text("server_id").notNull(),
  playerId: text("player_id"),
  isOnline: boolean("is_online").default(false),
  currentSessionStart: timestamp("current_session_start"),
  lastJoinTime: timestamp("last_join_time"),
  lastLeaveTime: timestamp("last_leave_time"),
  lastSeenTime: timestamp("last_seen_time").notNull(),
  totalSessions: integer("total_sessions").default(0),
  totalPlayTimeMinutes: integer("total_play_time_minutes").default(0),
  lastKnownRank: integer("last_known_rank"),
  lastKnownScore: integer("last_known_score"),
  firstSeenAt: timestamp("first_seen_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ServerBeacon servers table - for monitored servers
export const serverBeaconServers = pgTable("serverbeacon_servers", {
  id: text("id").primaryKey(), // BattleMetrics server ID
  name: text("name").notNull(),
  game: text("game").notNull(),
  region: text("region"),
  addedAt: timestamp("added_at").defaultNow().notNull(),
  lastChecked: timestamp("last_checked"),
  isActive: boolean("is_active").default(true).notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  bases: many(bases),
  reports: many(reports),
}));

export const basesRelations = relations(bases, ({ one, many }) => ({
  reports: many(reports),
  playerBaseTags: many(playerBaseTags),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  author: one(users, {
    fields: [reports.id],
    references: [users.id],
  }),
}));

export const playerBaseTagsRelations = relations(playerBaseTags, ({ one }) => ({
  base: one(bases, {
    fields: [playerBaseTags.baseId],
    references: [bases.id],
  }),
}));

// Create insert schemas
export const insertUserSchema = createInsertSchema(users);
export const insertBaseSchema = createInsertSchema(bases);
export const insertReportSchema = createInsertSchema(reports);
export const insertReportTemplateSchema = createInsertSchema(reportTemplates);
export const insertPremiumPlayerSchema = createInsertSchema(premiumPlayers);
export const insertPlayerBaseTagSchema = createInsertSchema(playerBaseTags);
export const insertPlayerProfileSchema = createInsertSchema(playerProfiles);

// Infer types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type UpsertUser = typeof users.$inferInsert;
export type Base = typeof bases.$inferSelect;
export type InsertBase = typeof bases.$inferInsert;
export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;
export type ReportTemplate = typeof reportTemplates.$inferSelect;
export type InsertReportTemplate = typeof reportTemplates.$inferInsert;
export type PremiumPlayer = typeof premiumPlayers.$inferSelect;
export type InsertPremiumPlayer = typeof premiumPlayers.$inferInsert;
export type PlayerBaseTag = typeof playerBaseTags.$inferSelect;
export type InsertPlayerBaseTag = typeof playerBaseTags.$inferInsert;
export type PlayerProfile = typeof playerProfiles.$inferSelect;
export type InsertPlayerProfile = typeof playerProfiles.$inferInsert;
export type InsertDBPlayerProfile = typeof playerProfiles.$inferInsert;

// Additional schemas for API responses
export const mapInfoSchema = z.object({
  name: z.string(),
  seed: z.number().optional(),
  size: z.number().optional(),
  entityCount: z.number().optional(),
  monuments: z.number().optional(),
  url: z.string().optional(),
  imageUrl: z.string().optional(),
  thumbnailUrl: z.string().optional(),
});

export const serverSchema = z.object({
  id: z.string(),
  name: z.string(),
  game: z.string(),
  region: z.string().optional(),
  status: z.enum(["online", "offline"]),
  players: z.number(),
  maxPlayers: z.number(),
  rank: z.number().optional(),
  mapInfo: mapInfoSchema.optional(),
  gameMode: z.string().optional(),
  version: z.string().optional(),
  lastWipe: z.string().optional(),
  details: z.record(z.any()).optional(),
  ping: z.number().optional(),
  lastSeen: z.string().optional(),
  queueCount: z.number().optional(),
  errorMessage: z.string().optional(),
});

export const playerSchema = z.object({
  id: z.string(),
  name: z.string(),
  sessionTime: z.string(),
  joinTime: z.string(),
  private: z.boolean().optional(),
});

export const activitySchema = z.object({
  id: z.string(),
  playerName: z.string(),
  action: z.enum(["joined", "left"]),
  timestamp: z.string(),
});

export const serverStatsSchema = z.object({
  joinedToday: z.number(),
  avgSessionTime: z.string(),
  peakToday: z.number(),
});

export const addServerSchema = z.object({
  url: z.string().url("Must be a valid URL"),
  serverId: z.string().min(1, "Server ID is required"),
});

export const serverListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  game: z.string(),
  region: z.string().optional(),
  status: z.enum(["online", "offline"]),
  players: z.number(),
  maxPlayers: z.number(),
  ping: z.number().optional(),
  errorMessage: z.string().optional(),
  mapFetched: z.boolean(),
  lastChecked: z.string(),
  addedAt: z.string(),
});

export const playerProfileSchema = z.object({
  id: z.string(),
  serverId: z.string(),
  playerName: z.string(),
  playerId: z.string().optional(),
  isOnline: z.boolean(),
  currentSessionStart: z.string().optional(),
  lastJoinTime: z.string().optional(),
  lastLeaveTime: z.string().optional(),
  lastSeenTime: z.string(),
  totalSessions: z.number(),
  totalPlayTimeMinutes: z.number(),
  lastKnownRank: z.number().optional(),
  lastKnownScore: z.number().optional(),
  firstSeenAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const playerActivitySchema = z.object({
  id: z.string(),
  profileId: z.string().optional(),
  sessionId: z.string().optional(),
  serverId: z.string(),
  playerName: z.string(),
  playerId: z.string().optional(),
  action: z.enum(["joined", "left"]),
  timestamp: z.string(),
  playerRank: z.number().optional(),
  playerScore: z.number().optional(),
});

export const playerSessionSchema = z.object({
  id: z.string(),
  profileId: z.string(),
  serverId: z.string(),
  playerName: z.string(),
  playerId: z.string().optional(),
  joinTime: z.string(),
  leaveTime: z.string().optional(),
  durationMinutes: z.number().optional(),
  isActive: z.boolean(),
  playerRank: z.number().optional(),
  playerScore: z.number().optional(),
  sessionType: z.string().optional(),
});

export const createTeamSchema = z.object({
  name: z.string().min(1, "Team name is required").max(100, "Team name too long"),
  description: z.string().optional(),
});

export type MapInfo = z.infer<typeof mapInfoSchema>;
export type Server = z.infer<typeof serverSchema>;
export type Player = z.infer<typeof playerSchema>;
export type Activity = z.infer<typeof activitySchema>;
export type ServerStats = z.infer<typeof serverStatsSchema>;
export type AddServerRequest = z.infer<typeof addServerSchema>;
export type ServerListItem = z.infer<typeof serverListItemSchema>;
export type PlayerActivityType = z.infer<typeof playerActivitySchema>;
export type PlayerSession = z.infer<typeof playerSessionSchema>;