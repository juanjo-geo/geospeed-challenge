/** Packs Pro (Fase 7b): catálogo, categorías ofrecidas, selección, escala, pistas y la partida de prueba diaria. */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PRO_PACK_CITIES, PRO_PACK_DIVISIONS } from '@/data/proPackCatalog';
import { PRO_PACK_META } from '@/data/proPackMeta';
import proShapesJson from '@/data/proPackShapes.json';
import { getMapBounds, isPackMode, type City, type GameMode } from '@/data/cities';
import { getRandomItems, categoriesForMode, featuresByMode, landmarksByMode } from '@/lib/catalog';
import { scaleForMode } from '@/lib/scoring';
import { itemHint } from '@/lib/cityHints';

vi.mock('@/lib/premiumSystem', () => ({ isPro: () => false }));
// La prueba también se pregunta al servidor (claim_pack_trial): respuesta simulada
const server = { claim: true as boolean | null, calls: [] as string[] };
vi.mock('@/lib/identity', () => ({ ensureGuestSession: async () => 'existing' }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { rpc: async (fn: string) => { server.calls.push(fn); return server.claim === null ? { data: null, error: { message: 'x' } } : { data: server.claim, error: null }; } },
}));
import { canPlayPack, markPackTrial, refundPackTrial, isPackTrial, claimPackTrial } from '@/lib/packAccess';

const PACKS = ['andes', 'conosur', 'mexcam', 'caribe'] as const;
const shapes = proShapesJson as unknown as Record<string, { rings: number[][][] }>;
const inBounds = (c: City, mode: GameMode) => {
  const b = getMapBounds(mode);
  return c.lat >= b.latMin && c.lat <= b.latMax && c.lon >= b.lonMin && c.lon <= b.lonMax;
};

describe('catálogo de los packs Pro', () => {
  it('cada pack tiene divisiones con contorno y ciudades dentro de su mapa, con los cuatro niveles', () => {
    const ids = [...PRO_PACK_CITIES, ...PRO_PACK_DIVISIONS].map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const p of PACKS) {
      expect(isPackMode(p)).toBe(true);
      expect(scaleForMode(p)).toBe(400);
      const divs = PRO_PACK_DIVISIONS.filter((d) => d.region === p);
      const cities = PRO_PACK_CITIES.filter((c) => c.region === p);
      expect(divs.length, p).toBeGreaterThanOrEqual(50);
      expect(cities.length, p).toBeGreaterThanOrEqual(60);
      for (const d of divs) { expect(shapes[d.id!]?.rings.length, d.id).toBeGreaterThan(0); expect(inBounds(d, p), d.id).toBe(true); }
      for (const c of cities) expect(inBounds(c, p), c.id).toBe(true);
      for (const tier of ['basic', 'easy', 'medium', 'hard']) expect(divs.some((d) => d.difficulty === tier), `${p} ${tier}`).toBe(true);
      // Cada país del pack tiene capital (referencia de las pistas)
      expect(Object.keys(PRO_PACK_META[p].capitals).sort()).toEqual([...PRO_PACK_META[p].isos].sort());
    }
  });
  it('solo se ofrecen las categorías con al menos 13 ítems, y siempre ciudades y divisiones', () => {
    for (const p of PACKS) {
      const cats = categoriesForMode(p);
      expect(cats.slice(0, 2), p).toEqual(['cities', 'divisions']);
      if (cats.includes('features')) expect(featuresByMode(p).length).toBeGreaterThanOrEqual(13);
      if (cats.includes('monuments')) expect(landmarksByMode(p).length).toBeGreaterThanOrEqual(13);
      for (const cat of cats) {
        const a = getRandomItems(cat, 'basic', 13, p, 3);
        expect(new Set(a.map((x) => x.id)).size, `${p} ${cat}`).toBe(13);
      }
    }
    expect(categoriesForMode('mexcam')).toContain('monuments');
    expect(featuresByMode('andes').some((f) => f.id === 'feat:titicaca')).toBe(true);
    expect(featuresByMode('andes').some((f) => f.id === 'feat:tayrona')).toBe(false); // exclusivo de Colombia
  });
  it('pistas: ciudad respecto a la capital del país, y división con su tipo y vecinos', () => {
    const cusco = PRO_PACK_CITIES.find((c) => c.region === 'andes' && c.name === 'Cusco')!;
    expect(itemHint(cusco, 'es')).toMatch(/^Cusco (es la capital de|está en) .*Perú; queda a unos [\d.]+ km al \w+ de Lima\.$/);
    const lima = PRO_PACK_CITIES.find((c) => c.region === 'andes' && c.name === 'Lima')!;
    expect(itemHint(lima, 'es')).toBe('Lima es la capital de Perú.');
    const div = PRO_PACK_DIVISIONS.find((d) => d.region === 'conosur' && d.name === 'Mendoza')!;
    expect(itemHint(div, 'es')).toMatch(/^Mendoza: provincia de Argentina/);
  });
});

describe('partida de prueba diaria (sin Pro)', () => {
  beforeEach(() => localStorage.removeItem('geospeed_pack_trials'));
  it('una por pack y por día; el pack Colombia y el mundo no tienen límite; cancelar la devuelve', () => {
    expect(canPlayPack('world')).toBe(true);
    expect(canPlayPack('colombia')).toBe(true);
    expect(isPackTrial('colombia')).toBe(false);
    expect(isPackTrial('andes')).toBe(true);
    expect(canPlayPack('andes')).toBe(true);
    markPackTrial('andes');
    expect(canPlayPack('andes')).toBe(false);
    expect(canPlayPack('caribe')).toBe(true);
    refundPackTrial('andes');
    expect(canPlayPack('andes')).toBe(true);
  });

  it('la prueba la decide el servidor: si ya la usó (otro teléfono, datos borrados) no se juega', async () => {
    server.calls = [];
    server.claim = false;
    expect(await claimPackTrial('andes')).toBe(false);
    expect(canPlayPack('andes')).toBe(false); // Inicio muestra "prueba de hoy usada"
    server.claim = true;
    expect(await claimPackTrial('caribe')).toBe(true);
    expect(await claimPackTrial('caribe')).toBe(false); // segunda vez el mismo día: ni pregunta
    server.claim = null; // sin red / migración sin aplicar: decide la marca local
    expect(await claimPackTrial('mexcam')).toBe(true);
    expect(await claimPackTrial('colombia')).toBe(true);
    expect(server.calls.filter((f) => f === 'claim_pack_trial')).toHaveLength(3);
  });
});
