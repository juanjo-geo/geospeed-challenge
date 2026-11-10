/**
 * Conquista el mapa — banco de ciudades por país (fase C1, docs/GeoSpeed_Conquista_Plan.md). Decisión de JuanJo
 * (CQ-D2, 2026-10-26): 12 ciudades "conocidas dentro del país". Desde 2026-11-09 cada temporada sortea 10 de estos países
 * (agregar un país aquí lo suma al sorteo) y el servidor arma para cada uno un paquete de cinco ciudades de su banco. Nivel Turista para todos: capital, grandes
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

/** Zona del tablero (chips del mapa) */
export type ConquestZone = 'america' | 'europe' | 'asia' | 'africa' | 'oceania';

export interface ConquestCountrySpec {
  iso: string;
  es: string;
  en: string;
  zone: ConquestZone;
  cities: ConquestCitySpec[];
}

const c = (es: string, en: string, lat: number, lon: number, q?: string): ConquestCitySpec => ({ es, en, lat, lon, ...(q ? { q } : {}) });

export const CONQUEST_COUNTRIES_SPEC: ConquestCountrySpec[] = [
  { iso: 'CO', es: 'Colombia', en: 'Colombia', zone: 'america', cities: [
    c('Bogotá', 'Bogotá', 4.711, -74.072), c('Medellín', 'Medellín', 6.244, -75.574), c('Cali', 'Cali', 3.452, -76.532),
    c('Barranquilla', 'Barranquilla', 10.964, -74.796), c('Cartagena', 'Cartagena', 10.391, -75.479), c('Santa Marta', 'Santa Marta', 11.24, -74.199),
    c('Bucaramanga', 'Bucaramanga', 7.119, -73.123), c('Cúcuta', 'Cúcuta', 7.894, -72.507), c('Pereira', 'Pereira', 4.813, -75.696),
    c('Manizales', 'Manizales', 5.07, -75.514), c('Pasto', 'Pasto', 1.214, -77.281), c('Villavicencio', 'Villavicencio', 4.142, -73.627),
  ] },
  { iso: 'PE', es: 'Perú', en: 'Peru', zone: 'america', cities: [
    c('Lima', 'Lima', -12.046, -77.043), c('Arequipa', 'Arequipa', -16.409, -71.537), c('Cusco', 'Cusco', -13.532, -71.967),
    c('Trujillo', 'Trujillo', -8.112, -79.029), c('Chiclayo', 'Chiclayo', -6.771, -79.841), c('Piura', 'Piura', -5.194, -80.633),
    c('Iquitos', 'Iquitos', -3.749, -73.253), c('Puno', 'Puno', -15.84, -70.022), c('Huancayo', 'Huancayo', -12.065, -75.205),
    c('Tacna', 'Tacna', -18.006, -70.246), c('Cajamarca', 'Cajamarca', -7.163, -78.5), c('Ayacucho', 'Ayacucho', -13.16, -74.226),
  ] },
  { iso: 'EC', es: 'Ecuador', en: 'Ecuador', zone: 'america', cities: [
    c('Quito', 'Quito', -0.18, -78.468), c('Guayaquil', 'Guayaquil', -2.17, -79.922), c('Cuenca', 'Cuenca', -2.901, -79.006),
    c('Manta', 'Manta', -0.968, -80.709), c('Ambato', 'Ambato', -1.241, -78.619), c('Loja', 'Loja', -3.993, -79.204),
    c('Esmeraldas', 'Esmeraldas', 0.968, -79.652), c('Riobamba', 'Riobamba', -1.671, -78.648), c('Machala', 'Machala', -3.258, -79.955),
    c('Ibarra', 'Ibarra', 0.352, -78.122), c('Portoviejo', 'Portoviejo', -1.055, -80.454), c('Latacunga', 'Latacunga', -0.935, -78.616),
  ] },
  { iso: 'CL', es: 'Chile', en: 'Chile', zone: 'america', cities: [
    c('Santiago', 'Santiago', -33.449, -70.669), c('Valparaíso', 'Valparaíso', -33.047, -71.613), c('Concepción', 'Concepción', -36.827, -73.05),
    c('Antofagasta', 'Antofagasta', -23.65, -70.4), c('La Serena', 'La Serena', -29.903, -71.252), c('Temuco', 'Temuco', -38.736, -72.59),
    c('Puerto Montt', 'Puerto Montt', -41.469, -72.942), c('Punta Arenas', 'Punta Arenas', -53.163, -70.917), c('Arica', 'Arica', -18.478, -70.321),
    c('Iquique', 'Iquique', -20.214, -70.152), c('Valdivia', 'Valdivia', -39.814, -73.246), c('Calama', 'Calama', -22.456, -68.929),
  ] },
  { iso: 'AR', es: 'Argentina', en: 'Argentina', zone: 'america', cities: [
    c('Buenos Aires', 'Buenos Aires', -34.604, -58.382), c('Córdoba', 'Córdoba', -31.417, -64.183), c('Rosario', 'Rosario', -32.947, -60.639),
    c('Mendoza', 'Mendoza', -32.889, -68.845), c('Mar del Plata', 'Mar del Plata', -38.005, -57.543), c('San Miguel de Tucumán', 'San Miguel de Tucumán', -26.808, -65.218),
    c('Salta', 'Salta', -24.782, -65.423), c('San Carlos de Bariloche', 'San Carlos de Bariloche', -41.134, -71.31), c('Ushuaia', 'Ushuaia', -54.801, -68.303),
    c('Neuquén', 'Neuquén', -38.952, -68.059), c('Santa Fe', 'Santa Fe', -31.633, -60.7), c('Posadas', 'Posadas', -27.367, -55.896),
  ] },
  { iso: 'BR', es: 'Brasil', en: 'Brazil', zone: 'america', cities: [
    c('Brasilia', 'Brasília', -15.794, -47.882), c('São Paulo', 'São Paulo', -23.551, -46.633), c('Río de Janeiro', 'Rio de Janeiro', -22.907, -43.173),
    c('Salvador', 'Salvador', -12.971, -38.511), c('Fortaleza', 'Fortaleza', -3.732, -38.527), c('Belo Horizonte', 'Belo Horizonte', -19.917, -43.935),
    c('Manaos', 'Manaus', -3.119, -60.022), c('Recife', 'Recife', -8.048, -34.877), c('Porto Alegre', 'Porto Alegre', -30.035, -51.218),
    c('Curitiba', 'Curitiba', -25.429, -49.271), c('Belém', 'Belém', -1.456, -48.49), c('Florianópolis', 'Florianópolis', -27.595, -48.548, 'Q132997'),
  ] },
  { iso: 'MX', es: 'México', en: 'Mexico', zone: 'america', cities: [
    c('Ciudad de México', 'Mexico City', 19.433, -99.133), c('Guadalajara', 'Guadalajara', 20.674, -103.344), c('Monterrey', 'Monterrey', 25.686, -100.316),
    c('Puebla', 'Puebla', 19.041, -98.206), c('Cancún', 'Cancún', 21.162, -86.851), c('Tijuana', 'Tijuana', 32.515, -117.038),
    c('Mérida', 'Mérida', 20.967, -89.624), c('Oaxaca', 'Oaxaca', 17.073, -96.726), c('Acapulco', 'Acapulco', 16.853, -99.823),
    c('Chihuahua', 'Chihuahua', 28.632, -106.069), c('Veracruz', 'Veracruz', 19.173, -96.134), c('Hermosillo', 'Hermosillo', 29.073, -110.956),
  ] },
  { iso: 'ES', es: 'España', en: 'Spain', zone: 'europe', cities: [
    c('Madrid', 'Madrid', 40.417, -3.704), c('Barcelona', 'Barcelona', 41.385, 2.173), c('Valencia', 'Valencia', 39.47, -0.376),
    c('Sevilla', 'Seville', 37.389, -5.984), c('Bilbao', 'Bilbao', 43.263, -2.935), c('Málaga', 'Málaga', 36.721, -4.421),
    c('Zaragoza', 'Zaragoza', 41.649, -0.889), c('Granada', 'Granada', 37.177, -3.599), c('Santiago de Compostela', 'Santiago de Compostela', 42.878, -8.545),
    c('Palma', 'Palma', 39.57, 2.65), c('Salamanca', 'Salamanca', 40.97, -5.664), c('Toledo', 'Toledo', 39.863, -4.027),
  ] },
  { iso: 'FR', es: 'Francia', en: 'France', zone: 'europe', cities: [
    c('París', 'Paris', 48.857, 2.352), c('Marsella', 'Marseille', 43.296, 5.37), c('Lyon', 'Lyon', 45.764, 4.836),
    c('Toulouse', 'Toulouse', 43.605, 1.444), c('Niza', 'Nice', 43.71, 7.262), c('Burdeos', 'Bordeaux', 44.838, -0.579),
    c('Estrasburgo', 'Strasbourg', 48.573, 7.752), c('Lille', 'Lille', 50.629, 3.057), c('Nantes', 'Nantes', 47.218, -1.554),
    c('Montpellier', 'Montpellier', 43.611, 3.877), c('Rennes', 'Rennes', 48.117, -1.678), c('Grenoble', 'Grenoble', 45.188, 5.724),
  ] },
  { iso: 'IT', es: 'Italia', en: 'Italy', zone: 'europe', cities: [
    c('Roma', 'Rome', 41.903, 12.496), c('Milán', 'Milan', 45.464, 9.19), c('Nápoles', 'Naples', 40.852, 14.268),
    c('Turín', 'Turin', 45.07, 7.687), c('Florencia', 'Florence', 43.77, 11.256), c('Venecia', 'Venice', 45.441, 12.316),
    c('Bolonia', 'Bologna', 44.494, 11.343), c('Génova', 'Genoa', 44.406, 8.934), c('Palermo', 'Palermo', 38.116, 13.361),
    c('Bari', 'Bari', 41.117, 16.872), c('Verona', 'Verona', 45.438, 10.992), c('Cagliari', 'Cagliari', 39.224, 9.122),
  ] },
  { iso: 'US', es: 'Estados Unidos', en: 'United States', zone: 'america', cities: [
    c('Washington D.C.', 'Washington, D.C.', 38.91, -77.04), c('Nueva York', 'New York City', 40.71, -74.01), c('Los Ángeles', 'Los Angeles', 34.05, -118.24),
    c('Chicago', 'Chicago', 41.88, -87.63), c('San Francisco', 'San Francisco', 37.77, -122.42), c('Miami', 'Miami', 25.76, -80.19),
    c('Las Vegas', 'Las Vegas', 36.17, -115.14), c('Seattle', 'Seattle', 47.61, -122.33), c('Boston', 'Boston', 42.36, -71.06),
    c('Houston', 'Houston', 29.76, -95.37), c('Denver', 'Denver', 39.74, -104.99), c('Nueva Orleans', 'New Orleans', 29.95, -90.07),
  ] },
  { iso: 'CA', es: 'Canadá', en: 'Canada', zone: 'america', cities: [
    c('Ottawa', 'Ottawa', 45.42, -75.7), c('Toronto', 'Toronto', 43.65, -79.38), c('Montreal', 'Montreal', 45.5, -73.57),
    c('Vancouver', 'Vancouver', 49.28, -123.12), c('Calgary', 'Calgary', 51.05, -114.07), c('Edmonton', 'Edmonton', 53.55, -113.49),
    c('Quebec', 'Quebec City', 46.81, -71.21, 'Q2145'), c('Winnipeg', 'Winnipeg', 49.9, -97.14), c('Halifax', 'Halifax', 44.65, -63.58),
    c('Regina', 'Regina', 50.45, -104.62), c('Saskatoon', 'Saskatoon', 52.13, -106.67), c('Whitehorse', 'Whitehorse', 60.72, -135.06),
  ] },
  { iso: 'VE', es: 'Venezuela', en: 'Venezuela', zone: 'america', cities: [
    c('Caracas', 'Caracas', 10.49, -66.88), c('Maracaibo', 'Maracaibo', 10.73, -71.66), c('Valencia', 'Valencia', 10.23, -67.98),
    c('Barquisimeto', 'Barquisimeto', 10.05, -69.3), c('Maracay', 'Maracay', 10.25, -67.6), c('Ciudad Guayana', 'Ciudad Guayana', 8.37, -62.62),
    c('Barcelona', 'Barcelona', 10.13, -64.72), c('San Cristóbal', 'San Cristóbal', 7.77, -72.25), c('Maturín', 'Maturín', 9.75, -63.17),
    c('Mérida', 'Mérida', 8.57, -71.18), c('Ciudad Bolívar', 'Ciudad Bolívar', 8.1, -63.6), c('Cumaná', 'Cumaná', 10.45, -64.18),
  ] },
  { iso: 'DE', es: 'Alemania', en: 'Germany', zone: 'europe', cities: [
    c('Berlín', 'Berlin', 52.52, 13.41), c('Múnich', 'Munich', 48.14, 11.58), c('Hamburgo', 'Hamburg', 53.55, 9.99),
    c('Fráncfort', 'Frankfurt', 50.11, 8.68), c('Colonia', 'Cologne', 50.94, 6.96), c('Stuttgart', 'Stuttgart', 48.78, 9.18),
    c('Düsseldorf', 'Düsseldorf', 51.23, 6.78), c('Dortmund', 'Dortmund', 51.51, 7.47), c('Leipzig', 'Leipzig', 51.34, 12.37),
    c('Dresde', 'Dresden', 51.05, 13.74), c('Hannover', 'Hanover', 52.37, 9.73), c('Núremberg', 'Nuremberg', 49.45, 11.08),
  ] },
  { iso: 'GB', es: 'Reino Unido', en: 'United Kingdom', zone: 'europe', cities: [
    c('Londres', 'London', 51.51, -0.13), c('Edimburgo', 'Edinburgh', 55.95, -3.19), c('Mánchester', 'Manchester', 53.48, -2.24),
    c('Liverpool', 'Liverpool', 53.41, -2.99), c('Birmingham', 'Birmingham', 52.49, -1.89), c('Glasgow', 'Glasgow', 55.86, -4.25),
    c('Leeds', 'Leeds', 53.8, -1.55), c('Bristol', 'Bristol', 51.45, -2.59), c('Cardiff', 'Cardiff', 51.48, -3.18),
    c('Belfast', 'Belfast', 54.6, -5.93), c('Oxford', 'Oxford', 51.75, -1.26), c('Cambridge', 'Cambridge', 52.21, 0.12),
  ] },
  { iso: 'PT', es: 'Portugal', en: 'Portugal', zone: 'europe', cities: [
    c('Lisboa', 'Lisbon', 38.72, -9.14), c('Oporto', 'Porto', 41.16, -8.63), c('Coímbra', 'Coimbra', 40.21, -8.43),
    c('Braga', 'Braga', 41.55, -8.43), c('Faro', 'Faro', 37.02, -7.93), c('Évora', 'Évora', 38.57, -7.91),
    c('Aveiro', 'Aveiro', 40.64, -8.65), c('Guimarães', 'Guimarães', 41.44, -8.29), c('Setúbal', 'Setúbal', 38.52, -8.89),
    c('Viseu', 'Viseu', 40.66, -7.91), c('Leiria', 'Leiria', 39.74, -8.81), c('Sintra', 'Sintra', 38.8, -9.38),
  ] },
  { iso: 'PL', es: 'Polonia', en: 'Poland', zone: 'europe', cities: [
    c('Varsovia', 'Warsaw', 52.23, 21.01), c('Cracovia', 'Kraków', 50.06, 19.94), c('Gdansk', 'Gdańsk', 54.35, 18.65),
    c('Breslavia', 'Wrocław', 51.11, 17.04), c('Poznan', 'Poznań', 52.41, 16.93), c('Lodz', 'Łódź', 51.76, 19.46),
    c('Szczecin', 'Szczecin', 53.43, 14.55), c('Lublin', 'Lublin', 51.25, 22.57), c('Katowice', 'Katowice', 50.26, 19.02),
    c('Bialystok', 'Białystok', 53.13, 23.16), c('Bydgoszcz', 'Bydgoszcz', 53.12, 18.01), c('Rzeszów', 'Rzeszów', 50.04, 22.0),
  ] },
  { iso: 'GR', es: 'Grecia', en: 'Greece', zone: 'europe', cities: [
    c('Atenas', 'Athens', 37.98, 23.73), c('Salónica', 'Thessaloniki', 40.64, 22.94), c('Patras', 'Patras', 38.25, 21.73),
    c('Heraclión', 'Heraklion', 35.34, 25.13), c('Larisa', 'Larissa', 39.64, 22.42), c('Volos', 'Volos', 39.36, 22.94),
    c('Ioánina', 'Ioannina', 39.67, 20.85), c('Kavala', 'Kavala', 40.94, 24.41), c('Kalamata', 'Kalamata', 37.04, 22.11),
    c('Corfú', 'Corfu', 39.62, 19.92), c('Alejandrópolis', 'Alexandroupoli', 40.85, 25.87), c('Esparta', 'Sparta', 37.07, 22.43),
  ] },
  { iso: 'SE', es: 'Suecia', en: 'Sweden', zone: 'europe', cities: [
    c('Estocolmo', 'Stockholm', 59.33, 18.07), c('Gotemburgo', 'Gothenburg', 57.71, 11.97), c('Malmö', 'Malmö', 55.6, 13.0),
    c('Upsala', 'Uppsala', 59.86, 17.64), c('Linköping', 'Linköping', 58.41, 15.62), c('Örebro', 'Örebro', 59.27, 15.21),
    c('Västerås', 'Västerås', 59.61, 16.55), c('Umeå', 'Umeå', 63.83, 20.26), c('Luleå', 'Luleå', 65.58, 22.15),
    c('Kiruna', 'Kiruna', 67.86, 20.23), c('Helsingborg', 'Helsingborg', 56.05, 12.69), c('Gävle', 'Gävle', 60.67, 17.14),
  ] },
  { iso: 'TR', es: 'Turquía', en: 'Turkey', zone: 'europe', cities: [
    c('Estambul', 'Istanbul', 41.01, 28.98), c('Ankara', 'Ankara', 39.93, 32.86), c('Izmir', 'İzmir', 38.42, 27.13),
    c('Antalya', 'Antalya', 36.9, 30.7), c('Bursa', 'Bursa', 40.19, 29.06), c('Adana', 'Adana', 37.0, 35.32),
    c('Gaziantep', 'Gaziantep', 37.07, 37.38), c('Konya', 'Konya', 37.87, 32.49), c('Trebisonda', 'Trabzon', 41.0, 39.72),
    c('Kayseri', 'Kayseri', 38.73, 35.48), c('Diyarbakır', 'Diyarbakır', 37.91, 40.22), c('Erzurum', 'Erzurum', 39.9, 41.27),
  ] },
  { iso: 'JP', es: 'Japón', en: 'Japan', zone: 'asia', cities: [
    c('Tokio', 'Tokyo', 35.68, 139.69), c('Osaka', 'Osaka', 34.69, 135.5), c('Kioto', 'Kyoto', 35.01, 135.77),
    c('Yokohama', 'Yokohama', 35.44, 139.64), c('Nagoya', 'Nagoya', 35.18, 136.91), c('Sapporo', 'Sapporo', 43.06, 141.35),
    c('Fukuoka', 'Fukuoka', 33.59, 130.4), c('Hiroshima', 'Hiroshima', 34.39, 132.46), c('Nagasaki', 'Nagasaki', 32.75, 129.88),
    c('Kobe', 'Kobe', 34.69, 135.2), c('Sendai', 'Sendai', 38.27, 140.87), c('Nara', 'Nara', 34.69, 135.8),
  ] },
  { iso: 'CN', es: 'China', en: 'China', zone: 'asia', cities: [
    c('Pekín', 'Beijing', 39.9, 116.4), c('Shanghái', 'Shanghai', 31.23, 121.47), c('Cantón', 'Guangzhou', 23.13, 113.26),
    c('Shenzhen', 'Shenzhen', 22.54, 114.06), c('Chengdú', 'Chengdu', 30.57, 104.07), c("Xi'an", "Xi'an", 34.27, 108.95),
    c('Wuhan', 'Wuhan', 30.59, 114.31), c('Hangzhou', 'Hangzhou', 30.27, 120.16), c('Nankín', 'Nanjing', 32.06, 118.8),
    c('Harbin', 'Harbin', 45.8, 126.53), c('Chongqing', 'Chongqing', 29.56, 106.55), c('Lhasa', 'Lhasa', 29.65, 91.1),
  ] },
  { iso: 'IN', es: 'India', en: 'India', zone: 'asia', cities: [
    c('Nueva Delhi', 'New Delhi', 28.61, 77.21), c('Bombay', 'Mumbai', 19.08, 72.88), c('Calcuta', 'Kolkata', 22.57, 88.36),
    c('Chennai', 'Chennai', 13.08, 80.27), c('Bangalore', 'Bengaluru', 12.97, 77.59), c('Hyderabad', 'Hyderabad', 17.39, 78.49),
    c('Jaipur', 'Jaipur', 26.91, 75.79), c('Agra', 'Agra', 27.18, 78.01), c('Benarés', 'Varanasi', 25.32, 83.01),
    c('Ahmedabad', 'Ahmedabad', 23.02, 72.57), c('Pune', 'Pune', 18.52, 73.86), c('Amritsar', 'Amritsar', 31.63, 74.87),
  ] },
  { iso: 'KR', es: 'Corea del Sur', en: 'South Korea', zone: 'asia', cities: [
    c('Seúl', 'Seoul', 37.57, 126.98), c('Busan', 'Busan', 35.18, 129.08), c('Incheon', 'Incheon', 37.46, 126.71),
    c('Daegu', 'Daegu', 35.87, 128.6), c('Daejeon', 'Daejeon', 36.35, 127.38), c('Gwangju', 'Gwangju', 35.16, 126.85),
    c('Ulsan', 'Ulsan', 35.54, 129.31), c('Suwon', 'Suwon', 37.26, 127.03), c('Jeonju', 'Jeonju', 35.82, 127.15),
    c('Gyeongju', 'Gyeongju', 35.86, 129.22), c('Chuncheon', 'Chuncheon', 37.88, 127.73), c('Pohang', 'Pohang', 36.02, 129.37),
  ] },
  { iso: 'TH', es: 'Tailandia', en: 'Thailand', zone: 'asia', cities: [
    c('Bangkok', 'Bangkok', 13.76, 100.5), c('Chiang Mai', 'Chiang Mai', 18.79, 98.98), c('Phuket', 'Phuket', 7.88, 98.39),
    c('Pattaya', 'Pattaya', 12.93, 100.88), c('Ayutthaya', 'Ayutthaya', 14.35, 100.57), c('Chiang Rai', 'Chiang Rai', 19.91, 99.83),
    c('Hat Yai', 'Hat Yai', 7.0, 100.47), c('Sukhothai', 'Sukhothai', 17.01, 99.82), c('Nakhon Ratchasima', 'Nakhon Ratchasima', 14.97, 102.1),
    c('Khon Kaen', 'Khon Kaen', 16.43, 102.83), c('Udon Thani', 'Udon Thani', 17.41, 102.79), c('Surat Thani', 'Surat Thani', 9.14, 99.33),
  ] },
  { iso: 'ID', es: 'Indonesia', en: 'Indonesia', zone: 'asia', cities: [
    c('Yakarta', 'Jakarta', -6.21, 106.85), c('Surabaya', 'Surabaya', -7.26, 112.75), c('Bandung', 'Bandung', -6.91, 107.61),
    c('Medan', 'Medan', 3.59, 98.67), c('Yogyakarta', 'Yogyakarta', -7.8, 110.36), c('Denpasar', 'Denpasar', -8.65, 115.22),
    c('Macasar', 'Makassar', -5.14, 119.43), c('Semarang', 'Semarang', -6.99, 110.42), c('Palembang', 'Palembang', -2.99, 104.76),
    c('Manado', 'Manado', 1.47, 124.85), c('Balikpapan', 'Balikpapan', -1.24, 116.85), c('Banda Aceh', 'Banda Aceh', 5.55, 95.32),
  ] },
  { iso: 'EG', es: 'Egipto', en: 'Egypt', zone: 'africa', cities: [
    c('El Cairo', 'Cairo', 30.04, 31.24), c('Alejandría', 'Alexandria', 31.2, 29.92), c('Luxor', 'Luxor', 25.69, 32.64),
    c('Asuán', 'Aswan', 24.09, 32.9), c('Giza', 'Giza', 30.01, 31.21), c('Sharm el-Sheij', 'Sharm El Sheikh', 27.91, 34.33),
    c('Hurghada', 'Hurghada', 27.26, 33.81), c('Puerto Saíd', 'Port Said', 31.26, 32.3), c('Suez', 'Suez', 29.97, 32.53),
    c('Mansura', 'Mansoura', 31.04, 31.38), c('Tanta', 'Tanta', 30.79, 31.0), c('Ismailía', 'Ismailia', 30.6, 32.27),
  ] },
  { iso: 'MA', es: 'Marruecos', en: 'Morocco', zone: 'africa', cities: [
    c('Rabat', 'Rabat', 34.02, -6.84), c('Casablanca', 'Casablanca', 33.57, -7.59), c('Marrakech', 'Marrakesh', 31.63, -8.0),
    c('Fez', 'Fez', 34.03, -5.0), c('Tánger', 'Tangier', 35.76, -5.83), c('Agadir', 'Agadir', 30.43, -9.6),
    c('Mequinez', 'Meknes', 33.9, -5.55), c('Oujda', 'Oujda', 34.68, -1.91), c('Tetuán', 'Tétouan', 35.57, -5.37),
    c('Chefchaouen', 'Chefchaouen', 35.17, -5.27), c('Essaouira', 'Essaouira', 31.51, -9.77), c('Ouarzazate', 'Ouarzazate', 30.92, -6.91),
  ] },
  { iso: 'ZA', es: 'Sudáfrica', en: 'South Africa', zone: 'africa', cities: [
    c('Johannesburgo', 'Johannesburg', -26.2, 28.05), c('Pretoria', 'Pretoria', -25.75, 28.19), c('Ciudad del Cabo', 'Cape Town', -33.93, 18.42),
    c('Durban', 'Durban', -29.86, 31.02), c('Port Elizabeth', 'Port Elizabeth', -33.96, 25.6), c('Bloemfontein', 'Bloemfontein', -29.12, 26.21),
    c('Kimberley', 'Kimberley', -28.74, 24.77), c('East London', 'East London', -33.02, 27.91), c('Polokwane', 'Polokwane', -23.9, 29.47),
    c('Mbombela', 'Mbombela', -25.47, 30.97), c('Pietermaritzburg', 'Pietermaritzburg', -29.6, 30.38), c('Stellenbosch', 'Stellenbosch', -33.93, 18.86),
  ] },
  { iso: 'AU', es: 'Australia', en: 'Australia', zone: 'oceania', cities: [
    c('Sídney', 'Sydney', -33.87, 151.21), c('Canberra', 'Canberra', -35.28, 149.13), c('Melbourne', 'Melbourne', -37.81, 144.96),
    c('Perth', 'Perth', -31.95, 115.86), c('Brisbane', 'Brisbane', -27.47, 153.03), c('Adelaida', 'Adelaide', -34.93, 138.6),
    c('Darwin', 'Darwin', -12.46, 130.84), c('Cairns', 'Cairns', -16.92, 145.77), c('Alice Springs', 'Alice Springs', -23.7, 133.88),
    c('Gold Coast', 'Gold Coast', -28.0, 153.43), c('Hobart', 'Hobart', -42.88, 147.33), c('Newcastle', 'Newcastle', -32.93, 151.78),
  ] },
];
