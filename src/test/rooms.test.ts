/** Sala en vivo (bloque S2): PIN, línea de tiempo (igual a _room_timeline del servidor) y el simulador de desarrollo. */
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/lib/identity', () => ({ ensureGuestSession: async () => 'existing' }));

import { isRoomPin, normalizePin, roomTimeline, pollInterval, createRoom, joinRoom, startRoom, answerRoom, fetchRoomState, kickFromRoom, rematchRoom, type RoomState } from '@/lib/rooms';

const settings = { mode: 'world', difficulty: 'basic', category: 'cities', rounds_total: 5, seconds: 15, max_players: 20, countdown: 5, reveal: 8, host_plays: true } as RoomState['settings'];
const at = (startMs: number) => ({ status: 'playing' as const, started_at: new Date(startMs).toISOString(), settings });

describe('sala en vivo: PIN y línea de tiempo', () => {
  it('PIN de 6 números que no empieza en 0', () => {
    expect(isRoomPin('123456')).toBe(true);
    expect(isRoomPin('012345')).toBe(false);
    expect(isRoomPin('12345')).toBe(false);
    expect(normalizePin('123 456')).toBe('123456');
    expect(normalizePin('12-34-567')).toBe('123456');
  });

  it('cuenta regresiva de 5 s, luego cada ronda = segundos + 8 s de revelación', () => {
    const t0 = Date.parse('2026-10-26T12:00:00Z');
    expect(roomTimeline(at(t0), t0 + 1000)).toMatchObject({ phase: 'countdown', round: 1, opensAt: t0 + 5000 });
    expect(roomTimeline(at(t0), t0 + 5000)).toMatchObject({ phase: 'question', round: 1, closesAt: t0 + 20000 });
    expect(roomTimeline(at(t0), t0 + 19999).phase).toBe('question');
    expect(roomTimeline(at(t0), t0 + 20000)).toMatchObject({ phase: 'reveal', round: 1 });
    expect(roomTimeline(at(t0), t0 + 28000)).toMatchObject({ phase: 'question', round: 2, opensAt: t0 + 28000 });
    const end = t0 + 5000 + 5 * 23000;
    expect(roomTimeline(at(t0), end - 1)).toMatchObject({ phase: 'reveal', round: 5, endsAt: end });
    expect(roomTimeline(at(t0), end)).toMatchObject({ phase: 'finished', round: 5 });
    expect(roomTimeline({ status: 'lobby', started_at: null, settings }, t0).phase).toBe('lobby');
    expect(roomTimeline({ status: 'cancelled', started_at: null, settings }, t0).phase).toBe('cancelled');
  });

  it('frecuencia de consulta según la fase; nada en una sala cancelada', () => {
    expect(pollInterval('lobby')).toBe(3000);
    expect(pollInterval('question')).toBe(4000);
    expect(pollInterval('cancelled')).toBeNull();
  });
});

describe('sala en vivo: simulador de desarrollo', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('geospeed_mock_rooms', '1');
  });

  it('crear, entrar jugadores falsos, sacar a uno, empezar, responder y otra ronda', async () => {
    let s = await createRoom({ mode: 'world', difficulty: 'basic', category: 'cities', rounds: 5, seconds: 15, hostPlays: true, requestId: 'r1' });
    expect(s.status).toBe('lobby');
    expect(s.i_am_host && s.i_am_player).toBe(true);
    expect(isRoomPin(s.pin)).toBe(true);
    await expect(startRoom(s.id)).rejects.toMatchObject({ code: 'not_enough_players' });

    (window as unknown as { __mockRoomBots: (n: number) => string }).__mockRoomBots(3);
    await new Promise((r) => setTimeout(r, 1200));
    s = await fetchRoomState({ id: s.id });
    expect(s.player_count).toBe(4);
    s = await kickFromRoom(s.id, s.players.find((p) => !p.is_host)!.slot);
    expect(s.player_count).toBe(3);

    s = await startRoom(s.id);
    expect(s.phase).toBe('countdown');
    expect(s.items).toHaveLength(1);
    expect(s.items[0].lat).toBeUndefined(); // la respuesta no llega antes de cerrar la ronda
    await expect(answerRoom(s.id, 1, 0, 0, 2)).rejects.toMatchObject({ code: 'round_closed' });

    // Ronda 1 abierta: responder en el lugar exacto da los puntos de la fórmula del juego
    const db = JSON.parse(localStorage.getItem('geospeed_mock_rooms_db')!);
    db[s.id].started_at = Date.now() - 5000 - 2400; // 2,4 s de ronda: el tiempo del teléfono (2 s) vale
    localStorage.setItem('geospeed_mock_rooms_db', JSON.stringify(db));
    const item = db[s.id].items[0];
    const a = await answerRoom(s.id, 1, item.lat, item.lon, 2);
    expect(a.base).toBe(1000);
    expect(a.points).toBe(1940); // 1.000 × 1,94 (2 s) × combo 1
    expect((await answerRoom(s.id, 1, 0, 0, 1)).repeat).toBe(true);

    db[s.id] = JSON.parse(localStorage.getItem('geospeed_mock_rooms_db')!)[s.id];
    db[s.id].started_at = Date.now() - 10 * 60 * 1000;
    localStorage.setItem('geospeed_mock_rooms_db', JSON.stringify(db));
    s = await fetchRoomState({ id: s.id });
    expect(s.status).toBe('finished');
    expect(s.players.find((p) => p.me)!.total).toBe(1940);

    const next = await rematchRoom(s.id, s.settings, []);
    expect(next.status).toBe('lobby');
    expect(next.player_count).toBe(3);
    expect((await fetchRoomState({ id: s.id })).next_room?.id).toBe(next.id);
  });

  it('unirse a la sala de otro: nombre, sala llena y partida empezada', async () => {
    const w = window as unknown as { __mockRoomHosted: (n: number) => string; __mockRoomStartHosted: (pin: string) => string };
    const pin = w.__mockRoomHosted(19);
    await expect(joinRoom(pin, 'P')).rejects.toMatchObject({ code: 'name_invalid' });
    const s = await joinRoom(pin, 'Pepe');
    expect(s.player_count).toBe(20);
    expect(s.i_am_host).toBe(false);
    const pin2 = w.__mockRoomHosted(20);
    await expect(joinRoom(pin2, 'Ana')).rejects.toMatchObject({ code: 'full' });
    const pin3 = w.__mockRoomHosted(3);
    w.__mockRoomStartHosted(pin3);
    await expect(joinRoom(pin3, 'Ana')).rejects.toMatchObject({ code: 'started' });
    await expect(joinRoom('999999', 'Ana')).rejects.toMatchObject({ code: 'unavailable' });
  });
});
