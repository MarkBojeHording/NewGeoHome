import { useState, useEffect, useRef, useMemo, useCallback } from 'react'

// Constants
const STONE_IMG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAGJxJREFUeF7temuMXdd13rf3Pu9z3zP3zgyHrxkO3xIli5VkUg9LjmzXdeFHYidQICNxkKRAfgQoUKCoHbgO4NRFfhh9umlTJHFTNEFs2YldO5Il25Ioi5JJkdTMcB58DOdx5965j3PPc5/drM2hYKskRTlxa0M8wODM3HvmnL2+tda3vrX2YXiLH+wtbj9uAnAzAt7iCNxMgbd4ANwkwZspcDMF3uII3EyB6wXA7t27J/M8f4hzfhCArZRa4JzPc843EqXWDaUWpqenmz/LQXTNCLjzzjtfetvbbrvrrn90J0bHtmYFR7CV1VX0+oGK44itrDVFKhmazVWsra4uzZ+dPxkEwUnF1IJS6tm5ubljPwvAXBOAd77z ...[Truncated]'

const TC_TYPES = {
  stone: { cost: 1125, upkeep: 113, color: 'gray', stackLimit: 1000 },
  metal: { cost: 750, upkeep: 75, color: 'gray', stackLimit: 1000 },
  hqm: { cost: 95, upkeep: 10, color: 'blue', stackLimit: 100 }
}
const WOOD_PER_TC = 188
const WOOD_STACK = 1000
const SLOTS = { base: 22, backpack: 30 }

// Utility functions
const formatNumber = (num) => num.toLocaleString()

const getNextFirstThursday = () => {
  const now = new Date()
  let d = new Date(now.getFullYear(), now.getMonth(), 1)
  while (d.getDay() !== 4) d.setDate(d.getDate() + 1)
  d.setHours(14, 0, 0, 0)
  
  if (d <= now) {
    d = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    while (d.getDay() !== 4) d.setDate(d.getDate() + 1)
    d.setHours(14, 0, 0, 0)
  }
  
  return d
}

// Components
const TCGrid = ({ type, showBackpack, capacity }) => {
  const { color } = TC_TYPES[type]
  const totalSlots = showBackpack ? SLOTS.base + SLOTS.backpack : SLOTS.base
  
  const getSlotInfo = (index, offset = 0) => {
    const adjIndex = index + offset - 2
    if (index === 0 && offset === 0) return { type: 'ammo', content: 'Ammo', color: 'red' }
    if (index === 1 && offset === 0) return { type: 'split', content: 'RW', amount: '1000' }
    
    if (adjIndex < capacity.woodSlots) {
      return { type: 'wood', content: 'W', amount: capacity.woodAmounts[adjIndex], color: 'yellow' }
    }
    if (adjIndex < capacity.woodSlots + capacity.materialSlots) {
      const matIndex = adjIndex - capacity.woodSlots
      return { 
        type, 
        content: type === 'hqm' ? 'HQM' : type[0].toUpperCase(), 
        amount: capacity.materialAmounts[matIndex],
        color
      }
    }
    if (adjIndex < capacity.totalSlots) {
      return { type: 'tc', content: 'TC', color: 'green' }
    }
    return { type: 'empty' }
  }
  
  return (
    <div className="flex gap-2">
      <div className="grid grid-cols-6 gap-0">
        {Array.from({ length: 24 }).map((_, i) => {
          const slot = getSlotInfo(i)
          return (
            <div key={i} className={`w-10 h-10 border flex flex-col items-center justify-center text-xs font-bold
              ${slot.type === 'empty' ? 'bg-gray-50 border-gray-300' : 
                slot.color === 'red' ? 'bg-red-500 border-red-600 text-white' :
                slot.color === 'yellow' ? 'bg-yellow-600 border-yellow-700 text-white' :
                slot.color === 'green' ? 'bg-green-600 border-green-700 text-white' :
                slot.color === 'blue' ? 'bg-blue-600 border-blue-700 text-white' :
                'bg-gray-600 border-gray-700 text-white'}`}>
              {slot.type === 'split' ? (
                <div className="relative w-full h-full">
                  <div className="absolute inset-0 bg-red-500" style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}/>
                  <div className="absolute inset-0 bg-yellow-600" style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' }}/>
                  <div className="relative z-10 text-white text-[10px] flex items-center justify-center h-full">
                    {slot.content}<br/>{slot.amount}
                  </div>
                </div>
              ) : (
                <>
                  <span className="leading-none">{slot.content}</span>
                  {slot.amount && <span className="text-[10px]">{slot.amount}</span>}
                </>
              )}
            </div>
          )
        })}
      </div>
      
      {showBackpack && (
        <div className="grid grid-cols-6 gap-0 border-l-2 border-gray-400 pl-2">
          {Array.from({ length: 30 }).map((_, i) => {
            const slot = getSlotInfo(i, 22)
            return (
              <div key={`bp-${i}`} className={`w-10 h-10 border flex flex-col items-center justify-center text-xs font-bold
                ${slot.type === 'empty' ? 'bg-purple-50 border-purple-300' : 
                  slot.color === 'yellow' ? 'bg-yellow-600 border-yellow-700 text-white' :
                  slot.color === 'green' ? 'bg-green-600 border-green-700 text-white' :
                  slot.color === 'blue' ? 'bg-blue-600 border-blue-700 text-white' :
                  'bg-gray-600 border-gray-700 text-white'}`}>
                <span className="leading-none text-[10px]">{slot.content}</span>
                {slot.amount && <span className="text-[10px]">{slot.amount}</span>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const TCBox = ({ type, countdown, showGrid, setShowGrid, showBackpack, setShowBackpack }) => {
  const tc = TC_TYPES[type]
  const capacity = useMemo(() => calculateTCCapacity(type, countdown, showBackpack), [type, countdown, showBackpack])
  
  return (
    <div className="flex items-center space-x-2 relative">
      <div 
        className="flex flex-col items-center relative"
        onMouseEnter={() => setShowGrid(true)}
        onMouseLeave={() => setShowGrid(false)}
      >
        <span className="text-xs text-orange-300 mb-0.5 font-mono">{type} tc</span>
        <div className={`w-14 h-8 border rounded ${
          type === 'stone' ? 'bg-gray-600 border-gray-400' :
          type === 'metal' ? 'bg-gray-500 border-gray-600' :
          'bg-blue-600 border-blue-700'
        }`}>
          {showGrid && (
            <div className="absolute top-full left-0 -mt-1 -ml-32 bg-gray-900 border-2 border-orange-600 rounded-lg shadow-2xl p-1 z-50"
              style={{ width: showBackpack ? '480px' : '240px' }}>
              <TCGrid type={type} showBackpack={showBackpack} capacity={capacity} />
              <div className="mt-2 text-xs text-orange-300 border-t border-orange-600/50 pt-2">
                <div className="flex justify-between mb-1">
                  <div className="font-bold">Max {capacity.maxTCs} {type.toUpperCase()} TCs:</div>
                  <button
                    onClick={() => setShowBackpack(!showBackpack)}
                    className="px-2 py-1 bg-orange-600 text-white rounded hover:bg-orange-700"
                  >
                    Backpack
                  </button>
                </div>
                <div>Wood: <span className="font-semibold">{formatNumber(capacity.woodNeeded)}</span></div>
                <div>{type === 'hqm' ? 'HQM' : type.charAt(0).toUpperCase() + type.slice(1)}: <span className="font-semibold">{formatNumber(capacity.materialNeeded)}</span></div>
                <div>Slots: <span className="font-semibold">{capacity.totalSlots}/{showBackpack ? '52' : '22'}</span></div>
              </div>
            </div>
          )}
        </div>
      </div>
      <TCInfo type={type} countdown={countdown} capacity={capacity} />
    </div>
  )
}

const Modal = ({ show, onClose, title, children }) => {
  if (!show) return null
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]" onClick={onClose}>
      <div className="bg-gray-900 border-2 border-orange-600 rounded-lg p-6 w-96 text-orange-300" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold mb-4 font-mono">[{title.toUpperCase()}]</h3>
        {children}
      </div>
    </div>
  )
}

const TCInfo = ({ type, countdown, capacity }) => {
  const tc = TC_TYPES[type]
  const fractionalDays = countdown.days + (countdown.hours / 24)
  const endOfWipe = Math.ceil(tc.upkeep * fractionalDays)
  const total = Math.ceil(tc.cost + tc.upkeep * fractionalDays)
  
  return (
    <div className="text-xs text-orange-300">
      <div>Cost: {type === 'stone' && <img src={STONE_IMG} alt="Stone" className="w-4 h-4 inline mx-1" />}<span className="font-semibold">{formatNumber(tc.cost)}</span></div>
      <div>Upkeep: <span className="font-semibold">{formatNumber(tc.upkeep)}</span></div>
      <div>EOW: <span className="font-bold text-red-400">{formatNumber(endOfWipe)}</span></div>
      <div>Total: <span className="font-bold text-red-400">{formatNumber(total)}</span></div>
      <div className="mt-1 pt-1 border-t border-orange-600/50">Max TCs: <span className="font-bold text-green-400">{capacity.maxTCs}</span></div>
    </div>
  )
}

// Helper functions
function calculateTCCapacity(tcType, countdown, includeBackpack) {
  const tc = TC_TYPES[tcType]
  const fractionalDays = countdown.days + (countdown.hours / 24)
  const materialPerTC = Math.ceil(tc.cost + tc.upkeep * fractionalDays)
  const availableSlots = includeBackpack ? SLOTS.base + SLOTS.backpack : SLOTS.base
  
  let maxTCs = 0
  for (let i = 1; i <= availableSlots; i++) {
    const woodNeeded = i * WOOD_PER_TC
    const materialNeeded = i * materialPerTC
    const woodSlots = Math.ceil(woodNeeded / WOOD_STACK)
    const materialSlots = Math.ceil(materialNeeded / tc.stackLimit)
    if (woodSlots + materialSlots + i <= availableSlots) maxTCs = i
    else break
  }
  
  const totalWood = maxTCs * WOOD_PER_TC
  const totalMaterial = maxTCs * materialPerTC
  const woodSlots = Math.ceil(totalWood / WOOD_STACK)
  const materialSlots = Math.ceil(totalMaterial / tc.stackLimit)
  
  const woodAmounts = Array.from({ length: woodSlots }, (_, i) => 
    Math.min(WOOD_STACK, totalWood - i * WOOD_STACK)
  )
  const materialAmounts = Array.from({ length: materialSlots }, (_, i) => 
    Math.min(tc.stackLimit, totalMaterial - i * tc.stackLimit)
  )
  
  return {
    maxTCs,
    woodNeeded: totalWood,
    materialNeeded: totalMaterial,
    woodSlots,
    materialSlots,
    woodAmounts,
    materialAmounts,
    totalSlots: woodSlots + materialSlots + maxTCs
  }
}

// Main Component
export default function WipeCountdownTimer() {
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0 })
  const [showMainBox, setShowMainBox] = useState(false)
  const [showModals, setShowModals] = useState({ item: false, upkeep: false })
  const [showGrids, setShowGrids] = useState({ stone: false, metal: false, hqm: false })
  const [showBackpacks, setShowBackpacks] = useState({ stone: false, metal: false, hqm: false })
  const [customItems, setCustomItems] = useState([])
  const [upkeepEntries, setUpkeepEntries] = useState([])
  const [mainImage, setMainImage] = useState(null)
  const [editingUpkeepId, setEditingUpkeepId] = useState(null)
  
  const mainImageInputRef = useRef(null)
  
  const [newUpkeepEntry, setNewUpkeepEntry] = useState({
    name: '', stoneUpkeep: 0, metalUpkeep: 0, hqmUpkeep: 0
  })
  
  const [newItem, setNewItem] = useState({
    name: '', stoneCost: 0, stoneUpkeep: 0, metalCost: 0, 
    metalUpkeep: 0, hqmCost: 0, hqmUpkeep: 0, image: null
  })
  
  // Update countdown
  useEffect(() => {
    const updateCountdown = () => {
      const target = getNextFirstThursday()
      const diff = target.getTime() - Date.now()
      if (diff > 0) {
        setCountdown({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        })
      }
    }
    updateCountdown()
    const interval = setInterval(updateCountdown, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [])
  
  // Keyboard handlers
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setShowMainBox(false)
        setShowModals({ item: false, upkeep: false })
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])
  
  const totalUpkeep = useMemo(() => 
    upkeepEntries.reduce((acc, entry) => ({
      stone: acc.stone + entry.stoneUpkeep,
      metal: acc.metal + entry.metalUpkeep,
      hqm: acc.hqm + entry.hqmUpkeep
    }), { stone: 0, metal: 0, hqm: 0 })
  , [upkeepEntries])
  
  const handleAddUpkeep = useCallback(() => {
    if (!newUpkeepEntry.name.trim()) return
    
    if (editingUpkeepId) {
      setUpkeepEntries(entries => entries.map(e => 
        e.id === editingUpkeepId ? { ...e, ...newUpkeepEntry } : e
      ))
      setEditingUpkeepId(null)
    } else {
      setUpkeepEntries(entries => [...entries, { id: Date.now().toString(), ...newUpkeepEntry }])
    }
    
    setNewUpkeepEntry({ name: '', stoneUpkeep: 0, metalUpkeep: 0, hqmUpkeep: 0 })
    setShowModals(m => ({ ...m, upkeep: false }))
  }, [newUpkeepEntry, editingUpkeepId])
  
  const handleAddItem = useCallback(() => {
    if (!newItem.name.trim()) return
    setCustomItems(items => [...items, { id: Date.now().toString(), ...newItem }])
    setNewItem({ name: '', stoneCost: 0, stoneUpkeep: 0, metalCost: 0, metalUpkeep: 0, hqmCost: 0, hqmUpkeep: 0, image: null })
    setShowModals(m => ({ ...m, item: false }))
  }, [newItem])
  
  return (
    <div className="relative">
      {/* Main countdown display */}
      <div 
        className="cursor-pointer px-3 py-1 bg-gradient-to-b from-orange-800/60 to-orange-900 hover:from-orange-700/80 hover:to-orange-800 text-orange-100 font-bold rounded shadow-lg border-2 border-orange-600/50 transition-all duration-200 hover:shadow-xl hover:shadow-orange-900/50 tracking-wide font-mono"
        onClick={() => setShowMainBox(!showMainBox)}
      >
        [WIPE: {countdown.days}D {countdown.hours}H {countdown.minutes}M]
      </div>
      
      {/* Modals */}
      <Modal 
        show={showModals.upkeep} 
        onClose={() => setShowModals(m => ({ ...m, upkeep: false }))}
        title={editingUpkeepId ? 'Edit Upkeep' : 'Add Upkeep'}
      >
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Name"
            value={newUpkeepEntry.name}
            onChange={e => setNewUpkeepEntry({ ...newUpkeepEntry, name: e.target.value })}
            className="w-full border border-orange-600/50 rounded px-3 py-2 bg-gray-800 text-orange-300"
          />
          {['stone', 'metal', 'hqm'].map(type => (
            <div key={type}>
              <label className="block text-sm mb-1 text-orange-300 font-mono">{type.toUpperCase()} Upkeep (per day)</label>
              <input
                type="number"
                value={newUpkeepEntry[`${type}Upkeep`]}
                onChange={e => setNewUpkeepEntry({ ...newUpkeepEntry, [`${type}Upkeep`]: Number(e.target.value) })}
                className="w-full border border-orange-600/50 rounded px-3 py-2 bg-gray-800 text-orange-300"
                min="0"
              />
            </div>
          ))}
          <div className="flex justify-end space-x-2">
            <button onClick={() => setShowModals(m => ({ ...m, upkeep: false }))} className="px-4 py-2 border border-orange-600/50 rounded bg-gray-800 text-orange-300">Cancel</button>
            <button onClick={handleAddUpkeep} className="px-4 py-2 bg-orange-600 text-white rounded">Save</button>
          </div>
        </div>
      </Modal>
      
      <Modal 
        show={showModals.item} 
        onClose={() => setShowModals(m => ({ ...m, item: false }))}
        title="Add Custom Item"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-1 text-orange-300 font-mono">ITEM NAME</label>
            <input
              type="text"
              placeholder="Enter item name"
              value={newItem.name}
              onChange={e => setNewItem({ ...newItem, name: e.target.value })}
              className="w-full border border-orange-600/50 rounded px-3 py-2 bg-gray-800 text-orange-300"
            />
          </div>
          
          <div>
            <label className="block text-sm mb-1 text-orange-300 font-mono">ITEM IMAGE</label>
            <div 
              className="w-full h-20 border-2 border-dashed border-orange-600/50 rounded-lg flex items-center justify-center cursor-pointer hover:border-orange-600"
              onClick={() => document.getElementById('itemImageInput')?.click()}
            >
              {newItem.image ? (
                <img src={newItem.image} alt="Item" className="w-full h-full object-cover rounded-lg" />
              ) : (
                <span className="text-sm text-orange-400 font-mono">Click to upload image</span>
              )}
            </div>
            <input
              id="itemImageInput"
              type="file"
              accept="image/*"
              onChange={e => {
                const file = e.target.files[0]
                if (file) {
                  const reader = new FileReader()
                  reader.onloadend = () => setNewItem({ ...newItem, image: reader.result })
                  reader.readAsDataURL(file)
                }
              }}
              className="hidden"
            />
          </div>
          
          {['stone', 'metal', 'hqm'].map(type => (
            <div key={type}>
              <label className="block text-sm mb-1 text-orange-300 font-mono">{type.toUpperCase()} RESOURCES</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-orange-400 font-mono mb-1">Cost</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={newItem[`${type}Cost`]}
                    onChange={e => setNewItem({ ...newItem, [`${type}Cost`]: Number(e.target.value) })}
                    className="w-full border border-orange-600/50 rounded px-3 py-2 bg-gray-800 text-orange-300"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs text-orange-400 font-mono mb-1">Daily Upkeep</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={newItem[`${type}Upkeep`]}
                    onChange={e => setNewItem({ ...newItem, [`${type}Upkeep`]: Number(e.target.value) })}
                    className="w-full border border-orange-600/50 rounded px-3 py-2 bg-gray-800 text-orange-300"
                    min="0"
                  />
                </div>
              </div>
            </div>
          ))}
          <div className="flex justify-end space-x-2">
            <button onClick={() => setShowModals(m => ({ ...m, item: false }))} className="px-4 py-2 border border-orange-600/50 rounded bg-gray-800 text-orange-300">Cancel</button>
            <button onClick={handleAddItem} className="px-4 py-2 bg-orange-600 text-white rounded">Save</button>
          </div>
        </div>
      </Modal>

      {/* Detailed view */}
      {showMainBox && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 mt-2 bg-gray-900 border-2 border-orange-600 rounded-lg shadow-2xl p-4 z-[60]" style={{ width: '870px' }}>
          <div className="flex space-x-4">
            {/* Left side */}
            <div className="flex flex-col space-y-2" style={{ width: '490px' }}>
              <div className="flex justify-between">
                <div 
                  className="w-64 h-32 border-2 border-dashed border-orange-600/50 rounded-lg flex items-center justify-center cursor-pointer hover:border-orange-600"
                  onClick={() => mainImageInputRef.current?.click()}
                >
                  {mainImage ? (
                    <img src={mainImage} alt="Base" className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <span className="text-sm text-orange-400 font-mono">Click to upload</span>
                  )}
                </div>
                <input
                  ref={mainImageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files[0]
                    if (file) {
                      const reader = new FileReader()
                      reader.onloadend = () => setMainImage(reader.result)
                      reader.readAsDataURL(file)
                    }
                  }}
                  className="hidden"
                />
                
                {/* Upkeep Summary */}
                <div className="bg-gray-800 border border-orange-600/50 rounded p-2 w-56 text-xs text-orange-300">
                  <div className="font-medium mb-1 font-mono">[DAILY UPKEEP]</div>
                  {Object.entries(totalUpkeep).map(([type, value]) => (
                    <div key={type} className="font-mono">{type}: <span className="font-bold text-red-400">{formatNumber(value)}</span></div>
                  ))}
                  <div className="mt-2 pt-2 border-t border-orange-600/50">
                    <div className="font-medium mb-1 font-mono">[UNTIL WIPE]</div>
                    {Object.entries(totalUpkeep).map(([type, value]) => {
                      const total = Math.ceil(value * (countdown.days + countdown.hours / 24))
                      const boxSize = type === 'hqm' ? 4800 : 48000
                      const boxes = Math.ceil(total / boxSize)
                      return (
                        <div key={type} className="font-mono">
                          {type}: <span className="font-bold text-red-400">{formatNumber(total)}</span>
                          {total > 0 && <span className="text-orange-500 ml-1 text-[11px]">({boxes} {boxes === 1 ? 'box' : 'boxes'})</span>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
              
              {/* Upkeep List */}
              <div className="border border-orange-600/50 rounded max-h-40 overflow-y-auto overflow-x-hidden bg-gray-800">
                <div className="flex justify-between items-center p-2 border-b border-orange-600/50 text-xs font-medium text-orange-300 font-mono">
                  <div className="flex">
                    <span className="w-20">[GOOD FOR WIPE]</span>
                    <span className="border-l border-orange-600/50 pl-2 w-32">[NAME]</span>
                  </div>
                  <div className="flex items-center space-x-8">
                    <span className="w-40 text-center">[UPKEEP PER DAY]</span>
                    <div className="flex items-center space-x-1">
                      <span>[EDITS]</span>
                      <button
                        onClick={() => setShowModals(m => ({ ...m, upkeep: true }))}
                        className="w-4 h-4 bg-orange-600 text-white rounded-full text-xs hover:bg-orange-700 flex-shrink-0"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
                {upkeepEntries.length === 0 ? (
                  <div className="p-3 text-xs text-orange-500 text-center font-mono">No upkeep entries added</div>
                ) : (
                  upkeepEntries.map(entry => (
                    <div key={entry.id} className="flex justify-between text-xs p-2 border-b border-orange-600/30 last:border-b-0 text-orange-300">
                      <div className="flex">
                        <span className="w-20 font-mono">{/* TODO: Add Good for wipe function */}</span>
                        <span className="border-l border-orange-600/30 pl-2 w-32 truncate font-mono">{entry.name}</span>
                      </div>
                      <div className="flex items-center space-x-8">
                        <div className="flex space-x-2 w-40 justify-center font-mono">
                          {entry.stoneUpkeep > 0 && <span>S:{entry.stoneUpkeep}</span>}
                          {entry.metalUpkeep > 0 && <span>M:{entry.metalUpkeep}</span>}
                          {entry.hqmUpkeep > 0 && <span>H:{entry.hqmUpkeep}</span>}
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => {
                              setNewUpkeepEntry(entry)
                              setEditingUpkeepId(entry.id)
                              setShowModals(m => ({ ...m, upkeep: true }))
                            }}
                            className="text-blue-400 flex-shrink-0"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => setUpkeepEntries(entries => entries.filter(e => e.id !== entry.id))}
                            className="text-red-400 flex-shrink-0"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            {/* Middle - TC Boxes */}
            <div className="flex flex-col space-y-2">
              {Object.keys(TC_TYPES).map(type => (
                <TCBox 
                  key={type}
                  type={type}
                  countdown={countdown}
                  showGrid={showGrids[type]}
                  setShowGrid={show => setShowGrids(g => ({ ...g, [type]: show }))}
                  showBackpack={showBackpacks[type]}
                  setShowBackpack={show => setShowBackpacks(b => ({ ...b, [type]: show }))}
                />
              ))}
              
              {/* Custom Items */}
              {customItems.map(item => {
                const fractionalDays = countdown.days + (countdown.hours / 24)
                return (
                  <div key={item.id} className="border-t border-orange-600/50 pt-2">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-medium text-orange-300 font-mono">{item.name}</span>
                      <button
                        onClick={() => setCustomItems(items => items.filter(i => i.id !== item.id))}
                        className="text-red-400 text-xs"
                      >
                        🗑️
                      </button>
                    </div>
                    <div className="text-xs text-orange-400 font-mono">
                      <div>Cost: {item.stoneCost > 0 && `S:${item.stoneCost} `}{item.metalCost > 0 && `M:${item.metalCost} `}{item.hqmCost > 0 && `H:${item.hqmCost}`}</div>
                      <div>Upkeep: {item.stoneUpkeep > 0 && `S:${item.stoneUpkeep} `}{item.metalUpkeep > 0 && `M:${item.metalUpkeep} `}{item.hqmUpkeep > 0 && `H:${item.hqmUpkeep}`}</div>
                      <div>Total: {Math.ceil(item.stoneCost + item.stoneUpkeep * fractionalDays) > 0 && `S:${Math.ceil(item.stoneCost + item.stoneUpkeep * fractionalDays)} `}{Math.ceil(item.metalCost + item.metalUpkeep * fractionalDays) > 0 && `M:${Math.ceil(item.metalCost + item.metalUpkeep * fractionalDays)} `}{Math.ceil(item.hqmCost + item.hqmUpkeep * fractionalDays) > 0 && `H:${Math.ceil(item.hqmCost + item.hqmUpkeep * fractionalDays)}`}</div>
                    </div>
                  </div>
                )
              })}
              
              {/* Add Custom Item Button */}
              <button
                onClick={() => setShowModals(m => ({ ...m, item: true }))}
                className="text-xs bg-orange-600 text-white rounded px-2 py-1 hover:bg-orange-700 font-mono"
              >
                [ADD CUSTOM ITEM]
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}