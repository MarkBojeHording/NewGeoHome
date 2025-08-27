// Simple test component to verify badge display
import React from 'react'

const TestReportPreview = () => {
  // Test data exactly like what we see in the API
  const testReport = {
    id: 1,
    type: "general",
    notes: "PvP encounter at enemy base",
    playerTags: ["timtom", "billybob"],
    enemyPlayers: [],
    friendlyPlayers: []
  }

  return (
    <div style={{ padding: '20px', background: 'white', color: 'black' }}>
      <h3>Test Report Preview</h3>
      <p>Notes: {testReport.notes}</p>
      
      <div>
        <strong>Player Tags (should be blue badges):</strong>
        <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
          {testReport.playerTags && testReport.playerTags.map((playerTag, index) => (
            <span 
              key={index}
              style={{
                backgroundColor: '#3B82F6',
                color: 'white',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '10px'
              }}
            >
              {playerTag}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default TestReportPreview