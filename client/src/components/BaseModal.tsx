import { useState, useEffect, useRef, useCallback } from 'react'
import { MapPin, Home, Shield, Wheat, Castle, Tent, X, HelpCircle, Calculator } from 'lucide-react'

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

interface BaseModalProps {
  modal: { x: number; y: number; visible: boolean }
  modalType: string
  editingLocation: any
  editingReport: any
  locations: any[]
  onSave: (data: any) => void
  onCancel: () => void
  onDelete?: () => void
  reportLibrary?: any[]
  addToReportLibrary?: (report: any) => void
  updateReportLibrary?: (report: any) => void
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
  // State management for the BaseModal
  const [formData, setFormData] = useState(() => {
    if (editingLocation) {
      return {
        type: editingLocation.type,
        notes: editingLocation.notes || '',
        materials: editingLocation.materials || {},
        weaponSlots: editingLocation.weaponSlots || {},
        rocketCount: editingLocation.rocketCount || 0,
        reportContent: editingLocation.reportContent || '',
        outcome: editingLocation.outcome || 'neutral'
      }
    }
    return {
      type: modalType === 'friendly' ? 'friendly-main' : modalType === 'enemy' ? 'enemy-small' : 'report-pvp',
      notes: '',
      materials: {},
      weaponSlots: {},
      rocketCount: 0,
      reportContent: '',
      outcome: 'neutral'
    }
  })

  // Helper functions
  const getGridCoordinate = (x: number, y: number, locations: any[], excludeId = null) => {
    const rows = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const cols = 30
    const row = Math.floor(y / (100 / rows.length))
    const col = Math.floor(x / (100 / cols)) + 1
    const baseName = rows[Math.min(row, rows.length - 1)] + col.toString().padStart(2, '0')
    
    const existing = locations.filter(loc => 
      loc.id !== excludeId && loc.name.startsWith(baseName)
    ).length
    
    return existing > 0 ? `${baseName}(${existing + 1})` : baseName
  }

  if (!modal.visible) return null

  const getTypeOptions = () => {
    if (modalType === 'friendly') {
      return [
        { value: 'friendly-main', label: 'Main', icon: Home },
        { value: 'friendly-secondary', label: 'Secondary', icon: Shield },
        { value: 'friendly-outpost', label: 'Outpost', icon: Castle },
        { value: 'friendly-small', label: 'Small', icon: Tent },
        { value: 'friendly-1x1', label: '1x1', icon: Tent },
        { value: 'friendly-2x2', label: '2x2', icon: Castle },
        { value: 'friendly-3x3', label: '3x3', icon: Shield },
        { value: 'friendly-4x4', label: '4x4', icon: Home }
      ]
    } else if (modalType === 'enemy') {
      return [
        { value: 'enemy-small', label: 'Small', icon: Tent },
        { value: 'enemy-medium', label: 'Medium', icon: Castle },
        { value: 'enemy-large', label: 'Large', icon: Shield },
        { value: 'enemy-compound', label: 'Compound', icon: Home },
        { value: 'enemy-fortress', label: 'Fortress', icon: Castle },
        { value: 'enemy-farm', label: 'Farm', icon: Wheat },
        { value: 'enemy-flank', label: 'Flank', icon: Shield },
        { value: 'enemy-tower', label: 'Tower', icon: Castle }
      ]
    } else {
      return [
        { value: 'report-pvp', label: 'PvP', icon: Shield },
        { value: 'report-heli', label: 'Heli', icon: Shield },
        { value: 'report-bradley', label: 'Bradley', icon: Shield }
      ]
    }
  }

  const handleSave = () => {
    const name = editingLocation ? editingLocation.name : getGridCoordinate(modal.x, modal.y, locations, editingLocation?.id)
    
    onSave({
      ...formData,
      name
    })
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
      style={{ zIndex: 9999 }}
    >
      <div className="bg-gradient-to-b from-gray-700 to-gray-800 rounded-xl shadow-2xl border border-gray-600 max-w-md w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-600">
            <h2 className="text-lg font-bold text-white">
              {editingLocation ? 'Edit' : 'Add'} {LABELS[formData.type] || modalType.charAt(0).toUpperCase() + modalType.slice(1)}
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-200 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Type Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
              <div className="grid grid-cols-2 gap-2">
                {getTypeOptions().map((option) => {
                  const Icon = option.icon
                  return (
                    <button
                      key={option.value}
                      onClick={() => setFormData(prev => ({ ...prev, type: option.value }))}
                      className={`p-2 rounded border text-sm flex items-center gap-2 transition-colors ${
                        formData.type === option.value
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-gray-600 border-gray-500 text-gray-200 hover:bg-gray-500'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {option.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Notes */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full p-3 bg-gray-600 border border-gray-500 rounded text-white text-sm resize-none focus:border-blue-500 focus:outline-none"
                rows={3}
                placeholder="Add notes about this location..."
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-2 p-4 border-t border-gray-600">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
            >
              Cancel
            </button>
            {editingLocation && onDelete && (
              <button
                onClick={onDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded transition-colors"
              >
                Delete
              </button>
            )}
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
            >
              {editingLocation ? 'Update' : 'Add'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BaseModal