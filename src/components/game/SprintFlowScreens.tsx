import { useEffect, useRef, useState } from 'react';
import { useI18n } from '@/i18n';
import { playButtonTap, playVictory } from '@/lib/sounds';
import { fireCelebration } from '@/lib/confetti';
import { formatNumber } from '@/lib/format';
import CountUp from '@/components/ui/CountUp';
import Mascot from './Mascot';
import { GhostFace } from './GhostRace';
import { IsoFlag } from './SprintScreen';
import {
  findSprintMatch, divisionByKey, divisionProgress, isoName, SprintError, type SprintMatch, type SprintResult,
} from '@/lib/sprint';

/**
 * Sprint (Fase 5): la búsqueda de rival (2–3 s, luego su nombre, bandera, división y PS) y el resultado de la
 * carrera con los PS animados y el ascenso celebrado ("¡Subiste a País en Sprint!").
 */

export function SprintSearchScreen({ rematchOf, onFound, onCancel, onOpenStore }: {
  rematchOf?: string; onFound: (m: SprintMatch) => void; onCancel: () => void; onOpenStore: () => void;
}) {
  const { t, locale } = useI18n();
  const [match, setMatch] = useState<SprintMatch | null>(null);
  const [error, setError] = useState<SprintError['code'] | null>(null);
  const [attempt, setAttempt] = useState(0);
  const done = useRef(false);

  useEffect(() => {
    let alive = true;
    setError(null);
    const minWait = new Promise((r) => setTimeout(r, 2200));
    Promise.all([findSprintMatch(rematchOf), minWait])
      .then(([m]) => { if (alive) setMatch(m); })
      .catch((e) => { if (alive) setError(e instanceof SprintError ? e.code : 'network'); });
    return () => { alive = false; };
  }, [rematchOf, attempt]);
  // Rival encontrado: se muestra un momento y arranca la carrera
  useEffect(() => {
    if (!match || done.current) return;
    const id = setTimeout(() => { done.current = true; onFound(match); }, 1900);
    return () => clearTimeout(id);
  }, [match, onFound]);

  const errText = error === 'limit' ? t('sprint_outOfRaces') : error === 'no_opponent' ? t('sprint_noOpponent')
    : error === 'locked' ? t('sprint_lockedGamesDesc') : error === 'rematch_unavailable' ? t('sprint_rematchGone') : t('sprint_networkError');

  return (
    <div className="min-h-[100dvh] flex items-center justify-center game-bg px-4 py-6 short:py-3">
      <div className="w-full max-w-md text-center animate-fade-in-up">
        {!match && !error && (
          <>
            <div className="relative mx-auto w-40 h-40 short:w-28 short:h-28" aria-hidden>
              <span className="absolute inset-0 rounded-full border-4 border-accent/40 animate-ping" />
              <span className="absolute inset-4 rounded-full border-4 border-accent/60 animate-pulse" />
              <span className="absolute inset-0 flex items-center justify-center text-6xl short:text-4xl">⚡</span>
            </div>
            <h1 className="mt-5 short:mt-3 text-2xl font-extrabold">{rematchOf ? t('sprint_searchingRematch') : t('sprint_searching')}</h1>
            <p className="mt-1 text-foreground/75">{t('sprint_searchingSub')}</p>
            <button onClick={() => { playButtonTap(); onCancel(); }} className="mt-6 text-sm font-semibold text-muted-foreground hover:text-foreground">{t('cancel')}</button>
          </>
        )}
        {match && (
          <div className="animate-score-pop">
            <p className="text-sm font-bold uppercase tracking-widest text-accent">{t('sprint_found')}</p>
            <div className="mt-3 rounded-3xl border-2 border-accent bg-card/85 p-5 shadow-[0_0_30px_hsl(var(--accent)/0.35)]">
              <GhostFace avatar={match.opponent.avatar} className="w-20 h-20 text-4xl mx-auto" />
              <p className="mt-2 text-2xl font-black">{match.opponent.name}</p>
              <p className="mt-1 flex items-center justify-center gap-2 text-foreground/85">
                <IsoFlag iso={match.opponent.country} className="w-6" />{match.opponent.country ? isoName(match.opponent.country, locale) : ''}
              </p>
              <p className="mt-2 font-bold">{divisionByKey(match.opponent.division).emoji} {t(`sprint_div_${match.opponent.division}` as never)} · {formatNumber(match.opponent.points)} PS</p>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{t('sprint_rules')}</p>
          </div>
        )}
        {error && (
          <>
            <Mascot state={error === 'limit' ? 'sleepy' : 'confused'} className="w-24 mx-auto" />
            <p className="mt-3 text-lg font-bold">{errText}</p>
            {error === 'limit' ? (
              <button onClick={() => { playButtonTap(); onOpenStore(); }} className="btn3d mt-4 w-full rounded-2xl py-3 font-black text-primary-foreground" style={{ background: 'var(--grad-cta)' }}>👑 {t('sprint_goPro')}</button>
            ) : error !== 'locked' && error !== 'rematch_unavailable' && (
              <button onClick={() => { playButtonTap(); setAttempt((a) => a + 1); }} className="btn3d mt-4 w-full rounded-2xl py-3 font-black text-primary-foreground" style={{ background: 'var(--grad-cta)' }}>{t('retry')}</button>
            )}
            <button onClick={() => { playButtonTap(); onCancel(); }} className="mt-2 w-full rounded-2xl py-2.5 font-semibold text-muted-foreground hover:text-foreground">{t('back')}</button>
          </>
        )}
      </div>
    </div>
  );
}

export function SprintResultScreen({ result, canRaceAgain, onAgain, onSprintHome, onHome, onOpenStore }: {
  result: SprintResult; canRaceAgain: boolean; onAgain: () => void; onSprintHome: () => void; onHome: () => void; onOpenStore: () => void;
}) {
  const { t } = useI18n();
  const r = result;
  const [shown, setShown] = useState(r.points_before);
  const promoted = r.division_after !== r.division_before && (r.points_after > r.points_before);
  const demoted = r.division_after !== r.division_before && (r.points_after < r.points_before);
  const after = divisionByKey(r.division_after);
  const prog = divisionProgress(shown);

  useEffect(() => {
    const id = setTimeout(() => setShown(r.points_after), 600);
    if (r.outcome === 'win' || promoted) {
      setTimeout(() => { playVictory(); fireCelebration(); }, promoted ? 900 : 500);
    }
    return () => clearTimeout(id);
  }, [r, promoted]);

  const title = r.outcome === 'win' ? t('sprint_resWin') : r.outcome === 'loss' ? t('sprint_resLoss') : r.outcome === 'draw' ? t('sprint_resDraw') : t('sprint_resVoid');
  const mascot = r.outcome === 'win' ? 'cheer' : r.outcome === 'loss' ? 'down' : 'surprised';

  return (
    <div className="min-h-[100dvh] flex items-center justify-center game-bg px-4 py-6 short:py-3">
      <div className="w-full max-w-lg text-center animate-fade-in-up">
        <Mascot state={promoted ? 'cheer' : mascot} className="w-24 short:w-16 mx-auto" />
        {promoted && (
          <p className="mt-2 inline-block rounded-full bg-primary px-4 py-1 font-black text-primary-foreground animate-score-pop">{after.emoji} {t('sprint_promoted', { div: t(`sprint_div_${after.key}` as never) })}</p>
        )}
        <h1 className={`mt-2 text-3xl font-extrabold ${r.outcome === 'win' ? 'text-accent' : r.outcome === 'loss' ? 'text-foreground' : 'text-primary'}`}>{title}</h1>
        {r.outcome === 'void' && <p className="mt-1 text-sm text-foreground/80">{t('sprint_resVoidDesc')}</p>}

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className={`rounded-2xl border-2 bg-card/75 px-3 py-3 ${r.outcome === 'win' ? 'border-accent' : 'border-foreground/15'}`}>
            <p className="text-xs font-bold uppercase text-muted-foreground">{t('ch_you')}</p>
            <p className="text-2xl font-black text-primary">{formatNumber(r.my_score)}</p>
          </div>
          <div className={`rounded-2xl border-2 bg-card/75 px-3 py-3 ${r.outcome === 'loss' ? 'border-accent' : 'border-foreground/15'}`}>
            <p className="text-xs font-bold uppercase text-muted-foreground truncate flex items-center justify-center gap-1"><IsoFlag iso={r.opponent.country} className="w-4" />{r.opponent.name}</p>
            <p className="text-2xl font-black">{formatNumber(r.opp_score)}</p>
          </div>
        </div>

        {r.outcome !== 'void' && (
          <div className="mt-3 rounded-2xl border-2 border-primary/40 bg-card/75 px-4 py-3 text-left">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-bold">{after.emoji} {t(`sprint_div_${after.key}` as never)}</span>
              <span className="text-xl font-black"><CountUp value={shown} durationMs={1100} /> <span className="text-sm text-foreground/70">PS</span>
                <span className={`ml-2 rounded-full border-2 px-2 py-0.5 text-sm font-black ${r.delta >= 0 ? 'border-accent/70 text-accent' : 'border-destructive/70 text-destructive'}`}>{r.delta >= 0 ? '+' : '−'}{Math.abs(r.delta)}</span>
              </span>
            </div>
            <div className="mt-2 h-3 rounded-full bg-foreground/10 overflow-hidden"><div className="h-full rounded-full bg-accent transition-[width] duration-1000" style={{ width: `${Math.round(prog.pct * 100)}%` }} /></div>
            {demoted && <p className="mt-1 text-sm text-foreground/80">{t('sprint_demoted', { div: t(`sprint_div_${after.key}` as never) })}</p>}
          </div>
        )}

        {canRaceAgain ? (
          <button onClick={() => { playButtonTap(); onAgain(); }} className="btn3d mt-4 w-full rounded-2xl py-3.5 font-black text-lg text-primary-foreground" style={{ background: 'var(--grad-cta)' }}>⚡ {t('sprint_again')}</button>
        ) : (
          <>
            <p className="mt-4 text-sm text-foreground/85">{t('sprint_outOfRaces')}</p>
            <button onClick={() => { playButtonTap(); onOpenStore(); }} className="btn3d mt-2 w-full rounded-2xl py-3.5 font-black text-lg text-primary-foreground" style={{ background: 'var(--grad-cta)' }}>👑 {t('sprint_goPro')}</button>
          </>
        )}
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button onClick={() => { playButtonTap(); onSprintHome(); }} className="rounded-2xl border-2 border-foreground/25 py-2.5 font-bold hover:bg-muted/40">🏆 {t('sprint_seeRanking')}</button>
          <button onClick={() => { playButtonTap(); onHome(); }} className="rounded-2xl border-2 border-foreground/25 py-2.5 font-bold hover:bg-muted/40">{t('ob_backHome')}</button>
        </div>
      </div>
    </div>
  );
}
