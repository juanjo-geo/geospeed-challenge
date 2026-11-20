# Video de lanzamiento de GeoSpeed Challenge

Proyecto [Remotion](https://www.remotion.dev) (React + three.js) que genera los videos de lanzamiento: el horizontal de 30 s para la ficha de Google Play y YouTube, los verticales de 15 s para redes y sus variantes. Tiene su propio `package.json`; no forma parte del juego ni de su compilación.

Qué archivo va en cada lugar y qué hacer el día de publicar: [PUBLICAR.md](PUBLICAR.md).

## Cómo se arma

- **3D con código:** el globo usa el mapa y los colores del juego (`src/brand.ts` los importa de `../src`), más el pin, la onda, los teléfonos y las fichas (`src/scene3d.tsx`, `src/scene3dB.tsx`).
- **Partida real:** lo que se ve dentro de los teléfonos son grabaciones del juego compilado, hechas con Chrome sin ventana. Supabase y Analytics van bloqueados: nada llega a producción.
- **Tomas con IA (Higgsfield, Seedance 2.0):** el Explorador animado del cierre y, solo en las variantes para redes, la chica del bus y los amigos del sofá. Los originales están en `higgsfield/`.
- **Español e inglés:** `src/lang.tsx` tiene los textos y, por idioma, qué grabación usa cada escena y en qué cuadro pasa cada cosa.

## Composiciones

| Composición | Qué es |
|---|---|
| `Lanzamiento`, `LanzamientoEN` | Horizontal de 30 s (ficha de Play y YouTube) |
| `Vertical`, `VerticalEN` | Vertical de 15 s, gancho A: "¿La ubicas en 5 segundos?" |
| `VerticalB`, `VerticalBEN` | Gancho B: "Mi amiga me retó y esto pasó" |
| `VerticalC`, `VerticalCEN` | Gancho C: "Ubiqué 13 ciudades en 30 segundos" |
| `VerticalIntroA`, `VerticalIntroB` (+ `EN`) | Ganchos A y B con 2,2 s de una persona al comienzo (solo redes) |
| `LanzamientoRedes`, `LanzamientoRedesEN` | Horizontal con 1,5 s de amigos antes de la escena de retos (solo redes) |
| `Bloque1`, `Bloque2`, `Bloque3`, `EscenaPrueba` | Piezas sueltas para revisar |

```bash
npm install
```

```bash
npx remotion render Lanzamiento out/geospeed-lanzamiento-30s-sonido.mp4 --crf=18
```

Para revisar un cuadro sin renderizar todo: `npx remotion still Vertical out/cuadro.jpg --frame=120 --scale=0.5`.

## Lo que no está en git y cómo se regenera

Para no engordar el repositorio, las carpetas pesadas que salen de scripts están en `.gitignore`. Todos los comandos se corren desde `video/`.

| Carpeta | Cómo se regenera |
|---|---|
| `public/sfx/` | `node scripts/make-sfx.mjs` (efectos sintetizados, sin archivos de terceros) |
| `public/music/` | `python -I scripts/make-music.py` (el tema del juego, 16 veces más fuerte) |
| `public/explorer_a/` | Sacar los cuadros del clip y recortarle el fondo (abajo) |
| `public/people/` | Sacar los cuadros de las tres tomas (abajo) |
| `rec/` y `public/frames*/` | Grabar el juego y preparar los cuadros (abajo) |
| `out/` | Los videos terminados |

**Explorador animado:**

```bash
npx remotion ffmpeg -y -i higgsfield/clip-a/clip.mp4 -q:v 2 tmp-a/f%03d.jpg
```

```bash
python -I scripts/key_clip.py tmp-a public/explorer_a
```

(`tmp-a` es cualquier carpeta temporal vacía. Si cambia el clip, copiar los números que imprime a `META` en `src/MascotClip.tsx`.)

**Biblioteca de reacciones del Explorador** (`higgsfield/biblioteca/explorador/<nombre>/clip.mp4`, 14 clips; las imágenes de inicio salen de `python -E -P scripts/make-mascot-refs.py`): por cada clip, sacar los cuadros a una carpeta temporal y recortar a `public/explorer_<nombre>` como arriba; al final `node scripts/build-explorer-lib.mjs` escribe `src/explorerLib.ts`. Las escenas de personas de la serie de ganchos (`higgsfield/biblioteca/ganchos/<nombre>/clip.mp4`) van a `public/people/<nombre>/` con el comando de abajo.

**Tomas de personas** (una por carpeta: `bus`, `amigos_v` desde `amigos-1`, `amigos_h` desde `amigos-2`):

```bash
npx remotion ffmpeg -y -i higgsfield/bus/clip.mp4 -start_number 0 -q:v 3 public/people/bus/f%03d.jpg
```

**Grabaciones del juego:** primero `npm run build` en la raíz (compilación normal, con fotos). Luego, por ejemplo:

```bash
node video/scripts/record.mjs clasico 1012 8
```

(ese se corre desde la raíz; `LOCALE=en` para inglés, `MODE=colombia` para el pack). Después, desde `video/`:

```bash
python -E -P scripts/prep_frames.py clasico ""
```

El script imprime los cuadros exactos de cada momento; si cambian, van en `REC` de `src/lang.tsx`. Las pantallas sueltas (Diario, sala, reseña) salen de `scripts/shot.mjs` y `scripts/scenes789.mjs`; la sala y el reto usan una compilación en modo desarrollo para tener los simuladores.

## Qué es real y qué no

- Lo de dentro de los teléfonos es el juego real.
- Valentina y los 20 jugadores de la sala son de los simuladores de desarrollo; el PIN y el QR son de esa sala simulada.
- "11/13" y la racha de 7 días son un ejemplo.
- La chica del bus y los amigos no son personas reales: al publicar esos videos hay que marcarlos como hechos con IA (ver PUBLICAR.md).
