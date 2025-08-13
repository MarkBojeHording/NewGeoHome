import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { X, Calculator, Target, Timer, Trash2, Plus, Minus, ChevronDown, ChevronUp, Shield, Crosshair, Flame, Bomb, Zap, Building, TrendingUp, Users, Clock, FileText, Camera, MapPin, Home, ShoppingCart, Anchor, Car, Sword, Eye, AlertTriangle, Mountain, Skull, Crown, Factory } from 'lucide-react'

// Import all the constants and helper functions from the original BaseModal
const LABELS = {
  'friendly-main': 'Main Base',
  'friendly-flank': 'Flank Base', 
  'friendly-farm': 'Farm Base',
  'friendly-boat': 'Boat Base',
  'friendly-garage': 'Garage Base',
  'enemy-small': 'Small Base',
  'enemy-medium': 'Medium Base', 
  'enemy-large': 'Large Base',
  'enemy-flank': 'Flank Base',
  'enemy-farm': 'Farm Base',
  'enemy-tower': 'Tower Base',
  'report-pvp': 'PVP General',
  'report-spotted': 'Spotted Enemy',
  'report-bradley': 'Countered/Took Bradley/Heli',
  'report-oil': 'Countered/Took Oil/Cargo',
  'report-monument': 'Big Score/Fight at Monument',
  'report-farming': 'Killed While Farming',
  'report-loaded': 'Killed Loaded Enemy',
  'report-raid': 'Countered Raid',
  'report-base-raided': 'Base Raided',
  'report-base-mlrsd': 'MLRS\'d',
  'report-base-grubbed': 'We grubbed',
  'report-base-caught-loot': 'Caught moving loot',
  'report-base-enemy-built': 'Enemy built in'
}

const UPKEEP_LABELS = {
  wood: "Wood",
  stone: "Stone", 
  metal: "Metal",
  hqm: "HQM"
}

const BaseModal = ({ 
  modal, 
  modalType, 
  editingLocation,
  locations,
  onSave,
  onCancel,
  onDelete,
  editingReport = null,
  reportLibrary = [],
  addToReportLibrary = () => {},
  updateReportLibrary = () => {}
}) => {
  const [formData, setFormData] = useState({
    type: modalType === 'friendly' ? 'friendly-main' : modalType === 'enemy' ? 'enemy-small' : 'report-pvp',
    notes: '',
    oldestTC: 0,
    players: '',
    upkeep: { wood: 0, stone: 0, metal: 0, hqm: 0 },
    reportTime: '',
    reportOutcome: 'neutral',
    ownerCoordinates: '',
    library: '',
    youtube: '',
    roofCamper: false,
    hostileSamsite: false,
    raidedOut: false,
    primaryRockets: 0,
    enemyPlayers: '',
    friendlyPlayers: ''
  })
  
  const [reportTab, setReportTab] = useState('view') // Default to 'view' for "Write report" button

  const renderViewReports = () => {
    const baseReports = (reportLibrary || []).filter(r => r.locationId === editingLocation?.id)
    
    return (
      <div className="max-h-96 overflow-y-auto">
        {baseReports.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No reports for this base yet
          </div>
        ) : (
          <div className="space-y-3">
            {baseReports.map((report) => (
              <div 
                key={report.id} 
                className="bg-gray-700 rounded-lg p-4 border border-gray-600 flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-medium">{report.title}</span>
                    <span className="text-gray-400 text-sm">• {report.time}</span>
                    {report.notes && (
                      <svg className="h-4 w-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    )}
                    <svg className="h-4 w-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    </svg>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      report.outcome === 'won' ? 'bg-green-600 text-white' : 
                      report.outcome === 'lost' ? 'bg-red-600 text-white' : 
                      'bg-gray-600 text-white'
                    }`}>
                      {report.outcome}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setReportTab('create')
                  }}
                  className="ml-4 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded"
                >
                  Edit
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const renderBaseModal = () => (
    <div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1 text-gray-200">Base Type</label>
        <select 
          value={formData.type} 
          onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))} 
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 focus:border-blue-500 focus:outline-none"
        >
          {modalType === 'friendly' ? (
            <>
              <option value="friendly-main">Main Base</option>
              <option value="friendly-flank">Flank Base</option>
              <option value="friendly-farm">Farm Base</option>
              <option value="friendly-boat">Boat Base</option>
              <option value="friendly-garage">Garage Base</option>
            </>
          ) : (
            <>
              <option value="enemy-small">Small Base</option>
              <option value="enemy-medium">Medium Base</option>
              <option value="enemy-large">Large Base</option>
              <option value="enemy-flank">Flank Base</option>
              <option value="enemy-farm">Farm Base</option>
              <option value="enemy-tower">Tower Base</option>
            </>
          )}
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1 text-gray-200">Notes</label>
        <textarea 
          value={formData.notes} 
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} 
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 placeholder-gray-400 focus:border-blue-500 focus:outline-none" 
          rows="3"
          placeholder="Add any notes about this base..."
        />
      </div>

      {modalType === 'enemy' && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-200">Oldest TC (hours)</label>
          <input 
            type="number" 
            value={formData.oldestTC} 
            onChange={(e) => setFormData(prev => ({ ...prev, oldestTC: parseInt(e.target.value) || 0 }))} 
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 focus:border-blue-500 focus:outline-none" 
            min="0"
          />
        </div>
      )}

      {modalType === 'friendly' && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-200">Upkeep</label>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(UPKEEP_LABELS).map(([key, label]) => (
              <div key={key}>
                <label className="block text-xs text-gray-300 mb-1">{label}</label>
                <input 
                  type="number" 
                  value={formData.upkeep[key]} 
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    upkeep: { ...prev.upkeep, [key]: parseInt(e.target.value) || 0 } 
                  }))} 
                  className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-gray-200 focus:border-blue-500 focus:outline-none text-sm" 
                  min="0"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const renderCreateReport = () => (
    <div>
      <div className="flex gap-4 items-end mb-4">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1 text-gray-200">Report Type</label>
          <div className="relative">
            <select 
              value={formData.type} 
              onChange={(e) => {
                const newType = e.target.value
                setFormData(prev => ({ 
                  ...prev, 
                  type: newType,
                  reportOutcome: newType === 'report-farming' ? 'lost' : newType === 'report-loaded' ? 'won' : 'neutral'
                }))
              }} 
              className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-md appearance-none pr-16 text-gray-200 focus:border-blue-500 focus:outline-none"
            >
              <option value="report-base-raided">Base Raided</option>
              <option value="report-base-mlrsd">MLRS'd</option>
              <option value="report-base-grubbed">We grubbed</option>
              <option value="report-base-caught-loot">Caught moving loot</option>
              <option value="report-base-enemy-built">Enemy built in</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-200">Time</label>
          <input 
            type="time" 
            value={formData.reportTime} 
            onChange={(e) => setFormData(prev => ({ ...prev, reportTime: e.target.value }))} 
            className="px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-md text-gray-200 focus:border-blue-500 focus:outline-none" 
          />
        </div>
      </div>
      
      {/* Notes Field */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1 text-gray-200">Notes</label>
        <textarea 
          placeholder="Add any additional notes about this base report..." 
          value={formData.notes} 
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} 
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 placeholder-gray-400 focus:border-blue-500 focus:outline-none" 
          rows="3"
        />
      </div>
    </div>
  )

  const renderReportModal = () => (
    <div>
      {/* Tab Navigation */}
      <div className="flex mb-4 border-b border-gray-600">
        <button
          onClick={() => setReportTab('view')}
          className={`px-4 py-2 font-medium transition-colors ${
            reportTab === 'view'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          View Reports ({(reportLibrary || []).filter(r => r.locationId === editingLocation?.id).length})
        </button>
        <button
          onClick={() => setReportTab('create')}
          className={`px-4 py-2 font-medium transition-colors ${
            reportTab === 'create'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Create Report
        </button>
      </div>

      {reportTab === 'create' ? renderCreateReport() : renderViewReports()}
    </div>
  )

  const handleSave = () => {
    const baseData = {
      type: formData.type,
      notes: formData.notes,
      description: LABELS[formData.type] || formData.type,
      upkeep: modalType === 'friendly' ? formData.upkeep : undefined,
      time: modalType === 'report' ? formData.reportTime : undefined,
      outcome: modalType === 'report' ? formData.reportOutcome : undefined,
      enemyPlayers: modalType === 'report' ? formData.enemyPlayers : undefined,
      friendlyPlayers: modalType === 'report' ? formData.friendlyPlayers : undefined,
      oldestTC: modalType === 'enemy' && formData.oldestTC > 0 ? formData.oldestTC : undefined
    }
    
    onSave(baseData)
  }

  if (!modal.visible) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" style={{ zIndex: 9999 }}>
      <div className="bg-gradient-to-b from-gray-700 to-gray-800 rounded-xl border border-gray-600 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">
            {modalType === 'report' ? 'Base Reports' : editingLocation ? 'Edit Base' : 'Add Base'}
          </h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {modalType === 'report' ? renderReportModal() : renderBaseModal()}

        <div className="flex gap-3 mt-6">
          {modalType === 'report' && reportTab === 'create' ? (
            <button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium"
            >
              Save Report
            </button>
          ) : modalType !== 'report' ? (
            <>
              <button
                onClick={handleSave}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium"
              >
                {editingLocation ? 'Update Base' : 'Add Base'}
              </button>
              {editingLocation && (
                <button
                  onClick={onDelete}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-medium"
                >
                  Delete Base
                </button>
              )}
            </>
          ) : null}
          <button
            onClick={onCancel}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default BaseModal