import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '@/i18n';
import { playButtonTap } from '@/lib/sounds';
import { formatNumber } from '@/lib/format';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { GhostFace } from './GhostRace';
import {
  fetchSprintStatus, getCachedSprintStatus, fetchSprintBoard, markSprintInboxSeen, setMyCountry, countryOptions, isoName,
  divisionByKey, divisionProgress, SPRINT_STATUS_EVENT, DIVISIONS, type SprintStatus, type SprintBoard, type SprintScope,
} from '@/lib/sprint';

interface SprintScreenProps {
  onBack: () => void;
  /** Buscar rival (o revancha desde la bandeja) */
  onFind: (rematchOf?: string) => void;
  onOpenStore: () => void;
  onCreateAccount: () => void;
  onPlay: () => void;
}

export const IsoFlag = ({ iso, className = 'w-5' }: { iso: string | null | undefined; className?: string }) =>
  iso ? <img src={`/flags/${iso}.svg`} alt="" className={`${className} inline-block rounded-[2px] shadow-sm`} /> : null;

/**
 * Sprint (Fase 5, §1): división y PS con su barra, temporada, carreras del día, buscar rival, bandeja de carreras
 * que otros jugaron contra ti (con revancha), ranking Global / país / amigos e insignias de temporada.
 */
export default function SprintScreen({ onBack, onFind, onOpenStore, onCreateAccount, onPlay }: SprintScreenProps) {
  const { t, locale } = useI18n();
  const [st, setSt] = useState<SprintStatus | null>(getCachedSprintStatus);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<SprintScope>('global');
  const [board, setBoard] = useState<SprintBoard | null>(null);
  const [pickCountry, setPickCountry] = useState(false);
  const dateLocale = locale === 'en' ? 'en-US' : 'es-CO';

  useEffect(() => {
    const on = (e: Event) => setSt((e as CustomEvent<SprintStatus>).detail);
    window.addEventListener(SPRINT_STATUS_EVENT, on);
    fetchSprintStatus().then((s) => {
      setLoading(false);
      // La bandeja se muestra esta vez y queda vista
      if (s?.inbox?.length) void markSprintInboxSeen(s.inbox.map((i) => i.match_id));
    });
    return () => window.removeEventListener(SPRINT_STATUS_EVENT, on);
  }, []);
  useEffect(() => {
    if (!st?.unlocked) return;
    let alive = true;
    setBoard(null);
    fetchSprintBoard(scope).then((b) => { if (alive) setBoard(b); });
    return () => { alive = false; };
  }, [scope, st?.unlocked, st?.country]);

  const fmtDay = (d?: string | null) => (d ? new Date(`${d}T12:00:00Z`).toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', timeZone: 'UTC' }) : '');
  const options = useMemo(() => countryOptions(locale), [locale]);

  if (!st && loading) {
    return <div className="min-h-[100dvh] flex items-center justify-center game-bg"><p className="animate-pulse text-muted-foreground">{t('loading')}</p></div>;
  }

  const shell = (children: React.ReactNode) => (
    <div className="min-h-[100dvh] flex flex-col items-center game-bg overflow-y-auto px-3 py-4 sm:px-4 sm:py-6 md:px-6">
      <div className="w-full max-w-4xl animate-fade-in-up pb-6" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 8px)' }}>
        <ScreenHeader onBack={onBack} title={t('sprint_title')} subtitle={t('sprint_subtitle')} />
        {children}
      </div>
    </div>
  );

  // ── Bloqueado: sin cuenta o con menos de 5 partidas ──
  if (!st || !st.unlocked) {
    const needAccount = !st?.registered;
    const left = Math.max(0, (st?.games_needed ?? 5) - (st?.games_played ?? 0));
    return shell(
      <section className="rounded-3xl border-2 border-primary/50 bg-card/75 p-5 text-center">
        <p className="text-5xl" aria-hidden>⚡🔒</p>
        <h2 className="mt-2 text-xl sm:text-2xl font-extrabold">{needAccount ? t('sprint_lockedAccount') : t('sprint_lockedGames', { n: left })}</h2>
        <p className="mt-1 text-foreground/80">{needAccount ? t('sprint_lockedAccountDesc') : t('sprint_lockedGamesDesc')}</p>
        {!needAccount && (
          <div className="mt-3 mx-auto max-w-xs h-2.5 rounded-full bg-foreground/10 overflow-hidden"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, ((st?.games_played ?? 0) / (st?.games_needed ?? 5)) * 100)}%` }} /></div>
        )}
        <button onClick={() => { playButtonTap(); needAccount ? onCreateAccount() : onPlay(); }} className="btn3d mt-4 w-full max-w-sm mx-auto block rounded-2xl py-3 font-black text-lg text-primary-foreground" style={{ background: 'var(--grad-cta)' }}>
          {needAccount ? t('sprint_createAccount') : t('sprint_playNormal')}
        </button>
        <p className="mt-4 text-sm text-muted-foreground">{t('sprint_pitch')}</p>
      </section>,
    );
  }

  const div = divisionByKey(st.division);
  const prog = divisionProgress(st.points);
  const limit = st.day_limit;
  const used = st.day_used ?? 0;
  const left = limit == null ? null : Math.max(0, limit - used);
  const canRace = !!st.pending_match || left == null || left > 0;
  const days = Math.max(0, Math.round((Date.parse(`${st.season.ends_on}T23:59:59Z`) - Date.now()) / 86_400_000));

  return shell(
    <>
      {/* Temporada */}
      <p className="mb-3 text-center text-sm font-semibold text-accent">
        {st.season.preseason
          ? t('sprint_preseason', { next: st.season.next_name ?? '', date: fmtDay(st.season.next_starts_on) })
          : t('sprint_seasonLine', { name: st.season.name, date: fmtDay(st.season.ends_on), n: days })}
      </p>

      <div className="md:grid md:grid-cols-2 md:gap-4">
        {/* División y PS */}
        <section className="rounded-3xl border-2 border-primary/60 bg-card/80 p-4 sm:p-5 shadow-[0_0_24px_hsl(var(--primary)/0.15)]">
          <div className="flex items-center gap-4">
            <span className="text-6xl leading-none" aria-hidden>{div.emoji}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground">{t('sprint_division')}</p>
              <p className="text-2xl sm:text-3xl font-black leading-tight">{t(`sprint_div_${div.key}` as never)}</p>
              <p className="text-3xl font-black text-primary leading-none mt-1">{formatNumber(st.points)} <span className="text-base font-bold text-foreground/70">PS</span></p>
            </div>
          </div>
          <div className="mt-3 h-3 rounded-full bg-foreground/10 overflow-hidden"><div className="h-full rounded-full bg-accent transition-[width] duration-700" style={{ width: `${Math.round(prog.pct * 100)}%` }} /></div>
          <p className="mt-1.5 text-sm text-foreground/80">
            {prog.next ? t('sprint_toNext', { n: formatNumber(prog.missing ?? 0), div: t(`sprint_div_${prog.next.key}` as never) }) : t('sprint_top')}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{t('sprint_record', { w: st.wins ?? 0, l: st.losses ?? 0, d: st.draws ?? 0 })}</p>
        </section>

        {/* Carreras del día */}
        <section className="mt-3 md:mt-0 rounded-3xl border-2 border-accent/50 bg-card/75 p-4 sm:p-5 flex flex-col justify-center gap-3">
          <p className="text-center font-bold text-lg">
            {left == null ? `∞ ${t('sprint_unlimited')}` : `⚡ ${t('sprint_racesLeft', { n: left, total: limit ?? 5 })}`}
          </p>
          {canRace ? (
            <button onClick={() => { playButtonTap(); onFind(); }} className="btn3d w-full rounded-2xl py-4 font-black text-xl text-primary-foreground" style={{ background: 'var(--grad-cta)' }}>
              ⚡ {st.pending_match ? t('sprint_continue') : t('sprint_find')}
            </button>
          ) : (
            <>
              <p className="text-center text-sm text-foreground/85">{t('sprint_outOfRaces')}</p>
              <button onClick={() => { playButtonTap(); onOpenStore(); }} className="btn3d w-full rounded-2xl py-3.5 font-black text-lg text-primary-foreground" style={{ background: 'var(--grad-cta)' }}>👑 {t('sprint_goPro')}</button>
            </>
          )}
          <p className="text-xs text-center text-muted-foreground">{t('sprint_pitch')}</p>
        </section>
      </div>

      {/* Bandeja: carreras que otros jugaron contra ti */}
      {!!st.inbox?.length && (
        <section className="mt-3 rounded-3xl border-2 border-accent/40 bg-card/70 p-4">
          <h2 className="font-extrabold text-lg mb-2">{t('sprint_inboxTitle')}</h2>
          <ul className="flex flex-col gap-2">
            {st.inbox.map((i) => (
              <li key={i.match_id} className="flex items-center gap-3 rounded-2xl border border-foreground/10 bg-background/40 px-3 py-2">
                <GhostFace avatar={i.avatar} className="w-9 h-9 text-lg" />
                <span className="flex-1 min-w-0">
                  <span className="block font-bold truncate">{i.outcome === 'loss' ? t('sprint_inboxLost', { name: i.name }) : i.outcome === 'win' ? t('sprint_inboxWon', { name: i.name }) : t('sprint_inboxDraw', { name: i.name })}</span>
                  <span className={`text-sm font-extrabold ${i.delta >= 0 ? 'text-accent' : 'text-destructive'}`}>{i.delta >= 0 ? '+' : '−'}{Math.abs(i.delta)} PS</span>
                </span>
                {i.outcome !== 'win' && canRace && (
                  <button onClick={() => { playButtonTap(); onFind(i.match_id); }} className="shrink-0 rounded-full border-2 border-primary px-3 py-1 text-sm font-black text-primary hover:bg-primary/10">{t('sprint_rematch')}</button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Ranking */}
      <section className="mt-3 rounded-3xl border-2 border-accent/30 bg-card/60 p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <h2 className="font-extrabold text-lg">{t('sprint_ranking')}</h2>
          <span className="text-xs text-muted-foreground">{board?.season ?? st.season.name}</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5 mb-3" role="tablist">
          {(['global', 'country', 'friends'] as SprintScope[]).map((sc) => (
            <button key={sc} role="tab" aria-selected={scope === sc} onClick={() => { playButtonTap(); setScope(sc); }}
              className={`rounded-xl border-2 py-2 text-sm font-bold flex items-center justify-center gap-1.5 ${scope === sc ? 'border-primary bg-primary/15' : 'border-foreground/15 text-foreground/75'}`}>
              {sc === 'country' && <IsoFlag iso={st.country} className="w-4" />}
              <span className="truncate">{sc === 'global' ? t('sprint_tabGlobal') : sc === 'country' ? (st.country ? isoName(st.country, locale) : t('sprint_tabCountry')) : t('sprint_tabFriends')}</span>
            </button>
          ))}
        </div>
        {scope === 'country' && (
          <div className="mb-2 flex items-center justify-between gap-2 text-sm">
            <span className="text-muted-foreground">{st.country ? t('sprint_countryIs', { name: isoName(st.country, locale) }) : t('sprint_countryMissing')}</span>
            <button onClick={() => setPickCountry((v) => !v)} className="font-bold text-accent hover:underline">{t('sprint_changeCountry')}</button>
          </div>
        )}
        {pickCountry && (
          <select
            className="mb-3 w-full rounded-xl border-2 border-accent/50 bg-background px-3 py-2 font-semibold"
            value={st.country ?? ''}
            onChange={async (e) => { const iso = e.target.value || null; setPickCountry(false); await setMyCountry(iso); fetchSprintStatus(); }}
            aria-label={t('sprint_changeCountry')}
          >
            <option value="">—</option>
            {options.map((o) => <option key={o.iso} value={o.iso}>{o.name}</option>)}
          </select>
        )}
        {!board ? (
          <p className="py-6 text-center text-muted-foreground animate-pulse">{t('loading')}</p>
        ) : board.top.length === 0 ? (
          <p className="py-6 text-center text-muted-foreground">{scope === 'friends' ? t('sprint_noFriends') : t('sprint_noRanking')}</p>
        ) : (
          <ol className="flex flex-col gap-1.5">
            {board.top.map((r) => (
              <li key={`${r.rank}-${r.user_id}`} className={`flex items-center gap-2.5 rounded-xl px-3 py-2 ${r.is_me ? 'border-2 border-primary bg-primary/10' : 'border border-foreground/10 bg-background/40'}`}>
                <span className={`w-7 text-center font-black ${r.rank <= 3 ? 'text-primary' : 'text-foreground/70'}`}>{r.rank}</span>
                <IsoFlag iso={r.country} />
                <span className="flex-1 min-w-0 truncate font-bold">{r.name}{r.is_me && <span className="text-primary"> · {t('ch_you')}</span>}</span>
                <span aria-hidden>{divisionByKey(r.division).emoji}</span>
                <span className="font-black tabular-nums">{formatNumber(r.points)}</span>
              </li>
            ))}
          </ol>
        )}
        {board?.me && !board.top.some((r) => r.is_me) && (
          <p className="mt-2 text-sm text-center font-bold text-primary">{t('sprint_myRank', { rank: board.me.rank, total: board.me.total })}</p>
        )}
      </section>

      {/* Insignias de temporada */}
      {!!st.awards?.length && (
        <section className="mt-3 rounded-3xl border-2 border-primary/40 bg-card/60 p-4">
          <h2 className="font-extrabold text-lg mb-2">{t('sprint_awards')}</h2>
          <div className="flex flex-wrap gap-2">
            {st.awards.map((a) => (
              <span key={a.season} className="inline-flex items-center gap-2 rounded-2xl border-2 border-primary/50 bg-background/40 px-3 py-1.5 text-sm font-bold">
                <span aria-hidden>{divisionByKey(a.division).emoji}</span>{a.season} · {t(`sprint_div_${a.division}` as never)}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Cómo funciona */}
      <section className="mt-3 rounded-3xl border border-foreground/10 bg-card/40 p-4 text-sm text-foreground/80">
        <h2 className="font-extrabold text-base text-foreground mb-1">{t('sprint_howTitle')}</h2>
        <p>{t('sprint_how')}</p>
        <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
          {DIVISIONS.map((d) => <span key={d.key}>{d.emoji} {t(`sprint_div_${d.key}` as never)} {d.min ? `${formatNumber(d.min)}+` : `< ${formatNumber(1100)}`}</span>)}
        </p>
      </section>
    </>,
  );
}
