# GeoSpeed · Conquista el mapa — revisión y plan por fases

2026-10-26. Estado: **plan para aprobar**. Fuente: `docs/GeoSpeed_Conquista_Especificacion_v1.1.md` (transcripción del
.docx de JuanJo) y las maquetas `docs/maquetas/conquista/`. Este documento revisa la especificación contra el código
actual, verifica la auditoría del juego público (AUD01–AUD08) y propone cómo construirlo por fases. Las reglas aprobadas
en la especificación no se vuelven a discutir; solo se piden las decisiones que la especificación no cubre o que el
código actual obliga a tomar (sección 7).

## 1. Resumen

- **La especificación es sólida y se puede construir con lo que ya hay.** Las piezas difíciles (invitaciones con código,
  reloj del servidor sin Realtime, preguntas entregadas una a una sin coordenadas, puntaje recalculado en el servidor,
  pruebas del SQL en PGlite, mapa con encuadre por país, insignias y cosméticos) ya existen en Retos, Sala en vivo,
  Sprint y la Fase 9. Conquista es sobre todo **un modelo de datos nuevo y sus reglas**, más seis pantallas.
- **Un bloqueo real: el catálogo.** De los diez países aprobados, Brasil, España, Francia e Italia tienen hoy entre 3 y 7
  ciudades en total (una sola "Turista" cada uno) y Ecuador/Perú pocas de nivel Turista. Hay que curar un banco de
  ciudades antes de poder iniciar una temporada (sección 3.1).
- **Dos decisiones que el código obliga a tomar:** si pueden jugar sesiones de invitado (las cuentas anónimas se borran a
  los 30 días de inactividad) y qué hacer con los avisos externos (hoy no hay canal push: falta la clave VAPID en la web
  y Firebase en la app).
- **Auditoría:** 7 de los 8 hallazgos se confirman en el código y tienen causa ubicada; son arreglos pequeños que pueden
  salir antes de Conquista (fase C0). AUD04 (Mercado Pago) necesita una prueba de JuanJo.

## 2. Qué se reutiliza

| Necesidad de Conquista | Ya existe | Dónde |
|---|---|---|
| Código de invitación, vista previa sin datos privados, unión idempotente | Retos (código de 5, `challenge_preview`/`challenge_join`), Sala (PIN, cupos, sala de espera) | `challenges.ts`, `rooms.ts`, `RoomScreens.tsx` |
| Cupos atómicos y transacciones en el servidor | Sala en vivo (≤ 20, `room_join` en transacción) | `20261106120000_rooms.sql` |
| Reloj del servidor en el cliente, sin Realtime | `serverNow()`, `noteServerTime`, sondeo con pausa en segundo plano | `rooms.ts` |
| Entregar la pregunta sin coordenadas y revelar al cerrar la ronda | `room_state` (solo el ítem actual, sin coordenadas) | Sala en vivo |
| Distancia Haversine R = 6.371 km y coordenadas oficiales | `geo_distance_km`, tabla `places` | Fase 1 |
| Pruebas del SQL con reloj y cuentas simuladas | PGlite con auth simulada (`pgtest/*.mjs`), paridad TS ↔ SQL | Fases 1–11 |
| Mapa encuadrado en un país, bordes 1:50m, zoom y arrastre, marcadores | `WorldMapCanvas` (`viewBounds`, `highlightCountry`, `markers`, `mapView.ts`) | Fases 6–7 |
| Tarjeta de respuesta con distancia, tiempo, puntos y SIGUIENTE | `RoundFeedbackCard` (`quick`, sin combo si no se pasa) | Clásico/Caos |
| Bandeja de actividad con no leídos | Bandeja de Sprint (`sprint_inbox_seen`) | Fase 5 |
| Insignias y cosméticos ganados | `user_badges`, `_cosmetic_badge`, `CosmeticsPicker` | Fases 2 y 9 |
| Recordatorios locales con permiso | `streakReminder.ts` (notificación local nativa), recordatorios web | Fase 2 |
| Bandera remota + beta por dispositivo | `featureFlags.ts`, `roomsBeta.ts` (`?salas=beta`) | Sala en vivo |
| Exigir cuenta registrada | Puerta de Sprint (registrado + partidas mínimas) | Fase 5 |
| Pin oficial, banderas, fotos de ciudades y países | Explorador, `public/flags`, `public/cities`, `public/countries` | F2, Fase 6 |

**No se reutiliza:** la carrera contra el fantasma (la especificación prohíbe comparar el parcial propio con un parcial
rival) ni la fórmula de puntaje v2 (Conquista tiene la suya, sin combos ni dificultad).

## 3. Revisión de la especificación

### 3.1 Bloqueante: banco de ciudades por país

La especificación pide al menos cinco ciudades verificadas por país, nivel Turista para todos, y un paquete nuevo por
temporada ("si el catálogo solo tiene cinco ciudades, al menos cambia el orden y debe ampliarse el banco"). Hoy:

| País | Ciudades en el juego | De nivel Turista | Origen |
|---|---|---|---|
| Colombia | 152 | 24 | pack Colombia |
| México | 60 | 17 | mundo + pack México-Centroamérica |
| Argentina | 39 | 9 | mundo + pack Cono Sur |
| Perú | 34 | 4 | mundo + pack Andes |
| Chile | 30 | 4 | mundo + pack Cono Sur |
| Ecuador | 25 | 2 | mundo + pack Andes |
| **Brasil** | **7** | **1** (Río) | mundo |
| **Italia** | **4** | **1** (Roma) | mundo |
| **España** | **3** | **1** (Madrid) | mundo |
| **Francia** | **3** | **1** (París) | mundo |

Propuesta (CQ-D2): un **banco de 12 ciudades por país** "conocidas dentro del país" (capital, grandes ciudades y las muy
turísticas), con nombre ES/EN, coordenadas de Wikidata y país verificado (P17). Con 12 hay dos paquetes de cinco
distintos más un reordenamiento antes de repetir ciudades. Se reutilizan las que ya existen (ids `co:`, `ci:` y del
mundo) y se agregan las que faltan con el mismo proceso de los packs Pro (Natural Earth + Wikidata). Va con documento
de revisión para que JuanJo apruebe la lista, como en las fases 6–7. Nota: Perú, Ecuador, Chile, Argentina y México
toman ciudades de los packs Pro; en Conquista se juegan gratis (son 12 por país), coherente con "sin pagos en esta
modalidad".

### 3.2 Huecos y cómo los resolvemos

Lo que sigue no contradice la especificación; la completa donde el código obliga a escoger. Salvo lo marcado como
decisión, se aplica la propuesta.

1. **Cuentas (decisión CQ-D1).** La especificación dice "cuenta autenticada". En GeoSpeed una sesión de invitado también
   está autenticada, pero `cleanup_anonymous_users()` la borra a los 30 días sin uso: un integrante podría desaparecer
   en plena temporada. Propuesta: **solo cuentas registradas** (como Sprint); el invitado que abre el enlace ve la
   propuesta y entra o crea su cuenta conservando el destino.
2. **Avisos externos (decisión CQ-D3).** No hay canal push hoy (web: falta `VITE_VAPID_PUBLIC_KEY`; app: Firebase no está
   integrado). Propuesta v1: la actividad dentro del juego con contador de no leídos, y los recordatorios de 24 h y 1 h
   antes del cierre como **notificaciones locales** programadas en el dispositivo (con permiso, se cancelan al silenciar).
   El aviso "perdiste un territorio" fuera del juego llega cuando exista push.
3. **Mapa de la misión.** Encuadrado en el país, como la maqueta 03: bordes 1:50m, sin nombres de ciudades, zoom y
   arrastre. Francia se encuadra sin territorios de ultramar. Donde ya hay divisiones (Colombia, Perú, Ecuador, Chile,
   Argentina, México) se pueden dibujar como ayuda visual.
4. **Grupos por persona.** La especificación no lo limita. Propuesta: hasta **3 grupos activos** por cuenta y 10 grupos
   creados por día (freno de abuso).
5. **Práctica.** El cliente no puede saber cuáles son las ciudades oficiales (son privadas), así que el servidor entrega
   cinco ciudades del banco que **no** estén en el paquete oficial. Puntaje local, no consume misiones, no se guarda.
6. **Entre rondas.** Para no perder una conquista por un aviso de red, la misión **se finaliza sola** al recibir la quinta
   respuesta (o al vencer la quinta ronda); no hay un paso "finalizar" separado. El cliente pide la siguiente ronda al
   pulsar SIGUIENTE o a los 3 s. Si la reserva de 3 minutos vence con rondas sin abrir, el intento expira sin conquistar,
   como dice la especificación (5 × 15 s + respuestas cabe con holgura en 3 min).
7. **Latencia.** Se aplica la regla aprobada (tiempo medido en el servidor). La fase de QA mide en iPhone y Android cuánto
   pesa la red; si distorsiona, se ajusta con una nueva `rules_version` entre temporadas, nunca dentro de una.
8. **Reloj de QA.** La "temporada acelerada con reloj controlado" se hace de dos formas: en PGlite con un reloj simulado
   (todos los criterios dependientes del tiempo), y en producción con un factor `time_scale` que solo se puede fijar por
   SQL para el grupo de prueba (p. ej. un día = 10 minutos, con todas las ventanas proporcionales).
9. **Baja de cuenta en plena temporada.** "Conserva resultados anonimizados": sus territorios quedan con su marca a nombre
   de "Jugador retirado", no suman para nadie y se pueden atacar normalmente. `delete_my_account` se ajusta para eso.
10. **Colores de rivales.** Amarillo = propio. Hasta 4 rivales con color, inicial y patrón distintos (también en modo
    daltónico).
11. **Nueva temporada.** "Requiere confirmación de participación": en la sala cada integrante pulsa "Participo"; el
    administrador inicia con al menos dos confirmados.

### 3.3 Correcciones menores al documento y las maquetas

- El registro de decisiones dice "Juan José **Grillo**"; en el proyecto figura JuanJo **Grimar**. Confirmar el nombre.
- Maqueta 02: "Mismas reglas para ambos" → "Mismas reglas para todos" (grupos de hasta 5).
- Maqueta 03: en un país libre el recuadro rival debe decir "Para capturar: 2.000", no una marca rival.
- Maqueta 06: "Insignia Explorador" → la recompensa aprobada es la insignia de **campeón de la temporada**.
- Maqueta 01: "Rivales" con un solo color turquesa; con hasta 4 rivales cada uno necesita su color/avatar (punto 10).
- Las siluetas de países de las maquetas no se usan: el mapa sale de `countries.ts` y del mapa 1:50m del proyecto.

## 4. Auditoría AUD01–AUD08: estado en el código

| ID | ¿Se confirma? | Causa encontrada | Arreglo propuesto | Tamaño |
|---|---|---|---|---|
| AUD01 Puesto anunciado ≠ ranking | Sí | `FinalResultScreen` calcula "Top N" con `getLeaderboard(mode)`: la tabla vieja, solo por región, mezcla dificultades y categorías. El Ranking usa `leaderboard_top` por región × dificultad × categoría de la Temporada 1 | Mostrar el puesto del servidor (`my_rank` con los mismos filtros) después de guardar, rotulado "Mundo · Turista · Temporada 1"; sin servidor, no mostrar puesto | S |
| AUD02 Recompensas "???" | Sí | `BattlePassScreen` (`RewardPill`) oculta con ❓/??? toda recompensa no reclamada, sin explicarlo | Mostrar emoji y nombre con candado y el nivel que la desbloquea | S |
| AUD03 Condiciones contradictorias | Sí | `store_paymentNote` dice "Puedes cancelar tu suscripción en cualquier momento"; `store_webCurrencyNote` dice que en la web mensual/anual son pagos únicos sin renovación | Texto por plataforma: web = pago único con vencimiento; Google Play = suscripción que se cancela en Play | S |
| AUD04 Error en Mercado Pago | Sin causa en el código | Candidatos: `MP_ACCESS_TOKEN` (pendiente desde el 18-10: confirmar que es de producción `APP_USR-`), restricciones de la cuenta MP, navegador | JuanJo prueba con su navegador y tarjeta; revisamos los registros del webhook y del checkout. Lista de casos VP05 | — |
| AUD05 Localización | Sí | Etiquetas del mapa (continentes, océanos) fijas en español en `WorldMapCanvas`; las ciudades del mundo no tienen `nameEn`; en inglés la pregunta va como "Where is?" + nombre aparte | Etiquetas traducidas; "Where is Cairo?" en una línea; `nameEn` para las ciudades desde las etiquetas de Wikidata (ya tenemos el QID de cada una) | M |
| AUD06 Eliminación poco explícita | Sí (regla del producto) | Solo el tutorial de la mano fantasma (una vez) dice "Si se acaba el tiempo, ¡pierdes!"; la línea de Inicio dice "13 ciudades · 15 s por ciudad" | Agregar "Si se acaba el tiempo, termina la partida" en Inicio y en la cuenta regresiva. Una variante tolerante sería otra decisión (hoy existe Entrenamiento sin reloj) | S |
| AUD07 Oferta de vidas temprana | Sí | La oferta de frustración tiene tope diario y excluye buenas partidas, pero no exige un mínimo de partidas a los nuevos | Ninguna oferta pagada antes de 5 partidas o del segundo día | S |
| AUD08 Niveles y reinicio diario | Sí | Nivel del jugador y nivel del pase se llaman igual ("Nivel"); el diario dice "Cambia a las 0:00" sin zona ni cuenta regresiva | "Nivel de explorador" vs "Nivel del pase"; "Nuevo desafío en 3 h 20 min" | S |

## 5. Arquitectura propuesta

**Servidor (una migración, todo en funciones `SECURITY DEFINER`, sin acceso directo del cliente a las tablas):**

| Tabla | Contenido |
|---|---|
| `conq_groups` | nombre, administrador, estado (activo / archivado), código e `invite_hash` regenerables |
| `conq_members` | grupo, usuario, rol, `joined_at`, silenciado; único por grupo y usuario |
| `conq_seasons` | grupo, número, estado (sala / en curso / cerrando / cerrada), `roster` congelado, `started_at`, `ends_at`, `rules` (versión, umbral 2.000, límites, `time_scale`) |
| `conq_season_confirms` | quién confirmó participar en la próxima temporada |
| `conq_packages` | temporada × país → cinco `place_id` en orden, versión de datos (privada) |
| `conq_territories` | temporada × país → dueño, marca, versión, intento que lo reserva |
| `conq_attempts` | quién, país, dueño y versión al empezar, estado, `started_at`, `expires_at`, total, clave de idempotencia |
| `conq_rounds` | intento × índice → `opened_at`, `deadline_at`, clic, `received_at`, distancia, puntos |
| `conq_events` | actividad (captura, conquista, defensa, pérdida, unión, inicio, cierre) con clave única |
| `conq_closes` / `conq_awards` | instantánea única del cierre y la insignia de campeón por temporada |

Funciones: crear grupo, vista previa de invitación (también sin sesión, sin datos privados), aceptar, estado de la
sala, regenerar código, quitar integrante, salir, cancelar, confirmar participación, iniciar temporada (congela plantilla
y genera paquetes), mapa, ficha del territorio, **iniciar intento** (cupos, espera, reserva atómica con `for update`),
**abrir ronda**, **responder** (puntos, revelación, finaliza sola en la quinta), abandonar, recuperar intento, actividad,
clasificación, conjunto de práctica, silenciar, y `conq_close_due()` para pg_cron. El mantenimiento es perezoso
(`_conq_touch`, como `_room_touch`): cada lectura vence rondas, expira intentos y cierra la temporada si ya pasó
`ends_at`; el cron cada 5 minutos solo garantiza el cierre y la insignia aunque nadie abra el juego. Reloj en
`_conq_now()` (simulable en pruebas). Fórmula en `_conq_points(d, t)`: `floor(1000 × e^(−d/500) × (0,5 + 0,5 × (1 − t/15)) + 0,5)`,
0 si `t ≥ 15` o sin respuesta (redondeo hacia arriba en mitades, sin depender del redondeo de `double precision`).

**Cliente:** `src/lib/conquest.ts` (tipos, llamadas, errores estables traducidos, reloj del servidor, sondeo),
`ConquestScreens.tsx` (A1, A2, P1, P2, P5, P6; carga diferida), `ConquestGame.tsx` (P3, P4), `WorldMapCanvas` con dos
props nuevas (`countryFills`: país → color/patrón del dueño; `countryBadges`: inicial del dueño sobre el país), ruta
`/conquista/:code`, fases `conq-*`, bandera remota `conquest_enabled` (por defecto apagada) + `?conquista=beta`. Entrada
desde "Jugar con amigos" (tarjeta junto a Sala en vivo), Más modos, y una tarjeta en Inicio cuando hay una temporada en
curso. Eventos GA4 `conq_*`.

## 6. Plan por fases

| Fase | Contenido | Criterios de salida | Tamaño |
|---|---|---|---|
| **C0 Confianza (auditoría)** | AUD01, AUD02, AUD03, AUD05, AUD06, AUD07, AUD08; lista de prueba de pago para AUD04 | Cada AUD con causa, versión y evidencia (sección 11 de la especificación) | M |
| **C1 Catálogo** | Banco de 12 ciudades por país (script Natural Earth + Wikidata, nombres ES/EN, país verificado), encuadre de cada país, semilla en `places`, documento de revisión | JuanJo aprueba la lista; ningún país con menos de 5 verificadas | M (contenido) |
| **C2 Servidor** | Migración completa (tablas, reglas, reservas, límites, fórmula, cierre, insignia, baja de cuenta) + suite PGlite con reloj simulado | CA01–CA18, CA22–CA26 en PGlite; vectores de puntaje de la especificación | L |
| **C3 Grupos y sala** | A1 Crear o unirse, A2 Sala de espera, invitación por enlace y código, confirmar participación, iniciar | CA01–CA04 en la interfaz; textos ES/EN | M |
| **C4 Tablero y ficha** | P1 mapa con dueños, leyenda y lista alternativa, cuenta regresiva; P2 ficha con todos sus estados (libre, propio, rival, reservado, espera, sin intentos, cerrada) y práctica | Estados de la sección 5 de la especificación; teclado y lista accesible | M |
| **C5 Partida y resultado** | P3 rondas abiertas por el servidor, reloj del servidor, tarjeta de respuesta sin combo, recarga y segunda pestaña, abandono; P4 captura / ataque ganado / perdido / empate / abandono / expirado, revisión de las respuestas propias | CA05–CA08, CA11–CA13, CA21 | L |
| **C6 Actividad, temporada y cierre** | P5 actividad con filtro y "Recuperar"; P6 clasificación en vivo y final con desempates, historial, próxima temporada; insignia de campeón; silenciar; recordatorios locales | CA14–CA17, CA19, CA20, CA22–CA25 | M |
| **C7 QA y beta** | Temporada acelerada (`time_scale`) con 5 cuentas, iPhone Safari + Android Chrome + escritorio, red lenta, reingreso; evidencia por criterio; bandera solo para el grupo de prueba; luego abrir | CA01–CA26 con evidencia; latencia medida | M |

Relación con las "Entregas" de la especificación: E1 ≈ C3 (+ su parte de C2), E2 ≈ C1 + C4 + C5, E3 ≈ C5 + C6, E4 ≈ C6,
E5 ≈ C7. La diferencia es que propongo construir **todo el servidor en una sola fase (C2)**: las reglas se cruzan
(reservas, cupos, cierre, baja de cuenta) y la suite de PGlite las verifica juntas antes de dibujar pantallas, como se hizo
en Sprint y Sala en vivo. C0 es independiente y puede salir primero; C1 (contenido) avanza en paralelo con C2.

## 7. Decisiones para JuanJo

| ID | Pregunta | Propuesta |
|---|---|---|
| CQ-D1 | ¿Pueden jugar sesiones de invitado? | No: solo cuentas registradas (las de invitado se borran a los 30 días sin uso) |
| CQ-D2 | ¿Tamaño del banco de ciudades por país? | 12 por país, con lista para aprobar |
| CQ-D3 | ¿Avisos externos en la v1? | Actividad en el juego + recordatorios locales de 24 h y 1 h; aviso de pérdida por push cuando exista Firebase/VAPID |
| CQ-D4 | ¿Orden? | C0 (auditoría) primero, luego C1–C7 |

Se aplican por defecto (avisar si no): mapa de la misión encuadrado en el país; hasta 3 grupos activos por cuenta;
práctica con ciudades fuera del paquete oficial; `time_scale` solo por SQL para QA; territorios de una cuenta borrada a
nombre de "Jugador retirado"; AUD07 con mínimo de 5 partidas; AUD06 solo explicar la regla (sin variante tolerante).

## 8. Riesgos

- **Catálogo:** C1 depende de la aprobación de la lista; sin ella no se puede iniciar ninguna temporada.
- **Latencia en móviles:** la regla de tiempo del servidor castiga redes lentas; se mide en C7 antes de abrir.
- **Frescura del mapa sin Realtime:** el tablero se actualiza por sondeo (cada 15–30 s y al volver a la app); una
  conquista ajena puede verse con unos segundos de retraso. La reserva impide que dos personas jueguen el mismo país a la vez.
- **Sin push:** sin Firebase/VAPID nadie se entera fuera del juego de que perdió un país; afecta la tensión del modo.
- **Concurrencia y cierre:** son la parte con más casos borde; por eso C2 va con su suite completa antes de la interfaz.
