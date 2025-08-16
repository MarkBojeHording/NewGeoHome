import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, User, Plus } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { ExternalPlayer } from '@shared/schema';

interface PlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PlayerModal({ isOpen, onClose }: PlayerModalProps) {
  const [nameSearch, setNameSearch] = useState('');
  const [baseNumberSearch, setBaseNumberSearch] = useState('');
  const [showPremiumDialog, setShowPremiumDialog] = useState(false);
  const [premiumPlayerName, setPremiumPlayerName] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  
  const queryClient = useQueryClient();

  // Fetch players from the external API via our server
  const { data: players = [], isLoading } = useQuery<ExternalPlayer[]>({
    queryKey: ['/api/players'],
    enabled: isOpen,
  });

  // Fetch premium players from our database
  const { data: premiumPlayers = [] } = useQuery<any[]>({
    queryKey: ['/api/premium-players'],
    enabled: isOpen,
  });



  // Fetch session history for selected player (for heat map display)
  const { data: sessionHistory = [], isLoading: isLoadingHistory } = useQuery<any[]>({
    queryKey: ['/api/players', selectedPlayer, 'sessions'],
    enabled: !!selectedPlayer,
  });

  // Fetch player base tags for selected player
  const { data: playerBaseTags = [] } = useQuery<any[]>({
    queryKey: ['/api/player-base-tags/player', selectedPlayer],
    enabled: !!selectedPlayer,
  });

  // Filter players based on search criteria
  const filteredPlayers = players.filter(player => {
    const nameMatch = nameSearch === '' || player.playerName.toLowerCase().includes(nameSearch.toLowerCase());
    // For now, no additional filtering for base number search
    const sessionMatch = baseNumberSearch === '';
    return nameMatch && sessionMatch;
  });

  // Filter premium players based on search criteria
  const filteredPremiumPlayers = premiumPlayers.filter((player: any) => {
    const nameMatch = nameSearch === '' || player.playerName.toLowerCase().includes(nameSearch.toLowerCase());
    return nameMatch;
  });

  const createPremiumPlayer = async () => {
    if (!premiumPlayerName.trim()) return;
    
    try {
      await apiRequest('POST', '/api/premium-players', { 
        playerName: premiumPlayerName.trim() 
      });
      
      // Refresh premium players data
      queryClient.invalidateQueries({ queryKey: ['/api/premium-players'] });
      
      // Close dialog and reset form
      setShowPremiumDialog(false);
      setPremiumPlayerName('');
    } catch (error) {
      console.error('Failed to create premium player:', error);
    }
  };

  // Heat map generation function
  const generateHeatMapData = (sessions: any[]) => {
    if (!sessions || sessions.length === 0) return {};
    
    // Create a map for each day of the week and each hour (0-23)
    const heatMap: { [key: string]: { [key: number]: number } } = {};
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Initialize heat map structure
    days.forEach(day => {
      heatMap[day] = {};
      for (let hour = 0; hour < 24; hour++) {
        heatMap[day][hour] = 0;
      }
    });
    
    // Process each session and add to heat map
    sessions.forEach(session => {
      const startTime = new Date(session.startTime);
      const endTime = new Date(session.endTime);
      
      // Get day of week (0 = Sunday, 1 = Monday, etc.)
      const dayIndex = startTime.getDay();
      const dayName = days[dayIndex];
      
      // Handle sessions that span multiple hours or days
      let currentTime = new Date(startTime);
      while (currentTime < endTime) {
        const currentDayIndex = currentTime.getDay();
        const currentDayName = days[currentDayIndex];
        const currentHour = currentTime.getHours();
        
        // Calculate how much of this hour is covered by the session
        const hourEnd = new Date(currentTime);
        hourEnd.setMinutes(59, 59, 999);
        
        const sessionEndForThisHour = endTime < hourEnd ? endTime : hourEnd;
        const minutesInThisHour = (sessionEndForThisHour.getTime() - currentTime.getTime()) / (1000 * 60);
        
        // Add intensity based on minutes (0-60 minutes = 0-1 intensity)
        if (heatMap[currentDayName]) {
          heatMap[currentDayName][currentHour] += Math.min(minutesInThisHour / 60, 1);
        }
        
        // Move to next hour
        currentTime = new Date(hourEnd.getTime() + 1);
      }
    });
    
    // Normalize values to prevent intensity > 1
    Object.keys(heatMap).forEach(day => {
      Object.keys(heatMap[day]).forEach(hour => {
        const hourNum = parseInt(hour);
        heatMap[day][hourNum] = Math.min(heatMap[day][hourNum], 1);
      });
    });
    
    return heatMap;
  };

  // Get heat map data for selected player
  const heatMapData = selectedPlayer ? generateHeatMapData(sessionHistory) : {};

  // Helper function to get heat map color intensity
  const getHeatMapColor = (intensity: number) => {
    if (intensity === 0) return { className: 'bg-gray-800', style: {} };
    // Simple white intensity - easier to read and will work better when combined with enemy base colors
    const opacity = Math.min(intensity * 0.8 + 0.2, 1); // Min 20% opacity, max 100%
    return { 
      className: 'bg-white', 
      style: { opacity: opacity.toString() }
    };
  };

  // Helper function to render hour blocks for a day
  const renderDayColumn = (day: string) => {
    const dayData = heatMapData[day] || {};
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    return hours.map(hour => {
      const intensity = dayData[hour] || 0;
      const colorConfig = getHeatMapColor(intensity);
      
      return (
        <div
          key={hour}
          className={`${colorConfig.className} border-b border-gray-700`}
          style={{
            height: '8px',
            marginBottom: '0.5px',
            ...colorConfig.style
          }}
          title={`${day} ${hour}:00 - Activity: ${Math.round(intensity * 100)}%`}
        />
      );
    });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[1150px] min-w-[1150px] max-w-[1150px] h-[800px] bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-semibold flex items-center gap-2">
              <User className="w-5 h-5" />
              {selectedPlayer ? `${selectedPlayer} - Activity Heat Map` : 'Player Management'}
              {!selectedPlayer && (
                <Plus 
                  className="w-4 h-4 text-orange-400 cursor-pointer hover:text-orange-300" 
                  onClick={() => setShowPremiumDialog(true)}
                />
              )}
              {selectedPlayer && (
                <Button
                  onClick={() => setSelectedPlayer(null)}
                  variant="outline"
                  size="sm"
                  className="ml-auto border-gray-600 text-gray-400 hover:bg-gray-800"
                >
                  Back to Players
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Activity Heat Map View */}
            {selectedPlayer ? (
              <div className="h-[650px] flex gap-4">
                {/* Left Column - Session History */}
                <div className="w-3/4 overflow-y-auto bg-gray-800 rounded-lg border border-gray-600 p-4">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-white mb-2">Session History</h3>
                    
                    {/* Base Tags Section */}
                    {playerBaseTags.length > 0 && (
                      <div className="mt-3">
                        <div className="text-sm text-gray-400 mb-1">Base Ownership</div>
                        <div className="flex gap-2 flex-wrap">
                          {playerBaseTags.map((tag: any) => (
                            <span
                              key={tag.id}
                              className="px-2 py-1 bg-blue-600 text-blue-200 text-xs rounded-full"
                              title={`${tag.baseType} base at ${tag.baseCoords}`}
                            >
                              {tag.baseName}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {isLoadingHistory ? (
                    <div className="flex justify-center py-8">
                      <div className="text-gray-400">Loading session history...</div>
                    </div>
                  ) : (
                    <ul className="space-y-1">
                      {sessionHistory.map((session: any) => (
                        <li
                          key={session.id}
                          className="flex justify-between items-center text-xs py-1 px-2 hover:bg-gray-700/50 rounded"
                          data-testid={`session-${session.id}`}
                        >
                          <div className="text-white">
                            {(() => {
                              const startDate = new Date(session.startTime);
                              const endDate = new Date(session.endTime);
                              const startDateStr = startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                              const endDateStr = endDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                              const startTimeStr = startDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
                              const endTimeStr = endDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
                              
                              return startDateStr === endDateStr 
                                ? `${startDateStr} ${startTimeStr} - ${endTimeStr}`
                                : `${startDateStr} ${startTimeStr} - ${endDateStr} ${endTimeStr}`;
                            })()}
                          </div>
                          <div className="text-gray-400 ml-2">
                            {session.durationHours}h
                          </div>
                        </li>
                      ))}
                      {sessionHistory.length === 0 && (
                        <div className="text-center text-gray-400 py-8">
                          No session history available
                        </div>
                      )}
                    </ul>
                  )}
                </div>
                
                {/* Right Section - Heat Map */}
                <div className="flex-1 bg-gray-800 rounded-lg border border-gray-600 p-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Activity Heat Map</h3>
                  
                  {/* Functional Heat Map with Session Data */}
                  <div className="border border-gray-600 rounded-lg bg-gray-700 relative">
                    <label className="absolute top-0 left-0 text-xs font-medium text-gray-300 pl-0.5">
                      {(() => {
                        const playerData = players.find(p => p.playerName === selectedPlayer);
                        return playerData?.isOnline ? 'Online' : 'Offline';
                      })()}
                    </label>
                    <div className="p-2 pt-3">
                      <div className="flex gap-1">
                        {/* Hour labels column */}
                        <div className="w-8">
                          <div className="text-[10px] text-gray-400 text-center mb-1 h-4"></div>
                          <div style={{height: '200px'}} className="flex flex-col justify-between py-1">
                            {[0, 6, 12, 18].map((hour) => (
                              <div key={hour} className="text-[9px] text-gray-500 text-right pr-1">
                                {hour.toString().padStart(2, '0')}:00
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Day columns */}
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                          <div key={day} className="flex-1">
                            <div className="text-[10px] text-gray-400 text-center mb-1">{day}</div>
                            <div className="bg-gray-800 rounded p-0.5" style={{height: '200px', position: 'relative'}}>
                              <div className="flex flex-col h-full">
                                {renderDayColumn(day)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Heat Map Legend - Online/Offline */}
                      <div className="mt-3 flex items-center justify-center gap-4 text-xs text-gray-400">
                        <span>Player Status:</span>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-gray-800 rounded border border-gray-600"></div>
                          <span>Offline</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-white opacity-80 rounded border border-gray-600"></div>
                          <span>Online</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Player Status Summary */}
                  <div className="mt-4 bg-gray-700 rounded-lg p-3">
                    <h4 className="text-white font-medium mb-2">Player Status</h4>
                    <div className="text-center">
                      <div className={`font-bold text-lg ${players.find(p => p.playerName === selectedPlayer)?.isOnline ? 'text-green-400' : 'text-gray-400'}`}>
                        {players.find(p => p.playerName === selectedPlayer)?.isOnline ? 'ONLINE' : 'OFFLINE'}
                      </div>
                      <div className="text-gray-400">Current Status</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Search Controls */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search by player name..."
                      value={nameSearch}
                      onChange={(e) => setNameSearch(e.target.value)}
                      className="pl-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                      data-testid="input-player-name-search"
                    />
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Filter players..."
                      value={baseNumberSearch}
                      onChange={(e) => setBaseNumberSearch(e.target.value)}
                      className="pl-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                      data-testid="input-player-filter"
                    />
                  </div>
                </div>

                {/* Player List */}
                <div className="h-[550px] overflow-y-auto bg-gray-800 rounded-lg border border-gray-600">
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="text-gray-400">Loading players...</div>
                    </div>
                  ) : players.length === 0 && premiumPlayers.length === 0 ? (
                    <div className="flex justify-center py-8">
                      <div className="text-gray-400">No players found. External API may be temporarily unavailable.</div>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-700">
                      {/* Premium Players */}
                      {filteredPremiumPlayers.map((player: any) => (
                        <div
                          key={`premium-${player.id}`}
                          className="p-3 flex items-center justify-between hover:bg-gray-700 transition-colors"
                          data-testid={`premium-player-item-${player.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-orange-500" />
                              <span className="font-medium text-orange-400">
                                {player.playerName}
                              </span>
                              <span className="text-sm text-orange-600">
                                Premium
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-orange-400">
                              Premium User
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {/* Regular Players */}
                      {filteredPlayers.map((player, index) => (
                        <div
                          key={index}
                          className="p-3 flex items-center justify-between hover:bg-gray-700 transition-colors cursor-pointer"
                          data-testid={`player-item-${index}`}
                          onClick={() => setSelectedPlayer(player.playerName)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  player.isOnline ? 'bg-green-500' : 'bg-gray-500'
                                }`}
                                data-testid={`status-indicator-${index}`}
                              />
                              <span
                                className={`font-medium ${
                                  player.isOnline ? 'text-green-400' : 'text-gray-400'
                                }`}
                                data-testid={`player-name-${index}`}
                              >
                                {player.playerName}
                              </span>
                              <span
                                className={`text-sm ${
                                  player.isOnline ? 'text-green-300' : 'text-gray-500'
                                }`}
                                data-testid={`player-status-${index}`}
                              >
                                {player.isOnline ? 'Online' : 'Offline'}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div 
                              className="text-sm text-gray-400"
                              data-testid={`online-status-${index}`}
                            >
                              {player.isOnline ? 'Currently Online' : 'Offline'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Results Summary */}
                {!isLoading && (
                  <div className="text-sm text-gray-400 text-center">
                    Showing {filteredPlayers.length + filteredPremiumPlayers.length} players 
                    ({filteredPlayers.length} regular, {filteredPremiumPlayers.length} premium)
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Premium Player Creation Dialog */}
      <Dialog open={showPremiumDialog} onOpenChange={setShowPremiumDialog}>
        <DialogContent className="bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-orange-400" />
              Create Premium Player Profile
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">
                Player Name
              </label>
              <Input
                value={premiumPlayerName}
                onChange={(e) => setPremiumPlayerName(e.target.value)}
                placeholder="Enter premium player name..."
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                onKeyPress={(e) => e.key === 'Enter' && createPremiumPlayer()}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => setShowPremiumDialog(false)}
                variant="outline"
                className="border-gray-600 text-gray-400 hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button
                onClick={createPremiumPlayer}
                className="bg-orange-600 hover:bg-orange-700 text-white"
                disabled={!premiumPlayerName.trim()}
              >
                Create Premium Player
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}