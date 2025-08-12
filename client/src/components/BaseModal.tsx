import { useState, useRef, useEffect, useCallback } from 'react'
import { MapPin, Home, Shield, Wheat, Castle, Tent, X, HelpCircle, Calculator } from 'lucide-react'

// ============= CONSTANTS =============
const LABELS = {
  'friendly-main': 'Main',
  'friendly-flank': 'Flank',
  'friendly-farm': 'Farm',
  'friendly-boat': 'Boat',
  'friendly-garage': 'Garage',
  'enemy-small': 'Small',
  'enemy-medium': 'Medium',
  'enemy-large': 'Large',
  'enemy-flank': 'Flank',
  'enemy-tower': 'Tower',
  'enemy-farm': 'Farm',
  'enemy-decaying': 'Decaying',
  'report-pvp': 'PvP',
  'report-heli': 'Heli',
  'report-bradley': 'Bradley'
}

const ICON_MAP = {
  'friendly-main': Home,
  'friendly-flank': Shield,
  'friendly-farm': Wheat,
  'friendly-boat': Castle,
  'friendly-garage': Castle,
  'enemy-small': Tent,
  'enemy-medium': Castle,
  'enemy-large': Shield,
  'enemy-flank': Shield,
  'enemy-tower': Castle,
  'enemy-farm': Wheat,
  'enemy-decaying': Castle,
  'report-pvp': Shield,
  'report-heli': Shield,
  'report-bradley': Shield
}

const getColor = (type) => {
  if (type.startsWith('friendly')) return 'text-green-400'
  if (type.startsWith('enemy')) return 'text-red-400'
  return 'text-yellow-400'
}

const getIcon = (type) => {
  const Icon = ICON_MAP[type] || MapPin
  return <Icon className="h-3 w-3" />
}

const MATERIAL_ICONS = {
  wood: '🪵',
  stone: '🪨',
  metal: '🔩',
  hqm: '⚙️'
}

const MATERIAL_LABELS = {
  wood: 'Wood',
  stone: 'Stone',
  metal: 'Metal',
  hqm: 'HQM'
}

// ============= ROCKET CALCULATOR CONSTANTS =============
const SLIDER_DESCRIPTIONS = {
  75: "Will panic with doors open",
  100: "Potato",
  150: "Normal defender",
  200: "Good PVPers",
  250: "Probably cheating"
}

const RAID_MULTIPLIERS = {
  sheetMetal: 1,
  wood: 2,
  garage: 3,
  stone: 4,
  metal: 8,
  hqm: 15
}

// ============= ROCKET CALCULATOR UTILITY FUNCTIONS =============
const calculateRocketAmmo = (rocketCount, isPrimary, modifier = 150) => {
  if (isPrimary) {
    const adjustedRockets = rocketCount > 12 ? 6 + Math.floor((rocketCount - 12) / 8) * 3 : rocketCount
    const hv = adjustedRockets * 1
    const incin = Math.floor(rocketCount / 20)
    const explo = 10 + (rocketCount * 6)
    return { rockets: adjustedRockets, hv, incin, explo }
  } else {
    const baseRockets = Math.min(rocketCount, 4)
    const extraRockets = Math.max(0, rocketCount - 4)
    const adjustedRockets = baseRockets + Math.floor(extraRockets * (modifier / 100))
    const hv = 9 + Math.floor(adjustedRockets / 6) * 3
    const incin = Math.floor(adjustedRockets / 12)
    const explo = 10 + (rocketCount * 6)
    return { rockets: adjustedRockets, hv, incin, explo }
  }
}

interface BaseModalProps {
  modal: { x: number; y: number; visible: boolean }
  modalType: string
  editingLocation: any
  editingReport?: any
  locations: any[]
  onSave: (data: any) => void
  onCancel: () => void
  onDelete?: () => void
  reportLibrary?: any[]
  addToReportLibrary?: (report: any) => void
  updateReportLibrary?: (report: any) => void
}

const BaseModal = ({ 
  modal, 
  modalType, 
  editingLocation,
  locations,
  onSave,
  onCancel,
  onDelete
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
        type: editingLocation.type || (modalType === 'friendly' ? 'friendly-main' : modalType === 'enemy' ? 'enemy-small' : 'report-pvp'),
        notes: editingLocation.notes || '',
        oldestTC: editingLocation.oldestTC || 0,
        players: editingLocation.players || '',
        upkeep: editingLocation.upkeep || { wood: 0, stone: 0, metal: 0, hqm: 0 },
        reportTime: editingLocation.reportTime || '',
        reportOutcome: editingLocation.reportOutcome || 'neutral',
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
    }
  }, [editingLocation, modalType])

  const getGridCoordinate = (x, y, locations, excludeId = null) => {
    const rows = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const cols = 30
    const row = Math.floor(y / (100 / rows.length))
    const col = Math.floor(x / (100 / cols)) + 1
    const baseName = rows[Math.min(row, rows.length - 1)] + col.toString().padStart(2, '0')
    
    const existing = locations.filter(loc => 
      loc.id !== excludeId && loc.name.startsWith(baseName)
    ).length
    
    return existing > 0 ? `${baseName}(${existing + 1})` : baseName
  }

  const handleSave = () => {
    const name = editingLocation ? editingLocation.name : getGridCoordinate(modal.x, modal.y, locations, editingLocation?.id)
    
    onSave({
      ...formData,
      name
    })
  }

  if (!modal.visible) return null

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
      style={{ zIndex: 9999 }}
    >
      <div className="bg-gradient-to-b from-gray-700 to-gray-800 rounded-xl shadow-2xl border border-gray-600 max-w-md w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-600">
            <h2 className="text-lg font-bold text-white">
              {editingLocation ? 'Edit' : 'Add'} {LABELS[formData.type] || modalType.charAt(0).toUpperCase() + modalType.slice(1)}
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-200 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Base Type Selection */}
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
                        <option value="enemy-decaying">Decaying Base</option>
                      </>
                    )}
                  </select>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full p-3 bg-gray-600 border border-gray-500 rounded text-white text-sm resize-none focus:border-blue-500 focus:outline-none"
                rows={3}
                placeholder="Add notes about this location..."
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-2 p-4 border-t border-gray-600">
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleSave()
              }} 
              className="bg-blue-600 text-white py-1.5 px-3 rounded-md hover:bg-blue-700 transition-colors font-medium text-sm cursor-pointer"
              type="button"
            >
              {editingLocation ? 'Update' : 'Save'}
            </button>
            <button 
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onCancel()
              }} 
              className="bg-gray-700 text-gray-200 py-1.5 px-3 rounded-md hover:bg-gray-600 transition-colors font-medium text-sm cursor-pointer"
              type="button"
            >
              Cancel
            </button>
            {modalType === 'enemy' && (
              <button 
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setShowAdvancedPanel(!showAdvancedPanel)
                }} 
                className="bg-purple-600 text-white py-1.5 px-3 rounded-md hover:bg-purple-700 transition-colors font-medium text-sm cursor-pointer"
                type="button"
              >
                Advanced
              </button>
            )}
            {editingLocation && onDelete && (
              <button 
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onDelete()
                }} 
                className="bg-red-600 text-white py-1.5 px-3 rounded-md hover:bg-red-700 transition-colors font-medium text-sm cursor-pointer"
                type="button"
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