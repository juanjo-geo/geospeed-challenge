import { useCallback, useEffect, useState } from 'react';
import { MODE_CONFIG, type Difficulty } from '@/data/cities';
import { fetchLeaderboardTop, fetchMyRank, type LeaderboardTopRow, type RankPeriod } from '@/lib/gameResults';
import { hasSession } from '@/lib/history';
import { playButtonTap } from '@/lib/sounds';
import { useI18n } from '@/i18n';
import { useAuth } from '@/hooks/useAuth';
import ScreenHeader from '@/components/ui/ScreenHeader';
import SelectorSheet, { type SelectorOption } from './SelectorSheet';
import Mascot from './Mascot';
import HeaderBackdrop from './HeaderBackdrop';
import PropExplorer from './PropExplorer';
import FilterButton from './FilterButton';
import { HomeIcon } from '@/components/ui/icons';
import { REGION_ART, DIFF_ART, DIFF_ORDER } from '@/lib/selectionArt';
import { formatNumber } from '@/lib/format';

interface RankingScreenProps {
  initialMode?: string;
  initialDifficulty?: Difficulty;
  onBack: () => void;
  onSignIn: () => void;
}

/** Tabla del ranking: regiones del Clásico, Mundial y 60s de Caos (escala propia, D5/B2) */
type Board = { key: string; mode: string; gameType: string | null; emoji: string; art?: [string, string?]; label: string };
const DIFF_LABEL: Record<Difficulty, string> = { basic: 'home_diffBasic', easy: 'home_diffEasy', medium: 'home_diffMedium', hard: 'home_diffHard' };

function mockEnabled(): boolean {
  try { return import.meta.env.DEV && localStorage.getItem('geospeed_mock_ranking') === '1'; } catch { return false; }
}
const MOCK_NAMES = ['Laura', 'Mateo', 'Sofía', 'Daniel', 'Camila', 'Andrés', 'Valentina', 'Nicolás', 'Juliana', 'Sebastián'];

/**
 * Ranking (maquetas Ranking_Movil/Computador_APROBADA_v1): "Rank" + "ing" en amarillo con el Explorador y su trofeo,
 * filtros Región/Dificultad, Top 10 en filas con medalla (oro/plata/bronce) y avatar, y "Tu posición" (fila en el
 * celular, tarjeta con el Explorador en computador) aunque esté fuera del Top 10. El periodo (histórico/mes/semana)
 * no está en la maqueta y queda como selector compacto junto a "Top 10".
 */
export default function RankingScreen({ initialMode = 'world', initialDifficulty = 'basic', onBack, onSignIn }: RankingScreenProps) {
  const { t } = useI18n();
  const { displayName, avatar } = useAuth();
  const [boardKey, setBoardKey] = useState(initialMode);
  const [difficulty, setDifficulty] = useState<Difficulty | ''>(initialDifficulty);
  const [period, setPeriod] = useState<RankPeriod>('all');
  const [rows, setRows] = useState<LeaderboardTopRow[] | null>(null);
  const [mine, setMine] = useState<{ rank: number | null; bestScore: number | null; totalPlayers: number } | null | 'guest'>(null);
  const [error, setError] = useState(false);
  const [sheet, setSheet] = useState<'board' | 'difficulty' | null>(null);
  const closeSheet = useCallback(() => setSheet(null), []);

  const boards: Board[] = [
    ...MODE_CONFIG.map(m => ({ key: m.key, mode: m.key, gameType: null, emoji: REGION_ART[m.key as keyof typeof REGION_ART]?.emoji ?? m.emoji, art: REGION_ART[m.key as keyof typeof REGION_ART]?.art, label: t(`mode_${m.key}` as never) || m.label })),
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
      } catch {
        if (cancelled) return;
        setError(true);
        // Sin servidor: el invitado igual ve la invitación a iniciar sesión (si no, "Tu posición" quedaba en "…")
        hasSession().then(l => { if (!cancelled && !l) setMine('guest'); }).catch(() => {});
      }
    })();
    return () => { cancelled = true; };
  }, [board.key, board.mode, board.gameType, difficulty, period]);

  const boardOptions: SelectorOption<string>[] = boards.map(b => ({ key: b.key, emoji: b.emoji, art: b.art, label: b.label, desc: b.gameType === 'timeattack' ? t('rank_caosDesc') : '' }));
  const diffName = (d: Difficulty) => board.mode === 'mundial' ? t(`wc_diff_${d}` as never) : t(DIFF_LABEL[d] as never);
  const diffOptions: SelectorOption<string>[] = [
    { key: '', emoji: '🌐', label: t('hist_all'), desc: t('rank_allDiffsDesc') },
    ...DIFF_ORDER.map(d => ({ key: d, emoji: DIFF_ART[d].emoji, art: DIFF_ART[d].art, label: diffName(d), desc: '' })),
  ];
  const diffLabel = difficulty ? diffName(difficulty) : t('hist_all');
  // Como en Perfil: el nombre elegido antes de tener sesión queda pendiente en local
  const pendingName = (() => { try { return localStorage.getItem('geospeed_pending_display_name') || ''; } catch { return ''; } })();
  const knownName = displayName || pendingName;
  const myName = knownName || t('ch_you');
  const rt = t('rank_title');
  const hasRank = mine && mine !== 'guest' && mine.rank != null ? mine : null;

  return (
    <div className="relative min-h-[100dvh] flex flex-col items-center game-bg overflow-y-auto px-3 py-4 sm:px-4 sm:py-6 md:px-6">
      <HeaderBackdrop pins="top" />
      <div className="relative w-full max-w-lg md:max-w-6xl animate-fade-in-up pb-4" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 8px)' }}>
        <ScreenHeader
          onBack={onBack}
          title={rt}
          titleNode={<>{rt.slice(0, -3)}<span className="text-primary">{rt.slice(-3)}</span></>}
          subtitle={t('rank_subtitle')}
          align="left"
          titleClassName="text-[2.7rem] sm:text-6xl short:text-2xl font-black"
          subtitleClassName="text-base sm:text-xl md:text-2xl short:text-xs font-bold !text-accent"
          titleAside={<PropExplorer prop="trophy" className="w-[30vw] max-w-[150px] md:hidden shrink-0 -mt-3 short:hidden" />}
        />

        {/* Filtros */}
        <div className="grid grid-cols-2 md:flex md:justify-end gap-2 sm:gap-3 md:-mt-20 md:mb-6">
          <FilterButton icon="globe" label={t('ch_region')} value={board.label} onClick={() => { playButtonTap(); setSheet('board'); }} />
          <FilterButton icon="compass" label={t('ch_difficulty')} value={diffLabel} onClick={() => { playButtonTap(); setSheet('difficulty'); }} />
        </div>

        <div className="mt-4 md:mt-0 grid gap-4 md:grid-cols-[1.45fr_1fr] md:items-stretch">
          {/* Top 10 */}
          <section className="md:rounded-3xl md:border-2 md:border-accent/50 md:bg-card/70 md:p-5 md:shadow-[0_0_20px_hsl(var(--accent)/0.12)]">
            <div className="flex items-center justify-between gap-2 mb-2">
              <h2 className="text-[1.7rem] sm:text-3xl font-black">{t('rank_top10')}</h2>
              <div className="flex gap-0.5 rounded-xl border border-accent/40 bg-brand-navy-deep/60 p-0.5" role="tablist">
                {([['all', t('home_rankingAllTime')], ['month', t('home_rankingMonth')], ['week', t('home_rankingWeek')]] as [RankPeriod, string][]).map(([k, l]) => (
                  <button key={k} role="tab" aria-selected={period === k} onClick={() => { playButtonTap(); setPeriod(k); }} className={`rounded-lg px-2 py-1 text-[11px] sm:text-xs font-bold ${period === k ? 'bg-accent/20 text-accent' : 'text-foreground/70 hover:text-foreground'}`}>{l}</button>
                ))}
              </div>
            </div>
            <div className={`hidden md:grid ${ROW_COLS} gap-3 px-4 pb-2 text-sm font-semibold text-accent`}>
              <span className="text-center">{t('rank_position')}</span><span /><span>{t('rank_player')}</span><span className="text-right pr-1">{t('game_points')}</span>
            </div>
            {error ? (
              <p className="py-8 text-center text-sm text-foreground/70">{t('mc_loadError')}</p>
            ) : rows === null ? (
              <div className="flex justify-center py-10"><Mascot state="idle" className="w-16 animate-mascot-float" /></div>
            ) : rows.length === 0 ? (
              <div className="rounded-3xl border-2 border-accent/40 bg-card/60 py-8 text-center">
                <PropExplorer prop="trophy" className="w-28 mx-auto" />
                <p className="mt-3 font-extrabold text-lg">{t('rank_emptyTitle')}</p>
                <p className="text-sm text-foreground/75">{t('rank_emptyDesc')}</p>
              </div>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {rows.map(r => (
                  <li key={r.userId} className={`grid ${ROW_COLS} items-center gap-3 rounded-2xl border-2 bg-brand-navy-deep/50 px-3 md:px-4 py-1 ${ROW_BORDER[r.rank] ?? 'border-accent/45'}`}>
                    <RankBadge rank={r.rank} />
                    <Avatar avatar={r.avatar} />
                    <span className="font-bold text-base md:text-lg truncate">{r.displayName}</span>
                    <span className={`text-right font-extrabold text-lg md:text-xl whitespace-nowrap ${r.rank === 1 ? 'text-primary' : ''}`}>{formatNumber(r.bestScore)} <span className="text-sm">pts</span></span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Tu posición: fila compacta en el celular, tarjeta con el Explorador en computador */}
          <section className="md:rounded-3xl md:border-2 md:border-primary/80 md:bg-card/70 md:p-5 md:shadow-[0_0_24px_hsl(var(--primary)/0.2)] md:flex md:flex-col md:items-center md:justify-center md:text-center">
            <PropExplorer prop="trophy" mascot={hasRank && hasRank.rank! <= 3 ? 'celebrate' : 'wink'} className="hidden md:block w-52 lg:w-60 short:hidden" />
            <h2 className="hidden md:block mt-2 text-3xl font-black text-primary">{t('rank_yourLead')} {t('rank_yourTail')}</h2>
            {mine === 'guest' ? (
              <div className="w-full mt-0 md:mt-3 rounded-2xl border-2 border-primary/70 bg-primary/10 p-4 text-center">
                <p className="text-sm sm:text-base">{t('rank_guest')}</p>
                <button onClick={() => { playButtonTap(); onSignIn(); }} className="btn3d mt-3 w-full max-w-xs mx-auto rounded-2xl py-3 font-black text-primary-foreground" style={{ background: 'var(--grad-cta)' }}>{t('friends_signIn')}</button>
              </div>
            ) : mine === null ? (
              <p className="mt-3 text-center text-sm text-foreground/70">{error ? t('mc_loadError') : '…'}</p>
            ) : !hasRank ? (
              <p className="w-full mt-0 md:mt-3 rounded-2xl border-2 border-primary/50 bg-primary/5 p-4 text-center text-sm sm:text-base">{t('rank_noGamesHere')}</p>
            ) : (
              <div className="w-full md:mt-3 rounded-2xl border-2 border-primary bg-primary/10 shadow-[0_0_18px_hsl(var(--primary)/0.25)] px-3 py-2.5 md:p-4">
                <div className="flex items-center gap-3 md:justify-center">
                  <span className="font-black text-[1.9rem] md:text-5xl text-primary">#{hasRank.rank}</span>
                  <Avatar avatar={avatar || 'mascot'} size="lg" />
                  <span className="flex-1 md:flex-none min-w-0 font-extrabold text-lg md:text-xl text-left leading-tight truncate">{myName}{knownName && <span className="text-primary"> · {t('ch_you')}</span>}</span>
                  <span className="md:hidden font-extrabold text-xl text-primary whitespace-nowrap">{formatNumber(hasRank.bestScore ?? 0)} <span className="text-sm">pts</span></span>
                </div>
                <p className="hidden md:block mt-2 font-black text-4xl text-primary">{formatNumber(hasRank.bestScore ?? 0)} <span className="text-2xl">pts</span></p>
                <p className="text-xs sm:text-sm text-foreground/75 text-center mt-1">{t('rank_ofPlayers', { n: hasRank.totalPlayers })}</p>
              </div>
            )}
            <p className="mt-3 flex items-center justify-center gap-2 text-xs sm:text-sm text-foreground/80">
              <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><circle cx="12" cy="12" r="10" /><path d="M12 11v6" /><circle cx="12" cy="7.5" r="0.6" fill="currentColor" /></svg>
              {t('rank_criteria')}
            </p>
          </section>
        </div>

        <button onClick={() => { playButtonTap(); onBack(); }} className="mt-5 mx-auto flex items-center gap-2.5 font-semibold text-foreground/90 hover:text-foreground">
          <HomeIcon className="w-6 h-6" /> {t('ob_backHome')}
        </button>
      </div>

      {sheet === 'board' && (
        <SelectorSheet<string> title={t('rank_pickBoard')} subtitle={t('rank_pickBoardSub')} options={boardOptions} selected={board.key} confirmLabel={t('hist_apply')}
          onConfirm={(k) => { setBoardKey(k); setSheet(null); }} onClose={closeSheet} closeLabel={t('close')} />
      )}
      {sheet === 'difficulty' && (
        <SelectorSheet<string> title={t('hist_pickDiff')} subtitle={t('rank_pickDiffSub')} options={diffOptions} selected={difficulty} confirmLabel={t('hist_apply')}
          onConfirm={(k) => { setDifficulty(k as Difficulty | ''); setSheet(null); }} onClose={closeSheet} closeLabel={t('close')} />
      )}
    </div>
  );
}

const ROW_COLS = 'grid-cols-[2.5rem_2.75rem_minmax(0,1fr)_auto] md:grid-cols-[4.5rem_3rem_minmax(0,1fr)_9rem]';
const SILVER = 'hsl(214 22% 78%)';
const BRONZE = 'hsl(26 72% 52%)';
const ROW_BORDER: Record<number, string> = {
  1: 'border-primary shadow-[0_0_14px_hsl(var(--primary)/0.3)]',
  2: 'border-[hsl(214_22%_78%/0.85)]',
  3: 'border-[hsl(26_72%_52%/0.9)]',
};

/** Medalla 1–3 (oro, plata, bronce) o número en un aro turquesa */
function RankBadge({ rank }: { rank: number }) {
  if (rank <= 3) {
    const bg = rank === 1 ? 'hsl(var(--primary))' : rank === 2 ? SILVER : BRONZE;
    return <span className="w-8 h-8 mx-auto rounded-full flex items-center justify-center font-black text-base text-brand-navy-deep shadow-[inset_0_-3px_0_rgba(0,0,0,0.25),0_2px_6px_rgba(0,0,0,0.4)]" style={{ background: bg }}>{rank}</span>;
  }
  return <span className="w-8 h-8 mx-auto rounded-full border-2 border-accent/70 flex items-center justify-center font-bold">{rank}</span>;
}

function Avatar({ avatar, size = 'sm' }: { avatar: string; size?: 'sm' | 'lg' }) {
  const cls = size === 'lg' ? 'w-14 h-14 md:w-16 md:h-16 border-primary' : 'w-10 h-10 border-accent/70';
  return (
    <span className={`${cls} shrink-0 rounded-full border-2 bg-[radial-gradient(circle_at_50%_40%,hsl(var(--brand-navy-card)),hsl(var(--brand-navy-deep)))] flex items-center justify-center overflow-hidden`} aria-hidden>
      {!avatar || avatar === 'mascot' ? <Mascot state="wink" className="w-[80%]" /> : <span className={size === 'lg' ? 'text-3xl' : 'text-xl'}>{avatar}</span>}
    </span>
  );
}
