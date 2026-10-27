import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '@/i18n';
import { playButtonTap } from '@/lib/sounds';
import ScreenHeader from '@/components/ui/ScreenHeader';
import Mascot from './Mascot';
import { REGION_MODES, PACK_MODES, type GameMode } from '@/data/cities';
import { CATEGORY_ART, categoriesForMode, categoryLabelKey, type Category } from '@/lib/catalog';
import { REGION_ART, REGION_FLAG, DIFF_ART, mapUnlockLevel } from '@/lib/selectionArt';
import { getPlayerLevel } from '@/lib/levelSystem';
import { toast } from 'sonner';
import { formatNumber } from '@/lib/format';
import {
  ACHIEVEMENTS, DIFFICULTIES, FRAMES, MEDAL_EMOJI, MEDAL_RULE, TITLES,
  achievementBadge, achievementTier, cosmeticRequirement, earnedSet, markAchievementsSeen, medalCounts, medalKey, medalMap,
  totalMedalSlots, useProgression, type AchievementDef, type Progression,
} from '@/lib/progression';
import { DAILY_STATUS_EVENT, FRAME_STYLE, TITLE_KEY, fetchDailyStatus, getCachedDailyStatus, setActiveCosmetics, type DailyStatus } from '@/lib/dailyChallenge';
import { useAuth } from '@/hooks/useAuth';

const DIFF_SHORT: Record<string, string> = { basic: 'home_diffBasic', easy: 'home_diffEasy', medium: 'home_diffMedium', hard: 'home_diffHard' };
/** Misma clave que la selección del Inicio (HomeScreen SELECTION_KEY): tocar un mapa lo deja elegido para jugar */
const SELECTION_KEY = 'geospeed_last_selection';

// ── Medallas ────────────────────────────────────────────────────────────────

interface MedalsScreenProps { onBack: () => void; onPickMap: () => void }

/**
 * Medallas por mapa (Fase 9): cada región (las 5, Colombia y los packs Pro) con sus categorías × 4 dificultades.
 * 🥉 terminar las 13 · 🥈 9+ aciertos buenos · 🥇 12+. Tocar una casilla la deja elegida en el Inicio para jugarla.
 */
export function MedalsScreen({ onBack, onPickMap }: MedalsScreenProps) {
  const { t } = useI18n();
  const p = useProgression();
  const medals = useMemo(() => medalMap(p), [p]);
  const c = medalCounts(p);
  const total = totalMedalSlots();
  const level = useMemo(() => getPlayerLevel().level, []);
  const pick = (mode: GameMode, difficulty: string, category: Category) => {
    playButtonTap();
    // Mapa bloqueado por nivel: el Inicio no lo dejaría elegido, así que se avisa aquí
    const need = mapUnlockLevel(mode, difficulty as never);
    if (level < need) { toast(t('lock_level', { level: need })); return; }
    try { localStorage.setItem(SELECTION_KEY, JSON.stringify({ mode, difficulty, category })); } catch { /* sin almacenamiento */ }
    onPickMap();
  };
  const region = (mode: GameMode) => {
    const cats = categoriesForMode(mode);
    const got = cats.reduce((n, cat) => n + DIFFICULTIES.filter((d) => (medals.get(medalKey(mode, d, cat))?.medal ?? 0) > 0).length, 0);
    return (
      <section key={mode} className="rounded-3xl border-2 border-accent/35 bg-card/70 p-3 sm:p-4">
        <div className="flex items-center gap-2.5 mb-2">
          {REGION_FLAG[mode] ? <img src={REGION_FLAG[mode]} alt="" className="w-8 aspect-[3/2] object-cover rounded-[3px] ring-1 ring-black/20" /> : <span className="text-2xl" aria-hidden>{REGION_ART[mode].emoji}</span>}
          <h3 className="flex-1 font-extrabold text-lg leading-tight">{t(`mode_${mode}` as never)}</h3>
          <span className="text-xs font-bold text-accent">{got}/{cats.length * DIFFICULTIES.length}</span>
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_repeat(4,3.1rem)] sm:grid-cols-[minmax(0,1fr)_repeat(4,4.5rem)] gap-1 items-center">
          <span />
          {DIFFICULTIES.map((d) => (
            <span key={d} className="text-center text-[10px] sm:text-xs font-bold text-muted-foreground leading-tight truncate"><span aria-hidden>{DIFF_ART[d].emoji}</span><br />{t(DIFF_SHORT[d] as never)}</span>
          ))}
          {cats.map((cat) => (
            <MedalRow key={cat} mode={mode} cat={cat} medals={medals} onPick={pick} level={level} />
          ))}
        </div>
      </section>
    );
  };
  return (
    <div className="min-h-[100dvh] flex flex-col items-center game-bg overflow-y-auto px-3 py-4 sm:px-4 sm:py-6 md:px-6">
      <div className="w-full max-w-4xl animate-fade-in-up pb-6" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 8px)' }}>
        <ScreenHeader onBack={onBack} title={t('medals_title')} subtitle={t('medals_subtitle')} />
        <section className="rounded-3xl border-2 border-primary/50 bg-card/75 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center justify-center gap-4 sm:gap-6 text-center">
            {([[3, c.gold], [2, c.silver], [1, c.bronze]] as const).map(([lvl, n]) => (
              <span key={lvl}><span className="block text-3xl sm:text-4xl" aria-hidden>{MEDAL_EMOJI[lvl]}</span><span className="block font-black text-xl">{n}</span></span>
            ))}
          </div>
          <div className="flex-1 text-sm text-foreground/85 text-center sm:text-left">
            <p className="font-bold">{t('medals_of', { n: c.gold + c.silver + c.bronze, total })}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t('medals_rule', { rounds: MEDAL_RULE.rounds, silver: MEDAL_RULE.silverHits, gold: MEDAL_RULE.goldHits })}</p>
            <p className="text-xs text-muted-foreground">{t('medals_tapHint')}</p>
          </div>
        </section>
        <div className="mt-3 flex flex-col gap-3">{REGION_MODES.map(region)}</div>
        <h2 className="mt-5 mb-2 font-extrabold text-xl">🧭 {t('region_packsGroup')}</h2>
        <div className="flex flex-col gap-3">{PACK_MODES.map(region)}</div>
        {!p && <p className="mt-4 text-center text-sm text-muted-foreground">{t('prog_noData')}</p>}
      </div>
    </div>
  );
}

function MedalRow({ mode, cat, medals, onPick, level }: { mode: GameMode; cat: Category; medals: ReturnType<typeof medalMap>; onPick: (m: GameMode, d: string, c: Category) => void; level: number }) {
  const { t } = useI18n();
  return (
    <>
      <span className="min-w-0 text-sm sm:text-base font-bold truncate"><span aria-hidden>{CATEGORY_ART[cat].emoji}</span> {t(categoryLabelKey(cat, mode) as never)}</span>
      {DIFFICULTIES.map((d) => {
        const m = medals.get(medalKey(mode, d, cat));
        const lvl = m?.medal ?? 0;
        const locked = level < mapUnlockLevel(mode, d);
        return (
          <button
            key={d}
            type="button"
            onClick={() => onPick(mode, d, cat)}
            className={`h-12 sm:h-14 rounded-xl border flex flex-col items-center justify-center transition-colors active:scale-95 ${lvl ? 'border-primary/50 bg-primary/10' : 'border-foreground/10 bg-background/30 hover:border-accent/50'}`}
            aria-label={`${t(`mode_${mode}` as never)} · ${t(DIFF_SHORT[d] as never)} · ${t(categoryLabelKey(cat, mode) as never)}: ${lvl ? t(`medal_${['', 'bronze', 'silver', 'gold'][lvl]}` as never) : t('medals_none')}`}
          >
            <span className={`text-xl sm:text-2xl leading-none ${lvl ? '' : 'opacity-25 grayscale'}`} aria-hidden>{lvl ? MEDAL_EMOJI[lvl as 1 | 2 | 3] : locked ? '🔒' : '🏅'}</span>
            {m && <span className="text-[10px] font-bold text-muted-foreground leading-none mt-0.5">{m.hits}/13</span>}
          </button>
        );
      })}
    </>
  );
}

// ── Logros y vitrina ─────────────────────────────────────────────────────────

interface AchievementsScreenProps { onBack: () => void }

/**
 * Logros (Fase 9): trece logros con tres niveles (bronce · plata · oro) y la vitrina con el título y el marco que
 * se ven en el ranking. Los niveles altos desbloquean títulos y marcos nuevos.
 */
export function AchievementsScreen({ onBack }: AchievementsScreenProps) {
  const { t } = useI18n();
  const p = useProgression();
  const [fresh] = useState(() => new Set((p?.badges ?? []).filter((b) => !b.seen).map((b) => b.id)));
  // Lo nuevo se marca como visto al rato de abrir la pantalla (se alcanza a ver la etiqueta "Nuevo")
  useEffect(() => { const id = setTimeout(() => markAchievementsSeen(p), 2500); return () => clearTimeout(id); }, [p]);
  const earned = earnedSet(p);
  const reached = ACHIEVEMENTS.reduce((n, a) => n + achievementTier(a, p?.stats[a.id] ?? 0), 0);
  return (
    <div className="min-h-[100dvh] flex flex-col items-center game-bg overflow-y-auto px-3 py-4 sm:px-4 sm:py-6 md:px-6">
      <div className="w-full max-w-4xl animate-fade-in-up pb-6" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 8px)' }}>
        <ScreenHeader onBack={onBack} title={t('ach_title')} subtitle={t('ach_subtitle', { n: reached, total: ACHIEVEMENTS.length * 3 })} />
        <Showcase earned={earned} />
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {ACHIEVEMENTS.map((a) => <AchievementCard key={a.id} a={a} p={p} fresh={fresh} />)}
        </div>
        {!p && <p className="mt-4 text-center text-sm text-muted-foreground">{t('prog_noData')}</p>}
      </div>
    </div>
  );
}

const TIER_COLOR = ['', 'hsl(28 62% 52%)', 'hsl(210 14% 78%)', 'hsl(45 95% 58%)'];

function AchievementCard({ a, p, fresh }: { a: AchievementDef; p: Progression | null; fresh: Set<string> }) {
  const { t } = useI18n();
  const value = p?.stats[a.id] ?? 0;
  const tier = achievementTier(a, value);
  const next = tier < 3 ? a.tiers[tier as 0 | 1 | 2] : null;
  const prev = tier > 0 ? a.tiers[(tier - 1) as 0 | 1 | 2] : 0;
  const pct = next == null ? 100 : Math.max(0, Math.min(100, Math.round(((value - prev) / (next - prev)) * 100)));
  const isNew = ([1, 2, 3] as const).some((n) => fresh.has(achievementBadge(a, n)));
  const fmt = (n: number) => (a.id === 'sprint' ? `${formatNumber(n)} PS` : formatNumber(n));
  const rewardLines = ([1, 2, 3] as const).filter((n) => a.rewards?.[n]).map((n) => {
    const r = a.rewards![n]!;
    const parts = [r.title && t('ach_rewardTitle', { v: t(TITLE_KEY[r.title] as never) }), r.frame && t('ach_rewardFrame', { v: t(`frame_${r.frame}` as never) })].filter(Boolean).join(' · ');
    return { n, text: parts };
  });
  return (
    <div className={`relative rounded-2xl border-2 p-3 flex gap-3 ${tier ? 'border-primary/45 bg-card/75' : 'border-foreground/10 bg-card/50'}`}>
      {isNew && <span className="absolute -top-2 right-3 rounded-full bg-primary text-primary-foreground text-[10px] font-black px-2 py-0.5">{t('ach_new')}</span>}
      <span className={`text-4xl leading-none ${tier ? '' : 'grayscale opacity-60'}`} aria-hidden>{a.emoji}</span>
      <span className="flex-1 min-w-0">
        <span className="flex items-center justify-between gap-2">
          <span className="font-extrabold leading-tight">{t(`ach_${a.id}` as never)}</span>
          <span className="flex gap-1 shrink-0" aria-label={t('ach_tierN', { n: tier })}>
            {([1, 2, 3] as const).map((n) => (
              <span key={n} className="w-3.5 h-3.5 rounded-full border-2" style={{ borderColor: TIER_COLOR[n], background: tier >= n ? TIER_COLOR[n] : 'transparent' }} />
            ))}
          </span>
        </span>
        <span className="block text-xs text-muted-foreground leading-snug">{t(`ach_${a.id}Desc` as never)}</span>
        <span className="mt-1.5 block h-2 rounded-full bg-foreground/10 overflow-hidden">
          <span className="block h-full rounded-full" style={{ width: `${pct}%`, background: tier === 3 ? TIER_COLOR[3] : 'hsl(var(--accent))' }} />
        </span>
        <span className="mt-1 block text-xs font-bold">
          {next == null ? <span className="text-primary">✓ {t('ach_maxed')} · {fmt(value)}</span> : <>{fmt(value)} / {fmt(next)}</>}
        </span>
        {rewardLines.length > 0 && (
          <span className="mt-1 block text-[11px] text-foreground/70 leading-snug">
            {rewardLines.map((r) => <span key={r.n} className={`block ${tier >= r.n ? 'text-accent font-semibold' : ''}`}>{['', '🥉', '🥈', '🥇'][r.n]} {r.text}</span>)}
          </span>
        )}
      </span>
    </div>
  );
}

/** Vitrina: avatar con el marco activo, nombre y título activo, y los selectores de título y marco */
function Showcase({ earned }: { earned: Set<string> }) {
  const { t } = useI18n();
  const { user, displayName, avatar } = useAuth();
  const [st, setSt] = useState<DailyStatus | null>(getCachedDailyStatus);
  useEffect(() => {
    const on = (e: Event) => setSt((e as CustomEvent<DailyStatus>).detail);
    window.addEventListener(DAILY_STATUS_EVENT, on);
    fetchDailyStatus();
    return () => window.removeEventListener(DAILY_STATUS_EVENT, on);
  }, []);
  const frame = st?.active_frame ?? null;
  const fs = frame ? FRAME_STYLE[frame] : null;
  const title = st?.active_title ?? null;
  return (
    <section className="rounded-3xl border-2 border-accent/40 bg-card/75 p-4">
      <h2 className="font-extrabold text-lg">🏆 {t('ach_showcase')}</h2>
      <p className="text-xs text-muted-foreground mb-3">{t('ach_showcaseDesc')}</p>
      <div className="flex items-center gap-3 mb-3">
        <span className="w-16 h-16 shrink-0 rounded-full border-[3px] border-primary bg-[radial-gradient(circle_at_50%_40%,hsl(var(--brand-navy-card)),hsl(var(--brand-navy-deep)))] flex items-center justify-center overflow-hidden"
          style={fs ? { borderColor: fs.ring, boxShadow: `0 0 14px ${fs.glow}` } : undefined} aria-hidden>
          {!avatar || avatar === 'mascot' ? <Mascot state="wink" className="w-[80%]" /> : <span className="text-3xl">{avatar}</span>}
        </span>
        <span className="min-w-0">
          <span className="block font-black text-xl truncate">{displayName || t('profile_player')}</span>
          <span className="block text-sm font-bold text-accent">{title ? t(TITLE_KEY[title] as never) : t('ach_noTitle')}</span>
        </span>
      </div>
      {user ? <CosmeticsPicker earned={earned} st={st} /> : <p className="text-xs text-muted-foreground">{t('prog_noData')}</p>}
    </section>
  );
}

/** Selector de título y marco (todos los de la racha y los logros; los no ganados con candado y lo que piden) */
export function CosmeticsPicker({ earned, st }: { earned: Set<string>; st: DailyStatus | null }) {
  const { t } = useI18n();
  const [saving, setSaving] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const has = (badge: string) => earned.has(badge) || (st?.badges ?? []).some((b) => b.id === badge);
  const need = (badge: string) => {
    const r = cosmeticRequirement(badge);
    if (!r) return '';
    if ('streakDays' in r) return t('ach_needStreak', { n: r.streakDays });
    if ('conquest' in r) return t('ach_needConquest');
    return t('ach_needTier', { name: t(`ach_${r.def.id}` as never), tier: ['', '🥉', '🥈', '🥇'][r.tier] });
  };
  const equip = async (title: string | null, frame: string | null) => {
    playButtonTap();
    setSaving(true);
    await setActiveCosmetics(title, frame);
    setSaving(false);
  };
  const chip = (key: string, label: string, active: boolean, ok: boolean, onClick: () => void, swatch?: string, badge?: string) => (
    <button
      key={key}
      type="button"
      disabled={saving}
      onClick={() => (ok ? onClick() : setHint(badge ? need(badge) : null))}
      aria-pressed={active}
      className={`rounded-full border-2 px-3 py-1 text-sm font-bold inline-flex items-center gap-1.5 transition-colors ${active ? 'border-primary bg-primary/15 text-primary' : 'border-foreground/20 text-foreground/80 hover:border-accent/60'} ${ok ? '' : 'opacity-50'}`}
    >
      {swatch && <span className="w-3.5 h-3.5 rounded-full border-2" style={{ borderColor: swatch, boxShadow: `0 0 6px ${swatch}` }} aria-hidden />}
      {!ok && <span aria-hidden>🔒</span>}
      {label}
    </button>
  );
  return (
    <div>
      <p className="text-sm font-bold mb-1">{t('streak_titleLabel')}</p>
      <div className="flex flex-wrap gap-2 mb-3">
        {chip('none', t('streak_none'), !st?.active_title, true, () => equip(null, st?.active_frame ?? null))}
        {TITLES.map((x) => chip(x.id, t(TITLE_KEY[x.id] as never), st?.active_title === x.id, has(x.badge), () => equip(x.id, st?.active_frame ?? null), undefined, x.badge))}
      </div>
      <p className="text-sm font-bold mb-1">{t('streak_frameLabel')}</p>
      <div className="flex flex-wrap gap-2">
        {chip('none', t('streak_none'), !st?.active_frame, true, () => equip(st?.active_title ?? null, null))}
        {FRAMES.map((x) => chip(x.id, t(`frame_${x.id}` as never), st?.active_frame === x.id, has(x.badge), () => equip(st?.active_title ?? null, x.id), FRAME_STYLE[x.id]?.ring, x.badge))}
      </div>
      {hint && <p className="mt-2 text-xs font-semibold text-primary" role="status">🔒 {hint}</p>}
    </div>
  );
}
