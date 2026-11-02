/**
 * Catálogos grandes (banderas, lugares, monumentos y packs Pro, ~60 KB comprimidos): un solo punto de entrada para
 * cargarlos aparte de la carga inicial (src/lib/catalog.ts, loadCatalogs). Van en el chunk data-catalogs (vite.config.ts).
 */
export { FLAG_ITEMS } from './flagCatalog';
export { FEATURE_ITEMS } from './featureCatalog';
export { LANDMARK_ITEMS } from './landmarkCatalog';
export { PRO_PACK_CITIES, PRO_PACK_DIVISIONS } from './proPackCatalog';
