/**
 * GeoSpeed IQ Challenge — Cloud Sync
 *
 * Synchronizes player stats, game history, energy, and premium status
 * with Supabase for logged-in users. Falls back to localStorage for guests.
 *
 * Data flow:
 *  - On login: pull cloud data → merge with local → save merged to both
 *  - On game end: push updated stats to cloud
 *  - On app load: sync if session exists
 *
 * Tables required in Supabase:
 *  - player_data (user_id PK, stats JSONB, history JSONB, energy JSONB, premium JSONB, updated_at)
 */

import { supabase } from '@/integrations/supabase/client';
import { getPlayerStats, type PlayerStats } from './gameUtils';

// ─── Types ──────────────────────────────────────────────────────────
interface CloudPlayerData {
  stats: PlayerStats;
  history: unknown[];
  energy: { lives: number; lastRegenTimestamp: number };
  premium: { isPro: boolean; proExpiresAt: string | null; proSource: string | null };
  updated_at: string;
}

// ─── Push to cloud ──────────────────────────────────────────────────
export async function pushToCloud(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const stats = getLocalData('geospeed_stats');
    const history = getLocalData('geospeed_history');
    const energy = getLocalData('geospeed_energy');
    const premium = getLocalData('geospeed_premium');

    const payload = {
      user_id: user.id,
      stats: stats || { gamesPlayed: 0, bestScore: 0, totalDistance: 0, totalRounds: 0 },
      history: history || [],
      energy: energy || { lives: 5, lastRegenTimestamp: Date.now() },
      premium: premium || { isPro: false, proExpiresAt: null, proSource: null },
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('player_data')
      .upsert(payload, { onConflict: 'user_id' });

    if (error) {
      console.warn('[CloudSync] Push failed:', error.message);
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

// ─── Pull from cloud ────────────────────────────────────────────────
export async function pullFromCloud(): Promise<CloudPlayerData | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('player_data')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error || !data) return null;

    return data as unknown as CloudPlayerData;
  } catch {
    return null;
  }
}

// ─── Merge & sync on login ──────────────────────────────────────────
export async function syncOnLogin(): Promise<void> {
  try {
    const cloudData = await pullFromCloud();
    const localStats = getPlayerStats();

    if (!cloudData) {
      // No cloud data — push current local data
      await pushToCloud();
      return;
    }

    // Merge strategy: keep whichever has more games played (more progress)
    const cloudStats = cloudData.stats as PlayerStats;
    if (cloudStats.gamesPlayed > localStats.gamesPlayed) {
      // Cloud has more progress — overwrite local
      setLocalData('geospeed_stats', cloudStats);
      if (cloudData.history) setLocalData('geospeed_history', cloudData.history);
      if (cloudData.premium) setLocalData('geospeed_premium', cloudData.premium);
      // Don't overwrite energy (keep local regen timer accurate)
    } else if (localStats.gamesPlayed > cloudStats.gamesPlayed) {
      // Local has more progress — push to cloud
      await pushToCloud();
    }
    // If equal, do nothing (already in sync)
  } catch {
    // Sync failed silently — local data continues to work
  }
}

// ─── Auto-sync after game ───────────────────────────────────────────
export async function syncAfterGame(): Promise<void> {
  // Fire-and-forget push to cloud after each game
  pushToCloud().catch(() => {});
}

// ─── Helpers ────────────────────────────────────────────────────────
function getLocalData(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setLocalData(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* ignore */ }
}
