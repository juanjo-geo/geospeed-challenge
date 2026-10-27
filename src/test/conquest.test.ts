/** Conquista — fase C1 (banco de ciudades, encuadre, semilla del servidor) y fase C3 (cliente y simulador). */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { CONQUEST_COUNTRIES, CONQUEST_CITIES } from '@/data/conquestCatalog';
import { CONQUEST_COUNTRIES_SPEC } from '@/data/conquestTiers';
import { worldCities, europeCities, asiaCities, americasCities, africaCities } from '@/data/cities';
import { COLOMBIA_CITIES } from '@/data/colombiaCatalog';
import { PRO_PACK_CITIES } from '@/data/proPackCatalog';
import { catalogItem, kindFromPlaceId, itemTitle } from '@/lib/catalog';
import { normalizeConqCode, isConqCode, mapConqError, formatTimeLeft, createGroup, previewInvite, acceptInvite, fetchGroup, startSeason, leaveGroup, ConqError, conqPoints, fetchMap, fetchTerritory, fetchPracticeSet } from '@/lib/conquest';
import { playerStyles, pickTerritory, boardLayer, missionLayer, ZONE_BOUNDS, conqCountry } from '@/lib/conquestMap';
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
