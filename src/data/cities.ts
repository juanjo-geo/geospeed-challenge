export type Difficulty = 'basic' | 'easy' | 'medium' | 'hard';
export type GameMode = 'world' | 'europe' | 'asia' | 'americas' | 'africa';

export interface City {
  /** Identificador estable (slug del nombre; `flag:<ISO>` en banderas), el mismo de la tabla `places` del servidor */
  id?: string;
  /** Qué se ubica: ciudad (por defecto) o bandera de un país (Fase 6, src/data/flagCatalog.ts) */
  kind?: 'city' | 'flag';
  /** Banderas: código ISO-3166 (imagen en /flags/<ISO>.svg) */
  iso?: string;
  /** Banderas: región del juego a la que pertenece (null = solo en Mundo, p. ej. Oceanía) */
  region?: GameMode | null;
  /** Ciudad: nombre del catálogo. Bandera: nombre del país en inglés (countries.ts); se muestra traducido (itemTitle) */
  name: string;
  country: string;
  lat: number;
  lon: number;
  difficulty: Difficulty;
}

// ===================== WORLD CITIES =====================
export const worldCities: City[] = [
  // === BASIC (20 megacities) ===
  { id: "tokio", name: "Tokio", country: "Japón", lat: 35.68, lon: 139.69, difficulty: "basic" },
  { id: "pekin", name: "Pekín", country: "China", lat: 39.90, lon: 116.40, difficulty: "basic" },
  { id: "moscu", name: "Moscú", country: "Rusia", lat: 55.76, lon: 37.62, difficulty: "basic" },
  { id: "londres", name: "Londres", country: "Reino Unido", lat: 51.51, lon: -0.13, difficulty: "basic" },
  { id: "paris", name: "París", country: "Francia", lat: 48.86, lon: 2.35, difficulty: "basic" },
  { id: "berlin", name: "Berlín", country: "Alemania", lat: 52.52, lon: 13.41, difficulty: "basic" },
  { id: "roma", name: "Roma", country: "Italia", lat: 41.90, lon: 12.50, difficulty: "basic" },
  { id: "madrid", name: "Madrid", country: "España", lat: 40.42, lon: -3.70, difficulty: "basic" },
  { id: "buenos-aires", name: "Buenos Aires", country: "Argentina", lat: -34.60, lon: -58.38, difficulty: "basic" },
  { id: "ciudad-de-mexico", name: "Ciudad de México", country: "México", lat: 19.43, lon: -99.13, difficulty: "basic" },
  { id: "el-cairo", name: "El Cairo", country: "Egipto", lat: 30.04, lon: 31.24, difficulty: "basic" },
  { id: "bangkok", name: "Bangkok", country: "Tailandia", lat: 13.76, lon: 100.50, difficulty: "basic" },
  { id: "seul", name: "Seúl", country: "Corea del Sur", lat: 37.57, lon: 126.98, difficulty: "basic" },
  { id: "bombay", name: "Bombay", country: "India", lat: 19.08, lon: 72.88, difficulty: "basic" },
  { id: "estambul", name: "Estambul", country: "Turquía", lat: 41.01, lon: 28.98, difficulty: "basic" },
  { id: "sidney", name: "Sídney", country: "Australia", lat: -33.87, lon: 151.21, difficulty: "basic" },
  { id: "los-angeles", name: "Los Ángeles", country: "EE.UU.", lat: 34.05, lon: -118.24, difficulty: "basic" },
  { id: "rio-de-janeiro", name: "Río de Janeiro", country: "Brasil", lat: -22.91, lon: -43.17, difficulty: "basic" },
  { id: "nueva-york", name: "Nueva York", country: "EE.UU.", lat: 40.71, lon: -74.01, difficulty: "basic" },
  { id: "johannesburgo", name: "Johannesburgo", country: "Sudáfrica", lat: -26.20, lon: 28.05, difficulty: "basic" },

  // === EASY (47 capitals) ===
  { id: "washington-d-c", name: "Washington D.C.", country: "EE.UU.", lat: 38.91, lon: -77.04, difficulty: "easy" },
  { id: "ottawa", name: "Ottawa", country: "Canadá", lat: 45.42, lon: -75.70, difficulty: "easy" },
  { id: "canberra", name: "Canberra", country: "Australia", lat: -35.28, lon: 149.13, difficulty: "easy" },
  { id: "brasilia", name: "Brasilia", country: "Brasil", lat: -15.79, lon: -47.88, difficulty: "easy" },
  { id: "nairobi", name: "Nairobi", country: "Kenia", lat: -1.29, lon: 36.82, difficulty: "easy" },
  { id: "nueva-delhi", name: "Nueva Delhi", country: "India", lat: 28.61, lon: 77.21, difficulty: "easy" },
  { id: "yakarta", name: "Yakarta", country: "Indonesia", lat: -6.21, lon: 106.85, difficulty: "easy" },
  { id: "lima", name: "Lima", country: "Perú", lat: -12.05, lon: -77.04, difficulty: "easy" },
  { id: "bogota", name: "Bogotá", country: "Colombia", lat: 4.71, lon: -74.07, difficulty: "easy" },
  { id: "santiago", name: "Santiago", country: "Chile", lat: -33.45, lon: -70.67, difficulty: "easy" },
  { id: "ankara", name: "Ankara", country: "Turquía", lat: 39.93, lon: 32.86, difficulty: "easy" },
  { id: "riad", name: "Riad", country: "Arabia Saudita", lat: 24.71, lon: 46.68, difficulty: "easy" },
  { id: "teheran", name: "Teherán", country: "Irán", lat: 35.69, lon: 51.39, difficulty: "easy" },
  { id: "islamabad", name: "Islamabad", country: "Pakistán", lat: 33.69, lon: 73.04, difficulty: "easy" },
  { id: "hanoi", name: "Hanói", country: "Vietnam", lat: 21.03, lon: 105.85, difficulty: "easy" },
  { id: "manila", name: "Manila", country: "Filipinas", lat: 14.60, lon: 120.98, difficulty: "easy" },
  { id: "kuala-lumpur", name: "Kuala Lumpur", country: "Malasia", lat: 3.14, lon: 101.69, difficulty: "easy" },
  { id: "atenas", name: "Atenas", country: "Grecia", lat: 37.98, lon: 23.73, difficulty: "easy" },
  { id: "lisboa", name: "Lisboa", country: "Portugal", lat: 38.72, lon: -9.14, difficulty: "easy" },
  { id: "varsovia", name: "Varsovia", country: "Polonia", lat: 52.23, lon: 21.01, difficulty: "easy" },
  { id: "budapest", name: "Budapest", country: "Hungría", lat: 47.50, lon: 19.04, difficulty: "easy" },
  { id: "bucarest", name: "Bucarest", country: "Rumanía", lat: 44.43, lon: 26.10, difficulty: "easy" },
  { id: "kiev", name: "Kiev", country: "Ucrania", lat: 50.45, lon: 30.52, difficulty: "easy" },
  { id: "helsinki", name: "Helsinki", country: "Finlandia", lat: 60.17, lon: 24.94, difficulty: "easy" },
  { id: "oslo", name: "Oslo", country: "Noruega", lat: 59.91, lon: 10.75, difficulty: "easy" },
  { id: "copenhague", name: "Copenhague", country: "Dinamarca", lat: 55.68, lon: 12.57, difficulty: "easy" },
  { id: "dublin", name: "Dublín", country: "Irlanda", lat: 53.35, lon: -6.26, difficulty: "easy" },
  { id: "bruselas", name: "Bruselas", country: "Bélgica", lat: 50.85, lon: 4.35, difficulty: "easy" },
  { id: "berna", name: "Berna", country: "Suiza", lat: 46.95, lon: 7.45, difficulty: "easy" },
  { id: "la-habana", name: "La Habana", country: "Cuba", lat: 23.11, lon: -82.37, difficulty: "easy" },
  { id: "caracas", name: "Caracas", country: "Venezuela", lat: 10.49, lon: -66.88, difficulty: "easy" },
  { id: "quito", name: "Quito", country: "Ecuador", lat: -0.18, lon: -78.47, difficulty: "easy" },
  { id: "montevideo", name: "Montevideo", country: "Uruguay", lat: -34.88, lon: -56.16, difficulty: "easy" },
  { id: "asuncion", name: "Asunción", country: "Paraguay", lat: -25.26, lon: -57.58, difficulty: "easy" },
  { id: "la-paz", name: "La Paz", country: "Bolivia", lat: -16.50, lon: -68.15, difficulty: "easy" },
  { id: "pretoria", name: "Pretoria", country: "Sudáfrica", lat: -25.75, lon: 28.19, difficulty: "easy" },
  { id: "addis-abeba", name: "Addis Abeba", country: "Etiopía", lat: 9.02, lon: 38.75, difficulty: "easy" },
  { id: "accra", name: "Accra", country: "Ghana", lat: 5.56, lon: -0.19, difficulty: "easy" },
  { id: "dakar", name: "Dakar", country: "Senegal", lat: 14.69, lon: -17.44, difficulty: "easy" },
  { id: "argel", name: "Argel", country: "Argelia", lat: 36.75, lon: 3.04, difficulty: "easy" },
  { id: "rabat", name: "Rabat", country: "Marruecos", lat: 34.02, lon: -6.84, difficulty: "easy" },
  { id: "tunez", name: "Túnez", country: "Túnez", lat: 36.81, lon: 10.18, difficulty: "easy" },
  { id: "singapur", name: "Singapur", country: "Singapur", lat: 1.35, lon: 103.82, difficulty: "easy" },
  { id: "colombo", name: "Colombo", country: "Sri Lanka", lat: 6.93, lon: 79.84, difficulty: "easy" },
  { id: "katmandu", name: "Katmandú", country: "Nepal", lat: 27.72, lon: 85.32, difficulty: "easy" },
  { id: "daca", name: "Daca", country: "Bangladés", lat: 23.81, lon: 90.41, difficulty: "easy" },
  { id: "naipyido", name: "Naipyidó", country: "Myanmar", lat: 19.76, lon: 96.07, difficulty: "easy" },

  // === MEDIUM (53 regional cities) ===
  { id: "shanghai", name: "Shanghái", country: "China", lat: 31.23, lon: 121.47, difficulty: "medium" },
  { id: "barcelona", name: "Barcelona", country: "España", lat: 41.39, lon: 2.17, difficulty: "medium" },
  { id: "munich", name: "Múnich", country: "Alemania", lat: 48.14, lon: 11.58, difficulty: "medium" },
  { id: "milan", name: "Milán", country: "Italia", lat: 45.46, lon: 9.19, difficulty: "medium" },
  { id: "melbourne", name: "Melbourne", country: "Australia", lat: -37.81, lon: 144.96, difficulty: "medium" },
  { id: "toronto", name: "Toronto", country: "Canadá", lat: 43.65, lon: -79.38, difficulty: "medium" },
  { id: "chicago", name: "Chicago", country: "EE.UU.", lat: 41.88, lon: -87.63, difficulty: "medium" },
  { id: "sao-paulo", name: "São Paulo", country: "Brasil", lat: -23.55, lon: -46.63, difficulty: "medium" },
  { id: "lagos", name: "Lagos", country: "Nigeria", lat: 6.52, lon: 3.38, difficulty: "medium" },
  { id: "karachi", name: "Karachi", country: "Pakistán", lat: 24.86, lon: 67.01, difficulty: "medium" },
  { id: "ho-chi-minh", name: "Ho Chi Minh", country: "Vietnam", lat: 10.82, lon: 106.63, difficulty: "medium" },
  { id: "osaka", name: "Osaka", country: "Japón", lat: 34.69, lon: 135.50, difficulty: "medium" },
  { id: "dubai", name: "Dubái", country: "EAU", lat: 25.20, lon: 55.27, difficulty: "medium" },
  { id: "san-petersburgo", name: "San Petersburgo", country: "Rusia", lat: 59.93, lon: 30.32, difficulty: "medium" },
  { id: "casablanca", name: "Casablanca", country: "Marruecos", lat: 33.57, lon: -7.59, difficulty: "medium" },
  { id: "ciudad-del-cabo", name: "Ciudad del Cabo", country: "Sudáfrica", lat: -33.93, lon: 18.42, difficulty: "medium" },
  { id: "montreal", name: "Montreal", country: "Canadá", lat: 45.50, lon: -73.57, difficulty: "medium" },
  { id: "vancouver", name: "Vancouver", country: "Canadá", lat: 49.28, lon: -123.12, difficulty: "medium" },
  { id: "calcuta", name: "Calcuta", country: "India", lat: 22.57, lon: 88.36, difficulty: "medium" },
  { id: "chennai", name: "Chennai", country: "India", lat: 13.08, lon: 80.27, difficulty: "medium" },
  { id: "amsterdam", name: "Ámsterdam", country: "Países Bajos", lat: 52.37, lon: 4.90, difficulty: "medium" },
  { id: "viena", name: "Viena", country: "Austria", lat: 48.21, lon: 16.37, difficulty: "medium" },
  { id: "estocolmo", name: "Estocolmo", country: "Suecia", lat: 59.33, lon: 18.07, difficulty: "medium" },
  { id: "praga", name: "Praga", country: "Chequia", lat: 50.08, lon: 14.44, difficulty: "medium" },
  { id: "marsella", name: "Marsella", country: "Francia", lat: 43.30, lon: 5.37, difficulty: "medium" },
  { id: "lyon", name: "Lyon", country: "Francia", lat: 45.76, lon: 4.83, difficulty: "medium" },
  { id: "hamburgo", name: "Hamburgo", country: "Alemania", lat: 53.55, lon: 9.99, difficulty: "medium" },
  { id: "napoles", name: "Nápoles", country: "Italia", lat: 40.85, lon: 14.27, difficulty: "medium" },
  { id: "sevilla", name: "Sevilla", country: "España", lat: 37.39, lon: -5.98, difficulty: "medium" },
  { id: "oporto", name: "Oporto", country: "Portugal", lat: 41.16, lon: -8.63, difficulty: "medium" },
  { id: "cracovia", name: "Cracovia", country: "Polonia", lat: 50.06, lon: 19.94, difficulty: "medium" },
  { id: "gdansk", name: "Gdansk", country: "Polonia", lat: 54.35, lon: 18.65, difficulty: "medium" },
  { id: "san-francisco", name: "San Francisco", country: "EE.UU.", lat: 37.77, lon: -122.42, difficulty: "medium" },
  { id: "miami", name: "Miami", country: "EE.UU.", lat: 25.76, lon: -80.19, difficulty: "medium" },
  { id: "guadalajara", name: "Guadalajara", country: "México", lat: 20.67, lon: -103.35, difficulty: "medium" },
  { id: "medellin", name: "Medellín", country: "Colombia", lat: 6.25, lon: -75.56, difficulty: "medium" },
  { id: "cordoba", name: "Córdoba", country: "Argentina", lat: -31.42, lon: -64.18, difficulty: "medium" },
  { id: "recife", name: "Recife", country: "Brasil", lat: -8.05, lon: -34.87, difficulty: "medium" },
  { id: "salvador", name: "Salvador", country: "Brasil", lat: -12.97, lon: -38.51, difficulty: "medium" },
  { id: "guayaquil", name: "Guayaquil", country: "Ecuador", lat: -2.17, lon: -79.92, difficulty: "medium" },
  { id: "alejandria", name: "Alejandría", country: "Egipto", lat: 31.20, lon: 29.92, difficulty: "medium" },
  { id: "dar-es-salaam", name: "Dar es Salaam", country: "Tanzania", lat: -6.79, lon: 39.28, difficulty: "medium" },
  { id: "luanda", name: "Luanda", country: "Angola", lat: -8.84, lon: 13.23, difficulty: "medium" },
  { id: "canton", name: "Cantón", country: "China", lat: 23.13, lon: 113.26, difficulty: "medium" },
  { id: "shenzhen", name: "Shenzhen", country: "China", lat: 22.54, lon: 114.06, difficulty: "medium" },
  { id: "bangalore", name: "Bangalore", country: "India", lat: 12.97, lon: 77.59, difficulty: "medium" },
  { id: "hyderabad", name: "Hyderabad", country: "India", lat: 17.39, lon: 78.49, difficulty: "medium" },
  { id: "lahore", name: "Lahore", country: "Pakistán", lat: 31.55, lon: 74.35, difficulty: "medium" },
  { id: "perth", name: "Perth", country: "Australia", lat: -31.95, lon: 115.86, difficulty: "medium" },
  { id: "auckland", name: "Auckland", country: "Nueva Zelanda", lat: -36.85, lon: 174.76, difficulty: "medium" },
  { id: "jeddah", name: "Jeddah", country: "Arabia Saudita", lat: 21.49, lon: 39.19, difficulty: "medium" },
  { id: "izmir", name: "Izmir", country: "Turquía", lat: 38.42, lon: 27.13, difficulty: "medium" },
  { id: "gotemburgo", name: "Gotemburgo", country: "Suecia", lat: 57.71, lon: 11.97, difficulty: "medium" },

  // === HARD (60 lesser-known cities) ===
  { id: "ulan-bator", name: "Ulán Bator", country: "Mongolia", lat: 47.91, lon: 106.91, difficulty: "hard" },
  { id: "antananarivo", name: "Antananarivo", country: "Madagascar", lat: -18.88, lon: 47.51, difficulty: "hard" },
  { id: "biskek", name: "Biskek", country: "Kirguistán", lat: 42.87, lon: 74.59, difficulty: "hard" },
  { id: "tiflis", name: "Tiflis", country: "Georgia", lat: 41.72, lon: 44.83, difficulty: "hard" },
  { id: "erevan", name: "Ereván", country: "Armenia", lat: 40.18, lon: 44.51, difficulty: "hard" },
  { id: "asjabad", name: "Asjabad", country: "Turkmenistán", lat: 37.96, lon: 58.38, difficulty: "hard" },
  { id: "dusambe", name: "Dusambé", country: "Tayikistán", lat: 38.56, lon: 68.77, difficulty: "hard" },
  { id: "taskent", name: "Taskent", country: "Uzbekistán", lat: 41.30, lon: 69.28, difficulty: "hard" },
  { id: "astana", name: "Astaná", country: "Kazajistán", lat: 51.17, lon: 71.43, difficulty: "hard" },
  { id: "baku", name: "Bakú", country: "Azerbaiyán", lat: 40.41, lon: 49.87, difficulty: "hard" },
  { id: "riga", name: "Riga", country: "Letonia", lat: 56.95, lon: 24.11, difficulty: "hard" },
  { id: "tallin", name: "Tallin", country: "Estonia", lat: 59.44, lon: 24.75, difficulty: "hard" },
  { id: "vilna", name: "Vilna", country: "Lituania", lat: 54.69, lon: 25.28, difficulty: "hard" },
  { id: "liubliana", name: "Liubliana", country: "Eslovenia", lat: 46.06, lon: 14.51, difficulty: "hard" },
  { id: "bratislava", name: "Bratislava", country: "Eslovaquia", lat: 48.15, lon: 17.11, difficulty: "hard" },
  { id: "chisinau", name: "Chisináu", country: "Moldavia", lat: 47.01, lon: 28.86, difficulty: "hard" },
  { id: "podgorica", name: "Podgorica", country: "Montenegro", lat: 42.44, lon: 19.26, difficulty: "hard" },
  { id: "skopie", name: "Skopie", country: "Macedonia del Norte", lat: 42.00, lon: 21.43, difficulty: "hard" },
  { id: "tirana", name: "Tirana", country: "Albania", lat: 41.33, lon: 19.82, difficulty: "hard" },
  { id: "manama", name: "Manama", country: "Baréin", lat: 26.23, lon: 50.59, difficulty: "hard" },
  { id: "timbu", name: "Timbu", country: "Bután", lat: 27.47, lon: 89.64, difficulty: "hard" },
  { id: "vientian", name: "Vientián", country: "Laos", lat: 17.97, lon: 102.63, difficulty: "hard" },
  { id: "nom-pen", name: "Nom Pen", country: "Camboya", lat: 11.56, lon: 104.93, difficulty: "hard" },
  { id: "port-moresby", name: "Port Moresby", country: "Papúa Nueva Guinea", lat: -9.48, lon: 147.15, difficulty: "hard" },
  { id: "windhoek", name: "Windhoek", country: "Namibia", lat: -22.56, lon: 17.08, difficulty: "hard" },
  { id: "lusaka", name: "Lusaka", country: "Zambia", lat: -15.39, lon: 28.32, difficulty: "hard" },
  { id: "maputo", name: "Maputo", country: "Mozambique", lat: -25.97, lon: 32.58, difficulty: "hard" },
  { id: "nuakchot", name: "Nuakchot", country: "Mauritania", lat: 18.09, lon: -15.98, difficulty: "hard" },
  { id: "niamey", name: "Niamey", country: "Níger", lat: 13.51, lon: 2.11, difficulty: "hard" },
  { id: "uagadugu", name: "Uagadugú", country: "Burkina Faso", lat: 12.37, lon: -1.52, difficulty: "hard" },
  { id: "bamako", name: "Bamako", country: "Mali", lat: 12.64, lon: -8.00, difficulty: "hard" },
  { id: "yamena", name: "Yamena", country: "Chad", lat: 12.13, lon: 15.05, difficulty: "hard" },
  { id: "bangui", name: "Bangui", country: "Rep. Centroafricana", lat: 4.36, lon: 18.56, difficulty: "hard" },
  { id: "libreville", name: "Libreville", country: "Gabón", lat: 0.39, lon: 9.45, difficulty: "hard" },
  { id: "malabo", name: "Malabo", country: "Guinea Ecuatorial", lat: 3.75, lon: 8.78, difficulty: "hard" },
  { id: "yaunde", name: "Yaundé", country: "Camerún", lat: 3.87, lon: 11.52, difficulty: "hard" },
  { id: "brazzaville", name: "Brazzaville", country: "Rep. del Congo", lat: -4.27, lon: 15.28, difficulty: "hard" },
  { id: "kinsasa", name: "Kinsasa", country: "Rep. Dem. del Congo", lat: -4.32, lon: 15.31, difficulty: "hard" },
  { id: "bujumbura", name: "Bujumbura", country: "Burundi", lat: -3.38, lon: 29.36, difficulty: "hard" },
  { id: "kigali", name: "Kigali", country: "Ruanda", lat: -1.94, lon: 29.87, difficulty: "hard" },
  { id: "kampala", name: "Kampala", country: "Uganda", lat: 0.35, lon: 32.58, difficulty: "hard" },
  { id: "mogadiscio", name: "Mogadiscio", country: "Somalia", lat: 2.05, lon: 45.32, difficulty: "hard" },
  { id: "asmara", name: "Asmara", country: "Eritrea", lat: 15.34, lon: 38.93, difficulty: "hard" },
  { id: "paramaribo", name: "Paramaribo", country: "Surinam", lat: 5.85, lon: -55.17, difficulty: "hard" },
  { id: "georgetown", name: "Georgetown", country: "Guyana", lat: 6.80, lon: -58.16, difficulty: "hard" },
  { id: "managua", name: "Managua", country: "Nicaragua", lat: 12.11, lon: -86.27, difficulty: "hard" },
  { id: "tegucigalpa", name: "Tegucigalpa", country: "Honduras", lat: 14.07, lon: -87.19, difficulty: "hard" },
  { id: "san-salvador", name: "San Salvador", country: "El Salvador", lat: 13.69, lon: -89.19, difficulty: "hard" },
  { id: "marrakech", name: "Marrakech", country: "Marruecos", lat: 31.63, lon: -8.00, difficulty: "hard" },
  { id: "dubrovnik", name: "Dubrovnik", country: "Croacia", lat: 42.65, lon: 18.09, difficulty: "hard" },
  { id: "cartagena", name: "Cartagena", country: "Colombia", lat: 10.39, lon: -75.51, difficulty: "hard" },
  { id: "cusco", name: "Cusco", country: "Perú", lat: -13.53, lon: -71.97, difficulty: "hard" },
  { id: "vladivostok", name: "Vladivostok", country: "Rusia", lat: 43.12, lon: 131.87, difficulty: "hard" },
  { id: "edimburgo", name: "Edimburgo", country: "Reino Unido", lat: 55.95, lon: -3.19, difficulty: "hard" },
  { id: "la-meca", name: "La Meca", country: "Arabia Saudita", lat: 21.43, lon: 39.83, difficulty: "hard" },
  { id: "zurich", name: "Zúrich", country: "Suiza", lat: 47.37, lon: 8.54, difficulty: "hard" },
  { id: "mombasa", name: "Mombasa", country: "Kenia", lat: -4.05, lon: 39.67, difficulty: "hard" },
  { id: "samarcanda", name: "Samarcanda", country: "Uzbekistán", lat: 39.65, lon: 66.96, difficulty: "hard" },
  { id: "cancun", name: "Cancún", country: "México", lat: 21.16, lon: -86.85, difficulty: "hard" },
  { id: "chiang-mai", name: "Chiang Mai", country: "Tailandia", lat: 18.79, lon: 98.98, difficulty: "hard" },
];

// ===================== EUROPE CITIES =====================
export const europeCities: City[] = [
  // === EASY (20 major capitals) ===
  { id: "londres", name: "Londres", country: "Reino Unido", lat: 51.51, lon: -0.13, difficulty: "easy" },
  { id: "paris", name: "París", country: "Francia", lat: 48.86, lon: 2.35, difficulty: "easy" },
  { id: "berlin", name: "Berlín", country: "Alemania", lat: 52.52, lon: 13.41, difficulty: "easy" },
  { id: "roma", name: "Roma", country: "Italia", lat: 41.90, lon: 12.50, difficulty: "easy" },
  { id: "madrid", name: "Madrid", country: "España", lat: 40.42, lon: -3.70, difficulty: "easy" },
  { id: "moscu", name: "Moscú", country: "Rusia", lat: 55.76, lon: 37.62, difficulty: "easy" },
  { id: "atenas", name: "Atenas", country: "Grecia", lat: 37.98, lon: 23.73, difficulty: "easy" },
  { id: "lisboa", name: "Lisboa", country: "Portugal", lat: 38.72, lon: -9.14, difficulty: "easy" },
  { id: "varsovia", name: "Varsovia", country: "Polonia", lat: 52.23, lon: 21.01, difficulty: "easy" },
  { id: "budapest", name: "Budapest", country: "Hungría", lat: 47.50, lon: 19.04, difficulty: "easy" },
  { id: "bucarest", name: "Bucarest", country: "Rumanía", lat: 44.43, lon: 26.10, difficulty: "easy" },
  { id: "kiev", name: "Kiev", country: "Ucrania", lat: 50.45, lon: 30.52, difficulty: "easy" },
  { id: "helsinki", name: "Helsinki", country: "Finlandia", lat: 60.17, lon: 24.94, difficulty: "easy" },
  { id: "oslo", name: "Oslo", country: "Noruega", lat: 59.91, lon: 10.75, difficulty: "easy" },
  { id: "copenhague", name: "Copenhague", country: "Dinamarca", lat: 55.68, lon: 12.57, difficulty: "easy" },
  { id: "dublin", name: "Dublín", country: "Irlanda", lat: 53.35, lon: -6.26, difficulty: "easy" },
  { id: "bruselas", name: "Bruselas", country: "Bélgica", lat: 50.85, lon: 4.35, difficulty: "easy" },
  { id: "berna", name: "Berna", country: "Suiza", lat: 46.95, lon: 7.45, difficulty: "easy" },
  { id: "viena", name: "Viena", country: "Austria", lat: 48.21, lon: 16.37, difficulty: "easy" },
  { id: "estocolmo", name: "Estocolmo", country: "Suecia", lat: 59.33, lon: 18.07, difficulty: "easy" },

  // === MEDIUM (20 well-known cities) ===
  { id: "barcelona", name: "Barcelona", country: "España", lat: 41.39, lon: 2.17, difficulty: "medium" },
  { id: "munich", name: "Múnich", country: "Alemania", lat: 48.14, lon: 11.58, difficulty: "medium" },
  { id: "milan", name: "Milán", country: "Italia", lat: 45.46, lon: 9.19, difficulty: "medium" },
  { id: "amsterdam", name: "Ámsterdam", country: "Países Bajos", lat: 52.37, lon: 4.90, difficulty: "medium" },
  { id: "praga", name: "Praga", country: "Chequia", lat: 50.08, lon: 14.44, difficulty: "medium" },
  { id: "marsella", name: "Marsella", country: "Francia", lat: 43.30, lon: 5.37, difficulty: "medium" },
  { id: "lyon", name: "Lyon", country: "Francia", lat: 45.76, lon: 4.83, difficulty: "medium" },
  { id: "hamburgo", name: "Hamburgo", country: "Alemania", lat: 53.55, lon: 9.99, difficulty: "medium" },
  { id: "napoles", name: "Nápoles", country: "Italia", lat: 40.85, lon: 14.27, difficulty: "medium" },
  { id: "sevilla", name: "Sevilla", country: "España", lat: 37.39, lon: -5.98, difficulty: "medium" },
  { id: "oporto", name: "Oporto", country: "Portugal", lat: 41.16, lon: -8.63, difficulty: "medium" },
  { id: "cracovia", name: "Cracovia", country: "Polonia", lat: 50.06, lon: 19.94, difficulty: "medium" },
  { id: "gdansk", name: "Gdansk", country: "Polonia", lat: 54.35, lon: 18.65, difficulty: "medium" },
  { id: "gotemburgo", name: "Gotemburgo", country: "Suecia", lat: 57.71, lon: 11.97, difficulty: "medium" },
  { id: "san-petersburgo", name: "San Petersburgo", country: "Rusia", lat: 59.93, lon: 30.32, difficulty: "medium" },
  { id: "estambul", name: "Estambul", country: "Turquía", lat: 41.01, lon: 28.98, difficulty: "medium" },
  { id: "edimburgo", name: "Edimburgo", country: "Reino Unido", lat: 55.95, lon: -3.19, difficulty: "medium" },
  { id: "manchester", name: "Mánchester", country: "Reino Unido", lat: 53.48, lon: -2.24, difficulty: "medium" },
  { id: "francfort", name: "Fráncfort", country: "Alemania", lat: 50.11, lon: 8.68, difficulty: "medium" },
  { id: "florencia", name: "Florencia", country: "Italia", lat: 43.77, lon: 11.25, difficulty: "medium" },

  // === HARD (20 lesser-known cities) ===
  { id: "riga", name: "Riga", country: "Letonia", lat: 56.95, lon: 24.11, difficulty: "hard" },
  { id: "tallin", name: "Tallin", country: "Estonia", lat: 59.44, lon: 24.75, difficulty: "hard" },
  { id: "vilna", name: "Vilna", country: "Lituania", lat: 54.69, lon: 25.28, difficulty: "hard" },
  { id: "liubliana", name: "Liubliana", country: "Eslovenia", lat: 46.06, lon: 14.51, difficulty: "hard" },
  { id: "bratislava", name: "Bratislava", country: "Eslovaquia", lat: 48.15, lon: 17.11, difficulty: "hard" },
  { id: "chisinau", name: "Chisináu", country: "Moldavia", lat: 47.01, lon: 28.86, difficulty: "hard" },
  { id: "podgorica", name: "Podgorica", country: "Montenegro", lat: 42.44, lon: 19.26, difficulty: "hard" },
  { id: "skopie", name: "Skopie", country: "Macedonia del Norte", lat: 42.00, lon: 21.43, difficulty: "hard" },
  { id: "tirana", name: "Tirana", country: "Albania", lat: 41.33, lon: 19.82, difficulty: "hard" },
  { id: "sarajevo", name: "Sarajevo", country: "Bosnia y Herzegovina", lat: 43.86, lon: 18.41, difficulty: "hard" },
  { id: "zagreb", name: "Zagreb", country: "Croacia", lat: 45.81, lon: 15.98, difficulty: "hard" },
  { id: "belgrado", name: "Belgrado", country: "Serbia", lat: 44.79, lon: 20.47, difficulty: "hard" },
  { id: "sofia", name: "Sofía", country: "Bulgaria", lat: 42.70, lon: 23.32, difficulty: "hard" },
  { id: "minsk", name: "Minsk", country: "Bielorrusia", lat: 53.90, lon: 27.57, difficulty: "hard" },
  { id: "reikiavik", name: "Reikiavik", country: "Islandia", lat: 64.15, lon: -21.94, difficulty: "hard" },
  { id: "nicosia", name: "Nicosia", country: "Chipre", lat: 35.17, lon: 33.36, difficulty: "hard" },
  { id: "la-valeta", name: "La Valeta", country: "Malta", lat: 35.90, lon: 14.51, difficulty: "hard" },
  { id: "luxemburgo", name: "Luxemburgo", country: "Luxemburgo", lat: 49.61, lon: 6.13, difficulty: "hard" },
  { id: "tiflis", name: "Tiflis", country: "Georgia", lat: 41.72, lon: 44.83, difficulty: "hard" },
  { id: "ankara", name: "Ankara", country: "Turquía", lat: 39.93, lon: 32.86, difficulty: "hard" },
];

// ===================== ASIA CITIES =====================
export const asiaCities: City[] = [
  // === EASY (20 major capitals) ===
  { id: "tokio", name: "Tokio", country: "Japón", lat: 35.68, lon: 139.69, difficulty: "easy" },
  { id: "pekin", name: "Pekín", country: "China", lat: 39.90, lon: 116.40, difficulty: "easy" },
  { id: "nueva-delhi", name: "Nueva Delhi", country: "India", lat: 28.61, lon: 77.21, difficulty: "easy" },
  { id: "bangkok", name: "Bangkok", country: "Tailandia", lat: 13.76, lon: 100.50, difficulty: "easy" },
  { id: "seul", name: "Seúl", country: "Corea del Sur", lat: 37.57, lon: 126.98, difficulty: "easy" },
  { id: "yakarta", name: "Yakarta", country: "Indonesia", lat: -6.21, lon: 106.85, difficulty: "easy" },
  { id: "manila", name: "Manila", country: "Filipinas", lat: 14.60, lon: 120.98, difficulty: "easy" },
  { id: "hanoi", name: "Hanói", country: "Vietnam", lat: 21.03, lon: 105.85, difficulty: "easy" },
  { id: "kuala-lumpur", name: "Kuala Lumpur", country: "Malasia", lat: 3.14, lon: 101.69, difficulty: "easy" },
  { id: "singapur", name: "Singapur", country: "Singapur", lat: 1.35, lon: 103.82, difficulty: "easy" },
  { id: "teheran", name: "Teherán", country: "Irán", lat: 35.69, lon: 51.39, difficulty: "easy" },
  { id: "riad", name: "Riad", country: "Arabia Saudita", lat: 24.71, lon: 46.68, difficulty: "easy" },
  { id: "islamabad", name: "Islamabad", country: "Pakistán", lat: 33.69, lon: 73.04, difficulty: "easy" },
  { id: "daca", name: "Daca", country: "Bangladés", lat: 23.81, lon: 90.41, difficulty: "easy" },
  { id: "colombo", name: "Colombo", country: "Sri Lanka", lat: 6.93, lon: 79.84, difficulty: "easy" },
  { id: "katmandu", name: "Katmandú", country: "Nepal", lat: 27.72, lon: 85.32, difficulty: "easy" },
  { id: "naipyido", name: "Naipyidó", country: "Myanmar", lat: 19.76, lon: 96.07, difficulty: "easy" },
  { id: "ankara", name: "Ankara", country: "Turquía", lat: 39.93, lon: 32.86, difficulty: "easy" },
  { id: "bagdad", name: "Bagdad", country: "Irak", lat: 33.31, lon: 44.37, difficulty: "easy" },
  { id: "kabul", name: "Kabul", country: "Afganistán", lat: 34.53, lon: 69.17, difficulty: "easy" },

  // === MEDIUM (20 well-known cities) ===
  { id: "shanghai", name: "Shanghái", country: "China", lat: 31.23, lon: 121.47, difficulty: "medium" },
  { id: "bombay", name: "Bombay", country: "India", lat: 19.08, lon: 72.88, difficulty: "medium" },
  { id: "estambul", name: "Estambul", country: "Turquía", lat: 41.01, lon: 28.98, difficulty: "medium" },
  { id: "dubai", name: "Dubái", country: "EAU", lat: 25.20, lon: 55.27, difficulty: "medium" },
  { id: "osaka", name: "Osaka", country: "Japón", lat: 34.69, lon: 135.50, difficulty: "medium" },
  { id: "ho-chi-minh", name: "Ho Chi Minh", country: "Vietnam", lat: 10.82, lon: 106.63, difficulty: "medium" },
  { id: "calcuta", name: "Calcuta", country: "India", lat: 22.57, lon: 88.36, difficulty: "medium" },
  { id: "chennai", name: "Chennai", country: "India", lat: 13.08, lon: 80.27, difficulty: "medium" },
  { id: "karachi", name: "Karachi", country: "Pakistán", lat: 24.86, lon: 67.01, difficulty: "medium" },
  { id: "canton", name: "Cantón", country: "China", lat: 23.13, lon: 113.26, difficulty: "medium" },
  { id: "shenzhen", name: "Shenzhen", country: "China", lat: 22.54, lon: 114.06, difficulty: "medium" },
  { id: "bangalore", name: "Bangalore", country: "India", lat: 12.97, lon: 77.59, difficulty: "medium" },
  { id: "hyderabad", name: "Hyderabad", country: "India", lat: 17.39, lon: 78.49, difficulty: "medium" },
  { id: "lahore", name: "Lahore", country: "Pakistán", lat: 31.55, lon: 74.35, difficulty: "medium" },
  { id: "jeddah", name: "Jeddah", country: "Arabia Saudita", lat: 21.49, lon: 39.19, difficulty: "medium" },
  { id: "izmir", name: "Izmir", country: "Turquía", lat: 38.42, lon: 27.13, difficulty: "medium" },
  { id: "hong-kong", name: "Hong Kong", country: "China", lat: 22.32, lon: 114.17, difficulty: "medium" },
  { id: "taipei", name: "Taipéi", country: "Taiwán", lat: 25.03, lon: 121.57, difficulty: "medium" },
  { id: "chengdu", name: "Chengdú", country: "China", lat: 30.57, lon: 104.07, difficulty: "medium" },
  { id: "nom-pen", name: "Nom Pen", country: "Camboya", lat: 11.56, lon: 104.93, difficulty: "medium" },

  // === HARD (20 lesser-known cities) ===
  { id: "biskek", name: "Biskek", country: "Kirguistán", lat: 42.87, lon: 74.59, difficulty: "hard" },
  { id: "asjabad", name: "Asjabad", country: "Turkmenistán", lat: 37.96, lon: 58.38, difficulty: "hard" },
  { id: "dusambe", name: "Dusambé", country: "Tayikistán", lat: 38.56, lon: 68.77, difficulty: "hard" },
  { id: "taskent", name: "Taskent", country: "Uzbekistán", lat: 41.30, lon: 69.28, difficulty: "hard" },
  { id: "astana", name: "Astaná", country: "Kazajistán", lat: 51.17, lon: 71.43, difficulty: "hard" },
  { id: "baku", name: "Bakú", country: "Azerbaiyán", lat: 40.41, lon: 49.87, difficulty: "hard" },
  { id: "erevan", name: "Ereván", country: "Armenia", lat: 40.18, lon: 44.51, difficulty: "hard" },
  { id: "tiflis", name: "Tiflis", country: "Georgia", lat: 41.72, lon: 44.83, difficulty: "hard" },
  { id: "ulan-bator", name: "Ulán Bator", country: "Mongolia", lat: 47.91, lon: 106.91, difficulty: "hard" },
  { id: "manama", name: "Manama", country: "Baréin", lat: 26.23, lon: 50.59, difficulty: "hard" },
  { id: "timbu", name: "Timbu", country: "Bután", lat: 27.47, lon: 89.64, difficulty: "hard" },
  { id: "vientian", name: "Vientián", country: "Laos", lat: 17.97, lon: 102.63, difficulty: "hard" },
  { id: "bandar-seri-begawan", name: "Bandar Seri Begawan", country: "Brunéi", lat: 4.94, lon: 114.95, difficulty: "hard" },
  { id: "dili", name: "Dili", country: "Timor Oriental", lat: -8.56, lon: 125.57, difficulty: "hard" },
  { id: "mascate", name: "Mascate", country: "Omán", lat: 23.59, lon: 58.54, difficulty: "hard" },
  { id: "doha", name: "Doha", country: "Catar", lat: 25.29, lon: 51.53, difficulty: "hard" },
  { id: "kuwait", name: "Kuwait", country: "Kuwait", lat: 29.38, lon: 47.99, difficulty: "hard" },
  { id: "damasco", name: "Damasco", country: "Siria", lat: 33.51, lon: 36.29, difficulty: "hard" },
  { id: "amman", name: "Ammán", country: "Jordania", lat: 31.95, lon: 35.93, difficulty: "hard" },
  { id: "pyongyang", name: "Pyongyang", country: "Corea del Norte", lat: 39.02, lon: 125.75, difficulty: "hard" },
];

// ===================== AMERICAS CITIES =====================
export const americasCities: City[] = [
  // === EASY (20 capitals) ===
  { id: "washington-d-c", name: "Washington D.C.", country: "EE.UU.", lat: 38.91, lon: -77.04, difficulty: "easy" },
  { id: "ottawa", name: "Ottawa", country: "Canadá", lat: 45.42, lon: -75.70, difficulty: "easy" },
  { id: "ciudad-de-mexico", name: "Ciudad de México", country: "México", lat: 19.43, lon: -99.13, difficulty: "easy" },
  { id: "brasilia", name: "Brasilia", country: "Brasil", lat: -15.79, lon: -47.88, difficulty: "easy" },
  { id: "buenos-aires", name: "Buenos Aires", country: "Argentina", lat: -34.60, lon: -58.38, difficulty: "easy" },
  { id: "lima", name: "Lima", country: "Perú", lat: -12.05, lon: -77.04, difficulty: "easy" },
  { id: "bogota", name: "Bogotá", country: "Colombia", lat: 4.71, lon: -74.07, difficulty: "easy" },
  { id: "santiago", name: "Santiago", country: "Chile", lat: -33.45, lon: -70.67, difficulty: "easy" },
  { id: "la-habana", name: "La Habana", country: "Cuba", lat: 23.11, lon: -82.37, difficulty: "easy" },
  { id: "caracas", name: "Caracas", country: "Venezuela", lat: 10.49, lon: -66.88, difficulty: "easy" },
  { id: "quito", name: "Quito", country: "Ecuador", lat: -0.18, lon: -78.47, difficulty: "easy" },
  { id: "montevideo", name: "Montevideo", country: "Uruguay", lat: -34.88, lon: -56.16, difficulty: "easy" },
  { id: "asuncion", name: "Asunción", country: "Paraguay", lat: -25.26, lon: -57.58, difficulty: "easy" },
  { id: "la-paz", name: "La Paz", country: "Bolivia", lat: -16.50, lon: -68.15, difficulty: "easy" },
  { id: "san-jose", name: "San José", country: "Costa Rica", lat: 9.93, lon: -84.08, difficulty: "easy" },
  { id: "panama", name: "Panamá", country: "Panamá", lat: 8.98, lon: -79.52, difficulty: "easy" },
  { id: "guatemala", name: "Guatemala", country: "Guatemala", lat: 14.63, lon: -90.51, difficulty: "easy" },
  { id: "santo-domingo", name: "Santo Domingo", country: "Rep. Dominicana", lat: 18.47, lon: -69.90, difficulty: "easy" },
  { id: "managua", name: "Managua", country: "Nicaragua", lat: 12.11, lon: -86.27, difficulty: "easy" },
  { id: "tegucigalpa", name: "Tegucigalpa", country: "Honduras", lat: 14.07, lon: -87.19, difficulty: "easy" },
  // === MEDIUM (20 cities) ===
  { id: "sao-paulo", name: "São Paulo", country: "Brasil", lat: -23.55, lon: -46.63, difficulty: "medium" },
  { id: "rio-de-janeiro", name: "Río de Janeiro", country: "Brasil", lat: -22.91, lon: -43.17, difficulty: "medium" },
  { id: "nueva-york", name: "Nueva York", country: "EE.UU.", lat: 40.71, lon: -74.01, difficulty: "medium" },
  { id: "los-angeles", name: "Los Ángeles", country: "EE.UU.", lat: 34.05, lon: -118.24, difficulty: "medium" },
  { id: "toronto", name: "Toronto", country: "Canadá", lat: 43.65, lon: -79.38, difficulty: "medium" },
  { id: "medellin", name: "Medellín", country: "Colombia", lat: 6.25, lon: -75.56, difficulty: "medium" },
  { id: "guadalajara", name: "Guadalajara", country: "México", lat: 20.67, lon: -103.35, difficulty: "medium" },
  { id: "cordoba", name: "Córdoba", country: "Argentina", lat: -31.42, lon: -64.18, difficulty: "medium" },
  { id: "monterrey", name: "Monterrey", country: "México", lat: 25.67, lon: -100.31, difficulty: "medium" },
  { id: "cali", name: "Cali", country: "Colombia", lat: 3.45, lon: -76.53, difficulty: "medium" },
  { id: "guayaquil", name: "Guayaquil", country: "Ecuador", lat: -2.17, lon: -79.92, difficulty: "medium" },
  { id: "salvador", name: "Salvador", country: "Brasil", lat: -12.97, lon: -38.51, difficulty: "medium" },
  { id: "recife", name: "Recife", country: "Brasil", lat: -8.05, lon: -34.87, difficulty: "medium" },
  { id: "vancouver", name: "Vancouver", country: "Canadá", lat: 49.28, lon: -123.12, difficulty: "medium" },
  { id: "chicago", name: "Chicago", country: "EE.UU.", lat: 41.88, lon: -87.63, difficulty: "medium" },
  { id: "miami", name: "Miami", country: "EE.UU.", lat: 25.76, lon: -80.19, difficulty: "medium" },
  { id: "valparaiso", name: "Valparaíso", country: "Chile", lat: -33.05, lon: -71.62, difficulty: "medium" },
  { id: "rosario", name: "Rosario", country: "Argentina", lat: -32.95, lon: -60.65, difficulty: "medium" },
  { id: "barranquilla", name: "Barranquilla", country: "Colombia", lat: 10.96, lon: -74.78, difficulty: "medium" },
  { id: "cancun", name: "Cancún", country: "México", lat: 21.16, lon: -86.85, difficulty: "medium" },
  // === HARD (20 cities) ===
  { id: "ushuaia", name: "Ushuaia", country: "Argentina", lat: -54.80, lon: -68.30, difficulty: "hard" },
  { id: "iquitos", name: "Iquitos", country: "Perú", lat: -3.75, lon: -73.25, difficulty: "hard" },
  { id: "manaus", name: "Manaus", country: "Brasil", lat: -3.12, lon: -60.02, difficulty: "hard" },
  { id: "whitehorse", name: "Whitehorse", country: "Canadá", lat: 60.72, lon: -135.06, difficulty: "hard" },
  { id: "anchorage", name: "Anchorage", country: "EE.UU.", lat: 61.22, lon: -149.90, difficulty: "hard" },
  { id: "sucre", name: "Sucre", country: "Bolivia", lat: -19.04, lon: -65.26, difficulty: "hard" },
  { id: "cayena", name: "Cayena", country: "Guayana Francesa", lat: 4.94, lon: -52.33, difficulty: "hard" },
  { id: "paramaribo", name: "Paramaribo", country: "Surinam", lat: 5.85, lon: -55.17, difficulty: "hard" },
  { id: "georgetown", name: "Georgetown", country: "Guyana", lat: 6.80, lon: -58.16, difficulty: "hard" },
  { id: "belmopan", name: "Belmopan", country: "Belice", lat: 17.25, lon: -88.77, difficulty: "hard" },
  { id: "san-salvador", name: "San Salvador", country: "El Salvador", lat: 13.69, lon: -89.19, difficulty: "hard" },
  { id: "kingston", name: "Kingston", country: "Jamaica", lat: 18.00, lon: -76.79, difficulty: "hard" },
  { id: "port-au-prince", name: "Port-au-Prince", country: "Haití", lat: 18.54, lon: -72.34, difficulty: "hard" },
  { id: "nassau", name: "Nassau", country: "Bahamas", lat: 25.05, lon: -77.35, difficulty: "hard" },
  { id: "punta-arenas", name: "Punta Arenas", country: "Chile", lat: -53.15, lon: -70.92, difficulty: "hard" },
  { id: "curitiba", name: "Curitiba", country: "Brasil", lat: -25.43, lon: -49.27, difficulty: "hard" },
  { id: "puebla", name: "Puebla", country: "México", lat: 19.04, lon: -98.21, difficulty: "hard" },
  { id: "santa-cruz", name: "Santa Cruz", country: "Bolivia", lat: -17.78, lon: -63.18, difficulty: "hard" },
  { id: "arequipa", name: "Arequipa", country: "Perú", lat: -16.41, lon: -71.54, difficulty: "hard" },
  { id: "mendoza", name: "Mendoza", country: "Argentina", lat: -32.89, lon: -68.83, difficulty: "hard" },
];

// ===================== AFRICA CITIES =====================
export const africaCities: City[] = [
  // === EASY (20 capitals) ===
  { id: "el-cairo", name: "El Cairo", country: "Egipto", lat: 30.04, lon: 31.24, difficulty: "easy" },
  { id: "nairobi", name: "Nairobi", country: "Kenia", lat: -1.29, lon: 36.82, difficulty: "easy" },
  { id: "pretoria", name: "Pretoria", country: "Sudáfrica", lat: -25.75, lon: 28.19, difficulty: "easy" },
  { id: "addis-abeba", name: "Addis Abeba", country: "Etiopía", lat: 9.02, lon: 38.75, difficulty: "easy" },
  { id: "accra", name: "Accra", country: "Ghana", lat: 5.56, lon: -0.19, difficulty: "easy" },
  { id: "dakar", name: "Dakar", country: "Senegal", lat: 14.69, lon: -17.44, difficulty: "easy" },
  { id: "argel", name: "Argel", country: "Argelia", lat: 36.75, lon: 3.04, difficulty: "easy" },
  { id: "rabat", name: "Rabat", country: "Marruecos", lat: 34.02, lon: -6.84, difficulty: "easy" },
  { id: "tunez", name: "Túnez", country: "Túnez", lat: 36.81, lon: 10.18, difficulty: "easy" },
  { id: "lagos", name: "Lagos", country: "Nigeria", lat: 6.52, lon: 3.38, difficulty: "easy" },
  { id: "kinsasa", name: "Kinsasa", country: "Rep. Dem. del Congo", lat: -4.32, lon: 15.31, difficulty: "easy" },
  { id: "luanda", name: "Luanda", country: "Angola", lat: -8.84, lon: 13.23, difficulty: "easy" },
  { id: "dar-es-salaam", name: "Dar es Salaam", country: "Tanzania", lat: -6.79, lon: 39.28, difficulty: "easy" },
  { id: "kampala", name: "Kampala", country: "Uganda", lat: 0.35, lon: 32.58, difficulty: "easy" },
  { id: "maputo", name: "Maputo", country: "Mozambique", lat: -25.97, lon: 32.58, difficulty: "easy" },
  { id: "lusaka", name: "Lusaka", country: "Zambia", lat: -15.39, lon: 28.32, difficulty: "easy" },
  { id: "harare", name: "Harare", country: "Zimbabue", lat: -17.83, lon: 31.05, difficulty: "easy" },
  { id: "abiyan", name: "Abiyán", country: "Costa de Marfil", lat: 5.36, lon: -4.01, difficulty: "easy" },
  { id: "antananarivo", name: "Antananarivo", country: "Madagascar", lat: -18.88, lon: 47.51, difficulty: "easy" },
  { id: "tripoli", name: "Trípoli", country: "Libia", lat: 32.90, lon: 13.18, difficulty: "easy" },

  // === MEDIUM (20 cities) ===
  { id: "casablanca", name: "Casablanca", country: "Marruecos", lat: 33.57, lon: -7.59, difficulty: "medium" },
  { id: "johannesburgo", name: "Johannesburgo", country: "Sudáfrica", lat: -26.20, lon: 28.05, difficulty: "medium" },
  { id: "ciudad-del-cabo", name: "Ciudad del Cabo", country: "Sudáfrica", lat: -33.93, lon: 18.42, difficulty: "medium" },
  { id: "alejandria", name: "Alejandría", country: "Egipto", lat: 31.20, lon: 29.92, difficulty: "medium" },
  { id: "durban", name: "Durban", country: "Sudáfrica", lat: -29.86, lon: 31.02, difficulty: "medium" },
  { id: "marrakech", name: "Marrakech", country: "Marruecos", lat: 31.63, lon: -8.00, difficulty: "medium" },
  { id: "abuya", name: "Abuya", country: "Nigeria", lat: 9.06, lon: 7.49, difficulty: "medium" },
  { id: "mombasa", name: "Mombasa", country: "Kenia", lat: -4.05, lon: 39.67, difficulty: "medium" },
  { id: "fez", name: "Fez", country: "Marruecos", lat: 34.03, lon: -5.00, difficulty: "medium" },
  { id: "douala", name: "Douala", country: "Camerún", lat: 4.05, lon: 9.77, difficulty: "medium" },
  { id: "kumasi", name: "Kumasi", country: "Ghana", lat: 6.69, lon: -1.62, difficulty: "medium" },
  { id: "brazzaville", name: "Brazzaville", country: "Rep. del Congo", lat: -4.27, lon: 15.28, difficulty: "medium" },
  { id: "yaunde", name: "Yaundé", country: "Camerún", lat: 3.87, lon: 11.52, difficulty: "medium" },
  { id: "conakry", name: "Conakry", country: "Guinea", lat: 9.64, lon: -13.58, difficulty: "medium" },
  { id: "lubumbashi", name: "Lubumbashi", country: "Rep. Dem. del Congo", lat: -11.66, lon: 27.48, difficulty: "medium" },
  { id: "mogadiscio", name: "Mogadiscio", country: "Somalia", lat: 2.05, lon: 45.32, difficulty: "medium" },
  { id: "jartum", name: "Jartum", country: "Sudán", lat: 15.59, lon: 32.53, difficulty: "medium" },
  { id: "bamako", name: "Bamako", country: "Mali", lat: 12.64, lon: -8.00, difficulty: "medium" },
  { id: "niamey", name: "Niamey", country: "Níger", lat: 13.51, lon: 2.11, difficulty: "medium" },
  { id: "windhoek", name: "Windhoek", country: "Namibia", lat: -22.56, lon: 17.08, difficulty: "medium" },

  // === HARD (20 lesser-known cities) ===
  { id: "nuakchot", name: "Nuakchot", country: "Mauritania", lat: 18.09, lon: -15.98, difficulty: "hard" },
  { id: "uagadugu", name: "Uagadugú", country: "Burkina Faso", lat: 12.37, lon: -1.52, difficulty: "hard" },
  { id: "yamena", name: "Yamena", country: "Chad", lat: 12.13, lon: 15.05, difficulty: "hard" },
  { id: "bangui", name: "Bangui", country: "Rep. Centroafricana", lat: 4.36, lon: 18.56, difficulty: "hard" },
  { id: "libreville", name: "Libreville", country: "Gabón", lat: 0.39, lon: 9.45, difficulty: "hard" },
  { id: "malabo", name: "Malabo", country: "Guinea Ecuatorial", lat: 3.75, lon: 8.78, difficulty: "hard" },
  { id: "bujumbura", name: "Bujumbura", country: "Burundi", lat: -3.38, lon: 29.36, difficulty: "hard" },
  { id: "kigali", name: "Kigali", country: "Ruanda", lat: -1.94, lon: 29.87, difficulty: "hard" },
  { id: "asmara", name: "Asmara", country: "Eritrea", lat: 15.34, lon: 38.93, difficulty: "hard" },
  { id: "yibuti", name: "Yibuti", country: "Yibuti", lat: 11.59, lon: 43.15, difficulty: "hard" },
  { id: "moroni", name: "Moroni", country: "Comoras", lat: -11.70, lon: 43.26, difficulty: "hard" },
  { id: "victoria", name: "Victoria", country: "Seychelles", lat: -4.62, lon: 55.45, difficulty: "hard" },
  { id: "port-louis", name: "Port Louis", country: "Mauricio", lat: -20.16, lon: 57.50, difficulty: "hard" },
  { id: "lome", name: "Lomé", country: "Togo", lat: 6.17, lon: 1.23, difficulty: "hard" },
  { id: "cotonu", name: "Cotonú", country: "Benín", lat: 6.37, lon: 2.39, difficulty: "hard" },
  { id: "monrovia", name: "Monrovia", country: "Liberia", lat: 6.30, lon: -10.80, difficulty: "hard" },
  { id: "freetown", name: "Freetown", country: "Sierra Leona", lat: 8.48, lon: -13.23, difficulty: "hard" },
  { id: "bisau", name: "Bisáu", country: "Guinea-Bisáu", lat: 11.86, lon: -15.60, difficulty: "hard" },
  { id: "gaborone", name: "Gaborone", country: "Botsuana", lat: -24.65, lon: 25.91, difficulty: "hard" },
  { id: "maseru", name: "Maseru", country: "Lesoto", lat: -29.31, lon: 27.48, difficulty: "hard" },
];

// Keep backward compat
export const cities = worldCities;

/** Identificador del lugar para el servidor: el `id` del catálogo o, si falta (ciudades de retos viejos), el slug del nombre */
export function placeIdOf(city: Pick<City, 'name'> & { id?: string }): string {
  return city.id ?? city.name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function getCitiesByMode(mode: GameMode): City[] {
  switch (mode) {
    case 'europe': return europeCities;
    case 'asia': return asiaCities;
    case 'americas': return americasCities;
    case 'africa': return africaCities;
    default: return worldCities;
  }
}

export function getCitiesByDifficulty(difficulty: Difficulty, mode: GameMode = 'world'): City[] {
  return getCitiesByMode(mode).filter(c => c.difficulty === difficulty);
}

export function getRandomCities(difficulty: Difficulty, count: number = 13, mode: GameMode = 'world', seed?: number): City[] {
  // Basic difficulty only exists for world mode — fall back to easy for regional
  const effectiveDifficulty = (difficulty === 'basic' && mode !== 'world') ? 'easy' : difficulty;
  const pool = getCitiesByDifficulty(effectiveDifficulty, mode);
  const shuffled = [...pool];
  // Seeded PRNG for deterministic multiplayer city selection
  let rng: () => number;
  if (seed !== undefined) {
    let s = seed;
    rng = () => { s = (s * 16807 + 0) % 2147483647; return s / 2147483647; };
  } else {
    rng = Math.random;
  }
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

/**
 * Progressive Difficulty Ramp — cities start easy and get harder.
 * Basic difficulty: all cities are basic (no progression).
 * Classic 13 rounds: 5 easy → 4 medium → 4 hard
 * Time Attack 40 pool: 15 easy → 13 medium → 12 hard
 * Generic: ~38% easy, ~31% medium, ~31% hard
 */
export function getProgressiveCities(
  count: number,
  mode: GameMode = 'world',
  seed?: number,
  difficulty?: Difficulty,
): City[] {
  // Seeded PRNG
  let rng: () => number;
  if (seed !== undefined) {
    let s = seed;
    rng = () => { s = (s * 16807 + 0) % 2147483647; return s / 2147483647; };
  } else {
    rng = Math.random;
  }

  const shuffle = (arr: City[]) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  // Basic difficulty: all cities from basic pool (world only, fall back to easy)
  if (difficulty === 'basic') {
    const effectiveMode = mode;
    const basicPool = getCitiesByDifficulty('basic', effectiveMode);
    if (basicPool.length > 0) {
      return shuffle(basicPool).slice(0, count);
    }
    // Fall back to easy for regional modes
    return shuffle(getCitiesByDifficulty('easy', effectiveMode)).slice(0, count);
  }

  const easyCount = Math.ceil(count * 0.38);
  const medCount  = Math.ceil((count - easyCount) / 2);
  const hardCount = count - easyCount - medCount;

  const easy = shuffle(getCitiesByDifficulty('easy', mode)).slice(0, easyCount);
  const med  = shuffle(getCitiesByDifficulty('medium', mode)).slice(0, medCount);
  const hard = shuffle(getCitiesByDifficulty('hard', mode)).slice(0, hardCount);

  // Concatenate in order: easy first, then medium, then hard
  return [...easy, ...med, ...hard];
}

// Map viewport bounds per mode
export interface MapBounds {
  latMin: number;
  latMax: number;
  lonMin: number;
  lonMax: number;
}

export function getMapBounds(mode: GameMode): MapBounds {
  switch (mode) {
    case 'europe':
      return { latMin: 34, latMax: 72, lonMin: -25, lonMax: 50 };
    case 'asia':
      return { latMin: -12, latMax: 55, lonMin: 25, lonMax: 150 };
    case 'americas':
      return { latMin: -60, latMax: 72, lonMin: -170, lonMax: -30 };
    case 'africa':
      return { latMin: -38, latMax: 40, lonMin: -25, lonMax: 60 };
    default:
      // Hasta ~62° S: la ciudad más austral es Ushuaia (54,8° S); la Antártida no se juega y su espacio
      // queda para el encabezado sólido de la partida (el mapa conserva su tamaño y baja).
      return { latMin: -62, latMax: 85, lonMin: -180, lonMax: 180 };
  }
}

export const MODE_CONFIG: { key: GameMode; label: string; emoji: string }[] = [
  { key: 'world', label: 'World', emoji: '🌍' },
  { key: 'europe', label: 'Europa', emoji: '🌍' },
  { key: 'asia', label: 'Asia', emoji: '🌏' },
  { key: 'americas', label: 'América', emoji: '🌎' },
  { key: 'africa', label: 'África', emoji: '🌍' },
];
