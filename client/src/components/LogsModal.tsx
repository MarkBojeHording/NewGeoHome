import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useQuery } from '@tanstack/react-query'
import { ReportPreview } from './ReportPreview'
import { Search, Filter, Calendar, User, MapPin } from 'lucide-react'
import type { Report } from '@shared/schema'

interface LogsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function LogsModal({ isOpen, onClose }: LogsModalProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [outcomeFilter, setOutcomeFilter] = useState<string>('all')

  const { data: reports = [], isLoading } = useQuery<Report[]>({
    queryKey: ['/api/reports'],
    enabled: isOpen
  })

  // Filter and search reports
  const filteredReports = reports.filter(report => {
    // Type filter
    if (typeFilter !== 'all' && report.type !== typeFilter) return false
    
    // Outcome filter
    if (outcomeFilter !== 'all' && report.outcome !== outcomeFilter) return false
    
    // Search term filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      const location = report.location as { gridX: number, gridY: number }
      const gridRef = location ? `${String.fromCharCode(65 + location.gridX)}${location.gridY}` : ''
      
      return (
        report.notes.toLowerCase().includes(searchLower) ||
        report.type.toLowerCase().includes(searchLower) ||
        report.outcome.toLowerCase().includes(searchLower) ||
        gridRef.toLowerCase().includes(searchLower) ||
        report.playerTags.some(tag => tag.toLowerCase().includes(searchLower))
      )
    }
    
    return true
  })

  // Sort by most recent first
  const sortedReports = filteredReports.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  const getTypeOptions = () => {
    const types = [...new Set(reports.map(r => r.type))]
    return types.map(type => ({ value: type, label: type.charAt(0).toUpperCase() + type.slice(1) }))
  }

  const getOutcomeOptions = () => {
    const outcomes = [...new Set(reports.map(r => r.outcome))]
    return outcomes.map(outcome => ({ value: outcome, label: outcome.charAt(0).toUpperCase() + outcome.slice(1) }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            All Reports Log
            <Badge variant="secondary" className="ml-2">
              {sortedReports.length} reports
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Filters and Search */}
        <div className="flex gap-3 flex-wrap items-center border-b pb-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value="all">All Types</option>
            {getTypeOptions().map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Outcome Filter */}
          <select
            value={outcomeFilter}
            onChange={(e) => setOutcomeFilter(e.target.value)}
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value="all">All Outcomes</option>
            {getOutcomeOptions().map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Clear Filters */}
          {(searchTerm || typeFilter !== 'all' || outcomeFilter !== 'all') && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setSearchTerm('')
                setTypeFilter('all')
                setOutcomeFilter('all')
              }}
            >
              Clear
            </Button>
          )}
        </div>

        {/* Reports List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading reports...</div>
            </div>
          ) : sortedReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
              <div className="text-lg font-medium mb-2">No reports found</div>
              <div className="text-muted-foreground">
                {searchTerm || typeFilter !== 'all' || outcomeFilter !== 'all' 
                  ? 'Try adjusting your filters'
                  : 'Reports will appear here when created'
                }
              </div>
            </div>
          ) : (
            <div className="space-y-0">
              {sortedReports.map((report, index) => (
                <div key={report.id} className={index > 0 ? 'border-t' : ''}>
                  <ReportPreview report={report} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary Stats */}
        {!isLoading && sortedReports.length > 0 && (
          <div className="border-t pt-3 flex gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              {[...new Set(sortedReports.flatMap(r => r.playerTags))].length} players involved
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {[...new Set(sortedReports.flatMap(r => r.baseTags))].length} bases referenced
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}