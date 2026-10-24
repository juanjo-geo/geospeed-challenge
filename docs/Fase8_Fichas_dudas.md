# Fase 8 — Datos curiosos para revisar primero

Los 1.248 datos curiosos (mundo + pack Colombia) los redactó Claude por tandas con la regla de usar solo datos
establecidos y evitar cifras dudosas. Estos son los que las propias tandas marcaron como menos seguros; conviene
mirarlos antes que el resto (`docs/Fase8_Fichas_catalogo.md` tiene todos). Para cambiar uno: editar el texto en el
JSON de datos curiosos y volver a correr `node scripts/build-facts.mjs … --trivia <archivo>`.

## Ciudades del mundo
- **Accra**: el nombre viene de *nkran* (hormigas, en akan); es la etimología más citada, no la única.
- **Dakar**: "casi 30 años como meta del Rally París-Dakar" (1979–2007, con años en que terminó en otro sitio).
- **Moroni**: la Mezquita del Viernes de 1427.
- **Malabo**: "un rey bubi" (no "el último rey").
- **Ulán Bator**: "considerada la capital más fría del mundo".
- **Manila / Bucarest**: mencionan la Segunda Guerra Mundial / las guerras mundiales (no como tema principal).

## Países
- **Albania**: "tierra de las águilas" es la traducción popular de Shqipëria.
- **Países Bajos**: "más bicicletas que habitantes" es una estimación muy repetida.
- **Emiratos**: Burj Khalifa como edificio más alto (hasta que termine la Torre Jeddah).
- **Moldavia**: récord Guinness de la bodega Mileștii Mici (2005).
- **Sudán**: "unas 200 pirámides" (las fuentes dan 200–255).
- **Guinea Ecuatorial**: menciona "africano" porque el dato es ser el único país africano con español oficial.

## Lugares geográficos
- **Estrecho de Ormuz**: la tierra roja de la isla se usa como condimento.
- **Gran Lago del Oso**: reserva de biosfera Tsá Tué (2016) gestionada por la comunidad de Délı̨nę.
- **Río Colorado**: se escribió sobre el de EE. UU. (Gran Cañón); en el catálogo aparece con Argentina.
- **Galeras**: el nombre por su parecido con una galera; nombre indígena Urcunina.
- **Pico Bolívar**: antes llamado "La Columna"; busto del Libertador en la cima.
- **Desierto de Simpson**: Simpson financió la expedición de 1939.
- **Mojave**: el origen mormón del nombre "árbol de Josué" va como tradición.
- **Río Mira**: su curso alto en Ecuador se llama Chota (valle de la bomba).
- **Amacayacu**: "río de las hamacas".
- **Cumbal, Morrosquillo, Zapatosa (Ramsar 2018), El Cocuy (mayor área glaciar de Colombia)**.

## Monumentos
- **Puente de Carlos**: el palíndromo 135797531 va como "según la tradición".
- **Mezquita Sheikh Zayed**: la alfombra "fue récord mundial".
- **Piedra del Peñol**: las letras pintadas (solo quedaron la G y parte de la U).
- **Mitad del Mundo**: el ecuador real a unos 240 m.
- **Casa Rosada**: la sangre de vaca va como una de varias teorías del color.
- **Ventana al Mundo** (la más dudosa: año 2018 y su simbolismo), **Castillo de Salgar**, **Cristo Rey de Cali**
  (Alideo Tazzioli, 1953), **Teatro Nacional de Costa Rica** (1897, *Fausto*), **Plaza de Bolívar** (estatua de
  Tenerani, primer monumento público del país), **Pantano de Vargas** ("el monumento más grande del país"),
  **Monumento a los Héroes** (desmontado por el metro).

## Pack Colombia (municipios)
- **Jamundí** (cacique Xamundí), **Sahagún** ("Ciudad Cultural de Córdoba"), **Fonseca** (Luis Enrique Martínez),
  **Acacías** (Festival del Retorno), **Necoclí** (Festival del Bullerengue), **Corozal** (palma de corozo),
  **Florencia** (comerciante italiano del caucho), **Magangué** ("Ciudad de los Ríos"), **Espinal** (lechona).
- Con dato genérico (economía, cultivos) por falta de uno propio seguro: La Dorada, Aguachica, Granada (Meta),
  Caucasia, Sabanalarga, Saravena, Aguazul y Puerto López.

## Cifras de Wikidata corregidas a mano (`QID_OVERRIDES`)
San Basilio, Denali, Cervino, Canarias, Malvinas, Cordillera Central, Krakatoa, Tlaxcala, Mazatlán, General Eugenio
A. Garay, comarca Ngäbe-Buglé, Puntarenas y Elías Piña (la búsqueda automática había tomado otro elemento).
San Agustín (Huila) queda sin cifras.
