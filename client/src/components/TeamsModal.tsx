import { useState } from 'react'
import { X, Castle, Home, Tent, Shield, Wheat, FileText, Clock, Skull, Rocket, Users } from 'lucide-react'
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
  onOpenBaseModal?: (base: any) => void
}

export function TeamsModal({ isOpen, onClose, locations, players, onOpenBaseModal }: TeamsModalProps) {
  if (!isOpen) return null

  // Filter to only enemy main bases (small, medium, large)
  const enemyMainBases = locations.filter(location =>
    location.type === 'enemy-small' ||
    location.type === 'enemy-medium' ||
    location.type === 'enemy-large'
  )

  // Fetch reports data
  const { data: reportsResponse = { reports: [] } } = useQuery({
    queryKey: ['/api/reports'],
  })

  // Extract reports array from response
  const reports = reportsResponse?.reports || []

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



  const getRocketCost = (baseLocation: any) => {
    if (baseLocation.estimatedRocketCost && baseLocation.estimatedRocketCost > 0) {
      return baseLocation.estimatedRocketCost
    }
    return null
  }

  const getTeamMembers = (baseLocation: any) => {
    if (!baseLocation.players) return []
    return baseLocation.players.split(",").map((p: string) => p.trim()).filter((p: string) => p)
  }

  const getSubordinateBases = (mainBase: any) => {
    return locations.filter(location =>
      location.groupId === mainBase.id &&
      location.id !== mainBase.id &&
      (location.type === 'enemy-small' || location.type === 'enemy-medium' || location.type === 'enemy-large' ||
       location.type === 'enemy-outpost' || location.type === 'enemy-flank' || location.type === 'enemy-farm')
    )
  }

  const handleBaseClick = (base: any) => {
    if (onOpenBaseModal) {
      onOpenBaseModal(base)
    }
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
                    className="bg-gray-800 border border-gray-700 p-2 flex items-start gap-2 hover:bg-gray-750 transition-colors cursor-pointer"
                    data-testid={`team-entry-${base.name}`}
                    onClick={() => handleBaseClick(base)}
                  >
                    {/* Base Icon */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-red-900/30 border border-red-600/50 flex items-center justify-center">
                        <IconComponent className="h-8 w-8 text-red-400" />
                      </div>
                    </div>

                    {/* Base Information */}
                    <div className="flex-1">
                      {/* Base Name and Type */}
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-semibold text-white font-mono">
                          {base.name}
                        </h3>
                        <span className="text-xs text-gray-400 bg-gray-700 px-1 py-0.5 font-mono">
                          {base.type.replace('enemy-', '').toUpperCase()}
                        </span>
                      </div>

                      {/* Stats Row */}
                      <div className="grid grid-cols-5 gap-1 mb-1">
                        {/* Online Players */}
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-red-500 border border-red-400"></div>
                          <span className="text-xs text-red-300 font-mono">
                            {onlineCount} ONLINE
                          </span>
                        </div>

                        {/* Total Players */}
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-gray-500 border border-gray-400"></div>
                          <span className="text-xs text-gray-300 font-mono">
                            {totalCount} TOTAL
                          </span>
                        </div>

                        {/* Rocket Cost */}
                        <div className="flex items-center gap-1">
                          <Rocket className="w-2 h-2 text-blue-400" />
                          <span className="text-xs text-blue-300 font-mono">
                            {getRocketCost(base) ? `${getRocketCost(base)} ROCKETS` : 'UNKNOWN'}
                          </span>
                        </div>

                        {/* Report Count */}
                        <div className="flex items-center gap-1">
                          <FileText className="w-2 h-2 text-purple-400" />
                          <span className="text-xs text-purple-300 font-mono">
                            {getReportCount(base)} REPORTS
                          </span>
                        </div>

                        {/* Last Activity */}
                        <div className="flex items-center gap-1">
                          <Clock className="w-2 h-2 text-orange-400" />
                          <span className="text-xs text-orange-300 font-mono">
                            {getLastActivityTime(base) || 'NO ACTIVITY'}
                          </span>
                        </div>
                      </div>

                      {/* Team Members Section */}
                      <div className="mb-1">
                        <div className="flex items-center gap-1 mb-1">
                          <Users className="w-3 h-3 text-green-400" />
                          <span className="text-xs font-medium text-green-400 font-mono">TEAM MEMBERS ({getTeamMembers(base).length})</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {getTeamMembers(base).slice(0, 6).map((member: string, index: number) => (
                            <span
                              key={index}
                              className="text-xs bg-green-900/20 text-green-300 px-1 py-0.5 border border-green-600/30 font-mono"
                            >
                              {member}
                            </span>
                          ))}
                          {getTeamMembers(base).length > 6 && (
                            <span className="text-xs text-gray-400 font-mono">
                              +{getTeamMembers(base).length - 6} more
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Subordinate Bases Section */}
                      {getSubordinateBases(base).length > 0 && (
                        <div className="mb-1">
                          <div className="flex items-center gap-1 mb-2">
                            <Castle className="w-3 h-3 text-orange-400" />
                            <span className="text-xs font-medium text-orange-400 font-mono">SUBORDINATE BASES ({getSubordinateBases(base).length})</span>
                          </div>
                          <div className="flex gap-2 overflow-x-auto pb-1">
                            {getSubordinateBases(base).map((subBase, index) => {
                              const SubIconComponent = getBaseIcon(subBase.type)
                              return (
                                <div
                                  key={index}
                                  className="flex-shrink-0 flex items-center gap-1 bg-orange-900/20 text-orange-300 px-2 py-1 border border-orange-600/30 font-mono cursor-pointer hover:bg-orange-900/30 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleBaseClick(subBase)
                                  }}
                                >
                                  <SubIconComponent className="w-3 h-3 text-orange-400" />
                                  <span className="text-xs whitespace-nowrap">
                                    {subBase.name}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Base Notes Preview */}
                      {base.notes && (
                        <div>
                          <div className="text-xs text-gray-500 font-mono mb-1">NOTES:</div>
                          <div
                            className="text-xs text-gray-400 font-mono bg-gray-800/50 p-1 border-l-2 border-orange-600/30 max-h-12 overflow-hidden"
                            style={{ lineHeight: '1.3' }}
                          >
                            {base.notes.length > 120 ? `${base.notes.slice(0, 120)}...` : base.notes}
                          </div>
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
