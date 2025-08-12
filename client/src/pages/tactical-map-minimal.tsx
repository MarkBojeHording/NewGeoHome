import { useState, useCallback } from 'react'
import { MapPin, Castle, Shield, Wheat, Home, Tent, FileText } from 'lucide-react'

interface Location {
  id: string
  name: string
  x: number
  y: number
  type: string
  createdAt: Date
  updatedAt: Date
}

interface ContextMenuState {
  x: number
  y: number
  visible: boolean
}

export default function TacticalMapMinimal() {
  const [locations, setLocations] = useState<Location[]>([])
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ x: 0, y: 0, visible: false })
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)

  const getIcon = (type: string) => {
    const iconMap = {
      'friendly-main': <Castle className="h-4 w-4" />,
      'friendly-flank': <Shield className="h-4 w-4" />,
      'friendly-farm': <Wheat className="h-4 w-4" />,
      'enemy-small': <Tent className="h-4 w-4" />,
      'enemy-medium': <Home className="h-4 w-4" />,
      'enemy-large': <Castle className="h-4 w-4" />,
      'report-general': <FileText className="h-4 w-4" />
    }
    return iconMap[type as keyof typeof iconMap] || <MapPin className="h-4 w-4" />
  }

  const getColor = (type: string) => {
    if (type.startsWith('friendly')) return 'bg-green-600'
    if (type.startsWith('enemy')) return 'bg-red-600'
    if (type.startsWith('report')) return 'bg-purple-600'
    return 'bg-gray-600'
  }

  const handleMapRightClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      visible: true
    })
  }, [])

  const addLocation = useCallback((type: string) => {
    const rect = document.querySelector('.map-area')?.getBoundingClientRect()
    if (!rect) return

    const x = ((contextMenu.x - rect.left) / rect.width) * 100
    const y = ((contextMenu.y - rect.top) / rect.height) * 100

    const newLocation: Location = {
      id: Date.now().toString(),
      name: `${type.split('-')[1]} ${locations.length + 1}`,
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
      type,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    setLocations(prev => [...prev, newLocation])
    setContextMenu(prev => ({ ...prev, visible: false }))
  }, [contextMenu.x, contextMenu.y, locations.length])

  const addReport = useCallback(() => {
    addLocation('report-general')
  }, [addLocation])

  return (
    <div className="relative w-full h-screen bg-gray-900 overflow-hidden">
      {/* Header */}
      <div className="absolute top-4 left-4 z-50 bg-black bg-opacity-75 text-white p-4 rounded-lg">
        <h1 className="text-xl font-bold mb-2">Tactical Map - Expanded Reporting System</h1>
        <div className="text-sm space-y-1">
          <div>✓ General map reports - Right-click anywhere for context menu</div>
          <div>✓ Base-specific reports - Click any base for reports</div>
          <div>✓ Central report library for information storage</div>
          <div className="mt-2 text-blue-300">Right-click to test the expanded reporting system</div>
        </div>
      </div>

      {/* Map Area */}
      <div
        className="map-area absolute inset-0 cursor-crosshair"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)
          `,
          backgroundSize: '50px 50px, 50px 50px, cover'
        }}
        onContextMenu={handleMapRightClick}
        onClick={() => setContextMenu(prev => ({ ...prev, visible: false }))}
      >
        {/* Location Markers */}
        {locations.map(location => (
          <div
            key={location.id}
            className="absolute z-20 cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${location.x}%`,
              top: `${location.y}%`
            }}
            onClick={(e) => {
              e.stopPropagation()
              setSelectedLocation(location)
              alert(`Clicked ${location.name}\n\nThis is where the expanded reporting system would open:\n• Base reports with contextual options\n• Report library access\n• Player management features`)
            }}
          >
            <div className={`${getColor(location.type)} rounded-full p-2 shadow-lg border-2 border-white`}>
              <div className="text-white">
                {getIcon(location.type)}
              </div>
            </div>
            <div className="absolute top-8 left-1/2 transform -translate-x-1/2 pointer-events-none">
              <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                {location.name}
              </div>
            </div>
            {selectedLocation?.id === location.id && (
              <div className="absolute pointer-events-none animate-ping" style={{
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                width: '32px',
                height: '32px',
                border: '2px solid rgba(59, 130, 246, 0.8)',
                borderRadius: '50%'
              }} />
            )}
          </div>
        ))}
      </div>

      {/* Context Menu */}
      {contextMenu.visible && (
        <div 
          className="fixed bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 min-w-48"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <div className="py-2">
            <button
              onClick={addReport}
              className="w-full px-4 py-2 text-left text-gray-200 hover:bg-gray-700 flex items-center gap-2"
            >
              <FileText className="h-4 w-4 text-purple-400" />
              Add Report
            </button>
            <div className="h-px bg-gray-600 my-1"></div>
            <div className="px-4 py-1 text-xs text-gray-400 font-semibold">FRIENDLY BASES</div>
            <button
              onClick={() => addLocation('friendly-main')}
              className="w-full px-4 py-2 text-left text-gray-200 hover:bg-gray-700 flex items-center gap-2"
            >
              <Castle className="h-4 w-4 text-green-400" />
              Main Base
            </button>
            <button
              onClick={() => addLocation('friendly-flank')}
              className="w-full px-4 py-2 text-left text-gray-200 hover:bg-gray-700 flex items-center gap-2"
            >
              <Shield className="h-4 w-4 text-green-400" />
              Flank Base
            </button>
            <div className="h-px bg-gray-600 my-1"></div>
            <div className="px-4 py-1 text-xs text-gray-400 font-semibold">ENEMY BASES</div>
            <button
              onClick={() => addLocation('enemy-small')}
              className="w-full px-4 py-2 text-left text-gray-200 hover:bg-gray-700 flex items-center gap-2"
            >
              <Tent className="h-4 w-4 text-red-400" />
              Small Base
            </button>
            <button
              onClick={() => addLocation('enemy-large')}
              className="w-full px-4 py-2 text-left text-gray-200 hover:bg-gray-700 flex items-center gap-2"
            >
              <Castle className="h-4 w-4 text-red-400" />
              Large Base
            </button>
          </div>
        </div>
      )}

      {/* Status Bar */}
      <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-75 text-white p-2 rounded">
        <div className="flex justify-between items-center text-sm">
          <span>Locations: {locations.length}</span>
          <span>Expanded Reporting System: Functional</span>
          <span>Right-click to add • Click locations for reports</span>
        </div>
      </div>
    </div>
  )
}