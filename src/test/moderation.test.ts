import { describe, expect, it } from 'vitest';
import { nameAllowed } from '@/lib/nameFilter';
import { targetUuid } from '@/lib/moderation';

describe('contenido de usuarios', () => {
  it('rechaza groserías con mayúsculas o tildes, sin bloquear nombres normales', () => {
    expect(nameAllowed('El MALPARIDO')).toBe(false);
    expect(nameAllowed('Cabrón 99')).toBe(false);
    expect(nameAllowed('Juanjo')).toBe(true);
    expect(nameAllowed('Computadora')).toBe(true);
  });

  it('solo envía identificadores reales de jugador', () => {
    expect(targetUuid('00000000-0000-0000-0000-000000000001')).toBe('00000000-0000-0000-0000-000000000001');
    expect(targetUuid('null')).toBeNull();
    expect(targetUuid('3')).toBeNull();
    expect(targetUuid(null)).toBeNull();
  });
});
