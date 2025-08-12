import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import type { Location } from '../../shared/location-schema'
import type { 
  Report, 
  GeneralReport, 
  BaseReport, 
  GeneralReportType, 
  BaseReportType
} from '../../shared/report-schema'

// Report options moved inline to avoid import issues
const GENERAL_REPORT_OPTIONS = [
  { value: 'report-pvp', label: 'PVP General' },
  { value: 'report-spotted', label: 'Spotted Enemy' },
  { value: 'report-bradley', label: 'Countered/Took Bradley/Heli' },
  { value: 'report-oil', label: 'Countered/Took Oil/Cargo' },
  { value: 'report-monument', label: 'Big Score/Fight at Monument' },
  { value: 'report-farming', label: 'Killed While Farming' },
  { value: 'report-loaded', label: 'Killed Loaded Enemy' },
  { value: 'report-raid', label: 'Countered Raid' }
] as const

const BASE_REPORT_OPTIONS = {
  common: [
    { value: 'base-raided', label: 'Base Raided' },
    { value: 'base-mlrsd', label: 'MLRS\'d' }
  ],
  friendly: [
    { value: 'base-enemy-built-in', label: 'Enemy built in' }
  ],
  enemy: [
    { value: 'base-grubbed', label: 'We grubbed' },
    { value: 'base-caught-moving-loot', label: 'Caught moving loot' }
  ]
} as const

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (report: Partial<Report>) => void
  reportType: 'general' | 'base'
  location: { x: number; y: number; name: string }
  baseLocation?: Location // For base reports
  editingReport?: GeneralReport | BaseReport | null
}

export default function ReportModal({ 
  isOpen, 
  onClose, 
  onSave, 
  reportType, 
  location, 
  baseLocation, 
  editingReport 
}: ReportModalProps) {
  const [formData, setFormData] = useState({
    reportType: 'report-pvp' as GeneralReportType | BaseReportType,
    reportTime: new Date().toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit' }),
    enemyPlayers: [] as string[],
    friendlyPlayers: [] as string[],
    notes: '',
    outcome: 'neutral' as 'won' | 'lost' | 'neutral'
  })

  const [newEnemyPlayer, setNewEnemyPlayer] = useState('')
  const [newFriendlyPlayer, setNewFriendlyPlayer] = useState('')

  useEffect(() => {
    if (editingReport) {
      setFormData({
        reportType: editingReport.reportType,
        reportTime: editingReport.reportTime,
        enemyPlayers: editingReport.enemyPlayers,
        friendlyPlayers: editingReport.friendlyPlayers,
        notes: editingReport.notes || '',
        outcome: editingReport.outcome
      })
    } else {
      // Reset form for new report
      setFormData({
        reportType: reportType === 'base' ? 'base-raided' : 'report-pvp',
        reportTime: new Date().toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        enemyPlayers: [],
        friendlyPlayers: [],
        notes: '',
        outcome: 'neutral'
      })
    }
  }, [editingReport, reportType])

  const getReportOptions = () => {
    if (reportType === 'general') {
      return GENERAL_REPORT_OPTIONS
    }
    
    // For base reports, combine common options with base-type specific options
    const commonOptions = BASE_REPORT_OPTIONS.common
    const baseType = baseLocation?.type.startsWith('friendly') ? 'friendly' : 'enemy'
    const specificOptions = BASE_REPORT_OPTIONS[baseType] || []
    
    return [...commonOptions, ...specificOptions]
  }

  const handleAddPlayer = (type: 'enemy' | 'friendly') => {
    const newPlayer = type === 'enemy' ? newEnemyPlayer : newFriendlyPlayer
    if (!newPlayer.trim()) return

    setFormData(prev => ({
      ...prev,
      [`${type}Players`]: [...prev[`${type}Players` as keyof typeof prev] as string[], newPlayer.trim()]
    }))

    if (type === 'enemy') {
      setNewEnemyPlayer('')
    } else {
      setNewFriendlyPlayer('')
    }
  }

  const handleRemovePlayer = (type: 'enemy' | 'friendly', index: number) => {
    setFormData(prev => ({
      ...prev,
      [`${type}Players`]: (prev[`${type}Players` as keyof typeof prev] as string[]).filter((_, i) => i !== index)
    }))
  }

  const handleSave = () => {
    const reportData: Partial<Report> = {
      type: reportType,
      x: location.x,
      y: location.y,
      reportType: formData.reportType,
      reportTime: formData.reportTime,
      enemyPlayers: formData.enemyPlayers,
      friendlyPlayers: formData.friendlyPlayers,
      notes: formData.notes,
      outcome: formData.outcome,
      ...(reportType === 'base' && baseLocation && {
        locationId: baseLocation.id,
        baseType: baseLocation.type.startsWith('friendly') ? 'friendly' : 'enemy'
      })
    }

    onSave(reportData)
    onClose()
  }

  if (!isOpen) return null

  const reportOptions = getReportOptions()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="modal-report">
      <div className="bg-gray-800 rounded-lg border border-gray-600 p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">
            {reportType === 'base' ? 'Base Report' : 'General Report'} - {location.name}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Report Type Selection */}
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1 text-gray-200">Report Type</label>
              <select 
                value={formData.reportType} 
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  reportType: e.target.value as GeneralReportType | BaseReportType,
                  outcome: e.target.value === 'report-farming' || e.target.value === 'base-grubbed' ? 'lost' : 
                          e.target.value === 'report-loaded' || e.target.value === 'base-caught-moving-loot' ? 'won' : 'neutral'
                }))} 
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 focus:border-blue-500 focus:outline-none"
                data-testid="select-report-type"
              >
                {reportOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-200">Time</label>
              <input 
                type="time" 
                value={formData.reportTime} 
                onChange={(e) => setFormData(prev => ({ ...prev, reportTime: e.target.value }))} 
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 focus:border-blue-500 focus:outline-none"
                data-testid="input-report-time"
              />
            </div>
          </div>

          {/* Player Management */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Enemy Players */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-200">Enemy Players</label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newEnemyPlayer}
                    onChange={(e) => setNewEnemyPlayer(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddPlayer('enemy')}
                    placeholder="Add enemy player..."
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 text-sm focus:border-blue-500 focus:outline-none"
                    data-testid="input-enemy-player"
                  />
                  <button 
                    onClick={() => handleAddPlayer('enemy')}
                    className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                    data-testid="button-add-enemy"
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {formData.enemyPlayers.map((player, index) => (
                    <div key={index} className="flex items-center justify-between bg-red-900/20 px-2 py-1 rounded text-sm">
                      <span className="text-red-200">{player}</span>
                      <button 
                        onClick={() => handleRemovePlayer('enemy', index)}
                        className="text-red-400 hover:text-red-300 ml-2"
                        data-testid={`button-remove-enemy-${index}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Friendly Players */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-200">Friendly Players</label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newFriendlyPlayer}
                    onChange={(e) => setNewFriendlyPlayer(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddPlayer('friendly')}
                    placeholder="Add friendly player..."
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 text-sm focus:border-blue-500 focus:outline-none"
                    data-testid="input-friendly-player"
                  />
                  <button 
                    onClick={() => handleAddPlayer('friendly')}
                    className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                    data-testid="button-add-friendly"
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {formData.friendlyPlayers.map((player, index) => (
                    <div key={index} className="flex items-center justify-between bg-green-900/20 px-2 py-1 rounded text-sm">
                      <span className="text-green-200">{player}</span>
                      <button 
                        onClick={() => handleRemovePlayer('friendly', index)}
                        className="text-green-400 hover:text-green-300 ml-2"
                        data-testid={`button-remove-friendly-${index}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-200">Notes</label>
            <textarea 
              value={formData.notes} 
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} 
              className="w-full h-24 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 placeholder-gray-500 resize-none focus:outline-none focus:border-blue-500"
              placeholder="Add report details..."
              data-testid="textarea-notes"
            />
          </div>

          {/* Outcome Selection */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-200">Outcome</label>
            <div className="flex gap-2">
              {(['won', 'lost', 'neutral'] as const).map(outcome => (
                <button
                  key={outcome}
                  onClick={() => setFormData(prev => ({ ...prev, outcome }))}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    formData.outcome === outcome
                      ? outcome === 'won' 
                        ? 'bg-green-600 text-white' 
                        : outcome === 'lost'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                  data-testid={`button-outcome-${outcome}`}
                >
                  {outcome.charAt(0).toUpperCase() + outcome.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            data-testid="button-cancel"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            data-testid="button-save-report"
          >
            Save Report
          </button>
        </div>
      </div>
    </div>
  )
}