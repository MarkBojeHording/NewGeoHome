// Example: How to use BattleMetrics React components in your app
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ServersPage } from '../index.js';

// Setup React Query (required for the components)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Your main app component
function MyApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-900">
        <header className="bg-gray-800 p-4">
          <h1 className="text-white text-2xl">My Gaming Dashboard</h1>
        </header>
        
        <main className="p-4">
          {/* Your existing content */}
          <div className="mb-8">
            <h2 className="text-white text-xl mb-4">Welcome to My App</h2>
            {/* Your custom components here */}
          </div>
          
          {/* Embedded BattleMetrics monitoring */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h2 className="text-white text-xl mb-4">Server Monitoring</h2>
            <ServersPage />
          </div>
        </main>
      </div>
    </QueryClientProvider>
  );
}

export default MyApp;