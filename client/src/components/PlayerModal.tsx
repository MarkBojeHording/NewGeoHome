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

  // Fetch session history for selected player
  const { data: sessionHistory = [], isLoading: isLoadingHistory } = useQuery<any[]>({
    queryKey: ['/api/players', selectedPlayer, 'sessions'],
    enabled: !!selectedPlayer,
  });

  // Filter players based on search criteria
  const filteredPlayers = players.filter(player => {
    const nameMatch = nameSearch === '' || player.playerName.toLowerCase().includes(nameSearch.toLowerCase());
    // For now, search by session count for base number search (you can customize this)
    const sessionMatch = baseNumberSearch === '' || player.totalSessions.toString().includes(baseNumberSearch);
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

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[1600px] h-[900px] bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-semibold flex items-center gap-2">
              <User className="w-5 h-5" />
              {selectedPlayer ? `${selectedPlayer} - Session History` : 'Player Management'}
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
            {/* Session History View */}
            {selectedPlayer ? (
              <div className="h-[750px] overflow-y-auto bg-gray-800 rounded-lg border border-gray-600 p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Session History for {selectedPlayer}</h3>
                {isLoadingHistory ? (
                  <div className="flex justify-center py-8">
                    <div className="text-gray-400">Loading session history...</div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sessionHistory.map((session: any) => (
                      <div
                        key={session.id}
                        className="bg-gray-700 rounded-lg p-4 border border-gray-600"
                        data-testid={`session-${session.id}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="text-white font-medium">
                            Session #{session.id}
                          </div>
                          <div className="text-sm text-gray-400">
                            {session.durationHours}h duration
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-400">Started:</span>
                            <div className="text-white">
                              {new Date(session.startTime).toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-400">Ended:</span>
                            <div className="text-white">
                              {new Date(session.endTime).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 text-sm">
                          <span className="text-gray-400">Server:</span>
                          <span className="text-white ml-2">{session.server}</span>
                        </div>
                      </div>
                    ))}
                    {sessionHistory.length === 0 && (
                      <div className="text-center text-gray-400 py-8">
                        No session history available
                      </div>
                    )}
                  </div>
                )}
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
                      placeholder="Search by sessions..."
                      value={baseNumberSearch}
                      onChange={(e) => setBaseNumberSearch(e.target.value)}
                      className="pl-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                      data-testid="input-base-number-search"
                    />
                  </div>
                </div>

                {/* Player List */}
                <div className="h-[750px] overflow-y-auto bg-gray-800 rounded-lg border border-gray-600">
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
                            <span 
                              className="text-xs bg-blue-600 px-2 py-1 rounded text-blue-200"
                              data-testid={`sessions-${index}`}
                            >
                              Sessions: {player.totalSessions}
                            </span>
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