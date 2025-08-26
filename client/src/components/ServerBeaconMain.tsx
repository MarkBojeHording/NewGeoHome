import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, ExternalLink, Wifi, WifiOff, Server, Users, Activity, Settings } from 'lucide-react';

export default function ServerBeaconMain() {
  const [servers, setServers] = useState([
    {
      id: 'rust-1',
      name: 'Rust Official Server',
      players: 127,
      maxPlayers: 200,
      status: 'online' as const,
      game: 'Rust',
      region: 'US East',
      ping: 45,
      lastChecked: '2 minutes ago'
    },
    {
      id: 'rust-2', 
      name: 'Community Rust Server',
      players: 89,
      maxPlayers: 150,
      status: 'online' as const,
      game: 'Rust',
      region: 'EU West',
      ping: 78,
      lastChecked: '1 minute ago'
    }
  ]);

  const [newServerUrl, setNewServerUrl] = useState('');

  const addServer = () => {
    if (newServerUrl.trim()) {
      // Add server logic here
      setNewServerUrl('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">ServerBeacon</h2>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Server
        </Button>
      </div>

      <Tabs defaultValue="servers" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="servers">Servers</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="players">Players</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="servers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Add New Server
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter BattleMetrics URL or Server ID"
                  value={newServerUrl}
                  onChange={(e) => setNewServerUrl(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={addServer}>Add Server</Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            {servers.map((server) => (
              <Card key={server.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {server.status === 'online' ? (
                        <Wifi className="h-5 w-5 text-green-500" />
                      ) : (
                        <WifiOff className="h-5 w-5 text-red-500" />
                      )}
                      <div>
                        <h3 className="font-semibold">{server.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {server.game} • {server.region}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <Badge variant={server.status === 'online' ? 'default' : 'secondary'}>
                        {server.status}
                      </Badge>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        {server.players}/{server.maxPlayers}
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        {server.ping}ms
                      </div>
                      
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mt-3 text-xs text-muted-foreground">
                    Last checked: {server.lastChecked}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Server Monitoring
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Real-time server monitoring dashboard coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="players" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Player Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Player activity tracking and profiles coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                ServerBeacon Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Configuration options coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}