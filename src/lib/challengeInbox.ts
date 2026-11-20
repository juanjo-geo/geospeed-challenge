/**
 * Bandeja de retos para el Inicio: cuántos retos esperan algo de mí (por aceptar o por jugar) y la primera
 * invitación pendiente (revancha o reto nuevo), para avisar sin que el jugador tenga que abrir Mis retos.
 * No hay notificaciones push todavía: sin esto, una revancha solo se veía entrando a Mis retos.
 *
 * Nunca crea una sesión: si el jugador no tiene sesión (ni anónima), no hay retos que mirar.
 */
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { MyChallenge } from './challenges';

export interface ChallengeInbox {
  /** Retos por aceptar + por jugar */
  pending: number;
  /** La invitación más reciente que todavía no acepté */
  invite: Pick<MyChallenge, 'id' | 'code' | 'rival_name' | 'is_rematch' | 'state'> | null;
}

const KEY = 'geospeed_challenge_inbox';
const EMPTY: ChallengeInbox = { pending: 0, invite: null };

function readCache(): ChallengeInbox {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (v && typeof v.pending === 'number') return v as ChallengeInbox;
  } catch { /* sin almacenamiento */ }
  return EMPTY;
}

export function summarizeInbox(list: MyChallenge[]): ChallengeInbox {
  const waiting = list.filter((c) => c.status !== 'cancelled' && (c.state === 'to_accept' || c.state === 'to_play'));
  const invite = list
    .filter((c) => c.status !== 'cancelled' && c.state === 'to_accept')
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  return {
    pending: waiting.length,
    invite: invite ? { id: invite.id, code: invite.code, rival_name: invite.rival_name, is_rematch: invite.is_rematch, state: invite.state } : null,
  };
}

const mockOn = () => {
  try { return import.meta.env.DEV && localStorage.getItem('geospeed_mock_challenges') === '1'; } catch { return false; }
};

async function load(): Promise<ChallengeInbox | null> {
  let list: MyChallenge[];
  if (mockOn()) {
    const { fetchMyChallenges } = await import('./challenges');
    list = await fetchMyChallenges();
  } else {
    const { data: s } = await supabase.auth.getSession();
    if (!s.session) return EMPTY;
    const { data, error } = await supabase.rpc('my_challenges', { p_limit: 100 });
    if (error) return null;
    list = (data ?? []) as unknown as MyChallenge[];
  }
  const inbox = summarizeInbox(list);
  try { localStorage.setItem(KEY, JSON.stringify(inbox)); } catch { /* sin almacenamiento */ }
  return inbox;
}

/** Se lee al abrir el Inicio, al volver a la app y cada minuto mientras el Inicio está abierto */
export function useChallengeInbox(enabled = true): ChallengeInbox {
  const [inbox, setInbox] = useState<ChallengeInbox>(readCache);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    const refresh = () => {
      if (document.visibilityState === 'hidden' || !navigator.onLine) return;
      load().then((v) => { if (alive && v) setInbox(v); }).catch(() => {});
    };
    refresh();
    const id = window.setInterval(refresh, 60_000);
    document.addEventListener('visibilitychange', refresh);
    return () => { alive = false; window.clearInterval(id); document.removeEventListener('visibilitychange', refresh); };
  }, [enabled]);
  return inbox;
}
