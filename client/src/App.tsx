import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "@/components/error-boundary";

import TacticalMap from "@/pages/tactical-map";

import IconDemo from "@/pages/icon-demo";
import NotFound from "@/pages/not-found";
import ServersPage from "@/pages/servers";

function Router() {
  // Removed useAuth dependency since admin routes don't need authentication
  // This allows direct access to /admin without login

  return (
    <Switch>
            {/* GeoHome main interface - public access (users) */}
      <Route path="/" component={TacticalMap} />
      <Route path="/icon-demo" component={IconDemo} />

                   {/* ServerBeacon admin interface - direct access (no auth required) */}
             <Route path="/admin" component={ServersPage} />
             <Route path="/admin/servers" component={ServersPage} />
             <Route path="/admin/profiles" component={NotFound} /> {/* TODO: Add PlayerProfiles */}
             <Route path="/admin/activity" component={NotFound} /> {/* TODO: Add ActivityFeed */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
