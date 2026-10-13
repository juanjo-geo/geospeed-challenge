# GeoSpeed — Módulo "Desafío Mundial" (Especificación)

**Estado:** Propuesta / pendiente de implementar
**Fecha:** 8 jun 2026
**Autor:** JuanJo + asistente (sesión de planificación)
**Tipo:** Evento temporal (activable durante Mundiales / Copa América / Euro), con potencial de volverse permanente.

---

## 1. Resumen

Nuevo modo de juego donde el usuario debe **ubicar en el mapa el país de origen de un futbolista famoso**. En vez de tocar un punto exacto (como en ciudades), el jugador **toca el territorio del país**. Es una mecánica más indulgente, pensada para aprovechar el pico de interés futbolero alrededor de un Mundial.

**Decisiones de producto tomadas:**
- **Presentación:** solo el **nombre en texto** del jugador (sin fotos, sin escudos, sin marcas FIFA/ligas) → 100% seguro legalmente.
- **Base de datos:** mezcla de **estrellas históricas + jugadores actuales**.
- **Vigencia:** **evento temporal** (botón destacado que aparece durante el torneo; reactivable cada edición).
- **Dificultad:** se reutilizan los **mismos 4 niveles** del juego (Turista / Rookie / Crack / Leyenda), pero la clasificación es por **fama/reconocimiento del jugador**, no por geografía.
- **UI de entrada:** un **botón extra de modalidad al lado de los continentes** (World, Europa, Asia, América, África, + **⚽ Mundial**).

---

## 2. Mecánica de juego

1. Se muestra el nombre del jugador: *"¿De qué país es Lionel Messi?"*
2. El usuario toca un país en el mapa (mapa mundial completo).
3. Se evalúa el acierto por **territorio**, no por distancia:
   - País **correcto** → puntuación máxima.
   - País **vecino o del mismo continente** → puntuación parcial.
   - País de **otro continente** → puntuación mínima / cero.
4. Se aplica el **multiplicador de velocidad** ya existente (mismo de ciudades).
5. Avanza a la siguiente ronda. Estructura igual al modo Clásico (13 rondas, timer por ronda) o reutilizable en Time Attack.

> Nota técnica: se reutiliza el motor actual (WorldMapCanvas, modo regional, scoring, vidas, ranking). Es una **variante**, no un juego nuevo.

---

## 3. Escala de puntuación (definida)

La puntuación base NO usa la curva de distancia de ciudades. Usa **bandas de acierto territorial**, sobre una base de **1000 puntos** (coherente con ciudades), y luego se multiplica por velocidad.

| Resultado | Criterio | Puntos base |
|-----------|----------|-------------|
| 🎯 Exacto | Tocó el país correcto | **1000** |
| 🟢 Vecino | Tocó un país que **comparte frontera** con el correcto | **600** |
| 🟡 Mismo continente | Tocó otro país del **mismo continente** (no vecino) | **300** |
| 🔴 Lejos | Tocó un país de **otro continente** | **50** |
| ⚫ Sin tocar país | Tocó el océano / fuera de territorio, o se acabó el tiempo | **0** |

**Multiplicador de velocidad** (idéntico al actual): `clamp(0.4, 2.2 − t×0.13, 2.2)`.
- Ejemplo: acierto exacto en 3s → 1000 × 1.81 = **1810 pts**.

**Bonus de racha** (reutiliza el del juego): +10% por nivel de racha desde racha ≥2, tope ×1.60. Se considera "racha" un acierto Exacto o Vecino (los aciertos buenos mantienen la racha; mismo-continente la divide a la mitad, lejos la reinicia — a definir en implementación).

> Ventaja de esta escala: premia el conocimiento real (saber el país exacto) pero no castiga tanto al casual que sabe "es europeo" o "es sudamericano". Más accesible que las ciudades, justo el objetivo.

---

## 4. Clasificación de dificultad (por fama del jugador)

Se reutilizan las 4 dificultades existentes. El criterio es **qué tan identificable es el jugador y qué tan obvio es su país**.

| Nivel (clave) | Etiqueta | Criterio | Ejemplos |
|---------------|----------|----------|----------|
| `basic` | 🌍 Turista | Íconos globales que casi todos ubican | Messi→Argentina, Cristiano→Portugal, Pelé→Brasil, Mbappé→Francia, Maradona→Argentina |
| `easy` | 🧭 Rookie | Muy conocidos, país relativamente claro | Neymar→Brasil, Haaland→Noruega, Lewandowski→Polonia, Benzema→Francia |
| `medium` | ⚡ Crack | Requiere saber su origen específico | Modrić→Croacia, Salah→Egipto, Son→Corea del Sur, Mané→Senegal, Kane→Inglaterra |
| `hard` | 🔥 Leyenda | Selecciones menos mediáticas, leyendas retiradas, o **país sorprendente** (nació en un país, juega por otro) | jugadores africanos/asiáticos menos cubiertos, históricos, dobles nacionalidades inesperadas |

**Sugerencia de tamaño de BD por nivel (mínimo viable):** ~20-30 jugadores por nivel = 80-120 en total para arrancar. Crece con el tiempo.

---

## 5. Estructura de datos (propuesta)

Archivo nuevo tipo `src/data/players.ts`, análogo a `cities.ts`:

```ts
export interface Player {
  name: string;            // "Lionel Messi" — texto, sin imagen
  countryCode: string;     // ISO / nombre que matchee con countries.ts (p.ej. "Argentina")
  difficulty: 'basic' | 'easy' | 'medium' | 'hard';
  hint?: string;           // opcional: "Delantero · era 2000s" (sin datos licenciados)
  era?: 'historico' | 'actual';
}
```

> El `countryCode` debe coincidir con los nombres de país que ya usa `countries.ts` para poder resaltar/evaluar el territorio tocado.

---

## 6. Lógica de evaluación territorial (a implementar)

Para evaluar el acierto se necesita, dado el punto que tocó el usuario:
1. **Determinar qué país contiene ese punto** (point-in-polygon sobre los polígonos de `countries.ts`).
2. Comparar con el país correcto:
   - Igual → Exacto.
   - Si no, ¿son vecinos? → requiere una **tabla de fronteras/adyacencias** entre países (dato nuevo a incluir).
   - Si no, ¿mismo continente? → ya existe el mapeo continente→países en `WorldMapCanvas` (CONTINENT_COUNTRIES).
   - Si no → Lejos.

> La **tabla de adyacencias** (qué países comparten frontera) es el único dato realmente nuevo y no trivial. Existen datasets abiertos de fronteras terrestres que se pueden adaptar.

---

## 7. UI / entrada

- En la pantalla de selección de modo, **agregar un botón "⚽ Mundial"** junto a los continentes (World / Europa / Asia / América / África / **Mundial**).
- Durante el evento, mostrar también un **acceso destacado** en el home (banner tipo "🏆 Desafío Mundial") con su propio sub-ranking, para generar urgencia/FOMO.
- Reutiliza la pantalla de juego, el feedback, el timer, las vidas y el ranking existentes.
- El feedback tras tocar debe indicar el resultado: "🎯 ¡Exacto!", "🟢 ¡Vecino!", "🟡 Mismo continente", "🔴 Lejos", y mostrar el país correcto resaltado.

---

## 8. i18n

Todos los textos nuevos en `es.ts` / `en.ts` (claves `wc_*` o `world_*`):
- Nombre del modo, pregunta ("¿De qué país es {player}?" / "Which country is {player} from?"), etiquetas de resultado, banner del evento.
- **Los nombres de los jugadores NO se traducen** (son nombres propios).

---

## 9. Consideraciones legales (importante)

- ✅ Usar **solo el nombre en texto** del jugador = información factual, no infringe derechos.
- ❌ NO usar: fotos de jugadores, escudos de selecciones/clubes, logos FIFA / del torneo, camisetas, ni la marca "Mundial"/"World Cup" oficial en branding.
- El nombre del modo debe ser **genérico** ("Desafío Mundial", "Reto Futbolero", "Modo Selecciones") y evitar marcas registradas de FIFA. A confirmar nombre final.

---

## 10. Esfuerzo estimado (alto nivel)

| Pieza | Complejidad |
|-------|-------------|
| Datos de jugadores (`players.ts`) | Baja (manual, pero requiere curaduría) |
| Tabla de adyacencias de países | Media (dato nuevo) |
| Point-in-polygon para detectar país tocado | Media |
| Lógica de scoring territorial | Baja-media |
| UI (botón modo + feedback + banner evento) | Baja (reusa lo existente) |
| i18n | Baja |

**Veredicto:** viable y de complejidad media, mayormente por reutilizar el motor actual. El módulo es una **palanca de marketing** fuerte para el lanzamiento, pero conviene priorizarlo **después** de cerrar publicación en tiendas y validar retención, porque rinde más con usuarios ya activos.

---

## 11. Decisiones pendientes (para mañana)

1. Nombre final del modo (evitar marca FIFA).
2. Lista concreta de jugadores por nivel (curar ~80-120 para el MVP).
3. Política de racha exacta (¿vecino mantiene racha?).
4. ¿Se integra a Time Attack además del modo por rondas?
5. ¿Sub-ranking propio del evento o se mezcla con el global?
