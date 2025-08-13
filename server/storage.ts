import { type User, type InsertUser, type Report, type InsertReport, type ReportTemplate, type InsertReportTemplate, type PremiumPlayer, type InsertPremiumPlayer, type PlayerBaseTag, type InsertPlayerBaseTag } from "@shared/schema";
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Report management methods
  createReport(report: InsertReport): Promise<Report>;
  getReport(id: number): Promise<Report | undefined>;
  getAllReports(): Promise<Report[]>;
  getReportsByType(reportType: string): Promise<Report[]>;
  getReportsByLocation(locationName: string): Promise<Report[]>;
  updateReport(id: number, report: Partial<InsertReport>): Promise<Report>;
  deleteReport(id: number): Promise<boolean>;
  
  // Template management methods
  createReportTemplate(template: InsertReportTemplate): Promise<ReportTemplate>;
  getAllReportTemplates(): Promise<ReportTemplate[]>;
  getReportTemplateByType(reportType: string): Promise<ReportTemplate | undefined>;
  
  // Premium player management methods
  createPremiumPlayer(player: InsertPremiumPlayer): Promise<PremiumPlayer>;
  getAllPremiumPlayers(): Promise<PremiumPlayer[]>;
  getPremiumPlayerByName(playerName: string): Promise<PremiumPlayer | undefined>;
  deletePremiumPlayer(id: number): Promise<boolean>;
  
  // Player base tagging methods
  createPlayerBaseTag(tag: InsertPlayerBaseTag): Promise<PlayerBaseTag>;
  getPlayerBaseTags(playerName: string): Promise<PlayerBaseTag[]>;
  getBasePlayerTags(baseId: string): Promise<PlayerBaseTag[]>;
  getAllPlayerBaseTags(): Promise<PlayerBaseTag[]>;
  deletePlayerBaseTag(id: number): Promise<boolean>;
  deletePlayerBaseTagsByBaseId(baseId: string): Promise<boolean>;
  
  // Note: Regular player data comes from external API, no local storage needed
}

import { db } from "./db";
import { users, reports, reportTemplates, premiumPlayers, playerBaseTags } from "@shared/schema";
import { eq } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Report management methods
  async createReport(report: InsertReport): Promise<Report> {
    const [newReport] = await db
      .insert(reports)
      .values(report)
      .returning();
    return newReport;
  }

  async getReport(id: number): Promise<Report | undefined> {
    const [report] = await db.select().from(reports).where(eq(reports.id, id));
    return report || undefined;
  }

  async getAllReports(): Promise<Report[]> {
    return await db.select().from(reports);
  }

  async getReportsByType(reportType: string): Promise<Report[]> {
    return await db.select().from(reports).where(eq(reports.reportType, reportType));
  }

  async getReportsByLocation(locationName: string): Promise<Report[]> {
    return await db.select().from(reports).where(eq(reports.locationName, locationName));
  }

  async updateReport(id: number, report: Partial<InsertReport>): Promise<Report> {
    const [updatedReport] = await db
      .update(reports)
      .set({ ...report, updatedAt: new Date() })
      .where(eq(reports.id, id))
      .returning();
    return updatedReport;
  }

  async deleteReport(id: number): Promise<boolean> {
    const result = await db.delete(reports).where(eq(reports.id, id));
    return result.rowCount > 0;
  }

  // Template management methods
  async createReportTemplate(template: InsertReportTemplate): Promise<ReportTemplate> {
    const [newTemplate] = await db
      .insert(reportTemplates)
      .values(template)
      .returning();
    return newTemplate;
  }

  async getAllReportTemplates(): Promise<ReportTemplate[]> {
    return await db.select().from(reportTemplates);
  }

  async getReportTemplateByType(reportType: string): Promise<ReportTemplate | undefined> {
    const [template] = await db.select().from(reportTemplates).where(eq(reportTemplates.reportType, reportType));
    return template || undefined;
  }

  // Premium player management methods
  async createPremiumPlayer(player: InsertPremiumPlayer): Promise<PremiumPlayer> {
    const [newPlayer] = await db
      .insert(premiumPlayers)
      .values(player)
      .returning();
    return newPlayer;
  }

  async getAllPremiumPlayers(): Promise<PremiumPlayer[]> {
    return await db.select().from(premiumPlayers);
  }

  async getPremiumPlayerByName(playerName: string): Promise<PremiumPlayer | undefined> {
    const [player] = await db.select().from(premiumPlayers).where(eq(premiumPlayers.playerName, playerName));
    return player || undefined;
  }

  async deletePremiumPlayer(id: number): Promise<boolean> {
    const result = await db.delete(premiumPlayers).where(eq(premiumPlayers.id, id));
    return result.rowCount > 0;
  }

  // Player base tagging methods
  async createPlayerBaseTag(tag: InsertPlayerBaseTag): Promise<PlayerBaseTag> {
    const [newTag] = await db
      .insert(playerBaseTags)
      .values(tag)
      .returning();
    return newTag;
  }

  async getPlayerBaseTags(playerName: string): Promise<PlayerBaseTag[]> {
    return await db.select().from(playerBaseTags).where(eq(playerBaseTags.playerName, playerName));
  }

  async getBasePlayerTags(baseId: string): Promise<PlayerBaseTag[]> {
    return await db.select().from(playerBaseTags).where(eq(playerBaseTags.baseId, baseId));
  }

  async getAllPlayerBaseTags(): Promise<PlayerBaseTag[]> {
    return await db.select().from(playerBaseTags);
  }

  async deletePlayerBaseTag(id: number): Promise<boolean> {
    const result = await db.delete(playerBaseTags).where(eq(playerBaseTags.id, id));
    return result.rowCount > 0;
  }

  async deletePlayerBaseTagsByBaseId(baseId: string): Promise<boolean> {
    const result = await db.delete(playerBaseTags).where(eq(playerBaseTags.baseId, baseId));
    return result.rowCount > 0;
  }

  // Note: Regular player methods removed - using external API instead
}

export const storage = new DatabaseStorage();
