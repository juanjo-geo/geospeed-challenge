# Fase 8 — Fichas de los lugares (revisión)

Generado por `scripts/build-facts.mjs`. Cifras de **Wikidata** (CC0, valor de mejor rango; habitantes = el dato más
reciente) y "Cerca" calculado con el propio catálogo. Los datos curiosos los escribió Claude y **están pendientes de
revisión**: si alguno está mal, se corrige en el JSON de datos curiosos y se vuelve a generar.

- Si un elemento quedó con el id de Wikidata equivocado (cifras absurdas, otro lugar), se corrige en `QID_OVERRIDES`
  del script (o `null` para dejarlo sin cifras).
- Columnas: id de Wikidata (enlace) · nombre que tiene en Wikidata · cifras · lugares cercanos · dato curioso (ES).


## Ciudades del mundo (253)

| Lugar | Wikidata | Cifras | Cerca | Dato curioso |
|---|---|---|---|---|
| Tokio | [Q1490](https://www.wikidata.org/wiki/Q1490) Tokio | 14.264.798 hab. (2022) · 2.194 km² · 6 m | Torre de Tokio, Gran Buda de Kamakura, Honshu | Se llamaba Edo hasta 1868, cuando pasó a llamarse Tokio, que significa capital del este. |
| Pekín | [Q956](https://www.wikidata.org/wiki/Q956) Pekín | 21.893.095 hab. (2020) · 16.411 km² · 43 m | Ciudad Prohibida, Templo del Cielo | Su Ciudad Prohibida fue el palacio de los emperadores chinos durante casi 500 años, bajo las dinastías Ming y Qing. |
| Moscú | [Q649](https://www.wikidata.org/wiki/Q649) Moscú | 13.274.285 hab. (2025) · 2.562 km² · 156 m | Kremlin y Plaza Roja, Catedral de San Basilio | Su metro, inaugurado en 1935, es famoso por estaciones decoradas con mármol, mosaicos y candelabros. |
| Londres | [Q84](https://www.wikidata.org/wiki/Q84) Londres | 8.799.728 hab. (2021) · 1.572 km² · 15 m | Big Ben, Puente de la Torre, Gran Bretaña | Tiene el metro más antiguo del mundo: el Underground abrió en 1863 con trenes de vapor. |
| París | [Q90](https://www.wikidata.org/wiki/Q90) París | 2.103.778 hab. (2023) · 105 km² · 127 m | Torre Eiffel, Catedral de Notre Dame, Río Sena | El Louvre, que antes fue un palacio real, es el museo más visitado del mundo y guarda la Mona Lisa. |
| Berlín | [Q64](https://www.wikidata.org/wiki/Q64) Berlín | 3.913.644 hab. (2025) · 892 km² · 34 m | Puerta de Brandeburgo, Llanura del Norte de Europa | El currywurst, una salchicha con salsa de kétchup y curry, se inventó aquí en 1949 y es su comida callejera emblemática. |
| Roma | [Q220](https://www.wikidata.org/wiki/Q220) Roma | 2.748.109 hab. (2023) · 1.287 km² · 21 m | Coliseo, Basílica de San Pedro, Península itálica | Las monedas que los turistas lanzan a la Fontana de Trevi, más de un millón de euros al año, se donan a la caridad. |
| Madrid | [Q2807](https://www.wikidata.org/wiki/Q2807) Madrid | 3.506.730 hab. (2025) · 604 km² · 663 m | Península ibérica | Allí funciona Sobrino de Botín, abierto en 1725 y reconocido por Guinness como el restaurante más antiguo del mundo. |
| Buenos Aires | [Q1486](https://www.wikidata.org/wiki/Q1486) Buenos Aires | 3.121.707 hab. (2022) · 203 km² · 25 m | Obelisco de Buenos Aires, Casa Rosada, Río de la Plata | Es una de las cunas del tango, nacido a fines del siglo XIX y declarado patrimonio de la humanidad por la UNESCO en 2009. |
| Ciudad de México | [Q1489](https://www.wikidata.org/wiki/Q1489) Ciudad de México | 9.209.944 hab. (2020) · 1.485 km² · 2.240 m | Teotihuacán, Ángel de la Independencia | Se construyó sobre Tenochtitlan, la capital azteca fundada en 1325 en un islote del lago de Texcoco. |
| El Cairo | [Q85](https://www.wikidata.org/wiki/Q85) El Cairo | 9.801.536 hab. (2023) · 528 km² · 23 m | Pirámides de Giza, Desierto del Sahara, Río Nilo | La llaman la ciudad de los mil minaretes, y su universidad de Al-Azhar funciona desde el siglo X. |
| Bangkok | [Q1861](https://www.wikidata.org/wiki/Q1861) Bangkok | 5.676.648 hab. (2018) · 1.569 km² · 2 m | Wat Arun, Indochina | Su nombre ceremonial en tailandés tiene más de 160 letras y figura en Guinness como el topónimo más largo del mundo. |
| Seúl | [Q8684](https://www.wikidata.org/wiki/Q8684) Seúl | 9.668.465 hab. (2020) · 605 km² · 38 m | Palacio Gyeongbokgung, Península de Corea | En 2005 demolió una autopista elevada para recuperar el arroyo Cheonggyecheon, hoy un paseo verde de casi 11 km. |
| Bombay | [Q1156](https://www.wikidata.org/wiki/Q1156) Bombay | 15.414.288 hab. (2018) · 603 km² · 14 m | Puerta de la India, Mar Arábigo, Ghats Occidentales | Es la sede de Bollywood, el cine en hindi, y sus dabbawalas reparten miles de almuerzos caseros cada día. |
| Estambul | [Q406](https://www.wikidata.org/wiki/Q406) Estambul | 15.655.924 hab. (2023) · 5.343 km² · 100 m | Santa Sofía, Mezquita Azul, Estrecho del Bósforo | Antes se llamó Bizancio y luego Constantinopla, y fue capital de los imperios bizantino y otomano. |
| Sídney | [Q3130](https://www.wikidata.org/wiki/Q3130) Sídney | 5.450.496 hab. (2023) · 12.145 km² · 58 m | Ópera de Sídney, Puente de la Bahía de Sídney, Mar de Tasmania | Su Ópera, diseñada por el danés Jørn Utzon e inaugurada en 1973, es Patrimonio de la Humanidad. |
| Los Ángeles | [Q65](https://www.wikidata.org/wiki/Q65) Los Ángeles | 3.898.747 hab. (2020) · 1.302 km² · 106 m | Letrero de Hollywood | El letrero de Hollywood se instaló en 1923 como anuncio inmobiliario y al principio decía Hollywoodland. |
| Río de Janeiro | [Q8678](https://www.wikidata.org/wiki/Q8678) Río de Janeiro | 6.730.729 hab. (2025) · 1.260 km² · 31 m | Cristo Redentor, Pan de Azúcar | Su nombre significa río de enero: los portugueses llegaron en enero de 1502 y confundieron su bahía con un río. |
| Nueva York | [Q60](https://www.wikidata.org/wiki/Q60) Nueva York | 8.804.190 hab. (2020) · 1.213 km² · 25 m | Estatua de la Libertad, Puente de Brooklyn | Los neerlandeses la fundaron como Nueva Ámsterdam, y pasó a llamarse Nueva York en 1664, bajo dominio inglés. |
| Johannesburgo | [Q34647](https://www.wikidata.org/wiki/Q34647) Johannesburgo | 4.803.262 hab. (2022) · 1.644 km² · 1.753 m | Union Buildings | Nació en 1886 tras el hallazgo de oro en el Witwatersrand; en zulú la llaman eGoli, lugar del oro. |
| Washington D.C. | [Q61](https://www.wikidata.org/wiki/Q61) Washington D. C. | 689.545 hab. (2020) · 259 km² · 72 m | Casa Blanca, Monumento a Lincoln | No pertenece a ningún estado, y su trazado lo diseñó en 1791 el ingeniero de origen francés Pierre L'Enfant. |
| Ottawa | [Q1930](https://www.wikidata.org/wiki/Q1930) Ottawa | 1.017.449 hab. (2021) · 2.779 km² · 70 m | Parlamento de Canadá, Escudo Canadiense | En invierno, su canal Rideau se congela y se convierte en una pista de patinaje de casi 8 km. |
| Canberra | [Q3114](https://www.wikidata.org/wiki/Q3114) Canberra | 473.855 hab. (2024) · 472 km² · 578 m | Parlamento de Australia, Gran Cordillera Divisoria | Se creó como capital por un acuerdo entre Sídney y Melbourne, y la diseñaron los arquitectos Walter y Marion Griffin. |
| Brasilia | [Q2844](https://www.wikidata.org/wiki/Q2844) Brasilia | 2.996.899 hab. (2025) · 5.802 km² · 1.171 m | Catedral de Brasilia, Congreso Nacional de Brasil, Amazonia | Se construyó en menos de cuatro años, se inauguró en 1960 y su plano, obra de Lúcio Costa, tiene forma de avión. |
| Nairobi | [Q3870](https://www.wikidata.org/wiki/Q3870) Nairobi | 5.545.000 hab. (2016) · 696 km² · 1.661 m |  | Su nombre viene de la expresión masái Enkare Nairobi, agua fría, y tiene un parque nacional con jirafas junto a los rascacielos. |
| Nueva Delhi | [Q987](https://www.wikidata.org/wiki/Q987) Nueva Delhi | 249.998 hab. (2011) · 43 km² · 216 m | Templo del Loto, Qutab Minar, Llanura del Ganges | La diseñaron los arquitectos británicos Edwin Lutyens y Herbert Baker, y se inauguró como capital en 1931. |
| Yakarta | [Q3630](https://www.wikidata.org/wiki/Q3630) Yakarta | 11.135.191 hab. (2024) · 662 km² · 91 m | Java | Durante más de tres siglos de dominio neerlandés se llamó Batavia y fue un centro del comercio de especias. |
| Lima | [Q2868](https://www.wikidata.org/wiki/Q2868) Lima | 9.943.800 hab. (2022) · 2.672 km² · 154 m | Cordillera de los Andes | Fue fundada en 1535 con el nombre de Ciudad de los Reyes, y su centro histórico es Patrimonio de la Humanidad. |
| Bogotá | [Q2841](https://www.wikidata.org/wiki/Q2841) Bogotá | 8.034.649 hab. (2024) · 1.578 km² · 2.582 m | Museo del Oro, Plaza de Bolívar de Bogotá, Cordillera de los Andes | Cada domingo y festivo cierra más de 100 km de vías a los carros para su Ciclovía, que funciona desde 1974. |
| Santiago | [Q2887](https://www.wikidata.org/wiki/Q2887) Santiago de Chile | 6.257.516 hab. (2017) · 838 km² · 575 m | Palacio de La Moneda, Cordillera de los Andes | Pedro de Valdivia la fundó en 1541 al pie del cerro Huelén, que hoy se conoce como cerro Santa Lucía. |
| Ankara | [Q3640](https://www.wikidata.org/wiki/Q3640) Ankara | 5.803.482 hab. (2023) · 25.632 km² · 938 m | Anatolia | Antes se llamaba Angora, nombre que heredaron la cabra, el gato y el conejo de angora. |
| Riad | [Q3692](https://www.wikidata.org/wiki/Q3692) Riad | 7.009.100 hab. (2022) · 1.798 km² · 612 m | Península arábiga | Su nombre significa los jardines en árabe, por los oasis que antiguamente había en la zona. |
| Teherán | [Q3616](https://www.wikidata.org/wiki/Q3616) Teherán | 8.693.706 hab. (2016) · 686 km² · 1.179 m |  | Su palacio de Golestán, con salones de espejos y azulejos, es Patrimonio de la Humanidad desde 2013. |
| Islamabad | [Q1362](https://www.wikidata.org/wiki/Q1362) Islamabad | 1.014.825 hab. (2017) · 906 km² · 620 m |  | Se planificó en los años sesenta para reemplazar a Karachi como capital, y su mezquita Faisal imita una tienda beduina. |
| Hanói | [Q1858](https://www.wikidata.org/wiki/Q1858) Hanói | 8.717.600 hab. (2024) · 3.360 km² · 16 m | Indochina | Su nombre significa dentro del río, y la leyenda dice que una tortuga recuperó una espada mágica en su lago Hoan Kiem. |
| Manila | [Q1461](https://www.wikidata.org/wiki/Q1461) Manila | 1.902.590 hab. (2024) · 25 km² · 9 m | Mar de China Meridional, Luzón | Sus coloridos jeepneys nacieron de los jeeps militares estadounidenses que quedaron tras la Segunda Guerra Mundial. |
| Kuala Lumpur | [Q1865](https://www.wikidata.org/wiki/Q1865) Kuala Lumpur | 9.000.280 hab. (2025) · 244 km² · 66 m | Torres Petronas, Península malaya | Su nombre significa confluencia fangosa en malayo, y sus Torres Petronas son las torres gemelas más altas del mundo. |
| Atenas | [Q1524](https://www.wikidata.org/wiki/Q1524) Atenas | 643.452 hab. (2021) · 39 km² · 74 m | Acrópolis de Atenas, Península balcánica (Balcanes) | Según el mito, la diosa Atenea ganó la ciudad al regalarle un olivo, frente a la fuente de agua salada de Poseidón. |
| Lisboa | [Q597](https://www.wikidata.org/wiki/Q597) Lisboa | 545.796 hab. (2021) · 100 km² · 100 m | Torre de Belém, Palacio da Pena, Península ibérica | Sus pasteles de Belém se hacen desde 1837 con una receta secreta heredada de los monjes del monasterio de los Jerónimos. |
| Varsovia | [Q270](https://www.wikidata.org/wiki/Q270) Varsovia | 1.862.402 hab. (2024) · 517 km² · 118 m |  | Su símbolo es una sirena armada con espada y escudo, que aparece en el escudo de la ciudad. |
| Budapest | [Q1781](https://www.wikidata.org/wiki/Q1781) Budapest | 1.675.777 hab. (2026) · 525 km² · 117 m | Parlamento de Budapest, Río Danubio | Nació en 1873 de la unión de Buda, Óbuda y Pest, y es famosa por sus baños termales como el Széchenyi. |
| Bucarest | [Q19660](https://www.wikidata.org/wiki/Q19660) Bucarest | 1.716.961 hab. (2021) · 226 km² · 70 m |  | Entre las dos guerras mundiales la apodaban la pequeña París, y hasta tiene su propio Arco del Triunfo. |
| Kiev | [Q1899](https://www.wikidata.org/wiki/Q1899) Kiev | 2.952.301 hab. (2022) · 848 km² · 179 m | Río Dniéper | Su catedral de Santa Sofía, del siglo XI, conserva mosaicos y frescos originales y es Patrimonio de la Humanidad. |
| Helsinki | [Q1757](https://www.wikidata.org/wiki/Q1757) Helsinki | 694.392 hab. (2025) · 215 km² · 17 m |  | Su fortaleza marítima de Suomenlinna, construida en el siglo XVIII sobre varias islas, es Patrimonio de la Humanidad. |
| Oslo | [Q585](https://www.wikidata.org/wiki/Q585) Oslo | 717.710 hab. (2024) · 481 km² · 23 m | Península escandinava | Se llamó Kristiania hasta 1925, y es la ciudad donde se entrega cada año el Premio Nobel de la Paz. |
| Copenhague | [Q1748](https://www.wikidata.org/wiki/Q1748) Copenhague | 667.099 hab. (2025) · 91 km² · 14 m | La Sirenita, Puente de Öresund | Sus jardines Tivoli, abiertos en 1843, son uno de los parques de diversiones más antiguos del mundo e inspiraron a Walt Disney. |
| Dublín | [Q1761](https://www.wikidata.org/wiki/Q1761) Dublín | 592.713 hab. (2022) · 115 km² · 20 m | Newgrange, Islas Británicas, Mar de Irlanda | Su nombre viene del irlandés Dubh Linn, estanque negro, y allí se elabora la cerveza Guinness desde 1759. |
| Bruselas | [Q239](https://www.wikidata.org/wiki/Q239) Bruselas | 195.546 hab. (2024) · 33 km² · 70 m | Atomium, Llanura del Norte de Europa | Su pequeña estatua del Manneken Pis tiene más de mil trajes, que le cambian en fechas especiales. |
| Berna | [Q70](https://www.wikidata.org/wiki/Q70) Berna | 138.562 hab. (2025) · 52 km² · 542 m | Alpes | Albert Einstein vivía allí en 1905, el año en que publicó su teoría de la relatividad especial. |
| La Habana | [Q1563](https://www.wikidata.org/wiki/Q1563) La Habana | 2.492.618 hab. (2022) · 728 km² · 59 m | Capitolio de La Habana, Antillas Mayores | Por sus calles aún ruedan muchos autos clásicos estadounidenses de los años cuarenta y cincuenta. |
| Caracas | [Q1533](https://www.wikidata.org/wiki/Q1533) Caracas | 2.245.744 hab. (2017) · 776 km² · 920 m | Cordillera Oriental, Mar Caribe | Allí nació Simón Bolívar en 1783, y su casa natal es hoy un museo en el centro histórico. |
| Quito | [Q2900](https://www.wikidata.org/wiki/Q2900) Quito | 1.763.275 hab. (2022) · 372 km² · 2.850 m | Mitad del Mundo, Cordillera de los Andes, Cordillera Occidental | En 1978, junto con Cracovia, fue una de las primeras ciudades declaradas Patrimonio de la Humanidad por la UNESCO. |
| Montevideo | [Q1335](https://www.wikidata.org/wiki/Q1335) Montevideo | 1.302.954 hab. (2023) · 730 km² · 41 m | Palacio Salvo, Río de la Plata | Fue sede del primer Mundial de fútbol en 1930, cuya final se jugó en su Estadio Centenario. |
| Asunción | [Q2933](https://www.wikidata.org/wiki/Q2933) Asunción | 462.241 hab. (2022) · 117 km² · 43 m | Río Paraná, Gran Chaco | La llaman madre de ciudades porque de allí partieron expediciones que fundaron otras, como la segunda Buenos Aires. |
| La Paz | [Q1491](https://www.wikidata.org/wiki/Q1491) La Paz | 755.732 hab. (2024) · 472 km² · 3.640 m | Tiwanaku, Cordillera de los Andes, Altiplano andino | Su red de teleféricos urbanos, Mi Teleférico, se inauguró en 2014 y es la más extensa de su tipo en el mundo. |
| Pretoria | [Q3926](https://www.wikidata.org/wiki/Q3926) Pretoria | 741.651 hab. (2011) · 688 km² · 1.339 m | Union Buildings | La llaman la ciudad de los jacarandás: miles de estos árboles tiñen sus calles de morado cada primavera. |
| Addis Abeba | [Q3624](https://www.wikidata.org/wiki/Q3624) Adís Abeba | 5.704.000 hab. (2024) · 527 km² · 2.355 m | Macizo Etíope | Su nombre significa flor nueva en amárico, y allí tiene su sede la Unión Africana. |
| Accra | [Q3761](https://www.wikidata.org/wiki/Q3761) Acra | 1.782.150 hab. (2021) · 173 km² · 61 m | Golfo de Guinea | Su nombre viene de la palabra akan nkran, que significa hormigas, por los hormigueros que abundaban en la zona. |
| Dakar | [Q3718](https://www.wikidata.org/wiki/Q3718) Dakar | 1.438.725 hab. (2021) · 80 km² · 10 m | Isla de Gorea | Durante casi 30 años fue la meta habitual del Rally París-Dakar, cuya primera edición se corrió entre 1978 y 1979. |
| Argel | [Q3561](https://www.wikidata.org/wiki/Q3561) Argel | 3.415.811 hab. (2011) · 363 km² · 0 m | Mar Mediterráneo, Cordillera del Atlas | La llaman Argel la Blanca por sus edificios encalados, y su casba es Patrimonio de la Humanidad. |
| Rabat | [Q3551](https://www.wikidata.org/wiki/Q3551) Rabat | 515.619 hab. (2024) · 118 km² · 135 m | Cordillera del Atlas | Su torre Hassan es el alminar de una enorme mezquita que se empezó en el siglo XII y nunca se terminó. |
| Túnez | [Q3572](https://www.wikidata.org/wiki/Q3572) Túnez | 602.560 hab. (2022) · 213 km² · 4 m | Ruinas de Cartago, Mar Mediterráneo, Cordillera del Atlas | Su medina, llena de palacios, mezquitas y zocos, es Patrimonio de la Humanidad desde 1979. |
| Singapur | [Q334](https://www.wikidata.org/wiki/Q334) Singapur | 5.866.139 hab. (2021) · 719 km² | Marina Bay Sands, Península malaya | Su nombre viene del sánscrito Singapura, ciudad del león, aunque en la isla nunca vivieron leones. |
| Colombo | [Q35381](https://www.wikidata.org/wiki/Q35381) Colombo | 647.557 hab. (2025) · 37 km² · 1 m |  | Desde 1883 allí se realiza la subasta del té de Ceilán, una de las más antiguas del mundo. |
| Katmandú | [Q3037](https://www.wikidata.org/wiki/Q3037) Katmandú | 845.767 hab. (2021) · 49 km² · 1.300 m | Himalaya, Meseta del Tíbet | Su nombre viene de Kasthamandap, un templo de madera que según la leyenda se construyó con un solo árbol. |
| Daca | [Q1354](https://www.wikidata.org/wiki/Q1354) Daca | 16.800.000 hab. (2017) · 368 km² · 4 m | Delta del Ganges, Llanura del Ganges | La llaman la capital mundial de los rickshaws: cientos de miles de estos triciclos recorren sus calles. |
| Naipyidó | [Q37400](https://www.wikidata.org/wiki/Q37400) Naipyidó | 1.160.242 hab. (2014) · 7.054 km² · 115 m | Indochina | Se construyó desde cero y es capital desde 2005; es famosa por sus autopistas de hasta 20 carriles casi vacías. |
| Shanghái | [Q8686](https://www.wikidata.org/wiki/Q8686) Shanghái | 24.870.895 hab. (2020) · 6.341 km² · 4 m |  | Su paseo del Bund reúne edificios de estilo europeo de inicios del siglo XX frente a los rascacielos de Pudong. |
| Barcelona | [Q1492](https://www.wikidata.org/wiki/Q1492) Barcelona | 1.731.649 hab. (2025) · 101 km² · 12 m | Sagrada Familia | La construcción de la Sagrada Familia, obra de Gaudí, comenzó en 1882 y ha avanzado durante más de un siglo. |
| Múnich | [Q1726](https://www.wikidata.org/wiki/Q1726) Múnich | 1.505.036 hab. (2025) · 311 km² · 519 m |  | Su Oktoberfest nació en 1810 como celebración de la boda del príncipe heredero Luis de Baviera. |
| Milán | [Q490](https://www.wikidata.org/wiki/Q490) Milán | 1.354.196 hab. (2023) · 182 km² · 138 m | Catedral de Milán, Península itálica | Allí está La última cena de Leonardo da Vinci, pintada en el refectorio de Santa Maria delle Grazie. |
| Melbourne | [Q3141](https://www.wikidata.org/wiki/Q3141) Melbourne | 5.350.705 hab. (2024) · 9.993 km² · 31 m | Gran Cordillera Divisoria, Estrecho de Bass | Cada noviembre celebra la Melbourne Cup, una carrera de caballos conocida como la carrera que detiene a una nación. |
| Toronto | [Q172](https://www.wikidata.org/wiki/Q172) Toronto | 2.794.356 hab. (2021) · 630 km² · 76 m | Torre CN, Lago Ontario | Su Torre CN, de 553 metros, fue la estructura autoportante más alta del mundo entre 1975 y 2007. |
| Chicago | [Q1297](https://www.wikidata.org/wiki/Q1297) Chicago | 2.731.585 hab. (2025) · 606 km² · 179 m | Lago Míchigan | Cada Día de San Patricio tiñe su río de verde, una tradición que comenzó en 1962. |
| São Paulo | [Q174](https://www.wikidata.org/wiki/Q174) São Paulo | 11.904.961 hab. (2025) · 1.523 km² · 760 m | Altiplano Brasileño | Tiene la mayor comunidad de origen japonés fuera de Japón, con el barrio de Liberdade como corazón. |
| Lagos | [Q8673](https://www.wikidata.org/wiki/Q8673) Lagos | 15.070.000 hab. (2022) · 1.171 km² · 34 m |  | Fue la capital de Nigeria hasta 1991 y es el corazón de Nollywood, una de las mayores industrias de cine del mundo. |
| Karachi | [Q8660](https://www.wikidata.org/wiki/Q8660) Karachi | 14.910.352 hab. (2017) · 3.527 km² · 8 m | Mar Arábigo | Fue la primera capital de Pakistán, desde 1947 hasta que el gobierno se trasladó en 1959. |
| Ho Chi Minh | [Q1854](https://www.wikidata.org/wiki/Q1854) Ciudad Ho Chi Minh | 14.002.598 hab. (2024) · 6.773 km² · 13 m | Indochina | Hasta 1976 se llamaba Saigón, un nombre que muchos de sus habitantes siguen usando a diario. |
| Osaka | [Q35765](https://www.wikidata.org/wiki/Q35765) Osaka | 2.751.862 hab. (2021) · 223 km² · 20 m | Santuario Fushimi Inari, Pabellón Dorado (Kinkaku-ji), Honshu | La llaman la cocina de Japón y es la cuna del takoyaki, bolitas de masa rellenas de pulpo. |
| Dubái | [Q612](https://www.wikidata.org/wiki/Q612) Dubái | 3.944.751 hab. (2025) · 35 km² · 0 m | Burj Khalifa, Burj Al Arab, Península arábiga | Allí se alza el Burj Khalifa, inaugurado en 2010, el edificio más alto del mundo. |
| San Petersburgo | [Q656](https://www.wikidata.org/wiki/Q656) San Petersburgo | 5.652.922 hab. (2025) · 1.439 km² · 3 m | Museo del Hermitage, Llanura del Norte de Europa | Pedro el Grande la fundó en 1703, y en junio vive las noches blancas, cuando casi no oscurece. |
| Casablanca | [Q7903](https://www.wikidata.org/wiki/Q7903) Casablanca | 3.215.935 hab. (2024) · 384 km² · 115 m | Mezquita Hassan II | Su mezquita Hassan II se levanta en parte sobre el mar y tiene un alminar de 210 metros. |
| Ciudad del Cabo | [Q5465](https://www.wikidata.org/wiki/Q5465) Ciudad del Cabo | 3.776.313 hab. (2021) · 2.455 km² · 5 m | Isla Robben, Montaña de la Mesa | Las nubes que se derraman sobre la cima plana de su Montaña de la Mesa se conocen como el mantel. |
| Montreal | [Q340](https://www.wikidata.org/wiki/Q340) Montreal | 1.895.211 hab. (2024) · 498 km² · 31 m | Habitat 67 | Su ciudad subterránea, el RÉSO, conecta más de 30 km de túneles con tiendas, estaciones de metro y oficinas. |
| Vancouver | [Q24639](https://www.wikidata.org/wiki/Q24639) Vancouver | 662.248 hab. (2021) · 115 km² · 2 m |  | Fue sede de los Juegos Olímpicos de Invierno de 2010, y su parque Stanley es más grande que el Central Park. |
| Calcuta | [Q1348](https://www.wikidata.org/wiki/Q1348) Calcuta | 4.496.694 hab. (2011) · 206 km² · 9 m | Río Ganges, Sundarbans, Delta del Ganges | Fue la capital de la India británica hasta 1911, y allí nació Rabindranath Tagore, Nobel de Literatura en 1913. |
| Chennai | [Q1352](https://www.wikidata.org/wiki/Q1352) Chennai | 6.599.000 hab. (2024) · 427 km² · 6 m | Golfo de Bengala | Se llamaba Madrás hasta 1996, y su playa Marina es una de las playas urbanas más largas del mundo. |
| Ámsterdam | [Q727](https://www.wikidata.org/wiki/Q727) Ámsterdam | 921.468 hab. (2023) · 219 km² · -2 m | Llanura del Norte de Europa | Su Palacio Real y muchas de sus casas se apoyan sobre pilotes de madera clavados en el suelo blando. |
| Viena | [Q1741](https://www.wikidata.org/wiki/Q1741) Viena | 2.028.289 hab. (2025) · 415 km² · 542 m | Palacio de Schönbrunn, Río Danubio | Fue hogar de Mozart, Beethoven y Johann Strauss hijo, autor del famoso vals El Danubio azul. |
| Estocolmo | [Q1754](https://www.wikidata.org/wiki/Q1754) Estocolmo | 984.748 hab. (2022) · 187 km² | Península escandinava, Mar Báltico | Cada 10 de diciembre se entregan allí los Premios Nobel, salvo el de la Paz, que se otorga en Oslo. |
| Praga | [Q1085](https://www.wikidata.org/wiki/Q1085) Praga | 1.397.880 hab. (2025) · 496 km² · 235 m | Puente de Carlos, Castillo de Praga | Su reloj astronómico, instalado en 1410, es el más antiguo del mundo que sigue funcionando. |
| Marsella | [Q23482](https://www.wikidata.org/wiki/Q23482) Marsella | 886.040 hab. (2023) · 241 km² · 648 m | Mar Mediterráneo | Marinos griegos la fundaron hacia el año 600 a. C. con el nombre de Massalia, y es la cuna de la bullabesa. |
| Lyon | [Q456](https://www.wikidata.org/wiki/Q456) Lyon | 519.127 hab. (2023) · 48 km² · 312 m | Macizo Central (Francia) | Allí los hermanos Lumière filmaron en 1895 a los obreros saliendo de su fábrica, una de las primeras películas. |
| Hamburgo | [Q1055](https://www.wikidata.org/wiki/Q1055) Hamburgo | 1.869.473 hab. (2025) · 755 km² · 6 m | Mar del Norte, Llanura del Norte de Europa, Río Elba | Los Beatles tocaron en sus clubes entre 1960 y 1962, antes de hacerse famosos. |
| Nápoles | [Q2634](https://www.wikidata.org/wiki/Q2634) Nápoles | 913.462 hab. (2023) · 119 km² · 17 m | Pompeya, Península itálica, Vesubio | Es la cuna de la pizza, y el arte de los pizzeros napolitanos es patrimonio inmaterial de la UNESCO desde 2017. |
| Sevilla | [Q8717](https://www.wikidata.org/wiki/Q8717) Sevilla | 689.423 hab. (2025) · 141 km² · 18 m | La Giralda, Península ibérica | La Giralda, campanario de su catedral, fue originalmente el alminar de una mezquita del siglo XII. |
| Oporto | [Q36433](https://www.wikidata.org/wiki/Q36433) Oporto | 273.476 hab. (2025) · 41 km² · 104 m | Península ibérica | El famoso vino de Oporto lleva el nombre de la ciudad, desde cuyas bodegas se exportaba a todo el mundo. |
| Cracovia | [Q31487](https://www.wikidata.org/wiki/Q31487) Cracovia | 804.237 hab. (2023) · 327 km² · 219 m | Cárpatos | La leyenda dice que bajo su castillo de Wawel vivía un dragón, y hoy una estatua suya echa fuego junto al río. |
| Gdansk | [Q1792](https://www.wikidata.org/wiki/Q1792) Gdansk | 487.834 hab. (2024) · 683 km² · 11 m | Castillo de Malbork, Mar Báltico, Llanura del Norte de Europa | Se presenta como la capital mundial del ámbar, la resina fósil que sus artesanos trabajan desde hace siglos. |
| San Francisco | [Q62](https://www.wikidata.org/wiki/Q62) San Francisco | 808.988 hab. (2023) · 601 km² · 30 m | Puente Golden Gate, Alcatraz | Sus tranvías de cable funcionan desde 1873 y son el último sistema de este tipo en el mundo que se opera a mano. |
| Miami | [Q8652](https://www.wikidata.org/wiki/Q8652) Miami | 449.514 hab. (2022) · 145 km² · 2 m | Florida | Es la única gran ciudad de Estados Unidos fundada por una mujer, Julia Tuttle, en 1896. |
| Guadalajara | [Q9022](https://www.wikidata.org/wiki/Q9022) Guadalajara | 1.385.621 hab. (2020) · 145 km² · 1.536 m |  | Es considerada la capital del mariachi, música que la UNESCO declaró patrimonio inmaterial en 2011. |
| Medellín | [Q48278](https://www.wikidata.org/wiki/Q48278) Medellín | 2.529.403 hab. (2018) · 381 km² · 1.405 m | Plaza Botero, Pueblito Paisa (Cerro Nutibara), Cordillera de los Andes | Fue la primera ciudad de Colombia con metro, inaugurado en 1995, y su Feria de las Flores se celebra cada agosto. |
| Córdoba | [Q44210](https://www.wikidata.org/wiki/Q44210) Córdoba | 1.505.250 hab. (2022) · 576 km² · 390 m | La Pampa | La llaman La Docta por su universidad, fundada por los jesuitas en 1613, una de las más antiguas de América. |
| Recife | [Q48344](https://www.wikidata.org/wiki/Q48344) Recife | 1.588.376 hab. (2025) · 219 km² · 6 m | Altiplano Brasileño | Su nombre viene de los arrecifes de su costa, y allí nació el frevo, ritmo de carnaval reconocido por la UNESCO. |
| Salvador | [Q36947](https://www.wikidata.org/wiki/Q36947) Salvador | 2.564.204 hab. (2025) · 693 km² · 8 m | Pelourinho, Altiplano Brasileño | Fue la primera capital de Brasil, de 1549 a 1763, y su barrio colonial del Pelourinho es Patrimonio de la Humanidad. |
| Guayaquil | [Q43509](https://www.wikidata.org/wiki/Q43509) Guayaquil | 2.650.288 hab. (2022) · 354 km² · 4 m | Cordillera de los Andes | En 1822 allí se reunieron Simón Bolívar y José de San Martín, en el encuentro conocido como la Entrevista de Guayaquil. |
| Alejandría | [Q87](https://www.wikidata.org/wiki/Q87) Alejandría | 5.362.517 hab. (2023) · 2.523 km² · -1 m | Mar Mediterráneo, Delta del Nilo | La fundó Alejandro Magno en el 331 a. C., y su faro fue una de las siete maravillas del mundo antiguo. |
| Dar es Salaam | [Q1960](https://www.wikidata.org/wiki/Q1960) Dar es-Salaam | 4.715.000 hab. (2016) · 1.393 km² · 12 m |  | Su nombre significa morada de la paz en árabe, y fue la capital de Tanzania hasta que se eligió a Dodoma. |
| Luanda | [Q3897](https://www.wikidata.org/wiki/Q3897) Luanda | 2.487.444 hab. (2018) · 113 km² · 6 m |  | La fundó en 1576 el portugués Paulo Dias de Novais con el nombre de São Paulo da Assunção de Loanda. |
| Cantón | [Q16572](https://www.wikidata.org/wiki/Q16572) Cantón | 18.676.605 hab. (2020) · 7.249 km² · 21 m |  | Es la cuna de la cocina cantonesa y del dim sum, y desde 1957 organiza la Feria de Cantón, la mayor feria comercial de China. |
| Shenzhen | [Q15174](https://www.wikidata.org/wiki/Q15174) Shenzhen | 17.681.600 hab. (2022) · 1.997 km² · 0 m | Mar de China Meridional | En 1980 se convirtió en una de las primeras zonas económicas especiales de China y pasó de pueblo pesquero a polo tecnológico. |
| Bangalore | [Q1355](https://www.wikidata.org/wiki/Q1355) Bangalore | 12.327.000 hab. (2020) · 741 km² · 920 m | Meseta del Decán | La llaman el Silicon Valley de la India por sus empresas tecnológicas, y también la ciudad jardín por sus parques. |
| Hyderabad | [Q1361](https://www.wikidata.org/wiki/Q1361) Haidrābād | 9.191.000 hab. (2025) · 2.053 km² · 564 m | Meseta del Decán | Su emblema es el Charminar, un monumento de cuatro alminares construido en 1591, y es famosa por su biryani. |
| Lahore | [Q11739](https://www.wikidata.org/wiki/Q11739) Lahore | 11.126.285 hab. (2017) · 1.772 km² · 217 m | Templo Dorado de Amritsar | Su fuerte y los jardines de Shalimar, obras del Imperio mogol, son Patrimonio de la Humanidad desde 1981. |
| Perth | [Q3183](https://www.wikidata.org/wiki/Q3183) Perth | 2.141.834 hab. (2021) · 6.418 km² · 2 m |  | En 1962 sus habitantes encendieron las luces para saludar al astronauta John Glenn en órbita y la apodaron ciudad de la luz. |
| Auckland | [Q37100](https://www.wikidata.org/wiki/Q37100) Auckland | 1.470.100 hab. (2020) · 559 km² · 196 m | Sky Tower, Mar de Tasmania | La llaman la ciudad de las velas, y se asienta sobre un campo volcánico con unos 50 volcanes. |
| Jeddah | [Q374365](https://www.wikidata.org/wiki/Q374365) Yeda | 4.697.000 hab. (2021) · 5.460 km² · 12 m | Mar Rojo, Península arábiga | Su casco antiguo, Al-Balad, con casas de piedra coralina y balcones de madera, es Patrimonio de la Humanidad. |
| Izmir | [Q35997](https://www.wikidata.org/wiki/Q35997) Esmirna | 4.493.242 hab. (2024) · 944 km² · 9 m | Éfeso, Anatolia, Mar Egeo | En la Antigüedad se llamaba Esmirna, y una antigua tradición la señala como la ciudad natal de Homero. |
| Gotemburgo | [Q25287](https://www.wikidata.org/wiki/Q25287) Gotemburgo | 63.901 hab. (2023) · 272 km² · 12 m | Península escandinava | Allí nació Volvo, cuyo primer automóvil salió de la fábrica en 1927. |
| Ulán Bator | [Q23430](https://www.wikidata.org/wiki/Q23430) Ulán Bator | 1.515.593 hab. (2019) · 4.704 km² · 1.350 m | Meseta de Mongolia | Es considerada la capital más fría del mundo, y su nombre significa héroe rojo en mongol. |
| Antananarivo | [Q3915](https://www.wikidata.org/wiki/Q3915) Antananarivo | 1.275.207 hab. (2018) · 88 km² · 1.276 m |  | Su nombre significa ciudad de los mil, por los mil guerreros que según la tradición la protegían. |
| Biskek | [Q9361](https://www.wikidata.org/wiki/Q9361) Biskek | 1.191.000 hab. (2025) · 127 km² · 750 m |  | Entre 1926 y 1991 se llamó Frunze, y su nombre actual se asocia con la paleta usada para batir el kumis. |
| Tiflis | [Q994](https://www.wikidata.org/wiki/Q994) Tiflis | 1.258.526 hab. (2024) · 720 km² · 575 m |  | Su nombre georgiano, Tbilisi, viene de tbili, cálido, por los manantiales de azufre que aún alimentan sus baños. |
| Ereván | [Q1953](https://www.wikidata.org/wiki/Q1953) Ereván | 1.106.300 hab. (2024) · 227 km² · 987 m |  | Nació en el año 782 a. C. como la fortaleza de Erebuni, así que es más antigua que Roma. |
| Asjabad | [Q23438](https://www.wikidata.org/wiki/Q23438) Asjabad | 1.030.063 hab. (2022) · 765 km² · 219 m |  | Tiene el récord Guinness de la mayor concentración de edificios revestidos de mármol blanco del mundo. |
| Dusambé | [Q9365](https://www.wikidata.org/wiki/Q9365) Dusambé | 1.201.800 hab. (2022) · 125 km² · 706 m |  | Su nombre significa lunes en tayiko, porque allí se celebraba un mercado todos los lunes. |
| Taskent | [Q269](https://www.wikidata.org/wiki/Q269) Taskent | 2.956.384 hab. (2023) · 335 km² · 455 m |  | Su metro, abierto en 1977, fue el primero de Asia Central y sus estaciones lucen candelabros, mármol y mosaicos. |
| Astaná | [Q1520](https://www.wikidata.org/wiki/Q1520) Astaná | 1.239.744 hab. (2022) · 797 km² · 347 m | Estepa kazaja | Su nombre significa capital en kazajo; entre 2019 y 2022 se llamó Nur-Sultán y luego recuperó su nombre. |
| Bakú | [Q9248](https://www.wikidata.org/wiki/Q9248) Bakú | 2.300.500 hab. (2021) · 2.140 km² · -28 m | Mar Caspio | Hacia 1900 producía cerca de la mitad del petróleo del mundo, y hoy sus tres Torres de Fuego se iluminan como llamas. |
| Riga | [Q1773](https://www.wikidata.org/wiki/Q1773) Riga | 588.911 hab. (2026) · 304 km² · 6 m | Llanura del Norte de Europa | Cerca de un tercio de los edificios de su centro son art nouveau, una de las mayores colecciones de ese estilo en el mundo. |
| Tallin | [Q1770](https://www.wikidata.org/wiki/Q1770) Tallin | 457.572 hab. (2024) · 159 km² · 28 m | Llanura del Norte de Europa | Su casco antiguo medieval es Patrimonio de la Humanidad, y programadores de la ciudad desarrollaron Skype, lanzado en 2003. |
| Vilna | [Q216](https://www.wikidata.org/wiki/Q216) Vilna | 619.405 hab. (2026) · 401 km² · 112 m | Llanura del Norte de Europa | Su barrio bohemio de Užupis se declaró república en broma en 1997 y tiene su constitución colgada en una pared. |
| Liubliana | [Q437](https://www.wikidata.org/wiki/Q437) Liubliana | 284.293 hab. (2022) · 164 km² · 309 m | Península balcánica (Balcanes), Alpes Dináricos | Su símbolo es un dragón, que aparece en el escudo de la ciudad y custodia el famoso Puente de los Dragones. |
| Bratislava | [Q1780](https://www.wikidata.org/wiki/Q1780) Bratislava | 480.902 hab. (2025) · 368 km² · 152 m | Palacio de Schönbrunn, Río Danubio | Entre 1563 y 1830 fue la ciudad de coronación de los reyes de Hungría, que se coronaban en la catedral de San Martín. |
| Chisináu | [Q21197](https://www.wikidata.org/wiki/Q21197) Chisináu | 567.038 hab. (2024) · 123 km² · 85 m |  | En sus afueras están las bodegas de Cricova, con más de 100 km de túneles subterráneos repletos de vino. |
| Podgorica | [Q23564](https://www.wikidata.org/wiki/Q23564) Podgorica | 150.977 hab. (2011) · 1.205 km² · 49 m | Península balcánica (Balcanes), Alpes Dináricos | Su nombre significa bajo la colina Gorica, y entre 1946 y 1992 se llamó Titogrado en honor a Tito. |
| Skopie | [Q384](https://www.wikidata.org/wiki/Q384) Skopie | 422.540 hab. (2021) · 571 km² · 251 m | Península balcánica (Balcanes) | Aquí nació en 1910 la Madre Teresa de Calcuta, y la ciudad le dedica una casa memorial en su centro. |
| Tirana | [Q19689](https://www.wikidata.org/wiki/Q19689) Tirana | 389.323 hab. (2023) · 42 km² · 110 m | Península balcánica (Balcanes) | A comienzos de los años 2000 muchos edificios grises se pintaron de colores vivos, y hoy sus fachadas multicolor son famosas. |
| Manama | [Q3882](https://www.wikidata.org/wiki/Q3882) Manama | 297.502 hab. (2012) · 30 km² | Golfo Pérsico | Su World Trade Center tiene tres enormes turbinas eólicas entre sus dos torres, algo pionero en un rascacielos. |
| Timbu | [Q9270](https://www.wikidata.org/wiki/Q9270) Timbu | 114.551 hab. (2017) · 27 km² · 2.321 m | Himalaya, Meseta del Tíbet | No tiene semáforos: en su cruce principal un policía dirige el tráfico con gestos elegantes desde una caseta. |
| Vientián | [Q9326](https://www.wikidata.org/wiki/Q9326) Vientián | 1.003.004 hab. (2023) · 3.920 km² · 174 m | Río Mekong, Indochina | Su arco Patuxai se levantó con cemento donado para un aeropuerto, por eso lo apodan la pista vertical. |
| Nom Pen | [Q1850](https://www.wikidata.org/wiki/Q1850) Nom Pen | 2.129.371 hab. (2019) · 678 km² · 11 m | Río Mekong, Indochina | En su Palacio Real está la Pagoda de Plata, cuyo piso está cubierto por más de 5.000 baldosas de plata. |
| Port Moresby | [Q36526](https://www.wikidata.org/wiki/Q36526) Puerto Moresby | 317.374 hab. (2012) · 240 km² · 74 m | Nueva Guinea, Mar del Coral | Debe su nombre al capitán británico John Moresby, que llegó en 1873 y lo bautizó en honor a su padre, un almirante. |
| Windhoek | [Q3935](https://www.wikidata.org/wiki/Q3935) Windhoek | 486.169 hab. (2023) · 5.133 km² · 1.650 m | Desierto de Kalahari | Su pasado colonial alemán se nota en la iglesia Christuskirche y en su cerveza, elaborada según la ley de pureza alemana. |
| Lusaka | [Q3881](https://www.wikidata.org/wiki/Q3881) Lusaka | 2.204.059 hab. (2022) · 360 km² · 1.279 m |  | Debe su nombre a un antiguo jefe local llamado Lusaaka y en 1935 reemplazó a Livingstone como capital. |
| Maputo | [Q3889](https://www.wikidata.org/wiki/Q3889) Maputo | 1.133.200 hab. (2023) · 347 km² · 31 m | Canal de Mozambique | Hasta 1976 se llamó Lourenço Marques, en honor a un navegante y comerciante portugués del siglo XVI. |
| Nuakchot | [Q3688](https://www.wikidata.org/wiki/Q3688) Nuakchot | 1.446.761 hab. (2023) · 1.000 km² · 7 m | Desierto del Sahara | Era una pequeña aldea hasta finales de los años 50, cuando fue elegida para construir desde cero la capital del país. |
| Niamey | [Q3674](https://www.wikidata.org/wiki/Q3674) Niamey | 1.496.260 hab. (2024) · 239 km² · 207 m | Río Níger | Su museo nacional guarda el Árbol del Teneré, el árbol más aislado del mundo hasta que un camión lo derribó en 1973. |
| Uagadugú | [Q3777](https://www.wikidata.org/wiki/Q3777) Uagadugú | 2.453.496 hab. (2019) · 219 km² · 305 m |  | Cada dos años acoge el FESPACO, el festival de cine más importante de África, creado en 1969. |
| Bamako | [Q3703](https://www.wikidata.org/wiki/Q3703) Bamako | 4.227.569 hab. (2023) · 245 km² · 350 m | Río Níger | Su nombre suele traducirse como río de los cocodrilos en bambara, y es una gran cuna de la música de África Occidental. |
| Yamena | [Q3659](https://www.wikidata.org/wiki/Q3659) Yamena | 1.092.066 hab. (2012) · 100 km² · 298 m | Desierto del Sahara, Sahel | Los franceses la fundaron en 1900 como Fort-Lamy, y en 1973 adoptó el nombre de Yamena, que significa lugar de descanso. |
| Bangui | [Q3832](https://www.wikidata.org/wiki/Q3832) Bangui | 889.231 hab. (2020) · 67 km² · 369 m | Cuenca del Congo | Nació en 1889 como un puesto francés, y en otros tiempos la apodaban Bangui la Coquette por sus calles arboladas. |
| Libreville | [Q3825](https://www.wikidata.org/wiki/Q3825) Libreville | 899.000 hab. (2025) · 189 km² · 13 m | Golfo de Guinea | Su nombre significa ciudad libre: se fundó en 1849 con personas liberadas de un barco negrero. |
| Malabo | [Q3818](https://www.wikidata.org/wiki/Q3818) Malabo | 297.000 hab. (2018) · 21 km² · 0 m |  | Se llamó Santa Isabel hasta 1973, cuando adoptó el nombre de Malabo, un rey del pueblo bubi. |
| Yaundé | [Q3808](https://www.wikidata.org/wiki/Q3808) Yaundé | 2.440.462 hab. (2012) · 180 km² · 764 m |  | Se la conoce como la ciudad de las siete colinas y nació en 1889 como un puesto de exploradores alemanes. |
| Brazzaville | [Q3844](https://www.wikidata.org/wiki/Q3844) Brazzaville | 2.145.783 hab. (2023) · 588 km² · 320 m | Río Congo, Cuenca del Congo | Lleva el nombre del explorador Pierre Savorgnan de Brazza, nacido en Italia, que la fundó en 1880. |
| Kinsasa | [Q3838](https://www.wikidata.org/wiki/Q3838) Kinsasa | 14.565.700 hab. (2020) · 9.965 km² · 240 m | Río Congo, Cuenca del Congo | En 1974 acogió la histórica pelea de boxeo entre Muhammad Ali y George Foreman, conocida como Rumble in the Jungle. |
| Bujumbura | [Q3854](https://www.wikidata.org/wiki/Q3854) Buyumbura | 658.859 hab. (2014) · 87 km² · 774 m | Gran Valle del Rift, Lago Tanganica | Se llamó Usumbura hasta 1962 y en 2019 dejó de ser la capital política, título que pasó a Gitega. |
| Kigali | [Q3859](https://www.wikidata.org/wiki/Q3859) Kigali | 1.745.555 hab. (2022) · 730 km² · 1.567 m | Gran Valle del Rift | Es famosa por su limpieza: las bolsas plásticas están prohibidas desde 2008 y cada mes hay una jornada comunitaria de aseo. |
| Kampala | [Q3894](https://www.wikidata.org/wiki/Q3894) Kampala | 1.797.722 hab. (2024) · 189 km² · 1.190 m | Lago Victoria | Su nombre viene de una expresión en luganda que significa colina de los impalas, antílopes que pastaban en la zona. |
| Mogadiscio | [Q2449](https://www.wikidata.org/wiki/Q2449) Mogadiscio | 2.120.000 hab. (2015) · 91 km² · 9 m | Cuerno de África | Fue un próspero puerto comercial medieval; el viajero Ibn Battuta la visitó en 1331 y describió su riqueza. |
| Asmara | [Q3642](https://www.wikidata.org/wiki/Q3642) Asmara | 963.000 hab. (2020) · 12.158 km² · 2.325 m | Macizo Etíope | Su arquitectura modernista de los años 30 es Patrimonio de la Humanidad e incluye una gasolinera con forma de avión. |
| Paramaribo | [Q3001](https://www.wikidata.org/wiki/Q3001) Paramaribo | 223.757 hab. (2019) · 182 km² · 3 m | Macizo Guayanés | En su calle Keizerstraat una mezquita y una sinagoga son vecinas, símbolo de la convivencia de culturas del país. |
| Georgetown | [Q10717](https://www.wikidata.org/wiki/Q10717) Georgetown | 235.017 hab. (2024) · 148 km² · 3 m | Macizo Guayanés | Su catedral de San Jorge, terminada en 1899, es una de las iglesias de madera más altas del mundo. |
| Managua | [Q3274](https://www.wikidata.org/wiki/Q3274) Managua | 973.087 hab. (2025) · 267 km² · 143 m |  | En 1852 se convirtió en capital como solución a la vieja rivalidad entre las ciudades de León y Granada. |
| Tegucigalpa | [Q3238](https://www.wikidata.org/wiki/Q3238) Tegucigalpa | 850.848 hab. (2025) · 202 km² · 990 m |  | Nació en 1578 como un centro minero de plata y oro, y junto a Comayagüela forma la capital del país. |
| San Salvador | [Q3110](https://www.wikidata.org/wiki/Q3110) San Salvador | 330.543 hab. (2024) · 72 km² · 670 m | Joya de Cerén | La apodan el Valle de las Hamacas por sus frecuentes temblores, y es tierra de pupusas, el plato nacional. |
| Marrakech | [Q101625](https://www.wikidata.org/wiki/Q101625) Marrakech | 1.002.697 hab. (2024) · 230 km² · 468 m | Cordillera del Atlas | La llaman la ciudad roja por el color de sus murallas, y su plaza Jemaa el-Fna se llena de narradores y músicos. |
| Dubrovnik | [Q1722](https://www.wikidata.org/wiki/Q1722) Dubrovnik | 41.562 hab. (2021) · 143 km² · 10 m | Murallas de Dubrovnik, Mar Adriático, Península balcánica (Balcanes) | Fue la próspera República de Ragusa, y sus murallas medievales sirvieron como Desembarco del Rey en Juego de tronos. |
| Cartagena | [Q657461](https://www.wikidata.org/wiki/Q657461) Cartagena de Indias | 1.010.995 hab. (2026) · 572 km² · 2 m | Torre del Reloj de Cartagena, Castillo de San Felipe de Barajas, Mar Caribe | Su ciudad amurallada inspiró a Gabriel García Márquez, cuyas cenizas reposan en el claustro de La Merced. |
| Cusco | [Q5582862](https://www.wikidata.org/wiki/Q5582862) Cusco | 428.450 hab. (2017) · 385 km² · 3.399 m | Sacsayhuamán, Cordillera de los Andes, Amazonia | Fue la capital del Imperio inca, su nombre suele traducirse como ombligo y cada 24 de junio celebra el Inti Raymi. |
| Vladivostok | [Q959](https://www.wikidata.org/wiki/Q959) Vladivostok | 591.628 hab. (2024) · 331 km² · 12 m | Mar del Japón | Su nombre significa dominador del Oriente, y allí termina el Transiberiano, el largo ferrocarril que sale de Moscú. |
| Edimburgo | [Q23436](https://www.wikidata.org/wiki/Q23436) Edimburgo | 488.050 hab. (2016) · 259 km² · 47 m | Castillo de Edimburgo, Gran Bretaña, Islas Británicas | Cada agosto acoge el Fringe, el mayor festival de artes escénicas del mundo, con miles de funciones. |
| La Meca | [Q5806](https://www.wikidata.org/wiki/Q5806) La Meca | 2.427.924 hab. (2022) · 760 km² · 277 m | La Kaaba (Gran Mezquita de La Meca), Península arábiga | Su torre Abraj Al-Bait luce uno de los relojes más grandes del mundo, con esferas de 43 metros de diámetro. |
| Zúrich | [Q72](https://www.wikidata.org/wiki/Q72) Zúrich | 452.421 hab. (2025) · 88 km² · 408 m | Alpes | En 1916 nació aquí el dadaísmo, en el Cabaret Voltaire, y hoy la ciudad alberga la sede de la FIFA. |
| Mombasa | [Q225641](https://www.wikidata.org/wiki/Q225641) Mombasa | 1.208.333 hab. (2019) · 295 km² · 50 m |  | Su Fuerte Jesús, levantado por los portugueses desde 1593, es Patrimonio de la Humanidad. |
| Samarcanda | [Q5753](https://www.wikidata.org/wiki/Q5753) Samarcanda | 546.303 hab. (2020) · 108 km² · 702 m | Registán de Samarcanda, Mausoleo Gur-e Amir, Desierto de Karakum | Fue la capital de Tamerlán, y su plaza del Registán reúne tres madrazas cubiertas de mosaicos azules. |
| Cancún | [Q8969](https://www.wikidata.org/wiki/Q8969) Cancún | 888.797 hab. (2020) · 5 m | Mar Caribe, Península de Yucatán | Frente a sus costas está el Museo Subacuático de Arte, con cientos de esculturas que se convierten en arrecifes. |
| Chiang Mai | [Q52028](https://www.wikidata.org/wiki/Q52028) Chiang Mai | 1.198.000 hab. (2022) · 405 km² · 310 m | Indochina | Fundada en 1296 como capital del reino Lanna, cada noviembre su cielo se llena de faroles en la fiesta de Yi Peng. |
| Mánchester | [Q18125](https://www.wikidata.org/wiki/Q18125) Mánchester | 547.627 hab. (2018) · 116 km² · 38 m | Gran Bretaña, Islas Británicas | Aquí funcionó en 1948 la Baby, la primera computadora capaz de guardar un programa en su memoria. |
| Fráncfort | [Q1794](https://www.wikidata.org/wiki/Q1794) Fráncfort del Meno | 760.656 hab. (2025) · 248 km² · 112 m |  | Aquí nació Goethe en 1749, y la ciudad alberga el Banco Central Europeo, encargado del euro. |
| Florencia | [Q2044](https://www.wikidata.org/wiki/Q2044) Florencia | 360.930 hab. (2023) · 102 km² · 50 m | Península itálica, Apeninos | Cuna del Renacimiento, en su Galería de la Academia se exhibe el David de Miguel Ángel. |
| Sarajevo | [Q11194](https://www.wikidata.org/wiki/Q11194) Sarajevo | 275.524 hab. (2013) · 142 km² · 527 m | Península balcánica (Balcanes), Alpes Dináricos | En 1984 fue sede de los Juegos Olímpicos de Invierno, los primeros celebrados en un país socialista. |
| Zagreb | [Q1435](https://www.wikidata.org/wiki/Q1435) Zagreb | 767.131 hab. (2021) · 641 km² · 127 m | Península balcánica (Balcanes) | Allí está el Museo de las Relaciones Rotas, que exhibe objetos donados por personas tras una ruptura amorosa. |
| Belgrado | [Q3711](https://www.wikidata.org/wiki/Q3711) Belgrado | 1.197.714 hab. (2022) · 360 km² · 117 m | Río Danubio, Península balcánica (Balcanes) | Su nombre significa ciudad blanca, y su Museo Nikola Tesla guarda las cenizas del inventor en una esfera dorada. |
| Sofía | [Q472](https://www.wikidata.org/wiki/Q472) Sofía | 1.213.134 hab. (2025) · 492 km² · 560 m | Península balcánica (Balcanes), Montes Balcanes | Toma su nombre de la antigua iglesia de Santa Sofía, y su lema es Crece, pero no envejece. |
| Minsk | [Q2280](https://www.wikidata.org/wiki/Q2280) Minsk | 1.995.091 hab. (2026) · 410 km² · 280 m | Llanura del Norte de Europa | Su Biblioteca Nacional tiene forma de diamante gigante y de noche su fachada se ilumina con miles de luces LED. |
| Reikiavik | [Q1764](https://www.wikidata.org/wiki/Q1764) Reikiavik | 138.772 hab. (2025) · 244 km² · 8 m | Hallgrímskirkja | Su nombre significa bahía humeante por el vapor de sus fuentes termales, que hoy calientan casi todas sus casas. |
| Nicosia | [Q3856](https://www.wikidata.org/wiki/Q3856) Nicosia | 56.848 hab. (2021) · 51 km² · 220 m | Mar Mediterráneo | Su centro histórico está rodeado por murallas venecianas del siglo XVI con forma de estrella y once bastiones. |
| La Valeta | [Q23800](https://www.wikidata.org/wiki/Q23800) La Valeta | 5.197 hab. (2021) · 1 km² · 56 m | Mar Mediterráneo | La construyeron los Caballeros de San Juan desde 1566 y lleva el nombre de su gran maestre, Jean de la Valette. |
| Luxemburgo | [Q1842](https://www.wikidata.org/wiki/Q1842) Luxemburgo | 137.678 hab. (2026) · 52 km² · 300 m |  | Bajo su casco antiguo se extienden las Casamatas del Bock, kilómetros de túneles defensivos excavados en la roca. |
| Bagdad | [Q1530](https://www.wikidata.org/wiki/Q1530) Bagdad | 8.126.755 hab. (2018) · 673 km² · 34 m | Mesopotamia, Río Tigris | Fundada en el año 762 por el califa al-Mansur, se diseñó como una ciudad circular y fue un gran centro del saber. |
| Kabul | [Q5838](https://www.wikidata.org/wiki/Q5838) Kabul | 5.333.284 hab. (2025) · 275 km² · 1.790 m | Hindu Kush | En los Jardines de Babur descansa el fundador del Imperio mogol, que pidió ser enterrado en la ciudad que tanto amaba. |
| Hong Kong | [Q8646](https://www.wikidata.org/wiki/Q8646) Hong Kong | 7.413.070 hab. (2021) · 2.755 km² · 7 m | Mar de China Meridional | Su nombre significa puerto fragante, y es una de las ciudades con más rascacielos del mundo. |
| Taipéi | [Q1867](https://www.wikidata.org/wiki/Q1867) Taipéi | 2.429.429 hab. (2026) · 272 km² · 10 m | Taipei 101 | Su Taipei 101 fue el edificio más alto del mundo entre 2004 y 2010 y tiene una enorme esfera de acero que lo estabiliza. |
| Chengdú | [Q30002](https://www.wikidata.org/wiki/Q30002) Chengdu | 20.937.757 hab. (2020) · 14.378 km² · 500 m |  | Es famosa por su base de cría de pandas gigantes, y la Unesco la nombró Ciudad de la Gastronomía en 2010. |
| Bandar Seri Begawan | [Q9279](https://www.wikidata.org/wiki/Q9279) Bandar Seri Begawan | 50.000 hab. (2015) · 100 km² · 14 m | Borneo, Mar de China Meridional | Su barrio Kampong Ayer es una aldea construida sobre pilotes en el agua, con escuelas, mezquitas y pasarelas de madera. |
| Dili | [Q9310](https://www.wikidata.org/wiki/Q9310) Dili | 222.323 hab. (2015) · 179 km² · 11 m |  | Sobre un cabo cercano se alza el Cristo Rei, una estatua de 27 metros que reposa sobre un globo terráqueo. |
| Mascate | [Q3826](https://www.wikidata.org/wiki/Q3826) Mascate | 1.421.409 hab. (2019) · 3.500 km² · 69 m | Península arábiga | En 2011 abrió su Ópera Real, la primera casa de ópera de la península arábiga. |
| Doha | [Q3861](https://www.wikidata.org/wiki/Q3861) Doha | 1.186.023 hab. (2020) · 132 km² · 0 m | Península arábiga, Golfo Pérsico | Su Museo de Arte Islámico, inaugurado en 2008, lo diseñó I. M. Pei, el arquitecto de la pirámide del Louvre. |
| Kuwait | [Q35178](https://www.wikidata.org/wiki/Q35178) Ciudad de Kuwait | 2.989.000 hab. (2018) · 16 m | Golfo Pérsico | Sus famosas Torres de Kuwait, inauguradas en 1979, son en parte depósitos de agua decorados con esferas azules. |
| Damasco | [Q3766](https://www.wikidata.org/wiki/Q3766) Damasco | 2.685.360 hab. (2024) · 105 km² · 680 m | Baalbek | Se considera una de las ciudades habitadas más antiguas del mundo, y de ella toma su nombre el tejido damasco. |
| Ammán | [Q3805](https://www.wikidata.org/wiki/Q3805) Amán | 4.007.526 hab. (2015) · 1.680 km² · 776 m |  | En la época romana se llamaba Filadelfia, y en su centro aún se conserva un teatro romano para unas 6.000 personas. |
| Pyongyang | [Q18808](https://www.wikidata.org/wiki/Q18808) Pionyang | 2.863.000 hab. (2015) · 3.194 km² · 38 m | Península de Corea | Su metro es uno de los más profundos del mundo, con estaciones decoradas con candelabros y grandes murales. |
| San José | [Q3070](https://www.wikidata.org/wiki/Q3070) San José | 335.007 hab. (2025) · 45 km² · 1.161 m | Teatro Nacional de Costa Rica | Su Teatro Nacional, inaugurado en 1897, se financió con un impuesto a la exportación de café. |
| Panamá | [Q3306](https://www.wikidata.org/wiki/Q3306) Ciudad de Panamá | 1.540.000 hab. (2026) · 275 km² · 20 m | Canal de Panamá, Istmo de Panamá | Su colorido Biomuseo, abierto en 2014, fue la primera obra del arquitecto Frank Gehry en América Latina. |
| Guatemala | [Q1555](https://www.wikidata.org/wiki/Q1555) Ciudad de Guatemala | 994.938 hab. (2025) · 692 km² · 1.500 m |  | Su nombre oficial es Nueva Guatemala de la Asunción, y dentro de la ciudad están las ruinas mayas de Kaminaljuyú. |
| Santo Domingo | [Q34820](https://www.wikidata.org/wiki/Q34820) Santo Domingo | 2.201.941 hab. (2025) · 1.302 km² · 14 m | Alcázar de Colón, Mar Caribe, La Española | Fundada en 1496, es la ciudad europea más antigua de América y tiene la primera catedral del continente. |
| Monterrey | [Q81033](https://www.wikidata.org/wiki/Q81033) Monterrey | 1.142.952 hab. (2020) · 970 km² · 546 m | Sierra Madre Oriental | Su símbolo es el Cerro de la Silla, una montaña con forma de silla de montar, y su plato típico es el cabrito asado. |
| Cali | [Q51103](https://www.wikidata.org/wiki/Q51103) Cali | 2.471.474 hab. (2018) · 564 km² · 1.018 m | Cristo Rey de Cali, Basílica del Señor de los Milagros de Buga, Cordillera de los Andes | La llaman la capital mundial de la salsa, y cada diciembre celebra la Feria de Cali con desfiles y orquestas. |
| Valparaíso | [Q33986](https://www.wikidata.org/wiki/Q33986) Valparaíso | 296.655 hab. (2017) · 48 km² · 21 m | Cordillera de los Andes | Sus ascensores funiculares suben los cerros desde 1883 y su casco histórico es Patrimonio de la Humanidad. |
| Rosario | [Q52535](https://www.wikidata.org/wiki/Q52535) Rosario | 1.037.710 hab. (2022) · 179 km² · 31 m | Río Paraná, La Pampa | Allí Manuel Belgrano izó por primera vez la bandera argentina en 1812, y en la ciudad nació Lionel Messi. |
| Barranquilla | [Q62823](https://www.wikidata.org/wiki/Q62823) Barranquilla | 1.326.588 hab. (2023) · 154 km² · 18 m | Ventana al Mundo, Puente Pumarejo, Mar Caribe | Su carnaval es Patrimonio de la Humanidad desde 2003, y allí nacieron Shakira y Sofía Vergara. |
| Ushuaia | [Q44254](https://www.wikidata.org/wiki/Q44254) Ushuaia | 82.615 hab. (2022) · 23 km² · 23 m | Faro del Fin del Mundo, Patagonia, Tierra del Fuego | Su antigua cárcel hoy es un museo, y el Tren del Fin del Mundo recorre la vía que usaban los presos para buscar leña. |
| Iquitos | [Q193289](https://www.wikidata.org/wiki/Q193289) Iquitos | 377.609 hab. (2017) · 1.213 km² · 106 m | Amazonia, Río Amazonas | Es la ciudad más grande del mundo a la que no se puede llegar por carretera, solo en barco o en avión. |
| Manaus | [Q40236](https://www.wikidata.org/wiki/Q40236) Manaos | 2.303.732 hab. (2025) · 11.401 km² · 92 m | Amazonia, Río Amazonas | Durante el auge del caucho levantó el Teatro Amazonas, inaugurado en 1896 con materiales traídos de Europa. |
| Whitehorse | [Q2058](https://www.wikidata.org/wiki/Q2058)  |  |  | Su nombre viene de unos rápidos cuya espuma recordaba crines de caballos blancos, y creció con la fiebre del oro del Klondike. |
| Anchorage | [Q39450](https://www.wikidata.org/wiki/Q39450) Anchorage | 289.600 hab. (2024) · 5.083 km² · 31 m |  | Cada marzo arranca allí la famosa carrera de trineos con perros Iditarod, y es común ver alces por sus calles. |
| Sucre | [Q2907](https://www.wikidata.org/wiki/Q2907) Sucre | 360.544 hab. (2021) · 1.768 km² · 2.810 m | Cordillera de los Andes, Amazonia | Lleva el nombre del mariscal Antonio José de Sucre, y en su Casa de la Libertad se firmó la independencia de Bolivia en 1825. |
| Cayena | [Q44401](https://www.wikidata.org/wiki/Q44401) Cayena | 62.675 hab. (2023) · 24 km² · 143 m | Macizo Guayanés | Su carnaval es famoso por las touloulous, mujeres disfrazadas de pies a cabeza que eligen pareja en bailes de máscaras. |
| Belmopan | [Q3043](https://www.wikidata.org/wiki/Q3043) Belmopán | 20.754 hab. (2022) · 33 km² · 76 m | Península de Yucatán | Es una capital planificada, inaugurada en 1970, y su nombre combina los de los ríos Belice y Mopan. |
| Kingston | [Q34692](https://www.wikidata.org/wiki/Q34692) Kingston | 937.700 hab. (2025) · 22 km² · 9 m | Mar Caribe, Antillas Mayores | La antigua casa de Bob Marley es hoy un museo dedicado a él, y la ciudad es considerada la cuna del reggae. |
| Port-au-Prince | [Q34261](https://www.wikidata.org/wiki/Q34261) Puerto Príncipe | 987.310 hab. (2015) · 36 km² · 98 m | Mar Caribe, La Española, Antillas Mayores | Su nombre recuerda al barco francés Le Prince, que fondeó en su bahía a comienzos del siglo XVIII. |
| Nassau | [Q2467](https://www.wikidata.org/wiki/Q2467) Nasáu | 227.940 hab. (2025) · 207 km² · 34 m |  | A comienzos del siglo XVIII fue refugio de piratas como Barbanegra, y su nombre honra al rey Guillermo III de Orange-Nassau. |
| Punta Arenas | [Q51599](https://www.wikidata.org/wiki/Q51599) Punta Arenas | 123.403 hab. (2017) · 38 km² · 34 m | Patagonia, Estrecho de Magallanes | En su plaza hay un monumento a Magallanes, y la tradición dice que quien toca el pie del indígena volverá a la ciudad. |
| Curitiba | [Q4361](https://www.wikidata.org/wiki/Q4361) Curitiba | 1.830.795 hab. (2025) · 431 km² · 935 m | Altiplano Brasileño | Fue pionera del autobús de tránsito rápido en 1974, y sus estaciones con forma de tubo son un ícono de la ciudad. |
| Puebla | [Q125293](https://www.wikidata.org/wiki/Q125293) Heroica Puebla de Zaragoza | 1.542.232 hab. (2020) · 546 km² · 2.153 m |  | Es cuna del mole poblano y de los chiles en nogada, y su cerámica de talavera es famosa en todo México. |
| Santa Cruz | [Q170688](https://www.wikidata.org/wiki/Q170688) Santa Cruz de la Sierra | 3.122.605 hab. (2024) · 535 km² · 416 m | Amazonia | Fundada en 1561 por Ñuflo de Chaves, es famosa por su colorido carnaval, uno de los más grandes de Bolivia. |
| Arequipa | [Q159273](https://www.wikidata.org/wiki/Q159273) Arequipa | 1.008.290 hab. (2017) · 650 km² · 2.335 m | Cordillera de los Andes | La llaman la Ciudad Blanca por el sillar, una piedra volcánica clara, y allí nació el escritor Mario Vargas Llosa. |
| Mendoza | [Q44237](https://www.wikidata.org/wiki/Q44237) Mendoza | 127.160 hab. (2022) · 54 km² · 769 m | Cordillera de los Andes, Patagonia | Es la capital argentina del vino malbec y cada año celebra la Fiesta Nacional de la Vendimia. |
| Harare | [Q3921](https://www.wikidata.org/wiki/Q3921) Harare | 2.150.000 hab. (2012) · 961 km² · 1.494 m |  | Se llamó Salisbury hasta 1982, cuando tomó el nombre de un antiguo jefe local llamado Neharawa. |
| Abiyán | [Q1515](https://www.wikidata.org/wiki/Q1515) Abiyán | 5.616.633 hab. (2021) · 2.119 km² · 18 m | Golfo de Guinea | En otros tiempos la apodaban la París de África Occidental, y su barrio Plateau está lleno de rascacielos. |
| Trípoli | [Q3579](https://www.wikidata.org/wiki/Q3579) Trípoli | 1.176.000 hab. (2022) · 3.127 km² · 81 m | Mar Mediterráneo | En su ciudad vieja se conserva el Arco de Marco Aurelio, un monumento romano del siglo II. |
| Durban | [Q5468](https://www.wikidata.org/wiki/Q5468) Durban | 595.061 hab. (2011) · 226 km² · 22 m |  | Es la cuna del bunny chow, medio pan relleno de curry, y tiene una de las mayores comunidades indias fuera de la India. |
| Abuya | [Q3787](https://www.wikidata.org/wiki/Q3787) Abuya | 1.693.400 hab. (2022) · 713 km² · 360 m |  | Se construyó como capital planificada y en 1991 reemplazó a Lagos; sobre ella se alza la enorme roca Aso. |
| Fez | [Q80985](https://www.wikidata.org/wiki/Q80985) Fez | 1.167.842 hab. (2024) · 320 km² · 408 m | Cordillera del Atlas | Allí está Al Qarawiyyin, fundada en 859 por Fátima al-Fihri, considerada la universidad más antigua en funcionamiento. |
| Douala | [Q132830](https://www.wikidata.org/wiki/Q132830) Duala | 2.768.436 hab. (2015) · 210 km² · 13 m |  | Es la cuna del makossa, un ritmo que el saxofonista Manu Dibango llevó al mundo con Soul Makossa en 1972. |
| Kumasi | [Q182059](https://www.wikidata.org/wiki/Q182059) Kumasi | 3.903.480 hab. (2024) · 254 km² · 300 m |  | Fue la capital del reino ashanti, cuyo símbolo sagrado es el Taburete Dorado, y su mercado de Kejetia es enorme. |
| Conakry | [Q3733](https://www.wikidata.org/wiki/Q3733) Conakri | 1.667.864 hab. (2014) · 450 km² · 13 m |  | La cantante sudafricana Miriam Makeba, Mama África, vivió allí muchos años y representó a Guinea ante la ONU. |
| Lubumbashi | [Q187593](https://www.wikidata.org/wiki/Q187593) Lubumbashi | 1.786.397 hab. (2012) · 747 km² · 1.208 m |  | Se llamó Élisabethville hasta 1966, es el centro del cobre del país y la casa del famoso club de fútbol TP Mazembe. |
| Jartum | [Q1963](https://www.wikidata.org/wiki/Q1963) Jartum | 5.345.000 hab. (2018) · 30.000 km² · 382 m | Desierto del Sahara, Río Nilo, Sahel | Su nombre suele interpretarse como trompa de elefante, por la forma de la franja de tierra donde nació la ciudad. |
| Yibuti | [Q3604](https://www.wikidata.org/wiki/Q3604) Ciudad de Yibuti | 603.900 hab. (2018) · 200 km² · 14 m | Gran Valle del Rift, Golfo de Adén, Depresión de Danakil | Fue fundada por los franceses en 1888, y su puerto es el final del ferrocarril eléctrico a Adís Abeba, inaugurado en 2016. |
| Moroni | [Q3901](https://www.wikidata.org/wiki/Q3901) Moroni | 85.400 hab. (2025) · 30 km² · 29 m | Canal de Mozambique | Su Antigua Mezquita del Viernes data de 1427, y el país es gran productor de ylang-ylang, una flor usada en perfumes. |
| Victoria | [Q3940](https://www.wikidata.org/wiki/Q3940) Victoria | 24.701 hab. (2014) · 20 km² |  | Su torre del reloj, de 1903, es una réplica de una de Londres, y los locales la llaman Little Ben. |
| Port Louis | [Q3929](https://www.wikidata.org/wiki/Q3929) Port Louis | 149.194 hab. (2012) · 47 km² · 134 m |  | Su Museo Blue Penny exhibe los célebres sellos Post Office de 1847, entre los más raros y valiosos del mundo. |
| Lomé | [Q3792](https://www.wikidata.org/wiki/Q3792) Lomé | 2.188.376 hab. (2023) · 90 km² · 10 m |  | Su Gran Mercado es famoso por las Nana Benz, vendedoras de telas que se enriquecieron y conducían autos Mercedes-Benz. |
| Cotonú | [Q43595](https://www.wikidata.org/wiki/Q43595) Cotonú | 780.000 hab. (2025) · 79 km² · 3 m |  | Su mercado de Dantokpa es uno de los más grandes de África Occidental, con miles de puestos de todo tipo. |
| Monrovia | [Q3748](https://www.wikidata.org/wiki/Q3748) Monrovia | 1.761.032 hab. (2022) · 194 km² |  | Lleva el nombre del presidente estadounidense James Monroe y fue fundada en 1822 por colonos llegados de Estados Unidos. |
| Freetown | [Q3780](https://www.wikidata.org/wiki/Q3780) Freetown | 1.055.964 hab. (2015) · 357 km² · 26 m |  | Su Fourah Bay College, fundado en 1827, fue la primera universidad de estilo occidental en África Occidental. |
| Bisáu | [Q3739](https://www.wikidata.org/wiki/Q3739) Bisáu | 492.004 hab. (2015) · 78 km² · 0 m |  | Su carnaval llena las calles de máscaras y disfraces cada año, y el país es uno de los grandes exportadores de anacardo. |
| Gaborone | [Q3919](https://www.wikidata.org/wiki/Q3919) Gaborone | 246.325 hab. (2022) · 169 km² · 1.014 m |  | Debe su nombre al jefe Gaborone, y allí transcurren las novelas de La primera agencia de mujeres detectives. |
| Maseru | [Q3909](https://www.wikidata.org/wiki/Q3909) Maseru | 343.541 hab. (2016) · 138 km² · 1.600 m | Drakensberg | Allí hay una tienda de artesanías con forma de mokorotlo, el sombrero cónico tradicional que aparece en la bandera del país. |

## Países (banderas) (166)

| Lugar | Wikidata | Cifras | Cerca | Dato curioso |
|---|---|---|---|---|
| Afghanistan | [Q889](https://www.wikidata.org/wiki/Q889) Afganistán | 41.454.761 hab. (2023) · 652.230 km² · capital Kabul · idioma uzbeko, turcomano, árabe |  | Sus minas de lapislázuli se explotan desde hace milenios; esa piedra azul llegó a las joyas de los faraones egipcios. |
| Albania | [Q222](https://www.wikidata.org/wiki/Q222) Albania | 2.811.655 hab. (2023) · 28.748 km² · capital Tirana · idioma albanés |  | Sus habitantes llaman a su país Shqipëria, un nombre que suele traducirse como tierra de las águilas. |
| Algeria | [Q262](https://www.wikidata.org/wiki/Q262) Argelia | 45.600.000 hab. (2026) · 2.381.741 km² · capital Argel · idioma árabe, Standard Algerian Berber | Ahaggar (Hoggar) | En el Tassili n'Ajjer hay miles de pinturas rupestres que muestran un Sahara verde con jirafas, elefantes y ganado. |
| Angola | [Q916](https://www.wikidata.org/wiki/Q916) Angola | 36.749.906 hab. (2023) · 1.246.700 km² · capital Luanda · idioma portugués |  | La kizomba, baile de pareja hoy popular en todo el mundo, nació allí a partir del semba en los años 80. |
| Argentina | [Q414](https://www.wikidata.org/wiki/Q414) Argentina | 47.327.407 hab. (2022) · 2.780.400 km² · capital Buenos Aires · idioma español | Obelisco de Buenos Aires, Casa Rosada, Río de la Plata | Fue pionera en identificar personas por sus huellas dactilares, con el sistema que Juan Vucetich creó en 1891. |
| Armenia | [Q399](https://www.wikidata.org/wiki/Q399) Armenia | 2.930.450 hab. (2017) · 29.743 km² · capital Ereván · idioma armenio |  | Tiene su propio alfabeto, creado por el monje Mesrop Mashtots hacia el año 405 y que se usa hasta hoy. |
| Australia | [Q408](https://www.wikidata.org/wiki/Q408) Australia | 27.614.411 hab. (2025) · 8.148.250 km² · capital Canberra · idioma inglés | Ópera de Sídney, Puente de la Bahía de Sídney, Uluru (Ayers Rock) | Tiene la mayor población de camellos salvajes del mundo, descendientes de los traídos en el siglo XIX para cruzar el desierto. |
| Austria | [Q40](https://www.wikidata.org/wiki/Q40) Austria | 8.979.894 hab. (2022) · 83.879 km² · capital Viena · idioma alemán, lengua austríaca de signos | Palacio de Schönbrunn, Lago de Constanza | En Viena funciona el zoológico más antiguo del mundo que sigue abierto: el de Schönbrunn, fundado en 1752. |
| Azerbaijan | [Q227](https://www.wikidata.org/wiki/Q227) Azerbaiyán | 10.180.770 hab. (2023) · 86.600 km² · capital Bakú · idioma azerí, lengua de signos azerbaiyana |  | Lo llaman la tierra del fuego: en Yanar Dag una ladera arde sin parar gracias al gas natural que sale del suelo. |
| Bahamas | [Q778](https://www.wikidata.org/wiki/Q778) Bahamas | 399.440 hab. (2023) · 13.878 km² · capital Nasáu · idioma inglés |  | En el cayo Big Major, en Exuma, viven cerdos que nadan hasta los botes de los visitantes. |
| Bangladesh | [Q902](https://www.wikidata.org/wiki/Q902) Bangladés | 175.686.899 hab. (2025) · 147.570 km² · capital Daca · idioma bengalí | Sundarbans, Delta del Ganges | El Día Internacional de la Lengua Materna, el 21 de febrero, recuerda un movimiento de 1952 en defensa del idioma bengalí. |
| Belarus | [Q184](https://www.wikidata.org/wiki/Q184) Bielorrusia | 9.056.080 hab. (2026) · 207.600 km² · capital Minsk · idioma ruso, bielorruso |  | Allí está parte del bosque de Białowieża, un bosque primigenio donde vive en libertad el bisonte europeo. |
| Belgium | [Q31](https://www.wikidata.org/wiki/Q31) Bélgica | 11.825.551 hab. (2025) · 30.688 km² · capital Bruselas · idioma francés, alemán, neerlandés | Atomium, Campanario de Brujas | El saxofón lo inventó el belga Adolphe Sax, que lo patentó en 1846. |
| Belize | [Q242](https://www.wikidata.org/wiki/Q242) Belice | 411.106 hab. (2023) · 22.966 km² · capital Belmopán · idioma inglés |  | Su Gran Agujero Azul, una sima marina circular de unos 300 m de ancho, se hizo famoso gracias a Jacques Cousteau en 1971. |
| Benin | [Q962](https://www.wikidata.org/wiki/Q962) Benín | 14.111.034 hab. (2023) · 114.763 km² · capital Porto Novo · idioma francés |  | Ganvié, un pueblo construido sobre pilotes en el lago Nokoué, es conocido como la Venecia de África. |
| Bhutan | [Q917](https://www.wikidata.org/wiki/Q917) Bután | 796.682 hab. (2025) · 38.394 km² · capital Timbu · idioma idioma dzongkha |  | En lugar de medir solo el PIB, mide su progreso con un índice de Felicidad Nacional Bruta. |
| Bolivia | [Q750](https://www.wikidata.org/wiki/Q750) Bolivia | 12.244.159 hab. (2023) · 1.098.581 km² · capital La Paz · idioma español, aymara, lenguas quechuas | Tiwanaku, Fuerte de Samaipata, Lago Titicaca | El salar de Uyuni es el más grande del mundo y en época de lluvias se convierte en un espejo gigante. |
| Bosnia and Herz. | [Q225](https://www.wikidata.org/wiki/Q225) Bosnia y Herzegovina | 3.816.459 hab. (2022) · 51.209 km² · capital Sarajevo · idioma croata, serbio, bosnio |  | En Mostar, clavadistas saltan al río Neretva desde el Puente Viejo, a unos 20 metros, una tradición de siglos. |
| Botswana | [Q963](https://www.wikidata.org/wiki/Q963) Botsuana | 2.480.244 hab. (2023) · 581.737 km² · capital Gaborone · idioma inglés |  | En el delta del Okavango, el río se abre en un gran humedal que nunca llega al mar y atrae a miles de animales. |
| Brazil | [Q155](https://www.wikidata.org/wiki/Q155) Brasil | 214.211.951 hab. (2026) · 8.515.767 km² · capital Brasilia · idioma portugués | Cristo Redentor, Pan de Azúcar, Río Amazonas | Su nombre viene del palo brasil, un árbol de madera rojiza como una brasa, muy cotizado para teñir telas. |
| Brunei | [Q921](https://www.wikidata.org/wiki/Q921) Brunéi | 458.949 hab. (2023) · 5.765 km² · capital Bandar Seri Begawan · idioma inglés británico, malayo |  | Kampong Ayer, en la capital, es un enorme barrio de casas sobre pilotes unidas por pasarelas de madera. |
| Bulgaria | [Q219](https://www.wikidata.org/wiki/Q219) Bulgaria | 6.423.207 hab. (2025) · 110.994 km² · capital Sofía · idioma búlgaro | Montes Balcanes | La bacteria del yogur Lactobacillus bulgaricus debe su nombre al país, donde Stamen Grigorov la identificó en 1905. |
| Burkina Faso | [Q965](https://www.wikidata.org/wiki/Q965) Burkina Faso | 23.025.776 hab. (2023) · 274.200 km² · capital Uagadugú · idioma diula, bissa, mossi |  | Su nombre, que combina dos idiomas locales, significa tierra de los hombres íntegros. |
| Burundi | [Q967](https://www.wikidata.org/wiki/Q967) Burundi | 13.689.450 hab. (2023) · 27.834 km² · capital Guitega · idioma francés, inglés, kirundi |  | Su danza de los tambores reales, tocados con grandes tambores llevados sobre la cabeza, es patrimonio de la UNESCO. |
| Cambodia | [Q424](https://www.wikidata.org/wiki/Q424) Camboya | 17.423.880 hab. (2023) · 181.035 km² · capital Nom Pen · idioma camboyano | Angkor Wat, Ta Prohm | Angkor Wat es el mayor monumento religioso del mundo y aparece en su bandera nacional. |
| Cameroon | [Q1009](https://www.wikidata.org/wiki/Q1009) Camerún | 28.372.687 hab. (2023) · 475.442 km² · capital Yaundé · idioma francés, inglés | Monte Camerún | Su nombre viene del portugués Rio dos Camarões, río de los camarones, por la abundancia que hallaron los navegantes. |
| Canada | [Q16](https://www.wikidata.org/wiki/Q16) Canadá | 40.000.000 hab. (2023) · 9.984.670 km² · capital Ottawa · idioma francés, inglés | Torre CN, Château Frontenac, Lago Superior | Su nombre viene de kanata, palabra iroquesa que significa aldea, que Jacques Cartier tomó por el nombre del territorio. |
| Central African Rep. | [Q929](https://www.wikidata.org/wiki/Q929) República Centroafricana | 5.152.421 hab. (2023) · 622.984 km² · capital Bangui · idioma francés, idioma sango |  | En Dzanga Bai, un claro de la selva, se reúnen a diario decenas de elefantes de bosque a beber agua rica en minerales. |
| Chad | [Q657](https://www.wikidata.org/wiki/Q657) Chad | 19.319.064 hab. (2023) · 1.284.000 km² · capital Yamena · idioma francés, árabe | Desierto del Sahara, Tibesti | Allí se halló en 2001 a Toumaï, un cráneo de unos 7 millones de años, uno de los homínidos más antiguos conocidos. |
| Chile | [Q298](https://www.wikidata.org/wiki/Q298) Chile | 19.458.000 hab. (2021) · 756.102 km² · capital Santiago de Chile · idioma español | Moáis de Isla de Pascua, Palacio de La Moneda, Cordillera de los Andes | En el desierto de Atacama, uno de los más secos del planeta, funcionan grandes observatorios astronómicos como ALMA. |
| China | [Q148](https://www.wikidata.org/wiki/Q148) República Popular China | 1.404.890.000 hab. (2025) · 9.596.961 km² · capital Pekín · idioma putonghua | Gran Muralla China, Ciudad Prohibida, Río Yangtsé | El papel, la brújula, la pólvora y la imprenta se celebran como sus cuatro grandes inventos. |
| Colombia | [Q739](https://www.wikidata.org/wiki/Q739) Colombia | 52.321.152 hab. (2023) · 1.141.748 km² · capital Bogotá · idioma español | Catedral de Sal de Zipaquirá, Santuario de Las Lajas, Río Magdalena | Es el país con más especies de aves del mundo: se han registrado más de 1.900. |
| Congo | [Q971](https://www.wikidata.org/wiki/Q971) Congo | 6.278.845 hab. (2024) · 342.000 km² · capital Brazzaville · idioma francés |  | Es cuna de La Sape, un movimiento de hombres que visten trajes elegantes y coloridos como una forma de arte. |
| Costa Rica | [Q800](https://www.wikidata.org/wiki/Q800) Costa Rica | 5.265.575 hab. (2024) · 51.180 km² · capital San José · idioma español | Teatro Nacional de Costa Rica, Volcán Arenal | Las esferas de piedra del Diquís, talladas por pueblos precolombinos, son casi perfectas y algunas pesan varias toneladas. |
| Côte d'Ivoire | [Q1008](https://www.wikidata.org/wiki/Q1008) Costa de Marfil | 31.165.654 hab. (2023) · 322.463 km² · capital Yamusukro · idioma francés | Golfo de Guinea | Es el mayor productor de cacao del mundo: de sus granos sale buena parte del chocolate que se consume. |
| Croatia | [Q224](https://www.wikidata.org/wiki/Q224) Croacia | 3.871.833 hab. (2021) · 56.594 km² · capital Zagreb · idioma croata | Murallas de Dubrovnik, Alpes Dináricos | La corbata viene de los pañuelos que usaban los soldados croatas en el siglo XVII; en francés se llamó cravate. |
| Cuba | [Q241](https://www.wikidata.org/wiki/Q241) Cuba | 10.985.974 hab. (2023) · 109.884 km² · capital La Habana · idioma español | Capitolio de La Habana, Antillas Mayores | Allí vive el zunzuncito o colibrí abeja, el ave más pequeña del mundo: mide unos 5 centímetros. |
| Cyprus | [Q229](https://www.wikidata.org/wiki/Q229) Chipre | 1.344.976 hab. (2023) · 9.242 km² · capital Nicosia · idioma turco, griego |  | La palabra cobre viene del latín cuprum, por sus antiguas minas: los romanos lo llamaban metal de Chipre. |
| Czechia | [Q213](https://www.wikidata.org/wiki/Q213) República Checa | 10.909.500 hab. (2025) · 78.871 km² · capital Praga · idioma checo | Puente de Carlos, Castillo de Praga | La palabra robot nació en R.U.R., una obra de teatro del escritor checo Karel Čapek estrenada en 1921. |
| Dem. Rep. Congo | [Q974](https://www.wikidata.org/wiki/Q974) República Democrática del Congo | 105.789.731 hab. (2023) · 2.344.858 km² · capital Kinsasa · idioma francés | Río Congo, Lago Tanganica, Cuenca del Congo | Es el único país donde viven los bonobos, simios que comparten casi el 99 % de su ADN con los humanos. |
| Denmark | [Q35](https://www.wikidata.org/wiki/Q35) Dinamarca | 5.822.863 hab. (2020) · 42.925 km² · capital Copenhague · idioma danés | La Sirenita, Puente de Öresund, Jutlandia | La empresa LEGO se fundó allí en 1932; su nombre viene de leg godt, que en danés significa juega bien. |
| Djibouti | [Q977](https://www.wikidata.org/wiki/Q977) Yibuti | 1.000.000 hab. (2026) · 23.200 km² · capital Ciudad de Yibuti · idioma francés, árabe |  | Entre noviembre y febrero, tiburones ballena se reúnen en el golfo de Tadjoura y se puede nadar junto a ellos. |
| Dominican Rep. | [Q786](https://www.wikidata.org/wiki/Q786) República Dominicana | 10.760.028 hab. (2022) · 48.671 km² · capital Santo Domingo · idioma español | Alcázar de Colón, La Española | El larimar, una piedra semipreciosa de color azul celeste, solo se ha encontrado en este país. |
| Ecuador | [Q736](https://www.wikidata.org/wiki/Q736) Ecuador | 16.938.986 hab. (2022) · 257.204 km² · capital Quito · idioma español, shuar, quichua norteño | Mitad del Mundo, Ingapirca, Chimborazo | Los famosos sombreros de Panamá en realidad se tejen en Ecuador con paja toquilla. |
| Egypt | [Q79](https://www.wikidata.org/wiki/Q79) Egipto | 114.500.000 hab. (2026) · 1.010.408 km² · capital El Cairo · idioma árabe | Pirámides de Giza, Abu Simbel, Delta del Nilo | La Gran Pirámide de Guiza fue la construcción más alta hecha por humanos durante unos 3.800 años. |
| El Salvador | [Q792](https://www.wikidata.org/wiki/Q792) El Salvador | 6.029.976 hab. (2024) · 21.041 km² · capital San Salvador · idioma español | Joya de Cerén | Su plato típico son las pupusas, tortillas rellenas de queso, frijol o chicharrón, que tienen su propio día nacional en noviembre. |
| Eq. Guinea | [Q983](https://www.wikidata.org/wiki/Q983) Guinea Ecuatorial | 1.847.549 hab. (2023) · 28.051 km² · capital Ciudad de la Paz · idioma francés, español, portugués |  | Es el único país africano donde el español es idioma oficial. |
| Eritrea | [Q986](https://www.wikidata.org/wiki/Q986) Eritrea | 3.497.000 hab. (2019) · 117.600 km² · capital Asmara · idioma idioma tigriña, inglés, árabe | Depresión de Danakil | Asmara, su capital, es patrimonio de la UNESCO por su arquitectura modernista, como una gasolinera con forma de avión. |
| Estonia | [Q191](https://www.wikidata.org/wiki/Q191) Estonia | 1.369.995 hab. (2025) · 45.339 km² · capital Tallin · idioma estonio |  | El software de Skype, lanzado en 2003, fue desarrollado por un equipo de programadores estonios. |
| eSwatini | [Q1050](https://www.wikidata.org/wiki/Q1050) Suazilandia | 1.230.506 hab. (2023) · 17.364 km² · capital Mbabane · idioma suazi, inglés |  | En 2018 cambió su nombre oficial de Suazilandia a Esuatini, que significa tierra de los suazis. |
| Ethiopia | [Q115](https://www.wikidata.org/wiki/Q115) Etiopía | 128.691.692 hab. (2023) · 1.104.300 km² · capital Adís Abeba · idioma amhárico | Iglesias de Lalibela, Obeliscos de Axum, Macizo Etíope | Usa su propio calendario, de 13 meses, que va unos siete u ocho años por detrás del gregoriano. |
| Fiji | [Q712](https://www.wikidata.org/wiki/Q712) Fiyi | 926.276 hab. (2018) · 18.274 km² · capital Suva · idioma hindi de Fiyi, inglés, fiyiano |  | Su primera medalla olímpica fue el oro en rugby 7 en Río 2016, y repitió el oro en Tokio 2020. |
| Finland | [Q33](https://www.wikidata.org/wiki/Q33) Finlandia | 5.652.881 hab. (2025) · 390.905 km² · capital Helsinki · idioma finés, sueco |  | La palabra sauna viene del finés, y en el país hay millones de ellas: en casas, oficinas y hasta en el Parlamento. |
| France | [Q142](https://www.wikidata.org/wiki/Q142) Francia | 68.605.616 hab. (2025) · 643.801 km² · capital París · idioma francés | Torre Eiffel, Museo del Louvre, Alpes | El sistema métrico decimal nació en Francia en la década de 1790 y hoy lo usa casi todo el mundo. |
| Gabon | [Q1000](https://www.wikidata.org/wiki/Q1000) Gabón | 2.300.000 hab. (2023) · 267.667 km² · capital Libreville · idioma francés |  | En el parque nacional de Loango se han visto hipopótamos nadando en el mar y elefantes caminando por la playa. |
| Gambia | [Q1005](https://www.wikidata.org/wiki/Q1005) Gambia | 2.639.916 hab. (2021) · 11.300 km² · capital Banjul · idioma inglés |  | En el estanque de Kachikally, en Bakau, viven cocodrilos sagrados tan mansos que los visitantes pueden tocarlos. |
| Georgia | [Q230](https://www.wikidata.org/wiki/Q230) Georgia | 3.694.600 hab. (2024) · 69.700 km² · capital Tiflis · idioma georgiano |  | Allí se hace vino desde hace unos 8.000 años, fermentado en grandes tinajas de barro enterradas llamadas qvevri. |
| Germany | [Q183](https://www.wikidata.org/wiki/Q183) Alemania | 83.467.117 hab. (2025) · 357.588 km² · capital Berlín · idioma alemán | Puerta de Brandeburgo, Castillo de Neuschwanstein, Río Rin | Johannes Gutenberg desarrolló allí la imprenta de tipos móviles hacia 1450, que revolucionó la difusión del saber. |
| Ghana | [Q117](https://www.wikidata.org/wiki/Q117) Ghana | 32.833.031 hab. (2021) · 238.535 km² · capital Acra · idioma inglés | Lago Volta | El kente, un tejido hecho a mano con franjas de colores, nació entre los pueblos ashanti y ewe y hoy es símbolo del país. |
| Greece | [Q41](https://www.wikidata.org/wiki/Q41) Grecia | 10.566.531 hab. (2022) · 131.957 km² · capital Atenas · idioma griego | Acrópolis de Atenas, Monasterios de Meteora, Mar Egeo | Los primeros Juegos Olímpicos de los que hay registro se celebraron en Olimpia en el año 776 a. C. |
| Guatemala | [Q774](https://www.wikidata.org/wiki/Q774) Guatemala | 17.263.239 hab. (2018) · 108.889 km² · capital Ciudad de Guatemala · idioma español | Tikal | Su moneda se llama quetzal, como el ave sagrada de los mayas que también aparece en su bandera. |
| Guinea | [Q1006](https://www.wikidata.org/wiki/Q1006) Guinea | 17.521.167 hab. (2025) · 245.857 km² · capital Conakri · idioma francés, languages of Guinea |  | Tiene las mayores reservas de bauxita del mundo, el mineral del que se obtiene el aluminio. |
| Guinea-Bissau | [Q1007](https://www.wikidata.org/wiki/Q1007) Guinea-Bisáu | 1.861.283 hab. (2017) · 36.125 km² · capital Bisáu · idioma portugués |  | En el archipiélago de las Bijagós viven hipopótamos que se bañan en agua salada y nadan entre las islas. |
| Guyana | [Q734](https://www.wikidata.org/wiki/Q734) Guyana | 878.674 hab. (2022) · 214.970 km² · capital Georgetown · idioma inglés |  | Las cataratas Kaieteur tienen una caída libre de 226 metros, unas cuatro veces la altura de las del Niágara. |
| Haiti | [Q790](https://www.wikidata.org/wiki/Q790) Haití | 10.981.229 hab. (2017) · 27.750 km² · capital Puerto Príncipe · idioma francés, criollo haitiano | Ciudadela Laferrière | La Ciudadela Laferrière, levantada en una montaña a inicios del siglo XIX, es una de las mayores fortalezas de América. |
| Honduras | [Q783](https://www.wikidata.org/wiki/Q783) Honduras | 11.002.356 hab. (2025) · 112.492 km² · capital Tegucigalpa · idioma español | Copán | En Copán está la Escalinata de los Jeroglíficos, con el texto maya tallado más largo que se conoce. |
| Hungary | [Q28](https://www.wikidata.org/wiki/Q28) Hungría | 9.489.000 hab. (2025) · 93.030 km² · capital Budapest · idioma húngaro | Parlamento de Budapest | El cubo de Rubik lo inventó en 1974 el profesor húngaro Ernő Rubik. |
| Iceland | [Q189](https://www.wikidata.org/wiki/Q189) Islandia | 376.248 hab. (2022) · 103.004 km² · capital Reikiavik · idioma islandés | Hallgrímskirkja, Glaciar Vatnajökull | Su parlamento, el Althing, se fundó en el año 930 y es uno de los más antiguos del mundo. |
| India | [Q668](https://www.wikidata.org/wiki/Q668) India | 1.326.093.247 hab. (2020) · 3.287.263 km² · capital Nueva Delhi · idioma hindi, inglés | Taj Mahal, Templo Dorado de Amritsar, Himalaya | El ajedrez desciende del chaturanga, un juego que surgió allí hacia el siglo VI. |
| Indonesia | [Q252](https://www.wikidata.org/wiki/Q252) Indonesia | 275.439.000 hab. (2021) · 1.904.570 km² · capital Yakarta · idioma indonesio | Borobudur, Prambanan, Borneo | Es el hogar del dragón de Komodo, el lagarto más grande del mundo, que puede medir hasta 3 metros. |
| Iran | [Q794](https://www.wikidata.org/wiki/Q794) Irán | 92.417.700 hab. (2025) · 1.648.195 km² · capital Teherán · idioma persa | Persépolis, Mezquita del Sah (Isfahán), Golfo Pérsico | Celebra el Año Nuevo, Nowruz, el primer día de la primavera, una tradición de más de 3.000 años. |
| Iraq | [Q796](https://www.wikidata.org/wiki/Q796) Irak | 43.500.000 hab. (2026) · 437.072 km² · capital Bagdad · idioma kurdo, árabe | Ciudadela de Erbil, Río Éufrates, Río Tigris | En ciudades de la antigua Mesopotamia como Uruk nació la escritura cuneiforme hace unos 5.000 años. |
| Ireland | [Q27](https://www.wikidata.org/wiki/Q27) Irlanda | 5.149.139 hab. (2022) · 69.797 km² · capital Dublín · idioma inglés, irlandés | Newgrange | Halloween tiene su origen en Samhain, una antigua fiesta celta que marcaba el fin de la cosecha. |
| Israel | [Q801](https://www.wikidata.org/wiki/Q801) Israel | 9.840.000 hab. (2023) · 20.770 km² · capital Jerusalén · idioma hebreo | Cúpula de la Roca, Muro de las Lamentaciones, Río Jordán | El riego por goteo moderno se desarrolló allí en los años 60 y hoy ahorra agua en cultivos de todo el mundo. |
| Italy | [Q38](https://www.wikidata.org/wiki/Q38) Italia | 58.850.717 hab. (2023) · 302.068 km² · capital Roma · idioma italiano | Coliseo, Torre de Pisa, Mar Adriático | La ópera nació en Florencia hacia 1600, y muchos de los términos musicales que usamos son italianos. |
| Jamaica | [Q766](https://www.wikidata.org/wiki/Q766) Jamaica | 2.734.093 hab. (2019) · 10.992 km² · capital Kingston · idioma criollo jamaicano, inglés |  | Allí nació el reggae a fines de los años 60, y en 2018 la UNESCO lo declaró patrimonio cultural inmaterial. |
| Japan | [Q17](https://www.wikidata.org/wiki/Q17) Japón | 123.802.000 hab. (2024) · 377.974 km² · capital Tokio · idioma japonés | Torre de Tokio, Castillo de Himeji, Monte Fuji | Su tren bala, el Shinkansen, empezó a funcionar en 1964, justo antes de los Juegos Olímpicos de Tokio. |
| Jordan | [Q810](https://www.wikidata.org/wiki/Q810) Jordania | 11.300.000 hab. (2026) · 89.341 km² · capital Amán · idioma árabe | Petra, Mar Muerto, Desierto del Néguev | Petra, la ciudad tallada en roca rosada por los nabateos, es una de las siete nuevas maravillas del mundo. |
| Kazakhstan | [Q232](https://www.wikidata.org/wiki/Q232) Kazajistán | 20.139.914 hab. (2024) · 2.724.900 km² · capital Astaná · idioma ruso, kazajo | Mar Caspio, Mar de Aral, Lago Baljash | Desde el cosmódromo de Baikonur despegó Yuri Gagarin en 1961, en el primer viaje de un ser humano al espacio. |
| Kenya | [Q114](https://www.wikidata.org/wiki/Q114) Kenia | 47.564.296 hab. (2019) · 581.309 km² · capital Nairobi · idioma inglés, suajili | Lago Turkana, Monte Kenia | Eliud Kipchoge, uno de sus grandes fondistas, corrió en 2019 un maratón en menos de dos horas en una prueba no oficial. |
| Kuwait | [Q817](https://www.wikidata.org/wiki/Q817) Kuwait | 4.300.000 hab. (2026) · 17.818 km² · capital Ciudad de Kuwait · idioma árabe |  | Su moneda, el dinar kuwaití, es la unidad monetaria de mayor valor del mundo frente al dólar. |
| Kyrgyzstan | [Q813](https://www.wikidata.org/wiki/Q813) Kirguistán | 7.281.800 hab. (2025) · 199.951 km² · capital Biskek · idioma kirguís |  | La epopeya de Manas, transmitida de forma oral durante siglos, es uno de los poemas épicos más largos del mundo. |
| Laos | [Q819](https://www.wikidata.org/wiki/Q819) Laos | 6.858.160 hab. (2017) · 236.800 km² · capital Vientián · idioma lao | Río Mekong | En la Llanura de las Jarras hay miles de vasijas de piedra gigantes de la Edad del Hierro cuyo uso aún se debate. |
| Latvia | [Q211](https://www.wikidata.org/wiki/Q211) Letonia | 1.845.096 hab. (2026) · 64.594 km² · capital Riga · idioma letón |  | Su Festival de la Canción y la Danza reúne a miles de coristas cada cinco años y es patrimonio de la UNESCO. |
| Lebanon | [Q822](https://www.wikidata.org/wiki/Q822) Líbano | 5.300.000 hab. (2026) · 10.452 km² · capital Beirut · idioma árabe | Baalbek | De ciudades fenicias como Biblos salió el alfabeto fenicio, antepasado de los alfabetos griego y latino. |
| Lesotho | [Q1013](https://www.wikidata.org/wiki/Q1013) Lesoto | 2.233.339 hab. (2017) · 30.355 km² · capital Maseru · idioma sesotho, inglés |  | Su sombrero tradicional de paja, el mokorotlo, de forma cónica, es símbolo nacional y aparece en la bandera. |
| Liberia | [Q1014](https://www.wikidata.org/wiki/Q1014) Liberia | 5.214.030 hab. (2021) · 111.369 km² · capital Monrovia · idioma inglés |  | Su capital, Monrovia, debe su nombre a James Monroe, quinto presidente de Estados Unidos. |
| Libya | [Q1016](https://www.wikidata.org/wiki/Q1016) Libia | 7.100.000 hab. (2026) · 1.759.541 km² · capital Trípoli · idioma árabe |  | Las ruinas romanas de Leptis Magna, ciudad natal del emperador Septimio Severo, están entre las mejor conservadas. |
| Lithuania | [Q37](https://www.wikidata.org/wiki/Q37) Lituania | 2.860.002 hab. (2023) · 65.300 km² · capital Vilna · idioma lituano |  | Tiene una enorme tradición de baloncesto y ganó tres bronces olímpicos seguidos: 1992, 1996 y 2000. |
| Luxembourg | [Q32](https://www.wikidata.org/wiki/Q32) Luxemburgo | 690.959 hab. (2026) · 2.593 km² · capital Luxemburgo · idioma francés, alemán, luxemburgués |  | En 2020 se convirtió en el primer país en ofrecer transporte público gratuito en todo su territorio. |
| Macedonia | [Q221](https://www.wikidata.org/wiki/Q221) Macedonia del Norte | 1.836.713 hab. (2021) · 25.713 km² · capital Skopie · idioma albanés, macedonio |  | La madre Teresa de Calcuta nació en 1910 en Skopie, la capital del país. |
| Madagascar | [Q1019](https://www.wikidata.org/wiki/Q1019) Madagascar | 31.964.956 hab. (2024) · 587.295 km² · capital Antananarivo · idioma francés, malgache | Canal de Mozambique | Los lémures solo viven en libertad en esta isla, donde hay más de cien especies distintas. |
| Malawi | [Q1020](https://www.wikidata.org/wiki/Q1020) Malaui | 17.563.749 hab. (2018) · 118.484 km² · capital Lilongüe · idioma Idioma tumbuka, inglés, chichewa | Lago Malaui | Su gran lago alberga más especies de peces que cualquier otro lago del mundo, en su mayoría cíclidos de colores. |
| Malaysia | [Q833](https://www.wikidata.org/wiki/Q833) Malasia | 34.231.700 hab. (2025) · 330.803 km² · capital Kuala Lumpur · idioma malayo | Torres Petronas | Las Torres Petronas fueron los edificios más altos del mundo entre 1998 y 2004 y siguen siendo las torres gemelas más altas. |
| Mali | [Q912](https://www.wikidata.org/wiki/Q912) Mali | 22.395.489 hab. (2022) · 1.240.192 km² · capital Bamako · idioma Bozo, Maninka, Minyanka | Gran Mezquita de Djenné, Mezquita de Sankoré (Tombuctú), Río Níger | La Gran Mezquita de Djenné es el mayor edificio de adobe del mundo y cada año la comunidad renueva su revoque de barro. |
| Mauritania | [Q1025](https://www.wikidata.org/wiki/Q1025) Mauritania | 4.900.000 hab. (2026) · 1.030.700 km² · capital Nuakchot · idioma francés, árabe |  | Su tren del hierro, de hasta 2,5 km de largo, es uno de los más largos y pesados del mundo. |
| Mexico | [Q96](https://www.wikidata.org/wiki/Q96) México | 132.274.416 hab. (2024) · 1.972.550 km² · capital Ciudad de México · idioma español, náhuatl, maya | Chichén Itzá, Teotihuacán, Popocatépetl | El maíz se domesticó allí hace unos 9.000 años a partir de una planta silvestre llamada teocintle. |
| Moldova | [Q217](https://www.wikidata.org/wiki/Q217) Moldavia | 3.599.528 hab. (2024) · 33.844 km² · capital Chisináu · idioma rumano |  | La bodega de Mileștii Mici tiene la mayor colección de vinos del mundo según Guinness, en unos 200 km de galerías. |
| Mongolia | [Q711](https://www.wikidata.org/wiki/Q711) Mongolia | 3.409.939 hab. (2021) · 1.564.116 km² · capital Ulán Bator · idioma mongol | Montes Altái, Meseta de Mongolia | En el festival Naadam, cada verano, se compite en los tres juegos tradicionales: lucha, carreras de caballos y tiro con arco. |
| Montenegro | [Q236](https://www.wikidata.org/wiki/Q236) Montenegro | 617.213 hab. (2022) · 13.883 km² · capital Podgorica · idioma montenegrino |  | Su nombre significa montaña negra, por los bosques oscuros que cubrían el monte Lovćen. |
| Morocco | [Q1028](https://www.wikidata.org/wiki/Q1028) Marruecos | 38.300.000 hab. (2026) · 446.550 km² · capital Rabat · idioma árabe, Amazig estándar marroquí | Mezquita Hassan II, Ait Ben Haddou, Cordillera del Atlas | En Fez está Al Qarawiyyin, fundada en 859 por Fátima al-Fihri y considerada la universidad más antigua en funcionamiento. |
| Mozambique | [Q1029](https://www.wikidata.org/wiki/Q1029) Mozambique | 29.668.834 hab. (2017) · 801.590 km² · capital Maputo · idioma portugués | Río Zambeze, Río Limpopo | El país tomó su nombre de la isla de Mozambique, antigua capital colonial y hoy patrimonio de la UNESCO. |
| Myanmar | [Q836](https://www.wikidata.org/wiki/Q836) Birmania | 53.370.609 hab. (2017) · 676.577 km² · capital Naipyidó · idioma idioma birmano | Pagoda Shwedagon, Templos de Bagan, Indochina | En Bagan se conservan más de 2.000 templos y pagodas, la mayoría levantados entre los siglos XI y XIII. |
| Namibia | [Q1030](https://www.wikidata.org/wiki/Q1030) Namibia | 2.533.794 hab. (2017) · 825.615 km² · capital Windhoek · idioma inglés | Desierto de Kalahari, Desierto de Namib | En su desierto crece la welwitschia, una planta con solo dos hojas que puede vivir más de mil años. |
| Nepal | [Q837](https://www.wikidata.org/wiki/Q837) Nepal | 29.164.578 hab. (2021) · 147.181 km² · capital Katmandú · idioma nepalí |  | Su bandera es la única bandera nacional que no es rectangular: la forman dos triángulos superpuestos. |
| Netherlands | [Q29999](https://www.wikidata.org/wiki/Q29999) Reino de los Países Bajos | 17.100.715 hab. (2013) · 42.201 km² · capital Ámsterdam · idioma neerlandés |  | Allí hay más bicicletas que personas, y muchas ciudades tienen enormes estacionamientos solo para ellas. |
| New Zealand | [Q664](https://www.wikidata.org/wiki/Q664) Nueva Zelanda | 5.307.800 hab. (2024) · 268.021 km² · capital Wellington · idioma lengua de señas neozelandesa, maorí, inglés | Sky Tower, Beehive (Parlamento de Nueva Zelanda), Mar de Tasmania | Allí se rodaron las trilogías de El Señor de los Anillos y El Hobbit; el set de Hobbiton aún se puede visitar. |
| Nicaragua | [Q811](https://www.wikidata.org/wiki/Q811) Nicaragua | 7.005.764 hab. (2025) · 120.340 km² · capital Managua · idioma español | Lago de Nicaragua (Cocibolca) | En el lago Cocibolca viven tiburones toro, que suben desde el mar por el río San Juan y se adaptan al agua dulce. |
| Niger | [Q1032](https://www.wikidata.org/wiki/Q1032) Níger | 21.477.348 hab. (2017) · 1.267.000 km² · capital Niamey · idioma hausa | Lago Chad, Desierto del Teneré | En la fiesta del Gerewol, los jóvenes wodaabe se maquillan y bailan para que las mujeres elijan al más atractivo. |
| Nigeria | [Q1033](https://www.wikidata.org/wiki/Q1033) Nigeria | 209.603.600 hab. (2021) · 923.768 km² · capital Abuya · idioma inglés | Delta del Níger | Su industria de cine, Nollywood, es una de las que más películas producen en el mundo, junto a la de la India. |
| North Korea | [Q423](https://www.wikidata.org/wiki/Q423) Corea del Norte | 26.418.204 hab. (2023) · 120.540 km² · capital Pionyang · idioma coreano, norcoreano estándar |  | Sus fideos fríos, el naengmyeon de Pionyang, son un plato famoso que se sirve en un caldo helado. |
| Norway | [Q20](https://www.wikidata.org/wiki/Q20) Noruega | 5.627.400 hab. (2026) · 385.207 km² · capital Oslo · idioma lenguas sami, noruego, nynorsk | Península escandinava, Mar de Noruega, Alpes escandinavos | El sushi de salmón se popularizó en Japón en los años 80 gracias a una campaña noruega para exportar su salmón. |
| Oman | [Q842](https://www.wikidata.org/wiki/Q842) Omán | 5.100.000 hab. (2026) · 309.500 km² · capital Mascate · idioma árabe | Estrecho de Ormuz | Desde hace miles de años produce incienso de los árboles de Boswellia, que se comerciaba hasta Roma. |
| Pakistan | [Q843](https://www.wikidata.org/wiki/Q843) Pakistán | 223.773.700 hab. (2021) · 881.913 km² · capital Islamabad · idioma urdu, inglés | Mohenjo-Daro, Río Indo, Mar Arábigo | Mohenjo-daro, construida hace unos 4.500 años, tenía calles en cuadrícula y un avanzado sistema de alcantarillado. |
| Palestine | [Q219060](https://www.wikidata.org/wiki/Q219060) Palestina | 5.400.000 hab. (2026) · 6.020 km² · capital Ramala · idioma árabe |  | Jericó está entre las ciudades habitadas más antiguas del mundo: tiene restos de hace más de 10.000 años. |
| Panama | [Q804](https://www.wikidata.org/wiki/Q804) Panamá | 4.570.133 hab. (2025) · 74.177 km² · capital Ciudad de Panamá · idioma español | Canal de Panamá, Istmo de Panamá, Tapón del Darién | El canal, inaugurado en 1914, eleva los barcos unos 26 metros con esclusas para cruzar entre dos océanos. |
| Papua New Guinea | [Q691](https://www.wikidata.org/wiki/Q691) Papúa Nueva Guinea | 8.935.000 hab. (2020) · 462.840 km² · capital Puerto Moresby · idioma tok pisin, inglés, Hiri motu | Estrecho de Torres | Allí se hablan más de 800 idiomas, más que en cualquier otro país del mundo. |
| Paraguay | [Q733](https://www.wikidata.org/wiki/Q733) Paraguay | 6.811.297 hab. (2017) · 406.756 km² · capital Asunción · idioma guaraní, español | Cataratas del Iguazú | El guaraní es idioma oficial junto al español y lo habla la mayoría de la población. |
| Peru | [Q419](https://www.wikidata.org/wiki/Q419) Perú | 34.157.732 hab. (2025) · 1.285.216 km² · capital Lima · idioma español, aymara, lenguas quechuas | Machu Picchu, Líneas de Nazca, Huascarán | Allí se cultivan más de 3.000 variedades de papa, un tubérculo domesticado en la región hace miles de años. |
| Philippines | [Q928](https://www.wikidata.org/wiki/Q928) Filipinas | 112.729.484 hab. (2024) · 343.448 km² · capital Manila · idioma inglés, idioma filipino, Taglish | Luzón, Mindanao | El tarsero filipino, uno de los primates más pequeños, tiene cada ojo tan grande como su cerebro. |
| Poland | [Q36](https://www.wikidata.org/wiki/Q36) Polonia | 37.563.071 hab. (2024) · 312.683 km² · capital Varsovia · idioma polaco | Castillo de Malbork | Marie Curie nació en Varsovia; fue la primera persona en ganar dos premios Nobel, en Física y en Química. |
| Portugal | [Q45](https://www.wikidata.org/wiki/Q45) Portugal | 10.347.892 hab. (2021) · 92.225 km² · capital Lisboa · idioma portugués | Torre de Belém, Palacio da Pena, Cabo de San Vicente | Es el mayor productor de corcho del mundo: cerca de la mitad del corcho del planeta sale de sus alcornoques. |
| Qatar | [Q846](https://www.wikidata.org/wiki/Q846) Catar | 2.639.211 hab. (2017) · 11.437 km² · capital Doha · idioma árabe |  | Antes del petróleo, su economía dependía de la pesca de perlas, que hacían buzos sin ningún equipo. |
| Romania | [Q218](https://www.wikidata.org/wiki/Q218) Rumania | 19.053.815 hab. (2022) · 238.397 km² · capital Bucarest · idioma rumano | Castillo de Bran, Río Danubio, Cárpatos | El castillo de Bran se promociona como el de Drácula, aunque Bram Stoker nunca visitó el país. |
| Russia | [Q159](https://www.wikidata.org/wiki/Q159) Rusia | 146.119.928 hab. (2025) · 17.075.400 km² · capital Moscú · idioma ruso | Kremlin y Plaza Roja, Catedral de San Basilio, Río Volga | El Transiberiano, entre Moscú y Vladivostok, es la línea de tren más larga del mundo: unos 9.300 km. |
| Rwanda | [Q1037](https://www.wikidata.org/wiki/Q1037) Ruanda | 14.569.341 hab. (2025) · 26.338 km² · capital Kigali · idioma francés, inglés, suajili |  | Prohibió las bolsas plásticas en 2008 y es famosa por la limpieza de sus calles. |
| S. Sudan | [Q958](https://www.wikidata.org/wiki/Q958) Sudán del Sur | 12.575.714 hab. (2017) · 644.329 km² · capital Yuba · idioma inglés |  | Allí ocurre una de las mayores migraciones de mamíferos del planeta, protagonizada por millones de antílopes. |
| Saudi Arabia | [Q851](https://www.wikidata.org/wiki/Q851) Arabia Saudí | 33.000.000 hab. (2018) · 2.250.000 km² · capital Riad · idioma árabe | La Kaaba (Gran Mezquita de La Meca), Mar Rojo, Península arábiga | El Rub al-Jali o Cuarto Vacío es el mayor desierto de arena continua del mundo. |
| Senegal | [Q1041](https://www.wikidata.org/wiki/Q1041) Senegal | 18.100.000 hab. (2026) · 196.722 km² · capital Dakar · idioma francés, wólof, Lenguaje Balanta | Isla de Gorea | El lago Retba se ve rosado por un alga que prospera en su agua muy salada; allí terminaba el rally Dakar. |
| Serbia | [Q403](https://www.wikidata.org/wiki/Q403) Serbia | 6.605.168 hab. (2024) · 88.499 km² · capital Belgrado · idioma serbio |  | Nikola Tesla era de origen serbio, y el aeropuerto de Belgrado lleva su nombre. |
| Sierra Leone | [Q1044](https://www.wikidata.org/wiki/Q1044) Sierra Leona | 7.557.212 hab. (2017) · 71.740 km² · capital Freetown · idioma Criollo sierraleonés, inglés |  | Su nombre viene del portugués Serra Leoa, montaña de las leonas, que le dio el navegante Pedro de Sintra en 1462. |
| Slovakia | [Q214](https://www.wikidata.org/wiki/Q214) Eslovaquia | 5.409.407 hab. (2025) · 49.035 km² · capital Bratislava · idioma eslovaco |  | El castillo de Spiš, patrimonio de la UNESCO, es uno de los conjuntos de castillos más grandes de Europa Central. |
| Slovenia | [Q215](https://www.wikidata.org/wiki/Q215) Eslovenia | 2.116.972 hab. (2022) · 20.271 km² · capital Liubliana · idioma esloveno |  | Los caballos lipizanos, famosos en la Escuela Española de Equitación de Viena, se crían en Lipica desde 1580. |
| Solomon Is. | [Q685](https://www.wikidata.org/wiki/Q685) Islas Salomón | 611.343 hab. (2017) · 28.400 km² · capital Honiara · idioma inglés |  | El explorador español Álvaro de Mendaña las bautizó en 1568 creyendo que guardaban el oro del rey Salomón. |
| Somalia | [Q1045](https://www.wikidata.org/wiki/Q1045) Somalia | 18.100.000 hab. (2026) · 637.657 km² · capital Mogadiscio · idioma somalí, árabe | Cuerno de África, Cabo Guardafui | Tiene la mayor población de camellos del mundo, y la leche de camella es parte esencial de su dieta. |
| South Africa | [Q258](https://www.wikidata.org/wiki/Q258) Sudáfrica | 62.027.503 hab. (2022) · 1.221.037 km² · capital Bloemfontein · idioma suazi, setsuana, tsonga | Isla Robben, Union Buildings, Cabo de Buena Esperanza | En 1967 el cirujano Christiaan Barnard realizó en Ciudad del Cabo el primer trasplante de corazón humano. |
| South Korea | [Q884](https://www.wikidata.org/wiki/Q884) Corea del Sur | 51.628.117 hab. (2022) · 100.295 km² · capital Seúl · idioma coreano, lengua de señas coreana | Palacio Gyeongbokgung, Templo Haeinsa, Península de Corea | Su alfabeto, el hangul, lo creó el rey Sejong en 1443 para que todo el pueblo pudiera aprender a leer. |
| Spain | [Q29](https://www.wikidata.org/wiki/Q29) España | 48.592.909 hab. (2024) · 505.990 km² · capital Madrid · idioma español | Sagrada Familia, Alhambra, Península ibérica | En Buñol se celebra cada agosto la Tomatina, una fiesta en la que miles de personas se lanzan tomates. |
| Sri Lanka | [Q854](https://www.wikidata.org/wiki/Q854) Sri Lanka | 22.037.000 hab. (2023) · 65.610 km² · capital Colombo · idioma tamil, cingalés | Sigiriya | Su té, conocido como té de Ceilán, se cultiva desde el siglo XIX, cuando reemplazó a las plantaciones de café. |
| Sudan | [Q1049](https://www.wikidata.org/wiki/Q1049) Sudán | 48.945.000 hab. (2025) · 1.886.068 km² · capital Jartum · idioma inglés, árabe | Río Nilo, Desierto de Nubia | Tiene más pirámides que Egipto: en Meroe y otros sitios nubios se conservan unas 200. |
| Suriname | [Q730](https://www.wikidata.org/wiki/Q730) Surinam | 563.402 hab. (2017) · 163.270 km² · capital Paramaribo · idioma neerlandés |  | Es el único país independiente de América donde el neerlandés es idioma oficial. |
| Sweden | [Q34](https://www.wikidata.org/wiki/Q34) Suecia | 10.591.058 hab. (2025) · 528.861 km² · capital Estocolmo · idioma sueco | Mar Báltico, Laponia | Los premios Nobel nacieron del testamento del sueco Alfred Nobel, inventor de la dinamita. |
| Switzerland | [Q39](https://www.wikidata.org/wiki/Q39) Suiza | 9.104.063 hab. (2025) · 41.291 km² · capital Berna · idioma francés, alemán, italiano | Cervino (Matterhorn), Lago Lemán (Ginebra) | Tiene cuatro idiomas nacionales: alemán, francés, italiano y romanche. |
| Syria | [Q858](https://www.wikidata.org/wiki/Q858) Siria | 23.000.000 hab. (2026) · 185.180 km² · capital Damasco · idioma árabe | Palmira, Ciudadela de Alepo | La tela adamascada o damasco debe su nombre a Damasco, ciudad famosa desde antiguo por sus tejidos de seda. |
| Tajikistan | [Q863](https://www.wikidata.org/wiki/Q863) Tayikistán | 9.504.000 hab. (2021) · 143.100 km² · capital Dusambé · idioma tayiko |  | La presa de Nurek, de unos 300 metros, fue durante décadas la presa más alta del mundo. |
| Tanzania | [Q924](https://www.wikidata.org/wiki/Q924) Tanzania | 61.741.120 hab. (2022) · 947.303 km² · capital Dodoma · idioma inglés, suajili | Ruinas de Kilwa Kisiwani, Ciudad de Piedra de Zanzíbar, Kilimanjaro | La tanzanita, una gema azul violeta descubierta en 1967, solo se extrae en este país. |
| Thailand | [Q869](https://www.wikidata.org/wiki/Q869) Tailandia | 66.188.503 hab. (2017) · 513.120 km² · capital Bangkok · idioma tailandés | Wat Arun, Península malaya, Golfo de Tailandia | El nombre ceremonial completo de Bangkok es el nombre de ciudad más largo del mundo, según Guinness. |
| Timor-Leste | [Q574](https://www.wikidata.org/wiki/Q574) Timor Oriental | 1.400.638 hab. (2024) · 14.919 km² · capital Dili · idioma Idioma tetun, portugués |  | En 2002 se convirtió en el primer país en lograr su independencia en el siglo XXI. |
| Togo | [Q945](https://www.wikidata.org/wiki/Q945) Togo | 12.400.000 hab. (2026) · 56.785 km² · capital Lomé · idioma francés |  | En Koutammakou, los batammariba viven en casas de barro con forma de torre, patrimonio de la UNESCO. |
| Trinidad and Tobago | [Q754](https://www.wikidata.org/wiki/Q754) Trinidad y Tobago | 1.369.125 hab. (2017) · 5.128 km² · capital Puerto España · idioma inglés | Antillas Menores | Allí se inventó el steelpan, un tambor metálico afinado que al principio se fabricaba con barriles de petróleo. |
| Tunisia | [Q948](https://www.wikidata.org/wiki/Q948) Túnez | 37.100.000 hab. (2026) · 163.610 km² · capital Túnez · idioma árabe | Ruinas de Cartago, Mar Mediterráneo | Allí se rodaron escenas de Star Wars, y el planeta Tatooine debe su nombre a la ciudad de Tataouine. |
| Turkey | [Q43](https://www.wikidata.org/wiki/Q43) Turquía | 85.279.553 hab. (2023) · 783.562 km² · capital Ankara · idioma turco | Santa Sofía, Mezquita Azul, Estrecho del Bósforo | Los tulipanes llegaron a Europa desde el Imperio otomano en el siglo XVI; su nombre viene de la palabra turca para turbante. |
| Turkmenistan | [Q874](https://www.wikidata.org/wiki/Q874) Turkmenistán | 6.117.933 hab. (2021) · 491.210 km² · capital Asjabad · idioma turcomano |  | Sus caballos ajal-teke, de pelaje con brillo metálico, son una de las razas más antiguas y aparecen en su escudo. |
| Uganda | [Q1036](https://www.wikidata.org/wiki/Q1036) Uganda | 47.123.531 hab. (2021) · 241.038 km² · capital Kampala · idioma inglés, suajili | Montes Ruwenzori | En el bosque impenetrable de Bwindi vive cerca de la mitad de los gorilas de montaña del mundo. |
| Ukraine | [Q212](https://www.wikidata.org/wiki/Q212) Ucrania | 41.167.335 hab. (2022) · 603.550 km² · capital Kiev · idioma ucraniano | Río Dniéper | Las pysanky, huevos de Pascua decorados con cera y tintes, son una antigua tradición artesanal del país. |
| United Arab Emirates | [Q878](https://www.wikidata.org/wiki/Q878) Emiratos Árabes Unidos | 10.100.000 hab. (2026) · 83.600 km² · capital Abu Dhabi · idioma árabe | Burj Khalifa, Burj Al Arab | El Burj Khalifa de Dubái, inaugurado en 2010, es el edificio más alto del mundo con 828 metros. |
| United Kingdom | [Q145](https://www.wikidata.org/wiki/Q145) Reino Unido | 67.326.569 hab. (2021) · 242.495 km² · capital Londres · idioma inglés | Big Ben, Stonehenge, Río Támesis | El fútbol moderno nació allí: sus reglas se fijaron en Londres en 1863 con la fundación de la Football Association. |
| United States of America | [Q30](https://www.wikidata.org/wiki/Q30) Estados Unidos | 340.110.988 hab. (2024) · 9.826.675 km² · capital Washington D. C. · idioma español, carolinio, idioma chamorro | Estatua de la Libertad, Puente Golden Gate, Río Misisipi | Yellowstone, creado en 1872, fue el primer parque nacional del mundo. |
| Uruguay | [Q77](https://www.wikidata.org/wiki/Q77) Uruguay | 3.444.263 hab. (2023) · 176.215 km² · capital Montevideo | Palacio Salvo, La Mano de Punta del Este | Organizó y ganó la primera Copa Mundial de fútbol, en 1930, con la final en el estadio Centenario de Montevideo. |
| Uzbekistan | [Q265](https://www.wikidata.org/wiki/Q265) Uzbekistán | 34.915.100 hab. (2021) · 448.978 km² · capital Taskent · idioma uzbeko | Registán de Samarcanda, Mausoleo Gur-e Amir, Desierto de Karakum | El plov, arroz con carne, zanahoria y especias cocinado en grandes calderos, es su plato nacional y patrimonio de la UNESCO. |
| Vanuatu | [Q686](https://www.wikidata.org/wiki/Q686) Vanuatu | 300.019 hab. (2020) · 12.190 km² · capital Port Vila · idioma francés, Bislama, inglés |  | El salto desde torres de madera con lianas atadas a los tobillos, en la isla Pentecostés, inspiró el bungee moderno. |
| Venezuela | [Q717](https://www.wikidata.org/wiki/Q717) Venezuela | 31.250.306 hab. (2024) · 912.050 km² · capital Caracas · idioma español, lengua de señas venezolana | Mar Caribe, Río Orinoco, Lago de Maracaibo | El Salto Ángel, con 979 metros, es la cascada más alta del mundo; debe su nombre al aviador Jimmie Angel. |
| Vietnam | [Q881](https://www.wikidata.org/wiki/Q881) Vietnam | 96.208.984 hab. (2019) · 331.690 km² · capital Hanói · idioma vietnamita | Delta del Mekong | La cueva Hang Son Doong, explorada en 2009, es la mayor cueva conocida: tiene su propia selva y hasta nubes. |
| Yemen | [Q805](https://www.wikidata.org/wiki/Q805) Yemen | 34.400.000 hab. (2026) · 455.503 km² · capital Saná · idioma árabe | Golfo de Adén, Estrecho de Bab el-Mandeb | El café moca debe su nombre al puerto de Moca, desde donde durante siglos se exportó café al mundo. |
| Zambia | [Q953](https://www.wikidata.org/wiki/Q953) Zambia | 19.610.769 hab. (2022) · 752.618 km² · capital Lusaka · idioma inglés |  | Cada año, entre octubre y diciembre, unos 10 millones de murciélagos frugívoros se reúnen en el parque Kasanka. |
| Zimbabwe | [Q954](https://www.wikidata.org/wiki/Q954) Zimbabue | 15.178.979 hab. (2022) · 390.757 km² · capital Harare · idioma chitonga, setsuana, tsonga | Gran Zimbabue, Cataratas Victoria | Su nombre viene del Gran Zimbabue, una ciudad medieval de piedra; en shona, zimbabwe significa casas de piedra. |

## Lugares geográficos (408)

| Lugar | Wikidata | Cifras | Cerca | Dato curioso |
|---|---|---|---|---|
| Río Amazonas | [Q3783](https://www.wikidata.org/wiki/Q3783) Amazonas | 6.992 km |  | Su nombre viene de Francisco de Orellana, que en 1542 dijo haber combatido con mujeres guerreras como las amazonas del mito griego. |
| Río Nilo | [Q3392](https://www.wikidata.org/wiki/Q3392) Nilo | 6.650 km |  | Los antiguos egipcios dividían el año en tres estaciones marcadas por el río: la inundación, la siembra y la cosecha. |
| Río Misisipi | [Q1497](https://www.wikidata.org/wiki/Q1497) río Misisipi | 3.766 km |  | Mark Twain fue piloto de barcos de vapor en sus aguas; su seudónimo era el grito que indicaba dos brazas de profundidad. |
| Río Danubio | [Q1653](https://www.wikidata.org/wiki/Q1653) Danubio | 2.850 km |  | Atraviesa cuatro capitales europeas, más que cualquier otro río, e inspiró el célebre vals El Danubio azul de Johann Strauss hijo. |
| Río Yangtsé | [Q5413](https://www.wikidata.org/wiki/Q5413) Yangtsé | 6.300 km |  | Sobre él se levanta la presa de las Tres Gargantas, la central hidroeléctrica con mayor capacidad instalada del mundo. |
| Río Congo | [Q3503](https://www.wikidata.org/wiki/Q3503) Congo | 4.700 km |  | Es el río más profundo del mundo, con tramos de más de 220 metros de hondo, y cruza la línea del ecuador dos veces. |
| Río Ganges | [Q5089](https://www.wikidata.org/wiki/Q5089) río Ganges | 2.525 km |  | El delfín del Ganges, casi ciego, se orienta por ecolocalización y es el animal acuático nacional de la India desde 2009. |
| Río Rin | [Q584](https://www.wikidata.org/wiki/Q584) Rin | 1.233 km |  | En su curso se alza la roca de Loreley, cuya leyenda habla de una sirena que distraía a los barqueros con su canto. |
| Río Mekong | [Q41179](https://www.wikidata.org/wiki/Q41179) Mekong | 4.350 km |  | En vietnamita su delta se llama Cửu Long, los Nueve Dragones, por los brazos en que se divide el río antes del mar. |
| Río Volga | [Q626](https://www.wikidata.org/wiki/Q626) Volga | 3.530 km |  | Los rusos lo llaman con cariño Madre Volga, y la famosa Canción de los sirgadores homenajea a quienes arrastraban barcazas. |
| Río Níger | [Q3542](https://www.wikidata.org/wiki/Q3542) Níger | 4.180 km |  | Nace no muy lejos del Atlántico, pero corre tierra adentro hacia el desierto antes de dar un gran giro de vuelta al mar. |
| Río Orinoco | [Q131792](https://www.wikidata.org/wiki/Q131792) Río Orinoco | 2.140 km |  | El brazo Casiquiare lo une de forma natural con la cuenca del Amazonas, una rareza que Alexander von Humboldt exploró en 1800. |
| Río Paraná | [Q127892](https://www.wikidata.org/wiki/Q127892) río Paraná | 4.880 km |  | Sobre sus aguas se construyó la represa de Itaipú, una de las centrales hidroeléctricas que más energía producen en el mundo. |
| Río Támesis | [Q19686](https://www.wikidata.org/wiki/Q19686) Támesis | 334 km |  | Entre los siglos XVII y XIX se congeló varias veces y sobre el hielo se celebraban ferias; la última fue en 1814. |
| Río Sena | [Q1471](https://www.wikidata.org/wiki/Q1471) Sena | 777 km |  | En los Juegos Olímpicos de 2024 la inauguración salió por primera vez de un estadio: los atletas desfilaron en barcos por el río. |
| Río Magdalena | [Q191829](https://www.wikidata.org/wiki/Q191829) Río Magdalena | 1.528 km |  | La novela El amor en los tiempos del cólera, de García Márquez, termina a bordo de un barco de vapor que navega por este río. |
| Río Zambeze | [Q43106](https://www.wikidata.org/wiki/Q43106) río Zambeze | 2.574 km |  | Forma las cataratas Victoria, llamadas localmente Mosi-oa-Tunya, el humo que truena, por la nube de rocío que levantan. |
| Río Colorado | [Q1265](https://www.wikidata.org/wiki/Q1265) Río Colorado | 2.334 km |  | Durante millones de años excavó el Gran Cañón, y hoy se desvía tanta agua de su cauce que a menudo ya no llega al mar. |
| Río Bravo (Grande) | [Q160636](https://www.wikidata.org/wiki/Q160636) Río Bravo | 3.051 km |  | Tiene dos nombres según la orilla: del lado mexicano se le llama Río Bravo y del lado estadounidense, Rio Grande. |
| Río Misuri | [Q5419](https://www.wikidata.org/wiki/Q5419) Río Misuri | 3.726 km |  | La expedición de Lewis y Clark remontó sus aguas en 1804 en busca de una ruta fluvial hacia el océano Pacífico. |
| Río Indo | [Q7348](https://www.wikidata.org/wiki/Q7348) Indo | 3.180 km |  | Su antiguo nombre, Sindhu, dio origen a la palabra India, y en sus orillas se alzó Mohenjo-Daro hace más de 4.000 años. |
| Río Amarillo (Huang He) | [Q7355](https://www.wikidata.org/wiki/Q7355) Río Amarillo | 5.464 km |  | Debe su color y su nombre al loess, un limo amarillo que arrastra en enormes cantidades; se le considera la cuna de China. |
| Río Éufrates | [Q34589](https://www.wikidata.org/wiki/Q34589) Éufrates | 2.800 km |  | Junto al Tigris enmarca Mesopotamia, que en griego significa entre ríos, y en sus orillas se levantó la antigua Babilonia. |
| Río Tigris | [Q35591](https://www.wikidata.org/wiki/Q35591) Tigris | 1.850 km |  | En su orilla estuvo Nínive, capital asiria cuya biblioteca de Asurbanipal guardaba miles de tablillas de arcilla. |
| Río Ebro | [Q10965](https://www.wikidata.org/wiki/Q10965) río Ebro | 910 km |  | Los antiguos griegos y romanos lo llamaban Iber o Iberus, nombre del que deriva la palabra Iberia. |
| Río Tajo | [Q14294](https://www.wikidata.org/wiki/Q14294) Tajo | 1.007 km |  | Rodea casi por completo la ciudad de Toledo con un profundo meandro que durante siglos le sirvió de foso natural. |
| Río Po | [Q643](https://www.wikidata.org/wiki/Q643) Río Po | 652 km |  | Los antiguos lo identificaban con el mítico Erídano, el río donde cayó Faetón tras perder el control del carro del Sol. |
| Río Yukón | [Q104437](https://www.wikidata.org/wiki/Q104437) Yukón | 3.190 km |  | Durante la fiebre del oro del Klondike, a finales del siglo XIX, miles de buscadores bajaron por él rumbo a Dawson. |
| Río Murray | [Q183078](https://www.wikidata.org/wiki/Q183078) río Murray | 2.530 km |  | En el siglo XIX fue una autopista de vapores de rueda, y varios de esos barcos históricos todavía navegan por él. |
| Río Uruguay | [Q18278](https://www.wikidata.org/wiki/Q18278) Río Uruguay | 1.790 km |  | El país Uruguay le debe su nombre: su nombre oficial, República Oriental del Uruguay, alude a la orilla este del río. |
| Río Jordán | [Q40059](https://www.wikidata.org/wiki/Q40059) río Jordán | 252 km |  | Según la tradición cristiana, en sus aguas fue bautizado Jesús; el sitio de Betania es Patrimonio de la Humanidad desde 2015. |
| Río Obi | [Q973](https://www.wikidata.org/wiki/Q973) Obi | 3.650 km |  | Desemboca en el golfo del Obi, un estuario de unos 1.000 km de largo considerado uno de los más largos del mundo. |
| Río Yeniséi | [Q78707](https://www.wikidata.org/wiki/Q78707) río Yeniséi | 3.487 km |  | Sirve de límite natural entre dos Siberias: al oeste se extiende una gran llanura y al este, una meseta elevada. |
| Río Lena | [Q46841](https://www.wikidata.org/wiki/Q46841) Lena | 4.294 km |  | En sus orillas se alzan los Pilares del Lena, columnas de roca de hasta 100 metros, Patrimonio de la Humanidad desde 2012. |
| Río Amur | [Q6862](https://www.wikidata.org/wiki/Q6862) Amur | 2.824 km |  | En chino se le llama Heilong Jiang, el río del Dragón Negro, y da nombre al tigre del Amur, que vive en sus bosques. |
| Río Elba | [Q1644](https://www.wikidata.org/wiki/Q1644) Elba | 1.094 km |  | El valle del Elba en Dresde perdió en 2009 su título de Patrimonio de la Humanidad por la construcción de un puente. |
| Río Mackenzie | [Q3274707](https://www.wikidata.org/wiki/Q3274707) Mackenzie River |  |  | Alexander Mackenzie lo recorrió en 1789 con la esperanza de llegar al Pacífico, pero el río lo llevó al océano Ártico. |
| Río San Lorenzo | [Q134750](https://www.wikidata.org/wiki/Q134750) río San Lorenzo | 3.058 km |  | Desde 1959, una vía marítima con esclusas permite que barcos oceánicos lo remonten hasta los Grandes Lagos. |
| Río Brahmaputra | [Q45403](https://www.wikidata.org/wiki/Q45403) Brahmaputra | 2.900 km |  | Su nombre significa hijo de Brahma en sánscrito, y en su cauce está Majuli, una de las islas fluviales más grandes del mundo. |
| Río Dniéper | [Q40855](https://www.wikidata.org/wiki/Q40855) río Dniéper | 2.285 km |  | En la Edad Media era parte de la ruta de los varegos a los griegos, que unía Escandinavia con Constantinopla. |
| Río Ural | [Q80240](https://www.wikidata.org/wiki/Q80240) Ural | 2.428 km |  | Se considera tradicionalmente parte de la frontera entre Europa y Asia, así que sus puentes unen dos continentes. |
| Río Loira | [Q1469](https://www.wikidata.org/wiki/Q1469) Loira | 1.006 km |  | Su valle, Patrimonio de la Humanidad desde 2000, es famoso por sus castillos renacentistas, como Chambord y Chenonceau. |
| Río São Francisco | [Q142148](https://www.wikidata.org/wiki/Q142148) Río São Francisco | 2.814 km |  | Los brasileños lo llaman con cariño Velho Chico, y debe su nombre a que fue avistado en 1501 el día de San Francisco. |
| Río Orange | [Q181475](https://www.wikidata.org/wiki/Q181475) río Orange | 2.200 km |  | No debe su nombre al color: el explorador Robert Gordon lo bautizó en 1779 en honor a la casa holandesa de Orange. |
| Río Cauca | [Q853332](https://www.wikidata.org/wiki/Q853332) Cauca | 965 km |  | Su fértil valle concentra la gran industria azucarera de Colombia, con extensos cultivos de caña de azúcar. |
| Río Columbia | [Q2251](https://www.wikidata.org/wiki/Q2251) Río Columbia | 2.000 km |  | Lleva el nombre del barco Columbia Rediviva, con el que el capitán Robert Gray entró en sus aguas en 1792. |
| Río Limpopo | [Q173017](https://www.wikidata.org/wiki/Q173017) Limpopo | 1.750 km |  | Rudyard Kipling lo hizo famoso en el cuento El hijo del elefante, donde un cocodrilo le estira la nariz al elefantito. |
| Lago Titicaca | [Q35342](https://www.wikidata.org/wiki/Q35342) Titicaca | 8.562 km² · 204 km |  | Los uros viven en islas flotantes hechas de totora, una caña que deben renovar sin parar porque las capas de abajo se pudren. |
| Mar Caspio | [Q5484](https://www.wikidata.org/wiki/Q5484) mar Caspio | 386.400 km² · 1.200 km |  | Aunque se le llama mar, es el mayor cuerpo de agua cerrado del planeta, y de sus esturiones sale el famoso caviar. |
| Lago Baikal | [Q5513](https://www.wikidata.org/wiki/Q5513) Baikal | 31.722 km² · 636 km · UNESCO |  | Guarda cerca de una quinta parte del agua dulce superficial no congelada del planeta y es hogar de la nerpa, una foca de agua dulce. |
| Lago Victoria | [Q5505](https://www.wikidata.org/wiki/Q5505) Victoria | 68.100 km² · 337 km |  | El explorador John Hanning Speke lo bautizó en 1858 en honor a la reina Victoria y lo señaló como la fuente del Nilo. |
| Lago Superior | [Q1066](https://www.wikidata.org/wiki/Q1066) Lago Superior | 82.350 km² · 563 km |  | Guarda tanta agua que podría cubrir toda América del Norte y del Sur con una capa de unos 30 centímetros. |
| Mar Muerto | [Q23883](https://www.wikidata.org/wiki/Q23883) mar Muerto | 1.050 km² · 67 km |  | Su agua es casi diez veces más salada que la del océano: uno flota sin esfuerzo y casi ningún ser vivo resiste en ella. |
| Lago de Maracaibo | [Q182137](https://www.wikidata.org/wiki/Q182137) Lago de Maracaibo | 13.210 km² · 99 km |  | Donde desemboca el río Catatumbo se forma el relámpago del Catatumbo, tormentas eléctricas que se repiten casi cada noche. |
| Lago de Nicaragua (Cocibolca) | [Q173862](https://www.wikidata.org/wiki/Q173862) Lago de Nicaragua | 8.264 km² · 148 km |  | Es famoso por sus tiburones toro, que remontan el río San Juan desde el mar Caribe hasta llegar a sus aguas dulces. |
| Lago Míchigan | [Q1169](https://www.wikidata.org/wiki/Q1169) Lago Míchigan | 57.750 km² · 494 km |  | En términos hidrológicos forma un solo lago con el Hurón: comparten nivel de agua y se unen por el estrecho de Mackinac. |
| Lago Hurón | [Q1383](https://www.wikidata.org/wiki/Q1383) lago Hurón | 59.600 km² · 332 km |  | En sus aguas está la isla Manitoulin, la más grande del mundo dentro de un lago de agua dulce, que tiene sus propios lagos. |
| Lago Erie | [Q5492](https://www.wikidata.org/wiki/Q5492) Erie | 25.744 km² · 388 km |  | Debe su nombre al pueblo erie, y el canal de Erie, abierto en 1825, lo conectó con el río Hudson y el puerto de Nueva York. |
| Lago Ontario | [Q1062](https://www.wikidata.org/wiki/Q1062) lago Ontario | 18.529 km² · 311 km |  | Recibe las aguas del lago Erie a través del río Niágara, después de que estas se precipitan por las famosas cataratas. |
| Lago Tanganica | [Q5511](https://www.wikidata.org/wiki/Q5511) lago Tanganica | 32.900 km² · 673 km |  | En Ujiji, a orillas del lago, Henry Stanley encontró en 1871 a David Livingstone y lo saludó con un célebre: ¿Livingstone, supongo? |
| Lago Chad | [Q125309](https://www.wikidata.org/wiki/Q125309) Lago Chad | 1.540 km² |  | El país de Chad toma su nombre del lago, cuyo nombre significa gran extensión de agua en lenguas de la región. |
| Mar de Aral | [Q276776](https://www.wikidata.org/wiki/Q276776) Mar de Aral Sur | 10.780 km² |  | Tras desviar sus ríos para regar algodón desde los años 60, se redujo tanto que hoy hay barcos varados en pleno desierto. |
| Gran Lago Salado | [Q178741](https://www.wikidata.org/wiki/Q178741) Gran Lago Salado | 4.400 km² · 120 km |  | Es lo que queda del antiguo lago Bonneville, que durante la última glaciación cubría buena parte de la región. |
| Lago Ness | [Q49650](https://www.wikidata.org/wiki/Q49650) Lago Ness | 56 km² · 39 km |  | La famosa foto del monstruo Nessie, tomada en 1934, resultó ser un montaje con un submarino de juguete, confesado en 1994. |
| Mar de Galilea | [Q126982](https://www.wikidata.org/wiki/Q126982) mar de Galilea | 168 km² · 21 km |  | Su pez más famoso es la tilapia, conocida como pez de San Pedro, que se sirve asada en los restaurantes de sus orillas. |
| Lago Malaui | [Q5532](https://www.wikidata.org/wiki/Q5532) Lago Malaui | 29.600 km² · 570 km · UNESCO |  | Alberga más especies de peces que cualquier otro lago, sobre todo cíclidos de colores que no existen en ningún otro lugar. |
| Lago Ládoga | [Q15288](https://www.wikidata.org/wiki/Q15288) Ládoga | 17.700 km² · 219 km |  | En él vive la foca anillada del Ládoga, una subespecie que se adaptó a vivir únicamente en agua dulce. |
| Lago Onega | [Q166162](https://www.wikidata.org/wiki/Q166162) Onega | 9.800 km² · 248 km |  | En su isla de Kizhi se alza una iglesia de madera de 22 cúpulas, de 1714, Patrimonio de la Humanidad desde 1990. |
| Lago Baljash | [Q134485](https://www.wikidata.org/wiki/Q134485) Lago Baljash | 18.740 km² · 620 km |  | Es mitad dulce y mitad salado: su parte occidental tiene agua casi dulce y la oriental, salobre, unidas por un estrecho. |
| Gran Lago del Esclavo | [Q5539](https://www.wikidata.org/wiki/Q5539) Gran Lago del Esclavo | 27.209 km² · 480 km |  | Su nombre no habla de esclavitud: alude a los slavey, un pueblo indígena dene que habita la región. |
| Gran Lago del Oso | [Q5525](https://www.wikidata.org/wiki/Q5525) Gran Lago del Oso | 31.153 km² · 400 km |  | Su cuenca forma la reserva de la biosfera Tsá Tué, declarada por la Unesco en 2016 y gestionada por la comunidad indígena de Deline. |
| Lago Lemán (Ginebra) | [Q6403](https://www.wikidata.org/wiki/Q6403) Lemán | 581 km² · 73 km |  | Su famoso chorro, el Jet d'Eau, nació en 1886 como una simple válvula de seguridad de la red hidráulica de Ginebra. |
| Lago de Constanza | [Q4127](https://www.wikidata.org/wiki/Q4127) lago de Constanza | 536 km² · 63 km |  | Sobre sus aguas voló en 1900 el primer dirigible del conde Ferdinand von Zeppelin, construido en un hangar flotante. |
| Lago Eyre | [Q21890578](https://www.wikidata.org/wiki/Q21890578) Lake Eyre South |  |  | Casi siempre es una costra de sal; cuando se llena por completo, pocas veces por siglo, llegan miles de pelícanos a anidar. |
| Lago Turkana | [Q182719](https://www.wikidata.org/wiki/Q182719) Lago Turkana | 6.405 km² · 290 km · UNESCO |  | Por su color le dicen mar de Jade, y en sus orillas se halló en 1984 el Niño de Turkana, un esqueleto de 1,5 millones de años. |
| Lago Urmía | [Q199551](https://www.wikidata.org/wiki/Q199551) Lago Urmía | 5.200 km² · 140 km |  | En algunas épocas sus aguas se tiñen de rojo por algas y bacterias que prosperan en su altísima salinidad. |
| Lago Van | [Q126307](https://www.wikidata.org/wiki/Q126307) Lago de Van | 3.755 km² · 120 km |  | En sus alrededores vive el gato de Van, de pelo blanco y a menudo con un ojo de cada color, famoso porque le gusta nadar. |
| Lago Winnipeg | [Q3272](https://www.wikidata.org/wiki/Q3272) Lago Winnipeg | 24.400 km² · 416 km |  | Su nombre viene de la lengua cree y significa aguas turbias; la ciudad de Winnipeg tomó su nombre del lago. |
| Lago Toba | [Q183360](https://www.wikidata.org/wiki/Q183360) Lago Toba | 1.145 km² · 87 km |  | Ocupa la caldera de una supererupción de hace unos 74.000 años, y en su centro está Samosir, una isla dentro de una isla. |
| Lago Nasser | [Q182796](https://www.wikidata.org/wiki/Q182796) Lago Nasser | 5.250 km² · 500 km |  | Al formarse con la presa de Asuán, los templos de Abu Simbel se trasladaron bloque a bloque para salvarlos del agua. |
| Lago Volta | [Q201679](https://www.wikidata.org/wiki/Q201679) Lago Volta | 8.502 km² · 550 km |  | Nació en 1965 al cerrarse la presa de Akosombo y es uno de los mayores lagos artificiales del mundo por superficie. |
| Lago de Chapala | [Q318350](https://www.wikidata.org/wiki/Q318350) Lago de Chapala | 1.100 km² · 80 km |  | Sus pueblos ribereños, como Ajijic, atraen a miles de jubilados extranjeros por su clima templado todo el año. |
| Lago Poopó | [Q464945](https://www.wikidata.org/wiki/Q464945) Lago Poopó | 1.340 km² · 84 km |  | Se alimenta del Titicaca a través del río Desaguadero; como es muy poco profundo, en 2015 llegó a secarse casi por completo. |
| Lago Tahoe | [Q169962](https://www.wikidata.org/wiki/Q169962) Lago Tahoe | 502 km² · 35 km |  | Mark Twain lo visitó en 1861 y lo describió como el paisaje más hermoso que podía ofrecer toda la Tierra. |
| Mar Mediterráneo | [Q4918](https://www.wikidata.org/wiki/Q4918) Mediterráneo | 2.500.000 km² |  | Su nombre viene del latín y significa en medio de la tierra; los romanos lo llamaban Mare Nostrum, nuestro mar. |
| Mar Caribe | [Q1247](https://www.wikidata.org/wiki/Q1247) Mar Caribe | 2.754.000 km² |  | Debe su nombre a los caribes, uno de los pueblos indígenas que habitaban sus islas a la llegada de los europeos. |
| Mar Rojo | [Q23406](https://www.wikidata.org/wiki/Q23406) mar Rojo | 445.816 km² |  | Desde 1869 el canal de Suez lo conecta con el Mediterráneo, lo que les ahorra a los barcos rodear toda África. |
| Golfo de México | [Q12630](https://www.wikidata.org/wiki/Q12630) golfo de México | 1.550.000 km² |  | Parte de su lecho oculta el cráter de Chicxulub, dejado hace 66 millones de años por el asteroide que acabó con los dinosaurios. |
| Mar Negro | [Q166](https://www.wikidata.org/wiki/Q166) mar Negro | 436.402 km² · 1.175 km |  | Sus aguas profundas casi no tienen oxígeno, por eso allí se conservan barcos antiguos, como uno griego de hace 2.400 años. |
| Mar Báltico | [Q545](https://www.wikidata.org/wiki/Q545) Mar Báltico | 377.000 km² |  | Sus costas son famosas por el ámbar, resina fósil de bosques antiguos que el mar arroja a las playas tras las tormentas. |
| Mar del Norte | [Q1693](https://www.wikidata.org/wiki/Q1693) mar del Norte | 570.000 km² · 960 km |  | Hace unos 10.000 años parte de su fondo era tierra firme, Doggerland, que unía Gran Bretaña con el continente. |
| Golfo Pérsico | [Q34675](https://www.wikidata.org/wiki/Q34675) golfo Pérsico | 251.000 km² · 989 km |  | Antes del petróleo, la pesca de perlas naturales fue durante siglos la principal riqueza de los pueblos de sus costas. |
| Mar Adriático | [Q13924](https://www.wikidata.org/wiki/Q13924) mar Adriático | 138.595 km² |  | Su nombre viene de Adria, un antiguo puerto etrusco que hoy, por los sedimentos de los ríos, queda tierra adentro. |
| Canal de la Mancha | [Q34640](https://www.wikidata.org/wiki/Q34640) canal de la Mancha | 560 km |  | Louis Blériot lo cruzó en avión por primera vez en 1909, y desde 1994 un túnel ferroviario pasa bajo sus aguas. |
| Estrecho de Gibraltar | [Q36124](https://www.wikidata.org/wiki/Q36124) Estrecho de Gibraltar | 59 km |  | Los antiguos lo marcaban con las Columnas de Hércules, el fin del mundo conocido; de ahí el lema Plus Ultra del escudo español. |
| Río de la Plata | [Q35827](https://www.wikidata.org/wiki/Q35827) Río de la Plata | 290 km |  | Juan Díaz de Solís lo llamó Mar Dulce en 1516; luego tomó el nombre de la plata que los exploradores soñaban hallar río arriba. |
| Mar Arábigo | [Q58705](https://www.wikidata.org/wiki/Q58705) mar Arábigo | 3.862.000 km² |  | Desde la Antigüedad, los marinos aprovechan sus vientos monzónicos, que cambian de dirección según la estación, para cruzarlo. |
| Golfo de Bengala | [Q38684](https://www.wikidata.org/wiki/Q38684) Bahía de Bengala | 2.172.000 km² |  | En sus costas se extienden los Sundarbans, el manglar más grande del mundo y hogar del tigre de Bengala. |
| Mar de China Meridional | [Q37660](https://www.wikidata.org/wiki/Q37660) mar de China Meridional | 3.500.000 km² |  | Por sus aguas pasa cerca de un tercio del tráfico marítimo mundial, lo que lo convierte en una ruta clave del comercio. |
| Mar del Japón | [Q27092](https://www.wikidata.org/wiki/Q27092) mar del Japón | 1.048.950 km² · 2.254 km |  | Los vientos fríos que lo cruzan en invierno se cargan de humedad y provocan las grandes nevadas del llamado país de la nieve. |
| Mar Egeo | [Q34575](https://www.wikidata.org/wiki/Q34575) mar Egeo | 214.000 km² |  | Sus islas fueron cuna de civilizaciones como la minoica y la cicládica, famosa por sus estatuillas de mármol. |
| Bahía de Hudson | [Q3040](https://www.wikidata.org/wiki/Q3040) Bahía de Hudson | 1.243.000 km² |  | Dio nombre a la Compañía de la Bahía de Hudson, fundada en 1670 para comerciar pieles, que llegó a administrar enormes territorios. |
| Golfo de Guinea | [Q41430](https://www.wikidata.org/wiki/Q41430) Golfo de Guinea |  |  | En sus aguas se cruzan el ecuador y el meridiano de Greenwich, en el punto de coordenadas 0,0 apodado Null Island. |
| Golfo de California | [Q132811](https://www.wikidata.org/wiki/Q132811) Golfo de California | 160.000 km² · 1.126 km |  | Jacques Cousteau lo llamó el acuario del mundo por su enorme variedad de vida marina. |
| Golfo de Vizcaya | [Q41573](https://www.wikidata.org/wiki/Q41573) golfo de Vizcaya | 223.000 km² · 594 km |  | Los marinos lo conocen por sus fuertes temporales, y sus olas potentes atraen a surfistas de todo el mundo. |
| Estrecho de Magallanes | [Q48365](https://www.wikidata.org/wiki/Q48365) Estrecho de Magallanes |  |  | Fernando de Magallanes lo cruzó en 1520 y, al salir a un mar en calma, llamó Pacífico al nuevo océano. |
| Estrecho de Malaca | [Q48359](https://www.wikidata.org/wiki/Q48359) Estrecho de Malaca | 930 km |  | Existe una categoría de buques, los Malaccamax, definida por el tamaño máximo que puede atravesar sus aguas. |
| Pasaje de Drake | [Q143650](https://www.wikidata.org/wiki/Q143650) Mar de Hoces |  |  | Es famoso por su oleaje: sin tierra que los frene, el viento y la corriente circumpolar lo vuelven uno de los mares más bravos. |
| Estrecho del Bósforo | [Q35958](https://www.wikidata.org/wiki/Q35958) Bósforo | 30 km |  | Su nombre griego significa paso de la vaca, por el mito de Ío, que convertida en vaca lo cruzó a nado. |
| Estrecho de Ormuz | [Q79883](https://www.wikidata.org/wiki/Q79883) Estrecho de Ormuz |  |  | La isla que le da nombre tiene playas de arena roja por el óxido de hierro, y su tierra se usa incluso como condimento. |
| Mar Amarillo | [Q37960](https://www.wikidata.org/wiki/Q37960) mar Amarillo | 380.000 km² |  | Debe su nombre al limo amarillento que le aportan los ríos, en especial el río Amarillo. |
| Mar de Bering | [Q44725](https://www.wikidata.org/wiki/Q44725) mar de Bering | 2.300.000 km² · 2.400 km |  | Lleva el nombre de Vitus Bering, navegante danés al servicio de Rusia, y es famoso por la pesca del cangrejo real. |
| Mar de Tasmania | [Q33254](https://www.wikidata.org/wiki/Q33254) mar de Tasmania | 2.300.000 km² |  | Lleva el nombre del neerlandés Abel Tasman, que lo cruzó en 1642; en la zona lo apodan con humor the Ditch, la zanja. |
| Mar del Coral | [Q82931](https://www.wikidata.org/wiki/Q82931) mar del Coral | 4.791.000 km² |  | Alberga la Gran Barrera de Coral, el mayor sistema de arrecifes del planeta, formado por miles de arrecifes individuales. |
| Mar de Ojotsk | [Q41602](https://www.wikidata.org/wiki/Q41602) mar de Ojotsk | 1.583.000 km² |  | En invierno su hielo a la deriva llega a las costas del norte de Japón, donde se hacen paseos en barcos rompehielos para verlo. |
| Mar de Andamán | [Q47632](https://www.wikidata.org/wiki/Q47632) mar de Andamán | 798.000 km² |  | Allí viven los moken, nómadas del mar que pasan gran parte de su vida en barcas y son expertos buceadores. |
| Mar de Noruega | [Q47545](https://www.wikidata.org/wiki/Q47545) mar de Noruega | 1.383.000 km² |  | Cerca de las islas Lofoten se forma el Moskstraumen, un gran remolino de marea que inspiró relatos de Edgar Allan Poe y Julio Verne. |
| Mar de Barents | [Q45823](https://www.wikidata.org/wiki/Q45823) mar de Barents | 1.424.000 km² |  | Lleva el nombre de Willem Barentsz, navegante neerlandés que a fines del siglo XVI buscó por allí un paso marítimo hacia Asia. |
| Golfo de Adén | [Q41837](https://www.wikidata.org/wiki/Q41837) Golfo de Adén |  |  | Se formó hace millones de años cuando la península arábiga se separó de África, y todavía se ensancha poco a poco. |
| Mar Jónico | [Q37495](https://www.wikidata.org/wiki/Q37495) mar Jónico | 100 km |  | Entre sus islas está Ítaca, la patria de Ulises, a la que el héroe tardó diez años en volver según la Odisea. |
| Mar Tirreno | [Q38882](https://www.wikidata.org/wiki/Q38882) mar Tirreno | 275.000 km² |  | Su nombre viene de los tirrenos, como llamaban los griegos a los etruscos, que dominaron sus costas antes que Roma. |
| Mar de China Oriental | [Q45341](https://www.wikidata.org/wiki/Q45341) mar de China Oriental | 1.249.000 km² |  | Por su borde oriental corre el Kuroshio, una corriente cálida cuyo nombre japonés significa corriente negra por su azul oscuro. |
| Mar de Irlanda | [Q41735](https://www.wikidata.org/wiki/Q41735) mar de Irlanda |  |  | En medio de sus aguas está la isla de Man, famosa por el TT, una de las carreras de motos más antiguas del mundo, desde 1907. |
| Golfo de Tailandia | [Q131217](https://www.wikidata.org/wiki/Q131217) golfo de Tailandia | 320.000 km² |  | Antes se llamaba golfo de Siam y, durante la última glaciación, su fondo poco profundo era tierra firme. |
| Mar de los Sargazos | [Q169274](https://www.wikidata.org/wiki/Q169274) Mar de los Sargazos | 3.200 km |  | Es el único mar sin costas, delimitado por corrientes, y hasta allí viajan las anguilas europeas y americanas para desovar. |
| Mar de Mármara | [Q35367](https://www.wikidata.org/wiki/Q35367) mar de Mármara | 11.350 km² |  | Debe su nombre a la isla de Mármara, famosa desde la Antigüedad por sus canteras de mármol. |
| Estrecho de Bab el-Mandeb | [Q83318](https://www.wikidata.org/wiki/Q83318) Bab el-Mandeb |  |  | Su nombre árabe significa puerta de las lágrimas, por lo peligroso que era navegar entre sus corrientes y arrecifes. |
| Estrecho de Bass | [Q171846](https://www.wikidata.org/wiki/Q171846) estrecho de Bass |  |  | Lleva el nombre de George Bass, que en 1798 navegó con Matthew Flinders y demostró que Tasmania era una isla. |
| Estrecho de Torres | [Q179188](https://www.wikidata.org/wiki/Q179188) Estrecho de Torres |  |  | Lleva el nombre de Luis Váez de Torres, navegante al servicio de España que lo atravesó en 1606. |
| Canal de Mozambique | [Q165100](https://www.wikidata.org/wiki/Q165100) Canal de Mozambique |  |  | Cerca de las Comoras vive el celacanto, un pez que se creía extinto hace 66 millones de años hasta que reapareció en 1938. |
| Golfo de Alaska | [Q180531](https://www.wikidata.org/wiki/Q180531) Golfo de Alaska |  |  | En una de sus bahías termina el glaciar Hubbard, que avanza en lugar de retroceder y desprende enormes bloques de hielo. |
| Cordillera de los Andes | [Q5456](https://www.wikidata.org/wiki/Q5456) Cordillera de Los Andes | 3.300.000 km² · 7.000 km |  | La papa se domesticó en estas montañas hace miles de años, y hoy se cultivan allí miles de variedades distintas. |
| Himalaya | [Q5451](https://www.wikidata.org/wiki/Q5451) Himalaya | 600.000 km² · 2.400 km |  | Su nombre viene del sánscrito y significa morada de la nieve; aún crece unos milímetros al año por el choque de placas. |
| Alpes | [Q1286](https://www.wikidata.org/wiki/Q1286) Alpes | 190.000 km² · 1.200 km |  | En 1991 unos excursionistas hallaron en sus hielos a Ötzi, un hombre momificado que vivió hace unos 5.300 años. |
| Montañas Rocosas | [Q5463](https://www.wikidata.org/wiki/Q5463) Montañas Rocosas | 3.000 km |  | Por sus cumbres pasa la divisoria continental: el agua de un lado va al Pacífico y la del otro, al Atlántico o al Ártico. |
| Montes Apalaches | [Q93332](https://www.wikidata.org/wiki/Q93332) Apalaches | 2.400 km |  | Los recorre el sendero de los Apalaches, de unos 3.500 km, que miles de excursionistas intentan completar cada año. |
| Montes Urales | [Q35600](https://www.wikidata.org/wiki/Q35600) Montes Urales | 2.500 km |  | La alejandrita, una gema que cambia de verde a rojo según la luz, se descubrió en sus minas en el siglo XIX. |
| Cordillera del Atlas | [Q130135](https://www.wikidata.org/wiki/Q130135) Atlas | 2.550 km |  | Su nombre viene del titán Atlas de la mitología griega, condenado a sostener el cielo sobre sus hombros. |
| Pirineos | [Q12431](https://www.wikidata.org/wiki/Q12431) Pirineos | 19.000 km² · 491 km |  | El Tour de Francia los cruza desde 1910, y el Tourmalet es uno de sus puertos de montaña más legendarios. |
| Meseta del Tíbet | [Q179842](https://www.wikidata.org/wiki/Q179842) Meseta Tibetana | 2.500.000 km² · 4.500 m · 2.500 km |  | Llamada el techo del mundo, en ella nacen grandes ríos de Asia como el Yangtsé, el Mekong y el Indo. |
| Cáucaso | [Q5477](https://www.wikidata.org/wiki/Q5477) cordillera del Cáucaso | 477.165 km² · 1.200 km |  | En el mito griego, Prometeo fue encadenado en estas montañas como castigo por regalar el fuego a los humanos. |
| Cárpatos | [Q1288](https://www.wikidata.org/wiki/Q1288) montes Cárpatos | 1.700 km |  | Sus bosques albergan una de las mayores poblaciones de osos pardos de Europa, junto con lobos y linces. |
| Gran Cordillera Divisoria | [Q192583](https://www.wikidata.org/wiki/Q192583) Gran Cordillera Divisoria | 3.500 km |  | Incluye las Montañas Azules, que deben su nombre a la neblina azulada que desprenden los aceites de sus eucaliptos. |
| Sierra Madre Occidental | [Q1124584](https://www.wikidata.org/wiki/Q1124584) Sierra Madre Occidental | 289.000 km² · 1.250 km |  | Es hogar de los rarámuris, un pueblo famoso por recorrer enormes distancias corriendo con sandalias. |
| Sierra Madre Oriental | [Q144040](https://www.wikidata.org/wiki/Q144040) Sierra Madre Oriental | 1.300 km |  | En ella está el Sótano de las Golondrinas, un abismo del que salen en espiral miles de aves cada amanecer. |
| Sierra Nevada (California) | [Q26777](https://www.wikidata.org/wiki/Q26777) Sierra Nevada | 63.118 km² · 644 km |  | En sus laderas se descubrió oro en 1848, lo que desató la famosa fiebre del oro de California. |
| Apeninos | [Q377264](https://www.wikidata.org/wiki/Q377264) Apeninos ligures |  |  | Una cordillera de la Luna lleva su nombre: los Montes Apeninos lunares, bautizados así en el siglo XVII. |
| Macizo Guayanés | [Q208807](https://www.wikidata.org/wiki/Q208807) Tierras altas de Guayana |  |  | Sus mesetas de cima plana, llamadas tepuyes, albergan el Salto Ángel, la cascada más alta del mundo. |
| Meseta del Decán | [Q169966](https://www.wikidata.org/wiki/Q169966) Decán | 1.000.000 km² · 600 m |  | Gran parte está cubierta por los Traps del Decán, coladas de lava de erupciones ocurridas hace unos 66 millones de años. |
| Altiplano andino | [Q118574](https://www.wikidata.org/wiki/Q118574) Altiplano |  |  | En él se encuentra el lago Titicaca, donde los uros viven en islas flotantes hechas de totora. |
| Altiplano Brasileño | [Q118899](https://www.wikidata.org/wiki/Q118899) Meseta Brasileña | 4.500.000 km² |  | Sobre esta meseta se construyó Brasilia, la capital planificada inaugurada en 1960 con un trazado en forma de avión. |
| Macizo Etíope | [Q319288](https://www.wikidata.org/wiki/Q319288) Macizo abisino | 4.550 m |  | Se considera la cuna del café: la planta arábica crecía silvestre en sus bosques antes de cultivarse. |
| Anatolia | [Q51614](https://www.wikidata.org/wiki/Q51614) Anatolia | 756.000 km² |  | Allí está Capadocia, famosa por sus chimeneas de hadas y sus vuelos en globo al amanecer. |
| Sierra Nevada de Santa Marta | [Q26728](https://www.wikidata.org/wiki/Q26728) Sierra Nevada de Santa Marta | 17.000 km² |  | Allí viven los pueblos kogui, arhuaco, wiwa y kankuamo, y en sus selvas se halla Ciudad Perdida (Teyuna). |
| Hindu Kush | [Q5472](https://www.wikidata.org/wiki/Q5472) Hindú Kush |  |  | Sus minas de lapislázuli se explotan desde hace más de 6.000 años; esa piedra dio el pigmento azul ultramar. |
| Karakórum | [Q5469](https://www.wikidata.org/wiki/Q5469) Cordillera del Karakórum | 500 km |  | Su nombre significa grava negra en lenguas túrquicas, y tiene algunos de los glaciares más largos fuera de los polos. |
| Tian Shan | [Q5474](https://www.wikidata.org/wiki/Q5474) Tian Shan | 2.500 km |  | Sus bosques albergan el manzano silvestre del que descienden casi todas las manzanas que comemos hoy. |
| Montes Altái | [Q5955](https://www.wikidata.org/wiki/Q5955) macizo de Altái | 2.000 km |  | Gracias a un hueso hallado en su cueva de Denisova se identificó en 2010 un grupo humano desconocido: los denisovanos. |
| Drakensberg | [Q183295](https://www.wikidata.org/wiki/Q183295) Drakensberg | 1.000 km |  | Su nombre significa montañas del dragón, y sus cuevas guardan miles de pinturas rupestres del pueblo san. |
| Montes Zagros | [Q167021](https://www.wikidata.org/wiki/Q167021) Zagros | 533.512 km² · 1.500 km |  | En sus valles se domesticaron algunas de las primeras cabras, hace unos 10.000 años. |
| Cordillera de las Cascadas | [Q4558](https://www.wikidata.org/wiki/Q4558) Cordillera de las Cascadas | 150.000 km² · 1.100 km |  | Debe su nombre a los rápidos del río Columbia, que los exploradores del siglo XIX llamaban las cascadas. |
| Alpes escandinavos | [Q186547](https://www.wikidata.org/wiki/Q186547) Alpes escandinavos | 1.700 km |  | En noruego y sueco se les llama Kjølen o Kölen, la quilla, por su forma alargada como la de un barco. |
| Montes Balcanes | [Q170427](https://www.wikidata.org/wiki/Q170427) Montes Balcanes | 11.596 km² · 530 km |  | Dieron su nombre a toda la península balcánica, y en búlgaro se conocen como Stara Planina, montaña vieja. |
| Montes Kunlun | [Q187871](https://www.wikidata.org/wiki/Q187871) Kunlun | 3.000 km |  | En la mitología china eran el hogar de la Reina Madre del Oeste, diosa de la inmortalidad. |
| Pamir | [Q161750](https://www.wikidata.org/wiki/Q161750) Cordillera del Pamir | 120.000 km² · 500 km |  | Marco Polo lo atravesó en el siglo XIII, y por eso el argali de sus montañas se llama oveja de Marco Polo. |
| Alpes Dináricos | [Q189915](https://www.wikidata.org/wiki/Q189915) Alpes Dináricos | 175.000 km² · 645 km |  | En ellos están los lagos de Plitvice, 16 lagos escalonados unidos por cascadas de aguas turquesas. |
| Montes Elburz | [Q484725](https://www.wikidata.org/wiki/Q484725) Montes Elburz | 155.970 km² · 600 km |  | Su cumbre, el volcán Damavand, aparece en el Shahnameh, donde el héroe Fereydún encierra al tirano Zahhak. |
| Tibesti | [Q309104](https://www.wikidata.org/wiki/Q309104) Tibesti | 100.000 km² · 380 km |  | Es una cordillera volcánica, y su volcán Emi Koussi es la cumbre más alta de todo el Sahara. |
| Ahaggar (Hoggar) | [Q23836082](https://www.wikidata.org/wiki/Q23836082) Ahag |  |  | Es tierra de los tuaregs, llamados hombres azules porque el tinte índigo de sus velos les tiñe la piel. |
| Cordillera de Alaska | [Q156684](https://www.wikidata.org/wiki/Q156684) Cordillera de Alaska | 144.752 km² · 1.000 km |  | La Iditarod, la célebre carrera de trineos tirados por perros, la cruza cada marzo por el paso Rainy. |
| Cordillera Brooks | [Q929910](https://www.wikidata.org/wiki/Q929910) Cordillera de Brooks | 1.100 km |  | Alberga Gates of the Arctic, un parque nacional que no tiene carreteras ni senderos marcados. |
| Ghats Occidentales | [Q4527](https://www.wikidata.org/wiki/Q4527) Ghats occidentales | 160.000 km² · 1.600 km · UNESCO |  | En sus colinas florece el neelakurinji, un arbusto que tiñe de azul las laderas solo una vez cada 12 años. |
| Cordillera Cantábrica | [Q208076](https://www.wikidata.org/wiki/Q208076) Cordillera Cantábrica | 480 km |  | Es el principal refugio del oso pardo en España, y su población ha crecido en las últimas décadas. |
| Macizo Central (Francia) | [Q190695](https://www.wikidata.org/wiki/Q190695) Macizo Central | 85.000 km² · 1.886 m |  | El queso roquefort solo puede madurar en las cuevas naturales del monte Combalou, en esta región. |
| Montes Tauro | [Q172556](https://www.wikidata.org/wiki/Q172556) Montes Tauro | 600 km |  | El ejército de Alejandro Magno cruzó estas montañas por las Puertas Cilicias, un famoso paso de la Antigüedad. |
| Alpes Australianos | [Q390226](https://www.wikidata.org/wiki/Q390226) Alpes Australianos |  |  | Entre 1949 y 1974 se construyó aquí el sistema hidroeléctrico Snowy Mountains, con obreros de más de 30 países. |
| Alpes del Sur (Nueva Zelanda) | [Q206650](https://www.wikidata.org/wiki/Q206650) Alpes del Sur | 500 km |  | Allí vive el kea, el único loro alpino del mundo, famoso por su curiosidad y por desarmar autos. |
| Montes Verjoyansk | [Q215917](https://www.wikidata.org/wiki/Q215917) Cordillera Verjoyansk | 1.200 km |  | Comparte nombre con el pueblo de Verjoyansk, que llegó a −67,8 °C en 1892, uno de los fríos más extremos en un lugar habitado. |
| Sierra Morena | [Q686362](https://www.wikidata.org/wiki/Q686362) Sierra Morena | 400 km |  | Sus bosques son uno de los últimos refugios del lince ibérico, uno de los felinos más amenazados del mundo. |
| Montes Ruwenzori | [Q106540](https://www.wikidata.org/wiki/Q106540) Montañas Rwenzori | 1.000 km² · 120 km |  | Se les identifica con las Montañas de la Luna que Ptolomeo señaló como fuente del Nilo hace casi 2.000 años. |
| Glaciar Vatnajökull | [Q179734](https://www.wikidata.org/wiki/Q179734) Vatnajökull | 7.700 km² · 143 km |  | Bajo su hielo se esconden volcanes activos como Grímsvötn, cuyas erupciones pueden causar súbitas inundaciones glaciares. |
| Altiplanicie Mexicana | [Q1753873](https://www.wikidata.org/wiki/Q1753873) Mesa del Centro |  |  | La recorre el Camino Real de Tierra Adentro, la ruta colonial de la plata que unía Ciudad de México con Santa Fe. |
| Meseta de Mongolia | [Q560198](https://www.wikidata.org/wiki/Q560198) Meseta de Mongolia |  |  | Sus pastores nómadas viven en ger, tiendas redondas de fieltro que pueden desarmarse en pocas horas. |
| Meseta del Colorado | [Q925906](https://www.wikidata.org/wiki/Q925906) Meseta del Colorado |  |  | Reúne el Gran Cañón, Monument Valley y Arches, un parque con más de 2.000 arcos de piedra natural. |
| Meseta Siberiana Central | [Q155197](https://www.wikidata.org/wiki/Q155197) Meseta Central Siberiana | 3.500.000 km² · 1.701 m · 2.000 km |  | Gran parte se formó con los Traps Siberianos, erupciones ligadas a la mayor extinción masiva, hace 252 millones de años. |
| Monte Everest | [Q513](https://www.wikidata.org/wiki/Q513) Everest | 8.850 m |  | Edmund Hillary y Tenzing Norgay fueron los primeros en llegar a su cima, el 29 de mayo de 1953. |
| Kilimanjaro | [Q7296](https://www.wikidata.org/wiki/Q7296) Kilimanjaro | 5.895 m |  | Es un volcán con tres conos, Kibo, Mawenzi y Shira, y su primera ascensión registrada fue en 1889. |
| Monte Fuji | [Q39231](https://www.wikidata.org/wiki/Q39231) Monte Fuji | 193 km² · 3.777 m · UNESCO |  | Su última erupción fue en 1707, y Hokusai lo retrató en su célebre serie Treinta y seis vistas del monte Fuji. |
| Aconcagua | [Q39739](https://www.wikidata.org/wiki/Q39739)  | 6.962 m |  | Es la montaña más alta fuera de Asia, y por eso forma parte del desafío alpinista de las Siete Cumbres. |
| Mont Blanc | [Q583](https://www.wikidata.org/wiki/Q583) Mont Blanc | 4.810 m |  | Jacques Balmat y Michel Paccard lo escalaron en 1786, hazaña considerada el nacimiento del alpinismo. |
| Vesubio | [Q524](https://www.wikidata.org/wiki/Q524) Vesubio | 1.297 m |  | La canción napolitana Funiculì, Funiculà se compuso en 1880 para celebrar el funicular que subía a su cráter. |
| Popocatépetl | [Q181157](https://www.wikidata.org/wiki/Q181157) Popocatépetl | 5.454 m |  | Su nombre significa montaña que humea en náhuatl, y la leyenda lo une a la Iztaccíhuatl, la mujer dormida. |
| Uluru (Ayers Rock) | [Q33910](https://www.wikidata.org/wiki/Q33910) Uluru | 900 m |  | Es sagrado para el pueblo anangu, y desde octubre de 2019 está prohibido escalarlo por respeto a su cultura. |
| Denali (monte McKinley) | [Q130018](https://www.wikidata.org/wiki/Q130018)  | 6.190 m |  | Su nombre significa el alto en lengua koyukon, y el primero en pisar su cima, en 1913, fue el nativo Walter Harper. |
| Monte Elbrús | [Q43105](https://www.wikidata.org/wiki/Q43105) Monte Elbrús | 5.642 m |  | Es un volcán inactivo con dos cimas gemelas, y su cumbre este se alcanzó por primera vez en 1829. |
| Etna | [Q16990](https://www.wikidata.org/wiki/Q16990) Monte Etna | 192 km² · 3.403 m |  | Los griegos creían que bajo él estaba la fragua de Hefesto, y hoy es uno de los volcanes más activos del mundo. |
| Chimborazo | [Q14081](https://www.wikidata.org/wiki/Q14081) Volcán Chimborazo | 6.263 m |  | Por la forma achatada de la Tierra, su cima es el punto de la superficie más alejado del centro del planeta. |
| Cotopaxi | [Q241140](https://www.wikidata.org/wiki/Q241140) Provincia de Cotopaxi | 6.188 km² · 3.984 m |  | Su cono casi perfecto, cubierto de glaciar, lo escalaron por primera vez Wilhelm Reiss y Ángel Escobar en 1872. |
| Cervino (Matterhorn) | [Q1374](https://www.wikidata.org/wiki/Q1374) Cervino | 4.478 m |  | Su silueta de pirámide inspiró la montaña rusa Matterhorn Bobsleds de Disneyland, inaugurada en 1959. |
| Teide | [Q38954](https://www.wikidata.org/wiki/Q38954) Teide | 3.715 m |  | Los guanches, antiguos pobladores de la zona, creían que en su interior vivía Guayota, un espíritu maligno. |
| Monte Olimpo | [Q80344](https://www.wikidata.org/wiki/Q80344) Olimpo | 191 km² · 2.918 m · UNESCO |  | Para los antiguos griegos era el hogar de los dioses olímpicos; su cima, Mytikas, se escaló por primera vez en 1913. |
| Nevado del Ruiz | [Q233351](https://www.wikidata.org/wiki/Q233351) Nevado del Ruiz | 5.389 m |  | Forma parte del Parque Nacional Natural Los Nevados, cuyos páramos de frailejones son verdaderas fábricas de agua. |
| Montaña de la Mesa | [Q213360](https://www.wikidata.org/wiki/Q213360) Montaña de la Mesa | 1.085 m |  | Es el único lugar de la Tierra que da nombre a una constelación: Mensa, bautizada por el astrónomo Lacaille. |
| Pico de Orizaba | [Q3019685](https://www.wikidata.org/wiki/Q3019685) Parque nacional Pico de Orizaba | 198 km² |  | Su nombre náhuatl, Citlaltépetl, significa cerro de la estrella, y conserva uno de los últimos glaciares del país. |
| K2 | [Q43512](https://www.wikidata.org/wiki/Q43512) K2 | 8.611 m |  | Su nombre viene de una libreta topográfica de 1856: K de Karakórum y 2 por ser el segundo pico anotado. |
| Krakatoa | [Q82613](https://www.wikidata.org/wiki/Q82613) Volcán Krakatoa | 813 m |  | En 1927 surgió del mar un nuevo volcán en su caldera, llamado Anak Krakatau, el hijo de Krakatoa. |
| Monte Ararat | [Q72303](https://www.wikidata.org/wiki/Q72303) Monte Ararat | 5.137 m |  | Según una larga tradición, es el monte donde se posó el arca de Noé después del diluvio. |
| Monte Kosciuszko | [Q178167](https://www.wikidata.org/wiki/Q178167) Monte Kosciuszko | 2.228 m |  | El explorador polaco Paweł Strzelecki lo bautizó en 1840 en honor al héroe nacional Tadeusz Kościuszko. |
| Monte Sinaí | [Q377485](https://www.wikidata.org/wiki/Q377485) monte Sinaí | 2.287 m |  | A sus pies está el monasterio de Santa Catalina, del siglo VI, uno de los más antiguos que siguen habitados. |
| Mauna Kea | [Q131230](https://www.wikidata.org/wiki/Q131230) Mauna Kea | 4.207 m |  | Su nombre significa montaña blanca en hawaiano, por la nieve de su cima, donde hay grandes observatorios. |
| Pico Bolívar | [Q213704](https://www.wikidata.org/wiki/Q213704) Pico Bolívar | 4.978 m |  | Antes se llamaba La Columna; tomó el nombre de Simón Bolívar y en su cima hay un busto del Libertador. |
| Monte Roraima | [Q4777](https://www.wikidata.org/wiki/Q4777) Monte Roraima | 50 km² · 2.810 m |  | Sus paredes verticales y su cima aislada inspiraron El mundo perdido, la novela de Arthur Conan Doyle de 1912. |
| Monte Fitz Roy | [Q215138](https://www.wikidata.org/wiki/Q215138) Monte Fitz Roy | 3.406 m |  | Los tehuelches lo llamaban Chaltén, montaña humeante; Perito Moreno lo rebautizó por el capitán del Beagle. |
| Huascarán | [Q200935](https://www.wikidata.org/wiki/Q200935) Huascarán | 6.768 m |  | La estadounidense Annie Smith Peck alcanzó su cima norte en 1908, una gran hazaña para las alpinistas de su época. |
| Ojos del Salado | [Q233836](https://www.wikidata.org/wiki/Q233836) Ojos del Salado | 6.893 m |  | Es el volcán activo más alto del planeta, y en sus laderas se han batido récords de altura para vehículos. |
| Puncak Jaya | [Q1045888](https://www.wikidata.org/wiki/Q1045888) Jaya | 4.884 m |  | En 1623 el navegante Jan Carstenszoon dijo haber visto nieve en sus cumbres tropicales, y en Europa se burlaron de él. |
| Monte Rainier | [Q194057](https://www.wikidata.org/wiki/Q194057) Monte Rainier | 4.389 m |  | George Vancouver lo bautizó en 1792 en honor a un almirante amigo, aunque los pueblos nativos lo llamaban Tahoma. |
| Monte Santa Helena | [Q4675](https://www.wikidata.org/wiki/Q4675) Monte Santa Helena | 2.549 m |  | Tras su erupción de 1980, la zona se volvió un laboratorio natural para estudiar cómo regresa la vida. |
| Aoraki / Monte Cook | [Q5059](https://www.wikidata.org/wiki/Q5059) monte Cook | 3.724 m |  | Según la tradición maorí, Aoraki era un joven que quedó convertido en piedra junto a sus hermanos tras varar su canoa. |
| Monte Kenia | [Q172070](https://www.wikidata.org/wiki/Q172070) Monte Kenia | 5.199 m |  | El país de Kenia tomó su nombre de esta montaña, que el pueblo kikuyu llama Kirinyaga. |
| Monte Camerún | [Q190562](https://www.wikidata.org/wiki/Q190562) Monte Camerún | 4.095 m |  | Cada año se corre en él la Carrera de la Esperanza, una dura prueba de subida y bajada que se celebra desde 1973. |
| Ben Nevis | [Q104674](https://www.wikidata.org/wiki/Q104674) Ben Nevis | 1.345 m |  | Entre 1883 y 1904 funcionó en su cima un observatorio meteorológico atendido durante todo el año. |
| Mulhacén | [Q209528](https://www.wikidata.org/wiki/Q209528) Mulhacén | 3.479 m |  | Debe su nombre a Muley Hacén, rey nazarí de Granada que, según la leyenda, fue enterrado en su cima. |
| Volcán Arenal | [Q641588](https://www.wikidata.org/wiki/Q641588) Volcán Arenal | 121 km² · 1.670 m |  | Despertó en 1968 tras siglos de calma y estuvo activo hasta 2010; hoy es famoso por sus aguas termales. |
| Volcán Galeras | [Q235062](https://www.wikidata.org/wiki/Q235062) Volcán Galeras | 4.276 m |  | Los españoles lo llamaron Galeras porque su silueta les recordaba un barco; su nombre indígena es Urcunina. |
| Desierto del Sahara | [Q6583](https://www.wikidata.org/wiki/Q6583) Sahara | 9.200.000 km² · 4.800 km |  | Hace unos 6.000 años era una sabana verde con lagos, jirafas y elefantes, como muestran sus pinturas rupestres. |
| Desierto de Gobi | [Q42070](https://www.wikidata.org/wiki/Q42070) Desierto de Gobi | 2.354.460 km² · 1.500 km |  | En 1923 la expedición de Roy Chapman Andrews halló allí los primeros nidos de huevos de dinosaurio reconocidos. |
| Desierto de Kalahari | [Q47700](https://www.wikidata.org/wiki/Q47700) Kalahari | 930.000 km² · 4.000 km |  | El río Okavango termina en sus arenas: nunca llega al mar y forma un enorme delta interior lleno de vida. |
| Desierto de Atacama | [Q47141](https://www.wikidata.org/wiki/Q47141) Desierto de Atacama | 181.300 km² |  | En los raros años de lluvia ocurre el desierto florido: millones de flores cubren sus arenas durante semanas. |
| Rub al-Jali | [Q229269](https://www.wikidata.org/wiki/Q229269) Desierto de Rub al-Jali | 680.000 km² · 1.000 km |  | Su nombre significa el cuarto vacío, y el británico Bertram Thomas lo cruzó en 1931 con guías beduinos. |
| Desierto de Namib | [Q131377](https://www.wikidata.org/wiki/Q131377) Namib | 81.000 km² · 2.000 km · UNESCO |  | Se considera el desierto más antiguo del mundo, y en él crece la welwitschia, una planta que vive más de 1.000 años. |
| Desierto de Sonora | [Q189429](https://www.wikidata.org/wiki/Q189429) Desierto de Sonora | 310.800 km² |  | Es el único lugar donde crece silvestre el saguaro, un cactus gigante que puede vivir más de 150 años. |
| Desierto de Mojave | [Q184355](https://www.wikidata.org/wiki/Q184355) Desierto de Mojave | 124.000 km² |  | Se dice que su árbol de Josué lo bautizaron colonos mormones que vieron en sus ramas brazos alzados en oración. |
| Salar de Uyuni | [Q76122](https://www.wikidata.org/wiki/Q76122) Salar de Uyuni | 10.582 km² · 140 km |  | En época de lluvias, una fina capa de agua lo convierte en un espejo gigante que refleja el cielo. |
| Desierto de Chihuahua | [Q855658](https://www.wikidata.org/wiki/Q855658) Desierto de monterrey | 362.600 km² · 1.280 km |  | En él está White Sands, un mar de dunas blancas formadas por yeso, un mineral que rara vez forma dunas. |
| Gran Desierto de Victoria | [Q145165](https://www.wikidata.org/wiki/Q145165) Gran Desierto de Victoria | 348.750 km² |  | El explorador Ernest Giles lo cruzó en 1875 y lo bautizó en honor a la reina Victoria. |
| Gran Desierto de Arena | [Q326896](https://www.wikidata.org/wiki/Q326896) Gran Desierto Arenoso | 284.993 km² |  | Alberga el cráter de Wolfe Creek, una gran huella circular dejada por el impacto de un meteorito. |
| Desierto de Thar | [Q172691](https://www.wikidata.org/wiki/Q172691) Desierto de Thar | 200.000 km² |  | Allí se alza el fuerte de Jaisalmer, de arenisca dorada, donde todavía vive parte de la población. |
| Desierto de Taklamakán | [Q132956](https://www.wikidata.org/wiki/Q132956) Taklamakán | 337.000 km² · 1.000 km |  | En sus arenas se hallaron las momias del Tarim, de hasta 4.000 años, muy bien conservadas por el clima seco. |
| Desierto de Karakum | [Q172702](https://www.wikidata.org/wiki/Q172702) Desierto de Karakum | 400.000 km² |  | Su nombre significa arena negra, y en él arde desde hace décadas el cráter de gas de Darvaza. |
| Desierto Líbico | [Q181528](https://www.wikidata.org/wiki/Q181528) Desierto Líbico | 1.100.000 km² |  | Su vidrio del desierto, amarillo y de origen aún debatido, forma un escarabajo en un pectoral de Tutankamón. |
| Desierto del Néguev | [Q162843](https://www.wikidata.org/wiki/Q162843) Néguev | 13.000 km² |  | Allí está el Majtesh Ramón, un enorme cráter que no lo hizo un meteorito sino la erosión. |
| Desierto de Siria | [Q339162](https://www.wikidata.org/wiki/Q339162) Desierto Sirio | 518.000 km² |  | Por él pasaban las caravanas hacia Palmira, la ciudad oasis que gobernó la reina Zenobia. |
| Desierto de Simpson | [Q211839](https://www.wikidata.org/wiki/Q211839) Desierto de Simpson | 176.500 km² |  | Lleva el nombre de Alfred Simpson, empresario australiano que financió la expedición que lo atravesó en 1939. |
| Desierto de Nubia | [Q464909](https://www.wikidata.org/wiki/Q464909) Desierto de Nubia | 400.000 km² |  | Debe su nombre a la antigua Nubia, tierra famosa por las minas de oro que abastecían a los faraones. |
| Depresión de Danakil | [Q141513](https://www.wikidata.org/wiki/Q141513) Desierto de Danakil | 136.956 km² |  | Los mineros afar aún cortan a mano bloques de sal que caravanas de camellos transportan por el desierto. |
| Desierto del Teneré | [Q272521](https://www.wikidata.org/wiki/Q272521) Teneré | 400.000 km² |  | El Árbol del Teneré, considerado el más aislado del mundo, fue derribado por un camión en 1973. |
| Desierto de Kyzylkum | [Q184364](https://www.wikidata.org/wiki/Q184364) Kyzyl Kum | 298.000 km² |  | Su nombre significa arena roja, y en él está Muruntau, una de las mayores minas de oro a cielo abierto. |
| Groenlandia | [Q223](https://www.wikidata.org/wiki/Q223) Groenlandia | 2.166.086 km² |  | Erik el Rojo le puso un nombre tan atractivo como tierra verde para convencer a los colonos de seguirlo. |
| Borneo | [Q36117](https://www.wikidata.org/wiki/Q36117) Isla de Borneo | 748.168 km² · 1.366 km |  | Es una de las dos únicas islas con orangutanes salvajes, cuyo nombre en malayo significa persona del bosque. |
| Gran Bretaña | [Q23666](https://www.wikidata.org/wiki/Q23666) Gran Bretaña | 228.938 km² |  | Ningún punto de la isla está a más de unos 115 km del mar, sin importar hacia dónde camines. |
| Islas Galápagos | [Q38095](https://www.wikidata.org/wiki/Q38095) Islas Galápagos | 7.880 km² · UNESCO |  | Su nombre viene de galápago, palabra antigua para las tortugas gigantes que Darwin estudió en 1835. |
| Islas Hawái | [Q192626](https://www.wikidata.org/wiki/Q192626) Archipiélago de Hawái | 16.636 km² |  | El alfabeto hawaiano tiene solo 13 letras, contando la ʻokina, una marca que indica una breve pausa. |
| Islas Canarias | [Q5813](https://www.wikidata.org/wiki/Q5813) Canarias | 7.447 km² |  | Su nombre viene del latín canis, perro, y no de los pájaros: los canarios se llaman así por las islas. |
| La Española | [Q25277](https://www.wikidata.org/wiki/Q25277) La Española | 77.900 km² |  | Colón la bautizó La Isla Española en 1492, y allí está Santo Domingo, la ciudad europea más antigua de América. |
| Islas Británicas | [Q38272](https://www.wikidata.org/wiki/Q38272) Islas británicas | 315.160 km² |  | El archipiélago reúne más de 6.000 islas, desde Gran Bretaña e Irlanda hasta diminutos islotes deshabitados. |
| Sumatra | [Q3492](https://www.wikidata.org/wiki/Q3492) Sumatra | 473.481 km² · 1.700 km |  | Alberga el lago Toba, nacido de una supererupción volcánica hace unos 74.000 años. |
| Nueva Guinea | [Q40285](https://www.wikidata.org/wiki/Q40285) Nueva Guinea | 785.753 km² · 2.398 km |  | En la isla se hablan más de 1.000 lenguas, una de las mayores concentraciones lingüísticas del planeta. |
| Honshu | [Q13989](https://www.wikidata.org/wiki/Q13989) Honshū | 230.426 km² · 1.300 km |  | En 1964 empezó a funcionar en ella el Shinkansen, el primer tren bala del mundo, entre Tokio y Osaka. |
| Sicilia | [Q4951156](https://www.wikidata.org/wiki/Q4951156) Sicilia | 25.662 km² |  | Arquímedes nació en Siracusa, una de las ciudades griegas más poderosas de la isla en la Antigüedad. |
| Tasmania | [Q3593416](https://www.wikidata.org/wiki/Q3593416) Tasmania | 65.022 km² |  | Se llamó Tierra de Van Diemen hasta 1856, cuando adoptó el nombre de su descubridor europeo, Abel Tasman. |
| Creta | [Q34374](https://www.wikidata.org/wiki/Q34374) Creta | 8.336 km² · 254 km |  | Fue cuna de la civilización minoica, y su palacio de Cnosos se asocia con el mito del laberinto del Minotauro. |
| Tierra del Fuego | [Q82601](https://www.wikidata.org/wiki/Q82601) Archipiélago de Tierra del Fuego | 73.753 km² |  | Su nombre se debe a las fogatas indígenas que la expedición de Magallanes vio desde el mar en 1520. |
| Islas Baleares | [Q5765](https://www.wikidata.org/wiki/Q5765) Islas Baleares | 4.992 km² |  | Su dulce más famoso es la ensaimada, una espiral de masa cuyo nombre viene de saïm, manteca de cerdo. |
| Islas Malvinas | [Q9648](https://www.wikidata.org/wiki/Q9648) Islas Malvinas | 12.200 km² |  | En ellas crían cinco especies de pingüinos, entre ellas el pingüino rey, el papúa y el saltarrocas. |
| Java | [Q3757](https://www.wikidata.org/wiki/Q3757) Java | 128.297 km² · 1.062 km |  | En 1891 Eugène Dubois halló allí el Hombre de Java, uno de los primeros fósiles conocidos de Homo erectus. |
| Bali | [Q4648](https://www.wikidata.org/wiki/Q4648) Bali | 5.633 km² · 150 km |  | En Nyepi, el año nuevo balinés, la isla guarda un día entero de silencio: hasta el aeropuerto cierra. |
| Antillas Menores | [Q93259](https://www.wikidata.org/wiki/Q93259) Antillas Menores | 14.364 km² |  | En Trinidad, una de sus islas, se inventó en el siglo XX el steelpan, un tambor hecho con barriles de petróleo. |
| Antillas Mayores | [Q128011](https://www.wikidata.org/wiki/Q128011) Antillas Mayores | 207.411 km² |  | Sus pobladores taínos nos legaron palabras como hamaca, huracán, canoa y barbacoa. |
| Puerto Rico | [Q2076337](https://www.wikidata.org/wiki/Q2076337) Puerto Rico | 9.100 km² |  | La piña colada es su bebida oficial desde 1978, y dos bares de San Juan se disputan haberla inventado. |
| Tenerife | [Q40846](https://www.wikidata.org/wiki/Q40846) Tenerife | 2.034 km² |  | Su carnaval es de los más famosos del mundo; en 1987 un concierto de Celia Cruz allí logró un récord Guinness. |
| Cerdeña | [Q1462](https://www.wikidata.org/wiki/Q1462) Cerdeña | 23.949 km² |  | Conserva miles de nuragas, torres de piedra levantadas en la Edad del Bronce por un pueblo enigmático. |
| Córcega | [Q14112](https://www.wikidata.org/wiki/Q14112) Córcega | 8.680 km² |  | Napoleón Bonaparte nació en Ajaccio, su capital, en 1769, apenas un año después de que la isla pasara de Génova a Francia. |
| Terranova | [Q48335](https://www.wikidata.org/wiki/Q48335) Isla de Terranova | 108.860 km² |  | En L'Anse aux Meadows hay restos de un poblado vikingo de hacia el año 1000, el sitio europeo más antiguo conocido en América. |
| Isla de Baffin | [Q81178](https://www.wikidata.org/wiki/Q81178) isla de Baffin | 507.451 km² · 1.600 km |  | Debe su nombre al navegante inglés William Baffin, que exploró sus costas en 1616 buscando el paso del Noroeste. |
| Hokkaido | [Q35581](https://www.wikidata.org/wiki/Q35581) Hokkaidō | 77.984 km² |  | Es la tierra ancestral del pueblo ainu, y su capital, Sapporo, celebra cada febrero un famoso festival de esculturas de nieve. |
| Hainan | [Q1081204](https://www.wikidata.org/wiki/Q1081204) isla de Hainan | 33.210 km² |  | Es provincia propia desde 1988 y alberga el centro espacial de Wenchang, desde donde China lanza misiones a la Luna y a Marte. |
| Svalbard | [Q25231](https://www.wikidata.org/wiki/Q25231) Svalbard | 61.022 km² |  | Guarda la Bóveda Global de Semillas, abierta en 2008 en el permafrost, con copias de semillas de cultivos de todo el mundo. |
| Luzón | [Q125384](https://www.wikidata.org/wiki/Q125384) Luzón | 109.965 km² |  | En sus montañas están las terrazas de arroz de las cordilleras, talladas a mano por el pueblo ifugao y Patrimonio de la Humanidad. |
| Mindanao | [Q124873](https://www.wikidata.org/wiki/Q124873) Mindanao | 97.530 km² |  | Es el principal refugio del águila filipina, ave nacional del país, y su ciudad de Davao es famosa por el durián. |
| Isla de Vancouver | [Q170479](https://www.wikidata.org/wiki/Q170479) Isla de Vancouver | 32.134 km² · 460 km |  | Lleva el nombre del capitán George Vancouver, que la rodeó navegando en 1792 y demostró que era una isla. |
| Sajalín | [Q7792](https://www.wikidata.org/wiki/Q7792) Sajalín | 72.492 km² · 950 km |  | Antón Chéjov viajó allí en 1890 y escribió el libro La isla de Sajalín sobre la vida en su colonia penal. |
| Chiloé | [Q504449](https://www.wikidata.org/wiki/Q504449) Isla Grande de Chiloé | 8.394 km² · 180 km |  | Dieciséis de sus iglesias de madera son Patrimonio de la Humanidad, y su plato típico es el curanto, cocido en un hoyo con piedras. |
| Islas Kuriles | [Q80389](https://www.wikidata.org/wiki/Q80389) Islas Kuriles | 10.500 km² |  | Forman un arco de decenas de volcanes, muchos activos, nacido donde la placa del Pacífico se hunde bajo la de Ojotsk. |
| Islas Aleutianas | [Q119285](https://www.wikidata.org/wiki/Q119285) Islas Aleutianas | 17.666 km² · 1.931 km |  | Su nombre viene de los aleutas, o unangan, que viven allí desde hace miles de años y cazaban en kayaks de piel. |
| Isla de Marajó | [Q193264](https://www.wikidata.org/wiki/Q193264) Marajó | 40.100 km² · 297 km |  | Abundan los búfalos de agua, tanto que en el pueblo de Soure hasta la policía patrulla montada en ellos. |
| Isla Ellesmere | [Q146841](https://www.wikidata.org/wiki/Q146841) Isla de Ellesmere | 196.235 km² · 820 km |  | Allí se halló en 2004 el Tiktaalik, un pez fósil con aletas parecidas a patas, clave para entender la salida de los animales a tierra. |
| Azores | [Q25263](https://www.wikidata.org/wiki/Q25263) Azores | 2.334 km² |  | Dan nombre al anticiclón de las Azores, un sistema de altas presiones que marca el tiempo de buena parte de Europa. |
| Madeira | [Q26253](https://www.wikidata.org/wiki/Q26253) Madeira | 801 km² |  | Cristiano Ronaldo nació en Funchal, su capital, y desde 2017 el aeropuerto de la isla lleva su nombre. |
| Península ibérica | [Q12837](https://www.wikidata.org/wiki/Q12837) península ibérica | 596.740 km² |  | Los griegos la llamaron Iberia, nombre ligado al río Ebro, que conocían como Iber, y a los pueblos íberos que vivían allí. |
| Península itálica | [Q145694](https://www.wikidata.org/wiki/Q145694) península itálica | 131.336 km² |  | Dentro de ella hay dos pequeños países independientes, San Marino y el Vaticano, rodeados por completo por Italia. |
| Península escandinava | [Q21195](https://www.wikidata.org/wiki/Q21195) Escandinavia |  |  | Sigue elevándose lentamente desde la última glaciación, al verse libre del enorme peso del hielo que la cubría. |
| Península arábiga | [Q31945](https://www.wikidata.org/wiki/Q31945) Arabia | 3.200.000 km² |  | Durante siglos el café se exportó desde el puerto yemení de Moca, y de ahí viene el nombre del café moca. |
| Península de Corea | [Q483134](https://www.wikidata.org/wiki/Q483134) península de Corea | 220.848 km² |  | El alfabeto coreano, el hangul, fue creado en el siglo XV por el rey Sejong para que todo el pueblo pudiera aprender a leer. |
| Florida | [Q812](https://www.wikidata.org/wiki/Q812) Florida | 170.304 km² |  | Juan Ponce de León la bautizó así en 1513 porque llegó en tiempo de Pascua Florida, como se llamaba la fiesta de Pascua. |
| Península balcánica (Balcanes) | [Q23522](https://www.wikidata.org/wiki/Q23522) península balcánica | 470.000 km² |  | Su nombre procede de los montes Balcanes, palabra de origen turco que significa algo así como cordillera boscosa. |
| Indochina | [Q27617163](https://www.wikidata.org/wiki/Q27617163)  |  |  | Su nombre se acuñó a comienzos del siglo XIX porque sus culturas mezclan influencias de la India y de China. |
| Península de Yucatán | [Q130978](https://www.wikidata.org/wiki/Q130978) península de Yucatán |  |  | Bajo su costa yace el cráter de Chicxulub, dejado por el asteroide que hace 66 millones de años acabó con los dinosaurios. |
| Baja California | [Q178543](https://www.wikidata.org/wiki/Q178543) península de California | 143.382 km² |  | Cada invierno, las ballenas grises viajan desde el Ártico hasta sus lagunas para tener a sus crías. |
| Península malaya | [Q18758](https://www.wikidata.org/wiki/Q18758) península de Malaca | 242.364 km² |  | A comienzos del siglo XX fue la mayor productora mundial de estaño y caucho, base de su economía en la época británica. |
| Cuerno de África | [Q40556](https://www.wikidata.org/wiki/Q40556) Cuerno de África | 2.000.000 km² |  | Se cree que el café nació en sus tierras altas etíopes; una leyenda lo atribuye al pastor Kaldi y sus cabras inquietas. |
| Península de La Guajira | [Q1056122](https://www.wikidata.org/wiki/Q1056122) península de La Guajira |  |  | Es el territorio del pueblo wayuu, famoso por sus coloridas mochilas tejidas a mano, que pueden tardar semanas en hacerse. |
| Kamchatka | [Q993](https://www.wikidata.org/wiki/Q993) península de Kamchatka | 270.000 km² |  | Su Valle de los Géiseres, el segundo campo de géiseres más grande del mundo, no fue descubierto hasta 1941. |
| Crimea | [Q7835](https://www.wikidata.org/wiki/Q7835) península de Crimea | 27.000 km² |  | En su costa, sobre un acantilado, se alza el Nido de Golondrina, un pequeño castillo neogótico construido en 1912. |
| Península de Kola | [Q165608](https://www.wikidata.org/wiki/Q165608) Península de Kola | 100.000 km² |  | Allí se perforó el pozo superprofundo de Kola, que superó los 12 km y es el agujero más hondo jamás hecho por humanos. |
| Península de Alaska | [Q60064](https://www.wikidata.org/wiki/Q60064) Península de Alaska | 1.500.000 km² · 800 km |  | En el parque Katmai, los osos pardos se reúnen cada verano en las cascadas Brooks para atrapar salmones al vuelo. |
| Labrador | [Q380307](https://www.wikidata.org/wiki/Q380307) Labrador | 294.330 km² |  | Su nombre viene del navegante portugués João Fernandes Lavrador, y de esta región toma el suyo la raza de perro labrador. |
| Jutlandia | [Q25389](https://www.wikidata.org/wiki/Q25389) Península de Jutlandia | 29.777 km² |  | En Billund nació LEGO en 1932, fundada por el carpintero Ole Kirk Christiansen, que empezó haciendo juguetes de madera. |
| Bretaña | [Q12130](https://www.wikidata.org/wiki/Q12130) Bretaña | 27.208 km² |  | Conserva una lengua celta, el bretón, y en Carnac hay miles de menhires alineados hace más de 5.000 años. |
| Península del Cabo York | [Q233770](https://www.wikidata.org/wiki/Q233770) Península del Cabo York |  |  | Toma su nombre del cabo que James Cook bautizó en 1770 en honor del duque de York; en sus ríos abundan los cocodrilos. |
| Península del Sinaí | [Q36755](https://www.wikidata.org/wiki/Q36755) Península del Sinaí | 60.000 km² |  | Al pie del monte Sinaí está el monasterio de Santa Catalina, del siglo VI, uno de los más antiguos que siguen habitados. |
| Cabo de Buena Esperanza | [Q4092](https://www.wikidata.org/wiki/Q4092) Cabo de Buena Esperanza |  |  | Bartolomeu Dias lo llamó cabo de las Tormentas en 1488; el rey Juan II lo rebautizó por la esperanza de llegar a la India. |
| Cabo de Hornos | [Q4078](https://www.wikidata.org/wiki/Q4078) Cabo de Hornos |  |  | Su nombre no viene de los hornos: lo bautizaron en 1616 los holandeses Schouten y Le Maire en honor a la ciudad de Hoorn. |
| Cabo Cañaveral | [Q193401](https://www.wikidata.org/wiki/Q193401) Cabo Cañaveral |  |  | Desde el Centro Espacial Kennedy, junto al cabo, despegó en 1969 el Apolo 11, que llevó a los primeros humanos a la Luna. |
| Cabo San Lucas | [Q1020776](https://www.wikidata.org/wiki/Q1020776) Cabo San Lucas |  |  | Su símbolo es El Arco, una formación de granito tallada por el mar, y en invierno se ven ballenas jorobadas desde la costa. |
| Cabo Norte | [Q4069](https://www.wikidata.org/wiki/Q4069) Cabo Norte |  |  | Entre mediados de mayo y finales de julio el sol nunca se pone, y miles de viajeros llegan para ver el sol de medianoche. |
| Cabo Finisterre | [Q1136198](https://www.wikidata.org/wiki/Q1136198) cabo Finisterre |  |  | Su nombre viene del latín finis terrae, fin de la tierra, y muchos peregrinos del Camino de Santiago terminan allí su viaje. |
| Cabo de las Agujas | [Q4085](https://www.wikidata.org/wiki/Q4085) Cabo de las Agujas |  |  | Marca oficialmente el límite entre los océanos Atlántico e Índico, y no el cabo de Buena Esperanza, como muchos creen. |
| Cabo Guardafui | [Q1145030](https://www.wikidata.org/wiki/Q1145030) Cabo Guardafui |  |  | Los antiguos navegantes griegos lo llamaban cabo de las Especias, por el incienso y la mirra que se comerciaban en la región. |
| Cabo de San Vicente | [Q4103](https://www.wikidata.org/wiki/Q4103) cabo de San Vicente |  |  | Los romanos lo llamaban Promontorio Sagrado y creían que allí el sol se hundía en el mar cada atardecer. |
| Cabo Cod | [Q49152](https://www.wikidata.org/wiki/Q49152) Cabo Cod | 880 km² |  | Los peregrinos del Mayflower tocaron tierra primero en su punta, en 1620, antes de seguir y fundar Plymouth. |
| Cabo Hatteras | [Q978032](https://www.wikidata.org/wiki/Q978032) Cabo Hatteras |  |  | En 1999 su famoso faro de rayas en espiral fue trasladado casi 900 metros tierra adentro para salvarlo de la erosión. |
| Cabo Comorín | [Q946721](https://www.wikidata.org/wiki/Q946721) Cabo Comorin |  |  | Desde su orilla se ven el amanecer y el atardecer sobre el mar, y lo custodia una gran estatua del poeta tamil Tiruvalluvar. |
| Cabo Farewell (Groenlandia) | [Q128097](https://www.wikidata.org/wiki/Q128097) Cabo Farewell |  |  | En groenlandés se llama Uummannarsuaq, y es una de las zonas más ventosas del océano por las ráfagas que canaliza el relieve. |
| Cabo Reinga | [Q1034494](https://www.wikidata.org/wiki/Q1034494) Cabo Reinga |  |  | Para los maoríes es Te Rerenga Wairua, el lugar desde donde los espíritus de los difuntos parten hacia su tierra ancestral. |
| Punta Gallinas | [Q48454](https://www.wikidata.org/wiki/Q48454) Punta Gallinas |  |  | Muy cerca están las dunas de Taroa, montañas de arena que caen directamente al mar en un paisaje de desierto. |
| Land's End | [Q169532](https://www.wikidata.org/wiki/Q169532) Land's End |  |  | Es el punto de partida del famoso recorrido hasta John o' Groats, que muchos hacen a pie o en bicicleta para cruzar Gran Bretaña. |
| Istmo de Panamá | [Q182139](https://www.wikidata.org/wiki/Q182139) Istmo de Panamá |  |  | Su formación, hace unos 3 millones de años, unió las dos Américas y permitió el paso de animales entre el norte y el sur. |
| Istmo de Tehuantepec | [Q392250](https://www.wikidata.org/wiki/Q392250) Istmo de Tehuantepec |  |  | El traje de tehuana, con flores bordadas, se hizo famoso en el mundo porque Frida Kahlo lo usaba a menudo. |
| Istmo de Kra | [Q322356](https://www.wikidata.org/wiki/Q322356) Istmo de Kra |  |  | Desde el siglo XVII se ha propuesto abrir un canal en él para evitar el estrecho de Malaca, pero nunca se ha construido. |
| Cataratas del Niágara | [Q34221](https://www.wikidata.org/wiki/Q34221) Cataratas del Niágara | 57 m de caída |  | En 1901 la maestra Annie Edson Taylor, de 63 años, fue la primera persona en caer por ellas dentro de un barril y sobrevivir. |
| Cataratas del Iguazú | [Q36332](https://www.wikidata.org/wiki/Q36332) Cataratas del Iguazú | 82 m de caída |  | Su nombre viene del guaraní y significa agua grande, y su salto más impresionante se llama la Garganta del Diablo. |
| Cataratas Victoria | [Q43278](https://www.wikidata.org/wiki/Q43278) cataratas Victoria | 108 m de caída · UNESCO |  | Su nombre local, Mosi-oa-Tunya, significa el humo que truena; David Livingstone las llamó Victoria en 1855. |
| Salto Ángel | [Q80299](https://www.wikidata.org/wiki/Q80299) Salto Ángel | 979 m de caída |  | Debe su nombre al aviador estadounidense Jimmie Angel, que en 1937 aterrizó su avioneta en la cima del tepuy y quedó atascado. |
| Gran Cañón | [Q118841](https://www.wikidata.org/wiki/Q118841) Gran Cañón | 446 km |  | Sus rocas más profundas tienen casi 2.000 millones de años, y el río Colorado tardó millones de años en tallarlo. |
| Amazonia | [Q244451](https://www.wikidata.org/wiki/Q244451) cuenca hidrográfica del Amazonas | 6.300.000 km² |  | Su nombre viene de las amazonas del mito griego: en 1542 Francisco de Orellana dijo haber luchado allí contra mujeres guerreras. |
| Patagonia | [Q1507](https://www.wikidata.org/wiki/Q1507) Patagonia |  |  | Magallanes llamó patagones a sus habitantes en 1520, quizá por un gigante de una novela de caballería, y de ahí su nombre. |
| Siberia | [Q5428](https://www.wikidata.org/wiki/Q5428) Siberia | 13.488.500 km² |  | La cruza el Transiberiano, la línea de tren más larga del mundo, con más de 9.000 km entre Moscú y Vladivostok. |
| Gran Valle del Rift | [Q81591](https://www.wikidata.org/wiki/Q81591) Gran Valle del Rift | 4.830 km |  | En él se han hallado fósiles clave de nuestros antepasados, como Lucy, un esqueleto de 3,2 millones de años hallado en 1974. |
| La Pampa | [Q184382](https://www.wikidata.org/wiki/Q184382) pampa |  |  | Es la tierra del gaucho, jinete famoso por el mate, el asado y la vida a caballo, retratado en el poema Martín Fierro. |
| Sahel | [Q23945221](https://www.wikidata.org/wiki/Q23945221) Sahel |  |  | Su nombre viene del árabe sahil, que significa orilla: es como la costa del gran mar de arena del Sahara. |
| Serengueti | [Q4991540](https://www.wikidata.org/wiki/Q4991540) Serengueti | 30.000 km² |  | Su nombre viene del maasai y significa llanura sin fin; cada año más de un millón de ñus la recorren en la gran migración. |
| Pantanal | [Q157603](https://www.wikidata.org/wiki/Q157603)  | 1.878 km² · UNESCO |  | Es uno de los mejores lugares del mundo para ver jaguares en libertad, que allí cazan incluso caimanes en los ríos. |
| Los Llanos | [Q141501](https://www.wikidata.org/wiki/Q141501) Llanos | 375.787 km² |  | Es la cuna del joropo, la música y el baile llaneros que se tocan con arpa, cuatro y maracas. |
| Mesopotamia | [Q11767](https://www.wikidata.org/wiki/Q11767) Mesopotamia |  |  | Su nombre griego significa entre ríos, y allí los sumerios inventaron una de las primeras escrituras, la cuneiforme. |
| Delta del Nilo | [Q179528](https://www.wikidata.org/wiki/Q179528) Delta del Nilo |  |  | Su forma triangular llevó a los griegos a llamarlo como la letra delta, y de ahí viene el nombre de todos los deltas. |
| Gran Barrera de Coral | [Q7343](https://www.wikidata.org/wiki/Q7343) Gran barrera de coral | 348.000 km² · 2.300 km · UNESCO |  | Está formada por miles de arrecifes construidos por diminutos pólipos de coral, y es Patrimonio de la Humanidad desde 1981. |
| Cuenca del Congo | [Q932289](https://www.wikidata.org/wiki/Q932289) cuenca hidrográfica del Congo | 1.000.000 km² |  | Es el único hogar de los bonobos, parientes cercanos del ser humano, y del okapi, primo de la jirafa con patas rayadas. |
| Sundarbans | [Q4526](https://www.wikidata.org/wiki/Q4526) Sundarbans | 10.277 km² |  | Es hogar de tigres de Bengala que nadan entre sus islas, y su nombre se asocia al sundari, un árbol de manglar. |
| Delta del Ganges | [Q1163759](https://www.wikidata.org/wiki/Q1163759) Delta del Ganges |  |  | Lo forman juntos el Ganges y el Brahmaputra, y allí se cultiva gran parte del yute del mundo, la llamada fibra dorada. |
| Delta del Misisipi | [Q1528035](https://www.wikidata.org/wiki/Q1528035) delta del Misisipi |  |  | Por sus brazos que se abren al mar lo llaman delta en pata de pájaro, y en sus tierras creció Nueva Orleans, cuna del jazz. |
| Delta del Amazonas | [Q10264912](https://www.wikidata.org/wiki/Q10264912) Amazon Delta |  |  | Allí se produce la pororoca, una ola que remonta el río con la marea y que algunos surfistas recorren por kilómetros. |
| Delta del Danubio | [Q184429](https://www.wikidata.org/wiki/Q184429) delta del Danubio | 4.178 km² · UNESCO |  | Es hogar de grandes colonias de pelícanos y Patrimonio de la Humanidad desde 1991 por sus aves y humedales. |
| Delta del Mekong | [Q1052867](https://www.wikidata.org/wiki/Q1052867) Región Delta del Río Mekong | 40.577 km² |  | En vietnamita se llama Cửu Long, nueve dragones, y sus mercados flotantes se llenan al amanecer de barcas con frutas. |
| Delta del Níger | [Q29412](https://www.wikidata.org/wiki/Q29412) Delta del Níger |  |  | En el siglo XIX los británicos lo llamaban los Ríos del Aceite, por su comercio de aceite de palma. |
| Grandes Llanuras | [Q12707](https://www.wikidata.org/wiki/Q12707) Grandes Llanuras |  |  | Antes las recorrían decenas de millones de bisontes, y hoy son uno de los graneros del mundo por su trigo y su maíz. |
| Gran Chaco | [Q208347](https://www.wikidata.org/wiki/Q208347) Gran Chaco |  |  | Su nombre viene del quechua chaku, lugar de caza, y allí vive el pecarí del Chaco, que se creía extinto hasta 1975. |
| Escudo Canadiense | [Q76034](https://www.wikidata.org/wiki/Q76034) Escudo Canadiense |  |  | Guarda algunas de las rocas más antiguas de la Tierra, como el gneis de Acasta, de unos 4.000 millones de años. |
| Laponia | [Q5700](https://www.wikidata.org/wiki/Q5700) Laponia finlandesa | 100.367 km² |  | Es la tierra del pueblo sami, conocido por la cría de renos, y en Rovaniemi se visita la aldea de Papá Noel. |
| Gran Cuenca (EE. UU.) | [Q966943](https://www.wikidata.org/wiki/Q966943) Gran Cuenca |  |  | Ninguno de sus ríos llega al mar, y en ella crecen pinos longevos que superan los 4.000 años de edad. |
| Llanura del Norte de Europa | [Q560549](https://www.wikidata.org/wiki/Q560549) Llanura nordeuropea |  |  | En su extremo occidental, los neerlandeses le ganaron tierra al mar con diques, pólderes y molinos de viento. |
| Tapón del Darién | [Q917276](https://www.wikidata.org/wiki/Q917276) región del Darién |  |  | Es el único tramo sin carretera de la Panamericana, que de otro modo uniría Alaska con la Patagonia. |
| Estepa kazaja | [Q602925](https://www.wikidata.org/wiki/Q602925) Estepa kazaja |  |  | Desde el cosmódromo de Baikonur, en plena estepa, despegó en 1961 Yuri Gagarin, el primer ser humano en el espacio. |
| Tres Gargantas del Yangtsé | [Q673287](https://www.wikidata.org/wiki/Q673287) Three Gorges |  |  | Allí se levanta la presa de las Tres Gargantas, la central hidroeléctrica con mayor potencia instalada del mundo. |
| Llanura del Ganges | [Q192305](https://www.wikidata.org/wiki/Q192305) Llanura Indo-Gangética |  |  | Allí está Varanasi, a orillas del Ganges, considerada una de las ciudades habitadas sin interrupción más antiguas del mundo. |
| Everglades | [Q597281](https://www.wikidata.org/wiki/Q597281) Everglades |  |  | Es el único lugar del mundo donde conviven aligátores y cocodrilos, y se le apoda el río de hierba. |
| Valle de la Muerte | [Q118388](https://www.wikidata.org/wiki/Q118388) Valle de la Muerte | 7.770 km² |  | Lo bautizaron así unos buscadores de oro en 1849, y en 1913 marcó 56,7 °C, la temperatura más alta medida en la Tierra. |
| Cordillera Occidental | [Q8463325](https://www.wikidata.org/wiki/Q8463325) Cordillera Occidental | 2.200 km |  | Frena las nubes cargadas de humedad del Pacífico, y por eso sus laderas occidentales están entre las más lluviosas del planeta. |
| Cordillera Central | [Q143982](https://www.wikidata.org/wiki/Q143982) Cordillera Central | 129.737 km² · 1.023 km |  | En sus laderas está buena parte del Eje Cafetero, y la coronan volcanes nevados como el del Ruiz y el de Santa Isabel. |
| Cordillera Oriental | [Q4794486](https://www.wikidata.org/wiki/Q4794486) Cordillera Oriental | 1.800 km |  | En su altiplano floreció la cultura muisca, conocida por su orfebrería y por la sal que extraía en Zipaquirá y Nemocón. |
| Parque Tayrona | [Q23682157](https://www.wikidata.org/wiki/Q23682157) Tayrona National Park |  |  | Debe su nombre a los taironas, cuyos descendientes, como los kogui, consideran sagradas sus playas y montañas. |
| Caño Cristales | [Q2624957](https://www.wikidata.org/wiki/Q2624957) Caño Cristales | 100 km |  | Lo llaman el río de los cinco colores porque una planta acuática, la Macarenia clavigera, tiñe su lecho de rojo intenso. |
| Desierto de la Tatacoa | [Q533861](https://www.wikidata.org/wiki/Q533861) Desierto de la Tatacoa |  |  | Aunque se le llama desierto, en realidad es un bosque seco tropical, y su cielo limpio lo hace ideal para observar estrellas. |
| Valle de Cocora | [Q965776](https://www.wikidata.org/wiki/Q965776) Valle de Cocora |  |  | Allí crecen las palmas de cera, árbol nacional de Colombia y las palmas más altas del mundo. |
| Río Atrato | [Q1363972](https://www.wikidata.org/wiki/Q1363972) Río Atrato | 644 km |  | En 2016 la Corte Constitucional lo reconoció como sujeto de derechos, un fallo pionero para un río en Colombia. |
| Río Meta | [Q655251](https://www.wikidata.org/wiki/Q655251) Río Meta | 1.000 km |  | Le da nombre al departamento del Meta y es uno de los principales afluentes del Orinoco, navegable en largos tramos. |
| Río Putumayo | [Q213782](https://www.wikidata.org/wiki/Q213782) Río Putumayo | 1.610 km |  | Da nombre al departamento del Putumayo y, al entrar en Brasil, pasa a llamarse Içá antes de unirse al Amazonas. |
| Río Caquetá | [Q171840](https://www.wikidata.org/wiki/Q171840) Río Caquetá | 2.820 km |  | Al llegar a Brasil cambia de nombre y se llama Japurá, y se une al Amazonas por una red de canales y lagos. |
| Cañón del Chicamocha | [Q2936924](https://www.wikidata.org/wiki/Q2936924) Cañón del Chicamocha | 1.080 km² · 227 km |  | Su teleférico, de unos 6,3 km, cruza el cañón de lado a lado y es uno de los más largos del mundo. |
| Sierra Nevada del Cocuy | [Q1068068](https://www.wikidata.org/wiki/Q1068068) Parque nacional natural El Cocuy | 3.059 km² |  | Alberga la mayor superficie de glaciares de Colombia y es territorio sagrado para el pueblo indígena u'wa. |
| Laguna de Guatavita | [Q1552915](https://www.wikidata.org/wiki/Q1552915) Laguna de Guatavita | 1 km |  | Allí nació la leyenda de El Dorado: el cacique muisca, cubierto de polvo de oro, ofrecía joyas a la laguna. |
| Islas del Rosario | [Q1674250](https://www.wikidata.org/wiki/Q1674250) Islas Corales del Rosario |  |  | Integran un parque nacional que protege arrecifes de coral y manglares, y en una de ellas funciona un oceanario. |
| Cabo de la Vela | [Q1024910](https://www.wikidata.org/wiki/Q1024910) Cabo de la Vela |  |  | Para los wayuu es Jepira, un lugar sagrado adonde viajan las almas tras la muerte, y hoy es meca del kitesurf. |
| Lago de Tota | [Q1720776](https://www.wikidata.org/wiki/Q1720776) Lago de Tota | 60 km² |  | Tiene una playa de arena blanca, Playa Blanca, y en sus orillas se cultiva buena parte de la cebolla larga de Colombia. |
| Golfo de Urabá | [Q761784](https://www.wikidata.org/wiki/Q761784) Golfo de Urabá |  |  | En sus orillas se fundó en 1510 Santa María la Antigua del Darién, una de las primeras ciudades españolas en tierra firme americana. |
| Ciénaga Grande de Santa Marta | [Q3051411](https://www.wikidata.org/wiki/Q3051411) Ciénaga Grande de Santa Marta |  |  | En sus aguas hay pueblos palafitos como Nueva Venecia, donde las casas, la escuela y la iglesia se alzan sobre pilotes. |
| Nevado del Tolima | [Q144327](https://www.wikidata.org/wiki/Q144327) Nevado del Tolima | 5.200 m |  | Es un volcán de cono casi perfecto y forma parte del Parque Nacional Natural Los Nevados, junto al nevado del Ruiz. |
| Salto del Tequendama | [Q490295](https://www.wikidata.org/wiki/Q490295) Salto del Tequendama | 157 m de caída |  | Según la leyenda muisca, el dios Bochica partió las rocas con su vara para desaguar la sabana inundada, y así nació el salto. |
| Isla Gorgona | [Q33054552](https://www.wikidata.org/wiki/Q33054552) parque nacional natural Isla Gorgona | 1 km² |  | Fue una cárcel de máxima seguridad hasta 1984 y hoy es parque nacional, donde se ven ballenas jorobadas de julio a octubre. |
| Parque Chiribiquete | [Q2603196](https://www.wikidata.org/wiki/Q2603196) Parque nacional natural Sierra de Chiribiquete | 39.897 km² · UNESCO |  | Sus tepuyes guardan decenas de miles de pinturas rupestres, y en 2018 fue declarado Patrimonio de la Humanidad. |
| Parque Amacayacu | [Q1817955](https://www.wikidata.org/wiki/Q1817955) Parque nacional natural Amacayacu | 2.672 km² |  | Su nombre significa río de las hamacas, y en sus aguas se pueden ver delfines rosados del Amazonas. |
| Serranía de La Macarena | [Q368819](https://www.wikidata.org/wiki/Q368819) Serrania de la Macarena | 120 km |  | Es una formación muy antigua ligada al Escudo Guayanés, donde se mezclan especies andinas, amazónicas y de los Llanos. |
| Laguna de La Cocha | [Q3068877](https://www.wikidata.org/wiki/Q3068877) Laguna de la Cocha | 42 km² |  | En medio de la laguna está La Corota, una isla protegida como santuario de flora y fauna, y en sus orillas se come trucha. |
| Volcán Puracé | [Q1330927](https://www.wikidata.org/wiki/Q1330927) Volcán Puracé | 4.756 m |  | En su parque nacional nacen ríos como el Magdalena y el Cauca, y es uno de los mejores lugares para ver cóndores andinos. |
| Nevado del Huila | [Q648551](https://www.wikidata.org/wiki/Q648551) Nevado del Huila | 5.364 m |  | Estuvo dormido durante siglos hasta que despertó en 2007, y para el pueblo nasa es una montaña sagrada. |
| Isla de Malpelo | [Q750683](https://www.wikidata.org/wiki/Q750683) Isla de Malpelo | 0 km² · 2 km |  | Sus aguas reúnen enormes bancos de tiburones martillo, y es Patrimonio de la Humanidad desde 2006, un paraíso del buceo. |
| Páramo de Sumapaz | [Q3411486](https://www.wikidata.org/wiki/Q3411486) Páramo de Sumapaz | 3.795 m |  | Está cubierto de frailejones, plantas que crecen cerca de un centímetro al año y atrapan el agua de la niebla. |
| Golfo de Morrosquillo | [Q3110248](https://www.wikidata.org/wiki/Q3110248) Golfo de Morrosquillo |  |  | Frente a él está Santa Cruz del Islote, tan pequeño y poblado que se considera una de las islas más densas del mundo. |
| Río Vaupés | [Q14290](https://www.wikidata.org/wiki/Q14290) Vaupés | 1.050 km |  | En Brasil se le conoce como Uaupés y sus aguas terminan en el río Negro; en sus orillas viven pueblos como los cubeos. |
| Río Mira | [Q3458705](https://www.wikidata.org/wiki/Q3458705) Río Mira | 400 km |  | En su tramo ecuatoriano se llama Chota, y ese valle es famoso por la música bomba y por sus futbolistas. |
| Río Guainía | [Q118771](https://www.wikidata.org/wiki/Q118771) Río Negro | 2.250 km |  | Es el curso alto del río Negro, y sus aguas oscuras como el té se deben a la materia vegetal disuelta. |
| Volcán Cumbal | [Q2019666](https://www.wikidata.org/wiki/Q2019666) nevado del cumbal | 4.764 m |  | A sus pies está la laguna de Cumbal, o de La Bolsa, y lo rodean resguardos del pueblo indígena de los pastos. |
| Serranía del Perijá | [Q2015709](https://www.wikidata.org/wiki/Q2015709) Serranía del Perijá | 310 km |  | Es territorio de los pueblos yukpa y barí, y alberga aves que solo existen allí, como el periquito de Perijá. |
| Serranía del Baudó | [Q3479954](https://www.wikidata.org/wiki/Q3479954) Serranía del Baudó | 375 km |  | Sus montañas cubiertas de selva caen directo al mar, y frente a ellas llegan cada año ballenas jorobadas a tener sus crías. |
| Ciénaga de Zapatosa | [Q2974922](https://www.wikidata.org/wiki/Q2974922) Ciénaga de Zapatosa | 400 km² |  | Fue declarada sitio Ramsar en 2018, y sus pescadores viven del bocachico, el bagre y otros peces de agua dulce. |
| Páramo de Santurbán | [Q23682537](https://www.wikidata.org/wiki/Q23682537) Páramo de Santurbán | 3.966 m |  | De sus lagunas y frailejones nace el agua que abastece a Bucaramanga y a buena parte de su área metropolitana. |
| Isla de Salamanca | [Q3593411](https://www.wikidata.org/wiki/Q3593411) Isla de Salamanca |  |  | Es un Vía Parque, pues una carretera la atraviesa entre manglares, y alberga cientos de especies de aves. |
| Lago Calima | [Q3133513](https://www.wikidata.org/wiki/Q3133513) Embalse del Calima | 20 km² |  | Es un embalse artificial de los años sesenta cuyos vientos constantes lo han hecho famoso para el windsurf y el kitesurf. |

## Monumentos (241)

| Lugar | Wikidata | Cifras | Cerca | Dato curioso |
|---|---|---|---|---|
| Torre Eiffel | [Q243](https://www.wikidata.org/wiki/Q243) torre Eiffel | 330 m de caída · desde 1887 · UNESCO | Arco del Triunfo, Museo del Louvre | Se construyó para la Exposición Universal de 1889 y debía desmontarse a los 20 años; la salvó su uso como antena de radio. |
| Estatua de la Libertad | [Q9202](https://www.wikidata.org/wiki/Q9202) Estatua de la Libertad | 47 m de caída · desde 1886 · estilo arquitectura neoclásica · UNESCO | Puente de Brooklyn, Empire State | Fue un regalo de Francia, su estructura interna la diseñó Gustave Eiffel y su color verde viene del cobre oxidado. |
| Coliseo | [Q10285](https://www.wikidata.org/wiki/Q10285) Coliseo | 48 m de caída · desde 82 · cultura Antigua Roma · estilo arquitectura de la Antigua Roma | Basílica de San Pedro, Capilla Sixtina | Se inauguró en el año 80 con 100 días de juegos y tenía un enorme toldo, el velarium, para dar sombra al público. |
| Cristo Redentor | [Q79961](https://www.wikidata.org/wiki/Q79961) Cristo Redentor | 30 m de caída · desde 1920 | Estadio Maracaná, Pan de Azúcar | Se inauguró en 1931 y está recubierto con miles de pequeños triángulos de esteatita, una piedra blanda y resistente. |
| Machu Picchu | [Q676203](https://www.wikidata.org/wiki/Q676203) Machu Picchu | desde 1450 · cultura cultura Inca | Cordillera de los Andes, Amazonia | Se cree que se construyó para el inca Pachacútec; sus muros encajan sin mortero y Hiram Bingham la dio a conocer en 1911. |
| Pirámides de Giza | [Q37200](https://www.wikidata.org/wiki/Q37200) Gran pirámide de Giza | 147 m de caída · desde 2559 a. C. · estilo arquitectura del Antiguo Egipto | Desierto del Sahara | La Gran Pirámide es la única de las siete maravillas del mundo antiguo que sigue en pie, tras unos 4.500 años. |
| Taj Mahal | [Q9141](https://www.wikidata.org/wiki/Q9141) Taj Mahal | 73 m de caída · estilo arquitectura islámica · UNESCO | Llanura del Ganges | El emperador Shah Jahan lo mandó construir como mausoleo para su esposa Mumtaz Mahal; su mármol cambia de tono con la luz. |
| Gran Muralla China | [Q12501](https://www.wikidata.org/wiki/Q12501) Gran Muralla china | 8 m de caída · desde década de -700 |  | Contra el mito popular, no se ve a simple vista desde el espacio: es muy larga, pero estrecha y del color del terreno. |
| Big Ben | [Q41225](https://www.wikidata.org/wiki/Q41225) Big Ben | 96 m de caída · desde 1843 · estilo arquitectura neogótica | Puente de la Torre, Gran Bretaña | Big Ben es en realidad el nombre de la gran campana; la torre se llama oficialmente Torre Isabel desde 2012. |
| Ópera de Sídney | [Q45178](https://www.wikidata.org/wiki/Q45178) Ópera de Sídney | 67 m de caída · desde 1973 · estilo arquitectura expresionista · UNESCO | Puente de la Bahía de Sídney, Mar de Tasmania | El danés Jørn Utzon ganó el concurso de diseño en 1957, pero dejó la obra en 1966 y nunca la vio terminada en persona. |
| Chichén Itzá | [Q5859](https://www.wikidata.org/wiki/Q5859) Chichén Itzá | desde 455 · cultura cultura maya · UNESCO | Península de Yucatán | En los equinoccios, la luz y la sombra dibujan una serpiente que parece bajar por la escalera de la pirámide de Kukulcán. |
| Sagrada Familia | [Q48435](https://www.wikidata.org/wiki/Q48435) Templo Expiatorio de la Sagrada Familia | 173 m de caída · desde 1882 · estilo arquitectura neogótica · UNESCO |  | Gaudí le dedicó más de 40 años, desde 1883 hasta su muerte en 1926, y está enterrado en su cripta. |
| Burj Khalifa | [Q12495](https://www.wikidata.org/wiki/Q12495) Burj Khalifa | 830 m de caída · desde 2004 · estilo Arquitectura high-tech | Burj Al Arab, Península arábiga | Se iba a llamar Burj Dubái, pero en su inauguración de 2010 lo rebautizaron en honor al presidente emiratí Khalifa bin Zayed. |
| Torre de Pisa | [Q39054](https://www.wikidata.org/wiki/Q39054) Torre de Pisa | 58 m de caída · desde 1173 · estilo arquitectura románica · UNESCO | Península itálica | Empezó a inclinarse durante su construcción por el suelo blando, y la obra tardó casi 200 años en terminarse. |
| Acrópolis de Atenas | [Q131013](https://www.wikidata.org/wiki/Q131013) Acrópolis de Atenas | desde siglo 5 a. C. · cultura Antigua Grecia · UNESCO | Península balcánica (Balcanes) | El Partenón, dedicado a Atenea, casi no tiene líneas rectas: sus columnas se abomban un poco para que se vean rectas. |
| Puente Golden Gate | [Q44440](https://www.wikidata.org/wiki/Q44440) puente Golden Gate | 227 m de caída · desde 1937 | Alcatraz | Su color, llamado naranja internacional, se eligió para que destacara en la niebla y armonizara con el paisaje; abrió en 1937. |
| Moáis de Isla de Pascua | [Q14452](https://www.wikidata.org/wiki/Q14452) Isla de Pascua |  |  | Los rapanuis los tallaron en toba volcánica de la cantera de Rano Raraku, y la mayoría mira hacia el interior de la isla. |
| Angkor Wat | [Q43473](https://www.wikidata.org/wiki/Q43473) Angkor Wat | desde 802 · estilo Arquitectura dravídica · UNESCO | Ta Prohm, Indochina | Aparece en la bandera de Camboya; se construyó en el siglo XII como templo hindú dedicado a Visnú y luego pasó a ser budista. |
| Petra | [Q5788](https://www.wikidata.org/wiki/Q5788) Petra | desde 799 a. C. · cultura reino nabateo · UNESCO |  | Los nabateos la tallaron en arenisca rosada, y la fachada del Tesoro aparece en la película Indiana Jones y la última cruzada. |
| Kremlin y Plaza Roja | [Q133274](https://www.wikidata.org/wiki/Q133274) Kremlin | desde 1420 · UNESCO | Catedral de San Basilio | El nombre de la Plaza Roja no viene del color: en ruso antiguo, la palabra krásnaya también significaba bonita. |
| Teotihuacán | [Q172613](https://www.wikidata.org/wiki/Q172613) Teotihuacan | cultura civilización teotihuacana · estilo Talud-tablero · UNESCO |  | Los mexicas la encontraron ya abandonada y le dieron su nombre náhuatl, que suele traducirse como lugar donde nacen los dioses. |
| Basílica de San Pedro | [Q12512](https://www.wikidata.org/wiki/Q12512) basílica de San Pedro | 137 m de caída · desde 1506 · estilo arquitectura del Renacimiento | Coliseo, Capilla Sixtina | Su enorme cúpula la diseñó Miguel Ángel, aunque él murió en 1564 sin llegar a verla terminada. |
| Catedral de Sal de Zipaquirá | [Q2565876](https://www.wikidata.org/wiki/Q2565876) Catedral de Sal | desde 1995 | Parque Jaime Duque, Cordillera de los Andes | Está construida dentro de una mina de sal, a unos 180 metros bajo tierra; la catedral actual se inauguró en 1995. |
| Canal de Panamá | [Q7350](https://www.wikidata.org/wiki/Q7350) Canal de Panamá |  | Istmo de Panamá | Se inauguró en 1914 y sus esclusas elevan los barcos unos 26 metros hasta el lago Gatún, un lago artificial. |
| Stonehenge | [Q39671](https://www.wikidata.org/wiki/Q39671) Stonehenge | desde siglo 30 a. C. · estilo Gran Bretaña prehistórica · UNESCO | Gran Bretaña, Islas Británicas | Sus piedras azules, las más pequeñas, se trajeron desde las colinas Preseli, en Gales, a más de 200 kilómetros. |
| Monte Rushmore | [Q83497](https://www.wikidata.org/wiki/Q83497) Monte Rushmore |  | Grandes Llanuras | Muestra a Washington, Jefferson, Theodore Roosevelt y Lincoln con rostros de unos 18 metros, tallados entre 1927 y 1941. |
| Puerta de Brandeburgo | [Q82425](https://www.wikidata.org/wiki/Q82425) Puerta de Brandeburgo | 26 m de caída · desde 1791 · estilo neogriego | Llanura del Norte de Europa | La corona la Cuadriga, un carro de cuatro caballos que Napoleón se llevó a París en 1806 y que fue devuelto en 1814. |
| Catedral de San Basilio | [Q129846](https://www.wikidata.org/wiki/Q129846) Catedral de San Basilio | 48 m de caída · desde 1555 · estilo Arquitectura de Rusia | Kremlin y Plaza Roja | La mandó construir Iván el Terrible a mediados del siglo XVI, y sus cúpulas de colores en forma de cebolla la hacen inconfundible. |
| Alhambra | [Q47476](https://www.wikidata.org/wiki/Q47476) Alhambra | desde 1239 · estilo Arte andalusí · UNESCO | Península ibérica | Su nombre viene del árabe al-Hamrá, la roja, por el color de sus muros; fue palacio de la dinastía nazarí. |
| Torre de Tokio | [Q183536](https://www.wikidata.org/wiki/Q183536) Torre de Tokio | 333 m de caída · desde 1957 | Honshu | Se inauguró en 1958 inspirada en la Torre Eiffel, y su pintura naranja y blanca cumple normas de seguridad aérea. |
| Torres Petronas | [Q83063](https://www.wikidata.org/wiki/Q83063) Torres Petronas | 452 m de caída · desde 1993 · estilo arquitectura posmoderna | Península malaya | Las diseñó César Pelli con planta de estrella de ocho puntas, y fueron los edificios más altos del mundo de 1998 a 2004. |
| Museo del Louvre | [Q19675](https://www.wikidata.org/wiki/Q19675) Museo del Louvre | desde 1793 | Torre Eiffel, Catedral de Notre Dame | Antes de ser museo fue fortaleza y palacio real; su famosa pirámide de vidrio, obra de I. M. Pei, se inauguró en 1989. |
| Santa Sofía | [Q12506](https://www.wikidata.org/wiki/Q12506) Santa Sofía | 55 m de caída · desde 360 · cultura arquitectura otomana · estilo arquitectura bizantina · UNESCO | Mezquita Azul, Estrecho del Bósforo | Se terminó en el año 537, bajo el emperador Justiniano, en menos de seis años, y su cúpula parece flotar sobre un anillo de ventanas. |
| Castillo de Neuschwanstein | [Q4152](https://www.wikidata.org/wiki/Q4152) Neuschwanstein | 65 m de caída · desde 1869 · estilo arquitectura neogótica · UNESCO | Alpes | Lo mandó construir el rey Luis II de Baviera, y sirvió de inspiración para el castillo de La bella durmiente de Disney. |
| Letrero de Hollywood | [Q180376](https://www.wikidata.org/wiki/Q180376) Hollywood Sign | 13 m de caída · desde 1923 |  | Se instaló en 1923 como anuncio inmobiliario y decía HOLLYWOODLAND; las últimas cuatro letras se quitaron en 1949. |
| Empire State | [Q9188](https://www.wikidata.org/wiki/Q9188) Empire State Building | 457 m de caída · desde 1931 · estilo arquitectura art déco | Estatua de la Libertad, Puente de Brooklyn | Se levantó en apenas unos 410 días, entre 1930 y 1931, y fue el edificio más alto del mundo durante casi 40 años. |
| Mezquita Azul | [Q80541](https://www.wikidata.org/wiki/Q80541) Mezquita Azul | 64 m de caída · desde 1609 · estilo arquitectura otomana · UNESCO | Santa Sofía, Estrecho del Bósforo | Su nombre popular viene de los más de 20.000 azulejos de Iznik de su interior; también es famosa por sus seis minaretes. |
| Ángel de la Independencia | [Q928541](https://www.wikidata.org/wiki/Q928541) Monumento a la Independencia | desde 1910 | Castillo de Chapultepec, Catedral Metropolitana de México | Se inauguró en 1910 por el centenario de la Independencia; la figura dorada de su cima representa una Victoria alada. |
| Obelisco de Buenos Aires | [Q831389](https://www.wikidata.org/wiki/Q831389) Obelisco de Buenos Aires | 68 m de caída · desde 1936 | Casa Rosada, Río de la Plata | Se levantó en 1936 en apenas 31 días para celebrar los 400 años de la primera fundación de la ciudad. |
| Torre CN | [Q134883](https://www.wikidata.org/wiki/Q134883) Torre CN | 553 m de caída · desde 1976 | Lago Ontario | Fue la estructura independiente más alta del mundo durante más de 30 años y tiene un piso de vidrio para mirar al vacío. |
| Casa Blanca | [Q35525](https://www.wikidata.org/wiki/Q35525) Casa Blanca | 21 m de caída · desde siglo 18 · estilo arquitectura neoclásica | Monumento a Lincoln, Capitolio de Estados Unidos | George Washington eligió el terreno, pero nunca vivió en ella: el primer presidente en ocuparla fue John Adams, en 1800. |
| La Kaaba (Gran Mezquita de La Meca) | [Q29466](https://www.wikidata.org/wiki/Q29466) Kaaba | 13 m de caída · desde década de 680 | Península arábiga | La cubre la kiswa, un manto de seda negra bordado con hilo de oro que se renueva cada año. |
| Ciudad Prohibida | [Q80290](https://www.wikidata.org/wiki/Q80290) Ciudad Prohibida | desde 1420 · UNESCO | Templo del Cielo | Fue el palacio de 24 emperadores de las dinastías Ming y Qing durante casi 500 años, y la gente común no podía entrar. |
| Catedral de Notre Dame | [Q2981](https://www.wikidata.org/wiki/Q2981) Catedral de Notre-Dame de París | 90 m de caída · desde 1163 · estilo arquitectura gótica francesa | Torre Eiffel, Museo del Louvre | La novela de Victor Hugo publicada en 1831 la hizo tan popular que impulsó su gran restauración del siglo XIX. |
| Arco del Triunfo | [Q64436](https://www.wikidata.org/wiki/Q64436) Arco de Triunfo de París | 50 m de caída · desde 1836 · estilo arquitectura neoclásica | Torre Eiffel, Museo del Louvre | Napoleón lo encargó en 1806, pero se terminó en 1836; doce avenidas parten en forma de estrella desde su plaza. |
| Puente de la Torre | [Q83125](https://www.wikidata.org/wiki/Q83125) puente de la Torre | 65 m de caída · desde 1886 · estilo arquitectura neogótica | Big Ben, Gran Bretaña | Abrió en 1894 y sus dos hojas se levantan para dejar pasar barcos; mucha gente lo confunde con el London Bridge. |
| Puente de Brooklyn | [Q125006](https://www.wikidata.org/wiki/Q125006) Puente de Brooklyn | 84 m de caída · estilo arquitectura neogótica | Estatua de la Libertad, Empire State | En 1884, el empresario P. T. Barnum lo cruzó con 21 elefantes para demostrar que era seguro; había abierto en 1883. |
| Marina Bay Sands | [Q548679](https://www.wikidata.org/wiki/Q548679) Marina Bay Sands | desde 2010 |  | Sus tres torres de 55 pisos sostienen un parque en la azotea con una piscina infinita; abrió en 2010. |
| Guerreros de Terracota | [Q47672](https://www.wikidata.org/wiki/Q47672) Guerreros de Terracota | desde 247 a. C. · cultura dinastía Qin · UNESCO |  | Unos campesinos los hallaron en 1974 al cavar un pozo; custodian la tumba del primer emperador chino, Qin Shi Huang. |
| Pan de Azúcar | [Q210722](https://www.wikidata.org/wiki/Q210722) Pan de Azúcar |  | Cristo Redentor, Estadio Maracaná | Su nombre viene de su parecido con los panes de azúcar de la época colonial, y su teleférico funciona desde 1912. |
| Estadio Maracaná | [Q155174](https://www.wikidata.org/wiki/Q155174) Estadio de Maracaná | desde 1950 | Cristo Redentor, Pan de Azúcar | Oficialmente se llama Estadio Jornalista Mário Filho; se construyó para el Mundial de 1950 y acogió la final de 2014. |
| Santuario de Las Lajas | [Q2227269](https://www.wikidata.org/wiki/Q2227269) Santuario de Las Lajas | desde 1949 · estilo arquitectura neogótica | Cordillera de los Andes, Cordillera Central | Su basílica neogótica, construida entre 1916 y 1949, parece colgar de un cañón y se une al otro lado por un puente de piedra. |
| Piedra del Peñol | [Q2244727](https://www.wikidata.org/wiki/Q2244727) Piedra del Peñol |  | Cordillera de los Andes, Cordillera Central | Vecinos de Guatapé empezaron a pintar el nombre del pueblo en la roca; los de El Peñol lo impidieron y solo quedaron una G y parte de una U. |
| Castillo de San Felipe de Barajas | [Q91110](https://www.wikidata.org/wiki/Q91110) Castillo San Felipe | desde 1536 · UNESCO | Torre del Reloj de Cartagena, Iglesia de San Pedro Claver | Se considera la mayor fortaleza que construyó España en América, y bajo sus murallas se esconde una red de túneles. |
| Cerro de Monserrate | [Q152073](https://www.wikidata.org/wiki/Q152073) Monserrate |  | Museo del Oro, Plaza de Bolívar de Bogotá | A su cima se puede subir a pie, en funicular, que funciona desde 1929, o en teleférico, que opera desde 1955. |
| Casa Rosada | [Q478926](https://www.wikidata.org/wiki/Q478926) Casa Rosada | desde 1898 · estilo neoclasicismo | Obelisco de Buenos Aires, Río de la Plata | Hay varias teorías sobre su color; una dice que se pintaba con cal mezclada con sangre de vaca para protegerla de la humedad. |
| Capitolio de La Habana | [Q1352908](https://www.wikidata.org/wiki/Q1352908) Capitolio Nacional de Cuba | desde 1929 · estilo neoclasicismo | Antillas Mayores | Terminado en 1929, guarda bajo su cúpula una réplica de diamante que marca el kilómetro cero de las carreteras del país. |
| Tikal | [Q181172](https://www.wikidata.org/wiki/Q181172) Tikal | cultura cultura maya · UNESCO | Península de Yucatán | Sus templos aparecen en la película Star Wars de 1977 como la base rebelde de la luna Yavin 4. |
| Líneas de Nazca | [Q2620036](https://www.wikidata.org/wiki/Q2620036) Líneas de Nazca | desde 199 a. C. · cultura Cultura del Perú · UNESCO | Cordillera de los Andes | Se hicieron retirando las piedras rojizas de la superficie para dejar ver el suelo claro; el clima seco las ha conservado. |
| Mont Saint-Michel | [Q20892](https://www.wikidata.org/wiki/Q20892) Monte Saint-Michel |  | Canal de la Mancha, Bretaña | Con la marea alta queda rodeado por el mar; las mareas de su bahía están entre las más fuertes de Europa. |
| Capilla Sixtina | [Q2943](https://www.wikidata.org/wiki/Q2943) Capilla Sixtina | 21 m de caída · desde 1473 · estilo arquitectura del Renacimiento | Basílica de San Pedro, Coliseo | Miguel Ángel pintó su bóveda entre 1508 y 1512, y aquí se reúnen los cardenales para elegir al papa. |
| Castillo de Edimburgo | [Q212065](https://www.wikidata.org/wiki/Q212065) Castillo de Edimburgo | desde siglo 12 | Gran Bretaña, Islas Británicas | Desde 1861, casi todos los días se dispara allí un cañonazo a la una de la tarde, conocido como el One O'Clock Gun. |
| Abu Simbel | [Q134140](https://www.wikidata.org/wiki/Q134140) Abu Simbel | desde 1273 a. C. · cultura Antiguo Egipto · UNESCO | Desierto del Sahara, Río Nilo | En los años 60 lo cortaron en bloques y lo subieron a un terreno más alto para salvarlo de las aguas de la presa de Asuán. |
| Templo de Karnak | [Q522862](https://www.wikidata.org/wiki/Q522862) Templo de Karnak | desde 1899 a. C. · cultura Antiguo Egipto · estilo arquitectura del Antiguo Egipto · UNESCO | Desierto del Sahara, Río Nilo | Su gran sala hipóstila tiene 134 columnas gigantes, y el conjunto se fue ampliando durante unos 2.000 años. |
| Borobudur | [Q4119591](https://www.wikidata.org/wiki/Q4119591) Borobudur |  | Java | Es el mayor templo budista del mundo, del siglo IX, y en su cima hay 72 estupas con forma de campana, cada una con un Buda. |
| Palacio de Potala | [Q71229](https://www.wikidata.org/wiki/Q71229) Potala | 117 m de caída · desde 637 · estilo Arquitectura dzong · UNESCO | Meseta del Tíbet | Tiene más de mil habitaciones; su Palacio Blanco cumplía funciones de gobierno y su Palacio Rojo, funciones religiosas. |
| Castillo de Himeji | [Q188754](https://www.wikidata.org/wiki/Q188754) Castillo Himeji | desde 1346 · estilo Japanese castle architecture · UNESCO | Honshu | Lo apodan el castillo de la Garza Blanca por sus muros blancos, que recuerdan a un ave a punto de alzar el vuelo. |
| Santuario Fushimi Inari | [Q714828](https://www.wikidata.org/wiki/Q714828) Fushimi Inari-taisha | desde 711 · estilo nagare-zukuri | Pabellón Dorado (Kinkaku-ji), Honshu | Sus miles de puertas torii rojas fueron donadas por personas y empresas, y sus zorros de piedra son mensajeros de Inari. |
| Pabellón Dorado (Kinkaku-ji) | [Q270983](https://www.wikidata.org/wiki/Q270983) Kinkaku-ji | desde 1397 · cultura Cultura Kitayama · UNESCO | Santuario Fushimi Inari, Honshu | Sus dos pisos superiores están cubiertos de pan de oro; nació como villa de descanso del shogún Ashikaga Yoshimitsu. |
| Torii de Itsukushima | [Q191763](https://www.wikidata.org/wiki/Q191763) Santuario Itsukushima | desde 593 · estilo Shinden-zukuri · UNESCO | Honshu | Con la marea alta su gran torii parece flotar sobre el agua, y con la marea baja se puede llegar caminando hasta él. |
| Palacio Gyeongbokgung | [Q482485](https://www.wikidata.org/wiki/Q482485) Gyeongbokgung | desde 1395 | Península de Corea | Lo construyó la dinastía Joseon en 1395, y su nombre significa palacio grandemente bendecido por el cielo. |
| Taipei 101 | [Q83101](https://www.wikidata.org/wiki/Q83101) Taipei 101 | 508 m de caída · desde 2005 · estilo arquitectura posmoderna |  | Una enorme esfera de acero de unas 660 toneladas cuelga en su interior para reducir el balanceo por vientos y sismos. |
| Templo del Cielo | [Q125445](https://www.wikidata.org/wiki/Q125445) Templo del Cielo | estilo Arquitectura china · UNESCO | Ciudad Prohibida | Allí los emperadores rezaban por buenas cosechas, y su Muro del Eco permite oír susurros de un extremo a otro. |
| Pagoda Shwedagon | [Q464535](https://www.wikidata.org/wiki/Q464535) Shwedagon | 112 m de caída | Indochina | Está recubierta de oro, y su remate tiene miles de diamantes y rubíes coronados por un diamante de 76 quilates. |
| Wat Arun | [Q724970](https://www.wikidata.org/wiki/Q724970) Wat Arun | desde 1656 | Indochina | Su torre central está decorada con trozos de porcelana china de colores, y aparece en la moneda de 10 bahts. |
| Templo Dorado de Amritsar | [Q180422](https://www.wikidata.org/wiki/Q180422) Templo Dorado | desde 1589 |  | Su cocina comunitaria sirve comida gratis a decenas de miles de visitantes cada día, sin importar su origen o religión. |
| Puerta de la India | [Q864862](https://www.wikidata.org/wiki/Q864862) Puerta de la India (Bombay) | 26 m de caída · desde 1924 · estilo Arquitectura indo-sarracena | Mar Arábigo, Ghats Occidentales | Se levantó para conmemorar la visita del rey Jorge V y la reina María en 1911, aunque se terminó en 1924. |
| Registán de Samarcanda | [Q1373583](https://www.wikidata.org/wiki/Q1373583) Registán | desde 1417 · UNESCO | Mausoleo Gur-e Amir, Desierto de Karakum | Su nombre significa lugar arenoso, y lo rodean tres madrasas cubiertas de azulejos; una muestra felinos persiguiendo ciervos. |
| Persépolis | [Q129072](https://www.wikidata.org/wiki/Q129072) Persépolis | desde década de -510 · cultura Gran Irán · estilo arquitectura aqueménida · UNESCO | Montes Zagros | Darío I la fundó hacia el 518 a. C., y sus relieves muestran a pueblos de todo el imperio llevando regalos al rey. |
| Cúpula de la Roca | [Q172077](https://www.wikidata.org/wiki/Q172077) Cúpula de la Roca | desde 691 · estilo Arte omeya · UNESCO | Muro de las Lamentaciones | Se terminó hacia el año 691 y es uno de los edificios islámicos más antiguos que se conservan; su cúpula es dorada. |
| Muro de las Lamentaciones | [Q134821](https://www.wikidata.org/wiki/Q134821) Muro de las Lamentaciones | 19 m de caída · desde 18 a. C. · cultura Cultura judía · estilo arquitectura de la Antigua Roma | Cúpula de la Roca | Los visitantes dejan papelitos con deseos y oraciones entre sus piedras, que se recogen dos veces al año. |
| Burj Al Arab | [Q62939](https://www.wikidata.org/wiki/Q62939) Burj Al Arab | 321 m de caída · desde 1999 · estilo arquitectura posmoderna | Burj Khalifa, Golfo Pérsico | Tiene forma de vela, se alza sobre una isla artificial y en 2005 Federer y Agassi jugaron tenis en su helipuerto. |
| Gran Mezquita Sheikh Zayed | [Q695604](https://www.wikidata.org/wiki/Q695604) Mezquita Sheikh Zayed | desde 2007 · estilo arquitectura morisca | Golfo Pérsico, Península arábiga | Su alfombra, anudada a mano por unos 1.200 artesanos iraníes, fue récord mundial; sus lámparas llevan millones de cristales. |
| Capadocia (Göreme) | [Q6710593](https://www.wikidata.org/wiki/Q6710593) Göreme |  | Anatolia | Sus chimeneas de hadas se formaron por la erosión de la ceniza volcánica, y al amanecer el cielo se llena de globos. |
| Éfeso | [Q47611](https://www.wikidata.org/wiki/Q47611) Éfeso | desde siglo 10 a. C. · cultura Antigua Grecia · UNESCO | Anatolia | Aquí estaba el templo de Artemisa, una de las siete maravillas antiguas, y aún puede verse la fachada de la Biblioteca de Celso. |
| Monasterios de Meteora | [Q3125051](https://www.wikidata.org/wiki/Q3125051) Meteora | UNESCO | Península balcánica (Balcanes) | Su nombre significa suspendidos en el aire, y durante siglos se subía a los monasterios en redes tiradas con cuerdas. |
| Pompeya | [Q43332](https://www.wikidata.org/wiki/Q43332) Pompeya | desde siglo 6 a. C. · cultura Antigua Roma | Península itálica, Mar Tirreno | La ceniza la conservó tan bien que aún se leen grafitis y anuncios electorales pintados en sus paredes hace 2.000 años. |
| Catedral de Milán | [Q18068](https://www.wikidata.org/wiki/Q18068) Catedral de Milán | 109 m de caída · desde 1386 · estilo gótico flamígero | Península itálica | Su construcción empezó en 1386 y tardó casi seis siglos; tiene miles de estatuas y la corona la dorada Madonnina. |
| Basílica de San Marcos | [Q172988](https://www.wikidata.org/wiki/Q172988) basílica de San Marcos | desde 828 · estilo arquitectura románica | Mar Adriático, Península itálica | La llaman la iglesia de oro por sus mosaicos dorados, y sus cuatro caballos de bronce llegaron de Constantinopla en 1204. |
| Fontana di Trevi | [Q185382](https://www.wikidata.org/wiki/Q185382) Fontana di Trevi | 26 m de caída · desde 1732 · estilo Arquitectura barroca italiana | Coliseo, Basílica de San Pedro | Según la tradición, quien lanza una moneda de espaldas volverá a la ciudad; lo recaudado se dona a obras benéficas. |
| Panteón de Roma | [Q99309](https://www.wikidata.org/wiki/Q99309) Panteón de Agripa | 43 m de caída · desde siglo 2 · cultura cultura de la Antigua Roma · estilo arquitectura de la Antigua Roma | Coliseo, Basílica de San Pedro | Tras casi 1.900 años, su cúpula sigue siendo la mayor del mundo de hormigón sin armar, con un óculo abierto al cielo. |
| Mezquita de Córdoba | [Q33200](https://www.wikidata.org/wiki/Q33200) Mezquita-catedral de Córdoba | 54 m de caída · desde 786 · estilo arquitectura islámica · UNESCO | Península ibérica | Su bosque de columnas con arcos rojos y blancos es único, y en el siglo XVI se construyó una catedral en su centro. |
| La Giralda | [Q834479](https://www.wikidata.org/wiki/Q834479) Giralda | 104 m de caída · desde 1198 · cultura Imperio almohade · estilo arquitectura gótica · UNESCO | Península ibérica | Se sube por 35 rampas en vez de escaleras, que según la tradición permitían llegar a caballo; su nombre viene de su veleta. |
| Acueducto de Segovia | [Q244947](https://www.wikidata.org/wiki/Q244947) Acueducto de Segovia | 28 m de caída · desde siglo 2 · UNESCO | Alcázar de Segovia, Península ibérica | Los romanos lo levantaron con bloques de granito sin argamasa, y aun así sigue en pie casi 2.000 años después. |
| Museo Guggenheim Bilbao | [Q179199](https://www.wikidata.org/wiki/Q179199) Museo Guggenheim Bilbao | desde 1997 | Península ibérica, Cordillera Cantábrica | Lo diseñó Frank Gehry, abrió en 1997 cubierto de titanio y en su entrada lo vigila Puppy, un perro gigante de flores. |
| Torre de Belém | [Q215003](https://www.wikidata.org/wiki/Q215003) Torre de Belém | 35 m de caída · desde 1515 · estilo Manuelino · UNESCO | Palacio da Pena, Península ibérica | Es una joya del estilo manuelino del siglo XVI, y en su fachada hay tallado un rinoceronte, animal exótico en esa época. |
| Palacio de Versalles | [Q2946](https://www.wikidata.org/wiki/Q2946) Palacio de Versalles | desde 1661 · estilo arquitectura barroca francesa · UNESCO | Torre Eiffel, Arco del Triunfo | Luis XIV trasladó allí la corte en 1682, y su Salón de los Espejos tiene 357 espejos frente a 17 ventanales. |
| Puente de Carlos | [Q204871](https://www.wikidata.org/wiki/Q204871) puente Carlos | 13 m de caída · desde 1357 · estilo arquitectura gótica · UNESCO | Castillo de Praga | Según la tradición, su primera piedra se puso el 9 de julio de 1357 a las 5:31, una cifra capicúa: 135797531. |
| Parlamento de Budapest | [Q11819](https://www.wikidata.org/wiki/Q11819) Parlamento de Budapest | 96 m de caída · desde 2000 · estilo arquitectura neogótica | Río Danubio | Su cúpula mide 96 metros, igual que la Basílica de San Esteban, en alusión al año 896, cuando llegaron los magiares. |
| Palacio de Schönbrunn | [Q131330](https://www.wikidata.org/wiki/Q131330) Palacio de Schönbrunn | desde 1638 · estilo barroco · UNESCO |  | Mozart tocó allí con seis años ante María Teresa, y en sus jardines está el zoológico más antiguo del mundo aún abierto. |
| Catedral de Colonia | [Q4176](https://www.wikidata.org/wiki/Q4176) Catedral de Colonia | 157 m de caída · desde 1248 · estilo arquitectura gótica · UNESCO | Río Rin | Se empezó en 1248 y se terminó en 1880; guarda un relicario dorado que, según la tradición, contiene restos de los Reyes Magos. |
| Atomium | [Q180901](https://www.wikidata.org/wiki/Q180901) Atomium | 102 m de caída · desde 1955 · estilo surrealismo | Llanura del Norte de Europa | Se construyó para la Expo 58 y representa la celda de un cristal de hierro ampliada 165.000 millones de veces. |
| La Sirenita | [Q214619](https://www.wikidata.org/wiki/Q214619) La Sirenita de Copenhague | 1 m de caída · desde 1913 | Puente de Öresund | La encargó en 1913 el cervecero Carl Jacobsen, de Carlsberg, inspirado en el cuento de Hans Christian Andersen. |
| Castillo de Bran | [Q390275](https://www.wikidata.org/wiki/Q390275) castillo de Bran | desde 1289 · estilo arquitectura neogótica | Cárpatos | Se le conoce como el castillo de Drácula, aunque Bram Stoker nunca estuvo allí y su vínculo con Vlad el Empalador es dudoso. |
| Museo del Hermitage | [Q132783](https://www.wikidata.org/wiki/Q132783) Museo del Hermitage | desde 1764 | Llanura del Norte de Europa | Lo fundó Catalina la Grande en 1764, y desde hace siglos tiene gatos residentes que protegen sus colecciones de los ratones. |
| Murallas de Dubrovnik | [Q931733](https://www.wikidata.org/wiki/Q931733) Murallas de Dubrovnik | UNESCO | Mar Adriático, Península balcánica (Balcanes) | Rodean la ciudad vieja a lo largo de casi 2 kilómetros y aparecieron como Desembarco del Rey en Juego de tronos. |
| Puente de la Bahía de Sídney | [Q54495](https://www.wikidata.org/wiki/Q54495) puente de la bahía de Sídney | 134 m de caída · desde 1932 | Ópera de Sídney, Mar de Tasmania | Lo apodan la percha por su forma; abrió en 1932 y hoy se puede escalar su arco acompañado de guías. |
| Sky Tower | [Q722125](https://www.wikidata.org/wiki/Q722125) Sky Tower | 328 m de caída · desde 1997 |  | Abrió en 1997 y desde ella se puede hacer el SkyJump, un salto sujeto a un cable de unos 192 metros hasta la calle. |
| Palenque | [Q1859841](https://www.wikidata.org/wiki/Q1859841) Municipio de Palenque | desde 1915 |  | En 1952, el arqueólogo Alberto Ruz descubrió dentro del Templo de las Inscripciones la tumba del rey Pakal. |
| Tulum | [Q1709171](https://www.wikidata.org/wiki/Q1709171) Municipio de Tulum | desde 2008 | Península de Yucatán | Su nombre significa muralla, por el muro que la protege; antiguamente se llamaba Zamá, que quiere decir amanecer. |
| Monte Albán | [Q464899](https://www.wikidata.org/wiki/Q464899) Monte Albán | cultura Cultura zapoteca · UNESCO |  | Los zapotecas aplanaron la cima de un cerro para construirla hacia el 500 a. C., y sus relieves de los Danzantes son célebres. |
| Catedral Metropolitana de México | [Q610961](https://www.wikidata.org/wiki/Q610961) Catedral Metropolitana de la Ciudad de México | 67 m de caída · desde 1570 · estilo arquitectura barroca | Ángel de la Independencia, Castillo de Chapultepec | Tardó unos 240 años en construirse, de 1573 a 1813, y por eso mezcla estilos renacentista, barroco y neoclásico. |
| Castillo de Chapultepec | [Q1072510](https://www.wikidata.org/wiki/Q1072510) Castillo de Chapultepec | desde 1944 · estilo arquitectura neoclásica | Ángel de la Independencia, Catedral Metropolitana de México | Fue residencia del emperador Maximiliano y la emperatriz Carlota, y hoy alberga el Museo Nacional de Historia. |
| Copán | [Q214827](https://www.wikidata.org/wiki/Q214827) Copán | cultura cultura maya · UNESCO |  | Su Escalinata de los Jeroglíficos tiene unos 2.200 glifos y es el texto maya más largo que se conoce. |
| Castillo San Felipe del Morro | [Q550502](https://www.wikidata.org/wiki/Q550502) Fortaleza colosal de San Felipe del Morro | desde 1539 · UNESCO | Castillo San Cristóbal, Antillas Mayores | Los españoles empezaron a construirlo en 1539, y sus garitas, pequeñas torres de vigía, se volvieron símbolo de la isla. |
| Sacsayhuamán | [Q828336](https://www.wikidata.org/wiki/Q828336) Saqsaywaman | cultura civilización incaica | Cordillera de los Andes, Amazonia | Sus enormes piedras encajan sin mortero, y cada 24 de junio es escenario de la representación del Inti Raymi, la fiesta del Sol. |
| Tiwanaku | [Q61750](https://www.wikidata.org/wiki/Q61750) Tiwanaku | UNESCO | Cordillera de los Andes, Altiplano andino | Su Puerta del Sol está tallada en un solo bloque de piedra y muestra una figura con báculos, quizá un dios creador. |
| Mitad del Mundo | [Q1806478](https://www.wikidata.org/wiki/Q1806478) Ciudad Mitad del Mundo | desde 1982 | Cordillera de los Andes, Cordillera Occidental | El monumento honra a la Misión Geodésica francesa del siglo XVIII, aunque con GPS se sabe que el ecuador real pasa a unos 240 metros. |
| Parque Arqueológico de San Agustín | [Q2887224](https://www.wikidata.org/wiki/Q2887224) Parque Arqueológico de San Agustín | UNESCO | Cordillera de los Andes, Cordillera Oriental | La UNESCO lo describe como el mayor conjunto de esculturas megalíticas de Sudamérica; muchas custodian antiguas tumbas. |
| Ciudad Perdida | [Q1094367](https://www.wikidata.org/wiki/Q1094367) Ciudad Perdida |  | Cordillera Oriental | Los taironas la fundaron hacia el año 800, siglos antes que Machu Picchu, y para llegar hay que caminar varios días por la selva. |
| Catedral de Brasilia | [Q201720](https://www.wikidata.org/wiki/Q201720) Catedral de Brasilia | desde 1970 · estilo arquitectura moderna | Congreso Nacional de Brasil, Amazonia | La diseñó Oscar Niemeyer con 16 columnas curvas de concreto que parecen manos alzadas al cielo; se inauguró en 1970. |
| Palacio de La Moneda | [Q1146881](https://www.wikidata.org/wiki/Q1146881) Palacio de La Moneda | desde 1784 · estilo arquitectura neoclásica | Cordillera de los Andes | Se construyó como casa de acuñación de monedas en la época colonial, de ahí su nombre; lo diseñó el italiano Joaquín Toesca. |
| Alcatraz | [Q131354](https://www.wikidata.org/wiki/Q131354) Isla de Alcatraz |  | Puente Golden Gate | Su nombre viene del español isla de los alcatraces, por sus aves marinas, y fue prisión federal de 1934 a 1963. |
| Capitolio de Estados Unidos | [Q54109](https://www.wikidata.org/wiki/Q54109) Capitolio de los Estados Unidos | 88 m de caída · desde 1793 · estilo arquitectura neoclásica | Casa Blanca, Monumento a Lincoln | George Washington colocó su primera piedra en 1793, y su enorme cúpula actual es de hierro fundido, no de piedra. |
| Monumento a Lincoln | [Q213559](https://www.wikidata.org/wiki/Q213559) Monumento a Lincoln | desde 1922 · estilo neogriego | Casa Blanca, Capitolio de Estados Unidos | Sus 36 columnas representan los estados que había al morir Lincoln; en sus escalinatas Martin Luther King dio su discurso Tengo un sueño. |
| Space Needle | [Q5317](https://www.wikidata.org/wiki/Q5317) Space Needle | 184 m de caída · desde 1961 · estilo Googie |  | Se construyó para la Exposición Universal de 1962 y tiene un piso de vidrio giratorio desde el que se mira hacia abajo. |
| Gateway Arch | [Q2027162](https://www.wikidata.org/wiki/Q2027162) Arco Gateway | 192 m de caída · desde 1965 · estilo Arquitectura high-tech | Montículos de Cahokia, Río Misisipi | Es el arco más alto del mundo, tan ancho como alto, y simboliza la puerta de la expansión hacia el Oeste. |
| Presa Hoover | [Q172822](https://www.wikidata.org/wiki/Q172822) Presa Hoover | 376 m de caída · desde 1931 · estilo arquitectura art déco | Gran Cuenca (EE. UU.) | Se construyó en plena Gran Depresión, entre 1931 y 1936, y su embalse formó el lago Mead. |
| Château Frontenac | [Q745964](https://www.wikidata.org/wiki/Q745964) Château Frontenac | desde 1893 · estilo Estilo château · UNESCO | Escudo Canadiense | Es un hotel inaugurado en 1893 por el ferrocarril Canadian Pacific; lleva el nombre del conde de Frontenac, gobernador de la Nueva Francia. |
| Iglesias de Lalibela | [Q207590](https://www.wikidata.org/wiki/Q207590) Lalibela |  | Macizo Etíope | Sus 11 iglesias se tallaron hacia abajo en la roca viva, cada una de un solo bloque, por orden del rey Lalibela. |
| Gran Zimbabue | [Q209217](https://www.wikidata.org/wiki/Q209217) Gran Zimbabue | UNESCO |  | Sus muros se levantaron sin argamasa, y el país tomó su nombre de estas ruinas: Zimbabue significa casas de piedra. |
| Gran Mezquita de Djenné | [Q683632](https://www.wikidata.org/wiki/Q683632) Mezquita Grande de Djenné | 16 m de caída · desde 1906 · estilo Arquitectura sudanesa · UNESCO |  | Es el mayor edificio de adobe del mundo, y cada año los vecinos lo recubren con barro fresco en una gran fiesta comunitaria. |
| Isla Robben | [Q192493](https://www.wikidata.org/wiki/Q192493) Isla Robben | UNESCO |  | Su nombre significa isla de las focas en neerlandés, y allí Nelson Mandela pasó 18 de sus 27 años en prisión. |
| Ruinas de Cartago | [Q6343](https://www.wikidata.org/wiki/Q6343) Cartago | desde siglo 9 a. C. | Mar Mediterráneo, Cordillera del Atlas | Según la leyenda la fundó la reina fenicia Dido, y fue la ciudad natal de Aníbal, que cruzó los Alpes con elefantes. |
| Templos de Bagan | [Q29317](https://www.wikidata.org/wiki/Q29317) Bagan | desde siglo 2 · UNESCO | Indochina | Entre los siglos XI y XIII se levantaron allí más de 10.000 templos budistas, y hoy sobreviven más de 2.000. |
| Gran Buda de Leshan | [Q205131](https://www.wikidata.org/wiki/Q205131) Gran Buda de Leshan | 71 m de caída · desde 803 · UNESCO |  | Se talló en un acantilado durante unos 90 años, desde el 713, con la esperanza de calmar las peligrosas aguas para los barqueros. |
| Göbekli Tepe | [Q214944](https://www.wikidata.org/wiki/Q214944) Göbekli Tepe | desde -9999 · UNESCO | Anatolia | Tiene unos 11.000 años, unos 6.000 más que Stonehenge, y lo levantaron cazadores-recolectores antes de la agricultura. |
| Masada | [Q186312](https://www.wikidata.org/wiki/Q186312) Masada | cultura judaísmo · UNESCO | Mar Muerto, Río Jordán | Herodes el Grande construyó sobre esta meseta rocosa un palacio fortificado, y hoy se sube a pie o en teleférico. |
| Palmira | [Q5747](https://www.wikidata.org/wiki/Q5747) Palmira | cultura Antigua Grecia · UNESCO |  | Fue un oasis de caravanas de la Ruta de la Seda, y en el siglo III la reina Zenobia la gobernó desafiando a Roma. |
| Baalbek | [Q178835](https://www.wikidata.org/wiki/Q178835) Baalbek | UNESCO |  | Los romanos la llamaron Heliópolis, y en su templo de Júpiter hay bloques de piedra de unas 800 toneladas cada uno. |
| Ciudadela de Erbil | [Q206236](https://www.wikidata.org/wiki/Q206236) Ciudadela de Erbil | UNESCO |  | Es una colina formada por milenios de casas superpuestas y se considera uno de los lugares habitados sin pausa más antiguos. |
| Mohenjo-Daro | [Q5725](https://www.wikidata.org/wiki/Q5725) Mohenjo-Daro | UNESCO | Río Indo | Hace unos 4.500 años ya tenía calles en cuadrícula, desagües cubiertos y el Gran Baño, un estanque público de ladrillo. |
| Sigiriya | [Q272153](https://www.wikidata.org/wiki/Q272153) Sigiriya | 180 m de caída · UNESCO |  | El rey Kashyapa hizo su palacio en la cima de esta roca en el siglo V; aún se ven las garras gigantes del león de la entrada. |
| Ta Prohm | [Q592846](https://www.wikidata.org/wiki/Q592846) Ta Prohm | cultura Imperio jemer · UNESCO | Angkor Wat, Indochina | Lo dejaron con los árboles gigantes creciendo sobre sus muros, y fue escenario de la película Lara Croft: Tomb Raider. |
| Prambanan | [Q4089482](https://www.wikidata.org/wiki/Q4089482) Prambanan |  | Java | Este conjunto hindú del siglo IX está dedicado a Brahma, Visnú y Shiva, y al aire libre se presenta el ballet del Ramayana. |
| Templo del Sol de Konark | [Q752091](https://www.wikidata.org/wiki/Q752091) Templo de Suria | desde siglo 13 · estilo Kalinga architecture · UNESCO | Golfo de Bengala | Tiene forma de carro gigante del dios Sol, con 24 ruedas de piedra talladas que funcionan como relojes de sol. |
| Hampi | [Q26732](https://www.wikidata.org/wiki/Q26732) Hampi | UNESCO | Meseta del Decán | Fue la capital del Imperio Vijayanagara, y en el templo de Vittala hay columnas de piedra que suenan como instrumentos al golpearlas. |
| Qutab Minar | [Q187635](https://www.wikidata.org/wiki/Q187635) Qutab Minar | 73 m de caída · estilo arquitectura islámica · UNESCO | Templo del Loto, Llanura del Ganges | Es el minarete de ladrillo más alto del mundo, y a su lado hay un pilar de hierro de unos 1.600 años que casi no se oxida. |
| Templo del Loto | [Q940843](https://www.wikidata.org/wiki/Q940843) Templo del Loto | desde 1986 · estilo arquitectura expresionista | Qutab Minar, Llanura del Ganges | Tiene forma de flor de loto con 27 pétalos de mármol blanco y está abierto a personas de cualquier creencia. |
| Cuevas de Ajanta | [Q184427](https://www.wikidata.org/wiki/Q184427) Cuevas de Ajantā | desde siglo 2 a. C. · UNESCO |  | Un oficial británico las redescubrió en 1819 mientras cazaba un tigre; guardan pinturas budistas de más de 1.500 años. |
| Gran Buda de Kamakura | [Q672056](https://www.wikidata.org/wiki/Q672056) Kōtoku-in | desde 1252 | Honshu | Esta estatua de bronce del siglo XIII lleva siglos al aire libre, y por una pequeña tarifa se puede entrar en su interior hueco. |
| Castillo de Osaka | [Q321242](https://www.wikidata.org/wiki/Q321242) Castillo Osaka | desde 1583 | Honshu | Lo mandó construir Toyotomi Hideyoshi en 1583; su torre actual es una reconstrucción de concreto de 1931 con ascensor y museo. |
| Templo Haeinsa | [Q489795](https://www.wikidata.org/wiki/Q489795) Templo de Haeinsa | desde 802 · UNESCO | Península de Corea | Guarda el Tripitaka Coreano, más de 80.000 tablillas de madera talladas en el siglo XIII con textos budistas. |
| Mezquita Id Kah | [Q1325825](https://www.wikidata.org/wiki/Q1325825) Id Kah Mosque | desde 1442 · estilo arquitectura islámica |  | Se fundó en 1442, y en las grandes festividades su amplio patio y las calles vecinas se llenan con miles de fieles. |
| Mausoleo Gur-e Amir | [Q1256223](https://www.wikidata.org/wiki/Q1256223) Gur-e Amir | 30 m de caída · desde 1403 · estilo arquitectura islámica · UNESCO | Registán de Samarcanda, Desierto de Karakum | Es la tumba de Tamerlán, y su cúpula acanalada de azulejos turquesa inspiró mausoleos mogoles como el Taj Mahal. |
| Mezquita del Sah (Isfahán) | [Q643098](https://www.wikidata.org/wiki/Q643098) Mezquita del Imam Jomeini | 54 m de caída · desde 1611 · estilo arquitectura safávida |  | La mandó construir el sah Abbas I a comienzos del siglo XVII, y es famosa por sus mosaicos de azulejos de siete colores. |
| Ciudadela de Alepo | [Q206231](https://www.wikidata.org/wiki/Q206231) Ciudadela de Alepo | 50 m de caída · desde siglo 12 · estilo arquitectura ayubí · UNESCO |  | Su colina está ocupada desde hace milenios, y al castillo, rodeado por un ancho foso, se entra por un gran puente de piedra. |
| Iglesias de madera de Kizhi | [Q477462](https://www.wikidata.org/wiki/Q477462) Kizhi Pogost | desde 1714 · UNESCO | Lago Onega | Su iglesia de la Transfiguración, de 1714, tiene 22 cúpulas de madera y, según la tradición, se levantó sin usar clavos. |
| Castillo de Malbork | [Q71279](https://www.wikidata.org/wiki/Q71279) Castillo de Malbork | desde 1270 · estilo arquitectura gótica · UNESCO | Llanura del Norte de Europa | Lo levantaron los caballeros teutónicos, casi todo en ladrillo, y es el castillo más grande del mundo por superficie. |
| Mezquita de Selimiye | [Q184534](https://www.wikidata.org/wiki/Q184534) Mezquita de Selim | 71 m de caída · desde 1575 · estilo arquitectura otomana · UNESCO | Península balcánica (Balcanes) | El gran arquitecto otomano Sinan la consideró su obra maestra, y su cúpula rodeada de cuatro minaretes domina el horizonte. |
| Pont du Gard | [Q189764](https://www.wikidata.org/wiki/Q189764) puente del Gard | 49 m de caída · desde siglo 1 · UNESCO |  | Es un puente acueducto romano del siglo I con tres niveles de arcos, y sus piedras se encajaron sin argamasa. |
| Ciudadela de Carcasona | [Q389269](https://www.wikidata.org/wiki/Q389269) Ciudadela de Carcasona | UNESCO |  | El arquitecto Viollet-le-Duc la restauró en el siglo XIX, y un famoso juego de mesa lleva su nombre. |
| Alcázar de Segovia | [Q557337](https://www.wikidata.org/wiki/Q557337) Real Alcázar de Segovia | desde siglo 12 · estilo arquitectura románica · UNESCO | Acueducto de Segovia, Península ibérica | De este castillo salió Isabel la Católica para ser proclamada reina en 1474; su silueta recuerda la proa de un barco. |
| Torre de Hércules | [Q245151](https://www.wikidata.org/wiki/Q245151) Torre de Hércules | 49 m de caída · desde siglo 1 · estilo arquitectura de la Antigua Roma · UNESCO |  | Es el faro romano más antiguo del mundo que sigue en funcionamiento, construido en el siglo I o II. |
| Palacio da Pena | [Q69513](https://www.wikidata.org/wiki/Q69513) Palacio da Pena | desde 1838 · estilo arquitectura neoárabe · UNESCO | Torre de Belém, Península ibérica | El rey Fernando II lo construyó en el siglo XIX sobre un antiguo monasterio, pintado de rojo y amarillo al estilo romántico. |
| Castillo de Praga | [Q193369](https://www.wikidata.org/wiki/Q193369) Castillo de Praga | desde siglo 9 · estilo arquitectura románica | Puente de Carlos | Según el Libro Guinness es el mayor complejo de castillo antiguo del mundo, y dentro está la catedral de San Vito. |
| Campanario de Brujas | [Q2441211](https://www.wikidata.org/wiki/Q2441211) campanario de Brujas | estilo Gótico brabantino · UNESCO | Llanura del Norte de Europa | Para llegar a su cima hay que subir 366 escalones, y su carillón de 47 campanas aún suena sobre la plaza. |
| Puente de Öresund | [Q297871](https://www.wikidata.org/wiki/Q297871) puente de Oresund | 204 m de caída · desde 1999 | La Sirenita | Abierto en 2000, a mitad de camino se convierte en túnel gracias a una isla artificial, e inspiró la serie policial El puente. |
| Hallgrímskirkja | [Q271466](https://www.wikidata.org/wiki/Q271466) Hallgrímskirkja | 74 m de caída · desde 1986 · estilo arquitectura neogótica |  | Su diseño imita las columnas de basalto de la lava y tardó 41 años en construirse; lleva el nombre de un poeta del siglo XVII. |
| Skara Brae | [Q816437](https://www.wikidata.org/wiki/Q816437) Skara Brae | desde 3179 a. C. · UNESCO | Islas Británicas | Esta aldea de piedra de hace 5.000 años quedó al descubierto tras una tormenta en 1850 y aún conserva camas y repisas de piedra. |
| Castillo de Eilean Donan | [Q79182](https://www.wikidata.org/wiki/Q79182) Eilean Donan |  | Islas Británicas, Gran Bretaña | Quedó en ruinas en 1719 y se reconstruyó en el siglo XX; ha salido en películas como Highlander y una de James Bond. |
| Calzada del Gigante | [Q106187](https://www.wikidata.org/wiki/Q106187) Calzada del Gigante | UNESCO | Islas Británicas | Sus unas 40.000 columnas de basalto nacieron de una erupción, pero la leyenda dice que el gigante Finn McCool las puso allí. |
| Newgrange | [Q339503](https://www.wikidata.org/wiki/Q339503) Newgrange | UNESCO | Islas Británicas | Es más antiguo que las pirámides de Giza, y en el solsticio de invierno un rayo de sol entra por su pasillo hasta la cámara. |
| Mezquita Hassan II | [Q41346](https://www.wikidata.org/wiki/Q41346) Mezquita Hassan II | desde 1993 · estilo arquitectura morisca |  | Está construida en parte sobre el mar, tiene un techo que se abre y su minarete está entre los más altos del mundo. |
| Ait Ben Haddou | [Q309436](https://www.wikidata.org/wiki/Q309436) Ksar de Ait Ben Hadu | UNESCO | Cordillera del Atlas | Este pueblo fortificado de adobe fue parada de caravanas y escenario de películas como Gladiator y de la serie Juego de tronos. |
| Mezquita de Sankoré (Tombuctú) | [Q1265294](https://www.wikidata.org/wiki/Q1265294) Medersa Sankore | 15 m de caída · desde 988 · estilo Arquitectura sudanesa · UNESCO | Desierto del Sahara, Sahel | Fue un gran centro de estudio islámico medieval, y la ciudad guarda miles de manuscritos antiguos de astronomía, medicina y leyes. |
| Isla de Gorea | [Q244347](https://www.wikidata.org/wiki/Q244347) Isla de Gorea | UNESCO |  | Es una isla sin autos, de casas coloniales de colores, y su Casa de los Esclavos es hoy un museo de memoria histórica. |
| Ruinas de Kilwa Kisiwani | [Q1741475](https://www.wikidata.org/wiki/Q1741475) Kilwa Kisiwani | desde década de 900 · estilo arquitectura suajili · UNESCO |  | Fue un rico puerto comercial swahili que acuñaba sus propias monedas, y el viajero Ibn Battuta lo elogió en 1331. |
| Obeliscos de Axum | [Q2308606](https://www.wikidata.org/wiki/Q2308606) obelisco de Aksum | 23 m de caída · desde 300 | Macizo Etíope | Cada estela se talló en un solo bloque de granito, y una que fue llevada a Roma en 1937 volvió a su lugar en 2005. |
| Ciudad de Piedra de Zanzíbar | [Q844417](https://www.wikidata.org/wiki/Q844417) Stone Town | estilo arquitectura islámica · UNESCO |  | Es famosa por sus puertas de madera talladas con adornos de bronce, y allí nació Freddie Mercury, cantante de Queen. |
| Union Buildings | [Q2264091](https://www.wikidata.org/wiki/Q2264091) Union Buildings | desde 1913 · estilo neoclasicismo |  | Los diseñó el arquitecto Herbert Baker y se terminaron en 1913; frente a ellos hay una estatua de Nelson Mandela de 9 metros. |
| Montículos de Cahokia | [Q333661](https://www.wikidata.org/wiki/Q333661) Cahokia | desde 1050 · cultura Cultura misisipiana · UNESCO | Gateway Arch | Su Monks Mound es el mayor montículo de tierra precolombino de América, levantado a mano con canastos hace casi mil años. |
| Mesa Verde | [Q237128](https://www.wikidata.org/wiki/Q237128) Parque nacional Mesa Verde | desde 1906 · UNESCO | Meseta del Colorado | Los antiguos indígenas pueblo construyeron aldeas bajo los acantilados, como el Cliff Palace, con unas 150 habitaciones. |
| El Álamo | [Q2636724](https://www.wikidata.org/wiki/Q2636724) Misión de El Álamo | desde 1718 · UNESCO | Grandes Llanuras | Nació en 1718 como la misión española de San Antonio de Valero, y en 1836 fue escenario de una batalla célebre. |
| Independence Hall | [Q390028](https://www.wikidata.org/wiki/Q390028) Independence Hall | desde 1753 · estilo arquitectura georgiana · UNESCO |  | Allí se aprobaron la Declaración de Independencia en 1776 y la Constitución de Estados Unidos en 1787. |
| Parlamento de Canadá | [Q1589289](https://www.wikidata.org/wiki/Q1589289) Parliament Hill |  | Escudo Canadiense | Su Torre de la Paz tiene un carillón de 53 campanas, y frente al edificio arde la Llama del Centenario, encendida en 1967. |
| Habitat 67 | [Q1032248](https://www.wikidata.org/wiki/Q1032248) Habitat 67 | desde 1967 · estilo brutalismo |  | Moshe Safdie lo diseñó para la Expo 67 a partir de su tesis universitaria: son 354 módulos de concreto apilados. |
| Joya de Cerén | [Q27985](https://www.wikidata.org/wiki/Q27985) Joya de Cerén | cultura cultura maya · UNESCO |  | Una erupción volcánica la cubrió de ceniza hacia el año 600 y la conservó tan bien que la llaman la Pompeya de América. |
| Teatro Nacional de Costa Rica | [Q1138822](https://www.wikidata.org/wiki/Q1138822) Teatro Nacional de Costa Rica | desde 1897 · estilo neoclasicismo |  | Se financió con un impuesto a la exportación de café y se inauguró en 1897 con la ópera Fausto de Gounod. |
| Castillo San Cristóbal | [Q3748608](https://www.wikidata.org/wiki/Q3748608) Castillo San Cristóbal | UNESCO | Castillo San Felipe del Morro, Antillas Mayores | Es la mayor fortificación construida por España en América y se terminó en 1783 para proteger la ciudad de ataques por tierra. |
| Ciudadela Laferrière | [Q206194](https://www.wikidata.org/wiki/Q206194) Citadelle Laferrière | desde 1820 · UNESCO | La Española, Antillas Mayores | La mandó levantar Henri Christophe tras la independencia, en lo alto de una montaña, y aún guarda decenas de cañones. |
| Alcázar de Colón | [Q668772](https://www.wikidata.org/wiki/Q668772) Alcázar de Colón | desde 1511 · UNESCO | Mar Caribe, La Española | Fue la residencia de Diego Colón, hijo de Cristóbal Colón, y se construyó hacia 1510 con piedra coralina. |
| Chan Chan | [Q277540](https://www.wikidata.org/wiki/Q277540) Chan Chan | desde 850 · cultura Cultura chimú · UNESCO | Cordillera de los Andes | Fue la capital del reino chimú y la mayor ciudad de barro de la América precolombina, con muros decorados con peces y aves. |
| Kuélap | [Q1361820](https://www.wikidata.org/wiki/Q1361820) Kuélap | cultura Cultura chachapoyas | Cordillera de los Andes, Amazonia | La construyeron los chachapoyas con murallas de hasta 20 metros, y desde 2017 se llega en teleférico. |
| Caral | [Q219279](https://www.wikidata.org/wiki/Q219279)  | UNESCO | Cordillera de los Andes | Con unos 5.000 años, se considera la ciudad más antigua de América, contemporánea de las pirámides de Egipto. |
| Ingapirca | [Q1478056](https://www.wikidata.org/wiki/Q1478056) Ingapirca | cultura Imperio incaico | Cordillera de los Andes, Cordillera Central | Fue un sitio sagrado de los cañaris y luego de los incas, que construyeron allí un templo del Sol de forma ovalada. |
| Tierradentro | [Q179506](https://www.wikidata.org/wiki/Q179506) Parque Arqueológico Nacional de Tierradentro | UNESCO | Cordillera de los Andes, Cordillera Central | Tiene tumbas subterráneas talladas en la roca, con escaleras en espiral y paredes pintadas con figuras rojas y negras. |
| Puente de Boyacá | [Q3396894](https://www.wikidata.org/wiki/Q3396894) puente de Boyacá |  | Cordillera de los Andes, Cordillera Oriental | Junto a este pequeño puente se libró la batalla del 7 de agosto de 1819, que selló la independencia de Colombia. |
| Fuerte de Samaipata | [Q876451](https://www.wikidata.org/wiki/Q876451) El Fuerte de Samaipata | cultura Imperio incaico · UNESCO | Cordillera de los Andes, Amazonia | Es una gran roca tallada con canales, felinos y serpientes por culturas preincaicas y luego por los incas. |
| Misiones jesuíticas de San Ignacio Miní | [Q868799](https://www.wikidata.org/wiki/Q868799) Ruinas Jesuíticas de San Ignacio Mini | cultura guaraníes · UNESCO | Río Paraná, Altiplano Brasileño | Fue un pueblo jesuita para los guaraníes, y sus ruinas de arenisca roja muestran el estilo conocido como barroco guaraní. |
| Palacio Salvo | [Q1519373](https://www.wikidata.org/wiki/Q1519373) Palacio Salvo | desde 1922 · estilo ecléctico | Río de la Plata | Lo diseñó Mario Palanti, autor del Palacio Barolo de Buenos Aires, y en su terreno se estrenó en 1917 el tango La Cumparsita. |
| Congreso Nacional de Brasil | [Q949699](https://www.wikidata.org/wiki/Q949699) Congreso Nacional de Brasil | desde 1826 | Catedral de Brasilia, Amazonia | Lo diseñó Oscar Niemeyer: la cúpula hacia abajo es el Senado y el cuenco hacia arriba, la Cámara de Diputados. |
| Pelourinho | [Q1928594](https://www.wikidata.org/wiki/Q1928594) Pelourinho | desde 1549 · UNESCO | Altiplano Brasileño | Su nombre significa picota, y en sus calles de casas coloridas Michael Jackson grabó un video con el grupo de tambores Olodum. |
| Ouro Preto | [Q188905](https://www.wikidata.org/wiki/Q188905) Ouro Preto | desde 1711 | Altiplano Brasileño | Su nombre significa oro negro, por el oro cubierto de óxido de hierro que hallaron allí, y guarda obras del escultor Aleijadinho. |
| Faro del Fin del Mundo | [Q3378140](https://www.wikidata.org/wiki/Q3378140) Faro Les Éclaireurs | 11 m de caída · desde 1920 | Patagonia, Tierra del Fuego | Suele confundirse con el faro de la novela de Julio Verne, que en realidad se inspiró en otro faro de la Isla de los Estados. |
| La Mano de Punta del Este | [Q6906958](https://www.wikidata.org/wiki/Q6906958) La Mano | desde 1981 | Río de la Plata | La creó en 1982 el escultor chileno Mario Irarrázabal, que años después hizo una mano parecida en el desierto de Atacama. |
| Nan Madol | [Q846967](https://www.wikidata.org/wiki/Q846967) Nan Madol | UNESCO |  | Se levantó sobre casi un centenar de islotes artificiales de columnas de basalto, y la apodan la Venecia del Pacífico. |
| Parlamento de Australia | [Q1858105](https://www.wikidata.org/wiki/Q1858105) Parliament House | desde 1988 · estilo arquitectura moderna | Gran Cordillera Divisoria | Se inauguró en 1988 y está construido dentro de una colina: su techo cubierto de césped se puede recorrer a pie. |
| Beehive (Parlamento de Nueva Zelanda) | [Q1794839](https://www.wikidata.org/wiki/Q1794839) Beehive | desde 1981 · estilo arquitectura moderna |  | Su apodo de colmena viene de su forma, inspirada en las colmenas de paja tradicionales; lo diseñó el escocés Basil Spence. |
| Plaza de Bolívar de Bogotá | [Q3090480](https://www.wikidata.org/wiki/Q3090480) Plaza de Bolívar |  | Museo del Oro, Catedral Primada de Colombia | Su estatua de Bolívar, del italiano Pietro Tenerani, se instaló en 1846 y fue el primer monumento público del país. |
| Museo del Oro | [Q1109031](https://www.wikidata.org/wiki/Q1109031) Museo del Oro | desde 1968 | Plaza de Bolívar de Bogotá, Catedral Primada de Colombia | Guarda la balsa muisca, una pieza de oro que representa la ceremonia que dio origen a la leyenda de El Dorado. |
| Torre del Reloj de Cartagena | [Q30594363](https://www.wikidata.org/wiki/Q30594363) Puerta del Reloj |  | Iglesia de San Pedro Claver, Castillo de San Felipe de Barajas | Era la puerta principal de la muralla, llamada Boca del Puente, y el reloj que le da nombre se añadió en el siglo XIX. |
| Cristo Rey de Cali | [Q805445](https://www.wikidata.org/wiki/Q805445) Monumento a Cristo Rey | 26 m de caída · desde 1958 | El Gato del Río, Cordillera de los Andes | La diseñó el escultor italiano Alideo Tazzioli y se terminó en 1953, hecha de concreto y hierro sobre un cerro. |
| Plaza Botero | [Q15613819](https://www.wikidata.org/wiki/Q15613819) Plaza Botero |  | Pueblito Paisa (Cerro Nutibara), Estadio Atanasio Girardot | Exhibe 23 esculturas de bronce de figuras voluminosas que Fernando Botero donó a su ciudad natal. |
| Torre Colpatria | [Q3120855](https://www.wikidata.org/wiki/Q3120855) Torre Colpatria | 196 m de caída · desde 1978 · estilo arquitectura posmoderna | Museo del Oro, Plaza de Bolívar de Bogotá | Su fachada se ilumina de colores cada noche, y cada año se hace una carrera para subir sus escaleras a pie. |
| Pueblito Paisa (Cerro Nutibara) | [Q18693006](https://www.wikidata.org/wiki/Q18693006) Cerro Nutibara |  | Plaza Botero, Estadio Atanasio Girardot | Es una réplica de un pueblo paisa tradicional, con iglesia, plaza, alcaldía, escuela y una barbería de antaño. |
| Puente de Occidente | [Q629828](https://www.wikidata.org/wiki/Q629828) puente de Occidente |  | Cordillera de los Andes, Cordillera Occidental | Lo diseñó el ingeniero José María Villa y al terminarse en 1895 era uno de los puentes colgantes más largos de América. |
| Basílica del Señor de los Milagros de Buga | [Q6394268](https://www.wikidata.org/wiki/Q6394268) basílica Menor del Señor de los Milagros de Buga |  | Cordillera de los Andes, Cordillera Occidental | Guarda el Cristo moreno del Señor de los Milagros; la leyenda cuenta que una lavandera halló la pequeña imagen en el río. |
| Catedral Basílica de Manizales | [Q2942271](https://www.wikidata.org/wiki/Q2942271) Catedral Basílica Nuestra Señora del Rosario de Manizales | desde 1939 · estilo arquitectura neogótica | Cordillera de los Andes, Cordillera Central | Es una de las iglesias más altas del país, y se puede subir por su torre central hasta el mirador llamado Corredor Polaco. |
| Parque del Café | [Q4121127](https://www.wikidata.org/wiki/Q4121127) Parque Nacional del Café | desde 1995 | Cordillera de los Andes, Cordillera Central | Lo creó la Federación Nacional de Cafeteros en 1995 y combina atracciones mecánicas con un museo sobre el cultivo del café. |
| Estadio El Campín | [Q179027](https://www.wikidata.org/wiki/Q179027) Estadio Nemesio Camacho El Campín |  | Museo del Oro, Plaza de Bolívar de Bogotá | Su nombre oficial es Nemesio Camacho, se inauguró en 1938 y es la casa de los equipos Millonarios y Santa Fe. |
| Estadio Atanasio Girardot | [Q6156079](https://www.wikidata.org/wiki/Q6156079) Estadio Atanasio Girardot |  | Plaza Botero, Pueblito Paisa (Cerro Nutibara) | Lleva el nombre de un prócer de la independencia y es la casa de dos rivales: Atlético Nacional e Independiente Medellín. |
| Ventana al Mundo | [Q56318586](https://www.wikidata.org/wiki/Q56318586) Ventana al mundo |  | Puente Pumarejo, Estadio Metropolitano Roberto Meléndez | Esta escultura de colores se inauguró en 2018 como símbolo de la ciudad como puerta de entrada del país al mundo. |
| Catedral Primada de Colombia | [Q2942872](https://www.wikidata.org/wiki/Q2942872) Catedral Primada de Colombia | 52 m de caída · desde 1807 · estilo arquitectura neoclásica | Plaza de Bolívar de Bogotá, Museo del Oro | Ocupa el lugar de la primera capilla de la ciudad, de 1538, y en ella reposan los restos del fundador Gonzalo Jiménez de Quesada. |
| Iglesia de San Pedro Claver | [Q9007271](https://www.wikidata.org/wiki/Q9007271) iglesia de San Pedro Claver | estilo arquitectura barroca | Torre del Reloj de Cartagena, Castillo de San Felipe de Barajas | Guarda los restos de Pedro Claver, el jesuita que se llamó esclavo de los esclavos por su labor con los africanos esclavizados. |
| Quinta de San Pedro Alejandrino | [Q3414570](https://www.wikidata.org/wiki/Q3414570) Quinta de San Pedro Alejandrino |  | Cordillera Oriental, Mar Caribe | En esta antigua hacienda azucarera pasó Simón Bolívar sus últimos días en 1830; hoy tiene jardín botánico y museo. |
| Basílica de Chiquinquirá | [Q5721982](https://www.wikidata.org/wiki/Q5721982) Basílica de Nuestra Señora del Rosario de Chiquinquirá en alemania | estilo neoclasicismo | Cordillera de los Andes, Cordillera Oriental | Guarda el lienzo de la Virgen de Chiquinquirá, patrona de Colombia, que según la tradición se renovó milagrosamente en 1586. |
| Morro de Tulcán | [Q3050102](https://www.wikidata.org/wiki/Q3050102) Morro del Tulcán |  | Cordillera de los Andes, Cordillera Central | Es una colina que los pueblos prehispánicos adecuaron como pirámide, y desde su cima se ve toda la ciudad. |
| Hacienda Nápoles | [Q2788637](https://www.wikidata.org/wiki/Q2788637) Hacienda Nápoles | desde 1979 | Cordillera de los Andes, Cordillera Central | Hoy es un parque temático, y los hipopótamos traídos aquí en los años 80 originaron una población que vive libre en la región. |
| Viaducto César Gaviria Trujillo | [Q1632036](https://www.wikidata.org/wiki/Q1632036) Viaducto César Gaviria Trujillo | 55 m de caída · desde 1997 | Cordillera de los Andes, Cordillera Central | Este puente atirantado se inauguró en 1997 y lleva el nombre del expresidente César Gaviria, nacido en la ciudad. |
| Estadio Metropolitano Roberto Meléndez | [Q1369387](https://www.wikidata.org/wiki/Q1369387) Estadio Metropolitano Roberto Meléndez | desde 1986 | Ventana al Mundo, Puente Pumarejo | Es la casa habitual de la selección Colombia en las eliminatorias y lleva el nombre del futbolista Roberto el Flaco Meléndez. |
| El Gato del Río | [Q5822005](https://www.wikidata.org/wiki/Q5822005) El Gato del Río | desde 1996 | Cristo Rey de Cali, Cordillera de los Andes | Esta escultura de bronce de Hernando Tejada se instaló en 1996, y más tarde la acompañaron sus novias, gatas pintadas por artistas. |
| Parque Explora | [Q15898569](https://www.wikidata.org/wiki/Q15898569) Parque Explora | desde 2008 | Plaza Botero, Estadio Atanasio Girardot | Este museo interactivo de ciencia abrió en 2007 y tiene acuario, un vivario de reptiles y anfibios y salas de experimentos. |
| Edificio Coltejer | [Q3057904](https://www.wikidata.org/wiki/Q3057904) Centro Coltejer | 175 m de caída · desde 1972 | Plaza Botero, Pueblito Paisa (Cerro Nutibara) | Su punta imita la aguja de una máquina de coser, en honor a la empresa textil Coltejer, y se terminó en 1972. |
| Parque Jaime Duque | [Q6062252](https://www.wikidata.org/wiki/Q6062252) Parque Jaime Duque |  | Catedral de Sal de Zipaquirá, Cordillera de los Andes | Lo creó el piloto Jaime Duque y tiene una réplica del Taj Mahal, un gran mapa en relieve del país y un zoológico. |
| Puente Pumarejo | [Q28109702](https://www.wikidata.org/wiki/Q28109702) puente Pumarejo |  | Ventana al Mundo, Estadio Metropolitano Roberto Meléndez | El nuevo puente atirantado sobre el Magdalena se abrió en 2019 y reemplazó al de 1974, que llevaba el mismo nombre. |
| Fuerte de San Fernando de Bocachica | [Q2970619](https://www.wikidata.org/wiki/Q2970619) Castillo de San Fernando de Bocachica |  | Torre del Reloj de Cartagena, Iglesia de San Pedro Claver | Construido en el siglo XVIII, vigilaba la entrada a la bahía junto con la batería de San José, al otro lado del estrecho canal. |
| Monumento del Pantano de Vargas | [Q3070480](https://www.wikidata.org/wiki/Q3070480) Lanceros del Pantano de Vargas | desde 1970 | Cordillera de los Andes, Cordillera Oriental | Lo esculpió Rodrigo Arenas Betancourt en homenaje a los 14 lanceros de la batalla de 1819, y es el monumento más grande del país. |
| Castillo de Salgar | [Q2970621](https://www.wikidata.org/wiki/Q2970621) Castillo de San Antonio de Salgar |  | Ventana al Mundo, Estadio Metropolitano Roberto Meléndez | Se levantó en el siglo XIX como fortín y puesto de aduana contra el contrabando, y hoy es un lugar para eventos frente al mar. |
| Monumento a los Héroes | [Q9034959](https://www.wikidata.org/wiki/Q9034959) Monumento a Los Héroes (Bogotá) |  | Museo del Oro, Plaza de Bolívar de Bogotá | Rendía homenaje a los soldados de la independencia, con sus batallas grabadas, y se desmontó para construir el metro. |
| Templo Histórico de Cúcuta | [Q3517681](https://www.wikidata.org/wiki/Q3517681) Templo Histórico de Cúcuta |  | Cordillera Oriental | Allí sesionó en 1821 el Congreso que redactó la Constitución de la Gran Colombia, y Bolívar y Santander juraron sus cargos. |

## Pack Colombia: municipios (147)

| Lugar | Wikidata | Cifras | Cerca | Dato curioso |
|---|---|---|---|---|
| Bogotá | [Q2841](https://www.wikidata.org/wiki/Q2841) Bogotá | 8.034.649 hab. (2024) · 1.578 km² · 2.582 m | Museo del Oro, Plaza de Bolívar de Bogotá, Cordillera de los Andes | Cada domingo y festivo cierra más de 100 km de vías a los carros para su Ciclovía, que funciona desde 1974. |
| Medellín | [Q48278](https://www.wikidata.org/wiki/Q48278) Medellín | 2.529.403 hab. (2018) · 381 km² · 1.405 m | Plaza Botero, Pueblito Paisa (Cerro Nutibara), Cordillera de los Andes | Fue la primera ciudad de Colombia con metro, inaugurado en 1995, y su Feria de las Flores se celebra cada agosto. |
| Cali | [Q51103](https://www.wikidata.org/wiki/Q51103) Cali | 2.471.474 hab. (2018) · 564 km² · 1.018 m | Cristo Rey de Cali, El Gato del Río, Cordillera de los Andes | La llaman la capital mundial de la salsa, y cada diciembre celebra la Feria de Cali con desfiles y orquestas. |
| Barranquilla | [Q62823](https://www.wikidata.org/wiki/Q62823) Barranquilla | 1.326.588 hab. (2023) · 154 km² · 18 m | Ventana al Mundo, Puente Pumarejo, Mar Caribe | Su carnaval es Patrimonio de la Humanidad desde 2003, y allí nacieron Shakira y Sofía Vergara. |
| Cartagena | [Q657461](https://www.wikidata.org/wiki/Q657461) Cartagena de Indias | 1.010.995 hab. (2026) · 572 km² · 2 m | Torre del Reloj de Cartagena, Castillo de San Felipe de Barajas | Su ciudad amurallada inspiró a Gabriel García Márquez, cuyas cenizas reposan en el claustro de La Merced. |
| Bucaramanga | [Q243766](https://www.wikidata.org/wiki/Q243766) Bucaramanga | 614.860 hab. (2023) · 162 km² · 959 m | Cordillera de los Andes, Cordillera Oriental | La llaman la Ciudad de los Parques por sus numerosas zonas verdes, y también la Ciudad Bonita de Colombia. |
| Cúcuta | [Q216847](https://www.wikidata.org/wiki/Q216847)  | 806.378 hab. (2023) · 1.176 km² · 320 m | Templo Histórico de Cúcuta, Cordillera Oriental | Un terremoto la destruyó en 1875 y se reconstruyó con calles anchas y muy arborizadas. Se le conoce como la Perla del Norte. |
| Santa Marta | [Q209016](https://www.wikidata.org/wiki/Q209016) Santa Marta | 505.915 hab. (2025) · 294 km² · 8 m | Quinta de San Pedro Alejandrino, Mar Caribe, Cordillera Oriental | Fundada en 1525 por Rodrigo de Bastidas, es la ciudad más antigua de Colombia que sigue en pie; allí murió Simón Bolívar en 1830. |
| Pereira | [Q51111](https://www.wikidata.org/wiki/Q51111) Pereira | 590.554 hab. (2019) · 702 km² · 1.411 m | Parque del Café, Catedral Basílica de Manizales, Cordillera de los Andes | En su plaza principal está el Bolívar Desnudo de Rodrigo Arenas Betancourt: el Libertador sin ropa sobre su caballo. |
| Manizales | [Q235190](https://www.wikidata.org/wiki/Q235190) Manizales | 454.494 hab. (2023) · 2.200 m | Catedral Basílica de Manizales, Viaducto César Gaviria Trujillo, Cordillera de los Andes | Cada enero celebra la Feria de Manizales, con el Reinado Internacional del Café, uno de los eventos más tradicionales del país. |
| Ibagué | [Q222755](https://www.wikidata.org/wiki/Q222755) Ibagué | 546.003 hab. (2024) · 1.498 km² · 1.285 m | Cordillera de los Andes, Cordillera Central | La llaman la Capital Musical de Colombia, y allí funciona el Conservatorio del Tolima, fundado en 1906. |
| Pasto | [Q320015](https://www.wikidata.org/wiki/Q320015) Pasto | 410.835 hab. (2023) · 1.181 km² · 2.527 m | Cordillera de los Andes, Cordillera Central | Cada enero celebra el Carnaval de Negros y Blancos, declarado Patrimonio Cultural Inmaterial de la Humanidad en 2009. |
| Villavicencio | [Q749224](https://www.wikidata.org/wiki/Q749224) Villavicencio | 664.148 hab. (2022) · 1.328 km² · 467 m | Cordillera de los Andes, Cordillera Oriental | La llaman la Puerta del Llano; allí se celebra el Torneo Internacional del Joropo y es famosa la mamona, ternera asada a la llanera. |
| Armenia | [Q328518](https://www.wikidata.org/wiki/Q328518) Armenia | 301.226 hab. (2018) · 140 km² · 1.387 m | Parque del Café, Viaducto César Gaviria Trujillo, Cordillera de los Andes | Fundada en 1889, la llaman la Ciudad Milagro por lo rápido que creció en sus primeras décadas. |
| Neiva | [Q638260](https://www.wikidata.org/wiki/Q638260) Neiva | 380.019 hab. (2023) · 1.553 km² · 442 m | Cordillera de los Andes, Cordillera Oriental, Río Magdalena | Cada junio celebra el Festival Folclórico y Reinado Nacional del Bambuco, con desfiles y el tradicional baile sanjuanero. |
| Leticia | [Q214913](https://www.wikidata.org/wiki/Q214913) Leticia | 55.691 hab. (2025) · 96 m | Amazonia, Río Amazonas | Al atardecer, miles de pericos llegan a dormir en los árboles del Parque Santander, un espectáculo ruidoso y muy famoso. |
| San Andrés | [Q134678](https://www.wikidata.org/wiki/Q134678) San Andrés | 71.946 hab. · 26 km² · 1 m | Mar Caribe | Sus aguas son famosas como el mar de los siete colores, y sus habitantes raizales hablan un criollo de base inglesa. |
| Montería | [Q852725](https://www.wikidata.org/wiki/Q852725) Montería | 400.000 hab. (2023) · 3.141 km² · 18 m |  | Es conocida como la capital ganadera de Colombia y celebra cada año la Feria Nacional de la Ganadería. |
| Valledupar | [Q376903](https://www.wikidata.org/wiki/Q376903) Valledupar | 544.134 hab. (2021) · 4.400 km² · 180 m | Cordillera Oriental | Cada año celebra el Festival de la Leyenda Vallenata, creado en 1968, donde se corona al Rey Vallenato. |
| Popayán | [Q335135](https://www.wikidata.org/wiki/Q335135) Popayán | 300.837 hab. (2018) · 512 km² · 1.760 m | Morro de Tulcán, Cordillera de los Andes, Cordillera Central | En 2005 fue la primera Ciudad de la Gastronomía de la Unesco, y la llaman la Ciudad Blanca por sus fachadas encaladas. |
| Tunja | [Q236744](https://www.wikidata.org/wiki/Q236744) Tunja | 180.572 hab. (2021) · 118 km² · 2.782 m | Puente de Boyacá, Cordillera de los Andes, Cordillera Oriental | Cada diciembre celebra el Aguinaldo Boyacense, una fiesta con carrozas y comparsas que da la bienvenida a la Navidad. |
| Riohacha | [Q826566](https://www.wikidata.org/wiki/Q826566) Riohacha | 222.541 hab. (2020) · 5.020 km² · 5 m | Mar Caribe, Península de La Guajira | En la época colonial fue famosa por sus perlas; hoy en su malecón se venden mochilas tejidas a mano por los wayuu. |
| Buenaventura | [Q996581](https://www.wikidata.org/wiki/Q996581) Buenaventura | 423.927 hab. (2018) · 6.078 km² · 7 m | Cordillera de los Andes, Cordillera Occidental | Por su puerto pasa buena parte del comercio exterior de Colombia, y su cocina destaca por los mariscos en leche de coco. |
| Zipaquirá | [Q205429](https://www.wikidata.org/wiki/Q205429) Zipaquirá | 146.356 hab. (2020) · 194 km² · 2.652 m | Catedral de Sal de Zipaquirá, Parque Jaime Duque, Cordillera de los Andes | Gabriel García Márquez terminó el bachillerato en su Liceo Nacional, y la ciudad es famosa por su Catedral de Sal. |
| Sincelejo | [Q1043513](https://www.wikidata.org/wiki/Q1043513) Sincelejo | 286.716 hab. (2018) · 275 km² · 218 m |  | La llaman la Perla de la Sabana, y en ella es muy popular el mote de queso, una sopa de ñame con queso costeño. |
| Quibdó | [Q816420](https://www.wikidata.org/wiki/Q816420) Quibdó | 130.825 hab. (2020) · 3.338 km² · 43 m | Cordillera de los Andes, Cordillera Occidental, Río Atrato | Entre septiembre y octubre celebra las Fiestas de San Pacho, Patrimonio Inmaterial de la Humanidad desde 2012. |
| Florencia | [Q849859](https://www.wikidata.org/wiki/Q849859) Florencia | 191.867 hab. (2021) · 2.292 km² · 242 m | Cordillera de los Andes, Amazonia, Cordillera Oriental | Nació en 1902, en plena época del caucho, y su nombre recuerda a la ciudad italiana de Florencia. |
| Yopal | [Q13591](https://www.wikidata.org/wiki/Q13591) Yopal | 179.355 hab. (2021) · 2.532 km² · 350 m | Cordillera Oriental, Los Llanos | Su nombre viene del yopo, un árbol que abundaba en la zona; es una ciudad joven, fundada a comienzos del siglo XX. |
| Rionegro | [Q1774644](https://www.wikidata.org/wiki/Q1774644) Rionegro | 135.465 hab. (2018) · 198 km² · 2.130 m | Plaza Botero, Piedra del Peñol, Cordillera de los Andes | Allí se redactó la Constitución de 1863, que dio origen a los Estados Unidos de Colombia. |
| Guatapé | [Q1578769](https://www.wikidata.org/wiki/Q1578769) Guatapé | 9.121 hab. (2023) · 1.890 m | Piedra del Peñol, Cordillera de los Andes, Cordillera Central | Sus fachadas están decoradas con zócalos: relieves de colores que muestran animales, oficios y escenas de la vida del pueblo. |
| Villa de Leyva | [Q1409503](https://www.wikidata.org/wiki/Q1409503) Villa de Leyva | 21.953 hab. (2021) · 128 km² · 2.000 m | Basílica de Chiquinquirá, Puente de Boyacá, Cordillera de los Andes | Su plaza principal, empedrada, es una de las más grandes de Colombia, y en sus alrededores se han hallado fósiles marinos. |
| Girardot | [Q186193](https://www.wikidata.org/wiki/Q186193) Girardot | 129.834 hab. (2005) · 127 km² · 326 m | Cordillera de los Andes, Cordillera Oriental, Río Magdalena | Conocida como la Ciudad de las Acacias, conserva un antiguo puente férreo que es hoy uno de sus grandes símbolos. |
| Soacha | [Q1011151](https://www.wikidata.org/wiki/Q1011151) Soacha | 782.647 hab. (2023) · 184 km² · 2.565 m | Plaza de Bolívar de Bogotá, Museo del Oro, Cordillera de los Andes | Allí está el Salto del Tequendama; según la leyenda muisca, lo abrió Bochica para drenar la sabana inundada. |
| Bello | [Q816024](https://www.wikidata.org/wiki/Q816024) Bello | 561.955 hab. (2023) · 142 km² · 1.310 m | Plaza Botero, Estadio Atanasio Girardot, Cordillera de los Andes | Antes se llamaba Hatoviejo; su nombre actual honra al humanista venezolano Andrés Bello. |
| Envigado | [Q1447266](https://www.wikidata.org/wiki/Q1447266) Envigado | 228.848 hab. (2018) · 79 km² · 1.575 m | Plaza Botero, Pueblito Paisa (Cerro Nutibara), Cordillera de los Andes | Es la cuna del filósofo Fernando González, el Brujo de Otraparte, cuya casa es hoy un museo y centro cultural. |
| Itagüí | [Q1527934](https://www.wikidata.org/wiki/Q1527934) Itagüí | 299.348 hab. (2024) · 21 km² · 1.550 m | Plaza Botero, Pueblito Paisa (Cerro Nutibara), Cordillera de los Andes | Se la conoce como la ciudad industrial de Colombia por la gran cantidad de fábricas que se instalaron allí en el siglo XX. |
| Soledad | [Q767071](https://www.wikidata.org/wiki/Q767071) Soledad | 676.014 hab. (2023) · 67 km² · 5 m | Ventana al Mundo, Estadio Metropolitano Roberto Meléndez, Río Magdalena | Es famosa por la butifarra soledeña, un pequeño embutido de carne que los vendedores pregonan por las calles. |
| Palmira | [Q989858](https://www.wikidata.org/wiki/Q989858) Palmira | 358.895 hab. (2023) · 1.123 km² · 1.001 m | Cristo Rey de Cali, El Gato del Río, Cordillera de los Andes | La llaman la Villa de las Palmas, y allí tiene su sede el Centro Internacional de Agricultura Tropical (CIAT). |
| Tuluá | [Q1002577](https://www.wikidata.org/wiki/Q1002577) Tuluá | 219.138 hab. (2018) · 911 km² · 1 m | Basílica del Señor de los Milagros de Buga, Cordillera de los Andes, Cordillera Central | La llaman el Corazón del Valle y es la tierra natal del escritor Gustavo Álvarez Gardeazábal. |
| Buga | [Q934753](https://www.wikidata.org/wiki/Q934753) Buga | 128.945 hab. (2023) · 832 km² · 969 m | Basílica del Señor de los Milagros de Buga, Cordillera de los Andes, Cordillera Occidental | Su Basílica del Señor de los Milagros recibe peregrinos de todo el país, y su centro histórico conserva casas coloniales. |
| Barrancabermeja | [Q808830](https://www.wikidata.org/wiki/Q808830) Barrancabermeja | 300.000 hab. (2023) · 1.274 km² · 75 m | Cordillera de los Andes, Río Magdalena | Es la capital petrolera de Colombia: allí está la mayor refinería del país, operada por Ecopetrol. |
| San Gil | [Q1294128](https://www.wikidata.org/wiki/Q1294128) San Gil | 46.016 hab. · 150 km² · 1.247 m | Cordillera de los Andes, Cordillera Oriental | Es la capital colombiana del turismo de aventura, y su parque El Gallineral tiene árboles cubiertos de barba de viejo. |
| Ipiales | [Q1010094](https://www.wikidata.org/wiki/Q1010094) Ipiales | 169.864 hab. (2024) · 1.707 km² · 2.892 m | Santuario de Las Lajas, Cordillera de los Andes, Cordillera Central | En su territorio está el Santuario de Las Lajas, una iglesia neogótica construida sobre un puente en el cañón del Guáitara. |
| Tumaco | [Q1005555](https://www.wikidata.org/wiki/Q1005555) Tumaco | 212.692 hab. (2018) · 3.760 km² · 2 m |  | Allí floreció la cultura prehispánica Tumaco-La Tolita, famosa por sus figuras de cerámica y su orfebrería en oro. |
| Duitama | [Q1011125](https://www.wikidata.org/wiki/Q1011125) Duitama | 132.894 hab. (2024) · 267 km² · 2.530 m | Monumento del Pantano de Vargas, Cordillera de los Andes, Cordillera Oriental | Allí está el Pueblito Boyacense, que reproduce a pequeña escala la arquitectura de varios pueblos de Boyacá. |
| Sogamoso | [Q989996](https://www.wikidata.org/wiki/Q989996) Sogamoso | 139.021 hab. (2025) · 209 km² · 2.569 m | Monumento del Pantano de Vargas, Cordillera de los Andes, Cordillera Oriental | Fue la Ciudad del Sol de los muiscas: su Templo del Sol se reconstruyó en el Museo Arqueológico de la ciudad. |
| Salento | [Q1576707](https://www.wikidata.org/wiki/Q1576707) Salento | 7.578 hab. (2018) · 376 km² · 1.895 m | Parque del Café, Viaducto César Gaviria Trujillo, Cordillera de los Andes | Lo llaman el Padre del Quindío por ser su pueblo más antiguo, y su Calle Real está llena de balcones de colores. |
| Ciénaga | [Q1092797](https://www.wikidata.org/wiki/Q1092797) Ciénaga | 118.435 hab. (2018) · 1.812 km² · 3 m | Quinta de San Pedro Alejandrino, Mar Caribe | Conserva casonas republicanas de la bonanza bananera y cada enero celebra el Festival del Caimán Cienaguero. |
| Maicao | [Q1937427](https://www.wikidata.org/wiki/Q1937427) Maicao | 123.757 hab. (2005) · 1.782 km² · 52 m | Península de La Guajira | Es famosa por su intenso comercio y por la mezquita Omar Ibn Al-Khattab, levantada por su comunidad de origen árabe. |
| Mompox | [Q740288](https://www.wikidata.org/wiki/Q740288) Santa Cruz de Mompós | 45.417 hab. · 645 km² · 10 m | Río Magdalena | Su centro histórico es Patrimonio de la Humanidad desde 1995, y es famosa por su filigrana de oro y plata. |
| Providencia | [Q3408299](https://www.wikidata.org/wiki/Q3408299) Providencia | 18 km² · 2 m | Mar Caribe | El Puente de los Enamorados la une con la pequeña isla de Santa Catalina, y tiene el Parque Nacional Old Providence. |
| Chía | [Q1093102](https://www.wikidata.org/wiki/Q1093102) Chía | 97.896 hab. (2005) · 80 km² · 2.564 m | Catedral de Sal de Zipaquirá, Museo del Oro, Cordillera de los Andes | Su nombre viene de Chía, la diosa muisca de la luna, y allí se conserva el colonial Puente del Común. |
| Fusagasugá | [Q2077525](https://www.wikidata.org/wiki/Q2077525) Fusagasugá | 170.241 hab. (2023) · 239 km² · 1.765 m | Cordillera de los Andes, Cordillera Oriental | La llaman la Ciudad Jardín de Colombia por la gran cantidad de flores y orquídeas de sus viveros. |
| Apartadó | [Q1093516](https://www.wikidata.org/wiki/Q1093516) Apartadó | 121.003 hab. (2018) · 607 km² · 30 m | Cordillera Occidental | Es uno de los grandes centros de la producción bananera de Colombia, y buena parte de esa fruta se exporta. |
| Mocoa | [Q579803](https://www.wikidata.org/wiki/Q579803) Mocoa | 1.030 km² · 604 m | Cordillera de los Andes, Cordillera Oriental, Amazonia | En sus alrededores está la cascada del Fin del Mundo, a la que se llega por un sendero entre selva y pozos naturales. |
| Arauca | [Q626543](https://www.wikidata.org/wiki/Q626543) Arauca | 96.814 hab. (2020) · 5.841 km² · 125 m | Los Llanos | Es tierra de música llanera: el arpa, el cuatro y las maracas acompañan el joropo, su baile tradicional. |
| San José del Guaviare | [Q864675](https://www.wikidata.org/wiki/Q864675) San José del Guaviare | 52.815 hab. (2020) · 13.912 km² · 185 m | Río Guainía | En sus alrededores hay pinturas rupestres milenarias, como las de Cerro Azul, y rocas como la Puerta de Orión. |
| Cartago | [Q2004074](https://www.wikidata.org/wiki/Q2004074) Cartago | 210.558 hab. (2020) · 279 km² · 917 m | Parque del Café, Viaducto César Gaviria Trujillo, Cordillera de los Andes | La llaman la Capital Mundial del Bordado por las finas prendas bordadas a mano que se elaboran allí. |
| Honda | [Q932513](https://www.wikidata.org/wiki/Q932513) Honda | 22.753 hab. (2018) · 309 km² · 225 m | Cordillera de los Andes, Río Magdalena | La llaman la Ciudad de los Puentes, fue un gran puerto fluvial colonial y cada año celebra la subienda de peces. |
| Turbo | [Q727559](https://www.wikidata.org/wiki/Q727559) Turbo | 181.000 hab. (2020) · 3.055 km² · 2 m | Cordillera Occidental, Golfo de Urabá | Su puerto es una de las salidas del banano hacia el mundo, y de su muelle parten lanchas hacia las playas de Capurganá. |
| Santa Fe de Antioquia | [Q927703](https://www.wikidata.org/wiki/Q927703) Santa Fe de Antioquia | 26.164 hab. (2018) · 493 km² · 550 m | Puente de Occidente, Cordillera de los Andes, Cordillera Occidental | Fue la primera capital de Antioquia hasta 1826, y su Puente de Occidente fue de los colgantes más largos de América. |
| Jardín | [Q1525138](https://www.wikidata.org/wiki/Q1525138) Jardín | 13.748 hab. (2015) · 224 km² · 1.750 m | Cordillera de los Andes, Cordillera Occidental | Es famoso por su plaza llena de sillas de colores y por el gallito de roca, un ave anaranjada que se observa en sus bosques. |
| Chiquinquirá | [Q951897](https://www.wikidata.org/wiki/Q951897) Chiquinquirá | 85.274 hab. (2020) · 133 km² · 2.556 m | Basílica de Chiquinquirá, Cordillera de los Andes, Cordillera Oriental | La llaman la capital religiosa de Colombia: su basílica guarda el cuadro de la Virgen del Rosario, patrona del país. |
| Paipa | [Q1391867](https://www.wikidata.org/wiki/Q1391867) Paipa | 31.868 hab. (2019) · 306 km² · 2.525 m | Monumento del Pantano de Vargas, Cordillera de los Andes, Cordillera Oriental | Es famosa por sus aguas termales y por el queso Paipa, que cuenta con denominación de origen protegida. |
| Ráquira | [Q1526054](https://www.wikidata.org/wiki/Q1526054) Ráquira | 233 km² · 2.150 m | Basílica de Chiquinquirá, Puente de Boyacá, Cordillera de los Andes | Su nombre muisca significa ciudad de las ollas, y sigue siendo la capital de la cerámica artesanal de Colombia. |
| La Dorada | [Q2279516](https://www.wikidata.org/wiki/Q2279516) La Dorada | 72.925 hab. · 574 km² · 176 m | Cordillera de los Andes, Río Magdalena | Creció gracias al ferrocarril y al transporte por río, y es conocida por sus platos de pescado como el bagre. |
| Dosquebradas | [Q1093584](https://www.wikidata.org/wiki/Q1093584) Dosquebradas | 179.301 hab. (2005) · 71 km² · 1.460 m | Catedral Basílica de Manizales, Viaducto César Gaviria Trujillo, Cordillera de los Andes | Fue corregimiento de Santa Rosa de Cabal hasta 1972, cuando se convirtió en municipio; hoy es un activo polo industrial. |
| Santa Rosa de Cabal | [Q955068](https://www.wikidata.org/wiki/Q955068) Santa Rosa de Cabal | 73.028 hab. · 564 km² · 1.701 m | Catedral Basílica de Manizales, Viaducto César Gaviria Trujillo, Cordillera de los Andes | Es famosa por sus termales y por el chorizo santarrosano, tan popular que la llaman la capital del chorizo. |
| Calarcá | [Q2240918](https://www.wikidata.org/wiki/Q2240918) Calarcá | 74.890 hab. (2020) · 219 km² · 1.573 m | Parque del Café, Viaducto César Gaviria Trujillo, Cordillera de los Andes | Allí está el Jardín Botánico del Quindío, cuyo mariposario tiene forma de mariposa. |
| Filandia | [Q1525384](https://www.wikidata.org/wiki/Q1525384) Filandia | 12.066 hab. (2018) · 109 km² · 1.923 m | Parque del Café, Viaducto César Gaviria Trujillo, Cordillera de los Andes | Es conocida por su cestería tradicional tejida a mano y por el mirador Colina Iluminada, una torre de madera. |
| Pitalito | [Q1014922](https://www.wikidata.org/wiki/Q1014922) Pitalito | 133.205 hab. (2018) · 666 km² · 1.318 m | Parque Arqueológico de San Agustín, Cordillera de los Andes, Cordillera Oriental | Es famosa por sus chivas de cerámica, miniaturas de los buses rurales de colores, y por sus cafés especiales. |
| San Agustín | —  |  | Parque Arqueológico de San Agustín, Cordillera de los Andes, Cordillera Oriental | Su parque arqueológico guarda cientos de estatuas de piedra talladas por una cultura prehispánica y es Patrimonio Mundial. |
| Barichara | [Q1576773](https://www.wikidata.org/wiki/Q1576773) Barichara | 8 hab. · 13 km² · 1.336 m | Cordillera de los Andes, Cordillera Oriental | Lo consideran uno de los pueblos más lindos de Colombia; sus calles empedradas y casas de tapia son Monumento Nacional. |
| Floridablanca | [Q1006661](https://www.wikidata.org/wiki/Q1006661) Floridablanca | 267.170 hab. (2018) · 97 km² · 925 m | Cordillera de los Andes, Cordillera Oriental | Es famosa por sus obleas rellenas de arequipe, y en ella está el Jardín Botánico Eloy Valenzuela. |
| Girón | [Q1093497](https://www.wikidata.org/wiki/Q1093497) San Juan de Girón | 230 hab. (2024) · 475 km² · 706 m | Cordillera de los Andes, Cordillera Oriental | Su centro colonial, de calles empedradas y casas blancas, fue declarado Monumento Nacional. |
| Pamplona | [Q997796](https://www.wikidata.org/wiki/Q997796) Pamplona | 50.025 hab. (2018) · 318 km² · 2.342 m | Cordillera Oriental | La fundó en 1549 Pedro de Ursúa, quien la bautizó en honor a la Pamplona de su Navarra natal. |
| Ocaña | [Q2283773](https://www.wikidata.org/wiki/Q2283773) Ocaña | 90.037 hab. (2005) · 672 km² · 1.202 m | Cordillera Oriental | En 1828 acogió la Convención de Ocaña, que intentó reformar la Constitución de la Gran Colombia. |
| Aracataca | [Q624492](https://www.wikidata.org/wiki/Q624492) Aracataca | 37.476 hab. (2018) · 1.755 km² · 40 m |  | Es el pueblo natal de Gabriel García Márquez, Nobel de Literatura en 1982, e inspiró el Macondo de Cien años de soledad. |
| Tolú | [Q601893](https://www.wikidata.org/wiki/Q601893) Tolú | 35.670 hab. · 347 km² · 2 m | Mar Caribe, Golfo de Morrosquillo | Le dio nombre al bálsamo de Tolú, una resina de árbol usada desde hace siglos en jarabes y perfumes. |
| Coveñas | [Q952231](https://www.wikidata.org/wiki/Q952231) Coveñas | 11.270 hab. (2005) · 74 km² · 0 m | Mar Caribe | Allí termina el oleoducto Caño Limón-Coveñas, por donde se exporta crudo colombiano, y sus playas atraen a muchos turistas. |
| Melgar | [Q1257259](https://www.wikidata.org/wiki/Q1257259) Melgar | 37.224 hab. (2019) · 196 km² · 323 m | Cordillera de los Andes, Cordillera Oriental | La llaman la Ciudad de las Piscinas por las muchas que hay en casas y hoteles; es un descanso favorito de los bogotanos. |
| Espinal | [Q2298176](https://www.wikidata.org/wiki/Q2298176) El Espinal | 75.828 hab. · 231 km² · 323 m | Cordillera de los Andes, Cordillera Oriental, Río Magdalena | Es uno de los grandes centros arroceros de Colombia, y en sus mesas no falta la lechona, plato típico del Tolima. |
| Magangué | [Q1011196](https://www.wikidata.org/wiki/Q1011196) Magangué | 123.906 hab. (2017) · 1.568 km² · 49 m | Río Cauca | La llaman la Ciudad de los Ríos y por siglos ha sido un puerto clave para el comercio fluvial del país. |
| Lorica | [Q775761](https://www.wikidata.org/wiki/Q775761) El Campano ,Cordoba | 110.316 hab. (2005) · 960 km² · 7 m |  | Su mercado público republicano y sus casonas reflejan la llegada de inmigrantes sirios y libaneses a comienzos del siglo XX. |
| Puerto Colombia | [Q2186176](https://www.wikidata.org/wiki/Q2186176) Puerto Colombia | 26.932 hab. (2005) · 73 km² · 10 m | Ventana al Mundo, Estadio Metropolitano Roberto Meléndez, Mar Caribe | Su muelle, inaugurado en 1893, fue uno de los más largos del mundo, y por él llegaron muchos inmigrantes al país. |
| Facatativá | [Q1947594](https://www.wikidata.org/wiki/Q1947594) Facatativá | 117.133 hab. (2012) · 158 km² · 3 m | Cordillera de los Andes, Cordillera Oriental | Su Parque Arqueológico Piedras del Tunjo tiene enormes rocas cubiertas de pinturas rupestres muiscas. |
| Jamundí | [Q1681497](https://www.wikidata.org/wiki/Q1681497) Jamundí | 96.993 hab. (2005) · 577 km² · 869 m | Cristo Rey de Cali, El Gato del Río, Cordillera de los Andes | Su nombre recuerda al cacique Xamundí, líder indígena que enfrentó la llegada de los españoles en el siglo XVI. |
| Caucasia | [Q511705](https://www.wikidata.org/wiki/Q511705) Caucasia | 90.213 hab. (2018) · 1.411 km² · 150 m | Río Cauca | Su economía ha girado en torno a la ganadería, la pesca y la minería de oro de aluvión. |
| Puerto Asís | [Q1018571](https://www.wikidata.org/wiki/Q1018571) Puerto Asís | 63.067 hab. · 26.103 km² · 409 m | Amazonia, Río Putumayo | Fue fundado en 1912 por misioneros capuchinos, y su nombre honra a san Francisco de Asís. |
| Uribia | [Q2215403](https://www.wikidata.org/wiki/Q2215403) Uribia | 117.674 hab. (2005) · 7.905 km² · 71 m | Península de La Guajira | La llaman la capital indígena de Colombia, y cada año celebra el Festival de la Cultura Wayuu. |
| Nuquí | [Q1577833](https://www.wikidata.org/wiki/Q1577833) Nuquí | 8.958 hab. · 45 m |  | Entre julio y octubre, las ballenas jorobadas llegan a sus aguas para aparearse y tener sus crías. |
| Inírida | [Q130281](https://www.wikidata.org/wiki/Q130281) Inírida | 19.816 hab. (2015) · 95 m |  | Comparte su nombre con la flor de Inírida, que conserva su forma y su color durante meses después de cortada. |
| Mitú | [Q130242](https://www.wikidata.org/wiki/Q130242) Mitú | 29.850 hab. (2020) · 16 km² · 183 m | Amazonia, Río Vaupés | Solo se llega en avión o por río, y allí conviven pueblos indígenas como los cubeos y los tucanos. |
| Puerto Carreño | [Q130304](https://www.wikidata.org/wiki/Q130304) Puerto Carreño | 16.763 hab. (2023) · 12.409 km² · 51 m | Río Meta, Río Orinoco, Los Llanos | Es un destino de pesca deportiva, con especies como el pavón y la payara, un pez de colmillos enormes. |
| Necoclí | [Q976938](https://www.wikidata.org/wiki/Q976938) Necoclí | 69.090 hab. · 0 m | Golfo de Urabá | Cada año celebra el Festival Nacional del Bullerengue, un baile cantado con tambores de herencia afrocolombiana. |
| Jericó | [Q1525982](https://www.wikidata.org/wiki/Q1525982) Jericó | 193 km² · 1.931 m | Cordillera de los Andes, Cordillera Occidental | Es famoso por sus carrieles, el bolso de cuero del arriero antioqueño, y es la cuna de santa Laura Montoya. |
| Puerto Berrío | [Q1946640](https://www.wikidata.org/wiki/Q1946640) Puerto Berrío | 39.314 hab. (2018) · 70 m | Cordillera de los Andes, Río Magdalena | Su nombre honra al gobernador Pedro Justo Berrío, y nació como puerto del Ferrocarril de Antioquia. |
| Sabanalarga | [Q1027007](https://www.wikidata.org/wiki/Q1027007) Sabanalarga | 84.410 hab. (2005) · 399 km² · 87 m |  | Su nombre viene de las amplias sabanas que la rodean, y es un importante centro ganadero y comercial. |
| Turbaco | [Q2080243](https://www.wikidata.org/wiki/Q2080243) Turbaco | 115.000 hab. (2023) · 185 km² · 128 m | Torre del Reloj de Cartagena, Castillo de San Felipe de Barajas | En 1801 Alexander von Humboldt visitó y describió sus volcanes de lodo, que burbujean entre los cerros. |
| San Jacinto | [Q1441919](https://www.wikidata.org/wiki/Q1441919) San Jacinto | 21.644 hab. · 434 km² · 227 m |  | Es la tierra de los Gaiteros de San Jacinto, ganadores de un Grammy Latino, y de hamacas tejidas en telar. |
| El Carmen de Bolívar | [Q1323930](https://www.wikidata.org/wiki/Q1323930) El Carmen de Bolívar | 66.001 hab. (2005) · 945 km² · 155 m |  | Es la cuna de Lucho Bermúdez, maestro del porro y la cumbia de orquesta, y es famoso por su aguacate. |
| El Cocuy | [Q1655984](https://www.wikidata.org/wiki/Q1655984) El Cocuy | 5.241 hab. (2015) · 253 km² · 2.784 m | Cordillera de los Andes, Cordillera Oriental | Es la puerta del Parque Nacional El Cocuy, con nevados y glaciares, y sus casas son blancas con zócalos verdes. |
| Puerto Boyacá | [Q2335098](https://www.wikidata.org/wiki/Q2335098) Puerto Boyacá | 56.930 hab. · 1.472 km² · 145 m | Hacienda Nápoles, Cordillera de los Andes, Río Magdalena | Su economía gira en torno al petróleo y la ganadería; en su territorio se explotan campos petroleros desde mediados del siglo XX. |
| Salamina | [Q610524](https://www.wikidata.org/wiki/Q610524) Salamina | 422 km² · 1.822 m | Cordillera de los Andes, Cordillera Central | La llaman la Ciudad Luz por la cantidad de poetas y escritores nacidos allí, y conserva bella arquitectura de bahareque. |
| Riosucio | [Q1093015](https://www.wikidata.org/wiki/Q1093015) Riosucio | 62.296 hab. · 429 km² · 1.844 m | Cordillera de los Andes, Cordillera Occidental, Cordillera Central | Cada dos años celebra el Carnaval de Riosucio, en el que el Diablo es el alegre protagonista de la fiesta. |
| Chinchiná | [Q1073678](https://www.wikidata.org/wiki/Q1073678) Chinchiná | 50.673 hab. · 112 km² · 1.378 m | Catedral Basílica de Manizales, Viaducto César Gaviria Trujillo, Cordillera de los Andes | Es tierra cafetera por excelencia: en su territorio funciona Cenicafé, el centro de investigación del café colombiano. |
| San Vicente del Caguán | [Q1642041](https://www.wikidata.org/wiki/Q1642041) San Vicente del Caguán | 72.949 hab. · 17.875 km² · 280 m | Cordillera de los Andes, Amazonia, Cordillera Oriental | La ganadería es su principal actividad, y es uno de los municipios con más cabezas de ganado de Colombia. |
| Aguazul | [Q13663](https://www.wikidata.org/wiki/Q13663) Aguazul | 43.183 hab. · 313 m | Cordillera Oriental, Los Llanos | Su economía combina arroz, ganadería y petróleo, y es tierra de joropo y de la tradicional mamona llanera. |
| Paz de Ariporo | [Q1442453](https://www.wikidata.org/wiki/Q1442453) Paz de Ariporo | 26.237 hab. · 340 m | Los Llanos | Sus esteros y sabanas inundables son refugio de chigüiros, garzas y caimanes. |
| Silvia | [Q2418703](https://www.wikidata.org/wiki/Q2418703) Silvia | 32.692 hab. · 813 km² · 2.800 m | Morro de Tulcán, Cordillera de los Andes, Cordillera Central | Es el corazón del pueblo misak o guambiano, que cada martes llega al mercado con su vestido tradicional. |
| Guapi | [Q2432113](https://www.wikidata.org/wiki/Q2432113) Guapí | 29.797 hab. (2016) · 2.688 km² · 6 m | Cordillera de los Andes | Es tierra de marimba de chonta y cantos tradicionales, música del Pacífico sur declarada Patrimonio Inmaterial por la Unesco. |
| Santander de Quilichao | [Q1093175](https://www.wikidata.org/wiki/Q1093175) Santander de Quilichao | 116.535 hab. (2018) · 521 km² · 1.071 m | Cordillera de los Andes, Cordillera Central | Su nombre une el apellido del prócer Francisco de Paula Santander con Quilichao, su antigua denominación indígena. |
| Aguachica | [Q2309010](https://www.wikidata.org/wiki/Q2309010) Aguachica | 109.621 hab. (2019) · 976 km² · 162 m |  | Su economía se basa en el comercio, la ganadería y cultivos como la palma de aceite, y es un activo nodo de transporte. |
| Agustín Codazzi | [Q781307](https://www.wikidata.org/wiki/Q781307) Agustín Codazzi | 49.233 hab. · 1.739 km² · 131 m | Cordillera Oriental | Honra a Agustín Codazzi, geógrafo italiano que dirigió la Comisión Corográfica que cartografió Colombia en el siglo XIX. |
| Bahía Solano | [Q1579457](https://www.wikidata.org/wiki/Q1579457) Bahía Solano | 1.667 km² · 152 m |  | Es conocida por la pesca deportiva y por sus playas, donde las tortugas marinas llegan cada año a poner sus huevos. |
| Istmina | [Q1441410](https://www.wikidata.org/wiki/Q1441410) Istmina | 25.981 hab. · 78 m | Cordillera de los Andes, Cordillera Occidental | Desde la época colonial, el oro y el platino que se sacan de sus ríos han marcado su historia. |
| Acandí | [Q1575935](https://www.wikidata.org/wiki/Q1575935) Acandí | 1.551 km² · 0 m | Mar Caribe, Golfo de Urabá | En sus playas desova cada año la tortuga caná o laúd, la tortuga marina más grande del mundo. |
| Sahagún | [Q591547](https://www.wikidata.org/wiki/Q591547) Sahagún | 90.487 hab. · 993 km² · 75 m |  | La llaman la Ciudad Cultural de Córdoba, y su economía tradicional se basa en la ganadería y el algodón. |
| Montelíbano | [Q1787546](https://www.wikidata.org/wiki/Q1787546) Montelíbano | 90.450 hab. · 1.800 km² · 49 m |  | En su territorio está Cerro Matoso, una de las mayores minas de ferroníquel a cielo abierto del mundo. |
| Guatavita | [Q1576750](https://www.wikidata.org/wiki/Q1576750) Guatavita | 6.963 hab. · 247 km² · 2.668 m | Catedral de Sal de Zipaquirá, Parque Jaime Duque, Cordillera de los Andes | El pueblo actual se construyó en los años sesenta en estilo colonial, porque el antiguo quedó bajo el embalse de Tominé. |
| Villeta | [Q1440837](https://www.wikidata.org/wiki/Q1440837) Villeta | 43.574 hab. (2015) · 141 km² · 845 m | Cordillera de los Andes, Cordillera Oriental | Es famosa por la panela, y cada año celebra el Reinado Nacional de la Panela, con desfiles y fiestas populares. |
| Ubaté | [Q2219816](https://www.wikidata.org/wiki/Q2219816) Ubaté | 39.568 hab. · 102 km² · 2.556 m | Basílica de Chiquinquirá, Cordillera de los Andes, Cordillera Oriental | La llaman la Capital Lechera de Colombia, famosa por su leche, sus quesos y sus derivados lácteos. |
| Garzón | [Q1970613](https://www.wikidata.org/wiki/Q1970613) Garzón | 69.823 hab. (2005) · 580 km² · 828 m | Cordillera de los Andes, Cordillera Oriental | Es sede de la Diócesis de Garzón y una zona cafetera reconocida por sus cafés especiales. |
| Villavieja | [Q1574725](https://www.wikidata.org/wiki/Q1574725) Villavieja | 719 km² · 347 m | Cordillera de los Andes, Cordillera Oriental, Desierto de la Tatacoa | Es la puerta del desierto de la Tatacoa, famoso por sus fósiles y por su observatorio para mirar las estrellas. |
| Manaure | [Q635230](https://www.wikidata.org/wiki/Q635230) Manaure | 67.584 hab. (2005) · 1.971 km² · 3 m | Mar Caribe, Península de La Guajira | Sus salinas producen buena parte de la sal marina de Colombia, extraída en gran medida por comunidades wayuu. |
| Fonseca | [Q1441074](https://www.wikidata.org/wiki/Q1441074) Fonseca | 35.205 hab. · 662 km² · 167 m | Cordillera Oriental | Es tierra de juglares vallenatos: allí nació el acordeonero Luis Enrique Martínez, el Pollo Vallenato. |
| El Banco | [Q2330760](https://www.wikidata.org/wiki/Q2330760) El Banco | 59.594 hab. (2018) · 816 km² · 25 m | Río Magdalena | Allí se celebra el Festival Nacional de la Cumbia José Barros, en honor al autor de La piragua, nacido en el pueblo. |
| Fundación | [Q303437](https://www.wikidata.org/wiki/Q303437) Fundación | 64.833 hab. (2018) · 1.157 km² · 10 m |  | Creció alrededor del ferrocarril bananero y hoy es un centro agrícola de palma de aceite, banano y ganadería. |
| Granada | [Q2101383](https://www.wikidata.org/wiki/Q2101383) Granada | 157 hab. (2024) · 350 km² · 372 m | Cordillera de los Andes, Río Guainía, Los Llanos | Es un activo centro agrícola y comercial, conocido por sus cultivos de plátano, cacao y frutales. |
| Puerto López | [Q2143650](https://www.wikidata.org/wiki/Q2143650) Puerto López | 35.097 hab. · 6.740 km² · 210 m | Río Meta, Los Llanos | Es un puerto ganadero y pesquero, y su obelisco del alto de Menegua es uno de los símbolos más visitados del Llano. |
| Acacías | [Q2429780](https://www.wikidata.org/wiki/Q2429780) Acacías | 75.252 hab. · 1.149 km² · 498 m | Cordillera de los Andes, Cordillera Oriental | Cada año celebra el Festival Internacional del Retorno, una gran fiesta de música y danza llanera. |
| La Macarena | [Q973745](https://www.wikidata.org/wiki/Q973745) La Macarena | 36.781 hab. · 11.229 km² · 303 m | Amazonia | Es la puerta a Caño Cristales, el río de los cinco colores, que se tiñe de rojo gracias a una planta acuática. |
| Puerto Gaitán | [Q1524747](https://www.wikidata.org/wiki/Q1524747) Puerto Gaitán | 144 m | Los Llanos | En su territorio está Rubiales, uno de los campos petroleros más productivos de Colombia. |
| Túquerres | [Q2373315](https://www.wikidata.org/wiki/Q2373315) Túquerres | 41.205 hab. (2005) · 3.104 m | Santuario de Las Lajas, Cordillera de los Andes, Cordillera Occidental | En su territorio está la Laguna Verde, de aguas color esmeralda, dentro del cráter del volcán Azufral. |
| Villa del Rosario | [Q923525](https://www.wikidata.org/wiki/Q923525) Villa del Rosario | 69.833 hab. (2005) · 228 km² · 440 m | Templo Histórico de Cúcuta, Cordillera Oriental | Allí nació Francisco de Paula Santander, y en 1821 sesionó el Congreso que dio vida a la Gran Colombia. |
| Sibundoy | [Q368507](https://www.wikidata.org/wiki/Q368507) Sibundoy | 64 km² · 2.100 m | Cordillera de los Andes, Cordillera Central, Cordillera Oriental | Es territorio de los pueblos kamëntšá e inga, que celebran el Carnaval del Perdón o Bëtscnaté antes de la Cuaresma. |
| Montenegro | [Q1256403](https://www.wikidata.org/wiki/Q1256403) Montenegro | 41.857 hab. · 149 km² · 1.286 m | Parque del Café, Viaducto César Gaviria Trujillo, Cordillera de los Andes | Allí está el Parque Nacional del Café, un parque temático con espectáculos sobre la cultura cafetera y atracciones. |
| Socorro | [Q979980](https://www.wikidata.org/wiki/Q979980) Socorro | 31.115 hab. · 136 km² · 1.300 m | Cordillera de los Andes, Cordillera Oriental | Allí comenzó en 1781 la Revolución de los Comuneros, cuando Manuela Beltrán rompió el edicto de nuevos impuestos. |
| Málaga | [Q950892](https://www.wikidata.org/wiki/Q950892) Málaga | 18.230 hab. · 58 km² · 2.466 m | Cordillera de los Andes, Cordillera Oriental | Comparte su nombre con la ciudad española de Málaga y es el centro comercial y estudiantil de la provincia de García Rovira. |
| Corozal | [Q2431720](https://www.wikidata.org/wiki/Q2431720) Corozal | 70.853 hab. · 264 km² · 142 m |  | Su nombre viene del corozo, una palma de frutos pequeños y rojos con los que se preparan jugos y dulces. |
| Mariquita | [Q532572](https://www.wikidata.org/wiki/Q532572) Mariquita | 34.505 hab. (2018) · 290 km² · 558 m | Cordillera de los Andes, Cordillera Central | Desde allí dirigió José Celestino Mutis la Real Expedición Botánica del Nuevo Reino de Granada a partir de 1783. |
| Líbano | [Q1256428](https://www.wikidata.org/wiki/Q1256428) Líbano | 39.665 hab. · 299 km² · 1.565 m | Cordillera de los Andes, Cordillera Central | Fue uno de los grandes centros cafeteros de Colombia a comienzos del siglo XX, y el café sigue siendo su motor. |
| Yumbo | [Q735378](https://www.wikidata.org/wiki/Q735378) Yumbo | 92.192 hab. (2005) · 245 km² · 855 m | Cristo Rey de Cali, El Gato del Río, Cordillera de los Andes | La llaman la Capital Industrial del Valle por las numerosas fábricas instaladas en su territorio. |
| Puerto Nariño | [Q767738](https://www.wikidata.org/wiki/Q767738) Puerto Nariño | 9.744 hab. (2018) · 1.876 km² · 89 m | Amazonia, Río Amazonas | Es un pueblo sin carros que se recorre a pie, conocido por su cuidado ambiental y por los delfines rosados cercanos. |
| Cumaribo | [Q255288](https://www.wikidata.org/wiki/Q255288) Cumaribo | 43.138 hab. (2018) · 65.193 km² · 125 m |  | Buena parte de su gente pertenece a pueblos indígenas, sobre todo sikuani, que viven en resguardos de sabana y selva. |
| Saravena | [Q940904](https://www.wikidata.org/wiki/Q940904) Saravena | 907 km² · 261 m | Cordillera de los Andes, Cordillera Oriental | Su economía se basa en el cacao, el plátano y la ganadería; es una población joven, fundada por colonos en el siglo XX. |
| Tame | [Q2434750](https://www.wikidata.org/wiki/Q2434750) Tame | 65.269 hab. · 1.064 km² · 304 m | Cordillera de los Andes, Cordillera Oriental, Los Llanos | En 1819 allí se reunió el ejército libertador antes de cruzar los Andes, por eso la llaman Cuna de la Libertad. |

## Pack Colombia: departamentos (33)

| Lugar | Wikidata | Cifras | Cerca | Dato curioso |
|---|---|---|---|---|
| Bogotá D. C. | [Q2841](https://www.wikidata.org/wiki/Q2841) Bogotá | 8.034.649 hab. (2024) · 1.578 km² | Plaza de Bolívar de Bogotá, Museo del Oro | Desde 1974, su Ciclovía cierra calles a los carros cada domingo y festivo para que la gente pedalee, corra y camine. |
| Antioquia | [Q123304](https://www.wikidata.org/wiki/Q123304) Antioquia | 6.677.930 hab. (2020) · 63.612 km² | Plaza Botero, Piedra del Peñol, Rionegro | Es la tierra de la bandeja paisa y de la colonización antioqueña, que en el siglo XIX pobló el Eje Cafetero. |
| Valle del Cauca | [Q13990](https://www.wikidata.org/wiki/Q13990) Valle del Cauca | 4.532.152 hab. (2020) · 22.140 km² | Cristo Rey de Cali, Basílica del Señor de los Milagros de Buga, Lago Calima | Allí se celebra el Festival Petronio Álvarez, gran fiesta de la música del Pacífico, y es tierra de salsa y pandebono. |
| Atlántico | [Q230882](https://www.wikidata.org/wiki/Q230882) Atlántico | 2.722.128 hab. (2020) · 3.388 km² | Ventana al Mundo, Estadio Metropolitano Roberto Meléndez, Soledad | Su Carnaval de Barranquilla fue proclamado Obra Maestra del Patrimonio Oral e Inmaterial de la Humanidad en 2003. |
| Bolívar | [Q230597](https://www.wikidata.org/wiki/Q230597) Bolívar | 2.180.976 hab. (2020) · 25.978 km² | Torre del Reloj de Cartagena, Castillo de San Felipe de Barajas, Mompox | Allí está San Basilio de Palenque, cuyo espacio cultural y lengua palenquera fueron reconocidos por la Unesco en 2005. |
| Cundinamarca | [Q232564](https://www.wikidata.org/wiki/Q232564) Cundinamarca | 3.242.999 hab. (2020) · 22.623 km² | Catedral de Sal de Zipaquirá, Parque Jaime Duque, Laguna de Guatavita | Según la tradición, su nombre viene del quechua kuntur marqa, que significa nido del cóndor. |
| Santander | [Q235166](https://www.wikidata.org/wiki/Q235166) Santander | 2.280.908 hab. (2020) · 30.537 km² | Cañón del Chicamocha, Páramo de Santurbán, Barrancabermeja | Es famoso por las hormigas culonas, que se recogen en temporada de lluvias y se comen tostadas como pasabocas. |
| Nariño | [Q230217](https://www.wikidata.org/wiki/Q230217) Nariño | 1.627.589 hab. (2020) · 33.268 km² | Santuario de Las Lajas, Laguna de La Cocha, Volcán Galeras | El cuy asado es su plato tradicional más famoso, y en sus montañas está la laguna de la Cocha, con la isla La Corota. |
| Amazonas | [Q44724](https://www.wikidata.org/wiki/Q44724) Amazonas | 79.020 hab. (2020) · 109.665 km² | Parque Amacayacu, Puerto Nariño | En sus lagos crece la victoria amazónica, un nenúfar gigante cuyas hojas pueden superar el metro de diámetro. |
| La Guajira | [Q272747](https://www.wikidata.org/wiki/Q272747) La Guajira | 965.718 hab. (2020) · 20.848 km² | Punta Gallinas, Maicao, Uribia | Es el territorio de los wayuu, cuyo sistema de justicia, aplicado por el palabrero, es Patrimonio Inmaterial de la Unesco. |
| Magdalena | [Q199910](https://www.wikidata.org/wiki/Q199910) Magdalena | 1.427.026 hab. (2020) · 23.188 km² | Quinta de San Pedro Alejandrino, Ciudad Perdida, Parque Tayrona | En su selva está Ciudad Perdida o Teyuna, construida por los tayronas siglos antes que Machu Picchu. |
| San Andrés y Providencia | [Q26855](https://www.wikidata.org/wiki/Q26855) Archipiélago de San Andrés, Providencia y Santa Catalina | 63.692 hab. (2020) · 53 km² | Providencia | La Reserva de Biosfera Seaflower, declarada por la Unesco en 2000, protege sus extensos arrecifes de coral y manglares. |
| Boyacá | [Q121233](https://www.wikidata.org/wiki/Q121233) Boyacá | 1.242.731 hab. (2020) · 23.189 km² | Basílica de Chiquinquirá, Puente de Boyacá, Sierra Nevada del Cocuy | De sus minas de Muzo y Chivor salen algunas de las esmeraldas más apreciadas del mundo. |
| Caldas | [Q230607](https://www.wikidata.org/wiki/Q230607) Caldas | 1.018.453 hab. (2020) · 7.888 km² | Catedral Basílica de Manizales, La Dorada, Salamina | Honra al sabio Francisco José de Caldas, naturalista que ideó cómo medir la altitud con el punto de ebullición del agua. |
| Risaralda | [Q13993](https://www.wikidata.org/wiki/Q13993) Risaralda | 961.055 hab. (2020) · 3.600 km² | Viaducto César Gaviria Trujillo, Dosquebradas, Santa Rosa de Cabal | Forma parte del Paisaje Cultural Cafetero, que la Unesco inscribió como Patrimonio de la Humanidad en 2011. |
| Quindío | [Q13995](https://www.wikidata.org/wiki/Q13995) Quindío | 555.401 hab. (2020) · 1.845 km² | Parque del Café, Valle de Cocora, Salento | El Tesoro de los Quimbayas, joyas de oro de esta cultura prehispánica, se regaló a España en 1893 y hoy está en Madrid. |
| Tolima | [Q234501](https://www.wikidata.org/wiki/Q234501) Tolima | 1.339.998 hab. (2020) · 23.562 km² | Nevado del Tolima, Nevado del Ruiz, Melgar | Su plato insignia es el tamal tolimense, envuelto en hoja de plátano con arroz, arveja, pollo, cerdo y huevo. |
| Huila | [Q234920](https://www.wikidata.org/wiki/Q234920) Huila | 1.122.622 hab. (2020) · 19.890 km² | Parque Arqueológico de San Agustín, Desierto de la Tatacoa, Pitalito | Desde hace años es el departamento que más café produce en Colombia, con cafés especiales muy premiados. |
| Cauca | [Q230602](https://www.wikidata.org/wiki/Q230602) Cauca | 1.491.937 hab. (2020) · 29.308 km² | Morro de Tulcán, Tierradentro, Isla Gorgona | Allí está Tierradentro, con tumbas subterráneas pintadas, Patrimonio de la Humanidad desde 1995. |
| Córdoba | [Q234912](https://www.wikidata.org/wiki/Q234912) Córdoba | 1.828.947 hab. (2020) · 25.020 km² | Lorica, Sahagún, Montelíbano | Allí se teje el sombrero vueltiao, símbolo cultural de Colombia, con fibra de caña flecha. |
| Meta | [Q238629](https://www.wikidata.org/wiki/Q238629) Meta | 1.062.454 hab. (2020) · 85.635 km² | Caño Cristales, Serranía de La Macarena, San José del Guaviare | Sus cantos de trabajo de llano, con los que los vaqueros guían al ganado, son Patrimonio Inmaterial de la Unesco desde 2017. |
| Norte de Santander | [Q233058](https://www.wikidata.org/wiki/Q233058) Norte de Santander | 1.620.318 hab. (2020) · 21.658 km² | Templo Histórico de Cúcuta, Pamplona, Ocaña | Se creó en 1910 al dividirse el antiguo departamento de Santander, nombre que honra al prócer Francisco de Paula Santander. |
| Cesar | [Q234916](https://www.wikidata.org/wiki/Q234916) Cesar | 1.295.387 hab. (2020) · 22.905 km² | Ciénaga de Zapatosa, Aguachica, Agustín Codazzi | Fue creado en 1967 y es uno de los mayores productores de carbón y palma de aceite de Colombia. |
| Chocó | [Q230584](https://www.wikidata.org/wiki/Q230584) Chocó | 544.767 hab. (2021) · 46.530 km² | Serranía del Baudó, Bahía Solano, Istmina | Es una de las regiones más lluviosas del planeta: en algunos de sus pueblos llueve casi todos los días del año. |
| Sucre | [Q235188](https://www.wikidata.org/wiki/Q235188) Sucre | 949.252 hab. (2020) · 10.917 km² | Tolú, Coveñas, Corozal | Su nombre honra al mariscal Antonio José de Sucre, y se creó en 1966 al separarse del departamento de Bolívar. |
| Caquetá | [Q13985](https://www.wikidata.org/wiki/Q13985) Caquetá | 410.521 hab. (2020) · 88.965 km² | Parque Chiribiquete, San Vicente del Caguán | Allí está buena parte del Parque Nacional Chiribiquete, con miles de pinturas rupestres, Patrimonio Mundial desde 2018. |
| Putumayo | [Q232953](https://www.wikidata.org/wiki/Q232953) Putumayo | 359.127 hab. (2020) · 24.885 km² | Puerto Asís, Sibundoy | En sus bosques crece el mopa-mopa, cuya resina usan los artesanos del barniz de Pasto, oficio reconocido por la Unesco. |
| Casanare | [Q13984](https://www.wikidata.org/wiki/Q13984) Casanare | 435.195 hab. (2020) · 44.995 km² | Aguazul, Paz de Ariporo | Allí se descubrieron en los años noventa los campos petroleros de Cusiana y Cupiagua, claves para la economía del país. |
| Arauca | [Q230223](https://www.wikidata.org/wiki/Q230223) Arauca | 294.206 hab. (2020) · 23.818 km² | Saravena, Tame | En 1983 se descubrió allí el campo petrolero Caño Limón, uno de los hallazgos más importantes de la historia de Colombia. |
| Guainía | [Q238645](https://www.wikidata.org/wiki/Q238645) Guainía | 50.636 hab. (2020) · 72.238 km² |  | Allí se alzan los cerros de Mavecure, tres enormes moles de granito que dominan el paisaje de selva y río. |
| Vaupés | [Q234505](https://www.wikidata.org/wiki/Q234505) Vaupés | 44.712 hab. (2020) · 54.135 km² |  | Los saberes de los jaguares de Yuruparí, chamanes del río Pirá Paraná, son Patrimonio Inmaterial de la Unesco desde 2011. |
| Vichada | [Q268729](https://www.wikidata.org/wiki/Q268729) Departamento del Vichada | 112.958 hab. (2020) · 100.242 km² | Cumaribo | El Parque Nacional El Tuparro, con raudales y grandes rocas de granito, es Reserva de Biosfera de la Unesco. |
| Guaviare | [Q272885](https://www.wikidata.org/wiki/Q272885) Guaviare | 73.081 hab. (2018) · 53.460 km² |  | Allí vive el pueblo nukak, uno de los últimos pueblos nómadas de Colombia, que entró en contacto con el país en 1988. |

## Packs Pro: ciudades (425)

| Lugar | Wikidata | Cifras | Cerca | Dato curioso |
|---|---|---|---|---|
| Lima | [Q2868](https://www.wikidata.org/wiki/Q2868) Lima | 9.943.800 hab. (2022) · 2.672 km² · 154 m | Cordillera de los Andes |  |
| Caracas | [Q1533](https://www.wikidata.org/wiki/Q1533) Caracas | 2.245.744 hab. (2017) · 776 km² · 920 m | Cordillera Oriental |  |
| Quito | [Q2900](https://www.wikidata.org/wiki/Q2900) Quito | 1.763.275 hab. (2022) · 372 km² · 2.850 m | Mitad del Mundo, Cordillera de los Andes, Cordillera Occidental |  |
| La Paz | [Q1491](https://www.wikidata.org/wiki/Q1491) La Paz | 755.732 hab. (2024) · 472 km² · 3.640 m | Cordillera de los Andes, Altiplano andino |  |
| Sucre | [Q2907](https://www.wikidata.org/wiki/Q2907) Sucre | 360.544 hab. (2021) · 1.768 km² · 2.810 m | Cordillera de los Andes, Amazonia |  |
| Guayaquil | [Q43509](https://www.wikidata.org/wiki/Q43509) Guayaquil | 2.650.288 hab. (2022) · 354 km² · 4 m | Cordillera de los Andes |  |
| Santa Cruz | [Q170688](https://www.wikidata.org/wiki/Q170688) Santa Cruz de la Sierra | 3.122.605 hab. (2024) · 535 km² · 416 m | Amazonia |  |
| Maracaibo | [Q171632](https://www.wikidata.org/wiki/Q171632) Maracaibo | 1.551.539 hab. (2011) · 1.393 km² · 6 m | Mar Caribe, Lago de Maracaibo |  |
| Valencia | [Q54880](https://www.wikidata.org/wiki/Q54880) Valencia | 1.484.430 hab. (2011) · 119 km² · 520 m | Cordillera Oriental |  |
| Barquisimeto | [Q4709](https://www.wikidata.org/wiki/Q4709) Barquisimeto | 1.059.092 hab. (2011) · 2.760 km² · 566 m | Cordillera Oriental |  |
| Maracay | [Q333928](https://www.wikidata.org/wiki/Q333928) Maracay | 1.102.088 hab. (2011) · 912 km² · 713 m | Cordillera Oriental |  |
| Cochabamba | [Q183124](https://www.wikidata.org/wiki/Q183124) Cochabamba | 632.013 hab. (2012) · 157 km² · 2.558 m | Cordillera de los Andes, Amazonia |  |
| Callao | [Q105037](https://www.wikidata.org/wiki/Q105037) Callao | 537.377 hab. (2023) · 147 km² · 5 m | Cordillera de los Andes |  |
| Arequipa | [Q159273](https://www.wikidata.org/wiki/Q159273) Arequipa | 1.008.290 hab. (2017) · 650 km² · 2.335 m | Cordillera de los Andes |  |
| Trujillo | [Q214173](https://www.wikidata.org/wiki/Q214173) Trujillo | 1.148.668 hab. (2022) · 34 m | Chan Chan, Cordillera de los Andes |  |
| Ciudad Guayana | [Q507080](https://www.wikidata.org/wiki/Q507080) Ciudad Guayana | 751.331 hab. (2011) · 411 km² · 13 m | Río Orinoco, Macizo Guayanés |  |
| Barcelona | [Q391221](https://www.wikidata.org/wiki/Q391221)  | 550.122 hab. (2023) · 706 km² · 20 m | Cordillera Oriental, Mar Caribe |  |
| Chiclayo | [Q260911](https://www.wikidata.org/wiki/Q260911) Chiclayo | 552.508 hab. (2017) · 6.211 km² · 27 m |  |  |
| Puerto la Cruz | [Q379509](https://www.wikidata.org/wiki/Q379509) Puerto La Cruz | 306.261 hab. (2013) · 244 km² · 10 m | Cordillera Oriental, Mar Caribe |  |
| Iquitos | [Q193289](https://www.wikidata.org/wiki/Q193289) Iquitos | 377.609 hab. (2017) · 1.213 km² · 106 m | Amazonia, Río Amazonas |  |
| Cabimas | [Q723588](https://www.wikidata.org/wiki/Q723588) Cabimas | 351.735 hab. (2013) · 157 km² · 3 m | Lago de Maracaibo |  |
| San Cristóbal | [Q820235](https://www.wikidata.org/wiki/Q820235) San Cristóbal | 285.872 hab. (2017) · 247 km² · 860 m | Templo Histórico de Cúcuta, Cordillera Oriental |  |
| Huancayo | [Q468782](https://www.wikidata.org/wiki/Q468782) Huancayo | 450.900 hab. (2022) · 319 km² · 3.271 m | Cordillera de los Andes |  |
| Maturín | [Q842779](https://www.wikidata.org/wiki/Q842779) Maturín | 753.254 hab. (2023) · 465 km² · 67 m | Los Llanos |  |
| Piura | [Q223966](https://www.wikidata.org/wiki/Q223966) Piura | 473.025 hab. (2017) · 621 km² · 34 m |  |  |
| Cusco | [Q5582862](https://www.wikidata.org/wiki/Q5582862) Cusco | 428.450 hab. (2017) · 385 km² · 3.399 m | Sacsayhuamán, Cordillera de los Andes, Amazonia |  |
| Chimbote | [Q518431](https://www.wikidata.org/wiki/Q518431) Chimbote | 395.100 hab. (2022) · 52 m | Cordillera de los Andes |  |
| Mérida | [Q23551](https://www.wikidata.org/wiki/Q23551) Mérida | 248.192 hab. (2013) · 25 km² · 1.630 m | Cordillera Oriental |  |
| Ciudad Bolívar | [Q26906](https://www.wikidata.org/wiki/Q26906) Ciudad Bolívar | 567.953 hab. (2018) · 399 km² · 54 m | Río Orinoco, Macizo Guayanés, Los Llanos |  |
| Cumaná | [Q319476](https://www.wikidata.org/wiki/Q319476) Cumaná | 374.706 hab. (2013) · 598 km² · 43 m | Cordillera Oriental, Mar Caribe |  |
| Maiquetía | [Q1677956](https://www.wikidata.org/wiki/Q1677956) Maiquetía | 87.909 hab. (2011) · 22 km² · 19 m | Mar Caribe, Cordillera Oriental |  |
| Pucallpa | [Q217071](https://www.wikidata.org/wiki/Q217071) Pucallpa | 326.040 hab. (2017) · 29 km² · 154 m | Amazonia |  |
| Los Teques | [Q695631](https://www.wikidata.org/wiki/Q695631) Los Teques | 332.725 hab. (2023) · 1.200 m | Cordillera Oriental |  |
| Cuenca | [Q54886](https://www.wikidata.org/wiki/Q54886) Cuenca | 361.524 hab. (2022) · 71 km² · 2.550 m | Cordillera de los Andes, Cordillera Central |  |
| Barinas | [Q695623](https://www.wikidata.org/wiki/Q695623) Barinas | 873.962 hab. (2018) · 30 km² · 187 m | Los Llanos |  |
| Ambato | [Q210161](https://www.wikidata.org/wiki/Q210161) Ambato | 177.316 hab. (2022) · 47 km² · 2.580 m | Cordillera de los Andes, Cordillera Central |  |
| Tacna | [Q272795](https://www.wikidata.org/wiki/Q272795) Tacna | 286.240 hab. (2017) · 552 m | Cordillera de los Andes |  |
| Ica | [Q840712](https://www.wikidata.org/wiki/Q840712) Ica | 282.407 hab. (2017) · 406 m | Cordillera de los Andes |  |
| Acarigua | [Q338059](https://www.wikidata.org/wiki/Q338059) Acarigua | 195.637 hab. (2011) · 175 km² · 195 m |  |  |
| Oruro | [Q35246](https://www.wikidata.org/wiki/Q35246) Oruro | 297.497 hab. (2020) · 1.633 km² · 3.710 m | Cordillera de los Andes, Altiplano andino, Lago Poopó |  |
| Juliaca | [Q696074](https://www.wikidata.org/wiki/Q696074) Juliaca | 307.417 hab. (2020) · 3.825 m | Cordillera de los Andes, Altiplano andino |  |
| Punto Fijo | [Q1020279](https://www.wikidata.org/wiki/Q1020279) Punto Fijo | 287.558 hab. (2012) · 14 m | Mar Caribe |  |
| Santa Ana | [Q1819433](https://www.wikidata.org/wiki/Q1819433) Santa Ana del Yacuma | 12.783 hab. (2008) · 144 m | Amazonia |  |
| Quillacollo | [Q1002090](https://www.wikidata.org/wiki/Q1002090) Quillacollo | 137.182 hab. (2012) · 1.650 km² · 2.425 m | Cordillera de los Andes, Amazonia |  |
| Portoviejo | [Q990716](https://www.wikidata.org/wiki/Q990716) Portoviejo | 244.129 hab. (2022) · 47 km² · 53 m | Cordillera de los Andes |  |
| Machala | [Q215080](https://www.wikidata.org/wiki/Q215080) Machala | 288.072 hab. (2022) · 60 km² · 6 m | Cordillera de los Andes |  |
| El Tigre | [Q1020297](https://www.wikidata.org/wiki/Q1020297) El Tigre | 213.524 hab. (2020) · 309 km² · 265 m | Los Llanos |  |
| Porlamar | [Q953449](https://www.wikidata.org/wiki/Q953449) Porlamar | 120.924 hab. (2018) · 10 m | Mar Caribe, Antillas Menores |  |
| Coro | [Q1134454](https://www.wikidata.org/wiki/Q1134454) Coro | 265.569 hab. (2020) · 44 km² · 17 m | Cordillera Oriental |  |
| Valera | [Q1010367](https://www.wikidata.org/wiki/Q1010367) Valera | 250.000 hab. (2018) · 226 km² · 650 m | Cordillera Oriental |  |
| Manta | [Q990738](https://www.wikidata.org/wiki/Q990738) Manta | 258.697 hab. (2022) · 60 km² · 6 m |  |  |
| Potosí | [Q35045](https://www.wikidata.org/wiki/Q35045) Potosí | 189.652 hab. (2012) · 118 km² · 4.070 m | Cordillera de los Andes |  |
| Sangolquí | [Q2361658](https://www.wikidata.org/wiki/Q2361658) Sangolquí | 96.647 hab. (2022) · 58 km² · 2.500 m | Mitad del Mundo, Cordillera de los Andes, Cordillera Occidental |  |
| Puerto Cabello | [Q995695](https://www.wikidata.org/wiki/Q995695) Puerto Cabello | 209.080 hab. (2011) · 729 km² · 10 m | Cordillera Oriental, Mar Caribe |  |
| Esmeraldas | [Q149955](https://www.wikidata.org/wiki/Q149955) Esmeraldas | 155.487 hab. (2022) · 28 km² · 15 m |  |  |
| Riobamba | [Q478675](https://www.wikidata.org/wiki/Q478675) Riobamba | 177.213 hab. (2022) · 40 km² · 2.750 m | Cordillera de los Andes, Cordillera Central |  |
| Ayacucho | [Q504215](https://www.wikidata.org/wiki/Q504215) Ayacucho | 216.444 hab. (2017) · 2.981 km² · 2.761 m | Cordillera de los Andes |  |
| Ocumare del Tuy | [Q1972757](https://www.wikidata.org/wiki/Q1972757) Ocumare del Tuy | 150.000 hab. (2016) · 150 m | Cordillera Oriental |  |
| Sullana | [Q510413](https://www.wikidata.org/wiki/Q510413) Sullana | 162.434 hab. (2007) · 60 m |  |  |
| Tarija | [Q35004](https://www.wikidata.org/wiki/Q35004) Tarija | 179.528 hab. (2012) · 1.860 m | Cordillera de los Andes |  |
| Huánuco | [Q504394](https://www.wikidata.org/wiki/Q504394) Huánuco | 196.627 hab. (2017) · 1.880 m | Cordillera de los Andes, Amazonia |  |
| Chincha Alta | [Q990685](https://www.wikidata.org/wiki/Q990685) Chincha Alta | 63.671 hab. (2015) · 2.988 km² · 97 m | Cordillera de los Andes |  |
| Guanare | [Q733005](https://www.wikidata.org/wiki/Q733005) Guanare | 192.644 hab. (2011) · 20 km² · 183 m | Cordillera Oriental |  |
| Carora | [Q1044689](https://www.wikidata.org/wiki/Q1044689) Carora | 112.600 hab. (2005) · 419 m | Cordillera Oriental |  |
| Ibarra | [Q946384](https://www.wikidata.org/wiki/Q946384) Ibarra | 157.941 hab. (2022) · 42 km² · 2.225 m | Cordillera de los Andes, Cordillera Occidental |  |
| Cajamarca | [Q205119](https://www.wikidata.org/wiki/Q205119) Cajamarca | 201.329 hab. (2017) · 392 km² · 2.750 m | Cordillera de los Andes |  |
| Cerro de Pasco | [Q674320](https://www.wikidata.org/wiki/Q674320) Cerro de Pasco | 58.899 hab. (2017) · 4.330 m | Cordillera de los Andes |  |
| Loja | [Q944697](https://www.wikidata.org/wiki/Q944697) Loja | 203.496 hab. (2022) · 52 km² · 2.060 m | Cordillera de los Andes |  |
| Carúpano | [Q153511](https://www.wikidata.org/wiki/Q153511) Carúpano | 173.877 hab. (2010) · 203 km² · 10 m | Cordillera Oriental, Mar Caribe |  |
| San Fernando de Apure | [Q990764](https://www.wikidata.org/wiki/Q990764) San Fernando de Apure | 194.274 hab. (2018) · 5.982 km² · 51 m | Los Llanos |  |
| Anaco | [Q1897488](https://www.wikidata.org/wiki/Q1897488) Anaco | 162.704 hab. (2018) · 221 m | Los Llanos |  |
| Calabozo | [Q1026185](https://www.wikidata.org/wiki/Q1026185) Calabozo | 190.622 hab. (2026) · 138 km² · 105 m | Los Llanos |  |
| Puno | [Q232842](https://www.wikidata.org/wiki/Q232842) Puno | 128.637 hab. (2017) · 3.830 m | Cordillera de los Andes, Lago Titicaca, Altiplano andino |  |
| Milagro | [Q773238](https://www.wikidata.org/wiki/Q773238) Milagro | 159.970 hab. (2022) · 30 km² · 12 m | Cordillera de los Andes |  |
| Tumbes | [Q827640](https://www.wikidata.org/wiki/Q827640) Tumbes | 96.946 hab. (2017) · 6 m |  |  |
| Latacunga | [Q379338](https://www.wikidata.org/wiki/Q379338) Latacunga | 77.267 hab. (2022) · 34 km² · 2.770 m | Cordillera de los Andes, Cordillera Occidental, Cordillera Central |  |
| San Juan De Los Morros | [Q999117](https://www.wikidata.org/wiki/Q999117) San Juan de Los Morros | 120.111 hab. (2011) · 247 km² · 512 m | Cordillera Oriental |  |
| Huaraz | [Q793809](https://www.wikidata.org/wiki/Q793809) Huaraz | 118.836 hab. (2017) · 370 km² · 3.052 m | Cordillera de los Andes |  |
| Trinidad | [Q34986](https://www.wikidata.org/wiki/Q34986) Trinidad | 124.357 hab. (2024) · 27 km² · 130 m | Amazonia |  |
| Tulcán | [Q752113](https://www.wikidata.org/wiki/Q752113) Tulcán | 56.719 hab. (2022) · 15 km² · 2.980 m | Santuario de Las Lajas, Cordillera de los Andes, Cordillera Occidental |  |
| San Carlos | [Q995718](https://www.wikidata.org/wiki/Q995718) San Carlos | 120.000 hab. (2001) · 152 m | Cordillera Oriental |  |
| San Felipe | [Q965754](https://www.wikidata.org/wiki/Q965754) San Felipe | 220.786 hab. (2001) · 715 km² · 800 m | Cordillera Oriental |  |
| Babahoyo | [Q797568](https://www.wikidata.org/wiki/Q797568) Babahoyo | 98.251 hab. (2022) · 10 km² · 8 m | Cordillera de los Andes |  |
| Azogues | [Q786758](https://www.wikidata.org/wiki/Q786758) Azogues | 35.763 hab. (2022) · 13 km² · 2.518 m | Ingapirca, Cordillera de los Andes, Cordillera Central |  |
| Puerto Maldonado | [Q541435](https://www.wikidata.org/wiki/Q541435) Puerto Maldonado | 85.024 hab. (2017) · 183 m | Amazonia |  |
| Abancay | [Q215238](https://www.wikidata.org/wiki/Q215238) Abancay | 72.277 hab. (2017) · 2.500 m | Cordillera de los Andes |  |
| Moquegua | [Q1000346](https://www.wikidata.org/wiki/Q1000346) Moquegua | 69.882 hab. (2017) · 1.410 m | Cordillera de los Andes |  |
| Puerto Ayacucho | [Q372920](https://www.wikidata.org/wiki/Q372920) Puerto Ayacucho |  | Río Orinoco, Los Llanos, Macizo Guayanés |  |
| Tucupita | [Q179007](https://www.wikidata.org/wiki/Q179007) Tucupita | 86.487 hab. · 7 km² · 5 m | Río Orinoco |  |
| Trujillo | [Q1020535](https://www.wikidata.org/wiki/Q1020535) Trujillo | 38.110 hab. · 413 km² · 1.170 m | Cordillera Oriental |  |
| Moyobamba | [Q285672](https://www.wikidata.org/wiki/Q285672) Moyobamba | 64.126 hab. (2019) · 860 m | Cordillera de los Andes, Amazonia |  |
| Cobija | [Q34995](https://www.wikidata.org/wiki/Q34995) Cobija | 78.555 hab. (2020) · 401 km² · 205 m | Amazonia |  |
| Huancavelica | [Q1000333](https://www.wikidata.org/wiki/Q1000333) Huancavelica | 49.570 hab. (2017) · 514 km² · 3.676 m | Cordillera de los Andes |  |
| Huaura | [Q16576408](https://www.wikidata.org/wiki/Q16576408) Huaura | 24.668 hab. (2020) · 30 m | Caral, Cordillera de los Andes |  |
| La Asunción | [Q860689](https://www.wikidata.org/wiki/Q860689) La Asunción | 117.513 hab. (2011) · 42 m | Mar Caribe, Antillas Menores |  |
| Tena | [Q994312](https://www.wikidata.org/wiki/Q994312) Tena | 29.724 hab. (2022) · 7 km² · 510 m | Cordillera de los Andes, Amazonia, Cordillera Central |  |
| Guaranda | [Q264464](https://www.wikidata.org/wiki/Q264464) Guaranda | 30.755 hab. (2022) · 202 km² · 2.668 m | Cordillera de los Andes, Cordillera Occidental |  |
| Chachapoyas | [Q757133](https://www.wikidata.org/wiki/Q757133) Chachapoyas | 32.026 hab. (2017) · 154 km² · 2.483 m | Kuélap, Cordillera de los Andes, Amazonia |  |
| Puyo | [Q676931](https://www.wikidata.org/wiki/Q676931) Puyo | 33.325 hab. (2022) · 14 km² · 950 m | Cordillera de los Andes, Amazonia, Cordillera Central |  |
| Macas | [Q1014554](https://www.wikidata.org/wiki/Q1014554) Macas | 22.398 hab. (2022) · 12 km² · 1.030 m | Cordillera de los Andes, Amazonia |  |
| Zamora | [Q2283736](https://www.wikidata.org/wiki/Q2283736) Zamora | 17.584 hab. (2022) · 5 km² · 920 m | Cordillera de los Andes |  |
| Puerto Baquerizo Moreno | [Q694109](https://www.wikidata.org/wiki/Q694109) Puerto Baquerizo Moreno | 7.290 hab. (2022) · 4 km² · 15 m | Islas Galápagos |  |
| Buenos Aires | [Q1486](https://www.wikidata.org/wiki/Q1486) Buenos Aires | 3.121.707 hab. (2022) · 203 km² · 25 m | Obelisco de Buenos Aires, Casa Rosada, La Pampa |  |
| Santiago | [Q2887](https://www.wikidata.org/wiki/Q2887) Santiago de Chile | 6.257.516 hab. (2017) · 838 km² · 575 m | Palacio de La Moneda, Cordillera de los Andes |  |
| Asunción | [Q2933](https://www.wikidata.org/wiki/Q2933) Asunción | 462.241 hab. (2022) · 117 km² · 43 m | Río Paraná, Gran Chaco |  |
| Montevideo | [Q1335](https://www.wikidata.org/wiki/Q1335) Montevideo | 1.302.954 hab. (2023) · 730 km² · 41 m | Palacio Salvo, Río de la Plata |  |
| Córdoba | [Q44210](https://www.wikidata.org/wiki/Q44210) Córdoba | 1.505.250 hab. (2022) · 576 km² · 390 m | La Pampa |  |
| Rosario | [Q52535](https://www.wikidata.org/wiki/Q52535) Rosario | 1.037.710 hab. (2022) · 179 km² · 31 m | Río Paraná, La Pampa |  |
| Mendoza | [Q44237](https://www.wikidata.org/wiki/Q44237) Mendoza | 127.160 hab. (2022) · 54 km² · 769 m | Cordillera de los Andes, Patagonia |  |
| Concepción | [Q1880](https://www.wikidata.org/wiki/Q1880) Concepción | 217.537 hab. (2017) · 43 km² · 12 m |  |  |
| Valparaíso | [Q33986](https://www.wikidata.org/wiki/Q33986) Valparaíso | 296.655 hab. (2017) · 48 km² · 21 m | Cordillera de los Andes |  |
| Tucumán | [Q44255](https://www.wikidata.org/wiki/Q44255) San Miguel de Tucumán | 601.888 hab. (2022) · 90 km² · 431 m | Cordillera de los Andes |  |
| La Plata | [Q44059](https://www.wikidata.org/wiki/Q44059) La Plata | 220.184 hab. (2022) · 27 km² · 26 m | La Pampa |  |
| Mar del Plata | [Q52607](https://www.wikidata.org/wiki/Q52607) Mar del Plata | 593.337 hab. (2010) · 79 km² · 38 m | La Pampa |  |
| Salta | [Q36307](https://www.wikidata.org/wiki/Q36307) Salta | 594.772 hab. (2022) · 1.152 m | Cordillera de los Andes |  |
| Viña del Mar | [Q184345](https://www.wikidata.org/wiki/Q184345) Viña del Mar | 332.875 hab. (2017) · 121 km² · 2 m | Cordillera de los Andes |  |
| San Lorenzo | [Q938739](https://www.wikidata.org/wiki/Q938739) San Lorenzo | 225.395 hab. (2022) · 56 km² · 126 m | Gran Chaco |  |
| Santa Fe | [Q44244](https://www.wikidata.org/wiki/Q44244) Santa Fe | 408.572 hab. (2022) · 268 km² · 25 m | La Pampa, Gran Chaco |  |
| San Juan | [Q44241](https://www.wikidata.org/wiki/Q44241) San Juan | 471.389 hab. (2010) · 30 km² · 640 m | Cordillera de los Andes |  |
| San Luis | [Q44243](https://www.wikidata.org/wiki/Q44243) San Luis | 206.921 hab. (2022) · 709 m | La Pampa |  |
| Resistencia | [Q44206](https://www.wikidata.org/wiki/Q44206) Resistencia | 298.611 hab. (2022) · 562 km² · 50 m | Gran Chaco |  |
| Encarnación | [Q47138](https://www.wikidata.org/wiki/Q47138) Encarnación | 106.842 hab. (2022) · 321 km² · 91 m | Río Paraná, Altiplano Brasileño |  |
| Posadas | [Q44238](https://www.wikidata.org/wiki/Q44238) Posadas | 328.879 hab. (2022) · 965 km² · 120 m | Río Paraná, Altiplano Brasileño |  |
| Santiago del Estero | [Q44253](https://www.wikidata.org/wiki/Q44253) Ciudad de Santiago del Estero | 311.487 hab. (2022) · 2.116 km² · 182 m | La Pampa |  |
| Corrientes | [Q44211](https://www.wikidata.org/wiki/Q44211) Corrientes | 430.170 hab. (2022) · 90 km² · 52 m | Río Paraná, Gran Chaco |  |
| Ciudad del Este | [Q192235](https://www.wikidata.org/wiki/Q192235) Ciudad del Este | 350.000 hab. (2024) · 149 km² · 185 m | Río Paraná, Cataratas del Iguazú, Altiplano Brasileño |  |
| Antofagasta | [Q3612](https://www.wikidata.org/wiki/Q3612) Antofagasta | 348.517 hab. (2017) · 56 km² · 40 m | Cordillera de los Andes, Desierto de Atacama |  |
| San Salvador de Jujuy | [Q44217](https://www.wikidata.org/wiki/Q44217) San Salvador de Jujuy | 312.446 hab. (2022) · 25 km² · 1.201 m | Cordillera de los Andes |  |
| Talcahuano | [Q41997](https://www.wikidata.org/wiki/Q41997) Talcahuano | 147.831 hab. (2017) · 47 km² · 1 m |  |  |
| Bahía Blanca | [Q54108](https://www.wikidata.org/wiki/Q54108) Bahía Blanca | 299.000 hab. (2019) · 130 km² · 20 m | La Pampa |  |
| Temuco | [Q82128](https://www.wikidata.org/wiki/Q82128) Temuco | 282.415 hab. (2017) · 50 km² · 360 m |  |  |
| Paraná | [Q44213](https://www.wikidata.org/wiki/Q44213) Paraná | 271.304 hab. (2022) · 137 km² · 66 m | Río Paraná, Gran Chaco |  |
| San Bernardo | [Q56136](https://www.wikidata.org/wiki/Q56136) San Bernardo | 301.313 hab. (2017) · 155 km² · 570 m | Palacio de La Moneda, Cordillera de los Andes |  |
| Neuquén | [Q44239](https://www.wikidata.org/wiki/Q44239) Neuquén | 288.896 hab. (2022) · 63 km² · 270 m | Patagonia |  |
| Rancagua | [Q4582](https://www.wikidata.org/wiki/Q4582) Rancagua | 231.370 hab. (2017) · 53 km² · 572 m | Cordillera de los Andes |  |
| Iquique | [Q14440](https://www.wikidata.org/wiki/Q14440) Iquique | 188.003 hab. (2017) · 21 km² · 1 m | Cordillera de los Andes, Desierto de Atacama |  |
| Formosa | [Q44214](https://www.wikidata.org/wiki/Q44214) Formosa | 264.452 hab. (2022) · 75 km² · 57 m | Río Paraná, Gran Chaco |  |
| Rivera | [Q646498](https://www.wikidata.org/wiki/Q646498) Rivera | 82.602 hab. (2023) · 40 km² · 223 m |  |  |
| Talca | [Q4469](https://www.wikidata.org/wiki/Q4469) Talca | 232.131 hab. (2024) · 50 km² · 102 m |  |  |
| Catamarca | [Q44162](https://www.wikidata.org/wiki/Q44162) San Fernando del Valle de Catamarca | 186.947 hab. (2022) · 399 km² · 500 m | Cordillera de los Andes, La Pampa |  |
| Arica | [Q2203](https://www.wikidata.org/wiki/Q2203) Arica | 202.131 hab. (2017) · 44 km² · 2 m | Cordillera de los Andes, Desierto de Atacama |  |
| Puerto Montt | [Q36214](https://www.wikidata.org/wiki/Q36214) Puerto Montt | 169.736 hab. (2017) · 51 km² · 14 m |  |  |
| La Rioja | [Q44236](https://www.wikidata.org/wiki/Q44236) La Rioja | 211.651 hab. (2022) · 14 km² · 498 m | Cordillera de los Andes |  |
| Coquimbo | [Q3871](https://www.wikidata.org/wiki/Q3871) Coquimbo | 204.068 hab. (2017) · 53 km² · 15 m | Cordillera de los Andes |  |
| Valdivia | [Q160687](https://www.wikidata.org/wiki/Q160687) Valdivia | 150.048 hab. (2017) · 46 km² · 5 m |  |  |
| Punta del Este | [Q56069](https://www.wikidata.org/wiki/Q56069) Punta del Este | 9.277 hab. (2011) · 20 km² · 11 m | La Mano de Punta del Este, Río de la Plata |  |
| La Serena | [Q14467](https://www.wikidata.org/wiki/Q14467) La Serena | 195.382 hab. (2017) · 54 km² · 28 m | Cordillera de los Andes |  |
| Osorno | [Q51059](https://www.wikidata.org/wiki/Q51059) Osorno | 147.460 hab. (2017) · 951 km² · 39 m |  |  |
| Río Cuarto | [Q983451](https://www.wikidata.org/wiki/Q983451) Río Cuarto | 182.038 hab. (2022) · 64 km² · 425 m | La Pampa |  |
| Chillán | [Q3774](https://www.wikidata.org/wiki/Q3774) Chillán | 190.382 hab. (2024) · 38 km² · 124 m |  |  |
| Los Angeles | [Q16910](https://www.wikidata.org/wiki/Q16910) Los Ángeles | 143.023 hab. (2017) · 30 km² · 139 m |  |  |
| Concordia | [Q52578](https://www.wikidata.org/wiki/Q52578) Concordia | 180.325 hab. (2022) · 3.259 km² · 21 m | Río Uruguay |  |
| Calama | [Q3685](https://www.wikidata.org/wiki/Q3685) Calama | 157.575 hab. (2017) · 34 km² · 2.260 m | Cordillera de los Andes, Desierto de Atacama |  |
| Comodoro Rivadavia | [Q221921](https://www.wikidata.org/wiki/Q221921) Comodoro Rivadavia | 201.854 hab. (2022) · 548 km² · 61 m | Patagonia |  |
| Copiapó | [Q3868](https://www.wikidata.org/wiki/Q3868) Copiapó | 150.804 hab. (2017) · 34 km² · 383 m | Cordillera de los Andes, Desierto de Atacama |  |
| San Nicolas | [Q377965](https://www.wikidata.org/wiki/Q377965) San Nicolás de los Arroyos | 159.978 hab. (2022) · 17 m | Río Paraná, La Pampa |  |
| Punta Arenas | [Q51599](https://www.wikidata.org/wiki/Q51599) Punta Arenas | 123.403 hab. (2017) · 38 km² · 34 m | Patagonia, Estrecho de Magallanes |  |
| San Martín | [Q1806934](https://www.wikidata.org/wiki/Q1806934) San Martín | 1.504 km² · 770 m | Patagonia |  |
| Curicó | [Q13030](https://www.wikidata.org/wiki/Q13030) Curicó | 136.954 hab. (2020) · 34 km² · 228 m | Cordillera de los Andes |  |
| Santa Rosa | [Q44215](https://www.wikidata.org/wiki/Q44215) Santa Rosa | 117.201 hab. (2022) · 1.500 km² · 179 m | La Pampa |  |
| San Rafael | [Q23044](https://www.wikidata.org/wiki/Q23044) San Rafael | 215.020 hab. (2022) · 650 m | Patagonia |  |
| Salto | [Q335506](https://www.wikidata.org/wiki/Q335506) Salto | 112.527 hab. (2023) · 37 km² · 48 m | Río Uruguay |  |
| Tandil | [Q1000336](https://www.wikidata.org/wiki/Q1000336) Tandil | 150.162 hab. (2022) · 52 km² · 188 m | La Pampa |  |
| San Antonio | [Q56135](https://www.wikidata.org/wiki/Q56135) San Antonio | 86.239 hab. (2017) · 22 km² · 4 m | Cordillera de los Andes |  |
| Pedro Juan Caballero | [Q849292](https://www.wikidata.org/wiki/Q849292) Pedro Juan Caballero | 127.437 hab. (2022) · 3.698 km² · 607 m | Altiplano Brasileño |  |
| Coronel Oviedo | [Q935504](https://www.wikidata.org/wiki/Q935504) Coronel Oviedo | 187.514 hab. · 876 km² · 171 m | Altiplano Brasileño |  |
| Río Gallegos | [Q44242](https://www.wikidata.org/wiki/Q44242) Río Gallegos | 115.585 hab. (2022) · 6 m | Patagonia |  |
| Paysandú | [Q309442](https://www.wikidata.org/wiki/Q309442) Paysandú | 81.489 hab. (2023) · 21 km² · 34 m | Río Uruguay |  |
| San Fernando | [Q187807](https://www.wikidata.org/wiki/Q187807) San Fernando | 58.367 hab. (2017) · 12 km² · 340 m | Cordillera de los Andes |  |
| Viedma | [Q44240](https://www.wikidata.org/wiki/Q44240) Viedma | 59.993 hab. (2022) · 9 km² · 12 m | Patagonia |  |
| Concepción | [Q840962](https://www.wikidata.org/wiki/Q840962) Concepción | 45.068 hab. (2002) · 1.092 km² · 44 m | Río Paraná, Altiplano Brasileño |  |
| Ushuaia | [Q44254](https://www.wikidata.org/wiki/Q44254) Ushuaia | 82.615 hab. (2022) · 23 km² · 23 m | Faro del Fin del Mundo, Patagonia, Tierra del Fuego |  |
| Melo | [Q738250](https://www.wikidata.org/wiki/Q738250) Melo | 55.985 hab. (2023) · 19 km² · 80 m |  |  |
| Maldonado | [Q16258](https://www.wikidata.org/wiki/Q16258) Maldonado | 86.782 hab. (2011) · 60 km² · 24 m | La Mano de Punta del Este, Río de la Plata |  |
| Tacuarembó | [Q833016](https://www.wikidata.org/wiki/Q833016) Tacuarembó | 60.581 hab. (2023) · 42 km² · 137 m |  |  |
| Coihaique | [Q3810](https://www.wikidata.org/wiki/Q3810) Coyhaique | 61.210 hab. (2020) · 13 km² · 302 m | Patagonia |  |
| Mercedes | [Q844914](https://www.wikidata.org/wiki/Q844914) Mercedes | 43.528 hab. (2023) · 25 km² · 26 m |  |  |
| Artigas | [Q712567](https://www.wikidata.org/wiki/Q712567) Artigas | 43.843 hab. (2023) · 17 km² · 121 m |  |  |
| Minas | [Q868205](https://www.wikidata.org/wiki/Q868205) Minas | 38.633 hab. (2023) · 20 km² · 140 m |  |  |
| Villarrica | [Q288685](https://www.wikidata.org/wiki/Q288685) Villarrica | 40.300 hab. · 327 km² · 180 m | Altiplano Brasileño |  |
| San José de Mayo | [Q983435](https://www.wikidata.org/wiki/Q983435) San José de Mayo | 38.550 hab. (2023) · 17 km² · 51 m |  |  |
| Durazno | [Q855645](https://www.wikidata.org/wiki/Q855645) Durazno | 40.279 hab. (2023) · 30 km² · 91 m |  |  |
| Florida | [Q842472](https://www.wikidata.org/wiki/Q842472) Florida | 34.893 hab. (2023) · 33 km² · 70 m |  |  |
| Ypacaraí | [Q643576](https://www.wikidata.org/wiki/Q643576) Ypacaraí | 27.379 hab. (2018) · 101 km² · 70 m | Altiplano Brasileño |  |
| Pilar | [Q135970](https://www.wikidata.org/wiki/Q135970) Pilar | 32.810 hab. (2019) · 258 km² · 44 m | Río Paraná |  |
| Treinta y Tres | [Q830390](https://www.wikidata.org/wiki/Q830390) Treinta y Tres | 25.870 hab. (2023) · 18 km² · 54 m |  |  |
| Rocha | [Q1017387](https://www.wikidata.org/wiki/Q1017387) Rocha | 26.784 hab. (2023) · 19 km² · 27 m |  |  |
| Rawson | [Q44208](https://www.wikidata.org/wiki/Q44208) Rawson | 38.652 hab. (2022) · 4 m | Patagonia |  |
| Fray Bentos | [Q849835](https://www.wikidata.org/wiki/Q849835) Fray Bentos | 26.231 hab. (2023) · 11 km² · 23 m | Río de la Plata |  |
| Colonia del Sacramento | [Q56064](https://www.wikidata.org/wiki/Q56064) Colonia del Sacramento | 32.159 hab. (2023) · 6.106 km² · 27 m | Río de la Plata |  |
| Caacupé | [Q135959](https://www.wikidata.org/wiki/Q135959) Caacupé | 56.864 hab. (2019) · 145 km² · 179 m | Altiplano Brasileño |  |
| Trinidad | [Q862508](https://www.wikidata.org/wiki/Q862508) Trinidad | 22.893 hab. (2023) · 8 km² · 134 m |  |  |
| Canelones | [Q841342](https://www.wikidata.org/wiki/Q841342) Canelones | 24.159 hab. (2023) · 14 km² · 29 m |  |  |
| Paraguarí | [Q917103](https://www.wikidata.org/wiki/Q917103) Paraguarí | 24.092 hab. (2019) · 462 km² · 87 m | Altiplano Brasileño |  |
| San Pedro | [Q135993](https://www.wikidata.org/wiki/Q135993) San Pedro de Ycuamandiyú | 35.021 hab. · 3.178 km² · 64 m | Altiplano Brasileño |  |
| Puerto Aisén | [Q1909281](https://www.wikidata.org/wiki/Q1909281) Puerto Aysén | 17.441 hab. (2017) · 9 km² · 9 m | Patagonia |  |
| San Juan Bautista | [Q530895](https://www.wikidata.org/wiki/Q530895) San Juan Bautista | 33.785 hab. · 2.165 km² · 61 m | Altiplano Brasileño |  |
| Caazapá | [Q135939](https://www.wikidata.org/wiki/Q135939) Caazapá | 23.996 hab. · 804 km² · 153 m | Altiplano Brasileño |  |
| Mariscal Estigarribia | [Q1093167](https://www.wikidata.org/wiki/Q1093167) Mariscal José Félix Estigarribia | 15.219 hab. (2022) · 52.171 km² · 151 m | Gran Chaco |  |
| Fuerte Olimpo | [Q136498](https://www.wikidata.org/wiki/Q136498) Fuerte Olimpo | 4.445 hab. (2019) · 54.592 km² · 64 m | Río Paraná, Pantanal, Gran Chaco |  |
| Pozo Colorado | [Q1315847](https://www.wikidata.org/wiki/Q1315847) Pozo Colorado | 17.727 hab. · 75 m | Gran Chaco |  |
| Capitan Pablo Lagerenza | [Q302441](https://www.wikidata.org/wiki/Q302441) Mayor Pablo Lagerenza | 182 m | Gran Chaco |  |
| General Eugenio Alejandrino Garay | [Q2409529](https://www.wikidata.org/wiki/Q2409529) General Eugenio A. Garay | 288 km² · 295 m | Gran Chaco |  |
| Mexico City | [Q1489](https://www.wikidata.org/wiki/Q1489) Ciudad de México | 9.209.944 hab. (2020) · 1.485 km² · 2.240 m | Ángel de la Independencia, Catedral Metropolitana de México |  |
| San Salvador | [Q3110](https://www.wikidata.org/wiki/Q3110) San Salvador | 330.543 hab. (2024) · 72 km² · 670 m | Joya de Cerén |  |
| San José | [Q3070](https://www.wikidata.org/wiki/Q3070) San José | 335.007 hab. (2025) · 45 km² · 1.161 m | Teatro Nacional de Costa Rica |  |
| Panama City | [Q3306](https://www.wikidata.org/wiki/Q3306) Ciudad de Panamá | 1.540.000 hab. (2026) · 275 km² · 20 m | Canal de Panamá, Istmo de Panamá |  |
| Guatemala City | [Q1555](https://www.wikidata.org/wiki/Q1555) Ciudad de Guatemala | 994.938 hab. (2025) · 692 km² · 1.500 m |  |  |
| Tegucigalpa | [Q3238](https://www.wikidata.org/wiki/Q3238) Tegucigalpa | 850.848 hab. (2025) · 202 km² · 990 m |  |  |
| Managua | [Q3274](https://www.wikidata.org/wiki/Q3274) Managua | 973.087 hab. (2025) · 267 km² · 143 m |  |  |
| Belmopan | [Q3043](https://www.wikidata.org/wiki/Q3043) Belmopán | 20.754 hab. (2022) · 33 km² · 76 m | Península de Yucatán |  |
| Guadalajara | [Q9022](https://www.wikidata.org/wiki/Q9022) Guadalajara | 1.385.621 hab. (2020) · 145 km² · 1.536 m |  |  |
| Monterrey | [Q81033](https://www.wikidata.org/wiki/Q81033) Monterrey | 1.142.952 hab. (2020) · 970 km² · 546 m | Sierra Madre Oriental |  |
| Puebla | [Q125293](https://www.wikidata.org/wiki/Q125293) Heroica Puebla de Zaragoza | 1.542.232 hab. (2020) · 546 km² · 2.153 m |  |  |
| Tijuana | [Q124739](https://www.wikidata.org/wiki/Q124739) Tijuana | 1.810.645 hab. (2020) · 637 km² · 20 m |  |  |
| Toluca | [Q209034](https://www.wikidata.org/wiki/Q209034) Toluca de Lerdo | 223.876 hab. (2020) · 30 km² · 2.660 m |  |  |
| León | [Q189128](https://www.wikidata.org/wiki/Q189128) León de Los Aldama | 1.579.803 hab. (2020) · 1.800 m | Altiplanicie Mexicana |  |
| Ciudad Juárez | [Q26590](https://www.wikidata.org/wiki/Q26590) Ciudad Juárez | 1.501.551 hab. (2020) · 321 km² · 1.137 m | Río Bravo (Grande), Altiplanicie Mexicana, Desierto de Chihuahua |  |
| Torreón | [Q386991](https://www.wikidata.org/wiki/Q386991) Torreón | 690.193 hab. (2020) · 500 km² · 1.124 m | Altiplanicie Mexicana, Desierto de Chihuahua |  |
| Nezahualcoyotl | [Q210307](https://www.wikidata.org/wiki/Q210307) Ciudad Nezahualcóyotl | 1.072.676 hab. (2020) · 63 km² · 2.870 m | Ángel de la Independencia, Catedral Metropolitana de México |  |
| San Luis Potosí | [Q204271](https://www.wikidata.org/wiki/Q204271) San Luis Potosí | 845.941 hab. (2020) · 1.443 km² · 1.871 m | Altiplanicie Mexicana |  |
| Mérida | [Q165204](https://www.wikidata.org/wiki/Q165204) Mérida | 921.771 hab. (2020) · 883 km² · 14 m | Península de Yucatán |  |
| Querétaro | [Q79754](https://www.wikidata.org/wiki/Q79754) Querétaro | 2.038.372 hab. (2015) · 11.699 km² · 1.856 m | Altiplanicie Mexicana |  |
| Mexicali | [Q199440](https://www.wikidata.org/wiki/Q199440) Mexicali | 854.186 hab. (2020) · 114 km² · 8 m | Desierto de Sonora |  |
| Aguascalientes | [Q200805](https://www.wikidata.org/wiki/Q200805) Aguascalientes | 863.893 hab. (2020) · 1.169 km² · 1.888 m | Sierra Madre Occidental, Altiplanicie Mexicana |  |
| Tampico | [Q273014](https://www.wikidata.org/wiki/Q273014) Tampico | 297.373 hab. (2020) · 93 km² · 10 m | Golfo de México |  |
| Cuernavaca | [Q204245](https://www.wikidata.org/wiki/Q204245) Cuernavaca | 341.029 hab. (2020) · 151 km² · 1.510 m |  |  |
| Culiacán | [Q211760](https://www.wikidata.org/wiki/Q211760) Culiacán | 808.416 hab. (2020) · 65 km² · 95 m | Sierra Madre Occidental |  |
| Chihuahua | [Q61302](https://www.wikidata.org/wiki/Q61302) Chihuahua | 925.762 hab. (2020) · 1.415 m | Altiplanicie Mexicana, Desierto de Chihuahua |  |
| Saltillo | [Q53077](https://www.wikidata.org/wiki/Q53077) Saltillo | 864.431 hab. (2020) · 1.560 m | Sierra Madre Oriental, Desierto de Chihuahua |  |
| Acapulco | [Q81398](https://www.wikidata.org/wiki/Q81398) Acapulco de Juárez | 658.609 hab. (2020) · 1.881 km² · 30 m |  |  |
| San Pedro Sula | [Q274584](https://www.wikidata.org/wiki/Q274584) San Pedro Sula | 719.064 hab. (2013) · 856 km² · 83 m |  |  |
| Morelia | [Q200252](https://www.wikidata.org/wiki/Q200252) Morelia | 743.275 hab. (2020) · 1.920 m |  |  |
| Hermosillo | [Q189138](https://www.wikidata.org/wiki/Q189138) Hermosillo | 855.563 hab. (2020) · 200 m | Desierto de Sonora |  |
| Veracruz | [Q173270](https://www.wikidata.org/wiki/Q173270) Veracruz | 405.952 hab. (2020) · 79 km² · 10 m |  |  |
| Quetzaltenango | [Q334577](https://www.wikidata.org/wiki/Q334577) Quetzaltenango | 207.620 hab. (2023) · 120 km² · 2.433 m |  |  |
| Cancún | [Q8969](https://www.wikidata.org/wiki/Q8969) Cancún | 888.797 hab. (2020) · 5 m | Mar Caribe, Península de Yucatán |  |
| Matamoros | [Q738353](https://www.wikidata.org/wiki/Q738353) Heroica Matamoros | 541.979 hab. (2020) · 9 m | Río Bravo (Grande) |  |
| Oaxaca | [Q131429](https://www.wikidata.org/wiki/Q131429) Oaxaca de Juárez | 258.913 hab. (2020) · 85 km² · 1.557 m | Monte Albán |  |
| Tlaxcala | [Q689987](https://www.wikidata.org/wiki/Q689987) Tlaxcala de Xicohténcatl | 13.555 hab. (2020) · 2.274 m |  |  |
| Mazatlán | [Q40194](https://www.wikidata.org/wiki/Q40194) Mazatlán | 501.441 hab. (2020) · 139 m | Sierra Madre Occidental |  |
| Reynosa | [Q738303](https://www.wikidata.org/wiki/Q738303) Reynosa | 691.557 hab. (2020) · 33 m | Río Bravo (Grande) |  |
| Tuxtla Gutiérrez | [Q207429](https://www.wikidata.org/wiki/Q207429) Tuxtla Gutiérrez | 578.830 hab. (2020) · 529 m |  |  |
| Durango | [Q112813](https://www.wikidata.org/wiki/Q112813) Victoria de Durango | 616.068 hab. (2020) · 118 km² · 1.880 m | Sierra Madre Occidental |  |
| Xalapa | [Q221051](https://www.wikidata.org/wiki/Q221051) Xalapa-Enríquez | 443.063 hab. (2020) · 118 km² · 1.460 m |  |  |
| Villahermosa | [Q210886](https://www.wikidata.org/wiki/Q210886) Villahermosa | 340.060 hab. (2020) · 80 km² · 11 m |  |  |
| Gómez Palacio | [Q1775128](https://www.wikidata.org/wiki/Q1775128) Gómez Palacio | 301.742 hab. (2020) · 844 km² · 1.135 m | Altiplanicie Mexicana, Desierto de Chihuahua |  |
| Alajuela | [Q37104](https://www.wikidata.org/wiki/Q37104) Alajuela | 44.374 hab. (2022) · 11 km² · 952 m | Teatro Nacional de Costa Rica |  |
| Celaya | [Q580649](https://www.wikidata.org/wiki/Q580649) Celaya | 378.143 hab. (2020) · 553 km² · 1.767 m | Altiplanicie Mexicana |  |
| Orizaba | [Q993904](https://www.wikidata.org/wiki/Q993904) Orizaba | 120.500 hab. (2020) · 28 km² · 1.242 m |  |  |
| Nuevo Laredo | [Q328846](https://www.wikidata.org/wiki/Q328846) Nuevo Laredo | 416.055 hab. (2020) · 130 m | Río Bravo (Grande) |  |
| Irapuato | [Q9009232](https://www.wikidata.org/wiki/Q9009232) Municipio de Irapuato | 529.440 hab. (2010) · 851 km² · 2.205 m | Altiplanicie Mexicana |  |
| Pachuca | [Q160750](https://www.wikidata.org/wiki/Q160750) Pachuca de Soto | 297.848 hab. (2020) · 60 km² · 2.382 m |  |  |
| Tepic | [Q207972](https://www.wikidata.org/wiki/Q207972) Tepic | 371.387 hab. (2020) · 1.983 km² · 920 m | Sierra Madre Occidental |  |
| Ciudad Obregon | [Q681340](https://www.wikidata.org/wiki/Q681340) Ciudad Obregón | 329.404 hab. (2020) · 36 m |  |  |
| Coatzacoalcos | [Q502023](https://www.wikidata.org/wiki/Q502023) Coatzacoalcos | 212.540 hab. (2020) · 471 km² · 3 m | Istmo de Tehuantepec |  |
| Ciudad Victoria | [Q331661](https://www.wikidata.org/wiki/Q331661) Ciudad Victoria | 332.100 hab. (2020) · 188 km² · 318 m | Sierra Madre Oriental |  |
| Uruapan | [Q399270](https://www.wikidata.org/wiki/Q399270) Uruapan del Progreso | 299.523 hab. (2020) · 1.871 m |  |  |
| Ensenada | [Q656189](https://www.wikidata.org/wiki/Q656189) Ensenada | 557.430 hab. (2020) · 20 km² · 30 m | Baja California |  |
| Poza Rica de Hidalgo | [Q1010503](https://www.wikidata.org/wiki/Q1010503) Poza Rica de Hidalgo | 189.457 hab. (2020) · 64 km² · 58 m |  |  |
| Zumpango | [Q1115965](https://www.wikidata.org/wiki/Q1115965) Municipio de Zumpango | 159.647 hab. (2010) · 224 km² · 2.261 m | Teotihuacán |  |
| Zacatecas | [Q139242](https://www.wikidata.org/wiki/Q139242) Zacatecas | 138.444 hab. (2020) · 356 km² · 2.440 m | Sierra Madre Occidental, Altiplanicie Mexicana |  |
| Santa Ana | [Q739664](https://www.wikidata.org/wiki/Q739664) Santa Ana | 250.760 hab. (2024) · 400 km² · 665 m | Joya de Cerén |  |
| Colima | [Q61320](https://www.wikidata.org/wiki/Q61320) Colima | 146.965 hab. (2020) · 45 km² · 495 m |  |  |
| Campeche | [Q61301](https://www.wikidata.org/wiki/Q61301) San Francisco de Campeche | 249.623 hab. (2020) · 5 m | Península de Yucatán |  |
| Colón | [Q12825018](https://www.wikidata.org/wiki/Q12825018) Ciudad de Colón | 241.817 hab. (2016) · 9 m | Canal de Panamá, Mar Caribe, Istmo de Panamá |  |
| San Miguel | [Q672458](https://www.wikidata.org/wiki/Q672458) San Miguel | 232.887 hab. (2024) · 594 km² · 110 m |  |  |
| Cartago | [Q30617](https://www.wikidata.org/wiki/Q30617) Cartago | 22.775 hab. (2022) · 4 km² · 1.435 m | Teatro Nacional de Costa Rica |  |
| La Paz | [Q214215](https://www.wikidata.org/wiki/Q214215) La Paz | 250.141 hab. (2020) · 47 m | Baja California, Golfo de California |  |
| Chilpancingo | [Q207935](https://www.wikidata.org/wiki/Q207935) Chilpancingo de los Bravo | 225.728 hab. (2020) · 1.242 m |  |  |
| Sonsonate | [Q1014248](https://www.wikidata.org/wiki/Q1014248) Sonsonate | 72.233 hab. (2024) · 233 km² · 220 m |  |  |
| León | [Q208151](https://www.wikidata.org/wiki/Q208151) León | 212.504 hab. (2021) · 820 km² · 104 m |  |  |
| Chetumal | [Q459553](https://www.wikidata.org/wiki/Q459553) Chetumal | 169.028 hab. (2020) · 2 m | Mar Caribe, Península de Yucatán |  |
| El Progreso | [Q795591](https://www.wikidata.org/wiki/Q795591) Departamento de El Progreso | 176.632 hab. (2018) · 1.922 km² · 2.962 m |  |  |
| La Ceiba | [Q916536](https://www.wikidata.org/wiki/Q916536) La Ceiba | 232.696 hab. (2023) · 654 km² · 3 m | Mar Caribe |  |
| Chinandega | [Q974354](https://www.wikidata.org/wiki/Q974354) Chinandega | 137.539 hab. (2022) · 687 km² · 46 m |  |  |
| Masaya | [Q1001914](https://www.wikidata.org/wiki/Q1001914) Masaya | 139.582 hab. (2005) · 147 km² · 234 m |  |  |
| Nueva San Salvador | [Q723246](https://www.wikidata.org/wiki/Q723246) Santa Tecla | 125.532 hab. (2024) · 112 km² · 920 m | Joya de Cerén |  |
| Guanajuato | [Q61306](https://www.wikidata.org/wiki/Q61306) Guanajuato | 70.068 hab. (2020) · 997 km² · 2.045 m | Altiplanicie Mexicana |  |
| David | [Q279009](https://www.wikidata.org/wiki/Q279009) David | 82.907 hab. (2010) · 176 km² · 6 m |  |  |
| Matagalpa | [Q596688](https://www.wikidata.org/wiki/Q596688) Matagalpa | 171.473 hab. (2023) · 619 km² · 680 m |  |  |
| Estelí | [Q1007634](https://www.wikidata.org/wiki/Q1007634) Estelí | 105.709 hab. (2016) · 796 km² · 844 m |  |  |
| Escuintla | [Q780771](https://www.wikidata.org/wiki/Q780771) Escuintla | 170.280 hab. (2022) · 332 km² · 343 m |  |  |
| Granada‎ | [Q205648](https://www.wikidata.org/wiki/Q205648) Granada | 105.171 hab. (2005) · 592 km² · 73 m | Lago de Nicaragua (Cocibolca) |  |
| Choluteca | [Q1773148](https://www.wikidata.org/wiki/Q1773148) Choluteca | 152.519 hab. (2013) · 1.072 km² · 40 m |  |  |
| Huehuetenango | [Q984863](https://www.wikidata.org/wiki/Q984863) Huehuetenango | 136.639 hab. (2022) · 204 km² · 1.901 m |  |  |
| Limón | [Q30620](https://www.wikidata.org/wiki/Q30620) Limón | 71.514 hab. (2022) · 59 km² · 3 m | Mar Caribe |  |
| Chimaltenango | [Q1002552](https://www.wikidata.org/wiki/Q1002552) Chimaltenango | 116.642 hab. (2022) · 86 km² · 1.800 m |  |  |
| Comayagua | [Q679169](https://www.wikidata.org/wiki/Q679169) Comayagua | 144.785 hab. (2013) · 834 km² · 594 m |  |  |
| Totonicapán | [Q837035](https://www.wikidata.org/wiki/Q837035) Totonicapán | 118.960 hab. (2021) · 328 km² · 2.485 m |  |  |
| Cobán | [Q867077](https://www.wikidata.org/wiki/Q867077) Cobán | 228.664 hab. (2021) · 2.132 km² · 1.320 m |  |  |
| Mazatenango | [Q1023983](https://www.wikidata.org/wiki/Q1023983) Mazatenango | 83.828 hab. (2021) · 356 km² · 374 m |  |  |
| Belize City | [Q108223](https://www.wikidata.org/wiki/Q108223) Ciudad de Belice | 63.999 hab. (2022) · 36 km² · 0 m | Mar Caribe |  |
| Puntarenas | [Q30687](https://www.wikidata.org/wiki/Q30687) Puntarenas | 41.528 hab. (2011) · 47 km² · 0 m |  |  |
| Puerto Barrios | [Q991400](https://www.wikidata.org/wiki/Q991400) Puerto Barrios | 110.846 hab. (2021) · 1.292 km² · 2 m |  |  |
| Juigalpa | [Q1025801](https://www.wikidata.org/wiki/Q1025801) Juigalpa | 51.838 hab. (2005) · 727 km² · 123 m |  |  |
| Usulután | [Q1018092](https://www.wikidata.org/wiki/Q1018092) Usulután | 66.125 hab. (2024) · 140 km² · 90 m |  |  |
| Jinotega | [Q1026296](https://www.wikidata.org/wiki/Q1026296) Jinotega | 99.382 hab. (2005) · 880 km² · 1.004 m |  |  |
| Jutiapa | [Q1023364](https://www.wikidata.org/wiki/Q1023364) Jutiapa | 167.049 hab. (2022) · 620 km² · 895 m |  |  |
| Cojutepeque | [Q2565407](https://www.wikidata.org/wiki/Q2565407) Cojutepeque | 46.839 hab. (2024) · 31 km² · 853 m |  |  |
| Nacaome | [Q633929](https://www.wikidata.org/wiki/Q633929) Nacaome | 57.345 hab. (2013) · 589 km² · 44 m |  |  |
| Santiago | [Q685509](https://www.wikidata.org/wiki/Q685509) Santiago de Veraguas | 109.605 hab. (2023) · 976 km² · 101 m |  |  |
| Jalapa | [Q1023359](https://www.wikidata.org/wiki/Q1023359) Jalapa | 192.676 hab. (2022) · 544 km² · 1.392 m |  |  |
| Liberia | [Q1387526](https://www.wikidata.org/wiki/Q1387526) Liberia | 65.922 hab. (2022) · 563 km² · 144 m |  |  |
| Sololá | [Q602423](https://www.wikidata.org/wiki/Q602423) Sololá | 103.514 hab. (2026) · 94 km² · 2.114 m |  |  |
| Bluefields | [Q885996](https://www.wikidata.org/wiki/Q885996) Bluefields | 58.957 hab. (2024) · 4.775 km² · 25 m | Mar Caribe |  |
| Chitré | [Q657763](https://www.wikidata.org/wiki/Q657763) Chitré | 9.022 hab. (2023) · 12 km² · 24 m |  |  |
| Bilwi | [Q1008456](https://www.wikidata.org/wiki/Q1008456) Puerto Cabezas | 66.169 hab. (2005) · 5.985 km² · 7 m | Mar Caribe |  |
| Chiquimula | [Q261613](https://www.wikidata.org/wiki/Q261613) Chiquimula | 79.815 hab. · 372 km² · 324 m |  |  |
| Salamá | [Q1023655](https://www.wikidata.org/wiki/Q1023655) Salamá | 71.478 hab. (2021) · 776 km² · 940 m |  |  |
| Zacatecoluca | [Q139248](https://www.wikidata.org/wiki/Q139248) Zacatecoluca | 64.484 hab. (2024) · 321 km² · 210 m |  |  |
| Antigua Guatemala | [Q212773](https://www.wikidata.org/wiki/Q212773) Antigua Guatemala | 59.091 hab. (2021) · 1.582 m |  |  |
| Flores | [Q679383](https://www.wikidata.org/wiki/Q679383) Flores | 44.706 hab. (2022) · 4.348 km² · 113 m | Península de Yucatán |  |
| Juticalpa | [Q773764](https://www.wikidata.org/wiki/Q773764) Juticalpa | 124.828 hab. (2013) · 2.605 km² · 410 m |  |  |
| San Vicente | [Q1094372](https://www.wikidata.org/wiki/Q1094372) San Vicente | 52.461 hab. (2024) · 267 km² · 390 m |  |  |
| Retalhuleu | [Q1023393](https://www.wikidata.org/wiki/Q1023393) Retalhuleu | 109.935 hab. (2021) · 796 km² · 241 m |  |  |
| Zacapa | [Q139179](https://www.wikidata.org/wiki/Q139179) Zacapa | 66.423 hab. (2021) · 49 km² · 120 m |  |  |
| Santa Rosa de Copán | [Q954300](https://www.wikidata.org/wiki/Q954300) Santa Rosa de Copán | 61.083 hab. (2013) · 306 km² · 1.168 m |  |  |
| Ahuachapán | [Q186935](https://www.wikidata.org/wiki/Q186935) Ahuachapán | 127.301 hab. (2024) · 245 km² · 800 m |  |  |
| Ocotal | [Q1025830](https://www.wikidata.org/wiki/Q1025830) Ocotal | 34.580 hab. (2005) · 85 km² · 611 m |  |  |
| Rivas | [Q1757609](https://www.wikidata.org/wiki/Q1757609) Rivas | 41.080 hab. (2005) · 281 km² · 63 m | Lago de Nicaragua (Cocibolca) |  |
| Jinotepe | [Q477580](https://www.wikidata.org/wiki/Q477580) Jinotepe | 42.109 hab. (2005) · 281 km² · 550 m |  |  |
| Chalatenango | [Q522221](https://www.wikidata.org/wiki/Q522221) Departamento de Chalatenango | 185.930 hab. (2024) · 2.017 km² |  |  |
| Boaco | [Q887488](https://www.wikidata.org/wiki/Q887488) Boaco | 49.839 hab. (2005) · 1.087 km² · 360 m |  |  |
| Penonome | [Q654169](https://www.wikidata.org/wiki/Q654169) Penonomé | 21.748 hab. (2010) · 70 m |  |  |
| Sensuntepeque | [Q2335680](https://www.wikidata.org/wiki/Q2335680) Sensuntepeque | 35.916 hab. (2024) · 306 km² · 820 m |  |  |
| La Unión | [Q2420477](https://www.wikidata.org/wiki/Q2420477) La Unión | 40.129 hab. (2024) · 144 km² · 5 m |  |  |
| San Marcos | [Q1023981](https://www.wikidata.org/wiki/Q1023981) San Marcos | 49.115 hab. (2021) · 121 km² · 2.398 m |  |  |
| Santa Cruz Del Quiche | [Q693140](https://www.wikidata.org/wiki/Q693140) Santa Cruz del Quiché | 99.479 hab. (2021) · 128 km² · 2.021 m |  |  |
| Heredia | [Q30616](https://www.wikidata.org/wiki/Q30616) Heredia | 16.686 hab. (2022) · 3 km² · 1.172 m | Teatro Nacional de Costa Rica |  |
| Orange Walk | [Q882964](https://www.wikidata.org/wiki/Q882964) Orange Walk Town | 14.553 hab. (2022) · 33 m | Península de Yucatán |  |
| Somoto | [Q1010954](https://www.wikidata.org/wiki/Q1010954) Somoto | 40.573 hab. (2023) · 466 km² · 711 m |  |  |
| La Paz | [Q2283725](https://www.wikidata.org/wiki/Q2283725) La Paz | 43.980 hab. (2013) · 232 km² · 687 m |  |  |
| El Cayo | [Q724815](https://www.wikidata.org/wiki/Q724815) San Ignacio | 26.151 hab. (2018) · 6 km² · 76 m | Península de Yucatán |  |
| Cuilapa | [Q1015941](https://www.wikidata.org/wiki/Q1015941) Cuilapa | 46.974 hab. (2021) · 365 km² · 1.200 m |  |  |
| San Francisco Gotera | [Q969396](https://www.wikidata.org/wiki/Q969396) San Francisco Gotera | 20.330 hab. (2024) · 60 km² · 301 m |  |  |
| Yoro | [Q2561180](https://www.wikidata.org/wiki/Q2561180) Yoro | 86.665 hab. (2013) · 2.264 km² · 660 m |  |  |
| Santa Bárbara | [Q2283714](https://www.wikidata.org/wiki/Q2283714) Santa Bárbara | 41.736 hab. (2013) · 301 km² · 312 m |  |  |
| San Carlos | [Q1020320](https://www.wikidata.org/wiki/Q1020320) San Carlos | 37.461 hab. (2005) · 1.445 km² · 51 m | Lago de Nicaragua (Cocibolca) |  |
| Las Tablas | [Q2712890](https://www.wikidata.org/wiki/Q2712890) Las Tablas | 9.255 hab. (2010) · 698 km² · 42 m |  |  |
| Dangriga | [Q888300](https://www.wikidata.org/wiki/Q888300) Dangriga | 9.927 hab. (2022) · 0 m | Península de Yucatán |  |
| Bocas del Toro | [Q888971](https://www.wikidata.org/wiki/Q888971) Bocas del Toro | 10 m | Mar Caribe |  |
| Trujillo | [Q992173](https://www.wikidata.org/wiki/Q992173) Trujillo | 60.558 hab. (2013) · 955 km² · 15 m | Mar Caribe |  |
| Nueva Ocotepeque | [Q3307235](https://www.wikidata.org/wiki/Q3307235) Nueva Ocotepeque | 11.843 hab. (2013) |  |  |
| Corozal | [Q882907](https://www.wikidata.org/wiki/Q882907) Corozal | 9.815 hab. (2022) · 0 m | Mar Caribe, Península de Yucatán |  |
| Gracias | [Q2561339](https://www.wikidata.org/wiki/Q2561339) Gracias | 47.622 hab. (2013) · 449 km² · 800 m |  |  |
| Punta Gorda | [Q883362](https://www.wikidata.org/wiki/Q883362) Punta Gorda | 5.406 hab. (2022) · 9 m | Península de Yucatán |  |
| Roatán | [Q1419813](https://www.wikidata.org/wiki/Q1419813) Roatán | 41.831 hab. (2013) · 128 km² | Mar Caribe |  |
| La Esperanza | [Q2561304](https://www.wikidata.org/wiki/Q2561304) La Esperanza | 11.631 hab. (2013) · 156 km² · 1.700 m |  |  |
| Puerto Lempira | [Q2075665](https://www.wikidata.org/wiki/Q2075665) Puerto Lempira | 47.528 hab. (2013) · 7.126 km² · 0 m | Mar Caribe |  |
| Yuscarán | [Q1729098](https://www.wikidata.org/wiki/Q1729098) Yuscarán | 14.144 hab. (2013) · 332 km² · 1.007 m |  |  |
| La Palma | [Q1798993](https://www.wikidata.org/wiki/Q1798993) La Palma | 4.205 hab. · 4 m | Tapón del Darién |  |
| El Porvenir | [Q1018577](https://www.wikidata.org/wiki/Q1018577) Gaigirgordub |  | Mar Caribe, Istmo de Panamá |  |
| Havana | [Q1563](https://www.wikidata.org/wiki/Q1563) La Habana | 2.492.618 hab. (2022) · 728 km² · 59 m | Capitolio de La Habana, Antillas Mayores |  |
| Santo Domingo | [Q34820](https://www.wikidata.org/wiki/Q34820) Santo Domingo | 2.201.941 hab. (2025) · 1.302 km² · 14 m | Alcázar de Colón, La Española, Antillas Mayores |  |
| Port-au-Prince | [Q34261](https://www.wikidata.org/wiki/Q34261) Puerto Príncipe | 987.310 hab. (2015) · 36 km² · 98 m | Mar Caribe, La Española, Antillas Mayores |  |
| Kingston | [Q34692](https://www.wikidata.org/wiki/Q34692) Kingston | 937.700 hab. (2025) · 22 km² · 9 m | Mar Caribe, Antillas Mayores |  |
| San Juan | [Q41211](https://www.wikidata.org/wiki/Q41211) San Juan | 342.259 hab. (2020) · 120 km² · 34 m | Castillo San Felipe del Morro, Castillo San Cristóbal, Antillas Mayores |  |
| Santiago | [Q42763](https://www.wikidata.org/wiki/Q42763) Santiago de los Caballeros | 1.343.423 hab. (2021) · 612 km² · 175 m | La Española, Antillas Mayores |  |
| Santiago de Cuba | [Q117040](https://www.wikidata.org/wiki/Q117040) Santiago de Cuba | 506.037 hab. (2012) · 1.032 km² · 82 m | Mar Caribe, Antillas Mayores |  |
| Spanish Town | [Q846939](https://www.wikidata.org/wiki/Q846939) Spanish Town | 131.056 hab. (2001) | Mar Caribe, Antillas Mayores |  |
| Camagüey | [Q115329](https://www.wikidata.org/wiki/Q115329) Camagüey | 321.992 hab. (2011) · 1.106 km² · 5 m | Antillas Mayores |  |
| Holguín | [Q244154](https://www.wikidata.org/wiki/Q244154) Holguín | 350.191 hab. (2014) · 656 km² · 146 m | Antillas Mayores |  |
| Mayagüez | [Q632727](https://www.wikidata.org/wiki/Q632727) Mayagüez | 73.077 hab. (2020) · 60 km² · 21 m | Mar Caribe, Antillas Mayores, Puerto Rico |  |
| Cap-Haïtien | [Q216835](https://www.wikidata.org/wiki/Q216835) Cabo Haitiano | 190.289 hab. (2013) · 54 km² · 0 m | Ciudadela Laferrière, La Española, Antillas Mayores |  |
| Guantánamo | [Q185156](https://www.wikidata.org/wiki/Q185156) Guantánamo | 228.436 hab. (2012) · 741 km² · 46 m | Antillas Mayores |  |
| Santa Clara | [Q211590](https://www.wikidata.org/wiki/Q211590) Santa Clara | 247.436 hab. (2020) · 514 km² · 125 m | Antillas Mayores |  |
| San Pedro de Macorís | [Q680596](https://www.wikidata.org/wiki/Q680596) San Pedro de Macorís | 217.141 hab. (2015) · 152 km² · 4 m | Mar Caribe, La Española, Antillas Mayores |  |
| La Romana | [Q40508](https://www.wikidata.org/wiki/Q40508) La Romana | 139.238 hab. (2022) · 272 km² · 10 m | Mar Caribe, La Española, Antillas Mayores |  |
| Las Tunas | [Q115527](https://www.wikidata.org/wiki/Q115527) Las Tunas | 202.105 hab. (2012) · 891 km² · 90 m | Antillas Mayores |  |
| Bayamo | [Q115382](https://www.wikidata.org/wiki/Q115382) Bayamo | 235.107 hab. (2012) · 918 km² · 55 m | Antillas Mayores |  |
| Pinar del Rio | [Q244139](https://www.wikidata.org/wiki/Q244139) Pinar del Río | 188.614 hab. (2012) · 691 km² · 61 m | Antillas Mayores |  |
| Cienfuegos | [Q190005](https://www.wikidata.org/wiki/Q190005) Cienfuegos | 164.924 hab. (2012) · 333 km² · 25 m | Mar Caribe, Antillas Mayores |  |
| Les Cayes | [Q984786](https://www.wikidata.org/wiki/Q984786) Los Cayos | 151.696 hab. (2015) · 219 km² · 0 m | La Española, Antillas Mayores |  |
| Gonaïves | [Q852550](https://www.wikidata.org/wiki/Q852550) Les Gonaïves | 356.324 hab. (2015) · 574 km² · 6 m | Mar Caribe, La Española, Antillas Mayores |  |
| La Vega | [Q538953](https://www.wikidata.org/wiki/Q538953) La Vega | 282.055 hab. (2022) · 642 km² · 100 m | La Española, Antillas Mayores |  |
| Ponce | [Q864024](https://www.wikidata.org/wiki/Q864024) Ponce | 137.491 hab. (2020) · 119 km² · 10 m | Mar Caribe, Antillas Mayores, Puerto Rico |  |
| San Cristóbal | [Q373759](https://www.wikidata.org/wiki/Q373759) San Cristóbal | 232.769 hab. (2010) · 227 km² · 33 m | Alcázar de Colón, La Española, Antillas Mayores |  |
| San Francisco de Macorís | [Q681999](https://www.wikidata.org/wiki/Q681999) San Francisco de Macorís | 188.118 hab. (2010) · 760 km² · 110 m | La Española, Antillas Mayores |  |
| Matanzas | [Q272471](https://www.wikidata.org/wiki/Q272471) Matanzas | 151.624 hab. (2012) · 317 km² · 20 m | Antillas Mayores |  |
| Ciego de Ávila | [Q115465](https://www.wikidata.org/wiki/Q115465) Ciego de Ávila | 143.449 hab. (2010) · 445 km² · 55 m | Antillas Mayores |  |
| May Pen | [Q1677434](https://www.wikidata.org/wiki/Q1677434) May Pen |  | Mar Caribe, Antillas Mayores |  |
| Manzanillo | [Q115403](https://www.wikidata.org/wiki/Q115403) Manzanillo | 150.999 hab. (2005) · 498 km² · 25 m | Antillas Mayores |  |
| Sancti Spíritus | [Q845720](https://www.wikidata.org/wiki/Q845720) Sancti Spíritus | 138.504 hab. (2012) · 1.151 km² · 75 m | Antillas Mayores |  |
| Montego Bay | [Q637555](https://www.wikidata.org/wiki/Q637555) Bahía Montego | 123.994 hab. (2015) | Mar Caribe, Antillas Mayores |  |
| Higuey | [Q1020261](https://www.wikidata.org/wiki/Q1020261) Higüey | 251.243 hab. (2010) · 2.029 km² · 106 m | La Española, Antillas Mayores |  |
| Puerto Plata | [Q988413](https://www.wikidata.org/wiki/Q988413) Puerto Plata | 338.339 hab. (2022) · 503 km² · 8 m | La Española, Antillas Mayores |  |
| Palma Soriano | [Q742835](https://www.wikidata.org/wiki/Q742835) Palma Soriano | 119.740 hab. · 846 km² · 150 m | Antillas Mayores |  |
| Half Way Tree | [Q1423367](https://www.wikidata.org/wiki/Q1423367) Half Way Tree |  | Mar Caribe, Antillas Mayores |  |
| Barahona | [Q958586](https://www.wikidata.org/wiki/Q958586) Santa Cruz de Barahona | 138.159 hab. (2012) · 169 km² · 10 m | Mar Caribe, La Española, Antillas Mayores |  |
| Bonao | [Q2306136](https://www.wikidata.org/wiki/Q2306136) Bonao | 158.034 hab. (2012) · 678 km² · 173 m | La Española, Antillas Mayores |  |
| San Juan | [Q2430320](https://www.wikidata.org/wiki/Q2430320) San Juan | 169.032 hab. (2012) · 1.876 km² · 415 m | La Española, Antillas Mayores |  |
| Baní | [Q1902349](https://www.wikidata.org/wiki/Q1902349) Baní | 145.595 hab. (2014) · 741 km² · 61 m | Mar Caribe, La Española, Antillas Mayores |  |
| Moca | [Q1241374](https://www.wikidata.org/wiki/Q1241374) Moca | 94.981 hab. (2010) · 341 km² · 183 m | La Española, Antillas Mayores |  |
| Azua | [Q1836680](https://www.wikidata.org/wiki/Q1836680) Municipio de Azua | 103.276 hab. (2022) · 416 km² · 83 m | La Española, Antillas Mayores |  |
| Mao | [Q692560](https://www.wikidata.org/wiki/Q692560) Mao | 76.863 hab. (2010) · 424 km² · 78 m | La Española, Antillas Mayores |  |
| Mandeville | [Q1807660](https://www.wikidata.org/wiki/Q1807660) Mandeville | 48.317 hab. (2010) · 628 m | Mar Caribe, Antillas Mayores |  |
| Salcedo | [Q1023951](https://www.wikidata.org/wiki/Q1023951) Salcedo | 39.557 hab. (2010) · 191 km² · 196 m | La Española, Antillas Mayores |  |
| Comendador | [Q617647](https://www.wikidata.org/wiki/Q617647) Comendador | 25.924 hab. (2010) · 256 km² · 395 m | La Española, Antillas Mayores |  |
| Cotuí | [Q2087489](https://www.wikidata.org/wiki/Q2087489) Cotuí | 79.596 hab. (2012) · 661 km² · 66 m | La Española, Antillas Mayores |  |
| Hato Mayor | [Q2427660](https://www.wikidata.org/wiki/Q2427660) Hato Mayor | 61.517 hab. (2010) · 660 km² · 102 m | La Española, Antillas Mayores |  |
| Port-De-Paix | [Q951602](https://www.wikidata.org/wiki/Q951602) Puerto Paz | 121.220 hab. (2015) · 329 km² · 0 m | La Española, Antillas Mayores |  |
| Nagua | [Q2306984](https://www.wikidata.org/wiki/Q2306984) Nagua | 76.933 hab. (2010) · 553 km² · 3 m | La Española, Antillas Mayores |  |
| Jacmel | [Q923362](https://www.wikidata.org/wiki/Q923362) Jacmel | 221.965 hab. (2024) · 444 km² · 43 m | Mar Caribe, La Española, Antillas Mayores |  |
| Jérémie | [Q986301](https://www.wikidata.org/wiki/Q986301) Jérémie | 134.317 hab. (2015) · 427 km² · 0 m | Mar Caribe, La Española, Antillas Mayores |  |
| Savanna-la-Mar | [Q305508](https://www.wikidata.org/wiki/Q305508) Savanna-la-Mar | 22.600 hab. | Mar Caribe, Antillas Mayores |  |
| Neiba | [Q2107258](https://www.wikidata.org/wiki/Q2107258) Neiba | 53.605 hab. (2012) · 282 km² · 10 m | La Española, Antillas Mayores |  |
| Nueva Gerona | [Q833946](https://www.wikidata.org/wiki/Q833946) Nueva Gerona | 45.577 hab. (2019) · 17 m | Mar Caribe, Antillas Mayores |  |
| El Seibo | [Q2420339](https://www.wikidata.org/wiki/Q2420339) El Seibo | 97.144 hab. (2012) · 1.345 km² · 117 m | La Española, Antillas Mayores |  |
| Hinche | [Q993851](https://www.wikidata.org/wiki/Q993851) Hincha | 120.867 hab. (2015) · 588 km² · 228 m | La Española, Antillas Mayores |  |
| Monte Cristi | [Q2130701](https://www.wikidata.org/wiki/Q2130701) Monte Cristi | 24.674 hab. (2010) · 517 km² · 16 m | La Española, Antillas Mayores |  |
| Dajabón | [Q1969407](https://www.wikidata.org/wiki/Q1969407) Dajabón | 28.071 hab. (2010) · 261 km² · 66 m | La Española, Antillas Mayores |  |
| Sabaneta | [Q2021983](https://www.wikidata.org/wiki/Q2021983) San Ignacio de Sabaneta | 98.453 hab. (2012) · 804 km² · 124 m | La Española, Antillas Mayores |  |
| Monte Plata | [Q634487](https://www.wikidata.org/wiki/Q634487) Monte Plata | 46.723 hab. (2010) · 631 km² · 56 m | La Española, Antillas Mayores |  |
| Port Antonio | [Q162782](https://www.wikidata.org/wiki/Q162782) Port Antonio | 14.816 hab. (2011) · 20 m | Mar Caribe, Antillas Mayores |  |
| Saint Ann's Bay | [Q630692](https://www.wikidata.org/wiki/Q630692) Saint Ann's Bay | 13.671 hab. (2009) | Mar Caribe, Antillas Mayores |  |
| Port Morant | [Q7230807](https://www.wikidata.org/wiki/Q7230807) Port Morant |  | Mar Caribe, Antillas Mayores |  |
| Fort-Liberté | [Q983788](https://www.wikidata.org/wiki/Q983788) Fuerte Libertad | 34.434 hab. (2015) · 240 km² | La Española, Antillas Mayores |  |
| Samaná | [Q579950](https://www.wikidata.org/wiki/Q579950) Samaná | 108.179 hab. (2012) · 412 km² · 5 m | La Española, Antillas Mayores |  |
| Pedernales | [Q2628384](https://www.wikidata.org/wiki/Q2628384) Pedernales | 24.291 hab. (2010) · 1.275 km² · 10 m | La Española, Antillas Mayores |  |
| Port Maria | [Q265115](https://www.wikidata.org/wiki/Q265115) Port Maria |  | Mar Caribe, Antillas Mayores |  |
| Falmouth | [Q1394786](https://www.wikidata.org/wiki/Q1394786) Falmouth |  | Mar Caribe, Antillas Mayores |  |
| Jimaní | [Q1409818](https://www.wikidata.org/wiki/Q1409818) Jimaní | 16.510 hab. (2010) · 547 km² · 31 m | La Española, Antillas Mayores |  |
| Lucea | [Q1632220](https://www.wikidata.org/wiki/Q1632220) Lucea | 6.002 hab. | Mar Caribe, Antillas Mayores |  |
| Black River | [Q880512](https://www.wikidata.org/wiki/Q880512) Black River | 4.261 hab. (2009) | Mar Caribe, Antillas Mayores |  |

## Packs Pro: estados y provincias (362)

| Lugar | Wikidata | Cifras | Cerca | Dato curioso |
|---|---|---|---|---|
| La Paz | [Q272784](https://www.wikidata.org/wiki/Q272784) Departamento de La Paz | 3.030.917 hab. (2024) · 133.985 km² | Tiwanaku, La Paz |  |
| Oruro | [Q1061368](https://www.wikidata.org/wiki/Q1061368) Departamento de Oruro | 571.471 hab. (2024) · 53.588 km² |  |  |
| Potosí | [Q238079](https://www.wikidata.org/wiki/Q238079) Departamento de Potosí | 861.292 hab. (2024) · 118.218 km² |  |  |
| Tacna | [Q207413](https://www.wikidata.org/wiki/Q207413) Departamento de Tacna | 406.531 hab. (2026) · 16.076 km² |  |  |
| Madre de Dios | [Q210896](https://www.wikidata.org/wiki/Q210896) departamento de Madre de Dios | 212.872 hab. (2026) · 85.301 km² |  |  |
| Esmeraldas | [Q335526](https://www.wikidata.org/wiki/Q335526) Provincia de Esmeraldas | 553.900 hab. (2022) · 15.836 km² |  |  |
| Carchi | [Q321729](https://www.wikidata.org/wiki/Q321729) Provincia de Carchi | 172.828 hab. (2022) · 3.783 km² |  |  |
| Sucumbíos | [Q499456](https://www.wikidata.org/wiki/Q499456) Sucumbíos | 199.014 hab. (2022) · 18.098 km² |  |  |
| Tarija | [Q233933](https://www.wikidata.org/wiki/Q233933) Departamento de Tarija | 534.210 hab. (2024) · 37.623 km² |  |  |
| Santa Cruz | [Q235106](https://www.wikidata.org/wiki/Q235106) Departamento de Santa Cruz | 3.122.605 hab. (2024) · 370.621 km² | Fuerte de Samaipata |  |
| Delta Amacuro | [Q201137](https://www.wikidata.org/wiki/Q201137) Delta Amacuro | 167.676 hab. (2011) · 40.200 km² |  |  |
| Bolívar | [Q191164](https://www.wikidata.org/wiki/Q191164) Bolívar | 2.069.064 hab. (2015) · 240.528 km² | Salto Ángel, Monte Roraima, Ciudad Guayana |  |
| Loreto | [Q200938](https://www.wikidata.org/wiki/Q200938) departamento de Loreto | 1.068.905 hab. (2026) · 368.773 km² |  |  |
| Orellana | [Q499475](https://www.wikidata.org/wiki/Q499475) Orellana | 182.166 hab. (2022) · 21.729 km² |  |  |
| Pastaza | [Q214814](https://www.wikidata.org/wiki/Q214814) Pastaza | 111.915 hab. (2022) · 29.647 km² |  |  |
| Morona Santiago | [Q549522](https://www.wikidata.org/wiki/Q549522) Morona Santiago | 192.508 hab. (2022) · 24.059 km² |  |  |
| Amazonas | [Q201162](https://www.wikidata.org/wiki/Q201162) Departamento de Amazonas | 437.579 hab. (2026) · 39.249 km² | Kuélap |  |
| Zamora Chinchipe | [Q744670](https://www.wikidata.org/wiki/Q744670) Zamora Chinchipe | 110.973 hab. (2022) · 10.584 km² |  |  |
| Cajamarca | [Q205078](https://www.wikidata.org/wiki/Q205078) departamento de Cajamarca | 1.445.237 hab. (2026) · 33.304 km² |  |  |
| Loja | [Q504238](https://www.wikidata.org/wiki/Q504238) Loja | 485.421 hab. (2022) · 11.064 km² |  |  |
| Tumbes | [Q209597](https://www.wikidata.org/wiki/Q209597) Departamento de Tumbes | 335.501 hab. (2026) · 4.669 km² |  |  |
| El Oro | [Q466019](https://www.wikidata.org/wiki/Q466019) Provincia de El Oro | 714.592 hab. (2022) · 5.870 km² |  |  |
| Piura | [Q208183](https://www.wikidata.org/wiki/Q208183) Departamento de Piura | 2.196.006 hab. (2026) · 35.658 km² | Sullana |  |
| Amazonas | [Q170453](https://www.wikidata.org/wiki/Q170453) Amazonas | 176.614 hab. (2023) · 177.617 km² |  |  |
| Chuquisaca | [Q235110](https://www.wikidata.org/wiki/Q235110) Departamento de Chuquisaca | 606.027 hab. (2024) · 51.524 km² | Sucre |  |
| Ucayali | [Q207424](https://www.wikidata.org/wiki/Q207424) departamento de Ucayali | 660.256 hab. (2026) · 102.199 km² |  |  |
| Pando | [Q235362](https://www.wikidata.org/wiki/Q235362) Departamento de Pando | 134.194 hab. (2024) · 63.827 km² | Cobija |  |
| Beni | [Q233169](https://www.wikidata.org/wiki/Q233169) Departamento del Beni | 488.260 hab. (2024) · 213.564 km² | Santa Ana |  |
| Puno | [Q205104](https://www.wikidata.org/wiki/Q205104) departamento de Puno | 1.203.271 hab. (2026) · 71.999 km² | Juliaca, Puno |  |
| Zulia | [Q43269](https://www.wikidata.org/wiki/Q43269) Zulia | 4.323.467 hab. · 50.230 km² | Serranía del Perijá, Cabimas |  |
| Táchira | [Q41144](https://www.wikidata.org/wiki/Q41144) Táchira | 11.100 km² |  |  |
| Apure | [Q41146](https://www.wikidata.org/wiki/Q41146) Apure | 587.056 hab. (2015) · 76.500 km² | Arauca |  |
| Guayas | [Q335464](https://www.wikidata.org/wiki/Q335464) Guayas | 4.391.923 hab. (2022) · 15.900 km² | Milagro |  |
| Galápagos | [Q475038](https://www.wikidata.org/wiki/Q475038) Provincia de Galápagos | 28.583 hab. (2022) · 8.233 km² |  |  |
| Moquegua | [Q208182](https://www.wikidata.org/wiki/Q208182) Departamento de Moquegua | 205.591 hab. (2026) · 15.734 km² |  |  |
| Arequipa | [Q205068](https://www.wikidata.org/wiki/Q205068) departamento de Arequipa | 1.656.215 hab. (2026) · 63.345 km² |  |  |
| Ica | [Q208186](https://www.wikidata.org/wiki/Q208186) departamento de Ica | 1.093.680 hab. (2026) · 21.328 km² | Líneas de Nazca, Chincha Alta |  |
| Lima | [Q579240](https://www.wikidata.org/wiki/Q579240) provincia de Lima | 10.142.492 hab. (2025) · 2.672 km² | Caral |  |
| Lima (distrito capital) | [Q579240](https://www.wikidata.org/wiki/Q579240) provincia de Lima | 10.142.492 hab. (2025) · 2.672 km² | Lima |  |
| Callao | [Q2634400](https://www.wikidata.org/wiki/Q2634400) Provincia Constitucional del Callao | 1.239.513 hab. (2026) · 146 km² | Callao |  |
| Áncash | [Q205089](https://www.wikidata.org/wiki/Q205089) Departamento de Áncash | 1.201.826 hab. (2026) · 35.890 km² | Huascarán, Chimbote, Huaraz |  |
| La Libertad | [Q205126](https://www.wikidata.org/wiki/Q205126) departamento de La Libertad | 2.171.379 hab. (2026) · 25.500 km² | Chan Chan |  |
| Lambayeque | [Q210061](https://www.wikidata.org/wiki/Q210061) Departamento de Lambayeque | 1.384.130 hab. (2026) · 14.231 km² |  |  |
| Santa Elena | [Q1124125](https://www.wikidata.org/wiki/Q1124125) Santa Elena | 385.735 hab. (2022) · 3.690 km² |  |  |
| Manabí | [Q504666](https://www.wikidata.org/wiki/Q504666) Provincia de Manabí | 1.592.840 hab. (2022) · 19.517 km² | Manta |  |
| Mérida | [Q165582](https://www.wikidata.org/wiki/Q165582) Mérida | 11.300 km² | Pico Bolívar |  |
| Trujillo | [Q202068](https://www.wikidata.org/wiki/Q202068) Trujillo | 7.400 km² | Valera |  |
| Falcón | [Q202071](https://www.wikidata.org/wiki/Q202071) Falcón | 902.847 hab. (2011) · 24.800 km² | Punto Fijo |  |
| Yaracuy | [Q201121](https://www.wikidata.org/wiki/Q201121) Yaracuy | 499.049 hab. (2005) · 7.100 km² |  |  |
| Carabobo | [Q191186](https://www.wikidata.org/wiki/Q191186) Carabobo | 2.843.161 hab. (2016) · 4.650 km² | Puerto Cabello |  |
| Aragua | [Q190687](https://www.wikidata.org/wiki/Q190687) Aragua | 1.839.075 hab. (2017) · 7.014 km² | Maracay |  |
| Vargas | [Q205843](https://www.wikidata.org/wiki/Q205843) Estado La Guaira | 1.496 km² | Maiquetía |  |
| Miranda | [Q191174](https://www.wikidata.org/wiki/Q191174) Miranda | 7.950 km² | Ocumare del Tuy |  |
| Anzoátegui | [Q190922](https://www.wikidata.org/wiki/Q190922) Anzoátegui | 1.440.875 hab. (2011) · 43.300 km² | Puerto la Cruz, El Tigre, Anaco |  |
| Sucre | [Q205824](https://www.wikidata.org/wiki/Q205824) Sucre | 896.291 hab. (2011) · 11.800 km² | Carúpano |  |
| Monagas | [Q205776](https://www.wikidata.org/wiki/Q205776) Monagas | 905.443 hab. (2011) · 28.900 km² | Maturín |  |
| Nueva Esparta | [Q204876](https://www.wikidata.org/wiki/Q204876) Nueva Esparta | 491.610 hab. (2011) · 1.150 km² | Porlamar |  |
| Dependencias Federales | [Q130343](https://www.wikidata.org/wiki/Q130343) Dependencias Federales | 2.155 hab. (2011) |  |  |
| Guárico | [Q202075](https://www.wikidata.org/wiki/Q202075) Guárico | 964.264 hab. (2018) · 64.986 km² | Calabozo |  |
| Cojedes | [Q205460](https://www.wikidata.org/wiki/Q205460) Cojedes | 500.420 hab. (2017) · 1.480 km² |  |  |
| Distrito Capital | [Q492791](https://www.wikidata.org/wiki/Q492791) Distrito Capital | 1.930 km² | Caracas |  |
| Barinas | [Q43271](https://www.wikidata.org/wiki/Q43271) Estado Barinas | 35.200 km² |  |  |
| Lara | [Q205796](https://www.wikidata.org/wiki/Q205796) Lara | 2.142.583 hab. (2023) · 19.800 km² | Carora |  |
| Portuguesa | [Q205784](https://www.wikidata.org/wiki/Q205784) Portuguesa | 15.200 km² | Acarigua |  |
| Cusco | [Q205057](https://www.wikidata.org/wiki/Q205057) departamento de Cusco | 1.401.025 hab. (2026) · 71.987 km² | Machu Picchu, Sacsayhuamán |  |
| Ayacucho | [Q205112](https://www.wikidata.org/wiki/Q205112) departamento de Ayacucho | 665.109 hab. (2026) · 43.821 km² |  |  |
| Apurímac | [Q208185](https://www.wikidata.org/wiki/Q208185) departamento de Apurímac | 419.957 hab. (2026) · 20.896 km² |  |  |
| Huancavelica | [Q505220](https://www.wikidata.org/wiki/Q505220) Departamento de Huancavelica | 319.137 hab. (2026) · 22.125 km² |  |  |
| San Martín | [Q211793](https://www.wikidata.org/wiki/Q211793) Departamento de San Martín | 958.305 hab. (2026) · 51.288 km² |  |  |
| Huánuco | [Q215221](https://www.wikidata.org/wiki/Q215221) departamento de Huánuco | 738.642 hab. (2026) · 37.266 km² |  |  |
| Pasco | [Q211208](https://www.wikidata.org/wiki/Q211208) Departamento de Pasco | 264.254 hab. (2026) · 25.026 km² |  |  |
| Junín | [Q207973](https://www.wikidata.org/wiki/Q207973) departamento de Junín | 1.376.453 hab. (2026) · 44.329 km² |  |  |
| Azuay | [Q220451](https://www.wikidata.org/wiki/Q220451) Azuay | 801.609 hab. (2022) · 8.310 km² |  |  |
| Cañar | [Q335471](https://www.wikidata.org/wiki/Q335471) Provincia de Cañar | 227.578 hab. (2022) · 3.647 km² | Ingapirca |  |
| Napo | [Q211900](https://www.wikidata.org/wiki/Q211900) Napo | 131.675 hab. (2022) · 12.543 km² |  |  |
| Tungurahua | [Q504252](https://www.wikidata.org/wiki/Q504252) Provincia de Tungurahua | 563.532 hab. (2022) · 3.386 km² |  |  |
| Chimborazo | [Q238492](https://www.wikidata.org/wiki/Q238492) Chimborazo | 471.933 hab. (2022) · 6.500 km² | Chimborazo |  |
| Bolívar | [Q261165](https://www.wikidata.org/wiki/Q261165) Bolívar | 199.078 hab. (2022) · 3.957 km² |  |  |
| Imbabura | [Q321863](https://www.wikidata.org/wiki/Q321863) Provincia de Imbabura | 469.879 hab. (2022) · 4.791 km² |  |  |
| Cotopaxi | [Q241140](https://www.wikidata.org/wiki/Q241140) Provincia de Cotopaxi | 470.210 hab. (2022) · 6.188 km² | Cotopaxi |  |
| Los Ríos | [Q504260](https://www.wikidata.org/wiki/Q504260) Los Ríos | 898.652 hab. (2022) · 7.238 km² |  |  |
| Pichincha | [Q272586](https://www.wikidata.org/wiki/Q272586) Pichincha | 3.089.473 hab. (2022) · 9.536 km² | Mitad del Mundo, Quito, Sangolquí |  |
| Santo Domingo de los Tsáchilas | [Q1123208](https://www.wikidata.org/wiki/Q1123208) Santo Domingo de los Tsáchilas | 492.969 hab. (2022) · 3.780 km² |  |  |
| Cochabamba | [Q233917](https://www.wikidata.org/wiki/Q233917) Departamento de Cochabamba | 2.016.357 hab. (2024) · 55.631 km² | Quillacollo |  |
| Entre Ríos | [Q44762](https://www.wikidata.org/wiki/Q44762) Provincia de Entre Ríos | 1.425.578 hab. (2022) · 78.781 km² | Concordia |  |
| Paysandú | [Q16576](https://www.wikidata.org/wiki/Q16576) Departamento de Paysandú | 121.838 hab. (2023) · 13.969 km² |  |  |
| Arica y Parinacota | [Q2109](https://www.wikidata.org/wiki/Q2109) Región de Arica y Parinacota | 244.569 hab. (2024) · 16.873 km² |  |  |
| Tarapacá | [Q2114](https://www.wikidata.org/wiki/Q2114) Región de Tarapacá | 369.806 hab. (2024) · 42.226 km² |  |  |
| Antofagasta | [Q2118](https://www.wikidata.org/wiki/Q2118) Región de Antofagasta | 635.416 hab. (2024) · 126.049 km² | Calama |  |
| Salta | [Q44803](https://www.wikidata.org/wiki/Q44803) Provincia de Salta | 1.441.351 hab. (2022) · 155.488 km² |  |  |
| Jujuy | [Q44764](https://www.wikidata.org/wiki/Q44764) Provincia de Jujuy | 811.611 hab. (2022) · 53.219 km² |  |  |
| Artigas | [Q16603](https://www.wikidata.org/wiki/Q16603) Departamento de Artigas | 77.246 hab. (2023) · 11.939 km² |  |  |
| Boquerón | [Q741017](https://www.wikidata.org/wiki/Q741017) Departamento de Boquerón | 68.595 hab. (2022) · 91.669 km² | Mariscal Estigarribia, General Eugenio Alejandrino Garay |  |
| Formosa | [Q44761](https://www.wikidata.org/wiki/Q44761) Provincia de Formosa | 607.419 hab. (2022) · 72.066 km² |  |  |
| Presidente Hayes | [Q750551](https://www.wikidata.org/wiki/Q750551) Departamento de Presidente Hayes | 126.880 hab. (2022) · 72.907 km² |  |  |
| Central | [Q372461](https://www.wikidata.org/wiki/Q372461) Departamento Central | 1.866.562 hab. (2022) · 2.465 km² | San Lorenzo, Ypacaraí |  |
| Asunción | [Q2933](https://www.wikidata.org/wiki/Q2933) Asunción | 462.241 hab. (2022) · 117 km² | Asunción |  |
| Alto Paraná | [Q682654](https://www.wikidata.org/wiki/Q682654) Departamento de Alto Paraná | 784.839 hab. (2022) · 14.895 km² | Ciudad del Este |  |
| Misiones | [Q44798](https://www.wikidata.org/wiki/Q44798) Provincia de Misiones | 1.278.873 hab. (2022) · 29.801 km² | Misiones jesuíticas de San Ignacio Miní |  |
| Itapúa | [Q222564](https://www.wikidata.org/wiki/Q222564) Departamento de Itapúa | 436.966 hab. (2022) · 16.525 km² |  |  |
| Ñeembucú | [Q755115](https://www.wikidata.org/wiki/Q755115) Departamento de Ñeembucú | 85.749 hab. (2022) · 12.147 km² | Pilar |  |
| Chaco | [Q44757](https://www.wikidata.org/wiki/Q44757) Provincia de Chaco | 1.129.606 hab. (2022) · 99.633 km² |  |  |
| Corrientes | [Q44758](https://www.wikidata.org/wiki/Q44758) Provincia de Corrientes | 1.212.696 hab. (2022) · 88.199 km² |  |  |
| Misiones | [Q591194](https://www.wikidata.org/wiki/Q591194) Departamento de Misiones | 114.542 hab. (2022) · 9.556 km² |  |  |
| Alto Paraguay | [Q682642](https://www.wikidata.org/wiki/Q682642) Departamento de Alto Paraguay | 17.608 hab. (2022) · 82.349 km² | Capitan Pablo Lagerenza |  |
| Concepción | [Q741009](https://www.wikidata.org/wiki/Q741009) Departamento de Concepción | 204.536 hab. (2022) · 18.051 km² |  |  |
| Amambay | [Q686586](https://www.wikidata.org/wiki/Q686586) Departamento de Amambay | 173.770 hab. (2022) · 12.933 km² |  |  |
| Canindeyú | [Q279085](https://www.wikidata.org/wiki/Q279085) Departamento de Canindeyú | 189.128 hab. (2022) · 14.667 km² |  |  |
| Catamarca | [Q44756](https://www.wikidata.org/wiki/Q44756) Provincia de Catamarca | 429.562 hab. (2022) · 102.602 km² |  |  |
| Atacama | [Q2120](https://www.wikidata.org/wiki/Q2120) Región de Atacama | 299.180 hab. (2024) · 75.176 km² | Ojos del Salado |  |
| La Rioja | [Q44796](https://www.wikidata.org/wiki/Q44796) Provincia de La Rioja | 383.865 hab. (2022) · 89.680 km² |  |  |
| San Juan | [Q44805](https://www.wikidata.org/wiki/Q44805) Provincia de San Juan | 822.853 hab. (2022) · 89.651 km² |  |  |
| Coquimbo | [Q2121](https://www.wikidata.org/wiki/Q2121) Región de Coquimbo | 832.864 hab. (2024) · 40.580 km² | Coquimbo |  |
| Mendoza | [Q44797](https://www.wikidata.org/wiki/Q44797) Provincia de Mendoza | 2.043.540 hab. (2022) · 148.827 km² | Aconcagua, San Martín, San Rafael |  |
| Santiago | [Q2131](https://www.wikidata.org/wiki/Q2131) Región Metropolitana de Santiago | 7.400.741 hab. (2024) · 15.403 km² | Palacio de La Moneda, Santiago, San Bernardo |  |
| Valparaíso | [Q219458](https://www.wikidata.org/wiki/Q219458) Región de Valparaíso | 1.896.053 hab. (2024) · 16.396 km² | Valparaíso, Viña del Mar, San Antonio |  |
| Maule | [Q2166](https://www.wikidata.org/wiki/Q2166) Región del Maule | 1.123.008 hab. (2024) · 30.296 km² | Curicó |  |
| O'Higgins | [Q2133](https://www.wikidata.org/wiki/Q2133) Región de O'Higgins | 987.228 hab. (2024) · 16.387 km² | Rancagua |  |
| Neuquén | [Q44800](https://www.wikidata.org/wiki/Q44800) Provincia de Neuquén | 710.814 hab. (2022) · 94.078 km² |  |  |
| Ñuble | [Q24076693](https://www.wikidata.org/wiki/Q24076693) Región de Ñuble | 512.289 hab. (2024) · 13.179 km² | Chillán |  |
| La Araucanía | [Q2176](https://www.wikidata.org/wiki/Q2176) Región de La Araucanía | 1.010.423 hab. (2024) · 31.842 km² |  |  |
| Biobío | [Q2170](https://www.wikidata.org/wiki/Q2170) Región del Biobío | 1.613.059 hab. (2024) · 23.890 km² | Talcahuano, Los Angeles |  |
| Los Ríos | [Q2177](https://www.wikidata.org/wiki/Q2177) Región de Los Ríos | 398.230 hab. (2024) · 18.430 km² |  |  |
| Chubut | [Q45007](https://www.wikidata.org/wiki/Q45007) Provincia de Chubut | 592.621 hab. (2022) · 224.686 km² | Comodoro Rivadavia |  |
| Los Lagos | [Q2178](https://www.wikidata.org/wiki/Q2178) Región de Los Lagos | 890.284 hab. (2024) · 48.584 km² | Osorno |  |
| Río Negro | [Q44802](https://www.wikidata.org/wiki/Q44802) Provincia de Río Negro | 750.768 hab. (2022) · 203.013 km² |  |  |
| Aysén del General Carlos Ibáñez del Campo | [Q2181](https://www.wikidata.org/wiki/Q2181) Región de Aysén del General Carlos Ibáñez del Campo | 100.745 hab. (2024) · 108.494 km² | Puerto Aisén |  |
| Santa Cruz | [Q44821](https://www.wikidata.org/wiki/Q44821) Provincia de Santa Cruz | 337.226 hab. (2022) · 243.943 km² | Monte Fitz Roy |  |
| Magallanes y de la Antártica Chilena | [Q2189](https://www.wikidata.org/wiki/Q2189) Región de Magallanes y de la Antártica Chilena | 166.537 hab. (2024) · 132.291 km² |  |  |
| Tierra del Fuego | [Q44832](https://www.wikidata.org/wiki/Q44832) Provincia de Tierra del Fuego, Antártida e Islas del Atlántico Sur | 185.732 hab. (2022) · 987.168 km² |  |  |
| Salto | [Q16595](https://www.wikidata.org/wiki/Q16595) Departamento de Salto | 136.195 hab. (2023) · 14.012 km² |  |  |
| Rivera | [Q16609](https://www.wikidata.org/wiki/Q16609) Departamento de Rivera | 109.300 hab. (2023) · 9.329 km² |  |  |
| Rocha | [Q16582](https://www.wikidata.org/wiki/Q16582) Departamento de Rocha | 80.710 hab. (2023) · 10.540 km² |  |  |
| Treinta y Tres | [Q16610](https://www.wikidata.org/wiki/Q16610) Departamento de Treinta y Tres | 47.705 hab. (2023) · 9.291 km² |  |  |
| Cerro Largo | [Q16575](https://www.wikidata.org/wiki/Q16575) Departamento de Cerro Largo | 91.021 hab. (2023) · 13.641 km² |  |  |
| Buenos Aires | [Q44754](https://www.wikidata.org/wiki/Q44754) Provincia de Buenos Aires | 17.523.996 hab. (2022) · 307.571 km² | La Plata, Mar del Plata, Bahía Blanca |  |
| Maldonado | [Q331196](https://www.wikidata.org/wiki/Q331196) Departamento de Maldonado | 212.841 hab. (2023) · 4.800 km² | La Mano de Punta del Este |  |
| Canelones | [Q16577](https://www.wikidata.org/wiki/Q16577) Departamento de Canelones | 608.956 hab. (2023) · 4.527 km² |  |  |
| Montevideo | [Q1335](https://www.wikidata.org/wiki/Q1335) Montevideo | 1.302.954 hab. (2023) · 730 km² | Palacio Salvo, Montevideo |  |
| San José | [Q16579](https://www.wikidata.org/wiki/Q16579) Departamento de San José | 119.718 hab. (2023) · 5.015 km² |  |  |
| Colonia | [Q16580](https://www.wikidata.org/wiki/Q16580) Departamento de Colonia | 135.797 hab. (2023) · 6.108 km² |  |  |
| Soriano | [Q16584](https://www.wikidata.org/wiki/Q16584) Departamento de Soriano | 83.684 hab. (2023) · 8.995 km² |  |  |
| Río Negro | [Q16596](https://www.wikidata.org/wiki/Q16596) Departamento de Río Negro | 57.338 hab. (2023) · 9.533 km² |  |  |
| Buenos Aires (distrito capital) | [Q1486](https://www.wikidata.org/wiki/Q1486) Buenos Aires | 3.121.707 hab. (2022) · 203 km² | Obelisco de Buenos Aires, Buenos Aires |  |
| Tacuarembó | [Q16587](https://www.wikidata.org/wiki/Q16587) Departamento de Tacuarembó | 96.013 hab. (2023) · 15.973 km² |  |  |
| Durazno | [Q16591](https://www.wikidata.org/wiki/Q16591) Departamento de Durazno | 62.010 hab. (2023) · 12.231 km² |  |  |
| Flores | [Q16578](https://www.wikidata.org/wiki/Q16578) Departamento de Flores | 26.271 hab. (2023) · 5.145 km² |  |  |
| Florida | [Q16593](https://www.wikidata.org/wiki/Q16593) Departamento de Florida | 70.324 hab. (2023) · 10.410 km² |  |  |
| Lavalleja | [Q460435](https://www.wikidata.org/wiki/Q460435) Departamento de Lavalleja | 59.175 hab. (2023) · 10.038 km² |  |  |
| San Pedro | [Q526176](https://www.wikidata.org/wiki/Q526176) Departamento de San Pedro | 341.895 hab. (2022) · 20.002 km² |  |  |
| Caaguazú | [Q880399](https://www.wikidata.org/wiki/Q880399) Departamento de Caaguazú | 430.142 hab. (2022) · 11.474 km² |  |  |
| Cordillera | [Q755121](https://www.wikidata.org/wiki/Q755121) Departamento de Cordillera | 271.475 hab. (2022) · 4.948 km² |  |  |
| Caazapá | [Q881839](https://www.wikidata.org/wiki/Q881839) Departamento de Caazapá | 140.060 hab. (2022) · 9.496 km² | Caazapá |  |
| Paraguarí | [Q240014](https://www.wikidata.org/wiki/Q240014) Departamento de Paraguarí | 199.430 hab. (2022) · 8.705 km² |  |  |
| Guairá | [Q755116](https://www.wikidata.org/wiki/Q755116) Departamento de Guairá | 180.121 hab. (2022) · 3.846 km² |  |  |
| Santa Fe | [Q44823](https://www.wikidata.org/wiki/Q44823) Provincia de Santa Fe | 3.544.908 hab. (2022) · 133.007 km² | Rosario |  |
| Tucumán | [Q44829](https://www.wikidata.org/wiki/Q44829) Provincia de Tucumán | 1.731.820 hab. (2022) · 22.524 km² |  |  |
| Santiago del Estero | [Q44827](https://www.wikidata.org/wiki/Q44827) Provincia de Santiago del Estero | 1.060.906 hab. (2022) · 136.351 km² |  |  |
| San Luis | [Q44818](https://www.wikidata.org/wiki/Q44818) Provincia de San Luis | 542.069 hab. (2022) · 76.748 km² |  |  |
| La Pampa | [Q44795](https://www.wikidata.org/wiki/Q44795) Provincia de La Pampa | 361.859 hab. (2022) · 143.440 km² |  |  |
| Córdoba | [Q44759](https://www.wikidata.org/wiki/Q44759) Provincia de Córdoba | 3.840.905 hab. (2022) · 165.321 km² | Río Cuarto |  |
| Alajuela | [Q502188](https://www.wikidata.org/wiki/Q502188) Provincia de Alajuela | 1.035.464 hab. (2022) · 9.772 km² | Volcán Arenal |  |
| Río San Juan | [Q728155](https://www.wikidata.org/wiki/Q728155) Departamento de Río San Juan | 95.596 hab. (2005) · 7.541 km² | San Carlos |  |
| Ahuachapán | [Q572993](https://www.wikidata.org/wiki/Q572993) Departamento de Ahuachapán | 348.880 hab. (2024) · 1.240 km² |  |  |
| Jutiapa | [Q765984](https://www.wikidata.org/wiki/Q765984) Departamento de Jutiapa | 488.395 hab. (2018) · 3.216 km² |  |  |
| Santa Ana | [Q671158](https://www.wikidata.org/wiki/Q671158) Departamento de Santa Ana | 552.938 hab. (2024) · 2.023 km² |  |  |
| Chiquimula | [Q753037](https://www.wikidata.org/wiki/Q753037) Departamento de Chiquimula | 415.063 hab. (2018) · 2.376 km² |  |  |
| Ocotepeque | [Q867084](https://www.wikidata.org/wiki/Q867084) departamento de Ocotepeque | 146.030 hab. (2013) · 1.630 km² |  |  |
| Chalatenango | [Q522221](https://www.wikidata.org/wiki/Q522221) Departamento de Chalatenango | 185.930 hab. (2024) · 2.017 km² |  |  |
| Lempira | [Q744138](https://www.wikidata.org/wiki/Q744138) Departamento de Lempira | 321.179 hab. (2013) · 4.228 km² |  |  |
| Cabañas | [Q914058](https://www.wikidata.org/wiki/Q914058) Departamento de Cabañas | 143.049 hab. (2024) · 1.104 km² |  |  |
| Intibucá | [Q262125](https://www.wikidata.org/wiki/Q262125) Departamento de Intibucá | 232.553 hab. (2013) · 3.123 km² |  |  |
| Morazán | [Q1122836](https://www.wikidata.org/wiki/Q1122836) Departamento de Morazán | 169.784 hab. (2024) · 1.447 km² |  |  |
| La Paz | [Q866886](https://www.wikidata.org/wiki/Q866886) Departamento de La Paz | 198.926 hab. (2013) · 2.525 km² |  |  |
| San Miguel | [Q930804](https://www.wikidata.org/wiki/Q930804) Departamento de San Miguel | 447.634 hab. (2024) · 2.077 km² |  |  |
| La Unión | [Q1130688](https://www.wikidata.org/wiki/Q1130688) Departamento de La Unión | 224.375 hab. (2024) · 2.074 km² |  |  |
| Valle | [Q867097](https://www.wikidata.org/wiki/Q867097) Departamento de Valle | 174.511 hab. (2013) · 1.665 km² |  |  |
| Atlántico Norte | [Q498452](https://www.wikidata.org/wiki/Q498452) Región Autónoma de la Costa Caribe Norte | 314.130 hab. (2005) · 33.106 km² |  |  |
| Olancho | [Q867089](https://www.wikidata.org/wiki/Q867089) Departamento de Olancho | 520.761 hab. (2013) · 23.905 km² |  |  |
| Gracias a Dios | [Q867112](https://www.wikidata.org/wiki/Q867112) Departamento de Gracias a Dios | 90.765 hab. (2013) · 16.997 km² |  |  |
| Jinotega | [Q728120](https://www.wikidata.org/wiki/Q728120) Departamento de Jinotega | 331.335 hab. (2005) · 9.222 km² |  |  |
| El Paraíso | [Q867108](https://www.wikidata.org/wiki/Q867108) Departamento de El Paraíso | 444.507 hab. (2013) · 7.489 km² |  |  |
| Nueva Segovia | [Q728022](https://www.wikidata.org/wiki/Q728022) Departamento de Nueva Segovia | 208.523 hab. (2005) · 3.491 km² |  |  |
| Chinandega | [Q644024](https://www.wikidata.org/wiki/Q644024) Departamento de Chinandega | 378.970 hab. (2005) · 4.822 km² |  |  |
| Choluteca | [Q899272](https://www.wikidata.org/wiki/Q899272) Departamento de Choluteca | 475.300 hab. (2020) · 4.360 km² |  |  |
| Madriz | [Q728056](https://www.wikidata.org/wiki/Q728056) Departamento de Madriz | 132.459 hab. (2005) · 1.708 km² |  |  |
| Sonora | [Q46422](https://www.wikidata.org/wiki/Q46422) Sonora | 2.850.330 hab. (2015) · 179.503 km² | Mazatlán, Ciudad Obregon |  |
| Baja California | [Q58731](https://www.wikidata.org/wiki/Q58731) Baja California | 3.315.766 hab. (2015) · 71.450 km² | Tijuana, Ensenada |  |
| Chihuahua | [Q655](https://www.wikidata.org/wiki/Q655) Chihuahua | 3.556.574 hab. (2015) · 247.455 km² | Ciudad Juárez |  |
| Coahuila de Zaragoza | [Q53079](https://www.wikidata.org/wiki/Q53079) Coahuila de Zaragoza | 2.954.915 hab. (2010) · 151.595 km² | Torreón |  |
| Tamaulipas | [Q80007](https://www.wikidata.org/wiki/Q80007) Tamaulipas | 3.441.698 hab. (2015) · 80.175 km² | Tampico, Matamoros, Reynosa |  |
| Nuevo León | [Q15282](https://www.wikidata.org/wiki/Q15282) Nuevo León | 5.189.970 hab. (2015) · 64.156 km² |  |  |
| Cayo | [Q508773](https://www.wikidata.org/wiki/Q508773) Distrito de Cayo | 99.105 hab. (2022) · 5.338 km² | Belmopan |  |
| Petén | [Q466061](https://www.wikidata.org/wiki/Q466061) Departamento de Petén | 622.409 hab. (2021) · 35.854 km² | Tikal |  |
| Orange Walk | [Q506036](https://www.wikidata.org/wiki/Q506036) Distrito de Orange Walk | 54.152 hab. (2022) · 4.737 km² |  |  |
| Corozal | [Q512273](https://www.wikidata.org/wiki/Q512273) Distrito de Corozal | 45.310 hab. (2022) · 1.860 km² |  |  |
| Quintana Roo | [Q80245](https://www.wikidata.org/wiki/Q80245) Quintana Roo | 1.857.985 hab. (2020) · 44.705 km² | Tulum, Cancún |  |
| Campeche | [Q80908](https://www.wikidata.org/wiki/Q80908) Campeche | 928.363 hab. (2020) · 57.485 km² |  |  |
| Tabasco | [Q80914](https://www.wikidata.org/wiki/Q80914) Tabasco | 2.402.598 hab. (2020) · 24.738 km² |  |  |
| Chiapas | [Q60123](https://www.wikidata.org/wiki/Q60123) Chiapas | 5.217.908 hab. (2015) · 73.311 km² | Palenque |  |
| San Marcos | [Q883907](https://www.wikidata.org/wiki/Q883907) Departamento de San Marcos | 1.032.277 hab. (2018) · 3.791 km² |  |  |
| Huehuetenango | [Q842266](https://www.wikidata.org/wiki/Q842266) Departamento de Huehuetenango | 1.170.669 hab. (2018) · 7.403 km² |  |  |
| Quiché | [Q669802](https://www.wikidata.org/wiki/Q669802) Departamento de Quiché | 1.081.964 hab. (2021) · 8.378 km² |  |  |
| Alta Verapaz | [Q504637](https://www.wikidata.org/wiki/Q504637) Departamento de Alta Verapaz | 1.355.134 hab. (2021) · 8.686 km² |  |  |
| Guanacaste | [Q690026](https://www.wikidata.org/wiki/Q690026) Provincia de Guanacaste | 412.808 hab. (2022) · 10.196 km² |  |  |
| Rivas | [Q728127](https://www.wikidata.org/wiki/Q728127) Departamento de Rivas | 156.283 hab. (2005) · 2.162 km² | Rivas |  |
| Izabal | [Q693658](https://www.wikidata.org/wiki/Q693658) Departamento de Izabal | 408.688 hab. (2018) · 9.038 km² |  |  |
| Cortés | [Q767244](https://www.wikidata.org/wiki/Q767244) Departamento de Cortés | 1.562.394 hab. (2013) · 3.923 km² |  |  |
| Santa Bárbara | [Q591139](https://www.wikidata.org/wiki/Q591139) Departamento de Santa Bárbara | 421.337 hab. (2013) · 5.024 km² |  |  |
| Copán | [Q843984](https://www.wikidata.org/wiki/Q843984) Departamento de Copán | 371.057 hab. (2013) · 3.242 km² | Copán |  |
| Zacapa | [Q780784](https://www.wikidata.org/wiki/Q780784) Departamento de Zacapa | 245.374 hab. (2018) · 2.690 km² |  |  |
| comarca Ngäbe-Buglé | [Q1129783](https://www.wikidata.org/wiki/Q1129783) Comarca Ngäbe-Buglé | 156.747 hab. (2010) · 6.814 km² |  |  |
| Limón | [Q642644](https://www.wikidata.org/wiki/Q642644) Provincia de Limón | 470.383 hab. (2022) · 9.177 km² |  |  |
| Puntarenas | [Q502170](https://www.wikidata.org/wiki/Q502170) Provincia de Puntarenas | 500.166 hab. (2022) · 11.299 km² |  |  |
| Chiriquí | [Q739651](https://www.wikidata.org/wiki/Q739651) Provincia de Chiriquí | 471.071 hab. (2023) · 6.491 km² |  |  |
| Guna Yala | [Q919017](https://www.wikidata.org/wiki/Q919017) Guna Yala | 33.109 hab. (2010) · 2.358 km² |  |  |
| Emberá-Wounaan | [Q1141041](https://www.wikidata.org/wiki/Q1141041) Emberá-Wounaan | 12.358 hab. (2023) · 4.366 km² |  |  |
| Darién | [Q688660](https://www.wikidata.org/wiki/Q688660) Provincia de Darién | 54.235 hab. (2023) · 11.893 km² |  |  |
| Toledo | [Q506049](https://www.wikidata.org/wiki/Q506049) Distrito de Toledo | 38.944 hab. (2022) · 4.649 km² |  |  |
| Heredia | [Q502192](https://www.wikidata.org/wiki/Q502192) Provincia de Heredia | 479.117 hab. (2022) · 2.663 km² |  |  |
| Panamá | [Q557506](https://www.wikidata.org/wiki/Q557506) Provincia de Panamá | 1.439.575 hab. (2023) · 75.517 km² | Panama City |  |
| Coclé | [Q825799](https://www.wikidata.org/wiki/Q825799) Provincia de Coclé | 268.264 hab. (2023) · 4.927 km² |  |  |
| Veraguas | [Q593137](https://www.wikidata.org/wiki/Q593137) Provincia de Veraguas | 259.791 hab. (2023) · 10.588 km² |  |  |
| Colón | [Q820514](https://www.wikidata.org/wiki/Q820514) Provincia de Colón | 281.956 hab. (2023) · 4.891 km² |  |  |
| Colima | [Q61309](https://www.wikidata.org/wiki/Q61309) Colima | 731.391 hab. (2020) · 5.627 km² |  |  |
| Nayarit | [Q79920](https://www.wikidata.org/wiki/Q79920) Nayarit | 1.223.797 hab. (2015) · 27.857 km² |  |  |
| Baja California Sur | [Q46508](https://www.wikidata.org/wiki/Q46508) Baja California Sur | 637.026 hab. (2010) · 73.909 km² |  |  |
| Sinaloa | [Q80252](https://www.wikidata.org/wiki/Q80252) Sinaloa | 2.966.700 hab. (2015) · 57.377 km² |  |  |
| Ngäbe-Buglé | [Q1129783](https://www.wikidata.org/wiki/Q1129783) Comarca Ngäbe-Buglé | 156.747 hab. (2010) · 6.814 km² |  |  |
| Autónoma de la Costa Caribe Sur | [Q291279](https://www.wikidata.org/wiki/Q291279) Región Autónoma de la Costa Caribe Sur | 306.510 hab. (2005) · 27.260 km² |  |  |
| Colón | [Q867117](https://www.wikidata.org/wiki/Q867117) Departamento de Colón | 309.926 hab. (2013) · 8.249 km² |  |  |
| Atlántida | [Q622619](https://www.wikidata.org/wiki/Q622619) Departamento de Atlántida | 436.252 hab. (2013) · 4.372 km² |  |  |
| Stann Creek | [Q502652](https://www.wikidata.org/wiki/Q502652) Distrito de Stann Creek | 46.342 hab. (2022) · 2.176 km² |  |  |
| Belice | [Q506056](https://www.wikidata.org/wiki/Q506056) Distrito de Belice | 113.630 hab. (2022) · 4.204 km² |  |  |
| Yucatán | [Q60176](https://www.wikidata.org/wiki/Q60176) Yucatán | 2.320.898 hab. (2020) · 39.612 km² | Chichén Itzá |  |
| Veracruz | [Q60130](https://www.wikidata.org/wiki/Q60130) Estado de Veracruz | 8.112.505 hab. (2015) · 71.820 km² | Veracruz, Orizaba, Coatzacoalcos |  |
| Jalisco | [Q13160](https://www.wikidata.org/wiki/Q13160) Jalisco | 7.844.830 hab. (2015) · 78.588 km² |  |  |
| Michoacán | [Q79861](https://www.wikidata.org/wiki/Q79861) Michoacán | 4.584.471 hab. (2015) · 58.599 km² | Uruapan |  |
| Guerrero | [Q60158](https://www.wikidata.org/wiki/Q60158) Guerrero | 3.533.251 hab. (2015) · 63.596 km² |  |  |
| Oaxaca | [Q34110](https://www.wikidata.org/wiki/Q34110) Estado de Oaxaca | 3.967.889 hab. (2015) · 93.793 km² | Monte Albán |  |
| Retalhuleu | [Q888307](https://www.wikidata.org/wiki/Q888307) Departamento de Retalhuleu | 326.828 hab. (2018) · 1.856 km² |  |  |
| Suchitepéquez | [Q883734](https://www.wikidata.org/wiki/Q883734) Departamento de Suchitepéquez | 554.695 hab. (2018) · 2.510 km² |  |  |
| Escuintla | [Q795587](https://www.wikidata.org/wiki/Q795587) Departamento de Escuintla | 733.181 hab. (2018) · 4.384 km² |  |  |
| Santa Rosa | [Q885656](https://www.wikidata.org/wiki/Q885656) Departamento de Santa Rosa | 396.607 hab. (2018) · 2.295 km² |  |  |
| Sonsonate | [Q212540](https://www.wikidata.org/wiki/Q212540) Departamento de Sonsonate | 470.455 hab. (2024) · 1.226 km² |  |  |
| La Libertad | [Q930820](https://www.wikidata.org/wiki/Q930820) Departamento de La Libertad | 765.879 hab. (2024) · 1.653 km² | Joya de Cerén |  |
| La Paz | [Q1129788](https://www.wikidata.org/wiki/Q1129788) Departamento de La Paz | 318.374 hab. (2024) · 1.224 km² |  |  |
| San Vicente | [Q1130180](https://www.wikidata.org/wiki/Q1130180) Departamento de San Vicente | 161.857 hab. (2024) · 1.184 km² |  |  |
| Usulután | [Q1122748](https://www.wikidata.org/wiki/Q1122748) Departamento de Usulután | 325.494 hab. (2024) · 2.130 km² |  |  |
| León | [Q586818](https://www.wikidata.org/wiki/Q586818) Departamento de León | 355.779 hab. (2005) · 5.138 km² |  |  |
| Managua | [Q260009](https://www.wikidata.org/wiki/Q260009) Departamento de Managua | 1.262.978 hab. (2005) · 3.465 km² | Managua |  |
| Carazo | [Q461133](https://www.wikidata.org/wiki/Q461133) Departamento de Carazo | 166.073 hab. (2005) · 1.081 km² |  |  |
| Los Santos | [Q911278](https://www.wikidata.org/wiki/Q911278) Provincia de Los Santos | 98.466 hab. (2023) · 3.809 km² |  |  |
| Herrera | [Q842886](https://www.wikidata.org/wiki/Q842886) Provincia de Herrera | 122.071 hab. (2023) · 2.362 km² |  |  |
| Islas de la Bahía | [Q751725](https://www.wikidata.org/wiki/Q751725) Departamento de Islas de la Bahía | 62.557 hab. (2013) · 236 km² |  |  |
| Matagalpa | [Q728099](https://www.wikidata.org/wiki/Q728099) Departamento de Matagalpa | 469.172 hab. (2005) · 6.804 km² |  |  |
| Boaco | [Q280973](https://www.wikidata.org/wiki/Q280973) Departamento de Boaco | 150.636 hab. (2005) · 4.177 km² |  |  |
| Chontales | [Q498443](https://www.wikidata.org/wiki/Q498443) Departamento de Chontales | 153.932 hab. (2005) · 6.481 km² |  |  |
| Estelí | [Q728015](https://www.wikidata.org/wiki/Q728015) Departamento de Estelí | 201.548 hab. (2005) · 2.230 km² |  |  |
| Granada | [Q258405](https://www.wikidata.org/wiki/Q258405) Departamento de Granada | 168.186 hab. (2005) · 1.040 km² |  |  |
| Masaya | [Q570358](https://www.wikidata.org/wiki/Q570358) Departamento de Masaya | 289.988 hab. (2005) · 611 km² |  |  |
| Comayagua | [Q823443](https://www.wikidata.org/wiki/Q823443) Departamento de Comayagua | 493.466 hab. (2013) · 5.124 km² |  |  |
| Yoro | [Q1123380](https://www.wikidata.org/wiki/Q1123380) Departamento de Yoro | 570.595 hab. (2013) · 7.781 km² |  |  |
| Francisco Morazán | [Q867126](https://www.wikidata.org/wiki/Q867126) Departamento de Francisco Morazán | 1.508.906 hab. (2013) · 8.619 km² | Tegucigalpa |  |
| Chimaltenango | [Q765975](https://www.wikidata.org/wiki/Q765975) Departamento de Chimaltenango | 615.776 hab. (2018) · 1.979 km² |  |  |
| Sacatepéquez | [Q508804](https://www.wikidata.org/wiki/Q508804) Departamento de Sacatepéquez | 330.469 hab. (2018) · 465 km² |  |  |
| Guatemala | [Q695660](https://www.wikidata.org/wiki/Q695660) Departamento de Guatemala | 3.015.081 hab. (2018) · 2.253 km² | Guatemala City |  |
| Jalapa | [Q795441](https://www.wikidata.org/wiki/Q795441) Departamento de Jalapa | 342.923 hab. (2018) · 2.063 km² |  |  |
| El Progreso | [Q795591](https://www.wikidata.org/wiki/Q795591) Departamento de El Progreso | 176.632 hab. (2018) · 1.922 km² |  |  |
| Sololá | [Q178136](https://www.wikidata.org/wiki/Q178136) Departamento de Sololá | 421.583 hab. (2018) · 1.061 km² |  |  |
| Quetzaltenango | [Q844502](https://www.wikidata.org/wiki/Q844502) Departamento de Quetzaltenango | 799.101 hab. (2018) · 1.953 km² |  |  |
| Baja Verapaz | [Q504647](https://www.wikidata.org/wiki/Q504647) Departamento de Baja Verapaz | 299.476 hab. (2018) · 3.124 km² |  |  |
| Totonicapán | [Q885644](https://www.wikidata.org/wiki/Q885644) Departamento de Totonicapán | 418.569 hab. (2018) · 1.061 km² |  |  |
| Cuscatlán | [Q1130677](https://www.wikidata.org/wiki/Q1130677) Departamento de Cuscatlán | 244.901 hab. (2024) · 756 km² |  |  |
| San Salvador | [Q1543219](https://www.wikidata.org/wiki/Q1543219) Departamento de San Salvador | 1.563.371 hab. (2024) · 886 km² | San Salvador |  |
| San José | [Q647808](https://www.wikidata.org/wiki/Q647808) Provincia de San José | 1.601.167 hab. (2022) · 4.970 km² | Teatro Nacional de Costa Rica, San José |  |
| Cartago | [Q502181](https://www.wikidata.org/wiki/Q502181) Provincia de Cartago | 545.092 hab. (2022) · 3.093 km² |  |  |
| México | [Q82112](https://www.wikidata.org/wiki/Q82112) Estado de México | 16.187.608 hab. (2015) · 22.351 km² | Teotihuacán, Nezahualcoyotl, Zumpango |  |
| Puebla | [Q79923](https://www.wikidata.org/wiki/Q79923) Puebla | 6.168.883 hab. (2015) · 34.306 km² | Popocatépetl, Pico de Orizaba |  |
| Morelos | [Q66117](https://www.wikidata.org/wiki/Q66117) Morelos | 1.777.227 hab. (2015) · 4.879 km² |  |  |
| Querétaro | [Q79754](https://www.wikidata.org/wiki/Q79754) Querétaro | 2.038.372 hab. (2015) · 11.699 km² |  |  |
| Hidalgo | [Q80903](https://www.wikidata.org/wiki/Q80903) Hidalgo | 3.082.841 hab. (2020) · 20.821 km² |  |  |
| Guanajuato | [Q46475](https://www.wikidata.org/wiki/Q46475) Guanajuato | 5.853.677 hab. (2015) · 30.607 km² | León, Celaya, Irapuato |  |
| San Luis Potosí | [Q78980](https://www.wikidata.org/wiki/Q78980) San Luis Potosí | 2.717.820 hab. (2015) · 60.983 km² |  |  |
| Zacatecas | [Q80269](https://www.wikidata.org/wiki/Q80269) Zacatecas | 1.690.868 hab. (2015) · 75.539 km² |  |  |
| Aguascalientes | [Q79952](https://www.wikidata.org/wiki/Q79952) Aguascalientes | 1.312.544 hab. (2015) · 5.618 km² |  |  |
| Durango | [Q79918](https://www.wikidata.org/wiki/Q79918) Durango | 1.754.754 hab. (2015) · 123.317 km² | Gómez Palacio |  |
| Tlaxcala | [Q82681](https://www.wikidata.org/wiki/Q82681) Tlaxcala | 1.272.847 hab. (2015) · 3.991 km² |  |  |
| México (distrito capital) | [Q1489](https://www.wikidata.org/wiki/Q1489) Ciudad de México | 9.209.944 hab. (2020) · 1.485 km² | Ángel de la Independencia, Catedral Metropolitana de México, Mexico City |  |
| Noreste | [Q928694](https://www.wikidata.org/wiki/Q928694) Noreste | 1.623 km² |  |  |
| Monte Cristi | [Q592624](https://www.wikidata.org/wiki/Q592624) Provincia de Monte Cristi | 123.519 hab. (2022) · 1.886 km² |  |  |
| Dajabón | [Q1138575](https://www.wikidata.org/wiki/Q1138575) Dajabón | 74.809 hab. (2022) · 1.021 km² |  |  |
| Centro | [Q844528](https://www.wikidata.org/wiki/Q844528) Centro (Haití) | 3.487 km² |  |  |
| La Estrelleta | [Q1137545](https://www.wikidata.org/wiki/Q1137545) Elías Piña | 64.615 hab. (2022) · 1.395 km² | Comendador |  |
| Independencia | [Q1424401](https://www.wikidata.org/wiki/Q1424401) Independencia | 60.692 hab. (2022) · 2.007 km² |  |  |
| Oeste | [Q1434621](https://www.wikidata.org/wiki/Q1434621) Oeste | 4.983 km² | Port-au-Prince |  |
| Sureste | [Q936717](https://www.wikidata.org/wiki/Q936717) Sureste | 2.034 km² |  |  |
| Pedernales | [Q1352533](https://www.wikidata.org/wiki/Q1352533) Pedernales | 34.375 hab. (2022) · 2.081 km² |  |  |
| Guantánamo | [Q115319](https://www.wikidata.org/wiki/Q115319) provincia de Guantánamo | 502.226 hab. (2021) · 6.164 km² |  |  |
| Sur | [Q936704](https://www.wikidata.org/wiki/Q936704) Sur | 2.654 km² |  |  |
| Grand’Anse | [Q913231](https://www.wikidata.org/wiki/Q913231) Grand’Anse | 1.912 km² |  |  |
| Noroeste | [Q608361](https://www.wikidata.org/wiki/Q608361) Noroeste | 2.103 km² |  |  |
| Puerto Rico | [Q1183](https://www.wikidata.org/wiki/Q1183) Puerto Rico | 3.285.874 hab. (2020) · 9.104 km² | Castillo San Cristóbal, San Juan, Mayagüez |  |
| La Altagracia | [Q1323353](https://www.wikidata.org/wiki/Q1323353) La Altagracia | 446.060 hab. (2022) · 2.998 km² |  |  |
| Parroquia de Saint Ann | [Q1326284](https://www.wikidata.org/wiki/Q1326284) Parroquia de Saint Ann | 175.310 hab. (2022) · 1.213 km² |  |  |
| Parroquia de Trelawny | [Q1123340](https://www.wikidata.org/wiki/Q1123340) Parroquia de Trelawny | 77.427 hab. (2022) · 874 km² |  |  |
| Parroquia de Saint James | [Q1421939](https://www.wikidata.org/wiki/Q1421939) Parroquia de Saint James | 188.656 hab. (2022) · 595 km² |  |  |
| Parroquia de Hanover | [Q1131779](https://www.wikidata.org/wiki/Q1131779) Parroquia de Hanover | 69.780 hab. (2022) · 430 km² |  |  |
| Parroquia de Westmoreland | [Q1440250](https://www.wikidata.org/wiki/Q1440250) Parroquia de Westmoreland | 146.205 hab. (2022) · 807 km² |  |  |
| Parroquia de Saint Elizabeth | [Q1473646](https://www.wikidata.org/wiki/Q1473646) Parroquia de Saint Elizabeth | 153.201 hab. (2022) · 1.212 km² |  |  |
| Parroquia de Manchester | [Q920496](https://www.wikidata.org/wiki/Q920496) Parroquia de Manchester | 193.694 hab. (2022) · 830 km² |  |  |
| Parroquia de Clarendon | [Q1095557](https://www.wikidata.org/wiki/Q1095557) Parroquia de Clarendon | 258.643 hab. (2022) · 1.196 km² |  |  |
| Parroquia de Saint Catherine | [Q1473663](https://www.wikidata.org/wiki/Q1473663) Parroquia de Saint Catherine | 542.763 hab. (2022) · 1.192 km² |  |  |
| Parroquia de Saint Andrew | [Q2212935](https://www.wikidata.org/wiki/Q2212935) Parroquia de Saint Andrew | 583.718 hab. (2022) · 455 km² |  |  |
| Parroquia de Kingston | [Q1473680](https://www.wikidata.org/wiki/Q1473680) Parroquia de Kingston | 89.186 hab. (2022) · 25 km² | Kingston |  |
| Parroquia de Saint Thomas | [Q1422332](https://www.wikidata.org/wiki/Q1422332) Parroquia de Saint Thomas | 94.485 hab. (2022) · 743 km² |  |  |
| Parroquia de Portland | [Q125148](https://www.wikidata.org/wiki/Q125148) Parroquia de Portland | 84.972 hab. (2022) · 814 km² |  |  |
| Parroquia de Saint Mary | [Q633565](https://www.wikidata.org/wiki/Q633565) Parroquia de Saint Mary | 116.498 hab. (2022) · 610 km² |  |  |
| El Seibo | [Q1774831](https://www.wikidata.org/wiki/Q1774831) El Seibo | 99.168 hab. (2022) · 1.788 km² |  |  |
| Hato Mayor | [Q937217](https://www.wikidata.org/wiki/Q937217) Hato Mayor | 100.134 hab. (2022) · 1.319 km² |  |  |
| Samaná | [Q1145487](https://www.wikidata.org/wiki/Q1145487) Samaná | 111.990 hab. (2022) · 863 km² |  |  |
| María Trinidad Sánchez | [Q1949656](https://www.wikidata.org/wiki/Q1949656) María Trinidad Sánchez | 156.633 hab. (2022) · 1.207 km² |  |  |
| Espaillat | [Q530231](https://www.wikidata.org/wiki/Q530231) Espaillat | 233.636 hab. (2022) · 843 km² |  |  |
| Puerto Plata | [Q693487](https://www.wikidata.org/wiki/Q693487) Puerto Plata | 388.354 hab. (2022) · 1.806 km² |  |  |
| Norte | [Q943932](https://www.wikidata.org/wiki/Q943932) Norte | 2.115 km² | Ciudadela Laferrière |  |
| Artibonito | [Q844024](https://www.wikidata.org/wiki/Q844024) Artibonito | 4.987 km² |  |  |
| Nippes | [Q125232](https://www.wikidata.org/wiki/Q125232) Nippes | 1.268 km² |  |  |
| Barahona | [Q1137551](https://www.wikidata.org/wiki/Q1137551) Barahona | 226.898 hab. (2024) · 1.666 km² |  |  |
| Azua | [Q794239](https://www.wikidata.org/wiki/Q794239) Provincia de Azua | 236.478 hab. (2022) · 2.686 km² |  |  |
| Peravia | [Q1331932](https://www.wikidata.org/wiki/Q1331932) Peravia | 209.372 hab. (2022) · 785 km² |  |  |
| San Cristóbal | [Q1366107](https://www.wikidata.org/wiki/Q1366107) San Cristóbal | 688.828 hab. (2022) · 1.241 km² |  |  |
| Santo Domingo | [Q1352536](https://www.wikidata.org/wiki/Q1352536) Provincia Santo Domingo | 2.769.589 hab. (2022) · 1.302 km² |  |  |
| Nacional | [Q2499228](https://www.wikidata.org/wiki/Q2499228) Distrito Nacional | 1.029.110 hab. (2022) · 92 km² | Alcázar de Colón, Santo Domingo |  |
| San Pedro de Macorís | [Q1366119](https://www.wikidata.org/wiki/Q1366119) San Pedro de Macorís | 337.145 hab. (2022) · 1.254 km² |  |  |
| La Romana | [Q1140742](https://www.wikidata.org/wiki/Q1140742) La Romana | 287.915 hab. (2022) · 652 km² |  |  |
| Camagüey | [Q215147](https://www.wikidata.org/wiki/Q215147) Provincia de Camagüey | 756.064 hab. (2022) · 15.414 km² |  |  |
| Ciego de Ávila | [Q220692](https://www.wikidata.org/wiki/Q220692) Provincia de Ciego de Ávila | 422.576 hab. (2010) · 6.947 km² |  |  |
| Holguín | [Q115302](https://www.wikidata.org/wiki/Q115302) Provincia de Holguín | 1.037.161 hab. (2010) · 9.210 km² |  |  |
| Isla de la Juventud | [Q115027](https://www.wikidata.org/wiki/Q115027) Isla de la Juventud | 84.263 hab. (2012) · 2.419 km² |  |  |
| Sancti Spíritus | [Q115441](https://www.wikidata.org/wiki/Q115441) Provincia de Sancti Spíritus | 150.000 hab. (2025) · 6.780 km² |  |  |
| Villa Clara | [Q115434](https://www.wikidata.org/wiki/Q115434) Provincia de Villa Clara | 803.562 hab. (2010) · 8.413 km² |  |  |
| Matanzas | [Q115438](https://www.wikidata.org/wiki/Q115438) provincia de Matanzas | 690.113 hab. (2010) · 11.798 km² |  |  |
| Las Tunas | [Q115334](https://www.wikidata.org/wiki/Q115334) Provincia de Las Tunas | 532.645 hab. (2012) · 6.595 km² |  |  |
| Mayabeque | [Q115310](https://www.wikidata.org/wiki/Q115310) provincia de Mayabeque | 380.274 hab. (2011) · 3.733 km² |  |  |
| La Habana | [Q1563](https://www.wikidata.org/wiki/Q1563) La Habana | 2.492.618 hab. (2022) · 728 km² | Capitolio de La Habana, Havana |  |
| Artemisa | [Q115325](https://www.wikidata.org/wiki/Q115325) Provincia de Artemisa | 512.819 hab. (2022) · 4.004 km² |  |  |
| Pinar del Río | [Q115497](https://www.wikidata.org/wiki/Q115497) Provincia de Pinar del Río | 575.545 hab. (2022) · 8.885 km² |  |  |
| Cienfuegos | [Q115444](https://www.wikidata.org/wiki/Q115444) Provincia de Cienfuegos | 404.228 hab. (2012) · 4.187 km² |  |  |
| Granma | [Q115046](https://www.wikidata.org/wiki/Q115046) provincia de Granma | 835.675 hab. (2010) · 8.377 km² | Bayamo |  |
| Santiago de Cuba | [Q234200](https://www.wikidata.org/wiki/Q234200) Provincia de Santiago de Cuba | 1.047.015 hab. (2010) · 6.234 km² | Palma Soriano |  |
| Valverde | [Q1774848](https://www.wikidata.org/wiki/Q1774848) Valverde | 183.738 hab. (2022) · 823 km² |  |  |
| Santiago Rodríguez | [Q2021942](https://www.wikidata.org/wiki/Q2021942) Santiago Rodríguez | 64.635 hab. (2022) · 1.148 km² |  |  |
| La Vega | [Q594405](https://www.wikidata.org/wiki/Q594405) La Vega | 442.720 hab. (2022) · 2.292 km² |  |  |
| Hermanas Mirabal | [Q549386](https://www.wikidata.org/wiki/Q549386) Hermanas Mirabal | 96.442 hab. (2022) · 427 km² |  |  |
| Duarte | [Q1262745](https://www.wikidata.org/wiki/Q1262745) Duarte | 308.353 hab. (2022) · 1.649 km² |  |  |
| Santiago | [Q1772983](https://www.wikidata.org/wiki/Q1772983) Provincia de Santiago (República Dominicana) | 1.000.087 hab. (2023) · 2.806 km² |  |  |
| Bahoruco | [Q807079](https://www.wikidata.org/wiki/Q807079) Bahoruco | 108.717 hab. (2022) · 1.285 km² |  |  |
| San Juan | [Q2001793](https://www.wikidata.org/wiki/Q2001793) Provincia de San Juan | 244.668 hab. (2022) · 3.364 km² |  |  |
| Monseñor Nouel | [Q1295496](https://www.wikidata.org/wiki/Q1295496) Monseñor Nouel | 195.547 hab. (2022) · 992 km² |  |  |
| Sánchez Ramírez | [Q1836903](https://www.wikidata.org/wiki/Q1836903) Sánchez Ramírez | 162.638 hab. (2022) · 1.186 km² |  |  |
| San José de Ocoa | [Q1424391](https://www.wikidata.org/wiki/Q1424391) San José de Ocoa | 69.081 hab. (2022) · 853 km² |  |  |
| Monte Plata | [Q1772745](https://www.wikidata.org/wiki/Q1772745) Monte Plata | 205.499 hab. (2022) · 2.602 km² |  |  |

## Sin id de Wikidata (1)

- Pack Colombia: municipios: San Agustín sin id de Wikidata
