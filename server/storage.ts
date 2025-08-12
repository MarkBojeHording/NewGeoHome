import { type User, type InsertUser, type Report, type InsertReport, type ReportTemplate, type InsertReportTemplate } from "@shared/schema";
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
  getReportTemplateByType(reportType: string, baseType?: string): Promise<ReportTemplate | undefined>;
}

import { db } from "./db";
import { users, reports, reportTemplates } from "@shared/schema";
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
    return (result.rowCount || 0) > 0;
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

  async getReportTemplateByType(reportType: string, baseType?: string): Promise<ReportTemplate | undefined> {
    const [template] = await db.select().from(reportTemplates).where(eq(reportTemplates.reportType, reportType));
    
    if (!template || reportType !== 'base' || !baseType) {
      return template || undefined;
    }

    // Clone the template to avoid modifying the original
    const filteredTemplate = JSON.parse(JSON.stringify(template));
    
    // Filter base report action options based on base type
    if (filteredTemplate.template?.fields) {
      filteredTemplate.template.fields = filteredTemplate.template.fields.map((field: any) => {
        if (field.name === 'action' && field.options) {
          const allOptions = ["Base Raided", "MLRS'd", "Enemy built in", "We grubbed", "Caught moving loot"];
          const isEnemy = baseType.startsWith('enemy');
          const isFriendly = baseType.startsWith('friendly');
          
          if (isEnemy) {
            field.options = ["Base Raided", "MLRS'd", "We grubbed", "Caught moving loot"];
          } else if (isFriendly) {
            field.options = ["Base Raided", "MLRS'd", "Enemy built in"];
          }
        }
        return field;
      });
    }
    
    return filteredTemplate;
  }
}

export const storage = new DatabaseStorage();
