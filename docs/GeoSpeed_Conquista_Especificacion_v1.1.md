# GeoSpeed Conquista el mapa — especificación v1.1 (transcripción)

> Transcripción en texto de `GeoSpeed_Conquista_Especificacion_Grupos_5_v1.docx` (versión 1.1, 26-10-2026), recibido de JuanJo. Las maquetas anexas están en `docs/maquetas/conquista/`. El plan de construcción y la revisión contra el código están en `docs/GeoSpeed_Conquista_Plan.md`.

GeoSpeed Conquista el mapa
Especificación funcional para grupos de hasta cinco personas
Versión 1.1  |  26 de octubre de 2026  |  Destinatario: equipo de desarrollo
Desarrollar una modalidad privada y asincrónica en la que de dos a cinco personas compitan por conquistar países. Cada territorio tiene una misión geográfica y una marca que otro integrante puede superar. La temporada termina con una clasificación por territorios conservados.
## Decisiones aprobadas
Juan José Grillo aprobó el 26 de octubre de 2026 los trece puntos de definición: temporadas de siete días, diez países fijos, misiones de cinco ciudades, umbral de captura, puntuación, intentos, defensa, concurrencia, ganador, recompensas, avisos, administración y estructura de pantallas. El grupo admite de dos a cinco personas, incluido su creador.
Esta versión reemplaza los parámetros preliminares de la versión 1.0. El equipo puede implementar las reglas aprobadas sin volver a decidirlas. Quedan trabajos de ejecución: curar ciudades, completar diseños y validar el balance en pruebas. Se incorpora por separado la auditoría funcional del juego público realizada hoy; no acredita la implementación de Conquista.
| Elemento | Regla aprobada |
| Participantes | 2 a 5 cuentas por temporada, incluido quien crea el grupo |
| Formato | Asincrónico; no requiere jugadores conectados al mismo tiempo |
| Temporada | 7 días exactos desde el inicio confirmado por el administrador |
| Mapa | 10 países con catálogo de ciudades verificado; mismo catálogo para todo el grupo |
| Misión | 5 ciudades del país, 15 segundos por ciudad, dificultad Turista para todos |
| Intentos | 5 misiones por día; máximo 2 por país y 1 hora entre inicios sobre ese país |
| Victoria | Mayor número de territorios al cierre; desempate descrito en página 5 |
| Pago | Sin vidas, compras de intentos ni ventajas de puntuación en esta modalidad |

## Alcance de la primera versión
Incluir grupos privados, invitaciones, sala de espera, temporada, selección de territorio, captura de países libres, ataques, resultado, actividad, ranking del grupo e insignia cosmética. Reutilizar la identidad GeoSpeed, los recursos oficiales de Pin y los componentes del mapa y del juego que resulten compatibles.
Fuera de alcance: conquista global pública, equipos, chat, apuestas, premios monetarios, compra de ataques, alianzas, ataques en tiempo real y expulsiones durante una temporada. Los resultados no se mezclan con el ranking clásico.
# 1 Grupos e invitaciones
## Crear y unirse
Una cuenta autenticada crea el grupo y ocupa el primer cupo. El nombre admite de 3 a 30 caracteres. El servidor genera un identificador permanente, un código de invitación y un enlace opaco. El grupo permanece privado y no aparece en búsquedas públicas. Un invitado sin sesión puede ver la propuesta de ingreso y autenticarse conservando el destino, pero no consultar la actividad privada antes de entrar.
Aceptar una invitación requiere acción explícita. Un enlace abierto no inscribe automáticamente. El servidor valida cupos, estado del grupo y membresía dentro de una transacción: si dos personas intentan ocupar el último cupo, solo una entra. Una cuenta no puede ocupar dos lugares. Volver a aceptar la misma invitación devuelve su membresía existente.
## Sala de espera y administración
- El administrador puede invitar, regenerar el código, quitar integrantes y cancelar la sala antes del inicio. Si sale entre temporadas o elimina su cuenta, la administración pasa al integrante restante de mayor antigüedad; si no queda nadie, se archiva el grupo. Compartir abre el selector del dispositivo y nunca envía mensajes automáticamente.
- Se puede iniciar con 2, 3, 4 o 5 integrantes; no es obligatorio llenar cinco cupos. La sala muestra quiénes participarán, las reglas y la duración antes de iniciar.
- Iniciar exige confirmación explícita del administrador. Desde ese momento se congelan plantilla, catálogo y reglas, y se invalidan las invitaciones para esa temporada.
- Durante una temporada nadie puede expulsar rivales, admitir nuevos jugadores, cambiar las reglas ni reiniciar el mapa. El administrador no puede transferirse territorios.
- El jugador puede silenciar el grupo y dejar de participar. Sus marcas permanecen hasta el cierre. La temporada sigue y cierra automáticamente aunque el administrador no participe; la inactividad por sí sola no cambia al administrador. La baja de cuenta conserva resultados anonimizados y transfiere la administración si corresponde.
- Al cerrar, se conserva el historial. La siguiente temporada vuelve a sala de espera y requiere confirmación de participación; el administrador puede ajustar entonces los integrantes.
| Situación | Respuesta visible |
| Quinto cupo ocupado | Grupo completo. Este grupo admite hasta 5 personas. |
| Temporada activa | La temporada ya comenzó. Podrás participar en la siguiente. |
| Código inválido o regenerado | Esta invitación no es válida. Solicita una nueva. |
| Ya pertenece al grupo | Abrir su grupo existente sin duplicar cupo. |
| Solo un integrante | Invita al menos a otra persona para comenzar. |

## Actividad y avisos
La actividad del grupo se consulta dentro del juego. Los avisos externos son opcionales y requieren permiso: pérdida de territorio, 24 horas antes del cierre y una hora antes. Agrupar pérdidas cercanas en un aviso resumen durante una ventana de 10 minutos; conservar cada evento en la actividad. Revalidar permiso y membresía al enviar. Silenciar cancela avisos pendientes; no se envían mensajes automáticos por WhatsApp. Registrar cada recordatorio por temporada y usuario para no duplicarlo.
# 2 Territorios y misiones
## Catálogo y tablero
Cada temporada contiene exactamente diez países. Catálogo inicial aprobado: Colombia, Perú, Ecuador, Chile, Argentina, Brasil, México, España, Francia e Italia. Las ciudades serán de dificultad Turista para todos. Antes de habilitar cada país se deben verificar al menos cinco ciudades, sus coordenadas, nombres traducidos y pertenencia territorial. Un país sin datos completos impide iniciar la temporada; no se reemplaza durante el juego.
El tablero puede mostrar el mundo para permitir seleccionar países de distintos continentes. La lista accesible contiene los mismos diez países, propietario, marca y disponibilidad. El tamaño geográfico de un país no cambia su valor: cada territorio cuenta como uno. No se exige contigüidad; cualquier integrante puede elegir cualquier país del catálogo.
## Preparación de las preguntas
El servidor fija un paquete por país, grupo y temporada: cinco ciudades en un orden definido, con una versión de datos y de reglas. Todos los intentos oficiales sobre ese territorio usan exactamente ese paquete. Una nueva temporada genera nuevos paquetes; si el catálogo solo tiene cinco ciudades, al menos cambia el orden y debe ampliarse el banco antes de promocionar variedad.
Las repeticiones favorecen la memoria de forma deliberada. Todos tienen el mismo límite de intentos. El modo de práctica no utiliza el paquete oficial ni altera el tablero; el resultado oficial puede revisar únicamente las respuestas del intento propio.
## Capturar un territorio libre
El jugador inicia una misión oficial y completa sus cinco rondas. Debe obtener al menos 2.000 de 5.000 puntos para capturarlo. Una marca inferior deja el país libre y consume el intento. La primera captura válida establece propietario y marca defensiva. El umbral aprobado es 2.000 puntos y se congela durante toda la temporada.
## Disputar un territorio ocupado
Se muestra el propietario y la marca antes de iniciar. Para conquistar, la nueva puntuación total debe ser estrictamente mayor que la marca defensiva. En empate conserva el propietario. Un ataque fallido no modifica la marca del dueño. El ganador se convierte en dueño y su puntuación pasa a ser la marca que futuros atacantes deben superar.
No se puede atacar un país propio ni elevar su defensa repitiendo una misión mientras se posee. Al perderlo se habilita “Recuperar territorio”, sujeto al mismo límite y espera que cualquier ataque. La defensa es la marca guardada: el dueño no tiene que conectarse ni aceptar cada ataque.
## Intentos y límites
Cada jugador dispone de cinco misiones oficiales por día de temporada, como máximo dos sobre un mismo país en ese día. Capturar, atacar y recuperar consumen el mismo presupuesto. Debe pasar una hora entre inicios oficiales sobre el mismo país, incluso al cambiar de día. Los cupos se renuevan en periodos comunes de 24 horas contados desde started_at; no se acumulan. El servidor muestra cupo total, cupo por país y tiempo de espera.
Un error anterior a entregar la primera pregunta no consume misión ni activa espera. Tras abrirla, abandono o desconexión consumen la misión. La misión se asigna al día de su inicio y no se descuenta otra vez si termina al día siguiente. Solo se permite un intento activo por jugador y uno por territorio. La práctica no consume misiones ni altera el tablero.
# 3 Partida y puntuación
## Comportamiento por ronda
La partida presenta cinco ciudades sucesivas. Cada ronda dura 15 segundos. Una respuesta válida registra una sola coordenada elegida por el jugador. El mapa no muestra nombres ni marcadores de las ciudades objetivo antes de responder. La interfaz distingue puntos acumulados, ronda actual y marca total del rival; nunca compara el parcial propio con un supuesto parcial rival no registrado.
Regla específica de Conquista: agotar el tiempo da cero puntos en esa ronda y continúa con la siguiente; no termina toda la misión. Se conserva la posibilidad de completar las cinco. Tras cada respuesta, mostrar ubicación correcta, distancia, tiempo y puntos, con botón Siguiente y avance automático a los 3 segundos. La cuenta de la siguiente pregunta solo comienza cuando el servidor la abre.
## Fórmula aprobada y versionada
Se aprueba una puntuación propia para este modo, sin combos: cinco rondas de 0 a 1.000 puntos. Reutilizar el componente de cálculo existente solo si reproduce exactamente esta versión. No cambiar la fórmula dentro de una temporada.
Distancia d: kilómetros mediante Haversine, con radio terrestre de 6.371 km. Tiempo t: segundos transcurridos en el servidor desde la apertura de la pregunta hasta la recepción de la respuesta; limitar t al intervalo de 0 a 15.
Cercanía = exp(−d / 500). Factor de velocidad = 0,5 + 0,5 × (1 − t / 15). Puntos de ronda = redondear(1.000 × cercanía × factor de velocidad). El redondeo es al entero más cercano y las mitades se redondean hacia arriba. Respuesta recibida al vencimiento o después: 0 puntos. Sin respuesta: 0 puntos. Puntos totales = suma de las cinco rondas, entre 0 y 5.000.
| Caso de control | Resultado esperado |
| d = 0 km y t = 0 s | 1.000 puntos |
| d = 0 km y t = 7,5 s | 750 puntos |
| d = 500 km y t = 7,5 s | 276 puntos |
| Sin respuesta o t ≥ 15 s | 0 puntos, continuar con la próxima ciudad |
| 5 rondas a 750 puntos | 3.750 puntos totales |
| Marca rival 3.420 y atacante 3.780 | Conquista; nueva defensa 3.780; ventaja 360 |

## Condiciones iguales y consecuencias
Mismo tiempo, paquete, mapa y fórmula para todos. No hay pistas, multiplicadores pagados, vidas ni compra de intentos. El servidor ignora puntuaciones calculadas o enviadas por el cliente. El cronómetro visible estima el reloj del servidor; el resultado oficial usa sus marcas temporales. Debe informarse que se requiere conexión y validar con móviles que la latencia no distorsione la competencia.
Un intento es completo cuando las cinco rondas han sido procesadas, aunque algunas hayan vencido. Un abandono expreso invalida la conquista: los puntos parciales no transfieren el país. La experiencia y las recompensas generales no deben duplicarse mediante reenvíos; para la primera versión, Conquista no suma XP al pase ni al ranking clásico.
# 4 Concurrencia y cierre de temporada
## Reserva del territorio
El inicio oficial crea atómicamente un intento, descuenta su cupo y reserva el territorio durante un máximo de tres minutos. Se valida que el jugador tenga cupo, no esté en espera y no tenga otra misión abierta. Los demás ven “Disputa en curso” y el tiempo restante; no pueden iniciar sobre ese país mientras dure la reserva. El propietario no cambia hasta resolver el intento.
La reserva incluye la versión del territorio. Al finalizar, una sola transacción valida reserva, propietario y marca anteriores, calcula el resultado y actualiza propietario, defensa, actividad y versión. El mismo intento finalizado dos veces devuelve el mismo resultado; no genera dos conquistas, notificaciones o recompensas.
## Desconexión y recuperación
Una desconexión no pausa ni reinicia los relojes. Al volver, el servidor devuelve el intento existente y la pregunta actual, sin revelar coordenadas correctas antes de cerrar la ronda. Las rondas vencidas se procesan con cero. Recargar o abrir otra pestaña nunca crea otro intento ni añade tiempo. Al vencer los tres minutos sin finalizar, el intento se marca expirado, no conquista y libera la reserva. Si falla el servidor antes de abrir la primera ronda, se revierte el consumo; una incidencia posterior requiere trazabilidad, sin devolución automática explotable.
## Límite temporal
La temporada comienza en started_at y termina exactamente siete días después en ends_at, almacenados en UTC y mostrados en hora local con cuenta regresiva. No se permiten nuevos inicios en los últimos tres minutos. Los intentos ya abiertos tienen como límite el menor entre su vencimiento y ends_at. Solo resultados confirmados por el servidor antes de ends_at modifican el mapa.
Al llegar ends_at se bloquean nuevas mutaciones, se expiran intentos pendientes y se genera una instantánea única. El trabajo de cierre debe poder reintentarse sin duplicar el ranking ni las insignias. Si el cierre se demora, la interfaz muestra “Calculando resultados” y no abre otra temporada hasta terminar.
## Clasificación final
Ordenar por territorios poseídos al cierre, de mayor a menor. Si hay empate, comparar la suma de las marcas defensivas de esos territorios. Si persiste, compartir posición y recompensa; el orden alfabético solo organiza visualmente a quienes empatan. No desempatar por gasto, antigüedad de cuenta ni tiempo de conexión. Un empate a cero territorios comparte clasificación, pero no concede insignia de campeón.
La lista de territorios, contador, posición del jugador y resultado final deben derivarse de la misma instantánea. Ganador: mayor clasificación entre quienes tengan al menos un territorio. Recompensa inicial aprobada: insignia cosmética de campeón de la temporada, sin bonus de puntuación. Un logro de participación puede existir solo si se diseña y documenta por separado.
## Reinicio
El cierre no borra el historial. La próxima temporada comienza con los países libres, intentos reiniciados y nuevas preguntas. Requiere sala con al menos dos participantes confirmados. Conservar la composición histórica del grupo, propietarios finales y versión de reglas de cada temporada.
# 5 Pantallas y estados de interfaz
Se requieren seis pantallas principales y dos vistas de apoyo. Estas últimas pueden implementarse como rutas o paneles reutilizables. Las maquetas anexas ilustran las seis principales; los valores mostrados son ejemplos. Este documento manda sobre cualquier contradicción en textos, geografía o contadores de las imágenes.
| ID | Vista | Contenido y acciones indispensables |
| A1 | Crear o unirse | Nombre del grupo; crear; código; vista previa; confirmar ingreso; errores por cupo y código. |
| A2 | Sala de espera | Lista de hasta 5; administrador; cupos; invitar; reglas; iniciar; salir antes del inicio. |
| P1 | Mapa de conquista | Grupo; temporada; cuenta regresiva; países; propietario y marca; leyenda; lista alternativa; selección. |
| P2 | Ficha del territorio | País; dueño o libre; defensa; 5 ciudades y 15 s; umbral; intentos restantes; espera; iniciar o practicar. |
| P3 | Partida | Objetivo; ronda; cronómetro; mapa sin respuestas; puntos propios; defensa total; zoom; abandonar. |
| P4 | Resultado | Conquista o defensa conservada; ambas marcas; diferencia; propietario final; revisión; volver al mapa; compartir. |
| P5 | Actividad del grupo | Conquistas y pérdidas con fecha; filtro por propios; recuperar si es elegible; eventos deduplicados. |
| P6 | Temporada | Ranking en vivo o final; criterio; tiempo restante; premio; historial; iniciar próxima desde sala. |

## Estados que deben diseñarse
- Cargando, vacío, error recuperable y sin conexión en cada consulta; nunca presentar un cero transitorio como dato definitivo.
- Territorio libre, propio, rival, reservado, espera activa, intentos agotados y temporada cerrada. El botón debe explicar por qué está bloqueado.
- Resultado de captura, ataque ganado, ataque perdido, empate, abandono y expiración. Mostrar marca defensiva cero como “Sin marca” solo en países libres.
- Grupo con 1 a 5 integrantes, invitación inválida, grupo lleno, temporada iniciada y usuario no miembro. El límite es cinco en textos y lógica.
- Si no se respondió ninguna ronda, distancia y tiempo medios se muestran “Sin respuestas”, nunca 0 m como si fuera precisión perfecta.
## Identidad y accesibilidad
Mantener navy, turquesa y amarillo de GeoSpeed. Usar los recursos aprobados de Pin sin redibujarlo desde las maquetas. Amarillo identifica territorios propios; rivales usan avatares, alias y patrones o colores distinguibles. Traducir objetivos, países, instrucciones, resultados y etiquetas accesibles al español e inglés. Proporcionar controles táctiles amplios, reducción de movimiento, alternativa de lista al mapa y foco visible. Validar el mapa jugable y sus controles con teclado; no declarar accesibilidad completa sin probarlo.
# 6 Contrato de datos y servicios
La arquitectura concreta debe adaptarse al backend actual. Las entidades y operaciones siguientes describen el contrato mínimo; no presuponen tablas ni endpoints ya existentes.
| Entidad | Datos mínimos |
| Grupo | id, nombre, admin_user_id, estado, invitation_hash, created_at |
| Membresía | group_id, user_id, rol, joined_at; unicidad por grupo y usuario |
| Temporada | id, group_id, estado, roster_snapshot, started_at, ends_at, catálogo y rules_version |
| Paquete | season_id, country_id, cinco city_ids ordenados, dataset_version; acceso privado |
| Territorio | season_id, country_id, owner_user_id nullable, defense_score, version, reservation_id |
| Intento | id, season_id, country_id, attacker_id, owner_at_start, version_at_start, estado, started_at, expires_at, total |
| Ronda | attempt_id, índice, city_id, opened_at, deadline_at, coordenada recibida, received_at, distancia, puntos |
| Evento | id, season_id, attempt_id, tipo, actor, propietario anterior y nuevo, fecha; clave única |
| Cierre | season_id único, ranking_snapshot, territorios, desempates, recompensas y fecha |

## Operaciones del servidor
Crear grupo; previsualizar invitación sin exponer datos privados; aceptar invitación; consultar sala; regenerar invitación; quitar integrante antes del inicio; iniciar temporada; consultar mapa; reservar intento; abrir ronda; responder o vencer ronda; finalizar o abandonar intento; consultar resultado, actividad y clasificación; cerrar temporada; preparar siguiente sala.
Cada comando mutable recibe una clave de idempotencia vinculada al usuario y a la operación. Responder además vincula intento e índice de ronda. Repetir un envío no abre otra pregunta ni cambia una respuesta aceptada. Las respuestas deben devolver el estado canónico, el reloj del servidor y códigos de error estables para traducirlos en la interfaz.
## Validaciones y controles
- Aplicar el máximo de cinco y la plantilla congelada mediante transacciones del servidor, no solo deshabilitando botones.
- Validar coordenadas finitas en rangos geográficos, secuencia, plazo y pertenencia del intento. El cliente no puede escribir dueño, marca, puntos ni premio.
- Entregar preguntas de una en una y la respuesta correcta solo tras cerrar su ronda. Evitar paquetes, coordenadas objetivo o claves de servidor en recursos públicos.
- Autorizar por miembro y temporada en toda operación. El jugador ve resultados propios y marcas públicas del grupo; no las coordenadas privadas de otros intentos.
- Aplicar límites de solicitudes a invitaciones y respuestas, registrar rechazos y conservar una auditoría de cambios de dueño. Estas medidas reducen abuso; no certifican ausencia de trampas.
# 7 Criterios de aceptación
Producto y QA deben ejecutar estos casos con cuentas separadas. Todos son requisitos de salida de la versión inicial aprobada.
| ID | Escenario y resultado esperado |
| CA01 | Grupos de 2, 3, 4 y 5 pueden iniciar. Con 1 no se habilita el inicio. |
| CA02 | Dos ingresos simultáneos al último cupo: uno entra y el otro recibe grupo completo. Nunca hay 6. |
| CA03 | Reabrir invitación no duplica membresía. Código regenerado deja de aceptar ingresos. |
| CA04 | Temporada activa rechaza nuevos miembros, expulsiones, cambios de reglas y reinicios. |
| CA05 | Los cinco miembros reciben las mismas ciudades, orden y versión por país y temporada. |
| CA06 | Misión completa con 1.999 deja libre; con 2.000 captura. Marca persistida coincide con resultado. |
| CA07 | Defensa 3.420: atacante 3.419 pierde, 3.420 empata sin transferencia y 3.780 conquista. |
| CA08 | Se cumplen los ejemplos de puntuación. Vencer una ronda da cero y permite completar cinco. |
| CA09 | Sexta misión del día y tercera sobre el mismo país rechazadas; espera de 1 h incluso al cambiar de día. |
| CA10 | Dos atacantes concurrentes: solo uno reserva. El otro ve disputa en curso y no pierde intento. |
| CA11 | Reenviar respuesta o finalizar varias veces no altera puntos ni duplica dueño, evento o premio. |
| CA12 | Recargar y abrir segunda pestaña recupera el mismo intento y no reinicia el reloj. |
| CA13 | Abandono o reserva expirada no conquista, consume intento y libera el país. |
| CA14 | No se inicia en los últimos 3 minutos. Resultado tardío no modifica la instantánea final. |
| CA15 | Empate por países usa suma de defensas; empate total comparte lugar y premio si tiene países. |
| CA16 | Cierre ejecutado dos veces produce una instantánea y una recompensa por ganador. |
| CA17 | Mapa, resultado y ranking muestran el mismo dueño y puesto con la misma versión de datos. |
| CA18 | Usuario ajeno no consulta actividad, paquetes o intentos modificando IDs o enlaces. |
| CA19 | Compartir exige acción del usuario. Silenciar grupo no envía alertas externas. |
| CA20 | Español e inglés completos; sin respuestas muestra Sin respuestas; sin contenido aparece estado vacío. |
| CA21 | En móvil real se puede tocar, desplazar y ampliar el mapa sin respuestas accidentales. |
| CA22 | Nueva temporada deja países libres y renueva intentos sin borrar el historial anterior. |

# 8 Entrega y decisiones de producto
## Orden de implementación
- Entrega 1: grupos, autenticación, invitaciones, cupos atómicos, sala e inicio con reglas congeladas.
- Entrega 2: catálogo revisado, tablero, misión de cinco ciudades, fórmula del servidor, reservas y límites.
- Entrega 3: captura, ataque, recuperación, historial de cambios, actividad y ranking coherente.
- Entrega 4: cierre automático, empates, insignias, próxima temporada, traducciones y estados de error.
- Entrega 5: pruebas con dos y cinco cuentas, concurrencia, desconexión, cierre de temporada y móviles reales.
## Pruebas mínimas antes de habilitar
Ejecutar una temporada acelerada de QA con reloj controlado y cinco cuentas, además de una partida completa en dispositivos reales. Probar al menos Safari en iPhone y Chrome en Android, junto con escritorio. Verificar redes lentas, reingreso y consistencia entre dispositivos. Registrar versión de reglas, resultado esperado y evidencia de cada criterio; no usar las maquetas como prueba de funcionamiento.
Liberar inicialmente mediante bandera de función para un grupo de prueba. Antes de abrir al público, todos los criterios críticos de cupos, puntuación, permisos, transferencia, límites y cierre deben pasar. La tienda y el pase general conservan sus flujos actuales, pero no pueden conceder ventajas en Conquista.
## Registro de reglas aprobadas
| Decisión | Decisión aprobada |
| Duración y horarios | 7 días exactos; no iniciar ataques en los últimos 3 minutos |
| Catálogo inicial | 10 países fijos; ciudades verificadas y dificultad Turista para todos |
| Regla de captura libre | Misión completa con al menos 2.000 de 5.000 puntos |
| Puntuación | Fórmula sin combos de página 4; constante de distancia 500 km |
| Frecuencia | 5 misiones por día; máximo 2 por país; 1 hora entre inicios en ese país |
| Concurrencia | Reserva exclusiva de 3 minutos; un intento activo por jugador |
| Cierre y premio | Países, suma de defensas y empate compartido; insignia cosmética |
| Integración | Sin vidas, compras de ataques, XP del pase ni ranking clásico en versión inicial |

## Referencia visual y correcciones para desarrollo
Los dos anexos visuales reúnen las seis maquetas conceptuales ya presentadas. Ajustar el texto de grupo a “hasta 5 personas”. La actividad usa estados en momentos distintos, por lo que los contadores de una pantalla no deben copiarse como constantes. En la lámina 04–06, algunas miniaturas generadas no corresponden al país del texto; reemplazarlas por geometría geográfica verificada. No usar las siluetas ilustradas como mapas de producción.
Los recursos definitivos de Pin, mapas, banderas y nombres deben salir del catálogo aprobado del proyecto. Las vistas Crear o unirse y Sala de espera requieren completar su diseño, con la estructura aprobada. Los ejemplos de nombres y puntuaciones son ilustrativos y no representan resultados reales.
# 9 Auditoría del juego público del 26 de octubre
Objeto auditado: https://geospeed-challenge.vercel.app/ abierto desde el enlace de invitación compartido por Juanjo. Sesión de invitado en navegador de escritorio. Alcance: tres partidas hasta resultado final, una de ellas con seis rondas respondidas; puntuación, repetición, historial, persistencia, creación de reto, ranking, pase, tienda y soporte. No se completó una partida de trece rondas. No se hicieron compras ni se iniciaron sesiones de cuentas personales.
Esta sección registra lo observado durante la revisión inicial de hoy. No es una nueva prueba del sitio después de aprobar las reglas de Conquista y no debe marcarse como corregida sin una verificación posterior. La valoración fue habilitar una beta controlada y resolver los puntos de confianza antes de ampliar adquisición o monetización.
## Funciones verificadas
- La selección en mapa respondió y presentó ubicación correcta, distancia, tiempo, puntos y desglose del cálculo. Se observó acumulación de puntuación y combos en el juego clásico.
- El resultado incluyó detalle por ciudad, revisión de ubicaciones y repetición de las mismas ciudades. Se observó además la opción de practicar las cinco peores respuestas, sin probar ese recorrido completo.
- Partidas, récord y XP se actualizaron. Tras recargar se recuperó el progreso local. El historial mostró las partidas con su condición de tiempo agotado.
- Se creó un reto de prueba como invitado y apareció en Mis retos con contador uno y estado pendiente. No se envió la invitación a otras personas.
- El ranking cargó participantes. El centro de soporte abrió con preguntas frecuentes, contacto y atribución de datos geográficos. La identidad visual de Pin y GeoSpeed fue consistente en las pantallas revisadas.
## AUD01 Inconsistencia del puesto anunciado
Prioridad alta. En la pantalla de resultado se anunció Top 2. Al abrir el ranking de Mundo y Turista se mostró el puesto 6 con 734 puntos, entre siete participantes. El resultado no explicó si usaba una clasificación local, temporal u otra diferente.
Corrección requerida: unificar cálculo y filtros, o rotular explícitamente el alcance de cada clasificación. Aceptación: la pantalla de resultado y la tabla coinciden para la misma versión, periodo, región, dificultad y categoría; una actualización concurrente debe explicar el cambio.
## AUD02 Recompensas sin identificación clara
Prioridad alta. El pase mostró interrogaciones, nombres como ??? y espacios sin contenido. No se observó una explicación de recompensa sorpresa.
Corrección requerida: mostrar nombre, recurso visual y condición de desbloqueo, o explicar el ocultamiento intencional. Aceptación: ninguna recompensa se representa mediante datos faltantes y todas las ofertas premium describen qué obtiene el jugador.
# 10 Hallazgos comerciales y de experiencia
## AUD03 Condiciones comerciales contradictorias
Prioridad alta. La tienda presentó planes mensual y anual como pagos únicos sin renovación automática, y a la vez indicó que se podía cancelar la suscripción en cualquier momento.
Corrección requerida: definir una sola descripción para cada modalidad, indicando vigencia, vencimiento y renovación. Aceptación: tarjeta, ayuda y flujo de pago expresan las mismas condiciones y no prometen cancelar una renovación que no existe.
## AUD04 Pago sin verificación completa
Prioridad alta para validar, sin atribución de causa al juego. Pro mensual redirigió a Mercado Pago, que devolvió un error de acceso. No se realizó transacción. La observación no demuestra por sí sola un defecto de GeoSpeed y puede depender del navegador o del proveedor.
Validación requerida: reproducir en navegador y dispositivo habituales; probar pago aprobado, rechazado y cancelado, retorno al juego, activación y recuperación de la compra, y notificaciones repetidas del proveedor sin duplicar el beneficio. No declarar el pago operativo solo porque redirige.
## AUD05 Localización incompleta
Prioridad media. Con interfaz en inglés aparecieron El Cairo, Egipto, Johannesburgo y rótulos del mapa en español. La pregunta usó Where is? por separado del nombre de ciudad.
Corrección requerida: traducir países, ciudades con nombre localizado, mapa y etiquetas accesibles. Aceptación: ambos idiomas conservan términos coherentes y la pregunta inglesa se construye como Where is [city]?
## AUD06 Eliminación poco explícita para principiantes
Decisión de experiencia para validar. En el juego clásico, agotar el tiempo de una ciudad terminó la partida. El inicio indicaba trece ciudades y quince segundos por ciudad sin destacar claramente la eliminación. No se clasifica como fallo de programación porque puede ser una regla intencional.
Acción requerida: explicar la regla antes de empezar o probar una variante más tolerante con jugadores nuevos. En Conquista la decisión ya aprobada es distinta: una ronda vencida vale cero y se continúa con las cinco ciudades.
## AUD07 Oferta de vidas temprana
Hipótesis de experiencia. Después de la segunda partida se mostró una oferta de cinco vidas por US$0,99. Se pudo cerrar y seguir. La posible pérdida de retención no se ha medido.
Acción requerida: observar si jugadores nuevos entienden el juego y desean repetir antes de mostrar esta oferta. Mantener la compra fuera de Conquista, donde los intentos son iguales para todos.
## AUD08 Claridad de progresión y reinicio diario
Prioridad media de contenido. Al inicio, el jugador figuró en nivel 1 mientras el pase mostró nivel 0 con cero XP; si son progresiones independientes, deben nombrarse así. El reto diario anunció reinicio a medianoche sin indicar zona horaria.
Aceptación: distinguir nivel de jugador y nivel del pase; indicar el próximo reinicio mediante cuenta regresiva o zona horaria. Verificar ambos idiomas.
# 11 Validación pendiente y control de cambios
## Pruebas pendientes de la auditoría inicial
| ID | Recorrido que falta verificar |
| VP01 | Partida clásica de trece rondas completa, resultado, guardado y reapertura del detalle. |
| VP02 | Dos cuentas distintas: abrir invitación, jugar ambos lados, comparar resultado y pedir revancha. |
| VP03 | Alta, acceso, recuperación de cuenta y migración del progreso de invitado sin duplicaciones. |
| VP04 | Sincronización entre dispositivos, recarga durante partida y recuperación de sesión. |
| VP05 | Pago completo, activación del beneficio, restauración y tratamiento de fallo o cancelación. |
| VP06 | Safari en iPhone y Chrome en Android reales: precisión táctil, zoom, orientación y redes lentas. |
| VP07 | Retención con jugadores reales: comprensión inicial, finalización, repetición y retorno. No hay resultados medidos. |
| VP08 | Pruebas de carga, seguridad de puntuaciones y accesibilidad. La auditoría visual no acredita estos aspectos. |

## Condición para cerrar los hallazgos
Desarrollo registra por cada AUD: responsable, causa encontrada, versión corregida y evidencia. QA reproduce el escenario, contrasta el resultado esperado y marca verificado o pendiente. En AUD04 primero debe identificarse dónde ocurre el error; no convertir una limitación de la revisión en un defecto confirmado.
## Cambios aprobados en la versión 1 punto 1
- Temporadas de siete días y diez países fijos; cinco ciudades y quince segundos por ronda.
- Captura libre desde 2.000 puntos; cinco misiones por día, máximo dos por país y espera de una hora entre inicios en ese país, incluso al cambiar de día.
- Reserva exclusiva reducida de cuatro a tres minutos. No se abren misiones en los últimos tres minutos de la temporada.
- Defensa por marca, empate favorable al dueño y clasificación final por territorios, suma de defensas y empate compartido.
- Premios cosméticos; sin vidas, ventajas pagadas o XP del pase en la primera versión.
- Actividad interna, avisos opcionales por pérdidas y recordatorios a 24 horas y una hora del cierre. Transferencia de administración por salida o baja de cuenta.
- Seis pantallas principales y dos vistas de apoyo aprobadas; completar su diseño y corregir las referencias geográficas de las maquetas.
## Validaciones adicionales de las decisiones aprobadas
CA23: el cupo se renueva en la misma frontera de 24 horas para todos; no acumula remanentes, respeta la hora de espera y asigna al día de inicio una misión que cruza la frontera. CA24: silenciar cancela avisos; recordatorios no se duplican. CA25: baja de administrador transfiere el rol al miembro restante de mayor antigüedad sin alterar el cierre automático. CA26: mostrar la reserva de tres minutos y liberar el país al expirar sin transferirlo.
# Anexo 1 Mapa territorio y partida
Maqueta conceptual de referencia. Adaptar las reglas y el límite de participantes a esta especificación.
Seis pantallas principales en total. Estructura aprobada; aplicar las reglas de esta versión. Las imágenes conservan datos ilustrativos y no reemplazan el catálogo geográfico definitivo.
# Anexo 2 Resultado actividad y temporada
Maqueta conceptual de referencia. Adaptar las reglas y el límite de participantes a esta especificación.
Seis pantallas principales en total. Estructura aprobada; aplicar las reglas de esta versión. Las imágenes conservan datos ilustrativos y no reemplazan el catálogo geográfico definitivo.