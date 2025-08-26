// BattleMetrics Monitor Module
// Main entry point for integration into other applications

// Core Services
export { BattleMetricsService } from './services/battlemetrics.js';
export { WebSocketManager } from './services/websocketManager.js';
export { PlayerActivityTracker } from './services/playerActivityTracker.js';
export { BackupManager } from './services/backupManager.js';
export { BackupPollingService } from './services/backupPollingService.js';

// Storage Interface
export { IStorage, DatabaseStorage } from './storage/storage.js';

// Database Schema and Types
export * from './schema/schema.js';

// React Components
export { default as ServersPage } from './components/ServersPage.js';
export { default as ServerOverview } from './components/ServerOverview.js';

// API Routes Setup
export { setupBattleMetricsRoutes } from './routes/battlemetrics-routes.js';

// Configuration Types
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

// Main Module Class
export class BattleMetricsModule {
  private config: BattleMetricsConfig;
  private storage: IStorage;
  private backupManager: BackupManager;
  private activityTracker: PlayerActivityTracker;

  constructor(config: BattleMetricsConfig) {
    this.config = config;
    this.storage = new DatabaseStorage();
    this.activityTracker = new PlayerActivityTracker(this.storage);
    this.backupManager = new BackupManager(this.activityTracker);
  }

  async initialize() {
    await this.backupManager.start();
    return this;
  }

  getStorage() {
    return this.storage;
  }

  getActivityTracker() {
    return this.activityTracker;
  }

  getBackupManager() {
    return this.backupManager;
  }

  setupExpressRoutes(app: any) {
    setupBattleMetricsRoutes(app, this.storage);
  }
}