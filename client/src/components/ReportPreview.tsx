import { useState } from "react"
import { Camera, FileText, Calendar, ExternalLink } from "lucide-react"
import { useQuery } from "@tanstack/react-query"

// Report type mappings for display
const REPORT_TYPE_LABELS = {
  'general': {
    'pvp-general': 'PvP General',
    'spotted-enemy': 'Spotted Enemy',
    'bradley-heli': 'Bradley/Heli Activity',
    'oil-cargo': 'Oil/Cargo Activity',
    'monument': 'Monument Activity',
    'farming': 'Farming Activity',
    'loaded-enemy': 'Loaded Enemy',
    'raid-activity': 'Raid Activity'
  },
  'base': {
    'base-report': 'Base Report',
    'raid-report': 'Raid Report',
    'base-activity': 'Base Activity'
  },
  'action': {
    'task-pending': 'Task Pending',
    'task-completed': 'Task Completed',
    'reminder': 'Reminder'
  }
}

const getReportTypeLabel = (reportType: string, reportSubType: string) => {
  return REPORT_TYPE_LABELS[reportType]?.[reportSubType] || reportSubType || reportType
}

const formatDateTime = (dateStr: string) => {
  const date = new Date(dateStr)
  return {
    date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  }
}

const truncateNotes = (notes: string, maxLength: number = 60) => {
  if (!notes || notes.length <= maxLength) return notes
  return notes.substring(0, maxLength).trim() + '...'
}

interface ReportPreviewProps {
  reports: any[]
  isLoading?: boolean
  onOpenReport: (reportId: number) => void
}

export default function ReportPreview({ reports, isLoading, onOpenReport }: ReportPreviewProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-700 rounded animate-pulse" />
        ))}
      </div>
    )
  }

  if (!reports || reports.length === 0) {
    return (
      <div className="text-center py-6 text-gray-400">
        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No reports found</p>
      </div>
    )
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {reports.map((report) => {
        const { date, time } = formatDateTime(report.createdAt)
        const hasMedia = report.hasMedia || (report.screenshots && report.screenshots.length > 0)
        const typeLabel = getReportTypeLabel(report.reportType, report.reportSubType)
        
        return (
          <div
            key={report.id}
            className="bg-gray-800 border border-gray-600 rounded-lg p-3 hover:bg-gray-750 transition-colors"
          >
            {/* Main content row */}
            <div className="flex items-center gap-3">
              {/* Report Type */}
              <div className="flex-shrink-0">
                <span className="text-xs font-medium text-blue-400 bg-blue-900/30 px-2 py-1 rounded">
                  {typeLabel}
                </span>
              </div>
              
              {/* Media indicator */}
              <div className="flex-shrink-0">
                <Camera 
                  className={`h-4 w-4 ${hasMedia ? 'text-green-400' : 'text-gray-600'}`}
                />
              </div>
              
              {/* Notes preview */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-300 truncate">
                  {truncateNotes(report.notes) || 'No notes'}
                </p>
              </div>
              
              {/* Date/Time */}
              <div className="flex-shrink-0 text-right">
                <div className="text-xs text-gray-400">
                  <div>{date}</div>
                  <div>{time}</div>
                </div>
              </div>
            </div>
            
            {/* Go to button row */}
            <div className="flex justify-end mt-2">
              <button
                onClick={() => onOpenReport(report.id)}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
              >
                <span>Go to</span>
                <ExternalLink className="h-3 w-3" />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Hook for filtering reports by tags
export function useFilteredReports(allReports: any[], filterType: 'player' | 'base' | 'user', filterValue: string) {
  if (!allReports || !filterValue) return []
  
  return allReports.filter(report => {
    switch (filterType) {
      case 'player':
        return report.playerTags && report.playerTags.includes(filterValue)
      case 'base':
        return (report.baseTags && report.baseTags.includes(filterValue)) ||
               report.baseId === filterValue ||
               report.locationName === filterValue
      case 'user':
        return report.userTags && report.userTags.includes(filterValue)
      default:
        return false
    }
  })
}