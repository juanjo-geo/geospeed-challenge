import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clampCrop, clearProfilePhoto, cropRect, getProfilePhoto, setProfilePhoto } from '@/lib/profilePhoto';

describe('foto de perfil', () => {
  beforeEach(() => localStorage.clear());

  it('se guarda y se borra en el dispositivo', () => {
    expect(getProfilePhoto()).toBeNull();
    expect(setProfilePhoto('data:image/webp;base64,AAAA')).toBe(true);
    expect(getProfilePhoto()).toBe('data:image/webp;base64,AAAA');
    clearProfilePhoto();
    expect(getProfilePhoto()).toBeNull();
  });

  it('avisa si el dispositivo no puede guardarla', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
    expect(setProfilePhoto('data:image/webp;base64,AAAA')).toBe(false);
    spy.mockRestore();
  });

  it('sin mover la imagen recorta el centro', () => {
    expect(cropRect({ x: 0, y: 0 }, 1000, 2000, 200, 1)).toEqual({ sx: 0, sy: 500, side: 1000 });
  });

  it('acercar recorta un cuadrado más pequeño', () => {
    expect(cropRect({ x: 0, y: 0 }, 1000, 1000, 200, 2)).toEqual({ sx: 250, sy: 250, side: 500 });
  });

  it('bajar la imagen muestra su parte de arriba', () => {
    expect(cropRect({ x: 0, y: 100 }, 1000, 2000, 200, 1).sy).toBe(0);
  });

  it('la imagen siempre cubre el círculo', () => {
    expect(clampCrop({ x: 500, y: 500 }, 1000, 2000, 200, 1)).toEqual({ x: 0, y: 100 });
    expect(clampCrop({ x: 500, y: 500 }, 1000, 1000, 200, 2)).toEqual({ x: 100, y: 100 });
  });
});
