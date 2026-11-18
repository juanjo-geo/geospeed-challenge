# Publicar el video de lanzamiento

Todo lo que hace falta el día que se publique. Los videos están en `video/out/`.

## Qué archivo va en cada lugar

| Dónde | Archivo | Notas |
|---|---|---|
| Ficha de Google Play (video promocional) | `geospeed-lanzamiento-30s-sonido.mp4` (español) y `geospeed-launch-30s-EN.mp4` (inglés) | Se sube a YouTube y en Play se pega el enlace. Una ficha por idioma. |
| YouTube (canal) | Los mismos dos horizontales | Sirven también como video del canal. |
| TikTok, Reels, Shorts | `geospeed-vertical-15s.mp4` (gancho A), `geospeed-vertical-15s-B.mp4`, `geospeed-vertical-15s-C.mp4` y sus versiones `-EN` | Tres videos que solo cambian los primeros 4 segundos. |

| TikTok, Reels, Shorts (con personas) | `geospeed-vertical-17s-A-persona.mp4`, `geospeed-vertical-17s-B-amigos.mp4` y sus versiones `-EN` | Los ganchos A y B con 2,2 s de una persona real al comienzo. |
| Facebook, Instagram, anuncios (horizontal) | `geospeed-redes-31s.mp4` y `geospeed-redes-31s-EN.mp4` | El horizontal con 1,5 s de amigos jugando antes de la escena de retos. **No va en la ficha de Play.** |

No usar `geospeed-lanzamiento-30s.mp4` (versión vieja con la música casi inaudible).

## Videos con personas: marcarlos como contenido hecho con IA

La chica del bus y los amigos del sofá **no son personas reales**: son tomas generadas con IA (Higgsfield, Seedance 2.0). Al subir esos videos:

- **TikTok:** activar "Contenido generado por IA" en los ajustes de la publicación. Es obligatorio para contenido realista hecho con IA.
- **Instagram y Facebook:** activar la etiqueta "Información de IA" al publicar.
- **YouTube:** en los detalles del video, responder "Sí" a "Contenido alterado o sintético".

Los videos sin personas (los tres ganchos A, B y C normales y el de la ficha de Play) no necesitan esa etiqueta: el Explorador es un dibujo animado.

## Reglas de Google Play para el video de la ficha

- Se sube a YouTube como **público o no listado** (no privado).
- **Anuncios desactivados** en ese video (monetización apagada).
- Sin restricción de edad.
- Horizontal. La ficha lo reproduce sin sonido al comienzo; por eso todo va en texto.
- No decir "gratis", precios, "el mejor" ni "n.º 1". El horizontal no lo dice. **Los verticales sí dicen "JUEGA GRATIS": son solo para redes, no para la ficha.**

## Antes de publicar (pedirle a Claude)

1. **Volver a capturar la pantalla del Diario.** Hoy muestra "16 noviembre · #189". Se regraba el día de publicar y se renderiza de nuevo (unos 15 minutos).
2. **Insignia de Google Play en el cierre.** Hoy dice "ANDROID · WEB". La insignia oficial "Disponible en Google Play" solo se puede usar cuando la app esté en producción.
3. Si cambia la dirección del juego (dominio propio), revisar que no aparezca la anterior en ninguna pantalla grabada (la sala muestra `geospeed-challenge.vercel.app`).

## Texto para YouTube — español

**Título:** GeoSpeed Challenge: ¿cuánto conoces el mundo?

**Descripción:**

```
¿Dónde está Katmandú? Tienes 15 segundos.

GeoSpeed Challenge es un juego de geografía rápido: te preguntan por una ciudad, una bandera, un lugar o un monumento y tocas el mapa. Mientras más cerca y más rápido, más puntos. Encadena aciertos y multiplica tu puntaje.

• Ciudades, banderas, lugares y monumentos
• El mundo, cada continente y Colombia
• Un desafío nuevo cada día
• Reta a tus amigos o juega en sala con hasta 20 personas
• Aprende algo de cada lugar

Juega en la web: https://geospeed-challenge.vercel.app

Créditos de las fotos del video:
Machu Picchu: Martin St-Amant, Wikimedia Commons, CC BY-SA 3.0.
Katmandú: Wikimedia Commons, dominio público (CC0).
Las fotos que aparecen dentro del juego tienen sus créditos en la sección Soporte del juego.
Música: tema original de GeoSpeed Challenge.
```

Cuando la app esté en producción, agregar el enlace de Google Play antes del de la web.

## Texto para YouTube — inglés

**Title:** GeoSpeed Challenge: How well do you know the world?

**Description:**

```
Where is Kathmandu? You have 15 seconds.

GeoSpeed Challenge is a fast geography game: you get a city, a flag, a place or a landmark and you tap the map. The closer and the faster, the more points. Chain hits to multiply your score.

• Cities, flags, places and landmarks
• The world, every continent and Colombia
• A new challenge every day
• Challenge your friends or play a live room with up to 20 people
• Learn something about every place

Play on the web: https://geospeed-challenge.vercel.app

Photo credits:
Machu Picchu: Martin St-Amant, Wikimedia Commons, CC BY-SA 3.0.
Kathmandu: Wikimedia Commons, public domain (CC0).
Photos shown inside the game are credited in the game's Support section.
Music: original GeoSpeed Challenge theme.
```

## Texto para TikTok, Reels y Shorts

| Gancho | Español | Inglés |
|---|---|---|
| A | ¿La ubicas en 5 segundos? 🌍 #geografia #quiz #geospeed | Can you find it in 5 seconds? 🌍 #geography #quiz #geospeed |
| B | Mi amiga me retó y esto pasó 👀 #geografia #reto #geospeed | My friend challenged me and this happened 👀 #geography #challenge #geospeed |
| C | 13 ciudades en 30 segundos 🔥 #geografia #speedrun #geospeed | 13 cities in 30 seconds 🔥 #geography #speedrun #geospeed |

**Cómo probar los ganchos:** publicar los tres con uno o dos días de diferencia, a la misma hora. Mirar en cada uno el porcentaje de personas que lo ven completo (no el número de vistas). El que gane es el que se usa en los anuncios pagados.

## Qué es real y qué no en el video

- Lo que se ve dentro de los teléfonos es el juego real, grabado.
- Valentina (la rival) y los 20 jugadores de la sala son del simulador de pruebas del juego; el PIN y el QR son de esa sala simulada.
- "11/13" y la racha de 7 días son un ejemplo.
- El Explorador del cierre es una animación generada con IA (Higgsfield, modelo Seedance 2.0) a partir del dibujo original de la mascota.

## Cómo se rehace

Desde la carpeta `video/`:

```bash
npx remotion render Lanzamiento out/geospeed-lanzamiento-30s-sonido.mp4 --crf=18
```

Composiciones: `Lanzamiento`, `LanzamientoEN`, `Vertical`, `VerticalEN`, `VerticalB`, `VerticalBEN`, `VerticalC`, `VerticalCEN`, y las de redes con personas: `LanzamientoRedes`, `LanzamientoRedesEN`, `VerticalIntroA`, `VerticalIntroAEN`, `VerticalIntroB`, `VerticalIntroBEN`.
