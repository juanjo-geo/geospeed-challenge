# Capturas para la ficha de Google Play

Capturas reales del juego (Chrome sin interfaz, por el protocolo de DevTools en tubería; sin dependencias nuevas)
dentro de un marco con título. Supabase y Analytics quedan bloqueados: nada se guarda en producción.

1. `npm run build` (las capturas usan `dist/` con el dominio de producción; `REMOTE=1` usa el sitio publicado).
2. `node scripts/store-shots/dump-catalog.mjs` → `catalog.json` (dónde tocar en cada pregunta).
3. `node scripts/store-shots/capture.mjs es` y `… en` → `raw/<idioma>/`.
4. `node scripts/store-shots/compose.mjs es` y `… en` → `final/<idioma>/` (1920×1080 e imagen destacada 1024×500).
5. `python -E -P scripts/store-shots/export.py` → `store-listing/screenshots/<idioma>/*.jpg` e
   `store-listing/imagen-destacada-<idioma>.png` (RGB, sin canal alfa).

Los textos de cada imagen están en `compose.mjs` (`SHOTS`). Chrome: `C:/Program Files/Google/Chrome/Application/chrome.exe`.
