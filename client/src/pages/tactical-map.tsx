import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { MapPin, Home, Shield, Wheat, Castle, Tent, X, HelpCircle, Calculator, User, Plus } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import BaseModal from '../components/BaseModal'
import { PlayerModal } from '../components/PlayerModal'
import { LogsModal } from '../components/LogsModal'
import ActionReportModal from '../components/ActionReportModal'
import { TeamsModal } from '../components/TeamsModal'
import { ProgressionModal } from '../components/ProgressionModal'
import { HeatMapOverlay, HeatMapControls, HeatMapConfig } from '../components/HeatMap'
import WipeCountdownTimer from '../components/WipeCountdownTimer'
import RadialMenu from '../components/RadialMenu'
import FarmRadialMenu from '../components/FarmRadialMenu'
import BaseRadialMenu from '../components/BaseRadialMenu'
import type { ExternalPlayer } from '@shared/schema'
import rustMapImage from '@assets/map_raw_normalized (2)_1755133962532.png'
// ============= CONSTANTS =============
const GRID_CONFIG = {
  COLS: 26,
  ROWS: 26,
  CELL_WIDTH_PERCENT: 3.846,
  CELL_HEIGHT_PERCENT: 3.846
}

const ICON_MAP = {
  'friendly-main': Castle,
  'friendly-flank': Shield,
  'friendly-farm': Wheat,
  'enemy-small': Tent,
  'enemy-medium': Home,
  'enemy-large': Castle,
  'enemy-flank': Shield,
  'enemy-farm': Wheat
}

const LABELS = {
  'friendly-main': 'Friendly Main Base',
  'friendly-flank': 'Friendly Flank Base',
  'friendly-farm': 'Friendly Farm',
  'friendly-boat': 'Boat Base',
  'friendly-garage': 'Garage',
  'enemy-small': 'Main Small',
  'enemy-medium': 'Main Medium',
  'enemy-large': 'Main Large',
  'enemy-flank': 'Flank Base',
  'enemy-tower': 'Tower',
  'enemy-farm': 'Farm',
  'enemy-decaying': 'Decaying Base',
  'report-pvp': 'PVP General',
  'report-spotted': 'Spotted Enemy',
  'report-bradley': 'Countered/Took Bradley/Heli',
  'report-oil': 'Countered/Took Oil/Cargo',
  'report-monument': 'Big Score/Fight at Monument',
  'report-farming': 'Killed While Farming',
  'report-loaded': 'Killed Loaded Enemy',
  'report-raid': 'Countered Raid'
}

const DECAY_TIMES = {
  stone: { max: 500, hours: 5 },
  metal: { max: 1000, hours: 8 },
  hqm: { max: 2000, hours: 12 }
}

const GROUP_COLORS = [
  '#ff6b6b', // Red
  '#4ecdc4', // Teal  
  '#45b7d1', // Blue
  '#96ceb4', // Green
  '#ffeaa7', // Yellow
  '#dda0dd', // Plum
  '#ffa726', // Orange
  '#ab47bc', // Purple
  '#26a69a', // Cyan
  '#ef5350'  // Pink
]


// ============= UTILITY FUNCTIONS =============
const getColor = (type: string, location = null) => {
  if (location?.abandoned) return 'text-gray-400'
  if (type.startsWith('report')) return 'text-purple-600'
  return type.startsWith('friendly') ? 'text-green-600' : 'text-red-600'
}

const getBorderColor = (type: string) => {
  if (type.startsWith('report')) return 'border-purple-500'
  return type.startsWith('friendly') ? 'border-green-500' : 'border-red-500'
}

const getGridCoordinate = (x: number, y: number, existingLocations: any[] = [], excludeId: string | null = null) => {
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
const getBaseGroup = (baseId: string, locations: any[]) => {
  const currentBase = locations.find(loc => loc.id === baseId)
  if (!currentBase) return []
  
  // Method 1: Player-based grouping (original logic)
  if (currentBase.players && currentBase.players.length > 0) {
    const currentPlayers = currentBase.players.split(",").map(p => p.trim()).filter(p => p)
    if (currentPlayers.length > 0) {
      const playerGroupBases = locations.filter(loc => {
        if (loc.id === baseId) return true
        if (!loc.players?.length) return false
        
        const locPlayers = loc.players.split(",").map(p => p.trim()).filter(p => p)
        if (locPlayers.length === 0) return false
        
        return currentPlayers.some(player => locPlayers.includes(player))
      })
      
      if (playerGroupBases.length > 1) return playerGroupBases
    }
  }
  
  // Method 2: Proximity-based grouping for subordinate bases ONLY
  const isMainBase = currentBase.type === "enemy-small" || currentBase.type === "enemy-medium" || currentBase.type === "enemy-large"
  const isSubordinateBase = currentBase.type === "enemy-flank" || currentBase.type === "enemy-farm" || currentBase.type === "enemy-tower"
  
  if (isMainBase) {
    // Group main bases with subordinate bases that have this main base as owner
    const currentBaseCoords = currentBase.name.split('(')[0] // Remove (2), (3) etc
    const linkedBases = locations.filter(loc => {
      if (loc.id === baseId) return true
      
      const isSubordinate = (loc.type === "enemy-flank" || loc.type === "enemy-farm" || loc.type === "enemy-tower")
      if (!isSubordinate) return false
      
      // Check if this subordinate is linked to this main base via ownerCoordinates
      return loc.ownerCoordinates === currentBaseCoords
    })
    
    return linkedBases.length > 1 ? linkedBases : [currentBase]
  }
  
  if (isSubordinateBase) {
    // Find the main base this subordinate is linked to via ownerCoordinates
    if (currentBase.ownerCoordinates) {
      const ownerMainBase = locations.find(loc => {
        const isMainBase = loc.type === "enemy-small" || loc.type === "enemy-medium" || loc.type === "enemy-large"
        if (!isMainBase) return false
        
        const mainBaseCoords = loc.name.split('(')[0] // Remove (2), (3) etc
        return mainBaseCoords === currentBase.ownerCoordinates
      })
      
      if (ownerMainBase) {
        // Include the main base and all subordinates linked to it
        const groupBases = locations.filter(loc => {
          if (loc.id === ownerMainBase.id) return true
          if (loc.id === baseId) return true
          
          const isSubordinate = loc.type === "enemy-flank" || loc.type === "enemy-farm" || loc.type === "enemy-tower"
          if (!isSubordinate) return false
          
          return loc.ownerCoordinates === currentBase.ownerCoordinates
        })
        
        return groupBases
      }
    }
  }
  
  return [currentBase]
}

// Helper function to get grid position
const getGridPosition = (x: number, y: number) => {
  const col = Math.floor(x / GRID_CONFIG.CELL_WIDTH_PERCENT)
  const row = Math.floor(y / GRID_CONFIG.CELL_HEIGHT_PERCENT)
  return {
    col: Math.min(Math.max(col, 0), GRID_CONFIG.COLS - 1),
    row: Math.min(Math.max(row, 0), GRID_CONFIG.ROWS - 1)
  }
}

// Get group color for a base - MUCH SIMPLER STABLE APPROACH
const getGroupColor = (baseId: string, locations: any[]) => {
  const currentBase = locations.find(loc => loc.id === baseId)
  if (!currentBase) return null
  
  // SIMPLE RULE: Only main bases (small/medium/large) that have subordinates get colors
  const isMainBase = currentBase.type === "enemy-small" || currentBase.type === "enemy-medium" || currentBase.type === "enemy-large"
  
  if (isMainBase) {
    // Check if this main base has any subordinates linked to it
    const currentBaseCoords = currentBase.name.split('(')[0] // Remove (2), (3) etc
    const hasSubordinates = locations.some(loc => {
      const isSubordinate = loc.type === "enemy-flank" || loc.type === "enemy-farm" || loc.type === "enemy-tower"
      return isSubordinate && loc.ownerCoordinates === currentBaseCoords
    })
    
    if (hasSubordinates) {
      // Use simple hash of main base ID (which never changes) for stable color
      let hash = 0
      for (let i = 0; i < baseId.length; i++) {
        const char = baseId.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash
      }
      return GROUP_COLORS[Math.abs(hash) % GROUP_COLORS.length]
    }
  }
  
  // SIMPLE RULE: Subordinate bases get the same color as their owner main base
  const isSubordinateBase = currentBase.type === "enemy-flank" || currentBase.type === "enemy-farm" || currentBase.type === "enemy-tower"
  
  if (isSubordinateBase && currentBase.ownerCoordinates) {
    // Find the main base this subordinate is linked to
    const ownerMainBase = locations.find(loc => {
      const isMainBase = loc.type === "enemy-small" || loc.type === "enemy-medium" || loc.type === "enemy-large"
      if (!isMainBase) return false
      
      const mainBaseCoords = loc.name.split('(')[0]
      return mainBaseCoords === currentBase.ownerCoordinates
    })
    
    if (ownerMainBase) {
      // Use same color logic as the main base
      let hash = 0
      for (let i = 0; i < ownerMainBase.id.length; i++) {
        const char = ownerMainBase.id.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash
      }
      return GROUP_COLORS[Math.abs(hash) % GROUP_COLORS.length]
    }
  }
  
  return null // No color for bases without grouping
}


const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// ============= CUSTOM HOOKS =============
const useLocationTimers = () => {
  const [locationTimers, setLocationTimers] = useState({})

  useEffect(() => {
    const interval = setInterval(() => {
      setLocationTimers(prev => {
        const updated = { ...prev }
        Object.keys(updated).forEach(locationId => {
          updated[locationId] = updated[locationId]
            .map(timer => ({
              ...timer,
              remaining: Math.max(0, timer.remaining - 1)
            }))
            .filter(timer => timer.remaining > 0)
          
          if (updated[locationId].length === 0) {
            delete updated[locationId]
          }
        })
        return updated
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return [locationTimers, setLocationTimers]
}

const useBaseReportEvents = (setBaseReportData, setShowBaseReportModal) => {
  useEffect(() => {
    const handleOpenBaseReport = (event) => {
      const { location } = event.detail
      // Use the same logic as the onOpenBaseReport function
      setBaseReportData({
        baseId: location.id,
        baseName: location.name,
        baseCoords: location.coordinates,
        baseType: location.type
      })
      setShowBaseReportModal(true)
    }
    
    window.addEventListener('openBaseReport', handleOpenBaseReport)
    return () => window.removeEventListener('openBaseReport', handleOpenBaseReport)
  }, [setBaseReportData, setShowBaseReportModal])
}

const openGeneCalculator = () => {
  // Your exact Gene Calculator HTML content
  const geneCalculatorHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Phragmites Gene Calculator - Smart</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #1a1a2e;
            color: #e0e0e0;
            min-height: 100vh;
            padding: 20px;
            position: relative;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
        }

        h1 {
            text-align: center;
            font-size: 2em;
            margin-bottom: 5px;
            color: #4ecdc4;
        }

        .section {
            background: rgba(255, 255, 255, 0.05);
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            padding: 20px;
            backdrop-filter: blur(10px);
        }

        .section h2 {
            color: #4ecdc4;
            margin-bottom: 15px;
            font-size: 1.3em;
        }

        /* Timer container styles */
        .timer-container {
            position: fixed;
            top: 75px;
            left: calc(50% - 349px);
            display: flex;
            flex-direction: column;
            gap: 5px;
            z-index: 1001;
            max-height: 400px;
            pointer-events: none;
        }

        .timer-item {
            background: rgba(26, 26, 46, 0.95);
            border: 1px solid rgba(78, 205, 196, 0.4);
            border-radius: 6px;
            padding: 4px 6px;
            display: flex;
            align-items: center;
            gap: 5px;
            min-width: 115px;
            animation: slideIn 0.3s ease-out;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
            pointer-events: auto;
            cursor: pointer;
            transition: transform 0.2s, opacity 0.3s, border-color 0.3s;
        }

        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }

        .timer-item:hover {
            transform: translateX(-2px);
            border-color: rgba(78, 205, 196, 0.6);
        }

        .timer-item.removing {
            animation: slideOut 0.3s ease-out forwards;
        }

        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(110%);
                opacity: 0;
            }
        }

        .timer-item.complete {
            background: rgba(76, 175, 80, 0.3);
            border-color: #4CAF50;
            animation: pulse 1s ease-in-out infinite;
        }

        @keyframes pulse {
            0%, 100% {
                border-color: #4CAF50;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
            }
            50% {
                border-color: #66BB6A;
                box-shadow: 0 2px 14px rgba(76, 175, 80, 0.4);
            }
        }

        .timer-icon {
            font-size: 1.05em;
            flex-shrink: 0;
        }

        .timer-info {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 0;
        }

        .timer-label {
            font-size: 0.7em;
            color: #999;
            text-transform: uppercase;
            letter-spacing: 0.1px;
            line-height: 1;
        }

        .timer-time {
            font-size: 0.98em;
            font-weight: bold;
            color: #4ecdc4;
            font-family: monospace;
            letter-spacing: 0.1px;
            line-height: 1.1;
        }

        .timer-item.complete .timer-time {
            color: #4CAF50;
        }

        .timer-close {
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background: rgba(244, 67, 54, 0.3);
            border: 1px solid #f44336;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: background-color 0.2s, transform 0.2s;
            flex-shrink: 0;
            font-size: 9px;
            color: #f44336;
            line-height: 1;
        }

        .timer-close:hover {
            background: rgba(244, 67, 54, 0.5);
            transform: scale(1.1);
        }

        /* Mobile adjustments for timers */
        @media (max-width: 768px) {
            .timer-container {
                position: fixed;
                top: 75px;
                left: 10px;
                max-width: 115px;
            }
            
            .timer-item {
                min-width: unset;
                width: 100%;
            }
        }

        /* Condition slider styles */
        .condition-container {
            position: absolute;
            top: 10px;
            left: 10px;
            display: flex;
            align-items: center;
            gap: 8px;
            z-index: 10;
        }

        .condition-label {
            font-size: 12px;
            color: #999;
            font-weight: 500;
        }

        .condition-slider {
            width: 80px;
            height: 6px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 3px;
            position: relative;
            cursor: not-allowed;
        }

        .condition-slider-fill {
            width: 70%;
            height: 100%;
            background: linear-gradient(90deg, #4ecdc4 0%, #44b5ad 100%);
            border-radius: 3px;
            position: relative;
        }

        .condition-slider-thumb {
            position: absolute;
            right: -6px;
            top: -5px;
            width: 16px;
            height: 16px;
            background: #4ecdc4;
            border: 2px solid #1a1a2e;
            border-radius: 50%;
            cursor: not-allowed;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .condition-value {
            font-size: 11px;
            color: #4ecdc4;
            font-weight: bold;
            min-width: 30px;
        }

        /* SCAN button styles */
        .scan-button {
            position: absolute;
            top: 10px;
            right: 10px;
            padding: 6px 16px;
            background: repeating-linear-gradient(
                45deg,
                #FFD700,
                #FFD700 10px,
                #000000 10px,
                #000000 20px
            );
            border: 2px solid #FFD700;
            border-radius: 6px;
            cursor: not-allowed;
            z-index: 10;
            font-weight: bold;
            font-size: 14px;
            color: white;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
            letter-spacing: 1px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
        }

        /* Tooltip styles */
        .coming-soon-tooltip {
            position: absolute;
            background: rgba(0, 0, 0, 0.9);
            color: #fff;
            padding: 6px 12px;
            border-radius: 4px;
            font-size: 12px;
            white-space: nowrap;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.2s;
            z-index: 1000;
            top: 100%;
            margin-top: 8px;
            left: 50%;
            transform: translateX(-50%);
        }

        .coming-soon-tooltip.show {
            opacity: 1;
        }

        .coming-soon-tooltip::before {
            content: '';
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            border: 4px solid transparent;
            border-bottom-color: rgba(0, 0, 0, 0.9);
        }
        
        .condition-container .coming-soon-tooltip {
            left: 0;
            transform: none;
        }
        
        .condition-container .coming-soon-tooltip::before {
            left: 30px;
        }
        
        .scan-button .coming-soon-tooltip {
            left: auto;
            right: 0;
            transform: none;
        }
        
        .scan-button .coming-soon-tooltip::before {
            left: auto;
            right: 20px;
            transform: none;
        }

        .gene-input-group {
            position: relative;
            display: flex;
            align-items: center;
        }

        .gene-input {
            padding: 5px;
            background: rgba(255, 255, 255, 0.1);
            border: 2px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            color: #fff;
            font-size: 14px;
            font-family: monospace;
            text-transform: uppercase;
            transition: border-color 0.3s;
        }

        select.gene-input {
            padding: 5px;
            background: rgba(0, 0, 0, 0.6);
            cursor: pointer;
        }
        
        select.gene-input option {
            background: #1a1a2e;
            color: #fff;
        }

        .gene-input:focus {
            outline: none;
            border-color: #4ecdc4;
        }

        .gene-display {
            display: inline-flex;
            gap: 1px;
            font-family: monospace;
            font-size: 14px;
            font-weight: bold;
            vertical-align: middle;
            flex-shrink: 0;
        }

        .gene {
            width: 25px;
            height: 25px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            font-size: 14px;
            flex-shrink: 0;
        }

        .grid-box.selected {
            border-color: #f44336;
        }

        .result-item .gene,
        .gene-display .gene {
            width: 16px;
            height: 16px;
            font-size: 9px;
            border-radius: 2px;
            flex-shrink: 0;
        }

        .results-title-target .gene {
            width: 14px;
            height: 14px;
            font-size: 8px;
            flex-shrink: 0;
        }

        .gene.G, .gene.Y, .gene.H {
            background: #4CAF50;
            color: white;
        }

        .gene.W, .gene.X {
            background: #f44336;
            color: white;
        }

        .results-section {
            margin: 0;
            margin-left: auto;
            margin-top: -4px;
            background: rgba(255, 255, 255, 0.05);
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-top: none;
            border-radius: 0 0 15px 15px;
            padding: 15px 25px;
            display: block;
            overflow-y: auto;
            overflow-x: hidden;
            width: 75%;
            min-width: 320px;
            position: relative;
            top: -460px;
            height: 460px;
            scrollbar-width: thin;
            scrollbar-color: rgba(78, 205, 196, 0.3) rgba(255, 255, 255, 0.05);
        }

        .results-section::-webkit-scrollbar {
            width: 6px;
        }

        .results-section::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 3px;
        }

        .results-section::-webkit-scrollbar-thumb {
            background: rgba(78, 205, 196, 0.3);
            border-radius: 3px;
        }

        .results-section::-webkit-scrollbar-thumb:hover {
            background: rgba(78, 205, 196, 0.5);
        }

        .results-section h2 {
            color: #4ecdc4;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 1.1em;
            min-height: 26px;
        }

        .results-title-target {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 0.9em;
        }

        .results-title-text {
            font-weight: normal;
            color: #999;
            font-size: 0.85em;
        }

        .result-item {
            padding: 12px 25px;
            margin-bottom: 12px;
            margin-left: -25px;
            margin-right: -25px;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 0;
            border: none;
            border-top: 2px solid rgba(255, 255, 255, 0.1);
            border-bottom: 2px solid rgba(255, 255, 255, 0.1);
            cursor: pointer;
            transition: background-color 0.3s, border-color 0.3s, box-shadow 0.3s;
            position: relative;
        }

        .result-item:hover {
            background: rgba(0, 0, 0, 0.5);
            border-top-color: rgba(255, 255, 255, 0.2);
            border-bottom-color: rgba(255, 255, 255, 0.2);
        }

        .result-item.selected-result {
            background: rgba(78, 205, 196, 0.15);
            border-top-color: #4ecdc4;
            border-bottom-color: #4ecdc4;
            position: relative;
        }

        .result-item.selected-result::before {
            content: '►';
            position: absolute;
            left: 8px;
            top: 50%;
            transform: translateY(-50%);
            color: #4ecdc4;
            font-size: 18px;
        }

        .result-item.perfect-match.selected-result {
            background: rgba(76, 175, 80, 0.25);
            border-top-color: #4CAF50;
            border-bottom-color: #4CAF50;
        }

        .result-item.perfect-match.selected-result::before {
            color: #4CAF50;
        }

        .result-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
            min-height: 24px;
        }

        .probability {
            font-size: 1.2em;
            font-weight: bold;
            color: #4ecdc4;
            white-space: nowrap;
        }

        .perfect-match {
            background: rgba(76, 175, 80, 0.2);
            border-top-color: #4CAF50;
            border-bottom-color: #4CAF50;
        }

        .target-label {
            display: block;
            margin-bottom: 5px;
            color: #bbb;
            font-size: 13px;
        }

        .help-text {
            font-size: 12px;
            color: #888;
            margin-top: 5px;
        }

        .grid-wrapper {
            width: fit-content;
            margin: 0 auto 20px auto;
        }

        .info-box {
            background: rgba(78, 205, 196, 0.1);
            border: 2px solid rgba(78, 205, 196, 0.3);
            border-radius: 10px 10px 0 0;
            border-bottom: none;
            padding: 40px 12px 12px 12px;
            margin-bottom: 0;
            overflow: visible;
            position: relative;
        }

        .controls-section {
            background: rgba(255, 255, 255, 0.05);
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-top: 2px solid rgba(78, 205, 196, 0.3);
            border-radius: 0 0 10px 10px;
            padding: 10px 25px 25px 25px;
            display: flex;
            justify-content: space-between;
            width: 75%;
            margin-left: auto;
        }

        .grid-container {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            grid-template-rows: repeat(8, 1fr);
            gap: 1px;
            width: 35vw;
            max-width: 450px;
            min-width: 350px;
            margin-top: 5px;
        }

        .grid-box {
            background: rgba(255, 255, 255, 0.05);
            border: 2px solid rgba(255, 255, 255, 0.2);
            border-radius: 4px;
            aspect-ratio: 3 / 1;
            transition: background-color 0.3s, border-color 0.3s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 1px;
            padding: 2px;
            cursor: pointer;
            position: relative;
            overflow: hidden;
        }

        .grid-box.selected {
            border: 2px solid #f44336 !important;
        }

        .grid-box.filled {
            background: rgba(0, 0, 0, 0.3);
            border-color: #4ecdc4;
        }

        .grid-box:hover:not(.filled) {
            border-color: #4ecdc4;
        }

        .grid-box.filled:hover:not(.selected) {
            border-color: #f44336;
        }

        .grid-box .gene {
            width: 14%;
            height: 70%;
            font-size: 9px;
            border-radius: 2px;
            flex-shrink: 0;
        }

        @media (max-width: 768px) {
            .results-section {
                width: 90%;
                min-width: unset;
                height: 460px;
                top: 0;
                position: static;
                margin-top: 15px;
                display: block;
            }

            .content-wrapper {
                flex-direction: column;
                align-items: center;
            }
            
            .plant-selector {
                flex-direction: row;
                flex-wrap: wrap;
                justify-content: center;
                margin-bottom: 15px;
                max-height: none;
                overflow-y: visible;
                max-width: 100%;
                gap: 4px;
            }
            
            .plant-item {
                min-width: 70px;
                padding: 12px 8px 5px 8px;
                flex: 0 1 calc(24% - 3px);
                height: 44px;
            }
            
            .plant-icon {
                font-size: 1.2em;
                right: 4px;
            }
            
            .plant-name {
                font-size: 0.7em;
                text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8), 0 0 4px rgba(0, 0, 0, 0.6);
            }
            
            .grid-container {
                width: 85vw;
                min-width: unset;
                max-width: 400px;
                margin-top: 5px;
            }
            
            .controls-section {
                margin-top: 0;
                justify-content: center !important;
                border-radius: 10px;
                flex-wrap: wrap;
                width: 90% !important;
                padding: 10px 15px 25px 15px !important;
                gap: 12px;
            }
            
            .info-box {
                border-radius: 10px;
                border-bottom: 2px solid rgba(78, 205, 196, 0.3);
                margin-bottom: 10px;
                padding: 35px 12px 12px 12px;
            }
            
            .condition-container {
                top: 5px;
                left: 5px;
            }
            
            .condition-slider {
                width: 60px;
            }
            
            .condition-label {
                font-size: 11px;
            }
            
            .scan-button {
                top: 5px;
                right: 5px;
                padding: 4px 10px;
                font-size: 12px;
            }
            
            #currentPlantDisplay {
                font-size: 1.1em !important;
            }
            
            .controls-wrapper {
                margin: 10px auto 15px auto;
            }
            
            .controls-wrapper .section {
                width: calc(85vw + 24px);
                min-width: unset;
                max-width: 424px;
                justify-content: center;
                border: 2px solid rgba(255, 255, 255, 0.1);
                margin-top: 0;
            }
            
            .controls-wrapper .section > div {
                justify-content: center !important;
            }
            
            .plant-divider {
                display: none !important;
            }
            
            .grid-container {
                width: 80vw;
                min-width: unset;
            }
            
            .gene-input-group .help-text {
                bottom: -16px;
                top: auto !important;
                left: 50% !important;
                transform: translateX(-50%);
            }
        }

        .plant-selector {
            display: flex;
            flex-direction: column;
            gap: 6px;
            max-height: 600px;
            overflow-y: auto;
            padding-right: 5px;
            max-width: 140px;
            scrollbar-width: thin;
            scrollbar-color: rgba(78, 205, 196, 0.3) rgba(255, 255, 255, 0.05);
        }

        .plant-selector::-webkit-scrollbar {
            width: 6px;
        }

        .plant-selector::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 3px;
        }

        .plant-selector::-webkit-scrollbar-thumb {
            background: rgba(78, 205, 196, 0.3);
            border-radius: 3px;
        }

        .plant-selector::-webkit-scrollbar-thumb:hover {
            background: rgba(78, 205, 196, 0.5);
        }

        .plant-item {
            position: relative;
            background: rgba(255, 255, 255, 0.05);
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 15px 8px 8px 8px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s;
            min-width: 90px;
            height: 65px;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            align-items: center;
            color: #e0e0e0;
            overflow: hidden;
        }

        .plant-item:hover {
            border-color: #4ecdc4;
            background: rgba(78, 205, 196, 0.05);
        }

        .plant-item.active {
            border-color: #4ecdc4;
            background: rgba(78, 205, 196, 0.1);
        }

        .plant-icon {
            position: absolute;
            top: 8px;
            right: 8px;
            font-size: 1.8em;
            opacity: 0.4;
            pointer-events: none;
        }

        .plant-name {
            font-size: 0.85em;
            font-weight: bold;
            color: #e0e0e0;
            text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.8);
        }

        .plant-progress {
            position: absolute;
            bottom: 0;
            left: 0;
            height: 3px;
            background: #4ecdc4;
            transition: width 0.5s ease;
            border-radius: 0 0 6px 6px;
        }

        .plant-button {
            position: absolute;
            top: 5px;
            left: 5px;
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background: rgba(78, 205, 196, 0.3);
            border: 1px solid #4ecdc4;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 8px;
            color: #4ecdc4;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .plant-button:hover {
            background: rgba(78, 205, 196, 0.5);
            transform: scale(1.1);
        }

        .plant-button.active {
            background: #4ecdc4;
            color: #1a1a2e;
            box-shadow: 0 0 8px rgba(78, 205, 196, 0.6);
        }

        /* Plant menu styles */
        .plant-menu {
            position: absolute;
            display: none;
            flex-direction: column;
            background: rgba(26, 26, 46, 0.95);
            border: 2px solid rgba(78, 205, 196, 0.4);
            border-radius: 8px;
            padding: 8px;
            gap: 4px;
            z-index: 1000;
            min-width: 120px;
            backdrop-filter: blur(10px);
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
        }

        .plant-menu-option {
            padding: 6px 10px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s;
            color: #e0e0e0;
            font-size: 12px;
            text-align: center;
        }

        .plant-menu-option:hover {
            background: rgba(78, 205, 196, 0.2);
            color: #4ecdc4;
        }

        .plant-menu-option span {
            font-weight: bold;
            margin-left: 5px;
        }
    </style>
</head>
<body>
    <!-- Timer container for harvest/clone timers -->
    <div id="timerContainer" class="timer-container"></div>

    <div class="container">
        <h1>Phragmites Gene Calculator</h1>
        
        <!-- Plant action menu -->
        <div id="plantMenu" class="plant-menu">
            <div class="plant-menu-option" onclick="handleHarvest()">
                Harvest in <span>2h 30m</span>
            </div>
            <div class="plant-menu-option" onclick="handleClone()">
                Clone in <span>13m</span>
            </div>
        </div>
        
        <div class="content-wrapper" style="display: flex; gap: 20px; align-items: flex-start; justify-content: center;">
            <div class="grid-wrapper">
                <div class="info-box">
                    <!-- Condition slider -->
                    <div class="condition-container" onmouseenter="showTooltip(this)" onmouseleave="hideTooltip(this)">
                        <span class="condition-label">Condition</span>
                        <div class="condition-slider">
                            <div class="condition-slider-fill">
                                <div class="condition-slider-thumb"></div>
                            </div>
                        </div>
                        <span class="condition-value">70%</span>
                        <div class="coming-soon-tooltip">Coming soon</div>
                    </div>
                    
                    <h3 id="currentPlantDisplay" style="position: absolute; top: 12px; left: 50%; transform: translateX(-50%); margin: 0; color: #4ecdc4; z-index: 10; text-align: center; white-space: nowrap; font-size: 1.1em;">Hemp</h3>
                    
                    <!-- SCAN button -->
                    <div class="scan-button" onmouseenter="showTooltip(this)" onmouseleave="hideTooltip(this)">
                        SCAN
                        <div class="coming-soon-tooltip">Coming soon</div>
                    </div>
                    
                    <div class="grid-container" id="gridContainer"></div>
                </div>
                
                <div style="display: flex; gap: 0; align-items: flex-start;">
                    <div class="plant-selector">
                        <div class="plant-item" data-plant="hemp" onclick="switchPlant('hemp')">
                            <button class="plant-button" onclick="event.stopPropagation(); openPlantMenu(event, 'hemp')"></button>
                            <div class="plant-progress" style="width: 0%;"></div>
                            <div class="plant-name">Hemp</div>
                            <div class="plant-icon">🌿</div>
                        </div>
                        <div class="plant-item" data-plant="blueberry" onclick="switchPlant('blueberry')">
                            <button class="plant-button" onclick="event.stopPropagation(); openPlantMenu(event, 'blueberry')"></button>
                            <div class="plant-progress" style="width: 0%;"></div>
                            <div class="plant-name">Blueberry</div>
                            <div class="plant-icon">🫐</div>
                        </div>
                        <div class="plant-item" data-plant="yellowberry" onclick="switchPlant('yellowberry')">
                            <button class="plant-button" onclick="event.stopPropagation(); openPlantMenu(event, 'yellowberry')"></button>
                            <div class="plant-progress" style="width: 0%;"></div>
                            <div class="plant-name">Yellow Berry</div>
                            <div class="plant-icon">🟡</div>
                        </div>
                        <div class="plant-item" data-plant="redberry" onclick="switchPlant('redberry')">
                            <button class="plant-button" onclick="event.stopPropagation(); openPlantMenu(event, 'redberry')"></button>
                            <div class="plant-progress" style="width: 0%;"></div>
                            <div class="plant-name">Red Berry</div>
                            <div class="plant-icon">🔴</div>
                        </div>
                        <div class="plant-item" data-plant="pumpkin" onclick="switchPlant('pumpkin')">
                            <button class="plant-button" onclick="event.stopPropagation(); openPlantMenu(event, 'pumpkin')"></button>
                            <div class="plant-progress" style="width: 0%;"></div>
                            <div class="plant-name">Pumpkin</div>
                            <div class="plant-icon">🎃</div>
                        </div>
                        <div class="plant-divider" style="width: 100%; height: 1px; background: rgba(255, 255, 255, 0.1); margin: 3px 0;" title="Additional plant types"></div>
                        <div class="plant-item" data-plant="wheat" onclick="switchPlant('wheat')">
                            <button class="plant-button" onclick="event.stopPropagation(); openPlantMenu(event, 'wheat')"></button>
                            <div class="plant-progress" style="width: 0%;"></div>
                            <div class="plant-name">Wheat</div>
                            <div class="plant-icon">🌾</div>
                        </div>
                        <div class="plant-item" data-plant="orchids" onclick="switchPlant('orchids')">
                            <button class="plant-button" onclick="event.stopPropagation(); openPlantMenu(event, 'orchids')"></button>
                            <div class="plant-progress" style="width: 0%;"></div>
                            <div class="plant-name">Orchids</div>
                            <div class="plant-icon">🌺</div>
                        </div>
                        <div class="plant-item" data-plant="sunflowers" onclick="switchPlant('sunflowers')">
                            <button class="plant-button" onclick="event.stopPropagation(); openPlantMenu(event, 'sunflowers')"></button>
                            <div class="plant-progress" style="width: 0%;"></div>
                            <div class="plant-name">Sunflowers</div>
                            <div class="plant-icon">🌻</div>
                        </div>
                        <div class="plant-item" data-plant="roses" onclick="switchPlant('roses')">
                            <button class="plant-button" onclick="event.stopPropagation(); openPlantMenu(event, 'roses')"></button>
                            <div class="plant-progress" style="width: 0%;"></div>
                            <div class="plant-name">Roses</div>
                            <div class="plant-icon">🌹</div>
                        </div>
                        <div class="plant-item" data-plant="corn" onclick="switchPlant('corn')">
                            <button class="plant-button" onclick="event.stopPropagation(); openPlantMenu(event, 'corn')"></button>
                            <div class="plant-progress" style="width: 0%;"></div>
                            <div class="plant-name">Corn</div>
                            <div class="plant-icon">🌽</div>
                        </div>
                        <div class="plant-item" data-plant="potatoes" onclick="switchPlant('potatoes')">
                            <button class="plant-button" onclick="event.stopPropagation(); openPlantMenu(event, 'potatoes')"></button>
                            <div class="plant-progress" style="width: 0%;"></div>
                            <div class="plant-name">Potatoes</div>
                            <div class="plant-icon">🥔</div>
                        </div>
                    </div>
                    
                    <div class="controls-section" style="position: relative; display: flex; align-items: flex-end; justify-content: space-between; align-self: flex-start;">
                        <div style="position: relative;">
                            <label class="target-label" title="Click to highlight best gene">Best 🧬</label>
                            <div id="bestGeneDisplay" style="background: rgba(76, 175, 80, 0.1); border: 2px solid rgba(76, 175, 80, 0.3); border-radius: 8px; padding: 4px 12px; height: 31px; display: flex; align-items: center; justify-content: center; min-width: 95px; cursor: pointer; transition: background-color 0.3s, border-color 0.3s;" onclick="highlightBestGene()">
                                <span style="color: #888; font-size: 12px;">None</span>
                            </div>
                        </div>
                        <div style="position: relative;">
                            <label class="target-label">Add 🧬</label>
                            <div class="gene-input-group" style="position: relative;">
                                <input type="text" class="gene-input" id="geneInput" placeholder="GGYYYX" maxlength="6" style="width: 95px;" title="Enter 6 genes using Y, G, H, X, or W">
                                <div class="help-text" style="position: absolute; top: 33px; left: 50%; transform: translateX(-50%); font-size: 9px; color: #888; white-space: nowrap;">Y,G,H,X,W • Enter</div>
                            </div>
                        </div>
                        <div style="position: relative;">
                            <label class="target-label">Target 🧬</label>
                            <select class="gene-input" id="targetSelect" style="width: 95px; height: 31px; cursor: pointer;" onchange="if(genes.length >= 2) calculate(); updatePlantCompletionStatus();">
                                <option value="GGYYYY" selected>GGYYYY</option>
                                <option value="GGGYYY">GGGYYY</option>
                                <option value="GGGGGY">GGGGGY</option>
                                <option value="GGGGGG">GGGGGG</option>
                                <option value="GGGYYH">GGGYYH</option>
                                <option value="GGGYGH">GGGYGH</option>
                                <option value="GGGGGH">GGGGGH</option>
                                <option value="GGYYHH">GGYYHH</option>
                            </select>
                        </div>
                    </div>
                </div>
                
                <div class="results-section" id="results">
                    <h2 id="resultsTitle">Results</h2>
                    <div id="resultsContent">
                        <p style="color: #888; text-align: center; margin-top: 20px;">Add at least 2 genes to see breeding combinations</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Tooltip functions
        let tooltipTimeout;
        
        function showTooltip(element) {
            tooltipTimeout = setTimeout(() => {
                const tooltip = element.querySelector('.coming-soon-tooltip');
                if (tooltip) {
                    tooltip.classList.add('show');
                }
            }, 500); // 0.5 seconds
        }
        
        function hideTooltip(element) {
            clearTimeout(tooltipTimeout);
            const tooltip = element.querySelector('.coming-soon-tooltip');
            if (tooltip) {
                tooltip.classList.remove('show');
            }
        }

        // Global variables
        let genes = [];
        let gridBoxes = [];
        let selectedResultIndex = -1;
        let currentResults = [];
        let currentPlant = 'hemp';
        let activeMenuPlant = null;
        let activeTimers = [];
        
        // Plant-specific gene storage
        let plantGenes = {
            hemp: [],
            blueberry: [],
            yellowberry: [],
            redberry: [],
            pumpkin: [],
            roses: [],
            orchids: [],
            sunflowers: [],
            wheat: [],
            corn: [],
            potatoes: []
        };

        // Plant icons mapping
        const plantIcons = {
            hemp: '🌿',
            blueberry: '🫐',
            yellowberry: '🟡',
            redberry: '🔴',
            pumpkin: '🎃',
            roses: '🌹',
            orchids: '🌺',
            sunflowers: '🌻',
            wheat: '🌾',
            corn: '🌽',
            potatoes: '🥔'
        };

        // Plant display names
        const plantDisplayNames = {
            hemp: 'Hemp',
            blueberry: 'Blueberry',
            yellowberry: 'Yellow Berry',
            redberry: 'Red Berry',
            pumpkin: 'Pumpkin',
            roses: 'Roses',
            orchids: 'Orchids',
            sunflowers: 'Sunflowers',
            wheat: 'Wheat',
            corn: 'Corn',
            potatoes: 'Potatoes'
        };

        // Gene points for breeding calculation
        const genePoints = {
            'G': 50,
            'Y': 60,
            'H': 60,
            'W': 60,
            'X': 60
        };

        // Gene quality scoring for finding best gene
        // G and Y are most valuable (3 points each for growth/yield)
        // H is good but less important (1 point for hardiness)
        // W and X are negative (-2 points each)
        const geneQualityScores = {
            'G': 3,  // Growth - highest priority
            'Y': 3,  // Yield - highest priority
            'H': 1,  // Hardiness - good but less valuable
            'W': -2, // Water consumption (bad)
            'X': -2  // Null/empty (bad)
        };

        // Calculate clone time reduction based on G genes
        function calculateCloneTimeReduction(plantType) {
            const genesArray = (plantType === currentPlant) ? genes : plantGenes[plantType];
            if (!genesArray || genesArray.length === 0) return 0;
            
            // Find best gene for this plant
            let bestGene = genesArray[0];
            let bestScore = calculateGeneQuality(bestGene);
            let bestGYCount = bestGene.split('').filter(g => ['G', 'Y'].includes(g)).length;
            
            genesArray.forEach(gene => {
                const score = calculateGeneQuality(gene);
                const gyCount = gene.split('').filter(g => ['G', 'Y'].includes(g)).length;
                
                if (score > bestScore || (score === bestScore && gyCount > bestGYCount)) {
                    bestScore = score;
                    bestGene = gene;
                    bestGYCount = gyCount;
                }
            });
            
            // Count G genes in best gene
            const gCount = bestGene.split('').filter(g => g === 'G').length;
            
            // Calculate reduction: 2 minutes for first G, 1 minute for each additional G
            if (gCount === 0) return 0;
            return 2 + (gCount - 1); // 2 for first G, plus 1 for each additional
        }

        // Calculate harvest time reduction based on G genes
        function calculateHarvestTimeReduction(plantType) {
            const genesArray = (plantType === currentPlant) ? genes : plantGenes[plantType];
            if (!genesArray || genesArray.length === 0) return 0;
            
            // Find best gene for this plant
            let bestGene = genesArray[0];
            let bestScore = calculateGeneQuality(bestGene);
            let bestGYCount = bestGene.split('').filter(g => ['G', 'Y'].includes(g)).length;
            
            genesArray.forEach(gene => {
                const score = calculateGeneQuality(gene);
                const gyCount = gene.split('').filter(g => ['G', 'Y'].includes(g)).length;
                
                if (score > bestScore || (score === bestScore && gyCount > bestGYCount)) {
                    bestScore = score;
                    bestGene = gene;
                    bestGYCount = gyCount;
                }
            });
            
            // Count G genes in best gene
            const gCount = bestGene.split('').filter(g => g === 'G').length;
            
            // Calculate reduction in minutes based on G count
            const reductions = {
                0: 0,
                1: 20,
                2: 39,
                3: 50,
                4: 56,
                5: 60,
                6: 62
            };
            
            return reductions[gCount] || 0;
        }

        // Timer functions
        function createTimer(action, plantType, duration) {
            // Check if we already have 6 timers
            if (activeTimers.length >= 6) {
                alert('Maximum of 6 timers reached! Please wait for one to complete.');
                return;
            }

            const timerId = Date.now();
            const timer = {
                id: timerId,
                action: action,
                plantType: plantType,
                duration: duration,
                remaining: duration,
                interval: null,
                element: null
            };

            // Create timer element
            const timerElement = document.createElement('div');
            timerElement.className = 'timer-item';
            timerElement.dataset.timerId = timerId;
            
            // Check if this is a reduced harvest timer
            const isHarvest = action === 'Harvest';
            const isClone = action === 'Clone';
            const reduction = isHarvest ? calculateHarvestTimeReduction(plantType) : 
                            isClone ? calculateCloneTimeReduction(plantType) : 0;
            const reductionText = reduction > 0 ? \` (-\${reduction}m)\` : '';
            
            timerElement.title = \`Click to remove this \${action.toLowerCase()} timer\${reductionText}\`;
            
            timerElement.innerHTML = \`
                <div class="timer-icon">\${plantIcons[plantType]}</div>
                <div class="timer-info">
                    <div class="timer-label">\${action}\${reduction > 0 ? '*' : ''}</div>
                    <div class="timer-time">\${formatTime(duration)}</div>
                </div>
                <div class="timer-close" onclick="removeTimer(\${timerId})" title="Cancel timer">×</div>
            \`;

            // Add to container
            const container = document.getElementById('timerContainer');
            container.appendChild(timerElement);
            timer.element = timerElement;

            // Start countdown - update every second for smooth countdown
            timer.interval = setInterval(() => {
                timer.remaining--;
                const timeDisplay = timerElement.querySelector('.timer-time');
                
                if (timer.remaining <= 0) {
                    // Timer complete
                    clearInterval(timer.interval);
                    timeDisplay.textContent = 'READY!';
                    timerElement.classList.add('complete');
                    timerElement.title = \`\${action} complete for \${plantDisplayNames[plantType]}! Click to dismiss.\`;
                    
                    // Change click behavior when complete
                    timerElement.onclick = () => removeTimer(timerId);
                } else {
                    timeDisplay.textContent = formatTime(timer.remaining);
                }
            }, 1000);

            activeTimers.push(timer);
        }

        function removeTimer(timerId) {
            const timerIndex = activeTimers.findIndex(t => t.id === timerId);
            if (timerIndex === -1) return;

            const timer = activeTimers[timerIndex];
            
            // Clear interval
            if (timer.interval) {
                clearInterval(timer.interval);
            }

            // Animate removal
            timer.element.classList.add('removing');
            
            setTimeout(() => {
                timer.element.remove();
                activeTimers.splice(timerIndex, 1);
            }, 300);
        }

        function formatTime(seconds) {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            return \`\${hours}:\${minutes.toString().padStart(2, '0')}\`;
        }

        function handleHarvest() {
            if (activeMenuPlant) {
                // Base time is 2:30 (150 minutes = 9000 seconds)
                const baseMinutes = 150;
                const reduction = calculateHarvestTimeReduction(activeMenuPlant);
                const finalMinutes = baseMinutes - reduction;
                const finalSeconds = finalMinutes * 60;
                
                createTimer('Harvest', activeMenuPlant, finalSeconds);
            }
            
            // Close menu
            document.getElementById('plantMenu').style.display = 'none';
            document.removeEventListener('click', closeMenuOnOutsideClick);
            document.querySelectorAll('.plant-button.active').forEach(btn => {
                btn.classList.remove('active');
            });
            activeMenuPlant = null;
        }

        function handleClone() {
            if (activeMenuPlant) {
                // Base time is 0:13 (13 minutes = 780 seconds)
                const baseMinutes = 13;
                const reduction = calculateCloneTimeReduction(activeMenuPlant);
                const finalMinutes = baseMinutes - reduction;
                const finalSeconds = finalMinutes * 60;
                
                createTimer('Clone', activeMenuPlant, finalSeconds);
            }
            
            // Close menu
            document.getElementById('plantMenu').style.display = 'none';
            document.removeEventListener('click', closeMenuOnOutsideClick);
            document.querySelectorAll('.plant-button.active').forEach(btn => {
                btn.classList.remove('active');
            });
            activeMenuPlant = null;
        }

        // Utility functions
        function calculateGeneQuality(geneString) {
            return geneString.split('').reduce((score, gene) => score + geneQualityScores[gene], 0);
        }

        function validateGenes(geneString) {
            if (geneString.length !== 6) return false;
            const validGenes = ['G', 'Y', 'H', 'W', 'X'];
            return geneString.split('').every(g => validGenes.includes(g));
        }

        function createGeneDisplay(geneString) {
            const display = document.createElement('div');
            display.className = 'gene-display';
            
            geneString.split('').forEach(g => {
                const gene = document.createElement('div');
                gene.className = \`gene \${g}\`;
                gene.textContent = g;
                display.appendChild(gene);
            });
            
            return display;
        }

        // Progress bar functions
        function calculatePlantProgress(plantType) {
            const genesArray = (plantType === currentPlant) ? genes : plantGenes[plantType];
            if (!genesArray || genesArray.length === 0) return 0;
            
            // Find best gene for this plant
            let bestGene = genesArray[0];
            let bestScore = calculateGeneQuality(bestGene);
            let bestGYCount = bestGene.split('').filter(g => ['G', 'Y'].includes(g)).length;
            
            genesArray.forEach(gene => {
                const score = calculateGeneQuality(gene);
                const gyCount = gene.split('').filter(g => ['G', 'Y'].includes(g)).length;
                
                if (score > bestScore || (score === bestScore && gyCount > bestGYCount)) {
                    bestScore = score;
                    bestGene = gene;
                    bestGYCount = gyCount;
                }
            });
            
            // Count G and Y genes in best gene
            const gCount = bestGene.split('').filter(g => g === 'G').length;
            const yCount = bestGene.split('').filter(g => g === 'Y').length;
            const totalGY = gCount + yCount;
            
            // Return percentage of G and Y genes (out of 6 possible)
            return (totalGY / 6) * 100;
        }

        function updatePlantProgress(plantType) {
            const progress = calculatePlantProgress(plantType);
            const plantItem = document.querySelector(\`[data-plant="\${plantType}"]\`);
            if (plantItem) {
                const progressBar = plantItem.querySelector('.plant-progress');
                progressBar.style.width = \`\${progress}%\`;
            }
        }

        function updateAllPlantProgress() {
            Object.keys(plantGenes).forEach(plantType => {
                updatePlantProgress(plantType);
            });
        }

        function updatePlantCompletionStatus() {
            const target = document.getElementById('targetSelect').value;
            
            Object.keys(plantGenes).forEach(plantType => {
                const genesArray = (plantType === currentPlant) ? genes : plantGenes[plantType];
                const hasTargetGene = genesArray.some(gene => gene === target);
                
                const plantItem = document.querySelector(\`[data-plant="\${plantType}"]\`);
                if (plantItem) {
                    if (hasTargetGene) {
                        // Add green checkmark
                        plantItem.style.boxShadow = '0 0 10px rgba(76, 175, 80, 0.6)';
                        plantItem.style.borderColor = '#4CAF50';
                    } else {
                        // Remove completion indicator
                        plantItem.style.boxShadow = '';
                        plantItem.style.borderColor = '';
                    }
                }
            });
        }

        // Grid functions
        function initializeGrid() {
            const container = document.getElementById('gridContainer');
            container.innerHTML = '';
            gridBoxes = [];
            
            for (let i = 0; i < 48; i++) {
                const box = document.createElement('div');
                box.className = 'grid-box';
                box.dataset.index = i;
                box.onclick = () => handleGridClick(i);
                container.appendChild(box);
                gridBoxes.push(box);
            }
        }

        function handleGridClick(index) {
            const box = gridBoxes[index];
            
            if (box.classList.contains('filled')) {
                // Remove gene
                const geneIndex = parseInt(box.dataset.geneIndex);
                removeGene(geneIndex);
            } else {
                // Prompt for new gene
                const gene = prompt('Enter 6-character gene sequence (G, Y, H, W, X):');
                if (gene && validateGenes(gene.toUpperCase())) {
                    addGeneToGrid(gene.toUpperCase(), index);
                } else if (gene) {
                    alert('Invalid gene sequence. Please use exactly 6 characters: G, Y, H, W, X');
                }
            }
        }

        function addGeneToGrid(geneString, gridIndex) {
            // Add to current plant's genes
            genes.push(geneString);
            
            // Save to plant-specific storage
            plantGenes[currentPlant] = [...genes];
            
            // Update grid
            const box = gridBoxes[gridIndex];
            box.classList.add('filled');
            box.dataset.geneIndex = genes.length - 1;
            box.innerHTML = '';
            
            geneString.split('').forEach(g => {
                const gene = document.createElement('div');
                gene.className = \`gene \${g}\`;
                gene.textContent = g;
                box.appendChild(gene);
            });
            
            // Calculate if we have 2+ genes
            if (genes.length >= 2) {
                calculate();
            }
            
            updateBestGeneDisplay();
            updatePlantProgress(currentPlant);
            updatePlantCompletionStatus();
        }

        function removeGene(geneIndex) {
            // Remove from arrays
            genes.splice(geneIndex, 1);
            plantGenes[currentPlant] = [...genes];
            
            // Update grid - need to redraw all filled boxes with correct indices
            redrawGrid();
            
            // Recalculate if we still have 2+ genes
            if (genes.length >= 2) {
                calculate();
            } else {
                // Clear results
                document.getElementById('resultsContent').innerHTML = '<p style="color: #888; text-align: center; margin-top: 20px;">Add at least 2 genes to see breeding combinations</p>';
            }
            
            updateBestGeneDisplay();
            updatePlantProgress(currentPlant);
            updatePlantCompletionStatus();
        }

        function redrawGrid() {
            // Clear all boxes
            gridBoxes.forEach(box => {
                box.classList.remove('filled');
                box.innerHTML = '';
                delete box.dataset.geneIndex;
            });
            
            // Redraw filled boxes
            genes.forEach((gene, index) => {
                // Find first empty box
                const emptyBox = gridBoxes.find(box => !box.classList.contains('filled'));
                if (emptyBox) {
                    emptyBox.classList.add('filled');
                    emptyBox.dataset.geneIndex = index;
                    
                    gene.split('').forEach(g => {
                        const geneDiv = document.createElement('div');
                        geneDiv.className = \`gene \${g}\`;
                        geneDiv.textContent = g;
                        emptyBox.appendChild(geneDiv);
                    });
                }
            });
        }

        function addGene() {
            const input = document.getElementById('geneInput');
            const gene = input.value.trim().toUpperCase();
            
            if (!gene) return;
            
            if (!validateGenes(gene)) {
                alert('Invalid gene sequence. Please use exactly 6 characters: G, Y, H, W, X');
                return;
            }
            
            // Find first empty grid box
            const emptyBox = gridBoxes.find(box => !box.classList.contains('filled'));
            if (!emptyBox) {
                alert('Grid is full! Remove a gene first.');
                return;
            }
            
            const gridIndex = parseInt(emptyBox.dataset.index);
            addGeneToGrid(gene, gridIndex);
            
            input.value = '';
        }

        function switchPlant(plantType) {
            // Save current genes to current plant
            plantGenes[currentPlant] = [...genes];
            
            // Switch to new plant
            currentPlant = plantType;
            genes = [...(plantGenes[plantType] || [])];
            
            // Update visual indicators
            document.querySelectorAll('.plant-item').forEach(item => {
                item.classList.remove('active');
            });
            document.querySelector(\`[data-plant="\${plantType}"]\`).classList.add('active');
            
            // Update display
            document.getElementById('currentPlantDisplay').textContent = plantDisplayNames[plantType];
            
            // Redraw grid
            redrawGrid();
            
            // Recalculate if we have 2+ genes
            if (genes.length >= 2) {
                calculate();
            } else {
                document.getElementById('resultsContent').innerHTML = '<p style="color: #888; text-align: center; margin-top: 20px;">Add at least 2 genes to see breeding combinations</p>';
            }
            
            updateBestGeneDisplay();
            updatePlantCompletionStatus();
        }

        function highlightBestGene() {
            if (genes.length === 0) return;
            
            // Find best gene
            let bestGeneIndex = 0;
            let bestScore = calculateGeneQuality(genes[0]);
            let bestGYCount = genes[0].split('').filter(g => ['G', 'Y'].includes(g)).length;
            
            genes.forEach((gene, index) => {
                const score = calculateGeneQuality(gene);
                const gyCount = gene.split('').filter(g => ['G', 'Y'].includes(g)).length;
                
                if (score > bestScore || (score === bestScore && gyCount > bestGYCount)) {
                    bestScore = score;
                    bestGeneIndex = index;
                    bestGYCount = gyCount;
                }
            });
            
            // Clear previous highlights
            clearHighlights();
            
            // Highlight best gene
            const bestBox = gridBoxes.find(box => 
                box.classList.contains('filled') && 
                parseInt(box.dataset.geneIndex) === bestGeneIndex
            );
            
            if (bestBox) {
                bestBox.classList.add('selected');
            }
        }

        function clearHighlights() {
            gridBoxes.forEach(box => {
                box.classList.remove('selected');
            });
        }

        function highlightGridBoxes(targetGenes) {
            clearHighlights();
            
            targetGenes.forEach(targetGene => {
                genes.forEach((gene, index) => {
                    if (gene === targetGene) {
                        const box = gridBoxes.find(box => 
                            box.classList.contains('filled') && 
                            parseInt(box.dataset.geneIndex) === index
                        );
                        if (box) {
                            box.classList.add('selected');
                        }
                    }
                });
            });
        }

        function selectResult(index) {
            selectedResultIndex = index;
            
            // Update visual selection
            document.querySelectorAll('.result-item').forEach((item, i) => {
                if (i === index) {
                    item.classList.add('selected-result');
                } else {
                    item.classList.remove('selected-result');
                }
            });
            
            // Highlight the corresponding grid boxes
            if (currentResults[index]) {
                highlightGridBoxes(currentResults[index].plants);
            }
        }

        function updateBestGeneDisplay() {
            const display = document.getElementById('bestGeneDisplay');
            
            if (genes.length === 0) {
                display.innerHTML = '<span style="color: #888; font-size: 12px;">None</span>';
                return;
            }
            
            // Find best gene
            let bestGene = genes[0];
            let bestScore = calculateGeneQuality(bestGene);
            let bestGYCount = bestGene.split('').filter(g => ['G', 'Y'].includes(g)).length;
            
            genes.forEach(gene => {
                const score = calculateGeneQuality(gene);
                const gyCount = gene.split('').filter(g => ['G', 'Y'].includes(g)).length;
                
                if (score > bestScore || (score === bestScore && gyCount > bestGYCount)) {
                    bestScore = score;
                    bestGene = gene;
                    bestGYCount = gyCount;
                }
            });
            
            display.innerHTML = '';
            display.appendChild(createGeneDisplay(bestGene));
        }

        // Breeding calculation functions
        function calculateBreedingPairs(geneArray, target) {
            const results = [];
            
            for (let i = 0; i < geneArray.length; i++) {
                for (let j = i + 1; j < geneArray.length; j++) {
                    const parent1 = geneArray[i];
                    const parent2 = geneArray[j];
                    
                    const outcomes = calculateBreedingOutcomes(parent1, parent2);
                    const matchingOutcomes = outcomes.filter(outcome => outcome.result === target);
                    
                    if (matchingOutcomes.length > 0) {
                        const totalProbability = matchingOutcomes.reduce((sum, outcome) => sum + outcome.probability, 0);
                        results.push({
                            plants: [parent1, parent2],
                            result: target,
                            probability: Math.round(totalProbability),
                            perfectMatch: true,
                            matchScore: 0,
                            resultCount: outcomes.length
                        });
                    } else {
                        // Find best partial match
                        let bestMatch = null;
                        let bestMatchScore = 7; // Start with worse than possible
                        
                        outcomes.forEach(outcome => {
                            const matchScore = calculateMatchScore(outcome.result, target);
                            if (matchScore < bestMatchScore) {
                                bestMatchScore = matchScore;
                                bestMatch = {
                                    plants: [parent1, parent2],
                                    result: outcome.result,
                                    probability: outcome.probability,
                                    perfectMatch: false,
                                    matchScore: matchScore,
                                    resultCount: outcomes.length
                                };
                            }
                        });
                        
                        if (bestMatch && bestMatchScore <= 3) { // Only show if 3 or fewer mismatches
                            results.push(bestMatch);
                        }
                    }
                }
            }
            
            // Sort by perfect matches first, then by probability
            results.sort((a, b) => {
                if (a.perfectMatch && !b.perfectMatch) return -1;
                if (!a.perfectMatch && b.perfectMatch) return 1;
                if (a.perfectMatch && b.perfectMatch) return b.probability - a.probability;
                if (a.matchScore !== b.matchScore) return a.matchScore - b.matchScore;
                return b.probability - a.probability;
            });
            
            return results;
        }

        function calculateMatchScore(result, target) {
            let mismatches = 0;
            for (let i = 0; i < 6; i++) {
                if (result[i] !== target[i]) {
                    mismatches++;
                }
            }
            return mismatches;
        }

        function calculateBreedingOutcomes(parent1, parent2) {
            const outcomes = new Map();
            
            // Generate all possible combinations
            for (let i = 0; i < 64; i++) { // 2^6 = 64 combinations
                let result = '';
                let probability = 1;
                
                for (let pos = 0; pos < 6; pos++) {
                    const useParent1 = (i >> pos) & 1;
                    if (useParent1) {
                        result += parent1[pos];
                        probability *= calculateGeneInheritance(parent1[pos], parent2[pos], parent1[pos]);
                    } else {
                        result += parent2[pos];
                        probability *= calculateGeneInheritance(parent1[pos], parent2[pos], parent2[pos]);
                    }
                }
                
                if (outcomes.has(result)) {
                    outcomes.set(result, outcomes.get(result) + probability);
                } else {
                    outcomes.set(result, probability);
                }
            }
            
            // Convert to array and normalize probabilities
            const total = Array.from(outcomes.values()).reduce((sum, prob) => sum + prob, 0);
            return Array.from(outcomes.entries()).map(([result, probability]) => ({
                result,
                probability: (probability / total) * 100
            }));
        }

        function calculateGeneInheritance(gene1, gene2, targetGene) {
            // Simplified inheritance model
            if (gene1 === gene2) {
                return gene1 === targetGene ? 1 : 0;
            }
            
            // Different genes - 50% chance each
            return 0.5;
        }

        function calculate() {
            const target = document.getElementById('targetSelect').value;
            const results = calculateBreedingPairs(genes, target);
            displayResults(results, target);
        }

        function displayResults(results, target) {
            const content = document.getElementById('resultsContent');
            const titleElement = document.getElementById('resultsTitle');
            
            clearHighlights();
            selectedResultIndex = -1;
            currentResults = results;
            
            titleElement.innerHTML = \`
                <span>Results for \${plantDisplayNames[currentPlant]}</span>
                <span class="results-title-target">
                    <span class="results-title-text">Target:</span>
                    \${createGeneDisplay(target).outerHTML}
                </span>
            \`;
            
            let html = '';
            
            if (genes.length < 2) {
                html = '<p style="color: #888; text-align: center; margin-top: 20px;">Add at least 2 genes to see breeding combinations</p>';
            } else if (results.length === 0) {
                html = '<p>No combinations found. Try adding more clones.</p>';
            } else {
                results.forEach((result, index) => {
                    html += \`
                        <div class="result-item \${result.perfectMatch ? 'perfect-match' : ''} \${index === 0 ? 'selected-result' : ''}" 
                             data-index="\${index}"
                             onclick="selectResult(\${index})">
                            <div class="result-header">
                                <div>
                                    <strong>Result:</strong> \${createGeneDisplay(result.result).outerHTML}
                                    \${result.perfectMatch ? '<span style="color: #4CAF50; margin-left: 10px;">- PERFECT MATCH!</span>' : ''}
                                </div>
                                <div class="probability">\${result.probability}% chance</div>
                            </div>
                            <div style="margin: 10px 0 8px 0; text-align: center;">
                                <div style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: center;">
                                    \${result.plants.map(p => createGeneDisplay(p).outerHTML).join('')}
                                </div>
                            </div>
                            \${!result.perfectMatch ? \`<div style="color: #FFA726; margin-top: 5px;">Match score: \${6 - result.matchScore}/6 genes correct</div>\` : ''}
                            \${result.resultCount > 1 ? \`<div style="color: #888; margin-top: 5px;">\${result.resultCount} possible outcomes</div>\` : ''}
                        </div>
                    \`;
                });
            }
            
            content.innerHTML = html;
            content.style.marginLeft = '-25px';
            content.style.marginRight = '-25px';
            content.style.paddingLeft = '25px';
            content.style.paddingRight = '25px';
            content.style.paddingTop = '5px';
            content.style.paddingBottom = '10px';
            content.style.marginTop = '5px';
            
            if (results.length > 0) {
                selectedResultIndex = 0;
                highlightGridBoxes(results[0].plants);
            }
        }

        // Menu functions
        function openPlantMenu(event, plantType) {
            const menu = document.getElementById('plantMenu');
            const button = event.target;
            const plantItem = button.closest('.plant-item');
            const rect = plantItem.getBoundingClientRect();
            
            // Remove active class from any other buttons
            document.querySelectorAll('.plant-button.active').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Add active class to current button
            button.classList.add('active');
            
            // Update harvest time based on G genes
            const baseMinutes = 150; // 2:30
            const reduction = calculateHarvestTimeReduction(plantType);
            const finalMinutes = baseMinutes - reduction;
            const hours = Math.floor(finalMinutes / 60);
            const minutes = finalMinutes % 60;
            
            // Update menu text
            const harvestOption = menu.querySelector('.plant-menu-option:first-child span');
            if (minutes === 0) {
                harvestOption.textContent = \`\${hours}h\`;
            } else {
                harvestOption.textContent = \`\${hours}h \${minutes}m\`;
            }
            
            // Update clone time based on G genes
            const baseCloneMinutes = 13;
            const cloneReduction = calculateCloneTimeReduction(plantType);
            const finalCloneMinutes = baseCloneMinutes - cloneReduction;
            
            const cloneOption = menu.querySelector('.plant-menu-option:last-child span');
            cloneOption.textContent = \`\${finalCloneMinutes}m\`;
            
            // Check if mobile view
            const isMobile = window.innerWidth <= 768;
            
            if (isMobile) {
                // Center menu on mobile
                menu.style.display = 'flex';
                menu.style.left = '50%';
                menu.style.transform = 'translateX(-50%)';
                menu.style.top = '50%';
                menu.style.marginTop = '-60px';
            } else {
                // Position to the left on desktop
                const menuWidth = 120;
                let leftPos = rect.left - menuWidth - 10;
                
                if (leftPos < 10) {
                    leftPos = 10;
                }
                
                menu.style.display = 'flex';
                menu.style.left = leftPos + 'px';
                menu.style.top = rect.top + 'px';
                menu.style.transform = 'none';
                menu.style.marginTop = '0';
            }
            
            activeMenuPlant = plantType;
            
            // Close menu when clicking outside
            setTimeout(() => {
                document.addEventListener('click', closeMenuOnOutsideClick);
            }, 0);
        }

        function closeMenuOnOutsideClick(event) {
            const menu = document.getElementById('plantMenu');
            if (!menu.contains(event.target) && !event.target.classList.contains('plant-button')) {
                menu.style.display = 'none';
                document.removeEventListener('click', closeMenuOnOutsideClick);
                document.querySelectorAll('.plant-button.active').forEach(btn => {
                    btn.classList.remove('active');
                });
                activeMenuPlant = null;
            }
        }

        // Initialize on page load
        document.addEventListener('DOMContentLoaded', () => {
            initializeGrid();
            updateBestGeneDisplay();
            updateAllPlantProgress();
            updatePlantCompletionStatus();
            
            // Set initial results title
            document.getElementById('resultsTitle').innerHTML = '<span>Results for Hemp</span>';
            
            const geneInput = document.getElementById('geneInput');
            
            // Add input event to filter characters
            geneInput.addEventListener('input', (e) => {
                // Only allow Y, G, H, X, W (case insensitive)
                e.target.value = e.target.value.toUpperCase().replace(/[^YGHXW]/g, '');
            });
            
            // Prevent invalid characters from being typed
            geneInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    addGene();
                } else if (!/[yghxwYGHXW]/.test(e.key) && !e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                }
            });
            
            // Handle paste events
            geneInput.addEventListener('paste', (e) => {
                e.preventDefault();
                const pastedText = (e.clipboardData || window.clipboardData).getData('text');
                const filteredText = pastedText.toUpperCase().replace(/[^YGHXW]/g, '');
                const currentValue = e.target.value;
                const selectionStart = e.target.selectionStart;
                const selectionEnd = e.target.selectionEnd;
                const newValue = currentValue.slice(0, selectionStart) + filteredText + currentValue.slice(selectionEnd);
                e.target.value = newValue.slice(0, 6); // Respect maxlength
            });
        });
    </script>
</body>
</html>`

  // Open popup window with features to stay on top
  const popup = window.open('', 'geneCalculator', 
    'width=1600,height=900,resizable=yes,scrollbars=yes,toolbar=no,menubar=no,location=no,status=no,top=50,left=50'
  )
  
  if (popup) {
    popup.document.write(geneCalculatorHTML)
    popup.document.close()
    popup.focus()
  } else {
    alert('Popup blocked! Please allow popups for this site to use the Gene Calculator.')
  }
}

const useMapInteraction = () => {
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const isDraggingRef = useRef(false)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const hasDraggedRef = useRef(false)

  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (isDraggingRef.current) {
        hasDraggedRef.current = true
        setPan({
          x: e.clientX - dragStartRef.current.x,
          y: e.clientY - dragStartRef.current.y
        })
      }
    }

    const handleGlobalMouseUp = () => {
      isDraggingRef.current = false
      setIsDragging(false)
    }

    window.addEventListener('mousemove', handleGlobalMouseMove)
    window.addEventListener('mouseup', handleGlobalMouseUp)
    
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove)
      window.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [])

  return {
    zoom,
    setZoom,
    pan,
    setPan,
    isDragging,
    setIsDragging,
    isDraggingRef,
    dragStartRef,
    hasDraggedRef
  }
}

// ============= SUB-COMPONENTS =============
const DecayingIcon = () => (
  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 21h18v-2H3v2zm0-4h2v-4h2v4h2v-4h2v4h2v-4h2v4h2v-4h2v4h2v-4h2V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v12zm4-12h2v2H7V5zm4 0h2v2h-2V5zm4 0h2v2h-2V5zM7 9h2v2H7V9zm4 0h2v2h-2V9z" opacity="0.7"/>
    <path d="M8 17l-2 2v2h3v-4zm8 0v4h3v-2l-2-2zm-4-8l-1 2h2l-1-2z" />
    <path d="M6 13l-1.5 1.5M18 13l1.5 1.5M9 16l-1 1M15 16l1 1" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
  </svg>
)

const TowerIcon = () => (
  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 2v2h1v2H6v2h1v12h10V8h1V6h-3V4h1V2h-8zm7 16H9V8h6v10zm-3-8.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z"/>
  </svg>
)

const LocationName = ({ name, className = '' }) => {
  const match = name.match(/^([A-Z]+\d+)(\(\d+\))?/)
  if (match) {
    const [, base, duplicate] = match
    return (
      <>
        <span className={className}>{base}</span>
        {duplicate && (
          <span className="text-white/90 align-super" style={{fontSize: '0.65em', marginLeft: '2px'}}>
            {duplicate}
          </span>
        )}
      </>
    )
  }
  return <span className={className}>{name}</span>
}

const getIcon = (type) => {
  if (type === 'enemy-decaying') return <DecayingIcon />
  if (type === 'enemy-tower') return <TowerIcon />
  const Icon = ICON_MAP[type] || MapPin
  return <Icon className="h-3 w-3" />
}

const getLargeIcon = (type) => {
  if (type === 'enemy-decaying') {
    return (
      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 21h18v-2H3v2zm0-4h2v-4h2v4h2v-4h2v4h2v-4h2v4h2v-4h2v4h2v-4h2V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v12zm4-12h2v2H7V5zm4 0h2v2h-2V5zm4 0h2v2h-2V5zM7 9h2v2H7V9zm4 0h2v2h-2V9z" opacity="0.7"/>
        <path d="M8 17l-2 2v2h3v-4zm8 0v4h3v-2l-2-2zm-4-8l-1 2h2l-1-2z" />
        <path d="M6 13l-1.5 1.5M18 13l1.5 1.5M9 16l-1 1M15 16l1 1" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
      </svg>
    )
  }
  if (type === 'enemy-tower') {
    return (
      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 2v2h1v2H6v2h1v12h10V8h1V6h-3V4h1V2h-8zm7 16H9V8h6v10zm-3-8.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z"/>
      </svg>
    )
  }
  const Icon = ICON_MAP[type] || MapPin
  return <Icon className="h-8 w-8" />
}

const TimerDisplay = ({ timers, onRemoveTimer }) => {
  if (!timers || timers.length === 0) return null
  
  return (
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 flex flex-col-reverse" style={{zIndex: 30, marginBottom: '1px', gap: '0'}}>
      {timers.slice(-3).map((timer) => (
        <div
          key={timer.id}
          className="border rounded-sm px-1 py-0 text-[5px] font-mono whitespace-nowrap shadow-sm cursor-pointer hover:opacity-80 transition-all duration-200"
          style={{
            backgroundColor: timer.type === 'stone' ? 'rgba(87, 83, 78, 0.95)' : timer.type === 'metal' ? 'rgba(63, 63, 70, 0.95)' : 'rgba(39, 39, 42, 0.95)',
            borderColor: timer.type === 'stone' ? '#a8a29e' : timer.type === 'metal' ? '#71717a' : '#52525b',
            color: timer.type === 'stone' ? '#fef3c7' : timer.type === 'metal' ? '#e0e7ff' : '#ddd6fe',
            lineHeight: '1.2',
            borderWidth: '0.5px',
            fontSize: '5px',
            padding: '0 3px'
          }}
          onClick={(e) => {
            e.stopPropagation()
            onRemoveTimer(timer.id)
          }}
          title="Click to remove timer"
        >
          {formatTime(timer.remaining)}
        </div>
      ))}
    </div>
  )
}

const LocationMarker = ({ location, locations = [], isSelected, onClick, timers, onRemoveTimer, getOwnedBases, players = [], onOpenReport, onOpenBaseReport }) => {
  const ownedBases = getOwnedBases(location.name)

  // Calculate online player count for this base (regular players only, premium players are always counted as online)
  const onlinePlayerCount = useMemo(() => {
    if (!location.players) return 0
    
    const basePlayerNames = location.players.split(",").map(p => p.trim()).filter(p => p)
    return basePlayerNames.filter(playerName => 
      players.some(player => player.playerName === playerName && player.isOnline)
    ).length
  }, [location.players, players])

  // Calculate premium player count for this base
  const premiumPlayerCount = useMemo(() => {
    if (!location.players) return 0
    
    const basePlayerNames = location.players.split(",").map(p => p.trim()).filter(p => p)
    return basePlayerNames.filter(playerName => 
      players.some(player => player.playerName === playerName && player.createdAt !== undefined)
    ).length
  }, [location.players, players])

  // Calculate offline player count for this base (regular players only, premium players are not counted as offline)
  const offlinePlayerCount = useMemo(() => {
    if (!location.players) return 0
    
    const basePlayerNames = location.players.split(",").map(p => p.trim()).filter(p => p)
    return basePlayerNames.filter(playerName => 
      players.some(player => player.playerName === playerName && !player.isOnline && player.createdAt === undefined)
    ).length
  }, [location.players, players])
  
  return (
    <button
      className="absolute transform -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${location.x}%`, top: `${location.y}%` }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation()
        e.preventDefault()
        onClick(location)
      }}
    >
      <div className="relative">
        {/* Group Color Ring - shows for bases that belong to a group */}
        {(() => {
          const groupColor = getGroupColor(location.id, locations)
          if (!groupColor) return null
          
          return (
            <div 
              className="absolute rounded-full"
              style={{
                width: "18px", // Smaller group circle
                height: "18px",
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                backgroundColor: groupColor,
                zIndex: 0, // Behind the icon
                opacity: 0.6 // Slightly more transparent since it's filled
              }}
            />
          )
        })()}
        {!location.type.startsWith('report') && (
          <TimerDisplay 
            timers={timers} 
            onRemoveTimer={onRemoveTimer}
          />
        )}

        {/* Online player count display - only show for enemy bases with players */}
        {location.type.startsWith("enemy") && onlinePlayerCount > 0 && (
          <div 
            className="absolute text-xs font-bold text-red-400 bg-black/80 rounded-full flex items-center justify-center border border-red-400/50"
            style={{
              width: "9px", // 75% of original 12px
              height: "9px",
              left: "-6px", // Adjusted proportionally
              top: "-1.5px", // Adjusted proportionally
              transform: "translateY(-50%)",
              zIndex: 1,
              fontSize: "7px" // Proportionally smaller font
            }}
          >
            {onlinePlayerCount}
          </div>
        )}

        {/* Premium player count display - orange circle, 35% smaller, to the right of green */}
        {location.type.startsWith("enemy") && premiumPlayerCount > 0 && (
          <div 
            className="absolute text-xs font-bold text-orange-400 bg-black/80 rounded-full flex items-center justify-center border border-orange-400/50"
            style={{
              width: "6px", // 75% of original 7.8px
              height: "6px",
              left: "3px", // Adjusted proportionally
              top: "-3px", // Adjusted proportionally
              transform: "translateY(-50%)",
              zIndex: 1,
              fontSize: "5px" // Proportionally smaller font
            }}
          >
            {premiumPlayerCount}
          </div>
        )}

        {/* Offline player count display - grey circle, below green */}
        {location.type.startsWith("enemy") && offlinePlayerCount > 0 && (
          <div 
            className="absolute text-xs font-bold text-gray-400 bg-black/80 rounded-full flex items-center justify-center border border-gray-400/50"
            style={{
              width: "6px", // 75% of original 7.8px
              height: "6px",
              left: "-6px", // Adjusted proportionally 
              top: "6px", // Adjusted proportionally
              transform: "translateY(-50%)",
              zIndex: 1,
              fontSize: "5px" // Proportionally smaller font
            }}
          >
            {offlinePlayerCount}
          </div>
        )}
        
        <div className={`bg-gray-700 rounded-full shadow-md border border-gray-600 flex items-center justify-center ${location.abandoned ? 'opacity-40' : ''} ${
          location.type.startsWith('report') ? 'p-0.5 scale-[0.375]' : 'p-0.5 scale-75'
        }`}>
          <div className={`${getColor(location.type, location)} flex items-center justify-center`}>
            {getIcon(location.type)}
          </div>
        </div>
        
        {isSelected && (
          <div className="absolute pointer-events-none" style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: location.type.startsWith('report') ? '10px' : '20px',
            height: location.type.startsWith('report') ? '10px' : '20px',
            zIndex: 5
          }}>
            <div className="selection-ring" style={{ width: '100%', height: '100%' }}>
              <svg width={location.type.startsWith('report') ? "10" : "20"} height={location.type.startsWith('report') ? "10" : "20"} viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id={`greyGradient-${location.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#D8D8D8"/>
                    <stop offset="50%" stopColor="#C0C0C0"/>
                    <stop offset="100%" stopColor="#B0B0B0"/>
                  </linearGradient>
                  <linearGradient id={`diamondGradient-${location.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#606060"/>
                    <stop offset="50%" stopColor="#303030"/>
                    <stop offset="100%" stopColor="#101010"/>
                  </linearGradient>
                </defs>
                <path d="M 150,30 A 120,120 0 1,0 150,270 A 120,120 0 1,0 150,30 Z M 150,47 A 103,103 0 1,1 150,253 A 103,103 0 1,1 150,47 Z" fill={`url(#greyGradient-${location.id})`} fillRule="evenodd"/>
                <circle cx="150" cy="150" r="120" fill="none" stroke="#000000" strokeWidth="5"/>
                <circle cx="150" cy="150" r="103" fill="none" stroke="#000000" strokeWidth="5"/>
                <g transform="translate(150, 30)">
                  <path d="M 0,-18 L 21,0 L 0,36 L -21,0 Z" fill={`url(#diamondGradient-${location.id})`} stroke="#000000" strokeWidth="5"/>
                  <path d="M 0,-14 L 12,-2 L 0,8 L -12,-2 Z" fill="#FFFFFF" opacity="0.15"/>
                </g>
                <g transform="translate(270, 150) rotate(90)">
                  <path d="M 0,-18 L 21,0 L 0,36 L -21,0 Z" fill={`url(#diamondGradient-${location.id})`} stroke="#000000" strokeWidth="5"/>
                  <path d="M 0,-14 L 12,-2 L 0,8 L -12,-2 Z" fill="#FFFFFF" opacity="0.15"/>
                </g>
                <g transform="translate(150, 270) rotate(180)">
                  <path d="M 0,-18 L 21,0 L 0,36 L -21,0 Z" fill={`url(#diamondGradient-${location.id})`} stroke="#000000" strokeWidth="5"/>
                  <path d="M 0,-14 L 12,-2 L 0,8 L -12,-2 Z" fill="#FFFFFF" opacity="0.15"/>
                </g>
                <g transform="translate(30, 150) rotate(270)">
                  <path d="M 0,-18 L 21,0 L 0,36 L -21,0 Z" fill={`url(#diamondGradient-${location.id})`} stroke="#000000" strokeWidth="5"/>
                  <path d="M 0,-14 L 12,-2 L 0,8 L -12,-2 Z" fill="#FFFFFF" opacity="0.15"/>
                </g>
              </svg>
            </div>
          </div>
        )}
        
        {/* Badges */}
        {location.type.startsWith('report') && location.outcome && location.outcome !== 'neutral' && (
          <div className="absolute -top-1 -right-1" style={{ zIndex: 10 }}>
            {location.outcome === 'won' ? (
              <div className="w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-2 h-2 text-white" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 111.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"/>
                </svg>
              </div>
            ) : (
              <div className="w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                <svg className="w-2 h-2 text-white" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M4.28 3.22a.75.75 0 00-1.06 1.06L6.94 8l-3.72 3.72a.75.75 0 101.06 1.06L8 9.06l3.72 3.72a.75.75 0 101.06-1.06L9.06 8l3.72-3.72a.75.75 0 00-1.06-1.06L8 6.94 4.28 3.22z"/>
                </svg>
              </div>
            )}
          </div>
        )}
        
        
        {location.roofCamper && (
          <div className="absolute -top-1 -left-1" style={{ zIndex: 10 }}>
            <div className="w-3 h-3 bg-orange-500 rounded-full flex items-center justify-center" title="Roof Camper">
              <svg className="w-2 h-2 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <circle cx="12" cy="12" r="8" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </div>
          </div>
        )}
        
        {location.hostileSamsite && (
          <div className={`absolute ${location.type.startsWith('report') && location.outcome && location.outcome !== 'neutral' ? '-right-2.5' : '-right-1'} ${"-bottom-1"}`} style={{ zIndex: 10 }}>
            <div className="w-3 h-3 bg-yellow-500 rounded-full flex items-center justify-center" title="Hostile Samsite">
              <span className="text-[8px] font-bold text-black">!</span>
            </div>
          </div>
        )}
        
        {location.oldestTC && location.oldestTC > 0 && (
          <div className="absolute inset-0 pointer-events-none">
            <svg width="28" height="28" viewBox="0 0 28 28" className="absolute" style={{top: '-2px', left: '-2px'}}>
              <g transform="translate(14, 14)">
                <g transform={`rotate(${location.oldestTC + 180})`}>
                  <g transform="translate(0, -11)">
                    <path
                      d="M -3 -3 L 3 -3 L 0 3 Z"
                      fill={location.type.startsWith('enemy') ? '#ef4444' : '#10b981'}
                      stroke={location.type.startsWith('enemy') ? '#991b1b' : '#047857'}
                      strokeWidth="0.5"
                    />
                  </g>
                </g>
              </g>
            </svg>
          </div>
        )}
      </div>
    </button>
  )
}

const ContextMenu = ({ x, y, onAddBase }) => (
  <div className="fixed bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-20 py-2" style={{ left: x, top: y }}>
    <button className="block w-full text-left px-4 py-2 hover:bg-gray-700 text-gray-200 text-sm" onClick={() => onAddBase('report')}>
      Report
    </button>
    <button className="block w-full text-left px-4 py-2 hover:bg-gray-700 text-gray-200 text-sm" onClick={() => onAddBase('enemy')}>
      Enemy Base
    </button>
    <button className="block w-full text-left px-4 py-2 hover:bg-gray-700 text-gray-200 text-sm" onClick={() => onAddBase('friendly')}>
      Friendly Base
    </button>
  </div>
)

const ActionMenu = ({ location, style, onClose, onAction, onOpenBaseReport }) => {
  const isFriendly = location.type.startsWith('friendly')
  
  if (isFriendly) {
    return (
      <div 
        className="absolute bg-gray-800 rounded-lg shadow-2xl border border-gray-700"
        style={{ ...style, minWidth: '320px', padding: '12px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-2">
          {[
            { label: 'Needs pickup', actions: ['Ore', 'Loot', 'Detailed'] },

            { label: 'Base needs kits', actions: ['Simple', 'Detailed'] },
            { label: 'Needs Repair/Upgrade', actions: ['Simple', 'Detailed'] }
          ].map(({ label, actions }) => (
            <div key={label} className="flex items-center justify-between gap-4">
              <span className="text-gray-200 text-sm whitespace-nowrap">{label}</span>
              <div className="flex gap-1.5">
                {actions.map(action => (
                  <button 
                    key={action}
                    className="px-2.5 py-1 bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs rounded transition-colors font-medium"
                    onClick={() => onAction(`${label} - ${action}`)}
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-200 text-sm whitespace-nowrap">Needs Upkeep</span>
            <button 
              className="px-4 py-1 bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs rounded transition-colors font-medium cursor-pointer"
              onClick={() => onAction('Needs Upkeep')}
            >
              Mark
            </button>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-200 text-sm whitespace-nowrap">Intentional Decay</span>
            <button 
              className="px-4 py-1 bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs rounded transition-colors font-medium cursor-pointer"
              onClick={() => onAction('Intentional Decay')}
            >
              Set Timer
            </button>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-200 text-sm whitespace-nowrap">Write Report</span>
            <button 
              className="px-4 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors font-medium cursor-pointer"
              onClick={() => {
                onOpenBaseReport(location)
                onClose()
              }}
            >
              Create
            </button>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div 
      className="absolute bg-gray-800 rounded-lg shadow-2xl border border-gray-700"
      style={{ ...style, minWidth: '140px', padding: '4px' }}
      onClick={(e) => e.stopPropagation()}
    >
      <button 
        className="block w-full text-left px-4 py-2 hover:bg-gray-700 text-gray-200 text-sm transition-colors"
        onClick={() => onAction('Schedule Raid')}
      >
        Schedule Raid
      </button>
      <button 
        className="block w-full text-left px-4 py-2 hover:bg-gray-700 text-gray-200 text-sm transition-colors"
        onClick={() => onAction('Decaying')}
      >
        Decaying
      </button>
      <button 
        className="block w-full text-left px-4 py-2 hover:bg-gray-700 text-gray-200 text-sm transition-colors"
        onClick={() => onAction('Write report')}
      >
        Write report
      </button>
    </div>
  )
}

const DecayingMenu = ({ style, onClose, onStartTimer, title = "Decay Calculator" }) => {
  const [decayValues, setDecayValues] = useState({ stone: '', metal: '', hqm: '' })
  
  const handleStartTimer = (type) => {
    const value = decayValues[type] === '' || decayValues[type] === 0 
      ? 0 
      : Number(decayValues[type])
    
    const hours = value === 0 
      ? DECAY_TIMES[type].hours 
      : (DECAY_TIMES[type].hours * (value / DECAY_TIMES[type].max))
    
    const seconds = Math.round(hours * 3600)
    onStartTimer(type, seconds)
  }
  
  return (
    <div 
      className="absolute bg-gray-800 rounded-lg shadow-2xl border border-gray-700 p-4"
      style={{ ...style, width: '370px' }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-200 transition-colors"
      >
        <X className="h-5 w-5" />
      </button>
      
      <h3 className="text-white font-bold mb-4">{title}</h3>
      
      <div className="space-y-3">
        {Object.entries(DECAY_TIMES).map(([type, config]) => (
          <div key={type} className="flex items-center gap-3">
            <label className="text-sm text-gray-300 w-12 capitalize">{type}</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={decayValues[type]}
                onChange={(e) => setDecayValues(prev => ({ 
                  ...prev, 
                  [type]: Math.min(config.max, Math.max(0, e.target.value === '' ? '' : Number(e.target.value)))
                }))}
                placeholder="0"
                className="w-16 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm text-gray-200 text-center focus:border-blue-500 focus:outline-none"
                min="0"
                max={config.max}
              />
              <span className="text-xs text-gray-400">of {config.max}</span>
            </div>
            <div className="flex-1 text-right">
              <span className="text-sm text-yellow-400 font-medium">
                {decayValues[type] === '' || decayValues[type] === 0 
                  ? `${config.hours} hours` 
                  : `${(config.hours * (Number(decayValues[type]) / config.max)).toFixed(1)} hours`}
              </span>
            </div>
            <button
              onClick={() => handleStartTimer(type)}
              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors whitespace-nowrap"
            >
              Start timer
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}


const SelectedLocationPanel = ({ location, onEdit, getOwnedBases, onSelectLocation, locationTimers, onAddTimer, onOpenReport, onOpenBaseReport, players, locations }) => {
  const [showActionMenu, setShowActionMenu] = useState(false)
  const [showDecayingMenu, setShowDecayingMenu] = useState(false)
  const ownedBases = getOwnedBases(location.name)
  
  // Get players from the location data (same as BaseModal)
  // For subsidiary bases, get players from their main base
  const locationPlayers = (() => {
    if (location.ownerCoordinates && 
        (location.type.includes('flank') || 
         location.type.includes('tower') || 
         location.type.includes('farm'))) {
      const mainBase = locations.find(loc => 
        loc.name.split('(')[0] === location.ownerCoordinates.split('(')[0]
      )
      if (mainBase && mainBase.players) {
        return mainBase.players
      }
    }
    return location.players || ''
  })()
  
  return (
    <div 
      className="absolute bottom-0 left-0 bg-gray-900 bg-opacity-95 backdrop-blur-sm rounded-tr-lg shadow-2xl p-6 flex gap-5 border-t border-r border-orange-600/50 z-20 transition-all duration-300 ease-out"
      style={{ width: '30%', minWidth: '350px', maxWidth: '450px', minHeight: '160px' }}
    >
      {location.type.startsWith('enemy') && (
        <div 
          className="absolute" 
          style={{
            top: '-108px',
            right: '-108px',
            width: '216px',
            height: '216px',
            pointerEvents: 'auto'
          }}
        >
          <div style={{
            transform: 'scale(0.6)', 
            transformOrigin: 'center',
            width: '600px', 
            height: '600px',
            position: 'absolute',
            top: '50%',
            left: '50%',
            marginTop: '-300px',
            marginLeft: '-300px'
          }}>
            <RadialMenu />
          </div>
        </div>
      )}
      {location.type === 'friendly-farm' && (
        <div 
          className="absolute" 
          style={{
            top: '-108px',
            right: '-108px',
            width: '216px',
            height: '216px',
            pointerEvents: 'auto'
          }}
        >
          <div style={{
            transform: 'scale(0.6)', 
            transformOrigin: 'center',
            width: '440px', 
            height: '500px',
            position: 'absolute',
            top: '50%',
            left: '50%',
            marginTop: '-250px',
            marginLeft: '-220px'
          }}>
            <FarmRadialMenu />
          </div>
        </div>
      )}
      {location.type.startsWith('friendly') && location.type !== 'friendly-farm' && (
        <div 
          className="absolute" 
          style={{
            top: '-108px',
            right: '-108px',
            width: '216px',
            height: '216px',
            pointerEvents: 'auto'
          }}
        >
          <div style={{
            transform: 'scale(0.6)', 
            transformOrigin: 'center',
            width: '440px', 
            height: '500px',
            position: 'absolute',
            top: '50%',
            left: '50%',
            marginTop: '-250px',
            marginLeft: '-220px'
          }}>
            <BaseRadialMenu />
          </div>
        </div>
      )}
      {!location.type.startsWith('report') && (
        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 -translate-x-10 flex gap-3">
      {/* Rectangle - smaller size for enemy base preview */}
      <div className="absolute top-12 left-1/2 transform -translate-x-1/2 -translate-x-24 pointer-events-none z-50">
        <div className="w-52 h-28 bg-gray-800 border border-orange-600/50 shadow-lg relative">
          {/* Player snapshot grid - 2 columns x 5 rows */}
          <div className="grid grid-cols-2 grid-rows-5 h-full w-full">
            {(() => {
              // Parse selected players from comma-separated string (same as BaseModal)
              const selectedPlayersList = locationPlayers ? locationPlayers.split(',').map(p => p.trim()).filter(p => p) : []
              
              // Filter players to only show those assigned to this base
              const taggedPlayers = players.filter(p => selectedPlayersList.includes(p.playerName));
              
              // Separate premium and regular players
              const premiumTaggedPlayers = taggedPlayers.filter(p => p.createdAt !== undefined); // Premium players have createdAt
              const regularTaggedPlayers = taggedPlayers.filter(p => p.createdAt === undefined);
              
              // Get online and offline players from regular players only (premium players are always offline)
              const onlinePlayers = regularTaggedPlayers.filter(p => p.isOnline) || [];
              const offlinePlayers = regularTaggedPlayers.filter(p => !p.isOnline) || [];
              
              // Combine in priority order: online first, then offline, then premium
              const onlineCount = onlinePlayers.length;
              const offlineCount = offlinePlayers.length;
              const prioritizedPlayers = [
                ...onlinePlayers.slice(0, 10), // Take up to 10 online players first
                ...offlinePlayers.slice(0, Math.max(0, 10 - onlineCount)), // Offline players after online
                ...premiumTaggedPlayers.slice(0, Math.max(0, 10 - onlineCount - offlineCount)) // Premium players last
              ].slice(0, 10);
              
              // Fill remaining slots with empty boxes
              const slots = Array(10).fill(null).map((_, index) => 
                prioritizedPlayers[index] || null
              );
              
              return slots.map((player, index) => (
                <div 
                  key={index}
                  className={`flex items-center justify-center text-xs font-medium border-r border-b border-orange-600/30 ${
                    index % 2 === 1 ? 'border-r-0' : ''
                  } ${
                    index >= 8 ? 'border-b-0' : ''
                  } ${
                    player 
                      ? player.createdAt !== undefined // Premium player
                        ? 'bg-orange-900 text-orange-300' 
                        : player.isOnline 
                          ? location.type.startsWith('enemy') 
                            ? 'bg-red-900 text-red-300'
                            : 'bg-yellow-900 text-yellow-300'
                          : 'bg-gray-700 text-gray-400'
                      : 'bg-gray-800'
                  }`}
                >
                  {player ? (
                    <span className="truncate px-1" title={player.playerName}>
                      {player.playerName.length > 8 ? player.playerName.slice(0, 8) : player.playerName}
                    </span>
                  ) : null}
                </div>
              ));
            })()}
          </div>
        </div>
      </div>
      
          <button className="w-10 h-10 bg-gradient-to-br from-orange-600 to-orange-800 rounded-full flex items-center justify-center hover:from-orange-500 hover:to-orange-700 transition-all duration-200 border-2 border-orange-400 shadow-lg transform hover:scale-105" title="Linked Bases">
            <svg className="h-5 w-5 text-white drop-shadow-sm" viewBox="0 0 24 24" fill="none">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button className="w-10 h-10 bg-gradient-to-br from-orange-700 to-orange-900 rounded-full flex items-center justify-center hover:from-orange-600 hover:to-orange-800 transition-all duration-200 border-2 border-orange-500 shadow-lg transform hover:scale-105" title="Notes" onClick={() => onEdit(location)}>
            <svg className="h-5 w-5 text-white drop-shadow-sm" viewBox="0 0 24 24" fill="none">
              <path d="M4 4v16c0 1.1.9 2 2 2h10l4-4V6c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2z" fill="white" stroke="white" strokeWidth="1"/>
              <path d="M16 18v-4h4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button className="w-10 h-10 bg-gradient-to-br from-orange-800 to-orange-900 rounded-full flex items-center justify-center hover:from-orange-700 hover:to-orange-800 transition-all duration-200 border-2 border-orange-600 shadow-lg transform hover:scale-105" title="Help">
            <HelpCircle className="h-5 w-5 text-white drop-shadow-sm" />
          </button>
        </div>
      )}
      
      {location.type.startsWith('report') ? (
        <button 
          className="absolute -top-4 -right-4 bg-purple-600 rounded-full flex items-center justify-center hover:bg-purple-700 transition-colors border-2 border-gray-800 shadow-lg"
          style={{width: '60px', height: '60px'}} 
          title="Details"
          onClick={() => onEdit(location)}
        >
          <span className="text-white text-[11px] font-bold">DETAILS</span>
        </button>
      ) : null}
      
      {showActionMenu && !location.type.startsWith('report') && !location.type.startsWith('enemy') && (
        <ActionMenu 
          location={location}
          style={{
            top: '20px',
            left: 'calc(100% + 3px)',
            zIndex: 30
          }}
          onClose={() => setShowActionMenu(false)}
          onOpenBaseReport={onOpenBaseReport}
          onAction={(action) => {
            console.log(action)
            setShowActionMenu(false)
            if (action === 'Intentional Decay' || action === 'Decaying') {
              setShowDecayingMenu(true)
            }
             else if (action === 'Write report') {
              onOpenBaseReport(location)
            }
            else if (action === 'Add Base Report') {
              setBaseReportData({
                baseId: location.id,
                baseName: location.name,
                baseCoords: location.coordinates || getGridCoordinate(location.x, location.y, locations, null),
                baseType: location.type
              })
              setShowBaseReportModal(true)
            }
          }}
        />
      )}
      
      {showDecayingMenu && !location.type.startsWith('report') && (
        <DecayingMenu 
          style={{
            top: '20px',
            left: 'calc(100% + 3px)',
            zIndex: 30
          }}
          title={location.type.startsWith('friendly') ? 'Intentional Decay Calculator' : 'Decay Calculator'}
          onClose={() => setShowDecayingMenu(false)}
          onStartTimer={(type, seconds) => {
            if (!location || location.type.startsWith('report')) return
            
            const existing = locationTimers[location.id] || []
            if (existing.length >= 3) {
              alert('Maximum 3 timers per base')
              return
            }
            
            onAddTimer(location.id, {
              id: Date.now() + Math.random(),
              type: type,
              remaining: seconds
            })
            
            setShowDecayingMenu(false)
            const hours = seconds / 3600
            const isFriendly = location.type.startsWith('friendly')
            console.log(`Started ${isFriendly ? 'intentional decay' : 'decay'} ${type} timer for ${location.name}: ${hours.toFixed(1)} hours`)
          }}
        />
      )}
      
      <div className="flex-shrink-0 mt-4 relative">
        <div className="bg-gray-800 rounded-full p-4 shadow-xl border-2 border-orange-600/50">
          <div className={getColor(location.type, location)}>
            <div className="transform scale-125">
              {getLargeIcon(location.type)}
            </div>
          </div>
        </div>
        
        {location.oldestTC && location.oldestTC > 0 && (
          <div className="absolute inset-0 pointer-events-none">
            <svg width="100%" height="100%" viewBox="0 0 100 100" className="absolute inset-0">
              <g transform={`translate(50, 50)`}>
                <g transform={`rotate(${location.oldestTC + 180})`}>
                  <g transform={`translate(0, -42)`}>
                    <path
                      d="M -5 -5 L 5 -5 L 0 5 Z"
                      fill={location.type.startsWith('enemy') ? '#ef4444' : '#10b981'}
                      stroke={location.type.startsWith('enemy') ? '#991b1b' : '#047857'}
                      strokeWidth="1"
                    />
                  </g>
                </g>
              </g>
            </svg>
          </div>
        )}
        
        
        {location.roofCamper && (
          <div className="absolute -top-2 -left-2">
            <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center shadow-lg border border-gray-800" title="Roof Camper">
              <svg className="w-2 h-2 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="8" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </div>
          </div>
        )}
        
        {location.hostileSamsite && (
          <div className="absolute -top-2 -right-2">
            <div className="w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg border border-gray-800" title="Hostile Samsite">
              <span className="text-[10px] font-bold text-black">!</span>
            </div>
          </div>
        )}
        
        {location.abandoned && (
          <div className="absolute -bottom-2 -left-2">
            <div className="w-4 h-4 bg-gray-500 rounded-full flex items-center justify-center shadow-lg border border-gray-800" title="Abandoned">
              <span className="text-[10px] font-bold text-white">A</span>
            </div>
          </div>
        )}
        
        <div className="absolute -top-9 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
          <div className="relative">
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 120 32">
              <defs>
                <linearGradient id="coordGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={location.type.startsWith('report') ? "#9333ea" : location.type.startsWith('enemy') ? "#ef4444" : "#10b981"} stopOpacity="0.3"/>
                  <stop offset="50%" stopColor={location.type.startsWith('report') ? "#9333ea" : location.type.startsWith('enemy') ? "#ef4444" : "#10b981"} stopOpacity="0.8"/>
                  <stop offset="100%" stopColor={location.type.startsWith('report') ? "#9333ea" : location.type.startsWith('enemy') ? "#ef4444" : "#10b981"} stopOpacity="0.3"/>
                </linearGradient>
              </defs>
              <rect x="1" y="1" width="118" height="30" rx="15" fill="url(#coordGrad)" stroke={location.type.startsWith('report') ? "#9333ea" : location.type.startsWith('enemy') ? "#ef4444" : "#10b981"} strokeWidth="1"/>
            </svg>
            <span className={`relative font-mono font-bold bg-gray-900 bg-opacity-90 rounded-xl border shadow-lg backdrop-blur-sm whitespace-nowrap ${
              location.type.startsWith('report') ? 'border-purple-400' : location.type.startsWith('enemy') ? 'border-red-400' : 'border-green-400'
            } ${
              (location.type === 'enemy-farm' || location.type === 'enemy-flank' || location.type === 'enemy-tower') && location.ownerCoordinates ? 'px-3 py-1' : 'px-4 py-1.5'
            }`}>
              <LocationName 
                name={location.name} 
                className={`${
                  location.type.startsWith('report') ? 'text-purple-300' : location.type.startsWith('enemy') ? 'text-red-300' : 'text-green-300'
                } ${
                  (location.type === 'enemy-farm' || location.type === 'enemy-flank' || location.type === 'enemy-tower') && location.ownerCoordinates ? 'text-xl' : 'text-3xl'
                }`}
              />
            </span>
          </div>
        </div>

        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
          <span className="text-sm text-orange-300 font-medium bg-gray-900 bg-opacity-90 px-3 py-1 rounded shadow-md whitespace-nowrap font-mono border border-orange-600/40">
            [{LABELS[location.type] || location.type}]
          </span>
        </div>
      </div>
      
      <div className="flex-1 text-orange-200 pr-12 mt-2 font-mono">
        <div className="mt-8 flex flex-col gap-2">
          {location.type.startsWith('report') && location.time && (
            <div className="text-sm text-gray-400">
              {location.time}
            </div>
          )}
          {location.primaryRockets && location.primaryRockets > 0 && !location.type.startsWith('friendly') && !location.type.startsWith('report') && (
            <div className="text-sm text-gray-400">
              <span className="text-orange-400 font-medium">[ROCKETS: {location.primaryRockets}]</span>
            </div>
          )}
          {location.enemyPlayers && location.type.startsWith('report') && (
            <div className="text-sm text-gray-400">
              <span className="text-red-400 font-medium">Enemies: {location.enemyPlayers}</span>
            </div>
          )}
          {location.friendlyPlayers && location.type.startsWith('report') && (
            <div className="text-sm text-gray-400">
              <span className="text-green-400 font-medium">Friendlies: {location.friendlyPlayers}</span>
            </div>
          )}
          {ownedBases.length > 0 && (
            <div className="text-sm text-gray-400">
              <span className="text-orange-400 font-medium">[OWNS {ownedBases.length} BASE{ownedBases.length > 1 ? 'S' : ''}]:</span>
              <div className="mt-1 ml-2">
                {ownedBases.map((base, index) => (
                  <button
                    key={index}
                    onClick={() => onSelectLocation(base)}
                    className="text-xs text-orange-400 hover:text-orange-300 text-left transition-colors block"
                  >
                    • {base.name} ({LABELS[base.type].replace('Friendly ', '').replace('Main ', '')})
                  </button>
                ))}
              </div>
            </div>
          )}
          {(location.roofCamper || location.hostileSamsite || location.abandoned) && (
            <div className="text-sm text-gray-400 flex gap-3 flex-wrap">
              {location.roofCamper && (
                <span className="text-orange-400 font-medium flex items-center gap-1">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="8" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                  Roof Camper
                </span>
              )}
              {location.hostileSamsite && (
                <span className="text-yellow-400 font-medium flex items-center gap-1">
                  <span className="bg-yellow-500 text-black rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">!</span>
                  Hostile Samsite
                </span>
              )}
            </div>
          )}
        </div>
              {location.abandoned && (
                <span className="text-gray-400 font-medium flex items-center gap-1">
                  <span className="bg-gray-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">A</span>
                  Abandoned
                </span>
              )}
      </div>
    </div>
  )
}

// ============= MAIN COMPONENT =============
export default function InteractiveTacticalMap() {
  const queryClient = useQueryClient()
  const [locations, setLocations] = useState<any[]>([])
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [contextMenu, setContextMenu] = useState({ x: 0, y: 0, visible: false })
  const [newBaseModal, setNewBaseModal] = useState({ x: 0, y: 0, visible: false })
  const [modalType, setModalType] = useState('friendly')
  const [editingLocation, setEditingLocation] = useState(null)
  const [showReportPanel, setShowReportPanel] = useState(false)
  const [showAdvancedPanel, setShowAdvancedPanel] = useState(false)
  
  // New Report System State
  const [showPlayerModal, setShowPlayerModal] = useState(false)
  const [showTeamsModal, setShowTeamsModal] = useState(false)
  const [showBaseReportModal, setShowBaseReportModal] = useState(false)
  const [showLogsModal, setShowLogsModal] = useState(false)
  const [showProgressionModal, setShowProgressionModal] = useState(false)
  const [baseReportData, setBaseReportData] = useState({
    baseId: null,
    baseName: null,
    baseCoords: null,
    baseType: null
  })
  
  // Heat map configuration state
  const [heatMapConfig, setHeatMapConfig] = useState<HeatMapConfig>({
    enabled: false,
    radius: 50,
    maxIntensity: 10,
    opacity: 0.6,
    colorScheme: 'red'
  })
  const [showHeatMapControls, setShowHeatMapControls] = useState(false)
  


  
  // Report Modal Handlers
  const onOpenReport = useCallback((location) => {
    setBaseReportData({
      baseId: location.id,
      baseName: location.name,
      baseCoords: location.coordinates,
      baseType: location.type
    })
    setShowBaseReportModal(true)
  }, [])

  const onOpenBaseReport = useCallback((location) => {
    setBaseReportData({
      baseId: location.id,
      baseName: location.name,
      baseCoords: location.coordinates,
      baseType: location.type
    })
    setShowBaseReportModal(true)
  }, [])

  // Fetch player data for online count display
  const { data: externalPlayers = [] } = useQuery<ExternalPlayer[]>({
    queryKey: ['/api/players'],
    staleTime: 60000, // Cache for 1 minute
    refetchOnWindowFocus: false, // Don't refetch on focus to reduce requests
    retry: 1, // Minimal retries
    throwOnError: false, // Don't crash on errors
  })

  const { data: premiumPlayers = [] } = useQuery({
    queryKey: ['/api/premium-players'],
    staleTime: 60000,
    refetchOnWindowFocus: false,
    retry: 1,
    throwOnError: false,
  })

  // Combine external and premium players
  const players = [
    ...externalPlayers,
    ...premiumPlayers.map(p => ({
      ...p,
      isOnline: false, // Premium players are considered offline for display
      totalSessions: 0
    }))
  ]

  const mapRef = useRef(null)
  const [locationTimers, setLocationTimers] = useLocationTimers()
  const { zoom, setZoom, pan, setPan, isDragging, setIsDragging, isDraggingRef, dragStartRef, hasDraggedRef } = useMapInteraction()
  
  // Handle BaseModal report events
  useBaseReportEvents(setBaseReportData, setShowBaseReportModal)
  
  // Handle subordinate base modal navigation
  useEffect(() => {
    const handleOpenBaseModal = (event) => {
      const { location, modalType } = event.detail
      if (location && modalType === 'enemy') {
        setEditingLocation(location)
        setModalType('enemy')
        setNewBaseModal({ 
          visible: true,
          x: location.x, 
          y: location.y 
        })
      }
    }

    window.addEventListener('openBaseModal', handleOpenBaseModal)
    
    return () => {
      window.removeEventListener('openBaseModal', handleOpenBaseModal)
    }
  }, [])

  const getOwnedBases = useCallback((ownerName) => {
    const ownerBase = ownerName.split('(')[0]
    return locations.filter(loc => 
      loc.ownerCoordinates && loc.ownerCoordinates.split('(')[0] === ownerBase
    )
  }, [locations])
  
  const handleContextMenu = useCallback((e) => {
    e.preventDefault()
    if (!hasDraggedRef.current && mapRef.current) {
      const rect = mapRef.current.getBoundingClientRect()
      const centerX = rect.width / 2
      const centerY = rect.height / 2
      const clickX = e.clientX - rect.left
      const clickY = e.clientY - rect.top
      const x = ((clickX - centerX - pan.x) / zoom + centerX) / rect.width * 100
      const y = ((clickY - centerY - pan.y) / zoom + centerY) / rect.height * 100
      if (x >= 0 && x <= 100 && y >= 0 && y <= 100) {
        setContextMenu({ x: e.clientX, y: e.clientY, visible: true })
        console.log("Context menu should be visible at:", e.clientX, e.clientY)
        setNewBaseModal({ x, y, visible: false })
      }
    }
  }, [pan, zoom, hasDraggedRef])
  
  const handleAddBase = useCallback((type) => {
    setContextMenu(prev => ({ ...prev, visible: false }))
    setEditingLocation(null)
    // Clear any stale base report data
    setBaseReportData({
      baseId: null,
      baseName: null,
      baseCoords: null,
      baseType: null
    })
    setModalType(type)
    console.log("Modal type set to:", type, "Modal should be visible:", true)
    setNewBaseModal(prev => ({ ...prev, visible: true }))
  }, [])
  
  const handleEditBase = useCallback((location) => {
    setEditingLocation(location)
    
    if (location.type.startsWith('friendly')) setModalType('friendly')
    else if (location.type.startsWith('enemy')) setModalType('enemy')
    else setModalType('report')
    
    setNewBaseModal({ x: location.x, y: location.y, visible: true })
  }, [])
  
  const handleSaveBase = useCallback(async (baseData) => {
    // If this is a report, save to database instead of creating a map location
    if (modalType === 'report') {
      const playerTags = []
      if (baseData.enemyPlayers) {
        playerTags.push(...baseData.enemyPlayers.split(',').map(p => p.trim()).filter(p => p))
      }
      if (baseData.friendlyPlayers) {
        playerTags.push(...baseData.friendlyPlayers.split(',').map(p => p.trim()).filter(p => p))
      }
      
      const reportData = {
        type: "general",
        notes: baseData.notes || `${baseData.type.replace('report-', '')} report`,
        outcome: baseData.outcome === 'won' ? 'good' : baseData.outcome === 'lost' ? 'bad' : 'neutral',
        playerTags: playerTags,
        baseTags: [],
        screenshots: [],
        location: { 
          gridX: Math.floor(newBaseModal.x / 3.125), 
          gridY: Math.floor(newBaseModal.y / 4.167) 
        }
      }
      
      console.log('Saving report:', reportData)
      try {
        const response = await fetch('/api/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reportData)
        })
        if (response.ok) {
          console.log('Report saved successfully')
          // Refresh reports in any open logs modal
          queryClient.invalidateQueries({ queryKey: ['/api/reports'] })
          
          // Create a visual marker on the map for this report
          const reportMarker = {
            id: `report-${Date.now()}`,
            name: getGridCoordinate(newBaseModal.x, newBaseModal.y, locations, null),
            x: newBaseModal.x,
            y: newBaseModal.y,
            type: baseData.type,
            notes: baseData.notes,
            outcome: baseData.outcome,
            time: new Date().toLocaleTimeString(),
            isReportMarker: true // Flag to distinguish from regular bases
          }
          setLocations(prev => [...prev, reportMarker])
        } else {
          console.error('Failed to save report:', await response.text())
        }
      } catch (error) {
        console.error('Error saving report:', error)
      }
      
      setNewBaseModal(prev => ({ ...prev, visible: false }))
      setEditingLocation(null)
      return
    }
    
    // Regular base/location saving logic below:
    if (editingLocation) {
      setLocations(prev => prev.map(loc => 
        loc.id === editingLocation.id ? { ...loc, ...baseData } : loc
      ))
      setSelectedLocation({ ...editingLocation, ...baseData })
    } else {
      const newLocation = {
        id: Date.now().toString(),
        name: getGridCoordinate(newBaseModal.x, newBaseModal.y, locations, null),
        x: newBaseModal.x,
        y: newBaseModal.y,
        ...baseData
      }
      setLocations(prev => [...prev, newLocation])
      setSelectedLocation(newLocation)
    }
    
    setNewBaseModal(prev => ({ ...prev, visible: false }))
    setEditingLocation(null)
  }, [editingLocation, newBaseModal, locations, modalType, queryClient])
  
  const handleCancel = useCallback(() => {
    setNewBaseModal(prev => ({ ...prev, visible: false }))
    setEditingLocation(null)
    setShowReportPanel(false)
    setShowAdvancedPanel(false)
  }, [])
  
  const handleDeleteLocation = useCallback(async () => {
    if (editingLocation) {
      // Delete associated reports from database if this is a base with a name
      if (editingLocation.name) {
        try {
          // Fetch all reports for this base
          const response = await fetch('/api/reports')
          const allReports = await response.json()
          
          // Find reports that belong to this base using base ID (primary) and name (fallback)
          const reportsToDelete = allReports.filter(report => 
            report.baseId === editingLocation.id ||
            report.locationName === editingLocation.name ||
            report.locationCoords === editingLocation.name ||
            (report.content?.baseName === editingLocation.name) ||
            (report.content?.baseCoords === editingLocation.name)
          )
          
          // Delete each report
          for (const report of reportsToDelete) {
            await fetch(`/api/reports/${report.id}`, {
              method: 'DELETE'
            })
          }
        } catch (error) {
          console.error('Error deleting associated reports:', error)
        }
      }

      // Delete associated player base tags
      try {
        await fetch(`/api/player-base-tags/base/${editingLocation.id}`, {
          method: 'DELETE'
        })
      } catch (error) {
        console.error('Error deleting associated player base tags:', error)
      }
      
      setLocations(prev => prev.filter(loc => loc.id !== editingLocation.id))
      setSelectedLocation(null)
      setLocationTimers(prev => {
        const updated = { ...prev }
        delete updated[editingLocation.id]
        return updated
      })
      handleCancel()
    }
  }, [editingLocation, handleCancel, setLocationTimers])
  
  const handleWheel = useCallback((e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.3 : 0.3
    const rect = mapRef.current?.getBoundingClientRect()
    if (rect) {
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top
      const centerX = rect.width / 2
      const centerY = rect.height / 2
      
      const offsetX = mouseX - centerX
      const offsetY = mouseY - centerY
      
      const newZoom = Math.min(Math.max(zoom + delta, 1), 3.75)
      
      if (newZoom !== zoom) {
        const zoomRatio = newZoom / zoom
        const newPanX = pan.x - offsetX * (zoomRatio - 1)
        const newPanY = pan.y - offsetY * (zoomRatio - 1)
        
        setZoom(newZoom)
        setPan({ x: newPanX, y: newPanY })
      }
    } else {
      setZoom(Math.min(Math.max(zoom + delta, 1), 3.75))
    }
  }, [zoom, setZoom, pan, setPan])
  
  const handleMouseDown = useCallback((e) => {
    if (e.button === 0) {
      e.preventDefault()
      isDraggingRef.current = true
      hasDraggedRef.current = false
      dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }
      setIsDragging(true)
    }
  }, [pan, isDraggingRef, hasDraggedRef, dragStartRef, setIsDragging])
  
  const handleClick = useCallback((e) => {
    if (!hasDraggedRef.current) {
      setContextMenu(prev => ({ ...prev, visible: false }))
      setSelectedLocation(null)
    }
    hasDraggedRef.current = false
  }, [hasDraggedRef])
  
  const handleRemoveTimer = useCallback((locationId, timerId) => {
    setLocationTimers(prev => ({
      ...prev,
      [locationId]: prev[locationId].filter(t => t.id !== timerId)
    }))
  }, [setLocationTimers])
  
  const handleAddTimer = useCallback((locationId, timer) => {
    setLocationTimers(prev => ({
      ...prev,
      [locationId]: [...(prev[locationId] || []), timer]
    }))
  }, [setLocationTimers])
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black font-mono">

      <style>{`
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] {
          -moz-appearance: textfield;
        }
        input[type="range"] {
          -webkit-appearance: none;
          background: transparent;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px;
          height: 14px;
          background: transparent;
          cursor: pointer;
        }
        input[type="range"]::-moz-range-thumb {
          width: 14px;
          height: 14px;
          background: transparent;
          cursor: pointer;
          border: none;
        }
        input[type="time"]::-webkit-calendar-picker-indicator {
          filter: invert(1);
          cursor: pointer;
        }
        input[type="checkbox"] {
          cursor: pointer;
        }
        input[type="checkbox"]:checked {
          background-color: #3B82F6;
          border-color: #3B82F6;
        }
        input[type="checkbox"]:focus {
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
        }
        @keyframes pulsate {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.075);
            opacity: 0.9;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .selection-ring {
          animation: spin 24s linear infinite;
        }
        .selection-ring svg {
          animation: pulsate 4s ease-in-out infinite;
        }
      `}</style>
      
      {/* Fixed Main Toolbar - Buttons for Logs, Players, etc. */}
      <div className="fixed top-0 left-0 right-0 z-50 p-0 m-0" style={{top: 0, left: 0, right: 0, position: 'fixed'}}>
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-b from-gray-900 to-black rounded-lg shadow-2xl border-2 border-orange-600/50 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-900/30 via-gray-800 to-orange-900/30 p-1">
              <div className="bg-gradient-to-b from-gray-800 to-gray-900 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {['Logs', 'Progression', 'Gene Calculator', 'Players'].map((btn) => (
                      <button 
                        key={btn} 
                        onClick={() => {
                          if (btn === 'Players') setShowPlayerModal(true)
                          else if (btn === 'Logs') setShowLogsModal(true)
                          else if (btn === 'Progression') setShowProgressionModal(true)
                          else if (btn === 'Gene Calculator') openGeneCalculator()
                          else if (btn === 'Teams') setShowTeamsModal(true)
                        }} 
                        data-testid={btn === 'Players' ? 'button-open-player-modal' : btn === 'Logs' ? 'button-open-logs-modal' : undefined} 
                        className="px-4 py-2 bg-gradient-to-b from-orange-800/60 to-orange-900 hover:from-orange-700/80 hover:to-orange-800 text-orange-100 font-bold rounded shadow-lg border-2 border-orange-600/50 transition-all duration-200 hover:shadow-xl hover:shadow-orange-900/50 tracking-wide"
                      >
                        [{btn.toUpperCase()}]
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center">
                    <WipeCountdownTimer />
                  </div>
                  <div className="flex gap-2">
                    {['Teams', 'Bot Control', 'Turret Control'].map((btn) => (
                      <button 
                        key={btn} 
                        onClick={() => {
                          if (btn === 'Players') setShowPlayerModal(true)
                          else if (btn === 'Logs') setShowLogsModal(true)
                          else if (btn === 'Teams') setShowTeamsModal(true)
                        }} 
                        data-testid={btn === 'Players' ? 'button-open-player-modal' : btn === 'Logs' ? 'button-open-logs-modal' : undefined} 
                        className="px-4 py-2 bg-gradient-to-b from-orange-800/60 to-orange-900 hover:from-orange-700/80 hover:to-orange-800 text-orange-100 font-bold rounded shadow-lg border-2 border-orange-600/50 transition-all duration-200 hover:shadow-xl hover:shadow-orange-900/50 tracking-wide"
                      >
                        [{btn.toUpperCase()}]
                      </button>
                    ))}
                    <button className="px-4 py-2 bg-gradient-to-b from-orange-800/60 to-orange-900 hover:from-orange-700/80 hover:to-orange-800 text-orange-100 font-bold rounded shadow-lg border-2 border-orange-600/50 transition-all duration-200 hover:shadow-xl hover:shadow-orange-900/50 tracking-wide">
                      [MENU]
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-70"></div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-20 px-4">

        <div className="relative">
          <div 
            ref={mapRef}
            className="relative bg-gradient-to-br from-teal-600 via-teal-500 to-cyan-500 rounded-3xl shadow-2xl overflow-hidden cursor-default select-none"
            style={{ aspectRatio: '4/3', touchAction: 'none' }}
            onContextMenu={handleContextMenu}
            onClick={handleClick}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseUp={() => { isDraggingRef.current = false; setIsDragging(false) }}
            onMouseLeave={() => { isDraggingRef.current = false; setIsDragging(false) }}
          >
            <div
              className="w-full h-full transform-gpu"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 100ms ease-out'
              }}
            >
              <div className="absolute inset-0">
                <svg className="w-full h-full" viewBox="0 0 800 800">
                  <defs>
                    <pattern id="waves" x="0" y="0" width="40" height="20" patternUnits="userSpaceOnUse">
                      <path d="M0,10 Q10,0 20,10 T40,10" stroke="#0f766e" strokeWidth="2" fill="none" opacity="0.4"/>
                    </pattern>
                  </defs>
                  <image href={rustMapImage} width="100%" height="100%" preserveAspectRatio="xMinYMin slice" style={{filter: 'brightness(0.9) contrast(1.1)'}}/>
                </svg>
              </div>

              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 800" style={{display: 'none'}}>
                <path d="M150,200 Q200,100 350,80 Q500,60 600,150 Q700,250 650,400 Q600,500 450,520 Q300,540 200,450 Q100,350 150,200 Z"
                      fill="#fbbf24" stroke="#d97706" strokeWidth="3"/>
                <path d="M160,210 Q210,110 350,90 Q490,70 590,160 Q680,260 640,390 Q590,490 450,510 Q310,530 210,440 Q110,360 160,210 Z"
                      fill="#22c55e" opacity="0.8"/>
              </svg>

              <div className="absolute inset-0 pointer-events-none">
                <svg className="w-full h-full" viewBox="0 0 800 800">
                  {Array.from({ length: 27 }, (_, i) => (
                    <line key={`v-${i}`} x1={i * 30.77} y1="0" x2={i * 30.77} y2="800" stroke="rgba(0, 0, 0, 0.4)" strokeWidth="0.75"/>
                  ))}
                  {Array.from({ length: 27 }, (_, i) => (
                    <line key={`h-${i}`} x1="0" y1={i * 30.77} x2="800" y2={i * 30.77} stroke="rgba(0, 0, 0, 0.4)" strokeWidth="0.75"/>
                  ))}
                  {Array.from({ length: 26 }, (_, col) => 
                    Array.from({ length: 26 }, (_, row) => {
                      const letter = col < 26 ? String.fromCharCode(65 + col) : `A${String.fromCharCode(65 + col - 26)}`
                      return (
                        <text key={`label-${col}-${row}`} x={col * 30.77 + 1} y={row * 30.77 + 7} fill="black" fontSize="7" fontWeight="600" textAnchor="start">
                          {letter}{row}
                        </text>
                      )
                    })
                  )}
                </svg>
              </div>

{/* Heat Map Overlay */}
              <HeatMapOverlay
                locations={locations}
                players={players || []}
                config={heatMapConfig}
                mapDimensions={{ width: 800, height: 800 }}
                onConfigChange={setHeatMapConfig}
              />

{/* Connection lines between grouped bases when one is selected */}
              {selectedLocation && (() => {
                const selectedGroupColor = getGroupColor(selectedLocation.id, locations)
                if (!selectedGroupColor) return null
                
                const groupBases = getBaseGroup(selectedLocation.id, locations)
                if (groupBases.length <= 1) return null
                
                const mainBase = groupBases.find(base => 
                  base.type === "enemy-small" || base.type === "enemy-medium" || base.type === "enemy-large"
                )
                
                if (!mainBase) return null
                
                const subordinates = groupBases.filter(base => 
                  base.type === "enemy-flank" || base.type === "enemy-farm" || base.type === "enemy-tower"
                )
                
                return (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{zIndex: 0}}>
                    {subordinates.map(subordinate => (
                      <line
                        key={`line-${mainBase.id}-${subordinate.id}`}
                        x1={`${mainBase.x}%`}
                        y1={`${mainBase.y}%`}
                        x2={`${subordinate.x}%`}
                        y2={`${subordinate.y}%`}
                        stroke={selectedGroupColor}
                        strokeWidth="3"
                        opacity="0.6"
                      />
                    ))}
                  </svg>
                )
              })()}

              {locations.map((location) => (
                <LocationMarker
                  key={location.id}
                  location={location}
                  locations={locations}
                  isSelected={selectedLocation?.id === location.id}
                  onClick={setSelectedLocation}
                  timers={locationTimers[location.id]}
                  onRemoveTimer={(timerId) => handleRemoveTimer(location.id, timerId)}
                  getOwnedBases={getOwnedBases}
                  players={players}
                  onOpenReport={onOpenBaseReport}
                  onOpenBaseReport={(location) => {
                    setBaseReportData({
                      baseId: location.id,
                      baseName: location.name,
                      baseCoords: location.coordinates,
                      baseType: location.type
                    })
                    setShowBaseReportModal(true)
                  }}
                />
              ))}
            </div>
          </div>

          {selectedLocation && (
            <SelectedLocationPanel 
              location={selectedLocation}
              onEdit={handleEditBase}
              getOwnedBases={getOwnedBases}
              onSelectLocation={setSelectedLocation}
              locationTimers={locationTimers}
              onAddTimer={handleAddTimer}
              onOpenReport={onOpenBaseReport}
              players={players}
              locations={locations}
              onOpenBaseReport={(location) => {
                setBaseReportData({
                  baseId: location.id,
                  baseName: location.name,
                  baseCoords: location.coordinates,
                  baseType: location.type
                })
                setShowBaseReportModal(true)
              }}
            />
          )}
        </div>

        {contextMenu.visible && (
          <ContextMenu 
            x={contextMenu.x}
            y={contextMenu.y}
            onAddBase={handleAddBase}
          />
        )}

        {newBaseModal.visible && (
          <BaseModal 
            modal={newBaseModal}
            modalType={modalType}
            editingLocation={editingLocation}
            locations={locations}
            onSave={handleSaveBase}
            onCancel={handleCancel}
            onDelete={handleDeleteLocation}
            onOpenBaseReport={onOpenBaseReport}




          />
        )}


        <ActionReportModal
          isVisible={showBaseReportModal}
          onClose={() => setShowBaseReportModal(false)}
          baseId={baseReportData.baseId || ''}
          baseName={baseReportData.baseName || ''}
          baseCoords={baseReportData.baseCoords || ''}
        />

        <PlayerModal
          isOpen={showPlayerModal}
          onClose={() => setShowPlayerModal(false)}
        />

        <LogsModal
          isOpen={showLogsModal}
          onClose={() => setShowLogsModal(false)}
        />

        <TeamsModal
          isOpen={showTeamsModal}
          onClose={() => setShowTeamsModal(false)}
          locations={locations}
          players={players}
          onOpenBaseModal={(base) => {
            setEditingLocation(base)
            setModalType(base.type.startsWith('friendly') ? 'friendly' : 'enemy')
            setNewBaseModal({ x: 0, y: 0, visible: true })
            setShowTeamsModal(false)
          }}
        />

        <ProgressionModal
          isOpen={showProgressionModal}
          onClose={() => setShowProgressionModal(false)}
        />
      </div>
    </div>
  )
}