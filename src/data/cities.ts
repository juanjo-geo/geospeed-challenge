export type Difficulty = 'easy' | 'medium' | 'hard';
export type GameMode = 'world' | 'europe' | 'asia' | 'americas' | 'africa';

export interface City {
  name: string;
  country: string;
  lat: number;
  lon: number;
  difficulty: Difficulty;
}

// ===================== WORLD CITIES =====================
export const worldCities: City[] = [
  // === EASY (60 capitals) ===
  { name: "Tokio", country: "Japón", lat: 35.68, lon: 139.69, difficulty: "easy" },
  { name: "Pekín", country: "China", lat: 39.90, lon: 116.40, difficulty: "easy" },
  { name: "Moscú", country: "Rusia", lat: 55.76, lon: 37.62, difficulty: "easy" },
  { name: "Londres", country: "Reino Unido", lat: 51.51, lon: -0.13, difficulty: "easy" },
  { name: "París", country: "Francia", lat: 48.86, lon: 2.35, difficulty: "easy" },
  { name: "Berlín", country: "Alemania", lat: 52.52, lon: 13.41, difficulty: "easy" },
  { name: "Roma", country: "Italia", lat: 41.90, lon: 12.50, difficulty: "easy" },
  { name: "Madrid", country: "España", lat: 40.42, lon: -3.70, difficulty: "easy" },
  { name: "Washington D.C.", country: "EE.UU.", lat: 38.91, lon: -77.04, difficulty: "easy" },
  { name: "Ottawa", country: "Canadá", lat: 45.42, lon: -75.70, difficulty: "easy" },
  { name: "Canberra", country: "Australia", lat: -35.28, lon: 149.13, difficulty: "easy" },
  { name: "Brasilia", country: "Brasil", lat: -15.79, lon: -47.88, difficulty: "easy" },
  { name: "Buenos Aires", country: "Argentina", lat: -34.60, lon: -58.38, difficulty: "easy" },
  { name: "Ciudad de México", country: "México", lat: 19.43, lon: -99.13, difficulty: "easy" },
  { name: "El Cairo", country: "Egipto", lat: 30.04, lon: 31.24, difficulty: "easy" },
  { name: "Nairobi", country: "Kenia", lat: -1.29, lon: 36.82, difficulty: "easy" },
  { name: "Nueva Delhi", country: "India", lat: 28.61, lon: 77.21, difficulty: "easy" },
  { name: "Bangkok", country: "Tailandia", lat: 13.76, lon: 100.50, difficulty: "easy" },
  { name: "Yakarta", country: "Indonesia", lat: -6.21, lon: 106.85, difficulty: "easy" },
  { name: "Seúl", country: "Corea del Sur", lat: 37.57, lon: 126.98, difficulty: "easy" },
  { name: "Lima", country: "Perú", lat: -12.05, lon: -77.04, difficulty: "easy" },
  { name: "Bogotá", country: "Colombia", lat: 4.71, lon: -74.07, difficulty: "easy" },
  { name: "Santiago", country: "Chile", lat: -33.45, lon: -70.67, difficulty: "easy" },
  { name: "Ankara", country: "Turquía", lat: 39.93, lon: 32.86, difficulty: "easy" },
  { name: "Riad", country: "Arabia Saudita", lat: 24.71, lon: 46.68, difficulty: "easy" },
  { name: "Teherán", country: "Irán", lat: 35.69, lon: 51.39, difficulty: "easy" },
  { name: "Islamabad", country: "Pakistán", lat: 33.69, lon: 73.04, difficulty: "easy" },
  { name: "Hanói", country: "Vietnam", lat: 21.03, lon: 105.85, difficulty: "easy" },
  { name: "Manila", country: "Filipinas", lat: 14.60, lon: 120.98, difficulty: "easy" },
  { name: "Kuala Lumpur", country: "Malasia", lat: 3.14, lon: 101.69, difficulty: "easy" },
  { name: "Atenas", country: "Grecia", lat: 37.98, lon: 23.73, difficulty: "easy" },
  { name: "Lisboa", country: "Portugal", lat: 38.72, lon: -9.14, difficulty: "easy" },
  { name: "Varsovia", country: "Polonia", lat: 52.23, lon: 21.01, difficulty: "easy" },
  { name: "Budapest", country: "Hungría", lat: 47.50, lon: 19.04, difficulty: "easy" },
  { name: "Bucarest", country: "Rumanía", lat: 44.43, lon: 26.10, difficulty: "easy" },
  { name: "Kiev", country: "Ucrania", lat: 50.45, lon: 30.52, difficulty: "easy" },
  { name: "Helsinki", country: "Finlandia", lat: 60.17, lon: 24.94, difficulty: "easy" },
  { name: "Oslo", country: "Noruega", lat: 59.91, lon: 10.75, difficulty: "easy" },
  { name: "Copenhague", country: "Dinamarca", lat: 55.68, lon: 12.57, difficulty: "easy" },
  { name: "Dublín", country: "Irlanda", lat: 53.35, lon: -6.26, difficulty: "easy" },
  { name: "Bruselas", country: "Bélgica", lat: 50.85, lon: 4.35, difficulty: "easy" },
  { name: "Berna", country: "Suiza", lat: 46.95, lon: 7.45, difficulty: "easy" },
  { name: "La Habana", country: "Cuba", lat: 23.11, lon: -82.37, difficulty: "easy" },
  { name: "Caracas", country: "Venezuela", lat: 10.49, lon: -66.88, difficulty: "easy" },
  { name: "Quito", country: "Ecuador", lat: -0.18, lon: -78.47, difficulty: "easy" },
  { name: "Montevideo", country: "Uruguay", lat: -34.88, lon: -56.16, difficulty: "easy" },
  { name: "Asunción", country: "Paraguay", lat: -25.26, lon: -57.58, difficulty: "easy" },
  { name: "La Paz", country: "Bolivia", lat: -16.50, lon: -68.15, difficulty: "easy" },
  { name: "Pretoria", country: "Sudáfrica", lat: -25.75, lon: 28.19, difficulty: "easy" },
  { name: "Addis Abeba", country: "Etiopía", lat: 9.02, lon: 38.75, difficulty: "easy" },
  { name: "Accra", country: "Ghana", lat: 5.56, lon: -0.19, difficulty: "easy" },
  { name: "Dakar", country: "Senegal", lat: 14.69, lon: -17.44, difficulty: "easy" },
  { name: "Argel", country: "Argelia", lat: 36.75, lon: 3.04, difficulty: "easy" },
  { name: "Rabat", country: "Marruecos", lat: 34.02, lon: -6.84, difficulty: "easy" },
  { name: "Túnez", country: "Túnez", lat: 36.81, lon: 10.18, difficulty: "easy" },
  { name: "Singapur", country: "Singapur", lat: 1.35, lon: 103.82, difficulty: "easy" },
  { name: "Colombo", country: "Sri Lanka", lat: 6.93, lon: 79.84, difficulty: "easy" },
  { name: "Katmandú", country: "Nepal", lat: 27.72, lon: 85.32, difficulty: "easy" },
  { name: "Daca", country: "Bangladés", lat: 23.81, lon: 90.41, difficulty: "easy" },
  { name: "Naipyidó", country: "Myanmar", lat: 19.76, lon: 96.07, difficulty: "easy" },

  // === MEDIUM (60 regional cities) ===
  { name: "Bombay", country: "India", lat: 19.08, lon: 72.88, difficulty: "medium" },
  { name: "Shanghái", country: "China", lat: 31.23, lon: 121.47, difficulty: "medium" },
  { name: "Estambul", country: "Turquía", lat: 41.01, lon: 28.98, difficulty: "medium" },
  { name: "Barcelona", country: "España", lat: 41.39, lon: 2.17, difficulty: "medium" },
  { name: "Múnich", country: "Alemania", lat: 48.14, lon: 11.58, difficulty: "medium" },
  { name: "Milán", country: "Italia", lat: 45.46, lon: 9.19, difficulty: "medium" },
  { name: "Sídney", country: "Australia", lat: -33.87, lon: 151.21, difficulty: "medium" },
  { name: "Melbourne", country: "Australia", lat: -37.81, lon: 144.96, difficulty: "medium" },
  { name: "Toronto", country: "Canadá", lat: 43.65, lon: -79.38, difficulty: "medium" },
  { name: "Chicago", country: "EE.UU.", lat: 41.88, lon: -87.63, difficulty: "medium" },
  { name: "Los Ángeles", country: "EE.UU.", lat: 34.05, lon: -118.24, difficulty: "medium" },
  { name: "Río de Janeiro", country: "Brasil", lat: -22.91, lon: -43.17, difficulty: "medium" },
  { name: "São Paulo", country: "Brasil", lat: -23.55, lon: -46.63, difficulty: "medium" },
  { name: "Johannesburgo", country: "Sudáfrica", lat: -26.20, lon: 28.05, difficulty: "medium" },
  { name: "Lagos", country: "Nigeria", lat: 6.52, lon: 3.38, difficulty: "medium" },
  { name: "Karachi", country: "Pakistán", lat: 24.86, lon: 67.01, difficulty: "medium" },
  { name: "Ho Chi Minh", country: "Vietnam", lat: 10.82, lon: 106.63, difficulty: "medium" },
  { name: "Osaka", country: "Japón", lat: 34.69, lon: 135.50, difficulty: "medium" },
  { name: "Dubái", country: "EAU", lat: 25.20, lon: 55.27, difficulty: "medium" },
  { name: "San Petersburgo", country: "Rusia", lat: 59.93, lon: 30.32, difficulty: "medium" },
  { name: "Casablanca", country: "Marruecos", lat: 33.57, lon: -7.59, difficulty: "medium" },
  { name: "Ciudad del Cabo", country: "Sudáfrica", lat: -33.93, lon: 18.42, difficulty: "medium" },
  { name: "Montreal", country: "Canadá", lat: 45.50, lon: -73.57, difficulty: "medium" },
  { name: "Vancouver", country: "Canadá", lat: 49.28, lon: -123.12, difficulty: "medium" },
  { name: "Calcuta", country: "India", lat: 22.57, lon: 88.36, difficulty: "medium" },
  { name: "Chennai", country: "India", lat: 13.08, lon: 80.27, difficulty: "medium" },
  { name: "Ámsterdam", country: "Países Bajos", lat: 52.37, lon: 4.90, difficulty: "medium" },
  { name: "Viena", country: "Austria", lat: 48.21, lon: 16.37, difficulty: "medium" },
  { name: "Estocolmo", country: "Suecia", lat: 59.33, lon: 18.07, difficulty: "medium" },
  { name: "Praga", country: "Chequia", lat: 50.08, lon: 14.44, difficulty: "medium" },
  { name: "Marsella", country: "Francia", lat: 43.30, lon: 5.37, difficulty: "medium" },
  { name: "Lyon", country: "Francia", lat: 45.76, lon: 4.83, difficulty: "medium" },
  { name: "Hamburgo", country: "Alemania", lat: 53.55, lon: 9.99, difficulty: "medium" },
  { name: "Nápoles", country: "Italia", lat: 40.85, lon: 14.27, difficulty: "medium" },
  { name: "Sevilla", country: "España", lat: 37.39, lon: -5.98, difficulty: "medium" },
  { name: "Oporto", country: "Portugal", lat: 41.16, lon: -8.63, difficulty: "medium" },
  { name: "Cracovia", country: "Polonia", lat: 50.06, lon: 19.94, difficulty: "medium" },
  { name: "Gdansk", country: "Polonia", lat: 54.35, lon: 18.65, difficulty: "medium" },
  { name: "San Francisco", country: "EE.UU.", lat: 37.77, lon: -122.42, difficulty: "medium" },
  { name: "Miami", country: "EE.UU.", lat: 25.76, lon: -80.19, difficulty: "medium" },
  { name: "Nueva York", country: "EE.UU.", lat: 40.71, lon: -74.01, difficulty: "medium" },
  { name: "Guadalajara", country: "México", lat: 20.67, lon: -103.35, difficulty: "medium" },
  { name: "Medellín", country: "Colombia", lat: 6.25, lon: -75.56, difficulty: "medium" },
  { name: "Córdoba", country: "Argentina", lat: -31.42, lon: -64.18, difficulty: "medium" },
  { name: "Recife", country: "Brasil", lat: -8.05, lon: -34.87, difficulty: "medium" },
  { name: "Salvador", country: "Brasil", lat: -12.97, lon: -38.51, difficulty: "medium" },
  { name: "Guayaquil", country: "Ecuador", lat: -2.17, lon: -79.92, difficulty: "medium" },
  { name: "Alejandría", country: "Egipto", lat: 31.20, lon: 29.92, difficulty: "medium" },
  { name: "Dar es Salaam", country: "Tanzania", lat: -6.79, lon: 39.28, difficulty: "medium" },
  { name: "Luanda", country: "Angola", lat: -8.84, lon: 13.23, difficulty: "medium" },
  { name: "Cantón", country: "China", lat: 23.13, lon: 113.26, difficulty: "medium" },
  { name: "Shenzhen", country: "China", lat: 22.54, lon: 114.06, difficulty: "medium" },
  { name: "Bangalore", country: "India", lat: 12.97, lon: 77.59, difficulty: "medium" },
  { name: "Hyderabad", country: "India", lat: 17.39, lon: 78.49, difficulty: "medium" },
  { name: "Lahore", country: "Pakistán", lat: 31.55, lon: 74.35, difficulty: "medium" },
  { name: "Perth", country: "Australia", lat: -31.95, lon: 115.86, difficulty: "medium" },
  { name: "Auckland", country: "Nueva Zelanda", lat: -36.85, lon: 174.76, difficulty: "medium" },
  { name: "Jeddah", country: "Arabia Saudita", lat: 21.49, lon: 39.19, difficulty: "medium" },
  { name: "Izmir", country: "Turquía", lat: 38.42, lon: 27.13, difficulty: "medium" },
  { name: "Gotemburgo", country: "Suecia", lat: 57.71, lon: 11.97, difficulty: "medium" },

  // === HARD (60 lesser-known cities) ===
  { name: "Ulán Bator", country: "Mongolia", lat: 47.91, lon: 106.91, difficulty: "hard" },
  { name: "Antananarivo", country: "Madagascar", lat: -18.88, lon: 47.51, difficulty: "hard" },
  { name: "Biskek", country: "Kirguistán", lat: 42.87, lon: 74.59, difficulty: "hard" },
  { name: "Tiflis", country: "Georgia", lat: 41.72, lon: 44.83, difficulty: "hard" },
  { name: "Ereván", country: "Armenia", lat: 40.18, lon: 44.51, difficulty: "hard" },
  { name: "Asjabad", country: "Turkmenistán", lat: 37.96, lon: 58.38, difficulty: "hard" },
  { name: "Dusambé", country: "Tayikistán", lat: 38.56, lon: 68.77, difficulty: "hard" },
  { name: "Taskent", country: "Uzbekistán", lat: 41.30, lon: 69.28, difficulty: "hard" },
  { name: "Astaná", country: "Kazajistán", lat: 51.17, lon: 71.43, difficulty: "hard" },
  { name: "Bakú", country: "Azerbaiyán", lat: 40.41, lon: 49.87, difficulty: "hard" },
  { name: "Riga", country: "Letonia", lat: 56.95, lon: 24.11, difficulty: "hard" },
  { name: "Tallin", country: "Estonia", lat: 59.44, lon: 24.75, difficulty: "hard" },
  { name: "Vilna", country: "Lituania", lat: 54.69, lon: 25.28, difficulty: "hard" },
  { name: "Liubliana", country: "Eslovenia", lat: 46.06, lon: 14.51, difficulty: "hard" },
  { name: "Bratislava", country: "Eslovaquia", lat: 48.15, lon: 17.11, difficulty: "hard" },
  { name: "Chisináu", country: "Moldavia", lat: 47.01, lon: 28.86, difficulty: "hard" },
  { name: "Podgorica", country: "Montenegro", lat: 42.44, lon: 19.26, difficulty: "hard" },
  { name: "Skopie", country: "Macedonia del Norte", lat: 42.00, lon: 21.43, difficulty: "hard" },
  { name: "Tirana", country: "Albania", lat: 41.33, lon: 19.82, difficulty: "hard" },
  { name: "Manama", country: "Baréin", lat: 26.23, lon: 50.59, difficulty: "hard" },
  { name: "Timbu", country: "Bután", lat: 27.47, lon: 89.64, difficulty: "hard" },
  { name: "Vientián", country: "Laos", lat: 17.97, lon: 102.63, difficulty: "hard" },
  { name: "Nom Pen", country: "Camboya", lat: 11.56, lon: 104.93, difficulty: "hard" },
  { name: "Bandar Seri Begawan", country: "Brunéi", lat: 4.94, lon: 114.95, difficulty: "hard" },
  { name: "Dili", country: "Timor Oriental", lat: -8.56, lon: 125.57, difficulty: "hard" },
  { name: "Suva", country: "Fiyi", lat: -18.14, lon: 178.44, difficulty: "hard" },
  { name: "Port Moresby", country: "Papúa Nueva Guinea", lat: -9.48, lon: 147.15, difficulty: "hard" },
  { name: "Windhoek", country: "Namibia", lat: -22.56, lon: 17.08, difficulty: "hard" },
  { name: "Lusaka", country: "Zambia", lat: -15.39, lon: 28.32, difficulty: "hard" },
  { name: "Maputo", country: "Mozambique", lat: -25.97, lon: 32.58, difficulty: "hard" },
  { name: "Nuakchot", country: "Mauritania", lat: 18.09, lon: -15.98, difficulty: "hard" },
  { name: "Niamey", country: "Níger", lat: 13.51, lon: 2.11, difficulty: "hard" },
  { name: "Uagadugú", country: "Burkina Faso", lat: 12.37, lon: -1.52, difficulty: "hard" },
  { name: "Bamako", country: "Mali", lat: 12.64, lon: -8.00, difficulty: "hard" },
  { name: "Yamena", country: "Chad", lat: 12.13, lon: 15.05, difficulty: "hard" },
  { name: "Bangui", country: "Rep. Centroafricana", lat: 4.36, lon: 18.56, difficulty: "hard" },
  { name: "Libreville", country: "Gabón", lat: 0.39, lon: 9.45, difficulty: "hard" },
  { name: "Malabo", country: "Guinea Ecuatorial", lat: 3.75, lon: 8.78, difficulty: "hard" },
  { name: "Yaundé", country: "Camerún", lat: 3.87, lon: 11.52, difficulty: "hard" },
  { name: "Brazzaville", country: "Rep. del Congo", lat: -4.27, lon: 15.28, difficulty: "hard" },
  { name: "Kinsasa", country: "Rep. Dem. del Congo", lat: -4.32, lon: 15.31, difficulty: "hard" },
  { name: "Bujumbura", country: "Burundi", lat: -3.38, lon: 29.36, difficulty: "hard" },
  { name: "Kigali", country: "Ruanda", lat: -1.94, lon: 29.87, difficulty: "hard" },
  { name: "Kampala", country: "Uganda", lat: 0.35, lon: 32.58, difficulty: "hard" },
  { name: "Mogadiscio", country: "Somalia", lat: 2.05, lon: 45.32, difficulty: "hard" },
  { name: "Asmara", country: "Eritrea", lat: 15.34, lon: 38.93, difficulty: "hard" },
  { name: "Yibuti", country: "Yibuti", lat: 11.59, lon: 43.15, difficulty: "hard" },
  { name: "Moroni", country: "Comoras", lat: -11.70, lon: 43.26, difficulty: "hard" },
  { name: "Victoria", country: "Seychelles", lat: -4.62, lon: 55.45, difficulty: "hard" },
  { name: "Port Louis", country: "Mauricio", lat: -20.16, lon: 57.50, difficulty: "hard" },
  { name: "Paramaribo", country: "Surinam", lat: 5.85, lon: -55.17, difficulty: "hard" },
  { name: "Georgetown", country: "Guyana", lat: 6.80, lon: -58.16, difficulty: "hard" },
  { name: "Cayena", country: "Guayana Francesa", lat: 4.94, lon: -52.33, difficulty: "hard" },
  { name: "Managua", country: "Nicaragua", lat: 12.11, lon: -86.27, difficulty: "hard" },
  { name: "Tegucigalpa", country: "Honduras", lat: 14.07, lon: -87.19, difficulty: "hard" },
  { name: "San Salvador", country: "El Salvador", lat: 13.69, lon: -89.19, difficulty: "hard" },
  { name: "Belmopán", country: "Belice", lat: 17.25, lon: -88.77, difficulty: "hard" },
  { name: "Honiara", country: "Islas Salomón", lat: -9.43, lon: 160.03, difficulty: "hard" },
  { name: "Apia", country: "Samoa", lat: -13.83, lon: -171.76, difficulty: "hard" },
  { name: "Nukualofa", country: "Tonga", lat: -21.21, lon: -175.20, difficulty: "hard" },
];

// ===================== EUROPE CITIES =====================
export const europeCities: City[] = [
  // === EASY (20 major capitals) ===
  { name: "Londres", country: "Reino Unido", lat: 51.51, lon: -0.13, difficulty: "easy" },
  { name: "París", country: "Francia", lat: 48.86, lon: 2.35, difficulty: "easy" },
  { name: "Berlín", country: "Alemania", lat: 52.52, lon: 13.41, difficulty: "easy" },
  { name: "Roma", country: "Italia", lat: 41.90, lon: 12.50, difficulty: "easy" },
  { name: "Madrid", country: "España", lat: 40.42, lon: -3.70, difficulty: "easy" },
  { name: "Moscú", country: "Rusia", lat: 55.76, lon: 37.62, difficulty: "easy" },
  { name: "Atenas", country: "Grecia", lat: 37.98, lon: 23.73, difficulty: "easy" },
  { name: "Lisboa", country: "Portugal", lat: 38.72, lon: -9.14, difficulty: "easy" },
  { name: "Varsovia", country: "Polonia", lat: 52.23, lon: 21.01, difficulty: "easy" },
  { name: "Budapest", country: "Hungría", lat: 47.50, lon: 19.04, difficulty: "easy" },
  { name: "Bucarest", country: "Rumanía", lat: 44.43, lon: 26.10, difficulty: "easy" },
  { name: "Kiev", country: "Ucrania", lat: 50.45, lon: 30.52, difficulty: "easy" },
  { name: "Helsinki", country: "Finlandia", lat: 60.17, lon: 24.94, difficulty: "easy" },
  { name: "Oslo", country: "Noruega", lat: 59.91, lon: 10.75, difficulty: "easy" },
  { name: "Copenhague", country: "Dinamarca", lat: 55.68, lon: 12.57, difficulty: "easy" },
  { name: "Dublín", country: "Irlanda", lat: 53.35, lon: -6.26, difficulty: "easy" },
  { name: "Bruselas", country: "Bélgica", lat: 50.85, lon: 4.35, difficulty: "easy" },
  { name: "Berna", country: "Suiza", lat: 46.95, lon: 7.45, difficulty: "easy" },
  { name: "Viena", country: "Austria", lat: 48.21, lon: 16.37, difficulty: "easy" },
  { name: "Estocolmo", country: "Suecia", lat: 59.33, lon: 18.07, difficulty: "easy" },

  // === MEDIUM (20 well-known cities) ===
  { name: "Barcelona", country: "España", lat: 41.39, lon: 2.17, difficulty: "medium" },
  { name: "Múnich", country: "Alemania", lat: 48.14, lon: 11.58, difficulty: "medium" },
  { name: "Milán", country: "Italia", lat: 45.46, lon: 9.19, difficulty: "medium" },
  { name: "Ámsterdam", country: "Países Bajos", lat: 52.37, lon: 4.90, difficulty: "medium" },
  { name: "Praga", country: "Chequia", lat: 50.08, lon: 14.44, difficulty: "medium" },
  { name: "Marsella", country: "Francia", lat: 43.30, lon: 5.37, difficulty: "medium" },
  { name: "Lyon", country: "Francia", lat: 45.76, lon: 4.83, difficulty: "medium" },
  { name: "Hamburgo", country: "Alemania", lat: 53.55, lon: 9.99, difficulty: "medium" },
  { name: "Nápoles", country: "Italia", lat: 40.85, lon: 14.27, difficulty: "medium" },
  { name: "Sevilla", country: "España", lat: 37.39, lon: -5.98, difficulty: "medium" },
  { name: "Oporto", country: "Portugal", lat: 41.16, lon: -8.63, difficulty: "medium" },
  { name: "Cracovia", country: "Polonia", lat: 50.06, lon: 19.94, difficulty: "medium" },
  { name: "Gdansk", country: "Polonia", lat: 54.35, lon: 18.65, difficulty: "medium" },
  { name: "Gotemburgo", country: "Suecia", lat: 57.71, lon: 11.97, difficulty: "medium" },
  { name: "San Petersburgo", country: "Rusia", lat: 59.93, lon: 30.32, difficulty: "medium" },
  { name: "Estambul", country: "Turquía", lat: 41.01, lon: 28.98, difficulty: "medium" },
  { name: "Edimburgo", country: "Reino Unido", lat: 55.95, lon: -3.19, difficulty: "medium" },
  { name: "Mánchester", country: "Reino Unido", lat: 53.48, lon: -2.24, difficulty: "medium" },
  { name: "Fráncfort", country: "Alemania", lat: 50.11, lon: 8.68, difficulty: "medium" },
  { name: "Florencia", country: "Italia", lat: 43.77, lon: 11.25, difficulty: "medium" },

  // === HARD (20 lesser-known cities) ===
  { name: "Riga", country: "Letonia", lat: 56.95, lon: 24.11, difficulty: "hard" },
  { name: "Tallin", country: "Estonia", lat: 59.44, lon: 24.75, difficulty: "hard" },
  { name: "Vilna", country: "Lituania", lat: 54.69, lon: 25.28, difficulty: "hard" },
  { name: "Liubliana", country: "Eslovenia", lat: 46.06, lon: 14.51, difficulty: "hard" },
  { name: "Bratislava", country: "Eslovaquia", lat: 48.15, lon: 17.11, difficulty: "hard" },
  { name: "Chisináu", country: "Moldavia", lat: 47.01, lon: 28.86, difficulty: "hard" },
  { name: "Podgorica", country: "Montenegro", lat: 42.44, lon: 19.26, difficulty: "hard" },
  { name: "Skopie", country: "Macedonia del Norte", lat: 42.00, lon: 21.43, difficulty: "hard" },
  { name: "Tirana", country: "Albania", lat: 41.33, lon: 19.82, difficulty: "hard" },
  { name: "Sarajevo", country: "Bosnia y Herzegovina", lat: 43.86, lon: 18.41, difficulty: "hard" },
  { name: "Zagreb", country: "Croacia", lat: 45.81, lon: 15.98, difficulty: "hard" },
  { name: "Belgrado", country: "Serbia", lat: 44.79, lon: 20.47, difficulty: "hard" },
  { name: "Sofía", country: "Bulgaria", lat: 42.70, lon: 23.32, difficulty: "hard" },
  { name: "Minsk", country: "Bielorrusia", lat: 53.90, lon: 27.57, difficulty: "hard" },
  { name: "Reikiavik", country: "Islandia", lat: 64.15, lon: -21.94, difficulty: "hard" },
  { name: "Nicosia", country: "Chipre", lat: 35.17, lon: 33.36, difficulty: "hard" },
  { name: "La Valeta", country: "Malta", lat: 35.90, lon: 14.51, difficulty: "hard" },
  { name: "Luxemburgo", country: "Luxemburgo", lat: 49.61, lon: 6.13, difficulty: "hard" },
  { name: "Tiflis", country: "Georgia", lat: 41.72, lon: 44.83, difficulty: "hard" },
  { name: "Ankara", country: "Turquía", lat: 39.93, lon: 32.86, difficulty: "hard" },
];

// ===================== ASIA CITIES =====================
export const asiaCities: City[] = [
  // === EASY (20 major capitals) ===
  { name: "Tokio", country: "Japón", lat: 35.68, lon: 139.69, difficulty: "easy" },
  { name: "Pekín", country: "China", lat: 39.90, lon: 116.40, difficulty: "easy" },
  { name: "Nueva Delhi", country: "India", lat: 28.61, lon: 77.21, difficulty: "easy" },
  { name: "Bangkok", country: "Tailandia", lat: 13.76, lon: 100.50, difficulty: "easy" },
  { name: "Seúl", country: "Corea del Sur", lat: 37.57, lon: 126.98, difficulty: "easy" },
  { name: "Yakarta", country: "Indonesia", lat: -6.21, lon: 106.85, difficulty: "easy" },
  { name: "Manila", country: "Filipinas", lat: 14.60, lon: 120.98, difficulty: "easy" },
  { name: "Hanói", country: "Vietnam", lat: 21.03, lon: 105.85, difficulty: "easy" },
  { name: "Kuala Lumpur", country: "Malasia", lat: 3.14, lon: 101.69, difficulty: "easy" },
  { name: "Singapur", country: "Singapur", lat: 1.35, lon: 103.82, difficulty: "easy" },
  { name: "Teherán", country: "Irán", lat: 35.69, lon: 51.39, difficulty: "easy" },
  { name: "Riad", country: "Arabia Saudita", lat: 24.71, lon: 46.68, difficulty: "easy" },
  { name: "Islamabad", country: "Pakistán", lat: 33.69, lon: 73.04, difficulty: "easy" },
  { name: "Daca", country: "Bangladés", lat: 23.81, lon: 90.41, difficulty: "easy" },
  { name: "Colombo", country: "Sri Lanka", lat: 6.93, lon: 79.84, difficulty: "easy" },
  { name: "Katmandú", country: "Nepal", lat: 27.72, lon: 85.32, difficulty: "easy" },
  { name: "Naipyidó", country: "Myanmar", lat: 19.76, lon: 96.07, difficulty: "easy" },
  { name: "Ankara", country: "Turquía", lat: 39.93, lon: 32.86, difficulty: "easy" },
  { name: "Bagdad", country: "Irak", lat: 33.31, lon: 44.37, difficulty: "easy" },
  { name: "Kabul", country: "Afganistán", lat: 34.53, lon: 69.17, difficulty: "easy" },

  // === MEDIUM (20 well-known cities) ===
  { name: "Shanghái", country: "China", lat: 31.23, lon: 121.47, difficulty: "medium" },
  { name: "Bombay", country: "India", lat: 19.08, lon: 72.88, difficulty: "medium" },
  { name: "Estambul", country: "Turquía", lat: 41.01, lon: 28.98, difficulty: "medium" },
  { name: "Dubái", country: "EAU", lat: 25.20, lon: 55.27, difficulty: "medium" },
  { name: "Osaka", country: "Japón", lat: 34.69, lon: 135.50, difficulty: "medium" },
  { name: "Ho Chi Minh", country: "Vietnam", lat: 10.82, lon: 106.63, difficulty: "medium" },
  { name: "Calcuta", country: "India", lat: 22.57, lon: 88.36, difficulty: "medium" },
  { name: "Chennai", country: "India", lat: 13.08, lon: 80.27, difficulty: "medium" },
  { name: "Karachi", country: "Pakistán", lat: 24.86, lon: 67.01, difficulty: "medium" },
  { name: "Cantón", country: "China", lat: 23.13, lon: 113.26, difficulty: "medium" },
  { name: "Shenzhen", country: "China", lat: 22.54, lon: 114.06, difficulty: "medium" },
  { name: "Bangalore", country: "India", lat: 12.97, lon: 77.59, difficulty: "medium" },
  { name: "Hyderabad", country: "India", lat: 17.39, lon: 78.49, difficulty: "medium" },
  { name: "Lahore", country: "Pakistán", lat: 31.55, lon: 74.35, difficulty: "medium" },
  { name: "Jeddah", country: "Arabia Saudita", lat: 21.49, lon: 39.19, difficulty: "medium" },
  { name: "Izmir", country: "Turquía", lat: 38.42, lon: 27.13, difficulty: "medium" },
  { name: "Hong Kong", country: "China", lat: 22.32, lon: 114.17, difficulty: "medium" },
  { name: "Taipéi", country: "Taiwán", lat: 25.03, lon: 121.57, difficulty: "medium" },
  { name: "Chengdú", country: "China", lat: 30.57, lon: 104.07, difficulty: "medium" },
  { name: "Pnon Pen", country: "Camboya", lat: 11.56, lon: 104.93, difficulty: "medium" },

  // === HARD (20 lesser-known cities) ===
  { name: "Biskek", country: "Kirguistán", lat: 42.87, lon: 74.59, difficulty: "hard" },
  { name: "Asjabad", country: "Turkmenistán", lat: 37.96, lon: 58.38, difficulty: "hard" },
  { name: "Dusambé", country: "Tayikistán", lat: 38.56, lon: 68.77, difficulty: "hard" },
  { name: "Taskent", country: "Uzbekistán", lat: 41.30, lon: 69.28, difficulty: "hard" },
  { name: "Astaná", country: "Kazajistán", lat: 51.17, lon: 71.43, difficulty: "hard" },
  { name: "Bakú", country: "Azerbaiyán", lat: 40.41, lon: 49.87, difficulty: "hard" },
  { name: "Ereván", country: "Armenia", lat: 40.18, lon: 44.51, difficulty: "hard" },
  { name: "Tiflis", country: "Georgia", lat: 41.72, lon: 44.83, difficulty: "hard" },
  { name: "Ulán Bator", country: "Mongolia", lat: 47.91, lon: 106.91, difficulty: "hard" },
  { name: "Manama", country: "Baréin", lat: 26.23, lon: 50.59, difficulty: "hard" },
  { name: "Timbu", country: "Bután", lat: 27.47, lon: 89.64, difficulty: "hard" },
  { name: "Vientián", country: "Laos", lat: 17.97, lon: 102.63, difficulty: "hard" },
  { name: "Bandar Seri Begawan", country: "Brunéi", lat: 4.94, lon: 114.95, difficulty: "hard" },
  { name: "Dili", country: "Timor Oriental", lat: -8.56, lon: 125.57, difficulty: "hard" },
  { name: "Mascate", country: "Omán", lat: 23.59, lon: 58.54, difficulty: "hard" },
  { name: "Doha", country: "Catar", lat: 25.29, lon: 51.53, difficulty: "hard" },
  { name: "Kuwait", country: "Kuwait", lat: 29.38, lon: 47.99, difficulty: "hard" },
  { name: "Damasco", country: "Siria", lat: 33.51, lon: 36.29, difficulty: "hard" },
  { name: "Ammán", country: "Jordania", lat: 31.95, lon: 35.93, difficulty: "hard" },
  { name: "Pyongyang", country: "Corea del Norte", lat: 39.02, lon: 125.75, difficulty: "hard" },
];

// ===================== AMERICAS CITIES =====================
export const americasCities: City[] = [
  // === EASY (20 capitals) ===
  { name: "Washington D.C.", country: "EE.UU.", lat: 38.91, lon: -77.04, difficulty: "easy" },
  { name: "Ottawa", country: "Canadá", lat: 45.42, lon: -75.70, difficulty: "easy" },
  { name: "Ciudad de México", country: "México", lat: 19.43, lon: -99.13, difficulty: "easy" },
  { name: "Brasilia", country: "Brasil", lat: -15.79, lon: -47.88, difficulty: "easy" },
  { name: "Buenos Aires", country: "Argentina", lat: -34.60, lon: -58.38, difficulty: "easy" },
  { name: "Lima", country: "Perú", lat: -12.05, lon: -77.04, difficulty: "easy" },
  { name: "Bogotá", country: "Colombia", lat: 4.71, lon: -74.07, difficulty: "easy" },
  { name: "Santiago", country: "Chile", lat: -33.45, lon: -70.67, difficulty: "easy" },
  { name: "La Habana", country: "Cuba", lat: 23.11, lon: -82.37, difficulty: "easy" },
  { name: "Caracas", country: "Venezuela", lat: 10.49, lon: -66.88, difficulty: "easy" },
  { name: "Quito", country: "Ecuador", lat: -0.18, lon: -78.47, difficulty: "easy" },
  { name: "Montevideo", country: "Uruguay", lat: -34.88, lon: -56.16, difficulty: "easy" },
  { name: "Asunción", country: "Paraguay", lat: -25.26, lon: -57.58, difficulty: "easy" },
  { name: "La Paz", country: "Bolivia", lat: -16.49, lon: -68.12, difficulty: "easy" },
  { name: "San José", country: "Costa Rica", lat: 9.93, lon: -84.08, difficulty: "easy" },
  { name: "Panamá", country: "Panamá", lat: 8.98, lon: -79.52, difficulty: "easy" },
  { name: "Guatemala", country: "Guatemala", lat: 14.63, lon: -90.51, difficulty: "easy" },
  { name: "Santo Domingo", country: "Rep. Dominicana", lat: 18.47, lon: -69.90, difficulty: "easy" },
  { name: "Managua", country: "Nicaragua", lat: 12.13, lon: -86.25, difficulty: "easy" },
  { name: "Tegucigalpa", country: "Honduras", lat: 14.07, lon: -87.19, difficulty: "easy" },
  // === MEDIUM (20 cities) ===
  { name: "São Paulo", country: "Brasil", lat: -23.55, lon: -46.63, difficulty: "medium" },
  { name: "Río de Janeiro", country: "Brasil", lat: -22.91, lon: -43.17, difficulty: "medium" },
  { name: "Nueva York", country: "EE.UU.", lat: 40.71, lon: -74.01, difficulty: "medium" },
  { name: "Los Ángeles", country: "EE.UU.", lat: 34.05, lon: -118.24, difficulty: "medium" },
  { name: "Toronto", country: "Canadá", lat: 43.65, lon: -79.38, difficulty: "medium" },
  { name: "Medellín", country: "Colombia", lat: 6.25, lon: -75.56, difficulty: "medium" },
  { name: "Guadalajara", country: "México", lat: 20.67, lon: -103.35, difficulty: "medium" },
  { name: "Córdoba", country: "Argentina", lat: -31.42, lon: -64.18, difficulty: "medium" },
  { name: "Monterrey", country: "México", lat: 25.67, lon: -100.31, difficulty: "medium" },
  { name: "Cali", country: "Colombia", lat: 3.45, lon: -76.53, difficulty: "medium" },
  { name: "Guayaquil", country: "Ecuador", lat: -2.17, lon: -79.92, difficulty: "medium" },
  { name: "Salvador", country: "Brasil", lat: -12.97, lon: -38.51, difficulty: "medium" },
  { name: "Recife", country: "Brasil", lat: -8.05, lon: -34.87, difficulty: "medium" },
  { name: "Vancouver", country: "Canadá", lat: 49.28, lon: -123.12, difficulty: "medium" },
  { name: "Chicago", country: "EE.UU.", lat: 41.88, lon: -87.63, difficulty: "medium" },
  { name: "Miami", country: "EE.UU.", lat: 25.76, lon: -80.19, difficulty: "medium" },
  { name: "Valparaíso", country: "Chile", lat: -33.05, lon: -71.62, difficulty: "medium" },
  { name: "Rosario", country: "Argentina", lat: -32.95, lon: -60.65, difficulty: "medium" },
  { name: "Barranquilla", country: "Colombia", lat: 10.96, lon: -74.78, difficulty: "medium" },
  { name: "Cancún", country: "México", lat: 21.16, lon: -86.85, difficulty: "medium" },
  // === HARD (20 cities) ===
  { name: "Ushuaia", country: "Argentina", lat: -54.80, lon: -68.30, difficulty: "hard" },
  { name: "Iquitos", country: "Perú", lat: -3.75, lon: -73.25, difficulty: "hard" },
  { name: "Manaus", country: "Brasil", lat: -3.12, lon: -60.02, difficulty: "hard" },
  { name: "Whitehorse", country: "Canadá", lat: 60.72, lon: -135.06, difficulty: "hard" },
  { name: "Anchorage", country: "EE.UU.", lat: 61.22, lon: -149.90, difficulty: "hard" },
  { name: "Sucre", country: "Bolivia", lat: -19.04, lon: -65.26, difficulty: "hard" },
  { name: "Cayena", country: "Guayana Francesa", lat: 4.94, lon: -52.33, difficulty: "hard" },
  { name: "Paramaribo", country: "Surinam", lat: 5.85, lon: -55.20, difficulty: "hard" },
  { name: "Georgetown", country: "Guyana", lat: 6.80, lon: -58.16, difficulty: "hard" },
  { name: "Belice", country: "Belice", lat: 17.25, lon: -88.77, difficulty: "hard" },
  { name: "San Salvador", country: "El Salvador", lat: 13.69, lon: -89.19, difficulty: "hard" },
  { name: "Kingston", country: "Jamaica", lat: 18.00, lon: -76.79, difficulty: "hard" },
  { name: "Port-au-Prince", country: "Haití", lat: 18.54, lon: -72.34, difficulty: "hard" },
  { name: "Nassau", country: "Bahamas", lat: 25.05, lon: -77.35, difficulty: "hard" },
  { name: "Punta Arenas", country: "Chile", lat: -53.15, lon: -70.92, difficulty: "hard" },
  { name: "Curitiba", country: "Brasil", lat: -25.43, lon: -49.27, difficulty: "hard" },
  { name: "Puebla", country: "México", lat: 19.04, lon: -98.21, difficulty: "hard" },
  { name: "Santa Cruz", country: "Bolivia", lat: -17.78, lon: -63.18, difficulty: "hard" },
  { name: "Arequipa", country: "Perú", lat: -16.41, lon: -71.54, difficulty: "hard" },
  { name: "Mendoza", country: "Argentina", lat: -32.89, lon: -68.83, difficulty: "hard" },
];

// ===================== AFRICA CITIES =====================
export const africaCities: City[] = [
  // === EASY (20 capitals) ===
  { name: "El Cairo", country: "Egipto", lat: 30.04, lon: 31.24, difficulty: "easy" },
  { name: "Nairobi", country: "Kenia", lat: -1.29, lon: 36.82, difficulty: "easy" },
  { name: "Pretoria", country: "Sudáfrica", lat: -25.75, lon: 28.19, difficulty: "easy" },
  { name: "Addis Abeba", country: "Etiopía", lat: 9.02, lon: 38.75, difficulty: "easy" },
  { name: "Accra", country: "Ghana", lat: 5.56, lon: -0.19, difficulty: "easy" },
  { name: "Dakar", country: "Senegal", lat: 14.69, lon: -17.44, difficulty: "easy" },
  { name: "Argel", country: "Argelia", lat: 36.75, lon: 3.04, difficulty: "easy" },
  { name: "Rabat", country: "Marruecos", lat: 34.02, lon: -6.84, difficulty: "easy" },
  { name: "Túnez", country: "Túnez", lat: 36.81, lon: 10.18, difficulty: "easy" },
  { name: "Lagos", country: "Nigeria", lat: 6.52, lon: 3.38, difficulty: "easy" },
  { name: "Kinshasa", country: "Rep. Dem. del Congo", lat: -4.32, lon: 15.31, difficulty: "easy" },
  { name: "Luanda", country: "Angola", lat: -8.84, lon: 13.23, difficulty: "easy" },
  { name: "Dar es Salaam", country: "Tanzania", lat: -6.79, lon: 39.28, difficulty: "easy" },
  { name: "Kampala", country: "Uganda", lat: 0.35, lon: 32.58, difficulty: "easy" },
  { name: "Maputo", country: "Mozambique", lat: -25.97, lon: 32.58, difficulty: "easy" },
  { name: "Lusaka", country: "Zambia", lat: -15.39, lon: 28.32, difficulty: "easy" },
  { name: "Harare", country: "Zimbabue", lat: -17.83, lon: 31.05, difficulty: "easy" },
  { name: "Abiyán", country: "Costa de Marfil", lat: 5.36, lon: -4.01, difficulty: "easy" },
  { name: "Antananarivo", country: "Madagascar", lat: -18.88, lon: 47.51, difficulty: "easy" },
  { name: "Trípoli", country: "Libia", lat: 32.90, lon: 13.18, difficulty: "easy" },

  // === MEDIUM (20 cities) ===
  { name: "Casablanca", country: "Marruecos", lat: 33.57, lon: -7.59, difficulty: "medium" },
  { name: "Johannesburgo", country: "Sudáfrica", lat: -26.20, lon: 28.05, difficulty: "medium" },
  { name: "Ciudad del Cabo", country: "Sudáfrica", lat: -33.93, lon: 18.42, difficulty: "medium" },
  { name: "Alejandría", country: "Egipto", lat: 31.20, lon: 29.92, difficulty: "medium" },
  { name: "Durban", country: "Sudáfrica", lat: -29.86, lon: 31.02, difficulty: "medium" },
  { name: "Marrakech", country: "Marruecos", lat: 31.63, lon: -8.01, difficulty: "medium" },
  { name: "Abuya", country: "Nigeria", lat: 9.06, lon: 7.49, difficulty: "medium" },
  { name: "Mombasa", country: "Kenia", lat: -4.04, lon: 39.67, difficulty: "medium" },
  { name: "Fez", country: "Marruecos", lat: 34.03, lon: -5.00, difficulty: "medium" },
  { name: "Douala", country: "Camerún", lat: 4.05, lon: 9.77, difficulty: "medium" },
  { name: "Kumasi", country: "Ghana", lat: 6.69, lon: -1.62, difficulty: "medium" },
  { name: "Brazzaville", country: "Rep. del Congo", lat: -4.27, lon: 15.28, difficulty: "medium" },
  { name: "Yaundé", country: "Camerún", lat: 3.87, lon: 11.52, difficulty: "medium" },
  { name: "Conakry", country: "Guinea", lat: 9.64, lon: -13.58, difficulty: "medium" },
  { name: "Lubumbashi", country: "Rep. Dem. del Congo", lat: -11.66, lon: 27.48, difficulty: "medium" },
  { name: "Mogadiscio", country: "Somalia", lat: 2.05, lon: 45.32, difficulty: "medium" },
  { name: "Jartum", country: "Sudán", lat: 15.59, lon: 32.53, difficulty: "medium" },
  { name: "Bamako", country: "Mali", lat: 12.64, lon: -8.00, difficulty: "medium" },
  { name: "Niamey", country: "Níger", lat: 13.51, lon: 2.11, difficulty: "medium" },
  { name: "Windhoek", country: "Namibia", lat: -22.56, lon: 17.08, difficulty: "medium" },

  // === HARD (20 lesser-known cities) ===
  { name: "Nuakchot", country: "Mauritania", lat: 18.09, lon: -15.98, difficulty: "hard" },
  { name: "Uagadugú", country: "Burkina Faso", lat: 12.37, lon: -1.52, difficulty: "hard" },
  { name: "Yamena", country: "Chad", lat: 12.13, lon: 15.05, difficulty: "hard" },
  { name: "Bangui", country: "Rep. Centroafricana", lat: 4.36, lon: 18.56, difficulty: "hard" },
  { name: "Libreville", country: "Gabón", lat: 0.39, lon: 9.45, difficulty: "hard" },
  { name: "Malabo", country: "Guinea Ecuatorial", lat: 3.75, lon: 8.78, difficulty: "hard" },
  { name: "Bujumbura", country: "Burundi", lat: -3.38, lon: 29.36, difficulty: "hard" },
  { name: "Kigali", country: "Ruanda", lat: -1.94, lon: 29.87, difficulty: "hard" },
  { name: "Asmara", country: "Eritrea", lat: 15.34, lon: 38.93, difficulty: "hard" },
  { name: "Yibuti", country: "Yibuti", lat: 11.59, lon: 43.15, difficulty: "hard" },
  { name: "Moroni", country: "Comoras", lat: -11.70, lon: 43.26, difficulty: "hard" },
  { name: "Victoria", country: "Seychelles", lat: -4.62, lon: 55.45, difficulty: "hard" },
  { name: "Port Louis", country: "Mauricio", lat: -20.16, lon: 57.50, difficulty: "hard" },
  { name: "Lomé", country: "Togo", lat: 6.17, lon: 1.23, difficulty: "hard" },
  { name: "Cotonú", country: "Benín", lat: 6.37, lon: 2.39, difficulty: "hard" },
  { name: "Monrovia", country: "Liberia", lat: 6.30, lon: -10.80, difficulty: "hard" },
  { name: "Freetown", country: "Sierra Leona", lat: 8.48, lon: -13.23, difficulty: "hard" },
  { name: "Bisáu", country: "Guinea-Bisáu", lat: 11.86, lon: -15.60, difficulty: "hard" },
  { name: "Gaborone", country: "Botsuana", lat: -24.65, lon: 25.91, difficulty: "hard" },
  { name: "Maseru", country: "Lesoto", lat: -29.31, lon: 27.48, difficulty: "hard" },
];

// Keep backward compat
export const cities = worldCities;

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
  const pool = getCitiesByDifficulty(difficulty, mode);
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
      return { latMin: -90, latMax: 85, lonMin: -180, lonMax: 180 };
  }
}

export const MODE_CONFIG: { key: GameMode; label: string; emoji: string }[] = [
  { key: 'world', label: 'World', emoji: '🌍' },
  { key: 'europe', label: 'Europa', emoji: '🇪🇺' },
  { key: 'asia', label: 'Asia', emoji: '🌏' },
  { key: 'americas', label: 'América', emoji: '🌎' },
  { key: 'africa', label: 'África', emoji: '🌍' },
];
