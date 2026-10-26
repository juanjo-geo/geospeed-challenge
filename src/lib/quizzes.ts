/**
 * Quizzes personalizados (Fase 10, docs/GeoSpeed_Plan_Competencia.md §5): el jugador arma un quiz con 5 a 50 lugares
 * del catálogo (de una o varias categorías y una región), con reloj sí/no, número de rondas y orden, y lo comparte
 * por un link (/q/<código>) que abre sin cuenta y suma a un mini ranking. Gratis hasta 3 guardados; ilimitados con Pro.
 * Todo lo guarda y valida el servidor (migración 20261103120000_quizzes.sql): quiz_save, my_quizzes, quiz_get,
 * quiz_delete; el mejor puntaje lo registra save_game_result cuando la partida trae quiz_code.
 * Sin reloj la rapidez no cuenta (game_type 'quiz_free'); con reloj, 'quiz'.
 */
import { supabase } from '@/integrations/supabase/client';
import type { City, GameMode } from '@/data/cities';
import { catalogItem, catalogPool, type Category } from '@/lib/catalog';
import { cityById, getCachedMemory, isReviewable } from '@/lib/itemMemory';
import { isMockQuizzes, mockQuizzes } from '@/lib/quizzesMock';

export const QUIZ_MIN = 5;
export const QUIZ_MAX = 50;
export const QUIZ_FREE_LIMIT = 3;
export const QUIZ_NAME_MAX = 40;
/** Regiones del editor: las mismas del entrenamiento */
export const QUIZ_REGIONS: GameMode[] = ['world', 'europe', 'asia', 'americas', 'africa', 'colombia'];
export const QUIZ_CATEGORIES: Category[] = ['cities', 'flags', 'features', 'monuments', 'divisions'];

export interface QuizSettings { clock: boolean; rounds: number; order: 'random' | 'fixed' }
export interface QuizScoreRow { rank: number; score: number; time_ms: number; name: string | null; avatar: string | null; me: boolean }
export interface Quiz {
  id: string;
  code: string;
  name: string;
  region: GameMode;
  categories: Category[];
  item_ids: string[];
  settings: QuizSettings;
  plays: number;
  mine: boolean;
  owner_name: string | null;
  top: QuizScoreRow[];
  my_best: { score: number; time_ms: number; rank: number; players: number } | null;
}
export interface QuizDraft { id?: string; name: string; region: GameMode; categories: Category[]; item_ids: string[]; settings: QuizSettings }

// ── Nombres: la misma lista del servidor (_quiz_name_ok), para avisar antes de guardar ──
const RUDE = new Set(('puta puto putas putos mierda mierdas verga vergas malparido malparida hijueputa hijueputas hijoeputa hdp marica maricon ' +
  'maricones pendejo pendeja culero culera chinga chingada chingado cabron cabrona zorra gilipollas polla pene fuck fucking fucker shit ' +
  'bitch cunt dick pussy nigger nigga faggot whore slut asshole bastard nazi hitler').split(' '));
export function quizNameOk(name: string): boolean {
  const words = name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().split(/[^a-z0-9]+/);
  return !words.some((w) => RUDE.has(w));
}
export const cleanName = (name: string) => name.replace(/\s+/g, ' ').trim().slice(0, QUIZ_NAME_MAX);

// ── Lugares ──
/** Lugares que se pueden elegir para un quiz: las categorías elegidas en la región, sin repetir */
export function quizPool(categories: Category[], region: GameMode): City[] {
  const seen = new Set<string>();
  const out: City[] = [];
  for (const cat of categories) {
    if (cat === 'divisions' && region !== 'colombia') continue;
    for (const it of catalogPool(cat, region)) if (it.id && !seen.has(it.id)) { seen.add(it.id); out.push(it); }
  }
  return out;
}
/** Un lugar del quiz por su id (ciudades, banderas, lugares, monumentos, Colombia) */
export const quizItem = (id: string): City | undefined => cityById(id) ?? catalogItem(id);

/** Las rondas de una partida: los lugares (en orden o mezclados) y, si hay menos rondas que lugares, los primeros */
export function quizRun(q: Pick<Quiz, 'item_ids' | 'settings'>, seed = Date.now()): City[] {
  const items = q.item_ids.map(quizItem).filter((c): c is City => !!c);
  let list = items;
  if (q.settings.order !== 'fixed') {
    list = [...items];
    let s = seed >>> 0 || 1;
    for (let i = list.length - 1; i > 0; i--) {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      const j = s % (i + 1);
      [list[i], list[j]] = [list[j], list[i]];
    }
  }
  return list.slice(0, Math.max(1, Math.min(q.settings.rounds, list.length)));
}

/** "Crear quiz con mis falladas": los lugares que más fallas (de Tu memoria), hasta 50 */
export function failedItemIds(): string[] {
  return getCachedMemory()
    .filter((m) => m.fails > 0 && !m.mastered)
    .sort((a, b) => b.fails - a.fails || a.box - b.box)
    .map((m) => m.item_id)
    .filter((id) => { const c = quizItem(id); return !!c && isReviewable(c); })
    .slice(0, QUIZ_MAX);
}

export const quizLink = (code: string) => `${window.location.origin}/q/${code}`;

// ── Servidor ──
export type QuizError = 'limit' | 'name' | 'rude' | 'items' | 'offline' | 'not_found';
function errorOf(msg: string | undefined): QuizError {
  if (!msg) return 'offline';
  if (msg.includes('quiz_limit')) return 'limit';
  if (msg.includes('quiz_name_rude')) return 'rude';
  if (msg.includes('quiz_name')) return 'name';
  if (msg.includes('quiz_items') || msg.includes('quiz_unknown_item')) return 'items';
  if (msg.includes('quiz_not_found')) return 'not_found';
  return 'offline';
}

async function ensureSession(): Promise<boolean> {
  const { ensureGuestSession } = await import('@/lib/identity');
  return (await ensureGuestSession({ force: true })) !== 'unavailable';
}

export async function saveQuiz(d: QuizDraft): Promise<{ quiz: Quiz } | { error: QuizError }> {
  if (!quizNameOk(d.name)) return { error: 'rude' };
  if (isMockQuizzes()) { const q = mockQuizzes.save({ ...d, name: cleanName(d.name) }); return q === 'limit' ? { error: 'limit' } : { quiz: q }; }
  try {
    if (!(await ensureSession())) return { error: 'offline' };
    const { data, error } = await supabase.rpc('quiz_save', { p: { ...d, name: cleanName(d.name) } as never });
    if (error || !data) return { error: errorOf(error?.message) };
    return { quiz: data as unknown as Quiz };
  } catch {
    return { error: 'offline' };
  }
}

export async function fetchMyQuizzes(): Promise<{ quizzes: Quiz[]; limit: number | null } | null> {
  if (isMockQuizzes()) return { quizzes: mockQuizzes.list(), limit: QUIZ_FREE_LIMIT };
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) return { quizzes: [], limit: QUIZ_FREE_LIMIT };
    const { data, error } = await supabase.rpc('my_quizzes');
    if (error || !data) return null;
    return data as unknown as { quizzes: Quiz[]; limit: number | null };
  } catch {
    return null;
  }
}

/** Un quiz por su código (sin cuenta). null = no existe; undefined = sin red */
export async function fetchQuiz(code: string): Promise<Quiz | null | undefined> {
  if (isMockQuizzes()) return mockQuizzes.get(code);
  try {
    const { data, error } = await supabase.rpc('quiz_get', { p_code: code });
    if (error) return undefined;
    return (data as unknown as Quiz | null) ?? null;
  } catch {
    return undefined;
  }
}

export async function deleteQuiz(id: string): Promise<boolean> {
  if (isMockQuizzes()) { mockQuizzes.remove(id); return true; }
  try {
    const { data, error } = await supabase.rpc('quiz_delete', { p_id: id });
    return !error && data === true;
  } catch {
    return false;
  }
}
