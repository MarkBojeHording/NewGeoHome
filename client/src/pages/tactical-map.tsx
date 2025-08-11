import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { MapPin, Home, Shield, Wheat, Castle, Tent, X, HelpCircle, Calculator } from 'lucide-react'

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
const calculateRocketAmmo = (rocketCount: number, isPrimary: boolean, modifier = 150) => {
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

// ============= ROCKET CALCULATOR SUB-COMPONENTS =============
const RocketCalculatorModal = ({ position, onClose, onCalculate }: {
  position: { x: number, y: number }
  onClose: () => void
  onCalculate: (total: number) => void
}) => {
  const [values, setValues] = useState({
    sheetMetal: 0, wood: 0, garage: 0, stone: 0, metal: 0, hqm: 0
  })
  
  const handleChange = (type: string, value: string) => {
    const numValue = Math.min(99, Math.max(0, Number(value) || 0))
    const newValues = { ...values, [type]: numValue }
    setValues(newValues)
    
    let total = 0
    Object.keys(newValues).forEach(key => {
      total += newValues[key as keyof typeof newValues] * RAID_MULTIPLIERS[key as keyof typeof RAID_MULTIPLIERS]
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
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200 transition-colors" data-testid="button-close-calculator">
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
                  value={values[item.key as keyof typeof values]}
                  onChange={(e) => handleChange(item.key, e.target.value)}
                  className="w-full pl-1 pr-6 py-1 bg-gray-700 border border-gray-600 rounded text-center text-white font-bold text-sm focus:border-blue-500 focus:outline-none"
                  min="0"
                  max="99"
                  placeholder="0"
                  data-testid={`input-${item.key}`}
                />
                <div className="absolute right-0.5 top-0.5 bottom-0.5 flex flex-col" style={{width: '14px'}}>
                  <button
                    type="button"
                    onClick={() => handleChange(item.key, String(Math.min(99, (values[item.key as keyof typeof values] || 0) + 1)))}
                    className="flex items-center justify-center h-1/2 bg-gray-600 hover:bg-gray-500 rounded-t text-gray-300 transition-colors border-b border-gray-700"
                    style={{fontSize: '8px', lineHeight: '0'}}
                    data-testid={`button-increment-${item.key}`}
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChange(item.key, String(Math.max(0, (values[item.key as keyof typeof values] || 0) - 1)))}
                    className="flex items-center justify-center h-1/2 bg-gray-600 hover:bg-gray-500 rounded-b text-gray-300 transition-colors"
                    style={{fontSize: '8px', lineHeight: '0'}}
                    data-testid={`button-decrement-${item.key}`}
                  >
                    ▼
                  </button>
                </div>
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5">×{RAID_MULTIPLIERS[item.key as keyof typeof RAID_MULTIPLIERS]}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============= ROCKET CALCULATOR SECTION COMPONENT =============
const RocketCalculatorSection = ({ 
  primaryRockets, 
  onPrimaryRocketsChange,
  showCalculatorModal,
  calculatorPosition,
  onToggleCalculator,
  onCloseCalculator
}: {
  primaryRockets: number
  onPrimaryRocketsChange: (rockets: number) => void
  showCalculatorModal: boolean
  calculatorPosition: { x: number, y: number }
  onToggleCalculator: (e: React.MouseEvent) => void
  onCloseCalculator: () => void
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
          data-testid="button-toggle-calculator"
        >
          <Calculator className={`h-5 w-5 ${showCalculatorModal ? 'text-white' : 'text-blue-500'}`} />
        </button>
        <div className="px-1">
          <div className="flex items-center gap-1">
            <label className="text-[10px] font-medium text-gray-300 mr-1">Primary Raid</label>
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
                  data-testid="input-primary-rockets"
                />
              </div>
              {['HV', 'Incin', 'Explo'].map((type, i) => (
                <div key={type} className="flex flex-col items-center">
                  <div className="text-[9px] font-medium text-gray-400">{type}</div>
                  <div className="w-full px-0.5 py-0 bg-gray-600 rounded text-xs font-bold text-center text-gray-200" style={{width: '32px', fontSize: '10px'}} data-testid={`text-primary-${type.toLowerCase()}`}>
                    {[ammo.hv, ammo.incin, ammo.explo][i]}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-1 px-1 pb-0">
          <div className="flex items-center gap-1">
            <label className="text-[10px] font-medium text-gray-300 mr-1">Online Raid</label>
            <div className="flex gap-1 text-center">
              <div className="flex flex-col items-center">
                <div className="text-[9px] font-medium text-gray-400">Rocket</div>
                <div className="w-full px-0.5 py-0 bg-gray-600 rounded text-xs font-bold text-center text-gray-200" style={{width: '32px', fontSize: '10px'}} data-testid="text-online-rockets">
                  {Math.min(primaryRockets, 4) + Math.floor(Math.max(0, primaryRockets - 4) * (onlineRaidModifier / 100))}
                </div>
              </div>
              {['HV', 'Incin', 'Explo'].map((type, i) => (
                <div key={type} className="flex flex-col items-center">
                  <div className="text-[9px] font-medium text-gray-400">{type}</div>
                  <div className="w-full px-0.5 py-0 bg-gray-600 rounded text-xs font-bold text-center text-gray-200" style={{width: '32px', fontSize: '10px'}} data-testid={`text-online-${type.toLowerCase()}`}>
                    {[onlineAmmo.hv, onlineAmmo.incin, onlineAmmo.explo][i]}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-1 px-1 pb-1 relative">
          <div className="relative h-3 mx-0.5">
            <div className="absolute inset-x-0 top-1 h-0.5 bg-gray-600 rounded-full">
              <div className="absolute left-0 top-0 h-full bg-blue-400 rounded-full transition-all duration-150"
                   style={{width: `${[75, 100, 150, 200, 250].indexOf(onlineRaidModifier) * 25}%`}} />
            </div>
            {[0, 25, 50, 75, 100].map((position, index) => (
              <div
                key={index}
                className="absolute w-1.5 h-1.5 bg-gray-500 rounded-full"
                style={{
                  left: `${position}%`,
                  top: '3px',
                  transform: 'translateX(-50%)'
                }}
              />
            ))}
            <input
              type="range"
              min="0"
              max="4"
              value={[75, 100, 150, 200, 250].indexOf(onlineRaidModifier)}
              onChange={(e) => {
                const values = [75, 100, 150, 200, 250]
                setOnlineRaidModifier(values[parseInt(e.target.value)])
              }}
              onMouseDown={() => setShowSliderTooltip(true)}
              onMouseUp={() => setShowSliderTooltip(false)}
              onMouseLeave={() => setShowSliderTooltip(false)}
              className="absolute inset-x-0 top-0 w-full h-3 opacity-0 cursor-pointer"
              data-testid="slider-online-modifier"
            />
            <div
              className={`absolute w-2.5 h-2.5 bg-blue-500 rounded-full shadow-md pointer-events-none transition-all duration-150 ${showSliderTooltip ? 'scale-125' : ''}`}
              style={{
                left: `${[75, 100, 150, 200, 250].indexOf(onlineRaidModifier) * 25}%`,
                top: '1px',
                transform: 'translateX(-50%)'
              }}
            />
            {showSliderTooltip && (
              <div className="absolute -top-8 pointer-events-none transition-opacity duration-200 z-20"
                   style={{
                     left: `${Math.max(15, Math.min(85, [75, 100, 150, 200, 250].indexOf(onlineRaidModifier) * 25))}%`,
                     transform: 'translateX(-50%)'
                   }}>
                <div className="bg-gray-900 text-white text-[10px] rounded px-1.5 py-0.5 whitespace-nowrap">
                  <div className="font-bold text-center">{onlineRaidModifier}%</div>
                  <div className="text-[9px] mt-0">{SLIDER_DESCRIPTIONS[onlineRaidModifier as keyof typeof SLIDER_DESCRIPTIONS] || ""}</div>
                </div>
                <div className="absolute left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[3px] border-r-[3px] border-t-[3px] border-transparent border-t-gray-900"></div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {showCalculatorModal && (
        <RocketCalculatorModal 
          position={calculatorPosition}
          onClose={onCloseCalculator}
          onCalculate={onPrimaryRocketsChange}
        />
      )}
    </>
  )
}

// ============= CONSTANTS =============
const GRID_CONFIG = {
  COLS: 32,
  ROWS: 24,
  CELL_WIDTH_PERCENT: 3.125,
  CELL_HEIGHT_PERCENT: 4.167
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

// ============= UTILITY FUNCTIONS =============
const getColor = (type: string) => {
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
  const number = clampedRow + 1
  const baseCoord = `${letter}${number}`
  
  const duplicates = existingLocations.filter(loc => {
    if (excludeId && loc.id === excludeId) return false
    const locBase = loc.name.split('(')[0]
    return locBase === baseCoord
  })
  
  return duplicates.length === 0 ? baseCoord : `${baseCoord}(${duplicates.length + 1})`
}

const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

// ============= CUSTOM HOOKS =============
const useLocationTimers = () => {
  const [locationTimers, setLocationTimers] = useState<Record<string, any[]>>({})

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

  return [locationTimers, setLocationTimers] as const
}

const useMapInteraction = () => {
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const isDraggingRef = useRef(false)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const hasDraggedRef = useRef(false)

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
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

const LocationName = ({ name, className = '' }: { name: string, className?: string }) => {
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

const getIcon = (type: string) => {
  if (type === 'enemy-decaying') return <DecayingIcon />
  if (type === 'enemy-tower') return <TowerIcon />
  const Icon = ICON_MAP[type as keyof typeof ICON_MAP] || MapPin
  return <Icon className="h-3 w-3" />
}

const getLargeIcon = (type: string) => {
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
  const Icon = ICON_MAP[type as keyof typeof ICON_MAP] || MapPin
  return <Icon className="h-8 w-8" />
}

// ============= MAIN APPLICATION =============
export default function TacticalMap() {
  const [locations, setLocations] = useState<any[]>([])
  const [selectedLocation, setSelectedLocation] = useState<any>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null)
  const [actionMenu, setActionMenu] = useState<{ location: any, x: number, y: number } | null>(null)
  const [primaryRockets, setPrimaryRockets] = useState(0)
  const [showCalculatorModal, setShowCalculatorModal] = useState(false)
  const [calculatorPosition, setCalculatorPosition] = useState({ x: 0, y: 0 })
  const [locationTimers] = useLocationTimers()
  const mapInteraction = useMapInteraction()
  const mapRef = useRef<HTMLDivElement>(null)
  const [draggedBaseType, setDraggedBaseType] = useState<string | null>(null)

  const handleMapClick = useCallback((e: React.MouseEvent) => {
    if (mapInteraction.hasDraggedRef.current) {
      mapInteraction.hasDraggedRef.current = false
      return
    }

    setContextMenu(null)
    setActionMenu(null)
    setSelectedLocation(null)
  }, [mapInteraction])

  const handleMapRightClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    if (!mapRef.current) return

    const rect = mapRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    setContextMenu({ x: e.clientX, y: e.clientY })
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!draggedBaseType || !mapRef.current) return

    const rect = mapRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    const newLocation = {
      id: Date.now().toString(),
      type: draggedBaseType,
      x,
      y,
      name: getGridCoordinate(x, y, locations),
      rockets: 0
    }

    setLocations(prev => [...prev, newLocation])
    setDraggedBaseType(null)
  }, [draggedBaseType, locations])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const toggleCalculator = useCallback((e: React.MouseEvent) => {
    if (showCalculatorModal) {
      setShowCalculatorModal(false)
    } else {
      const rect = e.currentTarget.getBoundingClientRect()
      setCalculatorPosition({
        x: rect.right + 10,
        y: rect.top
      })
      setShowCalculatorModal(true)
    }
  }, [showCalculatorModal])

  const baseTypes = [
    { type: 'friendly-main', label: 'Friendly Main Base', color: 'text-green-400', bgColor: 'bg-green-900' },
    { type: 'friendly-flank', label: 'Friendly Flank Base', color: 'text-green-400', bgColor: 'bg-green-900' },
    { type: 'friendly-farm', label: 'Friendly Farm', color: 'text-green-400', bgColor: 'bg-green-900' },
    { type: 'enemy-small', label: 'Enemy Small Base', color: 'text-red-400', bgColor: 'bg-red-900' },
    { type: 'enemy-medium', label: 'Enemy Medium Base', color: 'text-red-400', bgColor: 'bg-red-900' },
    { type: 'enemy-large', label: 'Enemy Large Base', color: 'text-red-400', bgColor: 'bg-red-900' },
    { type: 'enemy-flank', label: 'Enemy Flank Base', color: 'text-red-400', bgColor: 'bg-red-900' },
    { type: 'enemy-farm', label: 'Enemy Farm', color: 'text-red-400', bgColor: 'bg-red-900' }
  ]

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">Rust Tactical Map & Raid Calculator</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Panel - Controls */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-4">Base Types</h2>
              <div className="grid grid-cols-2 gap-2">
                {baseTypes.map(({ type, label, color, bgColor }) => {
                  const IconComponent = ICON_MAP[type as keyof typeof ICON_MAP]
                  return (
                    <div
                      key={type}
                      className={`${bgColor} ${color} p-3 rounded-lg cursor-move hover:opacity-80 transition-opacity`}
                      draggable
                      onDragStart={() => setDraggedBaseType(type)}
                      data-testid={`draggable-${type}`}
                    >
                      <div className="flex flex-col items-center space-y-1">
                        <IconComponent className="h-6 w-6" />
                        <span className="text-xs text-center">{LABELS[type as keyof typeof LABELS] || label}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            
            <RocketCalculatorSection
              primaryRockets={primaryRockets}
              onPrimaryRocketsChange={setPrimaryRockets}
              showCalculatorModal={showCalculatorModal}
              calculatorPosition={calculatorPosition}
              onToggleCalculator={toggleCalculator}
              onCloseCalculator={() => setShowCalculatorModal(false)}
            />
          </div>
          
          {/* Right Panel - Tactical Map */}
          <div className="lg:col-span-3">
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-4">Tactical Map</h2>
              <div
                ref={mapRef}
                className="relative bg-gray-700 rounded-lg overflow-hidden cursor-crosshair"
                style={{ 
                  aspectRatio: `${GRID_CONFIG.COLS}/${GRID_CONFIG.ROWS}`,
                  minHeight: '400px'
                }}
                onClick={handleMapClick}
                onContextMenu={handleMapRightClick}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                data-testid="tactical-map"
              >
                {/* Grid lines */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Vertical lines */}
                  {Array.from({ length: GRID_CONFIG.COLS + 1 }, (_, i) => (
                    <div
                      key={`v${i}`}
                      className="absolute top-0 bottom-0 border-l border-gray-600 opacity-30"
                      style={{ left: `${(i / GRID_CONFIG.COLS) * 100}%` }}
                    />
                  ))}
                  {/* Horizontal lines */}
                  {Array.from({ length: GRID_CONFIG.ROWS + 1 }, (_, i) => (
                    <div
                      key={`h${i}`}
                      className="absolute left-0 right-0 border-t border-gray-600 opacity-30"
                      style={{ top: `${(i / GRID_CONFIG.ROWS) * 100}%` }}
                    />
                  ))}
                </div>
                
                {/* Placed locations */}
                {locations.map(location => {
                  const IconComponent = ICON_MAP[location.type as keyof typeof ICON_MAP] || MapPin
                  const isEnemy = location.type.startsWith('enemy')
                  const color = isEnemy ? 'text-red-400' : 'text-green-400'
                  const bgColor = isEnemy ? 'bg-red-900' : 'bg-green-900'
                  
                  return (
                    <div
                      key={location.id}
                      className={`absolute ${bgColor} ${color} p-2 rounded-lg cursor-pointer hover:opacity-80 transition-opacity z-10 ${selectedLocation?.id === location.id ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: `${location.x}%`,
                        top: `${location.y}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedLocation(location)
                      }}
                      onContextMenu={(e) => {
                        e.stopPropagation()
                        setActionMenu({ location, x: e.clientX, y: e.clientY })
                      }}
                      data-testid={`location-${location.id}`}
                    >
                      <IconComponent className="h-6 w-6" />
                      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs whitespace-nowrap bg-gray-900 px-1 rounded opacity-0 hover:opacity-100 transition-opacity">
                        {location.name}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
        
        {/* Selected Location Info */}
        {selectedLocation && (
          <div className="mt-6 bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2">Selected Location: {selectedLocation.name}</h3>
            <p className="text-gray-300 mb-2">Type: {LABELS[selectedLocation.type as keyof typeof LABELS] || selectedLocation.type}</p>
            <p className="text-gray-300 mb-4">Position: ({selectedLocation.x.toFixed(1)}%, {selectedLocation.y.toFixed(1)}%)</p>
            <button
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded transition-colors"
              onClick={() => {
                setLocations(prev => prev.filter(l => l.id !== selectedLocation.id))
                setSelectedLocation(null)
              }}
              data-testid="button-remove-location"
            >
              Remove Location
            </button>
          </div>
        )}
        
        {/* Context Menu */}
        {contextMenu && (
          <div className="fixed bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-50 py-2" style={{ left: contextMenu.x, top: contextMenu.y }}>
            <button 
              className="block w-full text-left px-4 py-2 hover:bg-gray-700 text-gray-200 text-sm" 
              onClick={() => setContextMenu(null)}
              data-testid="button-context-close"
            >
              Close
            </button>
          </div>
        )}
        
        {/* Action Menu */}
        {actionMenu && (
          <div className="fixed bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-50 py-2" style={{ left: actionMenu.x, top: actionMenu.y }}>
            <button 
              className="block w-full text-left px-4 py-2 hover:bg-gray-700 text-gray-200 text-sm" 
              onClick={() => setActionMenu(null)}
              data-testid="button-action-close"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
