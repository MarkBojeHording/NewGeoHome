import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { MapPin, Home, Shield, Wheat, Castle, Tent, X, HelpCircle, Calculator } from 'lucide-react'
import BaseModal from '../components/BaseModal'
import ReportModal from '../components/ReportModal'
import ContextMenu from '../components/ContextMenu'
import type { Location, LocationTimers, Timer, ModalState, ContextMenu as ContextMenuType, BaseType } from '../../shared/location-schema'
import type { Report, ReportLibrary, GeneralReport, BaseReport, GeneralReportType, BaseReportType } from '../../shared/report-schema'

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
const getColor = (type: string): string => {
  if (type.startsWith('report')) return 'text-purple-600'
  return type.startsWith('friendly') ? 'text-green-600' : 'text-red-600'
}

const getBorderColor = (type: string): string => {
  if (type.startsWith('report')) return 'border-purple-500'
  return type.startsWith('friendly') ? 'border-green-500' : 'border-red-500'
}

const getGridCoordinate = (x: number, y: number, existingLocations: Location[] = [], excludeId: string | null = null): string => {
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

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

// ============= CUSTOM HOOKS =============
const useLocationTimers = (): [LocationTimers, React.Dispatch<React.SetStateAction<LocationTimers>>] => {
  const [locationTimers, setLocationTimers] = useState<LocationTimers>({})

  useEffect(() => {
    const interval = setInterval(() => {
      setLocationTimers(prev => {
        const updated = { ...prev }
        Object.keys(updated).forEach(locationId => {
          updated[locationId] = updated[locationId]
            .map((timer: Timer) => ({
              ...timer,
              remaining: Math.max(0, timer.remaining - 1)
            }))
            .filter((timer: Timer) => timer.remaining > 0)
          
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
  const hasDraggedRef = useRef(false)
  const lastPanRef = useRef({ x: 0, y: 0 })

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setZoom(prevZoom => Math.max(0.5, Math.min(3, prevZoom * delta)))
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true)
    isDraggingRef.current = true
    hasDraggedRef.current = false
    lastPanRef.current = { x: e.clientX, y: e.clientY }
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDraggingRef.current) return
    
    const deltaX = e.clientX - lastPanRef.current.x
    const deltaY = e.clientY - lastPanRef.current.y
    
    if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
      hasDraggedRef.current = true
      setPan(prevPan => ({
        x: prevPan.x + deltaX,
        y: prevPan.y + deltaY
      }))
    }
    
    lastPanRef.current = { x: e.clientX, y: e.clientY }
  }, [])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    isDraggingRef.current = false
  }, [])

  return {
    zoom,
    pan,
    isDragging,
    hasDraggedRef,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp
  }
}

// ============= ICON FUNCTIONS =============
const getIconComponent = ({ name }: { name: string }) => {
  const IconComponent = ICON_MAP[name as keyof typeof ICON_MAP] || MapPin
  return <IconComponent className="h-4 w-4" />
}

const getIcon = (type: string) => {
  const iconMap = {
    'friendly-main': <Castle className="h-4 w-4" />,
    'friendly-flank': <Shield className="h-4 w-4" />,
    'friendly-farm': <Wheat className="h-4 w-4" />,
    'friendly-boat': <Home className="h-4 w-4" />,
    'friendly-garage': <Home className="h-4 w-4" />,
    'enemy-small': <Tent className="h-4 w-4" />,
    'enemy-medium': <Home className="h-4 w-4" />,
    'enemy-large': <Castle className="h-4 w-4" />,
    'enemy-flank': <Shield className="h-4 w-4" />,
    'enemy-tower': <Castle className="h-4 w-4" />,
    'enemy-farm': <Wheat className="h-4 w-4" />,
    'enemy-decaying': <Home className="h-4 w-4" />,
    'report-pvp': <MapPin className="h-4 w-4" />,
    'report-spotted': <MapPin className="h-4 w-4" />,
    'report-bradley': <MapPin className="h-4 w-4" />,
    'report-oil': <MapPin className="h-4 w-4" />,
    'report-monument': <MapPin className="h-4 w-4" />,
    'report-farming': <MapPin className="h-4 w-4" />,
    'report-loaded': <MapPin className="h-4 w-4" />,
    'report-raid': <MapPin className="h-4 w-4" />
  }
  
  return iconMap[type as keyof typeof iconMap] || <MapPin className="h-4 w-4" />
}

// ============= TIMER COMPONENTS =============
interface TimerDisplayProps {
  timers: LocationTimers
  onRemoveTimer: (timerId: string) => void
}

const TimerDisplay = ({ timers, onRemoveTimer }: TimerDisplayProps) => {
  const allTimers = Object.values(timers).flat()
  
  return (
    <>
      {allTimers.map((timer: Timer) => (
        <div key={timer.id} className="absolute -top-8 left-0 bg-gray-800 px-1 py-0.5 rounded text-xs text-white whitespace-nowrap">
          {formatTime(timer.remaining)}
          <button onClick={(e) => {
            e.stopPropagation()
            onRemoveTimer(timer.id)
          }} className="ml-1 text-red-400 hover:text-red-300">×</button>
        </div>
      ))}
    </>
  )
}

// ============= LOCATION COMPONENTS =============
interface LocationMarkerProps {
  location: Location | GeneralReport
  isSelected: boolean
  onClick: (location: Location | GeneralReport) => void
  timers: LocationTimers
  onRemoveTimer: (timerId: string) => void
  getOwnedBases: (ownerName: string) => Location[]
  onOpenReport: (reportId: string) => void
}

const LocationMarker = ({ 
  location, 
  isSelected, 
  onClick, 
  timers, 
  onRemoveTimer, 
  getOwnedBases, 
  onOpenReport 
}: LocationMarkerProps) => (
  <div
    className="absolute z-20 cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
    style={{
      left: `${location.x}%`,
      top: `${location.y}%`
    }}
    onClick={(e) => {
      e.stopPropagation()
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
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: '32px',
          height: '32px',
          border: '2px solid rgba(59, 130, 246, 0.8)',
          borderRadius: '50%',
          animation: 'pulse 2s infinite'
        }} />
      )}
      
      {/* Base name label */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 pointer-events-none">
        <div className="bg-gray-900 text-white text-xs px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap">
          {'name' in location ? location.name : `Report ${location.id.slice(0, 8)}`}
        </div>
      </div>
      
      {/* Report icon */}
      {location.type.startsWith('report') && (
        <div className="absolute -top-1 -right-1 z-10 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation()
            console.log("Write report")
            onOpenReport(location.id)
          }}
        >
          <div className="w-3 h-3 bg-purple-600 rounded-full flex items-center justify-center">
            <svg className="w-2 h-2 text-white" viewBox="0 0 16 16" fill="currentColor">
              <path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
            </svg>
          </div>
        </div>
      )}
      
      {/* Badges for report outcomes */}
      {location.type.startsWith('report') && 'outcome' in location && location.outcome && location.outcome !== 'neutral' && (
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
    </div>
  </div>
)

// ============= MAIN COMPONENT =============
export default function InteractiveTacticalMap() {
  // ============= STATE =============
  const [locations, setLocations] = useState<Location[]>([])
  const [selectedLocation, setSelectedLocation] = useState<Location | GeneralReport | null>(null)
  const [newBaseModal, setNewBaseModal] = useState<ModalState>({ x: 0, y: 0, visible: false })
  const [modalType, setModalType] = useState<string>("")
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [editingReport, setEditingReport] = useState<GeneralReport | null>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenuType>({ x: 0, y: 0, visible: false })
  const [reportLibrary, setReportLibrary] = useState<Report[]>([])
  const [reportCounter, setReportCounter] = useState(1)
  const [locationTimers, setLocationTimers] = useLocationTimers()
  const [showAdvancedPanel, setShowAdvancedPanel] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportModalType, setReportModalType] = useState<'general' | 'base'>('general')
  const [reportModalLocation, setReportModalLocation] = useState<Location | null>(null)
  
  // ============= REPORT MANAGEMENT =============
  const addToReportLibrary = useCallback((reportData: Report) => {
    setReportLibrary(prev => [...prev, reportData])
  }, [])

  const updateReportLibrary = useCallback((updatedReport: Report) => {
    setReportLibrary(prev => 
      prev.map(report => 
        report.id === updatedReport.id ? updatedReport : report
      )
    )
  }, [])

  // ============= BASE MANAGEMENT =============
  const getOwnedBases = useCallback((ownerName: string) => {
    return locations.filter(location => 
      location.ownerCoordinates && location.ownerCoordinates.split(',').map(s => s.trim()).includes(ownerName)
    )
  }, [locations])

  const { zoom, pan, isDragging, hasDraggedRef, handleWheel, handleMouseDown, handleMouseMove, handleMouseUp } = useMapInteraction()

  const handleMapClick = useCallback((e: React.MouseEvent) => {
    if (!hasDraggedRef.current) {
      const rect = (e.target as Element).getBoundingClientRect()
      const centerX = rect.width / 2
      const centerY = rect.height / 2
      
      const clickX = e.clientX - rect.left
      const clickY = e.clientY - rect.top
      
      const x = ((clickX - centerX - pan.x) / zoom + centerX) / rect.width * 100
      const y = ((clickY - centerY - pan.y) / zoom + centerY) / rect.height * 100
      if (x >= 0 && x <= 100 && y >= 0 && y <= 100) {
        setContextMenu({ x: e.clientX, y: e.clientY, visible: true })
        console.log("Context menu should be visible at:", e.clientX, e.clientY)
        setNewBaseModal({ x, y, visible: false })
      }
    }
  }, [pan, zoom, hasDraggedRef])
  
  const handleAddBase = useCallback((type: string) => {
    setContextMenu(prev => ({ ...prev, visible: false }))
    setEditingLocation(null)
    setEditingReport(null)
    setModalType(type)
    console.log("Modal type set to:", type, "Modal should be visible:", true)
    setNewBaseModal(prev => ({ ...prev, visible: true }))
  }, [])

  const handleEditLocation = useCallback((location: Location) => {
    setEditingLocation(location)
    setEditingReport(null)
    setModalType(location.type)
    setNewBaseModal({ x: location.x, y: location.y, visible: true })
  }, [])

  const handleSaveBase = useCallback((baseData: Partial<Location>) => {
    if (editingLocation) {
      setLocations(prev => prev.map(loc => 
        loc.id === editingLocation.id ? { ...loc, ...baseData } : loc
      ))
      setSelectedLocation({ ...editingLocation, ...baseData } as Location)
    } else {
      const newLocation: Location = {
        id: Date.now().toString(),
        name: getGridCoordinate(newBaseModal.x, newBaseModal.y, locations, null),
        x: newBaseModal.x,
        y: newBaseModal.y,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...baseData
      } as Location
      setLocations(prev => [...prev, newLocation])
      setSelectedLocation(newLocation)
    }
    
    setNewBaseModal(prev => ({ ...prev, visible: false }))
    setEditingLocation(null)
  }, [editingLocation, newBaseModal, locations])

  const handleDeleteBase = useCallback(() => {
    if (editingLocation) {
      setLocations(prev => prev.filter(loc => loc.id !== editingLocation.id))
      setLocationTimers(prev => {
        const updated = { ...prev }
        const timersToRemove = updated[editingLocation.id] || []
        timersToRemove.forEach(t => delete updated[t.id])
        return updated
      })
      setSelectedLocation(null)
    }
    setNewBaseModal(prev => ({ ...prev, visible: false }))
    setEditingLocation(null)
  }, [editingLocation, setLocationTimers])

  const handleCloseModal = useCallback(() => {
    setNewBaseModal(prev => ({ ...prev, visible: false }))
    setEditingLocation(null)
    setEditingReport(null)
  }, [])

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, visible: false }))
  }, [])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCloseModal()
      handleCloseContextMenu()
    }
  }, [handleCloseModal, handleCloseContextMenu])

  const handleRemoveTimer = useCallback((locationId: string, timerId: string) => {
    setLocationTimers(prev => ({
      ...prev,
      [locationId]: (prev[locationId] || []).filter(t => t.id !== timerId)
    }))
  }, [setLocationTimers])

  const handleAddTimer = useCallback((locationId: string, timer: Omit<Timer, 'id' | 'createdAt'>) => {
    setLocationTimers(prev => ({
      ...prev,
      [locationId]: [...(prev[locationId] || []), { 
        ...timer, 
        id: Date.now().toString(),
        createdAt: new Date()
      }]
    }))
  }, [setLocationTimers])

  const handleOpenReport = useCallback((reportId: string) => {
    console.log("Write report")
    // Find the report in the library and set it for editing
    const report = reportLibrary.find(r => r.id === reportId)
    if (report) {
      setEditingReport(report as GeneralReport)
      setReportModalType(report.type)
      setReportModalLocation({ 
        id: report.id, 
        name: getGridCoordinate(report.x, report.y, locations),
        x: report.x, 
        y: report.y, 
        type: 'friendly-main', 
        createdAt: new Date(),
        updatedAt: new Date()
      })
      setShowReportModal(true)
    }
  }, [reportLibrary, locations])

  const handleOpenGeneralReport = useCallback(() => {
    setEditingReport(null)
    setReportModalType('general')
    setReportModalLocation({
      id: Date.now().toString(),
      name: getGridCoordinate(newBaseModal.x, newBaseModal.y, locations),
      x: newBaseModal.x,
      y: newBaseModal.y,
      type: 'friendly-main',
      createdAt: new Date(),
      updatedAt: new Date()
    })
    setShowReportModal(true)
    setContextMenu(prev => ({ ...prev, visible: false }))
  }, [newBaseModal, locations])

  const handleOpenBaseReport = useCallback((base: Location) => {
    setEditingReport(null)
    setReportModalType('base')
    setReportModalLocation(base)
    setShowReportModal(true)
  }, [])

  const handleSaveReport = useCallback((reportData: Partial<Report>) => {
    const newReport: Report = {
      id: editingReport?.id || Date.now().toString(),
      createdAt: editingReport?.createdAt || new Date(),
      updatedAt: new Date(),
      ...reportData
    } as Report

    if (editingReport) {
      updateReportLibrary(newReport)
    } else {
      addToReportLibrary(newReport)
    }

    setShowReportModal(false)
    setEditingReport(null)
    setReportModalLocation(null)
  }, [editingReport, addToReportLibrary, updateReportLibrary])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // ============= RENDER =============
  const allItems = useMemo(() => {
    const generalReports = reportLibrary.filter(r => r.type === 'general') as GeneralReport[]
    return [...locations, ...generalReports]
  }, [locations, reportLibrary])

  const locationMarkers = allItems.map(location => {
    const isSelected = selectedLocation?.id === location.id
    const locationTimersForThisLocation = locationTimers[location.id] || []
    
    return (
      <LocationMarker
        key={location.id}
        location={location}
        isSelected={isSelected}
        onClick={setSelectedLocation}
        timers={{ [location.id]: locationTimersForThisLocation }}
        onRemoveTimer={(timerId: string) => handleRemoveTimer(location.id, timerId)}
        getOwnedBases={getOwnedBases}
        onOpenReport={handleOpenReport}
      />
    )
  })

  return (
    <div className="relative w-full h-screen bg-gray-900 overflow-hidden">
      <div
        className="absolute inset-0 bg-center bg-no-repeat"
        style={{
          backgroundImage: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
          backgroundSize: 'contain',
          transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
          transformOrigin: 'center center',
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleMapClick}
      >
        {locationMarkers}
      </div>
      
      {/* Context Menu */}
      <ContextMenu
        x={contextMenu.x}
        y={contextMenu.y}
        visible={contextMenu.visible}
        onAddBase={handleAddBase}
        onAddReport={handleOpenGeneralReport}
        onClose={handleCloseContextMenu}
      />
      
      {/* BaseModal */}
      <BaseModal
        modal={newBaseModal}
        modalType={modalType}
        editingLocation={editingLocation}
        locations={locations}
        onSave={handleSaveBase}
        onCancel={handleCloseModal}
        onDelete={handleDeleteBase}
        editingReport={editingReport}
        reportLibrary={reportLibrary}
        addToReportLibrary={addToReportLibrary}
        updateReportLibrary={updateReportLibrary}
        reportCounter={reportCounter}
        onOpenBaseReport={handleOpenBaseReport}
      />
      
      {/* Report Modal */}
      {showReportModal && reportModalLocation && (
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          onSave={handleSaveReport}
          reportType={reportModalType}
          location={reportModalLocation}
          baseLocation={reportModalType === 'base' ? reportModalLocation : undefined}
          editingReport={editingReport}
        />
      )}
    </div>
  )
}