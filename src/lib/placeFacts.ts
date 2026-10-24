/**
 * Ficha del lugar (Fase 8, docs/GeoSpeed_Plan_Competencia.md §11): cifras de Wikidata (CC0) y datos curiosos por
 * elemento del juego, generados por scripts/build-facts.mjs.
 *  · src/data/placeFacts.json (≈ 60 KB gzip): habitantes, área, altitud, largo, caída, capital, idiomas, fecha,
 *    Patrimonio UNESCO, cultura, estilo y lugares cercanos del catálogo. Se carga al empezar una partida (franja del
 *    acierto y tarjeta de respuesta).
 *  · src/data/placeTrivia.json (≈ 90 KB gzip): el dato curioso ES/EN (mundo + pack Colombia). Se carga al llegar
 *    al resultado, con la ficha ampliada.
 * Cifras redondeadas para leer de un vistazo ("2,6 millones", "1.142 km²"), en el idioma del juego.
 */
import { useEffect, useState } from 'react';
import type { City } from '@/data/cities';
import { countryIso } from '@/lib/flags';
import { formatNumber } from '@/lib/format';
import { catalogItem, itemTitle, isFlag, isFeature, isMonument, isDivision } from '@/lib/catalog';

type Pair = [string, string];
export interface PlaceFact {
  q?: string;
  pop?: number;
  popY?: number;
  /** km² */
  area?: number;
  /** m */
  elev?: number;
  /** km */
  len?: number;
  /** m (caída de una catarata, altura de un monumento) */
  h?: number;
  cap?: Pair;
  lang?: Pair[];
  /** [año (negativo = a. C.), precisión de Wikidata: 9 año · 8 década · 7 siglo · 6 milenio] */
  since?: [number, number];
  unesco?: 1;
  cult?: Pair;
  style?: Pair;
  near?: string[];
}

function makeLoader<T>(importer: () => Promise<{ default: T }>) {
  let value: T | null = null;
  let loading: Promise<T> | null = null;
  return {
    get: () => value,
    load(): Promise<T> {
      if (value) return Promise.resolve(value);
      if (!loading) loading = importer().then((m) => (value = m.default)).catch((e) => { loading = null; throw e; });
      return loading;
    },
  };
}
const factsLoader = makeLoader(() => import('@/data/placeFacts.json') as unknown as Promise<{ default: Record<string, PlaceFact> }>);
const triviaLoader = makeLoader(() => import('@/data/placeTrivia.json') as unknown as Promise<{ default: Record<string, Pair> }>);

/** Descarga (una vez) las cifras; sin red no pasa nada (la ficha queda sin cifras) */
export const loadPlaceFacts = () => factsLoader.load().catch(() => null);
export const loadPlaceTrivia = () => triviaLoader.load().catch(() => null);

function useLoaded<T>(loader: { get: () => T | null; load: () => Promise<T> }, enabled: boolean): T | null {
  const [v, setV] = useState<T | null>(loader.get);
  useEffect(() => {
    if (!enabled || v) return;
    let alive = true;
    loader.load().then((x) => { if (alive) setV(x); }).catch(() => {});
    return () => { alive = false; };
  }, [enabled, v, loader]);
  return v;
}
export const usePlaceFacts = (enabled = true) => useLoaded(factsLoader, enabled);
export const usePlaceTrivia = (enabled = true) => useLoaded(triviaLoader, enabled);

/**
 * Id de la ficha de un elemento: el del catálogo; en el Mundial (el elemento es un país sin id) la bandera del país.
 */
export function factIdOf(item: Pick<City, 'id' | 'kind' | 'country' | 'name' | 'iso'> | null | undefined): string | null {
  if (!item) return null;
  if (item.id) return item.id;
  if (item.iso) return `flag:${item.iso}`;
  const iso = countryIso(item.country || item.name);
  return iso ? `flag:${iso}` : null;
}
export const getPlaceFact = (id: string | null | undefined): PlaceFact | null => (id ? factsLoader.get()?.[id] ?? null : null);
export const getTrivia = (id: string | null | undefined, locale: string): string | null => {
  const t = id ? triviaLoader.get()?.[id] : null;
  return t ? t[locale === 'en' ? 1 : 0] : null;
};

// ── Formato ──────────────────────────────────────────────────────────────────
const en = (locale: string) => locale === 'en';
const pick = (p: Pair | undefined, locale: string) => (p ? p[en(locale) ? 1 : 0] : '');
const cap1 = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const dec1 = (n: number, locale: string) => n.toLocaleString(en(locale) ? 'en-US' : 'es-CO', { maximumFractionDigits: 1 });

/** 2.569.007 → "2,6 millones" / "2.6 million"; 428.450 → "428.000"; 9.121 → "9.100" */
export function formatPopulation(n: number, locale: string): string {
  if (n >= 1e9) return en(locale) ? `${dec1(n / 1e9, locale)} billion` : `${formatNumber(Math.round(n / 1e7) * 10)} millones`;
  if (n >= 1e6) {
    const m = n / 1e6;
    const v = m >= 10 ? Math.round(m).toLocaleString(en(locale) ? 'en-US' : 'es-CO') : dec1(m, locale);
    return en(locale) ? `${v} million` : `${v} ${v === '1' ? 'millón' : 'millones'}`;
  }
  if (n >= 1e5) return formatNumber(Math.round(n / 1000) * 1000);
  if (n >= 1e3) return formatNumber(Math.round(n / 100) * 100);
  return formatNumber(n);
}
export const formatArea = (km2: number) => `${km2 < 10 ? formatNumber(Math.round(km2 * 10) / 10, 1) : formatNumber(Math.round(km2))} km²`;
export const formatMeters = (m: number) => `${formatNumber(Math.round(m))} m`;
export const formatKm = (km: number) => `${formatNumber(Math.round(km))} km`;

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI'];
const ordinal = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`;
/** [1887, 11] → "1887"; [1450, 7] → "siglo XV"; [-2560, 9] → "2560 a. C." */
export function formatSince([year, prec]: [number, number], locale: string): string {
  const bc = year < 0;
  const y = Math.abs(year);
  const era = bc ? (en(locale) ? ' BC' : ' a. C.') : '';
  if (prec >= 9) return `${y}${era}`;
  if (prec === 8) return en(locale) ? `${Math.floor(y / 10) * 10}s${era}` : `década de ${Math.floor(y / 10) * 10}${era}`;
  if (prec === 7) {
    const c = Math.max(1, Math.ceil(y / 100));
    return en(locale) ? `${ordinal(c)} century${era}` : `siglo ${ROMAN[c] ?? c}${era}`;
  }
  const mil = Math.max(1, Math.ceil(y / 1000));
  return en(locale) ? `${ordinal(mil)} millennium${era}` : `milenio ${ROMAN[mil] ?? mil}${era}`;
}

type Translate = (key: never, params?: Record<string, string | number>) => string;
/** "2,6 millones de habitantes" pero "428.000 habitantes" */
const people = (n: number, tt: (k: string, p?: Record<string, string | number>) => string, locale: string) => {
  const v = formatPopulation(n, locale);
  return tt(n >= 1e6 ? 'fact_peopleMillions' : 'fact_people', { v });
};
type Item = Pick<City, 'id' | 'kind' | 'ftype' | 'capital' | 'country' | 'name' | 'iso'>;

/**
 * El dato clave de una línea (franja del acierto y tarjeta de respuesta): habitantes de una ciudad o división, capital
 * de un país, largo/altura/área de un lugar, año de un monumento. null si la ficha no tiene nada que mostrar.
 */
export function keyFact(item: Item, fact: PlaceFact | null, t: Translate, locale: string): string | null {
  if (!fact) return null;
  const tt = t as (k: string, p?: Record<string, string | number>) => string;
  if (isFlag(item) || (!item.id && fact.cap)) return fact.cap ? tt('fact_capitalOf', { v: pick(fact.cap, locale) }) : fact.pop ? people(fact.pop, tt, locale) : null;
  if (isFeature(item)) {
    if (fact.len) return tt('fact_longKey', { v: formatKm(fact.len) });
    if (fact.elev) return tt('fact_highKey', { v: formatMeters(fact.elev) });
    if (fact.h) return tt('fact_dropKey', { v: formatMeters(fact.h) });
    if (fact.area) return tt('fact_areaKey', { v: formatArea(fact.area) });
    return null;
  }
  if (isMonument(item)) {
    if (fact.since) return tt('fact_builtKey', { v: formatSince(fact.since, locale) });
    if (fact.unesco) return tt('fact_unesco');
    return null;
  }
  if (isDivision(item)) return fact.pop ? people(fact.pop, tt, locale) : item.capital ? tt('fact_capitalOf', { v: item.capital }) : null;
  if (fact.pop) return people(fact.pop, tt, locale);
  if (fact.elev) return tt('fact_altitudeKey', { v: formatMeters(fact.elev) });
  return null;
}

export interface FactRow { icon: string; label: string; value: string }

/** Las cifras de la ficha ampliada, en el orden de cada categoría */
export function factRows(item: Item, fact: PlaceFact | null, t: Translate, locale: string): FactRow[] {
  if (!fact) return [];
  const tt = t as (k: string) => string;
  const rows: FactRow[] = [];
  const add = (icon: string, key: string, value: string | null | undefined) => { if (value) rows.push({ icon, label: tt(key), value }); };
  const flag = isFlag(item) || (!item.id && !!fact.cap);
  if (flag) {
    add('🏛️', 'fact_capital', pick(fact.cap, locale));
    add('👥', 'fact_population', fact.pop ? formatPopulation(fact.pop, locale) : null);
    add('📐', 'fact_area', fact.area ? formatArea(fact.area) : null);
    add('🗣️', 'fact_languages', fact.lang?.map((l) => cap1(pick(l, locale))).join(', '));
  } else if (isFeature(item)) {
    add('📏', 'fact_length', fact.len ? formatKm(fact.len) : null);
    add('⛰️', 'fact_height', fact.elev ? formatMeters(fact.elev) : null);
    add('💧', 'fact_drop', fact.h ? formatMeters(fact.h) : null);
    add('📐', 'fact_area', fact.area ? formatArea(fact.area) : null);
  } else if (isMonument(item)) {
    add('🗓️', 'fact_built', fact.since ? formatSince(fact.since, locale) : null);
    add('🏺', 'fact_culture', cap1(pick(fact.cult, locale)));
    add('🏛️', 'fact_style', cap1(pick(fact.style, locale)));
    add('📏', 'fact_tall', fact.h ? formatMeters(fact.h) : null);
  } else if (isDivision(item)) {
    add('🏛️', 'fact_capital', item.capital);
    add('👥', 'fact_population', fact.pop ? formatPopulation(fact.pop, locale) : null);
    add('📐', 'fact_area', fact.area ? formatArea(fact.area) : null);
  } else {
    add('👥', 'fact_population', fact.pop ? formatPopulation(fact.pop, locale) : null);
    add('📐', 'fact_area', fact.area ? formatArea(fact.area) : null);
    add('⛰️', 'fact_altitude', fact.elev != null ? formatMeters(fact.elev) : null);
  }
  return rows;
}

/** Nombres de los lugares cercanos (del catálogo), en el idioma del juego */
export const nearNames = (fact: PlaceFact | null, locale: string): string[] =>
  (fact?.near ?? []).map((id) => catalogItem(id)).filter((c): c is City => !!c).map((c) => itemTitle(c, locale));
