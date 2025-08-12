import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { MapPin, Home, Shield, Wheat, Castle, Tent, X, HelpCircle, Calculator } from "lucide-react"
import { RocketCalculatorSection } from './RocketCalculator'

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

const getColor = (type) => {
  if (type.startsWith("friendly")) return "text-green-400"
  if (type.startsWith("enemy")) return "text-red-400"
  return "text-yellow-400"
}

const getIcon = (type) => {
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



// ============= RAIDED OUT PROMPT COMPONENT =============
const RaidedOutPrompt = ({ onConfirm, onCancel }) => (
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
    if (!locations || !Array.isArray(locations)) return []
    const bases = locations.filter(loc => 
      !loc.type.includes('farm') && 
      !loc.type.includes('flank') && 
      !loc.type.includes('boat') && 
      !loc.type.includes('garage') && 
      !loc.type.includes('decaying') &&
      !loc.type.includes('tower') &&
      !loc.type.startsWith('report')
    ).map(loc => loc.name.split('(')[0])
    
    return Array.from(new Set(bases))
  }, [locations])
  
  const getMainBasesWithInfo = useCallback(() => {
    if (!locations || !Array.isArray(locations)) return new Map()
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

const getGridCoordinate = useCallback((x, y, locations, excludeId = null) => {
  const rows = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  const cols = 30
  const row = Math.floor(y / (100 / rows.length))
  const col = Math.floor(x / (100 / cols)) + 1
  const baseName = rows[Math.min(row, rows.length - 1)] + col.toString().padStart(2, "0")
  
  if (!locations || !Array.isArray(locations)) return baseName
  const existing = locations.filter(loc => 
    loc.id !== excludeId && loc.name.startsWith(baseName)
  ).length
  
  return existing > 0 ? `${baseName}(${existing + 1})` : baseName
}, [])

  
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
      isMainBase: modalType === 'enemy' ? true : undefined,
      oldestTC: modalType === 'enemy' && formData.oldestTC > 0 ? formData.oldestTC : undefined,
      ownerCoordinates: (formData.type === 'enemy-farm' || formData.type === 'enemy-flank' || formData.type === 'enemy-tower') ? formData.ownerCoordinates : undefined,
      library: modalType === 'enemy' ? formData.library : undefined,
      youtube: modalType === 'enemy' ? formData.youtube : undefined,
      roofCamper: modalType === 'enemy' ? formData.roofCamper : undefined,
      hostileSamsite: modalType === 'enemy' ? formData.hostileSamsite : undefined,
      raidedOut: modalType === 'enemy' ? formData.raidedOut : undefined,
      primaryRockets: modalType === 'enemy' ? formData.primaryRockets : undefined
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
              <div className={`${getColor(formData.type)} bg-gray-700 rounded p-0.5 border border-gray-600`}>
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
      </div>
      
      {/* Notes Container */}
      <div className="bg-gray-900 border border-gray-600 rounded p-3">
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
        
        
        <label className="block text-sm font-medium mb-0.5 text-gray-200">Base owners</label>
        <div className="border border-gray-600 rounded-md bg-gray-700 flex-1" style={{minHeight: modalType === 'enemy' ? '160px' : '300px'}}>
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
            <label className="block text-sm font-medium mb-0.5 text-gray-300">Upkeep Tracker</label>
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
          <div className="border border-gray-600 rounded-lg bg-gray-700 mb-2 relative">
            <label className="absolute top-0 left-0 text-xs font-medium text-gray-300 pl-0.5">Heat Map</label>
            <div className="p-2 pt-3">
              <div className="flex gap-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="flex-1">
                    <div className="text-[10px] text-gray-400 text-center">{day}</div>
                    <div className="bg-gray-800 rounded" style={{height: '120px', position: 'relative'}}>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {modalType === 'enemy' && (
          <RocketCalculatorSection
            primaryRockets={formData.primaryRockets}
            onPrimaryRocketsChange={(value) => setFormData(prev => ({ ...prev, primaryRockets: value }))}
            showCalculatorModal={showRocketCalculator}
            calculatorPosition={rocketCalculatorPosition}
            onToggleCalculator={handleToggleRocketCalculator}
            onCloseCalculator={() => setShowRocketCalculator(false)}
          />
        )}
        
        <div>
          <label className="block text-sm font-medium mb-0.5 text-gray-200">Notes</label>
          <textarea 
            value={formData.notes} 
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} 
            className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-md resize-none text-gray-200 placeholder-gray-500 focus:border-blue-500 focus:outline-none" 
            placeholder="Add notes..." 
            style={{height: modalType === 'friendly' ? '190px' : modalType === 'enemy' ? '80px' : '340px', resize: 'none'}} 
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
            </>
          )}
          
          {modalType !== 'enemy' && (
            <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 bg-red-600 rounded-lg px-3 py-1.5 border-2 border-red-500 shadow-lg" style={{zIndex: 60}}>
              <span className="text-white font-mono font-bold text-3xl">
                {editingLocation ? editingLocation.name : getGridCoordinate(modal.x, modal.y)}
              </span>
            </div>
          )}

          <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl mx-4 border border-gray-700 flex flex-col relative" style={{height: '95vh', maxHeight: '805px', zIndex: 50}}>
            <div className="p-4 border-b border-gray-700" style={{paddingTop: modalType === 'enemy' ? '32px' : '16px'}}>
              <div className="flex items-center justify-between">
                {modalType === 'enemy' && (
                  <div className="flex items-center gap-3 flex-1">
                    <div className="text-red-500 font-bold text-lg flex-shrink-0">ENEMY</div>
                    <div className="flex gap-2 flex-wrap">
                      <label className="flex items-center gap-1.5 text-xs text-gray-200 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={formData.roofCamper} 
                          onChange={(e) => setFormData(prev => ({ ...prev, roofCamper: e.target.checked }))}
                          className="w-3.5 h-3.5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-1"
                        />
                        <span>Roof Camper</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-gray-200 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={formData.hostileSamsite} 
                          onChange={(e) => setFormData(prev => ({ ...prev, hostileSamsite: e.target.checked }))}
                          className="w-3.5 h-3.5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-1"
                        />
                        <span>Hostile Samsite</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-gray-200 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={formData.raidedOut} 
                          onChange={(e) => {
                            if (!formData.raidedOut && e.target.checked) {
                              setShowRaidedOutPrompt(true)
                            } else {
                              setFormData(prev => ({ ...prev, raidedOut: false }))
                            }
                          }}
                          className="w-3.5 h-3.5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-1"
                        />
                        <span>Raided Out</span>
                      </label>
                    </div>
                    <div className="flex-shrink-0 ml-4" style={{width: "100px"}}>
                      <div className="relative">
                        <select 
                          value={formData.type} 
                          onChange={(e) => {
                            const newType = e.target.value
                            setFormData(prev => ({
                              ...prev,
                              type: newType,
                              ownerCoordinates: (newType !== "enemy-farm" && newType !== "enemy-flank" && newType !== "enemy-tower") ? "" : prev.ownerCoordinates
                            }))
                          }} 
                          className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded-md appearance-none pr-10 text-gray-200 focus:border-blue-500 focus:outline-none text-xs"
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
                          <div className={`${getColor(formData.type)} bg-gray-700 rounded p-0.5 border border-gray-600 scale-75`}>
                            {getIcon(formData.type)}
                          </div>
                          <svg className="h-3 w-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {modalType !== 'enemy' && <div></div>}
                <button 
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onCancel()
                  }} 
                  className="text-gray-400 hover:text-gray-200 cursor-pointer"
                  type="button"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 px-4 pt-4 space-y-2 overflow-y-auto text-gray-200" style={{paddingTop: modalType === 'enemy' ? '24px' : '12px', position: 'relative', zIndex: 1}}>
              {modalType === 'report' && (
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1 text-gray-200">Report Screenshots</label>
                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-3 text-center hover:border-gray-500 transition-colors flex flex-col items-center justify-center" style={{height: '100px'}}>
                    <svg className="h-7 w-7 text-gray-500 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-400 text-xs">Click to upload screenshots</p>
                  </div>
                </div>
              )}
              
              {modalType !== 'report' && (
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1 text-gray-200">Base Screenshots</label>
                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-3 text-center hover:border-gray-500 transition-colors flex flex-col items-center justify-center" style={{height: '160px', width: '65%', marginRight: 'auto'}}>
                    <svg className="h-9 w-9 text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-400 text-sm">Click to upload screenshots or drag and drop</p>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB</p>
                  </div>
                </div>
              )}

              {modalType === 'report' ? renderReportModal() : renderBaseModal()}
            </div>

            {modalType === 'report' ? (
              <div className="px-4 pb-2 relative z-50">
                <div className="flex gap-2 justify-end items-center">
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
                  <div className="flex-1"></div>
                  
                  <div className="flex rounded border border-gray-600 overflow-hidden" style={{height: '30px'}}>
                    {['won', 'neutral', 'lost'].map((outcome) => (
                      <button
                        key={outcome}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, reportOutcome: outcome }))}
                        className={`px-2 flex items-center justify-center transition-all cursor-pointer ${
                          outcome === 'neutral' ? 'border-l border-r border-gray-600' : ''
                        } ${
                          formData.reportOutcome === outcome 
                            ? outcome === 'won' ? 'bg-green-500 text-white' : outcome === 'lost' ? 'bg-red-500 text-white' : 'bg-gray-500 text-white'
                            : outcome === 'won' ? 'bg-gray-700 text-green-400 hover:bg-gray-600' : outcome === 'lost' ? 'bg-gray-700 text-red-400 hover:bg-gray-600' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                        }`}
                      >
                        {outcome === 'won' ? (
                          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 111.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"/>
                          </svg>
                        ) : outcome === 'lost' ? (
                          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M4.28 3.22a.75.75 0 00-1.06 1.06L6.94 8l-3.72 3.72a.75.75 0 101.06 1.06L8 9.06l3.72 3.72a.75.75 0 101.06-1.06L9.06 8l3.72-3.72a.75.75 0 00-1.06-1.06L8 6.94 4.28 3.22z"/>
                          </svg>
                        ) : (
                          <span className="text-sm font-bold">?</span>
                        )}
                      </button>
                    ))}
                  </div>
                  
                  <button 
                    className="bg-gray-700 text-gray-200 py-1.5 px-3 rounded-md hover:bg-gray-600 transition-colors font-medium text-sm cursor-pointer"
                    type="button"
                  >
                    Advanced
                  </button>
                  <button 
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleSave()
                    }} 
                    className="bg-blue-600 text-white py-1.5 px-3 rounded-md hover:bg-blue-700 transition-colors font-medium text-sm cursor-pointer"
                    type="button"
                  >
                    {editingLocation ? 'Update Report' : 'Save Report'}
                  </button>
                </div>

                {editingLocation && (
                  <div className="flex justify-end mt-2">
                    <button 
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        onDelete()
                      }} 
                      className="text-red-600 hover:text-red-700 text-sm cursor-pointer"
                      type="button"
                    >
                      Delete Report
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="px-4 pb-2 relative z-50">
                <div className="flex justify-between">
                  <button 
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setShowReportPanel(!showReportPanel)
                    }} 
                    className={`${showReportPanel ? 'bg-yellow-700' : 'bg-yellow-600'} text-white py-1.5 px-3 rounded-md hover:bg-yellow-700 transition-colors font-medium text-sm cursor-pointer`}
                    type="button"
                  >
                    Report {showReportPanel ? '◄' : ''}
                  </button>
                  <div className="flex gap-2">
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
                    {editingLocation && (
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
            )}
          </div>
        </div>
        
        {/* Report Panel */}
        {showReportPanel && (
          <div 
            className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 absolute"
            style={{
              height: '95vh',
              maxHeight: '805px',
              width: '320px',
              left: '16px',
              transform: 'translateX(-100%)',
              top: 0,
              zIndex: 45
            }}
          >
            <div className="p-4 h-full flex flex-col">
              <h3 className="text-white font-bold mb-4">Base Reports</h3>
              
              {/* List of reports for this base */}
              <div className="flex-1 overflow-y-auto mb-4">
                <div className="space-y-2">
                  <p className="text-gray-400 text-sm italic">No reports for this base yet.</p>
                  {/* Reports will be listed here */}
                </div>
              </div>
              
              {/* Create Report Button */}
              <button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 rounded text-sm font-medium transition-colors">
                Create New Report
              </button>
            </div>
          </div>
        )}
        
        {/* Advanced Panel */}
        {modalType === 'enemy' && showAdvancedPanel && (
          <div 
            className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 absolute"
            style={{
              height: '95vh',
              maxHeight: '805px',
              width: '280px',
              left: '100%',
              top: 0,
              marginLeft: '10px',
              zIndex: 45
            }}
          >
            <div className="p-4" style={{ height: '100%', overflowY: 'auto' }}>
              <div className="bg-gray-900 rounded-lg p-4">
                <h3 className="text-white font-bold mb-4">Advanced Settings</h3>
                
                <div className="flex flex-col items-center">
                  <label className="block text-sm font-medium mb-1 text-gray-200">Oldest TC</label>
                  <input 
                    type="number" 
                    value={formData.oldestTC || ''} 
                    onChange={(e) => setFormData(prev => ({ ...prev, oldestTC: Math.min(360, Math.max(0, Number(e.target.value) || 0)) }))} 
                    className="px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-md text-gray-200 focus:border-blue-500 focus:outline-none" 
                    min="0" 
                    max="360" 
                    style={{width: '60px'}}
                    placeholder="0"
                  />
                  
                  {/* TC Orientation Display */}
                  <div className="mt-4">
                    <div className="relative bg-gray-800 rounded-lg p-4" style={{width: '120px', height: '120px'}}>
                      <svg width="120" height="120" viewBox="0 0 120 120" className="absolute inset-0">
                        {/* Center dot */}
                        <circle cx="60" cy="60" r="2" fill="#4B5563" />
                        
                        {/* Direction line */}
                        {formData.oldestTC > 0 && (
                          <>
                            <line
                              x1="60"
                              y1="60"
                              x2={60 + 40 * Math.cos((formData.oldestTC + 180 - 90) * Math.PI / 180)}
                              y2={60 + 40 * Math.sin((formData.oldestTC + 180 - 90) * Math.PI / 180)}
                              stroke="#3B82F6"
                              strokeWidth="2"
                            />
                            
                            {/* Triangle at end of line */}
                            <g transform={`translate(${60 + 40 * Math.cos((formData.oldestTC + 180 - 90) * Math.PI / 180)}, ${60 + 40 * Math.sin((formData.oldestTC + 180 - 90) * Math.PI / 180)}) rotate(${formData.oldestTC + 180})`}>
                              <path
                                d="M -4 -4 L 4 -4 L 0 4 Z"
                                fill="#3B82F6"
                              />
                            </g>
                          </>
                        )}
                      </svg>
                      
                      {/* Base icon in center */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-gray-700 rounded-full p-0.5 shadow-md border border-gray-600">
                          <div className={getColor(formData.type)}>
                            {getIcon(formData.type)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {formData.oldestTC > 0 && (
                    <div className="text-xs text-gray-400 text-center mt-2">
                      TC facing: {formData.oldestTC}° → Line pointing: {(formData.oldestTC + 180) % 360}°
                    </div>
                  )}
                  
                  {/* Library Dropdown */}
                  <div className="w-full mt-6">
                    <label className="block text-sm font-medium mb-1 text-gray-200">Library</label>
                    <select 
                      value={formData.library}
                      onChange={(e) => setFormData(prev => ({ ...prev, library: e.target.value }))}
                      className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-md text-gray-200 focus:border-blue-500 focus:outline-none appearance-none"
                    >
                      <option value="">Select...</option>
                    </select>
                  </div>
                  
                  {/* YouTube Video Input */}
                  <div className="w-full mt-4 mb-4">
                    <label className="block text-sm font-medium mb-1 text-gray-200">YouTube Video</label>
                    <input 
                      type="text" 
                      value={formData.youtube}
                      onChange={(e) => setFormData(prev => ({ ...prev, youtube: e.target.value }))}
                      placeholder="Enter YouTube URL..."
                      className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-md text-gray-200 placeholder-gray-500 focus:border-blue-500 focus:outline-none" 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Report Panel - Debug Version */}
        {showReportPanel && (
          <div 
            className="bg-red-800 rounded-lg shadow-xl border-4 border-yellow-500 absolute"
            style={{
              height: '95vh',
              maxHeight: '805px',
              width: '320px',
              left: '16px',
              transform: 'translateX(-100%)',
              top: 0,
              zIndex: 9999
            }}
          >
            <div className="p-4 h-full flex flex-col">
              <h3 className="text-white font-bold mb-4 text-xl">REPORT PANEL IS VISIBLE</h3>
              <p className="text-white mb-2">Modal Type: {modalType}</p>
              <p className="text-white mb-4">If you see this, the panel is working!</p>
              
              {/* Enemy and Friendly Player Containers Side by Side */}
              <div className="flex gap-3 flex-1 mb-4">
                {/* Enemy Players - Left Side */}
                <div className="w-1/2 bg-gray-900 border-2 border-red-500 rounded p-3 flex flex-col">
                  <h4 className="text-red-400 font-semibold text-sm mb-2">Enemy Players</h4>
                  <div className="flex-1 overflow-y-auto">
                    <p className="text-xs text-gray-500">No enemies reported</p>
                  </div>
                </div>
                
                {/* Friendly Players - Right Side */}
                <div className="w-1/2 bg-gray-900 border-2 border-green-500 rounded p-3 flex flex-col">
                  <h4 className="text-green-400 font-semibold text-sm mb-2">Friendly Players</h4>
                  <div className="flex-1 overflow-y-auto">
                    <p className="text-xs text-gray-500">No friendlies reported</p>
                  </div>
                </div>
              </div>
              
              {/* Notes Container - Bottom */}
              <div className="bg-gray-900 border-2 border-gray-600 rounded p-3 h-32">
                <h4 className="text-gray-300 font-semibold text-sm mb-2">Notes</h4>
                <textarea 
                  className="w-full h-20 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs text-gray-200 resize-none focus:outline-none focus:border-blue-500"
                  placeholder="Enter notes..."
                />
              </div>
              
              {/* Create Report Button */}
              <button className="mt-3 w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 rounded text-sm font-medium transition-colors">
                Create New Report
              </button>
            </div>
          </div>
        )}
        
        {showRaidedOutPrompt && (
          <RaidedOutPrompt 
            onConfirm={() => {
              setShowRaidedOutPrompt(false)
              setFormData(prev => ({ ...prev, raidedOut: true }))
            }}
            onCancel={() => {
              setShowRaidedOutPrompt(false)
              setFormData(prev => ({ ...prev, raidedOut: true }))
            }}
          />
        )}
      </div>
    </div>
  )
}

export default BaseModal
