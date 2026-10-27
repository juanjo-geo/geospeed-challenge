# Conquista el mapa — C7: prueba con el grupo real

2026-10-27. Fase C7 de `docs/GeoSpeed_Conquista_Plan.md`: temporada acelerada con el grupo de prueba en teléfonos reales,
evidencia por criterio (CA01–CA26), latencia medida y, al final, abrir Conquista a todos.

Las consultas SQL están en **`supabase/qa/conquista_qa.sql`** (bloques numerados; se pegan en el
[SQL Editor](https://supabase.com/dashboard/project/motyvjfhupmvmfpgftku/sql/new) cambiando `ABC123` por el código del
grupo). Se probaron todas en Postgres local sobre las migraciones reales.

## 1. Qué está listo

- **Servidor en producción:** migración `20261108120000_conquest.sql` aplicada (comprobado el 2026-10-27: la invitación
  de prueba responde `conq_invite_invalid`).
- **Suite automática** `npm run test:conquest-sql`: 85 comprobaciones con reloj simulado. Cubre los criterios de reglas
  y concurrencia (CA01–CA18, CA22, CA23, CA25, CA26). La prueba con personas confirma lo que la suite no puede ver:
  teléfonos reales, red, textos y avisos.
- **Bandera `conquest_enabled` apagada** para todos. Conquista se ve solo en:
  - un teléfono o navegador que abrió `https://geospeed-challenge.vercel.app/?conquista=beta` (`?conquista=off` la
    quita);
  - un teléfono que creó un grupo, entró a uno o ya pertenece a alguno (nuevo en C7);
  - en "Jugar con amigos", escribir el código de 6 de un grupo funciona aunque esté oculta (nuevo en C7). Así se entra
    desde la **app instalada**: en el iPhone la app de la pantalla de inicio no comparte datos con Safari y no tiene
    barra de direcciones, así que `?conquista=beta` no le llega.
- **Medición de red** (nuevo en C7): ver la sección 5.
- **Recordatorios acelerados** (nuevo en C7): en una temporada acelerada, los avisos de "queda 1 día" y "cierra en 1
  hora" llegan a la misma proporción (con 144: 10 min y 25 s antes del cierre).

## 2. Preparación (JuanJo, unos 15 minutos)

1. **SQL bloque 0**: programa el cierre automático cada 5 minutos (una sola vez).
2. **Cuentas:** de 3 a 5 personas con cuenta registrada y correo confirmado (las sesiones de invitado no pueden entrar
   a Conquista). Cada una inicia sesión en su teléfono.
3. **Dispositivos:** al menos un iPhone con Safari, un Android con Chrome y un computador. Uno de los teléfonos con
   **datos móviles, sin wifi**. En el computador, una misión con red lenta simulada: Chrome → F12 → Network → "Slow 4G".
4. **GA4, antes de jugar** (los datos no se calculan hacia atrás): Administrar → Definiciones personalizadas →
   Métricas personalizadas → crear, con alcance "Evento", `avg_delay_ms`, `max_delay_ms`, `avg_rtt_ms` y `lost_points`;
   en Dimensiones personalizadas, `net`.
5. **Crear el grupo:** JuanJo abre `https://geospeed-challenge.vercel.app/?conquista=beta` → Jugar con amigos → Conquista
   el mapa → nombre "QA Conquista" → CREAR GRUPO.
6. **Invitar:** compartir el enlace por WhatsApp desde la sala.
   - En el navegador, el enlace abre la invitación → ENTRAR AL GRUPO.
   - En la app instalada: Jugar con amigos → escribir el código de 6 → abre la invitación → ENTRAR AL GRUPO.
7. **Acelerar, antes de iniciar:** SQL bloque 2 (escala 144) y bloque 1 para confirmar `escala = 144`. Las reglas se
   congelan al pulsar INICIAR TEMPORADA; cambiar la escala después no afecta la temporada en curso.
8. Cada persona deja activado "Participo en la temporada 1"; JuanJo pulsa INICIAR TEMPORADA 1.

### Tiempos con escala 144

| Regla | Normal | Con 144 |
|---|---|---|
| Día (cupo de 5 misiones, 2 por país) | 24 h | **10 min** |
| Temporada | 7 días | **70 min** |
| Espera entre misiones al mismo país | 1 h | **25 s** |
| Aviso "queda 1 día" / "cierra en 1 hora" | 24 h / 1 h antes | 10 min / 25 s antes |
| Ronda · reserva · abrir la primera pregunta · sin misiones al final | 15 s · 3 min · 30 s · 3 min | igual (tiempo real) |

En la sala, el texto "Dura 7 días" no cambia con la escala; es solo para la prueba.

## 3. Guion por criterio

"Suite" = ya lo comprueba `npm run test:conquest-sql`. "SQL n" = bloque del archivo de consultas. En la columna Resultado
se anota ✅, ❌ (con el número de hallazgo de la sección 6) o "—" si no se probó.

| CA | Qué hacer | Qué debe pasar | Suite | Resultado |
|---|---|---|---|---|
| CA01 | Con el grupo recién creado (solo JuanJo), mirar la sala; luego con 2 confirmados | Con 1, INICIAR TEMPORADA deshabilitado; con 2, se habilita | ✓ | |
| CA02 | Con 4 dentro, dos personas tocan ENTRAR AL GRUPO a la vez (necesita una 6.ª cuenta) | Una entra y la otra ve "grupo completo"; nunca 6 (SQL 1) | ✓ | |
| CA03 | Abrir el enlace de nuevo con alguien que ya entró; después "Cambiar el código" y probar el enlace viejo | No aparece dos veces; el código viejo dice que no es válido | ✓ | |
| CA04 | Con la temporada en curso: abrir el enlace con otra cuenta; el admin intenta quitar a alguien; alguien intenta salir | Todo rechazado con su mensaje | ✓ | |
| CA05 | Dos personas juegan una misión en el mismo país y comparan la ciudad de cada ronda | Mismas 5 ciudades en el mismo orden (SQL 8) | ✓ | |
| CA06 | Capturar un país libre: una misión floja (< 2.000) y otra buena | La floja lo deja libre; la buena lo captura y la marca del tablero es el total del resultado (SQL 4) | ✓ | |
| CA07 | Atacar un país con dueño: perder, y conquistar con más puntos | Con menos, el dueño sigue; con más, cambia y la nueva marca es mi total. El empate exacto es difícil a mano: queda en la suite | ✓ | |
| CA08 | En una misión, dejar vencer una ronda sin tocar | Esa ronda da 0 y la misión sigue hasta la 5.ª | ✓ | |
| CA09 | Una persona juega 2 misiones al mismo país (la 2.ª espera 25 s) e intenta una 3.ª; luego intenta una 6.ª misión en el día | La 3.ª al mismo país y la 6.ª del día se rechazan con su mensaje (SQL 6) | ✓ | |
| CA10 | A empieza una misión en un país; B abre la ficha de ese país | B ve "Alguien está jugando por este país" con la cuenta de la reserva, y su cupo no baja | ✓ | |
| CA11 | Con red lenta, tocar dos veces muy rápido y recargar justo al terminar | Los puntos y el dueño no cambian; un solo evento en Actividad (SQL 9) | ✓ | |
| CA12 | En plena pregunta, recargar la página; después abrir la misma misión en otra pestaña | Vuelve a la misma pregunta con el mismo reloj (no se reinicia) | ✓ | |
| CA13 | Abandonar con la ×; en otra misión, abrir la 1.ª pregunta y salir de la app más de 3 min | No conquista, cuenta como usada y el país queda libre | ✓ | |
| CA14 | En los últimos 3 min de la temporada, intentar iniciar; terminar una misión justo después del cierre | No deja iniciar; lo que termina tarde no cambia la clasificación final | ✓ | |
| CA15 | Si dos terminan con los mismos territorios, mirar Temporada | Desempata la suma de marcas; si todo es igual, comparten puesto y premio | ✓ | |
| CA16 | Forzar el cierre (SQL 10) | 1 la primera vez, 0 la segunda; una instantánea y una insignia por campeón | ✓ | |
| CA17 | Después de cada misión, comparar el resultado, el mapa y la pestaña Temporada | El mismo dueño y el mismo puesto en los tres (SQL 5) | ✓ | |
| CA18 | Una cuenta que no está en el grupo abre el enlace y prueba lo que pueda | Solo ve la invitación; nada del tablero ni de la actividad | ✓ | |
| CA19 | Compartir un resultado; silenciar el grupo | Compartir solo pasa al tocar el botón; silenciado no llega ningún aviso | — | |
| CA20 | Recorrer sala, tablero, misión, resultado, actividad y temporada en inglés (Ajustes → Idioma) | Todo traducido; una misión sin toques dice "Sin respuestas"; sin actividad hay un mensaje de lista vacía | — | |
| CA21 | En iPhone y Android: mover y ampliar el mapa con los dedos durante una pregunta | Mover o ampliar no cuenta como respuesta; solo un toque corto responde | — | |
| CA22 | Tras el cierre: VER LA NUEVA TEMPORADA → todos "Participo" → INICIAR TEMPORADA 2 | Países libres, 5 misiones nuevas, ciudades distintas en lo posible, y la temporada 1 sigue en el historial | ✓ | |
| CA23 | Jugar justo cuando cambia el día (cada 10 min desde el inicio; SQL 3 muestra el día) | El cupo se renueva para todos a la vez, sin acumular; la espera de 25 s sigue; una misión que cruza el cambio cuenta para el día en que empezó | ✓ | |
| CA24 | En Android (Chrome o app nueva) o computador: dar permiso de notificaciones al sitio (candado de la barra de direcciones → Notificaciones → Permitir), abrir el tablero (ahí se programan los avisos) y dejar el juego en otra pestaña; esperar el aviso de 10 min antes del cierre. Repetir con el grupo silenciado | Un aviso por plazo, sin duplicados; silenciado, ninguno. En la web el juego revisa los avisos una vez por minuto, así que pueden llegar hasta 1 min tarde | — | |
| CA25 | (Opcional, con una cuenta desechable que sea admin) Ajustes → Eliminar cuenta | El rol pasa a quien lleva más tiempo; la temporada sigue y sus países quedan como "Jugador retirado" | ✓ | |
| CA26 | Mientras A juega, B mira la ficha; A deja vencer la reserva | B ve los 3 minutos; al vencer, el país se libera sin cambiar de dueño | ✓ | |

**Avisos en el iPhone:** Safari solo muestra notificaciones de páginas web cuando el juego está añadido a la pantalla de
inicio (iOS 16.4 o más) y con permiso. Los avisos de la app nativa necesitan el AAB nuevo (el mismo pendiente desde la
Fase 2). Por eso CA24 se prueba en Android o en el computador.

## 4. Durante la prueba

- **SQL 3** muestra el día en curso y cuánto falta; **SQL 4** el mapa; **SQL 5** la clasificación; **SQL 9** la actividad.
- Si algo no cuadra, anotar la hora, el teléfono y la cuenta en la sección 6 y seguir; se revisa al final con SQL 6, 7 y 9.
- Para probar el cierre sin esperar los 70 minutos: **SQL 10**.

## 5. Latencia

**Qué se mide.** Por la regla aprobada, el servidor cuenta el tiempo desde que abre la ronda hasta que recibe el toque.
El jugador pierde el viaje de la pregunta hasta el teléfono y el del toque de vuelta. Cada teléfono compara el tiempo
que tuvo la pregunta en pantalla con el que contó el servidor; la diferencia es lo que la red le sumó a cada ronda. Con
la fórmula se calcula cuántos puntos costó.

**Dónde se ve:**
- **En los teléfonos de prueba**, al final de cada misión: tarjeta "📶 Red en esta misión (prueba)" con el retraso medio
  y máximo por ronda, la ida y vuelta al servidor, los puntos que costó la red y el promedio de las últimas misiones en
  ese teléfono. Los demás jugadores no la ven.
- **En GA4**, evento `conq_latency` (una vez por misión): `avg_delay_ms`, `max_delay_ms`, `avg_rtt_ms`, `lost_points`,
  `net` (4g, 3g…), `native` e `iso`. Para promediar: Explorar → Exploración libre → filtro evento = `conq_latency`.
- **SQL 7**: respuestas que llegaron después de los 15 s ("llegó tarde"). Si aparecen y la persona dice que tocó a
  tiempo, es la red.

**Cómo anotarlo.** Por cada dispositivo y red, al menos 3 misiones:

| Dispositivo | Red | Retraso medio por ronda | Máximo | Puntos por misión que costó la red |
|---|---|---|---|---|
| iPhone (Safari) | wifi | | | |
| iPhone (Safari) | datos móviles | | | |
| Android (Chrome) | wifi | | | |
| Android (Chrome) | datos móviles | | | |
| Computador | Slow 4G simulado | | | |

**Criterio propuesto para decidir** (la decisión es de JuanJo):
- **Hasta 0,4 s por ronda** y menos de unos 40 puntos por misión (2 % de la marca de captura): no se compensa.
- **Entre 0,4 y 1 s**: se compensa en la próxima versión de reglas descontando un margen fijo (por ejemplo 0,3 s) o la
  mitad de la ida y vuelta medida. Se aplica entre temporadas, nunca dentro de una.
- **Más de 1 s, o respuestas tardías frecuentes**: revisar antes de abrir (región del servidor, tamaño de las respuestas,
  reintentos).

## 6. Registro de hallazgos

| N.º | Fecha y hora | Persona y dispositivo | CA | Qué pasó | Qué se esperaba | Estado |
|---|---|---|---|---|---|---|
| 1 | | | | | | |

## 7. Abrir a todos

Antes:
- [ ] Todos los CA con ✅, o con un hallazgo aceptado por JuanJo.
- [ ] Decisión sobre la latencia (sección 5).
- [ ] `conquest-close` activo en pg_cron (SQL 0, segunda consulta).
- [ ] Grupo de prueba de vuelta a escala 1 o borrado (SQL 12).

Abrir: **SQL 11** (`conquest_enabled = true`). No hace falta publicar nada: la bandera se lee al abrir la app.
Durante las 48 horas siguientes, revisar la actividad (SQL 9 sin filtro de grupo) y los errores. Si hay que ocultarla
de nuevo, usar la línea comentada del SQL 11: los que ya pertenecen a un grupo la siguen viendo y pueden terminar su
temporada.

## 8. Después de la prueba

**SQL 12:** las temporadas siguientes del grupo de prueba vuelven a 7 días. Otra opción es borrar el grupo con todo lo
suyo, con o sin quitar las insignias de campeón que ganó.
