import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { MapPin, Home, Shield, Wheat, Castle, Tent, X, HelpCircle, Calculator, FileText, Image, Edit, Camera, StickyNote, Search, Plus, Minus } from "lucide-react"
import { useQuery, useQueries } from "@tanstack/react-query"
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

const getColor = (type: string) => {
  if (type.startsWith("friendly")) return "text-green-400"
  if (type.startsWith("enemy")) return "text-red-400"
  return "text-yellow-400"
}

const getIcon = (type: string) => {
  const Icon = ICON_MAP[type as keyof typeof ICON_MAP] || MapPin
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

const BaseModal = ({ 
  modal, 
  modalType, 
  editingLocation,
  locations,
  onSave,
  onCancel,
  onDelete
}: any) => {
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
  
  const ownerInputRef = useRef<HTMLInputElement>(null)
  
  const handleToggleRocketCalculator = useCallback((e: any) => {
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
  
  const getMainBases = useCallback(() => {
    const bases = locations.filter((loc: any) => 
      !loc.type.includes('farm') && 
      !loc.type.includes('flank') && 
      !loc.type.includes('boat') && 
      !loc.type.includes('garage') && 
      !loc.type.includes('decaying') &&
      !loc.type.includes('tower') &&
      !loc.type.startsWith('report')
    ).map((loc: any) => loc.name.split('(')[0])
    
    return [...new Set(bases)]
  }, [locations])
  
  const getMainBasesWithInfo = useCallback(() => {
    const bases = locations.filter((loc: any) => 
      !loc.type.includes('farm') && 
      !loc.type.includes('flank') && 
      !loc.type.includes('boat') && 
      !loc.type.includes('garage') && 
      !loc.type.includes('decaying') &&
      !loc.type.includes('tower') &&
      !loc.type.startsWith('report')
    )
    
    const baseMap = new Map()
    bases.forEach((base: any) => {
      const coord = base.name.split('(')[0]
      if (!baseMap.has(coord)) {
        baseMap.set(coord, base.type)
      }
    })
    
    return baseMap
  }, [locations])
  
  const getFilteredSuggestions = useCallback((input: string) => {
    if (!input) return []
    const basesMap = getMainBasesWithInfo()
    const filtered: any[] = []
    basesMap.forEach((type: any, coord: any) => {
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
      description: LABELS[formData.type as keyof typeof LABELS] || formData.type,
      oldestTC: formData.oldestTC,
      library: formData.library,
      youtube: formData.youtube,
      upkeep: formData.upkeep,
      time: formData.reportTime,
      outcome: formData.reportOutcome,
      ownerCoordinates: formData.ownerCoordinates,
      roofCamper: formData.roofCamper,
      hostileSamsite: formData.hostileSamsite,
      raidedOut: formData.raidedOut,
      primaryRockets: formData.primaryRockets,
      enemyPlayers: formData.enemyPlayers,
      friendlyPlayers: formData.friendlyPlayers
    }
    
    onSave(baseData)
  }

  // Render the main modal content
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 border border-gray-700">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">
              {editingLocation ? 'Edit Base' : `Create ${modalType} Base`}
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-200">Base Type</label>
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
                className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-md text-gray-200 focus:border-blue-500 focus:outline-none"
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
                    <option value="enemy-decaying">Decaying Base</option>
                  </>
                )}
              </select>
            </div>

            {/* Owner coordinates input for subordinate bases */}
            {(formData.type === 'enemy-farm' || formData.type === 'enemy-flank' || formData.type === 'enemy-tower') && (
              <div className="relative">
                <label className="block text-sm font-medium mb-1 text-gray-200">Owner Coordinates</label>
                <input
                  ref={ownerInputRef}
                  type="text"
                  value={formData.ownerCoordinates}
                  onChange={(e) => {
                    const uppercaseValue = e.target.value.toUpperCase()
                    setFormData(prev => ({ ...prev, ownerCoordinates: uppercaseValue }))
                    setShowOwnerSuggestions(true)
                  }}
                  onFocus={() => setShowOwnerSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowOwnerSuggestions(false), 200)}
                  placeholder="Main base coordinates"
                  className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-md text-gray-200 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                />
                {showOwnerSuggestions && getFilteredSuggestions(formData.ownerCoordinates).length > 0 && (
                  <div className="absolute w-full mt-1 bg-gray-800 border border-gray-600 rounded-md shadow-lg max-h-32 overflow-auto z-70">
                    {getFilteredSuggestions(formData.ownerCoordinates).map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setFormData(prev => ({ ...prev, ownerCoordinates: suggestion.coord }))
                          setShowOwnerSuggestions(false)
                          ownerInputRef.current?.focus()
                        }}
                        className="flex items-center gap-2 w-full text-left px-2 py-1 text-sm text-gray-200 hover:bg-gray-700 transition-colors"
                      >
                        <div className={`${getColor(suggestion.type)} flex-shrink-0 scale-75`}>
                          {getIcon(suggestion.type)}
                        </div>
                        <span>{suggestion.coord}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-200">Notes</label>
              <textarea 
                value={formData.notes} 
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} 
                className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-md resize-none text-gray-200 placeholder-gray-500 focus:border-blue-500 focus:outline-none" 
                placeholder="Add notes..." 
                rows={3}
              />
            </div>
          </div>
          
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleSave}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium transition-colors"
            >
              {editingLocation ? 'Update' : 'Create'}
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md font-medium transition-colors"
            >
              Cancel
            </button>
            {editingLocation && (
              <button
                onClick={onDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium transition-colors"
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