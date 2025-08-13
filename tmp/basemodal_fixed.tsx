import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { MapPin, Home, Shield, Wheat, Castle, Tent, X, HelpCircle, Calculator, FileText, Image, Edit, Camera, StickyNote, Search, Plus, Minus } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { RocketCalculatorSection } from './RocketCalculator'
import type { ExternalPlayer } from '@shared/schema'

// ============= CONSTANTS =============
const LABELS = {
  "friendly-main": "Main",
  "friendly-flank": "Flank", 
  "friendly-farm": "Farm",
  "friendly-boat": "Boat",
  "friendly-garage": "Garage",
  "enemy-small": "Small",
  "enemy-medium": "Medium",
  "enemy-large": "Large",
  "enemy-flank": "Flank",
  "enemy-tower": "Tower",
  "enemy-farm": "Farm",
  "enemy-decaying": "Decaying",
  "report-pvp": "PvP",
  "report-heli": "Heli",
  "report-bradley": "Bradley"
}

const ICON_MAP = {
  "friendly-main": Home,
  "friendly-flank": Shield,
  "friendly-farm": Wheat,
  "friendly-boat": Castle,
  "friendly-garage": Castle,
  "enemy-small": Tent,
  "enemy-medium": Castle,
  "enemy-large": Shield,
  "enemy-flank": Shield,
  "enemy-tower": Castle,
  "enemy-farm": Wheat,
  "enemy-decaying": Castle,
  "report-pvp": Shield,
  "report-heli": Shield,
  "report-bradley": Shield
}

const getColor = (type: string) => {
  if (type.startsWith("friendly")) return "text-green-400"
  if (type.startsWith("enemy")) return "text-red-400"
  return "text-yellow-400"
}

const getIcon = (type: string) => {
  const Icon = ICON_MAP[type] || MapPin
  return <Icon className="h-3 w-3" />
}

const MATERIAL_ICONS = {
  wood: "🪵",
  stone: "🪨",
  metal: "🔩",
  hqm: "⚙️"
}

const MATERIAL_LABELS = {
  wood: "Wood",
  stone: "Stone",
  metal: "Metal",
  hqm: "HQM"
}

// ============= PLAYER SEARCH SELECTOR COMPONENT =============
const PlayerSearchSelector = ({ selectedPlayers, onPlayersChange, maxHeight }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  
  // Fetch players from external API
  const { data: players = [] } = useQuery<ExternalPlayer[]>({
    queryKey: ['/api/players']
  })

  // Parse selected players from comma-separated string
  const selectedPlayersList = selectedPlayers ? selectedPlayers.split(',').map(p => p.trim()).filter(p => p) : []
  
  // Filter players based on search term
  const filteredPlayers = players.filter(player => 
    player.playerName.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedPlayersList.includes(player.playerName)
  )

  const addPlayer = (playerName) => {
    const newPlayers = [...selectedPlayersList, playerName].join(', ')
    onPlayersChange(newPlayers)
    setSearchTerm('')
    setShowDropdown(false)
  }

  const removePlayer = (playerName) => {
    const newPlayers = selectedPlayersList.filter(p => p !== playerName).join(', ')
    onPlayersChange(newPlayers)
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Search Input */}
      <div className="relative p-2 border-b border-gray-600">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setShowDropdown(true)
            }}
            onFocus={() => setShowDropdown(true)}
            className="w-full pl-7 pr-2 py-1 bg-gray-800 border border-gray-600 rounded text-sm text-gray-200 placeholder-gray-400 focus:border-blue-500 focus:outline-none"
            placeholder="Search players to add..."
          />
        </div>
        
        {/* Search Results Dropdown */}
        {showDropdown && searchTerm && filteredPlayers.length > 0 && (
          <div className="absolute top-full left-2 right-2 mt-1 bg-gray-800 border border-gray-600 rounded max-h-32 overflow-y-auto z-50">
            {filteredPlayers.slice(0, 10).map((player) => (
              <button
                key={player.id}
                onClick={() => addPlayer(player.playerName)}
                className="w-full text-left px-2 py-1 hover:bg-gray-700 flex items-center gap-2 text-sm"
              >
                <div className={`w-2 h-2 rounded-full ${player.isOnline ? 'bg-green-500' : 'bg-gray-500'}`} />
                <span className={player.isOnline ? 'text-green-400' : 'text-gray-400'}>
                  {player.playerName}
                </span>
                <span className="text-xs text-gray-500">
                  ({player.totalSessions} sessions)
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected Players List */}
      <div className="flex-1 overflow-y-auto p-2">
        {selectedPlayersList.length === 0 ? (
          <div className="text-gray-500 text-sm italic">No players selected</div>
        ) : (
          <div className="space-y-1">
            {selectedPlayersList.map((playerName, index) => {
              const player = players.find(p => p.playerName === playerName)
              return (
                <div key={index} className="flex items-center justify-between bg-gray-800 rounded px-2 py-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${player?.isOnline ? 'bg-green-500' : 'bg-gray-500'}`} />
                    <span className={`text-sm ${player?.isOnline ? 'text-green-400' : 'text-gray-400'}`}>
                      {playerName}
                    </span>
                    {player && (
                      <span className="text-xs text-gray-500">
                        ({player.totalSessions} sessions)
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => removePlayer(playerName)}
                    className="text-red-400 hover:text-red-300 p-1"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}