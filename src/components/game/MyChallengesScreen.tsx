import { useCallback, useEffect, useState } from 'react';
import { fetchMyChallenges, ChallengeError, type MyChallenge, type ChallengeState } from '@/lib/challenges';
import { playButtonTap } from '@/lib/sounds';
import { useI18n } from '@/i18n';
import ScreenHeader from '@/components/ui/ScreenHeader';
import Mascot from './Mascot';
import HeaderBackdrop from './HeaderBackdrop';
import PropExplorer from './PropExplorer';
import { appNumberLocale } from '@/lib/format';
import { ArrowRightIcon, HomeIcon } from '@/components/ui/icons';

interface MyChallengesScreenProps {
  onBack: () => void;
  onOpen: (ch: MyChallenge) => void;
  onCreate: () => void;
  onSignIn: () => void;
}

type Filter = 'all' | 'pending' | 'done';
const PENDING: ChallengeState[] = ['to_accept', 'to_play', 'waiting'];

/**
 * Bandeja "Mis retos" (maquetas Mis_Retos y Mis_Retos_Vacio): filtros con contadores, una tarjeta por reto.
 * Sin ningún reto se usa la maqueta del vacío: subtítulo propio, filtros con ícono y tarjeta grande con los dos
 * exploradores y CREAR RETO.
 */
export default function MyChallengesScreen({ onBack, onOpen, onCreate, onSignIn }: MyChallengesScreenProps) {
  const { t } = useI18n();
  const [items, setItems] = useState<MyChallenge[] | null>(null);
  const [error, setError] = useState<'auth_required' | 'network' | null>(null);
  const [filter, setFilter] = useState<Filter>('all');

  const load = useCallback(async () => {
    try {
      setError(null);
      setItems(await fetchMyChallenges());
    } catch (e) {
      // Un fallo de carga NO es "cero retos" (criterio 7 del consolidado)
      setError(e instanceof ChallengeError && e.code === 'auth_required' ? 'auth_required' : 'network');
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const pending = items?.filter(i => PENDING.includes(i.state)) ?? [];
  const done = items?.filter(i => i.state === 'ready') ?? [];
  const shown = filter === 'all' ? items ?? [] : filter === 'pending' ? pending : done;
  const noChallenges = items !== null && items.length === 0 && !error;

  const filters: { key: Filter; label: string; icon: React.ReactNode; count: number }[] = [
    { key: 'all', label: t('mc_all'), icon: <GlobeGlyph />, count: items?.length ?? 0 },
    { key: 'pending', label: t('mc_pending'), icon: <ClockGlyph />, count: pending.length },
    { key: 'done', label: t('mc_done'), icon: <TrophyGlyph />, count: done.length },
  ];

  return (
    <div className="relative min-h-[100dvh] flex flex-col items-center game-bg overflow-y-auto px-3 py-4 sm:px-4 sm:py-6 md:px-6">
      <HeaderBackdrop pins="top" />
      <div className="relative w-full max-w-5xl animate-fade-in-up pb-6" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 8px)' }}>
        <ScreenHeader
          onBack={onBack}
          title={t('mc_title')}
          subtitle={noChallenges ? t('mc_subtitleEmpty') : t('mc_subtitle')}
          align="left"
          titleAside={noChallenges
            ? <Mascot state="wink" className="w-24 sm:w-32 shrink-0 mt-2 short:hidden" />
            : <PropExplorer prop="clipboard" mascot="celebrate" className="w-24 sm:w-32 shrink-0 mt-2 short:hidden" />}
        />

        {/* Filtros con contadores (misma lista que las tarjetas) */}
        <div className="grid grid-cols-3 gap-2 mb-4" role="tablist">
          {filters.map(f => (
            <button key={f.key} role="tab" aria-selected={filter === f.key} onClick={() => { playButtonTap(); setFilter(f.key); }}
              className={noChallenges
                ? `rounded-2xl border-2 py-2.5 px-1 sm:px-2 text-[13px] min-[400px]:text-sm sm:text-base font-bold whitespace-nowrap flex items-center justify-center gap-1 sm:gap-1.5 transition-colors ${filter === f.key ? 'border-accent bg-accent/10 shadow-[0_0_14px_hsl(var(--accent)/0.35)]' : 'border-accent/40 bg-card/60 hover:border-accent'}`
                : `rounded-full border-2 py-2.5 px-2 text-[13px] min-[400px]:text-sm sm:text-base font-bold whitespace-nowrap flex items-center justify-center gap-1 transition-colors ${filter === f.key ? 'border-primary bg-primary text-primary-foreground shadow-[0_0_14px_hsl(var(--primary)/0.35)]' : 'border-accent/50 bg-card/60 hover:border-accent'}`}>
              {noChallenges
                ? <><span className="[&>svg]:w-4 [&>svg]:h-4 sm:[&>svg]:w-5 sm:[&>svg]:h-5">{f.icon}</span>{f.label} <span className="text-accent">{f.count}</span></>
                : <>{f.label} <span>· {f.count}</span></>}
            </button>
          ))}
        </div>

        {error ? (
          <section className="max-w-md mx-auto rounded-3xl border border-destructive/50 bg-card/70 p-6 text-center" role="alert">
            <Mascot state="confused" className="w-20 mx-auto" />
            <p className="mt-3 text-sm sm:text-base">{error === 'auth_required' ? t('friends_needLogin') : t('mc_loadError')}</p>
            <div className="mt-4 grid gap-2">
              {error === 'auth_required'
                ? <button onClick={() => { playButtonTap(); onSignIn(); }} className="btn3d rounded-2xl py-3 font-black text-primary-foreground" style={{ background: 'var(--grad-cta)' }}>{t('friends_signIn')}</button>
                : <button onClick={() => { playButtonTap(); setItems(null); load(); }} className="btn3d rounded-2xl py-3 font-black text-primary-foreground" style={{ background: 'var(--grad-cta)' }}>🔄 {t('mc_retry')}</button>}
            </div>
          </section>
        ) : items === null ? (
          <div className="flex justify-center py-12"><Mascot state="idle" className="w-20 animate-mascot-float" /></div>
        ) : shown.length === 0 ? (
          <section className="max-w-xl mx-auto rounded-3xl border-2 border-accent/60 bg-card/70 px-5 py-8 sm:p-10 text-center shadow-[0_0_24px_hsl(var(--accent)/0.18)]">
            {/* Los dos exploradores con el portapapeles (maqueta Mis_Retos_Vacio) */}
            <div className="relative mx-auto w-64 sm:w-72 h-40 sm:h-44 [container-type:inline-size]" aria-hidden>
              <span className="absolute left-0 bottom-0 w-[44%] -rotate-6"><Mascot state="celebrate" className="w-full drop-shadow-[0_10px_16px_rgba(0,0,0,0.45)]" /></span>
              <span className="absolute right-0 bottom-0 w-[44%] rotate-6 -scale-x-100 [filter:hue-rotate(125deg)_saturate(1.3)]"><Mascot state="wink" className="w-full drop-shadow-[0_10px_16px_rgba(0,0,0,0.45)]" /></span>
              <span className="absolute left-1/2 -translate-x-1/2 bottom-[2%] text-[34cqi] leading-none drop-shadow-[0_8px_12px_rgba(0,0,0,0.5)]">📋</span>
              <svg viewBox="0 0 40 22" className="absolute left-1/2 -translate-x-1/2 -top-1 w-[18%] text-primary" fill="none" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round"><path d="M7 19 3 8M20 17V3M33 19l4-11" /></svg>
            </div>
            <h2 className="mt-4 text-[1.7rem] sm:text-3xl font-black leading-tight">{items.length === 0 ? t('mc_emptyLead') : t('mc_emptyFilter')} {items.length === 0 && <span className="text-primary">{t('mc_emptyTail')}</span>}</h2>
            <p className="mt-2 text-base sm:text-lg text-foreground/85">{t('mc_emptyDesc')}</p>
            <button onClick={() => { playButtonTap(); onCreate(); }} className="btn3d mt-6 w-full max-w-xs mx-auto rounded-full h-14 font-black text-xl text-primary-foreground flex items-center justify-center gap-3 shadow-[0_0_24px_hsl(var(--primary)/0.35)]" style={{ background: 'var(--grad-cta)' }}>
              <span className="w-8 h-8 rounded-full bg-primary-foreground text-primary flex items-center justify-center" aria-hidden><svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg></span>
              {t('mc_create')}
            </button>
          </section>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {shown.map(item => <ChallengeCard key={item.id} item={item} onOpen={() => { playButtonTap(); onOpen(item); }} />)}
          </div>
        )}

        {!noChallenges && <p className="mt-4 flex items-center justify-center gap-2 text-sm text-foreground/85"><InfoGlyph /> {t('mc_footer')}</p>}
        {items && items.length > 0 && (
          <button onClick={() => { playButtonTap(); onCreate(); }} className="btn3d mt-4 w-full max-w-xl mx-auto flex items-center justify-center gap-3 rounded-2xl py-3.5 font-black text-lg sm:text-xl text-primary-foreground" style={{ background: 'var(--grad-cta)' }}>
            <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" aria-hidden><path d="M12 5v14M5 12h14" /></svg>
            {t('chr_createAnother')}
          </button>
        )}
        <div className={noChallenges ? 'mt-6 py-4 border-y border-accent/20' : ''}>
          <button onClick={() => { playButtonTap(); onBack(); }} className={`${noChallenges ? '' : 'mt-4'} mx-auto flex items-center justify-center gap-2 font-bold hover:text-accent`}>
            <HomeIcon className="w-6 h-6" /> {t('ob_backHome')}
          </button>
        </div>
      </div>
    </div>
  );
}

function ChallengeCard({ item, onOpen }: { item: MyChallenge; onOpen: () => void }) {
  const { t } = useI18n();
  const rival = item.rival_name ?? t('ch_yourFriend');
  const cfg: Record<ChallengeState, { pill: string; pillCls: string; info: string; cta: string; ctaPrimary: boolean; mascot: 'surprised' | 'thinking' | 'sleepy' | 'cheer'; border: string }> = {
    to_accept: { pill: t('mc_toAccept'), pillCls: 'bg-primary text-primary-foreground', info: t('mc_toAcceptInfo'), cta: t('mc_viewInvite'), ctaPrimary: true, mascot: 'surprised', border: 'border-primary' },
    to_play: { pill: t('mc_toPlay'), pillCls: 'border border-primary text-primary', info: t('mc_toPlayInfo'), cta: t('ch_playMine'), ctaPrimary: true, mascot: 'thinking', border: 'border-accent/50' },
    waiting: { pill: t('mc_waiting', { name: rival }), pillCls: 'border border-border text-muted-foreground', info: t('mc_waitingInfo'), cta: t('mc_viewStatus'), ctaPrimary: false, mascot: 'sleepy', border: 'border-accent/40' },
    ready: { pill: t('mc_ready'), pillCls: 'bg-accent text-accent-foreground', info: t('mc_readyInfo'), cta: t('mc_viewResult'), ctaPrimary: false, mascot: 'cheer', border: 'border-accent' },
  };
  const c = cfg[item.state];
  const title = item.state === 'to_accept' && item.is_rematch
    ? <>{t('mc_rematchLead', { name: rival })} <span className="text-primary">{t('mc_rematchTail')}</span></>
    : <>{t('mc_withLead')} <span className="text-accent">{rival}</span></>;
  const result = item.state === 'ready' && item.my_score != null && item.rival_score != null
    ? (item.my_score > item.rival_score ? `🏆 ${t('chr_winner')}` : item.my_score < item.rival_score ? t('chr_loseShort') : `⚌ ${t('chr_tie')}`)
    : null;

  return (
    <article className={`min-w-0 rounded-3xl border-2 ${c.border} bg-card/70 p-3 sm:p-4 flex gap-3`}>
      <div className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-accent/60 bg-background/50 flex items-center justify-center overflow-hidden shadow-[0_0_12px_hsl(var(--accent)/0.25)]" aria-hidden>
        {item.state === 'to_accept' ? <span className="text-4xl">💌</span> : item.state === 'ready'
          ? <svg viewBox="0 0 24 24" className="w-10 h-10 text-accent drop-shadow-[0_0_8px_hsl(var(--accent)/0.7)]" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
          : <span className={`block w-11 sm:w-12 ${item.state === 'to_play' ? '[filter:hue-rotate(125deg)_saturate(1.3)]' : ''}`}><Mascot state={c.mascot} className="w-full" /></span>}
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 font-extrabold text-lg sm:text-xl leading-tight break-words">{title}</h3>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap ${c.pillCls}`}>{c.pill}</span>
        </div>
        <p className="text-xs sm:text-sm text-foreground/80 truncate flex items-center gap-1.5"><GlobeGlyph /> {t(`mode_${item.mode}` as never)} · {t(`home_diff${item.difficulty.charAt(0).toUpperCase()}${item.difficulty.slice(1)}` as never)} · {item.is_rematch && item.state === 'to_accept' ? t('mc_newCities', { n: item.rounds_total }) : t('chc_nCities', { n: item.rounds_total })}</p>
        {/* En pantallas angostas el botón baja a su propia línea (el texto no cabe junto a él) */}
        <div className="flex flex-col gap-2 mt-1 min-[420px]:flex-row min-[420px]:items-end min-[420px]:justify-between">
          <p className="min-w-0 text-xs sm:text-sm text-foreground/80 flex items-start gap-1.5"><InfoGlyph /> <span>{result ? <span className="font-bold text-foreground">{result} · {item.my_score!.toLocaleString(appNumberLocale())} – {item.rival_score!.toLocaleString(appNumberLocale())}</span> : c.info}</span></p>
          <button onClick={onOpen} className={`shrink-0 self-end rounded-xl px-3 py-2 text-xs sm:text-sm font-black whitespace-nowrap active:scale-[0.97] flex items-center gap-1.5 ${c.ctaPrimary ? 'btn3d text-primary-foreground' : 'border-2 border-accent text-accent hover:bg-accent/10'}`} style={c.ctaPrimary ? { background: 'var(--grad-cta)' } : undefined}>
            {c.cta} <ArrowRightIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </article>
  );
}

const InfoGlyph = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0 text-accent" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden><circle cx="12" cy="12" r="9.5" /><path d="M12 11v6" /><circle cx="12" cy="7.6" r="0.6" fill="currentColor" /></svg>
);
const GlobeGlyph = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0 text-accent" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></svg>
);
const ClockGlyph = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
);
const TrophyGlyph = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden><path d="M7 4h10v4a5 5 0 0 1-10 0V4ZM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M12 13v4M8 20h8M9 17h6" /></svg>
);
