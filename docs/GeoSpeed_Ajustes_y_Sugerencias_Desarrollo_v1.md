# GEOSPEED — Consolidado de ajustes y sugerencias para desarrollo

**Versión:** 1.0 · **Corte:** 17 de octubre de 2026 · **Solicitante:** Juan José Grillo.

## 1. Propósito y alcance

Consolidar las propuestas surgidas durante el rediseño y aprobación de maquetas de GeoSpeed. Este documento permite al equipo contrastar cada propuesta con el juego actual, estimar el trabajo y aclarar definiciones antes de implementar. No se ha auditado el código ni verificado el despliegue actual: una pantalla aprobada no acredita que su funcionalidad ya exista.

Se incluyen cambios visuales, nuevas funciones, reglas expresamente acordadas, estados de interfaz y decisiones pendientes. El catálogo de 195 imágenes de países fue confirmado como completado por el usuario. No se introducen aquí nuevas fórmulas de puntuación, precios ni reglas comerciales.

### Cómo interpretar los estados

| Estado | Significado |
|---|---|
| Función nueva confirmada | Propuesta adicional al juego actual; no presentarla como implementada. |
| Regla funcional acordada | Comportamiento expresamente definido durante el diseño. |
| Diseño aprobado | Referencia visual aceptada; comprobar capacidades y datos del juego antes de implementarla. |
| Por definir | El diseño no resuelve la decisión; requiere especificación del producto/equipo. |
| Superado | Conservar como historial; no usar como lógica vigente. |

## 2. Inventario de cambios por módulo

| ID | Módulo | Ajuste propuesto | Estado / tratamiento |
|---|---|---|---|
| UI-01 | Identidad | Azul océano, turquesa, amarillo cálido, blanco y coral puntual; pin Explorador expresivo y marca GEOSPEED. | Diseño aprobado. Unificar variantes antes de producción. |
| UI-02 | Carga | Globo, mascota, pregunta «¿Cuánto conoces el mundo?» y presentación adaptada a cada dispositivo. | Diseño aprobado. |
| UI-03 | Inicio | Banner de cómo jugar, configuración compacta, Jugar ahora principal y accesos agrupados. | Usar revisiones v2 de inicio móvil y computador. |
| UI-04 | Configuración | Selectores de región y dificultad con contexto conservado. | Diseño aprobado; mantener catálogo y reglas reales. |
| UI-05 | Partida | Mapa protagonista; móvil horizontal sin lateral y computador con información lateral. | Diseño aprobado; no copiar coordenadas ilustrativas. |
| UI-06 | Feedback | Mostrar respuesta elegida, correcta, distancia y resultado de la ciudad. | Diseño aprobado. |
| UI-07 | Cierre | Diferenciar tiempo agotado, completada y récord; repetir ciudades, nueva partida y detalle. | Diseño aprobado; verificar acciones existentes. |
| EDU-01 | Revisión | Detalle por ciudad, mapa de corrección, pista y navegación sin temporizador. | Nueva propuesta; existencia actual no verificada. |
| SOC-01 | Amigos | Reto asincrónico; sustituir la lógica de duelo simultáneo. | Regla funcional acordada. |
| SOC-02 | Invitación | Crear/unirse al reto; código o enlace y condiciones visibles. | Acceso por código propuesto; validar implementación. |
| SOC-03 | Resultado | Resultado pendiente y final con victoria, derrota o empate. | Diseño y regla de revelación acordados. |
| SOC-04 | Comparación | Distancia, tiempo y puntos de ambos por ciudad; mapa comparativo. | Propuesta aprobada para retos finalizados por ambos. |
| SOC-05 | Revancha | Nuevo reto con mismo rival y condiciones heredadas, con nuevas ciudades. | Función nueva autorizada para desarrollo. |
| SOC-06 | Mis retos | Bandeja persistente de invitaciones, partidas pendientes y resultados. | Función nueva; usuario confirma que no existe actualmente. |
| PRO-01 | Perfil | Identidad, nivel/XP, estadísticas y accesos a historial, ranking y retos. | Diseño aprobado; reglas de progreso no modificadas. |
| PRO-02 | Historial | Filtros, orden reciente, detalle y estado vacío para jugador nuevo. | Diseño aprobado; validar persistencia actual. |
| PRO-03 | Ranking | Top 10, posición propia y filtros por región/dificultad. | Diseño aprobado; método de clasificación por definir. |
| CFG-01 | Ajustes | Música, efectos, vibración, reducir movimiento, idioma, ayuda y privacidad. | Diseño aprobado; comprobar soporte real. |
| ACC-01 | Cuenta | Registro, inicio de sesión, invitado y controles de visibilidad de contraseña. | Propuesta visual; revisar alcance actual de cuentas. |
| ACC-02 | Recuperación | Solicitud, confirmación, nueva contraseña, éxito y enlace inválido/vencido. | Diseños aprobados; políticas técnicas por definir. |
| ACC-03 | Error de acceso | Aviso genérico y reintento sin revelar existencia de cuenta. | Diseño aprobado. |
| HELP-01 | Tutorial | Cómo jugar en tres pasos, móvil y computador. | Diseño aprobado. |
| CONTENT-01 | Países | Integrar selección editorial de 195 fotografías con créditos y licencias. | Catálogo completado por el usuario; integración por verificar. |

## 3. Mis retos: explicación y requerimiento funcional

**Es una funcionalidad nueva.** Su objetivo es que el jugador no dependa de conservar un enlace para encontrar un reto. Reúne en una sola sección los retos que envió, los que recibió, aquellos que le falta jugar y los resultados terminados, incluidas las revanchas.

**Ejemplo:** Ana reta a Juanjo. Juanjo encuentra la invitación en Mis retos, acepta y juega cuando puede. Ana puede haber jugado antes. Si Juanjo termina primero, se guarda su resultado y puede salir. Cuando ambos terminan, la misma tarjeta permite abrir el resultado y comparar las ciudades.

### 3.1 Estados y acciones

| Estado para el jugador | Significado | Acción |
|---|---|---|
| Por aceptar | Recibió una invitación que aún no acepta. | Ver invitación → Aceptar y jugar / Ahora no. |
| Te falta jugar | Tiene pendiente disputar su parte del reto. | Jugar mi reto. |
| Esperando al amigo | Ya terminó; el otro aún no termina. | Ver estado; conservar resultado propio. |
| Resultado listo | Ambos terminaron. | Ver resultado y comparación. |
| Sin retos | No tiene invitaciones ni retos. | Crear reto; contadores en cero. |

- Filtros **Todos / Pendientes / Terminados** con cantidades reales y coherentes con la lista.
- Cada tarjeta muestra rival/invitador, región, dificultad, cantidad real de ciudades, estado y acción correspondiente.
- Priorizar invitaciones y partidas propias pendientes.
- **Ahora no** conserva la invitación; no equivale a rechazarla.
- Volver al inicio no elimina el reto ni los resultados guardados.
- Acceso visible desde Inicio móvil v2, Inicio computador v2 y Perfil; mantener los accesos desde los flujos de amigos/revancha acordados.
- La pantalla vacía móvil está aprobada; la adaptación vacía para computador aún no se ha presentado.

### 3.2 Persistencia y aceptación

Guardar en servidor el reto, participantes, condiciones, invitaciones y resultados vinculados a la identidad de cada jugador. Cada usuario solo debe leer y disputar sus propios retos. La identidad del invitado y su posterior vinculación a una cuenta requieren definición: no asumir resuelto el acceso entre dispositivos para invitados.

Criterios de aceptación:

1. Crear un reto lo hace recuperable para sus participantes con el estado correspondiente.
2. Recargar o volver después conserva invitación y resultados terminados.
3. Los filtros y contadores corresponden a los mismos datos de la lista.
4. Repetir un clic o reintentar la misma solicitud no crea invitaciones duplicadas.
5. Terminar una parte actualiza el estado propio; terminar ambos habilita la comparación.
6. Antes de finalizar ambos no se revela el puntaje del rival.
7. El estado vacío aparece solo si realmente no hay retos; un fallo de carga no debe confundirse con cero retos. Este último punto es recomendación de implementación, no una maqueta adicional aprobada.

**Por definir:** interrupción de una partida, reanudación o reinicio, rechazo/cancelación, caducidad y limpieza de invitaciones. No se aprobó reanudación a mitad de partida ni avisos externos automáticos.

## 4. Reto asincrónico entre amigos

Esta decisión reemplaza las primeras exploraciones de duelo en vivo.

- Ambos reciben **el mismo conjunto y orden de ciudades**, dificultad y límites de tiempo por ciudad.
- Cada uno comienza y avanza a su ritmo: no hay reloj compartido, sala que exija presencia simultánea ni espera entre ciudades.
- Hay feedback individual durante su partida.
- Si uno termina primero, mostrar resultado propio guardado y comparación pendiente; puede salir.
- Revelar comparación y resultado conjunto únicamente tras terminar ambos.
- Mostrar victoria, derrota o empate con sus pantallas aprobadas, sin añadir reglas de desempate.
- Unirse mediante código fue propuesto visualmente; definir generación, validación y tratamiento de códigos inválidos antes de implementarlo.

**No implementar las entradas 25–30 del registro como lógica vigente:** contienen el duelo simultáneo superado. La comparación de ronda móvil exploratoria no aprobada tampoco debe implementarse.

## 5. Pedir revancha

**Función nueva aprobada para solicitar a desarrollo.** Desde el resultado final se crea otra invitación al mismo rival sin volver a seleccionarlo.

- Mostrar Pedir revancha en los cierres aprobados de derrota y empate. Mantener Crear otro reto como acción general cuando corresponda.
- Conservar rival, modalidad/región, dificultad y condiciones del reto original.
- Elegir ciudades nuevas y guardar un solo conjunto/orden compartido para ambos jugadores.
- Crear un reto con identidad propia; no modificar el resultado original.
- Entregar la invitación dentro de Mis retos del amigo, sin enviar mensajes externos automáticamente.
- El creador puede Jugar mi revancha sin esperar aceptación, Ver mis retos o Volver al inicio.
- El receptor ve quién lo invita y las condiciones; Aceptar y jugar inicia su partida individual; Ahora no conserva pendiente la invitación.
- Mantener oculta la puntuación del rival hasta terminar ambos.
- Evitar duplicados por doble clic/reintentos.

**Por definir:** qué hacer si no hay ciudades suficientes para evitar todas las usadas antes y si las invitaciones tendrán caducidad. Las cifras de las maquetas, como 13 ciudades, deben sustituirse por la cantidad real configurada.

## 6. Aprendizaje, feedback y revisión por ciudad

- Mostrar en feedback la ubicación marcada, la ubicación correcta, distancia y resultado.
- En Tus respuestas por ciudad, presentar una fila/tarjeta por ciudad con distancia, tiempo, puntos y acceso al detalle.
- Incorporar revisión de ciudad con mapa, comparación entre elección y ubicación correcta, pista para recordar y navegación entre ciudades sin temporizador.
- En retos, mostrar los datos de ambos y Ver mapa solo cuando ambos hayan terminado; conservar acceso al resultado propio antes de ello.
- Mantener las vistas móvil/computador y el mapa móvil horizontal aprobados. La paginación por tres ciudades de la referencia debe evaluarse según pantalla; no altera cuántas ciudades se juegan.
- Verificar fuentes de pistas, coordenadas, distancias y tiempos. Los números y puntos dibujados en las maquetas son ejemplos.

## 7. Rediseño visual y experiencia de juego

### 7.1 Identidad, mascota y animación

Aplicar la paleta aprobada, tarjetas redondeadas y jerarquía clara. Usar la mascota como acompañamiento del estado: tranquila al completar, entusiasta en récord, decepcionada de forma amable en derrota y celebrando en empate. Se sugirieron destellos discretos, salto/confeti breve para récord y cuenta 3–2–1–¡YA!.

Las maquetas posteriores muestran variantes del logotipo y de la mascota, incluida una con sombrero en acceso a cuenta. **No interpretar cada generación como un nuevo sistema de marca.** El equipo debe unificar el recurso maestro aprobado y las poses antes de producir assets. Las imágenes estáticas no son animaciones implementadas ni especifican duración/easing completos.

### 7.2 Inicio y selección

- Conservar banner Cómo se juega; mantener Jugar ahora como acción principal.
- Dar acceso a desafío diario, amigos, Mis retos y Más modos con jerarquía clara.
- Región: Mundo, Europa, Asia, América y África según selector aprobado; dificultad: Turista, Rookie, Crack, Leyenda.
- Al cambiar región conservar la dificultad y viceversa según flujo aprobado, sujeto a combinaciones realmente disponibles.
- Para computador usar Inicio v2 con Mis retos; la v1 queda como referencia histórica. En móvil, usar Inicio v2.

### 7.3 Orientación, mapa y cierre

- Móvil: aviso de girar antes del conteo, sin temporizador activo durante la espera; partida horizontal sin barra lateral.
- Computador: distribución horizontal con panel lateral en partida; conservar mapa multicolor y etiquetas de continentes/océanos.
- Considerar mapa ampliado/zoom según dirección visual; límites y gestos deben validarse para no interferir con la selección de respuesta.
- Diferenciar cierre por tiempo agotado, completado y récord, con resumen, mejor ronda y acceso al detalle.
- En cierre por tiempo agotado, Repetir ciudades es principal y Nueva partida secundaria según maqueta; validar mecánica vigente de repetición.
- Pro discreto en cierre es referencia visual; no define nuevos beneficios, precios ni cobros.

## 8. Perfil, historial y ranking

### Perfil

Identidad del jugador, nivel y progreso XP, partidas, récord y distancia media; accesos a historial, ranking y Mis retos. Las maquetas no cambian fórmulas de XP, nombres de nivel o umbrales existentes. Todos los valores ilustrativos deben venir de datos reales.

### Historial

Filtros de región/dificultad, partidas más recientes primero, fecha, estado, puntos, ciudades completadas y distancia media. Acceso al detalle por ciudad, cargar más y enlace a Mis retos. Adaptación móvil en tarjetas y computador en tabla. Últimas pantallas vacías móvil/computador aprobadas: mensaje inicial y Jugar ahora, sin resultados ficticios.

**Por definir:** alcance de persistencia para invitado/cuenta, definición exacta de distancia media, partidas interrumpidas y paginación de datos. Distinguir un historial vacío de un filtro sin coincidencias; este segundo estado no tiene maqueta específica aprobada.

### Ranking

Top 10 con primeros puestos diferenciados y posición propia visible aunque esté fuera del Top 10; filtros por región y dificultad. No fijar el puesto #24 ni puntos de Juanjo mostrados como ejemplo.

**Por definir:** si se compara mejor partida, acumulado u otro indicador; período, empates, elegibilidad de partidas repetidas y diferencias entre modos. No crear un torneo, premio o clasificación periódica por inferencia visual.

## 9. Ajustes y ayuda

Preferencias propuestas: música, efectos de sonido, vibración y reducir movimiento. Idioma visible: Español. Accesos a Cómo jugar, Soporte y Privacidad.

- Validar disponibilidad de audio/vibración; en computador la vibración está condicionada a que el dispositivo la permita.
- Definir persistencia de preferencias y alcance del modo de movimiento reducido.
- No inferir idiomas adicionales por existir un selector.
- Definir destino y contenido de Soporte y Privacidad; no inventar canales ni textos legales.
- Tutorial aprobado: leer ciudad → tocar/hacer clic en ubicación → sumar puntos por rapidez y precisión. Entendido cierra/regresa al origen; no debe iniciar una partida automáticamente.

## 10. Cuenta, invitado y recuperación

Son propuestas visuales aprobadas en los estados indicados; contrastar con autenticación ya disponible antes de estimar.

### Registro y acceso

- Registro: nombre de jugador, correo, contraseña y confirmación.
- Acceso: correo y contraseña, mostrar/ocultar contraseña, Crear cuenta, Olvidé mi contraseña y Seguir como invitado.
- No se ha definido una política de contraseña, verificación de correo ni proveedores sociales.
- La promesa visual de continuar en otro dispositivo depende de persistencia real de la cuenta.
- El registro conserva una salvedad: el inicio de sesión móvil normal no tiene confirmación explícita individual localizada; el estado de error móvil sí está aprobado. No extender una aprobación a otra pantalla sin verificarla.

### Recuperación y estados aprobados

1. Solicitar enlace mediante correo.
2. Confirmación genérica: «Si existe una cuenta asociada a ese correo, recibirás un enlace para restablecer tu contraseña», aviso de spam, volver a iniciar sesión o usar otro correo.
3. Nueva contraseña y confirmación, controles de visibilidad y Guardar contraseña.
4. Confirmación de cambio exitoso e Iniciar sesión; no asumir acceso automático.
5. Enlace inválido/vencido: solicitar nuevo y volver a inicio de sesión.
6. Error de acceso genérico: revisar correo y contraseña y reintentar, sin revelar cuál dato falló ni existencia de cuenta.

**Pendientes:** vigencia y uso único del enlace, tratamiento de sesiones anteriores, límites/reintentos, protección del flujo, reglas de contraseña e identidad del invitado. Son definiciones de ingeniería/producto, no valores aprobados por las maquetas.

## 11. Catálogo y modos

### Fotografías de países

El usuario confirmó **195/195 países completados**. Integrar las selecciones aprobadas y su correspondencia ISO, conservando autor, licencia, URL de licencia y fuente. Los archivos locales manejados durante la selección son `paises.sqlite`, `paises.json`, `paises.csv`, `CREDITOS.txt` y carpeta `imagenes`.

El descargador incorporó búsqueda solo de países pendientes, respaldo, búsquedas alternativas, aislamiento de fallos de miniaturas y conservación de aprobaciones/candidatas. Es una herramienta de preparación del catálogo, no una función del jugador. El equipo debe recibir el paquete real desde el computador del usuario; este documento no contiene las 195 fotografías ni acredita su publicación en el juego.

**Por definir:** ubicación/uso exacto de las fotos en el juego, optimización, formato y carga. Tener fotografías de países no cambia por sí solo la mecánica actual de localizar ciudades.

### Modos existentes o mostrados

Más modos reúne 60 segundos de caos, Imposible y Desafío Mundial. El Desafío diario se presentó con las mismas ciudades para todos y velocidad/precisión. Se aprobaron sus presentaciones; validar reglas existentes. No deducir nuevas penalizaciones, duración por ciudad, reinicios diarios o premios de textos exploratorios. La propuesta exploratoria Fútbol mundial no está aprobada individualmente como nuevo alcance.

## 12. Orden de implementación sugerido — por validar con el equipo

Este orden es una recomendación para planificación, no un compromiso de fechas ni una nueva aprobación funcional.

1. Auditar funcionalidades actuales y consolidar assets/estados aprobados.
2. Aplicar navegación, inicio, selectores, mapa y feedback sin alterar el motor vigente.
3. Definir identidad/persistencia necesaria para retos, historial y cuenta.
4. Implementar reto asincrónico y sus permisos/estados.
5. Implementar Mis retos y después Revancha reutilizando ese flujo.
6. Añadir revisión educativa, historial y ranking una vez cerradas las definiciones de datos.
7. Completar ajustes, ayuda y recuperación de cuenta según capacidades verificadas.
8. Integrar catálogo y verificar móvil/computador, estados vacíos y errores.

## 13. Decisiones que no deben darse por aprobadas

- Duelo simultáneo, reloj compartido o sala que obliga a esperar al rival: superados.
- Notificaciones automáticas por WhatsApp, correo u otros canales para invitar a retos.
- Caducidad concreta de invitaciones o enlaces, bloqueos y tiempos de espera.
- Reanudar una partida a mitad, cancelar/rechazar retos y resolver abandonos.
- Nuevas vidas, recompensas, precios, premios, desempates o fórmulas de puntos/XP.
- Integrar nuevos idiomas, proveedores de acceso o un modo Fútbol mundial.
- Convertir las cifras de ejemplo en valores fijos.

## 14. Trazabilidad y uso de referencias

Fuentes consolidadas: registro de aprobaciones vigente al 17 de octubre, solicitudes de desarrollo de Mis retos y Pedir revancha, y aprobaciones de esta conversación. Las referencias antiguas que dicen «pendiente» deben leerse junto con las aprobaciones posteriores: las versiones para computador de revancha y los resultados de victoria/derrota/empate ya se aprobaron.

El apéndice conserva el registro detallado de decisiones y nombres de archivos para localizar las maquetas. No es una auditoría de código ni un inventario definitivo de pantallas faltantes. Las tres últimas aprobadas son Historial vacío móvil, Historial vacío computador y Mis retos vacío móvil. No generar nuevas maquetas hasta entregar este consolidado, según petición del usuario.

---

# Apéndice A — Registro detallado de aprobaciones y referencias

```text
GEOSPEED — REGISTRO DE APROBACIONES
Actualizado: 17 de octubre de 2026, America/Bogota.

APROBADO
1. Isotipo Explorador v1: pin amarillo con rasgos expresivos, detalle de brújula y acentos turquesa. Aprobación explícita: «Me gusta».
2. Pantalla de carga v1: pin Explorador sobre globo, GEOSPEED escrito con dos e, pregunta «¿Cuánto conoces el mundo?». Aprobación explícita: «Bien me gusta».
3. Dirección visual: azul océano, turquesa y amarillo; diagramación general aceptada como referencia. Esto no equivale a aprobación individual de todas las pantallas.

4. Selección de región v1: panel sobre el inicio con Mundo, Europa, Asia, América y África; botón Confirmar región y conservación de dificultad. Aprobación explícita: «Aprobado», 13 de octubre de 2026. Archivo: GeoSpeed_Region_APROBADA_v1.png.

5. Selección de dificultad v1: Turista, Rookie, Crack y Leyenda; panel con región actual y botón Confirmar dificultad. Aprobación explícita: «Sí aprobado», 13 de octubre de 2026. Archivo: GeoSpeed_Dificultad_APROBADA_v1.png.

6. Girar teléfono v1: orientación horizontal antes del conteo; espera sin temporizador activo. Aprobación: «Aprobadas las 2». Archivo: GeoSpeed_Girar_APROBADA_v1.png.
7. Cuenta regresiva horizontal v1: 3–2–1–¡YA!, pin Explorador, paleta aprobada. Aprobación: «Aprobadas las 2». Archivo: GeoSpeed_Cuenta_Regresiva_APROBADA_v1.png.

8. Partida móvil horizontal v1: sin barra lateral, mapa multicolor y etiquetas de continentes y océanos. Aprobación: «Quedan aprobadas las 2, una para móvil (sin barra lateral)». Archivo: GeoSpeed_Partida_Movil_APROBADA_v1.png.
9. Partida computador v1: barra lateral izquierda, mismo mapa multicolor y etiquetas. Aprobación: «y la otra para computadora». Archivo: GeoSpeed_Partida_Computador_APROBADA_v1.png.

10. Feedback móvil v1: sin barra lateral, ubicación elegida y correcta, distancia y tarjeta de resultado. Aprobación: «Perfecto». Archivo: GeoSpeed_Feedback_Movil_APROBADA_v1.png.
11. Feedback computador v1: misma lógica con barra lateral. Aprobación: «Perfecto». Archivo: GeoSpeed_Feedback_Computador_APROBADA_v1.png.

12. Cierre por tiempo agotado v1: dos columnas con resumen, repetir ciudades principal, nueva partida secundaria, mejor ronda, detalle y Pro discreto. Aprobación: «De acuerdo». Archivo: GeoSpeed_Cierre_Tiempo_Agotado_APROBADA_v1.png.

13. Cierre partida completada v1: pin satisfecho, sonrisa tranquila, destellos discretos. Aprobación: «Aprobadas las emociones». Archivo: GeoSpeed_Cierre_Completado_APROBADA_v1.png.
14. Cierre nuevo récord v1: pin entusiasmado, sonrisa abierta, salto y confeti breve. Aprobación: «Aprobadas las emociones». Archivo: GeoSpeed_Cierre_Record_APROBADA_v1.png.

15. Tus respuestas por ciudad v1: tabla por ciudad (una ciudad por ronda), distancia, tiempo, puntos y acceso Ver. Título aclarado tras consulta del usuario. Aprobación: «Bien, aprobado». Archivo: GeoSpeed_Respuestas_Por_Ciudad_APROBADA_v1.png.

16. Revisión de ciudad v1: comparar ubicación elegida y correcta, pista para recordar, navegación sin límite de tiempo. FUNCIÓN NUEVA PROPUESTA, no confirmada como existente en el juego actual. Aprobación: «Me gusta mucho… Aprobada». Archivo: GeoSpeed_Revision_Ciudad_APROBADA_v1.png.

17. Más modos v1: tarjetas de 60 segundos de caos, Imposible y Desafío Mundial. Aprobación: «Aprobado más modos». Archivo: GeoSpeed_Mas_Modos_APROBADA_v1.png.

18. Carga computador v1: globo y Explorador a la izquierda, marca, pregunta y progreso a la derecha. Aprobación: «Aprobada». Archivo: GeoSpeed_Carga_Computador_APROBADA_v1.png.

19. Selección de región computador v1: cinco tarjetas en fila, Mundo seleccionado, confirmación conservando dificultad. Aprobación: «Aprobado». Archivo: GeoSpeed_Region_Computador_APROBADA_v1.png.

20. Selección de dificultad computador v1: cuatro niveles en fila, Turista seleccionado, resumen de región y confirmación. Aprobación: «Aprobada». Archivo: GeoSpeed_Dificultad_Computador_APROBADA_v1.png.

21. Más modos computador v1: tres tarjetas en paralelo con reglas y acceso Ver modo. Aprobación: «Perfecto aprobado». Archivo: GeoSpeed_Mas_Modos_Computador_APROBADA_v1.png.

22. Inicio computador v1: banner de cómo jugar a la izquierda, configuración y Jugar a la derecha, retos y progreso abajo. Aprobación: «Aprobado». Archivo: GeoSpeed_Inicio_Computador_APROBADA_v1.png.

23. Desafío diario computador v1: presentación del reto, mismas ciudades para todos, velocidad y precisión, botón Jugar desafío. Aprobación: «Aprobado». Archivo: GeoSpeed_Desafio_Diario_Computador_APROBADA_v1.png.

24. Desafío diario móvil v1: ilustración superior, reglas en columna y botón Jugar desafío. Aprobación: «Sí aprobado». Archivo: GeoSpeed_Desafio_Diario_Movil_APROBADA_v1.png.

25. Jugar con amigos móvil v1: crear duelo principal y unirse mediante código secundario. Acceso mediante código: FUNCIÓN PROPUESTA, no verificada en el juego actual. Aprobación: «Sí me gusta mucho». Archivo: GeoSpeed_Amigos_Movil_APROBADA_v1.png.

26. Jugar con amigos computador v1: crear duelo y unirse con código lado a lado. Acceso mediante código: FUNCIÓN PROPUESTA, no verificada en el juego actual. Aprobación: «Sí aprobado». Archivo: GeoSpeed_Amigos_Computador_APROBADA_v1.png.

27. Sala de espera duelo móvil v1: código e invitación, jugadores y estado, configuración, inicio habilitado cuando ambos estén listos. FLUJO PROPUESTO; código ilustrativo, no sala real. Aprobación: «Sí me gusta». Archivo: GeoSpeed_Sala_Duelo_Movil_APROBADA_v1.png.

28. Sala de espera duelo computador v1: invitación y configuración a la izquierda, jugadores y preparación a la derecha. FLUJO PROPUESTO; código ilustrativo, no sala real. Aprobación: «Ok aprobar». Archivo: GeoSpeed_Sala_Duelo_Computador_APROBADA_v1.png.

29. Partida duelo móvil horizontal v1: mapa amplio sin lateral, marcadores y estado de ambos jugadores arriba. Revelación al cerrar ronda: REGLA PROPUESTA aprobada visualmente, pendiente de implementación. Datos ilustrativos. Aprobación: «Bien aprobado». Archivo: GeoSpeed_Partida_Duelo_Movil_APROBADA_v1.png.

30. Partida duelo computador v1: barra lateral con ciudad, tiempo, ronda y ambos jugadores; mapa multicolor etiquetado. Datos ilustrativos. Aprobación: «Sí me gusta». Archivo: GeoSpeed_Partida_Duelo_Computador_APROBADA_v1.png.

31. Decisión funcional de amigos: RETO ASINCRÓNICO aprobado («Ok aprobado»). Ambos juegan mismas ciudades, dificultad y tiempo por ciudad; cada uno avanza a su ritmo; feedback individual durante la partida; comparación solo al terminar ambos; quien termina primero ve resultado guardado y espera al rival. No reloj compartido ni obligación de estar listos simultáneamente.

32. Jugar con amigos asincrónico móvil v2: crear o unirse al reto, cada uno a su ritmo, comparación al terminar ambos y empezar sin esperar. Sustituye entrada 25 para implementación. Aprobación: «Sí aprobado». Archivo: GeoSpeed_Amigos_Asincronico_Movil_APROBADA_v2.png.

33. Jugar con amigos asincrónico computador v2: crear o unirse al reto, cada uno a su ritmo y comparación al terminar ambos. Sustituye entrada 26 para implementación. Aprobación: «Sí aprobado». Archivo: GeoSpeed_Amigos_Asincronico_Computador_APROBADA_v2.png.

34. Invitación al reto móvil v2: código e invitación, condiciones fijas, participantes y Jugar mi reto habilitado sin esperar. Sustituye entrada 27 para implementación. Código ilustrativo. Aprobación: «Sí aprobado». Archivo: GeoSpeed_Invitacion_Reto_Movil_APROBADA_v2.png.

35. Invitación al reto computador v2: invitación izquierda, condiciones fijas y participantes derecha, jugar sin esperar. Sustituye entrada 28 para implementación. Código ilustrativo. Aprobación: «Sí aprobado». Archivo: GeoSpeed_Invitacion_Reto_Computador_APROBADA_v2.png.

36. Resultado pendiente reto móvil v1: puntuación guardada, amigo sin terminar, comparación pendiente, salir sin perder resultado y ver respuestas propias. Cifras ilustrativas. Aprobación: «Sí aprobado». Archivo: GeoSpeed_Reto_Resultado_Pendiente_Movil_APROBADA_v1.png.

37. Resultado pendiente reto computador v1: resultado propio izquierda, comparación pendiente e invitación derecha; salir con resultado guardado. Cifras ilustrativas. Aprobación: «Aprobado». Archivo: GeoSpeed_Reto_Resultado_Pendiente_Computador_APROBADA_v1.png.

38. Resultado final reto móvil v1, victoria: ambos completaron, puntuaciones y diferencia, resumen, comparación por ciudad y crear otro reto. Cifras ilustrativas. Aprobación: «Me gusta aprobado». Archivo: GeoSpeed_Reto_Resultado_Final_Movil_APROBADA_v1.png.

39. Resultado final reto computador v1, victoria: puntuaciones izquierda, resumen y acciones derecha, comparación disponible tras terminar ambos. Cifras ilustrativas. Aprobación: «Aprobado». Archivo: GeoSpeed_Reto_Resultado_Final_Computador_APROBADA_v1.png.

40. Comparación por ciudad del reto móvil v1: tarjetas con distancia, tiempo y puntos de ambos, Ver mapa, paginación de 3 ciudades. Disponible al terminar ambos. Cifras ilustrativas. Aprobación: «Sí aprobado, me gusta mucho, sigamos». Archivo: GeoSpeed_Reto_Comparacion_Ciudades_Movil_APROBADA_v1.png.

41. Comparación por ciudad del reto computador v1: tres tarjetas lado a lado, distancia/tiempo/puntos de ambos y Ver mapa. Disponible al terminar ambos. Cifras ilustrativas. Aprobación: «Perfecto». Archivo: GeoSpeed_Reto_Comparacion_Ciudades_Computador_APROBADA_v1.png.

42. Revisión de mapa del reto móvil horizontal v1: ambas respuestas y correcta, comparación, pista y navegación sin temporizador. Cifras y posiciones ilustrativas. Aprobación: «Aprobado», 13 de octubre de 2026. Archivo: GeoSpeed_Reto_Revision_Mapa_Movil_APROBADA_v1.png.

43. Revisión de mapa del reto computador v1: mapa amplio con etiquetas, respuestas de ambos y ubicación correcta; comparación, pista y navegación. Sin temporizador; disponible cuando ambos terminan. Coordenadas y distancias ilustrativas. Aprobación: «Sí aprobado», 13 de octubre de 2026. Archivo: GeoSpeed_Reto_Revision_Mapa_Computador_APROBADA_v1.png.

44. Resultado de derrota del reto móvil v1: pin decepcionado, comparación final y Pedir revancha. Aprobación explícita 13 de octubre de 2026: «Ok, aprobado y debemos incluir esa nueva opción dentro de las solicitudes a desarrollo». Archivo: GeoSpeed_Reto_Derrota_Movil_APROBADA_v1.png. Pedir revancha es funcionalidad nueva autorizada para solicitar a desarrollo.

45. Resultado de derrota del reto computador v1: puntajes y emociones a la izquierda, resumen y Pedir revancha a la derecha; comparación tras finalizar ambos. Aprobación: «Sí aprobado sigamos», 13 de octubre de 2026. Archivo: GeoSpeed_Reto_Derrota_Computador_APROBADA_v1.png.

46. Resultado de empate del reto móvil v1: ambos exploradores celebran, tarjetas equilibradas con igual puntaje, comparación y Pedir revancha. Cifras ilustrativas. Aprobación: «Aprobado», 13 de octubre de 2026. Archivo: GeoSpeed_Reto_Empate_Movil_APROBADA_v1.png.

47. Resultado de empate del reto computador v1: exploradores celebrando juntos, puntuaciones iguales con tarjetas equilibradas a la izquierda, resumen y Pedir revancha a la derecha. Cifras ilustrativas. Aprobación: «Ok aprobado», 13 de octubre de 2026. Archivo: GeoSpeed_Reto_Empate_Computador_APROBADA_v1.png.

48. Revancha enviada móvil v1: mismo rival, condiciones heredadas, ciudades nuevas, invitación dentro de los retos del amigo; creador puede empezar sin esperar aceptación, o volver al inicio. Aprobación: «Ok aprobado, sigamos», 13 de octubre de 2026. Archivo: GeoSpeed_Revancha_Enviada_Movil_APROBADA_v1.png.

49. Revancha enviada computador v1: rival a la izquierda, condiciones y participantes a la derecha; creador puede jugar sin esperar aceptación. Aprobación: «Sí aprobada», 13 de octubre de 2026. Archivo: GeoSpeed_Revancha_Enviada_Computador_APROBADA_v1.png.

50. Revancha recibida móvil v1: invitador, condiciones, Aceptar y jugar, Ahora no conserva invitación pendiente; puntuación rival oculta hasta finalizar ambos. Aprobación: «Ok», 13 de octubre de 2026. Archivo: GeoSpeed_Revancha_Recibida_Movil_APROBADA_v1.png.

51. Revancha recibida computador v1: invitador y mascota a la izquierda, condiciones e información a la derecha, Aceptar y jugar y Ahora no; puntuación rival oculta hasta terminar ambos. Aprobación: «Aprobado», 13 de octubre de 2026. Archivo: GeoSpeed_Revancha_Recibida_Computador_APROBADA_v1.png.

52. Mis retos móvil v1, funcionalidad nueva: lista persistente y filtros Todos/Pendientes/Terminados; estados por aceptar, te falta jugar, esperando al amigo y resultado listo. Aprobación: «Ok aprobado», 13 de octubre de 2026. Archivo: GeoSpeed_Mis_Retos_Movil_APROBADA_v1.png. Solicitud de desarrollo: GeoSpeed_Solicitud_Desarrollo_Mis_Retos_v1.txt.

53. Mis retos computador v1: cuatro tarjetas en dos columnas, filtros Todos/Pendientes/Terminados y acciones según estado. Funcionalidad nueva solicitada a desarrollo. Aprobación: «Ok de acuerdo», 13 de octubre de 2026. Archivo: GeoSpeed_Mis_Retos_Computador_APROBADA_v1.png.

54. Inicio móvil revisión v2: banner de cómo jugar conservado, región y dificultad compactas, Jugar ahora principal, acceso a Mis retos y navegación inferior. Revisión de pantalla existente; datos ilustrativos. Aprobación: «Ok aprobado, sigamos», 13 de octubre de 2026. Archivo: GeoSpeed_Inicio_Movil_APROBADA_v2.png.

55. Perfil móvil v1: identidad, nivel y progreso XP, estadísticas agrupadas y accesos a historial, ranking y Mis retos. Datos ilustrativos, sin nuevas reglas de progresión. Aprobación: «Aprobada», 13 de octubre de 2026. Archivo: GeoSpeed_Perfil_Movil_APROBADA_v1.png.

56. Historial móvil v1: filtros región/dificultad, partidas más recientes primero, fecha, estado, puntaje, ciudades y distancia media; acceso a detalle por ciudad, cargar más y enlace a Mis retos. Datos ilustrativos. Aprobación: «Ok aprobado», 13 de octubre de 2026. Archivo: GeoSpeed_Historial_Movil_APROBADA_v1.png. Perfil computador aprobado posteriormente en la entrada 60.

57. Historial computador v1: filtros y tabla de fecha, partida, estado, puntos, ciudades, distancia media y acceso a detalle por ciudad; cargar más y Mis retos. Datos ilustrativos. Aprobación: «Ok aprobado», 13 de octubre de 2026. Archivo: GeoSpeed_Historial_Computador_APROBADA_v1.png.

58. Ranking móvil v1: Top 10, filtros de región y dificultad y posición propia destacada. Nombres, posiciones y puntajes ilustrativos; sin nuevas reglas de puntuación o periodicidad. Aprobación explícita: «aprobado», 14 de octubre de 2026. Archivo: GeoSpeed_Ranking_Movil_APROBADA_v1.png. Siguiente propuesta: Ranking computador.

CATÁLOGO DE PAÍSES
El usuario confirmó el 14 de octubre de 2026: todas las imágenes de países completadas, 195 de 195.

59. Ranking computador v1: Top 10 en tabla, filtros de región y dificultad, posición propia destacada a la derecha y navegación lateral. Mismo contenido que móvil; datos ilustrativos, sin nuevas reglas. Aprobación explícita: «aprobado», 14 de octubre de 2026. Archivo: GeoSpeed_Ranking_Computador_APROBADA_v1.png.

60. Perfil computador v1: identidad y nivel con progreso XP a la izquierda; estadísticas de partidas, récord, distancia media y nivel a la derecha, con accesos a historial, ranking y Mis retos; navegación lateral. Conserva el contenido del perfil móvil, datos ilustrativos y sin nuevas reglas de progresión. Aprobación explícita: «aprobado», 15 de octubre de 2026. Archivo: GeoSpeed_Perfil_Computador_APROBADA_v1.png.

61. Inicio computador revisión v2: conserva banner, configuración y navegación; añade Mis retos junto a Jugar con amigos. Sustituye la referencia de inicio computador v1 para implementación. Archivo: GeoSpeed_Inicio_Computador_APROBADA_v2.png.
62. Ajustes móvil v1: preferencias de música, efectos, vibración y reducir movimiento; idioma Español, Cómo jugar, Soporte y Privacidad. Archivo: GeoSpeed_Ajustes_Movil_APROBADA_v1.png.
63. Ajustes computador v1: mismas opciones en dos columnas y navegación lateral; vibración condicionada a compatibilidad del dispositivo. Archivo: GeoSpeed_Ajustes_Computador_APROBADA_v1.png.
Aprobación explícita conjunta de entradas 61–63: «aprobadas las 3», 15 de octubre de 2026. Ajustes: aprobación visual; verificar capacidades actuales y definir persistencia, idiomas disponibles y destinos de ayuda/privacidad antes de implementar, sin inferir funcionalidad existente.

64. Inicio de sesión computador v1: correo, contraseña visible/oculta, iniciar sesión, crear cuenta, recuperación y seguir como invitado. Archivo: GeoSpeed_Login_Computador_APROBADA_v1.png.
65. Recuperar contraseña móvil v1: solicitud de enlace mediante correo y volver al inicio de sesión. Archivo: GeoSpeed_Recuperar_Contrasena_Movil_APROBADA_v1.png.
Entradas 64–65: aprobación «de acuerdo con las 2 adicionales», 15 de octubre de 2026. Inicio de sesión móvil no incluido en esta aprobación específica; queda pendiente de confirmación explícita.
66. Crear cuenta móvil v1: nombre de jugador, correo, contraseña y confirmación; crear cuenta, iniciar sesión o seguir como invitado. Aprobación «de acuerdo» tras mostrar esta imagen, 15 de octubre de 2026. Archivo: GeoSpeed_Crear_Cuenta_Movil_APROBADA_v1.png.
Acceso y recuperación: aprobaciones visuales; no acreditan implementación ni políticas de cuenta, contraseñas o persistencia.

67. Crear cuenta computador v1: ilustración e identidad izquierda, formulario derecha; nombre de jugador, correo, contraseña y confirmación, crear cuenta, iniciar sesión y seguir como invitado. Aprobación explícita «aprobado» al mostrar esta imagen, 15 de octubre de 2026. Archivo: GeoSpeed_Crear_Cuenta_Computador_APROBADA_v1.png. Recuperar contraseña computador aprobado en entrada 68.

68. Recuperar contraseña computador v1: correo, solicitar enlace, volver a iniciar sesión y aviso de revisar spam. Aprobación explícita «recuperar contraseña aprobada, sigamos», 16 de octubre de 2026. Archivo: GeoSpeed_Recuperar_Contrasena_Computador_APROBADA_v1.png.

69. Revisa tu correo móvil v1: confirmación genérica de solicitud sin revelar existencia de cuenta, aviso de spam y accesos a inicio de sesión u otro correo. Archivo: GeoSpeed_Revisa_Correo_Movil_APROBADA_v1.png.
70. Nueva contraseña móvil v1: nueva contraseña y confirmación con controles de visibilidad, guardar y volver a inicio de sesión. Archivo: GeoSpeed_Nueva_Contrasena_Movil_APROBADA_v1.png.
71. Nueva contraseña computador v1: mismo formulario, ilustración izquierda y campos derecha. Archivo: GeoSpeed_Nueva_Contrasena_Computador_APROBADA_v1.png.
Aprobación conjunta explícita entradas 69–71: «aprobados», 16 de octubre de 2026. Referencias visuales; no definen políticas de contraseña ni vigencia de enlaces.

72. Revisa tu correo computador v1: confirmación genérica, spam y acciones de inicio de sesión/otro correo. Archivo: GeoSpeed_Revisa_Correo_Computador_APROBADA_v1.png.
73. Contraseña actualizada móvil v1: confirmación de cambio exitoso y acceso a iniciar sesión. Archivo: GeoSpeed_Contrasena_Actualizada_Movil_APROBADA_v1.png.
74. Contraseña actualizada computador v1: mismo estado exitoso y acción en dos columnas. Archivo: GeoSpeed_Contrasena_Actualizada_Computador_APROBADA_v1.png.
Aprobación explícita conjunta entradas 72–74: «listo, aprobado sigamos», 16 de octubre de 2026. Referencias visuales, sin inicio de sesión automático.

75. Cómo jugar móvil v1: mapa ilustrativo, leer ciudad, tocar ubicación y sumar puntos por velocidad y precisión; Entendido y Volver al inicio. Archivo: GeoSpeed_Como_Jugar_Movil_APROBADA_v1.png.
76. Cómo jugar computador v1: mismo tutorial, mapa izquierda y pasos derecha; clic en lugar de toque. Archivo: GeoSpeed_Como_Jugar_Computador_APROBADA_v1.png.
77. Enlace no disponible móvil v1: enlace inválido o vencido, solicitar otro y volver a inicio de sesión; sin fijar vigencia. Archivo: GeoSpeed_Enlace_No_Disponible_Movil_APROBADA_v1.png.
Aprobación conjunta entradas 75–77: «perfecto, aprobado. sigamos», 17 de octubre de 2026.

78. Enlace no disponible computador v1: enlace inválido/vencido, solicitar nuevo y volver a inicio de sesión. Archivo: GeoSpeed_Enlace_No_Disponible_Computador_APROBADA_v1.png.
79. Error de inicio de sesión móvil v1: aviso genérico de fallo, reintento y accesos de cuenta/recuperación/invitado. Archivo: GeoSpeed_Login_Error_Movil_APROBADA_v1.png.
80. Error de inicio de sesión computador v1: mismo estado de error sin revelar existencia de cuenta ni reglas de bloqueo. Archivo: GeoSpeed_Login_Error_Computador_APROBADA_v1.png.
Aprobación conjunta entradas 78–80: «Aprobado, siguiente», 17 de octubre de 2026.

81. Historial vacío móvil v1: sin partidas, mensaje inicial, Jugar ahora y volver al inicio. Archivo: GeoSpeed_Historial_Vacio_Movil_APROBADA_v1.png.
82. Historial vacío computador v1: mismo estado, composición horizontal y barra lateral. Archivo: GeoSpeed_Historial_Vacio_Computador_APROBADA_v1.png.
83. Mis retos vacío móvil v1: contadores cero, crear reto y explicación asincrónica. Archivo: GeoSpeed_Mis_Retos_Vacio_Movil_APROBADA_v1.png.
Aprobación conjunta entradas 81–83: «las pantallas estan aprobadas», 17 de octubre de 2026. El usuario confirma que Mis retos NO existe en el juego actual; es desarrollo nuevo propuesto. Pausar nuevas maquetas para entregar consolidado Markdown de sugerencias.

REVISIÓN DE VERSIONES ANTERIORES
Las entradas 25–30 se conservan como historial visual, pero quedan SUPERADAS EN SU LÓGICA DE DUELO EN VIVO por la decisión 31. Deben adaptarse antes de implementación. La sala de espera pasa a invitación al reto; no bloquear inicio por ausencia del rival. La comparación de ronda móvil propuesta (exec-7eeb3647-59fc-4b6a-95d5-be40e2375ec1.png) NO está aprobada y no corresponde al flujo asincrónico.

PENDIENTE
Variantes de victoria, derrota y empate del resultado final de reto completas en móvil y computador. Revancha enviada aprobada en móvil y computador. Revancha recibida aprobada en móvil y computador.
Inicio móvil con banner y Mis retos aprobado como revisión v2. Inicio computador revisión v2 con Mis retos aprobado en entrada 61.
Pantallas anteriores agrupadas: propuestas exploratorias, no versiones aprobadas.

PROCESO
Presentar tres pantallas por tanda según instrucción posterior del usuario, recibir aprobación o ajustes, guardar la versión aprobada y actualizar este registro. Mantener propuestas pendientes separadas de aprobadas. No cambiar reglas del juego por inferencia de una maqueta.

PAUSA Y REVISIÓN PARA COMPUTADOR
Revisión completada; el usuario autorizó continuar las cuatro adaptaciones una a una.
Cuatro adaptaciones completadas y aprobadas: carga, región, dificultad y Más modos para computador.
Solo móvil: aviso de girar el teléfono.
Ya horizontal/utilizable como referencia para computador: cuenta regresiva, partidas (computador con barra), feedback computador, cierres, respuestas por ciudad y revisión de ciudad.
Isotipo común a ambos dispositivos. Las maquetas son referencias estáticas, no interfaces adaptativas implementadas.
Inicio computador con banner aprobado. Inicio móvil revisión v2 con banner y Mis retos aprobado.

```
