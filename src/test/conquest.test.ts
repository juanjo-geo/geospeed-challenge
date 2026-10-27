/** Conquista — fase C1 (banco de ciudades, encuadre, semilla del servidor) y fase C3 (cliente y simulador). */
import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { CONQUEST_COUNTRIES, CONQUEST_CITIES } from '@/data/conquestCatalog';
import { CONQUEST_COUNTRIES_SPEC } from '@/data/conquestTiers';
import { worldCities, europeCities, asiaCities, americasCities, africaCities } from '@/data/cities';
import { COLOMBIA_CITIES } from '@/data/colombiaCatalog';
import { PRO_PACK_CITIES } from '@/data/proPackCatalog';
import { catalogItem, kindFromPlaceId, itemTitle } from '@/lib/catalog';
import { normalizeConqCode, isConqCode, mapConqError, formatTimeLeft, createGroup, previewInvite, acceptInvite, fetchGroup, startSeason, leaveGroup, ConqError, conqPoints, fetchMap, fetchTerritory, fetchPracticeSet, startAttempt, openRound, answerRound, abandonAttempt, fetchAttempt, currentRound, answeredRounds, rememberActiveMission, activeMission, forgetActiveMission, fetchActivity, markSeen, fetchStandings, championsOf, type ConqEvent } from '@/lib/conquest';
import { playerStyles, pickTerritory, boardLayer, missionLayer, ZONE_BOUNDS, conqCountry, describeEvent, timeAgo } from '@/lib/conquestMap';
import { reminderTimes, nativeReminderId } from '@/lib/conquestReminders';
import { conquestBetaOn } from '@/lib/conquestBeta';
import { roundDelayMs, lostPoints, summarizeNet, reportMissionNet, netLog, netAverage, type NetSample } from '@/lib/conquestNet';
import { CONQ } from '@/lib/theme';

const byId = new Map<string, { lat: number; lon: number; name: string }>();
for (const l of [worldCities, europeCities, asiaCities, americasCities, africaCities, COLOMBIA_CITIES, PRO_PACK_CITIES, CONQUEST_CITIES]) {
  for (const c of l) if (c.id && !byId.has(c.id)) byId.set(c.id, c);
}

describe('Conquista: banco de ciudades', () => {
  it('los diez países aprobados, con 12 ciudades distintas cada uno', () => {
    expect(CONQUEST_COUNTRIES.map((k) => k.iso)).toEqual(['CO', 'PE', 'EC', 'CL', 'AR', 'BR', 'MX', 'ES', 'FR', 'IT']);
    const all = CONQUEST_COUNTRIES.flatMap((k) => k.cityIds);
    for (const k of CONQUEST_COUNTRIES) expect(new Set(k.cityIds).size).toBe(12);
    expect(new Set(all).size).toBe(120);
    expect(CONQUEST_COUNTRIES_SPEC.every((k) => k.cities.length === 12)).toBe(true);
  });

  it('cada id es una ciudad del juego con coordenadas, dentro del encuadre de su país', () => {
    for (const k of CONQUEST_COUNTRIES) {
      const [x0, y0, x1, y1] = k.bounds;
      expect(x1 - x0).toBeGreaterThan(2);
      expect(x1 - x0).toBeLessThan(60);
      for (const id of k.cityIds) {
        const c = byId.get(id);
        expect(c, id).toBeTruthy();
        expect(c!.lon).toBeGreaterThanOrEqual(x0);
        expect(c!.lon).toBeLessThanOrEqual(x1);
        expect(c!.lat).toBeGreaterThanOrEqual(y0);
        expect(c!.lat).toBeLessThanOrEqual(y1);
      }
    }
  });

  it('las ciudades nuevas usan cq:, se resuelven desde el servidor y tienen nombre en inglés', () => {
    expect(CONQUEST_CITIES.length).toBeGreaterThan(20);
    for (const c of CONQUEST_CITIES) {
      expect(c.id).toMatch(/^cq:[a-z]{2}-[a-z0-9-]+$/);
      expect(c.nameEn).toBeTruthy();
      expect(catalogItem(c.id)).toBe(c);
      expect(kindFromPlaceId(c.id).kind).toBe('city');
    }
    const burdeos = CONQUEST_CITIES.find((c) => c.id === 'cq:fr-burdeos')!;
    expect(itemTitle(burdeos, 'es')).toBe('Burdeos');
    expect(itemTitle(burdeos, 'en')).toBe('Bordeaux');
  });

  it('la semilla del servidor trae las ciudades nuevas, las reutilizadas y las 120 filas del banco', () => {
    const sql = readFileSync('supabase/seed/conquest_bank.sql', 'utf8');
    const bank = sql.slice(sql.indexOf('insert into public.conq_bank'));
    expect(bank.match(/^ {2}\('[A-Z]{2}', /gm)?.length).toBe(120);
    for (const c of CONQUEST_CITIES) expect(sql).toContain(`('${c.id}', 'city'`);
  });
});

// ── Fase C3: cliente (códigos, errores, tiempo y el simulador de desarrollo) ──

describe('Conquista: cliente', () => {
  it('normaliza y reconoce el código de un grupo', () => {
    expect(normalizeConqCode(' ab-c 23x9z ')).toBe('ABC23X');
    expect(isConqCode('ABC23X')).toBe(true);
    expect(isConqCode('ABC23')).toBe(false);
  });

  it('traduce los errores del servidor a códigos estables', () => {
    expect(mapConqError({ message: 'conq_group_full' }).code).toBe('group_full');
    expect(mapConqError({ message: 'conq_season_active' }).code).toBe('season_active');
    expect(mapConqError({ message: 'not authenticated' }).code).toBe('account_required');
    expect(mapConqError({ message: 'Failed to fetch' }).code).toBe('network');
  });

  it('cuenta regresiva de la temporada', () => {
    expect(formatTimeLeft(7 * 86_400_000)).toBe('7 d');
    expect(formatTimeLeft(6 * 86_400_000 + 23 * 3_600_000)).toBe('6 d 23 h');
    expect(formatTimeLeft(5 * 3_600_000 + 10 * 60_000)).toBe('5 h 10 min');
    expect(formatTimeLeft(12 * 60_000)).toBe('12 min');
  });

  it('simulador: crear, invitar, cupo de 5, iniciar y no salir con la temporada en curso', async () => {
    localStorage.setItem('geospeed_mock_conquest', '1');
    localStorage.removeItem('geospeed_mock_conquest_db');
    const w = window as unknown as { __mockConqJoin: (n: number) => number; __mockConqGroup: (n: number) => string };
    // Unirse al grupo de otra persona (4 integrantes): entra y queda confirmado
    const code = w.__mockConqGroup(4);
    const p = await previewInvite(code);
    expect(p.state).toBe('open');
    const joined = await acceptInvite(code);
    expect(joined.members).toHaveLength(5);
    expect(joined.members.find((m) => m.me)?.confirmed).toBe(true);
    // Lleno: un sexto no entra (otro grupo propio para probar el límite)
    const mine = await createGroup('Mi grupo', 'r1');
    expect(mine.is_admin && mine.season?.status === 'lobby').toBe(true);
    await expect(startSeason(mine.id)).rejects.toMatchObject({ code: 'not_enough_players' });
    w.__mockConqJoin(4);
    const full = await fetchGroup(mine.id);
    expect(full.members).toHaveLength(5);
    const started = await startSeason(mine.id);
    expect(started.season?.status).toBe('active');
    expect(Date.parse(started.season!.ends_at!) - Date.parse(started.season!.started_at!)).toBe(7 * 86_400_000);
    await expect(leaveGroup(mine.id)).rejects.toBeInstanceOf(ConqError);
    localStorage.removeItem('geospeed_mock_conquest');
    localStorage.removeItem('geospeed_mock_conquest_db');
  });
});

describe('Conquista: tablero y práctica (C4)', () => {
  it('fórmula de la especificación v1.1 (casos de control)', () => {
    expect(conqPoints(0, 0)).toBe(1000);
    expect(conqPoints(0, 7.5)).toBe(750);
    expect(conqPoints(500, 7.5)).toBe(276);
    expect(conqPoints(120, 15)).toBe(0);
    expect(conqPoints(120, 16)).toBe(0);
    expect(conqPoints(null, 3)).toBe(0);
    expect(5 * conqPoints(0, 7.5)).toBe(3750);
    // Sin decimales raros: siempre un entero entre 0 y 1.000
    for (let km = 0; km <= 3000; km += 137) for (let t = 0; t < 15; t += 1.3) {
      const p = conqPoints(km, t);
      expect(Number.isInteger(p) && p >= 0 && p <= 1000).toBe(true);
    }
  });

  it('colores: amarillo yo; rivales con color y trama distintos; iniciales que no se repiten', () => {
    const players = [
      { user_id: 'a', name: 'Paola', avatar: null, slot: 0 },
      { user_id: 'me', name: 'JuanJo', avatar: null, slot: 1 },
      { user_id: 'b', name: 'Pedro', avatar: null, slot: 2 },
      { user_id: 'c', name: 'Valentina', avatar: null, slot: 3 },
      { user_id: 'd', name: null, avatar: null, slot: 4 },
    ];
    const st = playerStyles(players, 'me');
    expect(st.get('me')).toMatchObject({ me: true, color: CONQ.me, pattern: null });
    const rivals = ['a', 'b', 'c', 'd'].map((id) => st.get(id)!);
    expect(new Set(rivals.map((r) => r.color)).size).toBe(4);
    expect(new Set(rivals.map((r) => r.pattern)).size).toBe(4);
    expect(rivals.every((r) => r.color !== CONQ.me)).toBe(true);
    expect(st.get('a')!.initial).toBe('Pa');
    expect(st.get('b')!.initial).toBe('Pe');
    expect(st.get('c')!.initial).toBe('V');
    expect(st.get('d')!.initial).toBe('?');
  });

  it('toque en el mapa: el país del tablero más cercano, nunca la Guayana como Francia', () => {
    expect(pickTerritory(-12.05, -77.04)).toBe('PE'); // Lima
    expect(pickTerritory(4.71, -74.07)).toBe('CO'); // Bogotá
    expect(pickTerritory(-0.18, -78.47)).toBe('EC'); // Quito
    expect(pickTerritory(40.42, -3.7)).toBe('ES');
    expect(pickTerritory(48.86, 2.35)).toBe('FR');
    expect(pickTerritory(41.9, 12.5)).toBe('IT');
    expect(pickTerritory(19.43, -99.13)).toBe('MX');
    expect(pickTerritory(-33.45, -70.67)).toBe('CL');
    expect(pickTerritory(-1.0, -77.5)).toBe('EC');
    expect(pickTerritory(4.9, -52.3)).not.toBe('FR'); // Cayena
    expect(pickTerritory(10, -40)).toBeNull(); // Atlántico
    expect(pickTerritory(51.5, -0.12)).toBeNull(); // Londres: fuera del tablero
  });

  it('capas: los 10 países pintados, iniciales solo de los que tienen dueño, Francia sin ultramar', () => {
    const st = playerStyles([{ user_id: 'me', name: 'Yo', avatar: null, slot: 0 }, { user_id: 'x', name: 'Paola', avatar: null, slot: 1 }], 'me');
    const terr = CONQUEST_COUNTRIES.map((c) => ({ iso: c.iso, owner_id: c.iso === 'PE' ? 'x' : c.iso === 'CO' ? 'me' : null, retired: c.iso === 'IT', defense: c.iso === 'PE' ? 3420 : 0, version: 0, captured_at: null, reserved_until: null }));
    const layer = boardLayer(terr, st, 'PE');
    expect(Object.keys(layer.fills)).toHaveLength(10);
    expect(layer.fills.CO.color).toBe(CONQ.me);
    expect(layer.fills.PE.color).toBe(CONQ.rivals[0]);
    expect(layer.fills.IT).toMatchObject({ color: CONQ.retired, pattern: 'stripes' });
    expect(layer.fills.BR.color).toBe(CONQ.free);
    expect(layer.badges!.map((b) => b.text).sort()).toEqual(['P', 'Y']);
    expect(layer.fills.FR.box![0]).toBeGreaterThan(-10); // la caja de Francia no llega a la Guayana (−54°)
    expect(missionLayer('CL').fills.CL.color).toBeUndefined();
    for (const c of CONQUEST_COUNTRIES) {
      const z = c.iso === 'ES' || c.iso === 'FR' || c.iso === 'IT' ? ZONE_BOUNDS.europe : ZONE_BOUNDS.america;
      expect(c.bounds[0] >= z.lonMin && c.bounds[2] <= z.lonMax && c.bounds[1] >= z.latMin && c.bounds[3] <= z.latMax).toBe(true);
    }
  });

  it('simulador: tablero, ficha con sus bloqueos y práctica fuera del paquete', async () => {
    localStorage.setItem('geospeed_mock_conquest', '1');
    localStorage.removeItem('geospeed_mock_conquest_db');
    const w = window as unknown as Record<string, (...a: unknown[]) => unknown>;
    const g = await createGroup('Tablero', 'r2');
    w.__mockConqJoin(2);
    const started = await startSeason(g.id);
    const sid = started.season!.id;
    const map = await fetchMap(sid);
    expect(map.territories).toHaveLength(10);
    expect(map.players).toHaveLength(3);
    expect(map.me).toMatchObject({ missions_left: 5, missions_per_day: 5 });
    expect(map.standings.every((x) => x.rank === 1)).toBe(true);
    // Un rival captura Perú con 3.420; yo tengo Colombia
    w.__mockConqOwn('PE', 'bot', 3420);
    w.__mockConqOwn('CO', 'me', 2600);
    const m2 = await fetchMap(sid);
    expect(m2.territories.find((x) => x.iso === 'PE')).toMatchObject({ defense: 3420 });
    expect(m2.standings[0].territories).toBe(1);
    expect((await fetchTerritory(sid, 'PE'))).toMatchObject({ kind: 'attack', can_start: true, reason: null });
    expect((await fetchTerritory(sid, 'CO')).reason).toBe('own_territory');
    expect((await fetchTerritory(sid, 'BR')).kind).toBe('capture');
    // Dos misiones en Chile hoy: tope por país (y la espera de 1 h)
    w.__mockConqUse('CL');
    expect((await fetchTerritory(sid, 'CL')).reason).toBe('cooldown');
    w.__mockConqUse('CL');
    expect((await fetchTerritory(sid, 'CL')).reason).toBe('country_limit');
    w.__mockConqReserve('AR', 2);
    expect((await fetchTerritory(sid, 'AR')).reason).toBe('reserved');
    expect((await fetchMap(sid)).me!.missions_left).toBe(3);
    // Práctica: 5 ciudades del banco de Perú que no son del paquete simulado (las 5 primeras)
    const pr = await fetchPracticeSet(sid, 'PE');
    const bank = conqCountry('PE')!.cityIds;
    expect(pr).toHaveLength(5);
    expect(pr.every((c) => bank.slice(5).includes(c.id))).toBe(true);
    localStorage.removeItem('geospeed_mock_conquest');
    localStorage.removeItem('geospeed_mock_conquest_db');
  });
});

describe('Conquista: misión oficial (C5)', () => {
  const W = () => window as unknown as Record<string, (...a: unknown[]) => unknown>;
  async function season() {
    localStorage.setItem('geospeed_mock_conquest', '1');
    localStorage.removeItem('geospeed_mock_conquest_db');
    const g = await createGroup('Misiones', `r-${Math.random()}`);
    W().__mockConqJoin(2);
    return (await startSeason(g.id)).season!.id;
  }
  const cleanup = () => { localStorage.removeItem('geospeed_mock_conquest'); localStorage.removeItem('geospeed_mock_conquest_db'); vi.useRealTimers(); };

  it('capturar: rondas una a una, el lugar llega al abrir, idempotente y el país cambia de dueño', async () => {
    const sid = await season();
    const a0 = await startAttempt(sid, 'BR', 'req-1');
    expect(a0).toMatchObject({ status: 'active', kind: 'capture', country: 'BR' });
    expect(a0.rounds.every((r) => r.place_id === null && r.correct === null)).toBe(true);
    // Repetir el inicio con la misma clave no gasta otra misión
    expect((await startAttempt(sid, 'BR', 'req-1')).id).toBe(a0.id);
    expect((await fetchMap(sid)).me).toMatchObject({ missions_left: 4, active_attempt: a0.id });
    await expect(openRound(a0.id, 2)).rejects.toMatchObject({ code: 'round_invalid' });
    await expect(startAttempt(sid, 'PE', 'req-2')).rejects.toMatchObject({ code: 'attempt_active' });
    let a = a0;
    for (let i = 1; i <= 5; i++) {
      a = await openRound(a.id, i);
      const r = a.rounds[i - 1];
      expect(r.place_id && r.deadline_at && !r.closed).toBeTruthy();
      expect(currentRound(a)?.idx).toBe(i);
      const c = (await import('@/lib/itemMemory')).cityById(r.place_id!)!;
      a = await answerRound(a.id, i, c.lat, c.lon);
      expect(a.rounds[i - 1]).toMatchObject({ closed: true, correct: { lat: c.lat, lon: c.lon } });
      expect(a.rounds[i - 1].answer!.points).toBeGreaterThan(900);
      // Reenviar la misma ronda devuelve lo ya aceptado
      const again = await answerRound(a.id, i, 0, 0);
      expect(again.rounds[i - 1].answer!.points).toBe(a.rounds[i - 1].answer!.points);
    }
    expect(a).toMatchObject({ status: 'completed', outcome: 'captured' });
    expect(answeredRounds(a)).toBe(5);
    const m = await fetchMap(sid);
    expect(m.territories.find((x) => x.iso === 'BR')).toMatchObject({ owner_id: 'me', defense: a.total, reserved_until: null });
    expect(m.me!.active_attempt).toBeNull();
    cleanup();
  });

  it('abandonar libera el país sin cambiarlo; atacar y empatar conserva al dueño', async () => {
    const sid = await season();
    W().__mockConqOwn('PE', 'bot', 0);
    const a = await startAttempt(sid, 'PE', 'req-a');
    expect(a.kind).toBe('attack');
    await openRound(a.id, 1);
    const ab = await abandonAttempt(a.id);
    expect(ab).toMatchObject({ status: 'abandoned', outcome: 'abandoned' });
    const t = await fetchTerritory(sid, 'PE');
    expect(t.reserved_until).toBeNull();
    expect(t.owner_id).not.toBe('me');
    // Empate: todas las rondas vencen (0 puntos) contra una marca de 0 → se queda el dueño
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(Date.now() + 3_700_000); // pasa la hora de espera del país
    const b = await startAttempt(sid, 'PE', 'req-b');
    let x = b;
    for (let i = 1; i <= 5; i++) {
      x = await openRound(x.id, i);
      vi.setSystemTime(Date.now() + 16_000);
      x = await fetchAttempt(x.id);
      expect(x.rounds[i - 1]).toMatchObject({ closed: true, answer: { points: 0, lat: null } });
    }
    expect(x).toMatchObject({ status: 'completed', outcome: 'tie', total: 0 });
    cleanup();
  });

  it('sin abrir la primera pregunta en 30 s se anula (no gasta misión); la reserva vence a los 3 min', async () => {
    const sid = await season();
    vi.useFakeTimers({ toFake: ['Date'] });
    const v = await startAttempt(sid, 'CL', 'req-v');
    vi.setSystemTime(Date.now() + 31_000);
    expect(await fetchAttempt(v.id)).toMatchObject({ status: 'void', outcome: 'void' });
    expect((await fetchMap(sid)).me!.missions_left).toBe(5);
    const e = await startAttempt(sid, 'MX', 'req-e');
    await openRound(e.id, 1);
    vi.setSystemTime(Date.now() + 181_000);
    expect(await fetchAttempt(e.id)).toMatchObject({ status: 'expired', outcome: 'expired' });
    expect((await fetchTerritory(sid, 'MX')).reserved_until).toBeNull();
    cleanup();
  });

  it('recuerda la misión en curso de este teléfono', () => {
    forgetActiveMission();
    expect(activeMission()).toBeNull();
    rememberActiveMission({ attemptId: 'a1', seasonId: 's1', iso: 'PE' });
    expect(activeMission()).toEqual({ attemptId: 'a1', seasonId: 's1', iso: 'PE' });
    forgetActiveMission('otra');
    expect(activeMission()?.attemptId).toBe('a1');
    forgetActiveMission('a1');
    expect(activeMission()).toBeNull();
  });
});

describe('Conquista: actividad, temporada y cierre (C6)', () => {
  const ev = (p: Partial<ConqEvent>): ConqEvent => ({ id: 1, type: 'captured', country: 'PE', actor_id: null, prev_owner: null, new_owner: null, score: 3780, defense: 3420, at: new Date().toISOString(), can_recover: false, ...p });
  const names: Record<string, string> = { me: 'Tú', p: 'Paola', g: 'Gerónimo' };
  const d = (e: ConqEvent) => describeEvent(e, 'me', (id) => (id ? names[id] ?? 'Jugador retirado' : 'Jugador retirado'), 'Perú', 2000, (n) => String(n));

  it('cada evento contado desde mi punto de vista', () => {
    expect(d(ev({ type: 'captured', actor_id: 'me', new_owner: 'me' })).title[0]).toBe('cq_ev_capturedMe');
    expect(d(ev({ type: 'captured', actor_id: 'p', new_owner: 'p' }))).toMatchObject({ title: ['cq_ev_captured', { actor: 'Paola', country: 'Perú' }], tone: 'other' });
    // Me quitaron Perú: tono "perdido" (ahí va RECUPERAR)
    expect(d(ev({ type: 'conquered', actor_id: 'p', prev_owner: 'me', new_owner: 'p' }))).toMatchObject({ title: ['cq_ev_lost', { actor: 'Paola' }], tone: 'lost' });
    expect(d(ev({ type: 'conquered', actor_id: 'me', prev_owner: 'p', new_owner: 'me' }))).toMatchObject({ title: ['cq_ev_conqueredMe', {}], sub: ['cq_ev_subBeat', { name: 'Paola', score: '3780', mark: '3420' }] });
    expect(d(ev({ type: 'conquered', actor_id: 'g', prev_owner: 'p', new_owner: 'g' })).title[0]).toBe('cq_ev_conquered');
    // Defensa y empate: el dueño es new_owner, el atacante actor_id
    expect(d(ev({ type: 'defended', actor_id: 'p', prev_owner: 'me', new_owner: 'me' }))).toMatchObject({ title: ['cq_ev_heldMe', { actor: 'Paola' }], tone: 'held' });
    expect(d(ev({ type: 'defended', actor_id: 'me', prev_owner: 'p', new_owner: 'p' })).title[0]).toBe('cq_ev_attackFailed');
    expect(d(ev({ type: 'tie', actor_id: 'g', prev_owner: 'me', new_owner: 'me' })).title[0]).toBe('cq_ev_tieMe');
    expect(d(ev({ type: 'tie', actor_id: 'g', prev_owner: 'p', new_owner: 'p' }))).toMatchObject({ sub: ['cq_ev_subTieOwner', { name: 'Paola' }] });
    expect(d(ev({ type: 'failed', actor_id: 'me', score: 1500 }))).toMatchObject({ sub: ['cq_ev_subOf', { score: '1500', threshold: '2000' }] });
    expect(d(ev({ type: 'season_close', country: null })).tone).toBe('system');
    // Un retirado no rompe el texto
    expect(d(ev({ type: 'conquered', actor_id: 'x', prev_owner: 'p', new_owner: 'x' })).title[1].actor).toBe('Jugador retirado');
  });

  it('hace cuánto, en el idioma del juego', () => {
    const now = Date.parse('2026-10-27T12:00:00Z');
    expect(timeAgo('2026-10-27T11:50:00Z', now, 'es')).toBe('hace 10 minutos');
    expect(timeAgo('2026-10-27T10:00:00Z', now, 'en')).toBe('2 hours ago');
  });

  it('recordatorios: 24 h y 1 h antes del cierre, solo los que no pasaron; ids estables', () => {
    const ends = Date.parse('2026-11-03T12:00:00Z');
    expect(reminderTimes(ends, ends - 48 * 3_600_000).map((x) => x.h)).toEqual([24, 1]);
    expect(reminderTimes(ends, ends - 5 * 3_600_000).map((x) => x.h)).toEqual([1]);
    expect(reminderTimes(ends, ends - 1000)).toEqual([]);
    expect(nativeReminderId('abc', 24)).toBe(nativeReminderId('abc', 24));
    expect(nativeReminderId('abc', 24) + 1).toBe(nativeReminderId('abc', 1));
  });

  it('campeones: puesto 1 con al menos un territorio; empates comparten', () => {
    const row = (id: string, territories: number, rank: number) => ({ user_id: id, name: id, slot: 0, avatar: null, territories, defense_sum: 0, rank });
    expect(championsOf([row('a', 2, 1), row('b', 2, 1), row('c', 1, 3)]).map((x) => x.user_id)).toEqual(['a', 'b']);
    expect(championsOf([row('a', 0, 1), row('b', 0, 1)])).toEqual([]);
  });

  it('simulador: actividad con filtro, visto y cierre con campeón e historial', async () => {
    localStorage.setItem('geospeed_mock_conquest', '1');
    localStorage.removeItem('geospeed_mock_conquest_db');
    const w = window as unknown as Record<string, (...a: unknown[]) => unknown>;
    const g = await createGroup('Cierre', 'rc');
    w.__mockConqJoin(2);
    const sid = (await startSeason(g.id)).season!.id;
    w.__mockConqOwn('PE', 'bot', 3420);
    w.__mockConqOwn('CO', 'me', 2600);
    const all = await fetchActivity(sid);
    expect(all.map((e) => e.type)).toEqual(['captured', 'captured', 'season_start']);
    expect((await fetchActivity(sid, true)).map((e) => e.country)).toEqual(['CO', null]);
    expect((await fetchMap(sid)).unread).toBe(1);
    await markSeen(sid, all[0].id);
    expect((await fetchMap(sid)).unread).toBe(0);
    // El bot me quita Colombia: puedo recuperarla
    w.__mockConqOwn('CO', 'bot', 3000);
    const lost = (await fetchActivity(sid))[0];
    expect(lost).toMatchObject({ type: 'conquered', prev_owner: 'me', can_recover: true });
    // Cierre: el bot gana con 2 territorios; queda la sala de la temporada 2
    w.__mockConqEndSeason();
    const st = await fetchStandings(sid);
    expect(st.final).toBe(true);
    expect(championsOf(st.standings).map((x) => x.territories)).toEqual([2]);
    expect(st.awards).toHaveLength(1);
    expect(st.history.map((h) => h.number)).toEqual([1]);
    const m = await fetchMap(sid);
    expect(m.final).toBe(true);
    expect(m.me).toBeNull();
    expect((await fetchActivity(sid))[0].type).toBe('season_close');
    expect((await fetchActivity(sid)).some((e) => e.can_recover)).toBe(false);
    const lobby = await fetchGroup(g.id);
    expect(lobby.season).toMatchObject({ number: 2, status: 'lobby' });
    expect(lobby.last_closed?.champions).toHaveLength(1);
    localStorage.removeItem('geospeed_mock_conquest');
    localStorage.removeItem('geospeed_mock_conquest_db');
  });
});

describe('Conquista: QA y red (C7)', () => {
  const sample = (over: Partial<NetSample> = {}): NetSample => ({ idx: 1, openRttMs: 200, thinkMs: 4000, answerRttMs: 220, serverS: 4.3, km: 120, ...over });

  it('el retraso es lo que el servidor contó de más y nunca es negativo', () => {
    expect(roundDelayMs(sample())).toBe(300);
    expect(roundDelayMs(sample({ serverS: 3.9 }))).toBe(0);
  });

  it('los puntos que costó la red salen de la fórmula de Conquista', () => {
    expect(lostPoints(sample())).toBe(conqPoints(120, 4) - conqPoints(120, 4.3));
    expect(lostPoints(sample({ km: null }))).toBe(0);
    // Tocó a los 14,8 s en el teléfono, pero llegó después de los 15: el servidor da 0
    expect(lostPoints(sample({ thinkMs: 14_800, serverS: 15.2 }))).toBe(conqPoints(120, 14.8));
  });

  it('resume la misión: promedio, máximo, ida y vuelta y puntos perdidos', () => {
    expect(summarizeNet([])).toBeNull();
    const s = summarizeNet([sample(), sample({ idx: 2, serverS: 4.9, openRttMs: 400, answerRttMs: 400 })])!;
    expect(s).toMatchObject({ rounds: 2, avgDelayMs: 600, maxDelayMs: 900, avgRttMs: 305 });
    expect(s.lostPoints).toBe(lostPoints(sample()) + lostPoints(sample({ serverS: 4.9 })));
  });

  it('cada misión se guarda y se envía una sola vez', () => {
    localStorage.removeItem('geospeed_conq_net');
    localStorage.removeItem('geospeed_conq_net_sent');
    const gtag = vi.fn();
    (window as unknown as { gtag: unknown }).gtag = gtag;
    reportMissionNet('a1', 'CO', [sample()]);
    reportMissionNet('a1', 'CO', [sample()]);
    reportMissionNet('a2', 'PE', [sample({ serverS: 4.5 })]);
    expect(netLog().map((r) => r.iso)).toEqual(['CO', 'PE']);
    expect(netAverage()).toMatchObject({ missions: 2, avgDelayMs: 400 });
    expect(gtag.mock.calls.filter((c) => c[1] === 'conq_latency')).toHaveLength(2);
    delete (window as unknown as { gtag?: unknown }).gtag;
    localStorage.removeItem('geospeed_conq_net');
    localStorage.removeItem('geospeed_conq_net_sent');
  });

  it('entrar a un grupo activa Conquista en ese teléfono (el grupo de prueba la ve aunque siga oculta)', async () => {
    localStorage.setItem('geospeed_mock_conquest', '1');
    localStorage.removeItem('geospeed_mock_conquest_db');
    localStorage.removeItem('geospeed_conquest_beta');
    const code = (window as unknown as { __mockConqGroup: (n: number) => string }).__mockConqGroup(2);
    expect(conquestBetaOn()).toBe(false);
    await acceptInvite(code);
    expect(conquestBetaOn()).toBe(true);
    localStorage.removeItem('geospeed_conquest_beta');
    localStorage.removeItem('geospeed_mock_conquest');
    localStorage.removeItem('geospeed_mock_conquest_db');
  });

  it('en una temporada acelerada los recordatorios se aceleran igual', () => {
    const ends = Date.parse('2026-11-08T20:00:00Z');
    // Con 144 un día dura 10 minutos: "24 h antes" = 10 min antes y "1 h antes" = 25 s antes
    expect(reminderTimes(ends, ends - 11 * 60_000, 144)).toEqual([{ h: 24, at: ends - 600_000 }, { h: 1, at: ends - 25_000 }]);
    expect(reminderTimes(ends, ends - 60_000, 144).map((x) => x.h)).toEqual([1]);
    expect(reminderTimes(ends, ends - 48 * 3_600_000, 0).map((x) => x.h)).toEqual([24, 1]);
  });
});
