# GeoSpeed — Plan de Rediseño v2 (juice + retos asincrónicos)

**Versión:** 1.0 · **Fecha:** 17 de octubre de 2026 · **Autor:** JuanJo + Claude (sesión de planificación)
**Fuentes:** `GeoSpeed_Ajustes_y_Sugerencias_Desarrollo_v1.md` (consolidado de maquetas aprobadas, 83 entradas) + auditoría del código real hecha el 17 oct 2026 sobre el commit `993cfd0`.
**Estado:** Plan para validar con el equipo. No compromete fechas. Las maquetas (PNG) se incorporan en la siguiente iteración.

---

## 0. Resumen ejecutivo

El consolidado de maquetas propone tres cosas distintas que conviene planificar por separado:

1. **Rediseño visual** (paleta azul océano / turquesa / amarillo, nueva mascota "Explorador", navegación persistente, pantallas de configuración y ajustes). Afecta a casi todas las pantallas pero **no toca el motor** de juego.
2. **Retos asincrónicos entre amigos + Mis retos + Revancha.** Es el bloque funcional grande. Hoy el duelo es en vivo y sin identidad de usuario; el reto asincrónico requiere **identidad persistente, tablas nuevas y guardar el detalle por ciudad en servidor**. Nada de eso existe.
3. **Capa educativa y de datos** (revisión por ciudad con mapa y pista, historial con filtros, ranking con posición propia, recuperación de contraseña). Depende de lo mismo que el punto 2: persistencia por partida y por ronda.

La auditoría confirmó lo que el documento advertía: **varias pantallas aprobadas muestran funciones que no existen.** El detalle está en la sección 2. La dependencia crítica de todo el plan es la **identidad del jugador invitado** (sección 4, decisión D1): sin resolverla no se pueden construir retos, historial en la nube ni ranking personal.

Orden recomendado: fundaciones → identidad y persistencia → rediseño visual del núcleo → reto asincrónico → Mis retos y revancha → perfil / historial / ranking → catálogo y cierre. Coincide con el orden sugerido en el consolidado (§12) con una diferencia: adelantamos la identidad porque bloquea tres bloques.

---

## 1. Qué hay hoy (hechos del código que condicionan el plan)

Resultado de la auditoría. Cada punto cita el archivo para que el equipo lo verifique.

### 1.1 Navegación y shell
- Toda la app es una **máquina de estados** `Phase` en `src/pages/Index.tsx:125` (20 fases). Solo `/auth`, `/privacy`, `/support`, `/terms` y los deep links (`/daily`, `/challenge/:seed`, `/duel/:code`) son rutas reales (`src/App.tsx:42-54`).
- **No existe navegación persistente** (ni barra inferior móvil ni lateral de escritorio). Home tiene una fila de botones de texto (`HomeScreen.tsx:164-208`).
- **No existe pantalla de Ajustes.** Solo hay: toggle de música flotante (`Index.tsx:1080-1093`, clave `geospeed_music_muted`) y bandera de idioma en Home (`geospeed_locale`). No hay toggle de efectos, vibración ni "reducir movimiento" en la app. El modo daltónico tiene lógica pero sin UI (`useAccessibility.ts:31-48`).
- **Privacidad, Soporte y Términos no son alcanzables desde el juego**; solo por URL directa.
- Tema: la app está forzada a `neon` (`index.html:2`, `useTheme.ts`). `ThemeToggle.tsx` es código muerto. Colores definidos en CSS vars en `src/index.css` + muchos hex hardcodeados (`#F0A030`, `#f5c842`, gradiente del logo repetido en varios archivos).
- `prefers-reduced-motion` solo se respeta en CSS y en el auto-zoom del mapa; `confetti.ts`, `juiceAnimations.ts` y `AutoDemo` no lo consultan.

### 1.2 Inicio y selección
- Región y dificultad son chips inline en Home (`HomeScreen.tsx:356-429`), con desbloqueo por nivel (Europa Nv2, Asia Nv3, América Nv4, África Nv5; Rookie Nv2, Crack Nv4, Leyenda Nv6; Imposible Nv5). Cambiar región conserva dificultad, pero **ninguna selección se persiste** entre sesiones.
- Jugador nuevo (0 partidas) ve **solo** el acordeón "¿Cómo se juega?", Campo de tiro e Iniciar juego. Nada más.
- "Más modos" no existe (`showMoreModes` es estado muerto). Los modos van planos en la página. "Imposible" existe: es Speed Demon (5 s por ciudad, 30 rondas, ciudades básicas, `Index.tsx:562-571`).

### 1.3 Partida y feedback
- Girar teléfono: el aviso existe, pero aparece **después** de la cuenta 3-2-1-GO, no antes (`Index.tsx:356-379`). El temporizador sí espera en vertical, pero el `timeUsed` del multiplicador de velocidad sigue contando (`GameScreen.tsx:257`).
- Cuenta regresiva: existe en Clásico, Diario (desde botón), Caos y Mundial. **No** en Duelo ni en el deep link `/daily`.
- Feedback tras acierto: muestra punto elegido, punto correcto, línea con km, ciudad, país, distancia, tiempo, puntos base y totales (`GameScreen.tsx:684-813`). Dura 3 s con botón Siguiente. Cumple UI-06.
- `GameLayout.tsx` y `FloatingHUD.tsx` son **código muerto** (GameScreen arma su propio layout).

### 1.4 Cierre de partida
- Diferencia tiempo agotado vs completada (`FinalResultScreen.tsx:220-239`). Récord solo se anuncia en el header si fue "completada"; en timeout el confeti y la frase "superaste" se disparan igual pero el header no lo dice. Una primera partida nunca cuenta como récord (`previousBest > 0`).
- Acciones: **Otra vez con las mismas ciudades** (existe, principal, no gasta vida), Regresar al menú, Detalle por ronda (colapsable), Compartir imagen/video, Retar a un amigo, Revancha de las 5 peores. **No existe botón "Nueva partida"** con ciudades nuevas.
- Mejor ronda: existe (solo si ≥300 pts).
- Mascota en cierre: `celebrate` o `wink`. Nunca `sad`, ni siquiera en timeout.
- Caos y Mundial tienen pantallas de cierre **propias e inline**, no usan FinalResultScreen.

### 1.5 Revisión por ciudad
- `RoundBreakdown.tsx`: tabla por ronda (ciudad, distancia, segundos, multiplicador, puntos, ★ mejor). Filas no clicables.
- `ReplayMap.tsx`: mini-mapa con todas las rondas; **importado pero nunca renderizado**; solo hover de mouse.
- **No existe** mapa por ciudad con elegida vs correcta, ni pista para recordar, ni navegación sin temporizador. Las únicas pistas por ciudad son las 3 del onboarding; `cities.ts` **no tiene campo de pista** (420 ciudades, campos: nombre, país, lat, lon, dificultad).

### 1.6 Multijugador (lo más relevante para el bloque de retos)
- Duelo en vivo: código de 5 caracteres generado en cliente (`multiplayerUtils.ts:23-30`), sala en `game_rooms` con solo un `seed` entero; cada cliente deriva las ciudades localmente desde el seed (`cities.ts:494-512`). Si cambia `cities.ts`, cambia el set para el mismo seed.
- Identidad en duelo: nombre libre + secreto por sala en sessionStorage. **Sin user_id.** No se puede retomar tras recargar.
- `status` de la sala **nunca sale de `waiting`** (`updateRoomStatus` no se llama). Las salas nunca se borran. No hay abandono ni presencia.
- El duelo no escribe historial, ni stats, ni gasta vida.
- **Ya existe un reto asincrónico primitivo**: el enlace "Reta a un amigo" `/challenge/:seed?d=&m=&s=` (`Index.tsx:574-591`). **Está roto**: genera un seed nuevo, así que el amigo juega ciudades distintas a las del puntaje que recibe. El puntaje viaja en la URL y es editable. No se guarda nada en servidor.
- Puntaje del rival: oculto en UI hasta detectar fin, pero **legible públicamente** en `game_rooms_public`.

### 1.7 Persistencia y datos
- **Servidor solo guarda agregados.** No hay detalle por ronda en ninguna tabla. El `RoundResult` (ciudad, clic, distancia, tiempo, puntos) vive solo en memoria.
- Historial: localStorage `geospeed_history`, **tope 20 entradas**, sin estado ni ciudades. El XP del nivel se deriva de esa lista de 20 (`levelSystem.ts:45-50`), así que el XP "se congela" a largo plazo.
- Nube: `player_data` (stats, history, energy, premium como JSON) solo para usuarios logueados; regla de fusión "gana quien tenga más partidas", reemplazo completo, sin merge de entradas (`cloudSync.ts:96-108`).
- Ranking: tabla `leaderboard` con iniciales de 3 letras, Top 10 fijo, filtros periodo/región/dificultad; **sin posición propia fuera del Top 10**; `user_id` se guarda pero nunca se lee. `submit-score` **rechaza `mode: 'mundial'`**, así que los puntajes de Mundial son solo locales. Caos nunca envía al ranking.
- Diario: seed por fecha **UTC** (cambia a las 19:00 en Colombia); resultados solo en localStorage; el contador "jugadores hoy" cuenta todas las filas del leaderboard del día, no jugadores del diario.
- Push: `send-push` existe pero nadie lo llama; falta `VITE_VAPID_PUBLIC_KEY` en `.env`, así que hoy no se guardan suscripciones.

### 1.8 Cuenta
- Registro: nombre (≤20), email, contraseña (≥6). **Sin confirmar contraseña.** Ver/ocultar contraseña: existe.
- Botones Google y Apple existen en UI; si están habilitados en el dashboard de Supabase no se puede verificar desde el repo.
- Invitado: juega todo sin cuenta. **No tiene identidad** (ni anónima de Supabase ni device id). Al registrarse, sus datos locales se adoptan si la nube está vacía.
- **Recuperación de contraseña: no existe nada** (ni enlace "olvidé", ni ruta de reset, ni estados).
- El error de registro "este email ya tiene cuenta" **revela existencia de cuenta**. El de login es genérico.
- Auth.tsx y Splash están en **español hardcodeado**, fuera del i18n.

### 1.9 Perfil, historial, ranking
- Perfil: avatar emoji, nombre, nivel + barra XP, 4 pestañas (Stats con 6 tiles incluida distancia media, Niveles, Insignias, Historial). Sin racha, sin acceso a ranking, sin ajustes. Solo accesible si `gamesPlayed > 0`.
- Historial: dos listas simples (Perfil y Home), **sin filtros, sin paginación, sin detalle**. Mundial guarda el conteo de aciertos exactos en el campo `avgDistance`.
- Ranking: solo en Home, colapsable, Top 10.

### 1.10 Contenido
- `countries.ts`: 177 polígonos con nombre en inglés. **Sin ISO, sin centroide, sin continente, sin imágenes.** No hay fotos de países en ningún lado.
- i18n: ES/EN completos salvo Auth, Splash, nudge de FinalResult, banner de racha y nombres de ciudades (solo ES).

---

## 2. Contraste propuesta vs. código (inventario del consolidado)

Leyenda de **Estado real**: ✅ existe · 🟡 parcial · ❌ no existe. **Esfuerzo**: S (≤2 días dev), M (3-5), L (1-2 semanas), XL (>2 semanas). Son estimaciones gruesas para priorizar, no compromisos.

| ID | Propuesta | Estado real | Brecha concreta | Esfuerzo | Depende de |
|---|---|---|---|---|---|
| UI-01 | Nueva paleta + pin Explorador + marca | ❌ | App forzada a neon oscuro. Hex hardcodeados en ~15 archivos. Mascota actual (5 PNG) ≠ Explorador. Mapa multicolor nuevo implica rehacer paleta de `WorldMapCanvas`. | L | Design tokens (F0) + assets maestros |
| UI-02 | Carga con globo, mascota, pregunta | 🟡 | Splash existe, 3 s fijos, barra falsa, texto hardcodeado. Rehacer visual + i18n. | S | UI-01 |
| UI-03 | Inicio v2 (banner, config compacta, Jugar ahora, accesos agrupados, Mis retos, nav inferior) | 🟡 | Banner y CTA existen. Falta: nav persistente, "Más modos", acceso a Mis retos, config compacta (hoy chips largos), tratamiento del jugador nuevo. | L | UI-01, SOC-06 para el acceso |
| UI-04 | Selectores de región/dificultad en panel con confirmación | 🟡 | Lógica y desbloqueos existen como chips. Falta el panel modal y persistir la selección. | S | UI-01 |
| UI-05 | Partida: móvil sin lateral, escritorio con lateral | 🟡 | Ya es así en GameScreen. Falta re-skin + mapa multicolor con etiquetas de continentes/océanos. Borrar `GameLayout`/`FloatingHUD` muertos. | M | UI-01 |
| UI-06 | Feedback: elegida, correcta, distancia, resultado | ✅ | Solo re-skin. | S | UI-01 |
| UI-07 | Cierre: 3 estados, repetir ciudades, nueva partida, detalle | 🟡 | Falta botón "Nueva partida", récord en timeout, mascota `sad` en timeout, unificar cierres de Caos y Mundial. | M | UI-01 |
| EDU-01 | Revisión por ciudad: mapa, pista, navegación sin timer | ❌ | No hay mapa por ciudad ni pistas. Requiere **contenido**: 420 pistas (ES/EN) en `cities.ts`. `ReplayMap` sirve de base técnica. | L (+ contenido) | Datos por ronda en memoria (ya) / en servidor para retos (F1) |
| SOC-01 | Reto asincrónico reemplaza duelo en vivo | ❌ | Modelo nuevo: tabla de retos con set de ciudades **explícito** (no seed), resultados por participante, revelación condicionada. | XL | D1 identidad, F1 persistencia |
| SOC-02 | Crear/unirse por código o enlace | 🟡 | Hay generador de código y deep link `/duel/:code` (no pre-rellena). Reusar formato; mover generación al servidor con reintento ante colisión. | M | SOC-01 |
| SOC-03 | Resultado pendiente / final (victoria, derrota, empate) | 🟡 | `MultiplayerResultScreen` tiene la idea pero atada al polling de sala. Rehacer sobre el modelo de retos. | M | SOC-01 |
| SOC-04 | Comparación por ciudad + mapa comparativo | ❌ | Necesita detalle por ronda de **ambos** en servidor. | L | F1 |
| SOC-05 | Revancha | ❌ | "Revancha" actual solo vuelve al lobby. Nuevo reto con `parent_challenge_id`, mismas condiciones, ciudades nuevas excluyendo las del padre. | M | SOC-01, SOC-06 |
| SOC-06 | Mis retos (bandeja persistente) | ❌ | Confirmado inexistente. Lista + filtros + contadores + estados + estado vacío. | L | SOC-01 |
| PRO-01 | Perfil: identidad, nivel, stats, accesos | 🟡 | Existe casi todo. Falta accesos a ranking y Mis retos, racha, y permitir entrar con 0 partidas. | S | — |
| PRO-02 | Historial con filtros, orden, detalle, vacío | 🟡 | Lista simple de 20 locales. Falta tabla servidor, filtros, paginación, estado, detalle por ciudad, "sin coincidencias". | L | F1 |
| PRO-03 | Ranking Top 10 + posición propia + filtros | 🟡 | Filtros existen. Falta posición propia (RPC), identidad por usuario, incluir Mundial y Caos, criterio definido (D5). | M | D1, D5 |
| CFG-01 | Ajustes: música, efectos, vibración, reducir movimiento, idioma, ayuda, privacidad | 🟡 | Solo música e idioma. Falta pantalla, 3 toggles, persistencia, enlaces legales. | M | — |
| ACC-01 | Cuenta: registro, login, invitado, ver/ocultar | 🟡 | Falta confirmar contraseña, i18n, errores genéricos en registro, y **identidad de invitado** (D1). | M | D1 |
| ACC-02 | Recuperación de contraseña (5 estados) | ❌ | Nada existe. Supabase lo da casi gratis: `resetPasswordForEmail` + ruta `/reset-password` que escucha `PASSWORD_RECOVERY`. | M | — |
| ACC-03 | Error de acceso genérico | 🟡 | Login ya es genérico; registro no. | S | — |
| HELP-01 | Tutorial 3 pasos, "Entendido" vuelve al origen | 🟡 | Hay acordeón + onboarding jugable + ghost-hand. Falta la pantalla de 3 pasos; hoy "¡Jugar de verdad!" y el ghost-hand **inician partida automáticamente** (contradice la regla). | S | UI-01 |
| CONTENT-01 | 195 fotos de países | ❌ | No hay ISO en `countries.ts` ni uso definido en el juego. Requiere decisión D7 antes de integrar. | M-L según uso | D7 |

**Mapeo de "Más modos":** 60 segundos de Caos = `TimeAttackScreen`; Imposible = Speed Demon; Desafío Mundial = `WorldChallengeScreen`. Los tres existen.

---

## 3. Bugs y deuda detectados que entran al plan aunque no estén en las maquetas

Se incluyen porque el rediseño los tocaría de todos modos o porque invalidan una pantalla aprobada.

| # | Problema | Archivo | Tratamiento |
|---|---|---|---|
| B1 | "Reta a un amigo" genera un seed nuevo: el amigo juega otras ciudades | `Index.tsx:574-579` | Corregir en F0 (usar el seed real de la partida) o retirar el botón hasta que llegue el reto asincrónico |
| B2 | `submit-score` rechaza `mode: 'mundial'`; Mundial nunca llega al ranking en nube | `supabase/functions/submit-score/index.ts:51-67` | F0: aceptar `mundial` y `timeattack` |
| B3 | XP derivado de historial con tope 20 → el nivel deja de subir | `levelSystem.ts:45-50`, `gameUtils.ts:222` | F1: acumular XP en servidor / stats, no desde historial |
| B4 | Diario usa fecha UTC (cambia a las 19:00 en Colombia) | `Index.tsx:128-136`, `dailyStreak.ts` | Decisión D6; si se cambia a local, migrar claves |
| B5 | Registro revela si el email existe | `Auth.tsx:54-61` | F1 con ACC-03 |
| B6 | `status` de sala nunca cambia; salas nunca se borran | `multiplayerUtils.ts:153`, sin política DELETE | Se resuelve al retirar el duelo en vivo (F3) + job de limpieza |
| B7 | Código muerto: `GameLayout`, `FloatingHUD`, `ThemeToggle`, `ReplayMap` (sin render), `showMoreModes` | varios | F0: borrar o reactivar explícitamente |
| B8 | Español hardcodeado fuera del i18n (Auth, Splash, nudge de resultados, banner de racha) | `Auth.tsx`, `SplashScreen.tsx:86-95`, `FinalResultScreen.tsx:351,452` | F0 |
| B9 | `types.ts` de Supabase desactualizado (faltan `host_finished`, `push_subscriptions`, `feature_flags`), casts `as any` | `src/integrations/supabase/types.ts` | F1: regenerar con `supabase gen types` |
| B10 | Falta `VITE_VAPID_PUBLIC_KEY` en `.env`; push no suscribe a nadie; `send-push` sin auth y sin quien lo llame | `notifications.ts:195`, `send-push/index.ts` | Fuera de alcance del rediseño; anotar. Necesario si algún día se notifican retos (hoy **no aprobado**) |
| B11 | Puntaje del rival legible en `game_rooms_public` aunque la UI lo oculte | migración `20260328185044` | El modelo de retos nuevo debe ocultarlo **en servidor** (criterio de aceptación 6 del consolidado) |
| B12 | Duelo no escribe historial ni stats; Caos no envía ranking | `Index.tsx:675-696` | F1: toda partida escribe `game_results` |
| B13 | Mundial guarda aciertos exactos en `avgDistance` | `WorldChallengeScreen.tsx:206-214` | F1 al rediseñar el modelo de historial |
| B14 | Ficha de tienda apunta a `geospeed.app/privacy` (dominio distinto al desplegado) | `store-listing/metadata.json:14-15` | Corregir al preparar la ficha |

---

## 4. Decisiones que el producto debe cerrar antes de desarrollar

El consolidado marca varias como "por definir". Aquí van con una **recomendación** para acelerar la decisión. Las marcadas 🔴 bloquean fases.

| # | Decisión | Opciones | Recomendación |
|---|---|---|---|
| D1 🔴 | **Identidad del invitado** (bloquea retos, historial nube, ranking personal) | (a) Obligar cuenta para retos. (b) **Supabase Anonymous Sign-in**: todo visitante recibe un `auth.uid()` al abrir; al registrarse se convierte la misma identidad (`updateUser` con email) y conserva todo. (c) Device id propio. | **(b).** Da RLS real por usuario desde el día 1, resuelve "continuar en otro dispositivo" al vincular, y evita el merge por blobs de `cloudSync`. Costo: habilitar en el dashboard + manejar límites de usuarios anónimos (limpieza periódica de anónimos inactivos). |
| D2 🔴 | **Set de ciudades del reto**: seed o lista explícita | Seed (como hoy) vs. lista de ciudades guardada en el reto | **Lista explícita** (`jsonb` con nombre, país, lat, lon). Inmune a cambios de `cities.ts`, permite revancha excluyendo ciudades usadas, y la comparación por ciudad no depende de recomputar nada. |
| D3 | Códigos de reto | Longitud, alfabeto, generación cliente vs servidor, códigos inválidos | Mantener 5 caracteres del alfabeto actual (32 símbolos, ~33 M combinaciones) pero **generar en servidor** con reintento ante colisión; mensaje genérico "código no válido o reto no disponible". Además de código, enlace `/reto/:code` que pre-rellena. |
| D4 | Caducidad y limpieza de retos e invitaciones | Sin caducidad / 7 días / 30 días | No fijar caducidad visible en v1 (no aprobada). Sí definir **limpieza técnica**: borrar retos sin ningún resultado a los 30 días; conservar los jugados. |
| D5 | **Criterio del ranking** | Mejor partida / acumulado / por periodo | **Mejor partida por combinación región × dificultad × modo**, con los filtros de periodo que ya existen. Mostrar posición propia con una RPC `rank_position(user_id, filtros)`. Sin torneos ni premios (no aprobados). |
| D6 | Día del Desafío diario | UTC (hoy) vs. hora local | Mantener UTC para que "las mismas ciudades para todos" sea literal, pero **mostrar la hora de cambio** en la tarjeta. Cambiar a local rompe la racha de usuarios actuales. |
| D7 | Uso de las 195 fotos de países | (a) Fondo/ilustración en feedback y revisión de ciudad. (b) Tarjeta del país en Mundial. (c) Nuevo modo "adivina el país por la foto". | **(a)+(b)** en v1: enriquecen EDU-01 y Mundial sin nueva mecánica. (c) queda fuera (sería un modo nuevo, no aprobado). Requiere añadir ISO-3166 a `countries.ts` y un mapa nombre→ISO para `cities.ts`. |
| D8 | Qué pasa con el duelo en vivo, espectador y emoji chat | Borrar / dejar oculto por flag | **Ocultar tras feature flag `live_duel_enabled=false`** al lanzar retos; borrar en una versión posterior si nadie lo pide. |
| D9 | Interrupción de partida en un reto | Reanudar / reiniciar / contar como abandono | v1: **si se cierra a mitad, el reto queda "te falta jugar" y se reinicia desde cero** con el mismo set (no se aprobó reanudación). Documentar en la pantalla de invitación. |
| D10 | Política de contraseña y verificación de correo | Mínimo 6 (hoy) / 8 + confirmación | 8 caracteres + confirmación (la maqueta ya la pide). Verificación de correo: mantener la de Supabase. |
| D11 | Alcance del rediseño sobre pantallas **sin maqueta** (Tienda, Sin vidas, Cofre diario, Battle Pass, Onboarding, cierres de Caos y Mundial, Perfil pestañas Niveles/Insignias) | Re-skin con los tokens nuevos / dejar como están / maquetar | **Re-skin con tokens** en F2 para no mezclar dos estéticas; maquetar solo Tienda y Sin vidas porque son las de conversión. |

---

## 5. Arquitectura propuesta para retos, historial y ranking

Diseño mínimo que cubre SOC-01..06, PRO-02, PRO-03 y EDU-01 con un solo modelo. Nombres orientativos.

### 5.1 Tablas nuevas

```
game_results            -- toda partida de cualquier modo (reemplaza history local + alimenta ranking)
  id uuid pk
  user_id uuid -> auth.users          (anónimo o registrado, D1)
  game_type text                      -- classic | timeattack | daily | mundial | speeddemon | challenge
  mode text, difficulty text          -- región y nivel
  score int, rounds_played int, rounds_total int
  avg_distance_km numeric null
  end_reason text                     -- complete | timeout | abandoned
  is_record bool
  challenge_id uuid null -> challenges
  created_at timestamptz

game_rounds             -- detalle por ciudad (EDU-01, SOC-04)
  result_id uuid -> game_results
  round_no int
  city_name text, city_country text, city_lat, city_lon
  click_lat, click_lon null
  distance_km numeric null, time_s numeric, base_points int, multiplier numeric, points int
  pk (result_id, round_no)

challenges              -- reto asincrónico (SOC-01)
  id uuid pk
  code text unique                    -- generado en servidor (D3)
  creator_id uuid -> auth.users
  opponent_id uuid null -> auth.users -- se fija al aceptar
  mode, difficulty, rounds_total, seconds_per_round
  cities jsonb                        -- lista explícita (D2)
  parent_challenge_id uuid null       -- revancha (SOC-05)
  status text                         -- open | active | completed | cancelled
  created_at, completed_at

challenge_participants  -- estado por jugador (SOC-06 "Mis retos")
  challenge_id, user_id
  role text                           -- creator | opponent
  accepted_at null, finished_at null
  result_id uuid null -> game_results
  pk (challenge_id, user_id)
```

### 5.2 Reglas de acceso (RLS) y ocultación del rival
- `game_results` / `game_rounds`: cada usuario lee y escribe **solo lo suyo**. La excepción es el rival de un reto **completado por ambos**, que puede leer el resultado y las rondas del otro. Se implementa con una función `can_view_result(result_id)` usada en la política SELECT.
- `challenges` y `challenge_participants`: legibles solo por sus participantes. Unirse por código pasa por una **Edge Function** `challenge-join` (el código no se expone en SELECT público). Así el puntaje del rival nunca es legible antes de tiempo (resuelve B11 y el criterio 6 del consolidado).
- Idempotencia (criterio 4): `challenge-join` y `challenge-create` aceptan un `client_request_id` y devuelven el mismo reto si se repite.

### 5.3 Vistas derivadas
- **Mis retos** = `challenge_participants` del usuario + estado calculado: por aceptar (`accepted_at null` y role opponent), te falta jugar (aceptado y `result_id null`), esperando al amigo (yo terminé, el otro no), resultado listo (ambos `finished_at`). Los contadores de los filtros salen de la misma consulta.
- **Historial** = `game_results` del usuario con filtros región/dificultad/tipo, paginado por cursor `created_at`.
- **Ranking** = vista materializada o consulta sobre `game_results` con `max(score)` por usuario y combinación; RPC `my_rank(mode, difficulty, period)` para la posición propia. La tabla `leaderboard` actual se congela y se migra.

### 5.4 Migración de datos existentes
- Al activar D1, el primer arranque sube `geospeed_history` (≤20 entradas) a `game_results` sin rondas y `geospeed_stats` a un resumen. XP se recalcula como suma de `score` en `game_results` desde ese momento + un `xp_legacy` igual al XP local actual, para que nadie baje de nivel (B3).

---

## 6. Plan por fases

Estimaciones en **días-desarrollador** para un equipo de 2 (1 front, 1 full-stack). Rango = incertidumbre, no holgura. La suma orientativa es **70-100 días-dev**, unas 8-12 semanas calendario con dos personas y solapando fases donde las dependencias lo permiten.

### F0 — Fundaciones (5-8 días) · sin dependencias
Objetivo: dejar el terreno listo para que el rediseño y los retos no choquen con deuda.
- Design tokens: pasar la paleta aprobada a CSS vars en `index.css` y eliminar hex hardcodeados (inventario en B7/UI-01). Preparar variante del mapa multicolor en `WorldMapCanvas`.
- Shell de navegación: barra inferior (móvil) y lateral (escritorio) montadas desde `Index.tsx`; las fases actuales se cuelgan de ella. Sin rediseñar aún cada pantalla.
- Pantalla de Ajustes con persistencia (`geospeed_prefs`): música, efectos (nuevo flag en `sounds.ts`), vibración (flag en `haptics.ts`), reducir movimiento (flag leído por `confetti`, `juiceAnimations`, `AutoDemo` además del media query), idioma, enlaces a Cómo jugar / Soporte / Privacidad.
- i18n de Auth, Splash y textos sueltos (B8). Borrado de código muerto (B7). Corregir B1 y B2.
- **Criterio de salida:** `npm run build` limpio, Lighthouse sin regresión, ningún hex de marca fuera de tokens.

### F1 — Identidad y persistencia (10-14 días) · requiere D1, D2, D5
- Activar Anonymous Sign-in; `useAuth` crea sesión anónima al arrancar; flujo de "vincular cuenta" en registro.
- Migraciones: `game_results`, `game_rounds`, RLS, RPC de ranking, función de migración local→nube (5.4).
- Toda partida (Clásico, Caos, Diario, Mundial, Imposible) escribe `game_results` + `game_rounds` al terminar. `cloudSync` deja de sincronizar `history`.
- XP acumulado en servidor (B3). Regenerar `types.ts` (B9).
- Cuenta: confirmar contraseña, errores genéricos (B5), **recuperación de contraseña completa** (ACC-02, 5 estados), ruta `/reset-password`.
- **Criterio de salida:** un invitado juega, se registra y conserva todo; una partida aparece en `game_results` con 13 filas de rondas; el reset de contraseña funciona de punta a punta en móvil y escritorio.

### F2 — Rediseño visual del núcleo (12-18 días) · requiere F0 y maquetas
Pantallas en orden de impacto sobre el jugador:
1. Splash (UI-02) y Home v2 móvil/escritorio (UI-03) con "Más modos" y tratamiento del jugador nuevo.
2. Paneles de región y dificultad con confirmación y selección persistida (UI-04).
3. Girar teléfono **antes** de la cuenta regresiva; congelar `timeUsed` mientras está en vertical; cuenta regresiva también en Duelo/deep link diario (UI-05).
4. Partida y feedback re-skin, mapa multicolor con etiquetas (UI-05, UI-06).
5. Cierres: tres estados reales, botón Nueva partida, récord también en timeout, mascota `sad` en timeout, cierres de Caos y Mundial unificados sobre FinalResultScreen (UI-07).
6. Tus respuestas por ciudad clicable + **Revisión de ciudad** con mapa (reactivar `ReplayMap` por ciudad, con touch) y pista (EDU-01). La pista requiere la tarea de contenido C1.
7. Tutorial de 3 pasos; "Entendido" vuelve sin iniciar partida; corregir onboarding/ghost-hand que arrancan partida solos (HELP-01).
8. Re-skin con tokens de Tienda, Sin vidas, Cofre, Battle Pass, Perfil (D11).
- **Criterio de salida:** paridad funcional con hoy + QA en móvil horizontal, móvil vertical (aviso), escritorio y ultrawide.

### F3 — Reto asincrónico (12-16 días) · requiere F1, D2, D3, D9
- Edge Functions `challenge-create` (código servidor, set de ciudades explícito), `challenge-join`, `challenge-finish`.
- Pantallas: Jugar con amigos v2, Invitación al reto (creador puede jugar sin esperar), partida de reto reutilizando `GameScreen` con `cities` fijas, Resultado pendiente, Resultado final victoria/derrota/empate, Comparación por ciudad, Revisión de mapa del reto con ambas respuestas.
- Deep link `/reto/:code` que pre-rellena el código.
- Ocultar duelo en vivo tras flag (D8). Job de limpieza (D4).
- **Criterio de salida:** los 7 criterios de aceptación del consolidado §3.2 pasan en pruebas; el rival no puede leer el puntaje ajeno vía API antes de terminar ambos (probar con `curl` y el anon key).

### F4 — Mis retos y Revancha (6-9 días) · requiere F3
- Bandeja Mis retos móvil/escritorio con filtros y contadores desde la misma consulta; estados por aceptar / te falta jugar / esperando / listo; estado vacío; distinguir error de carga de "cero retos".
- Accesos desde Home v2 y Perfil.
- Revancha: `parent_challenge_id`, condiciones heredadas, ciudades nuevas excluyendo las del padre (si no alcanzan, se permite repetir las menos recientes y se avisa), sin tocar el resultado original.
- **Criterio de salida:** doble clic no duplica; "Ahora no" conserva; recargar conserva todo.

### F5 — Perfil, Historial y Ranking (8-11 días) · requiere F1, D5
- Perfil: accesos a Historial, Ranking y Mis retos; racha; entrada con 0 partidas.
- Historial sobre `game_results`: filtros región/dificultad, orden reciente, estado, puntos, ciudades completadas, distancia media, detalle por ciudad (reusa EDU-01), cargar más, estado vacío y estado "sin coincidencias" (falta maqueta).
- Ranking: Top 10 con posición propia vía RPC, filtros región/dificultad, incluir Mundial y Caos (B2), nombre de jugador en vez de iniciales para registrados.
- **Criterio de salida:** posición propia correcta fuera del Top 10; filtros coherentes con los contadores.

### F6 — Catálogo, QA y cierre (6-9 días) · requiere D7
- Añadir ISO-3166 a `countries.ts` y mapa ciudad→ISO. Pipeline de optimización de las 195 fotos (WebP, 2 tamaños, lazy) y tabla/JSON de créditos visible en Privacidad o Soporte.
- Uso según D7 (feedback / revisión / tarjeta Mundial).
- QA transversal: estados vacíos, errores de red, modo reducir movimiento, daltónico, teclado y gamepad, PWA (subir `CACHE_NAME`), Lighthouse ≥ 90.
- Actualizar `store-listing/metadata.json` (nombre, URLs, B14) y capturas nuevas.

### Tareas de contenido en paralelo (no bloquean código hasta F2.6)
- **C1:** 420 pistas cortas por ciudad en ES y EN para `cities.ts` (campo `hint`/`hintEn`). Es lo que hace real la pantalla "Revisión de ciudad".
- **C2:** Unificar recurso maestro de mascota Explorador y sus 5 poses (idle, celebra, en llamas, triste, guiño) + variante "tranquila" de cierre completado. Exportar PNG/WebP a 2x y 3x.
- **C3:** Nombres de ciudades/países en inglés (hoy solo ES) si el rediseño se lanza bilingüe.
- **C4:** Paquete de 195 fotos con `paises.json` + `CREDITOS.txt` entregado al repo (fuera de `src/`, en `public/countries/`).

---

## 7. Maquetas que faltan (para la siguiente iteración)

Del propio consolidado:
- Mis retos vacío **computador**.
- Inicio de sesión **móvil** (no incluido en la aprobación de la entrada 64).
- Historial "filtro sin coincidencias" (móvil y computador).

Detectadas en la auditoría (pantallas que existen y el rediseño dejaría con la estética vieja, ver D11):
- Tienda, Sin vidas, Cofre diario, Battle Pass, Perfil pestañas Niveles e Insignias.
- Cierres de **60s de Caos** y **Mundial** (hoy son pantallas propias).
- Partida de Caos, Imposible y Mundial (variantes del HUD: reloj global, 5 s, país en vez de ciudad).
- Onboarding jugable (3 ciudades guiadas) y Campo de tiro.
- Pantalla de "ya jugaste el diario de hoy".
- Estados de error de red / sin conexión (hoy hay un banner en Home).

---

## 8. Riesgos

| Riesgo | Mitigación |
|---|---|
| Cambiar la paleta oscura premium por una clara puede bajar la percepción "juice" que ya mide 2.6+/3 en la auditoría de julio | Mantener los efectos (confeti, count-up, mascota, audio) intactos; validar la nueva paleta con la rúbrica de `Protocolo_Juice_GeoSpeed_vs_Duolingo.md` antes de F2.4 |
| Anonymous Sign-in crea un usuario por visitante nuevo; el plan gratuito de Supabase tiene límites de MAU | Limpieza programada de anónimos sin partidas >30 días; medir en soft launch |
| Retos sin notificación externa (no aprobada) dependen de que el amigo abra la app | Medir tasa de aceptación; si es baja, proponer push de "te retaron" como decisión separada (requiere B10) |
| El equipo implementa cifras ilustrativas de las maquetas (13 ciudades, #24, etc.) | Regla ya escrita en el consolidado §13; repetirla en cada ticket |
| Dos cierres distintos (Caos/Mundial) se rediseñan sin maqueta | D11 + maquetas de la sección 7 antes de F2.5 |

---

## 9. Próximos pasos

1. JuanJo cierra D1, D2, D5 y D7 (las que bloquean). Las demás pueden decidirse al entrar a cada fase.
2. Siguiente iteración: entrega de maquetas PNG. Se guardan en `docs/maquetas/` con los nombres del registro del apéndice A, y este plan se cruza pantalla por pantalla.
3. Con D1 decidida, arrancar F0 y F1 en paralelo (son independientes entre sí).
4. Pasar este plan a tickets por fase con los criterios de salida como "definition of done".
