import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useI18n } from '@/i18n';
import { playButtonTap } from '@/lib/sounds';
import ScreenHeader from '@/components/ui/ScreenHeader';
import Mascot from './Mascot';
import WorldMapCanvas from './WorldMapCanvas';
import type { City, GameMode } from '@/data/cities';
import { CATEGORY_ART, CATEGORY_KEY, itemTitle, itemSubtitle, type Category } from '@/lib/catalog';
import { REGION_ART, REGION_FLAG } from '@/lib/selectionArt';
import { haversineKm } from '@/lib/flagScoring';
import { formatNumber } from '@/lib/format';
import { isPro } from '@/lib/premiumSystem';
import {
  QUIZ_CATEGORIES, QUIZ_FREE_LIMIT, QUIZ_MAX, QUIZ_MIN, QUIZ_NAME_MAX, QUIZ_REGIONS,
  deleteQuiz, failedItemIds, fetchMyQuizzes, fetchQuiz, quizItem, quizLink, quizNameOk, quizPool, saveQuiz,
  type Quiz, type QuizDraft, type QuizError,
} from '@/lib/quizzes';
import FavStar from './FavStar';
import { rememberQuizName } from '@/lib/favorites';

const errorKey: Record<QuizError, string> = {
  limit: 'quiz_errLimit', name: 'quiz_errName', rude: 'quiz_errRude', items: 'quiz_errItems', offline: 'quiz_errOffline', not_found: 'quiz_errNotFound',
};
const CAT_EMOJI = (c: Category) => CATEGORY_ART[c].emoji;

function shareQuiz(q: Pick<Quiz, 'code' | 'name'>, t: (k: never, p?: Record<string, string | number>) => string) {
  const link = quizLink(q.code);
  const text = (t as (k: string, p?: Record<string, string | number>) => string)('quiz_shareText', { name: q.name, link });
  return {
    whatsapp: () => window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener'),
    native: async () => {
      try {
        if (navigator.share) { await navigator.share({ text, url: link }); return; }
        await navigator.clipboard.writeText(text);
        toast((t as (k: string) => string)('quiz_linkCopied'));
      } catch { /* cancelado */ }
    },
  };
}

function settingsLine(q: Pick<Quiz, 'item_ids' | 'categories' | 'settings'>, t: (k: string, p?: Record<string, string | number>) => string) {
  return [
    t('quiz_nItems', { n: q.item_ids.length }),
    q.categories.map(CAT_EMOJI).join(''),
    q.settings.clock ? `⏱️ ${t('quiz_clockOn')}` : `♾️ ${t('quiz_clockOff')}`,
    t('quiz_nRounds', { n: q.settings.rounds }),
  ].join(' · ');
}

// ── Mis quizzes ──────────────────────────────────────────────────────────────

interface MyQuizzesProps {
  onBack: () => void;
  onCreate: (prefill?: Partial<QuizDraft>) => void;
  onEdit: (q: Quiz) => void;
  onOpen: (code: string) => void;
  onPlay: (q: Quiz) => void;
  onOpenStore: () => void;
}

/** Mis quizzes (Fase 10): crear, crear con mis falladas, jugar, editar, duplicar, compartir y borrar */
export function MyQuizzesScreen({ onBack, onCreate, onEdit, onOpen, onPlay, onOpenStore }: MyQuizzesProps) {
  const { t } = useI18n();
  const tt = t as (k: string, p?: Record<string, string | number>) => string;
  const [data, setData] = useState<{ quizzes: Quiz[]; limit: number | null } | null | undefined>(undefined);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const load = () => { fetchMyQuizzes().then((d) => { d?.quizzes.forEach((q) => rememberQuizName(q.code, q.name)); setData(d); }); };
  useEffect(load, []);
  const quizzes = data?.quizzes ?? [];
  const limit = data?.limit === undefined ? QUIZ_FREE_LIMIT : data.limit;
  const full = limit != null && quizzes.length >= limit && !isPro();
  const failed = useMemo(failedItemIds, []);

  const create = (prefill?: Partial<QuizDraft>) => {
    playButtonTap();
    if (full) { toast(t('quiz_errLimit')); return; }
    onCreate(prefill);
  };
  const duplicate = async (q: Quiz) => {
    playButtonTap();
    if (full) { toast(t('quiz_errLimit')); return; }
    const r = await saveQuiz({ name: `${q.name.slice(0, QUIZ_NAME_MAX - 4)} (2)`, region: q.region, categories: q.categories, item_ids: q.item_ids, settings: q.settings });
    if ('error' in r) toast(tt(errorKey[r.error])); else { toast(t('quiz_duplicated')); load(); }
  };
  const remove = async (q: Quiz) => {
    playButtonTap();
    setConfirmDel(null);
    if (await deleteQuiz(q.id)) { toast(t('quiz_deleted')); load(); } else toast(t('quiz_errOffline'));
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center game-bg overflow-y-auto px-3 py-4 sm:px-4 sm:py-6 md:px-6">
      <div className="w-full max-w-3xl animate-fade-in-up pb-6" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 8px)' }}>
        <ScreenHeader onBack={onBack} title={t('quiz_myTitle')} subtitle={t('quiz_mySubtitle')} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button onClick={() => create()} className="btn3d rounded-2xl py-3.5 font-black text-lg text-primary-foreground" style={{ background: 'var(--grad-cta)' }}>＋ {t('quiz_create')}</button>
          <button
            onClick={() => (failed.length >= QUIZ_MIN ? create({ name: t('quiz_failedName'), item_ids: failed, region: 'world', categories: ['cities', 'flags', 'features', 'monuments'] }) : toast(tt('quiz_failedFew', { n: QUIZ_MIN })))}
            className={`rounded-2xl border-2 py-3 font-bold ${failed.length >= QUIZ_MIN ? 'border-accent/60 text-accent hover:bg-accent/10' : 'border-foreground/15 text-foreground/50'}`}
          >
            🧠 {t('quiz_createFailed')} {failed.length >= QUIZ_MIN && <span className="text-xs">({failed.length})</span>}
          </button>
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {limit == null ? t('quiz_unlimited') : tt('quiz_countLimit', { n: quizzes.length, limit })}
          {full && <button onClick={() => { playButtonTap(); onOpenStore(); }} className="ml-1.5 font-bold text-primary underline">{t('quiz_goPro')}</button>}
        </p>

        {data === undefined && <p className="mt-6 text-center text-muted-foreground">{t('loading')}</p>}
        {data === null && <p className="mt-6 text-center text-muted-foreground">{t('quiz_errOffline')}</p>}
        {data && quizzes.length === 0 && (
          <section className="mt-4 rounded-3xl border-2 border-accent/40 bg-card/70 p-6 text-center">
            <Mascot state="thinking" className="w-24 mx-auto" />
            <p className="mt-2 font-bold">{t('quiz_empty')}</p>
            <p className="text-sm text-muted-foreground">{t('quiz_emptyDesc')}</p>
          </section>
        )}
        <div className="mt-4 flex flex-col gap-3">
          {quizzes.map((q) => (
            <section key={q.id} className="rounded-3xl border-2 border-accent/35 bg-card/75 p-3 sm:p-4">
              <div className="flex items-start gap-2">
                <button onClick={() => { playButtonTap(); onOpen(q.code); }} className="flex-1 min-w-0 text-left">
                  <span className="block font-extrabold text-lg leading-tight truncate">🧩 {q.name}</span>
                  <span className="block text-xs text-muted-foreground mt-0.5">{settingsLine(q, tt)}</span>
                  <span className="block text-xs font-bold mt-1">
                    {q.my_best ? <span className="text-primary">{tt('quiz_myBest', { score: formatNumber(q.my_best.score), rank: q.my_best.rank, players: q.my_best.players })}</span> : <span className="text-foreground/60">{t('quiz_notPlayed')}</span>}
                    <span className="text-muted-foreground"> · {tt('quiz_plays', { n: q.plays })}</span>
                  </span>
                </button>
                <FavStar type="quiz" id={q.code} />
              </div>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                <button onClick={() => { playButtonTap(); onPlay(q); }} className="btn3d rounded-xl px-4 py-1.5 font-black text-sm text-primary-foreground" style={{ background: 'var(--grad-cta)' }}>▶ {t('quiz_play')}</button>
                <button onClick={() => { playButtonTap(); shareQuiz(q, t).whatsapp(); }} className="rounded-xl border-2 border-accent/50 px-3 py-1.5 text-sm font-bold text-accent">💬 WhatsApp</button>
                <button onClick={() => { playButtonTap(); onEdit(q); }} className="rounded-xl border-2 border-foreground/20 px-3 py-1.5 text-sm font-bold">✏️ {t('quiz_edit')}</button>
                <button onClick={() => duplicate(q)} className="rounded-xl border-2 border-foreground/20 px-3 py-1.5 text-sm font-bold">⧉ {t('quiz_duplicate')}</button>
                {confirmDel === q.id
                  ? <button onClick={() => remove(q)} className="rounded-xl border-2 border-destructive bg-destructive/15 px-3 py-1.5 text-sm font-bold text-destructive">{t('quiz_confirmDelete')}</button>
                  : <button onClick={() => { playButtonTap(); setConfirmDel(q.id); }} className="rounded-xl border-2 border-foreground/20 px-3 py-1.5 text-sm font-bold text-destructive/90">🗑 {t('quiz_delete')}</button>}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Editor ───────────────────────────────────────────────────────────────────

interface EditorProps {
  initial: Partial<QuizDraft> | null;
  onBack: () => void;
  onSaved: (q: Quiz) => void;
  onOpenStore: () => void;
}

/** Radio para elegir un lugar tocando el mapa (km según la región) */
const PICK_KM: Partial<Record<GameMode, number>> = { world: 450, europe: 180, asia: 300, americas: 300, africa: 280, colombia: 60 };

/** Crear o editar un quiz: nombre, categorías, región, lugares (lista con buscador o mapa), reloj, rondas y orden */
export function QuizEditorScreen({ initial, onBack, onSaved, onOpenStore }: EditorProps) {
  const { t, locale } = useI18n();
  const tt = t as (k: string, p?: Record<string, string | number>) => string;
  const [name, setName] = useState(initial?.name ?? '');
  const [region, setRegion] = useState<GameMode>(initial?.region ?? 'world');
  const [cats, setCats] = useState<Category[]>(initial?.categories?.length ? initial.categories : ['cities']);
  const [ids, setIds] = useState<string[]>(initial?.item_ids ?? []);
  const [clock, setClock] = useState(initial?.settings?.clock ?? true);
  const [rounds, setRounds] = useState<number>(initial?.settings?.rounds ?? 10);
  const [order, setOrder] = useState<'random' | 'fixed'>(initial?.settings?.order ?? 'random');
  const [tab, setTab] = useState<'list' | 'map'>('list');
  const [query, setQuery] = useState('');
  const [mapNote, setMapNote] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<QuizError | null>(null);

  const pool = useMemo(() => quizPool(cats, region), [cats, region]);
  const selected = useMemo(() => new Set(ids), [ids]);
  const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const shown = useMemo(() => {
    const q = norm(query.trim());
    const list = q ? pool.filter((c) => norm(itemTitle(c, locale)).includes(q) || norm(itemSubtitle(c, locale)).includes(q)) : pool;
    return list.slice(0, 150);
  }, [pool, query, locale]);
  const markers = useMemo(() => pool.map((c) => ({ lat: c.lat, lon: c.lon, on: selected.has(c.id!) })), [pool, selected]);
  // Los elegidos que no están en la región o categorías actuales también cuentan (p. ej. "con mis falladas")
  const chosen = useMemo(() => ids.map(quizItem).filter((c): c is City => !!c), [ids]);
  const maxRounds = Math.max(QUIZ_MIN, ids.length);
  const effRounds = Math.min(Math.max(QUIZ_MIN, rounds), maxRounds);
  const nameOk = name.trim().length > 0 && quizNameOk(name);
  const canSave = nameOk && ids.length >= QUIZ_MIN && ids.length <= QUIZ_MAX && !saving;

  const toggle = (id: string) => {
    setIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : cur.length >= QUIZ_MAX ? (toast(tt('quiz_maxItems', { n: QUIZ_MAX })), cur) : [...cur, id]));
  };
  const onMapPick = (lat: number, lon: number) => {
    let best: City | null = null;
    let bestKm = Infinity;
    for (const c of pool) { const km = haversineKm(lat, lon, c.lat, c.lon); if (km < bestKm) { bestKm = km; best = c; } }
    if (!best || bestKm > (PICK_KM[region] ?? 300)) { setMapNote(t('quiz_mapNothing')); return; }
    const was = selected.has(best.id!);
    toggle(best.id!);
    setMapNote(tt(was ? 'quiz_mapRemoved' : 'quiz_mapAdded', { name: itemTitle(best, locale) }));
  };
  const save = async () => {
    if (!canSave) return;
    playButtonTap();
    setSaving(true);
    setErr(null);
    const r = await saveQuiz({ id: initial?.id, name, region, categories: cats, item_ids: ids, settings: { clock, rounds: effRounds, order } });
    setSaving(false);
    if ('error' in r) { setErr(r.error); return; }
    toast(t('quiz_saved'));
    onSaved(r.quiz);
  };
  const chip = (active: boolean, label: React.ReactNode, onClick: () => void, key: string) => (
    <button key={key} type="button" onClick={() => { playButtonTap(); onClick(); }} aria-pressed={active}
      className={`rounded-full border-2 px-3 py-1 text-sm font-bold transition-colors ${active ? 'border-primary bg-primary/15 text-primary' : 'border-foreground/20 text-foreground/80 hover:border-accent/60'}`}>{label}</button>
  );

  return (
    <div className="min-h-[100dvh] flex flex-col items-center game-bg overflow-y-auto px-3 py-4 sm:px-4 sm:py-6 md:px-6">
      <div className="w-full max-w-3xl animate-fade-in-up pb-6" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 8px)' }}>
        <ScreenHeader onBack={onBack} title={initial?.id ? t('quiz_editTitle') : t('quiz_createTitle')} subtitle={t('quiz_editorSubtitle')} />

        <section className="rounded-3xl border-2 border-accent/35 bg-card/75 p-3 sm:p-4 flex flex-col gap-3">
          <label className="block">
            <span className="text-sm font-bold">{t('quiz_name')}</span>
            <input value={name} maxLength={QUIZ_NAME_MAX} onChange={(e) => setName(e.target.value)} placeholder={t('quiz_namePlaceholder')}
              className="mt-1 w-full rounded-xl border-2 border-accent/50 bg-brand-navy-deep/60 px-3 py-2 font-bold focus:outline-none focus:ring-2 focus:ring-accent" />
            {name && !quizNameOk(name) && <span className="text-xs font-semibold text-destructive">{t('quiz_errRude')}</span>}
          </label>
          <div>
            <p className="text-sm font-bold mb-1">{t('quiz_categories')}</p>
            <div className="flex flex-wrap gap-2">
              {QUIZ_CATEGORIES.filter((c) => c !== 'divisions' || region === 'colombia').map((c) =>
                chip(cats.includes(c), <>{CAT_EMOJI(c)} {t(CATEGORY_KEY[c] as never)}</>, () => setCats((cur) => (cur.includes(c) ? (cur.length > 1 ? cur.filter((x) => x !== c) : cur) : [...cur, c])), c))}
            </div>
          </div>
          <div>
            <p className="text-sm font-bold mb-1">{t('quiz_region')}</p>
            <div className="flex flex-wrap gap-2">
              {QUIZ_REGIONS.map((m) => chip(region === m, <>{REGION_FLAG[m] ? <img src={REGION_FLAG[m]} alt="" className="inline w-5 aspect-[3/2] object-cover rounded-[2px] align-[-3px]" /> : REGION_ART[m].emoji} {t(`mode_${m}` as never)}</>, () => {
                setRegion(m);
                if (m !== 'colombia') setCats((cur) => (cur.filter((c) => c !== 'divisions').length ? cur.filter((c) => c !== 'divisions') : ['cities']));
              }, m))}
            </div>
          </div>
        </section>

        <section className="mt-3 rounded-3xl border-2 border-accent/35 bg-card/75 p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <h2 className="font-extrabold text-lg">{t('quiz_places')} <span className={`text-sm ${ids.length >= QUIZ_MIN ? 'text-accent' : 'text-foreground/60'}`}>{ids.length} / {QUIZ_MAX}</span></h2>
            <div className="flex rounded-full border-2 border-accent/40 p-0.5 text-sm font-bold">
              {(['list', 'map'] as const).map((k) => (
                <button key={k} type="button" onClick={() => { playButtonTap(); setTab(k); }} className={`rounded-full px-3 py-1 ${tab === k ? 'bg-accent text-brand-navy-deep' : 'text-foreground/80'}`}>{k === 'list' ? `☰ ${t('quiz_tabList')}` : `🗺️ ${t('quiz_tabMap')}`}</button>
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-2">{tt('quiz_placesHint', { min: QUIZ_MIN, max: QUIZ_MAX })}</p>
          {tab === 'list' ? (
            <>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('quiz_search')}
                className="w-full rounded-xl border-2 border-foreground/20 bg-brand-navy-deep/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
              <ul className="mt-2 max-h-80 overflow-y-auto rounded-xl border border-foreground/10 divide-y divide-foreground/10">
                {shown.map((c) => {
                  const on = selected.has(c.id!);
                  return (
                    <li key={c.id}>
                      <button type="button" onClick={() => toggle(c.id!)} className={`w-full flex items-center gap-2.5 px-3 py-2 text-left ${on ? 'bg-primary/10' : 'hover:bg-foreground/5'}`} aria-pressed={on}>
                        <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center text-xs font-black ${on ? 'border-primary bg-primary text-primary-foreground' : 'border-foreground/30'}`}>{on ? '✓' : ''}</span>
                        <span aria-hidden>{CAT_EMOJI(c.kind === 'flag' ? 'flags' : c.kind === 'feature' ? 'features' : c.kind === 'monument' ? 'monuments' : c.kind === 'division' ? 'divisions' : 'cities')}</span>
                        <span className="flex-1 min-w-0">
                          <span className="block font-bold text-sm truncate">{itemTitle(c, locale)}</span>
                          <span className="block text-xs text-muted-foreground truncate">{itemSubtitle(c, locale)}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
                {shown.length === 0 && <li className="px-3 py-4 text-sm text-center text-muted-foreground">{t('quiz_noResults')}</li>}
              </ul>
              {pool.length > shown.length && !query && <p className="mt-1 text-xs text-muted-foreground">{tt('quiz_showingN', { n: shown.length, total: pool.length })}</p>}
            </>
          ) : (
            <>
              <div className="relative h-72 sm:h-96 rounded-2xl overflow-hidden border-2 border-accent/30 [&>div]:!min-h-0">
                <WorldMapCanvas onMapClick={onMapPick} gameMode={region} markers={markers} />
              </div>
              <p className="mt-1.5 text-xs font-semibold min-h-[1rem]" role="status">{mapNote ?? t('quiz_mapHint')}</p>
            </>
          )}
          {chosen.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-bold mb-1">{t('quiz_chosen')}</p>
              <div className="flex flex-wrap gap-1.5">
                {chosen.map((c, i) => (
                  <button key={c.id} type="button" onClick={() => toggle(c.id!)} className="rounded-full border border-primary/50 bg-primary/10 px-2.5 py-0.5 text-xs font-bold" aria-label={tt('quiz_removeItem', { name: itemTitle(c, locale) })}>
                    {order === 'fixed' && <span className="text-primary">{i + 1}. </span>}{itemTitle(c, locale)} ×
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="mt-3 rounded-3xl border-2 border-accent/35 bg-card/75 p-3 sm:p-4 flex flex-col gap-3">
          <div>
            <p className="text-sm font-bold mb-1">{t('quiz_clock')}</p>
            <div className="flex flex-wrap gap-2">
              {chip(clock, `⏱️ ${t('quiz_clockOnLong')}`, () => setClock(true), 'c1')}
              {chip(!clock, `♾️ ${t('quiz_clockOffLong')}`, () => setClock(false), 'c0')}
            </div>
          </div>
          <label className="block">
            <span className="text-sm font-bold">{tt('quiz_roundsLabel', { n: effRounds })}</span>
            <input type="range" min={QUIZ_MIN} max={maxRounds} value={effRounds} onChange={(e) => setRounds(Number(e.target.value))} className="mt-1 w-full accent-[hsl(var(--primary))]" disabled={ids.length <= QUIZ_MIN} />
          </label>
          <div>
            <p className="text-sm font-bold mb-1">{t('quiz_order')}</p>
            <div className="flex flex-wrap gap-2">
              {chip(order === 'random', `🔀 ${t('quiz_orderRandom')}`, () => setOrder('random'), 'o1')}
              {chip(order === 'fixed', `🔢 ${t('quiz_orderFixed')}`, () => setOrder('fixed'), 'o2')}
            </div>
          </div>
        </section>

        {err && (
          <p className="mt-3 text-center text-sm font-bold text-destructive" role="alert">
            {tt(errorKey[err])}
            {err === 'limit' && <button onClick={() => { playButtonTap(); onOpenStore(); }} className="ml-1.5 text-primary underline">{t('quiz_goPro')}</button>}
          </p>
        )}
        <button onClick={save} disabled={!canSave} className="btn3d mt-4 w-full rounded-2xl py-3.5 font-black text-lg text-primary-foreground disabled:opacity-50" style={{ background: 'var(--grad-cta)' }}>
          {saving ? '…' : `💾 ${t('quiz_save')}`}
        </button>
        {!canSave && !saving && <p className="mt-1.5 text-center text-xs text-muted-foreground">{!nameOk ? t('quiz_needName') : tt('quiz_needItems', { n: QUIZ_MIN })}</p>}
      </div>
    </div>
  );
}

// ── Presentación de un quiz (propio o del link compartido) ───────────────────

interface IntroProps {
  code: string;
  onBack: () => void;
  onPlay: (q: Quiz) => void;
  onEdit: (q: Quiz) => void;
  onDaily: () => void;
}

/** Un quiz por su código: datos, mini ranking (top 10 y tu puesto), jugar, compartir y favorito. Sin cuenta. */
export function QuizIntroScreen({ code, onBack, onPlay, onEdit, onDaily }: IntroProps) {
  const { t } = useI18n();
  const tt = t as (k: string, p?: Record<string, string | number>) => string;
  const [q, setQ] = useState<Quiz | null | undefined>(undefined);
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    let alive = true;
    fetchQuiz(code).then((r) => { if (!alive) return; if (r === undefined) setOffline(true); else { if (r) rememberQuizName(r.code, r.name); setQ(r); } });
    return () => { alive = false; };
  }, [code]);

  return (
    <div className="min-h-[100dvh] flex flex-col items-center game-bg overflow-y-auto px-3 py-4 sm:px-4 sm:py-6 md:px-6">
      <div className="w-full max-w-2xl animate-fade-in-up pb-6" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 8px)' }}>
        <ScreenHeader onBack={onBack} title={t('quiz_introTitle')} subtitle={q ? (q.owner_name ? tt('quiz_by', { name: q.owner_name }) : t('quiz_introSubtitle')) : undefined} />
        {q === undefined && !offline && <p className="text-center text-muted-foreground">{t('loading')}</p>}
        {offline && <p className="text-center text-muted-foreground">{t('quiz_errOffline')}</p>}
        {q === null && (
          <section className="rounded-3xl border-2 border-accent/40 bg-card/70 p-6 text-center">
            <Mascot state="confused" className="w-24 mx-auto" />
            <p className="mt-2 font-extrabold text-lg">{t('quiz_gone')}</p>
            <p className="text-sm text-muted-foreground">{t('quiz_goneDesc')}</p>
            <button onClick={() => { playButtonTap(); onDaily(); }} className="btn3d mt-4 w-full rounded-2xl py-3 font-black text-primary-foreground" style={{ background: 'var(--grad-cta)' }}>📅 {t('quiz_goDaily')}</button>
          </section>
        )}
        {q && (
          <>
            <section className="rounded-3xl border-2 border-primary/50 bg-card/80 p-4">
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <h2 className="font-black text-2xl leading-tight">🧩 {q.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{settingsLine(q, tt)}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{q.settings.order === 'fixed' ? t('quiz_orderFixed') : t('quiz_orderRandom')} · {tt('quiz_plays', { n: q.plays })}</p>
                </div>
                <FavStar type="quiz" id={q.code} />
              </div>
              <button onClick={() => { playButtonTap(); onPlay(q); }} className="btn3d mt-4 w-full rounded-2xl py-3.5 font-black text-lg text-primary-foreground" style={{ background: 'var(--grad-cta)' }}>▶ {t('quiz_play')}</button>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button onClick={() => { playButtonTap(); shareQuiz(q, t).whatsapp(); }} className="rounded-xl border-2 border-accent/50 py-2 text-sm font-bold text-accent">💬 WhatsApp</button>
                <button onClick={() => { playButtonTap(); void shareQuiz(q, t).native(); }} className="rounded-xl border-2 border-foreground/20 py-2 text-sm font-bold">🔗 {t('quiz_shareLink')}</button>
              </div>
              {q.mine && <button onClick={() => { playButtonTap(); onEdit(q); }} className="mt-2 w-full rounded-xl border-2 border-foreground/20 py-2 text-sm font-bold">✏️ {t('quiz_edit')}</button>}
              <p className="mt-2 text-center text-[11px] text-muted-foreground">{t('quiz_freeToPlay')}</p>
            </section>
            <QuizRanking quiz={q} />
          </>
        )}
      </div>
    </div>
  );
}

function QuizRanking({ quiz }: { quiz: Quiz }) {
  const { t } = useI18n();
  const tt = t as (k: string, p?: Record<string, string | number>) => string;
  return (
    <section className="mt-3 rounded-3xl border-2 border-accent/35 bg-card/75 p-4">
      <h3 className="font-extrabold text-lg mb-2">🏆 {t('quiz_ranking')}</h3>
      {quiz.top.length === 0 ? <p className="text-sm text-muted-foreground">{t('quiz_rankingEmpty')}</p> : (
        <ol className="flex flex-col gap-1.5">
          {quiz.top.map((r) => (
            <li key={r.rank} className={`flex items-center gap-2.5 rounded-xl px-3 py-1.5 ${r.me ? 'bg-primary/15 border border-primary/50' : 'bg-foreground/5'}`}>
              <span className="w-6 text-center font-black">{r.rank <= 3 ? ['🥇', '🥈', '🥉'][r.rank - 1] : r.rank}</span>
              <span className="flex-1 min-w-0 truncate font-bold">{r.name ?? t('quiz_anon')}{r.me && <span className="text-primary"> · {t('ch_you')}</span>}</span>
              <span className="font-black text-primary">{formatNumber(r.score)}</span>
            </li>
          ))}
        </ol>
      )}
      {quiz.my_best && quiz.my_best.rank > 10 && <p className="mt-2 text-sm font-bold">{tt('quiz_myRank', { rank: quiz.my_best.rank, players: quiz.my_best.players, score: formatNumber(quiz.my_best.score) })}</p>}
    </section>
  );
}

/** Panel del resultado de un quiz (FinalResultScreen): tu puesto en el mini ranking cuando el servidor guardó la partida */
export function QuizResultPanel({ code, name }: { code: string; name: string }) {
  const { t } = useI18n();
  const tt = t as (k: string, p?: Record<string, string | number>) => string;
  const [q, setQ] = useState<Quiz | null>(null);
  useEffect(() => {
    let alive = true;
    const load = () => fetchQuiz(code).then((r) => { if (alive && r) setQ(r); });
    const a = setTimeout(load, 2500);
    const b = setTimeout(load, 7000);
    return () => { alive = false; clearTimeout(a); clearTimeout(b); };
  }, [code]);
  return (
    <div className="mb-4 rounded-2xl border-2 border-primary/50 bg-primary/10 p-3">
      <p className="font-black">🧩 {name}</p>
      {q?.my_best
        ? <p className="text-sm font-bold text-primary">{tt('quiz_myBest', { score: formatNumber(q.my_best.score), rank: q.my_best.rank, players: q.my_best.players })}</p>
        : <p className="text-xs text-muted-foreground">{t('quiz_resultSaving')}</p>}
      {q && q.top.length > 0 && (
        <ol className="mt-1.5 text-xs flex flex-col gap-0.5">
          {q.top.slice(0, 3).map((r) => <li key={r.rank} className={r.me ? 'font-bold text-primary' : ''}>{['🥇', '🥈', '🥉'][r.rank - 1]} {r.name ?? t('quiz_anon')} · {formatNumber(r.score)}</li>)}
        </ol>
      )}
      <button onClick={() => { playButtonTap(); shareQuiz({ code, name }, t).whatsapp(); }} className="mt-2 w-full rounded-xl border-2 border-accent/50 py-1.5 text-sm font-bold text-accent">💬 {t('quiz_challengeFriends')}</button>
    </div>
  );
}
