# Fase 7a · Pack Colombia — catálogo para revisión

Borrador (2026-10-23). Para cambiar algo: editar `src/data/colombiaTiers.ts` (departamentos y municipios),
`src/data/featureTiers.ts` (lugares, campo `packs.colombia`) o `src/data/landmarkTiers.ts` (monumentos) y volver a correr
los scripts (`build-colombia`, `build-features`, `build-landmarks` + `convert-landmarks`).

Niveles pensados para un jugador colombiano: **Turista** · **Rookie** · **Crack** · **Leyenda**. Si un nivel no llega a 13,
la partida se completa con el nivel vecino. Cercanía con escala de 150 km (fallar por 50 km ≈ 720 de 1.000; por 150 km ≈ 370).

## Departamentos (33)

Contorno de Natural Earth; tocar dentro vale cercanía perfecta, fuera cuenta la distancia al borde.

- **Turista** (12): Bogotá D. C. (capital: Bogotá) · Antioquia (capital: Medellín) · Valle del Cauca (capital: Cali) · Atlántico (capital: Barranquilla) · Bolívar (capital: Cartagena) · Cundinamarca (capital: Bogotá) · Santander (capital: Bucaramanga) · Nariño (capital: Pasto) · Amazonas (capital: Leticia) · La Guajira (capital: Riohacha) · Magdalena (capital: Santa Marta) · San Andrés y Providencia (capital: San Andrés)
- **Rookie** (12): Boyacá (capital: Tunja) · Caldas (capital: Manizales) · Risaralda (capital: Pereira) · Quindío (capital: Armenia) · Tolima (capital: Ibagué) · Huila (capital: Neiva) · Cauca (capital: Popayán) · Córdoba (capital: Montería) · Meta (capital: Villavicencio) · Norte de Santander (capital: Cúcuta) · Cesar (capital: Valledupar) · Chocó (capital: Quibdó)
- **Crack** (5): Sucre (capital: Sincelejo) · Caquetá (capital: Florencia) · Putumayo (capital: Mocoa) · Casanare (capital: Yopal) · Arauca (capital: Arauca)
- **Leyenda** (4): Guainía (capital: Inírida) · Vaupés (capital: Mitú) · Vichada (capital: Puerto Carreño) · Guaviare (capital: San José del Guaviare)

## Ciudades y municipios (147)

Coordenadas de Wikidata (142 de 147; el resto, las de la spec). Se miden al punto.

- **Turista** (24): Armenia (Quindío) · Barranquilla (Atlántico) · Bogotá (Bogotá D. C.) · Bucaramanga (Santander) · Buenaventura (Valle del Cauca) · Cali (Valle del Cauca) · Cartagena (Bolívar) · Cúcuta (Norte de Santander) · Ibagué (Tolima) · Leticia (Amazonas) · Manizales (Caldas) · Medellín (Antioquia) · Montería (Córdoba) · Neiva (Huila) · Pasto (Nariño) · Pereira (Risaralda) · Popayán (Cauca) · Riohacha (La Guajira) · San Andrés (San Andrés y Providencia) · Santa Marta (Magdalena) · Tunja (Boyacá) · Valledupar (Cesar) · Villavicencio (Meta) · Zipaquirá (Cundinamarca)
- **Rookie** (30): Apartadó (Antioquia) · Barrancabermeja (Santander) · Bello (Antioquia) · Buga (Valle del Cauca) · Chía (Cundinamarca) · Ciénaga (Magdalena) · Duitama (Boyacá) · Envigado (Antioquia) · Florencia (Caquetá) · Fusagasugá (Cundinamarca) · Girardot (Cundinamarca) · Guatapé (Antioquia) · Ipiales (Nariño) · Itagüí (Antioquia) · Maicao (La Guajira) · Mompox (Bolívar) · Palmira (Valle del Cauca) · Providencia (San Andrés y Providencia) · Quibdó (Chocó) · Rionegro (Antioquia) · Salento (Quindío) · San Gil (Santander) · Sincelejo (Sucre) · Soacha (Cundinamarca) · Sogamoso (Boyacá) · Soledad (Atlántico) · Tuluá (Valle del Cauca) · Tumaco (Nariño) · Villa de Leyva (Boyacá) · Yopal (Casanare)
- **Crack** (37): Aracataca (Magdalena) · Arauca (Arauca) · Barichara (Santander) · Calarcá (Quindío) · Cartago (Valle del Cauca) · Caucasia (Antioquia) · Chiquinquirá (Boyacá) · Coveñas (Sucre) · Dosquebradas (Risaralda) · Espinal (Tolima) · Facatativá (Cundinamarca) · Filandia (Quindío) · Floridablanca (Santander) · Girón (Santander) · Honda (Tolima) · Jamundí (Valle del Cauca) · Jardín (Antioquia) · La Dorada (Caldas) · Lorica (Córdoba) · Magangué (Bolívar) · Melgar (Tolima) · Mocoa (Putumayo) · Nuquí (Chocó) · Ocaña (Norte de Santander) · Paipa (Boyacá) · Pamplona (Norte de Santander) · Pitalito (Huila) · Puerto Asís (Putumayo) · Puerto Colombia (Atlántico) · Ráquira (Boyacá) · San Agustín (Huila) · San José del Guaviare (Guaviare) · Santa Fe de Antioquia (Antioquia) · Santa Rosa de Cabal (Risaralda) · Tolú (Sucre) · Turbo (Antioquia) · Uribia (La Guajira)
- **Leyenda** (56): Acacías (Meta) · Acandí (Chocó) · Aguachica (Cesar) · Aguazul (Casanare) · Agustín Codazzi (Cesar) · Bahía Solano (Chocó) · Chinchiná (Caldas) · Corozal (Sucre) · Cumaribo (Vichada) · El Banco (Magdalena) · El Carmen de Bolívar (Bolívar) · El Cocuy (Boyacá) · Fonseca (La Guajira) · Fundación (Magdalena) · Garzón (Huila) · Granada (Meta) · Guapi (Cauca) · Guatavita (Cundinamarca) · Inírida (Guainía) · Istmina (Chocó) · Jericó (Antioquia) · La Macarena (Meta) · Líbano (Tolima) · Málaga (Santander) · Manaure (La Guajira) · Mariquita (Tolima) · Mitú (Vaupés) · Montelíbano (Córdoba) · Montenegro (Quindío) · Necoclí (Antioquia) · Paz de Ariporo (Casanare) · Puerto Berrío (Antioquia) · Puerto Boyacá (Boyacá) · Puerto Carreño (Vichada) · Puerto Gaitán (Meta) · Puerto López (Meta) · Puerto Nariño (Amazonas) · Riosucio (Caldas) · Sabanalarga (Atlántico) · Sahagún (Córdoba) · Salamina (Caldas) · San Jacinto (Bolívar) · San Vicente del Caguán (Caquetá) · Santander de Quilichao (Cauca) · Saravena (Arauca) · Sibundoy (Putumayo) · Silvia (Cauca) · Socorro (Santander) · Tame (Arauca) · Túquerres (Nariño) · Turbaco (Bolívar) · Ubaté (Cundinamarca) · Villa del Rosario (Norte de Santander) · Villavieja (Huila) · Villeta (Cundinamarca) · Yumbo (Valle del Cauca)

## Lugares y monumentos del pack

Ver la sección «Pack Colombia» de `docs/Fase6_Lugares_catalogo.md` y de `docs/Fase6_Monumentos_catalogo.md`.
