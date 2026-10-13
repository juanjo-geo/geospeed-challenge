# GeoSpeed — Activar pagos nativos con RevenueCat (Google Play Billing)

**Objetivo:** vender Pro y vidas DENTRO de la app Android usando la facturación de Google Play (vía RevenueCat). Google **rechaza** la app si usas Mercado Pago para bienes digitales dentro del APK; Mercado Pago queda solo para la web.

**Estado del código:** ya está listo. `paymentProvider.ts` usa RevenueCat automáticamente en nativo. Lo único que falta es lo que tienes que hacer tú en las consolas (RevenueCat, Google Cloud, Play). Esta guía es esa parte.

> Regla de oro ya implementada: en la app nativa NUNCA se abrirá Mercado Pago. Si falta la clave de RevenueCat, los botones de compra dicen "no disponible" en vez de cobrar mal.

---

## IDs que DEBEN coincidir exactamente

Cuando crees los productos en Play Console y los conectes en RevenueCat, usa **exactamente** estos identificadores (el código ya los espera así):

| Producto | ID en Play Console | Tipo en Play |
|----------|-------------------|--------------|
| 5 vidas | `lives_5` | Producto único (consumible) |
| 15 vidas | `lives_15` | Producto único (consumible) |
| 50 vidas | `lives_50` | Producto único (consumible) |
| Pro Mensual | `pro_monthly` | Suscripción |
| Pro Anual | `pro_yearly` | Suscripción |
| Pro para siempre | `pro_lifetime` | Producto único (no consumible) |

**Entitlement en RevenueCat:** debe llamarse exactamente **`pro`** (en minúscula). A ese entitlement se le adjuntan `pro_monthly`, `pro_yearly` y `pro_lifetime`.

---

## PASO 0 — Instalar el plugin (en tu PC, carpeta del proyecto)

En la terminal, dentro de `C:\Users\Juan Jose\GeospeedCh`:

```bash
npm install @revenuecat/purchases-capacitor
npx cap sync android
```

> Hazlo ANTES de volver a compilar en Android Studio. Esto agrega el plugin al `package.json` y lo enlaza con el proyecto Android. (También deja todo listo para que Vercel siga compilando la web sin problemas cuando publiquemos.)

---

## PASO 1 — Crear cuenta de RevenueCat

1. Entra a https://app.revenuecat.com y crea cuenta (gratis hasta ~$2.5K USD/mes de ingresos; luego 1%).
2. Crea un **Project** llamado "GeoSpeed".
3. Dentro del proyecto, agrega una **App** de tipo **Google Play Store**.
   - Package name: `com.geospeed.challenge` (el mismo de `capacitor.config.ts`).

---

## PASO 2 — El "huevo y la gallina": subir un primer build

Google Play **no te deja crear productos in-app hasta que hay un AAB subido** a un canal de prueba. Así que el orden es:

1. Genera la keystore y el AAB firmado (ver guía `GeoSpeed_Build_Nativo_Android.md`, fases 5 y 6).
2. En Play Console → tu app → **Prueba → Pruebas internas** → crea una versión y sube el `.aab`.
3. Espera a que procese (unos minutos). Ya puedes crear productos.

> No necesitas publicar a producción todavía. Con el build en "Pruebas internas" basta para configurar y probar pagos.

---

## PASO 3 — Crear los productos en Google Play Console

En Play Console → tu app:

**Vidas (productos únicos):** Monetizar → Productos → **Productos integrados en la aplicación** → Crear producto. Crea tres con los IDs `lives_5`, `lives_15`, `lives_50`, su precio y nombre. Actívalos.

**Pro (suscripciones):** Monetizar → Productos → **Suscripciones** → Crea dos: `pro_monthly` y `pro_yearly`. A cada una agrégale un **plan base** (mensual / anual) con su precio. Actívalas.

**Pro lifetime:** créalo como **producto integrado** (único, no consumible) con ID `pro_lifetime`.

> Los precios los pones en la moneda de cada país; Play los convierte. Tus precios de referencia: vidas $0.99 / $1.99 / $4.99; Pro $2.99 mes / $17.99 año / $29.99 lifetime.

---

## PASO 4 — Conectar Google Play con RevenueCat (lo más enredado)

RevenueCat necesita permiso para leer las compras en tu cuenta de Play. Esto se hace con una **cuenta de servicio** de Google Cloud:

1. En **Google Cloud Console** (https://console.cloud.google.com), crea (o usa) un proyecto.
2. Ve a **IAM y administración → Cuentas de servicio → Crear cuenta de servicio**. Ponle nombre (ej. "revenuecat").
3. Crea una **clave JSON** para esa cuenta (Claves → Agregar clave → JSON). Se descarga un archivo.
4. En **Play Console → Configuración → Acceso a API** (o "Usuarios y permisos"): vincula el proyecto de Google Cloud y dale permiso a esa cuenta de servicio para **ver datos financieros y gestionar pedidos/suscripciones**.
5. En **RevenueCat → tu App Google → Service Account credentials JSON**: sube el archivo JSON descargado.

RevenueCat te dirá "Conectado" cuando todo esté bien. (Puede tardar hasta 36h en propagar permisos de Play; normalmente es más rápido.)

---

## PASO 5 — Entitlement, productos y offering en RevenueCat

1. **Entitlements → New** → identificador exactamente `pro`.
2. **Products**: importa/registra los 6 IDs de Play (`lives_5`, `lives_15`, `lives_50`, `pro_monthly`, `pro_yearly`, `pro_lifetime`).
3. Adjunta `pro_monthly`, `pro_yearly` y `pro_lifetime` al entitlement **`pro`**. (Las vidas NO van a un entitlement: son consumibles.)
4. **Offerings → crea una offering "default"** y agrega los productos como paquetes (opcional pero recomendado; el código también puede comprarlos por ID directo).

---

## PASO 6 — Poner la clave en el .env

1. En **RevenueCat → API Keys**, copia la **Public app-specific API key de Google** (empieza con `goog_...`).
2. En `C:\Users\Juan Jose\GeospeedCh\.env`, reemplaza:
   ```
   VITE_REVENUECAT_API_KEY=goog_TU_CLAVE_REAL_AQUI
   ```
3. Vuelve a compilar:
   ```bash
   npm run build
   npx cap sync android
   ```
   Y reconstruye el AAB firmado, súbelo de nuevo a Pruebas internas.

---

## PASO 7 — Probar las compras (cuenta de prueba)

Las compras reales solo funcionan con la app firmada, subida a un canal de prueba, y una cuenta de "tester":

1. En **Play Console → Configuración → Pruebas de licencias**, agrega tu correo (o el de tu hermano) como **tester de licencias**. Estos correos compran sin que se les cobre de verdad.
2. Ese mismo correo debe estar en la **lista de testers** del canal "Pruebas internas".
3. Instala la app desde el **enlace de prueba interno** (no por Android Studio) en un teléfono real con esa cuenta de Google.
4. Abre la tienda en el juego, compra → debería salir el diálogo de Google Play (precio en $0 para testers). Verifica que se acrediten Pro/vidas.

> ⚠️ Las compras no se prueban bien en emulador ni con build de Android Studio directo. Necesitas: build firmado + canal de prueba + cuenta tester + teléfono real.

---

## PASO 8 (opcional, recomendado) — Webhook RevenueCat → Supabase

Hoy, al comprar, la app acredita Pro/vidas en el momento y lo guarda en Supabase. Para mayor robustez (renovaciones, reembolsos, multi-dispositivo), conviene un webhook de RevenueCat hacia una Edge Function de Supabase que actualice `player_data`. **Esto lo implemento yo cuando ya tengas RevenueCat conectado** — avísame y lo hacemos.

---

## Resumen de qué hace quién

| Tarea | Quién |
|-------|-------|
| Código RevenueCat en la app | ✅ Ya hecho (yo) |
| `npm install @revenuecat/purchases-capacitor` + `cap sync` | **Tú** |
| Cuenta RevenueCat + app Google | **Tú** |
| Subir primer AAB a Pruebas internas | **Tú** |
| Crear los 6 productos en Play (IDs exactos) | **Tú** |
| Cuenta de servicio Google Cloud + JSON a RevenueCat | **Tú** |
| Entitlement `pro` + offering en RevenueCat | **Tú** |
| Clave `goog_...` al `.env` + recompilar | **Tú** |
| Probar con cuenta tester | **Tú** |
| Webhook RevenueCat → Supabase (opcional) | **Yo** (cuando esté conectado) |

---

## Mientras tanto: ¿qué pasa si aún no configuras RevenueCat?

La app nativa funciona perfecto, solo que los botones de compra mostrarán "Las compras dentro de la app aún no están disponibles" en vez de cobrar. **Nunca** abrirá Mercado Pago. Así que puedes subir y probar el resto de la app sin riesgo de rechazo, y activar los pagos cuando completes estos pasos.
