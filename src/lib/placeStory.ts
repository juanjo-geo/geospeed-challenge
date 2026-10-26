/**
 * Reseña del lugar ("Ver más", docs/GeoSpeed_Resena_Lugar_Diseno.md, bloque R1): fotos del carrusel y sus créditos.
 * Hoy el carrusel usa las fotos que ya están en el juego: la propia del lugar, la del país y las de los lugares
 * cercanos de la ficha (Fase 8). El bloque R2 sumará las del artículo de Wikipedia.
 */
import { useEffect, useState } from 'react';
import type { City } from '@/data/cities';
import { catalogItem, hasOwnCityPhoto, isMonument, itemTitle } from '@/lib/catalog';
import { countryIso } from '@/lib/flags';
import { cityPhotoUrl, fetchCityPhotoCredits } from '@/lib/cityPhotos';
import { countryPhotoUrlByIso, fetchPhotoCredits } from '@/lib/countryPhotos';
import { fetchLandmarkCredits, landmarkPhotoUrl } from '@/lib/landmarkPhotos';
import type { PlaceFact } from '@/lib/placeFacts';

export type CreditRef = { kind: 'city' | 'landmark'; id: string } | { kind: 'country'; iso: string };
export interface StorySlide { url: string; caption: string; credit: CreditRef }
export interface PhotoCreditInfo { author: string | null; license: string | null; url: string | null }

const MAX_SLIDES = 5;

/** Foto propia de un elemento del catálogo (monumento o ciudad), con su crédito */
function ownSlide(item: City, locale: string): StorySlide | null {
  if (isMonument(item)) {
    const url = landmarkPhotoUrl(item, 'lg');
    return url && item.id ? { url, caption: itemTitle(item, locale), credit: { kind: 'landmark', id: item.id.slice(4) } } : null;
  }
  if (hasOwnCityPhoto(item)) return { url: cityPhotoUrl(item.id!), caption: itemTitle(item, locale), credit: { kind: 'city', id: item.id! } };
  return null;
}

/** Nombre de un país por su ISO en el idioma del juego */
function isoName(iso: string, locale: string): string {
  try { return new Intl.DisplayNames([locale], { type: 'region' }).of(iso) ?? iso; } catch { return iso; }
}

function countrySlide(iso: string | null | undefined, locale: string): StorySlide | null {
  const url = countryPhotoUrlByIso(iso, 'lg');
  return url && iso ? { url, caption: isoName(iso, locale), credit: { kind: 'country', iso } } : null;
}

/**
 * Fotos del carrusel: la del lugar, la de su país (o países, en un lugar geográfico) y las de los lugares cercanos
 * con foto. Sin repetir y hasta 5.
 */
export function storySlides(item: City, fact: PlaceFact | null, locale: string): StorySlide[] {
  const out: StorySlide[] = [];
  const add = (s: StorySlide | null) => { if (s && out.length < MAX_SLIDES && !out.some((o) => o.url === s.url)) out.push(s); };
  add(ownSlide(item, locale));
  if (item.kind === 'feature') {
    for (const iso of item.isos ?? []) add(countrySlide(iso, locale));
  } else if (item.kind !== 'division') {
    add(countrySlide(item.kind === 'flag' ? item.iso ?? countryIso(item.name) : countryIso(item.country), locale));
  }
  for (const id of fact?.near ?? []) {
    const near = catalogItem(id);
    if (near) add(ownSlide(near, locale));
  }
  return out;
}

/** Créditos de las fotos del carrusel (solo descarga los archivos de créditos que hacen falta) */
export function useSlideCredits(slides: StorySlide[]): Record<string, PhotoCreditInfo> {
  const [credits, setCredits] = useState<Record<string, PhotoCreditInfo>>({});
  const key = slides.map((s) => s.url).join('|');
  useEffect(() => {
    let alive = true;
    const kinds = new Set(slides.map((s) => s.credit.kind));
    Promise.all([
      kinds.has('city') ? fetchCityPhotoCredits() : Promise.resolve([]),
      kinds.has('country') ? fetchPhotoCredits() : Promise.resolve([]),
      kinds.has('landmark') ? fetchLandmarkCredits() : Promise.resolve([]),
    ]).then(([city, country, landmark]) => {
      if (!alive) return;
      const map: Record<string, PhotoCreditInfo> = {};
      for (const s of slides) {
        const c = s.credit;
        const found = c.kind === 'country' ? country.find((x) => x.iso === c.iso)
          : c.kind === 'city' ? city.find((x) => x.id === c.id)
          : landmark.find((x) => x.id === c.id);
        if (found) map[s.url] = { author: found.author ?? null, license: found.license ?? null, url: found.url ?? null };
      }
      setCredits(map);
    }).catch(() => {});
    return () => { alive = false; };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return credits;
}

/** Elemento de la reseña en el Mundial: el país del futbolista (su bandera del catálogo) */
export function mundialStoryItem(country: string): City | null {
  const iso = countryIso(country);
  return iso ? catalogItem(`flag:${iso}`) ?? null : null;
}
