import { db } from '../db.js';
import {
  playerProfiles,
  playerActivities,
  playerSessions,
  servers
} from '@shared/schema';
import { desc, eq, and, isNull, sql, gte } from 'drizzle-orm';

export class PlayerActivityTracker {

  constructor() {
    console.log('🎯 [ProfileTracker] Initialized with profile-based tracking');
  }

  // Get or create a player profile for a server
  async getOrCreateProfile(serverId: string, playerName: string, playerId?: string) {
    try {
      // First try to find existing profile
      const existing = await db.select()
        .from(playerProfiles)
        .where(and(
          eq(playerProfiles.server_id, serverId),
          eq(playerProfiles.playerName, playerName)
        ))
        .limit(1);

      if (existing.length > 0) {
        return existing[0];
      }

      // Create new profile
      const newProfile = await db.insert(playerProfiles)
        .values({
          playerName,
          server_id: serverId,
          battlemetrics_id: playerId,
          is_online: false,
          total_sessions: 0,
          total_play_time_minutes: 0,
          first_seen_at: new Date(),
          last_seen: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      console.log(`👤 [Profile] Created new profile for ${playerName} on server ${serverId}`);
      return newProfile[0];
    } catch (error) {
      console.error('❌ [Profile] Error getting/creating profile:', error);
      throw error;
    }
  }

  // Record a player join event
  async recordPlayerJoin(serverId: string, playerName: string, playerId?: string): Promise<void> {
    try {
      const profile = await this.getOrCreateProfile(serverId, playerName, playerId);
      const joinTime = new Date();

      // Check if player is already marked as online to avoid duplicates
      if (profile.is_online) {
        console.log(`🚫 [DuplicateCheck] ${playerName} already marked as online, skipping join`);
        return;
      }

      // Start a new session
      const newSession = await db.insert(playerSessions)
        .values({
          profile_id: profile.id,
          server_id: serverId,
          player_name: playerName,
          player_id: playerId,
          join_time: joinTime,
          is_active: true,
          created_at: joinTime,
          updated_at: joinTime,
        })
        .returning();

      // Update profile status
      await db.update(playerProfiles)
        .set({
          is_online: true,
          current_session_start: joinTime,
          last_join_time: joinTime,
          last_seen: joinTime,
          total_sessions: sql`${playerProfiles.total_sessions} + 1`,
          updatedAt: joinTime,
        })
        .where(eq(playerProfiles.id, profile.id));

      // Record activity event
      await db.insert(playerActivities)
        .values({
          profile_id: profile.id,
          session_id: newSession[0].id,
          server_id: serverId,
          player_name: playerName,
          player_id: playerId,
          action: 'joined',
          timestamp: joinTime,
          created_at: joinTime,
        });

      console.log(`✅ [Join] ${playerName} joined server ${serverId}`);
    } catch (error) {
      console.error('❌ [Join] Error recording player join:', error);
      throw error;
    }
  }

  // Record a player leave event
  async recordPlayerLeave(serverId: string, playerName: string, playerId?: string): Promise<void> {
    try {
      const profile = await this.getOrCreateProfile(serverId, playerName, playerId);
      const leaveTime = new Date();

      // Check if player is already marked as offline
      if (!profile.is_online) {
        console.log(`🚫 [DuplicateCheck] ${playerName} already marked as offline, skipping leave`);
        return;
      }

      // Find and close the active session
      const activeSession = await db.select()
        .from(playerSessions)
        .where(and(
          eq(playerSessions.profile_id, profile.id),
          eq(playerSessions.is_active, true)
        ))
        .limit(1);

      if (activeSession.length > 0) {
        const session = activeSession[0];
        const joinTime = new Date(session.join_time);
        const durationMinutes = Math.round((leaveTime.getTime() - joinTime.getTime()) / (1000 * 60));

        // Update session with leave time and duration
        await db.update(playerSessions)
          .set({
            leave_time: leaveTime,
            duration_minutes: durationMinutes,
            is_active: false,
            updated_at: leaveTime,
          })
          .where(eq(playerSessions.id, session.id));

        // Update profile status and add session time to total
        await db.update(playerProfiles)
          .set({
            is_online: false,
            current_session_start: null,
            last_leave_time: leaveTime,
            last_seen: leaveTime,
            total_play_time_minutes: sql`${playerProfiles.total_play_time_minutes} + ${durationMinutes}`,
            updatedAt: leaveTime,
          })
          .where(eq(playerProfiles.id, profile.id));

        // Record activity event
        await db.insert(playerActivities)
          .values({
            profile_id: profile.id,
            session_id: session.id,
            server_id: serverId,
            player_name: playerName,
            player_id: playerId,
            action: 'left',
            timestamp: leaveTime,
            created_at: leaveTime,
          });

        console.log(`🔴 [Leave] ${playerName} left server ${serverId} (${durationMinutes} min session)`);
      } else {
        console.log(`⚠️ [Leave] No active session found for ${playerName}, updating profile only`);

        // Update profile status anyway
        await db.update(playerProfiles)
          .set({
            is_online: false,
            current_session_start: null,
            last_leave_time: leaveTime,
            last_seen: leaveTime,
            updatedAt: leaveTime,
          })
          .where(eq(playerProfiles.id, profile.id));
      }
    } catch (error) {
      console.error('❌ [Leave] Error recording player leave:', error);
    }
  }

  // Get player profiles for a server, sorted by most recent activity
  async getPlayerProfiles(serverId: string, limit: number = 500) {
    try {
      const profiles = await db.select()
        .from(playerProfiles)
        .where(eq(playerProfiles.server_id, serverId))
        .orderBy(desc(playerProfiles.last_seen))
        .limit(limit);

      return profiles;
    } catch (error) {
      console.error('❌ [Profiles] Error fetching player profiles:', error);
      return [];
    }
  }

  // Get player sessions for a profile
  async getPlayerSessions(profileId: number, limit: number = 100) {
    try {
      const sessions = await db.select()
        .from(playerSessions)
        .where(eq(playerSessions.profile_id, profileId))
        .orderBy(desc(playerSessions.join_time))
        .limit(limit);

      return sessions;
    } catch (error) {
      console.error('❌ [Sessions] Error fetching player sessions:', error);
      return [];
    }
  }

  // Get recent player activities for a server
  async getRecentActivities(serverId: string, limit: number = 100) {
    try {
      const activities = await db.select()
        .from(playerActivities)
        .where(eq(playerActivities.server_id, serverId))
        .orderBy(desc(playerActivities.timestamp))
        .limit(limit);

      return activities;
    } catch (error) {
      console.error('❌ [Activities] Error fetching recent activities:', error);
      return [];
    }
  }
}
