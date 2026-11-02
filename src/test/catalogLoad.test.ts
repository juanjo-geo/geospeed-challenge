/** Carga inicial más liviana: banderas, lugares, monumentos y packs Pro llegan después del inicio (loadCatalogs). */
import { describe, it, expect } from 'vitest';
import { catalogsLoaded, categoriesForMode, flagsByMode, catalogItem, getRandomItems, loadCatalogs, onCatalogsLoaded } from '@/lib/catalog';

describe('catálogos grandes fuera de la carga inicial', () => {
  it('antes de cargar: categorías fijas y listas vacías; buscar un ítem que falta pide la carga y avisa al llegar', async () => {
    expect(catalogsLoaded()).toBe(false);
    // El Inicio dibuja las categorías de cada región sin los catálogos
    expect(categoriesForMode('andes')).toEqual(['cities', 'divisions', 'features']);
    expect(categoriesForMode('colombia')).toEqual(['cities', 'divisions', 'features', 'monuments']);
    expect(categoriesForMode('europe')).toEqual(['cities', 'flags', 'features', 'monuments']);
    expect(flagsByMode('world')).toEqual([]);
    // Las ciudades del mundo no dependen de ellos
    expect(getRandomItems('cities', 'basic', 13, 'world', 7)).toHaveLength(13);

    const arrived = new Promise<void>((resolve) => { onCatalogsLoaded(resolve); });
    expect(catalogItem('flag:CO')).toBeUndefined(); // todavía no está: se pide la carga
    await arrived;
    expect(catalogsLoaded()).toBe(true);
    expect(catalogItem('flag:CO')?.kind).toBe('flag');
    expect(flagsByMode('world').length).toBeGreaterThan(150);
    await loadCatalogs(); // ya cargados: no vuelve a descargar
    expect(getRandomItems('flags', 'basic', 13, 'world', 7)).toHaveLength(13);
  });
});
