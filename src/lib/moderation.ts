import { supabase } from '@/integrations/supabase/client';
import { ensureGuestSession } from './identity';

export type ReportKind = 'player' | 'quiz' | 'room' | 'challenge';
export type ReportReason = 'offensive_name' | 'impersonation' | 'spam' | 'other';
export const REPORT_REASONS: ReportReason[] = ['offensive_name', 'impersonation', 'spam', 'other'];

export interface ReportTarget {
  kind: ReportKind;
  /** Dónde se vio: tabla, código del quiz, `sala:puesto`, id del reto */
  ref: string;
  name: string;
  userId?: string | null;
}

/** Las filas históricas del ranking no tienen jugador: solo se envía un id real */
export const targetUuid = (id?: string | null) => (id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) ? id : null);

export async function reportContent(target: ReportTarget, reason: ReportReason): Promise<'ok' | 'limit' | 'error'> {
  if ((await ensureGuestSession({ force: true })) === 'unavailable') return 'error';
  const { error } = await (supabase.rpc as unknown as (fn: string, args: Record<string, unknown>) => Promise<{ error: { message: string } | null }>)('report_content', {
    p_kind: target.kind, p_ref: target.ref, p_name: target.name, p_reason: reason, p_target: targetUuid(target.userId),
  });
  if (!error) return 'ok';
  return error.message.includes('report_limit') ? 'limit' : 'error';
}
