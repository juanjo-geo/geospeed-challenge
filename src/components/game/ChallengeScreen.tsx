import { useCallback, useEffect, useState } from 'react';
import {
  previewChallenge, joinChallenge, fetchChallengeDetail, challengeLink, ChallengeError,
  type Challenge, type ChallengePreview, type ChallengeDetail,
} from '@/lib/challenges';
import { playButtonTap, playShareSuccess } from '@/lib/sounds';
import { useI18n } from '@/i18n';
import { useAuth } from '@/hooks/useAuth';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { HomeIcon, StopwatchIcon } from '@/components/ui/icons';
import Mascot from './Mascot';
import ChallengeResultScreen from './ChallengeResultScreen';

export type ChallengeSource = { type: 'challenge'; challenge: Challenge } | { type: 'code'; code: string };

interface ChallengeScreenProps {
  source: ChallengeSource;
  onPlay: (ch: Challenge) => void;
  onBack: () => void;
  onSignIn: () => void;
  /** "Crear otro reto" desde el resultado */
  onCreateAnother: () => void;
  onMyChallenges: () => void;
  /** Pedir revancha desde el resultado (derrota / empate) */
  onRematch: (detail: ChallengeDetail) => void;
}

/**
 * Pantalla del reto (maqueta Invitacion_Reto_APROBADA_v2).
 *  - Creador / participante: "Tu reto está creado": código, copiar, compartir, condiciones y participantes.
 *  - Invitado que abre el código o el enlace /reto/:code: quién lo reta, condiciones y "Aceptar y jugar".
 */
export default function ChallengeScreen({ source, onPlay, onBack, onSignIn, onCreateAnother, onMyChallenges, onRematch }: ChallengeScreenProps) {
  const { t } = useI18n();
  const { displayName } = useAuth();
  const [challenge, setChallenge] = useState<Challenge | null>(source.type === 'challenge' ? source.challenge : null);
  const [preview, setPreview] = useState<ChallengePreview | null>(null);
  const [detail, setDetail] = useState<ChallengeDetail | null>(null);
  const [error, setError] = useState<'unavailable' | 'auth_required' | 'network' | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  // Invitado: previsualizar el código. Si ya participa (o es su propio reto), pasar a la vista del reto.
  useEffect(() => {
    if (source.type !== 'code') return;
    let cancelled = false;
    (async () => {
      try {
        const p = await previewChallenge(source.code);
        if (cancelled) return;
        // Ya participa y aceptó (o es el creador) → vista del reto. Invitado a una revancha sin aceptar → invitación.
        if (p.my_role === 'creator' || (p.my_role === 'opponent' && p.accepted)) {
          const ch = await joinChallenge(source.code);
          if (!cancelled) setChallenge(ch);
        } else {
          setPreview(p);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof ChallengeError ? e.code : 'network');
      }
    })();
    return () => { cancelled = true; };
  }, [source]);

  // Estado de participantes: se refresca cada 15 s mientras la pantalla está abierta
  const refresh = useCallback(async () => {
    if (!challenge) return;
    try { setDetail(await fetchChallengeDetail(challenge.id)); } catch { /* sin red: se reintenta */ }
  }, [challenge]);
  useEffect(() => {
    if (!challenge) return;
    refresh();
    const id = setInterval(refresh, 15000);
    return () => clearInterval(id);
  }, [challenge, refresh]);

  const accept = async () => {
    if (!preview || busy) return;
    playButtonTap();
    setBusy(true);
    try {
      const ch = await joinChallenge(preview.code);
      onPlay(ch);
    } catch (e) {
      setError(e instanceof ChallengeError ? e.code : 'network');
    } finally {
      setBusy(false);
    }
  };

  const code = challenge?.code ?? preview?.code ?? (source.type === 'code' ? source.code : '');
  const link = challengeLink(code);
  const copy = async () => {
    playButtonTap();
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* sin portapapeles */ }
  };
  const share = async () => {
    const text = t('ch_shareText', { code, link });
    try {
      if (navigator.share) await navigator.share({ title: 'GeoSpeed', text, url: link });
      else { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); }
      playShareSuccess();
    } catch { /* cancelado */ }
  };

  const mode = challenge?.mode ?? preview?.mode;
  const difficulty = challenge?.difficulty ?? preview?.difficulty;
  const rounds = challenge?.rounds_total ?? preview?.rounds_total ?? 13;
  const seconds = challenge?.seconds_per_round ?? preview?.seconds_per_round ?? 15;
  const conditions = (
    <Card>
      <h2 className="flex items-center gap-2.5 text-xl sm:text-2xl font-extrabold mb-3">
        <GearIcon className="w-6 h-6 text-foreground/85" /> {t('ch_conditionsLead')} <span className="text-primary -ml-1">{t('ch_conditionsTail')}</span>
      </h2>
      <div className="flex flex-col gap-2 text-sm sm:text-base">
        <Row icon={<GlobeIcon className="w-6 h-6 text-accent" />} label={t('ch_region')} value={mode ? t(`mode_${mode}` as never) : '—'} />
        <Row icon={<BagIcon className="w-6 h-6 text-accent" />} label={t('ch_difficulty')} value={difficulty ? t(`home_diff${difficulty.charAt(0).toUpperCase()}${difficulty.slice(1)}` as never) : '—'} />
        <Row icon={<StopwatchIcon className="w-6 h-6 text-accent" />} label={t('ch_format')} value={t('ch_formatValue', { n: rounds, s: seconds })} />
      </div>
      <p className="mt-2.5 flex items-center justify-center gap-1.5 text-xs sm:text-sm text-foreground/75"><LockIcon className="w-4 h-4" /> {t('ch_fixed')}</p>
    </Card>
  );

  // ── Errores (código inválido o lleno: mensaje genérico, D3) ──
  if (error) {
    return (
      <Shell onBack={onBack} title={t('ch_unavailableTitle')}>
        <Card className="max-w-md mx-auto text-center">
          <Mascot state="sad" className="w-28 mx-auto" />
          <p className="mt-3 text-base sm:text-lg">{error === 'auth_required' ? t('friends_needLogin') : error === 'network' ? t('friends_errorNetwork') : t('ch_unavailable')}</p>
          {error === 'auth_required' && (
            <button onClick={() => { playButtonTap(); onSignIn(); }} className="btn3d mt-4 w-full rounded-2xl py-3.5 font-black text-lg text-primary-foreground" style={{ background: 'var(--grad-cta)' }}>{t('friends_signIn')}</button>
          )}
          <BackHome onClick={() => { playButtonTap(); onBack(); }} label={t('ob_backHome')} />
        </Card>
      </Shell>
    );
  }

  // ── Invitado: aceptar ──
  if (preview && !challenge) {
    return (
      <Shell onBack={onBack} title={preview.is_rematch ? t('ch_rematchInviteTitle') : t('ch_inviteTitle', { name: preview.creator_name })} subtitle={preview.is_rematch ? t('ch_rematchInviteSub', { name: preview.creator_name }) : t('ch_inviteSub')}>
        <Hero badge={preview.is_rematch ? `↻ ${t('ch_rematchBadge')}` : t('friends_badge')} />
        <div className="grid gap-4 md:grid-cols-2 md:items-start">
          <Card className="text-center flex flex-col items-center">
            <p className="text-xl sm:text-2xl font-extrabold">{preview.creator_name}</p>
            <p className="text-sm sm:text-base text-foreground/75">{preview.is_rematch ? t('ch_rematchInviteFrom') : t('ch_inviteFrom')}</p>
            <CodeBox code={preview.code} />
          </Card>
          <div className="flex flex-col gap-4">
            {conditions}
            {preview.is_rematch && (
              <Card>
                <h2 className="flex items-center gap-2 text-lg sm:text-xl font-extrabold mb-2"><InfoIcon className="w-6 h-6 text-accent" /> {t('ch_newLead')} <span className="text-primary -ml-1">{t('ch_newTail')}</span></h2>
                <p className="text-sm text-foreground/80">🏆 {t('ch_prevKept')}</p>
                <p className="text-sm text-foreground/80 mt-1">🙈 {t('ch_hiddenUntilBoth', { name: preview.creator_name })}</p>
              </Card>
            )}
            <InfoBox lead={t('ch_restartNote')} />
          </div>
        </div>
        <div className="mt-4 flex flex-col items-center gap-2.5">
          <PlayButton onClick={accept} busy={busy} label={t('ch_accept')} />
          <button onClick={() => { playButtonTap(); onBack(); }} className="w-full max-w-md rounded-full py-3 border-2 border-foreground/25 font-bold hover:bg-muted/40">{t('ch_notNow')}</button>
        </div>
        {preview.is_rematch && <p className="mt-2 text-center text-xs text-muted-foreground">{t('ch_staysInMine')}</p>}
      </Shell>
    );
  }

  if (!challenge) {
    return (
      <Shell onBack={onBack} title={t('ch_loading')}>
        <div className="flex justify-center py-12"><Mascot state="idle" className="w-20 animate-mascot-float" /></div>
      </Shell>
    );
  }

  // ── Ya jugué: resultado (pendiente / victoria / derrota / empate) ──
  if (detail?.my_finished) {
    return <ChallengeResultScreen detail={detail} onBack={onBack} onCreateAnother={onCreateAnother} onRefresh={refresh} onRematch={() => onRematch(detail)} onMyChallenges={onMyChallenges} />;
  }

  // ── Reto creado / estado ──
  const meFinished = detail?.my_finished ?? false;
  const rival = detail?.rival ?? null;
  const youStatus = meFinished ? { label: t('ch_statusDone'), cls: 'border-accent text-accent', dot: 'bg-accent' } : { label: t('ch_statusNotPlayed'), cls: 'border-primary text-primary', dot: 'bg-primary' };
  const rivalStatus = !rival ? { label: t('ch_statusToJoin'), cls: 'border-foreground/30 text-foreground/90', dot: 'bg-accent' }
    : rival.finished ? { label: t('ch_statusDone'), cls: 'border-accent text-accent', dot: 'bg-accent' }
    : rival.accepted === false ? { label: t('ch_statusToAccept'), cls: 'border-foreground/30 text-foreground/90', dot: 'bg-accent' }
    : { label: t('ch_statusJoined'), cls: 'border-primary text-primary', dot: 'bg-primary' };
  const isRematch = !!detail?.is_rematch || !!challenge.parent_challenge_id;

  return (
    <Shell onBack={onBack} title={isRematch && challenge.is_creator ? t('ch_rematchSentTitle') : challenge.is_creator ? t('ch_createdTitle') : t('ch_statusTitle')} subtitle={isRematch && challenge.is_creator ? t('ch_rematchSentSub') : t('ch_createdSub')}>
      <Hero badge={isRematch ? `↻ ${t('ch_rematchBadge')}` : t('friends_badge')} />
      <div className="grid gap-4 md:grid-cols-2 md:items-start">
        <Card>
          <div className="flex items-center gap-3">
            <LinkIcon className="w-14 h-14 sm:w-16 sm:h-16 text-accent drop-shadow-[0_0_10px_hsl(var(--accent)/0.6)]" />
            <div className="flex-1 min-w-0">
              <p className="text-xl sm:text-2xl font-extrabold">{t('ch_codeLead')} <span className="text-primary">{t('ch_codeTail')}</span></p>
              <div className="mt-2 flex items-stretch gap-2">
                <span className="flex-1 min-w-0 rounded-2xl border-2 border-foreground/15 bg-background/60 py-2.5 text-center font-extrabold text-2xl sm:text-3xl tracking-[0.35em] pl-[0.35em] truncate">{challenge.code}</span>
                <button onClick={copy} className="rounded-2xl border-2 border-accent/70 px-3 font-bold text-sm sm:text-base hover:bg-accent/10 active:scale-95 flex items-center gap-1.5">
                  {copied ? <span aria-hidden>✓</span> : <CopyIcon className="w-5 h-5" />}<span>{copied ? t('ch_copied') : t('ch_copy')}</span>
                </button>
              </div>
            </div>
          </div>
          <button onClick={share} className="mt-3 w-full rounded-2xl py-3.5 border-2 border-accent text-accent font-black text-base sm:text-lg hover:bg-accent/10 active:scale-[0.98] flex items-center justify-center gap-2.5">
            <ShareIcon className="w-6 h-6" /> {t('ch_share')}
          </button>
          <p className="mt-2 text-center text-xs sm:text-sm text-foreground/75">{isRematch && rival ? t('ch_rematchInInbox') : t('ch_shareHint')}</p>
        </Card>

        <div className="flex flex-col gap-4">
          {conditions}
          <Card>
            <h2 className="flex items-center gap-2.5 text-xl sm:text-2xl font-extrabold mb-3"><PeopleIcon className="w-7 h-7 text-foreground/85" /> {t('ch_participants')}</h2>
            <div className="flex flex-col gap-2">
              <Participant name={displayName ? displayName : t('ch_you')} youTag={displayName ? t('ch_you') : undefined} status={youStatus} me />
              <Participant name={rival?.name ?? t('ch_yourFriend')} status={rivalStatus} />
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-4"><InfoBox lead={t('ch_startNow')} tail={t('ch_compareWhenBoth')} /></div>

      <div className="mt-4 flex flex-col items-center gap-2.5">
        {!meFinished ? (
          <PlayButton onClick={() => { playButtonTap(); onPlay(challenge); }} label={isRematch ? t('ch_playRematch') : t('ch_playMine')} />
        ) : (
          <div className="w-full max-w-xl rounded-2xl border border-accent/50 bg-accent/10 py-3 text-center font-bold text-accent">
            {detail?.status === 'completed' ? t('ch_resultReady') : t('ch_waitingFriend')}
          </div>
        )}
        <button onClick={() => { playButtonTap(); onMyChallenges(); }} className="w-full max-w-md rounded-full py-3 border-2 border-accent/60 text-accent font-bold hover:bg-accent/10">📋 {t('mc_viewMine')}</button>
        <BackHome onClick={() => { playButtonTap(); onBack(); }} label={t('ob_backHome')} />
      </div>
    </Shell>
  );
}

function Shell({ onBack, title, subtitle, children }: { onBack: () => void; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center game-bg overflow-y-auto px-3 py-4 sm:px-4 sm:py-6 md:px-6">
      <div className="w-full max-w-5xl animate-fade-in-up pb-6" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 8px)' }}>
        <ScreenHeader onBack={onBack} title={title} subtitle={subtitle} />
        {children}
      </div>
    </div>
  );
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-3xl border-2 border-accent/45 bg-card/75 p-4 sm:p-5 shadow-[0_0_20px_hsl(var(--accent)/0.10)] ${className}`}>{children}</section>;
}

/** El Explorador con el mapa y la insignia "Reto entre amigos" (maqueta). */
function Hero({ badge }: { badge: string }) {
  const words = badge.split(' ');
  return (
    <div className="relative flex flex-col items-center -mt-2 mb-4 short:hidden" aria-hidden>
      <div className="relative">
        <Mascot state="celebrate" className="w-28 sm:w-32" />
        <span className="absolute -left-5 top-8 text-primary text-lg">✦</span>
        <LinkIcon className="absolute -right-12 top-4 w-10 h-10 text-accent rotate-12 drop-shadow-[0_0_8px_hsl(var(--accent)/0.6)]" />
      </div>
      <span className="-mt-1 rounded-full border-2 border-primary bg-background/90 px-4 py-1 text-xs sm:text-sm font-extrabold tracking-wide">
        {words.slice(0, -1).join(' ')} <span className="text-primary">{words[words.length - 1]}</span>
      </span>
    </div>
  );
}

function CodeBox({ code }: { code: string }) {
  return <p className="mt-3 rounded-2xl border-2 border-foreground/15 bg-background/60 px-5 py-2.5 font-extrabold text-2xl sm:text-3xl tracking-[0.35em] pl-[calc(1.25rem+0.35em)] text-accent">{code}</p>;
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-foreground/15 bg-background/40 px-3 py-2.5">
      {icon}
      <span className="flex-1 text-foreground/80">{label}</span>
      <span className="font-extrabold">{value}</span>
    </div>
  );
}

function Participant({ name, youTag, status, me }: { name: string; youTag?: string; status: { label: string; cls: string; dot: string }; me?: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-foreground/15 bg-background/40 px-3 py-2">
      <Mascot state={me ? 'idle' : 'wink'} className={`w-9 shrink-0 ${me ? '' : 'grayscale brightness-75'}`} />
      <span className="flex-1 font-bold truncate">{name}{youTag && <span className="text-primary"> · {youTag}</span>}</span>
      <span className={`rounded-full border-2 px-3 py-1 text-xs sm:text-sm font-bold whitespace-nowrap flex items-center gap-1.5 ${status.cls}`}>
        <span className={`w-2.5 h-2.5 rounded-full ${status.dot}`} aria-hidden />{status.label}
      </span>
    </div>
  );
}

function InfoBox({ lead, tail }: { lead: string; tail?: string }) {
  return (
    <div className="rounded-2xl border-2 border-accent/40 bg-card/60 p-3 sm:p-4 flex items-center gap-3 max-w-xl mx-auto">
      <InfoIcon className="w-8 h-8 text-accent" />
      <p className="text-sm sm:text-base">
        <span className="font-bold">{lead}</span>
        {tail && <span className="block text-foreground/75 text-xs sm:text-sm">{tail}</span>}
      </p>
    </div>
  );
}

function PlayButton({ onClick, label, busy = false }: { onClick: () => void; label: string; busy?: boolean }) {
  return (
    <button onClick={onClick} disabled={busy} className="btn3d w-full max-w-xl rounded-2xl py-4 short:py-2.5 font-black text-xl sm:text-2xl text-primary-foreground disabled:opacity-60 flex items-center justify-center gap-3" style={{ background: 'var(--grad-cta)' }}>
      {busy ? <span aria-hidden>⏳</span> : <svg viewBox="0 0 24 24" className="w-7 h-7" fill="currentColor" aria-hidden><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5Z" /></svg>}
      {label}
    </button>
  );
}

function BackHome({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} className="mt-1 w-full max-w-sm rounded-full py-2.5 border-2 border-accent/50 font-bold flex items-center justify-center gap-2 hover:bg-accent/10 active:scale-[0.98]">
      <HomeIcon className="w-5 h-5" /> {label}
    </button>
  );
}

type I = { className?: string };
const svg = (className: string, children: React.ReactNode, fill = false) => (
  <svg viewBox="0 0 24 24" className={`shrink-0 ${className}`} fill={fill ? 'currentColor' : 'none'} stroke={fill ? 'none' : 'currentColor'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{children}</svg>
);
const LinkIcon = ({ className = '' }: I) => svg(className, <><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.2 1.2" /><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2" /></>);
const CopyIcon = ({ className = '' }: I) => svg(className, <><rect x="8" y="8" width="12" height="13" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h2" /></>);
const ShareIcon = ({ className = '' }: I) => svg(className, <><circle cx="18" cy="5.5" r="2.5" fill="currentColor" /><circle cx="6" cy="12" r="2.5" fill="currentColor" /><circle cx="18" cy="18.5" r="2.5" fill="currentColor" /><path d="m8.2 10.8 7.6-4.1M8.2 13.2l7.6 4.1" /></>);
const GearIcon = ({ className = '' }: I) => svg(className, <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></>);
const GlobeIcon = ({ className = '' }: I) => svg(className, <><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>);
const BagIcon = ({ className = '' }: I) => svg(className, <><rect x="5" y="7" width="14" height="14" rx="3" /><path d="M9 7V5a3 3 0 0 1 6 0v2" /><path d="M9 13h6" /></>);
const LockIcon = ({ className = '' }: I) => svg(className, <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>);
const PeopleIcon = ({ className = '' }: I) => svg(className, <><circle cx="9" cy="8" r="3.5" fill="currentColor" /><circle cx="17" cy="9" r="2.8" fill="currentColor" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0Z" fill="currentColor" /><path d="M15 20a5 5 0 0 1 7-4.6V20Z" fill="currentColor" /></>, true);
const InfoIcon = ({ className = '' }: I) => svg(className, <><circle cx="12" cy="12" r="9.5" /><path d="M12 11v6" /><circle cx="12" cy="7.6" r="0.6" fill="currentColor" /></>);
