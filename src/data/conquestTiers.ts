/**
 * Conquista el mapa — banco de ciudades por país (fase C1, docs/GeoSpeed_Conquista_Plan.md). Decisión de JuanJo
 * (CQ-D2, 2026-10-26): 12 ciudades "conocidas dentro del país" por cada uno de los diez países aprobados; cada
 * temporada el servidor arma un paquete de cinco por país con este banco. Nivel Turista para todos: capital, grandes
 * ciudades y las muy turísticas. Islas lejanas fuera (Galápagos, Canarias, territorios de ultramar), para que el mapa de
 * la misión encuadre el país sin achicarlo.
 *
 * Esta lista se escribe a mano; `node scripts/build-conquest-catalog.mjs` la verifica con Wikidata (país, coordenadas,
 * nombre ES/EN), reutiliza las ciudades que ya están en el juego (mismo id: conservan foto, ficha y reseña) y genera
 * src/data/conquestCatalog.ts, la semilla del servidor y el documento de revisión. Las coordenadas de aquí son
 * aproximadas: las oficiales salen del catálogo o de Wikidata.
 */
export interface ConquestCitySpec {
  es: string;
  en: string;
  lat: number;
  lon: number;
  /** QID de Wikidata cuando la búsqueda por nombre podría dar otra ciudad homónima */
  q?: string;
}

export interface ConquestCountrySpec {
  iso: string;
  es: string;
  en: string;
  cities: ConquestCitySpec[];
}

const c = (es: string, en: string, lat: number, lon: number, q?: string): ConquestCitySpec => ({ es, en, lat, lon, ...(q ? { q } : {}) });

export const CONQUEST_COUNTRIES_SPEC: ConquestCountrySpec[] = [
  { iso: 'CO', es: 'Colombia', en: 'Colombia', cities: [
    c('Bogotá', 'Bogotá', 4.711, -74.072), c('Medellín', 'Medellín', 6.244, -75.574), c('Cali', 'Cali', 3.452, -76.532),
    c('Barranquilla', 'Barranquilla', 10.964, -74.796), c('Cartagena', 'Cartagena', 10.391, -75.479), c('Santa Marta', 'Santa Marta', 11.24, -74.199),
    c('Bucaramanga', 'Bucaramanga', 7.119, -73.123), c('Cúcuta', 'Cúcuta', 7.894, -72.507), c('Pereira', 'Pereira', 4.813, -75.696),
    c('Manizales', 'Manizales', 5.07, -75.514), c('Pasto', 'Pasto', 1.214, -77.281), c('Villavicencio', 'Villavicencio', 4.142, -73.627),
  ] },
  { iso: 'PE', es: 'Perú', en: 'Peru', cities: [
    c('Lima', 'Lima', -12.046, -77.043), c('Arequipa', 'Arequipa', -16.409, -71.537), c('Cusco', 'Cusco', -13.532, -71.967),
    c('Trujillo', 'Trujillo', -8.112, -79.029), c('Chiclayo', 'Chiclayo', -6.771, -79.841), c('Piura', 'Piura', -5.194, -80.633),
    c('Iquitos', 'Iquitos', -3.749, -73.253), c('Puno', 'Puno', -15.84, -70.022), c('Huancayo', 'Huancayo', -12.065, -75.205),
    c('Tacna', 'Tacna', -18.006, -70.246), c('Cajamarca', 'Cajamarca', -7.163, -78.5), c('Ayacucho', 'Ayacucho', -13.16, -74.226),
  ] },
  { iso: 'EC', es: 'Ecuador', en: 'Ecuador', cities: [
    c('Quito', 'Quito', -0.18, -78.468), c('Guayaquil', 'Guayaquil', -2.17, -79.922), c('Cuenca', 'Cuenca', -2.901, -79.006),
    c('Manta', 'Manta', -0.968, -80.709), c('Ambato', 'Ambato', -1.241, -78.619), c('Loja', 'Loja', -3.993, -79.204),
    c('Esmeraldas', 'Esmeraldas', 0.968, -79.652), c('Riobamba', 'Riobamba', -1.671, -78.648), c('Machala', 'Machala', -3.258, -79.955),
    c('Ibarra', 'Ibarra', 0.352, -78.122), c('Portoviejo', 'Portoviejo', -1.055, -80.454), c('Latacunga', 'Latacunga', -0.935, -78.616),
  ] },
  { iso: 'CL', es: 'Chile', en: 'Chile', cities: [
    c('Santiago', 'Santiago', -33.449, -70.669), c('Valparaíso', 'Valparaíso', -33.047, -71.613), c('Concepción', 'Concepción', -36.827, -73.05),
    c('Antofagasta', 'Antofagasta', -23.65, -70.4), c('La Serena', 'La Serena', -29.903, -71.252), c('Temuco', 'Temuco', -38.736, -72.59),
    c('Puerto Montt', 'Puerto Montt', -41.469, -72.942), c('Punta Arenas', 'Punta Arenas', -53.163, -70.917), c('Arica', 'Arica', -18.478, -70.321),
    c('Iquique', 'Iquique', -20.214, -70.152), c('Valdivia', 'Valdivia', -39.814, -73.246), c('Calama', 'Calama', -22.456, -68.929),
  ] },
  { iso: 'AR', es: 'Argentina', en: 'Argentina', cities: [
    c('Buenos Aires', 'Buenos Aires', -34.604, -58.382), c('Córdoba', 'Córdoba', -31.417, -64.183), c('Rosario', 'Rosario', -32.947, -60.639),
    c('Mendoza', 'Mendoza', -32.889, -68.845), c('Mar del Plata', 'Mar del Plata', -38.005, -57.543), c('San Miguel de Tucumán', 'San Miguel de Tucumán', -26.808, -65.218),
    c('Salta', 'Salta', -24.782, -65.423), c('San Carlos de Bariloche', 'San Carlos de Bariloche', -41.134, -71.31), c('Ushuaia', 'Ushuaia', -54.801, -68.303),
    c('Neuquén', 'Neuquén', -38.952, -68.059), c('Santa Fe', 'Santa Fe', -31.633, -60.7), c('Posadas', 'Posadas', -27.367, -55.896),
  ] },
  { iso: 'BR', es: 'Brasil', en: 'Brazil', cities: [
    c('Brasilia', 'Brasília', -15.794, -47.882), c('São Paulo', 'São Paulo', -23.551, -46.633), c('Río de Janeiro', 'Rio de Janeiro', -22.907, -43.173),
    c('Salvador', 'Salvador', -12.971, -38.511), c('Fortaleza', 'Fortaleza', -3.732, -38.527), c('Belo Horizonte', 'Belo Horizonte', -19.917, -43.935),
    c('Manaos', 'Manaus', -3.119, -60.022), c('Recife', 'Recife', -8.048, -34.877), c('Porto Alegre', 'Porto Alegre', -30.035, -51.218),
    c('Curitiba', 'Curitiba', -25.429, -49.271), c('Belém', 'Belém', -1.456, -48.49), c('Florianópolis', 'Florianópolis', -27.595, -48.548, 'Q132997'),
  ] },
  { iso: 'MX', es: 'México', en: 'Mexico', cities: [
    c('Ciudad de México', 'Mexico City', 19.433, -99.133), c('Guadalajara', 'Guadalajara', 20.674, -103.344), c('Monterrey', 'Monterrey', 25.686, -100.316),
    c('Puebla', 'Puebla', 19.041, -98.206), c('Cancún', 'Cancún', 21.162, -86.851), c('Tijuana', 'Tijuana', 32.515, -117.038),
    c('Mérida', 'Mérida', 20.967, -89.624), c('Oaxaca', 'Oaxaca', 17.073, -96.726), c('Acapulco', 'Acapulco', 16.853, -99.823),
    c('Chihuahua', 'Chihuahua', 28.632, -106.069), c('Veracruz', 'Veracruz', 19.173, -96.134), c('Hermosillo', 'Hermosillo', 29.073, -110.956),
  ] },
  { iso: 'ES', es: 'España', en: 'Spain', cities: [
    c('Madrid', 'Madrid', 40.417, -3.704), c('Barcelona', 'Barcelona', 41.385, 2.173), c('Valencia', 'Valencia', 39.47, -0.376),
    c('Sevilla', 'Seville', 37.389, -5.984), c('Bilbao', 'Bilbao', 43.263, -2.935), c('Málaga', 'Málaga', 36.721, -4.421),
    c('Zaragoza', 'Zaragoza', 41.649, -0.889), c('Granada', 'Granada', 37.177, -3.599), c('Santiago de Compostela', 'Santiago de Compostela', 42.878, -8.545),
    c('Palma', 'Palma', 39.57, 2.65), c('Salamanca', 'Salamanca', 40.97, -5.664), c('Toledo', 'Toledo', 39.863, -4.027),
  ] },
  { iso: 'FR', es: 'Francia', en: 'France', cities: [
    c('París', 'Paris', 48.857, 2.352), c('Marsella', 'Marseille', 43.296, 5.37), c('Lyon', 'Lyon', 45.764, 4.836),
    c('Toulouse', 'Toulouse', 43.605, 1.444), c('Niza', 'Nice', 43.71, 7.262), c('Burdeos', 'Bordeaux', 44.838, -0.579),
    c('Estrasburgo', 'Strasbourg', 48.573, 7.752), c('Lille', 'Lille', 50.629, 3.057), c('Nantes', 'Nantes', 47.218, -1.554),
    c('Montpellier', 'Montpellier', 43.611, 3.877), c('Rennes', 'Rennes', 48.117, -1.678), c('Grenoble', 'Grenoble', 45.188, 5.724),
  ] },
  { iso: 'IT', es: 'Italia', en: 'Italy', cities: [
    c('Roma', 'Rome', 41.903, 12.496), c('Milán', 'Milan', 45.464, 9.19), c('Nápoles', 'Naples', 40.852, 14.268),
    c('Turín', 'Turin', 45.07, 7.687), c('Florencia', 'Florence', 43.77, 11.256), c('Venecia', 'Venice', 45.441, 12.316),
    c('Bolonia', 'Bologna', 44.494, 11.343), c('Génova', 'Genoa', 44.406, 8.934), c('Palermo', 'Palermo', 38.116, 13.361),
    c('Bari', 'Bari', 41.117, 16.872), c('Verona', 'Verona', 45.438, 10.992), c('Cagliari', 'Cagliari', 39.224, 9.122),
  ] },
];
