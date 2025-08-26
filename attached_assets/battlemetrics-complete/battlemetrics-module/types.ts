// Type definitions for the BattleMetrics module

export interface BattleMetricsConfig {
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

export interface ModuleOptions {
  enableWebSocket?: boolean;
  enableBackupPolling?: boolean;
  pollInterval?: number;
  maxRetries?: number;
}

// Re-export commonly used types from schema
export type { 
  Server, 
  PlayerProfile, 
  PlayerSession, 
  PlayerActivity,
  User,
  Team,
  TeamMember 
} from './schema/schema.js';