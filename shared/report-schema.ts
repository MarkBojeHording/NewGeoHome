import { z } from 'zod'

// Base report interface
export const BaseReportInfoSchema = z.object({
  id: z.string(),
  type: z.enum(['general', 'base']),
  locationId: z.string().optional(), // For base reports, this links to the base
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  reportTime: z.string(),
  notes: z.string().optional(),
  enemyPlayers: z.array(z.string()).default([]),
  friendlyPlayers: z.array(z.string()).default([]),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date())
})

// General report types (map-based reports)
export const GeneralReportTypeSchema = z.enum([
  'report-pvp',
  'report-spotted', 
  'report-bradley',
  'report-oil',
  'report-monument',
  'report-farming',
  'report-loaded',
  'report-raid'
])

// Base report types (base-specific reports)
export const BaseReportTypeSchema = z.enum([
  'base-raided',
  'base-mlrs',
  'base-enemy-built-in', // Only for friendly bases
  'base-grubbed',        // Only for enemy bases
  'base-caught-moving-loot' // Only for enemy bases
])

// Report outcome for tracking success/failure
export const ReportOutcomeSchema = z.enum(['won', 'lost', 'neutral'])

// General report schema (appears on map)
export const GeneralReportSchema = BaseReportInfoSchema.extend({
  type: z.literal('general'),
  reportType: GeneralReportTypeSchema,
  outcome: ReportOutcomeSchema.default('neutral')
})

// Base report schema (linked to specific base)
export const BaseReportSchema = BaseReportInfoSchema.extend({
  type: z.literal('base'),
  reportType: BaseReportTypeSchema,
  baseType: z.enum(['friendly', 'enemy']), // Determines which options are available
  outcome: ReportOutcomeSchema.default('neutral')
})

// Combined report schema
export const ReportSchema = z.discriminatedUnion('type', [
  GeneralReportSchema,
  BaseReportSchema
])

// Insert schemas for forms
export const GeneralReportInsertSchema = GeneralReportSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
})

export const BaseReportInsertSchema = BaseReportSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
})

export const ReportInsertSchema = z.discriminatedUnion('type', [
  GeneralReportInsertSchema,
  BaseReportInsertSchema
])

// Types
export type Report = z.infer<typeof ReportSchema>
export type GeneralReport = z.infer<typeof GeneralReportSchema>
export type BaseReport = z.infer<typeof BaseReportSchema>
export type ReportInsert = z.infer<typeof ReportInsertSchema>
export type GeneralReportInsert = z.infer<typeof GeneralReportInsertSchema>
export type BaseReportInsert = z.infer<typeof BaseReportInsertSchema>
export type ReportOutcome = z.infer<typeof ReportOutcomeSchema>
export type GeneralReportType = z.infer<typeof GeneralReportTypeSchema>
export type BaseReportType = z.infer<typeof BaseReportTypeSchema>

// Report type options for UI
export const GENERAL_REPORT_OPTIONS = [
  { value: 'report-pvp', label: 'PVP General' },
  { value: 'report-spotted', label: 'Spotted Enemy' },
  { value: 'report-bradley', label: 'Countered/Took Bradley/Heli' },
  { value: 'report-oil', label: 'Countered/Took Oil/Cargo' },
  { value: 'report-monument', label: 'Big Score/Fight at Monument' },
  { value: 'report-farming', label: 'Killed While Farming' },
  { value: 'report-loaded', label: 'Killed Loaded Enemy' },
  { value: 'report-raid', label: 'Countered Raid' }
] as const

export const BASE_REPORT_OPTIONS = {
  common: [
    { value: 'base-raided', label: 'Base Raided' },
    { value: 'base-mlrs', label: 'MLRS\'d' }
  ],
  friendly: [
    { value: 'base-enemy-built-in', label: 'Enemy Built In' }
  ],
  enemy: [
    { value: 'base-grubbed', label: 'We Grubbed' },
    { value: 'base-caught-moving-loot', label: 'Caught Moving Loot' }
  ]
} as const

// Report library for storing all reports
export const ReportLibrarySchema = z.array(ReportSchema)
export type ReportLibrary = z.infer<typeof ReportLibrarySchema>