/**
 * Pack Colombia (Fase 7a): departamentos y municipios, escritos a mano. `node scripts/build-colombia.mjs` toma los
 * contornos de los departamentos de Natural Earth (admin-1 1:10m, dominio público) y afina las coordenadas de los
 * municipios con Wikidata (CC0; solo si el resultado queda a ≤ 25 km del punto escrito aquí), y regenera
 * src/data/colombiaCatalog.ts, src/data/packShapes.json y supabase/seed/colombia_places.sql.
 *
 * Niveles pensados para un jugador colombiano: Turista (lo que todos conocen) · Rookie · Crack · Leyenda.
 * Decisiones de JuanJo (2026-10-23): el pack Colombia es gratis, se elige en Región, la cercanía usa una escala de
 * 150 km y tiene su propio ranking; el Diario y el Sprint siguen con el mundo.
 */
import type { Difficulty } from './cities';

export interface DepartmentSpec {
  /** slug: id del juego `div:co-<id>` */
  id: string;
  /** Nombre exacto en Natural Earth (campo name) */
  ne: string;
  es: string;
  en: string;
  tier: Difficulty;
  /** id del municipio capital (ver MUNICIPIOS) */
  capital: string;
  district?: true;
}

export interface MunicipioSpec {
  /** slug: id del juego `co:<id>` */
  id: string;
  name: string;
  /** id del departamento */
  dept: string;
  tier: Difficulty;
  lat: number;
  lon: number;
}

const d = (id: string, ne: string, es: string, tier: Difficulty, capital: string, en = es, district?: true): DepartmentSpec =>
  ({ id, ne, es, en, tier, capital, ...(district ? { district } : {}) });

export const DEPARTMENTS: DepartmentSpec[] = [
  d('bogota', 'Bogota', 'Bogotá D. C.', 'basic', 'bogota', 'Bogotá Capital District', true),
  d('antioquia', 'Antioquia', 'Antioquia', 'basic', 'medellin'),
  d('valle', 'Valle del Cauca', 'Valle del Cauca', 'basic', 'cali'),
  d('atlantico', 'Atlántico', 'Atlántico', 'basic', 'barranquilla'),
  d('bolivar', 'Bolívar', 'Bolívar', 'basic', 'cartagena'),
  d('cundinamarca', 'Cundinamarca', 'Cundinamarca', 'basic', 'bogota'),
  d('santander', 'Santander', 'Santander', 'basic', 'bucaramanga'),
  d('narino', 'Nariño', 'Nariño', 'basic', 'pasto'),
  d('amazonas', 'Amazonas', 'Amazonas', 'basic', 'leticia'),
  d('guajira', 'La Guajira', 'La Guajira', 'basic', 'riohacha'),
  d('magdalena', 'Magdalena', 'Magdalena', 'basic', 'santa-marta'),
  d('san-andres', 'San Andrés y Providencia', 'San Andrés y Providencia', 'basic', 'san-andres', 'San Andrés and Providencia'),
  d('boyaca', 'Boyacá', 'Boyacá', 'easy', 'tunja'),
  d('caldas', 'Caldas', 'Caldas', 'easy', 'manizales'),
  d('risaralda', 'Risaralda', 'Risaralda', 'easy', 'pereira'),
  d('quindio', 'Quindío', 'Quindío', 'easy', 'armenia'),
  d('tolima', 'Tolima', 'Tolima', 'easy', 'ibague'),
  d('huila', 'Huila', 'Huila', 'easy', 'neiva'),
  d('cauca', 'Cauca', 'Cauca', 'easy', 'popayan'),
  d('cordoba', 'Córdoba', 'Córdoba', 'easy', 'monteria'),
  d('meta', 'Meta', 'Meta', 'easy', 'villavicencio'),
  d('norte-santander', 'Norte de Santander', 'Norte de Santander', 'easy', 'cucuta'),
  d('cesar', 'Cesar', 'Cesar', 'easy', 'valledupar'),
  d('choco', 'Chocó', 'Chocó', 'easy', 'quibdo'),
  d('sucre', 'Sucre', 'Sucre', 'medium', 'sincelejo'),
  d('caqueta', 'Caquetá', 'Caquetá', 'medium', 'florencia'),
  d('putumayo', 'Putumayo', 'Putumayo', 'medium', 'mocoa'),
  d('casanare', 'Casanare', 'Casanare', 'medium', 'yopal'),
  d('arauca', 'Arauca', 'Arauca', 'medium', 'arauca'),
  d('guainia', 'Guainía', 'Guainía', 'hard', 'inirida'),
  d('vaupes', 'Vaupés', 'Vaupés', 'hard', 'mitu'),
  d('vichada', 'Vichada', 'Vichada', 'hard', 'puerto-carreno'),
  d('guaviare', 'Guaviare', 'Guaviare', 'hard', 'san-jose-guaviare'),
];

const m = (id: string, name: string, dept: string, tier: Difficulty, lat: number, lon: number): MunicipioSpec => ({ id, name, dept, tier, lat, lon });

export const MUNICIPIOS: MunicipioSpec[] = [
  // ── Turista ───────────────────────────────────────────────────────────────
  m('bogota', 'Bogotá', 'bogota', 'basic', 4.711, -74.072),
  m('medellin', 'Medellín', 'antioquia', 'basic', 6.244, -75.574),
  m('cali', 'Cali', 'valle', 'basic', 3.452, -76.532),
  m('barranquilla', 'Barranquilla', 'atlantico', 'basic', 10.964, -74.796),
  m('cartagena', 'Cartagena', 'bolivar', 'basic', 10.391, -75.479),
  m('bucaramanga', 'Bucaramanga', 'santander', 'basic', 7.119, -73.123),
  m('cucuta', 'Cúcuta', 'norte-santander', 'basic', 7.894, -72.508),
  m('santa-marta', 'Santa Marta', 'magdalena', 'basic', 11.241, -74.199),
  m('pereira', 'Pereira', 'risaralda', 'basic', 4.813, -75.696),
  m('manizales', 'Manizales', 'caldas', 'basic', 5.070, -75.513),
  m('ibague', 'Ibagué', 'tolima', 'basic', 4.439, -75.232),
  m('pasto', 'Pasto', 'narino', 'basic', 1.214, -77.281),
  m('villavicencio', 'Villavicencio', 'meta', 'basic', 4.142, -73.627),
  m('armenia', 'Armenia', 'quindio', 'basic', 4.534, -75.681),
  m('neiva', 'Neiva', 'huila', 'basic', 2.927, -75.282),
  m('leticia', 'Leticia', 'amazonas', 'basic', -4.215, -69.940),
  m('san-andres', 'San Andrés', 'san-andres', 'basic', 12.584, -81.701),
  m('monteria', 'Montería', 'cordoba', 'basic', 8.748, -75.881),
  m('valledupar', 'Valledupar', 'cesar', 'basic', 10.463, -73.253),
  m('popayan', 'Popayán', 'cauca', 'basic', 2.444, -76.614),
  m('tunja', 'Tunja', 'boyaca', 'basic', 5.535, -73.367),
  m('riohacha', 'Riohacha', 'guajira', 'basic', 11.544, -72.907),
  m('buenaventura', 'Buenaventura', 'valle', 'basic', 3.882, -77.031),
  m('zipaquira', 'Zipaquirá', 'cundinamarca', 'basic', 5.023, -74.005),

  // ── Rookie ────────────────────────────────────────────────────────────────
  m('sincelejo', 'Sincelejo', 'sucre', 'easy', 9.304, -75.398),
  m('quibdo', 'Quibdó', 'choco', 'easy', 5.692, -76.658),
  m('florencia', 'Florencia', 'caqueta', 'easy', 1.614, -75.606),
  m('yopal', 'Yopal', 'casanare', 'easy', 5.337, -72.395),
  m('rionegro', 'Rionegro', 'antioquia', 'easy', 6.155, -75.374),
  m('guatape', 'Guatapé', 'antioquia', 'easy', 6.233, -75.158),
  m('villa-de-leyva', 'Villa de Leyva', 'boyaca', 'easy', 5.633, -73.524),
  m('girardot', 'Girardot', 'cundinamarca', 'easy', 4.303, -74.803),
  m('soacha', 'Soacha', 'cundinamarca', 'easy', 4.579, -74.217),
  m('bello', 'Bello', 'antioquia', 'easy', 6.337, -75.558),
  m('envigado', 'Envigado', 'antioquia', 'easy', 6.171, -75.587),
  m('itagui', 'Itagüí', 'antioquia', 'easy', 6.184, -75.599),
  m('soledad', 'Soledad', 'atlantico', 'easy', 10.917, -74.766),
  m('palmira', 'Palmira', 'valle', 'easy', 3.539, -76.303),
  m('tulua', 'Tuluá', 'valle', 'easy', 4.087, -76.196),
  m('buga', 'Buga', 'valle', 'easy', 3.901, -76.298),
  m('barrancabermeja', 'Barrancabermeja', 'santander', 'easy', 7.065, -73.854),
  m('san-gil', 'San Gil', 'santander', 'easy', 6.555, -73.134),
  m('ipiales', 'Ipiales', 'narino', 'easy', 0.828, -77.640),
  m('tumaco', 'Tumaco', 'narino', 'easy', 1.807, -78.765),
  m('duitama', 'Duitama', 'boyaca', 'easy', 5.827, -73.033),
  m('sogamoso', 'Sogamoso', 'boyaca', 'easy', 5.715, -72.933),
  m('salento', 'Salento', 'quindio', 'easy', 4.637, -75.570),
  m('cienaga', 'Ciénaga', 'magdalena', 'easy', 11.007, -74.247),
  m('maicao', 'Maicao', 'guajira', 'easy', 11.378, -72.240),
  m('mompox', 'Mompox', 'bolivar', 'easy', 9.242, -74.427),
  m('providencia', 'Providencia', 'san-andres', 'easy', 13.349, -81.374),
  m('chia', 'Chía', 'cundinamarca', 'easy', 4.861, -74.058),
  m('fusagasuga', 'Fusagasugá', 'cundinamarca', 'easy', 4.337, -74.364),
  m('apartado', 'Apartadó', 'antioquia', 'easy', 7.883, -76.625),

  // ── Crack ─────────────────────────────────────────────────────────────────
  m('mocoa', 'Mocoa', 'putumayo', 'medium', 1.150, -76.647),
  m('arauca', 'Arauca', 'arauca', 'medium', 7.084, -70.759),
  m('san-jose-guaviare', 'San José del Guaviare', 'guaviare', 'medium', 2.572, -72.645),
  m('cartago', 'Cartago', 'valle', 'medium', 4.747, -75.912),
  m('honda', 'Honda', 'tolima', 'medium', 5.204, -74.736),
  m('turbo', 'Turbo', 'antioquia', 'medium', 8.093, -76.728),
  m('santa-fe-antioquia', 'Santa Fe de Antioquia', 'antioquia', 'medium', 6.557, -75.828),
  m('jardin', 'Jardín', 'antioquia', 'medium', 5.598, -75.819),
  m('chiquinquira', 'Chiquinquirá', 'boyaca', 'medium', 5.617, -73.819),
  m('paipa', 'Paipa', 'boyaca', 'medium', 5.780, -73.117),
  m('raquira', 'Ráquira', 'boyaca', 'medium', 5.538, -73.632),
  m('la-dorada', 'La Dorada', 'caldas', 'medium', 5.454, -74.664),
  m('dosquebradas', 'Dosquebradas', 'risaralda', 'medium', 4.839, -75.672),
  m('santa-rosa-cabal', 'Santa Rosa de Cabal', 'risaralda', 'medium', 4.868, -75.621),
  m('calarca', 'Calarcá', 'quindio', 'medium', 4.531, -75.643),
  m('filandia', 'Filandia', 'quindio', 'medium', 4.674, -75.658),
  m('pitalito', 'Pitalito', 'huila', 'medium', 1.854, -76.051),
  m('san-agustin', 'San Agustín', 'huila', 'medium', 1.881, -76.268),
  m('barichara', 'Barichara', 'santander', 'medium', 6.636, -73.223),
  m('floridablanca', 'Floridablanca', 'santander', 'medium', 7.064, -73.090),
  m('giron', 'Girón', 'santander', 'medium', 7.071, -73.170),
  m('pamplona', 'Pamplona', 'norte-santander', 'medium', 7.376, -72.648),
  m('ocana', 'Ocaña', 'norte-santander', 'medium', 8.237, -73.356),
  m('aracataca', 'Aracataca', 'magdalena', 'medium', 10.592, -74.190),
  m('tolu', 'Tolú', 'sucre', 'medium', 9.524, -75.582),
  m('covenas', 'Coveñas', 'sucre', 'medium', 9.404, -75.680),
  m('melgar', 'Melgar', 'tolima', 'medium', 4.204, -74.641),
  m('espinal', 'Espinal', 'tolima', 'medium', 4.149, -74.884),
  m('magangue', 'Magangué', 'bolivar', 'medium', 9.241, -74.754),
  m('lorica', 'Lorica', 'cordoba', 'medium', 9.236, -75.814),
  m('puerto-colombia', 'Puerto Colombia', 'atlantico', 'medium', 10.988, -74.955),
  m('facatativa', 'Facatativá', 'cundinamarca', 'medium', 4.814, -74.354),
  m('jamundi', 'Jamundí', 'valle', 'medium', 3.261, -76.540),
  m('caucasia', 'Caucasia', 'antioquia', 'medium', 7.986, -75.193),
  m('puerto-asis', 'Puerto Asís', 'putumayo', 'medium', 0.505, -76.495),
  m('uribia', 'Uribia', 'guajira', 'medium', 11.714, -72.266),
  m('nuqui', 'Nuquí', 'choco', 'medium', 5.710, -77.271),

  // ── Leyenda ───────────────────────────────────────────────────────────────
  m('inirida', 'Inírida', 'guainia', 'hard', 3.865, -67.924),
  m('mitu', 'Mitú', 'vaupes', 'hard', 1.253, -70.234),
  m('puerto-carreno', 'Puerto Carreño', 'vichada', 'hard', 6.189, -67.486),
  m('necocli', 'Necoclí', 'antioquia', 'hard', 8.426, -76.784),
  m('jerico', 'Jericó', 'antioquia', 'hard', 5.790, -75.785),
  m('puerto-berrio', 'Puerto Berrío', 'antioquia', 'hard', 6.491, -74.404),
  m('sabanalarga', 'Sabanalarga', 'atlantico', 'hard', 10.632, -74.922),
  m('turbaco', 'Turbaco', 'bolivar', 'hard', 10.332, -75.411),
  m('san-jacinto', 'San Jacinto', 'bolivar', 'hard', 9.832, -75.122),
  m('carmen-bolivar', 'El Carmen de Bolívar', 'bolivar', 'hard', 9.718, -75.122),
  m('el-cocuy', 'El Cocuy', 'boyaca', 'hard', 6.408, -72.444),
  m('puerto-boyaca', 'Puerto Boyacá', 'boyaca', 'hard', 5.976, -74.587),
  m('salamina', 'Salamina', 'caldas', 'hard', 5.403, -75.487),
  m('riosucio', 'Riosucio', 'caldas', 'hard', 5.421, -75.703),
  m('chinchina', 'Chinchiná', 'caldas', 'hard', 4.983, -75.607),
  m('san-vicente-caguan', 'San Vicente del Caguán', 'caqueta', 'hard', 2.115, -74.770),
  m('aguazul', 'Aguazul', 'casanare', 'hard', 5.173, -72.555),
  m('paz-de-ariporo', 'Paz de Ariporo', 'casanare', 'hard', 5.882, -71.892),
  m('silvia', 'Silvia', 'cauca', 'hard', 2.612, -76.381),
  m('guapi', 'Guapi', 'cauca', 'hard', 2.571, -77.886),
  m('santander-quilichao', 'Santander de Quilichao', 'cauca', 'hard', 3.009, -76.484),
  m('aguachica', 'Aguachica', 'cesar', 'hard', 8.309, -73.616),
  m('codazzi', 'Agustín Codazzi', 'cesar', 'hard', 10.037, -73.237),
  m('bahia-solano', 'Bahía Solano', 'choco', 'hard', 6.223, -77.403),
  m('istmina', 'Istmina', 'choco', 'hard', 5.160, -76.684),
  m('acandi', 'Acandí', 'choco', 'hard', 8.512, -77.279),
  m('sahagun', 'Sahagún', 'cordoba', 'hard', 8.946, -75.443),
  m('montelibano', 'Montelíbano', 'cordoba', 'hard', 7.979, -75.420),
  m('guatavita', 'Guatavita', 'cundinamarca', 'hard', 4.936, -73.833),
  m('villeta', 'Villeta', 'cundinamarca', 'hard', 5.013, -74.473),
  m('ubate', 'Ubaté', 'cundinamarca', 'hard', 5.307, -73.816),
  m('garzon', 'Garzón', 'huila', 'hard', 2.196, -75.628),
  m('villavieja', 'Villavieja', 'huila', 'hard', 3.219, -75.217),
  m('manaure', 'Manaure', 'guajira', 'hard', 11.775, -72.444),
  m('fonseca', 'Fonseca', 'guajira', 'hard', 10.886, -72.848),
  m('el-banco', 'El Banco', 'magdalena', 'hard', 9.001, -73.976),
  m('fundacion', 'Fundación', 'magdalena', 'hard', 10.520, -74.185),
  m('granada-meta', 'Granada', 'meta', 'hard', 3.546, -73.706),
  m('puerto-lopez', 'Puerto López', 'meta', 'hard', 4.089, -72.958),
  m('acacias', 'Acacías', 'meta', 'hard', 3.987, -73.763),
  m('la-macarena', 'La Macarena', 'meta', 'hard', 2.183, -73.786),
  m('puerto-gaitan', 'Puerto Gaitán', 'meta', 'hard', 4.314, -72.082),
  m('tuquerres', 'Túquerres', 'narino', 'hard', 1.087, -77.617),
  m('villa-del-rosario', 'Villa del Rosario', 'norte-santander', 'hard', 7.834, -72.474),
  m('sibundoy', 'Sibundoy', 'putumayo', 'hard', 1.203, -76.919),
  m('montenegro', 'Montenegro', 'quindio', 'hard', 4.566, -75.751),
  m('socorro', 'Socorro', 'santander', 'hard', 6.468, -73.260),
  m('malaga', 'Málaga', 'santander', 'hard', 6.699, -72.733),
  m('corozal', 'Corozal', 'sucre', 'hard', 9.318, -75.293),
  m('mariquita', 'Mariquita', 'tolima', 'hard', 5.199, -74.893),
  m('libano', 'Líbano', 'tolima', 'hard', 4.921, -75.062),
  m('yumbo', 'Yumbo', 'valle', 'hard', 3.585, -76.495),
  m('puerto-narino', 'Puerto Nariño', 'amazonas', 'hard', -3.770, -70.383),
  m('cumaribo', 'Cumaribo', 'vichada', 'hard', 4.446, -69.796),
  m('saravena', 'Saravena', 'arauca', 'hard', 6.954, -71.873),
  m('tame', 'Tame', 'arauca', 'hard', 6.462, -71.744),
];
