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
  // ── Nombres en inglés: TODOS los países de countries.ts (mapa, Mundial, fotos D7). XK (Kosovo) es código de uso común, no ISO oficial.
  // (Los nombres que coinciden con el español — Argentina, Chile, India… — ya están arriba.)
  'Fiji': 'FJ', 'W. Sahara': 'EH', 'Canada': 'CA', 'United States of America': 'US', 'Kazakhstan': 'KZ', 'Uzbekistan': 'UZ',
  'Papua New Guinea': 'PG', 'Dem. Rep. Congo': 'CD', 'Kenya': 'KE', 'Sudan': 'SD', 'Haiti': 'HT', 'Dominican Rep.': 'DO',
  'Russia': 'RU', 'Falkland Is.': 'FK', 'Norway': 'NO', 'Greenland': 'GL', 'Fr. S. Antarctic Lands': 'TF', 'Timor-Leste': 'TL',
  'South Africa': 'ZA', 'Lesotho': 'LS', 'Mexico': 'MX', 'Brazil': 'BR', 'Peru': 'PE', 'Panama': 'PA',
  'Belize': 'BZ', 'Suriname': 'SR', 'France': 'FR', 'Puerto Rico': 'PR', 'Zimbabwe': 'ZW', 'Botswana': 'BW',
  'Benin': 'BJ', 'Niger': 'NE', 'Cameroon': 'CM', "Côte d'Ivoire": 'CI', 'Guinea-Bissau': 'GW', 'Sierra Leone': 'SL',
  'Central African Rep.': 'CF', 'Congo': 'CG', 'Gabon': 'GA', 'Eq. Guinea': 'GQ', 'Malawi': 'MW', 'eSwatini': 'SZ',
  'Israel': 'IL', 'Lebanon': 'LB', 'Palestine': 'PS', 'Gambia': 'GM', 'Tunisia': 'TN', 'Algeria': 'DZ',
  'Jordan': 'JO', 'United Arab Emirates': 'AE', 'Qatar': 'QA', 'Iraq': 'IQ', 'Oman': 'OM', 'Vanuatu': 'VU',
  'Cambodia': 'KH', 'Thailand': 'TH', 'North Korea': 'KP', 'South Korea': 'KR', 'Bangladesh': 'BD', 'Bhutan': 'BT',
  'Pakistan': 'PK', 'Afghanistan': 'AF', 'Tajikistan': 'TJ', 'Kyrgyzstan': 'KG', 'Turkmenistan': 'TM', 'Iran': 'IR',
  'Syria': 'SY', 'Sweden': 'SE', 'Belarus': 'BY', 'Ukraine': 'UA', 'Poland': 'PL', 'Hungary': 'HU',
  'Moldova': 'MD', 'Romania': 'RO', 'Lithuania': 'LT', 'Latvia': 'LV', 'Germany': 'DE', 'Greece': 'GR',
  'Turkey': 'TR', 'Croatia': 'HR', 'Switzerland': 'CH', 'Luxembourg': 'LU', 'Belgium': 'BE', 'Netherlands': 'NL',
  'Spain': 'ES', 'Ireland': 'IE', 'New Caledonia': 'NC', 'Solomon Is.': 'SB', 'New Zealand': 'NZ', 'Taiwan': 'TW',
  'Italy': 'IT', 'Denmark': 'DK', 'United Kingdom': 'GB', 'Iceland': 'IS', 'Azerbaijan': 'AZ', 'Philippines': 'PH',
  'Malaysia': 'MY', 'Brunei': 'BN', 'Slovenia': 'SI', 'Finland': 'FI', 'Slovakia': 'SK', 'Czechia': 'CZ',
  'Japan': 'JP', 'Yemen': 'YE', 'Saudi Arabia': 'SA', 'N. Cyprus': 'CY', 'Cyprus': 'CY', 'Morocco': 'MA',
  'Egypt': 'EG', 'Libya': 'LY', 'Ethiopia': 'ET', 'Djibouti': 'DJ', 'Somaliland': 'SO', 'Rwanda': 'RW',
  'Bosnia and Herz.': 'BA', 'Macedonia': 'MK', 'Kosovo': 'XK', 'Trinidad and Tobago': 'TT', 'S. Sudan': 'SS', 'Antarctica': 'AQ',
};

/** Código ISO-3166 alfa-2 del país (nombre en español del catálogo o en inglés del mapa), o null. */
const displayNamesCache = new Map<string, Intl.DisplayNames | null>();
/** Nombre del país en el idioma del juego ("United States of America" → "Estados Unidos").
 *  Usa Intl.DisplayNames con el código ISO; si el navegador no lo soporta, devuelve el nombre tal cual. */
export function countryDisplayName(country: string | null | undefined, locale: string): string {
  if (!country) return '';
  const iso = countryIso(country);
  if (!iso || iso === 'XK') return country;
  let dn = displayNamesCache.get(locale);
  if (dn === undefined) {
    try { dn = new Intl.DisplayNames([locale], { type: 'region' }); } catch { dn = null; }
    displayNamesCache.set(locale, dn);
  }
  try { return dn?.of(iso) || country; } catch { return country; }
}

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
