import { describe, it, expect } from 'vitest';
import { divisionOf, divisionProgress, countryOptions, isoName, sprintCitiesToGame, sprintGhost, type SprintMatch } from '@/lib/sprint';

describe('Sprint (Fase 5)', () => {
  it('divisiones por PS, igual que el servidor', () => {
    expect([1099, 1100, 1299, 1300, 1500, 1700, 2400].map((p) => divisionOf(p).key))
      .toEqual(['ciudad', 'region', 'region', 'pais', 'continente', 'mundo', 'mundo']);
  });

  it('progreso hacia la siguiente división', () => {
    expect(divisionProgress(1000)).toMatchObject({ missing: 100 });
    expect(divisionProgress(1000).pct).toBeCloseTo(0.5);
    expect(divisionProgress(1200)).toMatchObject({ missing: 100, pct: 0.5 });
    expect(divisionProgress(1800)).toMatchObject({ pct: 1, next: null, missing: null });
  });

  it('lista de países con nombre en el idioma del juego', () => {
    const es = countryOptions('es');
    expect(es.find((c) => c.iso === 'CO')?.name).toBe('Colombia');
    expect(es.every((c) => /^[A-Z]{2}$/.test(c.iso))).toBe(true);
    expect(isoName('MX', 'en')).toBe('Mexico');
  });

  it('la carrera se juega con las ciudades y el fantasma del rival', () => {
    const m: SprintMatch = {
      match_id: 'm', started_at: '', opp_score: 7000,
      cities: [{ n: 1, id: 'bogota', name: 'Bogotá', country: 'Colombia', iso: 'CO', lat: 4.7, lon: -74.1 }],
      opponent: { name: 'Ana', avatar: null, country: 'CO', points: 1020, division: 'ciudad', house: false },
      opp_rounds: [{ round_no: 1, time_s: 2.1, click_lat: 4.6, click_lon: -74, distance_km: 12, points: 1900 }],
    };
    expect(sprintCitiesToGame(m)[0]).toMatchObject({ id: 'bogota', name: 'Bogotá' });
    expect(sprintGhost(m)).toMatchObject({ name: 'Ana', score: 7000, rounds: m.opp_rounds });
  });
});
