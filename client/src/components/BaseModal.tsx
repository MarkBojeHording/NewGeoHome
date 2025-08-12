import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Calculator, X, Flame, Eye, Building2, Zap } from 'lucide-react'

// RocketCalculator constants and functions
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

const CalculatorModal = ({ position, onClose, onCalculate }) => {
  const [values, setValues] = useState({
    sheetMetal: 0, wood: 0, garage: 0, stone: 0, metal: 0, hqm: 0
  })
  
  const handleChange = (type, value) => {
    const numValue = Math.min(99, Math.max(0, Number(value) || 0))
    const newValues = { ...values, [type]: numValue }
    setValues(newValues)
    
    let total = 0
    Object.keys(newValues).forEach(key => {
      total += newValues[key] * RAID_MULTIPLIERS[key]
    })
    onCalculate(total)
  }
  
  const items = [
    { key: 'sheetMetal', label: 'Sheet Metal Door' },
    { key: 'wood', label: 'Wood Wall/High Wall' },
    { key: 'garage', label: 'Garage Door/Window' },
    { key: 'stone', label: 'Stone Wall/High Wall' },
    { key: 'metal', label: 'Metal Wall' },
    { key: 'hqm', label: 'HQM Wall' }
  ]
  
  return (
    <div 
      className="fixed pointer-events-none" 
      style={{ zIndex: 99999, left: position.x + 'px', top: position.y + 'px' }}
    >
      <div className="bg-gray-800 rounded-lg shadow-2xl border-2 border-gray-600 p-4 w-96 pointer-events-auto" style={{boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9)'}}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white">Raid Calculator</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        
        <div className="grid grid-cols-6 gap-2">
          {items.map((item) => (
            <div key={item.key} className="text-center">
              <label className="block text-[10px] font-medium text-gray-300 mb-1 h-6 leading-tight">
                {item.label}
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={values[item.key]}
                  onChange={(e) => handleChange(item.key, e.target.value)}
                  className="w-full pl-1 pr-6 py-1 bg-gray-700 border border-gray-600 rounded text-center text-white font-bold text-sm focus:border-blue-500 focus:outline-none"
                  min="0"
                  max="99"
                  placeholder="0"
                />
                <div className="absolute right-0.5 top-0.5 bottom-0.5 flex flex-col" style={{width: '14px'}}>
                  <button
                    type="button"
                    onClick={() => handleChange(item.key, Math.min(99, (values[item.key] || 0) + 1))}
                    className="flex items-center justify-center h-1/2 bg-gray-600 hover:bg-gray-500 rounded-t text-gray-300 transition-colors border-b border-gray-700"
                    style={{fontSize: '8px', lineHeight: '0'}}
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChange(item.key, Math.max(0, (values[item.key] || 0) - 1))}
                    className="flex items-center justify-center h-1/2 bg-gray-600 hover:bg-gray-500 rounded-b text-gray-300 transition-colors"
                    style={{fontSize: '8px', lineHeight: '0'}}
                  >
                    ▼
                  </button>
                </div>
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5">×{RAID_MULTIPLIERS[item.key]}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export const RocketCalculatorSection = ({ 
  primaryRockets, 
  onPrimaryRocketsChange,
  showCalculatorModal,
  calculatorPosition,
  onToggleCalculator,
  onCloseCalculator
}) => {
  const [onlineRaidModifier, setOnlineRaidModifier] = useState(150)
  const [showSliderTooltip, setShowSliderTooltip] = useState(false)
  
  const ammo = useMemo(() => calculateRocketAmmo(primaryRockets, true), [primaryRockets])
  const onlineAmmo = useMemo(() => calculateRocketAmmo(primaryRockets, false, onlineRaidModifier), [primaryRockets, onlineRaidModifier])
  
  return (
    <>
      <div className="border border-gray-600 rounded-lg p-0 bg-gray-700 mb-3 relative">
        <button 
          className={`absolute top-1 right-1 rounded p-0.5 transition-colors cursor-pointer ${
            showCalculatorModal ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-gray-600'
          }`}
          onClick={onToggleCalculator}
          type="button"
        >
          <Calculator className={`h-5 w-5 ${showCalculatorModal ? 'text-white' : 'text-blue-500'}`} />
        </button>
        <div className="px-1">
          <div className="flex items-center gap-1">
            <label className="text-[10px] font-medium text-gray-300 mr-1" style={{margin: '3px'}}>Primary Raid</label>
            <div className="flex gap-1 text-center">
              <div className="flex flex-col items-center">
                <div className="text-[9px] font-medium text-gray-400">Rocket</div>
                <input 
                  type="number" 
                  value={primaryRockets} 
                  onChange={(e) => onPrimaryRocketsChange(Math.min(999, Math.max(0, Number(e.target.value))))} 
                  className="w-full px-0 py-0 bg-gray-600 border border-gray-500 rounded text-xs font-bold text-center text-gray-200 focus:border-blue-500 focus:outline-none" 
                  min="0" 
                  max="999" 
                  style={{width: '32px', fontSize: '10px'}} 
                />
              </div>
              {['HV', 'Incin', 'Explo'].map((type, i) => (
                <div key={type} className="flex flex-col items-center">
                  <div className="text-[9px] font-medium text-gray-400">{type}</div>
                  <div className="w-full px-0.5 py-0 bg-gray-600 rounded text-xs font-bold text-center text-gray-200" style={{width: '32px', fontSize: '10px'}}>
                    {[ammo.hv, ammo.incin, ammo.explo][i]}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="px-1 pb-1">
          <div className="flex items-center gap-1 relative">
            <label className="text-[10px] font-medium text-gray-300 mr-1">Online</label>
            <div className="flex-1 px-1 relative">
              <input
                type="range"
                min={75}
                max={250}
                value={onlineRaidModifier}
                onChange={(e) => setOnlineRaidModifier(Number(e.target.value))}
                onMouseEnter={() => setShowSliderTooltip(true)}
                onMouseLeave={() => setShowSliderTooltip(false)}
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider-thumb"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((onlineRaidModifier - 75) / (250 - 75)) * 100}%, #4b5563 ${((onlineRaidModifier - 75) / (250 - 75)) * 100}%, #4b5563 100%)`
                }}
              />
              {showSliderTooltip && (
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-gray-200 text-xs px-2 py-1 rounded whitespace-nowrap border border-gray-600">
                  {SLIDER_DESCRIPTIONS[onlineRaidModifier] || `${onlineRaidModifier}%`}
                </div>
              )}
            </div>
            <div className="flex gap-1 text-center">
              <div className="flex flex-col items-center">
                <div className="text-[9px] font-medium text-gray-400">Rocket</div>
                <div className="w-full px-0.5 py-0 bg-gray-600 rounded text-xs font-bold text-center text-gray-200" style={{width: '32px', fontSize: '10px'}}>
                  {onlineAmmo.rockets}
                </div>
              </div>
              {['HV', 'Incin', 'Explo'].map((type, i) => (
                <div key={type} className="flex flex-col items-center">
                  <div className="text-[9px] font-medium text-gray-400">{type}</div>
                  <div className="w-full px-0.5 py-0 bg-gray-600 rounded text-xs font-bold text-center text-gray-200" style={{width: '32px', fontSize: '10px'}}>
                    {[onlineAmmo.hv, onlineAmmo.incin, onlineAmmo.explo][i]}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {showCalculatorModal && (
        <CalculatorModal
          position={calculatorPosition}
          onClose={onCloseCalculator}
          onCalculate={onPrimaryRocketsChange}
        />
      )}
    </>
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

  const getGridCoordinate = (x, y, existingLocations, excludeId) => {
    const gridSize = 40
    const gridX = Math.floor(x / gridSize)
    const gridY = Math.floor(y / gridSize)
    
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const baseCoord = `${letters[gridY % 26]}${gridX}`
    
    // Check for conflicts with existing locations
    const coordsInUse = new Set(
      existingLocations
        .filter(loc => loc.id !== excludeId) // Exclude current location when editing
        .map(loc => loc.name.split('(')[0])
    )
    
    if (!coordsInUse.has(baseCoord)) {
      return baseCoord
    }
    
    // Find next available coordinate
    for (let i = 1; i <= 99; i++) {
      const newCoord = `${baseCoord}${i}`
      if (!coordsInUse.has(newCoord)) {
        return newCoord
      }
    }
    
    return baseCoord
  }

  const getIcon = (type) => {
    const iconClass = "h-4 w-4"
    switch(type) {
      case 'friendly-main': return <Building2 className={iconClass} />
      case 'friendly-flank': return <Zap className={iconClass} />
      case 'friendly-farm': return <span className="text-xs font-bold">F</span>
      case 'friendly-boat': return <span className="text-xs font-bold">B</span>
      case 'friendly-garage': return <span className="text-xs font-bold">G</span>
      case 'enemy-small': return <Building2 className={iconClass} />
      case 'enemy-medium': return <Building2 className={iconClass} />
      case 'enemy-large': return <Building2 className={iconClass} />
      case 'enemy-flank': return <Zap className={iconClass} />
      case 'enemy-tower': return <span className="text-xs font-bold">T</span>
      case 'enemy-farm': return <span className="text-xs font-bold">F</span>
      case 'enemy-decaying': return <span className="text-xs font-bold">D</span>
      case 'report-pvp': return <Flame className={iconClass} />
      case 'report-raid': return <span className="text-xs font-bold">R</span>
      case 'report-general': return <Eye className={iconClass} />
      default: return <Building2 className={iconClass} />
    }
  }

  const getColor = (type) => {
    switch(type) {
      case 'friendly-main': return 'text-green-400'
      case 'friendly-flank': return 'text-green-300'
      case 'friendly-farm': return 'text-green-600'
      case 'friendly-boat': return 'text-blue-400'
      case 'friendly-garage': return 'text-gray-400'
      case 'enemy-small': return 'text-red-500'
      case 'enemy-medium': return 'text-red-400'
      case 'enemy-large': return 'text-red-300'
      case 'enemy-flank': return 'text-orange-400'
      case 'enemy-tower': return 'text-purple-400'
      case 'enemy-farm': return 'text-yellow-400'
      case 'enemy-decaying': return 'text-gray-500'
      case 'report-pvp': return 'text-red-400'
      case 'report-raid': return 'text-orange-400'
      case 'report-general': return 'text-blue-400'
      default: return 'text-gray-400'
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    const coordinate = editingLocation ? editingLocation.name : getGridCoordinate(modal.x, modal.y, locations, editingLocation?.id)
    
    const newLocation = {
      id: editingLocation ? editingLocation.id : Date.now(),
      x: modal.x,
      y: modal.y,
      type: formData.type,
      name: coordinate,
      notes: formData.notes,
      oldestTC: formData.oldestTC,
      time: formData.reportTime,
      outcome: formData.reportOutcome,
      ownerCoordinates: formData.ownerCoordinates,
      library: formData.library,
      youtube: formData.youtube,
      roofCamper: formData.roofCamper,
      hostileSamsite: formData.hostileSamsite,
      raidedOut: formData.raidedOut,
      primaryRockets: formData.primaryRockets,
      upkeep: formData.upkeep,
      enemyPlayers: formData.enemyPlayers,
      friendlyPlayers: formData.friendlyPlayers
    }
    
    onSave(newLocation)
  }

  const renderReportModal = () => (
    <div className="grid grid-cols-2 gap-4 h-96">
      {/* Enemy Players */}
      <div className="flex-1 bg-gray-900 border border-red-500 rounded p-3 flex flex-col">
        <h4 className="text-red-400 font-semibold text-sm mb-2">Enemy Players</h4>
        <div className="flex-1 overflow-y-auto">
          <textarea 
            value={formData.enemyPlayers}
            onChange={(e) => setFormData(prev => ({ ...prev, enemyPlayers: e.target.value }))}
            className="w-full h-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs text-gray-200 placeholder-gray-500 resize-none focus:outline-none focus:border-red-500"
            placeholder="List enemy players..."
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
      
      {/* Report Time and Outcome */}
      <div className="col-span-2 grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-200">Report Time</label>
          <input 
            type="time" 
            value={formData.reportTime} 
            onChange={(e) => setFormData(prev => ({ ...prev, reportTime: e.target.value }))} 
            className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-md text-gray-200 focus:border-blue-500 focus:outline-none" 
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-200">Outcome</label>
          <select 
            value={formData.reportOutcome} 
            onChange={(e) => setFormData(prev => ({ ...prev, reportOutcome: e.target.value }))} 
            className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-md text-gray-200 focus:border-blue-500 focus:outline-none"
          >
            <option value="victory">Victory</option>
            <option value="defeat">Defeat</option>
            <option value="neutral">Neutral/Ongoing</option>
          </select>
        </div>
      </div>
      
      {/* Notes Container */}
      <div className="col-span-2 bg-gray-900 border border-gray-600 rounded p-3">
        <h4 className="text-gray-300 font-semibold text-sm mb-2">Notes</h4>
        <textarea 
          value={formData.notes} 
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} 
          className="w-full h-24 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs text-gray-200 placeholder-gray-500 resize-none focus:outline-none focus:border-blue-500"
          placeholder="Add report details..."
        />
      </div>
    </div>
  )
  
  const renderBaseModal = () => (
    <div className="grid grid-cols-5 gap-4">
      <div className="col-span-2 flex flex-col">
        {modalType === 'friendly' && (
          <>
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
                <option value="friendly-main">Friendly Main Base</option>
                <option value="friendly-flank">Friendly Flank Base</option>
                <option value="friendly-farm">Friendly Farm</option>
                <option value="friendly-boat">Boat Base</option>
                <option value="friendly-garage">Garage</option>
              </select>
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none flex items-center gap-1">
                <div className={`${getColor(formData.type)} bg-gray-700 rounded p-0.5 border border-gray-600`}>
                  {getIcon(formData.type)}
                </div>
                <svg className="h-3 w-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </>
        )}
        
        <label className="block text-sm font-medium mb-1 text-gray-200">Base owners</label>
        <div className="border border-gray-600 rounded-md bg-gray-700 flex-1" style={{minHeight: modalType === 'enemy' ? '280px' : '300px'}}>
          <textarea 
            value={formData.players} 
            onChange={(e) => setFormData(prev => ({ ...prev, players: e.target.value }))} 
            className="w-full h-full px-2 py-1.5 bg-transparent border-none rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-200 placeholder-gray-500" 
            placeholder="List base owners here..." 
          />
        </div>
      </div>

      <div className="col-span-3">
        {modalType === 'friendly' && (
          <div className="border border-gray-600 rounded-lg p-3 bg-gray-700 mb-3">
            <label className="block text-sm font-medium mb-1 text-gray-300">Upkeep Tracker</label>
            <div className="space-y-2">
              {['wood', 'stone', 'metal', 'hqm'].map((resource) => (
                <div key={resource} className="flex items-center gap-3">
                  <label className="text-xs font-medium text-gray-400 w-12 capitalize">{resource.toUpperCase()}</label>
                  <input 
                    type="number" 
                    value={formData.upkeep[resource]} 
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      upkeep: { ...prev.upkeep, [resource]: Math.max(0, Math.min(999999, Number(e.target.value))) }
                    }))} 
                    className="flex-1 px-1.5 py-0.5 bg-gray-600 border border-gray-500 rounded text-sm text-gray-200 focus:border-blue-500 focus:outline-none" 
                    min="0"
                    max="999999"
                    style={{maxWidth: '100px'}}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        
        {modalType === 'enemy' && (
          <div className="border border-gray-600 rounded-lg bg-gray-700 mb-3 relative">
            <label className="absolute top-0 left-0 text-xs font-medium text-gray-300 pl-0.5">Heat Map</label>
            <div className="p-2 pt-3">
              <div className="flex gap-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="flex-1">
                    <div className="text-[10px] text-gray-400 text-center">{day}</div>
                    <div className="bg-gray-800 rounded" style={{height: '160px', position: 'relative'}}>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {modalType === 'enemy' && (
          <div className="flex gap-3 mb-3">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1 text-gray-200">Base Type</label>
              <div className="relative">
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
                  className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-md appearance-none pr-8 text-gray-200 focus:border-blue-500 focus:outline-none"
                >
                  <option value="enemy-small">Main Small</option>
                  <option value="enemy-medium">Main Medium</option>
                  <option value="enemy-large">Main Large</option>
                  <option value="enemy-flank">Flank Base</option>
                  <option value="enemy-tower">Tower</option>
                  <option value="enemy-farm">Farm</option>
                  <option value="enemy-decaying">Decaying Base</option>
                </select>
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none flex items-center gap-1">
                  <div className={`${getColor(formData.type)} bg-gray-700 rounded p-0.5 border border-gray-600`}>
                    {getIcon(formData.type)}
                  </div>
                  <svg className="h-3 w-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="flex-1">
              <RocketCalculatorSection
                primaryRockets={formData.primaryRockets}
                onPrimaryRocketsChange={(value) => setFormData(prev => ({ ...prev, primaryRockets: value }))}
                showCalculatorModal={showRocketCalculator}
                calculatorPosition={rocketCalculatorPosition}
                onToggleCalculator={handleToggleRocketCalculator}
                onCloseCalculator={() => setShowRocketCalculator(false)}
              />
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
    </div>
  )
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="relative">
        <div className="relative">
          {modalType === 'enemy' && (
            <>
              <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 bg-red-600 rounded-lg px-3 py-1.5 border-2 border-red-500 shadow-lg whitespace-nowrap" style={{zIndex: 60}}>
                <span className="text-white font-mono font-bold text-3xl">
                  {editingLocation ? editingLocation.name : getGridCoordinate(modal.x, modal.y, locations, editingLocation?.id)}
                </span>
              </div>
              {(formData.type === 'enemy-farm' || formData.type === 'enemy-flank' || formData.type === 'enemy-tower') && (
                <div className="absolute left-1/2 transform -translate-x-1/2 bg-gray-800 rounded-lg px-2 py-1.5 border-2 border-gray-600 shadow-lg" style={{top: '28px', width: '90px', zIndex: 60}}>
                  <input
                    ref={ownerInputRef}
                    type="text"
                    value={formData.ownerCoordinates}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, ownerCoordinates: e.target.value }))
                      setShowOwnerSuggestions(true)
                    }}
                    onFocus={() => setShowOwnerSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowOwnerSuggestions(false), 200)}
                    placeholder="Main?"
                    className="px-1 py-0.5 bg-gray-700 border border-gray-600 rounded text-sm text-gray-200 placeholder-gray-500 focus:border-blue-500 focus:outline-none w-full text-center"
                  />
                  {showOwnerSuggestions && getFilteredSuggestions(formData.ownerCoordinates).length > 0 && (
                    <div className="absolute w-full mt-1 bg-gray-800 border border-gray-600 rounded-md shadow-lg max-h-32 overflow-auto left-0 right-0" style={{minWidth: '120px', zIndex: 70}}>
                      {getFilteredSuggestions(formData.ownerCoordinates).map((suggestion, index) => (
                        <div
                          key={index}
                          className="px-2 py-1 hover:bg-gray-700 cursor-pointer text-sm text-gray-200 flex items-center justify-between"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, ownerCoordinates: suggestion.coord }))
                            setShowOwnerSuggestions(false)
                          }}
                        >
                          <span>{suggestion.coord}</span>
                          <span className={`text-xs ${getColor(suggestion.type)}`}>
                            {suggestion.type.includes('friendly') ? 'F' : 'E'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
          
          {modalType === 'friendly' && (
            <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 bg-green-600 rounded-lg px-3 py-1.5 border-2 border-green-500 shadow-lg whitespace-nowrap" style={{zIndex: 60}}>
              <span className="text-white font-mono font-bold text-3xl">
                {editingLocation ? editingLocation.name : getGridCoordinate(modal.x, modal.y, locations, editingLocation?.id)}
              </span>
            </div>
          )}
          
          {modalType === 'report' && (
            <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 bg-blue-600 rounded-lg px-3 py-1.5 border-2 border-blue-500 shadow-lg whitespace-nowrap" style={{zIndex: 60}}>
              <span className="text-white font-mono font-bold text-3xl">
                {editingLocation ? editingLocation.name : getGridCoordinate(modal.x, modal.y, locations, editingLocation?.id)}
              </span>
            </div>
          )}
          
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-4xl border-2 border-gray-600 shadow-2xl" style={{minHeight: '500px'}}>
            <form onSubmit={handleSubmit} className="space-y-4">
              {modalType === 'report' ? renderReportModal() : renderBaseModal()}
              
              <div className="flex justify-between items-center pt-4 border-t border-gray-600">
                <div className="flex gap-2">
                  {editingLocation && (
                    <button
                      type="button"
                      onClick={() => onDelete(editingLocation.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    {editingLocation ? 'Update' : 'Save'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BaseModal