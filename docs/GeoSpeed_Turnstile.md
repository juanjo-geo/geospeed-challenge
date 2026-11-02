# Turnstile (anti-bots) — cómo activarlo

Punto 10 del plan, 2026-11-01. Cloudflare Turnstile protege las cuatro llamadas de cuenta que Supabase puede proteger
con CAPTCHA: la sesión de invitado (se crea al guardar la primera partida), iniciar sesión, crear cuenta y recuperar
contraseña. Sin esto, un bot podría crear usuarios anónimos sin límite: era la condición de "costo cero" con la que se
aprobaron las sesiones de invitado (decisión D1). Es gratis.

**Estado (2026-11-02): activo.** Pasos 1, 2, 3 y 5 hechos. El paso 4 (app Android) queda para la primera prueba interna: se encendió antes porque todavía nadie tiene la app.

El jugador casi nunca ve nada: el widget es invisible y solo aparece una ventanita "Un momento · Confirma que eres una
persona" si Cloudflare tiene dudas.

## El orden importa

Si se enciende la protección en Supabase antes de que el juego (web y app) mande el token, **nadie puede entrar ni
guardar partidas**. Por eso:

1. Crear el widget en Cloudflare (paso 1).
2. Pasarme la **Site Key** (es pública) para ponerla en `.env` y publicar (paso 2).
3. Comprobar la web y la app Android con la clave puesta (pasos 3 y 4). Todo debe funcionar igual que hoy.
4. Recién entonces encender la protección en Supabase con la **Secret Key** (paso 5).

## Paso 1 · Crear el widget en Cloudflare

1. Entra a https://dash.cloudflare.com (cuenta gratis; no hace falta tener un dominio en Cloudflare).
2. Menú **Turnstile** → **Add widget**.
3. **Widget name:** GeoSpeed Challenge.
4. **Hostnames:** agrega estos dos:
   - `geospeed-challenge.vercel.app`
   - `localhost` — la app Android carga el juego desde `https://localhost` (así funciona Capacitor). Cloudflare
     advierte que no conviene agregar localhost a una clave de producción; aquí hace falta por la app.
5. **Widget Mode:** Managed (recomendado).
6. **Pre-clearance:** No.
7. Crear. Cloudflare muestra dos claves:
   - **Site Key** (pública): pásamela por el chat.
   - **Secret Key** (privada): **no la pegues en el chat ni en `.env`**. Solo va en Supabase (paso 5).

## Paso 2 · Publicar con la Site Key

Yo agrego `VITE_TURNSTILE_SITE_KEY=<site key>` a `.env` (tú lo revisas, como siempre con `.env`), compilo y publico.

## Paso 3 · Comprobar la web

En una ventana privada:

1. Abre el juego y juega una partida completa como invitado. Al final debe guardarse como siempre (aparece en
   Historial).
2. Entra con tu cuenta y vuelve a salir.
3. Prueba "Olvidé mi contraseña" con tu correo: debe llegar el correo.

Si en algún momento aparece la ventanita de Cloudflare, marca la casilla y sigue.

## Paso 4 · Comprobar la app Android

Genera el AAB con el código nuevo (`npm run build:native`, `npx cap sync android` y firmar en Android Studio) y, en la
prueba interna, repite el paso 3 desde el teléfono. La app ya trae los ajustes que Turnstile necesita dentro del
WebView (cookies de Cloudflare permitidas en `MainActivity.java`).

## Paso 5 · Encender la protección en Supabase

1. https://supabase.com/dashboard/project/motyvjfhupmvmfpgftku → **Authentication** → **Attack Protection**
   (en algunas versiones del panel: Settings → Authentication → *Bot and Abuse Protection*).
2. **Enable CAPTCHA protection** → proveedor **Turnstile by Cloudflare** → pega la **Secret Key** → **Save**.
3. Repite el paso 3 en una ventana privada.

**Si algo falla:** apaga el mismo interruptor y todo vuelve a funcionar sin CAPTCHA al instante. Avísame qué pasó.

## Detalles técnicos

- `src/lib/captcha.ts`: carga el script de Cloudflare solo cuando hace falta (o al abrir `/auth`), crea un widget por
  token (cada token sirve una sola vez) y lo quita al terminar. Sin `VITE_TURNSTILE_SITE_KEY` no hace nada.
- Llamadas con token: `signInAnonymously` (`src/lib/identity.ts`), `signInWithPassword`, `signUp` y
  `resetPasswordForEmail` (`src/pages/Auth.tsx`). Si no se obtiene token, el invitado sigue jugando (las partidas
  quedan en la cola sin conexión hasta la próxima) y las pantallas de cuenta muestran "No pudimos comprobar que eres
  una persona".
- `vercel.json`: `https://challenges.cloudflare.com` en `script-src`, `connect-src` y `frame-src`. Probado con las
  cabeceras reales (incluida `Cross-Origin-Embedder-Policy: credentialless`) y las claves de prueba de Cloudflare:
  `1x00000000000000000000AA` (pasa sin interacción) y `3x00000000000000000000FF` (obliga a marcar la casilla).
- Las claves de prueba sirven para desarrollo: `VITE_TURNSTILE_SITE_KEY=1x00000000000000000000AA` en
  `.env.development.local` (no se sube a git).
