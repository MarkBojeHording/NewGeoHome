import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { Wifi, WifiOff, Users, Plus } from "lucide-react";

interface Server {
  id: string;
  name: string;
  game: string;
  status: "online" | "offline";
  players: number;
  max_players: number;
  last_checked?: string;
}

export default function ServersPage() {
  const queryClient = useQueryClient();
  const [serverId, setServerId] = useState("");
  const [serverName, setServerName] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["/api/battlemetrics/servers"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/battlemetrics/servers");
      const json = await res.json();
      return (json?.servers || []) as Server[];
    },
    refetchInterval: 30000,
  });

  const addServer = useMutation({
    mutationFn: async () => {
      if (!serverId || !serverName) throw new Error("Server ID and name are required");
      const res = await apiRequest("POST", "/api/battlemetrics/servers", {
        serverId,
        name: serverName,
      });
      return res.json();
    },
    onSuccess: () => {
      setServerId("");
      setServerName("");
      queryClient.invalidateQueries({ queryKey: ["/api/battlemetrics/servers"] });
    },
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Servers</h1>
                <Badge variant="outline">{data?.length || 0} total</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Server</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input
            placeholder="BattleMetrics Server ID (e.g., 2933470)"
            value={serverId}
            onChange={(e) => setServerId(e.target.value)}
          />
          <Input
            placeholder="Display Name"
            value={serverName}
            onChange={(e) => setServerName(e.target.value)}
          />
          <Button onClick={() => addServer.mutate()} disabled={addServer.isPending}>
            <Plus className="mr-2 h-4 w-4" /> {addServer.isPending ? "Adding..." : "Add"}
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.map((s) => (
            <Card key={s.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="truncate">{s.name}</span>
                  <span className="text-xs text-muted-foreground">{s.game}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {s.status === "online" ? (
                    <Wifi className="h-4 w-4 text-green-500" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-red-500" />
                  )}
                  <div className="text-sm">{s.status}</div>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Users className="h-4 w-4" />
                  <span>
                    {s.players}/{s.max_players}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
