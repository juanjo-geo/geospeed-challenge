

# GeoSpeed IQ Challenge 🌍📍

## Descripción
Juego de geografía interactivo donde el jugador localiza ciudades del mundo en un mapamundi, combinando precisión geográfica y velocidad. Tagline: *"¿Cuánto conoces el mundo?"*

## Pantallas

### 1. Pantalla de Inicio (Home)
- Logo con ícono 📍 + "GEOSPEED IQ CHALLENGE" en estilo gold sobre fondo oscuro (#07130a)
- Tagline centrado
- 3 tarjetas de estadísticas: partidas jugadas, récord personal, distancia promedio
- Selector de dificultad: Fácil (🟢 30 capitales), Medio (🟡 30 ciudades regionales), Experto (🔴 30 ciudades poco conocidas)
- Botón JUGAR con gradiente gold y animación shimmer
- Ranking top 5 con medallas 🥇🥈🥉

### 2. Pantalla de Juego
- **Layout dos columnas landscape:**
  - Panel izquierdo (200px): logo, nombre de ciudad en gold, puntuación, progreso (X/13), multiplicador con badge de color, barra de tiempo (15s)
  - Área derecha: Canvas 2D con mapamundi de 140 países en colores vívidos (sin azules), océano #1a5f8a, gratícula cada 30°
- Click/tap registra coordenadas → cálculo Haversine → puntuación
- Animación 900ms: pin azul (usuario) + estrella dorada (correcto) + línea punteada con distancia

### 3. Popup de Resultado de Ronda
- Ciudad, país, distancia, puntos base × multiplicador
- Botón SIGUIENTE con cuenta regresiva de 10s y auto-avance

### 4. Pantalla de Resultado Final
- Modal de iniciales (3 letras) si califica para top 5
- Puntuación total, ciudades completadas, distancia promedio, mejor multiplicador
- Botones: JUGAR DE NUEVO / MENÚ PRINCIPAL

## Sistema de Puntuación
- Distancia < 50km = 1000pts, 50-200km = 800pts, 200-500km = 500pts, etc.
- Multiplicadores: < 4s = ×2 🚀, 4-9s = ×1 🎯, > 9s = ×0.5 🦕
- Tiempo agotado = fin de partida

## Características Técnicas
- 90 ciudades totales (30 por nivel) con coordenadas reales
- 140 polígonos de países en proyección equirrectangular
- Canvas offscreen cache para 60fps
- Persistencia con localStorage + fallback en memoria
- Overlay "Gira tu dispositivo" en portrait
- Paleta oscura con accent gold (#f5c842), tipografía Impact/system-ui/Courier New

