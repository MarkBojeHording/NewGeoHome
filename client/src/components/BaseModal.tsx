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

  if (isLoading) return <div className="text-gray-400 text-sm">Loading reports...</div>
  if (baseReports.length === 0) return <div className="text-gray-400 text-sm">No reports for this base</div>

  return (
    <div className="space-y-2 max-h-48 overflow-y-auto">
      {baseReports.map((report) => {
        const categoryName = FULL_CATEGORY_NAMES[report.category] || report.category

        return (
          <div
            key={report.id}
            className="bg-gray-700 rounded-lg p-3 border border-gray-600 cursor-pointer hover:bg-gray-600 transition-colors"
            onClick={() => onOpenReport(report)}
            data-testid={`report-${report.id}`}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="text-sm font-medium text-white">{categoryName}</div>
              <div className="text-xs text-gray-400">{report.time}</div>
            </div>
            
            {report.outcome && (
              <div className={`text-xs font-medium mb-1 ${
                report.outcome === 'victory' 
                  ? 'text-green-400' 
                  : report.outcome === 'defeat' 
                  ? 'text-red-400' 
                  : 'text-yellow-400'
              }`}>
                {report.outcome}
              </div>
            )}
            
            {report.content?.notes && (
              <div className="text-xs text-gray-300 mt-2">
                {report.content.notes.slice(0, 100)}{report.content.notes.length > 100 ? '...' : ''}
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
            
            {/* No Results / Create Premium Player */}
            {!hasResults && searchTerm.trim().length > 2 && (
              <button
                onClick={createPremiumPlayer}
                className="w-full text-left px-2 py-1 hover:bg-gray-700 flex items-center gap-2 text-sm text-orange-400"
              >
                <Plus className="w-3 h-3" />
                Create premium player: {searchTerm}
              </button>
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

  const coordinates = modal ? getGridCoordinate(modal.x, modal.y, locations, editingLocation?.id) : ''

  // Generate coordinate suggestions based on existing bases
  const coordinateSuggestions = useMemo(() => {
    const allCoords = locations.map(loc => loc.name.split('(')[0])
    const uniqueCoords = [...new Set(allCoords)]
    return uniqueCoords.filter(coord => 
      coord.toLowerCase().includes(formData.ownerCoordinates?.toLowerCase() || '')
    ).slice(0, 5)
  }, [locations, formData.ownerCoordinates])

  const handleSave = () => {
    const baseData = {
      ...formData,
      x: modal.x,
      y: modal.y,
      name: coordinates,
      id: editingLocation?.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }

    onSave(baseData)
  }

  const openReport = (report) => {
    // Open report in BaseModal by treating it as an existing location
    const reportLocation = {
      id: report.id,
      type: report.category,
      x: modal.x,
      y: modal.y,
      name: coordinates,
      notes: report.content?.notes || '',
      time: report.time,
      outcome: report.outcome,
      enemyPlayers: report.content?.enemyPlayers || '',
      friendlyPlayers: report.content?.friendlyPlayers || ''
    }
    
    // This will trigger the form to populate with report data
    setFormData({
      type: report.category,
      notes: report.content?.notes || '',
      oldestTC: 0,
      players: '',
      upkeep: { wood: 0, stone: 0, metal: 0, hqm: 0 },
      reportTime: report.time || '',
      reportOutcome: report.outcome || 'neutral',
      ownerCoordinates: '',
      library: '',
      youtube: '',
      roofCamper: false,
      hostileSamsite: false,
      raidedOut: false,
      primaryRockets: 0,
      enemyPlayers: report.content?.enemyPlayers || '',
      friendlyPlayers: report.content?.friendlyPlayers || ''
    })
  }

  // Modal window handlers  
  const handleModalClick = (e) => {
    e.stopPropagation()
  }

  if (!modal) return null

  const renderReportModal = () => (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1 text-gray-200">Report Type</label>
          <div className="relative">
            <select 
              value={formData.type} 
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))} 
              className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-md appearance-none pr-16 text-gray-200 focus:border-blue-500 focus:outline-none"
            >
              <option value="report-pvp">PvP Encounter</option>
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
      <div className="flex gap-3 mb-4" style={{ height: '200px' }}>
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
      
      {/* Notes Field */}
      <textarea 
        value={formData.notes} 
        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} 
        className="w-full h-24 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs text-gray-200 placeholder-gray-500 resize-none focus:outline-none focus:border-blue-500"
        placeholder="Add report details..."
      />
    </div>
  )
  
  const renderBaseModal = () => (
    <div className="grid grid-cols-5 gap-4">
      <div className="col-span-2 flex flex-col">
        <label className="block text-sm font-medium mb-1 text-gray-200">Base Type</label>
        <div className="relative mb-3">
          <select 
            value={formData.type} 
            onChange={(e) => {
              const newType = e.target.value
              setFormData(prev => ({
                ...prev,
                type: newType,
                ownerCoordinates: (newType !== 'enemy-farm' && newType !== 'enemy-flank' && newType !== 'enemy-tower') ? '' : prev.ownerCoordinates
              }))
            }} 
            className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-md appearance-none pr-16 text-gray-200 focus:border-blue-500 focus:outline-none"
          >
            {modalType === 'friendly' && (
              <>
                <option value="friendly-main">Friendly Main Base</option>
                <option value="friendly-flank">Friendly Flank Base</option>
                <option value="friendly-farm">Friendly Farm</option>
                <option value="friendly-boat">Boat Base</option>
                <option value="friendly-garage">Garage</option>
              </>
            )}
            {modalType === 'enemy' && (
              <>
                <option value="enemy-small">Main Small</option>
                <option value="enemy-medium">Main Medium</option>
                <option value="enemy-large">Main Large</option>
                <option value="enemy-flank">Flank Base</option>
                <option value="enemy-tower">Tower</option>
                <option value="enemy-farm">Farm</option>
                <option value="enemy-decaying">Decaying</option>
              </>
            )}
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

        {/* Reports Panel */}
        {editingLocation && (
          <div className="mb-3">
            <button
              onClick={() => setShowReportPanel(!showReportPanel)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-1.5 px-2 rounded flex items-center justify-center gap-1"
            >
              <FileText className="w-3 h-3" />
              {showReportPanel ? 'Hide Reports' : 'Show Reports'}
            </button>
            {showReportPanel && (
              <div className="mt-2 bg-gray-800 border border-gray-600 rounded p-2">
                <BaseReportsContent baseName={editingLocation.name} onOpenReport={openReport} />
              </div>
            )}
          </div>
        )}

        {/* Owner coordinates (only for flank/farm/tower) */}
        {(formData.type === 'enemy-farm' || formData.type === 'enemy-flank' || formData.type === 'enemy-tower') && (
          <div className="mb-3 relative">
            <label className="block text-sm font-medium mb-1 text-gray-200">
              Owner Coordinates
            </label>
            <input 
              ref={ownerInputRef}
              type="text" 
              value={formData.ownerCoordinates} 
              onChange={(e) => setFormData(prev => ({ ...prev, ownerCoordinates: e.target.value }))}
              onFocus={() => setShowOwnerSuggestions(true)}
              onBlur={() => setTimeout(() => setShowOwnerSuggestions(false), 150)}
              className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-md text-gray-200 focus:border-blue-500 focus:outline-none text-sm" 
              placeholder="Main base coordinates..."
            />
            {showOwnerSuggestions && coordinateSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded shadow-lg z-50 max-h-32 overflow-y-auto">
                {coordinateSuggestions.map((coord, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setFormData(prev => ({ ...prev, ownerCoordinates: coord }))
                      setShowOwnerSuggestions(false)
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-700 text-gray-200 text-sm"
                  >
                    {coord}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Oldest TC Section */}
        {modalType === 'enemy' && (
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1 text-gray-200">Oldest TC (hours)</label>
            <input 
              type="number" 
              value={formData.oldestTC} 
              onChange={(e) => setFormData(prev => ({ ...prev, oldestTC: parseInt(e.target.value) || 0 }))} 
              className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-md text-gray-200 focus:border-blue-500 focus:outline-none text-sm" 
              placeholder="0"
            />
          </div>
        )}

        {/* Advanced Panel Toggle */}
        <div className="mb-3">
          <button
            onClick={() => setShowAdvancedPanel(!showAdvancedPanel)}
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-medium py-1.5 px-2 rounded flex items-center justify-center gap-1"
          >
            <HelpCircle className="w-3 h-3" />
            {showAdvancedPanel ? 'Hide Advanced' : 'Show Advanced'}
          </button>
        </div>

        {/* Advanced Panel Content */}
        {showAdvancedPanel && (
          <div className="space-y-3 p-3 bg-gray-800 rounded border border-gray-600">
            {/* External links */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-200">Library Research</label>
              <input 
                type="text" 
                value={formData.library} 
                onChange={(e) => setFormData(prev => ({ ...prev, library: e.target.value }))} 
                className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-md text-gray-200 focus:border-blue-500 focus:outline-none text-sm" 
                placeholder="Research link..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-200">YouTube Video</label>
              <input 
                type="text" 
                value={formData.youtube} 
                onChange={(e) => setFormData(prev => ({ ...prev, youtube: e.target.value }))} 
                className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-md text-gray-200 focus:border-blue-500 focus:outline-none text-sm" 
                placeholder="YouTube link..."
              />
            </div>

            {/* Boolean toggles */}
            <div className="flex flex-col gap-2">
              <label className="flex items-center text-sm text-gray-200">
                <input 
                  type="checkbox" 
                  checked={formData.roofCamper} 
                  onChange={(e) => setFormData(prev => ({ ...prev, roofCamper: e.target.checked }))} 
                  className="mr-2"
                />
                Roof Camper
              </label>
              
              <label className="flex items-center text-sm text-gray-200">
                <input 
                  type="checkbox" 
                  checked={formData.hostileSamsite} 
                  onChange={(e) => setFormData(prev => ({ ...prev, hostileSamsite: e.target.checked }))} 
                  className="mr-2"
                />
                Hostile Samsite
              </label>
              
              <label className="flex items-center text-sm text-gray-200">
                <input 
                  type="checkbox" 
                  checked={formData.raidedOut} 
                  onChange={(e) => {
                    const newValue = e.target.checked
                    setFormData(prev => ({ ...prev, raidedOut: newValue }))
                    if (newValue) {
                      setShowRaidedOutPrompt(true)
                    }
                  }} 
                  className="mr-2"
                />
                Raided Out
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Right side content */}
      <div className="col-span-3 flex flex-col">
        {/* Base preview placeholder and rocket calculator */}
        <div className="flex-1 bg-gray-900 border border-gray-600 rounded-lg p-4 mb-4 min-h-0 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-white font-semibold">Base Preview</h4>
            <button
              onClick={handleToggleRocketCalculator}
              className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-medium py-1 px-2 rounded flex items-center gap-1"
            >
              <Calculator className="w-3 h-3" />
              Rockets
            </button>
          </div>
          
          <div className="bg-gray-800 rounded-lg border border-gray-600 flex-1 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <Image className="w-8 h-8 mx-auto mb-2" />
              <div className="text-sm">Base preview will appear here</div>
            </div>
          </div>
        </div>

        {/* Upkeep tracker for friendly bases */}
        {modalType === 'friendly' && (
          <div className="bg-gray-900 border border-green-500 rounded-lg p-3 mb-4">
            <h4 className="text-green-400 font-semibold text-sm mb-3">Daily Upkeep</h4>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(MATERIAL_LABELS).map(([key, label]) => (
                <div key={key} className="text-center">
                  <div className="text-lg mb-1">{MATERIAL_ICONS[key]}</div>
                  <input
                    type="number"
                    value={formData.upkeep[key]}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      upkeep: { ...prev.upkeep, [key]: parseInt(e.target.value) || 0 }
                    }))}
                    className="w-full px-1 py-1 bg-gray-800 border border-gray-600 rounded text-center text-white text-xs focus:border-green-500 focus:outline-none"
                    placeholder="0"
                  />
                  <div className="text-xs text-gray-400 mt-1">{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}


      </div>
    </div>
  )

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onCancel}>
        <div 
          className="bg-gray-900 border border-gray-600 rounded-lg w-[900px] max-w-[90vw] max-h-[90vh] overflow-hidden flex flex-col"
          onClick={handleModalClick}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-600">
            <div className="flex items-center gap-2">
              <div className={`${getColor(formData.type, editingLocation)} bg-gray-700 rounded p-1 border border-gray-600`}>
                {getIcon(formData.type)}
              </div>
              <h3 className="text-white font-semibold">
                {editingLocation ? `Edit ${LABELS[editingLocation.type]} - ${editingLocation.name}` : `New ${LABELS[formData.type]} - ${coordinates}`}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {editingLocation && (
                <button
                  onClick={onDelete}
                  className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-1.5 px-3 rounded"
                >
                  Delete
                </button>
              )}
              <button onClick={onCancel} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {modalType === 'report' ? renderReportModal() : renderBaseModal()}
          </div>

          <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-600">
            <button 
              onClick={onCancel}
              className="bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium py-2 px-4 rounded"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded"
            >
              {editingLocation ? 'Update' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {/* Raided Out Prompt */}
      {showRaidedOutPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-gray-900 border border-gray-600 rounded-lg p-6 max-w-md">
            <h3 className="text-white font-semibold mb-3">Base Raided Out</h3>
            <p className="text-gray-300 text-sm mb-4">
              Do you want to set the oldest TC to 0 hours since the base was raided?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setFormData(prev => ({ ...prev, oldestTC: 0 }))
                  setShowRaidedOutPrompt(false)
                }}
                className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-4 rounded"
              >
                Yes, Reset TC
              </button>
              <button
                onClick={() => setShowRaidedOutPrompt(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium py-2 px-4 rounded"
              >
                No, Keep Current
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rocket Calculator */}
      {showRocketCalculator && (
        <RocketCalculatorSection
          position={rocketCalculatorPosition}
          onClose={() => setShowRocketCalculator(false)}
          targetTCs={1}
          onRocketsCalculated={(rockets) => {
            setFormData(prev => ({ ...prev, primaryRockets: rockets }))
          }}
        />
      )}
    </>
  )
}

export default BaseModal