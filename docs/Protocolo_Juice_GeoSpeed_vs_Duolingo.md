# Protocolo de Auditoría "Juice" — GeoSpeed Challenge vs. Duolingo

**Objetivo:** llevar el nivel de *game feel* / juice de GeoSpeed Challenge a mínimo el estándar Duolingo (≥ 3/3 en las 9 capas).
**Método:** (1) entender el modelo Duolingo → (2) auditar con rúbrica → (3) implementar por prioridad → (4) re-auditar.

---

## PARTE 1 — El modelo Juice de Duolingo, deconstruido

Duolingo no tiene "una cosa juicy". Tiene un sistema de **9 capas** que disparan feedback simultáneo con latencia casi nula. El truco no es cada elemento aislado: es que **todos se disparan a la vez** en cada micro-interacción.

### Capa 1 — Audio / Sonido
El activo más subestimado y el de mayor retorno. Duolingo tiene una paleta sonora custom, corta y en tono mayor.

| Evento | Sonido Duolingo | Función psicológica |
|---|---|---|
| Respuesta correcta | "Ding" ascendente brillante, muy corto (<300ms) | Recompensa inmediata |
| Combo / racha de aciertos | El sonido de acierto **sube de tono con cada acierto consecutivo** | Escalada dopaminérgica — el hook central |
| Respuesta incorrecta | "Bwomp" grave descendente, distintivo | Castigo suave, memorable |
| Tap de botón | Click/pop sutil | Confirma agencia |
| Ganar XP / monedas | Ticks tipo moneda que se acumulan | Refuerza acumulación |
| Fin de lección | Fanfarria celebratoria | Cierre emocional |
| Lección perfecta | Fanfarria especial diferenciada | Recompensa variable |
| Subir de nivel / liga | Fanfarria mayor + fondo | Pico emocional |
| Abrir cofre | Anticipación → estallido | Recompensa variable (el más adictivo) |

**Principios de audio:**
- Latencia < 50ms (el sonido debe sentirse como *causado* por el tap, no posterior).
- Tono mayor, corto, brillante para lo positivo; grave y corto para lo negativo.
- **Variación por escalada** (el pitch del combo subiendo) es lo que más engancha — no es un sonido fijo repetido.
- Nunca silencio en un momento de logro.

### Capa 2 — Feedback visual inmediato (micro-interacciones)
- **Correcto:** barra inferior verde que sube desde abajo, checkmark animado, flash verde suave.
- **Incorrecto:** barra roja, *shake* horizontal del elemento, se muestra la respuesta correcta.
- Todo estado tiene transición, nada es corte seco.
- El elemento seleccionado "se enciende" (cambia de estado apagado → activo).

### Capa 3 — Animación y motion (física, no lineal)
Regla de oro Duolingo: **nada se mueve en lineal**. Todo usa easing, overshoot o spring.
- **El botón firma de Duolingo:** botón 3D con un "labio"/sombra inferior. Al presionar, el botón baja y comprime su sombra (skeuomorfismo de profundidad). Es el detalle más copiado de la industria.
- Barra de progreso: se llena con easing + pequeño *overshoot*/rebote al final.
- Contadores (XP, puntaje): **cuentan hacia arriba** con animación (count-up), nunca saltan al valor final.
- Transiciones de pantalla: slide/fade, nunca cortes duros.
- Números que "vuelan": el XP ganado sale del elemento y vuela hacia el contador.

### Capa 4 — Celebración y momentos de recompensa
- Confetti / partículas al terminar lección, subir de nivel, logro.
- Pantallas de logro: el badge hace zoom-in, brilla, estalla en partículas.
- **Cofres:** anticipación (shake, build-up) → estallido de recompensa. La mecánica de recompensa variable más potente.
- Cada micro-victoria se celebra. No hay logro "silencioso".

### Capa 5 — Sistemas de progresión / gamificación
- **Rachas (streaks):** el hook central. Streak freeze, reparación, celebración de hitos (7, 30, 100, 365 días).
- **XP + Ligas:** Bronce→Plata→Oro… con promoción/descenso revelados con animación grande.
- **Meta diaria:** anillo de progreso que se llena.
- **Corazones/vidas:** aversión a la pérdida.
- **Gemas/economía:** moneda + cofres + recompensas sorpresa (recompensa variable).
- **Logros por niveles/tiers.**
- Retos diarios/semanales/mensuales.

### Capa 6 — Personaje / personalidad
- Duo (el búho) reacciona emocionalmente: celebra cuando aciertas, se preocupa cuando fallas, anima en rachas.
- Las notificaciones tienen voz y personalidad (el famoso "guilt trip").
- El personaje convierte feedback mecánico en relación emocional.

### Capa 7 — Háptica (móvil)
- Cada correcto/incorrecto tiene vibración distinta.
- Los botones tienen tap háptico.
- En web: `navigator.vibrate()`.

### Capa 8 — Juice de monetización (Super / Max)
La conversión se diseña con la misma juice que el juego. Timing emocional:
- Upsell en **picos emocionales** (justo después de un éxito) y en **puntos de dolor** (te quedaste sin corazones → "corazones ilimitados con Super").
- Ofertas con **countdown timer** animado (urgencia).
- Pantallas de upsell con personaje, carrusel de features, confetti sobre la oferta.
- Badges de %-descuento que **pulsan**.
- Branding morado/gradiente con partículas de brillo.
- Features bloqueadas con candado + sparkle que "invita" a subir.

### Capa 9 — Rendimiento (el juice invisible)
Nada de lo anterior sirve si hay jank.
- 60 fps sostenidos en animaciones.
- Latencia input→feedback < 100ms.
- Sin bloqueos del hilo principal durante celebraciones.
- Precarga de sonidos y assets (nada de delay en el primer disparo).

---

## PARTE 2 — Protocolo de auditoría (rúbrica scoreable)

Puntúa **cada checkpoint de 0 a 3**:
- **0** = no existe
- **1** = existe pero plano/básico (ej. sonido genérico, animación lineal)
- **2** = bueno pero incompleto (falta escalada, overshoot, o multisensorialidad)
- **3** = nivel Duolingo (multisensorial, con física, latencia baja, variable)

**Meta: promedio ≥ 3 por capa.** Cualquier capa < 2 es brecha crítica.

### Capa 1 — Audio
- [ ] Sonido de respuesta correcta
- [ ] Sonido de respuesta incorrecta (distinto y memorable)
- [ ] **Escalada de pitch en combo/racha de aciertos** ← el de mayor impacto
- [ ] Sonido de tap de botón
- [ ] Sonido de acumulación de puntaje/XP
- [ ] Fanfarria de fin de ronda/partida
- [ ] Sonido diferenciado para partida perfecta / récord
- [ ] Sonido de subir de nivel / desbloqueo
- [ ] Latencia < 50ms (sonidos precargados)

### Capa 2 — Feedback visual inmediato
- [ ] Feedback verde/positivo al acertar (flash, fill, check)
- [ ] Feedback rojo + shake al fallar
- [ ] Se muestra la respuesta correcta al fallar
- [ ] Estados de botón: apagado → seleccionado → confirmado

### Capa 3 — Animación y motion
- [ ] Botones con profundidad 3D + compresión al presionar
- [ ] Ninguna animación es lineal (todas con easing/spring)
- [ ] Barra de progreso con overshoot/rebote
- [ ] Contadores con count-up (no saltan al valor)
- [ ] Transiciones de pantalla suaves (no cortes)
- [ ] Números que vuelan al contador

### Capa 4 — Celebración
- [ ] Confetti/partículas en victoria
- [ ] Animación de logro (zoom + brillo + estallido)
- [ ] Mecánica de recompensa con anticipación→payoff (tipo cofre)
- [ ] Cada micro-victoria tiene celebración (ninguna silenciosa)

### Capa 5 — Progresión
- [ ] Sistema de racha/streak
- [ ] Hitos de racha celebrados
- [ ] XP/puntaje persistente + niveles
- [ ] Ranking/liga o leaderboard
- [ ] Meta diaria/objetivo con progreso visible
- [ ] Economía o recompensa variable (cofres/sorpresa)
- [ ] Logros por tiers

### Capa 6 — Personalidad
- [ ] Existe un personaje/mascota o voz de marca
- [ ] Reacciona emocionalmente a acierto/fallo/racha
- [ ] Copys con personalidad (no genéricos)

### Capa 7 — Háptica
- [ ] Vibración distinta para correcto vs incorrecto (móvil)
- [ ] Tap háptico en botones

### Capa 8 — Monetización (si aplica a GeoSpeed)
- [ ] Punto de conversión identificado (pico o dolor)
- [ ] Pantalla de upsell con juice (personaje, animación)
- [ ] Urgencia (countdown) donde aplique
- [ ] Feature-gating con invitación visual (candado + sparkle)

### Capa 9 — Rendimiento
- [ ] 60 fps sostenidos en celebraciones
- [ ] Sin jank al disparar confetti/partículas
- [ ] Assets y sonidos precargados
- [ ] Latencia input→feedback < 100ms

**Cálculo final:** suma por capa / nº de checkpoints = score de capa. Promedio de las 9 capas = **Juice Score global**. Duolingo ≈ 3.0. Meta GeoSpeed: ≥ 2.7 y sin ninguna capa < 2.0.

---

## PARTE 3 — Guía de implementación técnica (HTML/JS standalone)

Cómo cerrar cada capa sin dependencias pesadas, apto para un HTML portable.

### Audio — Web Audio API
- Usa la Web Audio API (no `<audio>` tags — tienen latencia y no escalan pitch).
- Precarga cada sonido como `AudioBuffer` al iniciar.
- **Escalada de combo:** un solo buffer de acierto, reproducido con `playbackRate` creciente por acierto consecutivo (`source.playbackRate.value = 1 + combo * 0.06`). Esto reproduce el efecto Duolingo con un solo archivo.
- Genera sonidos con osciladores si no quieres archivos: `OscillatorNode` (sine/triangle) + envelope de ganancia para el "ding".

### Motion — CSS + JS
- **Botón Duolingo:** `border-bottom: Npx solid` como "labio", y en `:active` reduces el border-bottom y aplicas `translateY` igual → efecto de compresión.
- Easing: usa `cubic-bezier` con overshoot, ej. `cubic-bezier(0.34, 1.56, 0.64, 1)` (spring/overshoot). Evita `linear` y `ease` por defecto.
- **Count-up:** `requestAnimationFrame` interpolando de valor actual a nuevo con easing `easeOutExpo`.
- Shake de error: keyframes de `translateX` alternando ±.

### Celebración — partículas
- `canvas-confetti` (una sola dependencia CDN, ~5KB) para confetti sin escribir motor de partículas.
- Cofre/recompensa: secuencia scale con `@keyframes` (anticipación: `scale(0.9)` → payoff: `scale(1.15)` → `scale(1)`).

### Háptica
- `navigator.vibrate([patrón])`. Correcto: `vibrate(20)`. Incorrecto: `vibrate([40,30,40])`.

### Rendimiento
- Anima solo `transform` y `opacity` (compositor GPU), nunca `width/height/top/left`.
- `will-change: transform` en elementos que se animan seguido.
- Precarga TODO al boot; primer disparo nunca debe cargar assets.

### Orden de prioridad para cerrar brechas (máximo retorno primero)
1. **Audio de acierto/error + escalada de combo** (Capa 1). Mayor impacto/esfuerzo. Un fin de semana cambia la percepción del juego entero.
2. **Botón 3D + easing con overshoot en todo** (Capa 3). Toca todos los taps del juego.
3. **Feedback verde/rojo + shake** (Capa 2).
4. **Confetti + celebración de récord** (Capa 4).
5. **Count-up de puntaje + números que vuelan** (Capa 3).
6. **Racha + hitos** (Capa 5).
7. **Háptica** (Capa 7) — barato, alto efecto en móvil.
8. **Personalidad/copys + personaje** (Capa 6).
9. **Monetización con juice** (Capa 8) — al final, cuando el core ya engancha.

---

## Siguiente paso
Sube el archivo de GeoSpeed Challenge y corro la auditoría real capa por capa contra esta rúbrica, te entrego el Juice Score actual con las brechas priorizadas, y empezamos a implementar en el orden de arriba.
