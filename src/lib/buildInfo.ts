/**
 * Versión visible de la compilación (auditoría beta 2026-11-20: "mostrar la versión en Ajustes o Soporte y anotarla
 * en cada incidencia"). Los datos los inyecta vite.config.ts al compilar (`__APP_BUILD__`):
 *  - version / code: versionName y versionCode de android/app/build.gradle (la misma versión que ve Google Play)
 *  - web: CACHE_NAME de public/sw.js sin el prefijo ("v185"): cambia en cada publicación de la web
 *  - sha: commit de git (7 letras) · date: día de la compilación (UTC)
 */
export interface BuildInfo { version: string; code: string; web: string; sha: string; date: string }

declare const __APP_BUILD__: BuildInfo | undefined;

export const BUILD: BuildInfo = typeof __APP_BUILD__ !== 'undefined' && __APP_BUILD__
  ? __APP_BUILD__
  : { version: 'dev', code: '0', web: 'dev', sha: '', date: '' };

/** "1.0.8 (9) · web v185 · a1b2c3d · 2026-11-21" */
export function buildLabel(b: BuildInfo = BUILD): string {
  return [`${b.version} (${b.code})`, `web ${b.web}`, b.sha, b.date].filter(Boolean).join(' · ');
}
