# Continuar con Google — cómo activarlo

Pedido de JuanJo, 2026-11-02. El juego ya trae el botón **"Continuar con Google"** en *Iniciar sesión* y *Crear cuenta*,
pero solo aparece cuando Google está activo en Supabase. Mientras no lo actives, nadie lo ve. Es gratis.

## Qué ve el jugador

- **Sin sesión:** Continuar con Google → elige su cuenta → vuelve al juego con la sesión iniciada. Si no tenía nombre
  de jugador, recibe su nombre de pila (lo puede cambiar en el perfil). No se usa el apellido ni la foto.
- **Invitado en "Crear cuenta":** su usuario de invitado se convierte en cuenta de Google y conserva todo (partidas,
  racha, retos, compras…).
- **Invitado en "Iniciar sesión":** entra a su cuenta de Google y se trae el progreso de este dispositivo, igual que al
  entrar con correo.
- **Invitado cuya cuenta de Google ya existía:** ve "Esa cuenta de Google ya está en GeoSpeed" y el botón *Entrar con esa
  cuenta*, que entra y trae el progreso.
- **App de Android:** el botón no aparece. Google no permite iniciar sesión dentro de la vista web de la app; hace falta
  un complemento nativo (ver "Más adelante").

## Paso 1 · Google Cloud

1. Entra a https://console.cloud.google.com y crea un proyecto llamado **GeoSpeed Challenge**.
2. Menú → **Google Auth Platform** (antes "Pantalla de consentimiento de OAuth") → **Comenzar**:
   - Nombre de la app: **GeoSpeed Challenge**. Correo de asistencia: el tuyo.
   - Público: **Externo**.
   - Datos de contacto: tu correo.
3. En **Marca** (Branding):
   - Página principal: `https://geospeed-challenge.vercel.app`
   - Política de privacidad: `https://geospeed-challenge.vercel.app/privacy`
   - Condiciones del servicio: `https://geospeed-challenge.vercel.app/terms`
   - Dominios autorizados: `geospeed-challenge.vercel.app` y `motyvjfhupmvmfpgftku.supabase.co`
   - **No subas logo por ahora:** con logo, Google exige verificar la marca antes de mostrarlo.
4. En **Público** (Audience): pulsa **Publicar app**. Si queda "En prueba", solo pueden entrar los correos que agregues
   como usuarios de prueba.
5. En **Clientes** → **Crear cliente**:
   - Tipo: **Aplicación web**. Nombre: GeoSpeed web.
   - Orígenes de JavaScript autorizados: `https://geospeed-challenge.vercel.app` y `http://localhost:5173`
   - URI de redireccionamiento autorizados: `https://motyvjfhupmvmfpgftku.supabase.co/auth/v1/callback`
   - Crear. Copia el **ID de cliente** y el **Secreto del cliente**.

Los permisos que pide el juego (correo, perfil básico) no necesitan revisión de Google.

## Paso 2 · Supabase

1. https://supabase.com/dashboard/project/motyvjfhupmvmfpgftku → **Authentication** → **Sign In / Providers** →
   **Google**.
2. Actívalo, pega el **ID de cliente** (Client IDs) y el **Secreto del cliente** (Client Secret) y guarda.
   El secreto va solo ahí: no lo pegues en el chat ni en `.env`.
3. Para probar desde este computador: Authentication → **URL Configuration** → Redirect URLs → agrega
   `http://localhost:5173/**`. En producción no hace falta (la vuelta es a la misma dirección del sitio).

## Paso 3 · Comprobar

En una ventana privada abre https://geospeed-challenge.vercel.app/auth: debe aparecer el botón blanco con la G.
Entra con tu cuenta de Google y revisa que vuelvas al juego con la sesión iniciada y tu nombre de pila.

**Si algo falla:** apaga Google en el mismo panel. El botón desaparece la próxima vez que se abra el juego.

## Más adelante

- **Que la ventana de Google diga "GeoSpeed Challenge":** al principio dice "para continuar a
  motyvjfhupmvmfpgftku.supabase.co". Se arregla pidiendo la verificación de la marca en Google Auth Platform →
  **Centro de verificación** (gratis, tarda unos días; pide demostrar que el dominio es tuyo en Google Search Console).
  La otra vía es un dominio propio para Supabase, que es de pago.
- **App de Android:** agregar un complemento nativo de inicio con Google (por ejemplo `@capgo/capacitor-social-login`),
  un cliente OAuth de tipo Android en Google Cloud (con la huella SHA-1 de la clave de la app) y entrar con
  `signInWithIdToken`. Conviene hacerlo junto con el próximo AAB.

## Detalles técnicos

- `src/lib/oauth.ts`: `googleSignInAvailable()` pregunta una vez a `/auth/v1/settings` si Google está activo (y nunca
  dentro de Capacitor); `continueWithGoogle(next, { link, chooseAccount })` usa `linkIdentity` para el invitado en Crear
  cuenta y `signInWithOAuth` en los demás casos (con `prepareTransfer()` si venía de invitado); `oauthReturnError()` lee
  el error que deja Supabase al volver (`identity_already_exists` → cuenta ya existente, `access_denied` → cancelado).
- Vuelta: `/auth?oauth=google[&next=…]`. `Auth.tsx` muestra "Entrando con Google" hasta que hay sesión de cuenta y luego
  lleva al destino; sin sesión en 12 s, vuelve al formulario con el aviso.
- Nombre de jugador: `useAuth` → `fetchProfile` → `googleFirstName()` si el perfil no tiene nombre.
- Solo en desarrollo, `/auth?google` muestra el botón aunque Google esté apagado (para revisar la pantalla; al pulsarlo
  falla).
