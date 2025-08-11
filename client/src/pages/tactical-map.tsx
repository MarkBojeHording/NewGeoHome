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
  const dragStartRef = useRef({ x: 0, y: 0 })
  const hasDraggedRef = useRef(false)

  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
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

const LocationName = ({ name, className = '' }) => {
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

const getIcon = (type) => {
  if (type === 'enemy-decaying') return <DecayingIcon />
  if (type === 'enemy-tower') return <TowerIcon />
  const Icon = ICON_MAP[type] || MapPin
  return <Icon className="h-3 w-3" />
}

const getLargeIcon = (type) => {
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
                placeholder="0"
                className="w-16 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm text-gray-200 text-center focus:border-blue-500 focus:outline-none"
                min="0"
                max={config.max}
              />
              <span className="text-xs text-gray-400">of {config.max}</span>
            </div>
            <div className="flex-1 text-right">
              <span className="text-sm text-yellow-400 font-medium">
                {decayValues[type] === '' || decayValues[type] === 0 
                  ? `${config.hours} hours` 
                  : `${(config.hours * (Number(decayValues[type]) / config.max)).toFixed(1)} hours`}
              </span>
            </div>
            <button
              onClick={() => handleStartTimer(type)}
              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors whitespace-nowrap"
            >
              Start timer
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

const RaidedOutPrompt = ({ onConfirm, onCancel }) => (
  <div 
    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4"
    onClick={onCancel}
  >
    <div 
      className="bg-gray-800 rounded-lg shadow-2xl border border-gray-600 p-6 max-w-sm w-full relative"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={onCancel}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-200 transition-colors"
      >
        <X className="h-5 w-5" />
      </button>
      <h3 className="text-lg font-bold text-white mb-4">Base Raided Out</h3>
      <p className="text-gray-300 mb-6">Would you like to report this raid?</p>
      <div className="flex gap-3 justify-end">
        <button
          onClick={onConfirm}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
        >
          Make Report
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-700 text-gray-200 rounded-md hover:bg-gray-600 transition-colors font-medium"
        >
          Not right now
        </button>
      </div>
    </div>
  </div>
)

const SelectedLocationPanel = ({ location, onEdit, getOwnedBases, onSelectLocation, locationTimers, onAddTimer, onOpenReportModal }) => {
  const [showActionMenu, setShowActionMenu] = useState(false)
  const [showDecayingMenu, setShowDecayingMenu] = useState(false)
  const ownedBases = getOwnedBases(location.name)
  
  return (
    <div 
      className="absolute bottom-0 left-0 bg-gray-900 bg-opacity-95 backdrop-blur-sm rounded-tr-lg shadow-2xl p-6 flex gap-5 border-t border-r border-gray-700 z-20 transition-all duration-300 ease-out"
      style={{ width: '30%', minWidth: '350px', maxWidth: '450px', minHeight: '160px' }}
    >
      {!location.type.startsWith('report') && (
        <div className="absolute -top-7 left-1/2 transform -translate-x-1/2 flex gap-3">
          <button className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center hover:from-blue-400 hover:to-blue-600 transition-all duration-200 border-2 border-blue-300 shadow-lg transform hover:scale-105" title="Linked Bases">
            <svg className="h-5 w-5 text-white drop-shadow-sm" viewBox="0 0 24 24" fill="none">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-700 rounded-full flex items-center justify-center hover:from-green-400 hover:to-green-600 transition-all duration-200 border-2 border-green-300 shadow-lg transform hover:scale-105" title="Notes" onClick={() => onEdit(location)}>
            <svg className="h-5 w-5 text-white drop-shadow-sm" viewBox="0 0 24 24" fill="none">
              <path d="M4 4v16c0 1.1.9 2 2 2h10l4-4V6c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2z" fill="white" stroke="white" strokeWidth="1"/>
              <path d="M16 18v-4h4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center hover:from-purple-400 hover:to-purple-600 transition-all duration-200 border-2 border-purple-300 shadow-lg transform hover:scale-105" title="Help">
            <HelpCircle className="h-5 w-5 text-white drop-shadow-sm" />
          </button>
        </div>
      )}
      
      {location.type.startsWith('report') ? (
        <button 
          className="absolute -top-4 -right-4 bg-purple-600 rounded-full flex items-center justify-center hover:bg-purple-700 transition-colors border-2 border-gray-800 shadow-lg"
          style={{width: '60px', height: '60px'}} 
          title="Details"
          onClick={() => onEdit(location)}
        >
          <span className="text-white text-[11px] font-bold">DETAILS</span>
        </button>
      ) : (
        <button 
          className="absolute -top-4 -right-4 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors border-2 border-gray-800 shadow-lg" 
          style={{width: '52px', height: '52px'}} 
          title="Actions"
          onClick={(e) => {
            e.stopPropagation()
            setShowActionMenu(!showActionMenu)
          }}
        >
          <span className="text-white text-xs font-bold">ACT</span>
        </button>
      )}
      
      {showActionMenu && !location.type.startsWith('report') && (
        <ActionMenu 
          location={location}
          style={{
            top: '20px',
            left: 'calc(100% + 3px)',
            zIndex: 30
          }}
          onClose={() => setShowActionMenu(false)}
          onAction={(action) => {
            console.log(action)
            setShowActionMenu(false)
            
            if (action === 'Write report') {
              onOpenReportModal(location)
            } else if (action === 'Intentional Decay' || action === 'Decaying') {
              setShowDecayingMenu(true)
            }
          }}
        />
      )}
      
      {showDecayingMenu && !location.type.startsWith('report') && (
        <DecayingMenu 
          style={{
            top: '20px',
            left: 'calc(100% + 3px)',
            zIndex: 30
          }}
          title={location.type.startsWith('friendly') ? 'Intentional Decay Calculator' : 'Decay Calculator'}
          onClose={() => setShowDecayingMenu(false)}
          onStartTimer={(type, seconds) => {
            if (!location || location.type.startsWith('report')) return
            
            const existing = locationTimers[location.id] || []
            if (existing.length >= 3) {
              alert('Maximum 3 timers per base')
              return
            }
            
            onAddTimer(location.id, {
              id: Date.now() + Math.random(),
              type: type,
              remaining: seconds
            })
            
            setShowDecayingMenu(false)
            const hours = seconds / 3600
            const isFriendly = location.type.startsWith('friendly')
            console.log(`Started ${isFriendly ? 'intentional decay' : 'decay'} ${type} timer for ${location.name}: ${hours.toFixed(1)} hours`)
          }}
        />
      )}
      
      <div className="flex-shrink-0 mt-4 relative">
        <div className="bg-gray-700 rounded-full p-4 shadow-xl border-2 border-gray-600">
          <div className={getColor(location.type)}>
            <div className="transform scale-125">
              {getLargeIcon(location.type)}
            </div>
          </div>
        </div>
        
        {location.oldestTC && location.oldestTC > 0 && (
          <div className="absolute inset-0 pointer-events-none">
            <svg width="100%" height="100%" viewBox="0 0 100 100" className="absolute inset-0">
              <g transform={`translate(50, 50)`}>
                <g transform={`rotate(${location.oldestTC + 180})`}>
                  <g transform={`translate(0, -42)`}>
                    <path
                      d="M -5 -5 L 5 -5 L 0 5 Z"
                      fill={location.type.startsWith('enemy') ? '#ef4444' : '#10b981'}
                      stroke={location.type.startsWith('enemy') ? '#991b1b' : '#047857'}
                      strokeWidth="1"
                    />
                  </g>
                </g>
              </g>
            </svg>
          </div>
        )}
        
        {ownedBases.length > 0 && (
          <div className="absolute -bottom-1 -right-1">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg border-2 border-gray-800">
              <span className="text-xs text-white font-bold">{ownedBases.length}</span>
            </div>
          </div>
        )}
        
        {location.roofCamper && (
          <div className="absolute -top-2 -left-2">
            <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center shadow-lg border-2 border-gray-800" title="Roof Camper">
              <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="8" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </div>
          </div>
        )}
        
        {location.hostileSamsite && (
          <div className="absolute -top-2 -right-2">
            <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg border-2 border-gray-800" title="Hostile Samsite">
              <span className="text-xs font-bold text-black">!</span>
            </div>
          </div>
        )}
        
        {location.raidedOut && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-6 h-6 bg-red-600 bg-opacity-80 rounded-full flex items-center justify-center shadow-lg border-2 border-gray-800" title="Raided Out">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
          </div>
        )}
        
        <div className="absolute -top-9 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
          <div className="relative">
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 120 32">
              <defs>
                <linearGradient id="coordGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={location.type.startsWith('report') ? "#9333ea" : location.type.startsWith('enemy') ? "#ef4444" : "#10b981"} stopOpacity="0.3"/>
                  <stop offset="50%" stopColor={location.type.startsWith('report') ? "#9333ea" : location.type.startsWith('enemy') ? "#ef4444" : "#10b981"} stopOpacity="0.8"/>
                  <stop offset="100%" stopColor={location.type.startsWith('report') ? "#9333ea" : location.type.startsWith('enemy') ? "#ef4444" : "#10b981"} stopOpacity="0.3"/>
                </linearGradient>
              </defs>
              <rect x="1" y="1" width="118" height="30" rx="15" fill="url(#coordGrad)" stroke={location.type.startsWith('report') ? "#9333ea" : location.type.startsWith('enemy') ? "#ef4444" : "#10b981"} strokeWidth="1"/>
            </svg>
            <span className={`relative font-mono font-bold bg-gray-900 bg-opacity-90 rounded-xl border shadow-lg backdrop-blur-sm whitespace-nowrap ${
              location.type.startsWith('report') ? 'border-purple-400' : location.type.startsWith('enemy') ? 'border-red-400' : 'border-green-400'
            } ${
              (location.type === 'enemy-farm' || location.type === 'enemy-flank' || location.type === 'enemy-tower') && location.ownerCoordinates ? 'px-3 py-1' : 'px-4 py-1.5'
            }`}>
              <LocationName name={location.name} className={`${
                location.type.startsWith('report') ? 'text-purple-300' : location.type.startsWith('enemy') ? 'text-red-300' : 'text-green-300'
              } ${
                (location.type === 'enemy-farm' || location.type === 'enemy-flank' || location.type === 'enemy-tower') && location.ownerCoordinates ? 'text-xl' : 'text-3xl'
              }`} />
              {(location.type === 'enemy-farm' || location.type === 'enemy-flank' || location.type === 'enemy-tower') && location.ownerCoordinates && (
                <span className="text-sm font-normal ml-1 opacity-80 text-white">
                  ({location.ownerCoordinates})
                </span>
              )}
            </span>
          </div>
        </div>

        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
          <span className="text-sm text-gray-300 font-medium bg-gray-800 bg-opacity-80 px-3 py-1 rounded shadow-md whitespace-nowrap">
            {LABELS[location.type] || location.type}
          </span>
        </div>
      </div>
      
      <div className="flex-1 text-white pr-12 mt-2">
        <div className="mt-8 flex flex-col gap-2">
          {location.type.startsWith('report') && location.time && (
            <div className="text-sm text-gray-400">
              {location.time}
            </div>
          )}
          {location.primaryRockets && location.primaryRockets > 0 && !location.type.startsWith('friendly') && !location.type.startsWith('report') && (
            <div className="text-sm text-gray-400">
              <span className="text-red-400 font-medium">Rockets Required: {location.primaryRockets}</span>
            </div>
          )}
          {location.enemyPlayers && location.type.startsWith('report') && (
            <div className="text-sm text-gray-400">
              <span className="text-red-400 font-medium">Enemies: {location.enemyPlayers}</span>
            </div>
          )}
          {location.friendlyPlayers && location.type.startsWith('report') && (
            <div className="text-sm text-gray-400">
              <span className="text-green-400 font-medium">Friendlies: {location.friendlyPlayers}</span>
            </div>
          )}
          {ownedBases.length > 0 && (
            <div className="text-sm text-gray-400">
              <span className="text-blue-400 font-medium">Owns {ownedBases.length} base{ownedBases.length > 1 ? 's' : ''}:</span>
              <div className="mt-1 ml-2">
                {ownedBases.map((base, index) => (
                  <button
                    key={index}
                    onClick={() => onSelectLocation(base)}
                    className="text-xs text-gray-500 hover:text-blue-400 text-left transition-colors block"
                  >
                    • {base.name} ({LABELS[base.type].replace('Friendly ', '').replace('Main ', '')})
                  </button>
                ))}
              </div>
            </div>
          )}
          {(location.roofCamper || location.hostileSamsite || location.raidedOut) && (
            <div className="text-sm text-gray-400 flex gap-3 flex-wrap">
              {location.roofCamper && (
                <span className="text-orange-400 font-medium flex items-center gap-1">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="8" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                  Roof Camper
                </span>
              )}
              {location.hostileSamsite && (
                <span className="text-yellow-400 font-medium flex items-center gap-1">
                  <span className="bg-yellow-500 text-black rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">!</span>
                  Hostile Samsite
                </span>
              )}
              {location.raidedOut && (
                <span className="text-red-400 font-medium flex items-center gap-1">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                  Raided Out
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Base Report Preview Component
const BaseReportPreview = ({ report, onClick, onEdit }) => {
  const getReportIcon = (reportType) => {
    switch (reportType) {
      case 'Base Raided':
        return (
          <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2L3 7v11a1 1 0 001 1h3v-6h6v6h3a1 1 0 001-1V7l-7-5z"/>
            <path d="M8 13h4v4H8z" fill="currentColor" opacity="0.6"/>
          </svg>
        )
      case 'MLRS\'d':
        return (
          <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
          </svg>
        )
      case 'Enemy built in':
        return (
          <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
          </svg>
        )
      case 'We grubbed':
        return (
          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.242.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-1.092a4.535 4.535 0 001.676-.662C13.398 12.766 14 11.991 14 11c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 8.092V6.151c.391.127.68.317.843.504a1 1 0 101.51-1.31c-.562-.649-1.413-1.076-2.353-1.253V5z" clipRule="evenodd"/>
          </svg>
        )
      case 'Caught moving loot':
        return (
          <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 7a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm-3 3a1 1 0 100 2h.01a1 1 0 100-2H10zm-4 1a1 1 0 011-1h.01a1 1 0 110 2H7a1 1 0 01-1-1zm1-4a1 1 0 100 2h.01a1 1 0 100-2H7zm2 1a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zm4-4a1 1 0 100 2h.01a1 1 0 100-2H13zM9 9a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zM7 8a1 1 0 000 2h.01a1 1 0 000-2H7z" clipRule="evenodd"/>
          </svg>
        )
      default:
        return (
          <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
          </svg>
        )
    }
  }

  return (
    <div className="w-full bg-gray-700 rounded-lg p-3 transition-colors border border-gray-600 hover:border-gray-500">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {getReportIcon(report.baseReportType)}
          <span className="text-gray-200 text-sm font-medium">{report.baseReportType}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-xs">{report.reportTime}</span>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onEdit && onEdit(report);
            }}
            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
            data-testid="button-edit-report"
          >
            Edit
          </button>
        </div>
      </div>
      
      <div 
        onClick={onClick}
        className="cursor-pointer hover:bg-gray-600 rounded p-1 -m-1 transition-colors"
      >
        <div className="flex items-center gap-2">
          {/* Screenshot preview placeholder */}
          {report.screenshots && report.screenshots.length > 0 && (
            <div className="w-8 h-6 bg-gray-600 rounded flex items-center justify-center">
              <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"/>
              </svg>
            </div>
          )}
          
          {/* Notes indicator */}
          {report.notes && report.notes.trim() && (
            <div className="w-4 h-4 bg-yellow-500 rounded flex items-center justify-center">
              <svg className="w-3 h-3 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/>
              </svg>
            </div>
          )}
          
          {/* Date without year */}
          <span className="text-gray-500 text-xs ml-auto">
            {new Date(report.timestamp).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric'
            })}
          </span>
        </div>
      </div>
    </div>
  )
}

const BaseModal = ({ 
  modal, 
  modalType, 
  editingLocation,
  editingReport,
  locations,
  onSave,
  onCancel,
  onDelete,
  reportLibrary,
  addToReportLibrary,
  updateReportLibrary
}) => {
  const [formData, setFormData] = useState({
    type: modalType === 'friendly' ? 'friendly-main' : modalType === 'enemy' ? 'enemy-small' : modalType === 'base-report' ? 'base-report' : 'report-pvp',
    notes: '',
    oldestTC: 0,
    players: '',
    upkeep: { wood: 0, stone: 0, metal: 0, hqm: 0 },
    reportTime: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
    reportOutcome: 'neutral',
    ownerCoordinates: '',
    library: '',
    youtube: '',
    roofCamper: false,
    hostileSamsite: false,
    raidedOut: false,
    primaryRockets: 0,
    enemyPlayers: '',
    friendlyPlayers: '',
    baseReportType: modalType === 'base-report' ? 'Base Raided' : '' // Initialize properly for base-report mode
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
    if (editingReport) {
      // Editing an existing report
      setFormData({
        type: editingReport.baseType,
        notes: editingReport.notes || '',
        oldestTC: 0,
        players: '',
        upkeep: { wood: 0, stone: 0, metal: 0, hqm: 0 },
        reportTime: editingReport.reportTime || '',
        reportOutcome: editingReport.reportOutcome || 'neutral',
        ownerCoordinates: '',
        library: '',
        youtube: '',
        roofCamper: false,
        hostileSamsite: false,
        raidedOut: false,
        primaryRockets: 0,
        enemyPlayers: '',
        friendlyPlayers: '',
        baseReportType: editingReport.baseReportType || 'Base Raided'
      })
    } else if (editingLocation) {
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
        friendlyPlayers: editingLocation.friendlyPlayers || '',
        baseReportType: modalType === 'base-report' ? 'Base Raided' : ''
      })
    } else if (modalType === 'report') {
      const now = new Date()
      setFormData(prev => ({
        ...prev,
        reportTime: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
      }))
    }
  }, [editingLocation, editingReport, modalType])
  
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
  
  // Get reports for a specific base
  const getBaseReports = useCallback((baseId) => {
    if (!baseId) return []
    return reportLibrary.filter(report => 
      report.type === 'base-report' && report.locationId === baseId
    )
  }, [reportLibrary])

  // Open full report for viewing/editing
  const openFullReport = useCallback((report) => {
    // This would open the report in full view mode
    console.log('Opening full report:', report)
    // TODO: Implement full report view modal
  }, [])

  // Edit base report
  const editBaseReport = useCallback((report) => {
    // Convert the report back to a location-like object for editing
    const reportLocation = {
      id: report.locationId,
      name: report.baseName,
      type: report.baseType,
      notes: report.notes,
      reportTime: report.reportTime,
    }
    
    setEditingLocation(reportLocation)
    setModalType('base-report')
    setEditingReport(report) // Set the report being edited
    setShowReportPanel(false) // Close report panel
  }, [])



  const handleSave = () => {
    // Handle base report creation or updating
    if (modalType === 'base-report') {
      if (editingReport) {
        // Update existing report
        const updatedReport = {
          ...editingReport,
          baseReportType: formData.baseReportType,
          reportTime: formData.reportTime,
          reportOutcome: formData.reportOutcome,
          notes: formData.notes,
          timestamp: editingReport.timestamp // Keep original timestamp
        }
        
        updateReportLibrary(updatedReport)
        console.log('Updated base report:', updatedReport)
      } else {
        // Create new report
        const reportData = {
          id: Date.now().toString(),
          type: 'base-report',
          baseReportType: formData.baseReportType,
          reportTime: formData.reportTime,
          reportOutcome: 'neutral',
          notes: formData.notes,
          baseType: editingLocation?.type || 'unknown',
          locationId: editingLocation?.id,
          baseName: editingLocation?.name || 'Unknown Base',
          timestamp: new Date().toISOString(),
          screenshots: [] // Placeholder for screenshots
        }
        
        addToReportLibrary(reportData)
        console.log('Created base report:', reportData)
      }
      
      onCancel() // Close modal after creating/updating report
      return
    }
    
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
  
  // Render base report modal with specific dropdown options
  const renderBaseReportModal = () => {
    const baseType = editingLocation?.type || ''
    const isFriendly = baseType.startsWith('friendly')
    const baseName = editingLocation?.name || 'Unknown Base'
    
    const reportOptions = isFriendly 
      ? ['Base Raided', 'MLRS\'d', 'Enemy built in'] 
      : ['Base Raided', 'MLRS\'d', 'We grubbed', 'Caught moving loot']
    
    return (
      <div>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-200 mb-2">
            Base Report: {baseName}
          </h3>
          <p className="text-sm text-gray-400">
            Creating {isFriendly ? 'friendly' : 'enemy'} base report
          </p>
        </div>
        
        <div className="flex gap-4 items-end mb-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1 text-gray-200">Report Type</label>
            <div className="relative">
              <select 
                value={formData.baseReportType} 
                onChange={(e) => setFormData(prev => ({ ...prev, baseReportType: e.target.value }))} 
                className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-md appearance-none pr-16 text-gray-200 focus:border-purple-500 focus:outline-none"
              >
                {reportOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
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
              className="px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-md text-gray-200 focus:border-purple-500 focus:outline-none" 
            />
          </div>
        </div>
        
        {/* Notes Container */}
        <div className="bg-gray-900 border border-gray-600 rounded p-3">
          <h4 className="text-gray-300 font-semibold text-sm mb-2">Notes</h4>
          <textarea 
            value={formData.notes} 
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} 
            className="w-full h-32 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs text-gray-200 placeholder-gray-500 resize-none focus:outline-none focus:border-purple-500"
            placeholder={`Add details about the ${(formData.baseReportType || 'incident').toLowerCase()} incident...`}
          />
        </div>
      </div>
    )
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
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none flex items-center gap-1">
            <div className={`${getColor(formData.type)} bg-gray-700 rounded p-0.5 border border-gray-600`}>
              {getIcon(formData.type)}
            </div>
            <svg className="h-3 w-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        
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
        
        <label className="block text-sm font-medium mb-1 text-gray-200">Base owners</label>
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
            
            <div className="flex-1 px-4 pt-4 space-y-3 overflow-y-auto text-gray-200" style={{paddingTop: modalType === 'enemy' ? '24px' : '12px', position: 'relative', zIndex: 1}}>
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
              
              {modalType === 'base-report' && (
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1 text-gray-200">Evidence Screenshots</label>
                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-3 text-center hover:border-gray-500 transition-colors flex flex-col items-center justify-center" style={{height: '100px'}}>
                    <svg className="h-7 w-7 text-gray-500 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-400 text-xs">Upload evidence of the incident</p>
                  </div>
                </div>
              )}
              
              {modalType !== 'report' && modalType !== 'base-report' && (
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

              {modalType === 'report' ? renderReportModal() : modalType === 'base-report' ? renderBaseReportModal() : renderBaseModal()}
            </div>

            {modalType === 'report' || modalType === 'base-report' ? (
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
                  
                  {modalType === 'report' && (
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
                  )}
                  
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
                    {modalType === 'base-report' ? 'Create Base Report' : editingLocation ? 'Update Report' : 'Save Report'}
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
              
              {/* Base Report Previews */}
              <div className="flex-1 overflow-y-auto space-y-2">
                {getBaseReports(editingLocation?.id).length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-500 mb-2">
                      <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-400 text-sm">No reports for this base yet</p>
                  </div>
                ) : (
                  getBaseReports(editingLocation?.id)
                    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                    .map((report, index) => (
                      <BaseReportPreview 
                        key={`${report.id}-${index}`}
                        report={report}
                        onClick={() => openFullReport(report)}
                        onEdit={editBaseReport}
                      />
                    ))
                )}
              </div>
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

// ============= MAIN COMPONENT =============
export default function InteractiveTacticalMap() {
  const [locations, setLocations] = useState([])
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [contextMenu, setContextMenu] = useState({ x: 0, y: 0, visible: false })
  const [newBaseModal, setNewBaseModal] = useState({ x: 0, y: 0, visible: false })
  const [modalType, setModalType] = useState('friendly')
  const [editingLocation, setEditingLocation] = useState(null)
  const [editingReport, setEditingReport] = useState(null)
  const [showReportPanel, setShowReportPanel] = useState(false)
  const [showAdvancedPanel, setShowAdvancedPanel] = useState(false)
  
  // Central Report Library - Hidden storage for all reports
  const [reportLibrary, setReportLibrary] = useState([])
  const [reportCounter, setReportCounter] = useState(1)
  
  // Report type options for different contexts
  const getReportOptions = useCallback((reportContext, baseType) => {
    const commonOptions = ['Base Raided', 'MLRS\'d']
    
    if (reportContext === 'general') {
      return ['PvP', 'Raid', 'MLRS', 'Heli', 'Bradley', 'Cargo', 'Oil Rig', 'Other']
    }
    
    if (reportContext === 'base') {
      if (baseType?.startsWith('friendly')) {
        return [...commonOptions, 'Enemy built in']
      } else if (baseType?.startsWith('enemy')) {
        return [...commonOptions, 'We grubbed', 'Caught moving loot']
      }
    }
    
    return commonOptions
  }, [])
  
  // Create new report and store in library
  const createReport = useCallback((reportData, reportType, locationId = null, baseType = null) => {
    const newReport = {
      id: `report_${reportCounter}`,
      type: reportType, // 'general', 'base'
      locationId: locationId,
      baseType: baseType,
      reportOption: reportData.reportOption || reportData.type,
      time: reportData.reportTime || new Date().toLocaleString(),
      outcome: reportData.reportOutcome || 'neutral',
      notes: reportData.notes || '',
      players: reportData.players || reportData.enemyPlayers || reportData.friendlyPlayers || '',
      createdAt: Date.now(),
      ...reportData
    }
    
    setReportLibrary(prev => [...prev, newReport])
    setReportCounter(prev => prev + 1)
    return newReport
  }, [reportCounter])
  
  // Get reports for a specific location
  const getLocationReports = useCallback((locationId) => {
    return reportLibrary.filter(report => report.locationId === locationId)
  }, [reportLibrary])

  // Add report to library (for use in BaseModal)
  const addToReportLibrary = useCallback((reportData) => {
    setReportLibrary(prev => [...prev, reportData])
  }, [])
  
  const mapRef = useRef(null)
  const [locationTimers, setLocationTimers] = useLocationTimers()
  const { zoom, setZoom, pan, isDragging, setIsDragging, isDraggingRef, dragStartRef, hasDraggedRef } = useMapInteraction()
  
  const getOwnedBases = useCallback((ownerName) => {
    const ownerBase = ownerName.split('(')[0]
    return locations.filter(loc => 
      loc.ownerCoordinates && loc.ownerCoordinates.split('(')[0] === ownerBase
    )
  }, [locations])
  
  const handleContextMenu = useCallback((e) => {
    e.preventDefault()
    if (!hasDraggedRef.current && mapRef.current) {
      const rect = mapRef.current.getBoundingClientRect()
      const centerX = rect.width / 2
      const centerY = rect.height / 2
      const clickX = e.clientX - rect.left
      const clickY = e.clientY - rect.top
      const x = ((clickX - centerX - pan.x) / zoom + centerX) / rect.width * 100
      const y = ((clickY - centerY - pan.y) / zoom + centerY) / rect.height * 100
      if (x >= 0 && x <= 100 && y >= 0 && y <= 100) {
        setContextMenu({ x: e.clientX, y: e.clientY, visible: true })
        setNewBaseModal({ x, y, visible: false })
      }
    }
  }, [pan, zoom, hasDraggedRef])
  
  const handleAddBase = useCallback((type) => {
    setContextMenu(prev => ({ ...prev, visible: false }))
    setEditingLocation(null)
    setModalType(type)
    setNewBaseModal(prev => ({ ...prev, visible: true }))
  }, [])
  
  const handleEditBase = useCallback((location) => {
    setEditingLocation(location)
    
    if (location.type.startsWith('friendly')) setModalType('friendly')
    else if (location.type.startsWith('enemy')) setModalType('enemy')
    else setModalType('report')
    
    setNewBaseModal({ x: location.x, y: location.y, visible: true })
  }, [])
  
  const handleSaveBase = useCallback((baseData) => {
    if (editingLocation) {
      setLocations(prev => prev.map(loc => 
        loc.id === editingLocation.id ? { ...loc, ...baseData } : loc
      ))
      setSelectedLocation({ ...editingLocation, ...baseData })
    } else {
      const newLocation = {
        id: Date.now().toString(),
        name: getGridCoordinate(newBaseModal.x, newBaseModal.y, locations, null),
        x: newBaseModal.x,
        y: newBaseModal.y,
        ...baseData
      }
      setLocations(prev => [...prev, newLocation])
      setSelectedLocation(newLocation)
    }
    
    setNewBaseModal(prev => ({ ...prev, visible: false }))
    setEditingLocation(null)
  }, [editingLocation, newBaseModal, locations])
  
  const handleCancel = useCallback(() => {
    setNewBaseModal(prev => ({ ...prev, visible: false }))
    setEditingLocation(null)
    setEditingReport(null)
    setShowReportPanel(false)
    setShowAdvancedPanel(false)
  }, [])
  
  const handleDeleteLocation = useCallback(() => {
    if (editingLocation) {
      setLocations(prev => prev.filter(loc => loc.id !== editingLocation.id))
      setSelectedLocation(null)
      setLocationTimers(prev => {
        const updated = { ...prev }
        delete updated[editingLocation.id]
        return updated
      })
      handleCancel()
    }
  }, [editingLocation, handleCancel, setLocationTimers])
  
  const handleWheel = useCallback((e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.3 : 0.3
    setZoom(Math.min(Math.max(zoom + delta, 1), 3.75))
  }, [zoom, setZoom])
  
  const handleMouseDown = useCallback((e) => {
    if (e.button === 0) {
      e.preventDefault()
      isDraggingRef.current = true
      hasDraggedRef.current = false
      dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }
      setIsDragging(true)
    }
  }, [pan, isDraggingRef, hasDraggedRef, dragStartRef, setIsDragging])
  
  const handleClick = useCallback((e) => {
    if (!hasDraggedRef.current) {
      setContextMenu(prev => ({ ...prev, visible: false }))
      setSelectedLocation(null)
    }
    hasDraggedRef.current = false
  }, [hasDraggedRef])
  
  const handleRemoveTimer = useCallback((locationId, timerId) => {
    setLocationTimers(prev => ({
      ...prev,
      [locationId]: prev[locationId].filter(t => t.id !== timerId)
    }))
  }, [setLocationTimers])
  
  const handleAddTimer = useCallback((locationId, timer) => {
    setLocationTimers(prev => ({
      ...prev,
      [locationId]: [...(prev[locationId] || []), timer]
    }))
  }, [setLocationTimers])
  
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
              onOpenReportModal={(location) => {
                setModalType('base-report')
                setEditingLocation(location)
                setNewBaseModal({ x: location.x, y: location.y, visible: true })
              }}
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
            editingReport={editingReport}
            locations={locations}
            onSave={handleSaveBase}
            onCancel={handleCancel}
            onDelete={handleDeleteLocation}
            reportLibrary={reportLibrary}
            addToReportLibrary={addToReportLibrary}
            updateReportLibrary={updateReportLibrary}
          />
        )}
      </div>
    </div>
  )
}