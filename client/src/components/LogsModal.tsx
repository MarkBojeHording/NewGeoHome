import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { useQuery } from "@tanstack/react-query"
import { Search, FileText, Filter, X } from "lucide-react"
import ReportPreview from "./ReportPreview"

interface LogsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function LogsModal({ isOpen, onClose }: LogsModalProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all') // all, general, base, action

  // Fetch all reports for diagnosis
  const { data: allReports = [], isLoading } = useQuery({
    queryKey: ['/api/reports']
  })

  // Filter reports based on search and type
  const filteredReports = allReports.filter(report => {
    const matchesSearch = !searchTerm || 
      report.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.locationName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(report.content || {}).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (report.playerTags || []).some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (report.baseTags || []).some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesType = filterType === 'all' || report.reportType === filterType

    return matchesSearch && matchesType
  })

  const handleOpenReport = (reportId: number) => {
    console.log('Opening report:', reportId)
    // TODO: Implement report detail view
  }

  const handleClearSearch = () => {
    setSearchTerm('')
    setFilterType('all')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 max-w-4xl max-h-[80vh]">
        <DialogHeader className="border-b border-gray-700 pb-4">
          <DialogTitle className="text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            System Logs - All Reports ({filteredReports.length} found)
          </DialogTitle>
        </DialogHeader>

        {/* Search and Filter Controls */}
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search reports, players, bases, content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex gap-2">
              {['all', 'general', 'base', 'action'].map((type) => (
                <Button
                  key={type}
                  onClick={() => setFilterType(type)}
                  variant={filterType === type ? "default" : "outline"}
                  size="sm"
                  className={`capitalize ${
                    filterType === type 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'border-gray-600 text-gray-400 hover:bg-gray-800'
                  }`}
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>

          {/* Clear Filters */}
          {(searchTerm || filterType !== 'all') && (
            <Button
              onClick={handleClearSearch}
              variant="outline"
              size="sm"
              className="border-gray-600 text-gray-400 hover:bg-gray-800"
            >
              <Filter className="w-4 h-4 mr-2" />
              Clear Filters
            </Button>
          )}
        </div>

        {/* Reports List */}
        <ScrollArea className="flex-1">
          <div className="space-y-4">
            {/* Debug Info */}
            <div className="bg-gray-800 border border-gray-600 rounded-lg p-3">
              <h4 className="text-white font-medium mb-2">Debug Information</h4>
              <div className="text-sm text-gray-400 space-y-1">
                <div>Total Reports in Database: {allReports.length}</div>
                <div>Filtered Results: {filteredReports.length}</div>
                <div>Search Term: "{searchTerm}" | Filter Type: {filterType}</div>
              </div>
            </div>

            {/* Report Previews */}
            <div className="bg-gray-800 border border-gray-600 rounded-lg p-3">
              <h4 className="text-white font-medium mb-3">All Reports</h4>
              <ReportPreview 
                reports={filteredReports}
                isLoading={isLoading}
                onOpenReport={handleOpenReport}
              />
            </div>

            {/* Detailed Report Data for Debugging */}
            {filteredReports.length > 0 && (
              <div className="bg-gray-800 border border-gray-600 rounded-lg p-3">
                <h4 className="text-white font-medium mb-3">Raw Report Data (First 3)</h4>
                <div className="space-y-3 text-xs">
                  {filteredReports.slice(0, 3).map((report, index) => (
                    <div key={report.id} className="bg-gray-700 rounded p-2">
                      <div className="text-white font-medium mb-1">Report #{report.id}</div>
                      <div className="text-gray-300 space-y-1">
                        <div><span className="text-blue-400">Title:</span> {report.title}</div>
                        <div><span className="text-blue-400">Type:</span> {report.reportType}/{report.reportSubType}</div>
                        <div><span className="text-blue-400">Location:</span> {report.locationName}</div>
                        <div><span className="text-blue-400">Base ID:</span> {report.baseId || 'none'}</div>
                        <div><span className="text-blue-400">Player Tags:</span> [{(report.playerTags || []).join(', ')}]</div>
                        <div><span className="text-blue-400">Base Tags:</span> [{(report.baseTags || []).join(', ')}]</div>
                        <div><span className="text-blue-400">Notes:</span> {report.notes || 'none'}</div>
                        <div><span className="text-blue-400">Content:</span> {JSON.stringify(report.content || {}).substring(0, 100)}...</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Close Button */}
        <div className="flex justify-end pt-4 border-t border-gray-700">
          <Button
            onClick={onClose}
            variant="outline"
            className="border-gray-600 text-gray-400 hover:bg-gray-800"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}