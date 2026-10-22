import type { Difficulty } from './cities';

/**
 * Banderas (Fase 6, docs/GeoSpeed_Plan_Competencia.md §4): qué países del mapa entran y en qué nivel.
 *
 * Claves = `name` de countries.ts (Natural Earth 1:110m, en inglés). Niveles por lo reconocible que es la
 * bandera para un jugador latinoamericano: basic Turista · easy Rookie · medium Crack · hard Leyenda.
 * Borrador para revisión de JuanJo (2026-10-22); al cambiar algo, regenerar el catálogo y el seed con
 * `node scripts/build-flags.mjs`.
 *
 * Fuera del catálogo: territorios y estados sin reconocimiento general que trae el mapa 1:110m
 * (Antarctica, W. Sahara, Greenland, Puerto Rico, Falkland Is., Fr. S. Antarctic Lands, New Caledonia,
 * N. Cyprus, Somaliland, Kosovo, Taiwan). Los microestados e islas que ese mapa no dibuja (Singapur, Malta,
 * Maldivas, Bahréin, Cabo Verde…) entrarán cuando el juego use el mapa 1:50m para las banderas.
 */
export const FLAG_TIERS: Record<string, Difficulty> = {
  // ── América ──
  'United States of America': 'basic', 'Canada': 'basic', 'Mexico': 'basic', 'Brazil': 'basic', 'Argentina': 'basic',
  'Colombia': 'basic', 'Chile': 'basic', 'Cuba': 'basic', 'Jamaica': 'basic',
  'Peru': 'easy', 'Venezuela': 'easy', 'Ecuador': 'easy', 'Uruguay': 'easy', 'Bolivia': 'easy', 'Panama': 'easy',
  'Costa Rica': 'easy', 'Dominican Rep.': 'easy', 'Paraguay': 'easy',
  'Guatemala': 'medium', 'Honduras': 'medium', 'El Salvador': 'medium', 'Nicaragua': 'medium', 'Haiti': 'medium',
  'Bahamas': 'medium', 'Trinidad and Tobago': 'medium',
  'Belize': 'hard', 'Guyana': 'hard', 'Suriname': 'hard',

  // ── Europa ──
  'Spain': 'basic', 'France': 'basic', 'Italy': 'basic', 'Germany': 'basic', 'United Kingdom': 'basic', 'Portugal': 'basic',
  'Switzerland': 'basic', 'Greece': 'basic', 'Netherlands': 'basic', 'Sweden': 'basic', 'Russia': 'basic',
  'Ireland': 'easy', 'Belgium': 'easy', 'Norway': 'easy', 'Denmark': 'easy', 'Finland': 'easy', 'Poland': 'easy',
  'Austria': 'easy', 'Ukraine': 'easy', 'Turkey': 'easy', 'Czechia': 'easy', 'Hungary': 'easy', 'Croatia': 'easy', 'Iceland': 'easy',
  'Romania': 'medium', 'Bulgaria': 'medium', 'Serbia': 'medium', 'Slovakia': 'medium', 'Slovenia': 'medium', 'Estonia': 'medium',
  'Latvia': 'medium', 'Lithuania': 'medium', 'Belarus': 'medium', 'Albania': 'medium', 'Cyprus': 'medium', 'Luxembourg': 'medium',
  'Moldova': 'hard', 'Bosnia and Herz.': 'hard', 'Macedonia': 'hard', 'Montenegro': 'hard',

  // ── Asia ──
  'Japan': 'basic', 'China': 'basic', 'South Korea': 'basic', 'India': 'basic', 'Saudi Arabia': 'basic', 'Israel': 'basic',
  'Vietnam': 'easy', 'Thailand': 'easy', 'Indonesia': 'easy', 'Philippines': 'easy', 'Pakistan': 'easy', 'Iran': 'easy',
  'Iraq': 'easy', 'United Arab Emirates': 'easy', 'Qatar': 'easy', 'Malaysia': 'easy', 'Bangladesh': 'easy', 'Nepal': 'easy',
  'North Korea': 'easy',
  'Kazakhstan': 'medium', 'Mongolia': 'medium', 'Sri Lanka': 'medium', 'Lebanon': 'medium', 'Jordan': 'medium', 'Kuwait': 'medium',
  'Syria': 'medium', 'Cambodia': 'medium', 'Myanmar': 'medium', 'Afghanistan': 'medium', 'Georgia': 'medium', 'Armenia': 'medium',
  'Azerbaijan': 'medium', 'Uzbekistan': 'medium', 'Oman': 'medium', 'Yemen': 'medium', 'Laos': 'medium',
  'Bhutan': 'hard', 'Kyrgyzstan': 'hard', 'Tajikistan': 'hard', 'Turkmenistan': 'hard', 'Brunei': 'hard', 'Timor-Leste': 'hard',
  'Palestine': 'hard',

  // ── África ──
  'South Africa': 'basic', 'Egypt': 'basic', 'Morocco': 'basic', 'Nigeria': 'basic', 'Kenya': 'basic',
  'Ghana': 'easy', 'Ethiopia': 'easy', 'Senegal': 'easy', 'Algeria': 'easy', 'Tunisia': 'easy', 'Cameroon': 'easy',
  "Côte d'Ivoire": 'easy', 'Tanzania': 'easy', 'Angola': 'easy', 'Libya': 'easy',
  'Mali': 'medium', 'Niger': 'medium', 'Chad': 'medium', 'Sudan': 'medium', 'Mozambique': 'medium', 'Zimbabwe': 'medium',
  'Zambia': 'medium', 'Uganda': 'medium', 'Madagascar': 'medium', 'Namibia': 'medium', 'Botswana': 'medium',
  'Dem. Rep. Congo': 'medium', 'Somalia': 'medium', 'Rwanda': 'medium', 'Congo': 'medium', 'Gabon': 'medium',
  'Guinea': 'medium', 'Burkina Faso': 'medium', 'Togo': 'medium', 'Benin': 'medium',
  'Mauritania': 'hard', 'Lesotho': 'hard', 'eSwatini': 'hard', 'Malawi': 'hard', 'Burundi': 'hard', 'Djibouti': 'hard',
  'Eritrea': 'hard', 'S. Sudan': 'hard', 'Central African Rep.': 'hard', 'Eq. Guinea': 'hard', 'Guinea-Bissau': 'hard',
  'Liberia': 'hard', 'Sierra Leone': 'hard', 'Gambia': 'hard',

  // ── Oceanía (solo en Mundo) ──
  'Australia': 'basic', 'New Zealand': 'easy', 'Papua New Guinea': 'medium', 'Fiji': 'medium',
  'Vanuatu': 'hard', 'Solomon Is.': 'hard',
};
