# Fase 6c · Monumentos — catálogo para revisión

Borrador (2026-10-23), 241 monumentos y sitios. Para cambiar algo: editar `src/data/landmarkTiers.ts` y correr
`node scripts/build-landmarks.mjs --out <carpeta>` + `python scripts/convert-landmarks.py <carpeta>` (regeneran el catálogo,
las fotos en `public/landmarks`, `credits.json` y `supabase/seed/landmark_places.sql`).

Niveles por lo conocido que es el sitio para un jugador latinoamericano: **Turista** · **Rookie** · **Crack** · **Leyenda**.
Se mide al punto, como una ciudad. Las fotos son la imagen principal de cada sitio en Wikidata (Wikimedia Commons, licencias
libres; el autor y la licencia se muestran en Soporte). Para cambiar una foto: poner otra imagen de Commons como P18 no es
nuestro; en la spec se puede fijar `q` a otra entidad o dejar el sitio sin foto (se muestra solo el nombre).

| Región | Turista | Rookie | Crack | Leyenda | Total |
|---|---|---|---|---|---|
| América | 8 | 18 | 21 | 25 | 72 |
| Europa | 8 | 12 | 21 | 15 | 56 |
| Asia | 5 | 8 | 23 | 22 | 58 |
| África | 1 | 0 | 7 | 8 | 16 |
| Oceanía (solo en Mundo) | 2 | 0 | 2 | 3 | 7 |
| **Total** | 24 | 38 | 74 | 73 | 209 |

## América

- **Turista** (8):
  - Canal de Panamá — Ciudad de Panamá, Panamá · foto CC BY-SA 3.0 (User:Stan Shebs) · [Commons](https://commons.wikimedia.org/wiki/File:Panama_Canal_Gatun_Locks.jpg)
  - Catedral de Sal de Zipaquirá — Zipaquirá, Colombia · foto CC BY-SA 4.0 (Bernard Gagnon) · [Commons](https://commons.wikimedia.org/wiki/File:Catedral_de_Sal_02.jpg)
  - Chichén Itzá — Yucatán, México · foto CC BY-SA 4.0 (Daniel Schwen) · [Commons](https://commons.wikimedia.org/wiki/File:Chichen_Itza_3.jpg)
  - Cristo Redentor — Río de Janeiro, Brasil · foto CC BY-SA 3.0 de (Arne Müseler) · [Commons](https://commons.wikimedia.org/wiki/File:Christ_the_Redeemer_-_Cristo_Redentor.jpg)
  - Estatua de la Libertad — Nueva York, Estados Unidos · foto CC BY-SA 4.0 (Christian David) · [Commons](https://commons.wikimedia.org/wiki/File:Statue_of_Liberty_and_a_sightseeing_boat,_Liberty_Island,_New_York.jpg)
  - Machu Picchu — Cusco, Perú · foto CC BY-SA 3.0 (Martin St-Amant (S23678)) · [Commons](https://commons.wikimedia.org/wiki/File:80_-_Machu_Picchu_-_Juin_2009_-_edit.jpg)
  - Puente Golden Gate — San Francisco, Estados Unidos · foto CC BY 2.5 (Rich Niewiroski Jr.) · [Commons](https://commons.wikimedia.org/wiki/File:GoldenGateBridge-001.jpg)
  - Teotihuacán — Ciudad de México, México · foto CC BY-SA 4.0 (Hdlrosa) · [Commons](https://commons.wikimedia.org/wiki/File:ZA77_Teotihuac%C3%A1n_edo_de_mex_Herberto_de_la_rosa.jpg)
- **Rookie** (18):
  - Ángel de la Independencia — Ciudad de México, México · foto CC BY-SA 4.0 (Carlos Valenzuela) · [Commons](https://commons.wikimedia.org/wiki/File:Angel_de_la_independencia170409.jpg)
  - Capitolio de La Habana — La Habana, Cuba · foto Public domain (Yomangani) · [Commons](https://commons.wikimedia.org/wiki/File:Capitolio_full.jpg)
  - Casa Blanca — Washington, Estados Unidos · foto CC BY-SA 3.0 (This image or media was taken or created) · [Commons](https://commons.wikimedia.org/wiki/File:WhiteHouseSouthFacade.JPG)
  - Casa Rosada — Buenos Aires, Argentina · foto CC BY 3.0 (Dragan) · [Commons](https://commons.wikimedia.org/wiki/File:Casa_Rosada_Buenos_Aires.JPG)
  - Castillo de San Felipe de Barajas — Cartagena, Colombia · foto CC BY-SA 4.0 (Mariordo (Mario Roberto Durán Ortiz)) · [Commons](https://commons.wikimedia.org/wiki/File:Panorama_Castillo_San_Felipe_de_Barajas_CTG_11_2019_2864.jpg)
  - Cerro de Monserrate — Bogotá, Colombia · foto CC BY-SA 4.0 (Felipe Restrepo Acosta) · [Commons](https://commons.wikimedia.org/wiki/File:2017_Bogot%C3%A1_Bas%C3%ADlica_del_Se%C3%B1or_Ca%C3%ADdo_de_Monserrate.jpg)
  - Empire State — Nueva York, Estados Unidos · foto Public domain (Sam Valadi) · [Commons](https://commons.wikimedia.org/wiki/File:Empire_State_Building_(aerial_view).jpg)
  - Estadio Maracaná — Río de Janeiro, Brasil · foto CC BY-SA 3.0 de (Arne Müseler) · [Commons](https://commons.wikimedia.org/wiki/File:Maracana_2022.jpg)
  - Letrero de Hollywood — Los Ángeles, Estados Unidos · foto CC BY-SA 3.0 (Thomas Wolf, www.foto-tw.de) · [Commons](https://commons.wikimedia.org/wiki/File:Hollywood_Sign_(Zuschnitt).jpg)
  - Líneas de Nazca — Nazca, Perú · foto CC BY-SA 4.0 (Diego Delso) · [Commons](https://commons.wikimedia.org/wiki/File:L%C3%ADneas_de_Nazca,_Nazca,_Per%C3%BA,_2015-07-29,_DD_58.JPG)
  - Monte Rushmore — Dakota del Sur, Estados Unidos · foto CC BY-SA 3.0 (Thomas Wolf, www.foto-tw.de) · [Commons](https://commons.wikimedia.org/wiki/File:Mount_Rushmore_detail_view_(100MP).jpg)
  - Obelisco de Buenos Aires — Buenos Aires, Argentina · foto CC BY-SA 4.0 (Sebastianalmaraz) · [Commons](https://commons.wikimedia.org/wiki/File:ObeliscoBA2015.jpg)
  - Pan de Azúcar — Río de Janeiro, Brasil · foto CC BY-SA 3.0 de (Arne Müseler) · [Commons](https://commons.wikimedia.org/wiki/File:P%C3%A3o_de_A%C3%A7ucar_-_Sugarloaf_Mountain_-_Zuckerhut_-_2022.jpg)
  - Piedra del Peñol — Guatapé, Colombia · foto CC BY-SA 3.0 (Camilo Sanchez at English Wikipedia) · [Commons](https://commons.wikimedia.org/wiki/File:Elpenolantioquia.JPG)
  - Puente de Brooklyn — Nueva York, Estados Unidos · foto CC BY 2.0 (Taken by Jeffrey Bary, uploaded by CPack) · [Commons](https://commons.wikimedia.org/wiki/File:NYCBrooklynBridge.jpg)
  - Santuario de Las Lajas — Ipiales, Colombia · foto CC BY-SA 4.0 (Diego Delso) · [Commons](https://commons.wikimedia.org/wiki/File:Santuario_de_Las_Lajas,_Ipiales,_Colombia,_2015-07-21,_DD_21-23_HDR.jpg)
  - Tikal — Petén, Guatemala · foto CC BY-SA 4.0 (Mundo Maya) · [Commons](https://commons.wikimedia.org/wiki/File:Tikal_3.jpg)
  - Torre CN — Toronto, Canadá · foto CC BY-SA 4.0 (Chris Woodrich) · [Commons](https://commons.wikimedia.org/wiki/File:CN_Tower_from_Puente_de_Luz,_Toronto,_Ontario,_2025-08-25_01.jpg)
- **Crack** (21):
  - Alcatraz — San Francisco, Estados Unidos · foto CC BY-SA 4.0 (Frank Schulenburg) · [Commons](https://commons.wikimedia.org/wiki/File:Alcatraz_Island_as_seen_from_the_East.jpg)
  - Capitolio de Estados Unidos — Washington, Estados Unidos · foto Public domain (United_States_Capitol_-_west_front.jpg: ) · [Commons](https://commons.wikimedia.org/wiki/File:United_States_Capitol_west_front_edit2.jpg)
  - Castillo de Chapultepec — Ciudad de México, México · foto CC BY-SA 4.0 (Own work) · [Commons](https://commons.wikimedia.org/wiki/File:Vista_a%C3%A9rea_del_Castillo_de_Chapultepec_7.jpg)
  - Castillo San Felipe del Morro — San Juan, Puerto Rico · foto CC BY-SA 3.0 (Joshua Wood) · [Commons](https://commons.wikimedia.org/wiki/File:Castillo_San_Felipe_del_Morro3.jpg)
  - Catedral de Brasilia — Brasilia, Brasil · foto CC BY-SA 4.0 (Mariordo (Mario Roberto Durán Ortiz)) · [Commons](https://commons.wikimedia.org/wiki/File:Brasilia_Catedral_08_2005_03.jpg)
  - Catedral Metropolitana de México — Ciudad de México, México · foto CC BY-SA 4.0 (ProtoplasmaKid) · [Commons](https://commons.wikimedia.org/wiki/File:Catedral_Metropolitana_de_la_Ciudad_de_M%C3%A9xico_1.jpg)
  - Château Frontenac — Quebec, Canadá · foto CC BY-SA 3.0 (Bernard Gagnon) · [Commons](https://commons.wikimedia.org/wiki/File:Ch%C3%A2teau_Frontenac01.jpg)
  - Ciudad Perdida — Santa Marta, Colombia · foto CC BY 2.0 (Gavin Rough from Waterloo, Canada) · [Commons](https://commons.wikimedia.org/wiki/File:Lost_City_Ruins.jpg)
  - Copán — Copán Ruinas, Honduras · foto CC0 (Nosferattus) · [Commons](https://commons.wikimedia.org/wiki/File:Cop%C3%A1n_Stela_B.jpg)
  - Gateway Arch — San Luis, Estados Unidos · foto CC BY 2.0 ([https://www.flickr.com/photos/11399912@) · [Commons](https://commons.wikimedia.org/wiki/File:St_Louis_Gateway_Arch.jpg)
  - Mitad del Mundo — Quito, Ecuador · foto CC0 (Kaldari) · [Commons](https://commons.wikimedia.org/wiki/File:Mitad_del_Mundo_01.jpg)
  - Monte Albán — Oaxaca, México · foto CC BY-SA 3.0 (Wikimedia Commons) · [Commons](https://commons.wikimedia.org/wiki/File:Monte_Alb%C3%A1n_archeological_site,_Oaxaca.jpg)
  - Monumento a Lincoln — Washington, Estados Unidos · foto Public domain (Aerial_view_of_Lincoln_Memorial_-_east_s) · [Commons](https://commons.wikimedia.org/wiki/File:Aerial_view_of_Lincoln_Memorial_-_east_side_EDIT.jpeg)
  - Palacio de La Moneda — Santiago, Chile · foto CC BY-SA 2.0 (Miguel hernandez) · [Commons](https://commons.wikimedia.org/wiki/File:Palacio_de_La_Moneda_-_miguelreflex.jpg)
  - Palenque — Chiapas, México · foto CC BY-SA 4.0 (AlejandroLinaresGarcia) · [Commons](https://commons.wikimedia.org/wiki/File:PalacioMunicipalPalenque.JPG)
  - Parque Arqueológico de San Agustín — San Agustín, Colombia · foto CC BY-SA 4.0 (Bernard Gagnon) · [Commons](https://commons.wikimedia.org/wiki/File:Parque_Arqueol%C3%B3gico_de_San_Agust%C3%ADn-Mesita_A_12.jpg)
  - Presa Hoover — Nevada, Estados Unidos · foto Public domain (Ansel Adams) · [Commons](https://commons.wikimedia.org/wiki/File:Ansel_Adams_-_National_Archives_79-AAB-01.jpg)
  - Sacsayhuamán — Cusco, Perú · foto CC BY-SA 3.0 (Leon Petrosyan) · [Commons](https://commons.wikimedia.org/wiki/File:Sacsayhuaman_Inca.jpg)
  - Space Needle — Seattle, Estados Unidos · foto CC BY-SA 4.0 (Another Believer) · [Commons](https://commons.wikimedia.org/wiki/File:Seattle,_October_6,_2023_-_60.jpg)
  - Tiwanaku — La Paz, Bolivia · foto Public domain (Mhwater) · [Commons](https://commons.wikimedia.org/wiki/File:Zonnepoort_tiwanaku.jpg)
  - Tulum — Quintana Roo, México · foto CC BY-SA 3.0 (Haakon S. Krohn) · [Commons](https://commons.wikimedia.org/wiki/File:Tulum_palacio_municipal.jpg)
- **Leyenda** (25):
  - Alcázar de Colón — Santo Domingo, República Dominicana · foto CC BY-SA 4.0 (Martin Falbisoner) · [Commons](https://commons.wikimedia.org/wiki/File:Santo_Domingo_-_Alcazar_de_Colon_02.JPG)
  - Caral — Supe, Perú · foto CC BY 2.5 (Håkan Svensson Xauxa) · [Commons](https://commons.wikimedia.org/wiki/File:PeruCaral01.jpg)
  - Castillo San Cristóbal — San Juan, Puerto Rico · foto Public domain (Daderot) · [Commons](https://commons.wikimedia.org/wiki/File:Fort_San_Crist%C3%B3bal_(Puerto_Rico)_-_IMG_0173.JPG)
  - Chan Chan — Trujillo, Perú · foto CC BY-SA 4.0 (Draceane) · [Commons](https://commons.wikimedia.org/wiki/File:Chan_Chan,_2023_(32).jpg)
  - Ciudadela Laferrière — Cabo Haitiano, Haití · foto Public domain (SPC Gibran Torres, United States Army) · [Commons](https://commons.wikimedia.org/wiki/File:Citadelle_Laferri%C3%A8re_Aerial_View.jpg)
  - Congreso Nacional de Brasil — Brasilia, Brasil · foto CC BY-SA 2.0 (Gribiche (Rob Sinclair)) · [Commons](https://commons.wikimedia.org/wiki/File:Congresso_Nacional.jpg)
  - El Álamo — San Antonio, Estados Unidos · foto CC BY-SA 4.0 (Zygmunt Put Zetpe0202) · [Commons](https://commons.wikimedia.org/wiki/File:Alamo_Mission,_San_Antonio,_Texas,_USA.jpg)
  - Faro del Fin del Mundo — Ushuaia, Argentina · foto CC BY 2.0 (Ricardo Martins) · [Commons](https://commons.wikimedia.org/wiki/File:Les_Eclaireurs_Lighthouse.jpg)
  - Fuerte de Samaipata — Samaipata, Bolivia · foto CC BY-SA 3.0 (Mhwater at Dutch Wikipedia) · [Commons](https://commons.wikimedia.org/wiki/File:Fuerte03.jpg)
  - Habitat 67 — Montreal, Canadá · foto CC BY 2.0 (Parcours riverain - Ville de Montréal fr) · [Commons](https://commons.wikimedia.org/wiki/File:Habitat_67,_2600,_avenue_Pierre-Dupuy_(Ville-Marie)_(35399872943).jpg)
  - Independence Hall — Filadelfia, Estados Unidos · foto CC BY-SA 3.0 (Mys 721tx) · [Commons](https://commons.wikimedia.org/wiki/File:Exterior_of_the_Independence_Hall,_Aug_2019.jpg)
  - Ingapirca — Cañar, Ecuador · foto CC BY-SA 3.0 (Bernard Gagnon) · [Commons](https://commons.wikimedia.org/wiki/File:Ingapirca_03.jpg)
  - Joya de Cerén — San Juan Opico, El Salvador · foto CC BY-SA 3.0 (Mariordo (Mario Roberto Duran Ortiz)) · [Commons](https://commons.wikimedia.org/wiki/File:ES_Joya_Ceren_05_2012_Estructura_9_Area_2_Tamazcal_wide_angle_1479.JPG)
  - Kuélap — Chachapoyas, Perú · foto CC BY-SA 2.5 (Elemaki) · [Commons](https://commons.wikimedia.org/wiki/File:Kuelap.jpg)
  - La Mano de Punta del Este — Punta del Este, Uruguay · foto CC0 (María Cecilia) · [Commons](https://commons.wikimedia.org/wiki/File:La_mano_de_Punta_del_Este.JPG)
  - Mesa Verde — Colorado, Estados Unidos · foto CC BY 2.0 (Elaine from Sheffield, England) · [Commons](https://commons.wikimedia.org/wiki/File:Mesa_Verde.jpg)
  - Misiones jesuíticas de San Ignacio Miní — Misiones, Argentina · foto CC BY-SA 2.5 (Loco085) · [Commons](https://commons.wikimedia.org/wiki/File:Ruinas-san-ignacio.jpg)
  - Montículos de Cahokia — San Luis, Estados Unidos · foto CC BY-SA 3.0 (Skubasteve834) · [Commons](https://commons.wikimedia.org/wiki/File:Monks_Mound_in_July.JPG)
  - Ouro Preto — Minas Gerais, Brasil · foto CC BY-SA 4.0 (Raquel Mendes Silva) · [Commons](https://commons.wikimedia.org/wiki/File:Conjunto_arquitet%C3%B4nico_e_urban%C3%ADstico_de_Ouro_Preto.JPG)
  - Palacio Salvo — Montevideo, Uruguay · foto CC BY-SA 3.0 (Coolcaesar) · [Commons](https://commons.wikimedia.org/wiki/File:Palaciosalvouruguay.jpg)
  - Parlamento de Canadá — Ottawa, Canadá · foto CC BY-SA 3.0 (David Samuel, User:Hellodavey1902) · [Commons](https://commons.wikimedia.org/wiki/File:Parliament_Hill,_Ottawa.jpg)
  - Pelourinho — Salvador de Bahía, Brasil · foto Public domain (Miquel Girones) · [Commons](https://commons.wikimedia.org/wiki/File:Pelourinho.png)
  - Puente de Boyacá — Tunja, Colombia · foto Public domain (Néstor Daza) · [Commons](https://commons.wikimedia.org/wiki/File:Puente_Boyaca_Nov_09_2005.jpg)
  - Teatro Nacional de Costa Rica — San José, Costa Rica · foto CC BY-SA 4.0 (Mariordo ((Mario Roberto Durán Ortiz)) · [Commons](https://commons.wikimedia.org/wiki/File:Teatro_Nacional_CRI_07_2019_8963.jpg)
  - Tierradentro — Inzá, Colombia · foto CC BY 2.0 (inyucho) · [Commons](https://commons.wikimedia.org/wiki/File:Tombs_in_Tierra_Dentro.jpg)

## Europa

- **Turista** (8):
  - Acrópolis de Atenas — Atenas, Grecia · foto CC BY-SA 3.0 (A.Savin) · [Commons](https://commons.wikimedia.org/wiki/File:Attica_06-13_Athens_50_View_from_Philopappos_-_Acropolis_Hill.jpg)
  - Basílica de San Pedro — Ciudad del Vaticano, Vaticano · foto CC BY-SA 4.0 (Alvesgaspar) · [Commons](https://commons.wikimedia.org/wiki/File:Basilica_di_San_Pietro_in_Vaticano_September_2015-1a.jpg)
  - Big Ben — Londres, Reino Unido · foto CC BY-SA 4.0 (Christian David) · [Commons](https://commons.wikimedia.org/wiki/File:Elizabeth_Tower_and_the_north_front_of_the_Palace_of_Westminster,_London.jpg)
  - Coliseo — Roma, Italia · foto CC BY-SA 4.0 (FeaturedPics) · [Commons](https://commons.wikimedia.org/wiki/File:Colosseo_2020.jpg)
  - Kremlin y Plaza Roja — Moscú, Rusia · foto CC BY-SA 3.0 (A.Savin) · [Commons](https://commons.wikimedia.org/wiki/File:Moscow_05-2012_Kremlin_22.jpg)
  - Sagrada Familia — Barcelona, España · foto CC BY-SA 4.0 (Canaan) · [Commons](https://commons.wikimedia.org/wiki/File:SF_maig_2026.jpg)
  - Torre de Pisa — Pisa, Italia · foto CC BY-SA 4.0 (Chabe01) · [Commons](https://commons.wikimedia.org/wiki/File:Campanile_D%C3%B4me_-_Pise_(IT52)_-_2022-08-31_-_20.jpg)
  - Torre Eiffel — París, Francia · foto Public domain (Benh LIEU SONG) · [Commons](https://commons.wikimedia.org/wiki/File:Tour_Eiffel_Wikimedia_Commons.jpg)
- **Rookie** (12):
  - Alhambra — Granada, España · foto CC0 (Jebulon) · [Commons](https://commons.wikimedia.org/wiki/File:Alhambra_detail.jpg)
  - Arco del Triunfo — París, Francia · foto CC BY-SA 4.0 (ZeusUpsistos) · [Commons](https://commons.wikimedia.org/wiki/File:Arc_de_Triomphe_-_Ao%C3%BBt_2026.jpg)
  - Capilla Sixtina — Ciudad del Vaticano, Vaticano · foto CC BY-SA 3.0 (The original uploader was Snowdog at Ita) · [Commons](https://commons.wikimedia.org/wiki/File:Sistina-interno.jpg)
  - Castillo de Edimburgo — Edimburgo, Reino Unido · foto CC BY-SA 4.0 (Stephencdickson) · [Commons](https://commons.wikimedia.org/wiki/File:Edinburgh_Castle_from_the_Grassmarket.jpg)
  - Castillo de Neuschwanstein — Füssen, Alemania · foto CC0 (Wilfredor) · [Commons](https://commons.wikimedia.org/wiki/File:Neuschwanstein_Castle_2024-02.jpg)
  - Catedral de Notre Dame — París, Francia · foto CC BY-SA 3.0 (P e z i) · [Commons](https://commons.wikimedia.org/wiki/File:Notre-Dame_de_Paris_2013-07-24.jpg)
  - Catedral de San Basilio — Moscú, Rusia · foto CC BY-SA 4.0 (W. Bulach) · [Commons](https://commons.wikimedia.org/wiki/File:00_0568_Saint_Basil%27s_Cathedral_-_Moscow.jpg)
  - Mont Saint-Michel — Normandía, Francia · foto Public domain (Diliff) · [Commons](https://commons.wikimedia.org/wiki/File:Mont_St_Michel_3,_Brittany,_France_-_July_2011.jpg)
  - Museo del Louvre — París, Francia · foto CC BY 2.5 (Benh LIEU SONG) · [Commons](https://commons.wikimedia.org/wiki/File:Cour_Napol%C3%A9on_at_night_-_Louvre.jpg)
  - Puente de la Torre — Londres, Reino Unido · foto CC BY-SA 3.0 (Barcex) · [Commons](https://commons.wikimedia.org/wiki/File:London_-_London_Tower_Bridge_-_140806_171049.jpg)
  - Puerta de Brandeburgo — Berlín, Alemania · foto CC BY-SA 3.0 (Thomas Wolf, www.foto-tw.de) · [Commons](https://commons.wikimedia.org/wiki/File:Brandenburger_Tor_morgens.jpg)
  - Stonehenge — Salisbury, Reino Unido · foto CC BY-SA 3.0 (Stefan Kühn) · [Commons](https://commons.wikimedia.org/wiki/File:Stonehenge_Total.jpg)
- **Crack** (21):
  - Acueducto de Segovia — Segovia, España · foto CC BY-SA 3.0 (Bernard Gagnon) · [Commons](https://commons.wikimedia.org/wiki/File:Aqueduct_of_Segovia_08.jpg)
  - Atomium — Bruselas, Bélgica · foto CC BY-SA 4.0 (Zairon) · [Commons](https://commons.wikimedia.org/wiki/File:Laeken_Atomium_06.jpg)
  - Basílica de San Marcos — Venecia, Italia · foto CC BY-SA 2.5 (Nino Barbieri) · [Commons](https://commons.wikimedia.org/wiki/File:Venice_-_St._Marc%27s_Basilica_01.jpg)
  - Castillo de Bran — Brasov, Rumania · foto CC BY-SA 4.0 (Todor Bozhinov) · [Commons](https://commons.wikimedia.org/wiki/File:Bran_Castle_TB1.jpg)
  - Catedral de Colonia — Colonia, Alemania · foto CC BY-SA 3.0 de (Thomas Wolf, www.foto-tw.de) · [Commons](https://commons.wikimedia.org/wiki/File:K%C3%B6lner_Dom_von_Osten.jpg)
  - Catedral de Milán — Milán, Italia · foto CC BY-SA 4.0 (Jakub Hałun) · [Commons](https://commons.wikimedia.org/wiki/File:20110724_Milan_Cathedral_5260.jpg)
  - Fontana di Trevi — Roma, Italia · foto CC BY-SA 4.0 (NikonZ7II) · [Commons](https://commons.wikimedia.org/wiki/File:Trevi_Fountain_-_Roma.jpg)
  - La Giralda — Sevilla, España · foto CC BY 4.0 (Alberto-g-rovi) · [Commons](https://commons.wikimedia.org/wiki/File:Giralda_de_Sevilla_(3).jpg)
  - La Sirenita — Copenhague, Dinamarca · **sin foto**
  - Mezquita de Córdoba — Córdoba, España · foto CC BY-SA 2.0 (Toni Castillo Quero) · [Commons](https://commons.wikimedia.org/wiki/File:Mezquita_de_C%C3%B3rdoba_desde_el_aire_(C%C3%B3rdoba,_Espa%C3%B1a).jpg)
  - Monasterios de Meteora — Kalambaka, Grecia · foto CC BY-SA 4.0 (Ioannis Ioannidis) · [Commons](https://commons.wikimedia.org/wiki/File:Mystic_land_METEORA.jpg)
  - Murallas de Dubrovnik — Dubrovnik, Croacia · foto CC BY-SA 3.0 (Bracodbk) · [Commons](https://commons.wikimedia.org/wiki/File:Porporela_2011.jpg)
  - Museo del Hermitage — San Petersburgo, Rusia · foto CC BY-SA 4.0 (Florstein (Telegram:WikiPhoto.Space)) · [Commons](https://commons.wikimedia.org/wiki/File:Winter_Palace_Panorama_4.jpg)
  - Museo Guggenheim Bilbao — Bilbao, España · foto CC BY 2.0 (Naotake Murayama) · [Commons](https://commons.wikimedia.org/wiki/File:Museo_Guggenheim,_Bilbao_(31273245344).jpg)
  - Palacio de Schönbrunn — Viena, Austria · foto CC BY-SA 4.0 (C.Stadler/Bwag) · [Commons](https://commons.wikimedia.org/wiki/File:Wien_-_Schloss_Sch%C3%B6nbrunn.JPG)
  - Palacio de Versalles — Versalles, Francia · foto CC BY-SA 3.0 (ToucanWings) · [Commons](https://commons.wikimedia.org/wiki/File:Vue_a%C3%A9rienne_du_domaine_de_Versailles_par_ToucanWings_-_Creative_Commons_By_Sa_3.0_-_083.jpg)
  - Panteón de Roma — Roma, Italia · foto CC BY-SA 4.0 (NikonZ7II) · [Commons](https://commons.wikimedia.org/wiki/File:Pantheon_(Rome)_-_Right_side_and_front.jpg)
  - Parlamento de Budapest — Budapest, Hungría · foto CC BY-SA 4.0 (Source: User:Godot13 Derivative: User:Ma) · [Commons](https://commons.wikimedia.org/wiki/File:Budapest-Parliament-0001.jpg)
  - Pompeya — Nápoles, Italia · foto CC BY 2.0 (Glen Scarborough from The Central Coast,) · [Commons](https://commons.wikimedia.org/wiki/File:Pompeii_(4873744179).jpg)
  - Puente de Carlos — Praga, República Checa · **sin foto**
  - Torre de Belém — Lisboa, Portugal · foto CC BY-SA 4.0 (Rehman Abubakr) · [Commons](https://commons.wikimedia.org/wiki/File:Belem_Tower_-_April_2019_(2).jpg)
- **Leyenda** (15):
  - Alcázar de Segovia — Segovia, España · foto CC BY-SA 4.0 (Ángel Sanz de Andrés) · [Commons](https://commons.wikimedia.org/wiki/File:Panor%C3%A1mica_Oto%C3%B1o_Alc%C3%A1zar_de_Segovia.jpg)
  - Calzada del Gigante — Irlanda del Norte, Reino Unido · foto Public domain (Wikimedia Commons) · [Commons](https://commons.wikimedia.org/wiki/File:Giants_Causeway_1b.JPG)
  - Campanario de Brujas — Brujas, Bélgica · foto CC BY-SA 4.0 (Jean-Pol GRANDMONT) · [Commons](https://commons.wikimedia.org/wiki/File:0_Beffroi_et_halle_aux_draps_-_Bruges_(Belgique)_1.jpg)
  - Castillo de Eilean Donan — Escocia, Reino Unido · foto CC BY-SA 3.0 (Diliff) · [Commons](https://commons.wikimedia.org/wiki/File:Eilean_Donan_Castle,_Scotland_-_Jan_2011.jpg)
  - Castillo de Malbork — Malbork, Polonia · foto CC BY-SA 3.0 (DerHexer; derivate work: Carschten) · [Commons](https://commons.wikimedia.org/wiki/File:Panorama_of_Malbork_Castle,_part_4.jpg)
  - Castillo de Praga — Praga, República Checa · foto CC BY-SA 4.0 (Diego Delso) · [Commons](https://commons.wikimedia.org/wiki/File:Castillo_de_Praga,_Praga,_Rep%C3%BAblica_Checa,_2022-07-02,_DD_209.jpg)
  - Ciudadela de Carcasona — Carcasona, Francia · foto CC BY-SA 4.0 (Jondu11) · [Commons](https://commons.wikimedia.org/wiki/File:Cit%C3%A9_de_Carcassonne.jpg)
  - Hallgrímskirkja — Reikiavik, Islandia · foto CC BY 4.0 (Steinninn) · [Commons](https://commons.wikimedia.org/wiki/File:Hallgrimskirkja_mai_2026.jpg)
  - Iglesias de madera de Kizhi — Karelia, Rusia · foto CC BY-SA 3.0 (Laban66) · [Commons](https://commons.wikimedia.org/wiki/File:Kishi_church_0.jpg)
  - Newgrange — Drogheda, Irlanda · foto CC BY-SA 4.0 (Tjp finn) · [Commons](https://commons.wikimedia.org/wiki/File:Irelands_history.jpg)
  - Palacio da Pena — Sintra, Portugal · foto CC BY 2.0 (Singa Hitam) · [Commons](https://commons.wikimedia.org/wiki/File:Sintra_-_Palacio_da_Pena_(20332995770).jpg)
  - Pont du Gard — Nimes, Francia · foto CC BY-SA 3.0 (Benh LIEU SONG (Flickr)) · [Commons](https://commons.wikimedia.org/wiki/File:Pont_du_Gard_BLS.jpg)
  - Puente de Öresund — Copenhague, Dinamarca · foto CC BY-SA 4.0 (Nick-D) · [Commons](https://commons.wikimedia.org/wiki/File:%C3%98resund_Bridge_from_the_air_in_September_2015.jpg)
  - Skara Brae — Orcadas, Reino Unido · foto CC BY-SA 3.0 (Dr. John F. Burka) · [Commons](https://commons.wikimedia.org/wiki/File:Orkney_Skara_Brae.jpg)
  - Torre de Hércules — La Coruña, España · foto CC BY-SA 4.0 (Fernando) · [Commons](https://commons.wikimedia.org/wiki/File:Torre_de_H%C3%A9rcules_2023.jpg)

## Asia

- **Turista** (5):
  - Angkor Wat — Siem Riep, Camboya · foto CC BY-SA 4.0 (Bjørn Christian Tørrissen) · [Commons](https://commons.wikimedia.org/wiki/File:Angkor_Wat.jpg)
  - Burj Khalifa — Dubái, Emiratos Árabes Unidos · foto CC BY-SA 3.0 (Tim.Reckmann) · [Commons](https://commons.wikimedia.org/wiki/File:Dubai_skyline_2015_(crop).jpg)
  - Gran Muralla China — Pekín, China · foto CC BY-SA 3.0 (CEphoto, Uwe Aranas) · [Commons](https://commons.wikimedia.org/wiki/File:Badaling_China_Great-Wall-of-China-06.jpg)
  - Petra — Petra, Jordania · foto CC BY-SA 3.0 (Diego Delso) · [Commons](https://commons.wikimedia.org/wiki/File:The_Treasury,_Petra,_Jordan5.jpg)
  - Taj Mahal — Agra, India · foto CC BY-SA 4.0 (Yann; edited by Jim Carter) · [Commons](https://commons.wikimedia.org/wiki/File:Taj_Mahal_(Edited).jpeg)
- **Rookie** (8):
  - Ciudad Prohibida — Pekín, China · foto CC BY-SA 4.0 (N509FZ) · [Commons](https://commons.wikimedia.org/wiki/File:Hall_of_Supreme_Harmony_(20241127120000).jpg)
  - Guerreros de Terracota — Xi'an, China · foto CC BY 3.0 (Jmhullot) · [Commons](https://commons.wikimedia.org/wiki/File:Terracotta_Army,_View_of_Pit_1.jpg)
  - La Kaaba (Gran Mezquita de La Meca) — La Meca, Arabia Saudita · foto CC BY-SA 3.0 (Aiman titi) · [Commons](https://commons.wikimedia.org/wiki/File:Kaaba2.JPG)
  - Marina Bay Sands — Singapur, Singapur · foto CC BY 2.0 (Tony Hisgett from Birmingham, UK) · [Commons](https://commons.wikimedia.org/wiki/File:Marina_Bay_Sands_Hotel_3_(31345110894).jpg)
  - Mezquita Azul — Estambul, Turquía · foto CC BY-SA 3.0 (Moonik) · [Commons](https://commons.wikimedia.org/wiki/File:Exterior_of_Sultan_Ahmed_I_Mosque_in_Istanbul,_Turkey_002.jpg)
  - Santa Sofía — Estambul, Turquía · foto CC BY-SA 3.0 (Arild Vågen) · [Commons](https://commons.wikimedia.org/wiki/File:Hagia_Sophia_Mars_2013.jpg)
  - Torre de Tokio — Tokio, Japón · foto CC BY-SA 4.0 (Akonnchiroll) · [Commons](https://commons.wikimedia.org/wiki/File:Tokyo_Tower_2023.jpg)
  - Torres Petronas — Kuala Lumpur, Malasia · foto CC BY-SA 3.0 (AwOiSoAk KaOsIoWa) · [Commons](https://commons.wikimedia.org/wiki/File:Kuala_Lumpur_-_panoramio_(18).jpg)
- **Crack** (23):
  - Borobudur — Yogyakarta, Indonesia · foto CC BY-SA 3.0 (CEphoto, Uwe Aranas) · [Commons](https://commons.wikimedia.org/wiki/File:Borobudur-Temple-Park_Indonesia_Stupas-of-Borobudur-12.jpg)
  - Burj Al Arab — Dubái, Emiratos Árabes Unidos · foto CC BY 2.0 (Yacine Hary) · [Commons](https://commons.wikimedia.org/wiki/File:Burj_Al_Arab_and_Jumeirah_Beach_(9601659067).jpg)
  - Capadocia (Göreme) — Capadocia, Turquía · foto CC BY-SA 4.0 (MusikAnimal) · [Commons](https://commons.wikimedia.org/wiki/File:G%C3%B6reme_town_and_valley_2015.JPG)
  - Castillo de Himeji — Himeji, Japón · foto CC BY-SA 2.0 (_steffen) · [Commons](https://commons.wikimedia.org/wiki/File:Himeji_Castle,_Hy%C5%8Dgo_Prefecture;_August_2018_(04).jpg)
  - Cúpula de la Roca — Jerusalén, Israel · foto CC BY-SA 4.0 (DoaaFayad0) · [Commons](https://commons.wikimedia.org/wiki/File:%D9%82%D8%A8%D8%A9_%D8%A7%D9%84%D8%B5%D8%AE%D8%B1%D8%A9_%D9%85%D9%86_%D8%A7%D9%84%D9%86%D8%A7%D8%AD%D9%8A%D8%A9_%D8%A7%D9%84%D8%B4%D8%B1%D9%82%D9%8A%D8%A9.jpg)
  - Éfeso — Esmirna, Turquía · foto CC BY-SA 3.0 (Benh LIEU SONG) · [Commons](https://commons.wikimedia.org/wiki/File:Ephesus_Celsus_Library_Fa%C3%A7ade.jpg)
  - Gran Buda de Leshan — Leshan, China · foto CC BY 2.0 (xiquinhosilva) · [Commons](https://commons.wikimedia.org/wiki/File:Leshan_Giant_Buddha_(1).jpg)
  - Gran Mezquita Sheikh Zayed — Abu Dabi, Emiratos Árabes Unidos · foto CC BY-SA 4.0 (PotatoWitch) · [Commons](https://commons.wikimedia.org/wiki/File:Sheikh_Zayed_Mosque_Silhouette.jpg)
  - Muro de las Lamentaciones — Jerusalén, Israel · **sin foto**
  - Pabellón Dorado (Kinkaku-ji) — Kioto, Japón · foto CC BY-SA 4.0 (Basile Morin) · [Commons](https://commons.wikimedia.org/wiki/File:Water_reflection_of_Kinkaku-ji_Temple_a_sunny_day,_Kyoto,_Japan.jpg)
  - Pagoda Shwedagon — Rangún, Birmania · foto CC BY 4.0 (Vyacheslav Argenberg) · [Commons](https://commons.wikimedia.org/wiki/File:Shwedagon_Pagoda,_Golden_stupa_2,_Yangon,_Myanmar.jpg)
  - Palacio de Potala — Lhasa, China · foto CC BY 2.5 (Ondřej Žváček) · [Commons](https://commons.wikimedia.org/wiki/File:Potala.jpg)
  - Palacio Gyeongbokgung — Seúl, Corea del Sur · **sin foto**
  - Persépolis — Shiraz, Irán · foto CC BY-SA 3.0 (Alborzagros) · [Commons](https://commons.wikimedia.org/wiki/File:Gate_of_All_Nations,_Persepolis.jpg)
  - Puerta de la India — Bombay, India · **sin foto**
  - Registán de Samarcanda — Samarcanda, Uzbekistán · foto CC0 (Bernard Gagnon) · [Commons](https://commons.wikimedia.org/wiki/File:Registan_01.jpg)
  - Santuario Fushimi Inari — Kioto, Japón · foto CC0 (Saigen Jiro) · [Commons](https://commons.wikimedia.org/wiki/File:Fushimiinari-taisha,_naihaiden-1.jpg)
  - Taipei 101 — Taipéi, Taiwán · foto CC BY-SA 4.0 (User:Sinsyuan) · [Commons](https://commons.wikimedia.org/wiki/File:Taipei_101_from_Xiangshan_20250731.jpg)
  - Templo del Cielo — Pekín, China · foto CC BY-SA 4.0 (Shujianyang) · [Commons](https://commons.wikimedia.org/wiki/File:Temple_of_Heaven_20160323_01.jpg)
  - Templo Dorado de Amritsar — Amritsar, India · foto CC BY-SA 3.0 (This picture has been taken by Oleg Yuna) · [Commons](https://commons.wikimedia.org/wiki/File:Hamandir_Sahib_(Golden_Temple).jpg)
  - Templos de Bagan — Bagan, Birmania · foto CC BY 4.0 (Vyacheslav Argenberg) · [Commons](https://commons.wikimedia.org/wiki/File:Old_Bagan,_Myanmar,_Bagan_plains_at_sunset.jpg)
  - Torii de Itsukushima — Hiroshima, Japón · foto CC BY-SA 3.0 (JordyMeow) · [Commons](https://commons.wikimedia.org/wiki/File:Itsukushima_Gate.jpg)
  - Wat Arun — Bangkok, Tailandia · foto CC BY 2.5 (Diliff) · [Commons](https://commons.wikimedia.org/wiki/File:Wat_Arun_from_Chao_Phraya_River.jpg)
- **Leyenda** (22):
  - Baalbek — Baalbek, Líbano · foto CC BY-SA 4.0 (Saadedine AL SAIDI) · [Commons](https://commons.wikimedia.org/wiki/File:Temple_of_Bacchus.jpg)
  - Castillo de Osaka — Osaka, Japón · foto CC BY 2.5 (663highland) · [Commons](https://commons.wikimedia.org/wiki/File:Osaka_Castle_02bs3200.jpg)
  - Ciudadela de Alepo — Alepo, Siria · foto CC BY-SA 3.0 (Memorino) · [Commons](https://commons.wikimedia.org/wiki/File:Citadel_of_Aleppo.jpg)
  - Ciudadela de Erbil — Erbil, Irak · foto CC BY-SA 2.0 (jan kurdistani) · [Commons](https://commons.wikimedia.org/wiki/File:Hawler_Castle.jpg)
  - Cuevas de Ajanta — Aurangabad, India · foto CC BY-SA 4.0 (Marcin Białek) · [Commons](https://commons.wikimedia.org/wiki/File:Ajanta_cave_no._9_2010.jpg)
  - Göbekli Tepe — Sanliurfa, Turquía · foto CC BY-SA 3.0 (Teomancimit) · [Commons](https://commons.wikimedia.org/wiki/File:G%C3%B6bekli_Tepe,_Urfa.jpg)
  - Gran Buda de Kamakura — Kamakura, Japón · foto CC BY-SA 4.0 (663highland) · [Commons](https://commons.wikimedia.org/wiki/File:230128_Kamakura_Daibutsu_Japan01s3.jpg)
  - Hampi — Karnataka, India · foto CC BY 4.0 (Vyacheslav Argenberg) · [Commons](https://commons.wikimedia.org/wiki/File:Hampi,_India,_Granite_boulders_of_Matanga_Hill.jpg)
  - Masada — Mar Muerto, Israel · foto CC BY-SA 4.0 (Godot13) · [Commons](https://commons.wikimedia.org/wiki/File:Israel-2013-Aerial_21-Masada.jpg)
  - Mausoleo Gur-e Amir — Samarcanda, Uzbekistán · foto CC BY-SA 4.0 (Arina Pan) · [Commons](https://commons.wikimedia.org/wiki/File:%D0%92%D0%B5%D1%87%D0%B5%D1%80%D0%BD%D0%B8%D0%B9_%D0%93%D1%83%D1%80-%D0%AD%D0%BC%D0%B8%D1%80.jpg)
  - Mezquita de Selimiye — Edirne, Turquía · foto CC BY-SA 3.0 (Nevit Dilmen) · [Commons](https://commons.wikimedia.org/wiki/File:Edirne_7333_Nevit.JPG)
  - Mezquita del Sah (Isfahán) — Isfahán, Irán · foto CC BY-SA 2.5 (Wikimedia Commons) · [Commons](https://commons.wikimedia.org/wiki/File:Naghsh-e-jahan_masjed-e-shah_esfahan.jpg)
  - Mezquita Id Kah — Kashgar, China · foto CC BY-SA 4.0 (N509FZ) · [Commons](https://commons.wikimedia.org/wiki/File:H%C3%ABytgah_Mosque,_Kashi_(20230923100109).jpg)
  - Mohenjo-Daro — Larkana, Pakistán · **sin foto**
  - Palmira — Palmira, Siria · foto CC BY-SA 3.0 (Jerzy Strzelecki) · [Commons](https://commons.wikimedia.org/wiki/File:Palmyra_theater02(js).jpg)
  - Prambanan — Yogyakarta, Indonesia · foto CC BY-SA 3.0 (Gunawan Kartapranata) · [Commons](https://commons.wikimedia.org/wiki/File:Prambanan_Complex_1.jpg)
  - Qutab Minar — Nueva Delhi, India · foto CC BY-SA 4.0 (Akbarzoda) · [Commons](https://commons.wikimedia.org/wiki/File:Madrasa_and_tomb_of_Alauddin_Khalji_2.jpg)
  - Sigiriya — Dambulla, Sri Lanka · foto CC BY-SA 3.0 (Wikimedia Commons) · [Commons](https://commons.wikimedia.org/wiki/File:Sigiriya_Apprach.JPG)
  - Ta Prohm — Siem Riep, Camboya · foto CC BY-SA 4.0 (Dmitry A. Mottl) · [Commons](https://commons.wikimedia.org/wiki/File:Ta_Prohm.JPG)
  - Templo del Loto — Nueva Delhi, India · **sin foto**
  - Templo del Sol de Konark — Odisha, India · foto CC BY-SA 4.0 (Dhruv Raj Kashyap) · [Commons](https://commons.wikimedia.org/wiki/File:Konark_Sun_Temple_Architecture9.jpg)
  - Templo Haeinsa — Hapcheon, Corea del Sur · foto CC0 (Bernard Gagnon) · [Commons](https://commons.wikimedia.org/wiki/File:Haeinsa_Temple_01.jpg)

## África

- **Turista** (1):
  - Pirámides de Giza — El Cairo, Egipto · foto CC BY 2.5 (Nina) · [Commons](https://commons.wikimedia.org/wiki/File:Kheops-Pyramid.jpg)
- **Crack** (7):
  - Abu Simbel — Asuán, Egipto · foto Public domain (Olaf Tausch) · [Commons](https://commons.wikimedia.org/wiki/File:Gro%C3%9Fer_Tempel_(Abu_Simbel)_31.jpg)
  - Gran Mezquita de Djenné — Djenné, Malí · foto CC BY-SA 3.0 (Andy Gilham) · [Commons](https://commons.wikimedia.org/wiki/File:Great_Mosque_of_Djenn%C3%A9_1.jpg)
  - Gran Zimbabue — Masvingo, Zimbabue · foto CC BY-SA 3.0 (Wikimedia Commons) · [Commons](https://commons.wikimedia.org/wiki/File:Great-Zimbabwe-6.jpg)
  - Iglesias de Lalibela — Lalibela, Etiopía · foto CC BY-SA 3.0 (Bernard Gagnon) · [Commons](https://commons.wikimedia.org/wiki/File:Bete_Giyorgis_01.jpg)
  - Isla Robben — Ciudad del Cabo, Sudáfrica · foto CC BY 2.0 (South African Tourism from South Africa) · [Commons](https://commons.wikimedia.org/wiki/File:Robben_Island_-_Cape_Town,_South_Africa_(3883849594).jpg)
  - Ruinas de Cartago — Túnez, Túnez · foto CC BY 2.5 (Calips) · [Commons](https://commons.wikimedia.org/wiki/File:Tunisie_Carthage_Ruines_08.JPG)
  - Templo de Karnak — Luxor, Egipto · foto CC BY 4.0 (Vyacheslav Argenberg) · [Commons](https://commons.wikimedia.org/wiki/File:Luxor,_Egypt,_Karnak.jpg)
- **Leyenda** (8):
  - Ait Ben Haddou — Uarzazat, Marruecos · foto CC BY 2.0 (Wonker from London, United Kingdom) · [Commons](https://commons.wikimedia.org/wiki/File:Ait_Ben_Haddou_3.jpg)
  - Ciudad de Piedra de Zanzíbar — Zanzíbar, Tanzania · foto CC BY-SA 4.0 (Mysid) · [Commons](https://commons.wikimedia.org/wiki/File:Topographic_map_of_Zanzibar-en.svg)
  - Isla de Gorea — Dakar, Senegal · foto CC BY-SA 3.0 (Wikimedia Commons) · [Commons](https://commons.wikimedia.org/wiki/File:Senegal_Gor%C3%A9e_island_harbor.jpg)
  - Mezquita de Sankoré (Tombuctú) — Tombuctú, Malí · foto CC BY 2.5 nl (Baz Lecocq at nl.wikipedia) · [Commons](https://commons.wikimedia.org/wiki/File:Sankore_Moske_Timboektoe.JPG)
  - Mezquita Hassan II — Casablanca, Marruecos · foto CC BY 2.0 (Milamber's portfolio) · [Commons](https://commons.wikimedia.org/wiki/File:Sunshine_on_mosque_Hassan_II_in_Casablanca,_Morocco_-_Flickr_-_Milamber%27s_portfolio.jpg)
  - Obeliscos de Axum — Axum, Etiopía · foto CC BY 2.5 (Ondřej Žváček) · [Commons](https://commons.wikimedia.org/wiki/File:Rome_Stele.jpg)
  - Ruinas de Kilwa Kisiwani — Kilwa, Tanzania · foto Public domain (en:user:Claude McNab) · [Commons](https://commons.wikimedia.org/wiki/File:GreatMosque.jpg)
  - Union Buildings — Pretoria, Sudáfrica · foto CC BY-SA 3.0 (Davinci77) · [Commons](https://commons.wikimedia.org/wiki/File:Uniegebou.jpg)

## Oceanía (solo en Mundo)

- **Turista** (2):
  - Moáis de Isla de Pascua — Isla de Pascua, Chile · foto CC BY-SA 4.0 (kallerna) · [Commons](https://commons.wikimedia.org/wiki/File:Easter_Island_5.jpg)
  - Ópera de Sídney — Sídney, Australia · foto CC BY-SA 4.0 (W. Bulach) · [Commons](https://commons.wikimedia.org/wiki/File:00_1375_Sydney_Opera_House_(Australia).jpg)
- **Crack** (2):
  - Puente de la Bahía de Sídney — Sídney, Australia · foto CC BY 2.5 (Photograph by Greg O'Beirne) · [Commons](https://commons.wikimedia.org/wiki/File:SydneyHarbourBridge1_gobeirne.jpg)
  - Sky Tower — Auckland, Nueva Zelanda · foto CC BY-SA 4.0 (Orderinchaos) · [Commons](https://commons.wikimedia.org/wiki/File:Auckland_Sky_Tower_closeup.jpg)
- **Leyenda** (3):
  - Beehive (Parlamento de Nueva Zelanda) — Wellington, Nueva Zelanda · foto CC BY-SA 4.0 (Michal Klajban) · [Commons](https://commons.wikimedia.org/wiki/File:Beehive,_Wellington,_New_Zealand_(97).JPG)
  - Nan Madol — Pohnpei, Micronesia · foto Public domain (NOAA) · [Commons](https://commons.wikimedia.org/wiki/File:Nan_madol.jpg)
  - Parlamento de Australia — Canberra, Australia · foto CC BY-SA 4.0 (Thennicke) · [Commons](https://commons.wikimedia.org/wiki/File:Parliament_House_at_dusk,_Canberra_ACT.jpg)

## Pack Colombia (Fase 7a)

Monumentos del mundo que también entran en el pack (con su nivel ahí) y monumentos solo del pack (★).

- **Turista** (12):
  - Castillo de San Felipe de Barajas — Cartagena · foto CC BY-SA 4.0 · [Commons](https://commons.wikimedia.org/wiki/File:Panorama_Castillo_San_Felipe_de_Barajas_CTG_11_2019_2864.jpg)
  - Catedral de Sal de Zipaquirá — Zipaquirá · foto CC BY-SA 4.0 · [Commons](https://commons.wikimedia.org/wiki/File:Catedral_de_Sal_02.jpg)
  - Cerro de Monserrate — Bogotá · foto CC BY-SA 4.0 · [Commons](https://commons.wikimedia.org/wiki/File:2017_Bogot%C3%A1_Bas%C3%ADlica_del_Se%C3%B1or_Ca%C3%ADdo_de_Monserrate.jpg)
  - Ciudad Perdida — Santa Marta · foto CC BY 2.0 · [Commons](https://commons.wikimedia.org/wiki/File:Lost_City_Ruins.jpg)
  - ★ Cristo Rey de Cali — Cali · foto CC BY-SA 4.0 · [Commons](https://commons.wikimedia.org/wiki/File:Cristo_Rey_de_Cali_21.jpg)
  - ★ Museo del Oro — Bogotá · foto CC BY-SA 3.0 · [Commons](https://commons.wikimedia.org/wiki/File:BOG_Museo_del_Oro.JPG)
  - Parque Arqueológico de San Agustín — San Agustín · foto CC BY-SA 4.0 · [Commons](https://commons.wikimedia.org/wiki/File:Parque_Arqueol%C3%B3gico_de_San_Agust%C3%ADn-Mesita_A_12.jpg)
  - Piedra del Peñol — Guatapé · foto CC BY-SA 3.0 · [Commons](https://commons.wikimedia.org/wiki/File:Elpenolantioquia.JPG)
  - ★ Plaza Botero — Medellín · foto CC BY-SA 3.0 · [Commons](https://commons.wikimedia.org/wiki/File:Plaza_Botero4.JPG)
  - ★ Plaza de Bolívar de Bogotá — Bogotá · foto CC BY-SA 4.0 · [Commons](https://commons.wikimedia.org/wiki/File:Plaza_de_Bol%C3%ADvar_en_Bogot%C3%A1_(Colombia).jpg)
  - Santuario de Las Lajas — Ipiales · foto CC BY-SA 4.0 · [Commons](https://commons.wikimedia.org/wiki/File:Santuario_de_Las_Lajas,_Ipiales,_Colombia,_2015-07-21,_DD_21-23_HDR.jpg)
  - ★ Torre del Reloj de Cartagena — Cartagena · foto CC BY-SA 3.0 · [Commons](https://commons.wikimedia.org/wiki/File:024_Torre_del_Reloj_Cartagena_Colombia.JPG)
- **Rookie** (14):
  - ★ Basílica del Señor de los Milagros de Buga — Buga · foto CC BY 3.0 · [Commons](https://commons.wikimedia.org/wiki/File:Bas%C3%ADlica_de_Buga.jpg)
  - ★ Catedral Basílica de Manizales — Manizales · foto CC BY-SA 3.0 · [Commons](https://commons.wikimedia.org/wiki/File:2007-06-12_catedral_de_manizales-pablo_andres_toro_arias.jpg)
  - ★ Catedral Primada de Colombia — Bogotá · foto CC BY-SA 4.0 · [Commons](https://commons.wikimedia.org/wiki/File:2021_Bogot%C3%A1_-_Catedral_Primada_de_Colombia.jpg)
  - ★ Estadio Atanasio Girardot — Medellín · foto CC BY-SA 4.0 · [Commons](https://commons.wikimedia.org/wiki/File:Atanasio_Girardot-Atl%C3%A9tico_Nacional-Fortaleza.jpg)
  - ★ Estadio El Campín — Bogotá · foto CC BY-SA 4.0 · [Commons](https://commons.wikimedia.org/wiki/File:Estadio_El_Campin_vac%C3%ADo.jpg)
  - ★ Iglesia de San Pedro Claver — Cartagena · foto CC BY-SA 4.0 · [Commons](https://commons.wikimedia.org/wiki/File:Main_facade_Iglesia_San_Pedro_Claver_CTG_11_2019_2719.jpg)
  - ★ Parque del Café — Montenegro · foto CC BY-SA 2.5 · [Commons](https://commons.wikimedia.org/wiki/File:Colombian_National_Coffee_Park_195.JPG)
  - ★ Pueblito Paisa (Cerro Nutibara) — Medellín · foto CC BY-SA 3.0 · [Commons](https://commons.wikimedia.org/wiki/File:Nutibara.jpg)
  - Puente de Boyacá — Tunja · foto Public domain · [Commons](https://commons.wikimedia.org/wiki/File:Puente_Boyaca_Nov_09_2005.jpg)
  - ★ Puente de Occidente — Santa Fe de Antioquia · foto CC BY 2.0 · [Commons](https://commons.wikimedia.org/wiki/File:Puente_de_Occidente-top.jpg)
  - ★ Quinta de San Pedro Alejandrino — Santa Marta · foto Public domain · [Commons](https://commons.wikimedia.org/wiki/File:PanteodelaPatria.JPG)
  - Tierradentro — Inzá · foto CC BY 2.0 · [Commons](https://commons.wikimedia.org/wiki/File:Tombs_in_Tierra_Dentro.jpg)
  - ★ Torre Colpatria — Bogotá · foto CC BY-SA 4.0 · [Commons](https://commons.wikimedia.org/wiki/File:Vista_a%C3%A9rea_Bogot%C3%A1_-_15_-_Torre_Colpatria.jpg)
  - ★ Ventana al Mundo — Barranquilla · foto CC BY-SA 4.0 · [Commons](https://commons.wikimedia.org/wiki/File:Ventanalmundo.jpg)
- **Crack** (11):
  - ★ Basílica de Chiquinquirá — Chiquinquirá · foto CC BY-SA 3.0 · [Commons](https://commons.wikimedia.org/wiki/File:Basilica_Chiquinquira_01.jpg)
  - ★ Edificio Coltejer — Medellín · foto CC BY-SA 2.0 · [Commons](https://commons.wikimedia.org/wiki/File:Coltejer-Medellin.jpg)
  - ★ El Gato del Río — Cali · foto Public domain · [Commons](https://commons.wikimedia.org/wiki/File:Gato_de_Tejada_Cali.JPG)
  - ★ Estadio Metropolitano Roberto Meléndez — Barranquilla · foto CC BY-SA 4.0 · [Commons](https://commons.wikimedia.org/wiki/File:Estadio_Metropolitano_de_Baranquilla_2011.jpg)
  - ★ Fuerte de San Fernando de Bocachica — Cartagena · foto CC BY-SA 4.0 · [Commons](https://commons.wikimedia.org/wiki/File:San_Fernando.jpg)
  - ★ Hacienda Nápoles — Puerto Triunfo · foto CC BY 3.0 · [Commons](https://commons.wikimedia.org/wiki/File:P%C3%B3rtico_Hacienda_N%C3%A1poles.JPG)
  - ★ Morro de Tulcán — Popayán · foto CC BY-SA 4.0 · [Commons](https://commons.wikimedia.org/wiki/File:El_Morro_de_Tulc%C3%A1n,_Popay%C3%A1n.jpg)
  - ★ Parque Explora — Medellín · foto Public domain · [Commons](https://commons.wikimedia.org/wiki/File:Parque_Explora._from_Metrostation_Universidad,_Medell%C3%ADn.jpg)
  - ★ Parque Jaime Duque — Tocancipá · foto CC BY-SA 2.0 · [Commons](https://commons.wikimedia.org/wiki/File:Taj_Mahal,_Parque_Jaime_Duque.jpg)
  - ★ Puente Pumarejo — Barranquilla · foto CC BY-SA 3.0 · [Commons](https://commons.wikimedia.org/wiki/File:Puente_Pumarejo_001.JPG)
  - ★ Viaducto César Gaviria Trujillo — Pereira · foto CC BY-SA 2.0 · [Commons](https://commons.wikimedia.org/wiki/File:El_Viaducto,_Pereira,_Colombia.jpg)
- **Leyenda** (4):
  - ★ Castillo de Salgar — Puerto Colombia · foto CC BY-SA 3.0 · [Commons](https://commons.wikimedia.org/wiki/File:Castillo_de_San_Antonio_de_Salgar_04-017.jpg)
  - ★ Monumento a los Héroes — Bogotá · foto CC BY-SA 3.0 · [Commons](https://commons.wikimedia.org/wiki/File:Los_H%C3%A9roes_Bogot%C3%A1.JPG)
  - ★ Monumento del Pantano de Vargas — Paipa · foto Public domain · [Commons](https://commons.wikimedia.org/wiki/File:Monumento_pantano_de_vargas,_completo._2006.JPG)
  - ★ Templo Histórico de Cúcuta — Villa del Rosario · foto CC BY-SA 3.0 · [Commons](https://commons.wikimedia.org/wiki/File:Templo_Hist%C3%B3rico_en_C%C3%BAcuta.JPG)

## Licencias de las fotos

- CC BY-SA 4.0: 85
- CC BY-SA 3.0: 66
- Public domain: 20
- CC BY 2.0: 17
- CC BY 2.5: 10
- CC0: 8
- CC BY-SA 2.0: 8
- sin foto: 7
- CC BY 4.0: 6
- CC BY-SA 2.5: 5
- CC BY-SA 3.0 de: 4
- CC BY 3.0: 4
- CC BY 2.5 nl: 1
