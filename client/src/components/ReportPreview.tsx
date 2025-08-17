import { type Report } from "@shared/schema"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Camera, FileText, ExternalLink } from "lucide-react"
import { format } from "date-fns"

interface ReportPreviewProps {
  report: Report
  onViewReport?: (reportId: number) => void
}

export function ReportPreview({ report, onViewReport }: ReportPreviewProps) {
  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case 'general': return 'General'
      case 'base': return 'Base'
      case 'action': return 'Action'
      default: return type.charAt(0).toUpperCase() + type.slice(1)
    }
  }

  const getOutcomeBadge = (outcome: string) => {
    switch (outcome) {
      case 'good':
        return <Badge className="bg-green-900/50 border-2 border-green-600 text-green-400 font-mono text-xs">[SUCCESS]</Badge>
      case 'bad':
        return <Badge className="bg-red-900/50 border-2 border-red-600 text-red-400 font-mono text-xs">[FAILURE]</Badge>
      case 'neutral':
        return <Badge className="bg-orange-900/50 border-2 border-orange-600 text-orange-400 font-mono text-xs">[NEUTRAL]</Badge>
      default:
        return <Badge className="bg-orange-900/30 border border-orange-600 text-orange-500 font-mono text-xs">[{outcome.toUpperCase()}]</Badge>
    }
  }

  const hasScreenshots = report.screenshots && report.screenshots.length > 0
  const hasNotes = report.notes && report.notes.trim().length > 0
  const location = report.location as { gridX: number, gridY: number }
  const gridReference = location ? `${String.fromCharCode(65 + location.gridX)}${location.gridY}` : 'Unknown'

  return (
    <div className="flex items-center justify-between p-1 border-b border-orange-500/40 hover:bg-orange-900/40 transition-colors bg-gradient-to-r from-gray-800 to-orange-950/20">
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
        </div>

        {/* Location */}
        <div className="text-xs text-orange-500 shrink-0 font-mono">
          [{gridReference}]
        </div>

        {/* Outcome Badge */}
        <div className="shrink-0">
          {getOutcomeBadge(report.outcome)}
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