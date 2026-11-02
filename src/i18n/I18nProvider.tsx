import { useState, useCallback, useEffect, useMemo, type ReactNode } from 'react';
import { I18nContext, type Locale, detectLocale, getTranslations, loadLocale, localeLoaded, translate, type TranslationKey } from './index';

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectLocale);
  // El inglés llega aparte (main.tsx casi siempre lo trae antes de montar): si aún no está, se pide y se vuelve a pintar
  const [, setLoaded] = useState(0);
  const loaded = localeLoaded(locale);
  useEffect(() => {
    if (loaded) return;
    let alive = true;
    loadLocale(locale).then(() => { if (alive) setLoaded((n) => n + 1); }).catch(() => {});
    return () => { alive = false; };
  }, [locale, loaded]);

  const setLocale = useCallback((l: Locale) => {
    try { localStorage.setItem('geospeed_locale', l); } catch {}
    // Cambia cuando el diccionario está listo, para no mostrar un instante el idioma anterior
    loadLocale(l).catch(() => {}).finally(() => {
      setLocaleState(l);
      document.documentElement.lang = l;
    });
  }, []);

  const value = useMemo(() => {
    const dict = getTranslations(locale);
    return {
      locale,
      setLocale,
      t: (key: TranslationKey, params?: Record<string, string | number>) => translate(dict, key, params),
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, setLocale, loaded]);

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}
