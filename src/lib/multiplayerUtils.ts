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
  return invokeRoomUpdate(roomId, 'update_score', { score, round });
}

export function subscribeToRoom(roomId: string, callback: (room: GameRoom) => void) {
  return supabase
    .channel(`room-${roomId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'game_rooms', filter: `id=eq.${roomId}` },
      (payload) => {
        callback(payload.new as GameRoom);
      }
    )
    .subscribe();
}
