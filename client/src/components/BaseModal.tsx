import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { MapPin, Home, Shield, Wheat, Castle, Tent, X, HelpCircle, Calculator, FileText, Image, Edit, Camera, StickyNote, Search, Plus, Minus } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { apiRequest, queryClient } from '@/lib/queryClient'
import { RocketCalculatorSection } from './RocketCalculator'

import type { ExternalPlayer } from '@shared/schema'

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
  "enemy-decaying": Castle,
  "report-pvp": Shield,
  "report-heli": Shield,
  "report-bradley": Shield
}

const getColor = (type: string, location = null) => {
  if (location?.abandoned) return "text-gray-400"
  if (type.startsWith("friendly")) return "text-green-400"
  if (type.startsWith("enemy")) return "text-red-400"
  return "text-yellow-400"
}

const getIcon = (type: string) => {
  const Icon = ICON_MAP[type] || MapPin
  return <Icon className="h-3 w-3" />
}

const MATERIAL_ICONS = {
  wood: "🪵",
  stone: "🪨",
  metal: "🔩",
  hqm: "⚙️"
}

const MATERIAL_LABELS = {
  wood: "Wood",
  stone: "Stone",
  metal: "Metal",
  hqm: "HQM"
}

// Grid configuration for coordinate calculation
const GRID_CONFIG = {
  COLS: 32,
  ROWS: 24,
  CELL_WIDTH_PERCENT: 3.125,
  CELL_HEIGHT_PERCENT: 4.167
}

// Generate grid coordinate from x,y position
const getGridCoordinate = (x: number, y: number, existingLocations: any[] = [], excludeId: string | null = null) => {
  const col = Math.floor(x / GRID_CONFIG.CELL_WIDTH_PERCENT)
  const row = Math.floor(y / GRID_CONFIG.CELL_HEIGHT_PERCENT)
  const clampedCol = Math.min(Math.max(col, 0), GRID_CONFIG.COLS - 1)
  const clampedRow = Math.min(Math.max(row, 0), GRID_CONFIG.ROWS - 1)
  const letter = clampedCol < 26 ? String.fromCharCode(65 + clampedCol) : `A${String.fromCharCode(65 + clampedCol - 26)}`
  const number = clampedRow + 1
  const baseCoord = `${letter}${number}`
  
  const duplicates = existingLocations.filter(loc => {
    if (excludeId && loc.id === excludeId) return false
    const locBase = loc.name.split('(')[0]
    return locBase === baseCoord
  })
  
  return duplicates.length === 0 ? baseCoord : `${baseCoord}(${duplicates.length + 1})`
}

// ============= BASE REPORTS CONTENT COMPONENT =============
const BaseReportsContent = ({ baseName, onOpenReport }) => {
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['/api/reports']
  })

  // Filter reports for this specific base
  const baseReports = reports.filter(report => {
    if (!baseName) return false
    return report.baseId || 
           report.locationName === baseName ||
           report.locationCoords === baseName ||
           (report.content?.baseName === baseName) ||
           (report.content?.baseCoords === baseName)
  })

  // Report type labels mapping
  const FULL_CATEGORY_NAMES = {
    'report-pvp': 'PvP Encounter',
    'report-spotted': 'Spotted Enemy',
    'report-bradley': 'Bradley/Heli Activity',
    'report-oil': 'Oil/Cargo Activity', 
    'report-monument': 'Monument Activity',
    'report-farming': 'Farming Activity',
    'report-loaded': 'Loaded Enemy',
    'report-raid': 'Raid Activity'
  }

  if (isLoading) {
    return <div className="text-gray-400 text-sm">Loading reports...</div>
  }

  if (baseReports.length === 0) {
    return (
      <div className="text-center py-6 text-gray-400">
        <FileText className="mx-auto w-8 h-8 mb-2 opacity-50" />
        <p className="text-sm">No reports found for this base</p>
        <p className="text-xs mt-1">Create a report to track activity</p>
      </div>
    )
  }

  return (
    <div className="space-y-2 max-h-48 overflow-y-auto">
      {baseReports.map(report => {
        const content = report.content || {}
        
        return (
          <div 
            key={report.id}
            className="bg-gray-700 rounded-lg p-3 hover:bg-gray-600 cursor-pointer transition-colors border border-gray-600"
            onClick={() => onOpenReport && onOpenReport(report)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-medium ${getColor(report.type)}`}>
                    {FULL_CATEGORY_NAMES[report.type] || report.type}
                  </span>
                  {report.time && (
                    <span className="text-xs text-gray-400">
                      {report.time}
                    </span>
                  )}
                </div>
                
                {content.outcome && (
                  <div className={`text-xs mb-1 ${
                    content.outcome === 'won' ? 'text-green-400' : 
                    content.outcome === 'lost' ? 'text-red-400' : 'text-yellow-400'
                  }`}>
                    Outcome: {content.outcome}
                  </div>
                )}
              </div>
              
              <div className={`${getColor(report.type)} bg-gray-600 rounded p-1`}>
                {getIcon(report.type)}
              </div>
            </div>
            
            {content.notes && (
              <div className="text-xs text-gray-300 mt-2">
                {content.notes.slice(0, 100)}{content.notes.length > 100 ? '...' : ''}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ============= PLAYER SEARCH SELECTOR COMPONENT =============
const PlayerSearchSelector = ({ selectedPlayers, onPlayersChange, maxHeight }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  
  // Fetch players from external API
  const { data: players = [] } = useQuery<ExternalPlayer[]>({
    queryKey: ['/api/players']
  })

  // Fetch premium players from our database
  const { data: premiumPlayers = [] } = useQuery({
    queryKey: ['/api/premium-players']
  })

  // Parse selected players from comma-separated string
  const selectedPlayersList = selectedPlayers ? selectedPlayers.split(',').map(p => p.trim()).filter(p => p) : []
  
  // Filter regular players based on search term
  const filteredPlayers = players.filter(player => 
    player.playerName.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedPlayersList.includes(player.playerName)
  )

  // Filter premium players based on search term
  const filteredPremiumPlayers = premiumPlayers.filter(player => 
    player.playerName.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedPlayersList.includes(player.playerName)
  )

  // Check if we have any results
  const hasResults = filteredPlayers.length > 0 || filteredPremiumPlayers.length > 0
  


  const addPlayer = (playerName) => {
    const newPlayers = [...selectedPlayersList, playerName].join(', ')
    onPlayersChange(newPlayers)
    setSearchTerm('')
    setShowDropdown(false)
  }

  const createPremiumPlayer = async () => {
    if (!searchTerm.trim()) return
    
    try {
      await apiRequest('/api/premium-players', {
        method: 'POST',
        body: { playerName: searchTerm.trim() }
      })
      
      // Add the player to the selection
      addPlayer(searchTerm.trim())
      
      // Invalidate premium players cache to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/premium-players'] })
    } catch (error) {
      console.error('Failed to create premium player:', error)
    }
  }

  const removePlayer = (playerName) => {
    const newPlayers = selectedPlayersList.filter(p => p !== playerName).join(', ')
    onPlayersChange(newPlayers)
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Search Input */}
      <div className="relative p-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setShowDropdown(true)
            }}
            onFocus={() => setShowDropdown(true)}
            className="w-full pl-7 pr-2 py-1 bg-gray-800 border border-gray-600 rounded text-sm text-gray-200 placeholder-gray-400 focus:border-blue-500 focus:outline-none"
            placeholder="Search players to add..."
          />
        </div>
        
        {/* Search Results Dropdown */}
        {showDropdown && searchTerm.trim() && (
          <div className="absolute top-full left-2 right-2 mt-1 bg-gray-800 border border-gray-600 rounded max-h-32 overflow-y-auto z-50">
            {/* Regular Players */}
            {filteredPlayers.slice(0, 10).map((player) => (
              <button
                key={`regular-${player.id}`}
                onClick={() => addPlayer(player.playerName)}
                className="w-full text-left px-2 py-1 hover:bg-gray-700 flex items-center gap-2 text-sm"
              >
                <div className={`w-2 h-2 rounded-full ${player.isOnline ? 'bg-green-500' : 'bg-gray-500'}`} />
                <span className={player.isOnline ? 'text-green-400' : 'text-gray-400'}>
                  {player.playerName}
                </span>

              </button>
            ))}
            
            {/* Premium Players */}
            {filteredPremiumPlayers.slice(0, 10).map((player) => (
              <button
                key={`premium-${player.id}`}
                onClick={() => addPlayer(player.playerName)}
                className="w-full text-left px-2 py-1 hover:bg-gray-700 flex items-center gap-2 text-sm"
              >
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                <span className="text-orange-400">
                  {player.playerName}
                </span>
                <span className="text-xs text-orange-600">
                  (Premium)
                </span>
              </button>
            ))}
            
            {/* No Results */}
            {!hasResults && (
              <div className="px-2 py-2 text-sm text-gray-500">
                No players found. 
                <button
                  onClick={createPremiumPlayer}
                  className="ml-2 text-orange-400 hover:text-orange-300 underline"
                >
                  Add "{searchTerm}" as premium player?
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Selected Players List */}
      <div className="flex-1 overflow-y-auto p-2">
        {selectedPlayersList.length === 0 ? (
          <div className="text-gray-500 text-sm italic">No players selected</div>
        ) : (
          <div className="space-y-1">
            {selectedPlayersList.map((playerName, index) => {
              const player = players.find(p => p.playerName === playerName)
              const premiumPlayer = premiumPlayers.find(p => p.playerName === playerName)
              const isPremium = !!premiumPlayer
              
              return (
                <div key={index} className="flex items-center justify-between bg-gray-800 rounded px-2 py-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      isPremium 
                        ? 'bg-orange-500' 
                        : player?.isOnline 
                        ? 'bg-green-500' 
                        : 'bg-gray-500'
                    }`} />
                    <span className={`text-sm ${
                      isPremium 
                        ? 'text-orange-400' 
                        : player?.isOnline 
                        ? 'text-green-400' 
                        : 'text-gray-400'
                    }`}>
                      {playerName}
                    </span>
                    {isPremium && (
                      <span className="text-xs text-orange-600">
                        (Premium)
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => removePlayer(playerName)}
                    className="text-red-400 hover:text-red-300 p-1"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
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
        players: '',
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

  // Helper to get all main bases (enemy and friendly) with their info
  const getMainBasesWithInfo = useCallback(() => {
    if (!locations) return new Map()
    
    const basesMap = new Map()
    locations.forEach(location => {
      if (location.name && location.isMainBase) {
        const baseType = LABELS[location.type] || location.type
        basesMap.set(location.name, baseType)
      }
    })
    
    return basesMap
  }, [locations])

  // Get autocomplete suggestions for owner coordinates
  const coordinateSuggestions = useMemo(() => {
    const input = formData.ownerCoordinates.trim()
    if (!input || input.length < 1) return []
    
    const basesMap = getMainBasesWithInfo()
    if (basesMap.size === 0) return []
    
    const filtered = []
    basesMap.forEach((type, coord) => {
      if (coord.toLowerCase().startsWith(input.toLowerCase())) {
        filtered.push({ coord, type })
      }
    })
    return filtered.sort((a, b) => a.coord.localeCompare(b.coord))
  }, [getMainBasesWithInfo])
  
  const handleSave = () => {
    const baseData = {
      type: formData.type,
      notes: formData.notes,
      description: LABELS[formData.type] || formData.type,
      upkeep: modalType === 'friendly' ? formData.upkeep : undefined,
      time: modalType === 'report' ? formData.reportTime : undefined,
      outcome: modalType === 'report' ? formData.reportOutcome : undefined,
      enemyPlayers: modalType === 'report' ? formData.enemyPlayers : undefined,
      friendlyPlayers: modalType === 'report' ? formData.friendlyPlayers : undefined,
      players: modalType === 'enemy' ? formData.players : undefined,
      isMainBase: modalType === 'enemy' ? true : undefined,
      oldestTC: modalType === 'enemy' && formData.oldestTC > 0 ? formData.oldestTC : undefined,
      ownerCoordinates: (formData.type === 'enemy-farm' || formData.type === 'enemy-flank' || formData.type === 'enemy-tower') ? formData.ownerCoordinates : undefined,
      library: modalType === 'enemy' ? formData.library : undefined,
      youtube: modalType === 'enemy' ? formData.youtube : undefined,
      roofCamper: modalType === 'enemy' ? formData.roofCamper : undefined,
      hostileSamsite: modalType === 'enemy' ? formData.hostileSamsite : undefined,

      primaryRockets: modalType === 'enemy' ? formData.primaryRockets : undefined,
      abandoned: formData.abandoned,
      // Generate unique ID for reports if not editing existing one
      id: modalType === 'report' && !editingLocation ? `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` : undefined
    }
    
    onSave(baseData)
  }
  
  const renderReportModal = () => (
    <div>
      <div className="flex gap-4 items-end mb-4">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1 text-gray-200">Report Type</label>
          <div className="relative">
            <select 
              value={formData.type} 
              onChange={(e) => {
                const newType = e.target.value
                setFormData(prev => ({ 
                  ...prev, 
                  type: newType,
                  reportOutcome: newType === 'report-farming' ? 'lost' : newType === 'report-loaded' ? 'won' : 'neutral'
                }))
              }} 
              className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-md appearance-none pr-16 text-gray-200 focus:border-blue-500 focus:outline-none"
            >
              <option value="report-pvp">PVP General</option>
              <option value="report-spotted">Spotted Enemy</option>
              <option value="report-bradley">Countered/Took Bradley/Heli</option>
              <option value="report-oil">Countered/Took Oil/Cargo</option>
              <option value="report-monument">Big Score/Fight at Monument</option>
              <option value="report-farming">Killed While Farming</option>
              <option value="report-loaded">Killed Loaded Enemy</option>
              <option value="report-raid">Countered Raid</option>
            </select>
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none flex items-center gap-1">
              <div className={`${getColor(formData.type, editingLocation)} bg-gray-700 rounded p-0.5 border border-gray-600`}>
                {getIcon(formData.type)}
              </div>
              <svg className="h-3 w-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-200">Time</label>
          <input 
            type="time" 
            value={formData.reportTime} 
            onChange={(e) => setFormData(prev => ({ ...prev, reportTime: e.target.value }))} 
            className="px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-md text-gray-200 focus:border-blue-500 focus:outline-none" 
          />
        </div>
      </div>
      
      {/* Enemy and Friendly Player Containers */}
      <div className="flex gap-3" style={{ height: '200px' }}>
        {/* Enemy Players */}
        <div className="flex-1 bg-gray-900 border border-red-500 rounded p-1 flex flex-col relative">
          <h4 className="text-red-400 font-semibold text-xs absolute top-1 left-1">Enemy Players</h4>
          <div className="mt-3 flex-1 overflow-hidden px-2 pb-1">
            <PlayerSearchSelector
              selectedPlayers={formData.enemyPlayers}
              onPlayersChange={(players) => setFormData(prev => ({ ...prev, enemyPlayers: players }))}
              maxHeight="100%"
            />
          </div>
        </div>
        
        {/* Friendly Players */}
        <div className="flex-1 bg-gray-900 border border-green-500 rounded p-3 flex flex-col">
          <h4 className="text-green-400 font-semibold text-sm mb-2">Friendly Players</h4>
          <div className="flex-1 overflow-y-auto">
            <textarea 
              value={formData.friendlyPlayers}
              onChange={(e) => setFormData(prev => ({ ...prev, friendlyPlayers: e.target.value }))}
              className="w-full h-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs text-gray-200 placeholder-gray-500 resize-none focus:outline-none focus:border-green-500"
              placeholder="List friendly players..."
            />
          </div>
        </div>
      </div>
    </div>
  )

  return null // Placeholder to prevent crashes - full implementation needed
}

export default BaseModal