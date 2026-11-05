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

## FASE 5 — Keystore (firma de la app) ⚠️ CRÍTICO

> **Ya existe (2026-10-18):** `C:\Users\Juan Jose\geospeed-upload-2026.jks`, alias `geospeed`; la contraseña la guarda JuanJo. **No crees otra**: usa esa en todos los AAB. Lo de abajo es solo referencia.

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

Antes de cada AAB, yo dejo la carpeta `android/` lista (`npm run build:native` + `npx cap sync android`) y subo el `versionCode` si hace falta: **cada AAB que subas a Play necesita un `versionCode` mayor que el anterior** (el primero es 1).

1. Abre **Android Studio → Open** → elige la carpeta `C:\Users\Juan Jose\GeospeedCh\android` (la carpeta `android`, no la del proyecto). Espera a que termine "Gradle sync" (barra de abajo; la primera vez puede tardar varios minutos porque descarga dependencias).
2. **Build → Generate Signed App Bundle or APK… → Android App Bundle → Next**.
3. **Key store path:** `C:\Users\Juan Jose\geospeed-upload-2026-11.jks` · **Key alias:** `geospeed` · escribe las dos contraseñas → **Next**.
   La llave es la del 2026-11-04 (huella SHA-1 `C1:6B:57:94:7E:1B:D7:BF:ED:70:F5:F5:82:32:A0:4E:63:01:8E:05`). Las de
   junio (`geospeed-release.jks`) y octubre (`geospeed-upload-2026.jks`) no sirven: se perdieron sus contraseñas y no
   se subió nada con ellas.
4. Elige **release** → **Create**.
5. Al terminar, el aviso "Locate" abre la carpeta: el archivo es `android\app\release\app-release.aab`. Ese es el que se sube a Play.

Si Gradle muestra un error en rojo, cópiame el texto completo.

---

## FASE 7 — Subir a Google Play Console

**Antes que nada: la verificación de la cuenta.** Google exige verificar la identidad (y en cuentas personales, que tienes un teléfono Android real, con la app **Google Play Console**) antes de publicar. Las tareas pendientes aparecen en la página principal de https://play.google.com/console. Si un documento es rechazado, se reenvía desde ahí o desde https://payments.google.com → Alertas → Verificar (mejor entrar directo que desde el botón del correo).

Documentos que Google acepta en Colombia para una cuenta personal:
- **Identidad:** cédula de ciudadanía, pasaporte, licencia de conducción o cédula de extranjería.
- **Comprobante de domicilio:** factura de servicios (luz, agua, gas, internet o TV por cable), extracto bancario o de tarjeta de crédito, o estado de cuenta de un seguro. Emitido en los **últimos 90 días**, con tu **nombre exactamente igual** al del perfil de pagos y la **dirección completa exactamente igual** a la del perfil (si no coincide, puedes corregir el perfil durante la verificación). La cédula colombiana no muestra la dirección, así que no sirve como comprobante.
- Foto o escaneo en color, legible, con las cuatro esquinas, sin brillos. En extractos, tapa los números de cuenta excepto los últimos 4.
- Los intentos son limitados: revisa nombre, dirección y fecha antes de enviar. La revisión tarda de 1 a 7 días.

**Orden recomendado:**
1. **Crear app** → nombre **GeoSpeed Challenge**, idioma español, tipo **Juego**, **Gratis**.
2. **Prueba interna** (Pruebas → Prueba interna → Crear versión): sube el `.aab`, acepta **Firma de apps de Google Play**, agrega una lista de probadores (correos) y publica la versión. Los probadores instalan desde el enlace de participación.
3. **Contenido de la app** (Política → Contenido de la app): política de privacidad `https://geospeed-challenge.vercel.app/privacy`, acceso a la app (no requiere iniciar sesión), anuncios (**Sí**), clasificación del contenido (cuestionario), público objetivo (13+ recomendado: con anuncios personalizados, menores de 13 exige reglas de familias), seguridad de los datos, ID de publicidad (**Sí**), eliminación de cuenta (`https://geospeed-challenge.vercel.app/eliminar-cuenta`).
4. **Ficha de Play Store:** textos de `store-listing/metadata.json`, ícono `store-listing/play-icon-512.png`, gráfico 1024×500 y capturas (los preparo yo). **Sitio web:** `https://geospeed-challenge.vercel.app` (lo necesita `app-ads.txt` de AdMob).
5. **Prueba cerrada con 12 personas durante 14 días.** Si la cuenta es **personal y se creó después del 13 de noviembre de 2023**, Google no deja pasar a Producción hasta que 12 probadores hayan estado inscritos en una prueba cerrada **14 días seguidos** (y sigan inscritos el día que pidas el acceso). Invitar no basta: cada uno debe aceptar con el enlace e instalar. Las cuentas de organización no tienen este requisito.
6. **Solicitar acceso a Producción** (Panel → Solicitar acceso) y luego **Producción → Crear versión**. La revisión de una app nueva tarda varios días.

---

## FASE 8 — Soft launch

En Google Play Console puedes lanzar **por países** (Colombia, México, Chile primero). La prueba cerrada de 14 días de la fase 7 sirve también como primera ronda de comentarios.

---

## Anuncios AdMob (hecho el 2026-10-28)

- **Plugin:** `@capacitor-community/admob` 8.2.1, enlazado con Android. `adSystem.ts` usa AdMob dentro de la app: un anuncio con recompensa (+1 vida) en "Sin vidas" y en las ofertas, y uno de pantalla completa entre partidas cada 3 juegos (nunca a jugadores Pro). Los anuncios se precargan; si AdMob todavía no tiene uno listo (pasa en apps nuevas), el botón "Ver video" no aparece.
- **App ID:** ya está en `android/app/src/main/AndroidManifest.xml`. Sin esa línea el SDK de anuncios cierra la app al abrirla.
- **Anuncios de prueba:** el AAB de prueba interna se genera con anuncios de prueba de Google (`VITE_ADMOB_TESTING=true npm run build:native`, sin tocar `.env`). Así tus toques no cuentan como tráfico inválido (AdMob puede suspender la cuenta por eso). Para el AAB de producción se genera con `npm run build:native` a secas. Otra opción: AdMob → Configuración → **Dispositivos de prueba** → agrega tu teléfono.
- **Consentimiento en Europa:** el SDK pregunta solo en la UE y el Reino Unido, con el mensaje que configures en **AdMob → Privacidad y mensajes → GDPR** (créalo antes de publicar: España está entre los países de Conquista). Para esos usuarios, Ajustes muestra "Privacidad de los anuncios".
- **app-ads.txt:** ya está publicado en `https://geospeed-challenge.vercel.app/app-ads.txt`. Para que AdMob lo encuentre, la ficha de Play debe tener como **sitio web del desarrollador** `https://geospeed-challenge.vercel.app`.
- **Declaraciones en Play Console** (Contenido de la app): **Anuncios → Sí, contiene anuncios**. **ID de publicidad → Sí, se usa para publicidad** (el SDK de AdMob agrega el permiso `AD_ID`). En **Seguridad de los datos**, declara los datos que recopila el SDK de anuncios (ID del dispositivo e interacciones con la app, para publicidad).
- AdMob muestra pocos anuncios hasta que la app esté publicada en Play y vinculada en **AdMob → Apps → Configuración de la app → Tienda de aplicaciones**.

## Recordatorios (permiso de alarmas exactas)

El complemento `@capacitor/local-notifications` declara `SCHEDULE_EXACT_ALARM`. Google Play solo lo admite en apps de
alarma o calendario y pide una declaración en la consola, así que `AndroidManifest.xml` lo quita
(`tools:node="remove"`). Sin él, el complemento programa una alarma normal: el recordatorio del diario (7 p. m.) y los
de Conquista (24 h y 1 h antes del cierre) pueden llegar unos minutos tarde. En la declaración de permisos de Play no
hay que justificar alarmas exactas.

## Atrás, pantalla completa y compartir (versión 2 · 1.0.1, 2026-11-05)

Lo que Felipe encontró en la primera prueba interna:
- **Botón y gesto de atrás:** con `@capacitor/app` 8.1.2 la app recibe cada "atrás" y hace lo mismo que el botón
  visible de la pantalla o ventana de arriba (`src/lib/backNav.ts`): cierra la hoja o la ventana, vuelve a la pantalla
  anterior, en plena partida pregunta "¿Salir de la partida?" y en el Inicio manda la app al fondo como cualquier app
  de Android (no la cierra).
- **Pantalla completa:** sin barra de notificaciones (hora, red, llamada en curso) ni barra de navegación, como en los
  juegos. Deslizando desde el borde se asoman un momento y se vuelven a esconder. Lo hacen `capacitor.config.ts`
  (`SystemBars.hidden`) y `MainActivity.java` (modo inmersivo, se reaplica al volver a la app o tras un anuncio).
- **Compartir:** el WebView de Android no trae la función de compartir del navegador, así que ningún botón de compartir
  hacía nada. `src/lib/nativeShare.ts` abre la hoja de compartir de Android con `@capacitor/share` 8.0.3 (las imágenes
  y los videos pasan antes por la caché de la app con `@capacitor/filesystem` 8.1.5, sin permisos nuevos). Además, los
  enlaces que se comparten desde la app (retos, salas, quizzes, Conquista, invitaciones) y los de los correos de la
  cuenta salían como `https://localhost/...`; ahora usan `https://geospeed-challenge.vercel.app`.

## Subir una versión nueva a la prueba interna

1. Yo dejo `android/` listo (compilación nativa, `npx cap sync android` y el `versionCode` subido).
2. En Android Studio: **File → Sync Project with Gradle Files** (descarga los complementos nuevos la primera vez).
3. **Build → Generate Signed App Bundle or APK… → Android App Bundle** con la misma llave (FASE 6) → **release** →
   **Create**. Sale en `android\app\release\app-release.aab` (reemplaza el anterior).
4. Play Console → **Prueba interna → Crear una versión nueva** → sube el `.aab` → nombre de la versión (lo propone solo,
   p. ej. `2 (1.0.1)`) → notas de la versión → **Siguiente → Guardar y publicar**.
5. Los probadores reciben la actualización por Play Store (a veces tarda unos minutos; si no aparece, que abran otra
   vez el enlace de la prueba y toquen **Actualizar**).

## Pagos nativos

Google Play exige que los bienes digitales (Pro, vidas) se vendan con **Google Play Billing**, nunca con Mercado Pago dentro de la app. El código ya usa RevenueCat en nativo; la configuración está en `GeoSpeed_RevenueCat_Setup.md` (incluye el webhook que avisa al servidor).

---

## Resumen de qué hace quién

| Tarea | Quién |
|-------|-------|
| Instalar Android Studio + JDK | **Tú** (tu PC) |
| npm install capacitor + cap add android | **Tú** (comandos arriba) |
| Compilar/probar en Android Studio | **Tú** |
| Crear y respaldar keystore | **Tú** (crítico) |
| Generar AAB y subir a Play | **Tú** |
| Código AdMob nativo, App ID, app-ads.txt | ✅ Hecho (yo, 2026-10-28) |
| Mensaje GDPR en AdMob + declaraciones de anuncios en Play | **Tú** |
| Ficha de tienda, ASO, screenshots | **Yo ayudo** + tú subes |
