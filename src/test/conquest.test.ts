/** Conquista — fase C1 (banco de ciudades, encuadre, semilla del servidor) y fase C3 (cliente y simulador). */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { CONQUEST_COUNTRIES, CONQUEST_CITIES } from '@/data/conquestCatalog';
import { CONQUEST_COUNTRIES_SPEC } from '@/data/conquestTiers';
import { worldCities, europeCities, asiaCities, americasCities, africaCities } from '@/data/cities';
import { COLOMBIA_CITIES } from '@/data/colombiaCatalog';
import { PRO_PACK_CITIES } from '@/data/proPackCatalog';
import { catalogItem, kindFromPlaceId, itemTitle } from '@/lib/catalog';
import { normalizeConqCode, isConqCode, mapConqError, formatTimeLeft, createGroup, previewInvite, acceptInvite, fetchGroup, startSeason, leaveGroup, ConqError } from '@/lib/conquest';

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
