/** Reseña del lugar (bloque R1): fotos del carrusel según el tipo de elemento y el país del Mundial. */
import { describe, it, expect } from 'vitest';
import facts from '@/data/placeFacts.json';
import { catalogItem } from '@/lib/catalog';
import { worldCities } from '@/data/cities';
import { storySlides, mundialStoryItem } from '@/lib/placeStory';
import type { PlaceFact } from '@/lib/placeFacts';

const F = facts as unknown as Record<string, PlaceFact>;

describe('reseña del lugar: carrusel', () => {
  it('una ciudad con foto propia: la ciudad, su país y lugares cercanos, sin repetir y hasta 5', () => {
    const ny = worldCities.find((c) => c.id === 'nueva-york')!;
    const s = storySlides(ny, F['nueva-york'], 'es');
    expect(s[0].url).toMatch(/\/cities\/nueva-york\.webp$/);
    expect(s[1].url).toMatch(/\/countries\/US\.webp$/);
    expect(s.some((x) => /\/landmarks\/estatua-libertad\.webp$/.test(x.url))).toBe(true);
    expect(new Set(s.map((x) => x.url)).size).toBe(s.length);
    expect(s.length).toBeLessThanOrEqual(5);
    expect(s[0].credit).toEqual({ kind: 'city', id: 'nueva-york' });
  });

  it('una bandera: la foto del país con su nombre en el idioma del juego', () => {
    const fr = catalogItem('flag:FR')!;
    const s = storySlides(fr, F['flag:FR'], 'es');
    expect(s[0].url).toMatch(/\/countries\/FR\.webp$/);
    expect(s[0].caption).toBe('Francia');
    expect(s[0].credit).toEqual({ kind: 'country', iso: 'FR' });
  });

  it('un lugar geográfico (sin foto propia): las fotos de los países que toca', () => {
    const amazonas = catalogItem('feat:amazonas')!;
    const s = storySlides(amazonas, F['feat:amazonas'], 'en');
    expect(s.length).toBeGreaterThan(0);
    expect(s.every((x) => !x.url.includes('feat'))).toBe(true);
    expect(s.some((x) => /\/countries\/BR\.webp$/.test(x.url))).toBe(true);
  });

  it('un monumento: su foto primero, con crédito por slug', () => {
    const eiffel = catalogItem('mon:torre-eiffel')!;
    const s = storySlides(eiffel, F['mon:torre-eiffel'], 'es');
    expect(s[0].url).toMatch(/\/landmarks\/torre-eiffel\.webp$/);
    expect(s[0].credit).toEqual({ kind: 'landmark', id: 'torre-eiffel' });
  });

  it('sin ficha (sin lugares cercanos) igual muestra lo que hay', () => {
    const ny = worldCities.find((c) => c.id === 'nueva-york')!;
    expect(storySlides(ny, null, 'es').length).toBe(2);
  });

  it('Mundial: la reseña es la del país del futbolista', () => {
    expect(mundialStoryItem('Brazil')?.id).toBe('flag:BR');
    expect(mundialStoryItem('Argentina')?.id).toBe('flag:AR');
    expect(mundialStoryItem('Atlantis')).toBeNull();
  });
});
