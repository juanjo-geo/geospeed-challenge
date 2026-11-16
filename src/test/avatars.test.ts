import { describe, it, expect } from 'vitest';
import { MASCOT_AVATARS, MASCOT_COLORS, isMascotAvatar, mascotFilter } from '../lib/avatars';

describe('avatares del Explorador en colores', () => {
  it('el amarillo de siempre y cada color son Explorador; los emojis no', () => {
    expect(isMascotAvatar('mascot')).toBe(true);
    expect(isMascotAvatar('mascot:morado')).toBe(true);
    expect(isMascotAvatar(null)).toBe(true);
    expect(isMascotAvatar('🚀')).toBe(false);
  });
  it('cada color tiene su filtro; el amarillo y un color desconocido no', () => {
    for (const c of MASCOT_COLORS) expect(mascotFilter(`mascot:${c.id}`)).toBe(c.filter);
    expect(mascotFilter('mascot')).toBeNull();
    expect(mascotFilter('mascot:fucsia')).toBeNull();
  });
  it('caben en profiles.avatar (≤ 40) y no se repiten', () => {
    expect(new Set(MASCOT_AVATARS).size).toBe(MASCOT_AVATARS.length);
    for (const a of MASCOT_AVATARS) expect(a.length).toBeLessThanOrEqual(40);
  });
});
