import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { MapPin, Home, Shield, Wheat, Castle, Tent, X, HelpCircle, Calculator, FileText } from "lucide-react"
import { RocketCalculatorSection } from './RocketCalculator'
import type { Location, BaseType } from '../../shared/location-schema'
import type { Report, GeneralReport, BaseReport } from '../../shared/report-schema'

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

const getColor = (type: string): string => {
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

// ============= RAIDED OUT PROMPT COMPONENT =============
const RaidedOutPrompt = ({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" style={{ zIndex: 10000 }}>
    <div className="bg-gradient-to-b from-gray-700 to-gray-800 rounded-xl border border-gray-600 p-6 max-w-sm">
      <h3 className="text-white font-bold mb-4">Confirm Raided Out</h3>
      <p className="text-gray-300 mb-6">Mark this base as raided out?</p>
      <div className="flex gap-3">
        <button onClick={onConfirm} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">
          Confirm
        </button>
        <button onClick={onCancel} className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded">
          Cancel
        </button>
      </div>
    </div>
  </div>
)

interface BaseModalProps {
  modal: { x: number; y: number; visible: boolean }
  modalType: string
  editingLocation: Location | null
  locations: Location[]
  onSave: (data: Partial<Location>) => void
  onCancel: () => void
  onDelete: () => void
  editingReport?: GeneralReport | null
  reportLibrary?: Report[]
  addToReportLibrary?: (report: Report) => void
  updateReportLibrary?: (report: Report) => void
  reportCounter?: number
  onOpenBaseReport?: (base: Location) => void
}

const BaseModal = ({ 
  modal, 
  modalType, 
  editingLocation,
  locations,
  onSave,
  onCancel,
  onDelete,
  onOpenBaseReport
}: BaseModalProps) => {
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
  
  const handleToggleRocketCalculator = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
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
    if (!locations || !Array.isArray(locations)) return []
    const bases = locations.filter(loc => 
      !loc.type.includes('farm') && 
      !loc.type.includes('boat') && 
      !loc.type.includes('garage') && 
      !loc.type.includes('tower') && 
      !loc.type.includes('decaying')
    )
    return bases.map(base => base.name || "Unknown")
  }, [locations])

  const getCoordinateOwners = useCallback((input: string): string[] => {
    if (!input || !locations) return []
    
    const filtered = locations.filter(location => 
      location.ownerCoordinates && location.ownerCoordinates.toLowerCase().includes(input.toLowerCase())
    )
    
    if (filtered.length === 0) return []
    
    const allOwners = filtered.flatMap(location => 
      location.ownerCoordinates!.split(',').map(owner => owner.trim()).filter(Boolean)
    )
    
    const uniqueOwners = [...new Set(allOwners)]
    return uniqueOwners.filter(owner => owner.toLowerCase().includes(input.toLowerCase()))
  }, [locations])

  const getGridCoordinate = (x: number, y: number, locations: Location[] = [], excludeId: string | null = null): string => {
    const COLS = 32
    const ROWS = 24
    const CELL_WIDTH_PERCENT = 3.125
    const CELL_HEIGHT_PERCENT = 4.167
    
    const col = Math.floor(x / CELL_WIDTH_PERCENT)
    const row = Math.floor(y / CELL_HEIGHT_PERCENT)
    const clampedCol = Math.min(Math.max(col, 0), COLS - 1)
    const clampedRow = Math.min(Math.max(row, 0), ROWS - 1)
    const letter = clampedCol < 26 ? String.fromCharCode(65 + clampedCol) : `A${String.fromCharCode(65 + clampedCol - 26)}`
    const number = clampedRow + 1
    const baseCoord = `${letter}${number}`
    
    const duplicates = locations.filter(loc => {
      if (excludeId && loc.id === excludeId) return false
      const locBase = loc.name?.split('(')[0]
      return locBase === baseCoord
    })
    
    return duplicates.length === 0 ? baseCoord : `${baseCoord}(${duplicates.length + 1})`
  }
  
  if (!modal.visible) return null

  const displayName = LABELS[formData.type as keyof typeof LABELS] || "Unknown"

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40" data-testid="modal-base">
      <div className="bg-gradient-to-b from-gray-700 to-gray-800 rounded-xl border border-gray-600 p-6 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <div className={getColor(formData.type)}>
              {getIcon(formData.type)}
            </div>
            {editingLocation ? `Edit ${displayName}` : `Add ${displayName}`}
          </h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Base Type Selection */}
          {!editingLocation && (
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-200">Base Type</label>
              <select 
                value={formData.type} 
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))} 
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 focus:border-blue-500 focus:outline-none"
                data-testid="select-base-type"
              >
                {modalType === 'friendly' && (
                  <>
                    <option value="friendly-main">Main Base</option>
                    <option value="friendly-flank">Flank Base</option>
                    <option value="friendly-farm">Farm</option>
                    <option value="friendly-boat">Boat Base</option>
                    <option value="friendly-garage">Garage</option>
                  </>
                )}
                {modalType === 'enemy' && (
                  <>
                    <option value="enemy-small">Small Base</option>
                    <option value="enemy-medium">Medium Base</option>
                    <option value="enemy-large">Large Base</option>
                    <option value="enemy-flank">Flank Base</option>
                    <option value="enemy-tower">Tower</option>
                    <option value="enemy-farm">Farm</option>
                    <option value="enemy-decaying">Decaying Base</option>
                  </>
                )}
              </select>
            </div>
          )}

          {/* Location Display */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-200">Location</label>
            <input 
              type="text" 
              value={getGridCoordinate(modal.x, modal.y, locations, editingLocation?.id || null)}
              disabled
              className="w-full px-3 py-2 bg-gray-600 border border-gray-600 rounded-md text-gray-400"
              data-testid="input-location"
            />
          </div>

          {/* Owner Coordinates */}
          <div className="relative">
            <label className="block text-sm font-medium mb-1 text-gray-200">Owner Coordinates</label>
            <input 
              ref={ownerInputRef}
              type="text" 
              value={formData.ownerCoordinates} 
              onChange={(e) => {
                setFormData(prev => ({ ...prev, ownerCoordinates: e.target.value }))
                setShowOwnerSuggestions(e.target.value.length > 0)
              }}
              onFocus={() => setShowOwnerSuggestions(formData.ownerCoordinates.length > 0)}
              onBlur={() => setTimeout(() => setShowOwnerSuggestions(false), 200)}
              placeholder="Enter player names separated by commas"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
              data-testid="input-owner-coordinates"
            />
            {showOwnerSuggestions && (
              <div className="absolute top-full left-0 right-0 bg-gray-800 border border-gray-600 rounded-md mt-1 max-h-32 overflow-y-auto z-10">
                {getCoordinateOwners(formData.ownerCoordinates).map((owner, index) => (
                  <button
                    key={index}
                    className="w-full text-left px-3 py-2 text-gray-200 hover:bg-gray-700"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      setFormData(prev => ({ ...prev, ownerCoordinates: owner }))
                      setShowOwnerSuggestions(false)
                      ownerInputRef.current?.focus()
                    }}
                  >
                    {owner}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-200">Notes</label>
            <textarea 
              value={formData.notes} 
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} 
              className="w-full h-20 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 placeholder-gray-500 resize-none focus:outline-none focus:border-blue-500"
              placeholder="Add any notes about this base..."
              data-testid="textarea-notes"
            />
          </div>

          {/* Action Buttons for existing bases */}
          {editingLocation && (
            <div className="flex gap-2">
              <button
                onClick={() => onOpenBaseReport?.(editingLocation)}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center justify-center gap-2"
                data-testid="button-add-report"
              >
                <FileText className="h-4 w-4" />
                Add Report
              </button>
              <button
                onClick={handleToggleRocketCalculator}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                data-testid="button-rocket-calculator"
              >
                <Calculator className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-between gap-3 mt-6">
          <button 
            onClick={onCancel}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            data-testid="button-cancel"
          >
            Cancel
          </button>
          <div className="flex gap-2">
            {editingLocation && (
              <button 
                onClick={onDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                data-testid="button-delete"
              >
                Delete
              </button>
            )}
            <button 
              onClick={() => onSave(formData)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              data-testid="button-save"
            >
              Save
            </button>
          </div>
        </div>

        {/* Rocket Calculator */}
        {showRocketCalculator && (
          <RocketCalculatorSection
            position={rocketCalculatorPosition}
            onClose={() => setShowRocketCalculator(false)}
          />
        )}

        {/* Raided Out Prompt */}
        {showRaidedOutPrompt && (
          <RaidedOutPrompt 
            onConfirm={() => {
              setShowRaidedOutPrompt(false)
              setFormData(prev => ({ ...prev, raidedOut: true }))
            }}
            onCancel={() => {
              setShowRaidedOutPrompt(false)
              setFormData(prev => ({ ...prev, raidedOut: false }))
            }}
          />
        )}
      </div>
    </div>
  )
}

export default BaseModal