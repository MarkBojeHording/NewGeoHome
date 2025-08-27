import { type Report } from "@shared/schema"
import { Button } from "./ui/button"
import { Camera, FileText, ExternalLink } from "lucide-react"
import { format } from "date-fns"

interface ReportPreviewProps {
  report: Report
  onViewReport?: (reportId: number) => void
  variant?: 'base' | 'general' // Add variant prop for styling
}

export function ReportPreview({ report, onViewReport, variant }: ReportPreviewProps) {
  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case 'general': return 'General'
      case 'base': return 'Base'
      case 'action': return 'Action'
      default: return type.charAt(0).toUpperCase() + type.slice(1)
    }
  }



  const hasScreenshots = report.screenshots && report.screenshots.length > 0
  const hasNotes = report.notes && report.notes.trim().length > 0

  // Determine styling based on variant and report type
  const isGeneralReport = variant === 'general' || (report.type === 'general' && !variant)
  const borderColor = isGeneralReport ? 'border-blue-500/40' : 'border-orange-500/40'
  const hoverColor = isGeneralReport ? 'hover:bg-blue-900/40' : 'hover:bg-orange-900/40'
  const gradientColor = isGeneralReport ? 'to-blue-950/20' : 'to-orange-950/20'

  return (
    <div className={`flex items-center justify-between p-1 border-b ${borderColor} ${hoverColor} transition-colors bg-gradient-to-r from-gray-800 ${gradientColor}`}>
      <div className="flex items-center gap-1 flex-1 min-w-0">
        {/* Report Type & ID */}
        <div className="flex flex-col min-w-0">
          <span className="font-mono text-xs text-orange-400 font-bold">[{getReportTypeLabel(report.type).toUpperCase()}]</span>
          <span className="text-xs text-orange-600 font-mono">#{String(report.id).padStart(6, '0')}</span>
        </div>

        {/* Content Indicators */}
        <div className="flex items-center gap-1 shrink-0">
          {hasScreenshots && <Camera className="w-3 h-3 text-orange-500" />}
          {hasNotes && <FileText className="w-3 h-3 text-orange-600" />}
        </div>

        {/* Notes Preview */}
        <div className="flex-1 min-w-0">
          <p className="text-xs truncate font-mono text-orange-200" title={report.notes}>
            {report.notes || "[NO DATA]"}
          </p>
          {/* Player Tags - Enemy and Friendly separated */}
          {((report.enemyPlayers && report.enemyPlayers.length > 0) || 
            (report.friendlyPlayers && report.friendlyPlayers.length > 0) ||
            (report.playerTags && report.playerTags.length > 0)) && (
            <div className="flex flex-wrap gap-1 mt-1">
              {/* Enemy Players - Red */}
              {report.enemyPlayers && report.enemyPlayers.map((playerTag, index) => (
                <span key={`enemy-${index}`} className="text-xs px-1 py-0.5 bg-red-900/40 text-red-200 rounded font-mono border border-red-600/30">
                  {playerTag}
                </span>
              ))}
              
              {/* Friendly Players - Green */}
              {report.friendlyPlayers && report.friendlyPlayers.map((playerTag, index) => (
                <span key={`friendly-${index}`} className="text-xs px-1 py-0.5 bg-green-900/40 text-green-200 rounded font-mono border border-green-600/30">
                  {playerTag}
                </span>
              ))}
              
              {/* Legacy PlayerTags - Blue (for backward compatibility) */}
              {report.playerTags && report.playerTags.map((playerTag, index) => (
                <span key={`legacy-${index}`} className="text-xs px-1 py-0.5 bg-blue-900/40 text-blue-200 rounded font-mono border border-blue-600/30">
                  {playerTag}
                </span>
              ))}
            </div>
          )}
        </div>





        {/* Timestamp */}
        <div className="text-xs text-orange-600 shrink-0 font-mono">
          {format(new Date(report.createdAt), 'MMM d, HH:mm')}
        </div>

        {/* Action Button */}
        {onViewReport && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewReport(report.id)}
            className="shrink-0 h-6 w-6 p-0 hover:bg-orange-900/50 text-orange-400"
          >
            <ExternalLink className="w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  )
}