# GeoSpeed · Reseña del lugar ("Ver más") — plan para aprobar

2026-10-26. Estado: **decisiones tomadas** (sección 7); **R1 hecho** (la ventana con el contenido que ya existe). Siguen R2 (fotos de Wikipedia) y R3 (textos).

## 1. El problema y la idea

Mucha gente no sabe geografía y se frustra: falla, ve el pin correcto y sigue sin saber nada del lugar. La idea
(recomendación que recibió JuanJo): en la tarjeta de respuesta, un botón **"Ver más"** abre una ventana con un
**carrusel de fotos** y **dos párrafos** con cosas y lugares curiosos. Así fallar también enseña algo, y el juego se
vuelve una forma de conocer el mundo.

Hoy ya existen piezas: una foto propia por ciudad (797 de 825), una por país y una por monumento; las cifras de
Wikidata y un dato curioso por lugar (Fase 8, 1.281 lugares del mundo y de Colombia); la pista escrita a mano por
ciudad; y la ficha de la revisión final ("Ver ficha completa"). La reseña las junta en una sola ventana y suma lo que
falta: más fotos y texto narrado.

## 2. Qué ve el jugador

**En la tarjeta de respuesta**, bajo el título del lugar, aparece un enlace **"Ver más sobre Medellín ›"**. Al tocarlo:

```
┌───────────────────────────────────────────────────────────┐
│ 🇨🇴 Medellín · Antioquia, Colombia                     ✕ │
│ ┌───────────────────────────────┐                         │
│ │        [ foto 1 de 4 ]   ‹ ›  │  2,5 millones · 1.495 m │
│ │                               │  · fundada en 1616      │
│ └──────────── ● ○ ○ ○ ──────────┘                         │
│ Foto: Autor · CC BY-SA                                    │
│                                                           │
│ Lo curioso                                                │
│ Párrafo 1: qué la hace especial, historias, costumbres…   │
│                                                           │
│ Para conocer                                              │
│ Párrafo 2: lugares, platos, fiestas o paisajes que vale   │
│ la pena ver…                                              │
│                                                           │
│ [ Practicar este lugar ]          [ SEGUIR JUGANDO ]      │
│ Textos basados en Wikipedia · Fotos de Wikimedia Commons  │
└───────────────────────────────────────────────────────────┘
```

- **Teléfono horizontal:** foto a la izquierda y texto con scroll a la derecha. **Vertical:** foto arriba.
  **Escritorio:** ventana de dos columnas.
- **Carrusel:** se desliza con el dedo, con flechas y puntos; el crédito de cada foto va debajo, pequeño.
- **Cifras clave** de la ficha de la Fase 8 (habitantes, altitud, fundación, área, largo, UNESCO…).
- **"Practicar este lugar"** lo manda al repaso (ya existe). **SEGUIR JUGANDO** cierra la ventana y sigue la partida.

**Al final de la partida**, en la revisión por ciudad, el enlace "Ver ficha completa" abre la misma ventana. También
desde el historial.

## 3. Cuándo aparece y qué pasa con el reloj

Abrir la reseña **pausa el avance automático** de la tarjeta, igual que hoy lo pausa el engranaje. El reloj de la ronda
ya no corre en ese momento, así que no cambia el puntaje.

| Modo | ¿"Ver más" en la tarjeta? |
|---|---|
| Clásico, Diario, Retos, Quizzes, Imposible | Sí (pausa el avance) |
| Entrenamiento y Repaso | Sí. Es donde más sirve: se aprende sin presión |
| Mundial | Sí, con el país del futbolista |
| 60s de Caos | No: el reloj es global y no se detiene. Queda en la revisión final |
| Sprint | No: es una carrera contra otra partida. Queda en la revisión final |
| Sala en vivo | No: el reloj es compartido. Queda en el resultado final |

Para no cortar el ritmo de quien juega rápido: el enlace es discreto y nunca se abre solo. En el entrenamiento, tras
un fallo, se puede destacar más ("¿Quieres conocer este lugar?").

## 4. El contenido

### 4.1 Fotos (carrusel de 3 a 5)
1. La foto propia que ya tenemos (ciudad, país o monumento).
2. **De 2 a 4 fotos más del artículo de Wikipedia del lugar.** Un script toma, para cada lugar, su id de Wikidata (ya
   está en la ficha) y su artículo en Wikipedia en español o en inglés, y de ahí las imágenes que el artículo usa
   (normalmente las mejores del lugar: panorámicas, monumentos, calles). Descarta mapas, banderas, escudos, logos,
   diagramas y retratos. Acepta solo licencias libres (CC BY, CC BY-SA, CC0, dominio público), como ya hacemos con
   los monumentos, y guarda el crédito de cada foto.
3. Si no hay suficientes, completa con fotos que ya tenemos de lugares cercanos (los "cerca de" de la ficha).

**Dónde viven las fotos nuevas:** son unas 3.500 y pesarían unos 130 MB. Propongo **no guardarlas en el juego**: el
script guarda solo una lista con el nombre de archivo y el crédito (unos 400 KB), y el teléfono pide la miniatura de
640 px a Wikimedia (`upload.wikimedia.org`) al abrir la reseña. Hay que permitir ese dominio en la política de
seguridad del sitio (CSP). Sin conexión, el carrusel muestra solo la foto propia.

### 4.2 Textos (dos párrafos, español e inglés)
- **Párrafo 1 · Lo curioso:** lo que hace especial al lugar (historia breve, costumbres, récords, anécdotas).
- **Párrafo 2 · Para conocer:** sitios, platos, fiestas o paisajes que vale la pena ver.
- Cada párrafo de 50 a 90 palabras. Sin política, guerras ni tragedias (las mismas reglas de los datos curiosos).
  Sin repetir las cifras que ya muestran los recuadros.
- **Se escriben con base en el artículo de Wikipedia** de cada lugar: el script baja el resumen en español y en inglés
  como fuente. Los textos se redactan con palabras propias y cada dato debe estar en la fuente, para evitar
  inventos. La ventana muestra "Basado en Wikipedia" con el enlace al artículo (licencia CC BY-SA).
- **Volumen:** 1.281 lugares (ciudades del mundo, países, lugares, monumentos y el pack Colombia), unos 340.000
  palabras entre los dos idiomas. Se escriben por tandas en paralelo, como los datos curiosos, con revisiones
  automáticas (largo, idioma, cifras distintas a las de la ficha, palabras prohibidas). Un documento de revisión deja
  a JuanJo revisar por muestreo.
- **Orden:** ciudades del mundo → países → monumentos → pack Colombia → lugares geográficos. Los packs Pro (787
  lugares) quedan para después; mientras tanto su reseña muestra fotos, cifras y la pista.
- **Peso:** se cargan aparte y por categoría (unos 150–250 KB comprimidos cada una), solo cuando se abre la primera
  reseña. Quedan guardados para jugar sin conexión.

### 4.3 Mientras no haya texto
Para un lugar sin párrafos todavía, la ventana muestra las fotos, las cifras, el dato curioso y la pista. Así la
mecánica puede salir antes que todo el contenido.

## 5. Construcción por bloques

| Bloque | Contenido | Tamaño |
|---|---|---|
| R1 Ventana y mecánica | Componente de la reseña (carrusel, cifras, párrafos, créditos, practicar), enlace en la tarjeta con pausa (Clásico, Diario, Retos, Quizzes, Entrenamiento, Mundial), en la revisión final e historial. Contenido de respaldo con lo que ya existe: foto propia, fotos de lugares cercanos, dato curioso y pista | M |
| R2 Fotos | Script de galería desde Wikipedia/Wikidata con filtros y licencias, lista con créditos, permiso de `upload.wikimedia.org` en la CSP, créditos en Soporte, documento de revisión de fotos | M |
| R3 Textos | Script que baja las fuentes; redacción ES/EN por tandas (ciudades → países → monumentos → Colombia → lugares), revisiones automáticas y documento de revisión | L (contenido) |
| R4 Medición | Eventos GA4 y ajustes según uso | S |

R1 se puede publicar sola y ya aporta. R2 y R3 llenan la ventana a medida que avanzan.

## 6. Cómo sabremos si funciona
- % de partidas con al menos una reseña abierta y reseñas por partida.
- Retorno a 7 días de quienes abren reseñas frente a quienes no.
- Aciertos en el repaso de los lugares cuya reseña se abrió.
- Eventos `place_story_open` (categoría, desde la tarjeta o desde la revisión) y `place_story_practice`.

## 7. Decisiones para JuanJo

**Decidido por JuanJo el 2026-10-26:** RS-D1 miniaturas de Wikimedia pedidas al abrir; RS-D2 textos propios basados en
Wikipedia para los 1.281 lugares (mundo + Colombia); RS-D3 el enlace va donde la tarjeta espera (en Caos, Sprint y Sala
solo en la revisión final); RS-D4 gratis para todos. RS-D5 queda como se recomienda.

| # | Decisión | Recomendación |
|---|---|---|
| RS-D1 | ¿De dónde salen las fotos del carrusel? | **Miniaturas de Wikimedia pedidas al abrir** (cero peso en la app, 3–5 fotos por lugar; requiere conexión). Alternativa: guardarlas nosotros (+130 MB, funcionan sin conexión) o usar solo las fotos que ya tenemos (1 por lugar + cercanos) |
| RS-D2 | ¿Textos propios o el resumen de Wikipedia en vivo? | **Propios, escritos con base en Wikipedia** (tono de juego, curiosidades, sin depender de internet). El resumen en vivo es gratis pero suena a enciclopedia ("Medellín es un municipio…") |
| RS-D3 | ¿En qué modos va el enlace? | Los de la tabla de la sección 3: **sí** donde la tarjeta espera (pausa el avance); **no** en Caos, Sprint y Sala (solo en la revisión final) |
| RS-D4 | ¿Gratis o Pro? | **Gratis para todos**: es el gancho para quien no sabe geografía. Pro podría sumar después descargar las galerías para jugar sin conexión |
| RS-D5 | Nombre del enlace | "**Ver más sobre Medellín**" en la tarjeta y "**Conoce Medellín**" como título de la ventana |
