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
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white">Won</Badge>
      case 'bad':
        return <Badge variant="default" className="bg-red-500 hover:bg-red-600 text-white">Lost</Badge>
      case 'neutral':
        return <Badge variant="secondary">Neutral</Badge>
      default:
        return <Badge variant="outline">{outcome}</Badge>
    }
  }

  const hasScreenshots = report.screenshots && report.screenshots.length > 0
  const hasNotes = report.notes && report.notes.trim().length > 0
  const location = report.location as { gridX: number, gridY: number }
  const gridReference = location ? `${String.fromCharCode(65 + location.gridX)}${location.gridY}` : 'Unknown'

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
      <div className="flex items-center gap-3 flex-1">
        {/* Report Type & ID */}
        <div className="flex flex-col">
          <span className="font-medium text-sm">[{getReportTypeLabel(report.type)}]</span>
          <span className="text-xs text-muted-foreground">R{String(report.id).padStart(6, '0')}</span>
        </div>

        {/* Content Indicators */}
        <div className="flex items-center gap-1">
          {hasScreenshots && <Camera className="w-4 h-4 text-blue-500" />}
          {hasNotes && <FileText className="w-4 h-4 text-gray-500" />}
        </div>

        {/* Notes Preview */}
        <div className="flex-1 min-w-0">
          <p className="text-sm truncate" title={report.notes}>
            {report.notes || "No notes"}
          </p>
        </div>

        {/* Location */}
        <div className="text-sm text-muted-foreground">
          {gridReference}
        </div>

        {/* Outcome Badge */}
        {getOutcomeBadge(report.outcome)}

        {/* Timestamp */}
        <div className="text-xs text-muted-foreground">
          {format(new Date(report.createdAt), 'MMM d, HH:mm')}
        </div>
      </div>

      {/* Action Button */}
      {onViewReport && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewReport(report.id)}
          className="ml-2 shrink-0"
        >
          <ExternalLink className="w-4 h-4" />
        </Button>
      )}
    </div>
  )
}