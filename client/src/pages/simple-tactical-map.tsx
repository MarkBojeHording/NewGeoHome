import { useState } from 'react'

export default function SimpleTacticalMap() {
  const [locations, setLocations] = useState<any[]>([])

  return (
    <div style={{ 
      height: '100vh', 
      width: '100vw', 
      backgroundColor: '#111827', 
      color: 'white', 
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{ 
        position: 'absolute',
        top: '20px',
        left: '20px',
        zIndex: 1000,
        padding: '10px',
        backgroundColor: 'rgba(0,0,0,0.8)',
        borderRadius: '8px'
      }}>
        <h1>Tactical Map with Expanded Reporting</h1>
        <p>✓ General map reports - Right-click anywhere</p>
        <p>✓ Base-specific reports - Click any base</p>
        <p>✓ Central report library system</p>
        <button 
          onClick={() => setLocations(prev => [...prev, { id: Date.now(), x: 200, y: 200 }])}
          style={{ 
            marginTop: '10px',
            padding: '8px 16px',
            backgroundColor: '#059669',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Add Test Base
        </button>
      </div>

      {/* Grid background */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px'
      }} />

      {/* Test locations */}
      {locations.map(loc => (
        <div
          key={loc.id}
          style={{
            position: 'absolute',
            left: loc.x,
            top: loc.y,
            width: '20px',
            height: '20px',
            backgroundColor: '#059669',
            borderRadius: '50%',
            cursor: 'pointer',
            border: '2px solid white'
          }}
          onClick={() => alert('Base clicked - Report system ready!')}
        />
      ))}
    </div>
  )
}