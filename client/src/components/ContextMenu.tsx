import { MapPin, Shield, Home, Tent, Castle, FileText } from 'lucide-react'

interface ContextMenuProps {
  x: number
  y: number
  visible: boolean
  onAddBase: (type: string) => void
  onAddReport: () => void
  onClose: () => void
}

export default function ContextMenu({ x, y, visible, onAddBase, onAddReport, onClose }: ContextMenuProps) {
  if (!visible) return null

  return (
    <div 
      className="fixed bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 min-w-48"
      style={{ left: x, top: y }}
      data-testid="context-menu"
    >
      <div className="py-2">
        {/* Report Option */}
        <button
          onClick={() => {
            onAddReport()
            onClose()
          }}
          className="w-full px-4 py-2 text-left text-gray-200 hover:bg-gray-700 flex items-center gap-2"
          data-testid="button-add-report"
        >
          <FileText className="h-4 w-4 text-purple-400" />
          Add Report
        </button>
        
        <div className="h-px bg-gray-600 my-1"></div>
        
        {/* Friendly Bases */}
        <div className="px-4 py-1 text-xs text-gray-400 font-semibold">FRIENDLY BASES</div>
        <button
          onClick={() => {
            onAddBase('friendly-main')
            onClose()
          }}
          className="w-full px-4 py-2 text-left text-gray-200 hover:bg-gray-700 flex items-center gap-2"
          data-testid="button-add-friendly-main"
        >
          <Castle className="h-4 w-4 text-green-400" />
          Main Base
        </button>
        <button
          onClick={() => {
            onAddBase('friendly-flank')
            onClose()
          }}
          className="w-full px-4 py-2 text-left text-gray-200 hover:bg-gray-700 flex items-center gap-2"
          data-testid="button-add-friendly-flank"
        >
          <Shield className="h-4 w-4 text-green-400" />
          Flank Base
        </button>
        <button
          onClick={() => {
            onAddBase('friendly-farm')
            onClose()
          }}
          className="w-full px-4 py-2 text-left text-gray-200 hover:bg-gray-700 flex items-center gap-2"
          data-testid="button-add-friendly-farm"
        >
          <Home className="h-4 w-4 text-green-400" />
          Farm
        </button>
        
        <div className="h-px bg-gray-600 my-1"></div>
        
        {/* Enemy Bases */}
        <div className="px-4 py-1 text-xs text-gray-400 font-semibold">ENEMY BASES</div>
        <button
          onClick={() => {
            onAddBase('enemy-small')
            onClose()
          }}
          className="w-full px-4 py-2 text-left text-gray-200 hover:bg-gray-700 flex items-center gap-2"
          data-testid="button-add-enemy-small"
        >
          <Tent className="h-4 w-4 text-red-400" />
          Small Base
        </button>
        <button
          onClick={() => {
            onAddBase('enemy-medium')
            onClose()
          }}
          className="w-full px-4 py-2 text-left text-gray-200 hover:bg-gray-700 flex items-center gap-2"
          data-testid="button-add-enemy-medium"
        >
          <Home className="h-4 w-4 text-red-400" />
          Medium Base
        </button>
        <button
          onClick={() => {
            onAddBase('enemy-large')
            onClose()
          }}
          className="w-full px-4 py-2 text-left text-gray-200 hover:bg-gray-700 flex items-center gap-2"
          data-testid="button-add-enemy-large"
        >
          <Castle className="h-4 w-4 text-red-400" />
          Large Base
        </button>
      </div>
    </div>
  )
}