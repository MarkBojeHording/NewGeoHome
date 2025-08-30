import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { MapPin, Home, Shield, Wheat, Castle, Tent, X, HelpCircle, Calculator, User, Plus } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { queryClient, apiRequest } from '@/lib/queryClient'
import { getTaskIcon } from '@/lib/icons'
import { GRID_CONFIG, ICON_MAP, LABELS } from '@/lib/tactical-map-constants'
import { getColor, getBorderColor, getGridCoordinate, getBaseGroup, getGridPosition, getGroupColor, openGeneCalculator, formatTime, getIcon, getLargeIcon } from '@/lib/tactical-map-utils'
import { DecayingIcon, TowerIcon, LocationName } from '@/components/MapIcons'
import { TaskOreIcon, TaskLootIcon, TaskRepairIcon, TaskUpgradeIcon, TaskResourcesIcon } from '@/components/TaskIcons'
import { useLocationTimers } from '@/hooks/useTacticalMapTimers'
import { useBaseReportEvents } from '@/hooks/useBaseReportEvents'
import { useMapInteraction } from '@/hooks/useMapInteraction'
import { KitNeedsDisplay } from '../components/KitNeedsDisplay'
import BaseModal from '../components/BaseModal'
import { PlayerModal } from '../components/PlayerModal'
import { LogsModal } from '../components/LogsModal'
import ActionReportModal from '../components/ActionReportModal'
import TaskReportModal from '../components/TaskReportModal'
import TaskSummaryPopup from '../components/TaskSummaryPopup'
import { TeamsModal } from '../components/TeamsModal'
import { ProgressionModal } from '../components/ProgressionModal'
import { HeatMapOverlay, HeatMapControls, HeatMapConfig } from '../components/HeatMap'
import RadialMenu from '../components/RadialMenu'
import FarmRadialMenu from '../components/FarmRadialMenu'
import BaseRadialMenu from '../components/BaseRadialMenu'
import WipeCountdownTimer from '../components/WipeCountdownTimer'
import TacticalMapToolbar from '../components/TacticalMapToolbar'
import TacticalMapGrid from '../components/TacticalMapGrid'
import TacticalMapBackground from '../components/TacticalMapBackground'
import TacticalMapLocation from '../components/TacticalMapLocation'
import type { ExternalPlayer } from '@shared/schema'
import rustMapImage from '@assets/map_raw_normalized (2)_1755133962532.png'
































const LocationMarker = ({ location, locations = [], isSelected, onClick, timers, onRemoveTimer, getOwnedBases, players = [], onOpenReport, onOpenBaseReport, pendingTaskReports = [], onTaskIconClick }) => {
  const ownedBases = getOwnedBases(location.name)
  
  // Find task reports for this base
  const taskReports = useMemo(() => {
    const filtered = pendingTaskReports.filter(report => 
      report.baseTags && report.baseTags.includes(location.id)
    )
    

    
    return filtered
  }, [pendingTaskReports, location.id])

  // Calculate online player count for this base (regular players only, premium players are always counted as online)
  const onlinePlayerCount = useMemo(() => {
    if (!location.players) return 0
    
    const basePlayerNames = location.players.split(",").map(p => p.trim()).filter(p => p)
    return basePlayerNames.filter(playerName => 
      players.some(player => player.playerName === playerName && player.isOnline)
    ).length
  }, [location.players, players])

  // Calculate premium player count for this base
  const premiumPlayerCount = useMemo(() => {
    if (!location.players) return 0
    
    const basePlayerNames = location.players.split(",").map(p => p.trim()).filter(p => p)
    return basePlayerNames.filter(playerName => 
      players.some(player => player.playerName === playerName && player.createdAt !== undefined)
    ).length
  }, [location.players, players])

  // Calculate offline player count for this base (regular players only, premium players are not counted as offline)
  const offlinePlayerCount = useMemo(() => {
    if (!location.players) return 0
    
    const basePlayerNames = location.players.split(",").map(p => p.trim()).filter(p => p)
    return basePlayerNames.filter(playerName => 
      players.some(player => player.playerName === playerName && !player.isOnline && player.createdAt === undefined)
    ).length
  }, [location.players, players])
  
  return (
    <>
      {/* Hostile Samsite Circle - 150m radius visual indicator */}
      {location.hostileSamsite && (
        <div 
          className="absolute pointer-events-none"
          style={{ 
            left: `${location.x}%`, 
            top: `${location.y}%`,
            transform: 'translate(-50%, -50%)',
            zIndex: 1
          }}
        >
          <svg width="60" height="60" viewBox="0 0 300 300" className="absolute" style={{ transform: 'translate(-50%, -50%)' }}>
            <g transform="rotate(-90 150 150)">
              <defs>
                <path id={`circle-hostile-${location.id}`} d="M 150,50 A 100,100 0 0,0 150,250" fill="none" />
                <pattern id={`stripes-yellow-${location.id}`} patternUnits="userSpaceOnUse" width="20" height="20" patternTransform="rotate(45)">
                  <rect x="0" y="0" width="10" height="20" fill="yellow" opacity="0.25"/>
                  <rect x="10" y="0" width="10" height="20" fill="transparent"/>
                </pattern>
              </defs>
              <circle cx="150" cy="150" r="100" fill={`url(#stripes-yellow-${location.id})`} stroke="none"/>
              <text fontFamily="Arial, sans-serif" fontSize="20" fill="#886600" opacity="0.55">
                <textPath href={`#circle-hostile-${location.id}`} startOffset="50%" textAnchor="middle">
                  Hostile Samsite
                </textPath>
              </text>
            </g>
          </svg>
        </div>
      )}

      {/* Roofcamper Circle - 150m radius visual indicator */}
      {location.roofCamper && (
        <div 
          className="absolute pointer-events-none"
          style={{ 
            left: `${location.x}%`, 
            top: `${location.y}%`,
            transform: 'translate(-50%, -50%)',
            zIndex: 1
          }}
        >
          <svg width="60" height="60" viewBox="0 0 300 300" className="absolute" style={{ transform: 'translate(-50%, -50%)' }}>
            <g transform="rotate(-90 150 150)">
              <defs>
                <path id={`circle-roof-${location.id}`} d="M 150,50 A 100,100 0 0,1 150,250" fill="none" />
                <pattern id={`stripes-red-${location.id}`} patternUnits="userSpaceOnUse" width="20" height="20" patternTransform="rotate(45)">
                  <rect x="0" y="0" width="10" height="20" fill="transparent"/>
                  <rect x="10" y="0" width="10" height="20" fill="red" opacity="0.25"/>
                </pattern>
              </defs>
              <circle cx="150" cy="150" r="100" fill={`url(#stripes-red-${location.id})`} stroke="none"/>
              <text fontFamily="Arial, sans-serif" fontSize="20" fill="#660000" dominantBaseline="hanging" opacity="0.55">
                <textPath href={`#circle-roof-${location.id}`} startOffset="50%" textAnchor="middle">
                  Roofcamper
                </textPath>
              </text>
            </g>
          </svg>
        </div>
      )}


      <button
        className="absolute transform -translate-x-1/2 -translate-y-1/2"
        style={{ left: `${location.x}%`, top: `${location.y}%`, zIndex: 5 }}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation()
          e.preventDefault()
          onClick(location)
        }}
      >
        <div className="relative">
        {/* Group Color Ring - shows for bases that belong to a group */}
        {(() => {
          const groupColor = getGroupColor(location.id, locations)
          if (!groupColor) return null
          
          return (
            <div 
              className="absolute rounded-full"
              style={{
                width: "18px", // Smaller group circle
                height: "18px",
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                backgroundColor: groupColor,
                zIndex: 0, // Behind the icon
                opacity: 0.6 // Slightly more transparent since it's filled
              }}
            />
          )
        })()}
        {!location.type.startsWith('report') && (
          <TimerDisplay 
            timers={timers} 
            onRemoveTimer={onRemoveTimer}
          />
        )}

        {/* Online player count display - only show for enemy bases with players */}
        {location.type.startsWith("enemy") && onlinePlayerCount > 0 && (
          <div 
            className="absolute text-xs font-bold text-red-400 bg-black/80 rounded-full flex items-center justify-center border border-red-400/50"
            style={{
              width: "9px", // 75% of original 12px
              height: "9px",
              left: "-6px", // Adjusted proportionally
              top: "-1.5px", // Adjusted proportionally
              transform: "translateY(-50%)",
              zIndex: 1,
              fontSize: "7px" // Proportionally smaller font
            }}
          >
            {onlinePlayerCount}
          </div>
        )}

        {/* Premium player count display - orange circle, 35% smaller, to the right of green */}
        {location.type.startsWith("enemy") && premiumPlayerCount > 0 && (
          <div 
            className="absolute text-xs font-bold text-orange-400 bg-black/80 rounded-full flex items-center justify-center border border-orange-400/50"
            style={{
              width: "6px", // 75% of original 7.8px
              height: "6px",
              left: "3px", // Adjusted proportionally
              top: "-3px", // Adjusted proportionally
              transform: "translateY(-50%)",
              zIndex: 1,
              fontSize: "5px" // Proportionally smaller font
            }}
          >
            {premiumPlayerCount}
          </div>
        )}

        {/* Offline player count display - grey circle, below green */}
        {location.type.startsWith("enemy") && offlinePlayerCount > 0 && (
          <div 
            className="absolute text-xs font-bold text-gray-400 bg-black/80 rounded-full flex items-center justify-center border border-gray-400/50"
            style={{
              width: "6px", // 75% of original 7.8px
              height: "6px",
              left: "-6px", // Adjusted proportionally 
              top: "6px", // Adjusted proportionally
              transform: "translateY(-50%)",
              zIndex: 1,
              fontSize: "5px" // Proportionally smaller font
            }}
          >
            {offlinePlayerCount}
          </div>
        )}
        
        <div className={`bg-gray-700 rounded-full shadow-md border border-gray-600 flex items-center justify-center ${location.abandoned ? 'opacity-40' : ''} ${
          location.type.startsWith('report') ? 'p-0.5 scale-[0.375]' : 'p-0.5 scale-75'
        }`}>
          <div className={`${getColor(location.type, location)} flex items-center justify-center`}>
            {getIcon(location.type)}
          </div>
        </div>
        
        {isSelected && (
          <div className="absolute pointer-events-none" style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: location.type.startsWith('report') ? '10px' : '20px',
            height: location.type.startsWith('report') ? '10px' : '20px',
            zIndex: 5
          }}>
            <div className="selection-ring" style={{ width: '100%', height: '100%' }}>
              <svg width={location.type.startsWith('report') ? "10" : "20"} height={location.type.startsWith('report') ? "10" : "20"} viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id={`greyGradient-${location.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#D8D8D8"/>
                    <stop offset="50%" stopColor="#C0C0C0"/>
                    <stop offset="100%" stopColor="#B0B0B0"/>
                  </linearGradient>
                  <linearGradient id={`diamondGradient-${location.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#606060"/>
                    <stop offset="50%" stopColor="#303030"/>
                    <stop offset="100%" stopColor="#101010"/>
                  </linearGradient>
                </defs>
                <path d="M 150,30 A 120,120 0 1,0 150,270 A 120,120 0 1,0 150,30 Z M 150,47 A 103,103 0 1,1 150,253 A 103,103 0 1,1 150,47 Z" fill={`url(#greyGradient-${location.id})`} fillRule="evenodd"/>
                <circle cx="150" cy="150" r="120" fill="none" stroke="#000000" strokeWidth="5"/>
                <circle cx="150" cy="150" r="103" fill="none" stroke="#000000" strokeWidth="5"/>
                <g transform="translate(150, 30)">
                  <path d="M 0,-18 L 21,0 L 0,36 L -21,0 Z" fill={`url(#diamondGradient-${location.id})`} stroke="#000000" strokeWidth="5"/>
                  <path d="M 0,-14 L 12,-2 L 0,8 L -12,-2 Z" fill="#FFFFFF" opacity="0.15"/>
                </g>
                <g transform="translate(270, 150) rotate(90)">
                  <path d="M 0,-18 L 21,0 L 0,36 L -21,0 Z" fill={`url(#diamondGradient-${location.id})`} stroke="#000000" strokeWidth="5"/>
                  <path d="M 0,-14 L 12,-2 L 0,8 L -12,-2 Z" fill="#FFFFFF" opacity="0.15"/>
                </g>
                <g transform="translate(150, 270) rotate(180)">
                  <path d="M 0,-18 L 21,0 L 0,36 L -21,0 Z" fill={`url(#diamondGradient-${location.id})`} stroke="#000000" strokeWidth="5"/>
                  <path d="M 0,-14 L 12,-2 L 0,8 L -12,-2 Z" fill="#FFFFFF" opacity="0.15"/>
                </g>
                <g transform="translate(30, 150) rotate(270)">
                  <path d="M 0,-18 L 21,0 L 0,36 L -21,0 Z" fill={`url(#diamondGradient-${location.id})`} stroke="#000000" strokeWidth="5"/>
                  <path d="M 0,-14 L 12,-2 L 0,8 L -12,-2 Z" fill="#FFFFFF" opacity="0.15"/>
                </g>
              </svg>
            </div>
          </div>
        )}
        
        {/* Badges */}
        {location.type.startsWith('report') && location.outcome && location.outcome !== 'neutral' && (
          <div className="absolute -top-1 -right-1" style={{ zIndex: 10 }}>
            {location.outcome === 'won' ? (
              <div className="w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-2 h-2 text-white" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 111.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"/>
                </svg>
              </div>
            ) : (
              <div className="w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                <svg className="w-2 h-2 text-white" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M4.28 3.22a.75.75 0 00-1.06 1.06L6.94 8l-3.72 3.72a.75.75 0 101.06 1.06L8 9.06l3.72 3.72a.75.75 0 101.06-1.06L9.06 8l3.72-3.72a.75.75 0 00-1.06-1.06L8 6.94 4.28 3.22z"/>
                </svg>
              </div>
            )}
          </div>
        )}
        
        {/* Task Report Icons - positioned above the base */}
        {taskReports.length > 0 && (
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2" style={{ zIndex: 10 }}>
            <div className="flex flex-row gap-0.5">
              {taskReports.map((report, index) => (
                <div key={report.id}>
                  {report.taskData && report.taskData.pickupType === 'ore' && 
                    <TaskOreIcon onClick={onTaskIconClick} task={report} />}
                  {report.taskData && report.taskData.pickupType === 'loot' && 
                    <TaskLootIcon onClick={onTaskIconClick} task={report} />}
                  {report.taskData && report.taskData.repairUpgradeType === 'repair' && 
                    <TaskRepairIcon onClick={onTaskIconClick} task={report} />}
                  {report.taskData && report.taskData.repairUpgradeType === 'upgrade' && 
                    <TaskUpgradeIcon onClick={onTaskIconClick} task={report} />}
                  {report.taskType === 'request_resources' && 
                    <TaskResourcesIcon onClick={onTaskIconClick} task={report} />}
                  {report.taskType === 'stock_kits' && 
                    <div 
                      onClick={(event) => onTaskIconClick(event, report)}
                      className="cursor-pointer"
                    >
                      <KitNeedsDisplay kitResources={report.taskData?.kitResources} size="xs" />
                    </div>}
                </div>
              ))}
            </div>
          </div>
        )}


        
        {location.oldestTC && location.oldestTC > 0 && (
          <div className="absolute inset-0 pointer-events-none">
            <svg width="28" height="28" viewBox="0 0 28 28" className="absolute" style={{top: '-2px', left: '-2px'}}>
              <g transform="translate(14, 14)">
                <g transform={`rotate(${location.oldestTC + 180})`}>
                  <g transform="translate(0, -11)">
                    <path
                      d="M -3 -3 L 3 -3 L 0 3 Z"
                      fill={location.type.startsWith('enemy') ? '#ef4444' : '#10b981'}
                      stroke={location.type.startsWith('enemy') ? '#991b1b' : '#047857'}
                      strokeWidth="0.5"
                    />
                  </g>
                </g>
              </g>
            </svg>
          </div>
        )}
      </div>
    </button>
    </>
  )
}

const ContextMenu = ({ x, y, onAddBase }) => (
  <div className="fixed bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-20 py-2" style={{ left: x, top: y }}>
    <button className="block w-full text-left px-4 py-2 hover:bg-gray-700 text-gray-200 text-sm" onClick={() => onAddBase('report')}>
      Report
    </button>
    <button className="block w-full text-left px-4 py-2 hover:bg-gray-700 text-gray-200 text-sm" onClick={() => onAddBase('enemy')}>
      Enemy Base
    </button>
    <button className="block w-full text-left px-4 py-2 hover:bg-gray-700 text-gray-200 text-sm" onClick={() => onAddBase('friendly')}>
      Friendly Base
    </button>
  </div>
)

const ActionMenu = ({ location, style, onClose, onAction, onOpenBaseReport }) => {
  const isFriendly = location.type.startsWith('friendly')
  
  if (isFriendly) {
    return (
      <div 
        className="absolute bg-gray-800 rounded-lg shadow-2xl border border-gray-700"
        style={{ ...style, minWidth: '320px', padding: '12px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-2">
          {[
            { label: 'Needs pickup', actions: ['Ore', 'Loot', 'Detailed'] },

            { label: 'Base needs kits', actions: ['Simple', 'Detailed'] },
            { label: 'Needs Repair/Upgrade', actions: ['Simple', 'Detailed'] }
          ].map(({ label, actions }) => (
            <div key={label} className="flex items-center justify-between gap-4">
              <span className="text-gray-200 text-sm whitespace-nowrap">{label}</span>
              <div className="flex gap-1.5">
                {actions.map(action => (
                  <button 
                    key={action}
                    className="px-2.5 py-1 bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs rounded transition-colors font-medium"
                    onClick={() => onAction(`${label} - ${action}`)}
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-200 text-sm whitespace-nowrap">Needs Upkeep</span>
            <button 
              className="px-4 py-1 bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs rounded transition-colors font-medium cursor-pointer"
              onClick={() => onAction('Needs Upkeep')}
            >
              Mark
            </button>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-200 text-sm whitespace-nowrap">Intentional Decay</span>
            <button 
              className="px-4 py-1 bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs rounded transition-colors font-medium cursor-pointer"
              onClick={() => onAction('Intentional Decay')}
            >
              Set Timer
            </button>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-200 text-sm whitespace-nowrap">Write Report</span>
            <button 
              className="px-4 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors font-medium cursor-pointer"
              onClick={() => {
                onOpenBaseReport(location)
                onClose()
              }}
            >
              Create
            </button>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div 
      className="absolute bg-gray-800 rounded-lg shadow-2xl border border-gray-700"
      style={{ ...style, minWidth: '140px', padding: '4px' }}
      onClick={(e) => e.stopPropagation()}
    >
      <button 
        className="block w-full text-left px-4 py-2 hover:bg-gray-700 text-gray-200 text-sm transition-colors"
        onClick={() => onAction('Schedule Raid')}
      >
        Schedule Raid
      </button>
      <button 
        className="block w-full text-left px-4 py-2 hover:bg-gray-700 text-gray-200 text-sm transition-colors"
        onClick={() => onAction('Decaying')}
      >
        Decaying
      </button>
      <button 
        className="block w-full text-left px-4 py-2 hover:bg-gray-700 text-gray-200 text-sm transition-colors"
        onClick={() => onAction('Write report')}
      >
        Write report
      </button>
    </div>
  )
}

const DecayingMenu = ({ style, onClose, onStartTimer, title = "Decay Calculator" }) => {
  const [decayValues, setDecayValues] = useState({ stone: '', metal: '', hqm: '' })
  
  const handleStartTimer = (type) => {
    const value = decayValues[type] === '' || decayValues[type] === 0 
      ? 0 
      : Number(decayValues[type])
    
    const hours = value === 0 
      ? DECAY_TIMES[type].hours 
      : (DECAY_TIMES[type].hours * (value / DECAY_TIMES[type].max))
    
    const seconds = Math.round(hours * 3600)
    onStartTimer(type, seconds)
  }
  
  return (
    <div 
      className="absolute bg-gray-800 rounded-lg shadow-2xl border border-gray-700 p-4"
      style={{ ...style, width: '370px' }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-200 transition-colors"
      >
        <X className="h-5 w-5" />
      </button>
      
      <h3 className="text-white font-bold mb-4">{title}</h3>
      
      <div className="space-y-3">
        {Object.entries(DECAY_TIMES).map(([type, config]) => (
          <div key={type} className="flex items-center gap-3">
            <label className="text-sm text-gray-300 w-12 capitalize">{type}</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={decayValues[type]}
                onChange={(e) => setDecayValues(prev => ({ 
                  ...prev, 
                  [type]: Math.min(config.max, Math.max(0, e.target.value === '' ? '' : Number(e.target.value)))
                }))}
                placeholder="0"
                className="w-16 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm text-gray-200 text-center focus:border-blue-500 focus:outline-none"
                min="0"
                max={config.max}
              />
              <span className="text-xs text-gray-400">of {config.max}</span>
            </div>
            <div className="flex-1 text-right">
              <span className="text-sm text-yellow-400 font-medium">
                {decayValues[type] === '' || decayValues[type] === 0 
                  ? `${config.hours} hours` 
                  : `${(config.hours * (Number(decayValues[type]) / config.max)).toFixed(1)} hours`}
              </span>
            </div>
            <button
              onClick={() => handleStartTimer(type)}
              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors whitespace-nowrap"
            >
              Start timer
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}


const SelectedLocationPanel = ({ location, onEdit, getOwnedBases, onSelectLocation, locationTimers, onAddTimer, onOpenReport, onOpenBaseReport, onOpenTaskReport, onCreateExpressTaskReport, players, locations, reports, wipeCountdown }) => {
  const [showActionMenu, setShowActionMenu] = useState(false)
  const [showDecayingMenu, setShowDecayingMenu] = useState(false)
  const ownedBases = getOwnedBases(location.name)
  
  // Get players from the location data (same as BaseModal)
  // For subsidiary bases, get players from their main base
  const locationPlayers = (() => {
    if (location.ownerCoordinates && 
        (location.type.includes('flank') || 
         location.type.includes('tower') || 
         location.type.includes('farm'))) {
      const mainBase = locations.find(loc => 
        loc.name.split('(')[0] === location.ownerCoordinates.split('(')[0]
      )
      if (mainBase && mainBase.players) {
        return mainBase.players
      }
    }
    return location.players || ''
  })()
  
  return (
    <div 
      className="absolute bottom-0 left-0 bg-gray-900 bg-opacity-95 backdrop-blur-sm rounded-tr-lg shadow-2xl p-6 flex gap-5 border-t border-r border-orange-600/50 z-20 transition-all duration-300 ease-out"
      style={{ width: '30%', minWidth: '350px', maxWidth: '450px', minHeight: '160px' }}
    >
      {location.type.startsWith('enemy') && (
        <div 
          className="absolute" 
          style={{
            top: '-108px',
            right: '-108px',
            width: '216px',
            height: '216px',
            pointerEvents: 'auto'
          }}
        >
          <div style={{
            transform: 'scale(0.6)', 
            transformOrigin: 'center',
            width: '600px', 
            height: '600px',
            position: 'absolute',
            top: '50%',
            left: '50%',
            marginTop: '-300px',
            marginLeft: '-300px'
          }}>
            <RadialMenu />
          </div>
        </div>
      )}
      {location.type === 'friendly-farm' && (
        <div 
          className="absolute" 
          style={{
            top: '-108px',
            right: '-108px',
            width: '216px',
            height: '216px',
            pointerEvents: 'auto'
          }}
        >
          <div style={{
            transform: 'scale(0.6)', 
            transformOrigin: 'center',
            width: '440px', 
            height: '500px',
            position: 'absolute',
            top: '50%',
            left: '50%',
            marginTop: '-250px',
            marginLeft: '-220px'
          }}>
            <FarmRadialMenu 
              onOpenTaskReport={onOpenTaskReport}
              onCreateExpressTaskReport={onCreateExpressTaskReport}
              onOpenBaseReport={onOpenBaseReport}
              onAddTimer={onAddTimer}
              locationId={location?.id}
              baseId={location?.id}
              baseName={location?.name}
              baseCoords={location?.name}
              tcData={location?.tcData}
              wipeCountdown={wipeCountdown}
            />
          </div>
        </div>
      )}
      {location.type.startsWith('friendly') && location.type !== 'friendly-farm' && (
        <div 
          className="absolute" 
          style={{
            top: '-108px',
            right: '-108px',
            width: '216px',
            height: '216px',
            pointerEvents: 'auto'
          }}
        >
          <div style={{
            transform: 'scale(0.6)', 
            transformOrigin: 'center',
            width: '440px', 
            height: '500px',
            position: 'absolute',
            top: '50%',
            left: '50%',
            marginTop: '-250px',
            marginLeft: '-220px'
          }}>
            <BaseRadialMenu 
              onOpenTaskReport={onOpenTaskReport}
              onCreateExpressTaskReport={onCreateExpressTaskReport}
              onOpenBaseReport={onOpenBaseReport}
              onAddTimer={onAddTimer}
              locationId={location?.id}
              baseId={location?.id}
              baseName={location?.name}
              baseCoords={location?.name}
              reports={reports}
              tcData={location?.tcData}
              wipeCountdown={wipeCountdown}
            />
          </div>
        </div>
      )}
      {!location.type.startsWith('report') && (
        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 -translate-x-10 flex gap-3">
      {/* Rectangle - smaller size for enemy base preview */}
      <div className="absolute top-12 left-1/2 transform -translate-x-1/2 -translate-x-24 pointer-events-none z-50">
        <div className="w-52 h-28 bg-gray-800 border border-orange-600/50 shadow-lg relative">
          {/* Player snapshot grid - 2 columns x 5 rows */}
          <div className="grid grid-cols-2 grid-rows-5 h-full w-full">
            {(() => {
              // Parse selected players from comma-separated string (same as BaseModal)
              const selectedPlayersList = locationPlayers ? locationPlayers.split(',').map(p => p.trim()).filter(p => p) : []
              
              // Filter players to only show those assigned to this base
              const taggedPlayers = players.filter(p => selectedPlayersList.includes(p.playerName));
              
              // Separate premium and regular players
              const premiumTaggedPlayers = taggedPlayers.filter(p => p.createdAt !== undefined); // Premium players have createdAt
              const regularTaggedPlayers = taggedPlayers.filter(p => p.createdAt === undefined);
              
              // Get online and offline players from regular players only (premium players are always offline)
              const onlinePlayers = regularTaggedPlayers.filter(p => p.isOnline) || [];
              const offlinePlayers = regularTaggedPlayers.filter(p => !p.isOnline) || [];
              
              // Combine in priority order: online first, then offline, then premium
              const onlineCount = onlinePlayers.length;
              const offlineCount = offlinePlayers.length;
              const prioritizedPlayers = [
                ...onlinePlayers.slice(0, 10), // Take up to 10 online players first
                ...offlinePlayers.slice(0, Math.max(0, 10 - onlineCount)), // Offline players after online
                ...premiumTaggedPlayers.slice(0, Math.max(0, 10 - onlineCount - offlineCount)) // Premium players last
              ].slice(0, 10);
              
              // Fill remaining slots with empty boxes
              const slots = Array(10).fill(null).map((_, index) => 
                prioritizedPlayers[index] || null
              );
              
              return slots.map((player, index) => (
                <div 
                  key={index}
                  className={`flex items-center justify-center text-xs font-medium border-r border-b border-orange-600/30 ${
                    index % 2 === 1 ? 'border-r-0' : ''
                  } ${
                    index >= 8 ? 'border-b-0' : ''
                  } ${
                    player 
                      ? player.createdAt !== undefined // Premium player
                        ? 'bg-orange-900 text-orange-300' 
                        : player.isOnline 
                          ? location.type.startsWith('enemy') 
                            ? 'bg-red-900 text-red-300'
                            : 'bg-yellow-900 text-yellow-300'
                          : 'bg-gray-700 text-gray-400'
                      : 'bg-gray-800'
                  }`}
                >
                  {player ? (
                    <span className="truncate px-1" title={player.playerName}>
                      {player.playerName.length > 8 ? player.playerName.slice(0, 8) : player.playerName}
                    </span>
                  ) : null}
                </div>
              ));
            })()}
          </div>
        </div>
      </div>
      
          <button className="w-10 h-10 bg-gradient-to-br from-orange-600 to-orange-800 rounded-full flex items-center justify-center hover:from-orange-500 hover:to-orange-700 transition-all duration-200 border-2 border-orange-400 shadow-lg transform hover:scale-105" title="Linked Bases">
            <svg className="h-5 w-5 text-white drop-shadow-sm" viewBox="0 0 24 24" fill="none">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button className="w-10 h-10 bg-gradient-to-br from-orange-700 to-orange-900 rounded-full flex items-center justify-center hover:from-orange-600 hover:to-orange-800 transition-all duration-200 border-2 border-orange-500 shadow-lg transform hover:scale-105" title="Notes" onClick={() => onEdit(location)}>
            <svg className="h-5 w-5 text-white drop-shadow-sm" viewBox="0 0 24 24" fill="none">
              <path d="M4 4v16c0 1.1.9 2 2 2h10l4-4V6c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2z" fill="white" stroke="white" strokeWidth="1"/>
              <path d="M16 18v-4h4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button className="w-10 h-10 bg-gradient-to-br from-orange-800 to-orange-900 rounded-full flex items-center justify-center hover:from-orange-700 hover:to-orange-800 transition-all duration-200 border-2 border-orange-600 shadow-lg transform hover:scale-105" title="Help">
            <HelpCircle className="h-5 w-5 text-white drop-shadow-sm" />
          </button>
        </div>
      )}
      
      {location.type.startsWith('report') ? (
        <button 
          className="absolute -top-4 -right-4 bg-purple-600 rounded-full flex items-center justify-center hover:bg-purple-700 transition-colors border-2 border-gray-800 shadow-lg"
          style={{width: '60px', height: '60px'}} 
          title="Details"
          onClick={() => onEdit(location)}
        >
          <span className="text-white text-[11px] font-bold">DETAILS</span>
        </button>
      ) : null}
      
      {showActionMenu && !location.type.startsWith('report') && !location.type.startsWith('enemy') && (
        <ActionMenu 
          location={location}
          style={{
            top: '20px',
            left: 'calc(100% + 3px)',
            zIndex: 30
          }}
          onClose={() => setShowActionMenu(false)}
          onOpenBaseReport={onOpenBaseReport}
          onAction={(action) => {
            console.log(action)
            setShowActionMenu(false)
            if (action === 'Intentional Decay' || action === 'Decaying') {
              setShowDecayingMenu(true)
            }
             else if (action === 'Write report') {
              onOpenBaseReport(location)
            }
            else if (action === 'Add Base Report') {
              setBaseReportData({
                baseId: location.id,
                baseName: location.name,
                baseCoords: location.coordinates || getGridCoordinate(location.x, location.y, locations, null),
                baseType: location.type
              })
              setShowBaseReportModal(true)
            }
          }}
        />
      )}
      
      {showDecayingMenu && !location.type.startsWith('report') && (
        <DecayingMenu 
          style={{
            top: '20px',
            left: 'calc(100% + 3px)',
            zIndex: 30
          }}
          title={location.type.startsWith('friendly') ? 'Intentional Decay Calculator' : 'Decay Calculator'}
          onClose={() => setShowDecayingMenu(false)}
          onStartTimer={(type, seconds) => {
            if (!location || location.type.startsWith('report')) return
            
            const existing = locationTimers[location.id] || []
            if (existing.length >= 3) {
              alert('Maximum 3 timers per base')
              return
            }
            
            handleAddTimer(location.id, {
              id: Date.now() + Math.random(),
              type: type,
              remaining: seconds
            })
            
            setShowDecayingMenu(false)
            const hours = seconds / 3600
            const isFriendly = location.type.startsWith('friendly')
            console.log(`Started ${isFriendly ? 'intentional decay' : 'decay'} ${type} timer for ${location.name}: ${hours.toFixed(1)} hours`)
          }}
        />
      )}
      
      <div className="flex-shrink-0 mt-4 relative">
        <div className="bg-gray-800 rounded-full p-4 shadow-xl border-2 border-orange-600/50">
          <div className={getColor(location.type, location)}>
            <div className="transform scale-125">
              {getLargeIcon(location.type)}
            </div>
          </div>
        </div>
        
        {location.oldestTC && location.oldestTC > 0 && (
          <div className="absolute inset-0 pointer-events-none">
            <svg width="100%" height="100%" viewBox="0 0 100 100" className="absolute inset-0">
              <g transform={`translate(50, 50)`}>
                <g transform={`rotate(${location.oldestTC + 180})`}>
                  <g transform={`translate(0, -42)`}>
                    <path
                      d="M -5 -5 L 5 -5 L 0 5 Z"
                      fill={location.type.startsWith('enemy') ? '#ef4444' : '#10b981'}
                      stroke={location.type.startsWith('enemy') ? '#991b1b' : '#047857'}
                      strokeWidth="1"
                    />
                  </g>
                </g>
              </g>
            </svg>
          </div>
        )}
        
        

        
        {location.abandoned && (
          <div className="absolute -bottom-2 -left-2">
            <div className="w-4 h-4 bg-gray-500 rounded-full flex items-center justify-center shadow-lg border border-gray-800" title="Abandoned">
              <span className="text-[10px] font-bold text-white">A</span>
            </div>
          </div>
        )}
        
        <div className="absolute -top-9 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
          <div className="relative">
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 120 32">
              <defs>
                <linearGradient id="coordGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={location.type.startsWith('report') ? "#9333ea" : location.type.startsWith('enemy') ? "#ef4444" : "#10b981"} stopOpacity="0.3"/>
                  <stop offset="50%" stopColor={location.type.startsWith('report') ? "#9333ea" : location.type.startsWith('enemy') ? "#ef4444" : "#10b981"} stopOpacity="0.8"/>
                  <stop offset="100%" stopColor={location.type.startsWith('report') ? "#9333ea" : location.type.startsWith('enemy') ? "#ef4444" : "#10b981"} stopOpacity="0.3"/>
                </linearGradient>
              </defs>
              <rect x="1" y="1" width="118" height="30" rx="15" fill="url(#coordGrad)" stroke={location.type.startsWith('report') ? "#9333ea" : location.type.startsWith('enemy') ? "#ef4444" : "#10b981"} strokeWidth="1"/>
            </svg>
            <span className={`relative font-mono font-bold bg-gray-900 bg-opacity-90 rounded-xl border shadow-lg backdrop-blur-sm whitespace-nowrap ${
              location.type.startsWith('report') ? 'border-purple-400' : location.type.startsWith('enemy') ? 'border-red-400' : 'border-green-400'
            } ${
              (location.type === 'enemy-farm' || location.type === 'enemy-flank' || location.type === 'enemy-tower') && location.ownerCoordinates ? 'px-3 py-1' : 'px-4 py-1.5'
            }`}>
              <LocationName 
                name={location.name} 
                className={`${
                  location.type.startsWith('report') ? 'text-purple-300' : location.type.startsWith('enemy') ? 'text-red-300' : 'text-green-300'
                } ${
                  (location.type === 'enemy-farm' || location.type === 'enemy-flank' || location.type === 'enemy-tower') && location.ownerCoordinates ? 'text-xl' : 'text-3xl'
                }`}
              />
            </span>
          </div>
        </div>

        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
          <span className="text-sm text-orange-300 font-medium bg-gray-900 bg-opacity-90 px-3 py-1 rounded shadow-md whitespace-nowrap font-mono border border-orange-600/40">
            [{LABELS[location.type] || location.type}]
          </span>
        </div>
      </div>
      
      <div className="flex-1 text-orange-200 pr-12 mt-2 font-mono">
        <div className="mt-8 flex flex-col gap-2">
          {location.type.startsWith('report') && location.time && (
            <div className="text-sm text-gray-400">
              {location.time}
            </div>
          )}
          {location.primaryRockets && location.primaryRockets > 0 && !location.type.startsWith('friendly') && !location.type.startsWith('report') && (
            <div className="text-sm text-gray-400">
              <span className="text-orange-400 font-medium">[ROCKETS: {location.primaryRockets}]</span>
            </div>
          )}
          {location.enemyPlayers && location.type.startsWith('report') && (
            <div className="text-sm text-gray-400">
              <span className="text-red-400 font-medium">Enemies: {location.enemyPlayers}</span>
            </div>
          )}
          {location.friendlyPlayers && location.type.startsWith('report') && (
            <div className="text-sm text-gray-400">
              <span className="text-green-400 font-medium">Friendlies: {location.friendlyPlayers}</span>
            </div>
          )}
          {ownedBases.length > 0 && (
            <div className="text-sm text-gray-400">
              <span className="text-orange-400 font-medium">[OWNS {ownedBases.length} BASE{ownedBases.length > 1 ? 'S' : ''}]:</span>
              <div className="mt-1 ml-2">
                {ownedBases.map((base, index) => (
                  <button
                    key={index}
                    onClick={() => onSelectLocation(base)}
                    className="text-xs text-orange-400 hover:text-orange-300 text-left transition-colors block"
                  >
                    • {base.name} ({LABELS[base.type].replace('Friendly ', '').replace('Main ', '')})
                  </button>
                ))}
              </div>
            </div>
          )}
          {(location.roofCamper || location.hostileSamsite || location.abandoned) && (
            <div className="text-sm text-gray-400 flex gap-3 flex-wrap">
              {location.roofCamper && (
                <span className="text-orange-400 font-medium flex items-center gap-1">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="8" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                  Roof Camper
                </span>
              )}
              {location.hostileSamsite && (
                <span className="text-yellow-400 font-medium flex items-center gap-1">
                  <span className="bg-yellow-500 text-black rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">!</span>
                  Hostile Samsite
                </span>
              )}
            </div>
          )}
        </div>
              {location.abandoned && (
                <span className="text-gray-400 font-medium flex items-center gap-1">
                  <span className="bg-gray-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">A</span>
                  Abandoned
                </span>
              )}
      </div>
    </div>
  )
}

// ============= MAIN COMPONENT =============
export default function InteractiveTacticalMap() {
  const queryClient = useQueryClient()
  const [locations, setLocations] = useState<any[]>([])
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [contextMenu, setContextMenu] = useState({ x: 0, y: 0, visible: false })
  const [newBaseModal, setNewBaseModal] = useState({ x: 0, y: 0, visible: false })
  const [modalType, setModalType] = useState('friendly')
  const [editingLocation, setEditingLocation] = useState(null)
  const [showReportPanel, setShowReportPanel] = useState(false)
  const [showAdvancedPanel, setShowAdvancedPanel] = useState(false)
  
  // New Report System State
  const [showPlayerModal, setShowPlayerModal] = useState(false)
  const [showTeamsModal, setShowTeamsModal] = useState(false)
  const [showBaseReportModal, setShowBaseReportModal] = useState(false)
  const [showTaskReportModal, setShowTaskReportModal] = useState(false)
  const [showLogsModal, setShowLogsModal] = useState(false)
  const [showProgressionModal, setShowProgressionModal] = useState(false)
  const [taskSummaryPopup, setTaskSummaryPopup] = useState({
    isVisible: false,
    task: null,
    position: { x: 0, y: 0 }
  })
  
  // Progression Display State
  const [progressionDisplay, setProgressionDisplay] = useState({
    enabled: false,
    inGroupWeapon: 'Spear',
    aloneWeapon: 'Spear',
    counteringWeapon: 'Spear'
  })
  const [baseReportData, setBaseReportData] = useState({
    baseId: null,
    baseName: null,
    baseCoords: null,
    baseType: null
  })
  
  const [taskReportData, setTaskReportData] = useState({
    baseId: null,
    baseName: null,
    baseCoords: null,
    taskType: null
  })
  
  const [editingTaskReport, setEditingTaskReport] = useState(null)
  
  // Heat map configuration state
  const [heatMapConfig, setHeatMapConfig] = useState<HeatMapConfig>({
    enabled: false,
    radius: 50,
    maxIntensity: 10,
    opacity: 0.6,
    colorScheme: 'red'
  })
  const [showHeatMapControls, setShowHeatMapControls] = useState(false)
  
  // Wipe countdown state
  const [wipeCountdown, setWipeCountdown] = useState(null)
  


  
  // Report Modal Handlers
  const onOpenReport = useCallback(async (location) => {
    // If this is a report marker (has reportId), fetch the actual report from database
    if (location.isReportMarker && location.reportId) {
      try {
        const response = await fetch(`/api/reports/${location.reportId}`)
        if (response.ok) {
          const report = await response.json()
          console.log('Loaded report for viewing:', report)
          
          // Check report type and open appropriate modal
          if (report.type === 'task') {
            // Open task report in TaskReportModal
            setTaskReportData({
              baseId: report.baseTags[0] || location.id,
              baseName: location.name,
              baseCoords: location.coordinates || location.name
            })
            setEditingTaskReport(report)
            setShowTaskReportModal(true)
            return
          } else {
            // Open other report types in BaseModal (ActionReportModal)
            setEditingLocation({
              ...location,
              // Map report data to location format for BaseModal
              outcome: report.outcome === 'good' ? 'won' : report.outcome === 'bad' ? 'lost' : 'neutral',
              notes: report.notes,
              enemyPlayers: report.enemyPlayers || '',
              friendlyPlayers: report.friendlyPlayers || '',
              reportId: location.displayReportId || `R${report.id}`, // Use stored alphanumeric ID or fallback
              databaseId: report.id // Store the database ID for API calls
            })
            console.log('Set editingLocation with reportId:', location.displayReportId, 'databaseId:', report.id)
            setModalType('report')
            setNewBaseModal({ x: location.x, y: location.y, visible: true })
            return
          }
        }
      } catch (error) {
        console.error('Error loading report:', error)
      }
    }
    
    // Fallback for non-report locations or if report loading fails
    setBaseReportData({
      baseId: location.id,
      baseName: location.name,
      baseCoords: location.coordinates,
      baseType: location.type
    })
    setShowBaseReportModal(true)
  }, [])

  const onOpenBaseReport = useCallback((location) => {
    setBaseReportData({
      baseId: location.id,
      baseName: location.name,
      baseCoords: location.coordinates,
      baseType: location.type
    })
    setShowBaseReportModal(true)
  }, [])

  const onOpenTaskReport = useCallback((baseData) => {
    setTaskReportData({
      baseId: baseData.baseId,
      baseName: baseData.baseName,
      baseCoords: baseData.baseCoords,
      taskType: baseData.taskType || null,
      initialRepairType: baseData.repairUpgradeType || null
    })
    setEditingTaskReport(null) // Clear any existing editing report for new task
    setShowTaskReportModal(true)
  }, [])

  const handleCreateExpressTaskReport = useCallback(async (baseData) => {
    try {
      let taskReport
      
      if (baseData.pickupType) {
        // Create pickup task report
        taskReport = {
          type: 'task',
          notes: `Express ${baseData.pickupType} pickup - Created via radial menu`,
          outcome: 'neutral',
          enemyPlayers: '',
          friendlyPlayers: '',
          baseTags: [baseData.baseId],
          screenshots: [],
          location: { gridX: 0, gridY: 0 }, // Will be updated by backend if needed
          taskType: 'needs_pickup',
          taskData: {
            pickupType: baseData.pickupType, // 'ore' or 'loot'
            subtask: baseData.pickupType === 'ore' ? 'Pickaxe' : 'Package',
            details: `Express ${baseData.pickupType} pickup task for ${baseData.baseName}`,
            urgency: 'medium'
          },
          status: 'pending'
        }
      } else if (baseData.repairUpgradeType) {
        // Create repair/upgrade task report
        taskReport = {
          type: 'task',
          notes: `Express ${baseData.repairUpgradeType} - Created via radial menu`,
          outcome: 'neutral',
          enemyPlayers: '',
          friendlyPlayers: '',
          baseTags: [baseData.baseId],
          screenshots: [],
          location: { gridX: 0, gridY: 0 }, // Will be updated by backend if needed
          taskType: 'repair_upgrade',
          taskData: {
            repairUpgradeType: baseData.repairUpgradeType, // 'repair' or 'upgrade'
            details: `Express ${baseData.repairUpgradeType} task for ${baseData.baseName}`,
            urgency: 'medium'
          },
          status: 'pending'
        }
      } else if (baseData.requestedResources) {
        // Create request resources task report
        taskReport = {
          type: 'task',
          notes: '',
          outcome: 'neutral',
          enemyPlayers: '',
          friendlyPlayers: '',
          baseTags: [baseData.baseId],
          screenshots: [],
          location: { gridX: 0, gridY: 0 }, // Will be updated by backend if needed
          taskType: 'request_resources',
          taskData: {
            wood: baseData.requestedResources.wood || '',
            stone: baseData.requestedResources.stone || '',
            metal: baseData.requestedResources.metal || '',
            hqm: baseData.requestedResources.hqm || '',
            details: `Express resource request for ${baseData.baseName}`,
            urgency: 'medium'
          },
          status: 'pending'
        }
      } else if (baseData.kitResources) {
        // Check if a stock_kits task report already exists for this base
        const existingStockKitsReport = reports.find(report => 
          report.type === 'task' &&
          report.taskType === 'stock_kits' &&
          report.status === 'pending' &&
          report.baseTags && 
          report.baseTags.includes(baseData.baseId)
        )

        if (existingStockKitsReport) {
          // Update existing report by adding new kit values to existing ones
          const currentKitResources = existingStockKitsReport.taskData?.kitResources || {}
          const updatedKitResources = { ...currentKitResources }
          
          // Add new values to existing values for each kit type
          Object.keys(baseData.kitResources).forEach(kitType => {
            const newValue = parseInt(baseData.kitResources[kitType]) || 0
            const currentValue = parseInt(currentKitResources[kitType]) || 0
            if (newValue > 0) {
              updatedKitResources[kitType] = (currentValue + newValue).toString()
            }
          })

          // Update the existing report
          await apiRequest('PUT', `/api/reports/${existingStockKitsReport.id}`, {
            ...existingStockKitsReport,
            taskData: {
              ...existingStockKitsReport.taskData,
              kitResources: updatedKitResources
            }
          })
        } else {
          // Create new stock kits task report
          taskReport = {
            type: 'task',
            notes: '',
            outcome: 'neutral',
            enemyPlayers: '',
            friendlyPlayers: '',
            baseTags: [baseData.baseId],
            screenshots: [],
            location: { gridX: 0, gridY: 0 }, // Will be updated by backend if needed
            taskType: 'stock_kits',
            taskData: {
              kitResources: baseData.kitResources,
              details: `Express kit request for ${baseData.baseName}`,
              urgency: 'medium'
            },
            status: 'pending'
          }
          
          // Save the new task report
          await apiRequest('POST', '/api/reports', taskReport)
        }
      } else {
        // Save other task report types
        await apiRequest('POST', '/api/reports', taskReport)
      }

      // Invalidate reports query to refresh the list and map icons
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] })
      
      console.log('Express task report created:', taskReport)
    } catch (error) {
      console.error('Failed to create express task report:', error)
    }
  }, [])

  const handleTaskIconClick = useCallback((event, task) => {
    event.stopPropagation()
    const rect = event.currentTarget.getBoundingClientRect()
    const iconCenterX = rect.left + (rect.width / 2)
    const iconCenterY = rect.top + (rect.height / 2)
    setTaskSummaryPopup({
      isVisible: true,
      task: task,
      position: { 
        x: iconCenterX - 240, // Position popup so its bottom-right corner aligns with icon center (assuming 240px width)
        y: iconCenterY - 120  // Position popup so its bottom-right corner aligns with icon center (assuming ~120px height)
      }
    })
  }, [])

  // Fetch player data for online count display
  const { data: externalPlayers = [] } = useQuery<ExternalPlayer[]>({
    queryKey: ['/api/players'],
    staleTime: 60000, // Cache for 1 minute
    refetchOnWindowFocus: false, // Don't refetch on focus to reduce requests
    retry: 1, // Minimal retries
    throwOnError: false, // Don't crash on errors
  })

  const { data: premiumPlayers = [] } = useQuery({
    queryKey: ['/api/premium-players'],
    staleTime: 60000,
    refetchOnWindowFocus: false,
    retry: 1,
    throwOnError: false,
  })
  
  // Fetch all reports for task report icons
  const { data: reports = [] } = useQuery({
    queryKey: ['/api/reports'],
    staleTime: 30000,
    refetchOnWindowFocus: false,
    retry: 1,
    throwOnError: false,
  })

  // Combine external and premium players - memoized for performance
  const players = useMemo(() => [
    ...externalPlayers,
    ...premiumPlayers.map(p => ({
      ...p,
      isOnline: false, // Premium players are considered offline for display
      totalSessions: 0
    }))
  ], [externalPlayers, premiumPlayers])
  
  // Get pending task reports for map icons
  const pendingTaskReports = useMemo(() => {
    return reports.filter(report => 
      report.type === 'task' && 
      report.status === 'pending' &&
      report.baseTags && report.baseTags.length > 0
    )
  }, [reports])

  const mapRef = useRef(null)
  const {
    timers: locationTimers,
    addTimer: addLocationTimer,
    removeTimer: removeLocationTimer,
    getDecayInfo
  } = useLocationTimers()
  const { zoom, setZoom, pan, setPan, isDragging, setIsDragging, isDraggingRef, dragStartRef, hasDraggedRef } = useMapInteraction()
  
  // Handle BaseModal report events
  useBaseReportEvents(setBaseReportData, setShowBaseReportModal)
  
  // Handle subordinate base modal navigation
  useEffect(() => {
    const handleOpenBaseModal = (event) => {
      const { location, modalType } = event.detail
      if (location && modalType === 'enemy') {
        setEditingLocation(location)
        setModalType('enemy')
        setNewBaseModal({ 
          visible: true,
          x: location.x, 
          y: location.y 
        })
      }
    }

    window.addEventListener('openBaseModal', handleOpenBaseModal)
    
    return () => {
      window.removeEventListener('openBaseModal', handleOpenBaseModal)
    }
  }, [])



  const getOwnedBases = useCallback((ownerName) => {
    const ownerBase = ownerName.split('(')[0]
    return locations.filter(loc => 
      loc.ownerCoordinates && loc.ownerCoordinates.split('(')[0] === ownerBase
    )
  }, [locations])
  
  const handleContextMenu = useCallback((e) => {
    e.preventDefault()
    if (!hasDraggedRef.current && mapRef.current) {
      const rect = mapRef.current.getBoundingClientRect()
      const centerX = rect.width / 2
      const centerY = rect.height / 2
      const clickX = e.clientX - rect.left
      const clickY = e.clientY - rect.top
      const x = ((clickX - centerX - pan.x) / zoom + centerX) / rect.width * 100
      const y = ((clickY - centerY - pan.y) / zoom + centerY) / rect.height * 100
      if (x >= 0 && x <= 100 && y >= 0 && y <= 100) {
        setContextMenu({ x: e.clientX, y: e.clientY, visible: true })
        console.log("Context menu should be visible at:", e.clientX, e.clientY)
        setNewBaseModal({ x, y, visible: false })
      }
    }
  }, [pan, zoom, hasDraggedRef])
  
  const handleAddBase = useCallback((type) => {
    setContextMenu(prev => ({ ...prev, visible: false }))
    setEditingLocation(null)
    // Clear any stale base report data
    setBaseReportData({
      baseId: null,
      baseName: null,
      baseCoords: null,
      baseType: null
    })
    setModalType(type)
    console.log("Modal type set to:", type, "Modal should be visible:", true)
    setNewBaseModal(prev => ({ ...prev, visible: true }))
  }, [])
  
  const handleEditBase = useCallback((location) => {
    setEditingLocation(location)
    
    if (location.type.startsWith('friendly')) setModalType('friendly')
    else if (location.type.startsWith('enemy')) setModalType('enemy')
    else setModalType('report')
    
    setNewBaseModal({ x: location.x, y: location.y, visible: true })
  }, [])
  
  const handleSaveBase = useCallback(async (baseData) => {
    // If this is a report, save to database instead of creating a map location
    if (modalType === 'report') {
      const reportData = {
        type: "general",
        notes: baseData.notes || `${baseData.type.replace('report-', '')} report`,
        outcome: baseData.outcome === 'won' ? 'good' : baseData.outcome === 'lost' ? 'bad' : 'neutral',
        enemyPlayers: baseData.enemyPlayers || "",
        friendlyPlayers: baseData.friendlyPlayers || "",
        playerTags: [], // Keep legacy field empty
        baseTags: [],
        screenshots: [],
        location: { 
          gridX: Math.floor(newBaseModal.x / 3.125), 
          gridY: Math.floor(newBaseModal.y / 4.167) 
        }
      }
      
      console.log('Saving report:', reportData)
      try {
        // Check if this is editing an existing report
        if (editingLocation?.reportId) {
          // Update existing report
          const response = await fetch(`/api/reports/${editingLocation.reportId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reportData)
          })
          if (response.ok) {
            console.log('Report updated successfully')
            // Refresh reports and update the map location
            queryClient.invalidateQueries({ queryKey: ['/api/reports'] })
            queryClient.invalidateQueries({ queryKey: ['/api/reports/base'] })
            
            // Update the visual marker on the map, preserving the database reportId
            setLocations(prev => prev.map(loc => 
              loc.id === editingLocation.id 
                ? { ...loc, ...baseData, outcome: baseData.outcome, reportId: editingLocation.reportId, notes: baseData.notes }
                : loc
            ))
          } else {
            console.error('Failed to update report:', await response.text())
          }
        } else {
          // Create new report
          const response = await fetch('/api/reports', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reportData)
          })
          if (response.ok) {
            const savedReport = await response.json()
            console.log('Report saved successfully with ID:', savedReport.id, 'Display ID:', baseData.reportId)
            // Refresh reports in any open logs modal
            queryClient.invalidateQueries({ queryKey: ['/api/reports'] })
            queryClient.invalidateQueries({ queryKey: ['/api/reports/base'] })
            
            // Create a visual marker on the map for this report
            const reportMarker = {
              id: `report-${savedReport.id}`, // Use database ID for consistency
              name: savedReport.displayId || baseData.reportId, // Use the actual displayId from database
              x: newBaseModal.x,
              y: newBaseModal.y,
              type: baseData.type,
              notes: baseData.notes,
              outcome: baseData.outcome,
              time: new Date().toLocaleTimeString(),
              isReportMarker: true, // Flag to distinguish from regular bases
              reportId: savedReport.id, // Database ID for API calls
              displayReportId: savedReport.displayId || baseData.reportId, // Alphanumeric ID for display
              enemyPlayers: baseData.enemyPlayers || '',
              friendlyPlayers: baseData.friendlyPlayers || ''
            }
            console.log('Created report marker:', reportMarker)
            setLocations(prev => [...prev, reportMarker])
          } else {
            console.error('Failed to save report:', await response.text())
          }
        }
      } catch (error) {
        console.error('Error saving report:', error)
      }
      
      setNewBaseModal(prev => ({ ...prev, visible: false }))
      setEditingLocation(null)
      return
    }
    
    // Regular base/location saving logic below:
    let currentLocation;
    if (editingLocation) {
      const updatedLocation = { ...editingLocation, ...baseData };
      setLocations(prev => prev.map(loc => 
        loc.id === editingLocation.id ? updatedLocation : loc
      ))
      setSelectedLocation(updatedLocation)
      currentLocation = updatedLocation;
    } else {
      const newLocation = {
        id: Date.now().toString(),
        name: getGridCoordinate(newBaseModal.x, newBaseModal.y, locations, null),
        x: newBaseModal.x,
        y: newBaseModal.y,
        ...baseData
      }
      setLocations(prev => [...prev, newLocation])
      setSelectedLocation(newLocation)
      currentLocation = newLocation;
    }
    
    // Create player base tags if players are assigned to this base
    if (baseData.players && baseData.players.trim()) {
      const playerNames = baseData.players.split(',').map(name => name.trim()).filter(name => name);
      
      try {
        // First, delete any existing player base tags for this base
        if (editingLocation) {
          await apiRequest('DELETE', `/api/player-base-tags/base/${currentLocation.id}`);
        }
        
        // Create new player base tags for each player
        for (const playerName of playerNames) {
          await apiRequest('POST', '/api/player-base-tags', {
            playerName: playerName,
            baseId: currentLocation.id,
            baseName: currentLocation.name,
            baseCoords: currentLocation.name,
            baseType: currentLocation.type
          });
        }
        
        // Invalidate relevant queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['/api/player-base-tags'] });
        queryClient.invalidateQueries({ queryKey: ['/api/player-base-tags/player'] });
        queryClient.invalidateQueries({ queryKey: ['/api/player-base-tags/base', currentLocation.id] });
        
        console.log(`Created player base tags for ${playerNames.length} players on base ${currentLocation.name}`);
      } catch (error) {
        console.error('Error creating player base tags:', error);
      }
    }
    
    setNewBaseModal(prev => ({ ...prev, visible: false }))
    setEditingLocation(null)
  }, [editingLocation, newBaseModal, locations, modalType, queryClient])
  
  const handleCancel = useCallback(() => {
    setNewBaseModal(prev => ({ ...prev, visible: false }))
    setEditingLocation(null)
    setShowReportPanel(false)
    setShowAdvancedPanel(false)
  }, [])
  
  const handleDeleteLocation = useCallback(async () => {
    if (editingLocation) {
      // Delete associated reports from database if this is a base with a name
      if (editingLocation.name) {
        try {
          // Fetch all reports for this base
          const response = await fetch('/api/reports')
          const allReports = await response.json()
          
          // Find reports that belong to this base using base ID (primary) and name (fallback)
          const reportsToDelete = allReports.filter(report => 
            report.baseId === editingLocation.id ||
            report.locationName === editingLocation.name ||
            report.locationCoords === editingLocation.name ||
            (report.content?.baseName === editingLocation.name) ||
            (report.content?.baseCoords === editingLocation.name)
          )
          
          // Delete each report
          for (const report of reportsToDelete) {
            await fetch(`/api/reports/${report.id}`, {
              method: 'DELETE'
            })
          }
        } catch (error) {
          console.error('Error deleting associated reports:', error)
        }
      }

      // Delete associated player base tags
      try {
        await fetch(`/api/player-base-tags/base/${editingLocation.id}`, {
          method: 'DELETE'
        })
      } catch (error) {
        console.error('Error deleting associated player base tags:', error)
      }
      
      setLocations(prev => prev.filter(loc => loc.id !== editingLocation.id))
      setSelectedLocation(null)
      // Timer cleanup is handled by the useLocationTimers hook
      handleCancel()
    }
  }, [editingLocation, handleCancel])
  
  const handleWheel = useCallback((e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.3 : 0.3
    const rect = mapRef.current?.getBoundingClientRect()
    if (rect) {
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top
      const centerX = rect.width / 2
      const centerY = rect.height / 2
      
      const offsetX = mouseX - centerX
      const offsetY = mouseY - centerY
      
      const newZoom = Math.min(Math.max(zoom + delta, 1), 8)
      
      if (newZoom !== zoom) {
        const zoomRatio = newZoom / zoom
        const newPanX = pan.x - offsetX * (zoomRatio - 1)
        const newPanY = pan.y - offsetY * (zoomRatio - 1)
        
        setZoom(newZoom)
        setPan({ x: newPanX, y: newPanY })
      }
    } else {
      setZoom(Math.min(Math.max(zoom + delta, 1), 8))
    }
  }, [zoom, setZoom, pan, setPan])
  
  const handleMouseDown = useCallback((e) => {
    if (e.button === 0) {
      e.preventDefault()
      isDraggingRef.current = true
      hasDraggedRef.current = false
      dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }
      setIsDragging(true)
    }
  }, [pan, isDraggingRef, hasDraggedRef, dragStartRef, setIsDragging])
  
  const handleClick = useCallback((e) => {
    if (!hasDraggedRef.current) {
      setContextMenu(prev => ({ ...prev, visible: false }))
      setSelectedLocation(null)
    }
    hasDraggedRef.current = false
  }, [hasDraggedRef])
  
  const handleRemoveTimer = useCallback((locationId, timerId) => {
    removeLocationTimer(timerId)
  }, [removeLocationTimer])
  
  const handleAddTimer = useCallback((locationId, timer) => {
    addLocationTimer(locationId, timer)
  }, [addLocationTimer])
  
  return (
    <div className="h-screen w-screen bg-gradient-to-b from-gray-900 to-black font-mono overflow-hidden">

      <style>{`
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] {
          -moz-appearance: textfield;
        }
        input[type="range"] {
          -webkit-appearance: none;
          background: transparent;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px;
          height: 14px;
          background: transparent;
          cursor: pointer;
        }
        input[type="range"]::-moz-range-thumb {
          width: 14px;
          height: 14px;
          background: transparent;
          cursor: pointer;
          border: none;
        }
        input[type="time"]::-webkit-calendar-picker-indicator {
          filter: invert(1);
          cursor: pointer;
        }
        input[type="checkbox"] {
          cursor: pointer;
        }
        input[type="checkbox"]:checked {
          background-color: #3B82F6;
          border-color: #3B82F6;
        }
        input[type="checkbox"]:focus {
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
        }
        @keyframes pulsate {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.075);
            opacity: 0.9;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .selection-ring {
          animation: spin 24s linear infinite;
        }
        .selection-ring svg {
          animation: pulsate 4s ease-in-out infinite;
        }
      `}</style>
      
      {/* Tactical Map Toolbar Component */}
      <TacticalMapToolbar 
        onButtonClick={(buttonType) => {
          if (buttonType === 'Players') setShowPlayerModal(true)
          else if (buttonType === 'Logs') setShowLogsModal(true)
          else if (buttonType === 'Progression') setShowProgressionModal(true)
          else if (buttonType === 'Gene Calculator') openGeneCalculator()
          else if (buttonType === 'Teams') setShowTeamsModal(true)
        }}
        progressionDisplay={progressionDisplay}
        onWipeCountdownChange={setWipeCountdown}
      />

      <div className="w-full h-full pt-20">
        <div className="relative w-full h-full">
          <div 
            ref={mapRef}
            className="relative bg-gradient-to-br from-teal-600 via-teal-500 to-cyan-500 shadow-2xl overflow-hidden cursor-default select-none w-full h-full"
            style={{ touchAction: 'none' }}
            onContextMenu={handleContextMenu}
            onClick={handleClick}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseUp={() => { isDraggingRef.current = false; setIsDragging(false) }}
            onMouseLeave={() => { isDraggingRef.current = false; setIsDragging(false) }}
          >
            <div
              className="w-full h-full transform-gpu"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 100ms ease-out'
              }}
            >
              {/* Map Background Component */}
              <TacticalMapBackground mapDimensions={{ width: 800, height: 800 }} />

              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 800" style={{display: 'none'}}>
                <path d="M150,200 Q200,100 350,80 Q500,60 600,150 Q700,250 650,400 Q600,500 450,520 Q300,540 200,450 Q100,350 150,200 Z"
                      fill="#fbbf24" stroke="#d97706" strokeWidth="3"/>
                <path d="M160,210 Q210,110 350,90 Q490,70 590,160 Q680,260 640,390 Q590,490 450,510 Q310,530 210,440 Q110,360 160,210 Z"
                      fill="#22c55e" opacity="0.8"/>
              </svg>

              {/* Map Grid Component */}
              <TacticalMapGrid mapDimensions={{ width: 800, height: 800 }} />

{/* Heat Map Overlay */}
              <HeatMapOverlay
                locations={locations}
                players={players || []}
                config={heatMapConfig}
                mapDimensions={{ width: 800, height: 800 }}
                onConfigChange={setHeatMapConfig}
              />

{/* Connection lines between grouped bases when one is selected */}
              {selectedLocation && (() => {
                const selectedGroupColor = getGroupColor(selectedLocation.id, locations)
                if (!selectedGroupColor) return null
                
                const groupBases = getBaseGroup(selectedLocation.id, locations)
                if (groupBases.length <= 1) return null
                
                const mainBase = groupBases.find(base => 
                  base.type === "enemy-small" || base.type === "enemy-medium" || base.type === "enemy-large"
                )
                
                if (!mainBase) return null
                
                const subordinates = groupBases.filter(base => 
                  base.type === "enemy-flank" || base.type === "enemy-farm" || base.type === "enemy-tower"
                )
                
                return (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{zIndex: 0}}>
                    {subordinates.map(subordinate => (
                      <line
                        key={`line-${mainBase.id}-${subordinate.id}`}
                        x1={`${mainBase.x}%`}
                        y1={`${mainBase.y}%`}
                        x2={`${subordinate.x}%`}
                        y2={`${subordinate.y}%`}
                        stroke={selectedGroupColor}
                        strokeWidth="3"
                        opacity="0.6"
                      />
                    ))}
                  </svg>
                )
              })()}

              {locations.map((location) => (
                <LocationMarker
                  key={location.id}
                  location={location}
                  locations={locations}
                  isSelected={selectedLocation?.id === location.id}
                  onClick={setSelectedLocation}
                  timers={locationTimers[location.id]}
                  onRemoveTimer={(timerId) => handleRemoveTimer(location.id, timerId)}
                  getOwnedBases={getOwnedBases}
                  players={players}
                  onOpenReport={onOpenBaseReport}
                  onOpenBaseReport={(location) => {
                    setBaseReportData({
                      baseId: location.id,
                      baseName: location.name,
                      baseCoords: location.coordinates,
                      baseType: location.type
                    })
                    setShowBaseReportModal(true)
                  }}
                  pendingTaskReports={pendingTaskReports}
                  onTaskIconClick={handleTaskIconClick}
                />
              ))}
            </div>
          </div>

          {selectedLocation && (
            <SelectedLocationPanel 
              location={selectedLocation}
              onEdit={handleEditBase}
              getOwnedBases={getOwnedBases}
              onSelectLocation={setSelectedLocation}
              locationTimers={locationTimers}
              onAddTimer={handleAddTimer}
              onOpenReport={onOpenBaseReport}
              onOpenTaskReport={onOpenTaskReport}
              onCreateExpressTaskReport={handleCreateExpressTaskReport}
              players={players}
              locations={locations}
              reports={reports}
              wipeCountdown={wipeCountdown}
              onOpenBaseReport={(location) => {
                setBaseReportData({
                  baseId: location.id,
                  baseName: location.name,
                  baseCoords: location.coordinates,
                  baseType: location.type
                })
                setShowBaseReportModal(true)
              }}
            />
          )}
        </div>

        {contextMenu.visible && (
          <ContextMenu 
            x={contextMenu.x}
            y={contextMenu.y}
            onAddBase={handleAddBase}
          />
        )}

        {newBaseModal.visible && (
          <BaseModal 
            modal={newBaseModal}
            modalType={modalType}
            editingLocation={editingLocation}
            locations={locations}
            onSave={handleSaveBase}
            onCancel={handleCancel}
            onDelete={handleDeleteLocation}
            onOpenBaseReport={onOpenBaseReport}
            onOpenReport={onOpenReport}
          />
        )}


        <ActionReportModal
          isVisible={showBaseReportModal}
          onClose={() => setShowBaseReportModal(false)}
          baseId={baseReportData.baseId || ''}
          baseName={baseReportData.baseName || ''}
          baseCoords={baseReportData.baseCoords || ''}
        />

        <TaskReportModal
          isVisible={showTaskReportModal}
          onClose={() => {
            setShowTaskReportModal(false)
            setEditingTaskReport(null)
          }}
          baseId={taskReportData.baseId || ''}
          baseName={taskReportData.baseName || ''}
          baseCoords={taskReportData.baseCoords || ''}
          editingReport={editingTaskReport}
          taskType={taskReportData.taskType}
          initialRepairType={taskReportData.initialRepairType}
        />

        <TaskSummaryPopup
          isVisible={taskSummaryPopup.isVisible}
          onClose={() => setTaskSummaryPopup(prev => ({ ...prev, isVisible: false }))}
          task={taskSummaryPopup.task}
          position={taskSummaryPopup.position}
        />

        <PlayerModal
          isOpen={showPlayerModal}
          onClose={() => setShowPlayerModal(false)}
        />

        <LogsModal
          isOpen={showLogsModal}
          onClose={() => setShowLogsModal(false)}
        />

        <TeamsModal
          isOpen={showTeamsModal}
          onClose={() => setShowTeamsModal(false)}
          locations={locations}
          players={players}
          onOpenBaseModal={(base) => {
            setEditingLocation(base)
            setModalType(base.type.startsWith('friendly') ? 'friendly' : 'enemy')
            setNewBaseModal({ x: 0, y: 0, visible: true })
            setShowTeamsModal(false)
          }}
        />

        <ProgressionModal
          isOpen={showProgressionModal}
          onClose={() => setShowProgressionModal(false)}
          onProgressionDisplayChange={setProgressionDisplay}
        />
      </div>
    </div>
  )
}