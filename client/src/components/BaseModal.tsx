import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { MapPin, Home, Shield, Wheat, Castle, Tent, X, HelpCircle, Calculator, FileText, Image, Edit, Camera, StickyNote, Search, Plus, Minus } from "lucide-react"
import { useQuery, useQueries } from "@tanstack/react-query"
import { apiRequest, queryClient } from '@/lib/queryClient'
import { RocketCalculatorSection } from './RocketCalculator'
import type { ExternalPlayer } from '@shared/schema'

// ============= ENEMY BASE HEAT MAP COMPONENT =============
const EnemyBaseHeatMap = ({ players }: { players: string }) => {
  // Parse selected players from comma-separated string
  const selectedPlayersList = useMemo(() => {
    return players ? players.split(',').map(p => p.trim()).filter(p => p) : []
  }, [players])
  
  // Fetch session data for all selected players
  const sessionQueries = useQueries({
    queries: selectedPlayersList.map(playerName => ({
      queryKey: ['/api/players', playerName, 'sessions'],
      enabled: !!playerName
    }))
  })
  
  // Multi-player heat map data generation
  const generateMultiPlayerHeatMapData = (allPlayersData: any[]) => {
    const heatMapData: Record<string, Record<number, number>> = {}
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    
    // Initialize empty data structure
    days.forEach(day => {
      heatMapData[day] = {}
      for (let hour = 0; hour < 24; hour++) {
        heatMapData[day][hour] = 0
      }
    })
    
    // Process each player's session data for accurate concurrent tracking
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const dayName = days[dayIndex]
      
      for (let hour = 0; hour < 24; hour++) {
        let concurrentPlayers = 0
        
        // Count players with active sessions during this specific day/hour
        allPlayersData.forEach(playerSessions => {
          if (!playerSessions || !Array.isArray(playerSessions)) return
          
          // Check if this player has a session active during this specific day/hour
          const hasActiveSession = playerSessions.some(session => {
            const startTime = new Date(session.startTime)
            const endTime = new Date(session.endTime)
            
            // Get the day of week and check if it matches
            const sessionStartDay = startTime.getDay()
            const sessionEndDay = endTime.getDay()
            
            // Check if session spans across the target day and hour
            if (sessionStartDay === dayIndex || sessionEndDay === dayIndex) {
              const sessionStartHour = startTime.getHours()
              const sessionEndHour = endTime.getHours()
              
              // For same day sessions
              if (sessionStartDay === sessionEndDay && sessionStartDay === dayIndex) {
                return hour >= sessionStartHour && hour < sessionEndHour
              }
              
              // For sessions spanning midnight (different days)
              if (sessionStartDay === dayIndex && sessionEndDay !== dayIndex) {
                return hour >= sessionStartHour
              }
              
              if (sessionEndDay === dayIndex && sessionStartDay !== dayIndex) {
                return hour < sessionEndHour
              }
            }
            
            return false
          })
          
          if (hasActiveSession) {
            concurrentPlayers++
          }
        })
        
        heatMapData[dayName][hour] = concurrentPlayers
      }
    }
    
    return heatMapData
  }
  
  // Get heat map color based on concurrent player count
  const getMultiPlayerHeatMapColor = (playerCount: number) => {
    if (playerCount === 0) return { className: 'bg-gray-800', style: {} }
    if (playerCount === 1) return { className: 'bg-blue-900', style: {} }        // Dark blue
    if (playerCount === 2) return { className: 'bg-green-400', style: {} }       // Light green
    if (playerCount === 3) return { className: 'bg-yellow-400', style: {} }      // Yellow
    if (playerCount === 4) return { className: 'bg-orange-500', style: {} }      // Orange
    return { className: 'bg-red-500', style: {} }                               // Red (5+ players)
  }
  
  // Render day column with hours
  const renderDayColumn = (day: string, heatMapData: any) => {
    const dayData = heatMapData[day] || {}
    const hours = Array.from({ length: 24 }, (_, i) => i)
    
    return hours.map(hour => {
      const playerCount = dayData[hour] || 0
      const colorConfig = getMultiPlayerHeatMapColor(playerCount)
      
      return (
        <div
          key={hour}
          className={`${colorConfig.className} border-b border-gray-700`}
          style={{
            height: '6px',
            marginBottom: '0.5px',
            ...colorConfig.style
          }}
          title={`${day} ${hour}:00 - ${playerCount} player${playerCount !== 1 ? 's' : ''} active`}
        />
      )
    })
  }
  
  // Get all session data
  const allSessionsData = sessionQueries.map(query => query.data || [])
  const isLoading = sessionQueries.some(query => query.isLoading)
  
  // Generate heat map data
  const heatMapData = useMemo(() => {
    if (isLoading) return {}
    return generateMultiPlayerHeatMapData(allSessionsData)
  }, [allSessionsData, isLoading])
  
  return (
    <div className="flex gap-1">
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
        <div key={day} className="flex-1">
          <div className="text-[10px] text-gray-400 text-center">{day}</div>
          <div className="bg-gray-800 rounded" style={{height: '160px', position: 'relative'}}>
            <div className="absolute inset-0 flex flex-col">
              {renderDayColumn(day, heatMapData)}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ============= CONSTANTS =============
const LABELS = {
  "friendly-main": "Main",
  "friendly-flank": "Flank", 
  "friendly-farm": "Farm",
  "friendly-boat": "Boat",
  "friendly-garage": "Garage",
  "enemy-small": "Small",
  "enemy-medium": "Medium",
  "enemy-large": "Large",
  "enemy-flank": "Flank",
  "enemy-tower": "Tower",
  "enemy-farm": "Farm",
  "enemy-decaying": "Decaying",
  "report-pvp": "PvP",
  "report-heli": "Heli",
  "report-bradley": "Bradley"
}

const ICON_MAP = {
  "friendly-main": Home,
  "friendly-flank": Shield,
  "friendly-farm": Wheat,
  "friendly-boat": Castle,
  "friendly-garage": Castle,
  "enemy-small": Tent,
  "enemy-medium": Castle,
  "enemy-large": Shield,
  "enemy-flank": Shield,
  "enemy-tower": Castle,
  "enemy-farm": Wheat,
  "enemy-decaying": Tent,
  "report-pvp": FileText,
  "report-heli": FileText,
  "report-bradley": FileText
}

const GRID_CONFIG = {
  COLS: 26,
  ROWS: 26,
  CELL_WIDTH_PERCENT: 100 / 26,
  CELL_HEIGHT_PERCENT: 100 / 26
}

// Generate grid coordinate from x,y position
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

const BaseModal = ({ 
  modal, 
  modalType, 
  editingLocation,
  locations,
  onSave,
  onCancel,
  onDelete
}) => {
  const [formData, setFormData] = useState({
    type: modalType === 'friendly' ? 'friendly-main' : modalType === 'enemy' ? 'enemy-small' : 'report-pvp',
    notes: '',
    oldestTC: 0,
    players: '',
    upkeep: { wood: 0, stone: 0, metal: 0, hqm: 0 },
    reportTime: '',
    reportOutcome: 'neutral',
    ownerCoordinates: '',
    library: '',
    youtube: '',
    roofCamper: false,
    hostileSamsite: false,
    raidedOut: false,
    primaryRockets: 0,
    enemyPlayers: '',
    friendlyPlayers: ''
  })
  
  const [showOwnerSuggestions, setShowOwnerSuggestions] = useState(false)
  const [showAdvancedPanel, setShowAdvancedPanel] = useState(false)
  const [showRaidedOutPrompt, setShowRaidedOutPrompt] = useState(false)
  const [showRocketCalculator, setShowRocketCalculator] = useState(false)
  const [rocketCalculatorPosition, setRocketCalculatorPosition] = useState({ x: 0, y: 0 })
  const [showReportPanel, setShowReportPanel] = useState(false)
  
  const ownerInputRef = useRef(null)
  
  const handleToggleRocketCalculator = useCallback((e) => {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    setRocketCalculatorPosition({
      x: rect.right + 10,
      y: rect.top
    })
    setShowRocketCalculator(!showRocketCalculator)
  }, [showRocketCalculator])
  
  // Initialize form data when editing
  useEffect(() => {
    if (editingLocation) {
      setFormData({
        type: editingLocation.type,
        notes: editingLocation.notes || '',
        oldestTC: editingLocation.oldestTC || 0,
        players: editingLocation.players || '',
        upkeep: editingLocation.upkeep || { wood: 0, stone: 0, metal: 0, hqm: 0 },
        reportTime: editingLocation.time || '',
        reportOutcome: editingLocation.outcome || 'neutral',
        ownerCoordinates: editingLocation.ownerCoordinates || '',
        library: editingLocation.library || '',
        youtube: editingLocation.youtube || '',
        roofCamper: editingLocation.roofCamper || false,
        hostileSamsite: editingLocation.hostileSamsite || false,
        raidedOut: editingLocation.raidedOut || false,
        primaryRockets: editingLocation.primaryRockets || 0,
        enemyPlayers: editingLocation.enemyPlayers || '',
        friendlyPlayers: editingLocation.friendlyPlayers || ''
      })
    } else if (modalType === 'report') {
      const now = new Date()
      setFormData(prev => ({
        ...prev,
        reportTime: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
      }))
    }
  }, [editingLocation, modalType])
  
  const getMainBases = useCallback(() => {
    const bases = locations.filter(loc => 
      !loc.type.includes('farm') && 
      !loc.type.includes('flank') && 
      !loc.type.includes('boat') && 
      !loc.type.includes('garage') && 
      !loc.type.includes('decaying') &&
      !loc.type.includes('tower') &&
      !loc.type.startsWith('report')
    ).map(loc => loc.name.split('(')[0])
    
    return [...new Set(bases)]
  }, [locations])
  
  const getMainBasesWithInfo = useCallback(() => {
    const bases = locations.filter(loc => 
      !loc.type.includes('farm') && 
      !loc.type.includes('flank') && 
      !loc.type.includes('boat') && 
      !loc.type.includes('garage') && 
      !loc.type.includes('decaying') &&
      !loc.type.includes('tower') &&
      !loc.type.startsWith('report')
    )
    
    const baseMap = new Map()
    bases.forEach(base => {
      const coord = base.name.split('(')[0]
      if (!baseMap.has(coord)) {
        baseMap.set(coord, base.type)
      }
    })
    
    return baseMap
  }, [locations])
  
  const getFilteredSuggestions = useCallback((input) => {
    if (!input) return []
    const basesMap = getMainBasesWithInfo()
    const filtered = []
    basesMap.forEach((type, coord) => {
      if (coord.toLowerCase().startsWith(input.toLowerCase())) {
        filtered.push({ coord, type })
      }
    })
    return filtered.sort((a, b) => a.coord.localeCompare(b.coord))
  }, [getMainBasesWithInfo])

  // Simple UI with heat map for enemy bases
  const renderMainContent = () => (
    <div className="space-y-3">
      {modalType === 'enemy' && (
        <div className="border border-gray-600 rounded-lg bg-gray-700 mb-3 relative">
          <label className="absolute top-0 left-0 text-xs font-medium text-gray-300 pl-0.5">Heat Map</label>
          <div className="p-2 pt-3">
            <EnemyBaseHeatMap players={formData.players} />
          </div>
        </div>
      )}
      
      <div>
        <label className="block text-sm font-medium mb-1 text-gray-200">Notes</label>
        <textarea 
          value={formData.notes} 
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} 
          className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-md resize-none text-gray-200 placeholder-gray-500 focus:border-blue-500 focus:outline-none" 
          placeholder="Add notes..." 
          style={{height: modalType === 'friendly' ? '190px' : modalType === 'enemy' ? '120px' : '340px', resize: 'none'}} 
        />
      </div>
    </div>
  )
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">
            {modalType === 'friendly' ? 'Friendly Base' : modalType === 'enemy' ? 'Enemy Base' : 'Report'}
          </h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-200">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-4">
          {renderMainContent()}
          
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => onSave({
                ...formData,
                x: modal.x,
                y: modal.y,
                name: editingLocation ? editingLocation.name : getGridCoordinate(modal.x, modal.y, locations, editingLocation?.id)
              })}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors"
            >
              Save
            </button>
            <button
              onClick={onCancel}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-md transition-colors"
            >
              Cancel
            </button>
            {editingLocation && onDelete && (
              <button
                onClick={() => onDelete(editingLocation.id)}
                className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default BaseModal