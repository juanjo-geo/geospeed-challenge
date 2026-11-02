import { createContext, useContext } from 'react';
import es, { type TranslationKey, type Translations } from './es';

export type Locale = 'es' | 'en';

export const LOCALES: { key: Locale; label: string; flag: string }[] = [
  { key: 'es', label: 'Español', flag: '🇪🇸' },
  { key: 'en', label: 'English', flag: '🇬🇧' },
];

// El inglés (~22 KB comprimidos) no va en la carga inicial: la mayoría juega en español. main.tsx lo pide antes de
// montar la app si el jugador lo usa, y Ajustes antes de cambiar el idioma.
const dictionaries: Partial<Record<Locale, Translations>> = { es };
let enLoading: Promise<void> | null = null;

export function loadLocale(locale: Locale): Promise<void> {
  if (dictionaries[locale]) return Promise.resolve();
  enLoading ??= import('./en')
    .then((m) => { dictionaries.en = m.default; })
    .catch((e) => { enLoading = null; throw e; });
  return enLoading;
}

/** ¿El diccionario de ese idioma ya está descargado? (mientras no, se muestra el español) */
export const localeLoaded = (locale: Locale): boolean => !!dictionaries[locale];

/** Detect initial locale from browser language */
export function detectLocale(): Locale {
  try {
    const stored = localStorage.getItem('geospeed_locale');
    if (stored === 'es' || stored === 'en') return stored;
  } catch {}
  const lang = navigator.language?.toLowerCase() || '';
  if (lang.startsWith('en')) return 'en';
  return 'es'; // default
}

/** Get the translations dictionary for a locale */
export function getTranslations(locale: Locale): Translations {
  return dictionaries[locale] || es;
}

/**
 * Translation function with interpolation.
 * Usage: t('game_nextAutoAdvance', { seconds: 5 }) → "SIGUIENTE (5s) →"
 */
export function translate(dict: Translations, key: TranslationKey, params?: Record<string, string | number>): string {
  let text = dict[key] || key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return text;
}

// ── React Context ──
export interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

export const I18nContext = createContext<I18nContextValue | null>(null);

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be inside I18nProvider');
  return ctx;
}

export type { TranslationKey };
