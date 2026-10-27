# Conquista · fase C1 · banco de ciudades (para revisar)

Generado por `node scripts/build-conquest-catalog.mjs` desde `src/data/conquestTiers.ts`. Doce ciudades conocidas por
país (decisión CQ-D2). Cada temporada el servidor arma con este banco un paquete de cinco ciudades por país. Todas se
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
