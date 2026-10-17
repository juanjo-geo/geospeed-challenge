/**
 * Reglas de cuenta (decisión D10 del plan de rediseño).
 * Mínimo 8 caracteres para contraseñas NUEVAS (registro y restablecimiento).
 * Las cuentas antiguas con 6 siguen pudiendo iniciar sesión: el login no valida longitud.
 */
export const PASSWORD_MIN = 8;

/** URL a la que vuelve el enlace de recuperación. Debe estar en Auth → URL Configuration → Redirect URLs del dashboard. */
export function resetPasswordRedirectUrl(): string {
  return `${window.location.origin}/reset-password`;
}
