# GeoSpeed · Auditoría del 26-10-2026 — registro de la fase C0

Fase C0 del plan de Conquista (`docs/GeoSpeed_Conquista_Plan.md`). Por cada hallazgo de la auditoría (sección 9–10 de
`docs/GeoSpeed_Conquista_Especificacion_v1.1.md`): causa encontrada, arreglo, versión y evidencia. Rama
`feat/conquista-c0`, versión del service worker **v152**. Responsable de desarrollo: Claude; verificación de QA: JuanJo
(marcar "verificado" o "pendiente" en cada fila tras probar en producción).

| ID | Causa encontrada | Arreglo | Evidencia | QA |
|---|---|---|---|---|
| AUD01 Puesto anunciado ≠ ranking | `FinalResultScreen` calculaba "Top N" con `getLeaderboard(mode)` (tabla vieja, solo por región, mezcla dificultades y categorías). Además pedía "iniciales para el Top 10" y las guardaba en esa tabla, que desde la Temporada 1 no aparece en ningún ranking | El puesto sale de `my_rank` con los mismos filtros que la pantalla Ranking (región, dificultad, categoría, Temporada 1), leído después de guardar la partida (2,5 s y 6 s): "Tu puesto en el ranking (Mundo · Turista): 6.º de 7". Solo en partidas que cuentan para el ranking (no entrenamiento, quizzes, retos, Imposible, Sprint ni sin conexión); sin sesión no se anuncia puesto. Formulario de iniciales eliminado | Código: prop `rankBoard` (Index, WorldChallengeScreen). `tsc` y 125 pruebas | pendiente |
| AUD02 Recompensas "???" | `RewardPill` (`BattlePassScreen`) ocultaba con ❓ / ??? toda recompensa no reclamada | Siempre ícono y nombre; las de niveles no alcanzados van atenuadas y con 🔒. El aviso de "Battle Pass (Pro)" de la colección ahora se traduce | Código | pendiente |
| AUD03 Condiciones contradictorias | `store_paymentNote` decía "Puedes cancelar tu suscripción en cualquier momento" también en la web, donde Pro mensual/anual son pagos únicos | En la web: "Pro mensual dura 30 días y Pro anual 365 días desde el pago; no se renuevan solos y no hay nada que cancelar" (30/365 días = `proDays` del webhook). Fuera de la web (Google Play): la suscripción se renueva y se cancela en Google Play | Código | pendiente |
| AUD04 Error en Mercado Pago | No hay causa en el código: el checkout responde `login_required` sin sesión y crea la preferencia con sesión (verificado el 18-10). Candidatos: `MP_ACCESS_TOKEN` de prueba en lugar de producción (pendiente desde el 18-10), restricciones de la cuenta de Mercado Pago o del navegador | Lista de prueba abajo (JuanJo) | — | pendiente |
| AUD05 Localización | Etiquetas del mapa (continentes, océanos, mares, países vecinos del pack Colombia) fijas en español en `WorldMapCanvas`; las ciudades del mundo no tenían nombre en inglés; `itemSubtitle` devolvía el país en español para las ciudades; la pregunta era "Where is?" + nombre aparte | Etiquetas del mapa traducidas (`MAP_LABELS_EN`); nombres en inglés de 93 ciudades del mundo desde Wikidata (`src/data/cityNamesEn.ts`, `scripts/build-city-names-en.mjs`; las de Colombia y los packs conservan su nombre local); país en el idioma del juego; la pregunta es "¿Dónde está / El Cairo?" y "Where is / Cairo?" (Clásico, Caos, Sala en vivo y pantalla de TV) | Navegador en inglés: "Where is Moscow?", "Where is Tokyo?", "NORTH AMERICA", "PACIFIC OCEAN". Pruebas `src/test/audit.test.ts` (Cairo / Egypt, Johannesburg) | pendiente |
| AUD06 Eliminación poco explícita | La regla solo aparecía una vez, en el tutorial de la mano fantasma | La cuenta regresiva muestra "⏱ Si se acaba el tiempo en una ronda, termina la partida" en todas las partidas con reloj donde aplica (no en entrenamiento ni quizzes, que siguen); en pantallas medianas y grandes también va en la línea de Inicio | Navegador: "⏱ If time runs out on a round, the game ends." | pendiente |
| AUD07 Oferta de vidas temprana | La oferta de frustración no exigía un mínimo de partidas | Ninguna oferta pagada (vidas, Pro) antes de 5 partidas (`MIN_GAMES_FOR_PAID_OFFERS`); antes solo puede aparecer el video gratis (si hay anuncios) | Código | pendiente |
| AUD08 Niveles y reinicio diario | "Nivel" se usaba igual para el jugador y para el pase; el diario decía "Cambia a las 0:00" | El pase dice "Nivel del pase"; el diario dice "Nuevo en 2 h 38 min" en Inicio y "Nuevo desafío en … (a las 0:00, tu hora)" en su presentación | Navegador: "New in 2 h 38 min". Pruebas `timeUntilRollover` | pendiente |

**Extra (pedido por la especificación de Conquista, también útil hoy):** con cero ciudades respondidas, la distancia media
dice "Sin respuestas" en vez de "0 m" (resultado final, reto e historial).

## AUD04 — lista de prueba de pago (JuanJo)

1. En Supabase → Edge Functions → Secrets: confirmar que `MP_ACCESS_TOKEN` empieza por `APP_USR-` (producción). Si empieza
   por `TEST-`, el checkout usa la cuenta de prueba y Mercado Pago rechaza a compradores reales.
2. Con sesión iniciada en tu navegador y celular habituales: Tienda → Pro mensual → debe abrir el checkout de Mercado Pago.
   Si aparece "error de acceso", anotar la URL y una captura (el texto exacto dice si es de la cuenta o del navegador).
3. Pago aprobado (tarjeta real de bajo monto o una de prueba si el token es de prueba): al volver, el juego dice
   "Procesando tu compra" y en menos de 30 s activa Pro.
4. Pago rechazado y pago cancelado: al volver no se activa nada y el mensaje lo explica.
5. Restaurar compras en otro dispositivo con la misma cuenta: Pro aparece activo.
6. Repetición del aviso de Mercado Pago: en la tabla `purchases` debe haber una sola fila por pago (el webhook es idempotente).

Con esos resultados se ubica dónde ocurre el error antes de tratarlo como defecto del juego.
