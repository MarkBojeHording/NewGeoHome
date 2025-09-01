import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Server, Users, Wifi, WifiOff } from 'lucide-react';

interface Server {
  id: string;
  name: string;
  game: string;
  status: 'online' | 'offline';
  players: number;
  max_players: number;
  last_checked: string;
}

export function ServerStatus() {
  const { data: serverData, isLoading, error } = useQuery({
    queryKey: ['battlemetrics-servers'],
    queryFn: () => apiRequest('/api/battlemetrics/servers'),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <Card className="w-80">
        <CardHeader>
          <CardTitle className="text-sm">Server Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-80">
        <CardHeader>
          <CardTitle className="text-sm">Server Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-red-500">Failed to load server status</div>
        </CardContent>
      </Card>
    );
  }

  const servers: Server[] = serverData?.servers || [];

  if (servers.length === 0) {
    return (
      <Card className="w-80">
        <CardHeader>
          <CardTitle className="text-sm">Server Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">No servers configured</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-80">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Server className="h-4 w-4" />
          Server Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {servers.map((server) => (
          <div key={server.id} className="flex items-center justify-between p-2 border rounded">
            <div className="flex items-center gap-2">
              {server.status === 'online' ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              <div>
                <div className="text-sm font-medium">{server.name}</div>
                <div className="text-xs text-muted-foreground">{server.game}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span className="text-sm">
                  {server.players}/{server.max_players}
                </span>
              </div>
              <Badge variant={server.status === 'online' ? 'default' : 'secondary'}>
                {server.status}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}





