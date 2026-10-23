/**
 * Borrar la cuenta (requisito de Google Play: dentro de la app y desde la web, /eliminar-cuenta).
 *
 * El servidor borra el usuario y, en cascada, todo lo suyo (migración 20261019120000_delete_account_push.sql).
 * Aquí además se limpia lo que el juego guardó en este aparato a nombre del jugador. Se conservan solo las
 * preferencias del aparato (idioma, sonido, accesibilidad, tutorial visto), que no identifican a nadie.
 */
import { supabase } from '@/integrations/supabase/client';

/** Claves locales que NO son datos del jugador sino ajustes del aparato */
const KEEP_KEYS = new Set([
  'geospeed_locale',
  'geospeed_prefs',
  'geospeed_music_muted',
  'geospeed_tutorial_seen',
  'geospeed_last_selection',
]);

/** Borra del aparato los datos del jugador (progreso, historial, vidas, cola offline, nombre, avatar…). */
export function clearLocalPlayerData(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('geospeed_') && !KEEP_KEYS.has(k)) keys.push(k);
    }
    keys.forEach(k => localStorage.removeItem(k));
  } catch { /* almacenamiento bloqueado: nada que limpiar */ }
}

/** Borra la cuenta en el servidor, cierra la sesión y limpia el aparato. false si el servidor falló. */
export async function deleteMyAccount(): Promise<boolean> {
  const { error } = await supabase.rpc('delete_my_account');
  if (error) {
    console.warn('[cuenta] No se pudo eliminar la cuenta', error.message);
    return false;
  }
  // El usuario ya no existe: solo se descarta la sesión guardada en este aparato
  try { await supabase.auth.signOut({ scope: 'local' }); } catch { /* ignore */ }
  clearLocalPlayerData();
  return true;
}
