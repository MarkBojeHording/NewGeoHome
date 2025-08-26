# BattleMetrics Monitor Module

A comprehensive server monitoring module for BattleMetrics gaming servers that can be integrated into other applications.

## Features

- Real-time WebSocket monitoring of player join/leave events
- Backup polling system for reliability
- Player profile tracking with session history
- Database storage with PostgreSQL
- React components for UI integration
- Express.js route handlers
- Team and user management

## Installation

```bash
npm install ./battlemetrics-module
```

## Basic Usage

### Backend Integration (Express.js)

```typescript
import express from 'express';
import { BattleMetricsModule, setupBattleMetricsRoutes } from 'battlemetrics-monitor-module';

const app = express();

// Initialize the module
const battlemetricsModule = new BattleMetricsModule({
  database: {
    url: process.env.DATABASE_URL
  },
  session: {
    secret: process.env.SESSION_SECRET
  }
});

// Initialize the module
await battlemetricsModule.initialize();

// Setup API routes
battlemetricsModule.setupExpressRoutes(app);

// Or manually setup routes
// setupBattleMetricsRoutes(app, battlemetricsModule.getStorage());
```

### Frontend Integration (React)

```tsx
import React from 'react';
import { ServersPage, ServerOverview } from 'battlemetrics-monitor-module';

function App() {
  return (
    <div>
      <h1>My Application</h1>
      <ServersPage />
    </div>
  );
}
```

### Using Individual Services

```typescript
import { 
  BattleMetricsService, 
  PlayerActivityTracker, 
  DatabaseStorage 
} from 'battlemetrics-monitor-module';

// Initialize storage
const storage = new DatabaseStorage();

// Initialize activity tracker
const tracker = new PlayerActivityTracker(storage);

// Use BattleMetrics API
const battlemetrics = new BattleMetricsService();
const serverInfo = await battlemetrics.getServerInfo('server-id');
```

## Configuration

The module accepts a configuration object:

```typescript
interface BattleMetricsConfig {
  database?: {
    url: string;
  };
  session?: {
    secret: string;
  };
  apiKeys?: {
    battlemetrics?: string;
  };
}
```

## Available Routes

When integrated, the module provides these API endpoints:

- `GET /api/servers` - List all monitored servers
- `POST /api/servers` - Add a new server
- `DELETE /api/servers/:id` - Remove a server
- `GET /api/servers/:serverId/profiles` - Get player profiles for a server
- `GET /api/profiles/:profileId/sessions` - Get session history for a player
- `GET /api/public/servers/:serverId/profiles` - Public access to profiles
- `GET /api/database/metrics` - Database usage metrics

## Components

### ServersPage
Main dashboard component with server management and monitoring.

### ServerOverview
Detailed view of a specific server with player lists and activity.

## Services

### BattleMetricsModule
Main module class that orchestrates all services.

### PlayerActivityTracker
Tracks player join/leave events and maintains session history.

### BackupManager
Manages fallback polling when WebSocket connection fails.

### DatabaseStorage
Handles all database operations with PostgreSQL.

## Database Schema

The module requires these database tables:
- `servers` - Server configurations
- `playerProfiles` - Player profiles per server
- `playerSessions` - Player session history
- `playerActivities` - Individual join/leave events
- `teams` - Team management
- `teamMembers` - Team membership
- `users` - User accounts

## Dependencies

Core dependencies that your application needs:
- `@neondatabase/serverless` - Database connectivity
- `drizzle-orm` - ORM for database operations
- `express` - Web server framework
- `ws` - WebSocket support
- `react` - Frontend framework
- `@tanstack/react-query` - Data fetching

## License

MIT