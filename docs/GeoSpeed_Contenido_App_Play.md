# GeoSpeed Challenge — Respuestas para "Contenido de la app" en Play Console

Lo que se le declara a Google y por qué. Debe coincidir con la política de privacidad (`src/pages/Privacy.tsx`) y con
lo que la app hace de verdad: **si se agrega un SDK, un proveedor o un dato nuevo, actualizar las dos cosas.**

Base: el manifiesto del AAB 3 (1.0.2), el código y la información de datos que publican Google AdMob y RevenueCat
(consultada el 2026-11-08).

## 1. Política de privacidad

`https://geospeed-challenge.vercel.app/privacy`

## 2. Acceso a la app

**Sí, algunas funciones están restringidas.** Se juega sin cuenta, pero Sprint y crear una Sala en vivo piden una cuenta
registrada, y Google no crea cuentas propias. Guardado en Play Console el 2026-11-08: nombre "Cuenta de revisión",
usuario `juanjogrimar+revision@gmail.com`. La contraseña está solo en Play Console. La cuenta tiene Pro de por vida
(`purchases`, proveedor `manual`) y 5 partidas internas marcadas `suspicious` para abrir Sprint sin entrar a los rankings.

Instrucciones para el revisor (en inglés):

> The game can be played without an account. This test account has Pro and unlocks everything, including Sprint and
> hosting a Live Room. To sign in: Home > gear icon (Settings) > "I already have an account".

## 3. Anuncios

**Sí, mi app contiene anuncios** (Google AdMob).

## 4. Clasificación del contenido

Categoría **Juego**. Correo: `juanjogrimar@gmail.com`. Respuestas:

- **Sustancia controlada: Sí, solo Alcohol y Tabaco.** Unas 50 reseñas los nombran de paso (la cerveza Guinness en
  Dublín, el pisco de Perú, el tabaco de Viñales) y la pregunta incluye "referencias". JuanJo decidió no tocar esos textos.
- **Compras de artículos digitales: Sí** (Pro y vidas). El juego no da dinero ni NFT.
- Violencia, contenido sexual, lenguaje ofensivo y apuestas: **No**. El cofre diario es gratis y no se compra.

## 5. Público objetivo

**13 a 15, 16 a 17 y 18 o más.** No incluir menores de 13: con menores aplica la Política de Familias y los anuncios
personalizados y el ID de publicidad dejarían de estar permitidos para ellos.

## 6. ID de publicidad

**Sí, la app usa un ID de publicidad.** Finalidades: **Publicidad o marketing**, **Estadísticas** y **Prevención de
fraudes, seguridad y cumplimiento**. El SDK de AdMob agrega el permiso `com.google.android.gms.permission.AD_ID`.

## 7. Seguridad de los datos

- ¿Recopila o comparte datos del usuario? **Sí.**
- ¿Todos están cifrados en tránsito? **Sí** (HTTPS/TLS).
- Métodos para crear cuenta: **nombre de usuario y contraseña** (correo y contraseña; "Continuar con Google" aún no
  está disponible dentro de la app).
- URL para eliminar la cuenta: `https://geospeed-challenge.vercel.app/eliminar-cuenta`
- ¿Se pueden pedir borrar datos sin borrar la cuenta? **No.**

| Tipo de dato | Recopilado | Compartido | Efímero | Uso | Finalidades |
|---|---|---|---|---|---|
| Ubicación → Ubicación aproximada | Sí | Sí | No | Obligatorio | Funcionalidad de la app · Estadísticas · Publicidad o marketing · Prevención de fraudes |
| Información personal → Nombre | Sí | No | No | Opcional | Funcionalidad de la app · Administración de la cuenta |
| Información personal → Dirección de correo | Sí | No | No | Opcional | Administración de la cuenta |
| Información personal → IDs de usuario | Sí | No | No | Obligatorio | Funcionalidad de la app · Administración de la cuenta · Prevención de fraudes |
| Información financiera → Historial de compras | Sí | No | No | Obligatorio | Funcionalidad de la app · Estadísticas |
| Actividad en la app → Interacciones en la app | Sí | Sí | No | Obligatorio | Funcionalidad de la app · Estadísticas · Publicidad o marketing · Prevención de fraudes |
| Actividad en la app → Otro contenido generado por el usuario | Sí | No | No | Opcional | Funcionalidad de la app |
| Actividad en la app → Otras acciones | Sí | No | No | Obligatorio | Funcionalidad de la app · Personalización |
| Información y rendimiento → Diagnóstico | Sí | Sí | No | Obligatorio | Estadísticas · Publicidad o marketing · Prevención de fraudes |
| Dispositivo u otros IDs | Sí | Sí | No | Obligatorio | Estadísticas · Publicidad o marketing · Prevención de fraudes |

De dónde sale cada uno:

- **Compartidos:** los cuatro marcados son los que Google AdMob indica que recopila y comparte: IP (ubicación
  aproximada), interacciones, diagnóstico e identificadores del dispositivo.
- **Ubicación aproximada, además:** el país del perfil y el país aproximado de Google Analytics.
- **Nombre:** el nombre de jugador. **IDs de usuario:** la sesión de invitado o la cuenta, también usada en RevenueCat.
- **Historial de compras:** Google Play y RevenueCat. Los datos de la tarjeta nunca llegan a la app.
- **Otro contenido generado por el usuario:** nombres de quizzes y apodos en salas.
- **Otras acciones:** partidas, rondas, racha, medallas y lugares por repasar.
- **Dispositivo u otros IDs, además:** Google Analytics y Cloudflare Turnstile.
- Supabase, Google Analytics, RevenueCat, Cloudflare y Brevo actúan como proveedores de servicios, así que por sí solos
  no cuentan como "compartir".
- **No se recopilan:** ubicación precisa, teléfono, dirección, contactos, fotos, audio, archivos, calendario, salud,
  mensajes ni historial web.

## 8. Otras declaraciones

Apps de noticias: **No**. Apps gubernamentales: **No**. Funciones financieras: **ninguna**. Salud: **ninguna**.

## 9. Estado del comerciante, categoría y contacto

- **Estado del comerciante: Sí, se aplica a esta app** (gana dinero con anuncios y compras). Condiciones del Servicio:
  `https://geospeed-challenge.vercel.app/terms`.
- **Categoría de la app:** Trivia, sin etiquetas por ahora.
- **Contacto:** correo `juanjogrimar@gmail.com`, sitio web `https://geospeed-challenge.vercel.app` (AdMob comprueba ahí
  `app-ads.txt`) y teléfono vacío, porque lo vería todo el mundo. Marketing externo marcado.

## 10. Pendiente antes de producción

Contenido de usuarios (política de Google): los Términos ya definen lo prohibido y el reporte es por correo. Falta que
los nombres de jugador pasen por un filtro (`update_my_profile` no usa `_quiz_name_ok`), reportar dentro de la app y
aceptar los Términos antes de crear contenido.
