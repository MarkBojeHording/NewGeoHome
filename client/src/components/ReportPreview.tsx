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
    <div className="flex items-center justify-between p-2 border-b hover:bg-accent/50 transition-colors">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {/* Report Type & ID */}
        <div className="flex flex-col min-w-0">
          <span className="font-medium text-xs">[{getReportTypeLabel(report.type)}]</span>
          <span className="text-xs text-muted-foreground">R{String(report.id).padStart(6, '0')}</span>
        </div>

        {/* Content Indicators */}
        <div className="flex items-center gap-1 shrink-0">
          {hasScreenshots && <Camera className="w-3 h-3 text-blue-500" />}
          {hasNotes && <FileText className="w-3 h-3 text-gray-500" />}
        </div>

        {/* Notes Preview */}
        <div className="flex-1 min-w-0">
          <p className="text-xs truncate" title={report.notes}>
            {report.notes || "No notes"}
          </p>
        </div>

        {/* Location */}
        <div className="text-xs text-muted-foreground shrink-0">
          {gridReference}
        </div>

        {/* Outcome Badge */}
        <div className="shrink-0">
          {getOutcomeBadge(report.outcome)}
        </div>

        {/* Timestamp */}
        <div className="text-xs text-muted-foreground shrink-0">
          {format(new Date(report.createdAt), 'MMM d, HH:mm')}
        </div>

        {/* Action Button */}
        {onViewReport && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewReport(report.id)}
            className="shrink-0 h-6 w-6 p-0"
          >
            <ExternalLink className="w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  )
}