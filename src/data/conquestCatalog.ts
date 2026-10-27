// Generado por scripts/build-conquest-catalog.mjs desde src/data/conquestTiers.ts. No editar a mano.
import type { City } from './cities';

/** País de Conquista: encuadre del mapa de la misión [lonMin, latMin, lonMax, latMax] y las 12 ciudades del banco */
export interface ConquestCountry { iso: string; name: string; nameEn: string; bounds: [number, number, number, number]; cityIds: string[] }

export const CONQUEST_COUNTRIES: ConquestCountry[] = [
  { iso: "CO", name: "Colombia", nameEn: "Colombia", bounds: [-79.72, -4.74, -66.15, 13.35], cityIds: ["bogota", "medellin", "cali", "barranquilla", "cartagena", "co:santa-marta", "co:bucaramanga", "co:cucuta", "co:pereira", "co:manizales", "co:pasto", "co:villavicencio"] },
  { iso: "PE", name: "Perú", nameEn: "Peru", bounds: [-81.83, -19.17, -68.15, 0.93], cityIds: ["lima", "arequipa", "cusco", "ci:pe-trujillo", "ci:pe-chiclayo", "ci:pe-piura", "iquitos", "ci:pe-puno", "ci:pe-huancayo", "ci:pe-tacna", "ci:pe-cajamarca", "ci:pe-ayacucho"] },
  { iso: "EC", name: "Ecuador", nameEn: "Ecuador", bounds: [-81.31, -5.34, -74.9, 1.76], cityIds: ["quito", "guayaquil", "ci:ec-cuenca", "ci:ec-manta", "ci:ec-ambato", "ci:ec-loja", "ci:ec-esmeraldas", "ci:ec-riobamba", "ci:ec-machala", "ci:ec-ibarra", "ci:ec-portoviejo", "ci:ec-latacunga"] },
  { iso: "CL", name: "Chile", nameEn: "Chile", bounds: [-76.13, -57.89, -66.44, -15.3], cityIds: ["santiago", "valparaiso", "ci:cl-concepcion", "ci:cl-antofagasta", "ci:cl-la-serena", "ci:cl-temuco", "ci:cl-puerto-montt", "punta-arenas", "ci:cl-arica", "ci:cl-iquique", "ci:cl-valdivia", "ci:cl-calama"] },
  { iso: "AR", name: "Argentina", nameEn: "Argentina", bounds: [-74.51, -57.26, -52.45, -19.82], cityIds: ["buenos-aires", "cordoba", "rosario", "mendoza", "ci:ar-mar-del-plata", "cq:ar-san-miguel-de-tucuman", "ci:ar-salta", "cq:ar-san-carlos-de-bariloche", "ushuaia", "ci:ar-neuquen", "ci:ar-santa-fe", "ci:ar-posadas"] },
  { iso: "BR", name: "Brasil", nameEn: "Brazil", bounds: [-76.06, -36.11, -32.39, 7.54], cityIds: ["brasilia", "sao-paulo", "rio-de-janeiro", "salvador", "cq:br-fortaleza", "cq:br-belo-horizonte", "manaus", "recife", "cq:br-porto-alegre", "curitiba", "cq:br-belem", "cq:br-florianopolis"] },
  { iso: "MX", name: "México", nameEn: "Mexico", bounds: [-118.95, 13.76, -84.99, 33.79], cityIds: ["ciudad-de-mexico", "guadalajara", "monterrey", "puebla", "cancun", "ci:mx-tijuana", "ci:mx-merida", "ci:mx-oaxaca", "ci:mx-acapulco", "ci:mx-chihuahua", "ci:mx-veracruz", "ci:mx-hermosillo"] },
  { iso: "ES", name: "España", nameEn: "Spain", bounds: [-10.14, 35.49, 3.79, 44.03], cityIds: ["madrid", "barcelona", "cq:es-valencia", "sevilla", "cq:es-bilbao", "cq:es-malaga", "cq:es-zaragoza", "cq:es-granada", "cq:es-santiago-de-compostela", "cq:es-palma", "cq:es-salamanca", "cq:es-toledo"] },
  { iso: "FR", name: "Francia", nameEn: "France", bounds: [-5.35, 41.81, 8.86, 51.68], cityIds: ["paris", "marsella", "lyon", "cq:fr-toulouse", "cq:fr-niza", "cq:fr-burdeos", "cq:fr-estrasburgo", "cq:fr-lille", "cq:fr-nantes", "cq:fr-montpellier", "cq:fr-rennes", "cq:fr-grenoble"] },
  { iso: "IT", name: "Italia", nameEn: "Italy", bounds: [6.14, 36, 19.18, 47.56], cityIds: ["roma", "milan", "napoles", "cq:it-turin", "florencia", "cq:it-venecia", "cq:it-bolonia", "cq:it-genova", "cq:it-palermo", "cq:it-bari", "cq:it-verona", "cq:it-cagliari"] },
];

/** Ciudades del banco que no estaban en el juego (las demás se reutilizan con su id del mundo, `co:` o `ci:`) */
export const CONQUEST_CITIES: City[] = [
  { id: "cq:ar-san-miguel-de-tucuman", kind: 'city', name: "San Miguel de Tucumán", nameEn: "San Miguel de Tucumán", country: "Argentina", iso: "AR", lat: -26.8167, lon: -65.2167, difficulty: 'basic' },
  { id: "cq:ar-san-carlos-de-bariloche", kind: 'city', name: "San Carlos de Bariloche", nameEn: "San Carlos de Bariloche", country: "Argentina", iso: "AR", lat: -41.15, lon: -71.3, difficulty: 'basic' },
  { id: "cq:br-fortaleza", kind: 'city', name: "Fortaleza", nameEn: "Fortaleza", country: "Brasil", iso: "BR", lat: -3.7275, lon: -38.5275, difficulty: 'basic' },
  { id: "cq:br-belo-horizonte", kind: 'city', name: "Belo Horizonte", nameEn: "Belo Horizonte", country: "Brasil", iso: "BR", lat: -19.9281, lon: -43.9419, difficulty: 'basic' },
  { id: "cq:br-porto-alegre", kind: 'city', name: "Porto Alegre", nameEn: "Porto Alegre", country: "Brasil", iso: "BR", lat: -30.0328, lon: -51.23, difficulty: 'basic' },
  { id: "cq:br-belem", kind: 'city', name: "Belém", nameEn: "Belém", country: "Brasil", iso: "BR", lat: -1.4558, lon: -48.5039, difficulty: 'basic' },
  { id: "cq:br-florianopolis", kind: 'city', name: "Florianópolis", nameEn: "Florianópolis", country: "Brasil", iso: "BR", lat: -27.5933, lon: -48.553, difficulty: 'basic' },
  { id: "cq:es-valencia", kind: 'city', name: "Valencia", nameEn: "Valencia", country: "España", iso: "ES", lat: 39.47, lon: -0.3764, difficulty: 'basic' },
  { id: "cq:es-bilbao", kind: 'city', name: "Bilbao", nameEn: "Bilbao", country: "España", iso: "ES", lat: 43.2631, lon: -2.935, difficulty: 'basic' },
  { id: "cq:es-malaga", kind: 'city', name: "Málaga", nameEn: "Málaga", country: "España", iso: "ES", lat: 36.7167, lon: -4.4167, difficulty: 'basic' },
  { id: "cq:es-zaragoza", kind: 'city', name: "Zaragoza", nameEn: "Zaragoza", country: "España", iso: "ES", lat: 41.65, lon: -0.8833, difficulty: 'basic' },
  { id: "cq:es-granada", kind: 'city', name: "Granada", nameEn: "Granada", country: "España", iso: "ES", lat: 37.175, lon: -3.6, difficulty: 'basic' },
  { id: "cq:es-santiago-de-compostela", kind: 'city', name: "Santiago de Compostela", nameEn: "Santiago de Compostela", country: "España", iso: "ES", lat: 42.8805, lon: -8.5457, difficulty: 'basic' },
  { id: "cq:es-palma", kind: 'city', name: "Palma", nameEn: "Palma", country: "España", iso: "ES", lat: 39.5667, lon: 2.6497, difficulty: 'basic' },
  { id: "cq:es-salamanca", kind: 'city', name: "Salamanca", nameEn: "Salamanca", country: "España", iso: "ES", lat: 40.9688, lon: -5.6639, difficulty: 'basic' },
  { id: "cq:es-toledo", kind: 'city', name: "Toledo", nameEn: "Toledo", country: "España", iso: "ES", lat: 39.8667, lon: -4.0333, difficulty: 'basic' },
  { id: "cq:fr-toulouse", kind: 'city', name: "Toulouse", nameEn: "Toulouse", country: "Francia", iso: "FR", lat: 43.6044, lon: 1.4433, difficulty: 'basic' },
  { id: "cq:fr-niza", kind: 'city', name: "Niza", nameEn: "Nice", country: "Francia", iso: "FR", lat: 43.7019, lon: 7.2683, difficulty: 'basic' },
  { id: "cq:fr-burdeos", kind: 'city', name: "Burdeos", nameEn: "Bordeaux", country: "Francia", iso: "FR", lat: 44.8378, lon: -0.5794, difficulty: 'basic' },
  { id: "cq:fr-estrasburgo", kind: 'city', name: "Estrasburgo", nameEn: "Strasbourg", country: "Francia", iso: "FR", lat: 48.5733, lon: 7.7522, difficulty: 'basic' },
  { id: "cq:fr-lille", kind: 'city', name: "Lille", nameEn: "Lille", country: "Francia", iso: "FR", lat: 50.6319, lon: 3.0575, difficulty: 'basic' },
  { id: "cq:fr-nantes", kind: 'city', name: "Nantes", nameEn: "Nantes", country: "Francia", iso: "FR", lat: 47.2172, lon: -1.5539, difficulty: 'basic' },
  { id: "cq:fr-montpellier", kind: 'city', name: "Montpellier", nameEn: "Montpellier", country: "Francia", iso: "FR", lat: 43.6109, lon: 3.8772, difficulty: 'basic' },
  { id: "cq:fr-rennes", kind: 'city', name: "Rennes", nameEn: "Rennes", country: "Francia", iso: "FR", lat: 48.1142, lon: -1.6808, difficulty: 'basic' },
  { id: "cq:fr-grenoble", kind: 'city', name: "Grenoble", nameEn: "Grenoble", country: "Francia", iso: "FR", lat: 45.1869, lon: 5.7264, difficulty: 'basic' },
  { id: "cq:it-turin", kind: 'city', name: "Turín", nameEn: "Turin", country: "Italia", iso: "IT", lat: 45.0667, lon: 7.7, difficulty: 'basic' },
  { id: "cq:it-venecia", kind: 'city', name: "Venecia", nameEn: "Venice", country: "Italia", iso: "IT", lat: 45.4397, lon: 12.3319, difficulty: 'basic' },
  { id: "cq:it-bolonia", kind: 'city', name: "Bolonia", nameEn: "Bologna", country: "Italia", iso: "IT", lat: 44.4939, lon: 11.3428, difficulty: 'basic' },
  { id: "cq:it-genova", kind: 'city', name: "Génova", nameEn: "Genoa", country: "Italia", iso: "IT", lat: 44.4072, lon: 8.9339, difficulty: 'basic' },
  { id: "cq:it-palermo", kind: 'city', name: "Palermo", nameEn: "Palermo", country: "Italia", iso: "IT", lat: 38.1157, lon: 13.3613, difficulty: 'basic' },
  { id: "cq:it-bari", kind: 'city', name: "Bari", nameEn: "Bari", country: "Italia", iso: "IT", lat: 41.1253, lon: 16.8667, difficulty: 'basic' },
  { id: "cq:it-verona", kind: 'city', name: "Verona", nameEn: "Verona", country: "Italia", iso: "IT", lat: 45.4386, lon: 10.9928, difficulty: 'basic' },
  { id: "cq:it-cagliari", kind: 'city', name: "Cagliari", nameEn: "Cagliari", country: "Italia", iso: "IT", lat: 39.2167, lon: 9.1167, difficulty: 'basic' },
];
