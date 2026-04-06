import { useState, useCallback, useMemo, type ReactNode } from 'react';
import { I18nContext, type Locale, detectLocale, getTranslations, translate, type TranslationKey } from './index';

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectLocale);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try { localStorage.setItem('geospeed_locale', l); } catch {}
    document.documentElement.lang = l;
  }, []);

  const value = useMemo(() => {
    const dict = getTranslations(locale);
    return {
      locale,
      setLocale,
      t: (key: TranslationKey, params?: Record<string, string | number>) => translate(dict, key, params),
    };
  }, [locale, setLocale]);

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}
