/** Reseña del lugar (bloque R2): galería de Commons — grupos, miniaturas de tamaño estándar y el carrusel. */
import { describe, it, expect } from 'vitest';
import facts from '@/data/placeFacts.json';
import cities from '@/data/gallery/cities.json';
import { galleryGroup, commonsThumb, commonsPage, type GalleryEntry } from '@/lib/placeGallery';
import { storySlides } from '@/lib/placeStory';
import { worldCities } from '@/data/cities';
import type { PlaceFact } from '@/lib/placeFacts';

const G = cities as unknown as Record<string, GalleryEntry[]>;

describe('galería de la reseña', () => {
  it('reparte los ids en los mismos grupos que el script', () => {
    expect(galleryGroup('medellin')).toBe('cities');
    expect(galleryGroup('flag:CO')).toBe('flags');
    expect(galleryGroup('feat:amazonas')).toBe('features');
    expect(galleryGroup('mon:torre-eiffel')).toBe('monuments');
    expect(galleryGroup('co:guatape')).toBe('colombia');
    expect(galleryGroup('div:co-antioquia')).toBe('colombia');
    expect(galleryGroup('ci:pe-cusco')).toBe('pro');
    expect(galleryGroup('div:pe-cusco')).toBe('pro');
  });

  it('miniaturas de Wikimedia en tamaños estándar (500 y 960) con la ruta del hash', () => {
    const url = commonsThumb('Panorámica_de_Medellín_desde_el_Cerro_El_Picacho.jpg', '0b', 960);
    expect(url).toBe('https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Panor%C3%A1mica_de_Medell%C3%ADn_desde_el_Cerro_El_Picacho.jpg/960px-Panor%C3%A1mica_de_Medell%C3%ADn_desde_el_Cerro_El_Picacho.jpg');
    expect(commonsPage('A_b.jpg')).toBe('https://commons.wikimedia.org/wiki/File:A_b.jpg');
  });

  it('cada foto de la galería trae archivo, hash de 2 caracteres, autor y licencia libre', () => {
    const all = Object.values(G).flat();
    expect(all.length).toBeGreaterThan(100);
    for (const [file, hash, author, license] of all) {
      expect(file).toMatch(/\.(jpe?g|png)$/i);
      expect(file).not.toMatch(/ /);
      expect(hash).toMatch(/^[0-9a-f]{2}$/);
      expect(author.length).toBeGreaterThan(0);
      expect(license).toMatch(/^(CC[- ]BY|CC0|Public domain|PD)/i);
    }
    expect(Object.values(G).every((l) => l.length >= 1 && l.length <= 4)).toBe(true);
  });

  it('el carrusel pone la foto propia primero, luego la galería, sin repetir y hasta 6', () => {
    const id = Object.keys(G).find((k) => worldCities.some((c) => c.id === k))!;
    const city = worldCities.find((c) => c.id === id)!;
    const slides = storySlides(city, (facts as unknown as Record<string, PlaceFact>)[id] ?? null, 'es', G[id]);
    expect(slides.length).toBeLessThanOrEqual(6);
    const firstCommons = slides.findIndex((s) => s.credit.kind === 'commons');
    expect(firstCommons).toBeGreaterThanOrEqual(0);
    expect(slides[firstCommons].srcSet).toMatch(/500px-.* 500w, .*960px-.* 960w$/);
    expect(new Set(slides.map((s) => s.url)).size).toBe(slides.length);
  });
});
