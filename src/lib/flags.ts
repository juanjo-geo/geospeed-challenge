/**
 * Banderas por país (tarea de contenido C5, versión mínima).
 *
 * `cities.ts` guarda el país como nombre en español ("Japón", "EE.UU.") y el modo Mundial usa
 * los nombres en inglés de `countries.ts` ("Japan", "United States of America"). Esta tabla
 * resuelve ambos al código ISO-3166 alfa-2, que es el nombre del SVG en `public/flags/`.
 * Se usan SVG locales (country-flag-icons, MIT) porque Windows no dibuja los emojis de banderas.
 */
const ISO_BY_COUNTRY: Record<string, string> = {
  // ── Nombres en español (cities.ts) ──
  'Afganistán': 'AF', 'Albania': 'AL', 'Alemania': 'DE', 'Angola': 'AO', 'Arabia Saudita': 'SA',
  'Argelia': 'DZ', 'Argentina': 'AR', 'Armenia': 'AM', 'Australia': 'AU', 'Austria': 'AT',
  'Azerbaiyán': 'AZ', 'Bahamas': 'BS', 'Bangladés': 'BD', 'Baréin': 'BH', 'Belice': 'BZ',
  'Benín': 'BJ', 'Bielorrusia': 'BY', 'Bolivia': 'BO', 'Bosnia y Herzegovina': 'BA', 'Botsuana': 'BW',
  'Brasil': 'BR', 'Brunéi': 'BN', 'Bulgaria': 'BG', 'Burkina Faso': 'BF', 'Burundi': 'BI',
  'Bután': 'BT', 'Bélgica': 'BE', 'Camboya': 'KH', 'Camerún': 'CM', 'Canadá': 'CA',
  'Catar': 'QA', 'Chad': 'TD', 'Chequia': 'CZ', 'Chile': 'CL', 'China': 'CN',
  'Chipre': 'CY', 'Colombia': 'CO', 'Comoras': 'KM', 'Corea del Norte': 'KP', 'Corea del Sur': 'KR',
  'Costa Rica': 'CR', 'Costa de Marfil': 'CI', 'Croacia': 'HR', 'Cuba': 'CU', 'Dinamarca': 'DK',
  'EAU': 'AE', 'EE.UU.': 'US', 'Ecuador': 'EC', 'Egipto': 'EG', 'El Salvador': 'SV',
  'Eritrea': 'ER', 'Eslovaquia': 'SK', 'Eslovenia': 'SI', 'España': 'ES', 'Estonia': 'EE',
  'Etiopía': 'ET', 'Filipinas': 'PH', 'Finlandia': 'FI', 'Francia': 'FR', 'Gabón': 'GA',
  'Georgia': 'GE', 'Ghana': 'GH', 'Grecia': 'GR', 'Guatemala': 'GT', 'Guayana Francesa': 'GF',
  'Guinea': 'GN', 'Guinea Ecuatorial': 'GQ', 'Guinea-Bisáu': 'GW', 'Guyana': 'GY', 'Haití': 'HT',
  'Honduras': 'HN', 'Hungría': 'HU', 'India': 'IN', 'Indonesia': 'ID', 'Irak': 'IQ',
  'Irlanda': 'IE', 'Irán': 'IR', 'Islandia': 'IS', 'Italia': 'IT', 'Jamaica': 'JM', 'Japón': 'JP',
  'Jordania': 'JO', 'Kazajistán': 'KZ', 'Kenia': 'KE', 'Kirguistán': 'KG', 'Kuwait': 'KW',
  'Laos': 'LA', 'Lesoto': 'LS', 'Letonia': 'LV', 'Liberia': 'LR', 'Libia': 'LY',
  'Lituania': 'LT', 'Luxemburgo': 'LU', 'Macedonia del Norte': 'MK', 'Madagascar': 'MG', 'Malasia': 'MY',
  'Mali': 'ML', 'Malta': 'MT', 'Marruecos': 'MA', 'Mauricio': 'MU', 'Mauritania': 'MR',
  'Moldavia': 'MD', 'Mongolia': 'MN', 'Montenegro': 'ME', 'Mozambique': 'MZ', 'Myanmar': 'MM',
  'México': 'MX', 'Namibia': 'NA', 'Nepal': 'NP', 'Nicaragua': 'NI', 'Nigeria': 'NG',
  'Noruega': 'NO', 'Nueva Zelanda': 'NZ', 'Níger': 'NE', 'Omán': 'OM', 'Pakistán': 'PK',
  'Panamá': 'PA', 'Papúa Nueva Guinea': 'PG', 'Paraguay': 'PY', 'Países Bajos': 'NL', 'Perú': 'PE',
  'Polonia': 'PL', 'Portugal': 'PT', 'Reino Unido': 'GB', 'Rep. Centroafricana': 'CF', 'Rep. Dem. del Congo': 'CD',
  'Rep. Dominicana': 'DO', 'Rep. del Congo': 'CG', 'Ruanda': 'RW', 'Rumanía': 'RO', 'Rusia': 'RU',
  'Senegal': 'SN', 'Serbia': 'RS', 'Seychelles': 'SC', 'Sierra Leona': 'SL', 'Singapur': 'SG',
  'Siria': 'SY', 'Somalia': 'SO', 'Sri Lanka': 'LK', 'Sudáfrica': 'ZA', 'Sudán': 'SD',
  'Suecia': 'SE', 'Suiza': 'CH', 'Surinam': 'SR', 'Tailandia': 'TH', 'Taiwán': 'TW',
  'Tanzania': 'TZ', 'Tayikistán': 'TJ', 'Timor Oriental': 'TL', 'Togo': 'TG', 'Turkmenistán': 'TM',
  'Turquía': 'TR', 'Túnez': 'TN', 'Ucrania': 'UA', 'Uganda': 'UG', 'Uruguay': 'UY',
  'Uzbekistán': 'UZ', 'Venezuela': 'VE', 'Vietnam': 'VN', 'Yibuti': 'DJ', 'Zambia': 'ZM',
  'Zimbabue': 'ZW',
  // ── Nombres en inglés (countries.ts / players.ts, modo Mundial) ──
  "Côte d'Ivoire": 'CI', 'Algeria': 'DZ', 'Belgium': 'BE', 'Brazil': 'BR', 'Cameroon': 'CM',
  'Canada': 'CA', 'Croatia': 'HR', 'Czechia': 'CZ', 'Egypt': 'EG', 'France': 'FR',
  'Gabon': 'GA', 'Germany': 'DE', 'Iran': 'IR', 'Italy': 'IT', 'Japan': 'JP',
  'Mexico': 'MX', 'Morocco': 'MA', 'Netherlands': 'NL', 'Norway': 'NO', 'Poland': 'PL',
  'Romania': 'RO', 'South Korea': 'KR', 'Spain': 'ES', 'Sweden': 'SE', 'Switzerland': 'CH',
  'Turkey': 'TR', 'United Kingdom': 'GB', 'United States of America': 'US',
};

/** Código ISO-3166 alfa-2 del país (nombre en español del catálogo o en inglés del mapa), o null. */
export function countryIso(country: string | undefined | null): string | null {
  if (!country) return null;
  return ISO_BY_COUNTRY[country] ?? null;
}

/** Ruta del SVG de la bandera, o null si el país no está en la tabla. */
export function flagUrl(country: string | undefined | null): string | null {
  const iso = countryIso(country);
  return iso ? `/flags/${iso}.svg` : null;
}

/** Todos los códigos usados (para el script que copia los SVG a public/flags). */
export const USED_ISOS = Array.from(new Set(Object.values(ISO_BY_COUNTRY))).sort();
