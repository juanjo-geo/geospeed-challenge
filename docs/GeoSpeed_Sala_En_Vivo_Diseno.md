# GeoSpeed · Sala en vivo para hasta 20 jugadores — diseño

2026-10-26. Estado: **decisiones tomadas** (sección 9), sin código todavía. Se programa por bloques (sección 8) con el
visto bueno de JuanJo. Reemplaza el pendiente "salas de 3–10 en vivo" del plan de competencia (paridad P5) y sube el
tope a 20.

## 1. Qué es y para quién

Una partida **en vivo y al mismo tiempo** para un grupo: alguien crea la sala, comparte un PIN o un link, los demás
entran desde su teléfono o computador, y todos ven el mismo lugar al mismo tiempo. Entre ronda y ronda aparece el
marcador. Al final hay podio. Es el formato Kahoot llevado al mapa.

Usos que más pesan:
- **Empresas y equipos** (integraciones, capacitaciones, "war room" de un turno): hasta 20 personas, con una pantalla
  grande que muestra el marcador.
- **Aulas:** el profesor proyecta y los estudiantes juegan desde el celular, sin crear cuenta.
- **Amigos y familia:** reemplaza al duelo en vivo de 2 jugadores (hoy apagado).

Por qué importa: cada sala trae hasta 19 personas que quizá nunca abrieron GeoSpeed. Es el mejor canal de
crecimiento que podemos construir con lo que ya existe.

## 2. Cómo se juega

### Anfitrión
1. Jugar con amigos → **Sala en vivo** → elige región, categoría, dificultad, número de rondas (5 · 10 · 13) y
   segundos por ronda (10 · 15 · 20). También elige si **juega** o **solo presenta**.
2. Ve la sala de espera: **PIN de 6 números** grande, link `/sala/123456`, botón de WhatsApp, código QR y la
   lista de jugadores a medida que entran (con avatar). Puede sacar a alguien.
3. Toca **EMPEZAR** (con 2 jugadores o más). Todos ven "¡Prepárense!" y una cuenta regresiva de 5 s.

### Jugador
1. Abre el link, o toca "Unirme con código" y escribe el PIN. Sin cuenta: escribe un apodo y entra (sesión de
   invitado automática, como en los retos).
2. Espera en la sala viendo quién más entra.
3. En cada ronda: ve el lugar y toca el mapa. Al responder ve **"Respuesta enviada · 3,2 s"** y su pin, **pero no
   el lugar correcto**, hasta que cierra la ronda. Así nadie le sopla la respuesta al compañero de al lado. Mientras
   espera ve el contador "14/20 ya respondieron".
4. Cuando la ronda cierra, todos ven a la vez:
   - el mapa con el lugar correcto y **los toques de todos** como puntos pequeños (el suyo resaltado, los 3 mejores
     con nombre);
   - su resultado: distancia, puntos, combo y si subió o bajó de puesto (↑2);
   - el **top 5** y su posición.
5. A los pocos segundos empieza la siguiente ronda sin que nadie toque nada.
6. Al final: podio (1.º, 2.º y 3.º con la mascota), tabla completa, "Tus respuestas por ciudad" (la revisión que ya
   existe) y **Otra ronda**, que lleva a todos a una sala nueva con los mismos jugadores.

### Pantalla para proyectar (opcional)
Link `/sala/123456/tv` en un computador conectado al TV o al proyector. Muestra en grande:
- en espera: el PIN, el QR y los jugadores;
- en cada ronda: el lugar que se pregunta, el reloj y el contador de respuestas;
- al cerrar la ronda: el mapa con todos los toques y el top 10;
- al final: el podio.

No responde preguntas. Si el anfitrión elige "solo presentar", esta pantalla es su vista.

## 3. Reglas

| Regla | Propuesta |
|---|---|
| Jugadores | 2 a 20, contando al anfitrión si juega |
| Rondas | 5, 10 o 13 (10 por defecto) |
| Tiempo | 10, 15 o 20 s por ronda (15 por defecto) + 8 s de revelación. 10 rondas ≈ 4 minutos |
| Puntaje | La fórmula de siempre (cercanía × rapidez × combo × dificultad), calculada en el servidor. La rapidez se mide desde que abre la ronda |
| Sin respuesta | Ronda perdida: 0 puntos y se rompe el combo. **No se acaba la partida** (en Clásico sí) |
| Gana | El de más puntos. Empate: el de menor tiempo total y luego el de más aciertos buenos |
| Vidas | No gasta vidas (es social; las vidas dejarían a medio grupo por fuera) |
| Entrar tarde | Solo antes de empezar. Si la partida ya empezó, el link muestra el marcador en vivo (modo espectador) |
| Salirse | El jugador puede volver mientras dure la partida y retoma en la ronda actual; las rondas perdidas cuentan 0 |
| Qué cuenta | Historial, Tu memoria (repaso) y logros por partidas jugadas. **No** cuenta para el ranking mundial ni para medallas ni para Sprint |
| Nombres | Apodo de 2 a 20 letras con el mismo filtro de groserías de los quizzes |

## 4. Cómo funciona por dentro

### 4.1 Una línea de tiempo del servidor, no un anfitrión que dirige
Cuando el anfitrión toca EMPEZAR, el servidor guarda **la hora de inicio** y la lista explícita de lugares (como en los
retos, decisión D2). Con eso cada teléfono sabe por su cuenta cuándo abre y cuándo cierra cada ronda:
`ronda i abre en inicio + 5 s + i × (segundos + 8)`. No hay mensajes de "empezó la ronda 3".

Ventajas:
- Si el anfitrión pierde la señal o cierra la app, la partida sigue para todos.
- Quien bloquea el teléfono y vuelve cae en la ronda correcta.
- La pantalla para proyectar es solo un cliente más.

Cada respuesta del servidor trae su hora (`server_now`). El teléfono calcula la diferencia con su propio reloj y se
queda con la medición de menor demora, así todos los teléfonos ven la misma ronda con décimas de diferencia.

### 4.2 Consultas periódicas en vez de Realtime (para la v1)
Supabase Realtime en el plan gratis permite **200 conexiones simultáneas** (500 en Pro). Además cuenta **cada mensaje
por cada destinatario**: 2 millones de mensajes al mes en Free y 5 millones en Pro, y luego US$2,50 por millón. Con
Realtime, una sala de 20 gastaría unos 6.000 mensajes por partida. Eso da unas 330 partidas al mes en el plan gratis y
un máximo de unas 9 salas llenas al mismo tiempo.

Como la línea de tiempo ya está definida, casi no hace falta empujar mensajes. Cada teléfono **consulta** el estado
cuando lo necesita:

| Momento | Consulta | Frecuencia |
|---|---|---|
| Sala de espera | `room_state` (quién entró, si empezó) | cada 3 s |
| Durante la ronda | `room_state` (contador de respuestas) | cada 4 s |
| Al responder | `room_answer` (guarda y devuelve tus puntos) | 1 vez |
| Al cerrar la ronda | `room_state` (toques de todos, top 5, tu puesto) | 1 vez, 0,6 s después del cierre |

Una sala llena hace unas 2.000 consultas por partida de 10 rondas. No hay tope de conexiones y no se gastan mensajes de
Realtime. Con 10 salas llenas a la vez son unas 50 consultas por segundo en el pico, algo que la base aguanta. Si las
salas despegan, el contador de respuestas y unas reacciones con emojis pueden pasar a Realtime en una v2. Eso
convendría hacerlo ya en el plan Pro de Supabase (US$25 al mes).

### 4.3 Antitrampa
- El servidor calcula todos los puntos con la misma función del juego (`_score_rounds_v2`): el teléfono solo manda dónde
  tocó y cuánto tardó.
- Respuestas fuera de la ventana de la ronda (más 1,5 s de margen por la red) se rechazan.
- Tiempo usado = el mayor entre el que mide el teléfono y el que mide el servidor menos 1 s. Mentir sobre el tiempo
  da como mucho 1 s de ventaja.
- Una respuesta por jugador y ronda. Respuestas en menos de 0,3 s se marcan como sospechosas, como en el resto del
  juego.
- El lugar correcto no viaja al teléfono antes de que cierre la ronda. Hoy el reto manda la lista completa de
  ciudades; aquí cada ronda entrega solo su pregunta y la respuesta llega al cerrar. El cliente solo necesita el id
  para dibujar la pregunta.
- Salas privadas por PIN y máximo 20 salas creadas por día por anfitrión.

## 5. Datos y funciones del servidor

Tablas nuevas (con RLS y sin acceso directo del cliente; todo pasa por funciones `security definer`, como retos,
Sprint y quizzes):

- **`rooms`**: id, `pin` (6 números, único mientras la sala esté viva), `host_id`, `host_plays`, `status`
  (lobby · playing · finished · cancelled), `settings` (modo, dificultad, categoría, rondas, segundos, máximo),
  `items` (lista explícita de lugares), `started_at`, `finished_at`, `next_room_id` (otra ronda), `created_at`.
- **`room_players`**: sala, usuario, apodo, avatar, `joined_at`, `kicked`, total, aciertos, tiempo total.
- **`room_answers`**: sala, usuario, ronda, toque, tiempo, distancia, cercanía, combo, puntos, `answered_at`
  (una fila por jugador y ronda).
- `game_results.room_id` (columna nueva): al terminar se guarda una partida por jugador con tipo `room`, así aparece
  en el historial y alimenta Tu memoria.

Funciones:

| Función | Qué hace |
|---|---|
| `room_create(p)` | Crea la sala (valida región, categoría, que los lugares existan, el límite diario) y devuelve PIN y estado |
| `room_join(pin, apodo)` | Entra si la sala está en espera y hay cupo; idempotente (volver a entrar no duplica) |
| `room_state(id)` | Todo lo que la pantalla necesita: jugadores, estado, `server_now`, la pregunta de la ronda abierta, el contador de respuestas y, si la ronda cerró, toques de todos, top 5 y mi puesto. La usan los jugadores, el anfitrión y la pantalla para proyectar (por PIN, sin cuenta) |
| `room_start(id)` | Solo el anfitrión; fija la hora de inicio |
| `room_answer(id, ronda, lat, lon, tiempo)` | Guarda y puntúa; devuelve mis puntos, distancia y combo |
| `room_kick` · `room_leave` · `room_cancel` | Anfitrión saca a alguien · jugador sale · anfitrión cancela en espera |
| `room_rematch(id)` | Crea la sala siguiente con la misma configuración y lugares nuevos. Los jugadores la ven en su próxima consulta y entran solos |

Al pasar la última ronda, la siguiente consulta cierra la sala y guarda las partidas (sin tareas programadas). Las
salas en espera sin actividad por 30 minutos se cancelan. Las salas terminadas se borran a los 30 días; las partidas
guardadas quedan.

## 6. Pantallas

1. **Crear sala** (desde Jugar con amigos): región, categoría, dificultad, rondas, segundos, "Yo también juego",
   CREAR SALA. Reusa los selectores del Inicio.
2. **Sala de espera**: PIN grande, QR, WhatsApp y copiar link, cupo "12/20", jugadores con avatar, EMPEZAR o
   "Esperando al anfitrión…", salir y sacar jugador.
3. **Unirme**: el cuadro de código de Jugar con amigos acepta también el PIN; en la ruta `/sala/:pin`, apodo para
   invitados.
4. **Partida en sala**: el mapa y el encabezado del Clásico, con el reloj sincronizado; "Respuesta enviada · esperando
   14/20"; la revelación con todos los toques, mi tarjeta (puntos, ↑↓ puesto) y el top 5.
5. **Resultado**: podio, tabla, mis respuestas por ciudad, OTRA RONDA (anfitrión), compartir, volver al inicio.
6. **Pantalla para proyectar** `/sala/:pin/tv`: espera, pregunta con reloj, revelación con top 10 y podio. Pensada
   para pantalla horizontal grande.

Todas en español e inglés. Se revisan en 568×320, 667×375, vertical y escritorio, como el resto.

## 7. Casos especiales

| Caso | Qué pasa |
|---|---|
| El anfitrión pierde la señal durante la partida | Nada: la partida sigue sola |
| El anfitrión cierra la app en la espera | La sala queda; si no vuelve en 30 min se cancela |
| Sala llena | "La sala está llena (20/20)" |
| Partida ya empezada | Modo espectador con el marcador en vivo |
| Sin conexión | "Necesita conexión", como retos y Sprint |
| Teléfono en vertical | El aviso de girar de siempre; el reloj de la ronda no se detiene (es compartido) |
| Apodo ofensivo o repetido | Ofensivo: se rechaza. Repetido: se agrega un número ("Ana 2") |
| Dos teléfonos del mismo jugador | El mismo usuario no puede responder dos veces la misma ronda |
| Pack Pro como región | Solo si el anfitrión es Pro; entonces juegan todos (es una ventaja de Pro para el anfitrión) |

## 8. Construcción por bloques

| Bloque | Contenido | Tamaño |
|---|---|---|
| S1 Servidor | Migración (tablas, funciones, cierre perezoso, guardado en el historial) y pruebas en PGlite: crear y entrar, cupo, inicio, ventanas de tiempo, puntaje idéntico a la función del juego, ronda sin respuesta, cierre, otra ronda, expulsión, permisos, borrar cuenta | M |
| S2 Cliente base | `src/lib/rooms.ts` (API, consultas periódicas, reloj del servidor, línea de tiempo) + **simulador local con bots** para probar 20 jugadores sin 20 teléfonos + crear, unirse y sala de espera | M |
| S3 Partida | Pantalla de partida guiada por la línea de tiempo (reusa mapa, encabezado y tarjeta del Clásico), espera tras responder, revelación con todos los toques y top 5 | L |
| S4 Cierre | Resultado con podio, otra ronda, pantalla para proyectar, historial y memoria, compartir | M |
| S5 Prueba real | Prueba en producción con 20 sesiones simuladas por script (se crean usuarios invitados que luego JuanJo borra) y prueba con personas en teléfonos reales | S |

Al publicar las salas se borra el duelo en vivo viejo (oculto desde la decisión D8), que una sala de 2 reemplaza.

## 9. Decisiones para JuanJo

**Decidido por JuanJo el 2026-10-26:** S-D1 cualquiera con cuenta registrada crea salas de hasta 20, gratis (Pro suma
los packs Pro como región); S-D2 carrera de puntos; S-D3 pantalla para proyectar en la v1; S-D4 "Sala en vivo"
("Live room" en inglés). S-D5 queda como se recomienda (no cuenta para el ranking mundial).

| # | Decisión | Recomendación |
|---|---|---|
| S-D1 | ¿Quién puede crear salas y de qué tamaño? | Cualquiera con **cuenta registrada**, hasta 20, gratis: es el canal de crecimiento. Pro suma los packs Pro como región de la sala |
| S-D2 | Formato de la v1 | **Carrera de puntos** (todos juegan todas las rondas). La eliminación por ronda queda para después |
| S-D3 | ¿Pantalla para proyectar en la v1? | **Sí**: es lo que la vuelve útil en empresas y aulas, y cuesta poco con este diseño |
| S-D4 | Nombre en la app | "**Sala en vivo**" (claro en aulas y en inglés "Live room"). "War Room" funciona para empresas pero no para un salón de clase |
| S-D5 | ¿Cuenta para el ranking mundial? | **No**: solo historial, memoria y logros. Un grupo podría inflar sus puntajes entre ellos |

## 10. Fuera de la v1 (ideas para después)

- Modo eliminación: en cada ronda sale el último lugar o el 20 % más bajo.
- Modo equipos (pendiente D8 del plan): la sala se divide en equipos con marcador por equipo, para empresas y aulas.
- Quizzes propios como contenido de la sala (un profesor juega su quiz con la clase).
- Reacciones con emojis y contador instantáneo vía Realtime.
- Salas de más de 20 (Pro o empresas), torneos por fechas, sala recurrente con el mismo PIN.

## 11. Cómo sabremos si funciona

- Salas creadas por semana y jugadores promedio por sala.
- % de jugadores de sala que eran nuevos (primera partida en GeoSpeed).
- % de nuevos que vuelven a jugar solos en 7 días.
- % de salas que piden "Otra ronda".
- Eventos GA4: `room_create`, `room_join`, `room_start`, `room_finish`, `room_rematch`, `room_tv_open`.
