import { describe, it, expect, beforeEach } from 'vitest';
import { formatPopulation, formatSince, formatArea, keyFact, factRows, factIdOf } from '@/lib/placeFacts';
import facts from '@/data/placeFacts.json';
import trivia from '@/data/placeTrivia.json';

const t = ((k: string, p?: Record<string, string | number>) => `${k}${p ? `(${Object.values(p).join('|')})` : ''}`) as never;

describe('placeFacts — ficha del lugar (Fase 8)', () => {
  beforeEach(() => { document.documentElement.lang = 'es'; });

  it('redondea los habitantes como en la especificación', () => {
    expect(formatPopulation(2_569_007, 'es')).toBe('2,6 millones');
    expect(formatPopulation(2_569_007, 'en')).toBe('2.6 million');
    expect(formatPopulation(14_264_798, 'es')).toBe('14 millones');
    expect(formatPopulation(1_000_000, 'es')).toBe('1 millón');
    expect(formatPopulation(428_450, 'es')).toBe('428.000');
    expect(formatPopulation(9_121, 'es')).toBe('9.100');
    expect(formatPopulation(1_412_000_000, 'es')).toBe('1.410 millones');
    expect(formatPopulation(1_412_000_000, 'en')).toBe('1.4 billion');
  });

  it('escribe fechas por precisión (año, siglo, a. C.)', () => {
    expect(formatSince([1887, 11], 'es')).toBe('1887');
    expect(formatSince([1450, 7], 'es')).toBe('siglo XV');
    expect(formatSince([1450, 7], 'en')).toBe('15th century');
    expect(formatSince([-2560, 9], 'es')).toBe('2560 a. C.');
    expect(formatSince([1880, 8], 'en')).toBe('1880s');
    expect(formatArea(1141.7)).toBe('1.142 km²');
  });

  it('elige el dato clave de cada categoría', () => {
    expect(keyFact({ id: 'medellin', name: 'Medellín', country: 'Colombia' }, { pop: 2_529_403 }, t, 'es')).toBe('fact_peopleMillions(2,5 millones)');
    expect(keyFact({ id: 'flag:CO', kind: 'flag', name: 'Colombia', country: '' }, { cap: ['Bogotá', 'Bogotá'], pop: 5e7 }, t, 'es')).toBe('fact_capitalOf(Bogotá)');
    expect(keyFact({ id: 'feat:amazonas', kind: 'feature', name: 'Río Amazonas', country: '' }, { len: 6992 }, t, 'es')).toBe('fact_longKey(6.992 km)');
    expect(keyFact({ id: 'mon:x', kind: 'monument', name: 'X', country: '' }, { since: [1887, 11] }, t, 'es')).toBe('fact_builtKey(1887)');
    expect(keyFact({ id: 'x', name: 'X', country: '' }, null, t, 'es')).toBeNull();
    // Mundial: el elemento es un país sin id → su bandera
    expect(factIdOf({ name: '⚽ Messi', country: 'Argentina' })).toBe('flag:AR');
  });

  it('todo elemento con cifras tiene id de Wikidata y los datos curiosos tienen ES y EN', () => {
    const f = facts as unknown as Record<string, { q?: string; pop?: number }>;
    expect(Object.keys(f).length).toBeGreaterThan(2000);
    for (const v of Object.values(f)) if (v.pop) expect(v.q).toMatch(/^Q\d+$/);
    const tr = trivia as unknown as Record<string, [string, string]>;
    expect(Object.keys(tr).length).toBeGreaterThan(1200);
    for (const [es, en] of Object.values(tr)) {
      expect(es.length).toBeGreaterThan(30);
      expect(es.length).toBeLessThanOrEqual(150);
      expect(en.length).toBeGreaterThan(30);
    }
    expect(factRows({ id: 'flag:CO', kind: 'flag', name: 'Colombia', country: '' }, f['flag:CO'] as never, t, 'es').map((r) => r.label)).toContain('fact_capital');
  });
});
