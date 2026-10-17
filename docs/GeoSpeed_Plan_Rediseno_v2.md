# GeoSpeed — Plan de Rediseño v2 (juice + retos asincrónicos)

**Versión:** 1.1 · **Fecha:** 17 de octubre de 2026 · **Autor:** JuanJo + Claude (sesión de planificación)
**Fuentes:** `GeoSpeed_Ajustes_y_Sugerencias_Desarrollo_v1.md` (consolidado de maquetas aprobadas, 83 entradas) + auditoría del código real hecha el 17 oct 2026 sobre el commit `993cfd0` + revisión de las 80 maquetas entregadas el 17 oct.
**Maquetas:** `docs/maquetas/vigentes/` (73) y `docs/maquetas/historicas_NO_implementar/` (7), re-codificadas a JPG de 1400 px para el repo. Los PNG originales están en el zip `GeoSpeed_Maquetas_Aprobadas_2026-10-17.zip` en el computador de JuanJo. Índice en `docs/maquetas/INDICE.csv`.
**Estado:** Plan para validar con el equipo. No compromete fechas. Decisiones D1, D2, D5 y D7 cerradas el 17 oct (sección 4).

**Cambios v1.1:** sección 2b (hallazgos de las maquetas), D1 con análisis de costo, D2 especificada en detalle (4.1), corrección del riesgo de paleta (las maquetas son oscuras, no claras), tareas de contenido C5-C6.

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

## 2b. Hallazgos al revisar las maquetas (17 oct 2026)

Se revisaron 34 de las 80 imágenes (todas las móviles clave, Inicio y Partida de escritorio, isotipo). Las de escritorio restantes son gemelas de contenido de las móviles. Lo que cambia o precisa el plan:

**Dirección visual**
1. **La paleta es oscura.** Fondo azul marino profundo (≈ `#0B1F3A`), acentos amarillo (≈ `#FFD93B`) y turquesa (≈ `#19E6D2`), coral puntual para error/tiempo. Es una **evolución del tema `neon` actual** (navy + dorado + teal), no un salto a tema claro. Baja el riesgo de UI-01 y el de perder "juice". El cambio grande es el **mapa multicolor por continente** con etiquetas de continentes y océanos.
2. **Mascota:** conviven tres estilos. El vigente es el **pin amarillo con gema turquesa y aletas** (isotipo + casi todas las pantallas). Ajustes, Iniciar sesión y Crear cuenta usan un pin con sombrero de explorador y chaqueta, y un logotipo con brújula; las tres llevan marca de agua "Propuesta visual". Confirmar que el maestro es el pin con gema y re-dibujar esas tres con él (tarea C2). Poses que las maquetas requieren: idle, guiño, celebra con trofeo, preocupada (derrota y tiempo agotado), leyendo libro (historial), con mapa (reto), con sobre (invitación), con portapapeles (Mis retos), tranquila (cierre completado).
3. En los cierres el logo-mascota del encabezado aparece con cara preocupada incluso en "Nuevo récord". En implementación el logo del header es neutro; la emoción va en la tarjeta.

**Navegación y shell**
4. **Barra inferior de 5 pestañas:** Inicio · Progreso · Tienda · Pass · Perfil. "Progreso" es el hub de Historial, Ranking y Mis retos (esas tres pantallas la muestran activa). En escritorio la misma barra va arriba. La maqueta "Más modos" muestra solo 3 pestañas: inconsistencia, usar 5.
5. Encabezado de Home: vidas como corazones, avatar + nombre, engranaje → Ajustes. En partida: sonido, engranaje, cerrar; y controles de zoom −/+/centrar abajo a la derecha (hoy el zoom es solo por gesto).
6. **Selectores:** en Home son dropdowns que abren un bottom sheet (Región / Dificultad). Textos de la maqueta: Turista "Megaciudades icónicas", Rookie "Capitales del mundo", Crack "Ciudades regionales", Leyenda "¿Dónde queda eso?!"; regiones con subtítulo. Debajo: "13 ciudades · 15 s por ciudad" (debe ser dinámico por modo). La maqueta **no muestra los candados por nivel** que hoy bloquean regiones y dificultades: decidir si se muestran bloqueados con candado o se eliminan (D12).
7. **Home del jugador nuevo:** hay una sola maqueta de Inicio. Hoy el jugador con 0 partidas no ve modos ni selectores. Recomendación: mostrarle todo con el banner "¿Cómo se juega?" expandido y el tutorial de 3 pasos como primer CTA secundario (D13).

**Datos y contenido que las maquetas dan por hechos**
8. **Banderas por país** en Tus respuestas por ciudad, Comparación y Revisión → hace falta ISO-3166 por ciudad (tarea C5: mapear las 420 ciudades a ISO; usar banderas emoji o un set SVG).
9. **Fotos en Comparación por ciudad** (Tokio, Roma, Lima): la maqueta usa fotos de ciudad; el catálogo de JuanJo es de **países**. Con D7 se usa la foto del país de la ciudad. Aclararlo al equipo para que nadie busque 420 fotos de ciudades.
10. **Revisión de ciudad** muestra el mapa con zoom al país, fronteras de vecinos y **nombres de países en español** (CHILE, PARAGUAY, BRASIL). `countries.ts` tiene nombres en inglés y sin centroide → tarea C6: nombre ES/EN + centroide para etiquetas, en el mismo archivo donde se añade el ISO.
11. "Ver cálculo" (feedback y revisión) → desglose base × velocidad × racha × dificultad. La lógica existe en `gameUtils.ts`; la UI es nueva.
12. Feedback: "Avanza en 2 s" (hoy 3 s, `AUTO_ADVANCE_SECONDS`). Recomendación: 2,5 s y controlado por feature flag.
13. **Avatares y nombres:** el ranking muestra avatares ilustrados de personas con nombre completo; los retos muestran mascotas de colores por jugador (amarilla tú, turquesa/blanca el rival). Hoy el avatar es un emoji y el ranking usa 3 iniciales. Se necesita un **sistema de avatares** (set de 8-12 exploradores de colores) + `display_name` para registrados; invitados anónimos como "Explorador 1234". Entra en F1.
14. Código de reto ilustrado "GEO742" (prefijo + 3 dígitos = 1.000 combinaciones). Es ilustrativo. Se mantiene D3 (5 caracteres) mostrándolo como `GEO-XXXXX` donde el prefijo es solo visual.
15. Historial agrupado por "Hoy / Ayer / fecha", con hora, badge de estado (Completada / Tiempo agotado) y ciudades N/13. Confirma la necesidad de `end_reason` y `rounds_played` en `game_results`.
16. Ranking: Top 10 con nombres y la fila propia "#24 · Tú" fuera de la lista. Confirma la RPC de posición propia.

**Flujo**
17. Girar teléfono: "La cuenta regresiva empieza después" confirma el orden girar → cuenta → partida (hoy es al revés).
18. Cuenta regresiva muestra "Clásico · Mundo · Turista" y un botón Cancelar (hoy no hay cancelar).
19. Carga: barra con texto "Preparando tu próxima aventura…". Puede atarse a carga real de assets (mapa, mascota, audio) en vez de los 3 s fijos actuales.
20. Perfil muestra la etiqueta "Explorador" bajo el nombre (rango o título). Hoy el título viene del nivel ("Deidad Geo"); definir si "Explorador" es texto fijo o el título de nivel (D14, trivial).

**Nuevas decisiones menores añadidas a la sección 4:** D12 candados por nivel, D13 Home del jugador nuevo, D14 etiqueta del perfil.

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
| D1 ✅ | **Identidad del invitado** (bloquea retos, historial nube, ranking personal) | (a) Obligar cuenta para retos. (b) **Supabase Anonymous Sign-in**: todo visitante recibe un `auth.uid()`; al registrarse se convierte la misma identidad y conserva todo. (c) Device id propio. | **Decidido 17 oct: (b), con la condición de JuanJo "si y solo si no tiene costo".** Análisis de costo abajo (4.0). Conclusión: costo cero hasta 50.000 usuarios activos al mes; se implementa con tres salvaguardas para que siga siendo cero. |
| D2 ✅ | **Set de ciudades del reto**: seed o lista explícita | Seed (como hoy) vs. lista de ciudades guardada en el reto | **Decidido 17 oct: lista explícita.** Especificación completa en 4.1. |
| D3 | Códigos de reto | Longitud, alfabeto, generación cliente vs servidor, códigos inválidos | Mantener 5 caracteres del alfabeto actual (32 símbolos, ~33 M combinaciones) pero **generar en servidor** con reintento ante colisión; mensaje genérico "código no válido o reto no disponible". Además de código, enlace `/reto/:code` que pre-rellena. |
| D4 | Caducidad y limpieza de retos e invitaciones | Sin caducidad / 7 días / 30 días | No fijar caducidad visible en v1 (no aprobada). Sí definir **limpieza técnica**: borrar retos sin ningún resultado a los 30 días; conservar los jugados. |
| D5 ✅ | **Criterio del ranking** | Mejor partida / acumulado / por periodo | **Decidido 17 oct:** mejor partida por combinación región × dificultad × modo, con los filtros de periodo que ya existen. Posición propia con RPC `my_rank(mode, difficulty, period)`. Sin torneos ni premios (no aprobados). |
| D6 | Día del Desafío diario | UTC (hoy) vs. hora local | Mantener UTC para que "las mismas ciudades para todos" sea literal, pero **mostrar la hora de cambio** en la tarjeta. Cambiar a local rompe la racha de usuarios actuales. |
| D7 ✅ | Uso de las 195 fotos de países | (a) Fondo/ilustración en feedback y revisión de ciudad. (b) Tarjeta del país en Mundial. (c) Nuevo modo "adivina el país por la foto". | **Decidido 17 oct: (a)+(b).** Además, la foto del país se usa en la tarjeta de **Comparación por ciudad** (la maqueta muestra fotos de ciudad; se sustituyen por la del país, ver 2b.9). (c) queda fuera. Requiere ISO-3166 en `countries.ts` y mapa ciudad→ISO (tareas C5/C6). |
| D8 | Qué pasa con el duelo en vivo, espectador y emoji chat | Borrar / dejar oculto por flag | **Ocultar tras feature flag `live_duel_enabled=false`** al lanzar retos; borrar en una versión posterior si nadie lo pide. |
| D9 | Interrupción de partida en un reto | Reanudar / reiniciar / contar como abandono | v1: **si se cierra a mitad, el reto queda "te falta jugar" y se reinicia desde cero** con el mismo set (no se aprobó reanudación). Documentar en la pantalla de invitación. |
| D10 | Política de contraseña y verificación de correo | Mínimo 6 (hoy) / 8 + confirmación | 8 caracteres + confirmación (la maqueta ya la pide). Verificación de correo: mantener la de Supabase. |
| D11 | Alcance del rediseño sobre pantallas **sin maqueta** (Tienda, Sin vidas, Cofre diario, Battle Pass, Onboarding, cierres de Caos y Mundial, Perfil pestañas Niveles/Insignias) | Re-skin con los tokens nuevos / dejar como están / maquetar | **Re-skin con tokens** en F2 para no mezclar dos estéticas; maquetar solo Tienda y Sin vidas porque son las de conversión. |
| D12 | Candados por nivel en región y dificultad (hoy Europa Nv2 … África Nv5; Rookie Nv2, Crack Nv4, Leyenda Nv6). Las maquetas no los muestran. | Mantener con candado visible / quitar | Mantener, con candado + "Nivel N" en la opción del bottom sheet. Quitarlos cambia la progresión, que no fue parte del rediseño. |
| D13 | Home del jugador nuevo (0 partidas) | Ocultar modos como hoy / mostrar todo | Mostrar todo con el banner "¿Cómo se juega?" expandido. El onboarding jugable se ofrece al primer "Jugar ahora", como hoy. |
| D14 | Etiqueta "Explorador" bajo el nombre en Perfil | Texto fijo / título de nivel | Título de nivel (ya existe: Novato … Deidad Geo). "Explorador" era ilustrativo. |

### 4.0 D1 en detalle: ¿cuánto cuesta Anonymous Sign-in?

Verificado el 17 oct 2026 en la documentación y precios de Supabase:

- **Anonymous Sign-ins está incluido en el plan Free.** No es una función de pago.
- **Cómo cobra Supabase la autenticación:** por "usuarios activos mensuales" (MAU), que son los usuarios distintos que inician sesión o refrescan su token en el ciclo de facturación, contados una sola vez. La documentación no excluye a los usuarios anónimos, así que **hay que asumir que un anónimo que juega en el mes cuenta como 1 MAU.**
- **Cuotas:** Free incluye **50.000 MAU** sin cargo. Pro (25 USD/mes) incluye 100.000 y cobra 0,00325 USD por MAU adicional. A escala del plan de lanzamiento (10K-25K usuarios activos diarios en el caso base) el consumo de MAU puede acercarse al tope Free en el mejor escenario; en ese punto GeoSpeed ya estaría facturando y el salto a Pro se justificaría por otras razones (soporte, backups).
- **Otro costo indirecto:** cada anónimo es una fila en `auth.users`. Sin limpieza, un bot puede inflar la base. Supabase no limpia anónimos automáticamente.

**Conclusión:** la condición "sin costo" se cumple hoy y hasta 50.000 jugadores activos al mes. Para que siga cumpliéndose se implementa así:

1. **Sesión anónima perezosa:** no se crea al abrir la app, sino al terminar la primera partida (o al tocar "Jugar con amigos"/"Perfil"). Un visitante que rebota sin jugar no consume MAU ni crea fila.
2. **Limpieza semanal** (cron de Supabase, gratis): borrar `auth.users` anónimos con más de 30 días y sin filas en `game_results`. Los que sí jugaron se conservan.
3. **Protección anti-abuso:** mantener el límite por IP que trae Supabase (30 altas anónimas/hora) y activar Cloudflare Turnstile invisible (gratis) en el alta anónima.
4. **Vinculación a cuenta:** `updateUser({email})` + verificación + `updateUser({password})` para correo, o `linkIdentity` para Google/Apple. Requiere activar "manual linking" en el dashboard (gratis). Si el correo ya existe en otra cuenta, se inicia sesión en esa y se **migran** los `game_results` del anónimo con una función de servidor; no se pierden partidas.
5. **Alarma:** panel de uso de Supabase con aviso al 70 % de la cuota de MAU.

### 4.1 D2 en detalle: lista explícita de ciudades en el reto

**Qué pasa hoy con el seed.** En el duelo solo se guarda un entero `seed`. Cada teléfono ejecuta `getRandomCities(dificultad, 13, región, seed)` y confía en que el otro obtendrá la misma lista. Eso solo es cierto si **ambos clientes tienen exactamente el mismo `cities.ts` y el mismo algoritmo de barajado.** Se rompe cuando:
- Se despliega una versión que añade, quita o reordena una ciudad (el índice barajado apunta a otra ciudad).
- Un jugador tiene la PWA en caché vieja y el otro la nueva, o uno usa la app Android y el otro la web.
- Se ajusta la mezcla de dificultades de `getProgressiveCities`.
En un reto asincrónico, donde pueden pasar días entre la partida de uno y la del otro, cualquiera de esas tres cosas es probable. Además, con seed no se puede excluir ciudades para la revancha, ni mostrar "13 ciudades nuevas", ni comparar por ciudad sin recomputar.

**Qué se guarda en su lugar.** Al crear el reto se fija la lista y se guarda en la columna `challenges.cities` como JSON:

```json
[
  { "n": 1, "name": "Tokio",        "country": "Japón",     "iso": "JP", "lat": 35.6762, "lon": 139.6503 },
  { "n": 2, "name": "Buenos Aires", "country": "Argentina", "iso": "AR", "lat": -34.6037, "lon": -58.3816 },
  …
]
```
Unos 100 bytes por ciudad, ~1,3 KB por reto de 13. Un millón de retos ocuparían ~1,3 GB; a la escala real es despreciable.

**Quién elige la lista.** El cliente del creador, que ya tiene el catálogo y la lógica de mezcla. Envía la lista a la Edge Function `challenge-create` junto con `catalog_version` (hash de `cities.ts` generado en build). El servidor valida forma y cantidad (13 entradas, campos completos, coordenadas en rango) y la guarda tal cual. No hace falta mover el catálogo al servidor. La equidad no depende de quién la eligió: ambos juegan la misma lista.

**Cómo juega cada uno.** `GameScreen` recibe una prop nueva `cities: City[]` que sustituye al par `seed`/`getRandomCities`. Es el mismo cambio que necesita "Repetir estas ciudades" (hoy pasa `replayCities`), así que se unifica: una sola vía para "jugar esta lista concreta".

**Revancha.** Se toma `parent.cities`, se excluyen esos nombres del pool de la misma región y dificultad, y se eligen 13 nuevas. Si el pool restante no alcanza (pasa en regiones de 60 ciudades tras varias revanchas), se completan con las excluidas más antiguas y la invitación dice "N ciudades nuevas" con el número real, nunca el fijo de la maqueta.

**Comparación y revisión por ciudad.** Como `game_rounds` guarda por fila el clic de cada jugador y la ciudad viene de `challenges.cities`, la pantalla de comparación es una consulta sin recomputar nada, y sigue siendo correcta aunque la ciudad cambie de coordenadas en el catálogo años después.

**Lo que NO cambia.** El Desafío diario sigue usando el seed de la fecha: todos juegan el mismo día con el mismo build. Tiene la misma fragilidad si se despliega a mitad del día; si se quiere blindar, se guarda el set del día en una tabla `daily_sets(date, cities)` la primera vez que alguien lo genera. Es una mejora pequeña y queda anotada para F5.

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

### F0 — Fundaciones (5-8 días) · sin dependencias · ✅ HECHA el 17 oct 2026 (rama `feat/f0-fundaciones`)
Entregado: tokens de marca en `index.css` + espejo `theme.ts` para canvas (0 hex de marca fuera de ahí salvo páginas legales y `countries.ts`), componente `Wordmark`, `prefs.ts` + pantalla de Ajustes (música, efectos, vibración, reducir movimiento, daltónico, idioma, ayuda, legales, cuenta), barra de navegación de 5 pestañas (`AppNav`), i18n de Auth/Splash/avisos sueltos, código muerto borrado, B1 y B2 corregidos, `sw.js` v83. Pendiente de F0 que pasa a F2: paleta multicolor del mapa (`WorldMapCanvas` conserva sus colores de continente actuales).
Objetivo: dejar el terreno listo para que el rediseño y los retos no choquen con deuda.
- Design tokens: pasar la paleta aprobada a CSS vars en `index.css` y eliminar hex hardcodeados (inventario en B7/UI-01). Preparar variante del mapa multicolor en `WorldMapCanvas`.
- Shell de navegación: barra inferior (móvil) y lateral (escritorio) montadas desde `Index.tsx`; las fases actuales se cuelgan de ella. Sin rediseñar aún cada pantalla.
- Pantalla de Ajustes con persistencia (`geospeed_prefs`): música, efectos (nuevo flag en `sounds.ts`), vibración (flag en `haptics.ts`), reducir movimiento (flag leído por `confetti`, `juiceAnimations`, `AutoDemo` además del media query), idioma, enlaces a Cómo jugar / Soporte / Privacidad.
- i18n de Auth, Splash y textos sueltos (B8). Borrado de código muerto (B7). Corregir B1 y B2.
- **Criterio de salida:** `npm run build` limpio, Lighthouse sin regresión, ningún hex de marca fuera de tokens.

### F1 — Identidad y persistencia (10-14 días) · requiere D1, D2, D5 · 🟡 PARTE SIN DASHBOARD HECHA el 17 oct 2026 (rama `feat/f1-identidad`)
Hecho: migración `game_results` + `game_rounds` + RPCs (`save_game_result`, `my_progress`, `my_rank`, `leaderboard_top`, `import_legacy_history`, `update_my_profile`, `cleanup_anonymous_users`), toda partida de todos los modos se guarda en servidor con cola offline, migración del historial local al primer login, tipos de Supabase al día (`tsc` limpio), recuperación de contraseña completa (5 estados), confirmar contraseña, mínimo 8, errores genéricos (B5). Pendiente hasta que JuanJo active el dashboard: sesión anónima perezosa, vinculación anónimo→cuenta, selector de avatares, y aplicar la migración (`supabase db push`).
- Activar Anonymous Sign-in; `useAuth` crea sesión anónima al arrancar; flujo de "vincular cuenta" en registro.
- Migraciones: `game_results`, `game_rounds`, RLS, RPC de ranking, función de migración local→nube (5.4).
- Toda partida (Clásico, Caos, Diario, Mundial, Imposible) escribe `game_results` + `game_rounds` al terminar. `cloudSync` deja de sincronizar `history`.
- XP acumulado en servidor (B3). Regenerar `types.ts` (B9).
- Cuenta: confirmar contraseña, errores genéricos (B5), **recuperación de contraseña completa** (ACC-02, 5 estados), ruta `/reset-password`.
- **Criterio de salida:** un invitado juega, se registra y conserva todo; una partida aparece en `game_results` con 13 filas de rondas; el reset de contraseña funciona de punta a punta en móvil y escritorio.

### F2 — Rediseño visual del núcleo (12-18 días) · requiere F0 y maquetas · 🟡 EN CURSO (rama `feat/f2-home-v2`, 17 oct 2026)
Hecho (bloque 1): Inicio v2 móvil y escritorio (banner Cómo se juega, Tu próxima aventura con hojas de región/dificultad y candados visibles, tarjetas de acceso, tarjeta de nivel con ranking/historial/insignias), pantalla Más modos, pantalla Cómo jugar de 3 pasos (Entendido no inicia partida).
Hecho (bloque 2): aviso de girar antes de la cuenta regresiva con la cuenta en pausa en vertical y devolución de vida al cancelar; cuenta regresiva con "¡Prepárate!", etiqueta de modo, mascota y Cancelar; el tiempo en pausa ya no cuenta para el multiplicador; cierre de partida con tres estados (récord, tiempo agotado, completada), mascota por estado, dos columnas en escritorio, Nueva partida y Repetir estas ciudades.
Hecho (bloque 3): mapa multicolor por continente con etiquetas de continentes y océanos, botones de zoom, pines "Tu respuesta" (amarillo) y "Ciudad correcta" (turquesa), HUD de partida según maqueta en móvil horizontal y en escritorio con panel lateral, tarjeta de feedback con "Ver cálculo", botón de salir y música dentro de la partida.
Hecho (bloque 4): 60s de Caos y Mundial usan el mismo HUD, cuenta regresiva, aviso de girar y cierre que el Clásico (título "¡Tiempo cumplido!", resumen, detalle por ronda, REINTENTAR / JUGAR DE NUEVO, compartir); se quitaron textos fijos en español de esos cierres.
Hecho (ajuste móvil): todas las ventanas caben o hacen scroll en celular horizontal (probado a 667×375 y 568×320): Sin vidas en dos columnas, oferta Pro, cofre diario, selección de Caos y Mundial, hojas de región y dificultad, cuenta regresiva, splash, inicio de sesión y tarjeta de feedback; barra inferior más baja en horizontal; el permiso de notificaciones ya no se superpone al cierre; textos de ofertas y del aviso de distancia traducidos.
Hecho (bloque 5, revisión por ciudad): desde el cierre se abre "Tus respuestas por ciudad" (tabla paginada con banderas y "Mejor") y "Revisa tu ubicación" (mapa encuadrado en la respuesta y la ciudad, pista para recordarla, ver cálculo, navegación sin tiempo). Banderas SVG locales para los 162 países del catálogo (C5 mínimo). Las pistas se generan con datos del catálogo mientras llega C1; las escritas a mano tienen prioridad.
Siguen: re-skin de tienda y modales, splash con arte final.
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
- **C5:** Código ISO-3166 alfa-2 para cada una de las 420 ciudades (campo `iso` en `cities.ts`). Habilita banderas y la foto del país.
- **C6:** En `countries.ts`: ISO, nombre en ES y EN, y centroide (lat, lon) por país, para las etiquetas de la Revisión de ciudad y el mapa comparativo.

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
| El re-skin puede bajar la percepción "juice" que ya mide 2.6+/3 en la auditoría de julio (la paleta nueva sigue siendo oscura, así que el riesgo está en los efectos, no en el color) | Mantener los efectos (confeti, count-up, mascota, audio) intactos; validar la nueva piel con la rúbrica de `Protocolo_Juice_GeoSpeed_vs_Duolingo.md` antes de F2.4 |
| Tres estilos de mascota conviven en las maquetas (2b.2); el equipo puede producir assets del estilo equivocado | Cerrar C2 (maestro = pin con gema) antes de que nadie exporte assets; re-dibujar Ajustes, Login y Crear cuenta |
| Anonymous Sign-in crece en MAU y filas sin control | Salvaguardas de 4.0: sesión perezosa, limpieza semanal, Turnstile, alarma al 70 % |
| Anonymous Sign-in crea un usuario por visitante nuevo; el plan gratuito de Supabase tiene límites de MAU | Limpieza programada de anónimos sin partidas >30 días; medir en soft launch |
| Retos sin notificación externa (no aprobada) dependen de que el amigo abra la app | Medir tasa de aceptación; si es baja, proponer push de "te retaron" como decisión separada (requiere B10) |
| El equipo implementa cifras ilustrativas de las maquetas (13 ciudades, #24, etc.) | Regla ya escrita en el consolidado §13; repetirla en cada ticket |
| Dos cierres distintos (Caos/Mundial) se rediseñan sin maqueta | D11 + maquetas de la sección 7 antes de F2.5 |

---

## 9. Próximos pasos

1. ~~JuanJo cierra D1, D2, D5 y D7.~~ Cerradas el 17 oct. Quedan abiertas D3, D4, D6, D8-D14; ninguna bloquea F0 ni F1.
2. ~~Entrega de maquetas.~~ Entregadas y guardadas en `docs/maquetas/`. Pendientes las de la sección 7 (sobre todo Tienda y Sin vidas) y la unificación de mascota (C2).
3. JuanJo confirma con el equipo de diseño: mascota maestra (2b.2), 5 pestañas de navegación (2b.4), candados por nivel (D12).
4. Arrancar **F0 y F1 en paralelo**. F1 empieza por activar Anonymous Sign-in + manual linking en el dashboard de Supabase (JuanJo, 5 minutos) y por la migración `game_results` / `game_rounds`.
5. Arrancar en paralelo las tareas de contenido C1 (pistas), C5 (ISO por ciudad) y C6 (países ES/EN + centroides): no necesitan código y desbloquean F2.6 y F6.
6. Pasar este plan a tickets por fase con los criterios de salida como "definition of done".
