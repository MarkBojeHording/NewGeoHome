import { useState, useEffect, useMemo } from 'react'

// Utility function
const formatNumber = (num) => num.toLocaleString()

// Get countdown to first Thursday (matching your existing logic)
const getCountdown = () => {
  const now = new Date()
  let target = new Date(now.getFullYear(), now.getMonth(), 1)
  while (target.getDay() !== 4) target.setDate(target.getDate() + 1)
  target.setHours(14, 0, 0, 0)
  if (target <= now) {
    target = new Date(target.setMonth(target.getMonth() + 1))
    target.setDate(1)
    while (target.getDay() !== 4) target.setDate(target.getDate() + 1)
    target.setHours(14, 0, 0, 0)
  }
  
  const diff = target.getTime() - now.getTime()
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    fractionalDays: Math.floor(diff / (1000 * 60 * 60 * 24)) + Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)) / 24
  }
}

export default function TCUpkeepModal({ onClose }) {
  const [countdown, setCountdown] = useState(getCountdown())
  const [goodForWipe, setGoodForWipe] = useState(false)
  const [trackForTotal, setTrackForTotal] = useState(true)
  const [trackRemainingTime, setTrackRemainingTime] = useState(true)
  const [timerDays, setTimerDays] = useState('')
  const [timerHours, setTimerHours] = useState('')
  const [timerMinutes, setTimerMinutes] = useState('')
  const [isTimerActive, setIsTimerActive] = useState(false)
  const [showTCAdvanced, setShowTCAdvanced] = useState(false)
  const [mainTC, setMainTC] = useState({
    wood: '',
    stone: '',
    metal: '',
    hqm: ''
  })
  
  const [additionalTCs, setAdditionalTCs] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [tcEntry, setTcEntry] = useState({
    name: '',
    woodUpkeep: 0,
    stoneUpkeep: 0,
    metalUpkeep: 0,
    hqmUpkeep: 0,
    remainingDays: '',
    remainingHours: '',
    remainingMinutes: ''
  })
  
  // Update wipe countdown
  useEffect(() => {
    const updateCountdown = () => setCountdown(getCountdown())
    updateCountdown()
    const interval = setInterval(updateCountdown, 60000)
    return () => clearInterval(interval)
  }, [])
  
  // Stop timer when tracking is disabled
  useEffect(() => {
    if (!trackRemainingTime) {
      setIsTimerActive(false)
    }
  }, [trackRemainingTime])
  
  // Timer countdown - decrements the actual field values every minute
  useEffect(() => {
    if (isTimerActive && trackRemainingTime) {
      const timer = setInterval(() => {
        // Calculate current total seconds
        const days = parseInt(timerDays) || 0
        const hours = parseInt(timerHours) || 0
        const minutes = parseInt(timerMinutes) || 0
        let totalSeconds = (days * 24 * 60 * 60) + (hours * 60 * 60) + (minutes * 60)
        
        if (totalSeconds <= 60) {
          // Timer expired
          setIsTimerActive(false)
          setTimerDays('00')
          setTimerHours('00')
          setTimerMinutes('00')
        } else {
          // Decrement by 1 minute
          totalSeconds -= 60
          const newDays = Math.floor(totalSeconds / (24 * 60 * 60))
          const newHours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60))
          const newMinutes = Math.floor((totalSeconds % (60 * 60)) / 60)
          
          setTimerDays(newDays.toString().padStart(2, '0'))
          setTimerHours(newHours.toString().padStart(2, '0'))
          setTimerMinutes(newMinutes.toString().padStart(2, '0'))
        }
      }, 60000)  // Update every minute
      
      return () => clearInterval(timer)
    }
  }, [isTimerActive, timerDays, timerHours, timerMinutes, trackRemainingTime])
  
  const startTimer = () => {
    if (!trackRemainingTime) return
    
    const days = parseInt(timerDays) || 0
    const hours = parseInt(timerHours) || 0
    const minutes = parseInt(timerMinutes) || 0
    
    if (hours > 23 || minutes > 59) return
    
    const totalSeconds = (days * 24 * 60 * 60) + (hours * 60 * 60) + (minutes * 60)
    if (totalSeconds > 0) {
      setIsTimerActive(true)
    }
  }
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.target.blur()
    }
  }
  
  const handleInputChange = (setter, value, max) => {
    // Allow typing but validate max
    if (value === '' || (parseInt(value) >= 0 && parseInt(value) <= max)) {
      setter(value)
    }
  }
  
  const handleBlur = () => {
    if (!isTimerActive) {
      startTimer()
    }
  }
  
  // Calculate if timer should show red (less than 10 minutes)
  const isLowTime = () => {
    const days = parseInt(timerDays) || 0
    const hours = parseInt(timerHours) || 0
    const minutes = parseInt(timerMinutes) || 0
    const totalSeconds = (days * 24 * 60 * 60) + (hours * 60 * 60) + (minutes * 60)
    return isTimerActive && totalSeconds <= 600
  }
  
  // Helper to get numeric value from mainTC (treat empty string as 0)
  const getNumericValue = (value) => {
    return value === '' ? 0 : Number(value)
  }
  
  // Calculate totals
  const totals = useMemo(() => {
    // Start with MainTC upkeep if tracking for total (convert empty strings to 0)
    let daily = trackForTotal ? {
      wood: getNumericValue(mainTC.wood),
      stone: getNumericValue(mainTC.stone),
      metal: getNumericValue(mainTC.metal),
      hqm: getNumericValue(mainTC.hqm)
    } : { wood: 0, stone: 0, metal: 0, hqm: 0 }
    
    // Add upkeep from external TCs
    additionalTCs.forEach(tc => {
      daily.wood = (daily.wood || 0) + tc.woodUpkeep
      daily.stone = (daily.stone || 0) + tc.stoneUpkeep
      daily.metal = (daily.metal || 0) + tc.metalUpkeep
      daily.hqm = (daily.hqm || 0) + tc.hqmUpkeep
    })
    
    // Calculate until wipe
    const untilWipe = {}
    Object.keys(daily).forEach(key => {
      untilWipe[key] = Math.ceil(daily[key] * countdown.fractionalDays)
    })
    
    return { daily, untilWipe }
  }, [mainTC, additionalTCs, countdown.fractionalDays, trackForTotal])
  
  // Calculate optimal TC storage distribution
  const calculateOptimalStorage = useMemo(() => {
    const daily = {
      wood: getNumericValue(mainTC.wood),
      stone: getNumericValue(mainTC.stone),
      metal: getNumericValue(mainTC.metal),
      hqm: getNumericValue(mainTC.hqm)
    }
    const SLOTS = 24
    const STACK_LIMITS = { wood: 1000, stone: 1000, metal: 1000, hqm: 100 }
    
    // Skip if no upkeep
    const totalDaily = daily.wood + daily.stone + daily.metal + daily.hqm
    if (totalDaily === 0) {
      return { slots: Array(SLOTS).fill({ type: 'empty' }), maxDays: 0, totalMaterials: {} }
    }
    
    // Initialize slot allocation
    let slotAllocation = { wood: 0, stone: 0, metal: 0, hqm: 0 }
    let remainingSlots = SLOTS
    
    // Allocate slots to maximize minimum days
    while (remainingSlots > 0) {
      let worstType = null
      let worstDays = Infinity
      
      // Find which resource runs out first (has least days)
      Object.keys(daily).forEach(type => {
        if (daily[type] > 0) {
          const currentCapacity = slotAllocation[type] * STACK_LIMITS[type]
          const days = currentCapacity / daily[type]
          if (days < worstDays) {
            worstDays = days
            worstType = type
          }
        }
      })
      
      if (worstType) {
        slotAllocation[worstType]++
        remainingSlots--
      } else {
        break
      }
    }
    
    // Calculate actual max days (limited by resource that runs out first)
    let maxDays = Infinity
    Object.keys(daily).forEach(type => {
      if (daily[type] > 0) {
        const capacity = slotAllocation[type] * STACK_LIMITS[type]
        const days = capacity / daily[type]
        maxDays = Math.min(maxDays, days)
      }
    })
    
    // Cap max days at wipe time
    const daysUntilWipe = countdown.fractionalDays
    const effectiveMaxDays = Math.min(maxDays, daysUntilWipe)
    
    // Build slot array with actual amounts (capped at wipe)
    const slots = []
    Object.keys(slotAllocation).forEach(type => {
      if (slotAllocation[type] > 0) {
        const stackLimit = STACK_LIMITS[type]
        const totalNeeded = Math.min(
          slotAllocation[type] * stackLimit,
          Math.floor(daily[type] * effectiveMaxDays)
        )
        
        for (let i = 0; i < slotAllocation[type]; i++) {
          const remaining = totalNeeded - (i * stackLimit)
          const amount = Math.min(stackLimit, Math.max(0, remaining))
          if (amount > 0) {
            slots.push({ type, amount })
          }
        }
      }
    })
    
    // Fill remaining with empty
    while (slots.length < SLOTS) {
      slots.push({ type: 'empty' })
    }
    
    // Calculate total materials needed (actual amounts in TC, capped at wipe)
    const totalMaterials = {}
    Object.keys(daily).forEach(type => {
      if (slotAllocation[type] > 0) {
        const stackLimit = STACK_LIMITS[type]
        totalMaterials[type] = Math.min(
          slotAllocation[type] * stackLimit,
          Math.floor(daily[type] * effectiveMaxDays)
        )
      }
    })
    
    return { 
      slots, 
      maxDays: maxDays === Infinity ? 0 : maxDays,
      effectiveMaxDays: effectiveMaxDays === Infinity ? 0 : effectiveMaxDays,
      totalMaterials,
      daysUntilWipe
    }
  }, [mainTC, countdown.fractionalDays])
  
  const handleSaveTC = () => {
    if (!tcEntry.name.trim()) return
    
    if (editingId) {
      setAdditionalTCs(tcs => tcs.map(tc => 
        tc.id === editingId ? { ...tc, ...tcEntry } : tc
      ))
      setEditingId(null)
    } else {
      setAdditionalTCs([...additionalTCs, {
        id: Date.now(),
        ...tcEntry
      }])
    }
    
    setTcEntry({ name: '', woodUpkeep: 0, stoneUpkeep: 0, metalUpkeep: 0, hqmUpkeep: 0, remainingDays: '', remainingHours: '', remainingMinutes: '' })
    setShowAddModal(false)
  }
  
  const handleEditTC = (tc) => {
    setTcEntry({
      name: tc.name,
      woodUpkeep: tc.woodUpkeep || 0,
      stoneUpkeep: tc.stoneUpkeep,
      metalUpkeep: tc.metalUpkeep,
      hqmUpkeep: tc.hqmUpkeep,
      remainingDays: tc.remainingDays || '',
      remainingHours: tc.remainingHours || '',
      remainingMinutes: tc.remainingMinutes || ''
    })
    setEditingId(tc.id)
    setShowAddModal(true)
  }
  
  const handleDeleteTC = (id) => {
    setAdditionalTCs(additionalTCs.filter(tc => tc.id !== id))
  }
  
  return (
    <div>
      <style>{`
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] {
          -moz-appearance: textfield;
        }
      `}</style>
      <div className="bg-gray-800 rounded p-3 text-white">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-2">
          <span className="text-sm font-medium text-orange-300 font-mono tracking-wide">[UPKEEP TRACKER]</span>
          <label className="flex items-center text-xs">
            <input 
              type="checkbox" 
              checked={goodForWipe}
              onChange={e => setGoodForWipe(e.target.checked)}
              className="mr-1"
            />
            Good for wipe
          </label>
          <label className="flex items-center text-xs">
            <input 
              type="checkbox" 
              checked={trackForTotal}
              onChange={e => setTrackForTotal(e.target.checked)}
              className="mr-1"
            />
            Track for total
          </label>
          <label className="flex items-center text-xs" title="Enable to track and countdown remaining upkeep time">
            <input 
              type="checkbox" 
              checked={trackRemainingTime}
              onChange={e => setTrackRemainingTime(e.target.checked)}
              className="mr-1"
            />
            Track time
          </label>
        </div>
        
        {/* Main TC Section */}
        <div className="px-3 py-2 border-b">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-semibold text-gray-700">Main TC Daily Upkeep</span>
            <div className="flex items-center">
              <input
                type="text"
                placeholder="DD"
                value={timerDays}
                onChange={e => handleInputChange(setTimerDays, e.target.value, 99)}
                onKeyPress={handleKeyPress}
                onBlur={handleBlur}
                disabled={!trackRemainingTime}
                className={`w-8 border rounded-l px-1 text-xs text-center font-mono ${
                  !trackRemainingTime ? 'bg-gray-100 text-gray-400 cursor-not-allowed' :
                  isLowTime() ? 'text-red-600 font-bold' : ''
                }`}
                maxLength="2"
              />
              <span className={`text-xs px-0.5 ${!trackRemainingTime ? 'text-gray-400' : ''}`}>:</span>
              <input
                type="text"
                placeholder="HH"
                value={timerHours}
                onChange={e => handleInputChange(setTimerHours, e.target.value, 23)}
                onKeyPress={handleKeyPress}
                onBlur={handleBlur}
                disabled={!trackRemainingTime}
                className={`w-8 border-y px-1 text-xs text-center font-mono ${
                  !trackRemainingTime ? 'bg-gray-100 text-gray-400 cursor-not-allowed' :
                  isLowTime() ? 'text-red-600 font-bold' : ''
                }`}
                maxLength="2"
              />
              <span className={`text-xs px-0.5 ${!trackRemainingTime ? 'text-gray-400' : ''}`}>:</span>
              <input
                type="text"
                placeholder="MM"
                value={timerMinutes}
                onChange={e => handleInputChange(setTimerMinutes, e.target.value, 59)}
                onKeyPress={handleKeyPress}
                onBlur={handleBlur}
                disabled={!trackRemainingTime}
                className={`w-8 border rounded-r px-1 text-xs text-center font-mono ${
                  !trackRemainingTime ? 'bg-gray-100 text-gray-400 cursor-not-allowed' :
                  isLowTime() ? 'text-red-600 font-bold' : ''
                }`}
                maxLength="2"
              />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {['wood', 'stone', 'metal', 'hqm'].map(type => (
              <div key={type}>
                <label className="text-xs text-gray-600 block">{type.toUpperCase()}</label>
                <input
                  type="number"
                  value={mainTC[type]}
                  onChange={e => setMainTC({ ...mainTC, [type]: e.target.value })}
                  className="w-full border rounded px-1 py-0.5 text-sm"
                  min="0"
                  placeholder=""
                />
              </div>
            ))}
          </div>
        </div>
        
        {/* External TCs Section */}
        <div className="px-3 py-2 border-b">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-semibold text-gray-700">External TCs</span>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
            >
              Add TC
            </button>
          </div>
          {additionalTCs.length > 0 && (
            <div className="max-h-24 overflow-y-auto">
              {additionalTCs.map(tc => (
                <div key={tc.id} className="flex items-center justify-between py-1 text-xs">
                  <span className="font-medium">{tc.name}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600">
                      W:{tc.woodUpkeep} S:{tc.stoneUpkeep} M:{tc.metalUpkeep} H:{tc.hqmUpkeep}
                    </span>
                    <button
                      onClick={() => handleEditTC(tc)}
                      className="px-1 py-0.5 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteTC(tc.id)}
                      className="px-1 py-0.5 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Del
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Totals Section */}
        <div className="px-3 py-2 border-b">
          <div className="text-xs font-semibold text-gray-700 mb-1">Daily Total</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>Wood: <span className="font-semibold">{formatNumber(totals.daily.wood)}</span></div>
            <div>Stone: <span className="font-semibold">{formatNumber(totals.daily.stone)}</span></div>
            <div>Metal: <span className="font-semibold">{formatNumber(totals.daily.metal)}</span></div>
            <div>HQM: <span className="font-semibold">{formatNumber(totals.daily.hqm)}</span></div>
          </div>
          <div className="text-xs font-semibold text-gray-700 mt-2 mb-1">Until Wipe ({countdown.days}d {countdown.hours}h)</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>Wood: <span className="font-semibold">{formatNumber(totals.untilWipe.wood)}</span></div>
            <div>Stone: <span className="font-semibold">{formatNumber(totals.untilWipe.stone)}</span></div>
            <div>Metal: <span className="font-semibold">{formatNumber(totals.untilWipe.metal)}</span></div>
            <div>HQM: <span className="font-semibold">{formatNumber(totals.untilWipe.hqm)}</span></div>
          </div>
        </div>
        
        {/* TC Advanced Section - Toggle */}
        <div className="px-3 py-2">
          <button
            onClick={() => setShowTCAdvanced(!showTCAdvanced)}
            className="w-full flex items-center justify-between text-xs font-semibold text-gray-700 hover:text-gray-900"
          >
            <span>TC Advanced</span>
            <span>{showTCAdvanced ? '▼' : '▶'}</span>
          </button>
          
          {showTCAdvanced && (
            <div className="mt-2">
              {/* TC Grid Visualization */}
              <div className="grid grid-cols-8 gap-px bg-gray-200 p-1 mb-2">
                {calculateOptimalStorage.slots.map((slot, i) => (
                  <div key={i} className={`aspect-square flex flex-col items-center justify-center text-xs font-bold rounded ${
                    slot.type === 'empty' ? 'bg-gray-100' :
                    slot.type === 'wood' ? 'bg-yellow-600 text-white' :
                    slot.type === 'stone' ? 'bg-gray-600 text-white' :
                    slot.type === 'metal' ? 'bg-gray-700 text-white' :
                    'bg-blue-600 text-white'
                  }`}>
                    {slot.type !== 'empty' && (
                      <>
                        <div className="text-xs leading-none">
                          {slot.type === 'wood' ? 'W' : 
                           slot.type === 'stone' ? 'S' : 
                           slot.type === 'metal' ? 'M' : 
                           slot.type === 'hqm' ? 'H' : ''}
                        </div>
                        <div className="text-xs leading-none">{slot.amount}</div>
                      </>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Storage Info */}
              <div className="text-xs space-y-1">
                <div>Max Storage: <span className="font-semibold">{calculateOptimalStorage.effectiveMaxDays.toFixed(1)} days</span></div>
                {calculateOptimalStorage.daysUntilWipe < calculateOptimalStorage.maxDays && (
                  <div className="text-orange-600">Limited by wipe in {calculateOptimalStorage.daysUntilWipe.toFixed(1)} days</div>
                )}
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {Object.entries(calculateOptimalStorage.totalMaterials).map(([type, amount]) => (
                    <div key={type}>{type.toUpperCase()}: {formatNumber(amount)}</div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Add TC Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60" onClick={() => setShowAddModal(false)}>
            <div className="bg-white rounded-lg p-4" style={{ width: '300px' }} onClick={e => e.stopPropagation()}>
              <h3 className="text-sm font-semibold mb-3">{editingId ? 'Edit TC' : 'Add External TC'}</h3>
              
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="TC Name"
                  value={tcEntry.name}
                  onChange={e => setTcEntry({ ...tcEntry, name: e.target.value })}
                  className="w-full border rounded px-2 py-1 text-sm"
                />
                
                <div className="grid grid-cols-2 gap-2">
                  {['wood', 'stone', 'metal', 'hqm'].map(type => (
                    <div key={type}>
                      <label className="text-xs text-gray-600 block">{type.toUpperCase()} Upkeep</label>
                      <input
                        type="number"
                        value={tcEntry[`${type}Upkeep`]}
                        onChange={e => setTcEntry({ ...tcEntry, [`${type}Upkeep`]: Number(e.target.value) })}
                        className="w-full border rounded px-1 py-0.5 text-sm"
                        min="0"
                      />
                    </div>
                  ))}
                </div>
                
                <div>
                  <label className="text-xs text-gray-600 block">Remaining Time (Optional)</label>
                  <div className="flex space-x-1">
                    <input
                      type="text"
                      placeholder="DD"
                      value={tcEntry.remainingDays}
                      onChange={e => setTcEntry({ ...tcEntry, remainingDays: e.target.value })}
                      className="w-12 border rounded px-1 py-0.5 text-xs text-center"
                      maxLength="2"
                    />
                    <span className="text-xs py-0.5">:</span>
                    <input
                      type="text"
                      placeholder="HH"
                      value={tcEntry.remainingHours}
                      onChange={e => setTcEntry({ ...tcEntry, remainingHours: e.target.value })}
                      className="w-12 border rounded px-1 py-0.5 text-xs text-center"
                      maxLength="2"
                    />
                    <span className="text-xs py-0.5">:</span>
                    <input
                      type="text"
                      placeholder="MM"
                      value={tcEntry.remainingMinutes}
                      onChange={e => setTcEntry({ ...tcEntry, remainingMinutes: e.target.value })}
                      className="w-12 border rounded px-1 py-0.5 text-xs text-center"
                      maxLength="2"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingId(null)
                    setTcEntry({ name: '', woodUpkeep: 0, stoneUpkeep: 0, metalUpkeep: 0, hqmUpkeep: 0, remainingDays: '', remainingHours: '', remainingMinutes: '' })
                  }}
                  className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTC}
                  className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                >
                  {editingId ? 'Update' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}