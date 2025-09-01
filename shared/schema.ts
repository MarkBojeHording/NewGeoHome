import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb, boolean, uuid, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Groups table for multi-tenancy
export const groups = pgTable("groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  created_by: text("created_by").notNull(), // User ID who created the group
  created_at: timestamp("created_at").defaultNow(),
  is_active: boolean("is_active").default(true),
});

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  // BattleMetrics integration fields
  battlemetrics_id: text("battlemetrics_id"),
  email: text("email"),
  created_at: timestamp("created_at").defaultNow(),
});

// Group membership table
export const groupMembers = pgTable("group_members", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  group_id: text("group_id").references(() => groups.id),
  user_id: text("user_id").notNull().references(() => users.id),
  role: text("role").notNull().default("member"), // "admin", "raider", "scout", "member"
  joined_at: timestamp("joined_at").defaultNow(),
  is_active: boolean("is_active").default(true),
});

// Centralized reports table for all report types
export const reports = pgTable("reports", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  displayId: text("display_id"), // Alphanumeric ID like "RKW6X91"
  type: text("type").notNull(), // "general" | "base" | "task"
  notes: text("notes").notNull(),
  outcome: text("outcome").notNull(), // "good" | "neutral" | "bad"
  playerTags: text("player_tags").array().default([]), // Array of player IDs (legacy)
  enemyPlayers: text("enemy_players").default(""), // Comma-separated enemy player names
  friendlyPlayers: text("friendly_players").default(""), // Comma-separated friendly player names
  baseTags: text("base_tags").array().default([]), // Array of base IDs (only for base reports)
  screenshots: text("screenshots").array().default([]), // Array of image URLs
  location: jsonb("location").notNull(), // {gridX: number, gridY: number}
  createdBy: text("created_by"), // User ID who created the report
  createdAt: timestamp("created_at").defaultNow(),
  completedBy: text("completed_by"), // User ID who completed (only for task reports)
  completedAt: timestamp("completed_at"), // Completion timestamp (only for task reports)
  status: text("status").default("pending"), // "pending" | "completed" | "failed" (only for task reports)
  taskType: text("task_type"), // "needs_pickup" | etc (only for task reports)
  taskData: jsonb("task_data"), // Task-specific data like {pickupType: "loot"} (only for task reports)
  // Multi-tenancy and BattleMetrics integration
  group_id: text("group_id").references(() => groups.id), // Multi-tenancy (optional)
  server_id: text("server_id"), // Link reports to specific servers
});

// Standard report templates
export const reportTemplates = pgTable("report_templates", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  reportType: text("report_type").notNull(),
  template: jsonb("template").notNull(), // JSON structure defining fields
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertReportSchema = createInsertSchema(reports).omit({ id: true, displayId: true, createdAt: true, completedAt: true });
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;

export const insertReportTemplateSchema = createInsertSchema(reportTemplates).omit({ id: true, createdAt: true });
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
  // Multi-tenancy and BattleMetrics integration
  group_id: text("group_id").references(() => groups.id), // Multi-tenancy (optional)
  server_id: text("server_id"), // Link to specific server
});

export const insertPlayerBaseTagSchema = createInsertSchema(playerBaseTags).omit({ id: true, taggedAt: true });
export type InsertPlayerBaseTag = z.infer<typeof insertPlayerBaseTagSchema>;
export type PlayerBaseTag = typeof playerBaseTags.$inferSelect;

// Enhanced player profiles table - merged from both schemas
export const playerProfiles = pgTable("player_profiles", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  playerName: text("player_name").notNull().unique(),
  aliases: text("aliases").default(""), // Comma-separated aliases
  notes: text("notes").default(""),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  // Multi-tenancy and BattleMetrics integration fields
  group_id: text("group_id").references(() => groups.id), // Multi-tenancy (optional)
  server_id: text("server_id"), // Link to specific server
  battlemetrics_id: text("battlemetrics_id"), // BattleMetrics player ID
  is_online: boolean("is_online").default(false), // Current online status
  last_seen: timestamp("last_seen").defaultNow(), // Last seen timestamp
  total_sessions: integer("total_sessions").default(0), // Total sessions count
  total_play_time_minutes: integer("total_play_time_minutes").default(0), // Total play time
  current_session_start: timestamp("current_session_start"), // Current session start
  last_join_time: timestamp("last_join_time"), // Last join time
  last_leave_time: timestamp("last_leave_time"), // Last leave time
  last_known_rank: integer("last_known_rank"), // Last known rank
  last_known_score: integer("last_known_score"), // Last known score
  first_seen_at: timestamp("first_seen_at").defaultNow(), // First seen timestamp
});

export const insertPlayerProfileSchema = createInsertSchema(playerProfiles).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPlayerProfile = z.infer<typeof insertPlayerProfileSchema>;
export type PlayerProfile = typeof playerProfiles.$inferSelect;

// External player data structure to match your API
export const externalPlayerSchema = z.object({
  playerName: z.string(),
  isOnline: z.boolean(),
  totalSessions: z.number(),
  // Add other fields as needed from your API
});

export type ExternalPlayer = z.infer<typeof externalPlayerSchema>;

// Enhanced teams table - merged from both schemas
export const teams = pgTable("teams", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  color: text("color").notNull(), // Hex color for team identification
  mainBaseId: text("main_base_id"), // ID of the main base for this team
  notes: text("notes").default(""),
  createdAt: timestamp("created_at").defaultNow(),
  // Multi-tenancy and BattleMetrics integration fields
  group_id: text("group_id").references(() => groups.id), // Multi-tenancy (optional)
  server_id: text("server_id"), // Link to specific server
  is_active: boolean("is_active").default(false), // Team active status
});

export const insertTeamSchema = createInsertSchema(teams).omit({ id: true, createdAt: true });
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Team = typeof teams.$inferSelect;

// Teammates table for tracking player teammate relationships
export const teammates = pgTable("teammates", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  playerName: text("player_name").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
  // Multi-tenancy
  group_id: text("group_id").references(() => groups.id), // Multi-tenancy (optional)
});

export const insertTeammateSchema = createInsertSchema(teammates).omit({ id: true, createdAt: true });
export type InsertTeammate = z.infer<typeof insertTeammateSchema>;
export type Teammate = typeof teammates.$inferSelect;

// NEW TABLES FROM BATTLEMETRICS

// Servers table - for tracking monitored servers
export const servers = pgTable("servers", {
  id: text("id").primaryKey(), // BattleMetrics server ID
  name: text("name").notNull(),
  game: text("game").notNull().default("rust"),
  region: text("region"),
  status: text("status").default("offline"), // online/offline
  players: integer("players").default(0),
  max_players: integer("max_players").default(0),
  battle_metrics_url: text("battle_metrics_url"),
  map_info: jsonb("map_info"),
  last_checked: timestamp("last_checked").defaultNow(),
  added_at: timestamp("added_at").defaultNow().notNull(),
  is_active: boolean("is_active").default(true).notNull(), // For soft delete
});

// Player activities table - raw join/leave events for detailed logging
export const playerActivities = pgTable("player_activities", {
  id: uuid("id").defaultRandom().primaryKey(),
  profile_id: integer("profile_id").references(() => playerProfiles.id, { onDelete: "cascade" }),
  session_id: uuid("session_id"), // Will reference playerSessions.id
  server_id: text("server_id").notNull().references(() => servers.id),
  player_name: text("player_name").notNull(),
  player_id: text("player_id"), // BattleMetrics player ID if available
  action: text("action").notNull(), // 'joined' or 'left'
  timestamp: timestamp("timestamp").notNull(),

  // Additional metadata
  player_rank: integer("player_rank"),
  player_score: integer("player_score"),

  created_at: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  profile_idx: index("profile_activities_idx").on(table.profile_id),
  session_idx: index("session_activities_idx").on(table.session_id),
  server_timestamp_idx: index("server_timestamp_idx").on(table.server_id, table.timestamp),
  action_idx: index("action_idx").on(table.action),
}));

// Player sessions table - detailed session logs
export const playerSessions = pgTable("player_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  profile_id: integer("profile_id").notNull().references(() => playerProfiles.id, { onDelete: "cascade" }),
  server_id: text("server_id").notNull().references(() => servers.id),
  player_name: text("player_name").notNull(),
  player_id: text("player_id"), // BattleMetrics player ID if available

  // Session timing
  join_time: timestamp("join_time").notNull(),
  leave_time: timestamp("leave_time"),
  duration_minutes: integer("duration_minutes"), // Session duration in minutes
  is_active: boolean("is_active").default(true).notNull(), // Player still online

  // Player info at time of session
  player_rank: integer("player_rank"),
  player_score: integer("player_score"),

  // Session metadata
  session_type: text("session_type").default("normal"), // 'normal', 'premium'

  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  profile_idx: index("profile_sessions_idx").on(table.profile_id),
  server_join_time_idx: index("server_join_time_idx").on(table.server_id, table.join_time),
  active_sessions_idx: index("active_sessions_idx").on(table.server_id, table.is_active),
}));

// Sessions table - for PostgreSQL session storage
export const sessions = pgTable("sessions", {
  sid: text("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

// Team members table - for group management
export const teamMembers = pgTable("team_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  team_id: integer("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  user_id: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // 'scout', 'raider', 'admin'
  squad_slot: integer("squad_slot"),
  invite_code: text("invite_code").unique(),
  joined_at: timestamp("joined_at").defaultNow().notNull(),
});

// Maps table - for storing tactical maps
export const maps = pgTable("maps", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  map_data: jsonb("map_data").notNull(), // Complete map data
  server_id: text("server_id").references(() => servers.id),
  created_by: text("created_by").references(() => users.id),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Add relations for the new tables
export const playerActivitiesRelations = relations(playerActivities, ({ one }) => ({
  profile: one(playerProfiles, {
    fields: [playerActivities.profile_id],
    references: [playerProfiles.id],
  }),
  server: one(servers, {
    fields: [playerActivities.server_id],
    references: [servers.id],
  }),
}));

export const playerSessionsRelations = relations(playerSessions, ({ one }) => ({
  profile: one(playerProfiles, {
    fields: [playerSessions.profile_id],
    references: [playerProfiles.id],
  }),
  server: one(servers, {
    fields: [playerSessions.server_id],
    references: [servers.id],
  }),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, {
    fields: [teamMembers.team_id],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [teamMembers.user_id],
    references: [users.id],
  }),
}));
