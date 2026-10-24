# GeoSpeed — Plan por fases para igualar y superar a la competencia

Fuente: `GeoSpeed_Especificacion_Funcional.pdf` (JuanJo, 20 de octubre de 2026; 18 funciones frente a GeoGuessr,
Seterra, WorldGuessr y Worldle). Este plan contrasta cada función con el código actual y la ordena en fases. JuanJo
aprueba cada fase antes de empezarla; al cerrar una fase se marca aquí y en `CLAUDE.md`.

## 1. Estado real frente al documento (verificado en el código el 20-10-2026)

| # | Función | El documento dice | Estado real en el código |
|---|---|---|---|
| — | Metadatos | 400+ y 180+ ciudades | El catálogo tiene **253 ciudades únicas** (420 entradas repartidas en las listas por región). `index.html` dice 400+ en la descripción y 180+ en Open Graph/Twitter; `manifest.json` dice 180+ y todavía habla de "duelos 1v1" (hoy son retos con amigos). |
| P1 | Sprint | No existe | Correcto. Hay retos asíncronos entre 2 (`challenges`), sin clasificación. |
| P2 | Diario con racha y compartir | Parcial | Diario existe (13 ciudades, semilla por fecha **UTC**: cambia a las 7 p. m. en Colombia). La "racha" actual es de **abrir la app** (cofre con vidas, `dailyStreak.ts`), no de completar el diario. Hay tarjeta de compartir con imagen (`shareCard.ts`), no el texto con emojis. |
| P3 | Feedback de distancia | Ya existe (al final de la tanda) | Más que eso: **después de cada respuesta** hay tarjeta con distancia, tiempo, foto del país, mapa con la línea y nombres de países (20-10-2026). |
| P4 | Entrenamiento | Parcial | Correcto: 6 ciudades sin vidas con pistas ("Campo de tiro"); no se elige región/tamaño/reloj ni se repiten falladas. |
| P5 | Salas privadas | Parcial | Retos asíncronos para 2 con código. El duelo en vivo existe pero está **oculto y en retiro** (decisión D8 del rediseño). |
| P6 | Más categorías | No existe | Correcto: solo ciudades (y países en el Mundial). |
| P7 | Progresión visible | Por verificar | **Existe en buena parte:** 10 niveles con XP y título, 9 insignias, Battle Pass, cosméticos (pines, estelas, marcos, temas de mapa). Faltan medallas por mapa (región × dificultad), logros de largo plazo, y las insignias viven solo en el teléfono (no en el servidor). |
| P8 | Quizzes y favoritos | No existe | Correcto. |
| P9 | Offline | No existe | Parcial: la app nativa ya trae mapa, ciudades y fotos dentro del APK; las partidas sin señal ya quedan en cola y se suben al volver (`geospeed_pending_results`). Faltan avisos, bloqueo de modos online y regla Pro. |
| P10 | Inglés | Ya existe | Parcial: la interfaz sí; los nombres de ciudades del catálogo están en español (tarea C3). |
| D1 | Velocidad como núcleo | Parcial | Ver decisión de puntuación (sección 3): la fórmula del documento **reduce** el peso de la velocidad frente a la actual. |
| D2 | Carrera contra el fantasma | Parcial | La base ya existe: cada ronda guarda clic, tiempo y puntos (`game_rounds`), y el mapa del reto ya dibuja el pin del rival. Falta mostrarlo en vivo durante la partida. |
| D3 | Reto por WhatsApp sin cuenta | Ya existe | Correcto (sesión de invitado automática). |
| D4 | Packs LatAm y Colombia | No existe | Correcto (hay modos por continente, no por país). |
| D5 | Repaso inteligente | No existe | Correcto. Prerrequisito: identificador estable por lugar (hoy las ciudades se identifican por nombre). |
| D6 | Ficha del lugar | Parcial | Tarjeta por respuesta con foto del país; en la revisión final, una pista escrita a mano por ciudad (`cityTips.ts`). Faltan datos (habitantes, área, altitud…). |
| D7 | Mascota con personalidad | Parcial | Desde el 20-10-2026 tiene 9 poses que reaccionan a cada respuesta y resultado. Faltan frases y animación (especificación pendiente). |
| D8 | Modo equipos | No existe | Especificación pendiente. |

## 2. Fases propuestas

Orden pensado por dependencias: primero lo que las demás funciones necesitan (puntaje en el servidor, definición de
"acierto", identificador por lugar, día de juego), luego lo que más crece y retiene (diario + WhatsApp), luego
competencia (fantasma → Sprint) y al final el contenido grande (categorías, packs, fichas). Cada fase se publica en
la web al terminar; la app de Android recoge todo lo terminado en la siguiente AAB (la prueba cerrada de 14 días con 12
testers puede arrancar ya con lo que hay).

Tamaños aproximados: S ≈ 1 día · M ≈ 2–3 días · L ≈ 4–6 días · XL > 1 semana. El contenido (listas de lugares,
fotos, datos) se suma aparte porque depende de revisión de JuanJo.

### Fase 0 — Arreglos rápidos (S)
- Metadatos: "250+ ciudades" en `index.html`, `manifest.json` y `store-listing/metadata.json`; quitar "duelos 1v1".
- Informe de progresión (hecho en la tabla de arriba).

### Fase 1 — Puntaje nuevo, juice por niveles y puntaje en el servidor (L) · Diferencial D1 · §7
- Fórmula por ronda **Cercanía × Rapidez × Combo** (con las cifras que se decidan, sección 3), con perdón (regular
  mantiene el combo, fallo lo rompe) y textos Buen ritmo / ¡Imparable! / ¡Turbo! / ¡EN LLAMAS!
- Define "acierto bueno / regular / fallo" (≥ 800 / 400–799 / < 400), que luego usan el diario (cuadritos) y Sprint.
- Juice en 5 niveles: un sonido con tono escalado, visual y vibración juntos (< 100 ms), combo roto suave.
- Pantalla final: total contando en 1,2 s, desglose cercanía / rapidez / combo máximo, récord con confeti.
- **Servidor recalcula** el puntaje de cada partida desde las rondas (clic, ciudad, tiempo) en `save_game_result`;
  respuestas < 300 ms se marcan sospechosas. El puntaje del teléfono queda solo como vista previa.
- Identificador estable por lugar (`id` en el catálogo) para repaso, quizzes, fichas y categorías.
- Rankings: según la decisión de la sección 3 (temporada nueva o tablas separadas).

### Fase 2 — Desafío diario con racha y compartir (L) · Paridad P2 · §2
- **Día de juego = medianoche de Colombia** para todos (diario, racha, cupos de Sprint). Diario numerado (#1, #2…).
- Diario de 13 ciudades (decisión de JuanJo: como hoy; el texto queda "11/13"), resultado guardado en el servidor (`daily_results`).
- Racha de diarios completados con protectores (1 gratis por semana, Pro hasta 3), récord, pantalla de racha
  perdida, calendario. Premios por hito (3/7/30/100/365 días) con insignias, marcos y títulos **en el servidor**
  (`user_badges`), y utilidades (protector, +3 Sprints, 7 días de Pro de prueba, nunca Pro permanente).
- Compartir por WhatsApp: texto con cuadritos 🟩🟨🟥 sin revelar ciudades, botón WhatsApp + menú nativo + copiar.
- Link `/d/<número>?r=<nombre>` que abre el diario sin cuenta y al final compara con quien lo envió.
- Vista previa en WhatsApp con imagen del día (función de Vercel para la imagen y las etiquetas `og:`). **Fase 2b (2026-10-21):** hecha con funciones de Vercel que solo atienden a los robots de vista previa (`api/daily-page.ts`, `api/og-daily.ts`).
- Recordatorio a las 7 p. m. (notificación local en la app; requiere instalar el plugin y generar nueva AAB).

### Fase 3 — Carrera contra el fantasma en los retos (M) · Diferencial D2 · §8
- El segundo jugador ve "Tú vs Juanjo" con marcador en vivo, el pulso del rival en el segundo exacto en que respondió,
  su pin después de responder, la ventaja (+180 pts / −0,8 s) y al final la comparación con revancha (ya existe).
- Usa los datos que ya se guardan por ronda; solo se agrega el instante exacto del clic si hace falta más precisión.

### Fase 4 — Entrenamiento ampliado + repaso inteligente (L) · Paridad P4 + Diferencial D5 · §3, §10
- Entrenamiento: región, tamaño 6/10/20, reloj opcional, lugar correcto + dato al fallar, ronda extra con las
  falladas, % dominado por región (3 aciertos seguidos). No cuenta para racha, Sprint ni ranking.
- Repaso inteligente: cajas 1–5 por jugador y lugar (`user_item_memory`), alimentadas por todos los modos desde el
  servidor; "Repaso del día" (máx. 10) en el menú; pantalla por aprender / en repaso / dominados.
- Categorías y países aparecen en el selector cuando existan (fases 6–7).

### Fase 5 — Sprint con ligas y temporadas (XL) · Paridad P1 · §1
- Puntos Sprint (Elo, K = 40 las 10 primeras y luego 20), 5 divisiones, temporadas de 8 semanas con compresión e
  insignia, 5 carreras gratis al día (Pro ilimitadas) con cupo calculado en el servidor.
- Rival = partida grabada de otro jugador con PS parecidos (mismas 10 ciudades), jugada como carrera contra el
  fantasma (fase 3). Al inicio habrá pocos jugadores: se arranca con partidas grabadas reales de la base.
- Búsqueda de rival, resultado con PS animados, ascenso celebrado, ranking Global / Colombia / Amigos.
- Aviso al rival ("Juan te ganó, −14 PS"): requiere notificaciones push en la app (Firebase, gratis) — ver dependencias.

### Fase 6 — Categorías nuevas (XL, por partes) · Paridad P6 · §4
1. **Banderas** (M): la bandera de cada país y se toca el país; ya hay banderas y contornos de los 195 países.
2. **Lugares geográficos** (L): ríos, montañas, volcanes, desiertos, lagos con geometría de Natural Earth (dominio
   público); la distancia se mide al punto más cercano del accidente.
3. **Monumentos** (M + contenido): coordenadas + foto con licencia libre (Wikimedia) y crédito, como las fotos de países.
- Mínimo 100 elementos por categoría, en todos los modos. Yo preparo los listados en borrador; JuanJo revisa.

### Fase 7 — Packs LatAm y Colombia (XL) · Diferencial D4 · §9
- Colombia gratis (32 departamentos y capitales, 100 municipios, lugares, monumentos) con fronteras internas; Andes,
  Caribe, Cono Sur, México y Centroamérica como Pro. Escala de cercanía por pack, ranking por pack.
- Datos: departamentos de Natural Earth (dominio público); municipios de DANE/IGAC (verificar licencia).

### Fase 8 — Ficha del lugar (M + contenido) · Diferencial D6 · §11
- Datos de Wikidata (CC0) revisados: habitantes, área, altitud, lugares cercanos, dato curioso, en español e inglés.
- Franja de 1,5 s al acertar sin pausar; ficha ampliada al final con "Practicar este lugar" (va al repaso).

### Fase 9 — Progresión ampliada (M) · Paridad P7
- Medallas por mapa (región × dificultad), logros de largo plazo, vitrina con título y marco activos (los mismos de
  la fase 2), todo guardado en el servidor.

### Fase 10 — Quizzes personalizados y favoritos (L) · Paridad P8 · §5
### Fase 11 — Juego offline (M) · Paridad P9 · §6
### Pendientes de especificación (JuanJo): salas de 3–10 en vivo, personalidad de la mascota, modo equipos.

## 3. Decisiones que necesito antes de cada fase

**Fase 1 — decidido por JuanJo el 20-10-2026:** fórmula nueva en **todos los modos** con rankings
"Temporada 1" (las tablas actuales quedan como "Histórico"); **la velocidad no pierde peso**: rapidez con la misma
curva de hoy (×2,2 al instante, −0,13 por segundo, mínimo ×0,4) y el combo (hasta ×2,5) se suma encima; **se
mantiene** el multiplicador de dificultad (el Mundial sigue sin él, como antes). Implementado en `src/lib/scoring.ts`.

Preguntas originales de la fase 1 (para referencia):
1. *¿La fórmula nueva aplica a todos los modos?* Cambia la escala de los puntajes: los rankings y récords actuales
   dejan de ser comparables. Recomendación: sí, en todos los modos, abriendo "Temporada 1" en los rankings y dejando
   las tablas actuales como "Histórico".
2. *Peso de la velocidad.* Hoy responder en 1 s vale ×2,07 y a los 14 s ×0,40 (5 veces más). Con el documento, ×1,5 a
   los 2 s y ×1,0 desde los 8 s (1,5 veces más): la velocidad pesa **menos** que hoy y el combo pasa a ser lo
   principal (hasta ×2,5). Para que "velocidad como núcleo" siga siendo cierto, recomiendo rapidez ×1,0 → ×2,0.
3. *Multiplicador de dificultad* (×1,0 a ×1,5): el documento no lo menciona. Recomendación: mantenerlo.

**Fase 2 (diario):**
4. Día de juego a medianoche de Colombia para todo el mundo (en España cambia a las 6 a. m.). Recomendación: sí.
5. Hoy hay dos "rachas" posibles: la de abrir la app (cofre con vidas) y la nueva del diario. Recomendación: una sola
   racha (la del diario) y el cofre queda como premio diario sin número propio.
6. Diario de 10 ciudades (hoy 13). Recomendación: 10, para que coincida con el texto para compartir y con Sprint.

**Fase 2 — decidido por JuanJo el 20-10-2026:** día de juego a medianoche de Colombia; una sola racha (la del diario,
el cofre queda sin número); el diario sigue con 13 ciudades.

**Fase 5 (Sprint):**
7. Ranking "Colombia" necesita el país del jugador (recomendación: se elige en el perfil, con el del teléfono por
   defecto); "Amigos" = personas con las que has jugado retos (no hay lista de amigos).
8. Notificaciones push en la app: hay que crear un proyecto de Firebase (gratis) y conectarlo.

**Fase 7 (packs):** confirmar licencia de los datos de municipios de DANE/IGAC.

## 4. Dependencias externas (JuanJo)
- Firebase (push nativo) antes de la fase 5; plugin de notificaciones locales en la fase 2 (nueva AAB).
- Revisión de contenido en las fases 6–8.
- Nada de esto bloquea la prueba cerrada de Google Play: se puede subir ya la AAB actual (regenerada) y actualizarla
  al cerrar cada fase.

## 5. Seguimiento
| Fase | Estado | Fecha |
|---|---|---|
| 0 | Hecha (metadatos 250+ ciudades, retos con amigos) | 2026-10-20 |
| 1 | Hecha y publicada (a fórmula y combo · b efectos por nivel · c servidor y Temporada 1) | 2026-10-20 |
| 2 | Publicada (racha con protectores e hitos, pantalla de racha, compartir con cuadritos, link `/d/N`, recordatorio). Falta nueva AAB para el recordatorio en Android. 2b (imagen del día en WhatsApp) hecha el 2026-10-21 | 2026-10-20 |
| 3 | Publicada (RPC `challenge_ghost`, Tú vs rival en vivo, aviso al segundo exacto, pin y comparación tras responder, resumen al final; al terminar un reto se va directo a la comparación) | 2026-10-21 |
| 4 | Código hecho (entrenamiento: región, nivel, 6/10/20, reloj opcional, repetir falladas, % dominado; repaso inteligente con cajas 1–5 en el servidor, Repaso del día, Tu memoria). Falta aplicar `20261024120000_item_memory.sql` y publicar | 2026-10-21 |
| 5 | Código hecho (PS con Elo, 5 divisiones, temporadas con compresión e insignia, 5 carreras/día y Pro ilimitado, rival con PS parecidos o partida de la casa, carrera contra el fantasma, revancha desde la bandeja, ranking global/país/amigos, país en el perfil). Falta aplicar `20261025120000_sprint.sql` y publicar; push al rival cuando haya Firebase | 2026-10-22 |
| 6 | **6a Banderas** publicada (v130, 2026-10-22). **6b Lugares geográficos** hecha en código: 367 lugares (ríos, lagos, mares, cordilleras, picos, desiertos, islas, penínsulas…) con contornos de Natural Earth, puntaje por distancia al área/trazo/punto, en Clásico/Entrenamiento/Retos, ranking e historial por categoría. Publicada (v132, 2026-10-23); revisión de niveles en `docs/Fase6_Lugares_catalogo.md`. **6c Monumentos** hecha en código: 209 monumentos con foto libre de Wikimedia (202) y crédito, medidos al punto, en Clásico/Entrenamiento/Retos, ranking e historial por categoría. Falta aplicar `20261029120000_monuments.sql` y publicar; revisión en `docs/Fase6_Monumentos_catalogo.md` | 2026-10-23 |
| 7 | **7a Pack Colombia** publicado (v136): región Colombia gratis con 33 departamentos (Natural Earth), 147 municipios (Wikidata), 52 lugares y 41 monumentos del pack, escala de 150 km y ranking propio (migración `20261030120000_colombia.sql`; revisión en `docs/Fase7_Colombia_catalogo.md`). **7b Packs Pro** hecho en código: Andes, Cono Sur, México y Centroamérica y Caribe (362 divisiones y 425 ciudades de Natural Earth, niveles automáticos para revisión), incluidos en Pro con 1 partida gratis al día por pack, escala de 400 km. Falta aplicar `20261031120000_pro_packs.sql` y publicar; revisión en `docs/Fase7b_Packs_Pro_catalogo.md` | 2026-10-24 |
| 8 | Propuesta | |
| 9 | Propuesta | |
| 10 | Propuesta | |
| 11 | Propuesta | |
