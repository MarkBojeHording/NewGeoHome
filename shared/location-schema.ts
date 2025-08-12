import { z } from 'zod'

// Base location types
export const BaseTypeSchema = z.enum([
  'friendly-main',
  'friendly-flank', 
  'friendly-farm',
  'friendly-boat',
  'friendly-garage',
  'enemy-small',
  'enemy-medium',
  'enemy-large',
  'enemy-flank',
  'enemy-tower',
  'enemy-farm',
  'enemy-decaying'
])

// Location interface
export const LocationSchema = z.object({
  id: z.string(),
  name: z.string(),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  type: BaseTypeSchema,
  notes: z.string().optional(),
  playerCount: z.number().optional(),
  ownerCoordinates: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date())
})

// Timer interface
export const TimerSchema = z.object({
  id: z.string(),
  locationId: z.string(),
  type: z.enum(['stone', 'metal', 'hqm', 'custom']),
  remaining: z.number().min(0),
  label: z.string().optional(),
  createdAt: z.date().default(() => new Date())
})

// Modal states
export const ModalStateSchema = z.object({
  x: z.number(),
  y: z.number(), 
  visible: z.boolean()
})

export const ContextMenuSchema = z.object({
  x: z.number(),
  y: z.number(),
  visible: z.boolean()
})

// Insert schemas
export const LocationInsertSchema = LocationSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
})

export const TimerInsertSchema = TimerSchema.omit({
  id: true,
  createdAt: true
})

// Types
export type Location = z.infer<typeof LocationSchema>
export type LocationInsert = z.infer<typeof LocationInsertSchema>
export type BaseType = z.infer<typeof BaseTypeSchema>
export type Timer = z.infer<typeof TimerSchema>
export type TimerInsert = z.infer<typeof TimerInsertSchema>
export type ModalState = z.infer<typeof ModalStateSchema>
export type ContextMenu = z.infer<typeof ContextMenuSchema>

// Location timers type (for the useLocationTimers hook)
export type LocationTimers = Record<string, Timer[]>