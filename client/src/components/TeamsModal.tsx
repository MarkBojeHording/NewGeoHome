import { useState } from 'react'
import { X, Castle, Home, Tent, Shield, Wheat, FileText, Clock, Skull } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import type { ExternalPlayer } from '@shared/schema'

const ICON_MAP = {
  'enemy-small': Tent,
  'enemy-medium': Home,
  'enemy-large': Castle,
  'enemy-flank': Shield,
  'enemy-farm': Wheat
}

interface TeamsModalProps {
  isOpen: boolean
  onClose: () => void
  locations: any[]
  players: ExternalPlayer[]
}

export function TeamsModal({ isOpen, onClose, locations, players }: TeamsModalProps) {
  if (!isOpen) return null

  // Filter to only enemy main bases (small, medium, large)
  const enemyMainBases = locations.filter(location => 
    location.type === 'enemy-small' || 
    location.type === 'enemy-medium' || 
    location.type === 'enemy-large'
  )

  // Fetch reports data
  const { data: reports = [] } = useQuery({
    queryKey: ['/api/reports'],
  })

  const getBaseIcon = (type: string) => {
    const IconComponent = ICON_MAP[type as keyof typeof ICON_MAP] || Tent
    return IconComponent
  }

  const getOnlinePlayerCount = (baseLocation: any) => {
    if (!baseLocation.players) return 0
    const basePlayerNames = baseLocation.players.split(",").map((p: string) => p.trim()).filter((p: string) => p)
    return basePlayerNames.filter((playerName: string) => 
      players.some(player => player.playerName === playerName && player.isOnline)
    ).length
  }

  const getTotalPlayerCount = (baseLocation: any) => {
    if (!baseLocation.players) return 0
    return baseLocation.players.split(",").map((p: string) => p.trim()).filter((p: string) => p).length
  }

  const getReportCount = (baseLocation: any) => {
    return reports.filter((report: any) => 
      report.baseTags && report.baseTags.includes(baseLocation.id)
    ).length
  }

  const getLastActivityTime = (baseLocation: any) => {
    const baseReports = reports.filter((report: any) => 
      report.baseTags && report.baseTags.includes(baseLocation.id)
    )
    if (baseReports.length === 0) return null
    
    const latestReport = baseReports.sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0]
    
    const timeDiff = Date.now() - new Date(latestReport.createdAt).getTime()
    const hours = Math.floor(timeDiff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)
    
    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    return 'Recent'
  }

  const getThreatLevel = (baseLocation: any) => {
    const onlineCount = getOnlinePlayerCount(baseLocation)
    const totalCount = getTotalPlayerCount(baseLocation)
    const recentReports = reports.filter((report: any) => {
      if (!report.baseTags || !report.baseTags.includes(baseLocation.id)) return false
      const reportTime = new Date(report.createdAt).getTime()
      const dayAgo = Date.now() - (24 * 60 * 60 * 1000)
      return reportTime > dayAgo
    }).length

    if (onlineCount >= 3 || recentReports >= 2) return { level: 'HIGH', color: 'text-red-400 bg-red-900/20' }
    if (onlineCount >= 1 || recentReports >= 1) return { level: 'MED', color: 'text-yellow-400 bg-yellow-900/20' }
    if (totalCount > 0) return { level: 'LOW', color: 'text-green-400 bg-green-900/20' }
    return { level: 'NONE', color: 'text-gray-400 bg-gray-900/20' }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div 
        className="bg-gray-900 border border-orange-600/50 shadow-2xl rounded-lg"
        style={{ width: '1000px', height: '800px' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-orange-600/30">
          <h2 className="text-xl font-bold text-orange-400 font-mono">[ENEMY TEAMS]</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            data-testid="button-close-teams"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 h-full overflow-y-auto">
          {enemyMainBases.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              No enemy main bases found
            </div>
          ) : (
            <div className="space-y-3">
              {enemyMainBases.map((base) => {
                const IconComponent = getBaseIcon(base.type)
                const onlineCount = getOnlinePlayerCount(base)
                const totalCount = getTotalPlayerCount(base)
                
                return (
                  <div 
                    key={base.id}
                    className="bg-gray-800 border border-gray-700 p-4 flex items-center gap-4 hover:bg-gray-750 transition-colors"
                    data-testid={`team-entry-${base.name}`}
                  >
                    {/* Base Icon */}
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-red-900/30 border border-red-600/50 flex items-center justify-center">
                        <IconComponent className="h-12 w-12 text-red-400" />
                      </div>
                    </div>

                    {/* Base Information */}
                    <div className="flex-1">
                      {/* Base Name, Type and Threat Level */}
                      <div className="flex items-center gap-2 mb-3">
                        <h3 className="text-lg font-semibold text-white font-mono">
                          {base.name}
                        </h3>
                        <span className="text-sm text-gray-400 bg-gray-700 px-2 py-1 font-mono">
                          {base.type.replace('enemy-', '').toUpperCase()}
                        </span>
                        <span className={`text-xs px-2 py-1 font-mono border ${getThreatLevel(base).color}`}>
                          {getThreatLevel(base).level} THREAT
                        </span>
                      </div>

                      {/* Stats Row */}
                      <div className="grid grid-cols-4 gap-4 mb-3">
                        {/* Online Players */}
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-500 border border-red-400"></div>
                          <span className="text-sm text-red-300 font-mono">
                            {onlineCount} ONLINE
                          </span>
                        </div>
                        
                        {/* Total Players */}
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-gray-500 border border-gray-400"></div>
                          <span className="text-sm text-gray-300 font-mono">
                            {totalCount} TOTAL
                          </span>
                        </div>

                        {/* Report Count */}
                        <div className="flex items-center gap-2">
                          <FileText className="w-3 h-3 text-purple-400" />
                          <span className="text-sm text-purple-300 font-mono">
                            {getReportCount(base)} REPORTS
                          </span>
                        </div>

                        {/* Last Activity */}
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-orange-400" />
                          <span className="text-sm text-orange-300 font-mono">
                            {getLastActivityTime(base) || 'NO ACTIVITY'}
                          </span>
                        </div>
                      </div>

                      {/* Base Notes Preview */}
                      {base.notes && (
                        <div className="mb-2">
                          <p className="text-sm text-gray-400 font-mono bg-gray-800/50 p-2 border-l-2 border-orange-600/30">
                            {base.notes.length > 80 ? `${base.notes.slice(0, 80)}...` : base.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Additional Info Panel */}
                    <div className="flex-shrink-0 text-right">
                      <div className="space-y-2">
                        <div className="text-sm font-mono text-orange-400 bg-orange-900/20 px-2 py-1 border border-orange-600/30">
                          {base.name}
                        </div>
                        {base.roofCamper && (
                          <div className="text-xs font-mono text-orange-300 bg-orange-900/20 px-2 py-1 border border-orange-600/30">
                            ROOF CAMPER
                          </div>
                        )}
                        {base.hostileSamsite && (
                          <div className="text-xs font-mono text-yellow-300 bg-yellow-900/20 px-2 py-1 border border-yellow-600/30">
                            SAM SITE
                          </div>
                        )}
                        {base.abandoned && (
                          <div className="text-xs font-mono text-gray-300 bg-gray-900/20 px-2 py-1 border border-gray-600/30">
                            ABANDONED
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}