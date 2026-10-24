/**
 * Packs Pro (Fase 7b): qué países lleva cada pack. Todo lo demás sale de Natural Earth (dominio público) con
 * `node scripts/build-pro-packs.mjs --ne <carpeta>`: las divisiones (estados, provincias, departamentos… de
 * ne_10m_admin_1_states_provinces) y las ciudades (ne_10m_populated_places: capitales y las más pobladas). Los niveles
 * se asignan con una regla automática para revisión (las divisiones por tamaño, con la capital de cada país en Turista;
 * las ciudades por población, con las capitales de país en Turista). Lugares y monumentos: los del catálogo que están en
 * esos países (src/lib/catalog.ts).
 *
 * Decisiones de JuanJo (2026-10-23): los packs vienen incluidos en Pro, con una partida de prueba gratis al día por pack;
 * escala de cercanía de 400 km. Colombia tiene su propio pack gratis (Fase 7a), por eso no está en Andes.
 */
export interface ProPackCountry {
  /** Código ISO-3166 alfa-3 de Natural Earth (adm0_a3) */
  a3: string;
  /** ISO alfa-2 */
  iso: string;
  /** Nombre en español (el del catálogo de ciudades: bandera y foto) */
  es: string;
}

export interface ProPackSpec {
  id: 'andes' | 'conosur' | 'mexcam' | 'caribe';
  es: string;
  en: string;
  countries: ProPackCountry[];
}

const c = (a3: string, iso: string, es: string): ProPackCountry => ({ a3, iso, es });

export const PRO_PACKS: ProPackSpec[] = [
  { id: 'andes', es: 'Andes', en: 'Andes', countries: [c('VEN', 'VE', 'Venezuela'), c('ECU', 'EC', 'Ecuador'), c('PER', 'PE', 'Perú'), c('BOL', 'BO', 'Bolivia')] },
  { id: 'conosur', es: 'Cono Sur', en: 'Southern Cone', countries: [c('CHL', 'CL', 'Chile'), c('ARG', 'AR', 'Argentina'), c('URY', 'UY', 'Uruguay'), c('PRY', 'PY', 'Paraguay')] },
  {
    id: 'mexcam', es: 'México y Centroamérica', en: 'Mexico & Central America',
    countries: [c('MEX', 'MX', 'México'), c('GTM', 'GT', 'Guatemala'), c('BLZ', 'BZ', 'Belice'), c('HND', 'HN', 'Honduras'), c('SLV', 'SV', 'El Salvador'), c('NIC', 'NI', 'Nicaragua'), c('CRI', 'CR', 'Costa Rica'), c('PAN', 'PA', 'Panamá')],
  },
  { id: 'caribe', es: 'Caribe', en: 'Caribbean', countries: [c('CUB', 'CU', 'Cuba'), c('DOM', 'DO', 'República Dominicana'), c('HTI', 'HT', 'Haití'), c('JAM', 'JM', 'Jamaica'), c('PRI', 'PR', 'Puerto Rico')] },
];
