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
  
  const queryClient = useQueryClient();

  // Fetch players from the external API via our server
  const { data: players = [], isLoading } = useQuery<ExternalPlayer[]>({
    queryKey: ['/api/players'],
    enabled: isOpen,
  });

  // Fetch premium players from our database
  const { data: premiumPlayers = [] } = useQuery({
    queryKey: ['/api/premium-players'],
    enabled: isOpen,
  });

  // Filter players based on search criteria
  const filteredPlayers = players.filter(player => {
    const nameMatch = nameSearch === '' || player.playerName.toLowerCase().includes(nameSearch.toLowerCase());
    // For now, search by session count for base number search (you can customize this)
    const sessionMatch = baseNumberSearch === '' || player.totalSessions.toString().includes(baseNumberSearch);
    return nameMatch && sessionMatch;
  });

  // Filter premium players based on search criteria
  const filteredPremiumPlayers = premiumPlayers.filter(player => {
    const nameMatch = nameSearch === '' || player.playerName.toLowerCase().includes(nameSearch.toLowerCase());
    return nameMatch;
  });

  const formatLastSession = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const createPremiumPlayer = async () => {
    if (!premiumPlayerName.trim()) return;
    
    try {
      await apiRequest('/api/premium-players', {
        method: 'POST',
        body: { playerName: premiumPlayerName.trim() }
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[1600px] h-[900px] bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white text-xl font-semibold flex items-center gap-2">
            <User className="w-5 h-5" />
            Player Management
            <Plus 
              className="w-4 h-4 text-orange-400 cursor-pointer hover:text-orange-300" 
              onClick={() => setShowPremiumDialog(true)}
            />
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
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
              <div className="p-4 text-center text-gray-400">Loading players...</div>
            ) : filteredPlayers.length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                {players.length === 0 ? (
                  <div className="space-y-2">
                    <div>No player data available from external API</div>
                    <div className="text-sm text-gray-500">
                      API connection successful but no players recorded yet
                    </div>
                    <div className="text-xs text-gray-600">
                      Visit superinfotest.replit.app to populate player data
                    </div>
                  </div>
                ) : (
                  'No players match your search'
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-700">
                {/* Premium Players */}
                {filteredPremiumPlayers.map((player) => (
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
                {filteredPlayers.map((player) => (
                  <div
                    key={player.id}
                    className="p-3 flex items-center justify-between hover:bg-gray-700 transition-colors"
                    data-testid={`player-item-${player.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            player.isOnline ? 'bg-green-500' : 'bg-gray-500'
                          }`}
                          data-testid={`status-indicator-${player.id}`}
                        />
                        <span
                          className={`font-medium ${
                            player.isOnline ? 'text-green-400' : 'text-gray-400'
                          }`}
                          data-testid={`player-name-${player.id}`}
                        >
                          {player.playerName}
                        </span>
                        <span
                          className={`text-sm ${
                            player.isOnline ? 'text-green-300' : 'text-gray-500'
                          }`}
                          data-testid={`player-status-${player.id}`}
                        >
                          {player.isOnline ? 'Online' : 'Offline'}
                        </span>
                      </div>
                      <span 
                        className="text-xs bg-blue-600 px-2 py-1 rounded text-blue-200"
                        data-testid={`sessions-${player.id}`}
                      >
                        Sessions: {player.totalSessions}
                      </span>
                    </div>
                    <div className="text-right">
                      <div 
                        className="text-sm text-gray-400"
                        data-testid={`online-status-${player.id}`}
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
        </div>
      </DialogContent>
      
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
    </Dialog>
  );
}