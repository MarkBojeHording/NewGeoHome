import { useState } from 'react'
import { X, Castle, Home, Tent, Shield, Wheat } from 'lucide-react'
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div 
        className="bg-gray-900 border border-orange-600/50 shadow-2xl rounded-lg"
        style={{ width: '800px', height: '700px' }}
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
                      <div className="w-12 h-12 bg-red-900/30 border border-red-600/50 flex items-center justify-center">
                        <IconComponent className="h-8 w-8 text-red-400" />
                      </div>
                    </div>

                    {/* Base Information */}
                    <div className="flex-1">
                      {/* Base Name and Type */}
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-white font-mono">
                          {base.name}
                        </h3>
                        <span className="text-sm text-gray-400 bg-gray-700 px-2 py-1 font-mono">
                          {base.type.replace('enemy-', '').toUpperCase()}
                        </span>
                      </div>

                      {/* Player Count Info */}
                      <div className="flex items-center gap-4 mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-500 border border-red-400"></div>
                          <span className="text-sm text-red-300 font-mono">
                            {onlineCount} ONLINE
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-gray-500 border border-gray-400"></div>
                          <span className="text-sm text-gray-300 font-mono">
                            {totalCount} TOTAL
                          </span>
                        </div>
                      </div>

                      {/* Base Notes/Description */}
                      {base.notes && (
                        <p className="text-sm text-gray-400 font-mono">
                          {base.notes}
                        </p>
                      )}
                    </div>

                    {/* Coordinate Display */}
                    <div className="flex-shrink-0 text-right">
                      <div className="text-sm font-mono text-orange-400 bg-orange-900/20 px-2 py-1 border border-orange-600/30">
                        {base.name}
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