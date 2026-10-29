/** Arreglos de la auditoría AUD05/AUD08 (fase C0 de Conquista): nombres en inglés y cuenta regresiva del diario. */
import { describe, it, expect } from 'vitest';
import { worldCities } from '@/data/cities';
import { CITY_NAMES_EN } from '@/data/cityNamesEn';
import { itemTitle, itemSubtitle } from '@/lib/catalog';
import { timeUntilRollover, nextRollover } from '@/lib/gameDay';

const city = (id: string) => worldCities.find((c) => c.id === id)!;

describe('AUD05: nombres en inglés', () => {
  it('la ciudad y su país salen en el idioma del juego', () => {
    const cairo = city('el-cairo');
    expect(itemTitle(cairo, 'es')).toBe('El Cairo');
    expect(itemTitle(cairo, 'en')).toBe('Cairo');
    expect(itemSubtitle(cairo, 'es')).toBe('Egipto');
    expect(itemSubtitle(cairo, 'en')).toBe('Egypt');
    expect(itemTitle(city('johannesburgo'), 'en')).toBe('Johannesburg');
  });

  it('en inglés las ciudades pierden la tilde del español (Paris, no París)', () => {
    expect(itemTitle(city('paris'), 'en')).toBe('Paris');
    expect(itemTitle(city('berlin'), 'en')).toBe('Berlin');
    expect(itemTitle(city('rio-de-janeiro'), 'en')).toBe('Rio de Janeiro');
    expect(itemTitle(city('paris'), 'es')).toBe('París');
  });

  it('una ciudad que se llama igual en los dos idiomas no está en la tabla', () => {
    const bogota = worldCities.find((c) => c.name === 'Bogotá')!;
    expect(CITY_NAMES_EN[bogota.id!]).toBeUndefined();
    expect(itemTitle(bogota, 'en')).toBe('Bogotá');
  });

  it('la tabla solo trae ciudades del mundo y nombres sin paréntesis', () => {
    for (const [id, name] of Object.entries(CITY_NAMES_EN)) {
      expect(id.includes(':')).toBe(false);
      expect(name).not.toMatch(/[()]/);
    }
  });
});

describe('AUD08: cuenta regresiva del diario', () => {
  it('dice cuánto falta para la medianoche de Colombia, sin depender de la zona horaria', () => {
    const at = new Date('2026-10-27T02:22:00Z'); // 21:22 en Colombia
    expect(nextRollover(at).toISOString()).toBe('2026-10-27T05:00:00.000Z');
    expect(timeUntilRollover(at)).toBe('2 h 38 min');
    expect(timeUntilRollover(new Date('2026-10-27T04:15:00Z'))).toBe('45 min');
    expect(timeUntilRollover(new Date('2026-10-27T03:00:00Z'))).toBe('2 h');
  });
});
