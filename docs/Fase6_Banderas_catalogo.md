# Fase 6 · Banderas — catálogo para revisión

Borrador (2026-10-22), 166 países del mapa con su nivel. Para cambiar algo: editar `src/data/flagTiers.ts` y correr
`node scripts/build-flags.mjs` (regenera `src/data/flagCatalog.ts` y `supabase/seed/flag_places.sql`; si cambian países, volver a
aplicar la parte de seed en el SQL Editor).

Niveles por lo reconocible que es la bandera para un jugador latinoamericano: **Turista** (las que casi todos conocen) ·
**Rookie** · **Crack** · **Leyenda** (las que casi nadie reconoce). En las regiones, si un nivel no llega a 13 banderas se
completa con el nivel vecino (por ejemplo, Turista en América toma Rookie).

| Región | Turista | Rookie | Crack | Leyenda | Total |
|---|---|---|---|---|---|
| América | 9 | 9 | 7 | 3 | 28 |
| Europa | 11 | 12 | 12 | 3 | 38 |
| Asia | 6 | 14 | 17 | 7 | 44 |
| África | 5 | 10 | 20 | 13 | 48 |
| Oceanía (solo en Mundo) | 1 | 1 | 2 | 4 | 8 |
| **Total** | 32 | 46 | 58 | 30 | 166 |

## América

- **Turista** (9): Argentina (AR), Brasil (BR), Canadá (CA), Chile (CL), Colombia (CO), Cuba (CU), Estados Unidos (US), Jamaica (JM), México (MX)
- **Rookie** (9): Bolivia (BO), Costa Rica (CR), Ecuador (EC), Panamá (PA), Paraguay (PY), Perú (PE), República Dominicana (DO), Uruguay (UY), Venezuela (VE)
- **Crack** (7): Bahamas (BS), El Salvador (SV), Guatemala (GT), Haití (HT), Honduras (HN), Nicaragua (NI), Trinidad y Tobago (TT)
- **Leyenda** (3): Belice (BZ), Guyana (GY), Surinam (SR)

## Europa

- **Turista** (11): Alemania (DE), España (ES), Francia (FR), Grecia (GR), Italia (IT), Países Bajos (NL), Portugal (PT), Reino Unido (GB), Rusia (RU), Suecia (SE), Suiza (CH)
- **Rookie** (12): Austria (AT), Bélgica (BE), Chequia (CZ), Croacia (HR), Dinamarca (DK), Finlandia (FI), Hungría (HU), Irlanda (IE), Islandia (IS), Noruega (NO), Polonia (PL), Ucrania (UA)
- **Crack** (12): Albania (AL), Bielorrusia (BY), Bulgaria (BG), Chipre (CY), Eslovaquia (SK), Eslovenia (SI), Estonia (EE), Letonia (LV), Lituania (LT), Luxemburgo (LU), Rumanía (RO), Serbia (RS)
- **Leyenda** (3): Bosnia y Herzegovina (BA), Moldavia (MD), Montenegro (ME)

## Asia

- **Turista** (6): Arabia Saudí (SA), China (CN), Corea del Sur (KR), India (IN), Israel (IL), Japón (JP)
- **Rookie** (14): Bangladés (BD), Catar (QA), Corea del Norte (KP), Emiratos Árabes Unidos (AE), Filipinas (PH), Indonesia (ID), Irak (IQ), Irán (IR), Malasia (MY), Nepal (NP), Pakistán (PK), Tailandia (TH), Turquía (TR), Vietnam (VN)
- **Crack** (17): Afganistán (AF), Armenia (AM), Azerbaiyán (AZ), Camboya (KH), Georgia (GE), Jordania (JO), Kazajistán (KZ), Kuwait (KW), Laos (LA), Líbano (LB), Mongolia (MN), Myanmar (Birmania) (MM), Omán (OM), Siria (SY), Sri Lanka (LK), Uzbekistán (UZ), Yemen (YE)
- **Leyenda** (7): Brunéi (BN), Bután (BT), Kirguistán (KG), Tayikistán (TJ), Territorios Palestinos (PS), Timor-Leste (TL), Turkmenistán (TM)

## África

- **Turista** (5): Egipto (EG), Kenia (KE), Marruecos (MA), Nigeria (NG), Sudáfrica (ZA)
- **Rookie** (10): Angola (AO), Argelia (DZ), Camerún (CM), Côte d’Ivoire (CI), Etiopía (ET), Ghana (GH), Libia (LY), Senegal (SN), Tanzania (TZ), Túnez (TN)
- **Crack** (20): Benín (BJ), Botsuana (BW), Burkina Faso (BF), Chad (TD), Congo (CG), Gabón (GA), Guinea (GN), Madagascar (MG), Mali (ML), Mozambique (MZ), Namibia (NA), Níger (NE), República Democrática del Congo (CD), Ruanda (RW), Somalia (SO), Sudán (SD), Togo (TG), Uganda (UG), Zambia (ZM), Zimbabue (ZW)
- **Leyenda** (13): Burundi (BI), Eritrea (ER), Esuatini (SZ), Gambia (GM), Guinea Ecuatorial (GQ), Guinea-Bisáu (GW), Lesoto (LS), Liberia (LR), Malaui (MW), Mauritania (MR), República Centroafricana (CF), Sierra Leona (SL), Yibuti (DJ)

## Oceanía (solo en Mundo)

- **Turista** (1): Australia (AU)
- **Rookie** (1): Nueva Zelanda (NZ)
- **Crack** (2): Fiyi (FJ), Papúa Nueva Guinea (PG)
- **Leyenda** (4): Islas Salomón (SB), Macedonia del Norte (MK), Sudán del Sur (SS), Vanuatu (VU)

## Fuera del catálogo

- Territorios y estados sin reconocimiento general que dibuja el mapa 1:110m: Antártida, Sáhara Occidental, Groenlandia,
  Puerto Rico, Malvinas, Tierras Australes Francesas, Nueva Caledonia, Chipre del Norte, Somalilandia, Kosovo, Taiwán.
- Microestados e islas que ese mapa no dibuja (Singapur, Malta, Maldivas, Bahréin, Cabo Verde, Barbados, Mónaco, Andorra,
  Liechtenstein, San Marino, Vaticano…): entrarán cuando las banderas usen el mapa detallado 1:50m.
- Palestina quedó como Leyenda (estado observador de la ONU); si prefieres dejarla fuera, se quita de `flagTiers.ts`.

## Cómo se puntúa (decisión del 22-10-2026)

Igual que las ciudades: tocar **dentro** del país vale la cercanía perfecta (1.000); tocar fuera cuenta la distancia a la
**frontera más cercana**, con la misma curva (1.500 km en Mundo, 600 km en una región), más rapidez y combo. El servidor
recalcula cada ronda con los mismos contornos (prueba de paridad: `npm run test:flags-sql`).
