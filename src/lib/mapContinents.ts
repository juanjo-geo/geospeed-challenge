/**
 * Continente de cada país del mapa (nombres de countries.ts) y grupo de color del rediseño v2
 * (6 bloques + hielo). Compartido por WorldMapCanvas y la demo del Inicio (AutoDemo).
 */
// ── Continent → country mapping (ISO-style names matching countries.ts) ──
export const CONTINENT_COUNTRIES: Record<string, Set<string>> = {
  Europe: new Set(['Albania','Andorra','Austria','Belarus','Belgium','Bosnia and Herz.','Bulgaria','Croatia','Cyprus','Czechia','Denmark','Estonia','Finland','France','Germany','Greece','Hungary','Iceland','Ireland','Italy','Kosovo','Latvia','Liechtenstein','Lithuania','Luxembourg','Malta','Moldova','Monaco','Montenegro','Netherlands','North Macedonia','Norway','Poland','Portugal','Romania','Russia','San Marino','Serbia','Slovakia','Slovenia','Spain','Sweden','Switzerland','Ukraine','United Kingdom','Vatican']),
  Asia: new Set(['Afghanistan','Armenia','Azerbaijan','Bahrain','Bangladesh','Bhutan','Brunei','Cambodia','China','Georgia','India','Indonesia','Iran','Iraq','Israel','Japan','Jordan','Kazakhstan','Kuwait','Kyrgyzstan','Laos','Lebanon','Malaysia','Maldives','Mongolia','Myanmar','Nepal','North Korea','Oman','Pakistan','Palestine','Philippines','Qatar','Saudi Arabia','Singapore','South Korea','Sri Lanka','Syria','Taiwan','Tajikistan','Thailand','Timor-Leste','Turkey','Turkmenistan','United Arab Emirates','Uzbekistan','Vietnam','Yemen']),
  Africa: new Set(['Algeria','Angola','Benin','Botswana','Burkina Faso','Burundi','Cameroon','Cape Verde','Central African Rep.','Chad','Comoros','Congo','Côte d\'Ivoire','Dem. Rep. Congo','Djibouti','Egypt','Eq. Guinea','Eritrea','eSwatini','Ethiopia','Gabon','Gambia','Ghana','Guinea','Guinea-Bissau','Kenya','Lesotho','Liberia','Libya','Madagascar','Malawi','Mali','Mauritania','Mauritius','Morocco','Mozambique','Namibia','Niger','Nigeria','Rwanda','São Tomé and Príncipe','Senegal','Seychelles','Sierra Leone','Somalia','Somaliland','South Africa','South Sudan','Sudan','Tanzania','Togo','Tunisia','Uganda','W. Sahara','Zambia','Zimbabwe']),
  Americas: new Set(['Antigua and Barb.','Argentina','Bahamas','Barbados','Belize','Bolivia','Brazil','Canada','Chile','Colombia','Costa Rica','Cuba','Dominica','Dominican Rep.','Ecuador','El Salvador','Grenada','Guatemala','Guyana','Haiti','Honduras','Jamaica','Mexico','Nicaragua','Panama','Paraguay','Peru','Puerto Rico','St. Kitts and Nevis','St. Lucia','St. Vin. and Gren.','Suriname','Trinidad and Tobago','United States of America','Uruguay','Venezuela','Falkland Is.']),
  Oceania: new Set(['Australia','Fiji','Kiribati','Marshall Is.','Micronesia','Nauru','New Caledonia','New Zealand','Palau','Papua New Guinea','Samoa','Solomon Is.','Tonga','Tuvalu','Vanuatu']),
};

export const SOUTH_AMERICA = new Set(['Argentina','Bolivia','Brazil','Chile','Colombia','Ecuador','Guyana','Paraguay','Peru','Suriname','Uruguay','Venezuela','Falkland Is.']);

/** Grupo de color del mapa (maqueta: 6 bloques + hielo) */
export function getColorGroup(name: string): string {
  if (SOUTH_AMERICA.has(name)) return 'SouthAmerica';
  const c = getCountryContinent(name);
  if (c === 'Americas') return 'NorthAmerica';
  return c ?? 'Ice';
}

export function getCountryContinent(name: string): string | null {
  for (const [continent, set] of Object.entries(CONTINENT_COUNTRIES)) {
    if (set.has(name)) return continent;
  }
  return null;
}
