import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "@/components/error-boundary";
import { useAuth } from "@/hooks/useAuth";

import TacticalMap from "@/pages/tactical-map";
import IconDemo from "@/pages/icon-demo";
import NotFound from "@/pages/not-found";
import ServersPage from "@/pages/servers";
import Dashboard from "@/pages/dashboard";
import Landing from "@/pages/landing";
import MapViewer from "@/pages/map-viewer";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <Switch>
      {/* GeoHome main interface - public access (users) */}
      <Route path="/" component={TacticalMap} />
      <Route path="/icon-demo" component={IconDemo} />

      {/* ServerBeacon admin interface - with authentication */}
      {!isAuthenticated ? (
        <Route path="/admin" component={Landing} />
      ) : (
        <>
          <Route path="/admin" component={Dashboard} />
          <Route path="/admin/servers" component={ServersPage} />
          <Route path="/admin/dashboard" component={Dashboard} />
          <Route path="/admin/landing" component={Landing} />
          <Route path="/admin/map-viewer" component={MapViewer} />
          <Route path="/admin/profiles" component={NotFound} /> {/* TODO: Add PlayerProfiles */}
          <Route path="/admin/activity" component={NotFound} /> {/* TODO: Add ActivityFeed */}
        </>
      )}
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
