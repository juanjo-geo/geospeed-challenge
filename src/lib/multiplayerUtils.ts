import { supabase } from '@/integrations/supabase/client';
import { type Difficulty, type GameMode } from '@/data/cities';

export interface GameRoom {
  id: string;
  code: string;
  host_name: string;
  guest_name: string | null;
  difficulty: string;
  mode: string;
  status: string;
  host_score: number;
  guest_score: number;
  current_round: number;
  seed: number;
  host_ready: boolean;
  guest_ready: boolean;
  host_finished: boolean;
  guest_finished: boolean;
  created_at: string;
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function createRoom(hostName: string, difficulty: Difficulty, mode: GameMode): Promise<GameRoom | null> {
  const code = generateRoomCode();
  const seed = Math.floor(Math.random() * 1_000_000);

  const { data, error } = await supabase.functions.invoke('create-game-room', {
    body: { code, host_name: hostName, difficulty, mode, seed },
  });

  if (error || data?.error) {
    console.error('Error creating room:', error || data?.error);
    return null;
  }
  // Store host_secret locally for authenticated room updates
  const room = data as GameRoom & { host_secret: string };
  sessionStorage.setItem(`room_secret_${room.id}`, room.host_secret);
  return room;
}

export async function joinRoom(code: string, guestName: string): Promise<GameRoom | null> {
  // First find the room
  const { data: room, error: findError } = await (supabase
    .from('game_rooms_public' as any)
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('status', 'waiting')
    .is('guest_name', null)
    .single() as any);

  if (findError || !room) return null;

  // Join via edge function — use host_secret temporarily to authenticate the join action
  // Since we're reading from the public view, we don't have host_secret
  // Instead, pass room_id and use a special "join" flow that doesn't require a secret
  const { data: fnData, error } = await supabase.functions.invoke('update-game-room', {
    body: {
      room_id: room.id,
      secret: '__join__',
      action: 'join',
      payload: { guest_name: guestName },
    },
  });

  if (error || fnData?.error) return null;

  // Store guest_secret for future authenticated updates
  sessionStorage.setItem(`room_secret_${room.id}`, fnData.guest_secret);

  // Re-fetch the room to get updated data
  const { data: updatedRoom } = await (supabase
    .from('game_rooms_public' as any)
    .select('*')
    .eq('id', room.id)
    .single() as any);

  return updatedRoom as GameRoom;
}

/**
 * Quick Match — finds an open room to join, or creates a new one.
 * Returns { room, isHost } so the caller knows which role the player takes.
 */
export async function quickMatch(
  playerName: string,
  difficulty: Difficulty = 'easy',
  mode: GameMode = 'world',
): Promise<{ room: GameRoom; isHost: boolean } | null> {
  // Try to find an open room with same difficulty+mode
  const { data: openRooms } = await (supabase
    .from('game_rooms_public' as any)
    .select('*')
    .eq('status', 'waiting')
    .eq('difficulty', difficulty)
    .eq('mode', mode)
    .is('guest_name', null)
    .order('created_at', { ascending: true })
    .limit(5) as any);

  if (openRooms && openRooms.length > 0) {
    // Join the oldest open room
    for (const candidate of openRooms) {
      const joined = await joinRoom(candidate.code, playerName);
      if (joined) return { room: joined, isHost: false };
    }
  }

  // No open rooms found — create one and wait
  const created = await createRoom(playerName, difficulty, mode);
  if (!created) return null;
  return { room: created, isHost: true };
}

function getRoomSecret(roomId: string): string {
  return sessionStorage.getItem(`room_secret_${roomId}`) || '';
}

async function invokeRoomUpdate(roomId: string, action: string, payload?: Record<string, unknown>): Promise<boolean> {
  const secret = getRoomSecret(roomId);
  if (!secret) {
    console.error('No room secret found for', roomId);
    return false;
  }
  const { data, error } = await supabase.functions.invoke('update-game-room', {
    body: { room_id: roomId, secret, action, payload },
  });
  if (error || data?.error) {
    console.error('Room update failed:', error || data?.error);
    return false;
  }
  return true;
}

export async function setPlayerReady(roomId: string, isHost: boolean): Promise<boolean> {
  return invokeRoomUpdate(roomId, 'set_ready');
}

export async function updateRoomStatus(roomId: string, status: string): Promise<boolean> {
  return invokeRoomUpdate(roomId, 'update_status', { status });
}

export async function updateRoomScore(roomId: string, isHost: boolean, score: number, round: number): Promise<boolean> {
  // Retry up to 3 times with 1s delay — guards against transient network errors
  for (let attempt = 1; attempt <= 3; attempt++) {
    const ok = await invokeRoomUpdate(roomId, 'update_score', { score, round });
    if (ok) return true;
    if (attempt < 3) await new Promise(r => setTimeout(r, 1000));
  }
  console.error('[multiplayer] updateRoomScore failed after 3 attempts for room', roomId);
  return false;
}

let channelCounter = 0;

export function subscribeToRoom(roomId: string, callback: (room: GameRoom) => void) {
  // Use unique channel name to avoid Supabase channel reuse issues
  // when WaitingRoom and Index.tsx subscribe to the same room sequentially
  const channelName = `room-${roomId}-${++channelCounter}-${Date.now()}`;
  return supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'game_rooms', filter: `id=eq.${roomId}` },
      (payload) => {
        callback(payload.new as GameRoom);
      }
    )
    .subscribe();
}

/**
 * Fetch room state for polling fallback.
 * Tries the public view first (always works), then direct table as fallback.
 */
export async function fetchRoom(roomId: string): Promise<GameRoom | null> {
  const { data, error } = await (supabase
    .from('game_rooms_public' as any)
    .select('*')
    .eq('id', roomId)
    .single() as any);
  if (!error && data) return data as GameRoom;

  // Fallback to direct table
  const { data: direct, error: directErr } = await (supabase
    .from('game_rooms' as any)
    .select('*')
    .eq('id', roomId)
    .single() as any);
  if (directErr || !direct) return null;
  return direct as GameRoom;
}

/**
 * Create a single broadcast channel that both SENDS "I finished" and LISTENS
 * for the opponent's "I finished" event.
 *
 * Key design decisions:
 * - Uses role-specific channel names to avoid same-client channel collisions.
 *   Each player sends on their OWN outgoing channel and listens on the OPPONENT's.
 * - The sender re-broadcasts every 2 s for up to 60 s so the message isn't lost
 *   if the opponent's listener connects after the first broadcast.
 * - Returns a cleanup function that removes both channels.
 */
export function setupFinishedBroadcast(
  roomId: string,
  isHost: boolean,
  myScore: number,
  onOpponentFinished: (opponentScore: number) => void,
): () => void {
  const myRole = isHost ? 'host' : 'guest';
  const oppRole = isHost ? 'guest' : 'host';

  // --- Outgoing channel: I tell the opponent I'm done ---
  const sendChannelName = `game-finish-${roomId}-${myRole}`;
  const sendChannel = supabase.channel(sendChannelName);
  let sendInterval: ReturnType<typeof setInterval> | null = null;

  sendChannel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      const send = () => {
        sendChannel.send({
          type: 'broadcast',
          event: 'player_finished',
          payload: { isHost, score: myScore },
        });
      };
      send(); // immediate
      sendInterval = setInterval(send, 2000); // repeat every 2 s
      // Stop after 3 minutes — covers games where opponent finishes much later
      setTimeout(() => {
        if (sendInterval) clearInterval(sendInterval);
      }, 180_000);
    }
  });

  // --- Incoming channel: listen for opponent's finish ---
  const listenChannelName = `game-finish-${roomId}-${oppRole}`;
  const listenChannel = supabase.channel(listenChannelName);
  let received = false;

  listenChannel
    .on('broadcast', { event: 'player_finished' }, (msg) => {
      if (received) return;
      const payload = msg.payload as { isHost: boolean; score: number };
      // Double-check it's actually the opponent
      if (payload.isHost !== isHost) {
        received = true;
        onOpponentFinished(payload.score);
        // Stop re-broadcasting once we know both sides are done
        if (sendInterval) clearInterval(sendInterval);
      }
    })
    .subscribe();

  // Cleanup function — caller invokes on unmount
  return () => {
    if (sendInterval) clearInterval(sendInterval);
    supabase.removeChannel(sendChannel);
    supabase.removeChannel(listenChannel);
  };
}

/**
 * Emoji quick-chat via Supabase Realtime broadcast.
 * Each player sends on their own channel and listens on the opponent's.
 */
export function setupEmojiChat(
  roomId: string,
  isHost: boolean,
  onReceive: (emoji: string) => void,
): { send: (emoji: string) => void; cleanup: () => void } {
  const myRole = isHost ? 'host' : 'guest';
  const oppRole = isHost ? 'guest' : 'host';

  const sendChannel = supabase.channel(`emoji-${roomId}-${myRole}`);
  sendChannel.subscribe();

  const listenChannel = supabase
    .channel(`emoji-${roomId}-${oppRole}`)
    .on('broadcast', { event: 'emoji' }, (payload) => {
      if (payload.payload?.emoji) {
        onReceive(payload.payload.emoji);
      }
    })
    .subscribe();

  return {
    send: (emoji: string) => {
      sendChannel.send({ type: 'broadcast', event: 'emoji', payload: { emoji } });
    },
    cleanup: () => {
      supabase.removeChannel(sendChannel);
      supabase.removeChannel(listenChannel);
    },
  };
}
