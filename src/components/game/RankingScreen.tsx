import { useEffect, useState } from 'react';
import { MODE_CONFIG, type Difficulty } from '@/data/cities';
import { fetchLeaderboardTop, fetchMyRank, type LeaderboardTopRow, type RankPeriod } from '@/lib/gameResults';
import { hasSession } from '@/lib/history';
import { playButtonTap } from '@/lib/sounds';
import { useI18n } from '@/i18n';
import { useAuth } from '@/hooks/useAuth';
import ScreenHeader from '@/components/ui/ScreenHeader';
import SelectorSheet, { type SelectorOption } from './SelectorSheet';
import Mascot from './Mascot';

interface RankingScreenProps {
  initialMode?: string;
  initialDifficulty?: Difficulty;
  onBack: () => void;
  onSignIn: () => void;
}

/** Tabla del ranking: regiones del Clásico, Mundial y 60s de Caos (escala propia, D5/B2) */
type Board = { key: string; mode: string; gameType: string | null; emoji: string; label: string };
const DIFFS: Difficulty[] = ['basic', 'easy', 'medium', 'hard'];
const DIFF_EMOJI: Record<Difficulty, string> = { basic: '🎒', easy: '🧭', medium: '⚡', hard: '🔥' };
const MEDAL = ['🥇', '🥈', '🥉'];

function mockEnabled(): boolean {
  try { return import.meta.env.DEV && localStorage.getItem('geospeed_mock_ranking') === '1'; } catch { return false; }
}
const MOCK_NAMES = ['Laura', 'Mateo', 'Sofía', 'Daniel', 'Camila', 'Andrés', 'Valentina', 'Nicolás', 'Juliana', 'Sebastián'];

/** Ranking (maqueta Ranking_APROBADA_v1): Top 10 con nombre y avatar + tarjeta "Tu posición" aunque esté fuera del Top 10. */
export default function RankingScreen({ initialMode = 'world', initialDifficulty = 'basic', onBack, onSignIn }: RankingScreenProps) {
  const { t } = useI18n();
  const { displayName } = useAuth();
  const [boardKey, setBoardKey] = useState(initialMode);
  const [difficulty, setDifficulty] = useState<Difficulty | ''>(initialDifficulty);
  const [period, setPeriod] = useState<RankPeriod>('all');
  const [rows, setRows] = useState<LeaderboardTopRow[] | null>(null);
  const [mine, setMine] = useState<{ rank: number | null; bestScore: number | null; totalPlayers: number } | null | 'guest'>(null);
  const [error, setError] = useState(false);
  const [sheet, setSheet] = useState<'board' | 'difficulty' | null>(null);

  const boards: Board[] = [
    ...MODE_CONFIG.map(m => ({ key: m.key, mode: m.key, gameType: null, emoji: m.emoji, label: t(`mode_${m.key}` as never) || m.label })),
    { key: 'mundial', mode: 'mundial', gameType: null, emoji: '⚽', label: t('wc_modeName') },
    { key: 'timeattack', mode: 'world', gameType: 'timeattack', emoji: '⚡', label: t('ta_hud') },
  ];
  const board = boards.find(b => b.key === boardKey) ?? boards[0];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setRows(null); setMine(null); setError(false);
      try {
        if (mockEnabled()) {
          const base = board.gameType === 'timeattack' ? 1400 : 9850;
          const fake = MOCK_NAMES.map((n, i) => ({ rank: i + 1, userId: String(i), displayName: n, avatar: i % 3 === 0 ? 'mascot' : ['🌍', '🧭', '🚀', '🎯'][i % 4], bestScore: base - i * (board.gameType === 'timeattack' ? 60 : 150), achievedAt: '' }));
          if (!cancelled) { setRows(fake); setMine({ rank: 24, bestScore: base - 1430, totalPlayers: 118 }); }
          return;
        }
        const diff = difficulty || null;
        const [top, logged] = await Promise.all([fetchLeaderboardTop(board.mode, diff, period, 10, board.gameType), hasSession()]);
        if (cancelled) return;
        setRows(top);
        setMine(logged ? await fetchMyRank(board.mode, diff, period, board.gameType) : 'guest');
      } catch { if (!cancelled) setError(true); }
    })();
    return () => { cancelled = true; };
  }, [board.key, board.mode, board.gameType, difficulty, period]);

  const boardOptions: SelectorOption<string>[] = boards.map(b => ({ key: b.key, emoji: b.emoji, label: b.label, desc: b.gameType === 'timeattack' ? t('rank_caosDesc') : '' }));
  const diffOptions: SelectorOption<string>[] = [
    { key: '', emoji: '🌐', label: t('hist_all'), desc: t('rank_allDiffsDesc') },
    ...DIFFS.map(d => ({ key: d, emoji: DIFF_EMOJI[d], label: board.mode === 'mundial' ? t(`wc_diff_${d}` as never) : t(`diff_${d}` as never), desc: '' })),
  ];
  const diffLabel = difficulty ? (board.mode === 'mundial' ? t(`wc_diff_${difficulty}` as never) : t(`diff_${difficulty}` as never)) : t('hist_all');
  const myName = displayName || t('ch_you');

  return (
    <div className="min-h-[100dvh] flex flex-col items-center game-bg overflow-y-auto px-3 py-4 sm:px-4 sm:py-6 md:px-6">
      <div className="w-full max-w-5xl animate-fade-in-up pb-6" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 8px)' }}>
        <ScreenHeader onBack={onBack} title={t('rank_title')} subtitle={t('rank_subtitle')} />

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <FilterButton icon={board.emoji} label={t('ch_region')} value={board.label} onClick={() => { playButtonTap(); setSheet('board'); }} />
          <FilterButton icon="🧭" label={t('ch_difficulty')} value={diffLabel} onClick={() => { playButtonTap(); setSheet('difficulty'); }} />
          <div className="ml-auto flex gap-1 rounded-2xl border border-border bg-card/60 p-1" role="tablist">
            {([['all', t('home_rankingAllTime')], ['month', t('home_rankingMonth')], ['week', t('home_rankingWeek')]] as [RankPeriod, string][]).map(([k, l]) => (
              <button key={k} role="tab" aria-selected={period === k} onClick={() => { playButtonTap(); setPeriod(k); }} className={`rounded-xl px-2.5 py-1 text-[11px] sm:text-xs font-bold ${period === k ? 'bg-accent/15 text-accent' : 'text-muted-foreground hover:text-foreground'}`}>{l}</button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[1.4fr_1fr] md:items-start">
          {/* Top 10 */}
          <section className="rounded-3xl border border-accent/40 bg-card/70 p-4 sm:p-5">
            <h2 className="text-xl sm:text-2xl font-black mb-2">{t('rank_top10')}</h2>
            <div className="grid grid-cols-[3rem_1fr_6rem] px-2 pb-1 text-[11px] font-bold text-accent border-b border-border/60">
              <span>{t('rank_position')}</span><span>{t('rank_player')}</span><span className="text-right">{t('game_points')}</span>
            </div>
            {error ? (
              <p className="py-8 text-center text-sm text-muted-foreground">{t('mc_loadError')}</p>
            ) : rows === null ? (
              <div className="flex justify-center py-10"><Mascot state="idle" className="w-16 animate-mascot-float" /></div>
            ) : rows.length === 0 ? (
              <div className="py-8 text-center">
                <Mascot state="wink" className="w-20 mx-auto" />
                <p className="mt-2 font-bold">{t('rank_emptyTitle')}</p>
                <p className="text-sm text-muted-foreground">{t('rank_emptyDesc')}</p>
              </div>
            ) : (
              <ul className="mt-1 flex flex-col gap-1.5">
                {rows.map(r => (
                  <li key={r.userId} className={`grid grid-cols-[3rem_1fr_6rem] items-center rounded-2xl border px-2 py-1.5 ${r.rank === 1 ? 'border-primary bg-primary/10' : r.rank === 2 ? 'border-border bg-muted/30' : r.rank === 3 ? 'border-accent/60 bg-accent/5' : 'border-border/60 bg-card/60'}`}>
                    <span className="font-black text-center">{MEDAL[r.rank - 1] ?? <span className="inline-flex w-7 h-7 items-center justify-center rounded-full border border-accent/60 text-xs">{r.rank}</span>}</span>
                    <span className="flex items-center gap-2 min-w-0"><Avatar avatar={r.avatar} /><span className="font-bold truncate">{r.displayName}</span></span>
                    <span className="text-right font-mono font-black text-primary">{r.bestScore.toLocaleString()} <span className="text-xs text-foreground font-bold">pts</span></span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Tu posición */}
          <section className="rounded-3xl border-2 border-primary/60 bg-card/70 p-4 sm:p-5 text-center">
            <Mascot state={mine && mine !== 'guest' && mine.rank && mine.rank <= 3 ? 'celebrate' : 'wink'} className="w-24 sm:w-28 mx-auto short:w-16" />
            <h2 className="text-xl sm:text-2xl font-black mt-1">{t('rank_yourLead')} <span className="text-primary">{t('rank_yourTail')}</span></h2>
            {mine === 'guest' ? (
              <>
                <p className="mt-2 text-sm text-muted-foreground">{t('rank_guest')}</p>
                <button onClick={() => { playButtonTap(); onSignIn(); }} className="btn3d mt-3 w-full rounded-2xl py-3 font-black text-primary-foreground" style={{ background: 'var(--grad-cta)' }}>{t('friends_signIn')}</button>
              </>
            ) : mine === null ? (
              <p className="mt-3 text-sm text-muted-foreground">…</p>
            ) : mine.rank == null ? (
              <p className="mt-2 text-sm text-muted-foreground">{t('rank_noGamesHere')}</p>
            ) : (
              <div className="mt-2 rounded-2xl border border-primary bg-primary/10 p-3">
                <div className="flex items-center justify-center gap-3">
                  <span className="font-black font-mono text-3xl sm:text-4xl text-primary">#{mine.rank}</span>
                  <Avatar avatar="mascot" size="lg" />
                  <span className="font-bold text-left leading-tight truncate">{myName}{displayName && <span className="text-primary"> · {t('ch_you')}</span>}</span>
                </div>
                <p className="mt-1 font-black font-mono text-2xl sm:text-3xl text-primary">{(mine.bestScore ?? 0).toLocaleString()} <span className="text-sm text-foreground font-bold">pts</span></p>
                <p className="text-[11px] sm:text-xs text-muted-foreground">{t('rank_ofPlayers', { n: mine.totalPlayers })}</p>
              </div>
            )}
            <p className="mt-3 text-[11px] text-muted-foreground">ⓘ {t('rank_criteria')}</p>
          </section>
        </div>

        <div className="mt-5 flex justify-end border-t border-border/60 pt-4">
          <button onClick={() => { playButtonTap(); onBack(); }} className="rounded-2xl border border-border bg-muted/20 px-4 py-2 font-bold text-sm hover:bg-muted">🏠 {t('ob_backHome')}</button>
        </div>
      </div>

      {sheet === 'board' && (
        <SelectorSheet<string> title={t('rank_pickBoard')} subtitle={t('rank_pickBoardSub')} options={boardOptions} selected={board.key} confirmLabel={t('hist_apply')}
          onConfirm={(k) => { setBoardKey(k); setSheet(null); }} onClose={() => setSheet(null)} closeLabel={t('close')} />
      )}
      {sheet === 'difficulty' && (
        <SelectorSheet<string> title={t('hist_pickDiff')} subtitle={t('rank_pickDiffSub')} options={diffOptions} selected={difficulty} confirmLabel={t('hist_apply')}
          onConfirm={(k) => { setDifficulty(k as Difficulty | ''); setSheet(null); }} onClose={() => setSheet(null)} closeLabel={t('close')} />
      )}
    </div>
  );
}

function FilterButton({ icon, label, value, onClick }: { icon: string; label: string; value: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2 rounded-2xl border border-accent/50 bg-card/60 px-3 py-2 text-sm hover:border-accent">
      <span aria-hidden>{icon}</span>
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-black text-primary">{value}</span>
      <span className="text-accent" aria-hidden>⌄</span>
    </button>
  );
}

function Avatar({ avatar, size = 'sm' }: { avatar: string; size?: 'sm' | 'lg' }) {
  const cls = size === 'lg' ? 'w-12 h-12' : 'w-8 h-8';
  return (
    <span className={`${cls} shrink-0 rounded-full border-2 border-accent/60 bg-muted/30 flex items-center justify-center overflow-hidden`} aria-hidden>
      {!avatar || avatar === 'mascot' ? <Mascot state="wink" className="w-[78%]" /> : <span className={size === 'lg' ? 'text-2xl' : 'text-base'}>{avatar}</span>}
    </span>
  );
}
