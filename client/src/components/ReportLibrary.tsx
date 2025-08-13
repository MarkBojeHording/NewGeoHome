import React from 'react'

interface Report {
  id: number
  title: string
  location: string
  time: string
  outcome: 'won' | 'lost' | 'neutral'
  enemyPlayers?: string
  friendlyPlayers?: string
  notes?: string
}

interface ReportLibraryProps {
  isVisible: boolean
  onClose: () => void
  reports: Report[]
}

const ReportLibrary: React.FC<ReportLibraryProps> = ({ isVisible, onClose, reports }) => {
  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-y-auto border border-gray-600">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Report Library</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-4">
          {reports.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No reports saved yet</p>
          ) : (
            reports.map((report) => (
              <div key={report.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-white font-medium">{report.title}</h3>
                    <p className="text-gray-400 text-sm">{report.location} • {report.time}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    report.outcome === 'won' ? 'bg-green-600 text-white' : 
                    report.outcome === 'lost' ? 'bg-red-600 text-white' : 
                    'bg-gray-600 text-white'
                  }`}>
                    {report.outcome}
                  </span>
                </div>
                
                {report.enemyPlayers && (
                  <div className="mb-2">
                    <p className="text-red-400 text-sm font-medium">Enemy Players:</p>
                    <p className="text-gray-300 text-sm">{report.enemyPlayers}</p>
                  </div>
                )}
                
                {report.friendlyPlayers && (
                  <div className="mb-2">
                    <p className="text-green-400 text-sm font-medium">Friendly Players:</p>
                    <p className="text-gray-300 text-sm">{report.friendlyPlayers}</p>
                  </div>
                )}
                
                {report.notes && (
                  <div>
                    <p className="text-blue-400 text-sm font-medium">Notes:</p>
                    <p className="text-gray-300 text-sm">{report.notes}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default ReportLibrary