/**
 * Pistas "Para recordarla" escritas a mano para cada ciudad del catálogo (ES / EN): un ancla del mapa
 * (costa, río, isla, región del país, vecina conocida) para recordar DÓNDE está la ciudad.
 * Clave = `name` exacto de src/data/cities.ts. Se carga bajo demanda desde src/lib/cityHints.ts
 * (import dinámico): no forma parte de la carga inicial de la app.
 * Si se agrega una ciudad al catálogo sin pista aquí, la revisión usa la pista generada.
 */
export const CITY_TIPS: Record<string, { es: string; en: string }> = {
  "Tokio": {
    es: "En la costa del Pacífico de Honshu, la isla principal de Japón, al fondo de la bahía de Tokio; el monte Fuji está a unos 100 km al suroeste.",
    en: "On the Pacific side of Honshu, Japan's main island, at the head of Tokyo Bay; Mount Fuji rises about 100 km to the southwest.",
  },
  "Pekín": {
    es: "En el noreste de China, al noroeste del puerto de Tianjín y del mar de Bohai; la Gran Muralla recorre las montañas al norte de la ciudad.",
    en: "In northeastern China, northwest of the port of Tianjin and the Bohai Sea; the Great Wall runs through the hills just north of the city.",
  },
  "Moscú": {
    es: "A orillas del río Moscova, en el oeste de Rusia, en plena llanura europea oriental, a unos 630 km al sureste de San Petersburgo.",
    en: "On the Moskva River in western Russia, on the East European Plain, about 630 km southeast of St Petersburg.",
  },
  "Londres": {
    es: "A orillas del río Támesis, en el sureste de Inglaterra; el meridiano de Greenwich (longitud 0°) pasa por la ciudad.",
    en: "On the River Thames in southeastern England; the Greenwich meridian (0° longitude) passes through the city.",
  },
  "París": {
    es: "A orillas del río Sena, en el norte de Francia, a unos 340 km al sureste de Londres.",
    en: "On the River Seine in northern France, about 340 km southeast of London.",
  },
  "Berlín": {
    es: "A orillas del río Spree, en el noreste de Alemania, a menos de 100 km al oeste de la frontera con Polonia.",
    en: "On the River Spree in northeastern Germany, less than 100 km west of the Polish border.",
  },
  "Roma": {
    es: "En el centro de la bota italiana, a orillas del río Tíber, cerca de la costa del mar Tirreno. Rodea al Vaticano, el país más pequeño del mundo.",
    en: "Midway down Italy's boot, on the River Tiber near the Tyrrhenian coast. It surrounds Vatican City, the world's smallest country.",
  },
  "Madrid": {
    es: "Casi en el centro geográfico de la península ibérica, en plena meseta, a orillas del río Manzanares.",
    en: "Almost at the geographic centre of the Iberian Peninsula, on the central plateau, by the Manzanares River.",
  },
  "Buenos Aires": {
    es: "En la orilla sur del Río de la Plata, en el este de Argentina, frente a Uruguay, que está al otro lado del estuario.",
    en: "On the southern shore of the Río de la Plata estuary in eastern Argentina, across the water from Uruguay.",
  },
  "Ciudad de México": {
    es: "En el centro de México, en un valle alto a más de 2200 m de altitud, rodeado de volcanes como el Popocatépetl.",
    en: "In a high valley in central Mexico, over 2,200 m above sea level, ringed by volcanoes such as Popocatépetl.",
  },
  "El Cairo": {
    es: "A orillas del Nilo, en el norte de Egipto, justo antes de que el río se abra en su delta; las pirámides de Guiza están en su borde oeste.",
    en: "On the Nile in northern Egypt, just south of where the river fans out into its delta; the Giza pyramids lie on its western edge.",
  },
  "Bangkok": {
    es: "A orillas del río Chao Phraya, en el centro de Tailandia, cerca de donde desemboca en el golfo de Tailandia.",
    en: "On the Chao Phraya River in central Thailand, close to where it flows into the Gulf of Thailand.",
  },
  "Seúl": {
    es: "A orillas del río Han, en el noroeste de Corea del Sur, cerca del mar Amarillo y a unos 50 km de la frontera con Corea del Norte.",
    en: "On the Han River in northwestern South Korea, near the Yellow Sea and about 50 km south of the border with North Korea.",
  },
  "Bombay": {
    es: "En la costa oeste de la India, sobre el mar Arábigo, construida sobre siete antiguas islas que se unieron a tierra firme con rellenos.",
    en: "On India's west coast, on the Arabian Sea, built on a former chain of seven islands joined by land reclamation.",
  },
  "Estambul": {
    es: "A ambos lados del estrecho del Bósforo, que une el mar Negro con el de Mármara; está a la vez en Europa y en Asia.",
    en: "On both banks of the Bosphorus, the strait linking the Black Sea and the Sea of Marmara, so it spans Europe and Asia.",
  },
  "Sídney": {
    es: "En la costa sureste de Australia, frente al mar de Tasmania, alrededor de la gran bahía natural de Port Jackson.",
    en: "On Australia's southeastern coast facing the Tasman Sea, built around the large natural harbour of Port Jackson.",
  },
  "Los Ángeles": {
    es: "En el sur de California, en la costa del Pacífico, a unos 200 km al noroeste de la frontera con México.",
    en: "In Southern California on the Pacific coast, about 200 km northwest of the Mexican border.",
  },
  "Río de Janeiro": {
    es: "Junto a la bahía de Guanabara, en la costa atlántica del sureste de Brasil, a unos 360 km al noreste de São Paulo.",
    en: "On Guanabara Bay on Brazil's southeastern Atlantic coast, about 360 km northeast of São Paulo.",
  },
  "Nueva York": {
    es: "En la costa este de Estados Unidos, donde el río Hudson desemboca en el Atlántico, más o menos a medio camino entre Boston y Washington.",
    en: "On the US East Coast where the Hudson River meets the Atlantic, roughly halfway between Boston and Washington, D.C.",
  },
  "Johannesburgo": {
    es: "Tierra adentro, en la alta meseta del Highveld, en el noreste de Sudáfrica, a unos 55 km al sur de Pretoria; nació con una fiebre del oro.",
    en: "Inland on the Highveld plateau of northeastern South Africa, about 55 km south of Pretoria; it was born from a gold rush.",
  },
  "Washington D.C.": {
    es: "A orillas del río Potomac, en la costa este de EE. UU., entre Maryland y Virginia, a unos 330 km al suroeste de Nueva York.",
    en: "On the Potomac River on the US East Coast, between Maryland and Virginia, about 330 km southwest of New York.",
  },
  "Ottawa": {
    es: "A orillas del río Ottawa, en el sureste de Canadá, en el límite entre Ontario y Quebec, a unos 170 km al oeste de Montreal.",
    en: "On the Ottawa River in southeastern Canada, on the Ontario–Quebec border, about 170 km west of Montreal.",
  },
  "Canberra": {
    es: "Tierra adentro, en el sureste de Australia, a unos 250 km al suroeste de Sídney; se creó como capital de compromiso entre Sídney y Melbourne.",
    en: "Inland in southeastern Australia, about 250 km southwest of Sydney; it was built as a compromise capital between Sydney and Melbourne.",
  },
  "Brasilia": {
    es: "En la meseta central, en pleno interior de Brasil y lejos de la costa; es una capital planificada, inaugurada en 1960, con forma de avión.",
    en: "On the central plateau deep in Brazil's interior, far from the coast; a planned capital opened in 1960, laid out like an airplane.",
  },
  "Nairobi": {
    es: "En las tierras altas del centro-sur de Kenia, al este del Gran Valle del Rift, a solo unos 140 km al sur del ecuador.",
    en: "In the highlands of south-central Kenya, just east of the Great Rift Valley, only about 140 km south of the Equator.",
  },
  "Nueva Delhi": {
    es: "En el norte de la India, junto al río Yamuna, a unos 180 km al norte de Agra, la ciudad del Taj Mahal.",
    en: "In northern India on the Yamuna River, about 180 km north of Agra, home of the Taj Mahal.",
  },
  "Yakarta": {
    es: "En la costa noroeste de la isla de Java, en Indonesia, frente al mar de Java.",
    en: "On the northwest coast of the island of Java, Indonesia, facing the Java Sea.",
  },
  "Lima": {
    es: "En la costa central de Perú, frente al océano Pacífico, en una franja de desierto costero entre el mar y los Andes.",
    en: "On Peru's central Pacific coast, in a strip of coastal desert between the ocean and the Andes.",
  },
  "Bogotá": {
    es: "En el centro de Colombia, en una altiplanicie de la cordillera Oriental de los Andes, a más de 2600 m de altitud.",
    en: "In the centre of Colombia, on a high plateau of the Eastern Andes range, over 2,600 m above sea level.",
  },
  "Santiago": {
    es: "En un valle del centro de Chile, entre la cordillera de los Andes y la cordillera de la Costa, a unos 100 km del Pacífico.",
    en: "In a valley in central Chile between the Andes and the Coastal Range, about 100 km inland from the Pacific.",
  },
  "Ankara": {
    es: "En la meseta de Anatolia central, en el corazón de Turquía, a unos 350 km al este-sureste de Estambul.",
    en: "On the central Anatolian plateau in the heart of Turkey, about 350 km east-southeast of Istanbul.",
  },
  "Riad": {
    es: "En el centro de la península arábiga, en pleno desierto, lejos tanto del mar Rojo como del golfo Pérsico.",
    en: "In the middle of the Arabian Peninsula, deep in the desert, far from both the Red Sea and the Persian Gulf.",
  },
  "Teherán": {
    es: "En el norte de Irán, al pie sur de los montes Elburz, la cordillera que la separa del mar Caspio.",
    en: "In northern Iran, at the southern foot of the Alborz Mountains, the range that separates it from the Caspian Sea.",
  },
  "Islamabad": {
    es: "En el norte de Pakistán, al pie de las colinas de Margalla, estribaciones del Himalaya, pegada a la ciudad de Rawalpindi.",
    en: "In northern Pakistan at the foot of the Margalla Hills, in the Himalayan foothills, right next to the city of Rawalpindi.",
  },
  "Hanói": {
    es: "A orillas del río Rojo, en el norte de Vietnam, en pleno delta, a unos 100 km tierra adentro del golfo de Tonkín.",
    en: "On the Red River in northern Vietnam, in its delta, about 100 km inland from the Gulf of Tonkin.",
  },
  "Manila": {
    es: "En la isla de Luzón, en el norte de Filipinas, a orillas de la bahía de Manila, que se abre al mar de la China Meridional.",
    en: "On Luzon, the main northern island of the Philippines, on Manila Bay, which opens onto the South China Sea.",
  },
  "Kuala Lumpur": {
    es: "En el lado oeste de la península malaya, a unos 40 km del estrecho de Malaca y unos 300 km al noroeste de Singapur.",
    en: "On the west side of the Malay Peninsula, about 40 km inland from the Strait of Malacca and some 300 km northwest of Singapore.",
  },
  "Atenas": {
    es: "En el sureste de la Grecia continental, en la península del Ática, junto al golfo Sarónico del mar Egeo.",
    en: "In southeastern mainland Greece, on the Attica peninsula by the Saronic Gulf of the Aegean Sea.",
  },
  "Lisboa": {
    es: "En la costa atlántica de Portugal, donde el río Tajo desemboca en el océano; es la capital más occidental de Europa continental.",
    en: "On Portugal's Atlantic coast at the mouth of the River Tagus; the westernmost capital of mainland Europe.",
  },
  "Varsovia": {
    es: "A orillas del río Vístula, en el centro-este de Polonia, a unos 520 km al este de Berlín.",
    en: "On the Vistula River in east-central Poland, about 520 km east of Berlin.",
  },
  "Budapest": {
    es: "En el centro-norte de Hungría, a orillas del Danubio, que la divide en Buda, con colinas, al oeste y Pest, llana, al este.",
    en: "On the Danube in north-central Hungary; the river splits it into hilly Buda on the west and flat Pest on the east.",
  },
  "Bucarest": {
    es: "En la llanura del sur de Rumanía, a unos 60 km al norte del Danubio, que marca la frontera con Bulgaria.",
    en: "On the plains of southern Romania, about 60 km north of the Danube, which forms the border with Bulgaria.",
  },
  "Kiev": {
    es: "A orillas del río Dniéper, en el centro-norte de Ucrania; el río sigue hacia el sur, cruzando el país hasta el mar Negro.",
    en: "On the Dnieper River in north-central Ukraine; the river flows on south across the country to the Black Sea.",
  },
  "Helsinki": {
    es: "En la costa sur de Finlandia, sobre el golfo de Finlandia, a unos 80 km al norte de Tallin, al otro lado del mar.",
    en: "On Finland's south coast, on the Gulf of Finland, about 80 km north of Tallinn across the water.",
  },
  "Oslo": {
    es: "En el sureste de Noruega, al fondo del fiordo de Oslo, que se abre hacia el sur al estrecho de Skagerrak.",
    en: "In southeastern Norway, at the head of the Oslofjord, which opens south onto the Skagerrak strait.",
  },
  "Copenhague": {
    es: "En la costa este de la isla de Selandia, frente al estrecho de Øresund; un puente la une con Malmö, en Suecia.",
    en: "On the east coast of Zealand island, Denmark, on the Øresund strait; a bridge links it to Malmö in Sweden.",
  },
  "Dublín": {
    es: "En la costa este de Irlanda, donde el río Liffey desemboca en la bahía de Dublín, frente a Gran Bretaña al otro lado del mar de Irlanda.",
    en: "On Ireland's east coast, where the River Liffey enters Dublin Bay, facing Great Britain across the Irish Sea.",
  },
  "Bruselas": {
    es: "En el centro de Bélgica, tierra adentro, a unos 260 km al noreste de París y unos 170 km al sur de Ámsterdam.",
    en: "Inland in central Belgium, about 260 km northeast of Paris and 170 km south of Amsterdam.",
  },
  "Berna": {
    es: "En el centro-oeste de Suiza, en la meseta suiza, dentro de un meandro del río Aar, al norte de los Alpes.",
    en: "In west-central Switzerland, on the Swiss Plateau, wrapped in a loop of the Aare River north of the Alps.",
  },
  "La Habana": {
    es: "En la costa norte del occidente de Cuba, frente al estrecho de Florida, a unos 170 km al sur de Cayo Hueso.",
    en: "On the north coast of western Cuba, facing the Straits of Florida, about 170 km south of Key West.",
  },
  "Caracas": {
    es: "En un valle de la cordillera de la Costa, en el norte de Venezuela, separada del cercano mar Caribe por la montaña El Ávila.",
    en: "In a valley of northern Venezuela's coastal range, cut off from the nearby Caribbean by the El Ávila mountain.",
  },
  "Quito": {
    es: "En los Andes del norte de Ecuador, a más de 2800 m de altitud y a solo unos 20 km al sur de la línea ecuatorial.",
    en: "High in the Andes of northern Ecuador, over 2,800 m up and only about 20 km south of the Equator.",
  },
  "Montevideo": {
    es: "En la costa sur de Uruguay, sobre el Río de la Plata cerca de su salida al Atlántico, a unos 200 km al este de Buenos Aires.",
    en: "On Uruguay's south coast, on the Río de la Plata near the Atlantic, about 200 km east of Buenos Aires across the estuary.",
  },
  "Asunción": {
    es: "A orillas del río Paraguay, en el suroeste de Paraguay, junto a la frontera con Argentina.",
    en: "On the Paraguay River in southwestern Paraguay, near the border with Argentina.",
  },
  "La Paz": {
    es: "En un cañón del altiplano andino, en el oeste de Bolivia, a unos 3600 m, al sureste del lago Titicaca; es la sede de gobierno más alta del mundo.",
    en: "In a canyon on the Andean Altiplano of western Bolivia, about 3,600 m up, southeast of Lake Titicaca; the world's highest seat of government.",
  },
  "Pretoria": {
    es: "En un valle rodeado por las colinas del Magaliesberg, en el noreste de Sudáfrica, a unos 55 km al norte de Johannesburgo.",
    en: "In a sheltered valley among the Magaliesberg hills of northeastern South Africa, about 55 km north of Johannesburg.",
  },
  "Addis Abeba": {
    es: "En el centro de Etiopía, en lo alto de la meseta etíope, a más de 2300 m de altitud, en el Cuerno de África.",
    en: "In the middle of Ethiopia on the high Ethiopian plateau, over 2,300 m above sea level, in the Horn of Africa.",
  },
  "Accra": {
    es: "En la costa sur de Ghana, sobre el golfo de Guinea, muy cerca del meridiano de Greenwich (longitud 0°).",
    en: "On Ghana's south coast on the Gulf of Guinea, just west of the Greenwich meridian (0° longitude).",
  },
  "Dakar": {
    es: "En la península de Cabo Verde, que se adentra en el Atlántico desde Senegal: es la ciudad más occidental de África continental.",
    en: "On the Cap-Vert peninsula jutting into the Atlantic from Senegal; it is the westernmost city of mainland Africa.",
  },
  "Argel": {
    es: "En la costa mediterránea del norte de Argelia, alrededor de una bahía, casi justo al sur de Mallorca (islas Baleares).",
    en: "On the Mediterranean coast of northern Algeria, around a bay, almost due south of Mallorca in the Balearic Islands.",
  },
  "Rabat": {
    es: "En la costa atlántica del noroeste de Marruecos, en la desembocadura del río Bu Regreg, a unos 90 km al noreste de Casablanca.",
    en: "On Morocco's Atlantic coast at the mouth of the Bou Regreg River, about 90 km northeast of Casablanca.",
  },
  "Túnez": {
    es: "En el norte de Túnez, junto al lago de Túnez, una laguna que da al Mediterráneo; las ruinas de Cartago están a pocos kilómetros.",
    en: "In northern Tunisia on the Lake of Tunis, a lagoon opening onto the Mediterranean; the ruins of Carthage are close by.",
  },
  "Singapur": {
    es: "En una isla en la punta sur de la península malaya, frente al estrecho de Singapur, a unos 150 km al norte del ecuador.",
    en: "On an island at the southern tip of the Malay Peninsula, on the Singapore Strait, about 150 km north of the Equator.",
  },
  "Colombo": {
    es: "En la costa oeste de Sri Lanka, la isla con forma de lágrima al sur de la India, frente al océano Índico.",
    en: "On the west coast of Sri Lanka, the teardrop-shaped island south of India, facing the Indian Ocean.",
  },
  "Katmandú": {
    es: "En un valle del Himalaya, en el centro de Nepal, entre la India al sur y China al norte.",
    en: "In a Himalayan valley in central Nepal, between India to the south and China to the north.",
  },
  "Daca": {
    es: "En el centro de Bangladés, a orillas del río Buriganga, en el gran delta del Ganges y el Brahmaputra, al norte del golfo de Bengala.",
    en: "In central Bangladesh on the Buriganga River, in the vast Ganges–Brahmaputra delta north of the Bay of Bengal.",
  },
  "Naipyidó": {
    es: "En el centro de Myanmar, a medio camino entre Rangún, cerca de la costa sur, y Mandalay, al norte.",
    en: "In central Myanmar, roughly midway between Yangon near the southern coast and Mandalay to the north.",
  },
  "Shanghái": {
    es: "Junto a la desembocadura del río Yangtsé en el mar de China Oriental, a mitad de la costa de China.",
    en: "By the mouth of the Yangtze on the East China Sea, halfway along China's coastline.",
  },
  "Barcelona": {
    es: "En la costa mediterránea del noreste de España, a unos 150 km al sur de la frontera con Francia y los Pirineos.",
    en: "On Spain's northeastern Mediterranean coast, about 150 km south of the French border and the Pyrenees.",
  },
  "Múnich": {
    es: "En el sur de Alemania, a orillas del río Isar, cerca de los Alpes y de la frontera con Austria; es la capital de Baviera.",
    en: "In southern Germany on the River Isar, near the Alps and the Austrian border; the capital of Bavaria.",
  },
  "Milán": {
    es: "En la llanura del Po, en el norte de Italia, justo al sur de los Alpes y de los lagos de Como y Mayor.",
    en: "In the Po Valley of northern Italy, just south of the Alps and Lakes Como and Maggiore.",
  },
  "Melbourne": {
    es: "En el sureste de Australia, al fondo de la bahía de Port Phillip, frente al estrecho de Bass que la separa de Tasmania.",
    en: "In southeastern Australia at the head of Port Phillip Bay, facing Bass Strait with Tasmania beyond.",
  },
  "Toronto": {
    es: "En la orilla norte del lago Ontario, en el sureste de Canadá, cerca de las cataratas del Niágara y de la frontera con EE.UU.",
    en: "On the northern shore of Lake Ontario in southeastern Canada, near Niagara Falls and the US border.",
  },
  "Chicago": {
    es: "En la orilla suroeste del lago Míchigan, en el Medio Oeste de EE.UU., en plena región de los Grandes Lagos.",
    en: "On the southwestern shore of Lake Michigan, in the US Midwest's Great Lakes region.",
  },
  "São Paulo": {
    es: "En una meseta del sureste de Brasil, a poca distancia del Atlántico y casi sobre el trópico de Capricornio.",
    en: "On a plateau in southeastern Brazil, a short way inland from the Atlantic and almost on the Tropic of Capricorn.",
  },
  "Lagos": {
    es: "En la costa del golfo de Guinea, en el extremo suroeste de Nigeria, cerca de la frontera con Benín.",
    en: "On the Gulf of Guinea coast in Nigeria's far southwest, close to the border with Benin.",
  },
  "Karachi": {
    es: "En la costa del mar Arábigo, en el sur de Pakistán, justo al oeste del delta del río Indo.",
    en: "On the Arabian Sea coast of southern Pakistan, just west of the Indus River delta.",
  },
  "Ho Chi Minh": {
    es: "La antigua Saigón, en el sur de Vietnam, a orillas del río Saigón, junto al delta del Mekong y cerca del mar de la China Meridional.",
    en: "Formerly Saigon, in southern Vietnam on the Saigon River, next to the Mekong Delta and near the South China Sea.",
  },
  "Osaka": {
    es: "En la bahía de Osaka, en el centro-oeste de la isla de Honshu, a unos 400 km al oeste de Tokio y muy cerca de Kioto.",
    en: "On Osaka Bay in west-central Honshu, about 400 km west of Tokyo and very close to Kyoto.",
  },
  "Dubái": {
    es: "En la costa del golfo Pérsico, en el noreste de la península arábiga, a unos 120 km al noreste de Abu Dabi.",
    en: "On the Persian Gulf coast of the Arabian Peninsula, about 120 km northeast of Abu Dhabi.",
  },
  "San Petersburgo": {
    es: "En el noroeste de Rusia, al fondo del golfo de Finlandia (mar Báltico), donde el río Neva desemboca en el mar.",
    en: "In northwestern Russia at the eastern end of the Gulf of Finland (Baltic Sea), where the Neva River meets the sea.",
  },
  "Casablanca": {
    es: "En la costa atlántica de Marruecos, a unos 90 km al suroeste de Rabat, la capital.",
    en: "On Morocco's Atlantic coast, about 90 km southwest of the capital, Rabat.",
  },
  "Ciudad del Cabo": {
    es: "En la punta suroeste de África, al pie de la Montaña de la Mesa, donde el Atlántico se acerca al cabo de Buena Esperanza.",
    en: "At Africa's southwestern tip, below Table Mountain, near the Cape of Good Hope.",
  },
  "Montreal": {
    es: "En una isla del río San Lorenzo, en el sur de Quebec (Canadá), cerca de la frontera con EE.UU.",
    en: "On an island in the St. Lawrence River in southern Quebec, Canada, close to the US border.",
  },
  "Vancouver": {
    es: "En la costa pacífica del suroeste de Canadá, justo al norte de la frontera con EE.UU.; ojo: no está en la isla de Vancouver, sino frente a ella.",
    en: "On Canada's southwest Pacific coast, just north of the US border; careful: it faces Vancouver Island but is not on it.",
  },
  "Calcuta": {
    es: "En el este de la India, a orillas del río Hugli, un brazo del Ganges cerca del golfo de Bengala, junto a la frontera con Bangladés.",
    en: "In eastern India on the Hooghly, a branch of the Ganges near the Bay of Bengal, close to Bangladesh.",
  },
  "Chennai": {
    es: "La antigua Madrás, en la costa sureste de la India, a orillas del golfo de Bengala.",
    en: "Formerly Madras, on India's southeastern coast along the Bay of Bengal.",
  },
  "Ámsterdam": {
    es: "En el oeste de los Países Bajos, a orillas del río Amstel y a unos 25 km del mar del Norte; famosa por sus canales.",
    en: "In the western Netherlands on the River Amstel, about 25 km from the North Sea; famous for its canals.",
  },
  "Viena": {
    es: "A orillas del Danubio, en el extremo este de Austria, a solo unos 55 km de Bratislava, la capital de Eslovaquia.",
    en: "On the Danube in Austria's far east, only about 55 km from Bratislava, the capital of Slovakia.",
  },
  "Estocolmo": {
    es: "En la costa este de Suecia, repartida en islas donde el lago Mälaren se une al mar Báltico.",
    en: "On Sweden's east coast, spread over islands where Lake Mälaren meets the Baltic Sea.",
  },
  "Praga": {
    es: "A orillas del río Moldava, en el corazón de Bohemia, en el centro-oeste de Chequia.",
    en: "On the Vltava River in the heart of Bohemia, in west-central Czechia.",
  },
  "Marsella": {
    es: "En la costa mediterránea del sur de Francia, justo al este del delta del Ródano; es el gran puerto francés del Mediterráneo.",
    en: "On France's southern Mediterranean coast, just east of the Rhône delta; France's main Mediterranean port.",
  },
  "Lyon": {
    es: "En el centro-este de Francia, donde se unen los ríos Ródano y Saona, en la ruta entre París y el Mediterráneo.",
    en: "In east-central France where the Rhône and Saône rivers meet, on the route from Paris to the Mediterranean.",
  },
  "Hamburgo": {
    es: "En el norte de Alemania, a orillas del río Elba, a unos 100 km de su desembocadura en el mar del Norte.",
    en: "In northern Germany on the River Elbe, about 100 km upstream from where it meets the North Sea.",
  },
  "Nápoles": {
    es: "En el golfo de Nápoles, sobre el mar Tirreno, en el sur de Italia, junto al volcán Vesubio.",
    en: "On the Bay of Naples, on the Tyrrhenian Sea in southern Italy, beside Mount Vesuvius.",
  },
  "Sevilla": {
    es: "En Andalucía, en el sur de España, a orillas del río Guadalquivir y a unos 80 km de su desembocadura en el Atlántico.",
    en: "In Andalusia, southern Spain, on the Guadalquivir River, about 80 km upstream from the Atlantic.",
  },
  "Oporto": {
    es: "En el norte de Portugal, donde el río Duero desemboca en el Atlántico; le da nombre al vino de Oporto.",
    en: "In northern Portugal where the Douro River flows into the Atlantic; it gives its name to port wine.",
  },
  "Cracovia": {
    es: "En el sur de Polonia, a orillas del río Vístula, al norte de los montes Tatra y de la frontera con Eslovaquia.",
    en: "In southern Poland on the Vistula River, north of the Tatra Mountains and the Slovak border.",
  },
  "Gdansk": {
    es: "En la costa báltica del norte de Polonia, cerca de la desembocadura del Vístula en el golfo de Gdansk.",
    en: "On Poland's northern Baltic coast, near the mouth of the Vistula on the Gulf of Gdańsk.",
  },
  "San Francisco": {
    es: "En la punta de una península entre el Pacífico y la bahía de San Francisco, en el norte de California, junto al Golden Gate.",
    en: "At the tip of a peninsula between the Pacific and San Francisco Bay in northern California, by the Golden Gate.",
  },
  "Miami": {
    es: "En el sureste de la península de Florida, sobre la bahía de Biscayne y el Atlántico, a unos 370 km de La Habana.",
    en: "In the southeast of the Florida peninsula, on Biscayne Bay and the Atlantic, about 370 km from Havana.",
  },
  "Guadalajara": {
    es: "En el occidente de México, capital de Jalisco, a unos 460 km al oeste de Ciudad de México y al norte del lago de Chapala.",
    en: "In western Mexico, capital of Jalisco, about 460 km west of Mexico City and just north of Lake Chapala.",
  },
  "Medellín": {
    es: "En el valle de Aburrá, en la cordillera Central de los Andes, al noroeste de Bogotá; la «ciudad de la eterna primavera».",
    en: "In the Aburrá Valley in Colombia's Central Andes, northwest of Bogotá; the \"City of Eternal Spring\".",
  },
  "Córdoba": {
    es: "En el centro de Argentina, al pie de las sierras de Córdoba, a unos 650 km al noroeste de Buenos Aires.",
    en: "In central Argentina at the foot of the Sierras de Córdoba, about 650 km northwest of Buenos Aires.",
  },
  "Recife": {
    es: "En la costa atlántica del noreste de Brasil, cerca del punto más oriental de Sudamérica; una ciudad de ríos y puentes.",
    en: "On Brazil's northeastern Atlantic coast, near the easternmost point of South America; a city of rivers and bridges.",
  },
  "Salvador": {
    es: "A la entrada de la bahía de Todos los Santos, en la costa de Bahía (noreste de Brasil); fue la primera capital del país.",
    en: "At the mouth of the Bay of All Saints on the coast of Bahia, northeastern Brazil; the country's first capital.",
  },
  "Guayaquil": {
    es: "A orillas del río Guayas, cerca del golfo de Guayaquil, en la costa pacífica de Ecuador, al suroeste de Quito.",
    en: "On the Guayas River near the Gulf of Guayaquil, on Ecuador's Pacific coast, southwest of Quito.",
  },
  "Alejandría": {
    es: "En la costa mediterránea de Egipto, en el borde oeste del delta del Nilo, a unos 180 km al noroeste de El Cairo.",
    en: "On Egypt's Mediterranean coast at the western edge of the Nile Delta, about 180 km northwest of Cairo.",
  },
  "Dar es Salaam": {
    es: "En la costa del océano Índico, en el este de Tanzania, al sur de la isla de Zanzíbar.",
    en: "On the Indian Ocean coast of eastern Tanzania, just south of Zanzibar island.",
  },
  "Luanda": {
    es: "En la costa atlántica del noroeste de Angola, a unos 300 km al sur de la desembocadura del río Congo.",
    en: "On Angola's northwestern Atlantic coast, about 300 km south of the mouth of the Congo River.",
  },
  "Cantón": {
    es: "En el sur de China, a orillas del río de las Perlas, a unos 130 km al noroeste de Hong Kong.",
    en: "Guangzhou, in southern China on the Pearl River, about 130 km northwest of Hong Kong.",
  },
  "Shenzhen": {
    es: "Justo al norte de Hong Kong, en el lado este del delta del río de las Perlas, en el sur de China.",
    en: "Directly north of Hong Kong, on the eastern side of the Pearl River Delta in southern China.",
  },
  "Bangalore": {
    es: "En la meseta del Decán, en el sur de la India, casi a medio camino entre las costas este y oeste, a unos 900 m de altura.",
    en: "On the Deccan Plateau in southern India, roughly midway between the east and west coasts, at about 900 m altitude.",
  },
  "Hyderabad": {
    es: "En el centro-sur de la India, sobre la meseta del Decán, a unos 500 km al norte de Bangalore; capital de Telangana.",
    en: "In south-central India on the Deccan Plateau, about 500 km north of Bangalore; capital of Telangana.",
  },
  "Lahore": {
    es: "En el noreste de Pakistán, en el Punyab, a orillas del río Ravi y a unos 25 km de la frontera con la India.",
    en: "In northeastern Pakistan's Punjab, on the Ravi River, about 25 km from the Indian border.",
  },
  "Perth": {
    es: "En la costa oeste de Australia, junto al río Swan, cerca del océano Índico; una de las grandes ciudades más aisladas del mundo.",
    en: "On Australia's west coast, on the Swan River near the Indian Ocean; one of the most isolated big cities on Earth.",
  },
  "Auckland": {
    es: "En un istmo estrecho del norte de la Isla Norte de Nueva Zelanda, entre dos bahías: una hacia el Pacífico y otra hacia el mar de Tasmania.",
    en: "On a narrow isthmus in northern North Island, New Zealand, between two harbours: one on the Pacific, one on the Tasman Sea.",
  },
  "Jeddah": {
    es: "En la costa del mar Rojo, en el oeste de Arabia Saudita; La Meca queda a unos 70 km tierra adentro, hacia el este.",
    en: "On the Red Sea coast of western Saudi Arabia; Mecca lies about 70 km inland to the east.",
  },
  "Izmir": {
    es: "La antigua Esmirna, al fondo de un golfo profundo en la costa del mar Egeo, en el oeste de Turquía.",
    en: "Ancient Smyrna, at the head of a deep gulf on the Aegean coast of western Turkey.",
  },
  "Gotemburgo": {
    es: "En la costa oeste de Suecia, frente al Kattegat, en la desembocadura del río Göta, a medio camino entre Oslo y Copenhague.",
    en: "On Sweden's west coast facing the Kattegat, at the mouth of the Göta River, roughly midway between Oslo and Copenhagen.",
  },
  "Ulán Bator": {
    es: "En el centro-norte de Mongolia, a orillas del río Tuul, entre Rusia y China; es la capital más fría del mundo.",
    en: "In north-central Mongolia on the Tuul River, between Russia and China; the world's coldest capital.",
  },
  "Antananarivo": {
    es: "En las tierras altas del centro de Madagascar, la gran isla frente a la costa sureste de África.",
    en: "In the central highlands of Madagascar, the large island off Africa's southeastern coast.",
  },
  "Biskek": {
    es: "En el norte de Kirguistán, al pie de las montañas del Tian Shan, junto a la frontera con Kazajistán, a unos 200 km al oeste de Almaty.",
    en: "In northern Kyrgyzstan at the foot of the Tian Shan, near the Kazakh border, about 200 km west of Almaty.",
  },
  "Tiflis": {
    es: "A orillas del río Kura, en el Cáucaso, en el centro-este de Georgia, entre el mar Negro y el mar Caspio.",
    en: "On the Kura River in the Caucasus, in east-central Georgia, between the Black and Caspian seas.",
  },
  "Ereván": {
    es: "En el oeste de Armenia, cerca de la frontera con Turquía y frente al monte Ararat; a unos 170 km al sur de Tiflis.",
    en: "In western Armenia near the Turkish border, facing Mount Ararat; about 170 km south of Tbilisi.",
  },
  "Asjabad": {
    es: "En el sur de Turkmenistán, entre el desierto de Karakum y los montes Kopet Dag, muy cerca de la frontera con Irán.",
    en: "In southern Turkmenistan, between the Karakum Desert and the Kopet Dag mountains, very close to the Iranian border.",
  },
  "Dusambé": {
    es: "En el oeste de Tayikistán, en un valle al pie de los montes Hisor, cerca de la frontera con Uzbekistán.",
    en: "In western Tajikistan, in a valley below the Hisor Mountains, near the border with Uzbekistan.",
  },
  "Taskent": {
    es: "En el noreste de Uzbekistán, junto a la frontera con Kazajistán, al pie occidental del Tian Shan; la mayor ciudad de Asia Central.",
    en: "In northeastern Uzbekistan near the Kazakh border, at the western foot of the Tian Shan; Central Asia's largest city.",
  },
  "Astaná": {
    es: "A orillas del río Ishim, en la estepa del centro-norte de Kazajistán; reemplazó como capital a Almaty, muy al sur, en 1997.",
    en: "On the Ishim River in the steppe of north-central Kazakhstan; it replaced Almaty, far to the south, as capital in 1997.",
  },
  "Bakú": {
    es: "En la orilla oeste del mar Caspio, sobre la península de Absherón; es la capital nacional más baja del mundo, bajo el nivel del mar.",
    en: "On the Caspian Sea's western shore, on the Absheron Peninsula; the world's lowest-lying national capital, below sea level.",
  },
  "Riga": {
    es: "Donde el río Daugava desemboca en el golfo de Riga, en el mar Báltico; es la del medio de las tres capitales bálticas.",
    en: "Where the Daugava River meets the Gulf of Riga on the Baltic Sea; the middle one of the three Baltic capitals.",
  },
  "Tallin": {
    es: "En la costa norte de Estonia, sobre el golfo de Finlandia, a unos 80 km al sur de Helsinki cruzando el mar.",
    en: "On Estonia's north coast, on the Gulf of Finland, about 80 km south of Helsinki across the water.",
  },
  "Vilna": {
    es: "En el sureste de Lituania, a orillas del río Neris y cerca de Bielorrusia; de las tres capitales bálticas, es la única tierra adentro.",
    en: "In southeastern Lithuania on the Neris River, near Belarus; of the three Baltic capitals, the only one inland.",
  },
  "Liubliana": {
    es: "En el centro de Eslovenia, a orillas del río Liublianica, entre los Alpes al norte y el mar Adriático al suroeste.",
    en: "In central Slovenia on the Ljubljanica River, between the Alps to the north and the Adriatic Sea to the southwest.",
  },
  "Bratislava": {
    es: "A orillas del Danubio, en el extremo oeste de Eslovaquia, a unos 55 km de Viena; única capital que limita con dos países: Austria y Hungría.",
    en: "On the Danube at Slovakia's western tip, about 55 km east of Vienna; the only capital bordering two countries, Austria and Hungary.",
  },
  "Chisináu": {
    es: "En el centro de Moldavia, a orillas del pequeño río Bîc, entre Rumania al oeste y Ucrania al este.",
    en: "In central Moldova on the small Bîc River, between Romania to the west and Ukraine to the east.",
  },
  "Podgorica": {
    es: "En el sur de Montenegro, junto al río Morača, al norte del lago de Escútari y cerca de la frontera con Albania.",
    en: "In southern Montenegro on the Morača River, just north of Lake Skadar and close to the Albanian border.",
  },
  "Skopie": {
    es: "A orillas del río Vardar, en el norte de Macedonia del Norte, un país sin salida al mar situado justo al norte de Grecia.",
    en: "On the Vardar River in northern North Macedonia, a landlocked country just north of Greece.",
  },
  "Tirana": {
    es: "En el centro de Albania, a unos 30 km tierra adentro del puerto de Durrës, en el Adriático, al pie del monte Dajti.",
    en: "In central Albania, about 30 km inland from the Adriatic port of Durrës, at the foot of Mount Dajti.",
  },
  "Manama": {
    es: "En el extremo noreste de la isla de Baréin, en el golfo Pérsico, entre la costa de Arabia Saudita y la península de Catar.",
    en: "On the northeastern tip of Bahrain Island in the Persian Gulf, between the Saudi coast and the Qatar peninsula.",
  },
  "Timbu": {
    es: "En un valle del Himalaya oriental, en el oeste de Bután, junto al río Wang Chhu, entre la India y el Tíbet.",
    en: "In a valley of the eastern Himalayas in western Bhutan, on the Wang Chhu River, between India and Tibet.",
  },
  "Vientián": {
    es: "A orillas del Mekong, que aquí marca la frontera con Tailandia; es la capital de Laos, el único país sin mar del sudeste asiático.",
    en: "On the Mekong, which here forms the border with Thailand; capital of Laos, Southeast Asia's only landlocked country.",
  },
  "Nom Pen": {
    es: "En el sur de Camboya, donde confluyen los ríos Mekong, Tonlé Sap y Bassac, a unos 200 km al noroeste de Ciudad Ho Chi Minh.",
    en: "In southern Cambodia where the Mekong, Tonlé Sap and Bassac rivers meet, about 200 km northwest of Ho Chi Minh City.",
  },
  "Port Moresby": {
    es: "En la costa sureste de la isla de Nueva Guinea, sobre el mar del Coral, frente al extremo norte de Australia.",
    en: "On the southeastern coast of New Guinea island, on the Coral Sea, facing the northern tip of Australia.",
  },
  "Windhoek": {
    es: "En la meseta central de Namibia, a más de 1.600 m de altura, entre el desierto del Namib al oeste y el Kalahari al este.",
    en: "On Namibia's central plateau, over 1,600 m high, between the Namib Desert to the west and the Kalahari to the east.",
  },
  "Lusaka": {
    es: "En una meseta del centro-sur de Zambia, al norte del río Zambeze y del lago Kariba, que marcan la frontera con Zimbabue.",
    en: "On a plateau in south-central Zambia, north of the Zambezi River and Lake Kariba, which form the border with Zimbabwe.",
  },
  "Maputo": {
    es: "En el extremo sur de Mozambique, sobre la bahía de Maputo en el océano Índico, cerca de las fronteras con Sudáfrica y Esuatini.",
    en: "In the far south of Mozambique, on Maputo Bay on the Indian Ocean, close to the borders with South Africa and Eswatini.",
  },
  "Nuakchot": {
    es: "En la costa atlántica de Mauritania, donde el desierto del Sahara llega al océano, a unos 400 km al norte de Dakar.",
    en: "On Mauritania's Atlantic coast, where the Sahara Desert meets the ocean, about 400 km north of Dakar.",
  },
  "Niamey": {
    es: "A orillas del río Níger, en el extremo suroeste de Níger, cerca de Burkina Faso y lejos del Sahara que cubre el norte del país.",
    en: "On the Niger River in the far southwest of Niger, near Burkina Faso and far from the Sahara that covers the north.",
  },
  "Uagadugú": {
    es: "En el centro de Burkina Faso, un país sin salida al mar del Sahel, situado justo al norte de Ghana.",
    en: "In the center of Burkina Faso, a landlocked Sahel country just north of Ghana.",
  },
  "Bamako": {
    es: "A orillas del río Níger, en el suroeste de Mali, no lejos de Guinea, el país donde nace ese río.",
    en: "On the Niger River in southwestern Mali, not far from Guinea, the country where that river rises.",
  },
  "Yamena": {
    es: "En el suroeste de Chad, donde el río Logone se une al Chari, justo en la frontera con Camerún y al sur del lago Chad.",
    en: "In southwestern Chad where the Logone joins the Chari River, right on the Cameroon border and south of Lake Chad.",
  },
  "Bangui": {
    es: "A orillas del río Ubangui, en el sur de la República Centroafricana; en la otra orilla ya está la R. D. del Congo.",
    en: "On the Ubangi River in the south of the Central African Republic; the opposite bank is already the DR Congo.",
  },
  "Libreville": {
    es: "En la costa atlántica del noroeste de Gabón, en el estuario del río Komo, justo al norte de la línea del ecuador.",
    en: "On Gabon's northwestern Atlantic coast, on the Komo River estuary, just north of the Equator.",
  },
  "Malabo": {
    es: "En la costa norte de la isla de Bioko, en el golfo de Guinea, frente a Camerún, y no en la parte continental del país.",
    en: "On the north coast of Bioko Island in the Gulf of Guinea, off Cameroon, not on the country's mainland.",
  },
  "Yaundé": {
    es: "Tierra adentro en el sur de Camerún, sobre colinas a unos 200 km al este de Duala, el gran puerto del país.",
    en: "Inland in southern Cameroon, on hills about 200 km east of Douala, the country's main port.",
  },
  "Brazzaville": {
    es: "En la orilla norte del río Congo, justo frente a Kinsasa: son las dos capitales más cercanas del mundo, sin contar Roma y el Vaticano.",
    en: "On the north bank of the Congo River facing Kinshasa; the world's two closest capitals, apart from Rome and Vatican City.",
  },
  "Kinsasa": {
    es: "En la orilla sur del río Congo, junto al lago Malebo, en el extremo oeste de la R. D. del Congo; Brazzaville está en la orilla opuesta.",
    en: "On the south bank of the Congo River by Pool Malebo, in the far west of the DR Congo; Brazzaville is on the opposite bank.",
  },
  "Bujumbura": {
    es: "En la punta norte del lago Tanganica, en el oeste de Burundi, con las montañas de la R. D. del Congo al otro lado del agua.",
    en: "At the northern tip of Lake Tanganyika in western Burundi, with the DR Congo's mountains across the water.",
  },
  "Kigali": {
    es: "En el centro de Ruanda, el «país de las mil colinas», en la región de los Grandes Lagos de África, apenas al sur del ecuador.",
    en: "In the center of Rwanda, the 'land of a thousand hills', in Africa's Great Lakes region just south of the Equator.",
  },
  "Kampala": {
    es: "Cerca de la orilla norte del lago Victoria, en el sur de Uganda, a solo unos 40 km al norte del ecuador.",
    en: "Near the northern shore of Lake Victoria in southern Uganda, only about 40 km north of the Equator.",
  },
  "Mogadiscio": {
    es: "En la costa del océano Índico del sur de Somalia, en el Cuerno de África, a unos 230 km al norte del ecuador.",
    en: "On the Indian Ocean coast of southern Somalia, in the Horn of Africa, about 230 km north of the Equator.",
  },
  "Asmara": {
    es: "En la meseta de Eritrea, a más de 2.300 m de altura, a unos 65 km tierra adentro del puerto de Massawa, en el mar Rojo.",
    en: "On the Eritrean highlands, over 2,300 m up, about 65 km inland from the Red Sea port of Massawa.",
  },
  "Paramaribo": {
    es: "Cerca de la desembocadura del río Surinam en el Atlántico, en la costa norte de Sudamérica, entre Guyana y la Guayana Francesa.",
    en: "Near the mouth of the Suriname River on the Atlantic, on South America's north coast, between Guyana and French Guiana.",
  },
  "Georgetown": {
    es: "Donde el río Demerara llega al Atlántico, en la costa de Guyana, al este de Venezuela; parte de la ciudad está bajo el nivel del mar.",
    en: "Where the Demerara River meets the Atlantic on Guyana's coast, east of Venezuela; parts of the city lie below sea level.",
  },
  "Managua": {
    es: "En la orilla sur del lago de Managua, en el oeste de Nicaragua, al noroeste del gran lago de Nicaragua.",
    en: "On the southern shore of Lake Managua in western Nicaragua, northwest of the much larger Lake Nicaragua.",
  },
  "Tegucigalpa": {
    es: "En un valle de montaña del centro-sur de Honduras, a orillas del río Choluteca, lejos del Caribe y más cerca del Pacífico.",
    en: "In a mountain valley of south-central Honduras on the Choluteca River, far from the Caribbean and nearer the Pacific.",
  },
  "San Salvador": {
    es: "En el centro de El Salvador, al pie del volcán de San Salvador; es el único país de Centroamérica sin costa en el Caribe.",
    en: "In central El Salvador at the foot of the San Salvador volcano; the only Central American country with no Caribbean coast.",
  },
  "Marrakech": {
    es: "En una llanura del centro de Marruecos, al pie de las montañas del Alto Atlas, a unos 220 km al sur de Casablanca.",
    en: "On a plain in central Morocco at the foot of the High Atlas mountains, about 220 km south of Casablanca.",
  },
  "Dubrovnik": {
    es: "En el extremo sur de Croacia, sobre el mar Adriático, cerca de la frontera con Montenegro; una ciudad amurallada junto al mar.",
    en: "At Croatia's southern tip on the Adriatic Sea, close to the Montenegro border; a walled city right on the water.",
  },
  "Cartagena": {
    es: "En la costa caribe del norte de Colombia, a unos 100 km al suroeste de Barranquilla y de la desembocadura del río Magdalena.",
    en: "On Colombia's northern Caribbean coast, about 100 km southwest of Barranquilla and the mouth of the Magdalena River.",
  },
  "Cusco": {
    es: "En los Andes del sur de Perú, a 3.400 m de altura y unos 75 km al sureste de Machu Picchu; fue la capital de los incas.",
    en: "In the Andes of southern Peru, 3,400 m up and some 75 km southeast of Machu Picchu; once the capital of the Incas.",
  },
  "Vladivostok": {
    es: "En el extremo sureste de Rusia, sobre el mar de Japón, cerca de China y Corea del Norte; aquí termina el tren Transiberiano.",
    en: "In Russia's far southeast on the Sea of Japan, near China and North Korea; the end of the Trans-Siberian Railway.",
  },
  "Edimburgo": {
    es: "En la costa este de Escocia, en la orilla sur del estuario del Forth, a unos 70 km al este de Glasgow.",
    en: "On Scotland's east coast, on the south shore of the Firth of Forth, about 70 km east of Glasgow.",
  },
  "La Meca": {
    es: "En el oeste de Arabia Saudita, entre montañas, a unos 70 km tierra adentro del puerto de Yeda, en el mar Rojo.",
    en: "In western Saudi Arabia among mountains, about 70 km inland from the Red Sea port of Jeddah.",
  },
  "Zúrich": {
    es: "En el norte de Suiza, en el extremo norte del lago de Zúrich, donde sale el río Limmat, no lejos de la frontera con Alemania.",
    en: "In northern Switzerland at the north end of Lake Zurich, where the Limmat River flows out, not far from Germany.",
  },
  "Mombasa": {
    es: "En la costa del océano Índico del sureste de Kenia, en parte sobre una isla, no lejos de la frontera con Tanzania.",
    en: "On Kenya's southeastern Indian Ocean coast, partly on an island, not far from the Tanzania border.",
  },
  "Samarcanda": {
    es: "En el valle del río Zeravshán, a unos 270 km al suroeste de Taskent, cerca de Tayikistán; parada clave de la Ruta de la Seda.",
    en: "In the Zeravshan River valley, about 270 km southwest of Tashkent, near Tajikistan; a key stop on the Silk Road.",
  },
  "Cancún": {
    es: "En la punta noreste de la península de Yucatán, sobre el mar Caribe, frente al extremo occidental de Cuba.",
    en: "At the northeastern tip of the Yucatán Peninsula on the Caribbean Sea, facing the western end of Cuba.",
  },
  "Chiang Mai": {
    es: "En un valle entre montañas del norte de Tailandia, a orillas del río Ping, cerca de la frontera con Myanmar.",
    en: "In a mountain valley of northern Thailand on the Ping River, near the border with Myanmar.",
  },
  "Mánchester": {
    es: "En el noroeste de Inglaterra, a unos 50 km al este de Liverpool, al pie de los montes Peninos.",
    en: "In northwest England, about 50 km east of Liverpool, at the foot of the Pennine hills.",
  },
  "Fráncfort": {
    es: "A orillas del río Meno, en el centro-oeste de Alemania, a unos 30 km al este de donde ese río se une al Rin.",
    en: "On the River Main in west-central Germany, about 30 km east of where the Main joins the Rhine.",
  },
  "Florencia": {
    es: "A orillas del río Arno, en la Toscana, en el centro de Italia, a unos 230 km al noroeste de Roma.",
    en: "On the River Arno in Tuscany, central Italy, about 230 km northwest of Rome.",
  },
  "Sarajevo": {
    es: "En un valle rodeado de montañas, en el centro de Bosnia y Herzegovina, a orillas del río Miljacka; sede de los Juegos de Invierno de 1984.",
    en: "In a mountain-ringed valley in central Bosnia and Herzegovina, on the Miljacka River; host of the 1984 Winter Olympics.",
  },
  "Zagreb": {
    es: "A orillas del río Sava, en el norte de Croacia, al pie del monte Medvednica y a unos 25 km de la frontera con Eslovenia.",
    en: "On the Sava River in northern Croatia, at the foot of Medvednica mountain, about 25 km from the Slovenian border.",
  },
  "Belgrado": {
    es: "Donde el río Sava desemboca en el Danubio, en el norte de Serbia, en el borde sur de la llanura panónica.",
    en: "Where the Sava River flows into the Danube in northern Serbia, at the southern edge of the Pannonian Plain.",
  },
  "Sofía": {
    es: "En el oeste de Bulgaria, en una cuenca al pie del monte Vitosha, cerca de la frontera con Serbia.",
    en: "In western Bulgaria, in a basin at the foot of Mount Vitosha, close to the Serbian border.",
  },
  "Minsk": {
    es: "En el centro de Bielorrusia, a orillas del río Svislach, en la ruta directa entre Varsovia y Moscú.",
    en: "In the center of Belarus on the Svislach River, on the direct route between Warsaw and Moscow.",
  },
  "Reikiavik": {
    es: "En la costa suroeste de Islandia, junto a la bahía de Faxaflói; es la capital más septentrional de un país soberano.",
    en: "On Iceland's southwest coast, on Faxaflói Bay; the world's northernmost capital of a sovereign state.",
  },
  "Nicosia": {
    es: "Tierra adentro, en la llanura central de la isla de Chipre, en el Mediterráneo oriental, al sur de Turquía y al oeste de Siria.",
    en: "Inland on the central plain of Cyprus, in the eastern Mediterranean, south of Turkey and west of Syria.",
  },
  "La Valeta": {
    es: "En la costa noreste de Malta, en una península entre dos puertos naturales, a menos de 100 km al sur de Sicilia.",
    en: "On Malta's northeast coast, on a peninsula between two natural harbours, less than 100 km south of Sicily.",
  },
  "Luxemburgo": {
    es: "En el sur de Luxemburgo, sobre las gargantas de los ríos Alzette y Pétrusse, entre Bélgica, Francia y Alemania.",
    en: "In southern Luxembourg, above the gorges of the Alzette and Pétrusse rivers, between Belgium, France and Germany.",
  },
  "Bagdad": {
    es: "A orillas del río Tigris, en el centro de Irak, en plena Mesopotamia: la tierra entre el Tigris y el Éufrates.",
    en: "On the Tigris River in central Iraq, in the heart of Mesopotamia, the land between the Tigris and the Euphrates.",
  },
  "Kabul": {
    es: "En un valle entre montañas del este de Afganistán, a orillas del río Kabul y al sur de la cordillera del Hindu Kush.",
    en: "In a mountain valley in eastern Afghanistan, on the Kabul River, south of the Hindu Kush range.",
  },
  "Hong Kong": {
    es: "En la costa sur de China, en el lado este del delta del río de las Perlas, junto a Shenzhen y frente al mar de la China Meridional.",
    en: "On China's south coast, on the east side of the Pearl River Delta, next to Shenzhen and facing the South China Sea.",
  },
  "Taipéi": {
    es: "En el extremo norte de la isla de Taiwán, en una cuenca rodeada de montañas, frente a la costa sureste de China continental.",
    en: "At the northern end of the island of Taiwan, in a basin ringed by mountains, off the southeast coast of mainland China.",
  },
  "Chengdú": {
    es: "En la cuenca de Sichuan, en el suroeste de China, al pie de las montañas que suben hacia el Tíbet; tierra de los pandas gigantes.",
    en: "In the Sichuan Basin of southwest China, at the foot of the mountains rising toward Tibet; home of the giant panda.",
  },
  "Bandar Seri Begawan": {
    es: "En la costa norte de la isla de Borneo, a orillas del río Brunéi; famosa por su aldea de casas sobre pilotes en el agua.",
    en: "On the north coast of Borneo, on the Brunei River; famous for its village of houses on stilts over the water.",
  },
  "Dili": {
    es: "En la costa norte de la isla de Timor, en su mitad oriental, entre el archipiélago de Indonesia y el norte de Australia.",
    en: "On the north coast of the island of Timor, in its eastern half, between the Indonesian islands and northern Australia.",
  },
  "Mascate": {
    es: "En la costa del golfo de Omán, cerca del extremo oriental de la península arábiga, entre montañas rocosas y el mar.",
    en: "On the Gulf of Oman near the eastern tip of the Arabian Peninsula, squeezed between rocky mountains and the sea.",
  },
  "Doha": {
    es: "En la costa este de Catar, la pequeña península que sobresale como un pulgar desde Arabia hacia el golfo Pérsico.",
    en: "On the east coast of Qatar, the small peninsula that sticks out like a thumb from Arabia into the Persian Gulf.",
  },
  "Kuwait": {
    es: "En la bahía de Kuwait, en la esquina noroeste del golfo Pérsico, entre Irak y Arabia Saudita.",
    en: "On Kuwait Bay, in the northwestern corner of the Persian Gulf, between Iraq and Saudi Arabia.",
  },
  "Damasco": {
    es: "En el suroeste de Siria, al pie de los montes del Antilíbano y cerca de Líbano; una de las ciudades habitadas más antiguas del mundo.",
    en: "In southwestern Syria at the foot of the Anti-Lebanon Mountains, near Lebanon; one of the world's oldest inhabited cities.",
  },
  "Ammán": {
    es: "Sobre colinas del noroeste de Jordania, al este del río Jordán y al noreste del mar Muerto.",
    en: "On hills in northwestern Jordan, east of the Jordan River and northeast of the Dead Sea.",
  },
  "Pyongyang": {
    es: "A orillas del río Taedong, en el oeste de Corea del Norte, cerca de la bahía de Corea, en el mar Amarillo.",
    en: "On the Taedong River in western North Korea, near Korea Bay on the Yellow Sea.",
  },
  "San José": {
    es: "En el Valle Central, en el corazón de Costa Rica, rodeada de montañas y volcanes, entre el Pacífico y el Caribe.",
    en: "In the Central Valley, at the heart of Costa Rica, ringed by mountains and volcanoes, between the Pacific and the Caribbean.",
  },
  "Panamá": {
    es: "En la costa pacífica del istmo, junto a la entrada sur del Canal de Panamá, frente al golfo de Panamá.",
    en: "On the Pacific side of the isthmus, at the southern entrance to the Panama Canal, on the Gulf of Panama.",
  },
  "Guatemala": {
    es: "En un valle de las tierras altas del centro-sur de Guatemala, rodeada de volcanes como el de Agua y el Pacaya.",
    en: "In a highland valley in south-central Guatemala, surrounded by volcanoes such as Agua and Pacaya.",
  },
  "Santo Domingo": {
    es: "En la costa sur de La Española, donde el río Ozama desemboca en el Caribe; el asentamiento europeo más antiguo de América aún habitado.",
    en: "On Hispaniola's south coast at the mouth of the Ozama River; the oldest continuously inhabited European settlement in the Americas.",
  },
  "Monterrey": {
    es: "En el noreste de México, al pie de la Sierra Madre Oriental y del Cerro de la Silla, al sur de Texas.",
    en: "In northeastern Mexico, at the foot of the Sierra Madre Oriental and the saddle-shaped Cerro de la Silla, south of Texas.",
  },
  "Cali": {
    es: "En el valle del río Cauca, en el suroeste de Colombia, entre las cordilleras Occidental y Central; la capital mundial de la salsa.",
    en: "In the Cauca River valley of southwestern Colombia, between the Western and Central Andes ranges; the world capital of salsa.",
  },
  "Valparaíso": {
    es: "En la costa del Pacífico del centro de Chile, a unos 100 km al noroeste de Santiago; casas de colores colgadas de los cerros.",
    en: "On the Pacific coast of central Chile, about 100 km northwest of Santiago; known for colorful houses on steep hills.",
  },
  "Rosario": {
    es: "A orillas del río Paraná, a unos 280 km al noroeste de Buenos Aires; la ciudad natal de Lionel Messi.",
    en: "On the Paraná River, about 280 km northwest of Buenos Aires; Lionel Messi's hometown.",
  },
  "Barranquilla": {
    es: "En la costa caribe de Colombia, junto a la desembocadura del río Magdalena, entre Cartagena y Santa Marta.",
    en: "On Colombia's Caribbean coast, by the mouth of the Magdalena River, between Cartagena and Santa Marta.",
  },
  "Ushuaia": {
    es: "En la costa sur de la isla Grande de Tierra del Fuego, frente al canal Beagle; la llaman «la ciudad del fin del mundo».",
    en: "On the south coast of Tierra del Fuego, on the Beagle Channel; nicknamed 'the city at the end of the world'.",
  },
  "Iquitos": {
    es: "En la selva amazónica del noreste de Perú, a orillas del Amazonas; la ciudad más grande del mundo sin acceso por carretera.",
    en: "In the Amazon rainforest of northeastern Peru, on the Amazon River; the largest city in the world that can't be reached by road.",
  },
  "Manaus": {
    es: "En plena Amazonía brasileña, a orillas del río Negro, cerca de donde se une al Solimões para formar el Amazonas.",
    en: "In the heart of the Brazilian Amazon, on the Rio Negro, near where it meets the Solimões to form the Amazon.",
  },
  "Whitehorse": {
    es: "A orillas del río Yukón, en el noroeste de Canadá, no lejos de la frontera con Alaska; es la capital del territorio del Yukón.",
    en: "On the Yukon River in northwestern Canada, not far from the Alaska border; capital of the Yukon territory.",
  },
  "Anchorage": {
    es: "Al fondo de la ensenada de Cook, en el sur de Alaska, junto al golfo de Alaska y con montañas nevadas detrás.",
    en: "At the head of Cook Inlet in southern Alaska, off the Gulf of Alaska, backed by snowy mountains.",
  },
  "Sucre": {
    es: "En un valle andino del centro-sur de Bolivia, al sureste de La Paz y cerca de Potosí; es la capital constitucional del país.",
    en: "In an Andean valley in south-central Bolivia, southeast of La Paz and near Potosí; the country's constitutional capital.",
  },
  "Cayena": {
    es: "En la costa atlántica del noreste de Sudamérica, entre Surinam y Brasil, en la desembocadura del río Cayena.",
    en: "On the Atlantic coast of northeastern South America, between Suriname and Brazil, at the mouth of the Cayenne River.",
  },
  "Belmopan": {
    es: "Tierra adentro, en el centro de Belice, el pequeño país entre México, Guatemala y el mar Caribe.",
    en: "Inland in central Belize, the small country between Mexico, Guatemala and the Caribbean Sea.",
  },
  "Kingston": {
    es: "En la costa sureste de Jamaica, junto a una gran bahía natural, con las Montañas Azules a sus espaldas.",
    en: "On Jamaica's southeast coast, on a large natural harbour, with the Blue Mountains rising behind it.",
  },
  "Port-au-Prince": {
    es: "Al fondo del golfo de Gonâve, en la mitad occidental de la isla La Española, que comparte con República Dominicana.",
    en: "At the head of the Gulf of Gonâve, on the western half of Hispaniola, the island shared with the Dominican Republic.",
  },
  "Nassau": {
    es: "En la isla de Nueva Providencia, en las Bahamas, a unos 300 km al este de Miami, en el océano Atlántico.",
    en: "On New Providence island in the Bahamas, about 300 km east of Miami, in the Atlantic Ocean.",
  },
  "Punta Arenas": {
    es: "A orillas del estrecho de Magallanes, en el extremo sur de Chile continental, frente a la isla de Tierra del Fuego.",
    en: "On the Strait of Magellan at the southern end of mainland Chile, facing the island of Tierra del Fuego.",
  },
  "Curitiba": {
    es: "En una meseta del sur de Brasil, a unos 340 km al suroeste de São Paulo, tierra adentro desde la costa atlántica.",
    en: "On a plateau in southern Brazil, about 340 km southwest of São Paulo, inland from the Atlantic coast.",
  },
  "Puebla": {
    es: "A unos 100 km al sureste de Ciudad de México, en un valle alto con los volcanes Popocatépetl e Iztaccíhuatl al oeste.",
    en: "About 100 km southeast of Mexico City, in a high valley with the Popocatépetl and Iztaccíhuatl volcanoes to the west.",
  },
  "Santa Cruz": {
    es: "En las llanuras tropicales del este de Bolivia, justo donde terminan los Andes; es la ciudad más poblada del país.",
    en: "On the tropical lowlands of eastern Bolivia, just east of the Andes; the country's most populous city.",
  },
  "Arequipa": {
    es: "En un valle andino del sur de Perú, al pie del volcán Misti; sus edificios están hechos de piedra volcánica blanca.",
    en: "In an Andean valley in southern Peru, at the foot of El Misti volcano; its buildings are made of white volcanic stone.",
  },
  "Mendoza": {
    es: "Al pie de los Andes, en el oeste de Argentina, casi enfrente de Santiago de Chile al otro lado de la cordillera; tierra de vinos.",
    en: "At the foot of the Andes in western Argentina, almost opposite Santiago de Chile across the mountains; famous for wine.",
  },
  "Harare": {
    es: "En la meseta del noreste de Zimbabue, a unos 1.500 m de altura, entre los ríos Zambeze al norte y Limpopo al sur.",
    en: "On the high plateau of northeastern Zimbabwe, about 1,500 m up, between the Zambezi River to the north and the Limpopo to the south.",
  },
  "Abiyán": {
    es: "En la costa sur de Costa de Marfil, alrededor de la laguna Ébrié, frente al golfo de Guinea.",
    en: "On the south coast of Ivory Coast, around the Ébrié Lagoon, facing the Gulf of Guinea.",
  },
  "Trípoli": {
    es: "En la costa mediterránea del noroeste de Libia, no lejos de la frontera con Túnez y al sur de Malta, al otro lado del mar.",
    en: "On the Mediterranean coast of northwestern Libya, not far from Tunisia, south of Malta across the sea.",
  },
  "Durban": {
    es: "En la costa del océano Índico, en el este de Sudáfrica, a unos 500 km al sureste de Johannesburgo.",
    en: "On the Indian Ocean coast of eastern South Africa, about 500 km southeast of Johannesburg.",
  },
  "Abuya": {
    es: "En el centro de Nigeria, al norte de donde se unen los ríos Níger y Benue; capital planificada que reemplazó a Lagos.",
    en: "In the center of Nigeria, north of where the Niger and Benue rivers meet; a planned capital that replaced Lagos.",
  },
  "Fez": {
    es: "Tierra adentro en el norte de Marruecos, entre las montañas del Rif y el Atlas Medio, a unos 170 km al este de Rabat.",
    en: "Inland in northern Morocco, between the Rif and Middle Atlas mountains, about 170 km east of Rabat.",
  },
  "Douala": {
    es: "En el estuario del río Wouri, en el rincón más interior del golfo de Guinea, en la costa de Camerún, cerca del monte Camerún.",
    en: "On the Wouri River estuary in the innermost corner of the Gulf of Guinea, on Cameroon's coast near Mount Cameroon.",
  },
  "Kumasi": {
    es: "Tierra adentro, en la zona de selva del centro-sur de Ghana, a unos 200 km al noroeste de Accra; corazón del antiguo reino ashanti.",
    en: "Inland in the forest belt of south-central Ghana, about 200 km northwest of Accra; heart of the old Ashanti kingdom.",
  },
  "Conakry": {
    es: "Sobre una estrecha península que se mete en el Atlántico, en la costa de Guinea, al noroeste de Sierra Leona.",
    en: "On a narrow peninsula jutting into the Atlantic on the coast of Guinea, northwest of Sierra Leone.",
  },
  "Lubumbashi": {
    es: "En el extremo sureste de la RD del Congo, muy cerca de la frontera con Zambia, en el corazón del «cinturón del cobre».",
    en: "In the far southeast of DR Congo, close to the Zambian border, at the heart of the Copperbelt mining region.",
  },
  "Jartum": {
    es: "En el centro de Sudán, justo donde el Nilo Azul y el Nilo Blanco se unen para formar el Nilo.",
    en: "In central Sudan, exactly where the Blue Nile and the White Nile meet to form the Nile.",
  },
  "Yibuti": {
    es: "En el Cuerno de África, sobre el golfo de Adén y cerca del estrecho de Bab el-Mandeb, que separa África de Arabia.",
    en: "In the Horn of Africa, on the Gulf of Aden near the Bab-el-Mandeb strait that separates Africa from Arabia.",
  },
  "Moroni": {
    es: "En la costa oeste de la isla Gran Comora, en el norte del canal de Mozambique, entre Mozambique y Madagascar.",
    en: "On the west coast of Grande Comore island, at the north end of the Mozambique Channel, between Mozambique and Madagascar.",
  },
  "Victoria": {
    es: "En la costa noreste de la isla de Mahé, en las Seychelles, en pleno océano Índico al noreste de Madagascar.",
    en: "On the northeast coast of Mahé island in the Seychelles, out in the Indian Ocean northeast of Madagascar.",
  },
  "Port Louis": {
    es: "En la costa noroeste de la isla Mauricio, en el océano Índico, al este de Madagascar.",
    en: "On the northwest coast of the island of Mauritius, in the Indian Ocean east of Madagascar.",
  },
  "Lomé": {
    es: "En la costa del golfo de Guinea, pegada a la frontera con Ghana, en el extremo suroeste del estrecho territorio de Togo.",
    en: "On the Gulf of Guinea coast, right on the border with Ghana, at the southwest corner of narrow Togo.",
  },
  "Cotonú": {
    es: "En la costa de Benín, entre el lago Nokoué y el golfo de Guinea, más o menos a medio camino entre Lomé y Lagos.",
    en: "On Benin's coast, between Lake Nokoué and the Gulf of Guinea, roughly halfway between Lomé and Lagos.",
  },
  "Monrovia": {
    es: "Sobre el cabo Mesurado, en la costa atlántica de Liberia; su nombre homenajea al presidente estadounidense James Monroe.",
    en: "On Cape Mesurado on Liberia's Atlantic coast; named after US President James Monroe.",
  },
  "Freetown": {
    es: "En una península montañosa de la costa atlántica de Sierra Leona, en la desembocadura del río Sierra Leona, al sureste de Conakry.",
    en: "On a mountainous peninsula on Sierra Leone's Atlantic coast, at the mouth of the Sierra Leone River, southeast of Conakry.",
  },
  "Bisáu": {
    es: "En el estuario del río Geba, en la costa atlántica de Guinea-Bisáu, entre Senegal al norte y Guinea al sur.",
    en: "On the Geba River estuary on the Atlantic coast of Guinea-Bissau, between Senegal to the north and Guinea to the south.",
  },
  "Gaborone": {
    es: "En el extremo sureste de Botsuana, a pocos kilómetros de la frontera con Sudáfrica, al este del desierto del Kalahari.",
    en: "In the far southeast of Botswana, a few kilometres from the South African border, east of the Kalahari Desert.",
  },
  "Maseru": {
    es: "A orillas del río Caledon, en la frontera oeste de Lesoto, un reino montañoso totalmente rodeado por Sudáfrica.",
    en: "On the Caledon River at Lesotho's western border; Lesotho is a mountain kingdom completely surrounded by South Africa.",
  },
};
