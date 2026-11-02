/** Continuar con Google: errores al volver, nombre de jugador y cuándo aparece el botón. */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { googleFirstName, googleSignInAvailable, oauthReturnError } from '@/lib/oauth';

afterEach(() => { vi.unstubAllGlobals(); });

describe('Continuar con Google', () => {
  it('lee el error que deja Supabase al volver, en la consulta o en el fragmento', () => {
    expect(oauthReturnError('?oauth=google', '')).toBeNull();
    expect(oauthReturnError('?oauth=google', '#access_token=x&refresh_token=y')).toBeNull();
    // Invitado que enlaza una cuenta de Google que ya tenía cuenta en GeoSpeed
    expect(oauthReturnError('?oauth=google', '#error=server_error&error_code=identity_already_exists&error_description=Identity+is+already+linked+to+another+user')).toBe('linked_elsewhere');
    // …o cuyo correo ya tiene cuenta con contraseña (al entrar, Supabase une Google a esa cuenta)
    expect(oauthReturnError('?oauth=google', '#error=invalid_request&error_code=email_exists&error_description=A+user+with+this+email+address+has+already+been+registered')).toBe('linked_elsewhere');
    expect(oauthReturnError('?oauth=google&error=access_denied&error_description=The+user+denied', '')).toBe('cancelled');
    expect(oauthReturnError('?oauth=google&error=server_error&error_description=Unable+to+exchange+external+code', '')).toBe('failed');
  });

  it('nombre de jugador: el nombre de pila de Google, solo si entró con Google', () => {
    const google = { identities: [{ provider: 'google' }], app_metadata: { provider: 'google' }, user_metadata: { full_name: 'Juan José Grimaldo Ramírez' } };
    expect(googleFirstName(google as never)).toBe('Juan');
    expect(googleFirstName({ ...google, user_metadata: { name: 'Valentina' } } as never)).toBe('Valentina');
    expect(googleFirstName({ ...google, user_metadata: {} } as never)).toBe('');
    // Correo o invitado: no se toca el nombre
    expect(googleFirstName({ identities: [{ provider: 'email' }], app_metadata: { provider: 'email' }, user_metadata: { full_name: 'Ana Pérez' } } as never)).toBe('');
    expect(googleFirstName(null)).toBe('');
  });

  it('el botón aparece solo si Supabase dice que Google está activo', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ external: { google: true, email: true } }) });
    vi.stubGlobal('fetch', fetchMock);
    expect(await googleSignInAvailable()).toBe(true);
    expect(await googleSignInAvailable()).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1); // se pregunta una vez
    expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/auth\/v1\/settings$/);
  });
});
