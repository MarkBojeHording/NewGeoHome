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

// ============= ROCKET CALCULATOR SUB-COMPONENTS =============
const RocketCalculatorModal = ({ position, onClose, onCalculate }) => {
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

// ============= ROCKET CALCULATOR SECTION COMPONENT =============
const RocketCalculatorSection = ({ 
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

        <div className="mt-1 px-1 pb-0">
          <div className="flex items-center gap-1">
            <label className="text-[10px] font-medium text-gray-300 mr-1">Online Raid</label>
            <div className="flex gap-1 text-center">
              <div className="flex flex-col items-center">
                <div className="text-[9px] font-medium text-gray-400">Rocket</div>
                <div className="w-full px-0.5 py-0 bg-gray-600 rounded text-xs font-bold text-center text-gray-200" style={{width: '32px', fontSize: '10px'}}>
                  {Math.min(primaryRockets, 4) + Math.floor(Math.max(0, primaryRockets - 4) * (onlineRaidModifier / 100))}
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
                  <div className="text-[9px] mt-0">{SLIDER_DESCRIPTIONS[onlineRaidModifier] || ""}</div>
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
const getColor = (type) => {
  if (type.startsWith('report')) return 'text-purple-600'
  return type.startsWith('friendly') ? 'text-green-600' : 'text-red-600'
}

const getBorderColor = (type) => {
  if (type.startsWith('report')) return 'border-purple-500'
  return type.startsWith('friendly') ? 'border-green-500' : 'border-red-500'
}

const getGridCoordinate = (x, y, existingLocations = [], excludeId = null) => {
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

const formatTime = (seconds) => {
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

const useMapInteraction = () => {
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const isDraggingRef = useRef(false)
  const lastPosition = useRef({ x: 0, y: 0 })

  const handleWheel = useCallback((e) => {
    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1
    const newZoom = Math.max(0.3, Math.min(3, zoom * zoomFactor))
    
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const offsetX = (mouseX - centerX) / zoom
    const offsetY = (mouseY - centerY) / zoom
    
    const newPan = {
      x: pan.x + offsetX * (zoom - newZoom),
      y: pan.y + offsetY * (zoom - newZoom)
    }
    
    setZoom(newZoom)
    setPan(newPan)
  }, [zoom, pan])

  const handleMouseDown = useCallback((e) => {
    isDraggingRef.current = true
    setIsDragging(true)
    lastPosition.current = { x: e.clientX, y: e.clientY }
  }, [])

  const handleMouseMove = useCallback((e) => {
    if (!isDraggingRef.current) return
    
    const deltaX = e.clientX - lastPosition.current.x
    const deltaY = e.clientY - lastPosition.current.y
    
    setPan(prev => ({
      x: prev.x + deltaX / zoom,
      y: prev.y + deltaY / zoom
    }))
    
    lastPosition.current = { x: e.clientX, y: e.clientY }
  }, [zoom])

  useEffect(() => {
    const handleGlobalMouseMove = (e) => handleMouseMove(e)
    const handleGlobalMouseUp = () => {
      isDraggingRef.current = false
      setIsDragging(false)
    }

    document.addEventListener('mousemove', handleGlobalMouseMove)
    document.addEventListener('mouseup', handleGlobalMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [handleMouseMove])

  return {
    zoom, pan, isDragging,
    isDraggingRef,
    handleWheel,
    handleMouseDown,
    setIsDragging
  }
}

// ============= SUB-COMPONENTS =============
const getIcon = (type) => {
  if (type === 'friendly-boat') {
    return (
      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M4 17l5-1-1-4 6-6 3 3-6 6-4-1z" />
        <path d="M3 20l18-6-1-2-3 1-2-2-1 3-3-1-1 2-2-2z" opacity="0.6"/>
      </svg>
    )
  }
  if (type === 'friendly-garage') {
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

const LocationMarker = ({ location, isSelected, onClick, timers, onRemoveTimer, getOwnedBases }) => {
  const ownedBases = getOwnedBases(location.name)
  
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
        {!location.type.startsWith('report') && (
          <TimerDisplay 
            timers={timers} 
            onRemoveTimer={onRemoveTimer}
          />
        )}
        
        <div className={`bg-gray-700 rounded-full p-0.5 shadow-md border border-gray-600 flex items-center justify-center`}>
          <div className={`${getColor(location.type)} flex items-center justify-center`}>
            {getIcon(location.type)}
          </div>
        </div>
        
        {isSelected && (
          <div className="absolute pointer-events-none" style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '26px',
            height: '26px',
            zIndex: 5
          }}>
            <div className="selection-ring" style={{ width: '100%', height: '100%' }}>
              <svg width="26" height="26" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
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
        
        {ownedBases.length > 0 && (
          <div className="absolute -bottom-1 -left-1" style={{ zIndex: 10 }}>
            <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-[8px] text-white font-bold">{ownedBases.length}</span>
            </div>
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
          <div className={`absolute ${location.type.startsWith('report') && location.outcome && location.outcome !== 'neutral' ? '-right-2.5' : '-right-1'} ${ownedBases.length > 0 ? '-bottom-2.5' : '-bottom-1'}`} style={{ zIndex: 10 }}>
            <div className="w-3 h-3 bg-yellow-500 rounded-full flex items-center justify-center" title="Hostile Samsite">
              <span className="text-[8px] font-bold text-black">!</span>
            </div>
          </div>
        )}
        
        {location.raidedOut && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" style={{ zIndex: 10 }}>
            <div className="w-4 h-4 bg-red-600 bg-opacity-80 rounded-full flex items-center justify-center" title="Raided Out">
              <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
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

const ActionMenu = ({ location, style, onClose, onAction }) => {
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
            { label: 'Ore needs pick up', actions: ['Simple', 'Detailed'] },
            { label: 'Loot needs pick up', actions: ['Simple', 'Detailed'] },
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
                className="w-20 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                placeholder="0"
                min="0"
                max={config.max}
              />
              <span className="text-xs text-gray-400">/ {config.max}</span>
              <button
                onClick={() => handleStartTimer(type)}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
              >
                Start
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 text-xs text-gray-400">
        Leave empty or 0 for full decay timer. Values represent current health.
      </div>
    </div>
  )
}

const BaseModal = ({ modal, modalType, editingLocation, locations, onSave, onCancel, onDelete }) => {
  const [formData, setFormData] = useState(() => {
    if (editingLocation) {
      return {
        type: editingLocation.type,
        note: editingLocation.note || '',
        roofCamper: editingLocation.roofCamper || false,
        hostileSamsite: editingLocation.hostileSamsite || false,
        raidedOut: editingLocation.raidedOut || false,
        oldestTC: editingLocation.oldestTC || 0,
        outcome: editingLocation.outcome || 'neutral'
      }
    }
    
    const coords = getGridCoordinate(modal.x, modal.y, locations)
    return {
      type: modalType === 'report' ? 'report-pvp' : modalType === 'enemy' ? 'enemy-small' : 'friendly-main',
      note: coords,
      roofCamper: false,
      hostileSamsite: false,
      raidedOut: false,
      oldestTC: 0,
      outcome: 'neutral'
    }
  })

  const getTypeOptions = () => {
    if (modalType === 'report') {
      return [
        { value: 'report-pvp', label: 'PVP General' },
        { value: 'report-spotted', label: 'Spotted Enemy' },
        { value: 'report-bradley', label: 'Countered/Took Bradley/Heli' },
        { value: 'report-oil', label: 'Countered/Took Oil/Cargo' },
        { value: 'report-monument', label: 'Big Score/Fight at Monument' },
        { value: 'report-farming', label: 'Killed While Farming' },
        { value: 'report-loaded', label: 'Killed Loaded Enemy' },
        { value: 'report-raid', label: 'Countered Raid' }
      ]
    } else if (modalType === 'enemy') {
      return [
        { value: 'enemy-small', label: 'Main Small' },
        { value: 'enemy-medium', label: 'Main Medium' },
        { value: 'enemy-large', label: 'Main Large' },
        { value: 'enemy-flank', label: 'Flank Base' },
        { value: 'enemy-tower', label: 'Tower' },
        { value: 'enemy-farm', label: 'Farm' },
        { value: 'enemy-decaying', label: 'Decaying Base' }
      ]
    } else {
      return [
        { value: 'friendly-main', label: 'Friendly Main Base' },
        { value: 'friendly-flank', label: 'Friendly Flank Base' },
        { value: 'friendly-farm', label: 'Friendly Farm' },
        { value: 'friendly-boat', label: 'Boat Base' },
        { value: 'friendly-garage', label: 'Garage' }
      ]
    }
  }

  const handleSave = () => {
    const baseData = {
      ...formData,
      x: modal.x,
      y: modal.y,
      name: getGridCoordinate(modal.x, modal.y, locations, editingLocation?.id)
    }
    onSave(baseData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-2xl border border-gray-700 p-6 w-96">
        <h3 className="text-white font-bold mb-4">
          {editingLocation ? 'Edit Base' : `Add ${modalType.charAt(0).toUpperCase() + modalType.slice(1)}`}
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-2">Type</label>
            <select 
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            >
              {getTypeOptions().map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm text-gray-300 mb-2">Note</label>
            <input
              type="text"
              value={formData.note}
              onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              placeholder="Add a note..."
            />
          </div>
          
          {formData.type.startsWith('report') && (
            <div>
              <label className="block text-sm text-gray-300 mb-2">Outcome</label>
              <select 
                value={formData.outcome}
                onChange={(e) => setFormData(prev => ({ ...prev, outcome: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              >
                <option value="neutral">Neutral</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
              </select>
            </div>
          )}
          
          {!formData.type.startsWith('report') && (
            <>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="roofCamper"
                  checked={formData.roofCamper}
                  onChange={(e) => setFormData(prev => ({ ...prev, roofCamper: e.target.checked }))}
                  className="rounded"
                />
                <label htmlFor="roofCamper" className="text-sm text-gray-300">Roof Camper</label>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="hostileSamsite"
                  checked={formData.hostileSamsite}
                  onChange={(e) => setFormData(prev => ({ ...prev, hostileSamsite: e.target.checked }))}
                  className="rounded"
                />
                <label htmlFor="hostileSamsite" className="text-sm text-gray-300">Hostile Samsite</label>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="raidedOut"
                  checked={formData.raidedOut}
                  onChange={(e) => setFormData(prev => ({ ...prev, raidedOut: e.target.checked }))}
                  className="rounded"
                />
                <label htmlFor="raidedOut" className="text-sm text-gray-300">Raided Out</label>
              </div>
              
              <div>
                <label className="block text-sm text-gray-300 mb-2">Oldest TC Direction (degrees)</label>
                <input
                  type="number"
                  value={formData.oldestTC}
                  onChange={(e) => setFormData(prev => ({ ...prev, oldestTC: Math.max(0, Math.min(360, Number(e.target.value) || 0)) }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  placeholder="0-360"
                  min="0"
                  max="360"
                />
              </div>
            </>
          )}
        </div>
        
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
          >
            {editingLocation ? 'Update' : 'Save'}
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
          >
            Cancel
          </button>
          {editingLocation && (
            <button
              onClick={() => onDelete(editingLocation.id)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const SelectedLocationPanel = ({ location, onEdit, getOwnedBases, onSelectLocation, locationTimers, onAddTimer }) => {
  const [showActionMenu, setShowActionMenu] = useState(false)
  const [actionMenuPosition, setActionMenuPosition] = useState({ x: 0, y: 0 })
  const [showDecayingMenu, setShowDecayingMenu] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [scheduleData, setScheduleData] = useState({ date: '', time: '', description: '' })
  const [currentNote, setCurrentNote] = useState('')
  const [isEditingNote, setIsEditingNote] = useState(false)
  
  const ownedBases = getOwnedBases(location.name)
  
  useEffect(() => {
    setCurrentNote(location.note || '')
    setIsEditingNote(false)
  }, [location])

  const handleRightClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setActionMenuPosition({ x: e.clientX, y: e.clientY })
    setShowActionMenu(true)
  }

  const handleAction = (action) => {
    setShowActionMenu(false)
    
    if (action === 'Decaying' || action === 'Intentional Decay') {
      setShowDecayingMenu(true)
      return
    }
    
    if (action === 'Schedule Raid') {
      setShowScheduleModal(true)
      return
    }
    
    console.log(`Action: ${action} for location: ${location.name}`)
  }

  const handleStartTimer = (type, seconds) => {
    onAddTimer(location.id, type, seconds)
    setShowDecayingMenu(false)
  }

  const handleScheduleRaid = () => {
    console.log('Scheduled raid:', scheduleData)
    setShowScheduleModal(false)
    setScheduleData({ date: '', time: '', description: '' })
  }

  const handleSaveNote = () => {
    onEdit({ ...location, note: currentNote })
    setIsEditingNote(false)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSaveNote()
    } else if (e.key === 'Escape') {
      setCurrentNote(location.note || '')
      setIsEditingNote(false)
    }
  }

  return (
    <>
      <div className="absolute top-4 right-4 bg-gray-800 rounded-lg shadow-2xl border border-gray-700 p-4 w-80" style={{ zIndex: 15 }}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-bold">{location.name}</h3>
            <button
              onClick={() => onEdit(location)}
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              Edit
            </button>
          </div>
          
          <div className="text-sm text-gray-300">
            <div className="flex items-center gap-2">
              <div className={`${getColor(location.type)} flex items-center`}>
                {getIcon(location.type)}
              </div>
              <span>{LABELS[location.type] || location.type}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Note:</span>
              {!isEditingNote && (
                <button
                  onClick={() => setIsEditingNote(true)}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  Edit
                </button>
              )}
            </div>
            {isEditingNote ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentNote}
                  onChange={(e) => setCurrentNote(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                  placeholder="Add a note..."
                  autoFocus
                />
                <button
                  onClick={handleSaveNote}
                  className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded"
                >
                  Save
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-200">{location.note || 'No note'}</p>
            )}
          </div>
          
          {location.type.startsWith('report') && location.outcome && location.outcome !== 'neutral' && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Outcome:</span>
              <span className={`text-sm font-medium ${location.outcome === 'won' ? 'text-green-400' : 'text-red-400'}`}>
                {location.outcome.charAt(0).toUpperCase() + location.outcome.slice(1)}
              </span>
            </div>
          )}
          
          {!location.type.startsWith('report') && (location.roofCamper || location.hostileSamsite || location.raidedOut) && (
            <div className="flex flex-wrap gap-2">
              {location.roofCamper && (
                <span className="px-2 py-1 bg-orange-600 text-white text-xs rounded">Roof Camper</span>
              )}
              {location.hostileSamsite && (
                <span className="px-2 py-1 bg-yellow-600 text-white text-xs rounded">Hostile Samsite</span>
              )}
              {location.raidedOut && (
                <span className="px-2 py-1 bg-red-600 text-white text-xs rounded">Raided Out</span>
              )}
            </div>
          )}
          
          {location.oldestTC && location.oldestTC > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Oldest TC Direction:</span>
              <span className="text-sm text-gray-200">{location.oldestTC}°</span>
            </div>
          )}
          
          {ownedBases.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm text-gray-400">Owned Bases:</div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {ownedBases.map((base) => (
                  <button
                    key={base.id}
                    onClick={() => onSelectLocation(base)}
                    className="w-full text-left px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm text-gray-200 transition-colors"
                  >
                    {base.name} - {LABELS[base.type]}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {!location.type.startsWith('report') && locationTimers && locationTimers.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm text-gray-400">Active Timers:</div>
              <div className="space-y-1">
                {locationTimers.map((timer) => (
                  <div key={timer.id} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                    <span className="text-sm text-gray-200 capitalize">{timer.type}</span>
                    <span className="text-sm font-mono text-gray-300">{formatTime(timer.remaining)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <button
            onContextMenu={handleRightClick}
            onClick={handleRightClick}
            className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
          >
            Actions
          </button>
        </div>
      </div>

      {showActionMenu && (
        <>
          <div className="fixed inset-0" onClick={() => setShowActionMenu(false)} style={{ zIndex: 19 }} />
          <ActionMenu
            location={location}
            style={{ left: actionMenuPosition.x, top: actionMenuPosition.y, zIndex: 20 }}
            onClose={() => setShowActionMenu(false)}
            onAction={handleAction}
          />
        </>
      )}

      {showDecayingMenu && (
        <>
          <div className="fixed inset-0" onClick={() => setShowDecayingMenu(false)} style={{ zIndex: 19 }} />
          <DecayingMenu
            style={{ left: actionMenuPosition.x, top: actionMenuPosition.y, zIndex: 20 }}
            onClose={() => setShowDecayingMenu(false)}
            onStartTimer={handleStartTimer}
            title={location.type.startsWith('friendly') ? "Set Upkeep Timer" : "Decay Calculator"}
          />
        </>
      )}

      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" style={{ zIndex: 50 }}>
          <div className="bg-gray-800 rounded-lg shadow-2xl border border-gray-700 p-6 w-96">
            <h3 className="text-white font-bold mb-4">Schedule Raid</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Date</label>
                <input
                  type="date"
                  value={scheduleData.date}
                  onChange={(e) => setScheduleData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-300 mb-2">Time</label>
                <input
                  type="time"
                  value={scheduleData.time}
                  onChange={(e) => setScheduleData(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-300 mb-2">Description</label>
                <textarea
                  value={scheduleData.description}
                  onChange={(e) => setScheduleData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  rows="3"
                  placeholder="Raid details..."
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleScheduleRaid}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
              >
                Schedule
              </button>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ============= MAIN COMPONENT =============
export default function TacticalMap() {
  const [locations, setLocations] = useState([])
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0 })
  const [newBaseModal, setNewBaseModal] = useState({ visible: false, x: 0, y: 0 })
  const [modalType, setModalType] = useState('enemy')
  const [editingLocation, setEditingLocation] = useState(null)
  const [primaryRockets, setPrimaryRockets] = useState(0)
  const [showCalculatorModal, setShowCalculatorModal] = useState(false)
  const [calculatorPosition, setCalculatorPosition] = useState({ x: 0, y: 0 })
  
  const mapRef = useRef(null)
  const {
    zoom, pan, isDragging, isDraggingRef,
    handleWheel, handleMouseDown, setIsDragging
  } = useMapInteraction()
  
  const [locationTimers, setLocationTimers] = useLocationTimers()

  const getOwnedBases = useCallback((locationName) => {
    const coordinate = locationName.split('(')[0]
    return locations.filter(loc => 
      loc.name !== locationName && 
      loc.name.startsWith(coordinate) && 
      loc.type.startsWith('friendly')
    )
  }, [locations])

  const handleContextMenu = useCallback((e) => {
    e.preventDefault()
    if (isDraggingRef.current) return
    
    const rect = mapRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width * 100 - pan.x / rect.width * 100) / zoom
    const y = ((e.clientY - rect.top) / rect.height * 100 - pan.y / rect.height * 100) / zoom
    
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      mapX: x,
      mapY: y
    })
  }, [pan, zoom])

  const handleClick = useCallback((e) => {
    if (isDraggingRef.current) return
    setContextMenu({ visible: false, x: 0, y: 0 })
    setSelectedLocation(null)
  }, [])

  const handleAddBase = useCallback((type) => {
    setModalType(type)
    setNewBaseModal({
      visible: true,
      x: contextMenu.mapX,
      y: contextMenu.mapY
    })
    setContextMenu({ visible: false, x: 0, y: 0 })
  }, [contextMenu])

  const handleSaveBase = useCallback((baseData) => {
    if (editingLocation) {
      setLocations(prev => prev.map(loc => 
        loc.id === editingLocation.id ? { ...loc, ...baseData } : loc
      ))
      setEditingLocation(null)
    } else {
      const newLocation = {
        id: Date.now(),
        ...baseData
      }
      setLocations(prev => [...prev, newLocation])
    }
    setNewBaseModal({ visible: false, x: 0, y: 0 })
  }, [editingLocation])

  const handleEditBase = useCallback((location) => {
    setEditingLocation(location)
    setNewBaseModal({
      visible: true,
      x: location.x,
      y: location.y
    })
  }, [])

  const handleDeleteLocation = useCallback((locationId) => {
    setLocations(prev => prev.filter(loc => loc.id !== locationId))
    setSelectedLocation(null)
    setNewBaseModal({ visible: false, x: 0, y: 0 })
    setEditingLocation(null)
  }, [])

  const handleCancel = useCallback(() => {
    setNewBaseModal({ visible: false, x: 0, y: 0 })
    setEditingLocation(null)
  }, [])

  const handleAddTimer = useCallback((locationId, type, seconds) => {
    const newTimer = {
      id: Date.now(),
      type,
      remaining: seconds
    }
    setLocationTimers(prev => ({
      ...prev,
      [locationId]: [...(prev[locationId] || []), newTimer]
    }))
  }, [setLocationTimers])

  const handleRemoveTimer = useCallback((locationId, timerId) => {
    setLocationTimers(prev => ({
      ...prev,
      [locationId]: prev[locationId]?.filter(timer => timer.id !== timerId) || []
    }))
  }, [setLocationTimers])

  const handleToggleCalculator = useCallback((e) => {
    if (showCalculatorModal) {
      setShowCalculatorModal(false)
    } else {
      const rect = e.target.getBoundingClientRect()
      setCalculatorPosition({
        x: rect.right + 10,
        y: rect.top
      })
      setShowCalculatorModal(true)
    }
  }, [showCalculatorModal])

  const handleCloseCalculator = useCallback(() => {
    setShowCalculatorModal(false)
  }, [])

  useEffect(() => {
    const handleGlobalClick = (e) => {
      if (contextMenu.visible && !e.target.closest('.context-menu')) {
        setContextMenu({ visible: false, x: 0, y: 0 })
      }
      if (showCalculatorModal && !e.target.closest('.rocket-calculator-modal') && !e.target.closest('button')) {
        setShowCalculatorModal(false)
      }
    }

    document.addEventListener('click', handleGlobalClick)
    return () => document.removeEventListener('click', handleGlobalClick)
  }, [contextMenu.visible, showCalculatorModal])

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-700 to-gray-900 p-4">
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
      
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <div className="bg-gradient-to-b from-gray-600 to-gray-800 rounded-lg shadow-2xl border border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 p-1">
              <div className="bg-gradient-to-b from-gray-500 to-gray-700 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {['Logs', 'Progression', 'Players', 'Teams', 'Bot Control', 'Turret Control'].map((btn) => (
                      <button key={btn} className="px-4 py-2 bg-gradient-to-b from-gray-400 to-gray-600 hover:from-gray-300 hover:to-gray-500 text-white font-semibold rounded shadow-lg border border-gray-500 transition-all duration-200 hover:shadow-xl">
                        {btn}
                      </button>
                    ))}
                  </div>
                  <button className="px-4 py-2 bg-gradient-to-b from-gray-400 to-gray-600 hover:from-gray-300 hover:to-gray-500 text-white font-semibold rounded shadow-lg border border-gray-500 transition-all duration-200 hover:shadow-xl">
                    Menu
                  </button>
                </div>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-transparent via-gray-400 to-transparent opacity-50"></div>
          </div>
        </div>

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
                <svg className="w-full h-full" viewBox="0 0 800 600">
                  <defs>
                    <pattern id="waves" x="0" y="0" width="40" height="20" patternUnits="userSpaceOnUse">
                      <path d="M0,10 Q10,0 20,10 T40,10" stroke="#0f766e" strokeWidth="2" fill="none" opacity="0.4"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#waves)" />
                </svg>
              </div>

              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 600">
                <path d="M150,200 Q200,100 350,80 Q500,60 600,150 Q700,250 650,400 Q600,500 450,520 Q300,540 200,450 Q100,350 150,200 Z"
                      fill="#fbbf24" stroke="#d97706" strokeWidth="3"/>
                <path d="M160,210 Q210,110 350,90 Q490,70 590,160 Q680,260 640,390 Q590,490 450,510 Q310,530 210,440 Q110,360 160,210 Z"
                      fill="#22c55e" opacity="0.8"/>
              </svg>

              <div className="absolute inset-0 pointer-events-none">
                <svg className="w-full h-full" viewBox="0 0 800 600">
                  {Array.from({ length: 33 }, (_, i) => (
                    <line key={`v-${i}`} x1={i * 25} y1="0" x2={i * 25} y2="600" stroke="rgba(0, 0, 0, 0.4)" strokeWidth="0.75"/>
                  ))}
                  {Array.from({ length: 25 }, (_, i) => (
                    <line key={`h-${i}`} x1="0" y1={i * 25} x2="800" y2={i * 25} stroke="rgba(0, 0, 0, 0.4)" strokeWidth="0.75"/>
                  ))}
                  {Array.from({ length: 32 }, (_, col) => 
                    Array.from({ length: 24 }, (_, row) => {
                      const letter = col < 26 ? String.fromCharCode(65 + col) : `A${String.fromCharCode(65 + col - 26)}`
                      return (
                        <text key={`label-${col}-${row}`} x={col * 25 + 1} y={row * 25 + 7} fill="black" fontSize="7" fontWeight="600" textAnchor="start" stroke="rgba(255,255,255,0.4)" strokeWidth="0.3">
                          {letter}{row + 1}
                        </text>
                      )
                    })
                  )}
                </svg>
              </div>

              {locations.map((location) => (
                <LocationMarker
                  key={location.id}
                  location={location}
                  isSelected={selectedLocation?.id === location.id}
                  onClick={setSelectedLocation}
                  timers={locationTimers[location.id]}
                  onRemoveTimer={(timerId) => handleRemoveTimer(location.id, timerId)}
                  getOwnedBases={getOwnedBases}
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
          />
        )}
      </div>
    </div>
  )
}