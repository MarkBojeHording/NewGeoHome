import { useState, useEffect, useRef, useCallback } from 'react'

const LABELS = {
  'friendly-main': 'Main',
  'friendly-secondary': 'Secondary',
  'friendly-outpost': 'Outpost',
  'friendly-small': 'Small',
  'friendly-1x1': '1x1',
  'friendly-2x2': '2x2',
  'friendly-3x3': '3x3',
  'friendly-4x4': '4x4',
  'enemy-small': 'Small',
  'enemy-medium': 'Medium',
  'enemy-large': 'Large',
  'enemy-compound': 'Compound',
  'enemy-fortress': 'Fortress',
  'enemy-farm': 'Farm',
  'enemy-flank': 'Flank',
  'enemy-tower': 'Tower',
  'report-pvp': 'PvP',
  'report-heli': 'Heli',
  'report-bradley': 'Bradley'
}

const MATERIAL_ICONS = {
  wood: '🪵',
  stone: '🪨',
  metal: '🔩',
  hqm: '⚙️'
}

const MATERIAL_LABELS = {
  wood: 'Wood',
  stone: 'Stone',
  metal: 'Metal Frags',
  hqm: 'HQM'
}

const RocketCalculator = ({ position, visible, onClose }: { position: any, visible: boolean, onClose: () => void }) => {
  const [materials, setMaterials] = useState({
    wood: 0,
    stone: 0,
    metal: 0,
    hqm: 0
  })

  const [rocketCount, setRocketCount] = useState(1)

  const calculateCost = () => {
    const costPerRocket = { gunpowder: 150, metal: 5 }
    return {
      gunpowder: costPerRocket.gunpowder * rocketCount,
      metal: costPerRocket.metal * rocketCount
    }
  }

  if (!visible) return null

  const cost = calculateCost()

  return (
    <div
      className="absolute z-50 bg-gray-800 border border-gray-600 rounded-lg shadow-xl p-4 min-w-80"
      style={{ left: position.x, top: position.y }}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white font-bold">Rocket Calculator</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="space-y-3 mb-4">
        <div>
          <label className="block text-white text-sm mb-1">Number of Rockets</label>
          <input
            type="number"
            value={rocketCount}
            onChange={(e) => setRocketCount(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            min="1"
          />
        </div>
      </div>

      <div className="bg-gray-700 rounded p-3">
        <h4 className="text-white font-semibold mb-2">Cost Breakdown</h4>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between text-white">
            <span>Gunpowder:</span>
            <span>{cost.gunpowder.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-white">
            <span>Metal Frags:</span>
            <span>{cost.metal.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

const RaidedOutPrompt = ({ onConfirm, onCancel }: { onConfirm: () => void, onCancel: () => void }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-gray-800 p-6 rounded-lg shadow-xl border border-gray-600 max-w-md">
      <h3 className="text-white font-bold mb-4">Raided Out?</h3>
      <p className="text-gray-300 mb-6">
        This base appears to be raided out. Would you like to mark it as such?
      </p>
      <div className="flex gap-3">
        <button
          onClick={onConfirm}
          className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
        >
          Yes, Raided Out
        </button>
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
        >
          No, Still Active
        </button>
      </div>
    </div>
  </div>
)

const BaseReportPreview = ({ report, onEdit, onOpen }: { report: any, onEdit: (report: any) => void, onOpen: (report: any) => void }) => {
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

interface BaseModalProps {
  modal: { x: number; y: number; visible: boolean }
  modalType: string
  editingLocation: any
  editingReport: any
  locations: any[]
  onSave: (data: any) => void
  onCancel: () => void
  onDelete: () => void
  reportLibrary: any[]
  addToReportLibrary: (report: any) => void
  updateReportLibrary: (report: any) => void
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
}: BaseModalProps) => {
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
  
  const handleToggleRocketCalculator = useCallback((e: any) => {
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
      // Editing an existing location
      setFormData({
        type: editingLocation.type,
        notes: editingLocation.notes || '',
        oldestTC: editingLocation.oldestTC || 0,
        players: editingLocation.players || '',
        upkeep: editingLocation.upkeep || { wood: 0, stone: 0, metal: 0, hqm: 0 },
        reportTime: editingLocation.time || new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
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
    } else {
      // Creating new - reset to defaults
      setFormData({
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
        baseReportType: modalType === 'base-report' ? 'Base Raided' : ''
      })
    }
  }, [editingLocation, editingReport, modalType])

  // Get base reports for current location
  const getBaseReports = useCallback((baseId: any) => {
    return reportLibrary.filter(report => 
      report.type === 'base-report' && report.locationId === baseId
    )
  }, [reportLibrary])

  // Open full report for viewing/editing
  const openFullReport = useCallback((report: any) => {
    // This would open the report in full view mode
    console.log('Opening full report:', report)
    // TODO: Implement full report view modal
  }, [])

  // Edit base report - Note: This function is for display only in the BaseModal
  // The actual edit functionality is handled by the parent component
  const editBaseReport = useCallback((report: any) => {
    console.log('Edit base report:', report)
    // This would trigger the parent's edit functionality
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
      description: (LABELS as any)[formData.type] || formData.type,
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

  const getOwnerSuggestions = useCallback(() => {
    const suggestions = new Set()
    locations.forEach(loc => {
      if (loc.ownerCoordinates) {
        suggestions.add(loc.ownerCoordinates)
      }
    })
    return Array.from(suggestions)
  }, [locations])

  const getTypeOptions = () => {
    if (modalType === 'friendly') {
      return [
        { value: 'friendly-main', label: 'Main' },
        { value: 'friendly-secondary', label: 'Secondary' },
        { value: 'friendly-outpost', label: 'Outpost' },
        { value: 'friendly-small', label: 'Small' },
        { value: 'friendly-1x1', label: '1x1' },
        { value: 'friendly-2x2', label: '2x2' },
        { value: 'friendly-3x3', label: '3x3' },
        { value: 'friendly-4x4', label: '4x4' }
      ]
    } else if (modalType === 'enemy') {
      return [
        { value: 'enemy-small', label: 'Small' },
        { value: 'enemy-medium', label: 'Medium' },
        { value: 'enemy-large', label: 'Large' },
        { value: 'enemy-compound', label: 'Compound' },
        { value: 'enemy-fortress', label: 'Fortress' },
        { value: 'enemy-farm', label: 'Farm' },
        { value: 'enemy-flank', label: 'Flank' },
        { value: 'enemy-tower', label: 'Tower' }
      ]
    } else if (modalType === 'base-report') {
      // Dynamic options based on base type
      const baseType = editingLocation?.type
      if (baseType?.startsWith('friendly')) {
        return [
          { value: 'Base Raided', label: 'Base Raided' },
          { value: 'MLRS\'d', label: 'MLRS\'d' },
          { value: 'Enemy built in', label: 'Enemy built in' }
        ]
      } else if (baseType?.startsWith('enemy')) {
        return [
          { value: 'Base Raided', label: 'Base Raided' },
          { value: 'MLRS\'d', label: 'MLRS\'d' },
          { value: 'We grubbed', label: 'We grubbed' },
          { value: 'Caught moving loot', label: 'Caught moving loot' }
        ]
      } else {
        return [
          { value: 'Base Raided', label: 'Base Raided' },
          { value: 'MLRS\'d', label: 'MLRS\'d' }
        ]
      }
    } else {
      return [
        { value: 'report-pvp', label: 'PvP' },
        { value: 'report-heli', label: 'Heli' },
        { value: 'report-bradley', label: 'Bradley' }
      ]
    }
  }

  console.log('BaseModal render check:', { modalVisible: modal.visible, modalType, modal })
  if (!modal.visible) return null

  console.log('BaseModal is about to render!')
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{ zIndex: 9999 }}>
      <div className="bg-gradient-to-b from-gray-700 to-gray-800 rounded-xl shadow-2xl border border-gray-600 max-w-md w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-600 to-gray-700 p-4 border-b border-gray-600">
            <div className="flex justify-between items-center">
              <h3 className="text-white font-bold">
                {modalType === 'base-report' ? (editingReport ? 'Edit Base Report' : 'Write Base Report') : 
                 editingLocation ? `Edit ${modalType.charAt(0).toUpperCase() + modalType.slice(1)} Base` : 
                 `Add ${modalType.charAt(0).toUpperCase() + modalType.slice(1)} Base`}
              </h3>
              <button
                onClick={onCancel}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {modalType === 'base-report' ? (
              <>
                {/* Base Report Panel */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-white text-sm font-medium mb-1">Report Type</label>
                    <select
                      value={formData.baseReportType}
                      onChange={(e) => setFormData(prev => ({ ...prev, baseReportType: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none"
                    >
                      {getTypeOptions().map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-white text-sm font-medium mb-1">Report Time</label>
                    <input
                      type="time"
                      value={formData.reportTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, reportTime: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-white text-sm font-medium mb-1">Outcome</label>
                    <select
                      value={formData.reportOutcome}
                      onChange={(e) => setFormData(prev => ({ ...prev, reportOutcome: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none"
                    >
                      <option value="neutral">Neutral</option>
                      <option value="success">Success</option>
                      <option value="failure">Failure</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-white text-sm font-medium mb-1">Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none resize-none"
                      rows={3}
                      placeholder="Additional details about the report..."
                    />
                  </div>
                </div>

                {/* Base Report Previews */}
                <div className="flex-1 overflow-y-auto space-y-2">
                  {getBaseReports(editingLocation?.id).length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-gray-500 mb-2">
                        No reports found for this base
                      </div>
                      <div className="text-gray-600 text-sm">
                        Create your first report using the form above
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="text-white font-medium mb-2">
                        Previous Reports ({getBaseReports(editingLocation?.id).length})
                      </div>
                      {getBaseReports(editingLocation?.id).map((report) => (
                        <BaseReportPreview
                          key={report.id}
                          report={report}
                          onEdit={editBaseReport}
                          onOpen={openFullReport}
                        />
                      ))}
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Regular base/report form */}
                <div>
                  <label className="block text-white text-sm font-medium mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none"
                  >
                    {getTypeOptions().map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Rest of the regular form fields... */}
                <div>
                  <label className="block text-white text-sm font-medium mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none resize-none"
                    rows={3}
                    placeholder="Additional information..."
                  />
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-600 bg-gray-750">
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors font-medium"
              >
                {modalType === 'base-report' ? (editingReport ? 'Update Report' : 'Create Report') : 'Save'}
              </button>
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
              >
                Cancel
              </button>
              {editingLocation && modalType !== 'base-report' && (
                <button
                  onClick={onDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Rocket Calculator */}
        <RocketCalculator
          position={rocketCalculatorPosition}
          visible={showRocketCalculator}
          onClose={() => setShowRocketCalculator(false)}
        />

        {/* Raided Out Prompt */}
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

export default BaseModal