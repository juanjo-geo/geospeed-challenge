/**
 * Formato de números con el idioma del JUEGO (no el del navegador): en español "6.155 km" y
 * "1.478 pts"; en inglés "6,155". I18nProvider y boot.js mantienen <html lang> sincronizado.
 * Antes se usaba toLocaleString() sin idioma y un iPhone configurado en inglés mostraba "6,155".
 */
export function appNumberLocale(): string {
  const lang = typeof document !== 'undefined' ? document.documentElement.lang : 'es';
  return lang === 'en' ? 'en-US' : 'es-CO';
}

/** Número entero o decimal con el separador del idioma del juego */
export function formatNumber(n: number, maxFractionDigits = 0): string {
  return n.toLocaleString(appNumberLocale(), { maximumFractionDigits: maxFractionDigits });
}
