import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { apiRequest } from "@/lib/queryClient"

interface GeneralReportModalProps {
  isVisible: boolean;
  onClose: () => void;
  coordinates?: string;
}

export default function GeneralReportModal({
  isVisible,
  onClose,
  coordinates
}: GeneralReportModalProps) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    type: 'report-pvp',
    reportTime: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
    location: coordinates || '',
    involvedPlayers: '',
    notes: '',
    outcome: 'neutral'
  })

  useEffect(() => {
    if (isVisible) {
      setFormData({
        type: 'report-pvp',
        reportTime: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        location: coordinates || '',
        involvedPlayers: '',
        notes: '',
        outcome: 'neutral'
      })
    }
  }, [isVisible, coordinates])

  const createReportMutation = useMutation({
    mutationFn: async (reportData) => {
      const response = await apiRequest("POST", "/api/reports", reportData)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] })
      onClose()
    }
  })

  const handleSave = () => {
    if (createReportMutation.isPending) return

    // Convert comma-separated player strings to arrays for tags
    const playersList = formData.involvedPlayers 
      ? formData.involvedPlayers.split(',').map(p => p.trim()).filter(p => p.length > 0)
      : []
    
    const reportData = {
      title: `${formData.type.replace('report-', '')} Report`,
      reportType: "general", // This is a general report, not tied to any base
      reportSubType: formData.type,
      locationName: formData.location,
      locationCoords: formData.location,
      notes: formData.notes,
      outcome: formData.outcome,
      playerTags: playersList,
      baseTags: [], // General reports don't tag specific bases
      userTags: [],
      screenshots: [],
      content: {
        type: formData.type,
        reportTime: formData.reportTime,
        location: formData.location,
        involvedPlayers: formData.involvedPlayers,
        notes: formData.notes,
        outcome: formData.outcome
      },
      status: "active"
    }
    
    createReportMutation.mutate(reportData)
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" style={{ zIndex: 10000 }}>
      <div className="bg-gradient-to-b from-gray-700 to-gray-800 rounded-xl border border-gray-600 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-200 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
        
        <h3 className="text-lg font-bold text-white mb-4">
          Create General Report
        </h3>
        
        <div className="space-y-4">
          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Report Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white"
            >
              <option value="report-pvp">PVP Encounter</option>
              <option value="report-spotted">Spotted Enemy</option>
              <option value="report-bradley">Bradley/Heli Encounter</option>
              <option value="report-oil">Oil/Cargo Encounter</option>
              <option value="report-monument">Monument Activity</option>
              <option value="report-farming">Farming Incident</option>
              <option value="report-loaded">Loaded Enemy Kill</option>
              <option value="report-raid">Raid Activity</option>
            </select>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="Grid coordinates (e.g., A1, B5)"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400"
            />
          </div>

          {/* Time */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Time</label>
            <input
              type="time"
              value={formData.reportTime}
              onChange={(e) => setFormData(prev => ({ ...prev, reportTime: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white"
            />
          </div>

          {/* Players Involved */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Players Involved</label>
            <input
              type="text"
              value={formData.involvedPlayers}
              onChange={(e) => setFormData(prev => ({ ...prev, involvedPlayers: e.target.value }))}
              placeholder="Comma-separated player names (e.g., timtom, player2)"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400"
            />
          </div>

          {/* Outcome */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Outcome</label>
            <select
              value={formData.outcome}
              onChange={(e) => setFormData(prev => ({ ...prev, outcome: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white"
            >
              <option value="won">Won</option>
              <option value="lost">Lost</option>
              <option value="neutral">Neutral</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional details about the incident..."
              rows={4}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400 resize-none"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={createReportMutation.isPending}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:opacity-50"
          >
            {createReportMutation.isPending ? 'Creating...' : 'Create Report'}
          </button>
        </div>
      </div>
    </div>
  )
}