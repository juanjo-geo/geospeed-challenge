import { describe, it, expect } from 'vitest';
import {
  evaluateTerritory,
  scoreWorldRound,
  nextStreak,
  getCountryAt,
  COUNTRY_CONTINENT,
} from '../lib/worldChallenge';
import { worldChallengePlayers, getPlayersByDifficulty } from '../data/players';
import { countryAdjacency } from '../data/countryAdjacency';

// Coordenadas de referencia (lat, lon) bien dentro de cada país.
const PT = {
  argentina: [-34.6, -58.4],   // Buenos Aires
  chile: [-33.45, -70.67],     // Santiago (vecino de Argentina)
  brazil: [-15.79, -47.88],    // Brasilia (vecino de Argentina)
  spain: [40.42, -3.7],        // Madrid (mismo continente que Francia, no vecino de Argentina)
  japan: [35.68, 139.69],      // Tokio (otro continente)
  france: [48.86, 2.35],       // París
  germany: [52.52, 13.41],     // Berlín (vecino de Francia)
  italy: [41.9, 12.5],         // Roma (vecino de Francia)
  ocean: [0, -30],             // Atlántico medio
} as const;

describe('players dataset', () => {
  it('tiene exactamente 80 jugadores', () => {
    expect(worldChallengePlayers.length).toBe(80);
  });

  it('tiene 20 jugadores por nivel de dificultad', () => {
    expect(getPlayersByDifficulty('basic').length).toBe(20);
    expect(getPlayersByDifficulty('easy').length).toBe(20);
    expect(getPlayersByDifficulty('medium').length).toBe(20);
    expect(getPlayersByDifficulty('hard').length).toBe(20);
  });

  it('todos los países de jugadores tienen continente conocido', () => {
    for (const p of worldChallengePlayers) {
      expect(COUNTRY_CONTINENT[p.country], `${p.name} → ${p.country}`).toBeDefined();
    }
  });

  it('todos los países de jugadores tienen entrada de adyacencia', () => {
    for (const p of worldChallengePlayers) {
      expect(countryAdjacency[p.country], `${p.name} → ${p.country}`).toBeDefined();
    }
  });
});

describe('getCountryAt (point-in-polygon)', () => {
  it('detecta Argentina en Buenos Aires', () => {
    expect(getCountryAt(PT.argentina[0], PT.argentina[1])).toBe('Argentina');
  });
  it('detecta Japan en Tokio', () => {
    expect(getCountryAt(PT.japan[0], PT.japan[1])).toBe('Japan');
  });
  it('devuelve null en océano abierto', () => {
    expect(getCountryAt(PT.ocean[0], PT.ocean[1])).toBeNull();
  });
});

describe('evaluateTerritory — bandas', () => {
  it('Exacto: tocar el país correcto', () => {
    const r = evaluateTerritory('Argentina', PT.argentina[0], PT.argentina[1]);
    expect(r.band).toBe('exact');
    expect(r.basePoints).toBe(1000);
  });

  it('Vecino: tocar un país con frontera compartida', () => {
    const r = evaluateTerritory('Argentina', PT.chile[0], PT.chile[1]);
    expect(r.band).toBe('neighbor');
    expect(r.basePoints).toBe(600);
  });

  it('Mismo continente: país del continente pero no vecino', () => {
    // España y Francia son ambos Europa y vecinos → usar Argentina vs España (Americas vs Europe = far),
    // mejor: Francia (Europa) vs Polonia no vecina. Usamos Francia correcto, tocar Italia (vecino) NO.
    // Caso limpio: correcto Francia, tocar España = vecino. Para continente usamos Argentina? Americas.
    // Tomamos correcto = Spain, tocar Germany (Europa, no vecinos) → continente.
    const r = evaluateTerritory('Spain', PT.germany[0], PT.germany[1]);
    expect(r.band).toBe('continent');
    expect(r.basePoints).toBe(300);
  });

  it('Lejos: otro continente', () => {
    const r = evaluateTerritory('Argentina', PT.japan[0], PT.japan[1]);
    expect(r.band).toBe('far');
    expect(r.basePoints).toBe(50);
  });

  it('Océano: fuera de territorio', () => {
    const r = evaluateTerritory('Argentina', PT.ocean[0], PT.ocean[1]);
    expect(r.band).toBe('ocean');
    expect(r.basePoints).toBe(0);
    expect(r.tappedCountry).toBeNull();
  });

  it('Vecino simétrico: Francia correcto, tocar Alemania', () => {
    const r = evaluateTerritory('France', PT.germany[0], PT.germany[1]);
    expect(r.band).toBe('neighbor');
  });
});

describe('nextStreak — vecino mantiene racha', () => {
  it('Exacto sube la racha', () => {
    expect(nextStreak('exact', 3)).toBe(4);
  });
  it('Vecino TAMBIÉN sube la racha (decisión de producto)', () => {
    expect(nextStreak('neighbor', 3)).toBe(4);
  });
  it('Mismo continente divide la racha a la mitad', () => {
    expect(nextStreak('continent', 4)).toBe(2);
  });
  it('Lejos reinicia la racha', () => {
    expect(nextStreak('far', 5)).toBe(0);
  });
  it('Océano reinicia la racha', () => {
    expect(nextStreak('ocean', 5)).toBe(0);
  });
});

describe('scoreWorldRound — pipeline completo', () => {
  it('Exacto rápido (3s) sin racha = 1000 × 1.81 = 1810', () => {
    const r = scoreWorldRound('Argentina', PT.argentina[0], PT.argentina[1], 3, 0);
    expect(r.band).toBe('exact');
    expect(r.multiplier).toBe(1.81);
    expect(r.streakBonus).toBe(1);
    expect(r.totalPoints).toBe(1810);
    expect(r.newStreak).toBe(1);
  });

  it('aplica bonus de racha con streak alto (tope ×1.60)', () => {
    // streak entrante 10 → newStreak 11 → bonus = min(1.6, 1 + 10*0.1) = 1.6
    const r = scoreWorldRound('Argentina', PT.argentina[0], PT.argentina[1], 3, 10);
    expect(r.newStreak).toBe(11);
    expect(r.streakBonus).toBe(1.6);
    expect(r.totalPoints).toBe(Math.round(1000 * 1.81 * 1.6));
  });

  it('Océano da 0 puntos sin importar velocidad', () => {
    const r = scoreWorldRound('Argentina', PT.ocean[0], PT.ocean[1], 1, 5);
    expect(r.totalPoints).toBe(0);
    expect(r.newStreak).toBe(0);
  });

  it('respeta override de país tocado (sin point-in-polygon)', () => {
    const r = scoreWorldRound('Argentina', 0, 0, 5, 0, 'Chile');
    expect(r.band).toBe('neighbor');
    expect(r.basePoints).toBe(600);
  });
});
