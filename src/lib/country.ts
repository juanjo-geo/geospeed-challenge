/**
 * País del jugador (Fase 5): se usa en el ranking del Sprint por país y en la bandera que ven sus rivales.
 * Decisión de JuanJo: se elige en el perfil, con el del teléfono por defecto. Para que casi todos tengan
 * bandera, al iniciar sesión se guarda el del teléfono si el perfil aún no tiene país (useAuth).
 * Módulo sin dependencias pesadas: lo importa el arranque de la app.
 */
import { supabase } from '@/integrations/supabase/client';
import { USED_ISOS } from '@/lib/flags';

const TZ_COUNTRY: Record<string, string> = {
  'America/Bogota': 'CO', 'America/Mexico_City': 'MX', 'America/Lima': 'PE', 'America/Santiago': 'CL', 'America/Argentina/Buenos_Aires': 'AR',
  'America/Caracas': 'VE', 'America/Guayaquil': 'EC', 'America/La_Paz': 'BO', 'America/Asuncion': 'PY', 'America/Montevideo': 'UY',
  'America/Panama': 'PA', 'America/Costa_Rica': 'CR', 'America/Guatemala': 'GT', 'America/El_Salvador': 'SV', 'America/Tegucigalpa': 'HN',
  'America/Managua': 'NI', 'America/Santo_Domingo': 'DO', 'America/Havana': 'CU', 'America/Puerto_Rico': 'PR', 'America/Sao_Paulo': 'BR',
  'Europe/Madrid': 'ES', 'America/New_York': 'US', 'America/Chicago': 'US', 'America/Los_Angeles': 'US', 'America/Denver': 'US',
};

/** País del teléfono: la región del idioma (es-CO → CO) o, si no trae, la zona horaria */
export function defaultCountry(): string | null {
  try {
    for (const l of navigator.languages ?? [navigator.language]) {
      const m = /-([A-Z]{2})\b/.exec(l);
      if (m && USED_ISOS.includes(m[1])) return m[1];
    }
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return TZ_COUNTRY[tz] ?? null;
  } catch { return null; }
}

export async function saveMyCountry(iso: string | null): Promise<boolean> {
  const { error } = await supabase.rpc('set_my_country', { p_iso: iso as string });
  return !error;
}

let ensured = false;
/** Al iniciar sesión: si el perfil no tiene país, guarda el del teléfono (una vez por carga de la app) */
export function ensureCountry(current: string | null | undefined): void {
  if (ensured || current) return;
  ensured = true;
  const c = defaultCountry();
  if (c) void saveMyCountry(c);
}
