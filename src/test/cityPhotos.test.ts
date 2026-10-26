import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { itemPhotoUrl, hasOwnCityPhoto } from '@/lib/catalog';
import { CITY_PHOTO_IDS } from '@/data/cityPhotoIds';

describe('foto por ciudad', () => {
  it('la ciudad con foto usa la suya; sin foto libre, la de su país', () => {
    expect(itemPhotoUrl({ id: 'medellin', country: 'Colombia' })).toBe('/cities/medellin.webp');
    expect(itemPhotoUrl({ id: 'ci:pe-cusco', country: 'Perú' })).toBe('/cities/ci-pe-cusco.webp');
    // Ámsterdam no tiene foto con licencia libre en Wikidata: queda la del país
    expect(hasOwnCityPhoto({ id: 'amsterdam' })).toBe(false);
    expect(itemPhotoUrl({ id: 'amsterdam', country: 'Países Bajos' }) ?? '').toMatch(/^\/countries\//);
    // Banderas y departamentos siguen con la foto del país; los lugares, sin foto
    expect(itemPhotoUrl({ id: 'flag:CO', kind: 'flag', country: 'Colombia' }) ?? '').toMatch(/^\/countries\//);
    expect(itemPhotoUrl({ id: 'feat:amazonas', kind: 'feature', country: '' })).toBeNull();
  });

  it('cada ciudad de la lista tiene su archivo', () => {
    expect(CITY_PHOTO_IDS.size).toBeGreaterThan(750);
    for (const id of CITY_PHOTO_IDS) expect(existsSync(join(__dirname, '../../public/cities', `${id.replace(/:/g, '-')}.webp`)), id).toBe(true);
  });
});
