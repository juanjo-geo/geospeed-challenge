# GeoSpeed — Guía de Build Nativo Android (Capacitor → Google Play)

**Objetivo:** convertir la web (Vite/React) en una app Android nativa y publicarla en Google Play.
**Tu app ID:** `com.geospeed.challenge` (ya configurado en `capacitor.config.ts`).
**Fecha:** jun 2026.

> Todos los comandos se ejecutan en tu PC, en la carpeta `C:\Users\Juan Jose\GeospeedCh`. No en el sandbox.

---

## FASE 0 — Requisitos previos (instalar en tu PC)

1. **Node.js** — ya lo tienes (usas npm).
2. **Java JDK 17** — descarga "Eclipse Temurin JDK 17" (adoptium.net). Verifica con `java -version`.
3. **Android Studio** — https://developer.android.com/studio
   - Al instalarlo, acepta que descargue el **Android SDK** (Platform 34 o superior) y el **SDK Build-Tools**.
   - Esto pesa ~1.5 GB y la primera vez tarda.

> Sin estos tres, el build no compila. Instálalos antes de seguir.

---

## FASE 1 — Instalar Capacitor en el proyecto

En la terminal, dentro de `C:\Users\Juan Jose\GeospeedCh`:

```bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android
```

> El proyecto ya tiene `capacitor.config.ts`, así que NO corras `npx cap init` (sobrescribiría tu config). Si te pregunta por inicializar, sáltalo.

---

## FASE 2 — Compilar la web y agregar Android

```bash
npm run build:native       # genera dist/ SIN las fotos (paquete base ≤ 30 MB, Fase 11)
npx cap add android        # crea la carpeta android/ (proyecto nativo)
npx cap sync android       # copia dist/ dentro del proyecto Android
```

Tras esto tendrás una carpeta `android/` nueva. Cada vez que cambies el código web, repites:
```bash
npm run build:native && npx cap sync android
```

> **Fase 11 (juego sin conexión):** `build:native` = `vite build` + `scripts/strip-native-photos.mjs`, que saca de
> `dist/` las fotos de países, ciudades y monumentos (~80 MB) y falla si el paquete pasa de 30 MB. En la app esas
> fotos se piden al sitio publicado (`src/lib/assetUrl.ts`): con señal se ven igual; sin señal no aparecen (el juego
> funciona completo). **No uses `npm run build` para la app**: metería las fotos en el AAB.

---

## FASE 3 — Íconos y splash

Tienes `public/icon-512.png` y `public/icon-192.png`. Para generar todos los tamaños de Android automáticamente:

```bash
npm install -D @capacitor/assets
npx capacitor-assets generate --android
```
(Coloca un `icon.png` de 1024×1024 y un `splash.png` de 2732×2732 en una carpeta `assets/` en la raíz para mejores resultados; si no, usa los que hay.)

---

## FASE 4 — Abrir en Android Studio y probar

```bash
npx cap open android
```

Esto abre Android Studio con tu proyecto. La primera vez:
- Deja que **Gradle sincronice** (barra de progreso abajo, puede tardar varios minutos).
- Conecta un teléfono Android por USB (con depuración USB activada) o usa un emulador.
- Dale al botón **▶ Run** para instalar y probar la app en el dispositivo.

> Aquí es donde verás si todo funciona en nativo. Prueba: registro, juego, pagos (abrirá Mercado Pago en el navegador del sistema), orientación.

---

## FASE 5 — Crear la keystore (firma de la app) ⚠️ CRÍTICO

La keystore es la **firma digital** de tu app. **Si la pierdes, no podrás volver a actualizar la app en Google Play nunca.** Guárdala en lugar seguro + respaldo.

En Android Studio: **Build → Generate Signed Bundle / APK → Android App Bundle → Create new...**
- Define una ruta segura para el archivo `.jks`, y contraseñas (anótalas).
- Llena los datos (nombre, organización).

O por terminal:
```bash
keytool -genkey -v -keystore geospeed-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias geospeed
```

**Respalda ese archivo `.jks` y sus contraseñas en 2 lugares distintos.**

---

## FASE 6 — Generar el AAB firmado

En Android Studio: **Build → Generate Signed Bundle / APK → Android App Bundle**, selecciona tu keystore, modo **release**.

Resultado: un archivo `.aab` en `android/app/release/`. Ese es el que sube a Google Play.

---

## FASE 7 — Subir a Google Play Console

(Ya tienes cuenta de Google Play Console creada — el pago de $25 hecho.)

1. Entra a https://play.google.com/console
2. **Crear app** → nombre "GeoSpeed IQ Challenge", idioma, juego, gratis.
3. Completa el cuestionario inicial (clasificación de contenido, público objetivo, política de privacidad → usa tu URL `geospeed-challenge.vercel.app/privacy`).
4. **Producción → Crear nueva versión** → sube el `.aab`.
5. **Ficha de Play Store:** usa los textos de `store-listing/metadata.json` (ya los tienes). Necesitas:
   - Ícono 512×512 (tienes `icon-512.png`).
   - Gráfico destacado 1024×500 (hay que crearlo).
   - Mínimo 2 screenshots de teléfono (captúralas del emulador/teléfono).
6. **Enviar a revisión.** Google tarda 3-7 días para apps nuevas.

---

## FASE 8 — Soft launch

En Google Play Console puedes lanzar **por países** (Colombia, México, Chile primero) y en **prueba cerrada/abierta** antes de producción global. Recomendado: prueba cerrada con tu hermano y conocidos primero.

---

## Pendientes técnicos para el nativo (los preparo yo en otra sesión)

- **AdMob nativo:** instalar `@capacitor-community/admob` y reemplazar las llamadas de `adSystem.ts` por AdMob (tarea #32). Las claves ya están en `.env`.
- **RevenueCat (opcional):** si quieres IAP nativo además de Mercado Pago web.
- **Permisos:** revisar `AndroidManifest.xml` (internet ya viene por defecto).
- **Pagos en nativo:** OJO — Google Play exige que los bienes digitales (Pro, vidas) se vendan con **Google Play Billing**, NO con Mercado Pago dentro de la app. Mercado Pago queda solo para la web. Esto es importante: hay que usar RevenueCat/Play Billing para los pagos DENTRO de la app Android. (Lo vemos al integrar.)

---

## Resumen de qué hace quién

| Tarea | Quién |
|-------|-------|
| Instalar Android Studio + JDK | **Tú** (tu PC) |
| npm install capacitor + cap add android | **Tú** (comandos arriba) |
| Compilar/probar en Android Studio | **Tú** |
| Crear y respaldar keystore | **Tú** (crítico) |
| Generar AAB y subir a Play | **Tú** |
| Código AdMob nativo, ajustes de config | **Yo** (próxima sesión) |
| Ficha de tienda, ASO, screenshots | **Yo ayudo** + tú subes |
