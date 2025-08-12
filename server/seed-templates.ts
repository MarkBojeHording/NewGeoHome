import { storage } from "./storage";

// Standard report templates for different types of reports
const standardTemplates = [
  {
    name: "General Report",
    reportType: "general",
    template: {
      fields: [
        { name: "title", type: "text", label: "Report Title", required: true },
        { name: "description", type: "textarea", label: "Description", required: true },
        { name: "priority", type: "select", label: "Priority", options: ["low", "medium", "high", "critical"], required: true },
        { name: "tags", type: "tags", label: "Tags", required: false }
      ]
    }
  },
  {
    name: "Base Report", 
    reportType: "base",
    template: {
      fields: [
        { name: "title", type: "text", label: "Report Title", required: true },
        { name: "baseType", type: "select", label: "Base Type", options: ["friendly", "enemy", "neutral"], required: true },
        { name: "baseStatus", type: "select", label: "Base Status", options: ["active", "raided", "decaying", "abandoned"], required: true },
        { name: "description", type: "textarea", label: "Description", required: true },
        { name: "lootEstimate", type: "textarea", label: "Estimated Loot", required: false },
        { name: "defenses", type: "textarea", label: "Defenses Observed", required: false },
        { name: "raidCost", type: "textarea", label: "Estimated Raid Cost", required: false },
        { name: "priority", type: "select", label: "Priority", options: ["low", "medium", "high", "critical"], required: true },
        { name: "tags", type: "tags", label: "Tags", required: false }
      ]
    }
  },
  {
    name: "Raid Report",
    reportType: "raid", 
    template: {
      fields: [
        { name: "title", type: "text", label: "Report Title", required: true },
        { name: "targetBase", type: "text", label: "Target Base", required: true },
        { name: "raidStatus", type: "select", label: "Raid Status", options: ["planned", "in-progress", "successful", "failed", "cancelled"], required: true },
        { name: "participantCount", type: "number", label: "Number of Participants", required: false },
        { name: "resourcesUsed", type: "textarea", label: "Resources Used", required: false },
        { name: "lootObtained", type: "textarea", label: "Loot Obtained", required: false },
        { name: "casualties", type: "textarea", label: "Casualties/Losses", required: false },
        { name: "description", type: "textarea", label: "Raid Details", required: true },
        { name: "priority", type: "select", label: "Priority", options: ["low", "medium", "high", "critical"], required: true },
        { name: "tags", type: "tags", label: "Tags", required: false }
      ]
    }
  }
];

export async function seedReportTemplates() {
  try {
    for (const template of standardTemplates) {
      const existing = await storage.getReportTemplateByType(template.reportType);
      if (!existing) {
        await storage.createReportTemplate(template);
        console.log(`Created template: ${template.name}`);
      } else {
        console.log(`Template already exists: ${template.name}`);
      }
    }
    console.log("Report templates seeding completed");
  } catch (error) {
    console.error("Failed to seed report templates:", error);
  }
}