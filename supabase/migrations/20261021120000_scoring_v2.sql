-- ════════════════════════════════════════════════════════════════════════════
-- Puntaje v2 — Temporada 1 (Fase 1 del plan de competencia, 2026-10-20)
-- docs/GeoSpeed_Plan_Competencia.md · src/lib/scoring.ts
--
--   Puntos de la ronda = Cercanía × Rapidez × Combo × Dificultad
--
-- El SERVIDOR recalcula cada partida desde sus rondas (clic, lugar y tiempo): el puntaje que manda
-- el teléfono ya no cuenta. Todo en enteros, igual que src/lib/scoring.ts (si se cambia uno, cambiar
-- el otro):
--   · cercanía: 1.000 a menos de 25 km; si no, redondeo(1.000 × e^(−km / escala)); escala 1.500 km en
--     el mundo y el Mundial, 600 km en las regiones. Mundial: puntos de la banda (1.000/600/300/50/0).
--   · rapidez en milésimas: 2.200 − 13 × décimas de segundo, entre 400 y 2.200 (la curva de antes).
--   · combo por aciertos buenos seguidos (cercanía ≥ 800): 2–3 ×1,2 · 4–5 ×1,5 · 6–7 ×2,0 · 8+ ×2,5;
--     un regular (400–799) lo mantiene, un fallo lo rompe.
--   · dificultad en centésimas: 100 / 110 / 125 / 150 (el Mundial no la usa).
--   · puntos = (cercanía × rapidez‰ × combo‰₀ × dificultad% + 500.000) / 1.000.000 (mitad hacia arriba).
--
-- Además:
--   · `places`: catálogo con las coordenadas oficiales de cada lugar (scripts/build-places.mjs).
--     Si una ronda trae un lugar desconocido, se usan las coordenadas del teléfono pero la partida
--     queda marcada como sospechosa (no entra al ranking).
--   · Respuestas en menos de 0,3 s → partida sospechosa (fuera del ranking).
--   · game_results.scoring_version: 2 = Temporada 1; 1 = escala anterior ("Histórico").
--   · Ya no se puede insertar en game_results / game_rounds directamente: solo por save_game_result
--     (security definer) o la importación del historial local.
--   · leaderboard_top / my_rank reciben p_season: 't1' (por defecto) o 'historic'.
--   · Los retos en curso se recalculan con el puntaje v2 para que los dos jugadores se comparen igual.
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1) Catálogo de lugares ──────────────────────────────────────────────────
create table if not exists public.places (
  id         text primary key,
  kind       text not null default 'city' check (kind in ('city', 'flag', 'feature', 'monument')),
  name       text not null,
  country    text,
  lat        double precision not null,
  lon        double precision not null,
  created_at timestamptz not null default now()
);
alter table public.places enable row level security;
-- Sin políticas: solo lo leen las funciones del servidor
revoke all on public.places from anon, authenticated;
create index if not exists places_name_idx on public.places (name);

-- Generado por scripts/build-places.mjs a partir de src/data/cities.ts. No editar a mano.
insert into public.places (id, kind, name, country, lat, lon) values
  ('tokio', 'city', 'Tokio', 'Japón', 35.68, 139.69),
  ('pekin', 'city', 'Pekín', 'China', 39.90, 116.40),
  ('moscu', 'city', 'Moscú', 'Rusia', 55.76, 37.62),
  ('londres', 'city', 'Londres', 'Reino Unido', 51.51, -0.13),
  ('paris', 'city', 'París', 'Francia', 48.86, 2.35),
  ('berlin', 'city', 'Berlín', 'Alemania', 52.52, 13.41),
  ('roma', 'city', 'Roma', 'Italia', 41.90, 12.50),
  ('madrid', 'city', 'Madrid', 'España', 40.42, -3.70),
  ('buenos-aires', 'city', 'Buenos Aires', 'Argentina', -34.60, -58.38),
  ('ciudad-de-mexico', 'city', 'Ciudad de México', 'México', 19.43, -99.13),
  ('el-cairo', 'city', 'El Cairo', 'Egipto', 30.04, 31.24),
  ('bangkok', 'city', 'Bangkok', 'Tailandia', 13.76, 100.50),
  ('seul', 'city', 'Seúl', 'Corea del Sur', 37.57, 126.98),
  ('bombay', 'city', 'Bombay', 'India', 19.08, 72.88),
  ('estambul', 'city', 'Estambul', 'Turquía', 41.01, 28.98),
  ('sidney', 'city', 'Sídney', 'Australia', -33.87, 151.21),
  ('los-angeles', 'city', 'Los Ángeles', 'EE.UU.', 34.05, -118.24),
  ('rio-de-janeiro', 'city', 'Río de Janeiro', 'Brasil', -22.91, -43.17),
  ('nueva-york', 'city', 'Nueva York', 'EE.UU.', 40.71, -74.01),
  ('johannesburgo', 'city', 'Johannesburgo', 'Sudáfrica', -26.20, 28.05),
  ('washington-d-c', 'city', 'Washington D.C.', 'EE.UU.', 38.91, -77.04),
  ('ottawa', 'city', 'Ottawa', 'Canadá', 45.42, -75.70),
  ('canberra', 'city', 'Canberra', 'Australia', -35.28, 149.13),
  ('brasilia', 'city', 'Brasilia', 'Brasil', -15.79, -47.88),
  ('nairobi', 'city', 'Nairobi', 'Kenia', -1.29, 36.82),
  ('nueva-delhi', 'city', 'Nueva Delhi', 'India', 28.61, 77.21),
  ('yakarta', 'city', 'Yakarta', 'Indonesia', -6.21, 106.85),
  ('lima', 'city', 'Lima', 'Perú', -12.05, -77.04),
  ('bogota', 'city', 'Bogotá', 'Colombia', 4.71, -74.07),
  ('santiago', 'city', 'Santiago', 'Chile', -33.45, -70.67),
  ('ankara', 'city', 'Ankara', 'Turquía', 39.93, 32.86),
  ('riad', 'city', 'Riad', 'Arabia Saudita', 24.71, 46.68),
  ('teheran', 'city', 'Teherán', 'Irán', 35.69, 51.39),
  ('islamabad', 'city', 'Islamabad', 'Pakistán', 33.69, 73.04),
  ('hanoi', 'city', 'Hanói', 'Vietnam', 21.03, 105.85),
  ('manila', 'city', 'Manila', 'Filipinas', 14.60, 120.98),
  ('kuala-lumpur', 'city', 'Kuala Lumpur', 'Malasia', 3.14, 101.69),
  ('atenas', 'city', 'Atenas', 'Grecia', 37.98, 23.73),
  ('lisboa', 'city', 'Lisboa', 'Portugal', 38.72, -9.14),
  ('varsovia', 'city', 'Varsovia', 'Polonia', 52.23, 21.01),
  ('budapest', 'city', 'Budapest', 'Hungría', 47.50, 19.04),
  ('bucarest', 'city', 'Bucarest', 'Rumanía', 44.43, 26.10),
  ('kiev', 'city', 'Kiev', 'Ucrania', 50.45, 30.52),
  ('helsinki', 'city', 'Helsinki', 'Finlandia', 60.17, 24.94),
  ('oslo', 'city', 'Oslo', 'Noruega', 59.91, 10.75),
  ('copenhague', 'city', 'Copenhague', 'Dinamarca', 55.68, 12.57),
  ('dublin', 'city', 'Dublín', 'Irlanda', 53.35, -6.26),
  ('bruselas', 'city', 'Bruselas', 'Bélgica', 50.85, 4.35),
  ('berna', 'city', 'Berna', 'Suiza', 46.95, 7.45),
  ('la-habana', 'city', 'La Habana', 'Cuba', 23.11, -82.37),
  ('caracas', 'city', 'Caracas', 'Venezuela', 10.49, -66.88),
  ('quito', 'city', 'Quito', 'Ecuador', -0.18, -78.47),
  ('montevideo', 'city', 'Montevideo', 'Uruguay', -34.88, -56.16),
  ('asuncion', 'city', 'Asunción', 'Paraguay', -25.26, -57.58),
  ('la-paz', 'city', 'La Paz', 'Bolivia', -16.50, -68.15),
  ('pretoria', 'city', 'Pretoria', 'Sudáfrica', -25.75, 28.19),
  ('addis-abeba', 'city', 'Addis Abeba', 'Etiopía', 9.02, 38.75),
  ('accra', 'city', 'Accra', 'Ghana', 5.56, -0.19),
  ('dakar', 'city', 'Dakar', 'Senegal', 14.69, -17.44),
  ('argel', 'city', 'Argel', 'Argelia', 36.75, 3.04),
  ('rabat', 'city', 'Rabat', 'Marruecos', 34.02, -6.84),
  ('tunez', 'city', 'Túnez', 'Túnez', 36.81, 10.18),
  ('singapur', 'city', 'Singapur', 'Singapur', 1.35, 103.82),
  ('colombo', 'city', 'Colombo', 'Sri Lanka', 6.93, 79.84),
  ('katmandu', 'city', 'Katmandú', 'Nepal', 27.72, 85.32),
  ('daca', 'city', 'Daca', 'Bangladés', 23.81, 90.41),
  ('naipyido', 'city', 'Naipyidó', 'Myanmar', 19.76, 96.07),
  ('shanghai', 'city', 'Shanghái', 'China', 31.23, 121.47),
  ('barcelona', 'city', 'Barcelona', 'España', 41.39, 2.17),
  ('munich', 'city', 'Múnich', 'Alemania', 48.14, 11.58),
  ('milan', 'city', 'Milán', 'Italia', 45.46, 9.19),
  ('melbourne', 'city', 'Melbourne', 'Australia', -37.81, 144.96),
  ('toronto', 'city', 'Toronto', 'Canadá', 43.65, -79.38),
  ('chicago', 'city', 'Chicago', 'EE.UU.', 41.88, -87.63),
  ('sao-paulo', 'city', 'São Paulo', 'Brasil', -23.55, -46.63),
  ('lagos', 'city', 'Lagos', 'Nigeria', 6.52, 3.38),
  ('karachi', 'city', 'Karachi', 'Pakistán', 24.86, 67.01),
  ('ho-chi-minh', 'city', 'Ho Chi Minh', 'Vietnam', 10.82, 106.63),
  ('osaka', 'city', 'Osaka', 'Japón', 34.69, 135.50),
  ('dubai', 'city', 'Dubái', 'EAU', 25.20, 55.27),
  ('san-petersburgo', 'city', 'San Petersburgo', 'Rusia', 59.93, 30.32),
  ('casablanca', 'city', 'Casablanca', 'Marruecos', 33.57, -7.59),
  ('ciudad-del-cabo', 'city', 'Ciudad del Cabo', 'Sudáfrica', -33.93, 18.42),
  ('montreal', 'city', 'Montreal', 'Canadá', 45.50, -73.57),
  ('vancouver', 'city', 'Vancouver', 'Canadá', 49.28, -123.12),
  ('calcuta', 'city', 'Calcuta', 'India', 22.57, 88.36),
  ('chennai', 'city', 'Chennai', 'India', 13.08, 80.27),
  ('amsterdam', 'city', 'Ámsterdam', 'Países Bajos', 52.37, 4.90),
  ('viena', 'city', 'Viena', 'Austria', 48.21, 16.37),
  ('estocolmo', 'city', 'Estocolmo', 'Suecia', 59.33, 18.07),
  ('praga', 'city', 'Praga', 'Chequia', 50.08, 14.44),
  ('marsella', 'city', 'Marsella', 'Francia', 43.30, 5.37),
  ('lyon', 'city', 'Lyon', 'Francia', 45.76, 4.83),
  ('hamburgo', 'city', 'Hamburgo', 'Alemania', 53.55, 9.99),
  ('napoles', 'city', 'Nápoles', 'Italia', 40.85, 14.27),
  ('sevilla', 'city', 'Sevilla', 'España', 37.39, -5.98),
  ('oporto', 'city', 'Oporto', 'Portugal', 41.16, -8.63),
  ('cracovia', 'city', 'Cracovia', 'Polonia', 50.06, 19.94),
  ('gdansk', 'city', 'Gdansk', 'Polonia', 54.35, 18.65),
  ('san-francisco', 'city', 'San Francisco', 'EE.UU.', 37.77, -122.42),
  ('miami', 'city', 'Miami', 'EE.UU.', 25.76, -80.19),
  ('guadalajara', 'city', 'Guadalajara', 'México', 20.67, -103.35),
  ('medellin', 'city', 'Medellín', 'Colombia', 6.25, -75.56),
  ('cordoba', 'city', 'Córdoba', 'Argentina', -31.42, -64.18),
  ('recife', 'city', 'Recife', 'Brasil', -8.05, -34.87),
  ('salvador', 'city', 'Salvador', 'Brasil', -12.97, -38.51),
  ('guayaquil', 'city', 'Guayaquil', 'Ecuador', -2.17, -79.92),
  ('alejandria', 'city', 'Alejandría', 'Egipto', 31.20, 29.92),
  ('dar-es-salaam', 'city', 'Dar es Salaam', 'Tanzania', -6.79, 39.28),
  ('luanda', 'city', 'Luanda', 'Angola', -8.84, 13.23),
  ('canton', 'city', 'Cantón', 'China', 23.13, 113.26),
  ('shenzhen', 'city', 'Shenzhen', 'China', 22.54, 114.06),
  ('bangalore', 'city', 'Bangalore', 'India', 12.97, 77.59),
  ('hyderabad', 'city', 'Hyderabad', 'India', 17.39, 78.49),
  ('lahore', 'city', 'Lahore', 'Pakistán', 31.55, 74.35),
  ('perth', 'city', 'Perth', 'Australia', -31.95, 115.86),
  ('auckland', 'city', 'Auckland', 'Nueva Zelanda', -36.85, 174.76),
  ('jeddah', 'city', 'Jeddah', 'Arabia Saudita', 21.49, 39.19),
  ('izmir', 'city', 'Izmir', 'Turquía', 38.42, 27.13),
  ('gotemburgo', 'city', 'Gotemburgo', 'Suecia', 57.71, 11.97),
  ('ulan-bator', 'city', 'Ulán Bator', 'Mongolia', 47.91, 106.91),
  ('antananarivo', 'city', 'Antananarivo', 'Madagascar', -18.88, 47.51),
  ('biskek', 'city', 'Biskek', 'Kirguistán', 42.87, 74.59),
  ('tiflis', 'city', 'Tiflis', 'Georgia', 41.72, 44.83),
  ('erevan', 'city', 'Ereván', 'Armenia', 40.18, 44.51),
  ('asjabad', 'city', 'Asjabad', 'Turkmenistán', 37.96, 58.38),
  ('dusambe', 'city', 'Dusambé', 'Tayikistán', 38.56, 68.77),
  ('taskent', 'city', 'Taskent', 'Uzbekistán', 41.30, 69.28),
  ('astana', 'city', 'Astaná', 'Kazajistán', 51.17, 71.43),
  ('baku', 'city', 'Bakú', 'Azerbaiyán', 40.41, 49.87),
  ('riga', 'city', 'Riga', 'Letonia', 56.95, 24.11),
  ('tallin', 'city', 'Tallin', 'Estonia', 59.44, 24.75),
  ('vilna', 'city', 'Vilna', 'Lituania', 54.69, 25.28),
  ('liubliana', 'city', 'Liubliana', 'Eslovenia', 46.06, 14.51),
  ('bratislava', 'city', 'Bratislava', 'Eslovaquia', 48.15, 17.11),
  ('chisinau', 'city', 'Chisináu', 'Moldavia', 47.01, 28.86),
  ('podgorica', 'city', 'Podgorica', 'Montenegro', 42.44, 19.26),
  ('skopie', 'city', 'Skopie', 'Macedonia del Norte', 42.00, 21.43),
  ('tirana', 'city', 'Tirana', 'Albania', 41.33, 19.82),
  ('manama', 'city', 'Manama', 'Baréin', 26.23, 50.59),
  ('timbu', 'city', 'Timbu', 'Bután', 27.47, 89.64),
  ('vientian', 'city', 'Vientián', 'Laos', 17.97, 102.63),
  ('nom-pen', 'city', 'Nom Pen', 'Camboya', 11.56, 104.93),
  ('port-moresby', 'city', 'Port Moresby', 'Papúa Nueva Guinea', -9.48, 147.15),
  ('windhoek', 'city', 'Windhoek', 'Namibia', -22.56, 17.08),
  ('lusaka', 'city', 'Lusaka', 'Zambia', -15.39, 28.32),
  ('maputo', 'city', 'Maputo', 'Mozambique', -25.97, 32.58),
  ('nuakchot', 'city', 'Nuakchot', 'Mauritania', 18.09, -15.98),
  ('niamey', 'city', 'Niamey', 'Níger', 13.51, 2.11),
  ('uagadugu', 'city', 'Uagadugú', 'Burkina Faso', 12.37, -1.52),
  ('bamako', 'city', 'Bamako', 'Mali', 12.64, -8.00),
  ('yamena', 'city', 'Yamena', 'Chad', 12.13, 15.05),
  ('bangui', 'city', 'Bangui', 'Rep. Centroafricana', 4.36, 18.56),
  ('libreville', 'city', 'Libreville', 'Gabón', 0.39, 9.45),
  ('malabo', 'city', 'Malabo', 'Guinea Ecuatorial', 3.75, 8.78),
  ('yaunde', 'city', 'Yaundé', 'Camerún', 3.87, 11.52),
  ('brazzaville', 'city', 'Brazzaville', 'Rep. del Congo', -4.27, 15.28),
  ('kinsasa', 'city', 'Kinsasa', 'Rep. Dem. del Congo', -4.32, 15.31),
  ('bujumbura', 'city', 'Bujumbura', 'Burundi', -3.38, 29.36),
  ('kigali', 'city', 'Kigali', 'Ruanda', -1.94, 29.87),
  ('kampala', 'city', 'Kampala', 'Uganda', 0.35, 32.58),
  ('mogadiscio', 'city', 'Mogadiscio', 'Somalia', 2.05, 45.32),
  ('asmara', 'city', 'Asmara', 'Eritrea', 15.34, 38.93),
  ('paramaribo', 'city', 'Paramaribo', 'Surinam', 5.85, -55.17),
  ('georgetown', 'city', 'Georgetown', 'Guyana', 6.80, -58.16),
  ('managua', 'city', 'Managua', 'Nicaragua', 12.11, -86.27),
  ('tegucigalpa', 'city', 'Tegucigalpa', 'Honduras', 14.07, -87.19),
  ('san-salvador', 'city', 'San Salvador', 'El Salvador', 13.69, -89.19),
  ('marrakech', 'city', 'Marrakech', 'Marruecos', 31.63, -8.00),
  ('dubrovnik', 'city', 'Dubrovnik', 'Croacia', 42.65, 18.09),
  ('cartagena', 'city', 'Cartagena', 'Colombia', 10.39, -75.51),
  ('cusco', 'city', 'Cusco', 'Perú', -13.53, -71.97),
  ('vladivostok', 'city', 'Vladivostok', 'Rusia', 43.12, 131.87),
  ('edimburgo', 'city', 'Edimburgo', 'Reino Unido', 55.95, -3.19),
  ('la-meca', 'city', 'La Meca', 'Arabia Saudita', 21.43, 39.83),
  ('zurich', 'city', 'Zúrich', 'Suiza', 47.37, 8.54),
  ('mombasa', 'city', 'Mombasa', 'Kenia', -4.05, 39.67),
  ('samarcanda', 'city', 'Samarcanda', 'Uzbekistán', 39.65, 66.96),
  ('cancun', 'city', 'Cancún', 'México', 21.16, -86.85),
  ('chiang-mai', 'city', 'Chiang Mai', 'Tailandia', 18.79, 98.98),
  ('manchester', 'city', 'Mánchester', 'Reino Unido', 53.48, -2.24),
  ('francfort', 'city', 'Fráncfort', 'Alemania', 50.11, 8.68),
  ('florencia', 'city', 'Florencia', 'Italia', 43.77, 11.25),
  ('sarajevo', 'city', 'Sarajevo', 'Bosnia y Herzegovina', 43.86, 18.41),
  ('zagreb', 'city', 'Zagreb', 'Croacia', 45.81, 15.98),
  ('belgrado', 'city', 'Belgrado', 'Serbia', 44.79, 20.47),
  ('sofia', 'city', 'Sofía', 'Bulgaria', 42.70, 23.32),
  ('minsk', 'city', 'Minsk', 'Bielorrusia', 53.90, 27.57),
  ('reikiavik', 'city', 'Reikiavik', 'Islandia', 64.15, -21.94),
  ('nicosia', 'city', 'Nicosia', 'Chipre', 35.17, 33.36),
  ('la-valeta', 'city', 'La Valeta', 'Malta', 35.90, 14.51),
  ('luxemburgo', 'city', 'Luxemburgo', 'Luxemburgo', 49.61, 6.13),
  ('bagdad', 'city', 'Bagdad', 'Irak', 33.31, 44.37),
  ('kabul', 'city', 'Kabul', 'Afganistán', 34.53, 69.17),
  ('hong-kong', 'city', 'Hong Kong', 'China', 22.32, 114.17),
  ('taipei', 'city', 'Taipéi', 'Taiwán', 25.03, 121.57),
  ('chengdu', 'city', 'Chengdú', 'China', 30.57, 104.07),
  ('bandar-seri-begawan', 'city', 'Bandar Seri Begawan', 'Brunéi', 4.94, 114.95),
  ('dili', 'city', 'Dili', 'Timor Oriental', -8.56, 125.57),
  ('mascate', 'city', 'Mascate', 'Omán', 23.59, 58.54),
  ('doha', 'city', 'Doha', 'Catar', 25.29, 51.53),
  ('kuwait', 'city', 'Kuwait', 'Kuwait', 29.38, 47.99),
  ('damasco', 'city', 'Damasco', 'Siria', 33.51, 36.29),
  ('amman', 'city', 'Ammán', 'Jordania', 31.95, 35.93),
  ('pyongyang', 'city', 'Pyongyang', 'Corea del Norte', 39.02, 125.75),
  ('san-jose', 'city', 'San José', 'Costa Rica', 9.93, -84.08),
  ('panama', 'city', 'Panamá', 'Panamá', 8.98, -79.52),
  ('guatemala', 'city', 'Guatemala', 'Guatemala', 14.63, -90.51),
  ('santo-domingo', 'city', 'Santo Domingo', 'Rep. Dominicana', 18.47, -69.90),
  ('monterrey', 'city', 'Monterrey', 'México', 25.67, -100.31),
  ('cali', 'city', 'Cali', 'Colombia', 3.45, -76.53),
  ('valparaiso', 'city', 'Valparaíso', 'Chile', -33.05, -71.62),
  ('rosario', 'city', 'Rosario', 'Argentina', -32.95, -60.65),
  ('barranquilla', 'city', 'Barranquilla', 'Colombia', 10.96, -74.78),
  ('ushuaia', 'city', 'Ushuaia', 'Argentina', -54.80, -68.30),
  ('iquitos', 'city', 'Iquitos', 'Perú', -3.75, -73.25),
  ('manaus', 'city', 'Manaus', 'Brasil', -3.12, -60.02),
  ('whitehorse', 'city', 'Whitehorse', 'Canadá', 60.72, -135.06),
  ('anchorage', 'city', 'Anchorage', 'EE.UU.', 61.22, -149.90),
  ('sucre', 'city', 'Sucre', 'Bolivia', -19.04, -65.26),
  ('cayena', 'city', 'Cayena', 'Guayana Francesa', 4.94, -52.33),
  ('belmopan', 'city', 'Belmopan', 'Belice', 17.25, -88.77),
  ('kingston', 'city', 'Kingston', 'Jamaica', 18.00, -76.79),
  ('port-au-prince', 'city', 'Port-au-Prince', 'Haití', 18.54, -72.34),
  ('nassau', 'city', 'Nassau', 'Bahamas', 25.05, -77.35),
  ('punta-arenas', 'city', 'Punta Arenas', 'Chile', -53.15, -70.92),
  ('curitiba', 'city', 'Curitiba', 'Brasil', -25.43, -49.27),
  ('puebla', 'city', 'Puebla', 'México', 19.04, -98.21),
  ('santa-cruz', 'city', 'Santa Cruz', 'Bolivia', -17.78, -63.18),
  ('arequipa', 'city', 'Arequipa', 'Perú', -16.41, -71.54),
  ('mendoza', 'city', 'Mendoza', 'Argentina', -32.89, -68.83),
  ('harare', 'city', 'Harare', 'Zimbabue', -17.83, 31.05),
  ('abiyan', 'city', 'Abiyán', 'Costa de Marfil', 5.36, -4.01),
  ('tripoli', 'city', 'Trípoli', 'Libia', 32.90, 13.18),
  ('durban', 'city', 'Durban', 'Sudáfrica', -29.86, 31.02),
  ('abuya', 'city', 'Abuya', 'Nigeria', 9.06, 7.49),
  ('fez', 'city', 'Fez', 'Marruecos', 34.03, -5.00),
  ('douala', 'city', 'Douala', 'Camerún', 4.05, 9.77),
  ('kumasi', 'city', 'Kumasi', 'Ghana', 6.69, -1.62),
  ('conakry', 'city', 'Conakry', 'Guinea', 9.64, -13.58),
  ('lubumbashi', 'city', 'Lubumbashi', 'Rep. Dem. del Congo', -11.66, 27.48),
  ('jartum', 'city', 'Jartum', 'Sudán', 15.59, 32.53),
  ('yibuti', 'city', 'Yibuti', 'Yibuti', 11.59, 43.15),
  ('moroni', 'city', 'Moroni', 'Comoras', -11.70, 43.26),
  ('victoria', 'city', 'Victoria', 'Seychelles', -4.62, 55.45),
  ('port-louis', 'city', 'Port Louis', 'Mauricio', -20.16, 57.50),
  ('lome', 'city', 'Lomé', 'Togo', 6.17, 1.23),
  ('cotonu', 'city', 'Cotonú', 'Benín', 6.37, 2.39),
  ('monrovia', 'city', 'Monrovia', 'Liberia', 6.30, -10.80),
  ('freetown', 'city', 'Freetown', 'Sierra Leona', 8.48, -13.23),
  ('bisau', 'city', 'Bisáu', 'Guinea-Bisáu', 11.86, -15.60),
  ('gaborone', 'city', 'Gaborone', 'Botsuana', -24.65, 25.91),
  ('maseru', 'city', 'Maseru', 'Lesoto', -29.31, 27.48)
on conflict (id) do update set kind = excluded.kind, name = excluded.name, country = excluded.country, lat = excluded.lat, lon = excluded.lon;

-- ── 2) Columnas nuevas ──────────────────────────────────────────────────────
alter table public.game_results add column if not exists scoring_version smallint not null default 1;
alter table public.game_results add column if not exists suspicious boolean not null default false;
alter table public.game_rounds add column if not exists place_id text;
alter table public.game_rounds add column if not exists combo integer;
alter table public.game_rounds add column if not exists combo_mult numeric;
-- El tope de 500.000 se queda corto con el combo en 60s de Caos (ciudades ilimitadas)
alter table public.game_results drop constraint if exists game_results_score_check;
alter table public.game_results add constraint game_results_score_check check (score between 0 and 5000000);
create index if not exists game_results_rank_v2_idx
  on public.game_results (mode, difficulty, score desc)
  where scoring_version = 2 and not suspicious and challenge_id is null;

-- ── 3) Funciones del puntaje (iguales a src/lib/scoring.ts) ─────────────────
create or replace function public.geo_distance_km(lat1 double precision, lon1 double precision, lat2 double precision, lon2 double precision)
returns double precision
language sql
immutable
as $$
  -- Haversine, R = 6.371 km (como haversineDistance en src/lib/gameUtils.ts)
  select 6371 * 2 * atan2(sqrt(s.a), sqrt(1 - s.a))
  from (
    select sin(radians(lat2 - lat1) / 2) * sin(radians(lat2 - lat1) / 2)
         + cos(radians(lat1)) * cos(radians(lat2)) * sin(radians(lon2 - lon1) / 2) * sin(radians(lon2 - lon1) / 2) as a
  ) s;
$$;

create or replace function public.score_closeness_v2(p_km double precision, p_scale double precision)
returns integer
language sql
immutable
as $$
  select case
    when p_km is null or p_km < 0 then 0
    when p_km < 25 then 1000
    else floor(1000 * exp(-p_km / p_scale) + 0.5)::integer
  end;
$$;

-- Puntúa una lista de rondas (jsonb, como las manda el teléfono) y devuelve el total, si es
-- sospechosa y las rondas con los valores calculados por el servidor.
create or replace function public._score_rounds_v2(
  p_rounds jsonb,
  p_mode text,
  p_difficulty text,
  p_game_type text,
  out total integer,
  out suspicious boolean,
  out rounds jsonb
)
language plpgsql
stable
set search_path = public
as $$
declare
  v_mundial boolean := (p_mode = 'mundial' or p_game_type = 'mundial');
  v_scale   double precision := case when p_mode in ('world', 'mundial') then 1500 else 600 end;
  v_diff    integer := case
                         when p_mode = 'mundial' or p_game_type = 'mundial' then 100
                         when p_difficulty = 'easy' then 110
                         when p_difficulty = 'medium' then 125
                         when p_difficulty = 'hard' then 150
                         else 100
                       end;
  v_combo   integer := 0;
  v_r       jsonb;
  v_place   text;
  v_lat     double precision;
  v_lon     double precision;
  v_clat    double precision;
  v_clon    double precision;
  v_km      double precision;
  v_close   integer;
  v_tenths  integer;
  v_speed   integer;
  v_ctenths integer;
  v_points  integer;
begin
  total := 0;
  suspicious := false;
  rounds := '[]'::jsonb;

  for v_r in
    select e.value from jsonb_array_elements(coalesce(p_rounds, '[]'::jsonb)) e
    order by (e.value->>'round_no')::integer
  loop
    v_place := null; v_lat := null; v_lon := null; v_km := null;
    v_clat := (v_r->>'click_lat')::double precision;
    v_clon := (v_r->>'click_lon')::double precision;

    if v_mundial then
      v_close := case v_r->'extra'->>'band'
                   when 'exact' then 1000 when 'neighbor' then 600 when 'continent' then 300 when 'far' then 50
                   else 0 end;
      v_km := (v_r->>'distance_km')::double precision;
    else
      select pl.id, pl.lat, pl.lon into v_place, v_lat, v_lon
        from public.places pl where pl.id = v_r->>'place_id';
      if v_place is null then
        select pl.id, pl.lat, pl.lon into v_place, v_lat, v_lon
          from public.places pl
         where pl.name = v_r->>'city_name'
           and (v_r->>'city_country' is null or pl.country = v_r->>'city_country')
         limit 1;
      end if;
      if v_place is null then
        -- Lugar que el servidor no conoce: se mide con las coordenadas del teléfono, fuera del ranking
        v_lat := (v_r->>'city_lat')::double precision;
        v_lon := (v_r->>'city_lon')::double precision;
        suspicious := true;
      end if;
      if v_clat is not null and v_clon is not null and v_lat is not null and v_lon is not null then
        v_km := public.geo_distance_km(v_clat, v_clon, v_lat, v_lon);
        v_close := public.score_closeness_v2(v_km, v_scale);
      else
        v_close := 0;
      end if;
    end if;

    v_tenths := greatest(0, floor(coalesce((v_r->>'time_s')::numeric, 15) * 10 + 0.5)::integer);
    if v_tenths < 3 and v_clat is not null then
      suspicious := true; -- respuesta en menos de 0,3 s
    end if;
    v_speed := greatest(400, least(2200, 2200 - 13 * v_tenths));
    v_combo := case when v_close >= 800 then v_combo + 1 when v_close >= 400 then v_combo else 0 end;
    v_ctenths := case when v_combo >= 8 then 25 when v_combo >= 6 then 20 when v_combo >= 4 then 15
                      when v_combo >= 2 then 12 else 10 end;
    v_points := ((v_close::bigint * v_speed * v_ctenths * v_diff + 500000) / 1000000)::integer;
    total := total + v_points;

    rounds := rounds || jsonb_build_array(v_r || jsonb_build_object(
      'place_id', v_place,
      'distance_km', case when v_km is null then v_r->'distance_km' else to_jsonb(round(v_km::numeric, 1)) end,
      'time_s', to_jsonb(v_tenths / 10.0),
      'base_points', v_close,
      'multiplier', to_jsonb(v_speed / 1000.0),
      'points', v_points,
      'combo', v_combo,
      'combo_mult', to_jsonb(v_ctenths / 10.0)
    ));
  end loop;
end;
$$;

revoke all on function public._score_rounds_v2(jsonb, text, text, text) from public, anon, authenticated;

-- ── 4) save_game_result: el servidor calcula el puntaje ─────────────────────
create or replace function public.save_game_result(p jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user    uuid := auth.uid();
  v_id      uuid;
  v_client  text := nullif(p->>'client_id', '');
  v_type    text := coalesce(p->>'game_type', 'classic');
  v_mode    text := coalesce(p->>'mode', 'world');
  v_diff    text := coalesce(p->>'difficulty', 'basic');
  v_score   integer := coalesce((p->>'score')::integer, 0);
  v_rounds  jsonb := coalesce(p->'rounds', '[]'::jsonb);
  v_version smallint := 1;
  v_susp    boolean := false;
  v_prev    integer;
  v_round   jsonb;
  v_scored  record;
begin
  if v_user is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  if jsonb_typeof(v_rounds) <> 'array' or jsonb_array_length(v_rounds) > 200 then
    raise exception 'invalid rounds' using errcode = '22023';
  end if;

  -- Idempotencia
  if v_client is not null then
    select id into v_id from public.game_results where user_id = v_user and client_id = v_client;
    if v_id is not null then
      return v_id;
    end if;
  end if;

  -- Puntaje v2 calculado aquí desde las rondas; sin rondas (formatos antiguos) queda en la escala vieja
  if jsonb_array_length(v_rounds) > 0 then
    select * into v_scored from public._score_rounds_v2(v_rounds, v_mode, v_diff, v_type);
    v_score := v_scored.total;
    v_susp := v_scored.suspicious;
    v_rounds := v_scored.rounds;
    v_version := 2;
  end if;
  v_score := greatest(0, least(5000000, v_score));

  select max(score) into v_prev from public.game_results
   where user_id = v_user and game_type = v_type and scoring_version = v_version;

  insert into public.game_results (
    user_id, game_type, mode, difficulty, score, rounds_played, rounds_total,
    avg_distance_km, end_reason, is_record, seed, challenge_id, client_id, scoring_version, suspicious
  ) values (
    v_user, v_type, v_mode, v_diff, v_score,
    coalesce((p->>'rounds_played')::integer, 0), coalesce((p->>'rounds_total')::integer, 0),
    (p->>'avg_distance_km')::numeric, coalesce(p->>'end_reason', 'complete'),
    (v_prev is not null and v_score > v_prev),
    (p->>'seed')::integer, (p->>'challenge_id')::uuid, v_client, v_version, v_susp
  ) returning id into v_id;

  for v_round in select * from jsonb_array_elements(v_rounds) loop
    insert into public.game_rounds (
      result_id, round_no, place_id, city_name, city_country, city_lat, city_lon,
      click_lat, click_lon, distance_km, time_s, base_points, multiplier, points, combo, combo_mult, extra
    ) values (
      v_id, (v_round->>'round_no')::integer, v_round->>'place_id', coalesce(v_round->>'city_name', '?'), v_round->>'city_country',
      (v_round->>'city_lat')::double precision, (v_round->>'city_lon')::double precision,
      (v_round->>'click_lat')::double precision, (v_round->>'click_lon')::double precision,
      (v_round->>'distance_km')::numeric, (v_round->>'time_s')::numeric,
      (v_round->>'base_points')::integer, (v_round->>'multiplier')::numeric,
      coalesce((v_round->>'points')::integer, 0), (v_round->>'combo')::integer, (v_round->>'combo_mult')::numeric,
      v_round->'extra'
    ) on conflict (result_id, round_no) do nothing;
  end loop;

  return v_id;
end;
$$;

grant execute on function public.save_game_result(jsonb) to authenticated;

-- ── 5) Sin inserciones directas: el puntaje solo entra por el servidor ──────
drop policy if exists "game_results_insert_own" on public.game_results;
drop policy if exists "game_rounds_insert_own" on public.game_rounds;
revoke insert on public.game_results from authenticated;
revoke insert on public.game_rounds from authenticated;

-- La importación del historial local (F1) inserta con los permisos de la función. Las partidas de la
-- Temporada 1 (marcadas con "v") no se importan: ya se guardaron con sus rondas.
create or replace function public.import_legacy_history(p jsonb)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user  uuid := auth.uid();
  v_e     jsonb;
  v_n     integer := 0;
  v_type  text;
  v_xp    integer := coalesce((p->>'xp_legacy')::integer, 0);
begin
  if v_user is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  for v_e in select * from jsonb_array_elements(coalesce(p->'entries', '[]'::jsonb)) loop
    continue when v_e ? 'v';
    v_type := case
      when v_e->>'mode' = 'mundial' then 'mundial'
      when v_e->>'type' in ('classic','daily','timeattack') then v_e->>'type'
      else 'classic' end;
    insert into public.game_results (
      user_id, game_type, mode, difficulty, score, rounds_played, rounds_total,
      avg_distance_km, end_reason, client_id, created_at, scoring_version
    ) values (
      v_user, v_type, coalesce(v_e->>'mode', 'world'), coalesce(v_e->>'difficulty', 'basic'),
      greatest(0, least(500000, coalesce((v_e->>'score')::integer, 0))),
      coalesce((v_e->>'rounds')::integer, 0), coalesce((v_e->>'rounds')::integer, 0),
      case when v_e->>'mode' = 'mundial' then null else (v_e->>'avgDistance')::numeric end,
      'complete',
      'legacy:' || coalesce(v_e->>'date', '') || ':' || coalesce(v_e->>'score', '0'),
      coalesce((v_e->>'date')::timestamptz, now()),
      1
    ) on conflict (user_id, client_id) do nothing;
    if found then v_n := v_n + 1; end if;
  end loop;

  update public.profiles
     set xp_legacy = greatest(xp_legacy, greatest(0, v_xp - coalesce((
       select sum(score) from public.game_results
        where user_id = v_user and client_id like 'legacy:%'), 0)))
   where id = v_user;

  return v_n;
end;
$$;

grant execute on function public.import_legacy_history(jsonb) to authenticated;

-- ── 6) Retos en curso: recalcular con el puntaje v2 ─────────────────────────
create or replace function public._rescore_result_v2(p_result_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_res    public.game_results;
  v_rounds jsonb;
  v_s      record;
begin
  select * into v_res from public.game_results where id = p_result_id;
  if not found or v_res.scoring_version = 2 then
    return;
  end if;
  select coalesce(jsonb_agg(jsonb_build_object(
           'round_no', gr.round_no, 'place_id', gr.place_id, 'city_name', gr.city_name, 'city_country', gr.city_country,
           'city_lat', gr.city_lat, 'city_lon', gr.city_lon, 'click_lat', gr.click_lat, 'click_lon', gr.click_lon,
           'distance_km', gr.distance_km, 'time_s', gr.time_s, 'extra', gr.extra) order by gr.round_no), '[]'::jsonb)
    into v_rounds
    from public.game_rounds gr where gr.result_id = p_result_id;
  if jsonb_array_length(v_rounds) = 0 then
    return;
  end if;
  select * into v_s from public._score_rounds_v2(v_rounds, v_res.mode, v_res.difficulty, v_res.game_type);
  update public.game_results
     set score = greatest(0, least(5000000, v_s.total)), scoring_version = 2, suspicious = v_s.suspicious
   where id = p_result_id;
  update public.game_rounds gr
     set place_id = x.value->>'place_id',
         base_points = (x.value->>'base_points')::integer,
         multiplier = (x.value->>'multiplier')::numeric,
         points = (x.value->>'points')::integer,
         combo = (x.value->>'combo')::integer,
         combo_mult = (x.value->>'combo_mult')::numeric
    from jsonb_array_elements(v_s.rounds) x
   where gr.result_id = p_result_id and gr.round_no = (x.value->>'round_no')::integer;
end;
$$;

revoke all on function public._rescore_result_v2(uuid) from public, anon, authenticated;

select public._rescore_result_v2(r.id)
  from public.game_results r
  join public.challenges c on c.id = r.challenge_id
 where c.status <> 'completed';

-- ── 7) Ranking: Temporada 1 (puntaje v2) o Histórico (escala anterior + tabla vieja) ──
drop function if exists public.leaderboard_top(text, text, text, integer, text);
drop function if exists public.my_rank(text, text, text, text);

create or replace function public.leaderboard_top(
  p_mode text default 'world',
  p_difficulty text default null,
  p_period text default 'all',
  p_limit integer default 10,
  p_game_type text default null,
  p_season text default 't1'
)
returns table (
  rank         bigint,
  user_id      uuid,
  display_name text,
  avatar       text,
  best_score   integer,
  achieved_at  timestamptz
)
language sql
security definer
stable
set search_path = public
as $$
  with scores as (
    select r.user_id::text as k, r.user_id, null::text as initials, r.score, r.created_at
    from public.game_results r
    where r.mode = p_mode
      and (p_difficulty is null or r.difficulty = p_difficulty)
      and r.created_at >= public._period_start(p_period)
      and case
            when p_game_type is not null then r.game_type = p_game_type
            when p_mode = 'mundial' then r.game_type = 'mundial'
            else r.game_type = any (public._rank_game_types())
          end
      and r.challenge_id is null
      and case when p_season = 'historic' then r.scoring_version = 1
               else r.scoring_version = 2 and not r.suspicious end
    union all
    select coalesce(l.user_id::text, 'legacy:' || upper(l.initials)), l.user_id, upper(l.initials), l.score, l.created_at
    from public.leaderboard l
    where p_season = 'historic'
      and p_game_type is null
      and p_mode <> 'mundial'
      and l.mode = p_mode
      and (p_difficulty is null or l.difficulty = p_difficulty)
      and l.created_at >= public._period_start(p_period)
      and l.created_at < timestamptz '2026-10-18 00:00:00+00'
  ),
  best as (
    select distinct on (s.k) s.k, s.user_id, s.initials, s.score, s.created_at
    from scores s
    order by s.k, s.score desc, s.created_at asc
  )
  select
    row_number() over (order by b.score desc, b.created_at asc) as rank,
    b.user_id,
    coalesce(nullif(pr.display_name, ''), b.initials, 'Explorador') as display_name,
    coalesce(pr.avatar, '') as avatar,
    b.score as best_score,
    b.created_at as achieved_at
  from best b
  left join public.profiles pr on pr.id = b.user_id
  order by b.score desc, b.created_at asc
  limit greatest(1, least(coalesce(p_limit, 10), 100));
$$;

grant execute on function public.leaderboard_top(text, text, text, integer, text, text) to anon, authenticated;

create or replace function public.my_rank(
  p_mode text default 'world',
  p_difficulty text default null,
  p_period text default 'all',
  p_game_type text default null,
  p_season text default 't1'
)
returns table (
  rank          bigint,
  best_score    integer,
  total_players bigint
)
language sql
security invoker
stable
set search_path = public
as $$
  with scores as (
    select r.user_id::text as k, r.score
    from public.game_results r
    where r.mode = p_mode
      and (p_difficulty is null or r.difficulty = p_difficulty)
      and r.created_at >= public._period_start(p_period)
      and case
            when p_game_type is not null then r.game_type = p_game_type
            when p_mode = 'mundial' then r.game_type = 'mundial'
            else r.game_type = any (public._rank_game_types())
          end
      and r.challenge_id is null
      and case when p_season = 'historic' then r.scoring_version = 1
               else r.scoring_version = 2 and not r.suspicious end
    union all
    select coalesce(l.user_id::text, 'legacy:' || upper(l.initials)), l.score
    from public.leaderboard l
    where p_season = 'historic'
      and p_game_type is null
      and p_mode <> 'mundial'
      and l.mode = p_mode
      and (p_difficulty is null or l.difficulty = p_difficulty)
      and l.created_at >= public._period_start(p_period)
      and l.created_at < timestamptz '2026-10-18 00:00:00+00'
  ),
  best as (
    select s.k, max(s.score) as score from scores s group by s.k
  ),
  mine as (select score from best where k = auth.uid()::text)
  select
    case when (select score from mine) is null then null
         else 1 + (select count(*) from best b where b.score > (select score from mine)) end as rank,
    (select score from mine) as best_score,
    (select count(*) from best) as total_players;
$$;

grant execute on function public.my_rank(text, text, text, text, text) to authenticated;

-- ── 8) Récord personal del perfil: el de la Temporada 1 (el XP sigue sumando todo) ──
create or replace function public.my_progress()
returns table (
  games_played    bigint,
  best_score      integer,
  total_xp        bigint,
  total_rounds    bigint,
  avg_distance_km numeric
)
language sql
security invoker
stable
set search_path = public
as $$
  select
    count(r.id)                                                                 as games_played,
    coalesce(max(r.score) filter (where r.scoring_version = 2 and not r.suspicious), 0) as best_score,
    coalesce(sum(r.score), 0) + coalesce(max(pr.xp_legacy), 0)                  as total_xp,
    coalesce(sum(r.rounds_played), 0)                                           as total_rounds,
    case when sum(r.rounds_played) filter (where r.avg_distance_km is not null) > 0
         then sum(r.avg_distance_km * r.rounds_played) / sum(r.rounds_played) filter (where r.avg_distance_km is not null)
         else null end                                                          as avg_distance_km
  from public.profiles pr
  left join public.game_results r on r.user_id = pr.id
  where pr.id = auth.uid()
  group by pr.id;
$$;

grant execute on function public.my_progress() to authenticated;
