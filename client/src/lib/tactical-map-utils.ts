import React from 'react'
import { GRID_CONFIG, GROUP_COLORS, ICON_MAP } from './tactical-map-constants'
import { MapPin } from 'lucide-react'
import { DecayingIcon, TowerIcon } from '@/components/MapIcons'

// ============= UTILITY FUNCTIONS =============

export const getColor = (type: string, location = null) => {
  if (location?.abandoned) return 'text-gray-400'
  if (type.startsWith('report')) return 'text-purple-600'
  return type.startsWith('friendly') ? 'text-green-600' : 'text-red-600'
}

export const getBorderColor = (type: string) => {
  if (type.startsWith('report')) return 'border-purple-500'
  return type.startsWith('friendly') ? 'border-green-500' : 'border-red-500'
}

export const getGridCoordinate = (x: number, y: number, existingLocations: any[] = [], excludeId: string | null = null) => {
  const col = Math.floor(x / GRID_CONFIG.CELL_WIDTH_PERCENT)
  const row = Math.floor(y / GRID_CONFIG.CELL_HEIGHT_PERCENT)
  const clampedCol = Math.min(Math.max(col, 0), GRID_CONFIG.COLS - 1)
  const clampedRow = Math.min(Math.max(row, 0), GRID_CONFIG.ROWS - 1)
  const letter = clampedCol < 26 ? String.fromCharCode(65 + clampedCol) : `A${String.fromCharCode(65 + clampedCol - 26)}`
  const number = clampedRow
  const baseCoord = `${letter}${number}`
  
  const duplicates = existingLocations.filter(loc => {
    if (excludeId && loc.id === excludeId) return false
    const locBase = loc.name.split('(')[0]
    return locBase === baseCoord
  })
  
  return duplicates.length === 0 ? baseCoord : `${baseCoord}(${duplicates.length + 1})`
}

// Get all bases that belong to the same group (share common players OR are subordinate bases near main bases)
export const getBaseGroup = (baseId: string, locations: any[]) => {
  const currentBase = locations.find(loc => loc.id === baseId)
  if (!currentBase) return []
  
  // Method 1: Player-based grouping (original logic)
  if (currentBase.players && currentBase.players.length > 0) {
    const currentPlayers = currentBase.players.split(",").map(p => p.trim()).filter(p => p)
    
    return locations.filter(loc => {
      if (loc.id === baseId) return true
      if (!loc.players || loc.players.length === 0) return false
      
      const locPlayers = loc.players.split(",").map(p => p.trim()).filter(p => p)
      return currentPlayers.some(player => locPlayers.includes(player))
    })
  }
  
  // Method 2: Proximity-based grouping for bases near main bases
  const MAIN_BASE_TYPES = ['friendly-main', 'enemy-large']
  const currentIsMain = MAIN_BASE_TYPES.includes(currentBase.type)
  
  if (currentIsMain) {
    // If current base is a main base, find nearby subordinate bases
    return locations.filter(loc => {
      if (loc.id === baseId) return true
      
      // Calculate distance
      const dx = Math.abs(loc.x - currentBase.x)
      const dy = Math.abs(loc.y - currentBase.y)
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      // Group subordinate bases within 20 units of main base, same faction
      const isNearby = distance <= 20
      const sameFaction = (loc.type.startsWith('friendly') && currentBase.type.startsWith('friendly')) ||
                         (loc.type.startsWith('enemy') && currentBase.type.startsWith('enemy'))
      const isSubordinate = !MAIN_BASE_TYPES.includes(loc.type)
      
      return isNearby && sameFaction && isSubordinate
    })
  } else {
    // If current base is subordinate, find the main base it belongs to
    const mainBases = locations.filter(loc => 
      MAIN_BASE_TYPES.includes(loc.type) &&
      ((loc.type.startsWith('friendly') && currentBase.type.startsWith('friendly')) ||
       (loc.type.startsWith('enemy') && currentBase.type.startsWith('enemy')))
    )
    
    for (const mainBase of mainBases) {
      const dx = Math.abs(currentBase.x - mainBase.x)
      const dy = Math.abs(currentBase.y - mainBase.y)
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (distance <= 20) {
        // Found the main base, return its group
        return getBaseGroup(mainBase.id, locations)
      }
    }
  }
  
  // No group found, return just this base
  return [currentBase]
}

export const getGridPosition = (x: number, y: number) => {
  const col = Math.floor(x / GRID_CONFIG.CELL_WIDTH_PERCENT)
  const row = Math.floor(y / GRID_CONFIG.CELL_HEIGHT_PERCENT)
  const clampedCol = Math.min(Math.max(col, 0), GRID_CONFIG.COLS - 1)
  const clampedRow = Math.min(Math.max(row, 0), GRID_CONFIG.ROWS - 1)
  const letter = clampedCol < 26 ? String.fromCharCode(65 + clampedCol) : `A${String.fromCharCode(65 + clampedCol - 26)}`
  const number = clampedRow
  return `${letter}${number}`
}

export const getGroupColor = (baseId: string, locations: any[]) => {
  const group = getBaseGroup(baseId, locations)
  if (group.length <= 1) return null
  
  // Sort group by ID to ensure consistent color assignment
  const sortedGroup = group.sort((a, b) => a.id.localeCompare(b.id))
  const groupLeaderId = sortedGroup[0].id
  
  // Use a simple hash of the group leader ID to pick a color
  let hash = 0
  for (let i = 0; i < groupLeaderId.length; i++) {
    hash = groupLeaderId.charCodeAt(i) + ((hash << 5) - hash)
  }
  const colorIndex = Math.abs(hash) % GROUP_COLORS.length
  return GROUP_COLORS[colorIndex]
}

export const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }
}

export const openGeneCalculator = () => {
  window.open('https://rocketcalculator.app/', '_blank')
}

export const getIcon = (type) => {
  if (type === 'enemy-decaying') return React.createElement(DecayingIcon)
  if (type === 'enemy-tower') return React.createElement(TowerIcon)
  const Icon = ICON_MAP[type] || MapPin
  return React.createElement(Icon, { className: 'h-3 w-3' })
}

export const getLargeIcon = (type) => {
  if (type === 'enemy-decaying') {
    return React.createElement('svg', {
      className: 'h-8 w-8',
      viewBox: '0 0 24 24',
      fill: 'currentColor'
    }, [
      React.createElement('path', {
        key: 'main',
        d: 'M3 21h18v-2H3v2zm0-4h2v-4h2v4h2v-4h2v4h2v-4h2v4h2v-4h2v4h2v-4h2V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v12zm4-12h2v2H7V5zm4 0h2v2h-2V5zm4 0h2v2h-2V5zM7 9h2v2H7V9zm4 0h2v2h-2V9z',
        opacity: '0.7'
      }),
      React.createElement('path', {
        key: 'accent',
        d: 'M8 17l-2 2v2h3v-4zm8 0v4h3v-2l-2-2zm-4-8l-1 2h2l-1-2z'
      }),
      React.createElement('path', {
        key: 'lines',
        d: 'M6 13l-1.5 1.5M18 13l1.5 1.5M9 16l-1 1M15 16l1 1',
        stroke: 'currentColor',
        strokeWidth: '1',
        opacity: '0.5'
      })
    ])
  }
  if (type === 'enemy-tower') {
    return React.createElement('svg', {
      className: 'h-8 w-8',
      viewBox: '0 0 24 24',
      fill: 'currentColor'
    }, React.createElement('path', {
      d: 'M8 2v2h1v2H6v2h1v12h10V8h1V6h-3V4h1V2h-8zm7 16H9V8h6v10zm-3-8.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z'
    }))
  }
  const Icon = ICON_MAP[type] || MapPin
  return React.createElement(Icon, { className: 'h-8 w-8' })
}

export const TimerDisplay = ({ timers, onRemoveTimer }) => {
  if (!timers || timers.length === 0) return null
  
  return React.createElement('div', {
    className: 'absolute bottom-full left-1/2 transform -translate-x-1/2 flex flex-col-reverse',
    style: { zIndex: 30, marginBottom: '1px', gap: '0' }
  }, timers.slice(-3).map((timer) => 
    React.createElement('div', {
      key: timer.id,
      className: 'border rounded-sm px-1 py-0 text-[5px] font-mono whitespace-nowrap shadow-sm cursor-pointer hover:opacity-80 transition-all duration-200',
      style: {
        backgroundColor: timer.type === 'stone' ? 'rgba(156, 163, 175, 0.95)' : timer.type === 'metal' ? 'rgba(183, 65, 14, 0.95)' : timer.type === 'hqm' ? 'rgba(59, 130, 246, 0.95)' : 'rgba(39, 39, 42, 0.95)',
        borderColor: timer.type === 'stone' ? '#9ca3af' : timer.type === 'metal' ? '#b7410e' : timer.type === 'hqm' ? '#3b82f6' : '#52525b',
        color: timer.type === 'stone' ? '#f9fafb' : timer.type === 'metal' ? '#fed7aa' : timer.type === 'hqm' ? '#dbeafe' : '#ddd6fe',
        lineHeight: '1.2',
        borderWidth: '0.5px',
        fontSize: '5px',
        padding: '0 3px'
      },
      onClick: (e) => {
        e.stopPropagation()
        onRemoveTimer(timer.id)
      },
      title: 'Click to remove timer'
    }, formatTime(timer.remaining))
  ))
}