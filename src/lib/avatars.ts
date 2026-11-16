/**
 * Avatares del Explorador en colores (sugerencia de jugadores, 2026-11-17). El avatar del perfil es un texto que viaja
 * al servidor (profiles.avatar, ≤ 40 caracteres) y lo ven los demás jugadores:
 *   'mascot'          → el Explorador amarillo de siempre
 *   'mascot:<color>'  → el mismo Explorador teñido (filtro CSS sobre la ilustración)
 *   cualquier otro    → un emoji
 * Los modelos nuevos (peinados, accesorios) necesitan ilustraciones propias: cuando existan se agregan aquí.
 */
export interface MascotColor { id: string; nameKey: string; filter: string }

// Tonos elegidos a ojo sobre la ilustración (hue-rotate no es una rotación exacta: los oscuros llevan brillo menor)
export const MASCOT_COLORS: MascotColor[] = [
  { id: 'turquesa', nameKey: 'avatar_teal', filter: 'hue-rotate(130deg) saturate(1.4)' },
  { id: 'azul', nameKey: 'avatar_blue', filter: 'hue-rotate(172deg) saturate(2.2) brightness(0.78)' },
  { id: 'morado', nameKey: 'avatar_purple', filter: 'hue-rotate(212deg) saturate(2.2) brightness(0.72)' },
  { id: 'rosa', nameKey: 'avatar_pink', filter: 'hue-rotate(250deg) saturate(1.5)' },
  { id: 'rojo', nameKey: 'avatar_red', filter: 'hue-rotate(305deg) saturate(2.4) brightness(0.82)' },
  { id: 'naranja', nameKey: 'avatar_orange', filter: 'hue-rotate(322deg) saturate(1.7)' },
  { id: 'verde', nameKey: 'avatar_green', filter: 'hue-rotate(60deg) saturate(1.3)' },
  { id: 'gris', nameKey: 'avatar_silver', filter: 'grayscale(1) brightness(1.15)' },
  { id: 'grafito', nameKey: 'avatar_graphite', filter: 'grayscale(1) brightness(0.55) contrast(1.2)' },
];

export const MASCOT_AVATARS = ['mascot', ...MASCOT_COLORS.map((c) => `mascot:${c.id}`)];

/** El avatar es el Explorador (en cualquier color), o no hay avatar */
export const isMascotAvatar = (a: string | null | undefined): boolean => !a || a === 'mascot' || a.startsWith('mascot:');

/** Filtro CSS del color elegido; null = amarillo original (o un color que esta versión no conoce) */
export function mascotFilter(a: string | null | undefined): string | null {
  if (!a?.startsWith('mascot:')) return null;
  return MASCOT_COLORS.find((c) => c.id === a.slice(7))?.filter ?? null;
}

/** El jugador eligió un color (no el amarillo por defecto): las caras de rivales lo respetan en vez del tinte de puesto */
export const hasMascotColor = (a: string | null | undefined): boolean => mascotFilter(a) != null;
