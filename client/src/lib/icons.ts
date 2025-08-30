/**
 * Centralized icon registry for consistent icon usage across the application
 * This file contains all icons used in the tactical map and reporting system
 */

// Task Report Icons - Used on map overlay for active tasks
export const TASK_ICONS = {
  // Resource-related tasks
  ORE_PICKUP: '🪨',      // Stone/ore pickup tasks
  LOOT_PICKUP: '📦',     // Loot/package pickup tasks
  RESOURCE_REQUEST: '📋', // General resource requests
  
  // Kit and supply tasks
  KIT_REQUEST: '🎒',     // Kit/supply requests (backpack icon for gear)
  MEDICAL_SUPPLY: '🩹',  // Medical supply requests
  
  // Base maintenance tasks
  REPAIR: '🔧',          // Repair tasks
  UPGRADE: '🚧',         // Upgrade/construction tasks
  
  // Timing and scheduling
  DECAY_TIMER: '⏰',     // Decay timing tasks
  SCHEDULE: '📅',        // Scheduled tasks
  
  // Status indicators
  URGENT: '🚨',          // High priority tasks
  COMPLETED: '✅',       // Completed tasks
  FAILED: '❌',          // Failed tasks
  PENDING: '⏳',         // Pending tasks
} as const

// Base Type Icons - Used in base management
export const BASE_ICONS = {
  FRIENDLY: '🏠',        // Friendly bases
  ENEMY: '🏴',           // Enemy bases
  NEUTRAL: '🏘️',        // Neutral/unknown bases
  OUTPOST: '🏭',         // Outpost bases
  COMPOUND: '🏰',        // Large compound bases
} as const

// Player Status Icons - Used in player management
export const PLAYER_ICONS = {
  ONLINE: '🟢',          // Online players
  OFFLINE: '🔴',         // Offline players
  AWAY: '🟡',            // Away/idle players
  PREMIUM: '⭐',         // Premium players
  ADMIN: '👑',           // Admin players
} as const

// UI Action Icons - Used for buttons and actions
export const ACTION_ICONS = {
  ADD: '➕',
  EDIT: '✏️',
  DELETE: '🗑️',
  SAVE: '💾',
  CANCEL: '❌',
  SEARCH: '🔍',
  FILTER: '🔽',
  REFRESH: '🔄',
  SETTINGS: '⚙️',
  INFO: 'ℹ️',
  WARNING: '⚠️',
  SUCCESS: '✅',
  ERROR: '❌',
} as const

// Resource Icons - Used for resource displays
export const RESOURCE_ICONS = {
  WOOD: '🪵',
  STONE: '🪨',
  METAL: '⚙️',
  HQM: '💎',
  SCRAP: '🔩',
  CLOTH: '🧵',
  LEATHER: '🦌',
} as const

// Weapon/Kit Icons - Used for kit management
export const KIT_ICONS = {
  HAZZY: '🦺',           // Hazmat suit
  FULLKIT: '⚔️',        // Full combat kit
  MEDS: '💊',            // Medical supplies
  BOLTY: '🔫',           // Bolt action rifle
  TEAS: '🍵',            // Teas/consumables
  ROADSIGN: '🛡️',       // Road sign armor
  COFFEE: '☕',           // Coffee can helmet
} as const

// Map Icons - Used for tactical map features
export const MAP_ICONS = {
  MONUMENT: '🏛️',       // Monuments
  ROAD: '🛣️',           // Roads
  WATER: '🌊',           // Water bodies
  FOREST: '🌲',          // Forest areas
  DESERT: '🏜️',         // Desert areas
  SNOW: '❄️',            // Snow biome
} as const

// Get icon by category and key
export function getIcon(category: keyof typeof ICON_REGISTRY, key: string): string {
  const categoryIcons = ICON_REGISTRY[category]
  if (!categoryIcons || !(key.toUpperCase() in categoryIcons)) {
    console.warn(`Icon not found: ${category}.${key}`)
    return '❓' // Default fallback icon
  }
  return categoryIcons[key.toUpperCase() as keyof typeof categoryIcons]
}

// Complete icon registry
export const ICON_REGISTRY = {
  TASK: TASK_ICONS,
  BASE: BASE_ICONS,
  PLAYER: PLAYER_ICONS,
  ACTION: ACTION_ICONS,
  RESOURCE: RESOURCE_ICONS,
  KIT: KIT_ICONS,
  MAP: MAP_ICONS,
} as const

// Helper function to get task icon based on task type
export function getTaskIcon(taskType: string, subType?: string): string {
  switch (taskType) {
    case 'needs_pickup':
      return subType === 'ore' ? TASK_ICONS.ORE_PICKUP : TASK_ICONS.LOOT_PICKUP
    case 'request_resources':
      return TASK_ICONS.RESOURCE_REQUEST
    case 'stock_kits':
      return TASK_ICONS.KIT_REQUEST
    case 'repair_upgrade':
      return subType === 'repair' ? TASK_ICONS.REPAIR : TASK_ICONS.UPGRADE
    default:
      return TASK_ICONS.PENDING
  }
}

// Helper function to get status icon
export function getStatusIcon(status: string): string {
  switch (status) {
    case 'completed':
      return TASK_ICONS.COMPLETED
    case 'failed':
      return TASK_ICONS.FAILED
    case 'pending':
      return TASK_ICONS.PENDING
    case 'urgent':
      return TASK_ICONS.URGENT
    default:
      return TASK_ICONS.PENDING
  }
}

// Helper function to get kit icon
export function getKitIcon(kitType: string): string {
  const iconKey = kitType.toUpperCase() as keyof typeof KIT_ICONS
  return KIT_ICONS[iconKey] || ACTION_ICONS.INFO
}

export default ICON_REGISTRY