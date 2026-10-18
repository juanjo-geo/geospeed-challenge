import { useCallback, useEffect, useState } from 'react';
import { fetchMyChallenges, ChallengeError, type MyChallenge, type ChallengeState } from '@/lib/challenges';
import { playButtonTap } from '@/lib/sounds';
import { useI18n } from '@/i18n';
import ScreenHeader from '@/components/ui/ScreenHeader';
import Mascot from './Mascot';
import { appNumberLocale } from '@/lib/format';

interface MyChallengesScreenProps {
  onBack: () => void;
  onOpen: (ch: MyChallenge) => void;
  onCreate: () => void;
  onSignIn: () => void;
}

type Filter = 'all' | 'pending' | 'done';
const PENDING: ChallengeState[] = ['to_accept', 'to_play', 'waiting'];

/** Bandeja "Mis retos" (maquetas Mis_Retos y Mis_Retos_Vacio): filtros con contadores, una tarjeta por reto. */
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

  const filters: { key: Filter; label: string; icon: string; count: number }[] = [
    { key: 'all', label: t('mc_all'), icon: '🌐', count: items?.length ?? 0 },
    { key: 'pending', label: t('mc_pending'), icon: '🕒', count: pending.length },
    { key: 'done', label: t('mc_done'), icon: '🏆', count: done.length },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col items-center game-bg overflow-y-auto px-3 py-4 sm:px-4 sm:py-6 md:px-6">
      <div className="w-full max-w-5xl animate-fade-in-up pb-6" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 8px)' }}>
        <ScreenHeader
          onBack={onBack}
          title={t('mc_title')}
          subtitle={t('mc_subtitle')}
          right={items && items.length > 0 ? (
            <button onClick={() => { playButtonTap(); onCreate(); }} className="hidden sm:inline-flex rounded-2xl border-2 border-primary text-primary px-4 py-2 font-black text-sm hover:bg-primary/10 active:scale-[0.98]">＋ {t('chr_createAnother')}</button>
          ) : undefined}
        />

        {/* Filtros con contadores (misma lista que las tarjetas) */}
        <div className="grid grid-cols-3 gap-2 mb-4" role="tablist">
          {filters.map(f => (
            <button key={f.key} role="tab" aria-selected={filter === f.key} onClick={() => { playButtonTap(); setFilter(f.key); }}
              className={`rounded-2xl border-2 py-2 px-2 text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 transition-colors ${filter === f.key ? 'border-primary bg-primary text-primary-foreground' : 'border-accent/50 bg-card/60 hover:border-accent'}`}>
              <span aria-hidden>{f.icon}</span> {f.label} <span className={filter === f.key ? '' : 'text-accent'}>· {f.count}</span>
            </button>
          ))}
        </div>

        {error ? (
          <section className="max-w-md mx-auto rounded-3xl border border-destructive/50 bg-card/70 p-6 text-center" role="alert">
            <Mascot state="sad" className="w-20 mx-auto" />
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
          <section className="max-w-xl mx-auto rounded-3xl border border-accent/50 bg-card/70 p-6 sm:p-8 text-center">
            <div className="flex justify-center gap-1 mb-2" aria-hidden>
              <Mascot state="celebrate" className="w-20 sm:w-24" />
              <Mascot state="wink" className="w-20 sm:w-24 hue-rotate-[140deg]" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black">{items.length === 0 ? t('mc_emptyLead') : t('mc_emptyFilter')} {items.length === 0 && <span className="text-primary">{t('mc_emptyTail')}</span>}</h2>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground">{t('mc_emptyDesc')}</p>
            <button onClick={() => { playButtonTap(); onCreate(); }} className="btn3d mt-5 w-full max-w-xs rounded-2xl py-3.5 font-black text-lg text-primary-foreground" style={{ background: 'var(--grad-cta)' }}>＋ {t('mc_create')}</button>
          </section>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {shown.map(item => <ChallengeCard key={item.id} item={item} onOpen={() => { playButtonTap(); onOpen(item); }} />)}
          </div>
        )}

        <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border/60 pt-4">
          <p className="text-xs sm:text-sm text-muted-foreground">ⓘ {t('mc_footer')}</p>
          <div className="flex gap-2">
            {items && items.length > 0 && (
              <button onClick={() => { playButtonTap(); onCreate(); }} className="sm:hidden rounded-2xl border-2 border-primary text-primary px-4 py-2 font-black text-sm">＋ {t('chr_createAnother')}</button>
            )}
            <button onClick={() => { playButtonTap(); onBack(); }} className="rounded-2xl border border-border bg-muted/20 px-4 py-2 font-bold text-sm hover:bg-muted">🏠 {t('ob_backHome')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChallengeCard({ item, onOpen }: { item: MyChallenge; onOpen: () => void }) {
  const { t } = useI18n();
  const rival = item.rival_name ?? t('ch_yourFriend');
  const cfg: Record<ChallengeState, { pill: string; pillCls: string; info: string; cta: string; ctaPrimary: boolean; mascot: 'wink' | 'idle' | 'celebrate'; border: string }> = {
    to_accept: { pill: t('mc_toAccept'), pillCls: 'bg-primary text-primary-foreground', info: t('mc_toAcceptInfo'), cta: t('mc_viewInvite'), ctaPrimary: true, mascot: 'wink', border: 'border-primary' },
    to_play: { pill: t('mc_toPlay'), pillCls: 'border border-primary text-primary', info: t('mc_toPlayInfo'), cta: t('ch_playMine'), ctaPrimary: true, mascot: 'idle', border: 'border-accent/50' },
    waiting: { pill: t('mc_waiting', { name: rival }), pillCls: 'border border-border text-muted-foreground', info: t('mc_waitingInfo'), cta: t('mc_viewStatus'), ctaPrimary: false, mascot: 'wink', border: 'border-accent/40' },
    ready: { pill: t('mc_ready'), pillCls: 'bg-accent text-accent-foreground', info: t('mc_readyInfo'), cta: t('mc_viewResult'), ctaPrimary: false, mascot: 'celebrate', border: 'border-accent' },
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
      <div className="shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-accent/60 bg-muted/30 flex items-center justify-center overflow-hidden" aria-hidden>
        {item.state === 'to_accept' ? <span className="text-3xl">✉️</span> : item.state === 'ready' ? <span className="text-3xl">✅</span> : <Mascot state={c.mascot} className="w-11 sm:w-12 hue-rotate-[140deg]" />}
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 font-black text-base sm:text-lg leading-tight break-words">{title}</h3>
          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold whitespace-nowrap ${c.pillCls}`}>{c.pill}</span>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground truncate">🌍 {t(`mode_${item.mode}` as never)} · {t(`diff_${item.difficulty}` as never)} · {item.is_rematch && item.state === 'to_accept' ? t('mc_newCities', { n: item.rounds_total }) : t('chc_nCities', { n: item.rounds_total })}</p>
        {/* En pantallas angostas el botón baja a su propia línea (el texto no cabe junto a él) */}
        <div className="flex flex-col gap-2 mt-1 min-[420px]:flex-row min-[420px]:items-end min-[420px]:justify-between">
          <p className="min-w-0 text-xs sm:text-sm text-muted-foreground">ⓘ {result ? <span className="font-bold text-foreground">{result} · {item.my_score!.toLocaleString(appNumberLocale())} – {item.rival_score!.toLocaleString(appNumberLocale())}</span> : c.info}</p>
          <button onClick={onOpen} className={`shrink-0 self-end rounded-xl px-3 py-2 text-xs sm:text-sm font-black whitespace-nowrap active:scale-[0.97] ${c.ctaPrimary ? 'btn3d text-primary-foreground' : 'border-2 border-accent text-accent hover:bg-accent/10'}`} style={c.ctaPrimary ? { background: 'var(--grad-cta)' } : undefined}>
            {c.cta} →
          </button>
        </div>
      </div>
    </article>
  );
}
