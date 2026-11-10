# Conquista · fase C1 · banco de ciudades (para revisar)

Generado por `node scripts/build-conquest-catalog.mjs` desde `src/data/conquestTiers.ts`. Doce ciudades conocidas por
país (decisión CQ-D2). Cada temporada el servidor sortea 10 de estos países y arma con este banco un paquete de cinco
ciudades por país. Todas se
verificaron con Wikidata: el país (P17) es el correcto y el punto está a menos de 30 km del aproximado de la lista; y caen
dentro del contorno del país del mapa (o a pocos km de su costa).

- **Reutilizada**: ya estaba en el juego; conserva su id, sus coordenadas oficiales del servidor, foto, ficha y reseña.
- **Nueva**: se agrega como `cq:<país>-<nombre>` con las coordenadas de Wikidata; sin foto propia todavía (la tarjeta usa
  la del país).

Para cambiar una ciudad: editar `src/data/conquestTiers.ts` y volver a correr el script.

| País | Reutilizadas | Nuevas | Con foto propia | Encuadre del mapa (lon, lat) |
|---|---|---|---|---|
| Colombia | 12 | 0 | 12 | -79.72…-66.15, -4.74…13.35 |
| Perú | 12 | 0 | 12 | -81.83…-68.15, -19.17…0.93 |
| Ecuador | 12 | 0 | 12 | -81.31…-74.9, -5.34…1.76 |
| Chile | 12 | 0 | 12 | -76.13…-66.44, -57.89…-15.3 |
| Argentina | 10 | 2 | 10 | -74.51…-52.45, -57.26…-19.82 |
| Brasil | 7 | 5 | 7 | -76.06…-32.39, -36.11…7.54 |
| México | 12 | 0 | 11 | -118.95…-84.99, 13.76…33.79 |
| España | 3 | 9 | 3 | -10.14…3.79, 35.49…44.03 |
| Francia | 3 | 9 | 3 | -5.35…8.86, 41.81…51.68 |
| Italia | 4 | 8 | 4 | 6.14…19.18, 36…47.56 |
| Estados Unidos | 6 | 6 | 6 | -128.15…-63.51, 23.75…50.84 |
| Canadá | 5 | 7 | 5 | -146.12…-50.56, 39.86…73.73 |
| Venezuela | 12 | 0 | 11 | -73.8…-59.38, 0.11…12.84 |
| Alemania | 4 | 8 | 4 | 5.45…15.56, 47.02…55.43 |
| Reino Unido | 3 | 9 | 3 | -8.13…2.23, 49.44…59.15 |
| Portugal | 2 | 10 | 2 | -9.72…-6.2, 36.51…42.61 |
| Polonia | 3 | 9 | 3 | 13.47…24.63, 48.68…55.2 |
| Grecia | 1 | 11 | 1 | 19.52…27, 34.51…42.24 |
| Suecia | 2 | 10 | 2 | 10.26…24.67, 54.53…69.94 |
| Turquía | 3 | 9 | 3 | 24.91…45.91, 35.44…42.52 |
| Japón | 2 | 10 | 2 | 128.44…146.51, 30.16…46.42 |
| China | 5 | 7 | 5 | 70.3…138.13, 18.29…55.42 |
| India | 6 | 6 | 6 | 67.13…99.04, 6.66…36.34 |
| Corea del Sur | 1 | 11 | 1 | 125.92…129.67, 34.14…38.86 |
| Tailandia | 2 | 10 | 2 | 97.34…106, 4.81…21.3 |
| Indonesia | 1 | 11 | 1 | 93.49…127.04, -9.61…6.41 |
| Egipto | 2 | 10 | 2 | 23.97…37.6, 21.42…32.17 |
| Marruecos | 4 | 8 | 4 | -17.95…-0.18, 20.56…36.63 |
| Sudáfrica | 4 | 8 | 4 | 15.38…33.55, -35.58…-21.33 |
| Australia | 4 | 8 | 4 | 110.93…155.92, -45.62…-8.69 |

## Colombia

| # | Ciudad (ES / EN) | Origen | Coordenadas | Wikidata | Dentro del país | Foto |
|---|---|---|---|---|---|---|
| 1 | Bogotá / Bogotá | reutilizada (del mundo, `bogota`) | 4.710, -74.070 | [Q2841](https://www.wikidata.org/wiki/Q2841) Bogotá (11 km del punto de Wikidata) | ✓ | ✓ |
| 2 | Medellín / Medellín | reutilizada (del mundo, `medellin`) | 6.250, -75.560 | [Q48278](https://www.wikidata.org/wiki/Q48278) Medellín | ✓ | ✓ |
| 3 | Cali / Cali | reutilizada (del mundo, `cali`) | 3.450, -76.530 | [Q51103](https://www.wikidata.org/wiki/Q51103) Cali | ✓ | ✓ |
| 4 | Barranquilla / Barranquilla | reutilizada (del mundo, `barranquilla`) | 10.960, -74.780 | [Q62823](https://www.wikidata.org/wiki/Q62823) Barranquilla | costa (6 km) | ✓ |
| 5 | Cartagena / Cartagena | reutilizada (del mundo, `cartagena`) | 10.390, -75.510 | [Q657461](https://www.wikidata.org/wiki/Q657461) Cartagena de Indias | ✓ | ✓ |
| 6 | Santa Marta / Santa Marta | reutilizada (pack Colombia, `co:santa-marta`) | 11.236, -74.202 | [Q209016](https://www.wikidata.org/wiki/Q209016) Santa Marta | costa (14 km) | ✓ |
| 7 | Bucaramanga / Bucaramanga | reutilizada (pack Colombia, `co:bucaramanga`) | 7.119, -73.116 | [Q243766](https://www.wikidata.org/wiki/Q243766) Bucaramanga | ✓ | ✓ |
| 8 | Cúcuta / Cúcuta | reutilizada (pack Colombia, `co:cucuta`) | 7.894, -72.508 | [Q216847](https://www.wikidata.org/wiki/Q216847)  | ✓ | ✓ |
| 9 | Pereira / Pereira | reutilizada (pack Colombia, `co:pereira`) | 4.814, -75.695 | [Q51111](https://www.wikidata.org/wiki/Q51111) Pereira | ✓ | ✓ |
| 10 | Manizales / Manizales | reutilizada (pack Colombia, `co:manizales`) | 5.067, -75.510 | [Q235190](https://www.wikidata.org/wiki/Q235190) Manizales | ✓ | ✓ |
| 11 | Pasto / Pasto | reutilizada (pack Colombia, `co:pasto`) | 1.210, -77.275 | [Q320015](https://www.wikidata.org/wiki/Q320015) Pasto | ✓ | ✓ |
| 12 | Villavicencio / Villavicencio | reutilizada (pack Colombia, `co:villavicencio`) | 4.142, -73.627 | [Q749224](https://www.wikidata.org/wiki/Q749224) Villavicencio | ✓ | ✓ |

## Perú

| # | Ciudad (ES / EN) | Origen | Coordenadas | Wikidata | Dentro del país | Foto |
|---|---|---|---|---|---|---|
| 1 | Lima / Lima | reutilizada (del mundo, `lima`) | -12.050, -77.040 | [Q2868](https://www.wikidata.org/wiki/Q2868) Lima | ✓ | ✓ |
| 2 | Arequipa / Arequipa | reutilizada (del mundo, `arequipa`) | -16.410, -71.540 | [Q159273](https://www.wikidata.org/wiki/Q159273) Arequipa | ✓ | ✓ |
| 3 | Cusco / Cusco | reutilizada (del mundo, `cusco`) | -13.530, -71.970 | [Q5582862](https://www.wikidata.org/wiki/Q5582862) Cusco | ✓ | ✓ |
| 4 | Trujillo / Trujillo | reutilizada (pack Pro, `ci:pe-trujillo`) | -8.120, -79.020 | [Q214173](https://www.wikidata.org/wiki/Q214173) Trujillo | ✓ | ✓ |
| 5 | Chiclayo / Chiclayo | reutilizada (pack Pro, `ci:pe-chiclayo`) | -6.763, -79.837 | [Q260911](https://www.wikidata.org/wiki/Q260911) Chiclayo | ✓ | ✓ |
| 6 | Piura / Piura | reutilizada (pack Pro, `ci:pe-piura`) | -5.210, -80.630 | [Q223966](https://www.wikidata.org/wiki/Q223966) Piura | ✓ | ✓ |
| 7 | Iquitos / Iquitos | reutilizada (del mundo, `iquitos`) | -3.750, -73.250 | [Q193289](https://www.wikidata.org/wiki/Q193289) Iquitos | ✓ | ✓ |
| 8 | Puno / Puno | reutilizada (pack Pro, `ci:pe-puno`) | -15.833, -70.033 | [Q232842](https://www.wikidata.org/wiki/Q232842) Puno | ✓ | ✓ |
| 9 | Huancayo / Huancayo | reutilizada (pack Pro, `ci:pe-huancayo`) | -12.080, -75.200 | [Q468782](https://www.wikidata.org/wiki/Q468782) Huancayo | ✓ | ✓ |
| 10 | Tacna / Tacna | reutilizada (pack Pro, `ci:pe-tacna`) | -18.000, -70.250 | [Q272795](https://www.wikidata.org/wiki/Q272795) Tacna (6 km del punto de Wikidata) | ✓ | ✓ |
| 11 | Cajamarca / Cajamarca | reutilizada (pack Pro, `ci:pe-cajamarca`) | -7.150, -78.530 | [Q205119](https://www.wikidata.org/wiki/Q205119) Cajamarca | ✓ | ✓ |
| 12 | Ayacucho / Ayacucho | reutilizada (pack Pro, `ci:pe-ayacucho`) | -13.175, -74.220 | [Q504215](https://www.wikidata.org/wiki/Q504215) Ayacucho | ✓ | ✓ |

## Ecuador

| # | Ciudad (ES / EN) | Origen | Coordenadas | Wikidata | Dentro del país | Foto |
|---|---|---|---|---|---|---|
| 1 | Quito / Quito | reutilizada (del mundo, `quito`) | -0.180, -78.470 | [Q2900](https://www.wikidata.org/wiki/Q2900) Quito (6 km del punto de Wikidata) | ✓ | ✓ |
| 2 | Guayaquil / Guayaquil | reutilizada (del mundo, `guayaquil`) | -2.170, -79.920 | [Q43509](https://www.wikidata.org/wiki/Q43509) Guayaquil | ✓ | ✓ |
| 3 | Cuenca / Cuenca | reutilizada (pack Pro, `ci:ec-cuenca`) | -2.900, -79.000 | [Q54886](https://www.wikidata.org/wiki/Q54886) Cuenca | ✓ | ✓ |
| 4 | Manta / Manta | reutilizada (pack Pro, `ci:ec-manta`) | -0.980, -80.730 | [Q990738](https://www.wikidata.org/wiki/Q990738) Manta | ✓ | ✓ |
| 5 | Ambato / Ambato | reutilizada (pack Pro, `ci:ec-ambato`) | -1.270, -78.620 | [Q210161](https://www.wikidata.org/wiki/Q210161) Ambato | ✓ | ✓ |
| 6 | Loja / Loja | reutilizada (pack Pro, `ci:ec-loja`) | -3.990, -79.210 | [Q944697](https://www.wikidata.org/wiki/Q944697) Loja | ✓ | ✓ |
| 7 | Esmeraldas / Esmeraldas | reutilizada (pack Pro, `ci:ec-esmeraldas`) | 0.930, -79.670 | [Q149955](https://www.wikidata.org/wiki/Q149955) Esmeraldas | costa (0 km) | ✓ |
| 8 | Riobamba / Riobamba | reutilizada (pack Pro, `ci:ec-riobamba`) | -1.670, -78.650 | [Q478675](https://www.wikidata.org/wiki/Q478675) Riobamba | ✓ | ✓ |
| 9 | Machala / Machala | reutilizada (pack Pro, `ci:ec-machala`) | -3.260, -79.960 | [Q215080](https://www.wikidata.org/wiki/Q215080) Machala | ✓ | ✓ |
| 10 | Ibarra / Ibarra | reutilizada (pack Pro, `ci:ec-ibarra`) | 0.360, -78.130 | [Q946384](https://www.wikidata.org/wiki/Q946384) Ibarra | ✓ | ✓ |
| 11 | Portoviejo / Portoviejo | reutilizada (pack Pro, `ci:ec-portoviejo`) | -1.060, -80.460 | [Q990716](https://www.wikidata.org/wiki/Q990716) Portoviejo | ✓ | ✓ |
| 12 | Latacunga / Latacunga | reutilizada (pack Pro, `ci:ec-latacunga`) | -0.930, -78.610 | [Q379338](https://www.wikidata.org/wiki/Q379338) Latacunga | ✓ | ✓ |

## Chile

| # | Ciudad (ES / EN) | Origen | Coordenadas | Wikidata | Dentro del país | Foto |
|---|---|---|---|---|---|---|
| 1 | Santiago / Santiago | reutilizada (del mundo, `santiago`) | -33.450, -70.670 | [Q2887](https://www.wikidata.org/wiki/Q2887) Santiago de Chile | ✓ | ✓ |
| 2 | Valparaíso / Valparaíso | reutilizada (del mundo, `valparaiso`) | -33.050, -71.620 | [Q33986](https://www.wikidata.org/wiki/Q33986) Valparaíso | ✓ | ✓ |
| 3 | Concepción / Concepción | reutilizada (pack Pro, `ci:cl-concepcion`) | -36.830, -73.050 | [Q1880](https://www.wikidata.org/wiki/Q1880) Concepción | ✓ | ✓ |
| 4 | Antofagasta / Antofagasta | reutilizada (pack Pro, `ci:cl-antofagasta`) | -23.650, -70.400 | [Q3612](https://www.wikidata.org/wiki/Q3612) Antofagasta | ✓ | ✓ |
| 5 | La Serena / La Serena | reutilizada (pack Pro, `ci:cl-la-serena`) | -29.900, -71.250 | [Q14467](https://www.wikidata.org/wiki/Q14467) La Serena | ✓ | ✓ |
| 6 | Temuco / Temuco | reutilizada (pack Pro, `ci:cl-temuco`) | -38.730, -72.580 | [Q82128](https://www.wikidata.org/wiki/Q82128) Temuco | ✓ | ✓ |
| 7 | Puerto Montt / Puerto Montt | reutilizada (pack Pro, `ci:cl-puerto-montt`) | -41.470, -72.930 | [Q36214](https://www.wikidata.org/wiki/Q36214) Puerto Montt | ✓ | ✓ |
| 8 | Punta Arenas / Punta Arenas | reutilizada (del mundo, `punta-arenas`) | -53.150, -70.920 | [Q51599](https://www.wikidata.org/wiki/Q51599) Punta Arenas | ✓ | ✓ |
| 9 | Arica / Arica | reutilizada (pack Pro, `ci:cl-arica`) | -18.500, -70.290 | [Q2203](https://www.wikidata.org/wiki/Q2203) Arica | ✓ | ✓ |
| 10 | Iquique / Iquique | reutilizada (pack Pro, `ci:cl-iquique`) | -20.250, -70.130 | [Q14440](https://www.wikidata.org/wiki/Q14440) Iquique | ✓ | ✓ |
| 11 | Valdivia / Valdivia | reutilizada (pack Pro, `ci:cl-valdivia`) | -39.822, -73.233 | [Q160687](https://www.wikidata.org/wiki/Q160687) Valdivia | ✓ | ✓ |
| 12 | Calama / Calama | reutilizada (pack Pro, `ci:cl-calama`) | -22.450, -68.920 | [Q3685](https://www.wikidata.org/wiki/Q3685) Calama | ✓ | ✓ |

## Argentina

| # | Ciudad (ES / EN) | Origen | Coordenadas | Wikidata | Dentro del país | Foto |
|---|---|---|---|---|---|---|
| 1 | Buenos Aires / Buenos Aires | reutilizada (del mundo, `buenos-aires`) | -34.600, -58.380 | [Q1486](https://www.wikidata.org/wiki/Q1486) Buenos Aires | ✓ | ✓ |
| 2 | Córdoba / Córdoba | reutilizada (del mundo, `cordoba`) | -31.420, -64.180 | [Q44210](https://www.wikidata.org/wiki/Q44210) Córdoba | ✓ | ✓ |
| 3 | Rosario / Rosario | reutilizada (del mundo, `rosario`) | -32.950, -60.650 | [Q52535](https://www.wikidata.org/wiki/Q52535) Rosario | ✓ | ✓ |
| 4 | Mendoza / Mendoza | reutilizada (del mundo, `mendoza`) | -32.890, -68.830 | [Q44237](https://www.wikidata.org/wiki/Q44237) Mendoza | ✓ | ✓ |
| 5 | Mar del Plata / Mar del Plata | reutilizada (pack Pro, `ci:ar-mar-del-plata`) | -38.000, -57.580 | [Q52607](https://www.wikidata.org/wiki/Q52607) Mar del Plata | isla fuera del mapa 1:110m (41 km) | ✓ |
| 6 | San Miguel de Tucumán / San Miguel de Tucumán | nueva (`cq:ar-san-miguel-de-tucuman`) | -26.817, -65.217 | [Q44255](https://www.wikidata.org/wiki/Q44255) San Miguel de Tucumán | ✓ | — |
| 7 | Salta / Salta | reutilizada (pack Pro, `ci:ar-salta`) | -24.783, -65.417 | [Q36307](https://www.wikidata.org/wiki/Q36307) Salta | ✓ | ✓ |
| 8 | San Carlos de Bariloche / San Carlos de Bariloche | nueva (`cq:ar-san-carlos-de-bariloche`) | -41.150, -71.300 | [Q47772](https://www.wikidata.org/wiki/Q47772) San Carlos de Bariloche | ✓ | — |
| 9 | Ushuaia / Ushuaia | reutilizada (del mundo, `ushuaia`) | -54.800, -68.300 | [Q44254](https://www.wikidata.org/wiki/Q44254) Ushuaia | ✓ | ✓ |
| 10 | Neuquén / Neuquén | reutilizada (pack Pro, `ci:ar-neuquen`) | -38.950, -68.060 | [Q44239](https://www.wikidata.org/wiki/Q44239) Neuquén | ✓ | ✓ |
| 11 | Santa Fe / Santa Fe | reutilizada (pack Pro, `ci:ar-santa-fe`) | -31.624, -60.690 | [Q44244](https://www.wikidata.org/wiki/Q44244) Santa Fe | ✓ | ✓ |
| 12 | Posadas / Posadas | reutilizada (pack Pro, `ci:ar-posadas`) | -27.358, -55.885 | [Q44238](https://www.wikidata.org/wiki/Q44238) Posadas | costa (4 km) | ✓ |

## Brasil

| # | Ciudad (ES / EN) | Origen | Coordenadas | Wikidata | Dentro del país | Foto |
|---|---|---|---|---|---|---|
| 1 | Brasilia / Brasília | reutilizada (del mundo, `brasilia`) | -15.790, -47.880 | [Q2844](https://www.wikidata.org/wiki/Q2844) Brasilia | ✓ | ✓ |
| 2 | São Paulo / São Paulo | reutilizada (del mundo, `sao-paulo`) | -23.550, -46.630 | [Q174](https://www.wikidata.org/wiki/Q174) São Paulo | ✓ | ✓ |
| 3 | Río de Janeiro / Rio de Janeiro | reutilizada (del mundo, `rio-de-janeiro`) | -22.910, -43.170 | [Q8678](https://www.wikidata.org/wiki/Q8678) Río de Janeiro | ✓ | ✓ |
| 4 | Salvador / Salvador | reutilizada (del mundo, `salvador`) | -12.970, -38.510 | [Q36947](https://www.wikidata.org/wiki/Q36947) Salvador | costa (4 km) | ✓ |
| 5 | Fortaleza / Fortaleza | nueva (`cq:br-fortaleza`) | -3.728, -38.528 | [Q43463](https://www.wikidata.org/wiki/Q43463) Fortaleza | ✓ | — |
| 6 | Belo Horizonte / Belo Horizonte | nueva (`cq:br-belo-horizonte`) | -19.928, -43.942 | [Q42800](https://www.wikidata.org/wiki/Q42800) Belo Horizonte | ✓ | — |
| 7 | Manaus / Manaus | reutilizada (del mundo, `manaus`) | -3.120, -60.020 | [Q40236](https://www.wikidata.org/wiki/Q40236) Manaos | ✓ | ✓ |
| 8 | Recife / Recife | reutilizada (del mundo, `recife`) | -8.050, -34.870 | [Q48344](https://www.wikidata.org/wiki/Q48344) Recife | costa (14 km) | ✓ |
| 9 | Porto Alegre / Porto Alegre | nueva (`cq:br-porto-alegre`) | -30.033, -51.230 | [Q40269](https://www.wikidata.org/wiki/Q40269) Porto Alegre | ✓ | — |
| 10 | Curitiba / Curitiba | reutilizada (del mundo, `curitiba`) | -25.430, -49.270 | [Q4361](https://www.wikidata.org/wiki/Q4361) Curitiba | ✓ | ✓ |
| 11 | Belém / Belém | nueva (`cq:br-belem`) | -1.456, -48.504 | [Q12829733](https://www.wikidata.org/wiki/Q12829733) Belém | ✓ | — |
| 12 | Florianópolis / Florianópolis | nueva (`cq:br-florianopolis`) | -27.593, -48.553 | [Q132997](https://www.wikidata.org/wiki/Q132997) Florianópolis | costa (4 km) | — |

## México

| # | Ciudad (ES / EN) | Origen | Coordenadas | Wikidata | Dentro del país | Foto |
|---|---|---|---|---|---|---|
| 1 | Ciudad de México / Mexico City | reutilizada (del mundo, `ciudad-de-mexico`) | 19.430, -99.130 | [Q1489](https://www.wikidata.org/wiki/Q1489) Ciudad de México (8 km del punto de Wikidata) | ✓ | ✓ |
| 2 | Guadalajara / Guadalajara | reutilizada (del mundo, `guadalajara`) | 20.670, -103.350 | [Q9022](https://www.wikidata.org/wiki/Q9022) Guadalajara | ✓ | ✓ |
| 3 | Monterrey / Monterrey | reutilizada (del mundo, `monterrey`) | 25.670, -100.310 | [Q81033](https://www.wikidata.org/wiki/Q81033) Monterrey | ✓ | ✓ |
| 4 | Puebla / Puebla | reutilizada (del mundo, `puebla`) | 19.040, -98.210 | [Q125293](https://www.wikidata.org/wiki/Q125293) Heroica Puebla de Zaragoza | ✓ | ✓ |
| 5 | Cancún / Cancún | reutilizada (del mundo, `cancun`) | 21.160, -86.850 | [Q8969](https://www.wikidata.org/wiki/Q8969) Cancún | costa (5 km) | ✓ |
| 6 | Tijuana / Tijuana | reutilizada (pack Pro, `ci:mx-tijuana`) | 32.502, -117.082 | [Q124739](https://www.wikidata.org/wiki/Q124739) Tijuana (6 km del punto de Wikidata) | ✓ | ✓ |
| 7 | Mérida / Mérida | reutilizada (pack Pro, `ci:mx-merida`) | 20.969, -89.619 | [Q165204](https://www.wikidata.org/wiki/Q165204) Mérida | ✓ | ✓ |
| 8 | Oaxaca / Oaxaca | reutilizada (pack Pro, `ci:mx-oaxaca`) | 17.083, -96.670 | [Q131429](https://www.wikidata.org/wiki/Q131429) Oaxaca de Juárez (6 km del punto de Wikidata) | ✓ | ✓ |
| 9 | Acapulco / Acapulco | reutilizada (pack Pro, `ci:mx-acapulco`) | 16.850, -99.916 | [Q81398](https://www.wikidata.org/wiki/Q81398) Acapulco de Juárez | costa (3 km) | ✓ |
| 10 | Chihuahua / Chihuahua | reutilizada (pack Pro, `ci:mx-chihuahua`) | 28.647, -106.087 | [Q61302](https://www.wikidata.org/wiki/Q61302) Chihuahua | ✓ | ✓ |
| 11 | Veracruz / Veracruz | reutilizada (pack Pro, `ci:mx-veracruz`) | 19.177, -96.160 | [Q173270](https://www.wikidata.org/wiki/Q173270) Veracruz | ✓ | — |
| 12 | Hermosillo / Hermosillo | reutilizada (pack Pro, `ci:mx-hermosillo`) | 29.099, -110.954 | [Q189138](https://www.wikidata.org/wiki/Q189138) Hermosillo | ✓ | ✓ |

## España

| # | Ciudad (ES / EN) | Origen | Coordenadas | Wikidata | Dentro del país | Foto |
|---|---|---|---|---|---|---|
| 1 | Madrid / Madrid | reutilizada (del mundo, `madrid`) | 40.420, -3.700 | [Q2807](https://www.wikidata.org/wiki/Q2807) Madrid | ✓ | ✓ |
| 2 | Barcelona / Barcelona | reutilizada (del mundo, `barcelona`) | 41.390, 2.170 | [Q1492](https://www.wikidata.org/wiki/Q1492) Barcelona | costa (15 km) | ✓ |
| 3 | Valencia / Valencia | nueva (`cq:es-valencia`) | 39.470, -0.376 | [Q8818](https://www.wikidata.org/wiki/Q8818) Valencia | ✓ | — |
| 4 | Sevilla / Seville | reutilizada (del mundo, `sevilla`) | 37.390, -5.980 | [Q8717](https://www.wikidata.org/wiki/Q8717) Sevilla | ✓ | ✓ |
| 5 | Bilbao / Bilbao | nueva (`cq:es-bilbao`) | 43.263, -2.935 | [Q8692](https://www.wikidata.org/wiki/Q8692) Bilbao | ✓ | — |
| 6 | Málaga / Málaga | nueva (`cq:es-malaga`) | 36.717, -4.417 | [Q5680327](https://www.wikidata.org/wiki/Q5680327) Málaga | ✓ | — |
| 7 | Zaragoza / Zaragoza | nueva (`cq:es-zaragoza`) | 41.650, -0.883 | [Q10305](https://www.wikidata.org/wiki/Q10305) Zaragoza | ✓ | — |
| 8 | Granada / Granada | nueva (`cq:es-granada`) | 37.175, -3.600 | [Q8810](https://www.wikidata.org/wiki/Q8810) Granada | ✓ | — |
| 9 | Santiago de Compostela / Santiago de Compostela | nueva (`cq:es-santiago-de-compostela`) | 42.880, -8.546 | [Q23992507](https://www.wikidata.org/wiki/Q23992507) Santiago de Compostela | ✓ | — |
| 10 | Palma / Palma | nueva (`cq:es-palma`) | 39.567, 2.650 | [Q8826](https://www.wikidata.org/wiki/Q8826) Palma de Mallorca | isla fuera del mapa 1:110m (214 km) | — |
| 11 | Salamanca / Salamanca | nueva (`cq:es-salamanca`) | 40.969, -5.664 | [Q116442617](https://www.wikidata.org/wiki/Q116442617) Salamanca | ✓ | — |
| 12 | Toledo / Toledo | nueva (`cq:es-toledo`) | 39.867, -4.033 | [Q5836](https://www.wikidata.org/wiki/Q5836) Toledo | ✓ | — |

## Francia

| # | Ciudad (ES / EN) | Origen | Coordenadas | Wikidata | Dentro del país | Foto |
|---|---|---|---|---|---|---|
| 1 | París / Paris | reutilizada (del mundo, `paris`) | 48.860, 2.350 | [Q90](https://www.wikidata.org/wiki/Q90) París | ✓ | ✓ |
| 2 | Marsella / Marseille | reutilizada (del mundo, `marsella`) | 43.300, 5.370 | [Q23482](https://www.wikidata.org/wiki/Q23482) Marsella | ✓ | ✓ |
| 3 | Lyon / Lyon | reutilizada (del mundo, `lyon`) | 45.760, 4.830 | [Q456](https://www.wikidata.org/wiki/Q456) Lyon | ✓ | ✓ |
| 4 | Toulouse / Toulouse | nueva (`cq:fr-toulouse`) | 43.604, 1.443 | [Q7880](https://www.wikidata.org/wiki/Q7880) Toulouse | ✓ | — |
| 5 | Niza / Nice | nueva (`cq:fr-niza`) | 43.702, 7.268 | [Q33959](https://www.wikidata.org/wiki/Q33959) Niza | ✓ | — |
| 6 | Burdeos / Bordeaux | nueva (`cq:fr-burdeos`) | 44.838, -0.579 | [Q1479](https://www.wikidata.org/wiki/Q1479) Burdeos | ✓ | — |
| 7 | Estrasburgo / Strasbourg | nueva (`cq:fr-estrasburgo`) | 48.573, 7.752 | [Q6602](https://www.wikidata.org/wiki/Q6602) Estrasburgo | ✓ | — |
| 8 | Lille / Lille | nueva (`cq:fr-lille`) | 50.632, 3.058 | [Q648](https://www.wikidata.org/wiki/Q648) Lille | ✓ | — |
| 9 | Nantes / Nantes | nueva (`cq:fr-nantes`) | 47.217, -1.554 | [Q12191](https://www.wikidata.org/wiki/Q12191) Nantes | ✓ | — |
| 10 | Montpellier / Montpellier | nueva (`cq:fr-montpellier`) | 43.611, 3.877 | [Q6441](https://www.wikidata.org/wiki/Q6441) Montpellier | ✓ | — |
| 11 | Rennes / Rennes | nueva (`cq:fr-rennes`) | 48.114, -1.681 | [Q647](https://www.wikidata.org/wiki/Q647) Rennes | ✓ | — |
| 12 | Grenoble / Grenoble | nueva (`cq:fr-grenoble`) | 45.187, 5.726 | [Q1289](https://www.wikidata.org/wiki/Q1289) Grenoble | ✓ | — |

## Italia

| # | Ciudad (ES / EN) | Origen | Coordenadas | Wikidata | Dentro del país | Foto |
|---|---|---|---|---|---|---|
| 1 | Roma / Rome | reutilizada (del mundo, `roma`) | 41.900, 12.500 | [Q220](https://www.wikidata.org/wiki/Q220) Roma | ✓ | ✓ |
| 2 | Milán / Milan | reutilizada (del mundo, `milan`) | 45.460, 9.190 | [Q490](https://www.wikidata.org/wiki/Q490) Milán | ✓ | ✓ |
| 3 | Nápoles / Naples | reutilizada (del mundo, `napoles`) | 40.850, 14.270 | [Q2634](https://www.wikidata.org/wiki/Q2634) Nápoles | ✓ | ✓ |
| 4 | Turín / Turin | nueva (`cq:it-turin`) | 45.067, 7.700 | [Q16287](https://www.wikidata.org/wiki/Q16287) Turín | ✓ | — |
| 5 | Florencia / Florence | reutilizada (del mundo, `florencia`) | 43.770, 11.250 | [Q2044](https://www.wikidata.org/wiki/Q2044) Florencia | ✓ | ✓ |
| 6 | Venecia / Venice | nueva (`cq:it-venecia`) | 45.440, 12.332 | [Q641](https://www.wikidata.org/wiki/Q641) Venecia | ✓ | — |
| 7 | Bolonia / Bologna | nueva (`cq:it-bolonia`) | 44.494, 11.343 | [Q1891](https://www.wikidata.org/wiki/Q1891) Bolonia | ✓ | — |
| 8 | Génova / Genoa | nueva (`cq:it-genova`) | 44.407, 8.934 | [Q1449](https://www.wikidata.org/wiki/Q1449) Génova | ✓ | — |
| 9 | Palermo / Palermo | nueva (`cq:it-palermo`) | 38.116, 13.361 | [Q2656](https://www.wikidata.org/wiki/Q2656) Palermo | costa (5 km) | — |
| 10 | Bari / Bari | nueva (`cq:it-bari`) | 41.125, 16.867 | [Q3519](https://www.wikidata.org/wiki/Q3519) Bari | ✓ | — |
| 11 | Verona / Verona | nueva (`cq:it-verona`) | 45.439, 10.993 | [Q2028](https://www.wikidata.org/wiki/Q2028) Verona | ✓ | — |
| 12 | Cagliari / Cagliari | nueva (`cq:it-cagliari`) | 39.217, 9.117 | [Q1897](https://www.wikidata.org/wiki/Q1897) Cagliari | ✓ | — |

## Estados Unidos

| # | Ciudad (ES / EN) | Origen | Coordenadas | Wikidata | Dentro del país | Foto |
|---|---|---|---|---|---|---|
| 1 | Washington D.C. / Washington, D.C. | reutilizada (del mundo, `washington-d-c`) | 38.910, -77.040 | [Q61](https://www.wikidata.org/wiki/Q61) Washington D. C. | ✓ | ✓ |
| 2 | Nueva York / New York City | reutilizada (del mundo, `nueva-york`) | 40.710, -74.010 | [Q60](https://www.wikidata.org/wiki/Q60) Nueva York | ✓ | ✓ |
| 3 | Los Ángeles / Los Angeles | reutilizada (del mundo, `los-angeles`) | 34.050, -118.240 | [Q65](https://www.wikidata.org/wiki/Q65) Los Ángeles | ✓ | ✓ |
| 4 | Chicago / Chicago | reutilizada (del mundo, `chicago`) | 41.880, -87.630 | [Q1297](https://www.wikidata.org/wiki/Q1297) Chicago | ✓ | ✓ |
| 5 | San Francisco / San Francisco | reutilizada (del mundo, `san-francisco`) | 37.770, -122.420 | [Q62](https://www.wikidata.org/wiki/Q62) San Francisco | ✓ | ✓ |
| 6 | Miami / Miami | reutilizada (del mundo, `miami`) | 25.760, -80.190 | [Q8652](https://www.wikidata.org/wiki/Q8652) Miami | costa (3 km) | ✓ |
| 7 | Las Vegas / Las Vegas | nueva (`cq:us-las-vegas`) | 36.167, -115.149 | [Q23768](https://www.wikidata.org/wiki/Q23768) Las Vegas | ✓ | — |
| 8 | Seattle / Seattle | nueva (`cq:us-seattle`) | 47.605, -122.330 | [Q5083](https://www.wikidata.org/wiki/Q5083) Seattle | ✓ | — |
| 9 | Boston / Boston | nueva (`cq:us-boston`) | 42.360, -71.058 | [Q100](https://www.wikidata.org/wiki/Q100) Boston | ✓ | — |
| 10 | Houston / Houston | nueva (`cq:us-houston`) | 29.763, -95.383 | [Q16555](https://www.wikidata.org/wiki/Q16555) Houston | ✓ | — |
| 11 | Denver / Denver | nueva (`cq:us-denver`) | 39.739, -104.985 | [Q16554](https://www.wikidata.org/wiki/Q16554) Denver | ✓ | — |
| 12 | Nueva Orleans / New Orleans | nueva (`cq:us-nueva-orleans`) | 29.976, -90.078 | [Q34404](https://www.wikidata.org/wiki/Q34404) Nueva Orleans | ✓ | — |

## Canadá

| # | Ciudad (ES / EN) | Origen | Coordenadas | Wikidata | Dentro del país | Foto |
|---|---|---|---|---|---|---|
| 1 | Ottawa / Ottawa | reutilizada (del mundo, `ottawa`) | 45.420, -75.700 | [Q1930](https://www.wikidata.org/wiki/Q1930) Ottawa | ✓ | ✓ |
| 2 | Toronto / Toronto | reutilizada (del mundo, `toronto`) | 43.650, -79.380 | [Q172](https://www.wikidata.org/wiki/Q172) Toronto | ✓ | ✓ |
| 3 | Montreal / Montreal | reutilizada (del mundo, `montreal`) | 45.500, -73.570 | [Q340](https://www.wikidata.org/wiki/Q340) Montreal | ✓ | ✓ |
| 4 | Vancouver / Vancouver | reutilizada (del mundo, `vancouver`) | 49.280, -123.120 | [Q24639](https://www.wikidata.org/wiki/Q24639) Vancouver | ✓ | ✓ |
| 5 | Calgary / Calgary | nueva (`cq:ca-calgary`) | 51.047, -114.063 | [Q36312](https://www.wikidata.org/wiki/Q36312) Calgary | ✓ | — |
| 6 | Edmonton / Edmonton | nueva (`cq:ca-edmonton`) | 53.533, -113.500 | [Q2096](https://www.wikidata.org/wiki/Q2096) Edmonton | ✓ | — |
| 7 | Quebec / Quebec City | nueva (`cq:ca-quebec`) | 46.816, -71.224 | [Q2145](https://www.wikidata.org/wiki/Q2145) Quebec | ✓ | — |
| 8 | Winnipeg / Winnipeg | nueva (`cq:ca-winnipeg`) | 49.896, -97.139 | [Q2135](https://www.wikidata.org/wiki/Q2135) Winnipeg | ✓ | — |
| 9 | Halifax / Halifax | nueva (`cq:ca-halifax`) | 44.648, -63.571 | [Q2141](https://www.wikidata.org/wiki/Q2141) Halifax | ✓ | — |
| 10 | Regina / Regina | nueva (`cq:ca-regina`) | 50.455, -104.607 | [Q2123](https://www.wikidata.org/wiki/Q2123) Regina | ✓ | — |
| 11 | Saskatoon / Saskatoon | nueva (`cq:ca-saskatoon`) | 52.135, -106.658 | [Q10566](https://www.wikidata.org/wiki/Q10566) Saskatoon | ✓ | — |
| 12 | Whitehorse / Whitehorse | reutilizada (del mundo, `whitehorse`) | 60.720, -135.060 | [Q2058](https://www.wikidata.org/wiki/Q2058) Whitehorse | ✓ | ✓ |

## Venezuela

| # | Ciudad (ES / EN) | Origen | Coordenadas | Wikidata | Dentro del país | Foto |
|---|---|---|---|---|---|---|
| 1 | Caracas / Caracas | reutilizada (del mundo, `caracas`) | 10.490, -66.880 | [Q1533](https://www.wikidata.org/wiki/Q1533) Caracas | ✓ | ✓ |
| 2 | Maracaibo / Maracaibo | reutilizada (pack Pro, `ci:ve-maracaibo`) | 10.732, -71.662 | [Q171632](https://www.wikidata.org/wiki/Q171632) Maracaibo (11 km del punto de Wikidata) | costa (6 km) | ✓ |
| 3 | Valencia / Valencia | reutilizada (pack Pro, `ci:ve-valencia`) | 10.232, -67.982 | [Q54880](https://www.wikidata.org/wiki/Q54880) Valencia (8 km del punto de Wikidata) | ✓ | ✓ |
| 4 | Barquisimeto / Barquisimeto | reutilizada (pack Pro, `ci:ve-barquisimeto`) | 10.052, -69.302 | [Q4709](https://www.wikidata.org/wiki/Q4709) Barquisimeto | ✓ | ✓ |
| 5 | Maracay / Maracay | reutilizada (pack Pro, `ci:ve-maracay`) | 10.249, -67.598 | [Q333928](https://www.wikidata.org/wiki/Q333928) Maracay | ✓ | ✓ |
| 6 | Ciudad Guayana / Ciudad Guayana | reutilizada (pack Pro, `ci:ve-ciudad-guayana`) | 8.370, -62.620 | [Q507080](https://www.wikidata.org/wiki/Q507080) Ciudad Guayana (9 km del punto de Wikidata) | ✓ | ✓ |
| 7 | Barcelona / Barcelona | reutilizada (pack Pro, `ci:ve-barcelona`) | 10.130, -64.720 | [Q391221](https://www.wikidata.org/wiki/Q391221)  | ✓ | — |
| 8 | San Cristóbal / San Cristóbal | reutilizada (pack Pro, `ci:ve-san-cristobal`) | 7.770, -72.250 | [Q820235](https://www.wikidata.org/wiki/Q820235) San Cristóbal | ✓ | ✓ |
| 9 | Maturín / Maturín | reutilizada (pack Pro, `ci:ve-maturin`) | 9.750, -63.170 | [Q842779](https://www.wikidata.org/wiki/Q842779) Maturín | ✓ | ✓ |
| 10 | Mérida / Mérida | reutilizada (pack Pro, `ci:ve-merida`) | 8.569, -71.183 | [Q23551](https://www.wikidata.org/wiki/Q23551) Mérida | ✓ | ✓ |
| 11 | Ciudad Bolívar / Ciudad Bolívar | reutilizada (pack Pro, `ci:ve-ciudad-bolivar`) | 8.100, -63.600 | [Q26906](https://www.wikidata.org/wiki/Q26906) Ciudad Bolívar (6 km del punto de Wikidata) | ✓ | ✓ |
| 12 | Cumaná / Cumaná | reutilizada (pack Pro, `ci:ve-cumana`) | 10.450, -64.180 | [Q319476](https://www.wikidata.org/wiki/Q319476) Cumaná | ✓ | ✓ |

## Alemania

| # | Ciudad (ES / EN) | Origen | Coordenadas | Wikidata | Dentro del país | Foto |
|---|---|---|---|---|---|---|
| 1 | Berlín / Berlin | reutilizada (del mundo, `berlin`) | 52.520, 13.410 | [Q64](https://www.wikidata.org/wiki/Q64) Berlín | ✓ | ✓ |
| 2 | Múnich / Munich | reutilizada (del mundo, `munich`) | 48.140, 11.580 | [Q1726](https://www.wikidata.org/wiki/Q1726) Múnich | ✓ | ✓ |
| 3 | Hamburgo / Hamburg | reutilizada (del mundo, `hamburgo`) | 53.550, 9.990 | [Q1055](https://www.wikidata.org/wiki/Q1055) Hamburgo | ✓ | ✓ |
| 4 | Fráncfort / Frankfurt | reutilizada (del mundo, `francfort`) | 50.110, 8.680 | [Q1794](https://www.wikidata.org/wiki/Q1794) Fráncfort del Meno | ✓ | ✓ |
| 5 | Colonia / Cologne | nueva (`cq:de-colonia`) | 50.942, 6.958 | [Q365](https://www.wikidata.org/wiki/Q365) Colonia | ✓ | — |
| 6 | Stuttgart / Stuttgart | nueva (`cq:de-stuttgart`) | 48.778, 9.180 | [Q1022](https://www.wikidata.org/wiki/Q1022) Stuttgart | ✓ | — |
| 7 | Düsseldorf / Düsseldorf | nueva (`cq:de-dusseldorf`) | 51.226, 6.777 | [Q1718](https://www.wikidata.org/wiki/Q1718) Düsseldorf | ✓ | — |
| 8 | Dortmund / Dortmund | nueva (`cq:de-dortmund`) | 51.514, 7.465 | [Q1295](https://www.wikidata.org/wiki/Q1295) Dortmund | ✓ | — |
| 9 | Leipzig / Leipzig | nueva (`cq:de-leipzig`) | 51.341, 12.375 | [Q2079](https://www.wikidata.org/wiki/Q2079) Leipzig | ✓ | — |
| 10 | Dresde / Dresden | nueva (`cq:de-dresde`) | 51.049, 13.738 | [Q1731](https://www.wikidata.org/wiki/Q1731) Dresde | ✓ | — |
| 11 | Hannover / Hanover | nueva (`cq:de-hannover`) | 52.374, 9.739 | [Q1715](https://www.wikidata.org/wiki/Q1715) Hannover | ✓ | — |
| 12 | Núremberg / Nuremberg | nueva (`cq:de-nuremberg`) | 49.454, 11.078 | [Q2090](https://www.wikidata.org/wiki/Q2090) Núremberg | ✓ | — |

## Reino Unido

| # | Ciudad (ES / EN) | Origen | Coordenadas | Wikidata | Dentro del país | Foto |
|---|---|---|---|---|---|---|
| 1 | Londres / London | reutilizada (del mundo, `londres`) | 51.510, -0.130 | [Q84](https://www.wikidata.org/wiki/Q84) Londres | ✓ | ✓ |
| 2 | Edimburgo / Edinburgh | reutilizada (del mundo, `edimburgo`) | 55.950, -3.190 | [Q23436](https://www.wikidata.org/wiki/Q23436) Edimburgo | ✓ | ✓ |
| 3 | Mánchester / Manchester | reutilizada (del mundo, `manchester`) | 53.480, -2.240 | [Q18125](https://www.wikidata.org/wiki/Q18125) Mánchester | ✓ | ✓ |
| 4 | Liverpool / Liverpool | nueva (`cq:gb-liverpool`) | 53.407, -2.992 | [Q24826](https://www.wikidata.org/wiki/Q24826) Liverpool | ✓ | — |
| 5 | Birmingham / Birmingham | nueva (`cq:gb-birmingham`) | 52.480, -1.898 | [Q20986424](https://www.wikidata.org/wiki/Q20986424)  | ✓ | — |
| 6 | Glasgow / Glasgow | nueva (`cq:gb-glasgow`) | 55.861, -4.250 | [Q4093](https://www.wikidata.org/wiki/Q4093) Glasgow | ✓ | — |
| 7 | Leeds / Leeds | nueva (`cq:gb-leeds`) | 53.799, -1.549 | [Q774015](https://www.wikidata.org/wiki/Q774015) Ciudad de Leeds | ✓ | — |
| 8 | Bristol / Bristol | nueva (`cq:gb-bristol`) | 51.454, -2.598 | [Q23154](https://www.wikidata.org/wiki/Q23154) Bristol | ✓ | — |
| 9 | Cardiff / Cardiff | nueva (`cq:gb-cardiff`) | 51.482, -3.179 | [Q10690](https://www.wikidata.org/wiki/Q10690)  | ✓ | — |
| 10 | Belfast / Belfast | nueva (`cq:gb-belfast`) | 54.597, -5.930 | [Q10686](https://www.wikidata.org/wiki/Q10686) Belfast | ✓ | — |
| 11 | Oxford / Oxford | nueva (`cq:gb-oxford`) | 51.752, -1.258 | [Q34217](https://www.wikidata.org/wiki/Q34217) Oxford | ✓ | — |
| 12 | Cambridge / Cambridge | nueva (`cq:gb-cambridge`) | 52.208, 0.122 | [Q350](https://www.wikidata.org/wiki/Q350) Cambridge | ✓ | — |

## Portugal

| # | Ciudad (ES / EN) | Origen | Coordenadas | Wikidata | Dentro del país | Foto |
|---|---|---|---|---|---|---|
| 1 | Lisboa / Lisbon | reutilizada (del mundo, `lisboa`) | 38.720, -9.140 | [Q597](https://www.wikidata.org/wiki/Q597) Lisboa | ✓ | ✓ |
| 2 | Oporto / Porto | reutilizada (del mundo, `oporto`) | 41.160, -8.630 | [Q36433](https://www.wikidata.org/wiki/Q36433) Oporto | ✓ | ✓ |
| 3 | Coímbra / Coimbra | nueva (`cq:pt-coimbra`) | 40.211, -8.429 | [Q244517](https://www.wikidata.org/wiki/Q244517) Coímbra distrito | ✓ | — |
| 4 | Braga / Braga | nueva (`cq:pt-braga`) | 41.550, -8.420 | [Q3344946](https://www.wikidata.org/wiki/Q3344946) Braga | ✓ | — |
| 5 | Faro / Faro | nueva (`cq:pt-faro`) | 37.016, -7.935 | [Q159457](https://www.wikidata.org/wiki/Q159457) Faro | ✓ | — |
| 6 | Évora / Évora | nueva (`cq:pt-evora`) | 38.570, -7.910 | [Q274118](https://www.wikidata.org/wiki/Q274118) Évora | ✓ | — |
| 7 | Aveiro / Aveiro | nueva (`cq:pt-aveiro`) | 40.641, -8.654 | [Q210527](https://www.wikidata.org/wiki/Q210527) Distrito de Aveiro | ✓ | — |
| 8 | Guimarães / Guimarães | nueva (`cq:pt-guimaraes`) | 41.445, -8.291 | [Q170903](https://www.wikidata.org/wiki/Q170903) Guimarães | ✓ | — |
| 9 | Setúbal / Setúbal | nueva (`cq:pt-setubal`) | 38.524, -8.893 | [Q173699](https://www.wikidata.org/wiki/Q173699) Setúbal | ✓ | — |
| 10 | Viseu / Viseu | nueva (`cq:pt-viseu`) | 40.661, -7.910 | [Q49278409](https://www.wikidata.org/wiki/Q49278409)  | ✓ | — |
| 11 | Leiria / Leiria | nueva (`cq:pt-leiria`) | 39.743, -8.807 | [Q206933](https://www.wikidata.org/wiki/Q206933) Leiría | ✓ | — |
| 12 | Sintra / Sintra | nueva (`cq:pt-sintra`) | 38.798, -9.388 | [Q33716124](https://www.wikidata.org/wiki/Q33716124) Sintra | ✓ | — |

## Polonia

| # | Ciudad (ES / EN) | Origen | Coordenadas | Wikidata | Dentro del país | Foto |
|---|---|---|---|---|---|---|
| 1 | Varsovia / Warsaw | reutilizada (del mundo, `varsovia`) | 52.230, 21.010 | [Q270](https://www.wikidata.org/wiki/Q270) Varsovia | ✓ | ✓ |
| 2 | Cracovia / Kraków | reutilizada (del mundo, `cracovia`) | 50.060, 19.940 | [Q31487](https://www.wikidata.org/wiki/Q31487) Cracovia | ✓ | ✓ |
| 3 | Gdansk / Gdańsk | reutilizada (del mundo, `gdansk`) | 54.350, 18.650 | [Q1792](https://www.wikidata.org/wiki/Q1792) Gdansk | ✓ | ✓ |
| 4 | Breslavia / Wrocław | nueva (`cq:pl-breslavia`) | 51.110, 17.032 | [Q1799](https://www.wikidata.org/wiki/Q1799) Breslavia | ✓ | — |
| 5 | Poznan / Poznań | nueva (`cq:pl-poznan`) | 52.408, 16.934 | [Q268](https://www.wikidata.org/wiki/Q268)  | ✓ | — |
| 6 | Lodz / Łódź | nueva (`cq:pl-lodz`) | 51.750, 19.467 | [Q580](https://www.wikidata.org/wiki/Q580) Lodz | ✓ | — |
| 7 | Szczecin / Szczecin | nueva (`cq:pl-szczecin`) | 53.425, 14.555 | [Q393](https://www.wikidata.org/wiki/Q393) Szczecin | ✓ | — |
| 8 | Lublin / Lublin | nueva (`cq:pl-lublin`) | 51.250, 22.567 | [Q37333](https://www.wikidata.org/wiki/Q37333) Lublin | ✓ | — |
| 9 | Katowice / Katowice | nueva (`cq:pl-katowice`) | 50.250, 19.000 | [Q588](https://www.wikidata.org/wiki/Q588) Katowice | ✓ | — |
| 10 | Bialystok / Białystok | nueva (`cq:pl-bialystok`) | 53.127, 23.157 | [Q31915550](https://www.wikidata.org/wiki/Q31915550)  | ✓ | — |
| 11 | Bydgoszcz / Bydgoszcz | nueva (`cq:pl-bydgoszcz`) | 53.117, 18.000 | [Q41252](https://www.wikidata.org/wiki/Q41252) Bydgoszcz | ✓ | — |
| 12 | Rzeszów / Rzeszów | nueva (`cq:pl-rzeszow`) | 50.041, 21.999 | [Q598](https://www.wikidata.org/wiki/Q598) Resovia | ✓ | — |

## Grecia

| # | Ciudad (ES / EN) | Origen | Coordenadas | Wikidata | Dentro del país | Foto |
|---|---|---|---|---|---|---|
| 1 | Atenas / Athens | reutilizada (del mundo, `atenas`) | 37.980, 23.730 | [Q1524](https://www.wikidata.org/wiki/Q1524) Atenas | ✓ | ✓ |
| 2 | Salónica / Thessaloniki | nueva (`cq:gr-salonica`) | 40.640, 22.936 | [Q17151](https://www.wikidata.org/wiki/Q17151) Salónica | ✓ | — |
| 3 | Patras / Patras | nueva (`cq:gr-patras`) | 38.246, 21.735 | [Q133123](https://www.wikidata.org/wiki/Q133123) Patras | ✓ | — |
| 4 | Heraclión / Heraklion | nueva (`cq:gr-heraclion`) | 35.340, 25.134 | [Q160544](https://www.wikidata.org/wiki/Q160544) Heraclión | ✓ | — |
| 5 | Larisa / Larissa | nueva (`cq:gr-larisa`) | 39.639, 22.413 | [Q178405](https://www.wikidata.org/wiki/Q178405) Lárisa | ✓ | — |
| 6 | Volos / Volos | nueva (`cq:gr-volos`) | 39.361, 22.942 | [Q200036](https://www.wikidata.org/wiki/Q200036) Volos | ✓ | — |
| 7 | Ioánina / Ioannina | nueva (`cq:gr-ioanina`) | 39.664, 20.852 | [Q183199](https://www.wikidata.org/wiki/Q183199) Ioánina | ✓ | — |
| 8 | Kavala / Kavala | nueva (`cq:gr-kavala`) | 40.940, 24.407 | [Q187352](https://www.wikidata.org/wiki/Q187352) Kavala | ✓ | — |
| 9 | Kalamata / Kalamata | nueva (`cq:gr-kalamata`) | 37.038, 22.111 | [Q167895](https://www.wikidata.org/wiki/Q167895) Kalamata | ✓ | — |
| 10 | Corfú / Corfu | nueva (`cq:gr-corfu`) | 39.624, 19.921 | [Q205832](https://www.wikidata.org/wiki/Q205832) Corfú | costa (20 km) | — |
| 11 | Alejandrópolis / Alexandroupoli | nueva (`cq:gr-alejandropolis`) | 40.850, 25.867 | [Q190847](https://www.wikidata.org/wiki/Q190847) Alejandrópolis | ✓ | — |
| 12 | Esparta / Sparta | nueva (`cq:gr-esparta`) | 37.074, 22.429 | [Q2308046](https://www.wikidata.org/wiki/Q2308046) Esparta | ✓ | — |

## Suecia

| # | Ciudad (ES / EN) | Origen | Coordenadas | Wikidata | Dentro del país | Foto |
|---|---|---|---|---|---|---|
| 1 | Estocolmo / Stockholm | reutilizada (del mundo, `estocolmo`) | 59.330, 18.070 | [Q1754](https://www.wikidata.org/wiki/Q1754) Estocolmo | ✓ | ✓ |
| 2 | Gotemburgo / Gothenburg | reutilizada (del mundo, `gotemburgo`) | 57.710, 11.970 | [Q25287](https://www.wikidata.org/wiki/Q25287) Gotemburgo | ✓ | ✓ |
| 3 | Malmö / Malmö | nueva (`cq:se-malmo`) | 55.583, 13.000 | [Q2211](https://www.wikidata.org/wiki/Q2211) Malmö | ✓ | — |
| 4 | Upsala / Uppsala | nueva (`cq:se-upsala`) | 59.867, 17.633 | [Q59091](https://www.wikidata.org/wiki/Q59091) Upsala | ✓ | — |
| 5 | Linköping / Linköping | nueva (`cq:se-linkoping`) | 58.409, 15.626 | [Q25413](https://www.wikidata.org/wiki/Q25413) Linköping | ✓ | — |
| 6 | Örebro / Örebro | nueva (`cq:se-orebro`) | 59.267, 15.197 | [Q25732](https://www.wikidata.org/wiki/Q25732) Örebro | ✓ | — |
| 7 | Västerås / Västerås | nueva (`cq:se-vasteras`) | 59.617, 16.542 | [Q25412](https://www.wikidata.org/wiki/Q25412) Västerås | ✓ | — |
| 8 | Umeå / Umeå | nueva (`cq:se-umea`) | 63.828, 20.271 | [Q25579](https://www.wikidata.org/wiki/Q25579) Umeå | costa (2 km) | — |
| 9 | Luleå / Luleå | nueva (`cq:se-lulea`) | 65.584, 22.192 | [Q26268](https://www.wikidata.org/wiki/Q26268) Luleå | costa (8 km) | — |
| 10 | Kiruna / Kiruna | nueva (`cq:se-kiruna`) | 67.855, 20.223 | [Q499474](https://www.wikidata.org/wiki/Q499474) Kiruna | ✓ | — |
| 11 | Helsingborg / Helsingborg | nueva (`cq:se-helsingborg`) | 56.042, 12.721 | [Q25411](https://www.wikidata.org/wiki/Q25411) Helsingborg | ✓ | — |
| 12 | Gävle / Gävle | nueva (`cq:se-gavle`) | 60.675, 17.144 | [Q25748](https://www.wikidata.org/wiki/Q25748) Gävle | ✓ | — |

## Turquía

| # | Ciudad (ES / EN) | Origen | Coordenadas | Wikidata | Dentro del país | Foto |
|---|---|---|---|---|---|---|
| 1 | Estambul / Istanbul | reutilizada (del mundo, `estambul`) | 41.010, 28.980 | [Q406](https://www.wikidata.org/wiki/Q406) Estambul | costa (15 km) | ✓ |
| 2 | Ankara / Ankara | reutilizada (del mundo, `ankara`) | 39.930, 32.860 | [Q3640](https://www.wikidata.org/wiki/Q3640) Ankara | ✓ | ✓ |
| 3 | Izmir / İzmir | reutilizada (del mundo, `izmir`) | 38.420, 27.130 | [Q35997](https://www.wikidata.org/wiki/Q35997) Esmirna | ✓ | ✓ |
| 4 | Antalya / Antalya | nueva (`cq:tr-antalya`) | 36.908, 30.696 | [Q6487](https://www.wikidata.org/wiki/Q6487) Antalya | ✓ | — |
| 5 | Bursa / Bursa | nueva (`cq:tr-bursa`) | 40.191, 29.081 | [Q40738](https://www.wikidata.org/wiki/Q40738) Bursa | ✓ | — |
| 6 | Adana / Adana | nueva (`cq:tr-adana`) | 36.986, 35.325 | [Q38545](https://www.wikidata.org/wiki/Q38545) Adana | ✓ | — |
| 7 | Gaziantep / Gaziantep | nueva (`cq:tr-gaziantep`) | 37.063, 37.379 | [Q93338](https://www.wikidata.org/wiki/Q93338) Gaziantep | ✓ | — |
| 8 | Konya / Konya | nueva (`cq:tr-konya`) | 37.873, 32.492 | [Q79857](https://www.wikidata.org/wiki/Q79857) Konya | ✓ | — |
| 9 | Trebisonda / Trabzon | nueva (`cq:tr-trebisonda`) | 41.003, 39.718 | [Q29787863](https://www.wikidata.org/wiki/Q29787863) Trebisonda | ✓ | — |
| 10 | Kayseri / Kayseri | nueva (`cq:tr-kayseri`) | 38.722, 35.487 | [Q48338](https://www.wikidata.org/wiki/Q48338) Kayseri | ✓ | — |
| 11 | Diyarbakır / Diyarbakır | nueva (`cq:tr-diyarbak-r`) | 37.911, 40.237 | [Q83387](https://www.wikidata.org/wiki/Q83387) Diyarbakır | ✓ | — |
| 12 | Erzurum / Erzurum | nueva (`cq:tr-erzurum`) | 39.906, 41.274 | [Q2317435](https://www.wikidata.org/wiki/Q2317435)  | ✓ | — |

## Japón

| # | Ciudad (ES / EN) | Origen | Coordenadas | Wikidata | Dentro del país | Foto |
|---|---|---|---|---|---|---|
| 1 | Tokio / Tokyo | reutilizada (del mundo, `tokio`) | 35.680, 139.690 | [Q1490](https://www.wikidata.org/wiki/Q1490) Tokio | ✓ | ✓ |
| 2 | Osaka / Osaka | reutilizada (del mundo, `osaka`) | 34.690, 135.500 | [Q35765](https://www.wikidata.org/wiki/Q35765) Osaka | ✓ | ✓ |
| 3 | Kioto / Kyoto | nueva (`cq:jp-kioto`) | 35.012, 135.768 | [Q34600](https://www.wikidata.org/wiki/Q34600) Kioto | ✓ | — |
| 4 | Yokohama / Yokohama | nueva (`cq:jp-yokohama`) | 35.450, 139.634 | [Q38283](https://www.wikidata.org/wiki/Q38283) Yokohama | ✓ | — |
| 5 | Nagoya / Nagoya | nueva (`cq:jp-nagoya`) | 35.181, 136.906 | [Q11751](https://www.wikidata.org/wiki/Q11751) Nagoya | ✓ | — |
| 6 | Sapporo / Sapporo | nueva (`cq:jp-sapporo`) | 43.062, 141.354 | [Q37951](https://www.wikidata.org/wiki/Q37951) Sapporo | ✓ | — |
| 7 | Fukuoka / Fukuoka | nueva (`cq:jp-fukuoka`) | 33.590, 130.402 | [Q26600](https://www.wikidata.org/wiki/Q26600) Fukuoka | ✓ | — |
| 8 | Hiroshima / Hiroshima | nueva (`cq:jp-hiroshima`) | 34.391, 132.452 | [Q34664](https://www.wikidata.org/wiki/Q34664) Hiroshima | ✓ | — |
| 9 | Nagasaki / Nagasaki | nueva (`cq:jp-nagasaki`) | 32.749, 129.880 | [Q38234](https://www.wikidata.org/wiki/Q38234) Nagasaki | ✓ | — |
| 10 | Kobe / Kobe | nueva (`cq:jp-kobe`) | 34.690, 135.195 | [Q48320](https://www.wikidata.org/wiki/Q48320) Kōbe | ✓ | — |
| 11 | Sendai / Sendai | nueva (`cq:jp-sendai`) | 38.268, 140.869 | [Q46747](https://www.wikidata.org/wiki/Q46747) Sendai | ✓ | — |
| 12 | Nara / Nara | nueva (`cq:jp-nara`) | 34.685, 135.805 | [Q169134](https://www.wikidata.org/wiki/Q169134) Nara | ✓ | — |

## China

| # | Ciudad (ES / EN) | Origen | Coordenadas | Wikidata | Dentro del país | Foto |
|---|---|---|---|---|---|---|
| 1 | Pekín / Beijing | reutilizada (del mundo, `pekin`) | 39.900, 116.400 | [Q956](https://www.wikidata.org/wiki/Q956) Pekín | ✓ | ✓ |
| 2 | Shanghái / Shanghai | reutilizada (del mundo, `shanghai`) | 31.230, 121.470 | [Q8686](https://www.wikidata.org/wiki/Q8686) Shanghái | ✓ | ✓ |
| 3 | Cantón / Guangzhou | reutilizada (del mundo, `canton`) | 23.130, 113.260 | [Q16572](https://www.wikidata.org/wiki/Q16572) Cantón | ✓ | ✓ |
| 4 | Shenzhen / Shenzhen | reutilizada (del mundo, `shenzhen`) | 22.540, 114.060 | [Q15174](https://www.wikidata.org/wiki/Q15174) Shenzhen | ✓ | ✓ |
| 5 | Chengdú / Chengdu | reutilizada (del mundo, `chengdu`) | 30.570, 104.070 | [Q30002](https://www.wikidata.org/wiki/Q30002) Chengdu (10 km del punto de Wikidata) | ✓ | ✓ |
| 6 | Xi'an / Xi'an | nueva (`cq:cn-xi-an`) | 34.261, 108.942 | [Q5826](https://www.wikidata.org/wiki/Q5826) Xi'an | ✓ | — |
| 7 | Wuhan / Wuhan | nueva (`cq:cn-wuhan`) | 30.595, 114.297 | [Q11746](https://www.wikidata.org/wiki/Q11746) Wuhan | ✓ | — |
| 8 | Hangzhou / Hangzhou | nueva (`cq:cn-hangzhou`) | 30.250, 120.168 | [Q4970](https://www.wikidata.org/wiki/Q4970) Hangzhou | ✓ | — |
| 9 | Nankín / Nanjing | nueva (`cq:cn-nankin`) | 32.061, 118.779 | [Q16666](https://www.wikidata.org/wiki/Q16666) Nankín | ✓ | — |
| 10 | Harbin / Harbin | nueva (`cq:cn-harbin`) | 45.750, 126.633 | [Q42956](https://www.wikidata.org/wiki/Q42956) Harbin | ✓ | — |
| 11 | Chongqing / Chongqing | nueva (`cq:cn-chongqing`) | 29.550, 106.507 | [Q11725](https://www.wikidata.org/wiki/Q11725) Chongqing | ✓ | — |
| 12 | Lhasa / Lhasa | nueva (`cq:cn-lhasa`) | 29.646, 91.141 | [Q5869](https://www.wikidata.org/wiki/Q5869) Lhasa | ✓ | — |

## India

| # | Ciudad (ES / EN) | Origen | Coordenadas | Wikidata | Dentro del país | Foto |
|---|---|---|---|---|---|---|
| 1 | Nueva Delhi / New Delhi | reutilizada (del mundo, `nueva-delhi`) | 28.610, 77.210 | [Q987](https://www.wikidata.org/wiki/Q987) Nueva Delhi | ✓ | ✓ |
| 2 | Bombay / Mumbai | reutilizada (del mundo, `bombay`) | 19.080, 72.880 | [Q1156](https://www.wikidata.org/wiki/Q1156) Bombay | costa (11 km) | ✓ |
| 3 | Calcuta / Kolkata | reutilizada (del mundo, `calcuta`) | 22.570, 88.360 | [Q1348](https://www.wikidata.org/wiki/Q1348) Calcuta | ✓ | ✓ |
| 4 | Chennai / Chennai | reutilizada (del mundo, `chennai`) | 13.080, 80.270 | [Q1352](https://www.wikidata.org/wiki/Q1352) Chennai | costa (21 km) | ✓ |
| 5 | Bangalore / Bengaluru | reutilizada (del mundo, `bangalore`) | 12.970, 77.590 | [Q1355](https://www.wikidata.org/wiki/Q1355) Bangalore | ✓ | ✓ |
| 6 | Hyderabad / Hyderabad | reutilizada (del mundo, `hyderabad`) | 17.390, 78.490 | [Q1361](https://www.wikidata.org/wiki/Q1361) Haidrābād | ✓ | ✓ |
| 7 | Jaipur / Jaipur | nueva (`cq:in-jaipur`) | 26.915, 75.820 | [Q66485](https://www.wikidata.org/wiki/Q66485) Jaipur | ✓ | — |
| 8 | Agra / Agra | nueva (`cq:in-agra`) | 27.180, 78.020 | [Q42941](https://www.wikidata.org/wiki/Q42941) Agra | ✓ | — |
| 9 | Benarés / Varanasi | nueva (`cq:in-benares`) | 25.319, 83.013 | [Q79980](https://www.wikidata.org/wiki/Q79980) Benarés | ✓ | — |
| 10 | Ahmedabad / Ahmedabad | nueva (`cq:in-ahmedabad`) | 23.022, 72.580 | [Q1070](https://www.wikidata.org/wiki/Q1070) Ahmedabad | ✓ | — |
| 11 | Pune / Pune | nueva (`cq:in-pune`) | 18.521, 73.855 | [Q1538](https://www.wikidata.org/wiki/Q1538) Pune | ✓ | — |
| 12 | Amritsar / Amritsar | nueva (`cq:in-amritsar`) | 31.627, 74.877 | [Q48403](https://www.wikidata.org/wiki/Q48403) Amritsar | ✓ | — |

## Corea del Sur

| # | Ciudad (ES / EN) | Origen | Coordenadas | Wikidata | Dentro del país | Foto |
|---|---|---|---|---|---|---|
| 1 | Seúl / Seoul | reutilizada (del mundo, `seul`) | 37.570, 126.980 | [Q8684](https://www.wikidata.org/wiki/Q8684) Seúl | ✓ | ✓ |
| 2 | Busan / Busan | nueva (`cq:kr-busan`) | 35.180, 129.075 | [Q16520](https://www.wikidata.org/wiki/Q16520) Busan | ✓ | — |
| 3 | Incheon / Incheon | nueva (`cq:kr-incheon`) | 37.464, 126.649 | [Q20934](https://www.wikidata.org/wiki/Q20934) Incheon | ✓ | — |
| 4 | Daegu / Daegu | nueva (`cq:kr-daegu`) | 35.872, 128.602 | [Q20927](https://www.wikidata.org/wiki/Q20927) Daegu | ✓ | — |
| 5 | Daejeon / Daejeon | nueva (`cq:kr-daejeon`) | 36.350, 127.385 | [Q20921](https://www.wikidata.org/wiki/Q20921) Daejeon | ✓ | — |
| 6 | Gwangju / Gwangju | nueva (`cq:kr-gwangju`) | 35.167, 126.917 | [Q41283](https://www.wikidata.org/wiki/Q41283) Gwangju | ✓ | — |
| 7 | Ulsan / Ulsan | nueva (`cq:kr-ulsan`) | 35.550, 129.317 | [Q41278](https://www.wikidata.org/wiki/Q41278) Ulsan | ✓ | — |
| 8 | Suwon / Suwon | nueva (`cq:kr-suwon`) | 37.286, 127.010 | [Q20714](https://www.wikidata.org/wiki/Q20714) Suwon | ✓ | — |
| 9 | Jeonju / Jeonju | nueva (`cq:kr-jeonju`) | 35.824, 127.147 | [Q42140](https://www.wikidata.org/wiki/Q42140) Jeonju | ✓ | — |
| 10 | Gyeongju / Gyeongju | nueva (`cq:kr-gyeongju`) | 35.850, 129.217 | [Q42097](https://www.wikidata.org/wiki/Q42097) Gyeongju | ✓ | — |
| 11 | Chuncheon / Chuncheon | nueva (`cq:kr-chuncheon`) | 37.875, 127.734 | [Q42148](https://www.wikidata.org/wiki/Q42148) Chuncheon | ✓ | — |
| 12 | Pohang / Pohang | nueva (`cq:kr-pohang`) | 36.032, 129.365 | [Q42157](https://www.wikidata.org/wiki/Q42157) Pohang | ✓ | — |

## Tailandia

| # | Ciudad (ES / EN) | Origen | Coordenadas | Wikidata | Dentro del país | Foto |
|---|---|---|---|---|---|---|
| 1 | Bangkok / Bangkok | reutilizada (del mundo, `bangkok`) | 13.760, 100.500 | [Q1861](https://www.wikidata.org/wiki/Q1861) Bangkok | ✓ | ✓ |
| 2 | Chiang Mai / Chiang Mai | reutilizada (del mundo, `chiang-mai`) | 18.790, 98.980 | [Q52028](https://www.wikidata.org/wiki/Q52028) Chiang Mai | ✓ | ✓ |
| 3 | Phuket / Phuket | nueva (`cq:th-phuket`) | 7.888, 98.397 | [Q844430](https://www.wikidata.org/wiki/Q844430) Phuket | ✓ | — |
| 4 | Pattaya / Pattaya | nueva (`cq:th-pattaya`) | 12.950, 100.893 | [Q170919](https://www.wikidata.org/wiki/Q170919) Pattaya | ✓ | — |
| 5 | Ayutthaya / Ayutthaya | nueva (`cq:th-ayutthaya`) | 14.359, 100.576 | [Q203370](https://www.wikidata.org/wiki/Q203370) Ayutthaya | ✓ | — |
| 6 | Chiang Rai / Chiang Rai | nueva (`cq:th-chiang-rai`) | 19.909, 99.828 | [Q856772](https://www.wikidata.org/wiki/Q856772) Chiang Rai | ✓ | — |
| 7 | Hat Yai / Hat Yai | nueva (`cq:th-hat-yai`) | 7.002, 100.457 | [Q475518](https://www.wikidata.org/wiki/Q475518)  | ✓ | — |
| 8 | Sukhothai / Sukhothai | nueva (`cq:th-sukhothai`) | 17.006, 99.826 | [Q380764](https://www.wikidata.org/wiki/Q380764) Provincia de Sukhothai | ✓ | — |
| 9 | Nakhon Ratchasima / Nakhon Ratchasima | nueva (`cq:th-nakhon-ratchasima`) | 14.972, 102.100 | [Q271737](https://www.wikidata.org/wiki/Q271737) Provincia de Nakhon Ratchasima | ✓ | — |
| 10 | Khon Kaen / Khon Kaen | nueva (`cq:th-khon-kaen`) | 16.433, 102.833 | [Q876526](https://www.wikidata.org/wiki/Q876526) Khǭnkǣn | ✓ | — |
| 11 | Udon Thani / Udon Thani | nueva (`cq:th-udon-thani`) | 17.425, 102.790 | [Q816331](https://www.wikidata.org/wiki/Q816331) Udǭn Thānī | ✓ | — |
| 12 | Surat Thani / Surat Thani | nueva (`cq:th-surat-thani`) | 9.140, 99.331 | [Q840951](https://www.wikidata.org/wiki/Q840951) Surat Thani | ✓ | — |

## Indonesia

| # | Ciudad (ES / EN) | Origen | Coordenadas | Wikidata | Dentro del país | Foto |
|---|---|---|---|---|---|---|
| 1 | Yakarta / Jakarta | reutilizada (del mundo, `yakarta`) | -6.210, 106.850 | [Q3630](https://www.wikidata.org/wiki/Q3630) Yakarta | ✓ | ✓ |
| 2 | Surabaya / Surabaya | nueva (`cq:id-surabaya`) | -7.246, 112.738 | [Q11462](https://www.wikidata.org/wiki/Q11462) Surabaya | ✓ | — |
| 3 | Bandung / Bandung | nueva (`cq:id-bandung`) | -6.922, 107.607 | [Q10389](https://www.wikidata.org/wiki/Q10389) Bandung | ✓ | — |
| 4 | Medan / Medan | nueva (`cq:id-medan`) | 3.589, 98.674 | [Q5972](https://www.wikidata.org/wiki/Q5972) Medan | ✓ | — |
| 5 | Yogyakarta / Yogyakarta | nueva (`cq:id-yogyakarta`) | -7.801, 110.364 | [Q3741](https://www.wikidata.org/wiki/Q3741) Región Daérah Istiméwa Yogyakarta Yogyakarta | ✓ | — |
| 6 | Denpasar / Denpasar | nueva (`cq:id-denpasar`) | -8.672, 115.234 | [Q11506](https://www.wikidata.org/wiki/Q11506) Denpasar | costa (15 km) | — |
| 7 | Macasar / Makassar | nueva (`cq:id-macasar`) | -5.140, 119.422 | [Q24828295](https://www.wikidata.org/wiki/Q24828295)  | costa (2 km) | — |
| 8 | Semarang / Semarang | nueva (`cq:id-semarang`) | -6.990, 110.422 | [Q11025](https://www.wikidata.org/wiki/Q11025) Semarang | ✓ | — |
| 9 | Palembang / Palembang | nueva (`cq:id-palembang`) | -2.983, 104.764 | [Q8131](https://www.wikidata.org/wiki/Q8131) Palembang | ✓ | — |
| 10 | Manado / Manado | nueva (`cq:id-manado`) | 1.493, 124.841 | [Q15847](https://www.wikidata.org/wiki/Q15847) Manado | costa (2 km) | — |
| 11 | Balikpapan / Balikpapan | nueva (`cq:id-balikpapan`) | -1.238, 116.856 | [Q14492](https://www.wikidata.org/wiki/Q14492) Balikpapan | ✓ | — |
| 12 | Banda Aceh / Banda Aceh | nueva (`cq:id-banda-aceh`) | 5.550, 95.317 | [Q5779](https://www.wikidata.org/wiki/Q5779) Banda Aceh | costa (8 km) | — |

## Egipto

| # | Ciudad (ES / EN) | Origen | Coordenadas | Wikidata | Dentro del país | Foto |
|---|---|---|---|---|---|---|
| 1 | El Cairo / Cairo | reutilizada (del mundo, `el-cairo`) | 30.040, 31.240 | [Q85](https://www.wikidata.org/wiki/Q85) El Cairo | ✓ | ✓ |
| 2 | Alejandría / Alexandria | reutilizada (del mundo, `alejandria`) | 31.200, 29.920 | [Q87](https://www.wikidata.org/wiki/Q87) Alejandría | ✓ | ✓ |
| 3 | Luxor / Luxor | nueva (`cq:eg-luxor`) | 25.697, 32.644 | [Q130514](https://www.wikidata.org/wiki/Q130514) Luxor | ✓ | — |
| 4 | Asuán / Aswan | nueva (`cq:eg-asuan`) | 24.089, 32.900 | [Q29888](https://www.wikidata.org/wiki/Q29888) Asuán | ✓ | — |
| 5 | Giza / Giza | nueva (`cq:eg-giza`) | 29.987, 31.212 | [Q81788](https://www.wikidata.org/wiki/Q81788) Guiza | ✓ | — |
| 6 | Sharm el-Sheij / Sharm El Sheikh | nueva (`cq:eg-sharm-el-sheij`) | 27.852, 34.305 | [Q644](https://www.wikidata.org/wiki/Q644) Sharm el-Sheij | costa (11 km) | — |
| 7 | Hurghada / Hurghada | nueva (`cq:eg-hurghada`) | 27.258, 33.812 | [Q187284](https://www.wikidata.org/wiki/Q187284) Hurgada | costa (23 km) | — |
| 8 | Puerto Saíd / Port Said | nueva (`cq:eg-puerto-said`) | 31.262, 32.306 | [Q134509](https://www.wikidata.org/wiki/Q134509) Puerto Saíd | costa (4 km) | — |
| 9 | Suez / Suez | nueva (`cq:eg-suez`) | 29.967, 32.533 | [Q134514](https://www.wikidata.org/wiki/Q134514) Suez | ✓ | — |
| 10 | Mansura / Mansoura | nueva (`cq:eg-mansura`) | 31.050, 31.383 | [Q223587](https://www.wikidata.org/wiki/Q223587) El Mansurá | ✓ | — |
| 11 | Tanta / Tanta | nueva (`cq:eg-tanta`) | 30.783, 31.000 | [Q271771](https://www.wikidata.org/wiki/Q271771) Tanta | ✓ | — |
| 12 | Ismailía / Ismailia | nueva (`cq:eg-ismailia`) | 30.600, 32.283 | [Q31067](https://www.wikidata.org/wiki/Q31067) Ismailia | ✓ | — |

## Marruecos

| # | Ciudad (ES / EN) | Origen | Coordenadas | Wikidata | Dentro del país | Foto |
|---|---|---|---|---|---|---|
| 1 | Rabat / Rabat | reutilizada (del mundo, `rabat`) | 34.020, -6.840 | [Q3551](https://www.wikidata.org/wiki/Q3551) Rabat | ✓ | ✓ |
| 2 | Casablanca / Casablanca | reutilizada (del mundo, `casablanca`) | 33.570, -7.590 | [Q7903](https://www.wikidata.org/wiki/Q7903) Casablanca | ✓ | ✓ |
| 3 | Marrakech / Marrakesh | reutilizada (del mundo, `marrakech`) | 31.630, -8.000 | [Q101625](https://www.wikidata.org/wiki/Q101625) Marrakech | ✓ | ✓ |
| 4 | Fez / Fez | reutilizada (del mundo, `fez`) | 34.030, -5.000 | [Q80985](https://www.wikidata.org/wiki/Q80985) Fez | ✓ | ✓ |
| 5 | Tánger / Tangier | nueva (`cq:ma-tanger`) | 35.770, -5.804 | [Q126148](https://www.wikidata.org/wiki/Q126148) Tánger | isla fuera del mapa 1:110m (33 km) | — |
| 6 | Agadir / Agadir | nueva (`cq:ma-agadir`) | 30.420, -9.598 | [Q33658430](https://www.wikidata.org/wiki/Q33658430) Agadir | ✓ | — |
| 7 | Mequinez / Meknes | nueva (`cq:ma-mequinez`) | 33.883, -5.550 | [Q178663](https://www.wikidata.org/wiki/Q178663) Mequinez | ✓ | — |
| 8 | Oujda / Oujda | nueva (`cq:ma-oujda`) | 34.687, -1.911 | [Q193802](https://www.wikidata.org/wiki/Q193802) Uchda | costa (8 km) | — |
| 9 | Tetuán / Tétouan | nueva (`cq:ma-tetuan`) | 35.570, -5.376 | [Q185157](https://www.wikidata.org/wiki/Q185157) Tetuán | ✓ | — |
| 10 | Chefchaouen / Chefchaouen | nueva (`cq:ma-chefchaouen`) | 35.169, -5.268 | [Q676778](https://www.wikidata.org/wiki/Q676778) Xauen | ✓ | — |
| 11 | Essaouira / Essaouira | nueva (`cq:ma-essaouira`) | 31.513, -9.769 | [Q216939](https://www.wikidata.org/wiki/Q216939) Esauira | costa (7 km) | — |
| 12 | Ouarzazate / Ouarzazate | nueva (`cq:ma-ouarzazate`) | 30.914, -6.906 | [Q12043343](https://www.wikidata.org/wiki/Q12043343)  | ✓ | — |

## Sudáfrica

| # | Ciudad (ES / EN) | Origen | Coordenadas | Wikidata | Dentro del país | Foto |
|---|---|---|---|---|---|---|
| 1 | Johannesburgo / Johannesburg | reutilizada (del mundo, `johannesburgo`) | -26.200, 28.050 | [Q34647](https://www.wikidata.org/wiki/Q34647) Johannesburgo | ✓ | ✓ |
| 2 | Pretoria / Pretoria | reutilizada (del mundo, `pretoria`) | -25.750, 28.190 | [Q3926](https://www.wikidata.org/wiki/Q3926) Pretoria | ✓ | ✓ |
| 3 | Ciudad del Cabo / Cape Town | reutilizada (del mundo, `ciudad-del-cabo`) | -33.930, 18.420 | [Q5465](https://www.wikidata.org/wiki/Q5465) Ciudad del Cabo | ✓ | ✓ |
| 4 | Durban / Durban | reutilizada (del mundo, `durban`) | -29.860, 31.020 | [Q5468](https://www.wikidata.org/wiki/Q5468) Durban | costa (1 km) | ✓ |
| 5 | Port Elizabeth / Port Elizabeth | nueva (`cq:za-port-elizabeth`) | -33.958, 25.600 | [Q125434](https://www.wikidata.org/wiki/Q125434) Puerto Elizabeth | costa (25 km) | — |
| 6 | Bloemfontein / Bloemfontein | nueva (`cq:za-bloemfontein`) | -29.100, 26.217 | [Q37701](https://www.wikidata.org/wiki/Q37701) Bloemfontein | ✓ | — |
| 7 | Kimberley / Kimberley | nueva (`cq:za-kimberley`) | -28.738, 24.764 | [Q125905](https://www.wikidata.org/wiki/Q125905) Kimberley | ✓ | — |
| 8 | East London / East London | nueva (`cq:za-east-london`) | -33.017, 27.905 | [Q209537](https://www.wikidata.org/wiki/Q209537) East London | costa (9 km) | — |
| 9 | Polokwane / Polokwane | nueva (`cq:za-polokwane`) | -23.900, 29.450 | [Q131662](https://www.wikidata.org/wiki/Q131662) Polokwane | ✓ | — |
| 10 | Mbombela / Mbombela | nueva (`cq:za-mbombela`) | -25.466, 30.985 | [Q170313](https://www.wikidata.org/wiki/Q170313) Mbombela | ✓ | — |
| 11 | Pietermaritzburg / Pietermaritzburg | nueva (`cq:za-pietermaritzburg`) | -29.601, 30.380 | [Q185591](https://www.wikidata.org/wiki/Q185591) Pietermaritzburg | ✓ | — |
| 12 | Stellenbosch / Stellenbosch | nueva (`cq:za-stellenbosch`) | -33.937, 18.861 | [Q5460](https://www.wikidata.org/wiki/Q5460) Stellenbosch | ✓ | — |

## Australia

| # | Ciudad (ES / EN) | Origen | Coordenadas | Wikidata | Dentro del país | Foto |
|---|---|---|---|---|---|---|
| 1 | Sídney / Sydney | reutilizada (del mundo, `sidney`) | -33.870, 151.210 | [Q3130](https://www.wikidata.org/wiki/Q3130) Sídney | ✓ | ✓ |
| 2 | Canberra / Canberra | reutilizada (del mundo, `canberra`) | -35.280, 149.130 | [Q3114](https://www.wikidata.org/wiki/Q3114) Canberra | ✓ | ✓ |
| 3 | Melbourne / Melbourne | reutilizada (del mundo, `melbourne`) | -37.810, 144.960 | [Q3141](https://www.wikidata.org/wiki/Q3141) Melbourne | ✓ | ✓ |
| 4 | Perth / Perth | reutilizada (del mundo, `perth`) | -31.950, 115.860 | [Q3183](https://www.wikidata.org/wiki/Q3183) Perth | ✓ | ✓ |
| 5 | Brisbane / Brisbane | nueva (`cq:au-brisbane`) | -27.468, 153.028 | [Q34932](https://www.wikidata.org/wiki/Q34932) Brisbane | ✓ | — |
| 6 | Adelaida / Adelaide | nueva (`cq:au-adelaida`) | -34.928, 138.600 | [Q5112](https://www.wikidata.org/wiki/Q5112) Adelaida | ✓ | — |
| 7 | Darwin / Darwin | nueva (`cq:au-darwin`) | -12.438, 130.841 | [Q11568](https://www.wikidata.org/wiki/Q11568) Darwin | costa (7 km) | — |
| 8 | Cairns / Cairns | nueva (`cq:au-cairns`) | -16.926, 145.775 | [Q189133](https://www.wikidata.org/wiki/Q189133) Cairns | costa (6 km) | — |
| 9 | Alice Springs / Alice Springs | nueva (`cq:au-alice-springs`) | -23.698, 133.881 | [Q57472197](https://www.wikidata.org/wiki/Q57472197)  | ✓ | — |
| 10 | Gold Coast / Gold Coast | nueva (`cq:au-gold-coast`) | -28.017, 153.400 | [Q140075](https://www.wikidata.org/wiki/Q140075) Gold Coast | costa (12 km) | — |
| 11 | Hobart / Hobart | nueva (`cq:au-hobart`) | -42.883, 147.317 | [Q40191](https://www.wikidata.org/wiki/Q40191) Hobart | ✓ | — |
| 12 | Newcastle / Newcastle | nueva (`cq:au-newcastle`) | -32.917, 151.750 | [Q57278](https://www.wikidata.org/wiki/Q57278) Newcastle | ✓ | — |
