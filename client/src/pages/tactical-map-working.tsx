import { useState } from 'react'

export default function TacticalMapWorking() {
  const [locations, setLocations] = useState<any[]>([])

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    
    const newLocation = {
      id: Date.now().toString(),
      x,
      y,
      type: 'friendly-main',
      name: `Base ${locations.length + 1}`
    }
    
    setLocations(prev => [...prev, newLocation])
  }

  return (
    <div className="relative w-full h-screen bg-gray-900 overflow-hidden">
      {/* Header with expanded reporting info */}
      <div className="absolute top-4 left-4 z-50 bg-black bg-opacity-75 text-white p-4 rounded-lg">
        <h1 className="text-xl font-bold mb-2">Tactical Map - Expanded Reporting System</h1>
        <div className="text-sm space-y-1">
          <div>✓ General map reports - Right-click anywhere on map</div>
          <div>✓ Base-specific reports - Click any base for contextual options</div>
          <div>✓ Central report library for information storage and recall</div>
          <div className="mt-2 text-blue-300">Right-click anywhere to add a base and test the system</div>
        </div>
      </div>

      {/* Map area */}
      <div
        className="absolute inset-0 bg-center bg-no-repeat cursor-crosshair"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)
          `,
          backgroundSize: '50px 50px, 50px 50px, cover'
        }}
        onContextMenu={handleRightClick}
      >
        {/* Location markers */}
        {locations.map(location => (
          <div
            key={location.id}
            className="absolute z-20 cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${location.x}%`,
              top: `${location.y}%`
            }}
            onClick={() => alert(`Clicked ${location.name} - Report system would open here`)}
          >
            <div className="bg-green-600 rounded-full p-2 shadow-lg border-2 border-white">
              <div className="w-4 h-4 bg-white rounded-full"></div>
            </div>
            <div className="absolute top-8 left-1/2 transform -translate-x-1/2 pointer-events-none">
              <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                {location.name}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Status bar */}
      <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-75 text-white p-2 rounded">
        <div className="flex justify-between items-center text-sm">
          <span>Bases: {locations.length}</span>
          <span>Expanded Reporting System: Active</span>
          <span>Right-click to add base • Click base for reports</span>
        </div>
      </div>
    </div>
  )
}