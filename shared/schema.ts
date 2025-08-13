import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
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

// Reports table for central storage
export const reports = pgTable("reports", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: text("title").notNull(),
  reportType: text("report_type").notNull(), // 'general', 'base', 'raid', etc.
  locationName: text("location_name"), // Associated location/base name
  locationCoords: text("location_coords"), // Grid coordinates like "A1"
  baseId: text("base_id"), // Unique base identifier for reliable linking
  content: jsonb("content").notNull(), // Flexible JSON structure for different report types
  tags: text("tags").array(), // Array of tags for categorization
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
