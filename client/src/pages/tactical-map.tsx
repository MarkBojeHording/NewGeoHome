import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { MapPin, Home, Shield, Wheat, Castle, Tent, X, HelpCircle, Calculator } from 'lucide-react'
import BaseModal from '../components/BaseModal'

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
    const explo = Math.floor(adjustedRockets / 3)
    return { rockets: adjustedRockets, hv, incin, explo }
  }
}

// Base Report Preview Component
const BaseReportPreview = ({ report, onEdit, onOpen }) => {
  return (
    <div className="bg-gray-700 rounded p-3 border border-gray-600 hover:border-gray-500 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {/* Report type icon */}
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          
          {/* Report type */}
          <span className="text-white font-medium text-sm">
            {report.baseReportType}
          </span>
          
          {/* Edit button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit(report)
            }}
            className="w-4 h-4 text-gray-400 hover:text-blue-400 transition-colors ml-1"
            title="Edit report"
          >
            <svg fill="currentColor" viewBox="0 0 20 20" className="w-full h-full">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
            </svg>
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Time indicator */}
          {report.reportTime && (
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-400 text-xs">{report.reportTime}</span>
            </div>
          )}
          
          {/* Outcome indicator */}
          {report.reportOutcome && report.reportOutcome !== 'neutral' && (
            <div className={`w-3 h-3 rounded-full ${
              report.reportOutcome === 'success' ? 'bg-green-500' : 
              report.reportOutcome === 'failure' ? 'bg-red-500' : 'bg-yellow-500'
            }`}></div>
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
  
  // Add report to library (for use in BaseModal)
  const addToReportLibrary = useCallback((reportData) => {
    setReportLibrary(prev => [...prev, reportData])
  }, [])

  // Update existing report in library
  const updateReportLibrary = useCallback((updatedReport) => {
    setReportLibrary(prev => 
      prev.map(report => 
        report.id === updatedReport.id ? updatedReport : report
      )
    )
  }, [])
  
  const mapRef = useRef(null)
  
  const handleCancel = useCallback(() => {
    setNewBaseModal(prev => ({ ...prev, visible: false }))
    setEditingLocation(null)
    setEditingReport(null)
    setShowReportPanel(false)
    setShowAdvancedPanel(false)
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
        name: `Base-${Date.now()}`,
        x: newBaseModal.x,
        y: newBaseModal.y,
        ...baseData
      }
      setLocations(prev => [...prev, newLocation])
      setSelectedLocation(newLocation)
    }
    
    setNewBaseModal(prev => ({ ...prev, visible: false }))
    setEditingLocation(null)
  }, [editingLocation, newBaseModal])
  
  const handleDeleteLocation = useCallback(() => {
    if (editingLocation) {
      setLocations(prev => prev.filter(loc => loc.id !== editingLocation.id))
      setSelectedLocation(null)
      handleCancel()
    }
  }, [editingLocation, handleCancel])

  return (
    <div className="w-full h-screen bg-gray-900 text-white">
      <h1 className="text-center py-4 text-2xl font-bold">Tactical Map</h1>
      
      <div className="relative w-full h-96 bg-teal-500 mx-auto">
        {/* Map content would go here */}
      </div>

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
  )
}