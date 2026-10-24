/** Tipos de accidente geográfico (Fase 6b): emoji y nombre en los dos idiomas, sin pasar por i18n (lo usan las libs). */
import type { FeatureType } from '@/data/cities';

export const FEATURE_TYPE: Record<FeatureType, { emoji: string; es: string; en: string }> = {
  river: { emoji: '🏞️', es: 'Río', en: 'River' },
  lake: { emoji: '💧', es: 'Lago', en: 'Lake' },
  sea: { emoji: '🌊', es: 'Mar', en: 'Sea' },
  gulf: { emoji: '🌊', es: 'Golfo / bahía', en: 'Gulf / bay' },
  strait: { emoji: '⛵', es: 'Estrecho / canal', en: 'Strait / channel' },
  range: { emoji: '⛰️', es: 'Cordillera', en: 'Mountain range' },
  peak: { emoji: '🏔️', es: 'Montaña', en: 'Mountain' },
  volcano: { emoji: '🌋', es: 'Volcán', en: 'Volcano' },
  desert: { emoji: '🏜️', es: 'Desierto', en: 'Desert' },
  island: { emoji: '🏝️', es: 'Isla', en: 'Island' },
  islands: { emoji: '🏝️', es: 'Archipiélago', en: 'Archipelago' },
  peninsula: { emoji: '🗺️', es: 'Península', en: 'Peninsula' },
  cape: { emoji: '🧭', es: 'Cabo', en: 'Cape' },
  plateau: { emoji: '🏔️', es: 'Meseta', en: 'Plateau' },
  basin: { emoji: '🌳', es: 'Cuenca', en: 'Basin' },
  delta: { emoji: '🌾', es: 'Delta', en: 'Delta' },
  waterfall: { emoji: '💦', es: 'Cataratas', en: 'Waterfall' },
  valley: { emoji: '🏞️', es: 'Valle', en: 'Valley' },
  plain: { emoji: '🌾', es: 'Llanura', en: 'Plain' },
  wetland: { emoji: '🌿', es: 'Humedal', en: 'Wetland' },
  canyon: { emoji: '🏜️', es: 'Cañón', en: 'Canyon' },
  region: { emoji: '🗺️', es: 'Región', en: 'Region' },
  reef: { emoji: '🐠', es: 'Arrecife', en: 'Reef' },
  isthmus: { emoji: '🗺️', es: 'Istmo', en: 'Isthmus' },
  glacier: { emoji: '🧊', es: 'Glaciar', en: 'Glacier' },
  park: { emoji: '🌳', es: 'Parque natural', en: 'Natural park' },
  paramo: { emoji: '🌾', es: 'Páramo', en: 'Páramo' },
  department: { emoji: '🗺️', es: 'Departamento', en: 'Department' },
  district: { emoji: '🏛️', es: 'Distrito capital', en: 'Capital district' },
};

export const featureTypeLabel = (type: FeatureType | undefined, locale: string): string =>
  type ? FEATURE_TYPE[type][locale === 'en' ? 'en' : 'es'] : '';
export const featureTypeEmoji = (type: FeatureType | undefined): string => (type ? FEATURE_TYPE[type].emoji : '📍');
