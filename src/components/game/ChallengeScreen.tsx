import { useCallback, useEffect, useState } from 'react';
import {
  previewChallenge, joinChallenge, fetchChallengeDetail, challengeLink, ChallengeError,
  type Challenge, type ChallengePreview, type ChallengeDetail,
} from '@/lib/challenges';
import { playButtonTap, playShareSuccess } from '@/lib/sounds';
import { useI18n } from '@/i18n';
import ScreenHeader from '@/components/ui/ScreenHeader';
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
}

/**
 * Pantalla del reto (maqueta Invitacion_Reto_APROBADA_v2).
 *  - Creador / participante: "Tu reto está creado": código, copiar, compartir, condiciones y participantes.
 *  - Invitado que abre el código o el enlace /reto/:code: quién lo reta, condiciones y "Aceptar y jugar".
 */
export default function ChallengeScreen({ source, onPlay, onBack, onSignIn, onCreateAnother }: ChallengeScreenProps) {
  const { t } = useI18n();
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
        if (p.my_role) {
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
    <section className="rounded-3xl border border-border bg-card/70 p-4 sm:p-5">
      <h2 className="text-lg sm:text-xl font-black mb-3">⚙️ {t('ch_conditionsLead')} <span className="text-primary">{t('ch_conditionsTail')}</span></h2>
      <div className="flex flex-col gap-2 text-sm">
        <Row icon="🌍" label={t('ch_region')} value={mode ? t(`mode_${mode}` as never) : '—'} />
        <Row icon="🎒" label={t('ch_difficulty')} value={difficulty ? t(`diff_${difficulty}` as never) : '—'} />
        <Row icon="⏱️" label={t('ch_format')} value={t('ch_formatValue', { n: rounds, s: seconds })} />
      </div>
      <p className="mt-2 text-center text-[11px] sm:text-xs text-muted-foreground">🔒 {t('ch_fixed')}</p>
    </section>
  );

  // ── Errores (código inválido o lleno: mensaje genérico, D3) ──
  if (error) {
    return (
      <Shell onBack={onBack} title={t('ch_unavailableTitle')}>
        <section className="max-w-md mx-auto rounded-3xl border border-border bg-card/70 p-6 text-center">
          <Mascot state="sad" className="w-24 mx-auto" />
          <p className="mt-3 text-sm sm:text-base">{error === 'auth_required' ? t('friends_needLogin') : error === 'network' ? t('friends_errorNetwork') : t('ch_unavailable')}</p>
          {error === 'auth_required' && (
            <button onClick={() => { playButtonTap(); onSignIn(); }} className="btn3d mt-4 w-full rounded-2xl py-3 font-black text-primary-foreground" style={{ background: 'var(--grad-cta)' }}>{t('friends_signIn')}</button>
          )}
          <button onClick={() => { playButtonTap(); onBack(); }} className="mt-3 w-full rounded-2xl py-2.5 border border-border bg-muted/20 font-bold text-sm hover:bg-muted">🏠 {t('ob_backHome')}</button>
        </section>
      </Shell>
    );
  }

  // ── Invitado: aceptar ──
  if (preview && !challenge) {
    return (
      <Shell onBack={onBack} title={t('ch_inviteTitle', { name: preview.creator_name })} subtitle={t('ch_inviteSub')}>
        <div className="grid gap-4 md:grid-cols-2 md:items-start">
          <section className="rounded-3xl border border-accent/40 bg-card/70 p-5 text-center flex flex-col items-center">
            <Mascot state="wink" className="w-24 sm:w-28 short:w-16" />
            <p className="mt-2 text-lg sm:text-xl font-black">{preview.creator_name}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">{t('ch_inviteFrom')}</p>
            <p className="mt-3 font-mono font-black text-2xl tracking-[0.4em] text-accent">{preview.code}</p>
          </section>
          <div className="flex flex-col gap-4">
            {conditions}
            <p className="rounded-2xl border border-border bg-muted/20 p-3 text-xs sm:text-sm text-muted-foreground">ⓘ {t('ch_restartNote')}</p>
          </div>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-[1.4fr_1fr]">
          <button onClick={accept} disabled={busy} className="btn3d rounded-2xl py-3.5 short:py-2.5 font-black text-lg text-primary-foreground disabled:opacity-60" style={{ background: 'var(--grad-cta)' }}>
            {busy ? '⏳' : '▶'} {t('ch_accept')}
          </button>
          <button onClick={() => { playButtonTap(); onBack(); }} className="rounded-2xl py-3 border border-border bg-muted/20 font-bold hover:bg-muted">{t('ch_notNow')}</button>
        </div>
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
    return <ChallengeResultScreen detail={detail} onBack={onBack} onCreateAnother={onCreateAnother} onRefresh={refresh} />;
  }

  // ── Reto creado / estado ──
  const meFinished = detail?.my_finished ?? false;
  const rival = detail?.rival ?? null;
  const youStatus = meFinished ? { label: t('ch_statusDone'), cls: 'border-accent text-accent' } : { label: t('ch_statusNotPlayed'), cls: 'border-primary text-primary' };
  const rivalStatus = !rival ? { label: t('ch_statusToJoin'), cls: 'border-accent/60 text-accent' }
    : rival.finished ? { label: t('ch_statusDone'), cls: 'border-accent text-accent' }
    : { label: t('ch_statusJoined'), cls: 'border-primary text-primary' };

  return (
    <Shell onBack={onBack} title={challenge.is_creator ? t('ch_createdTitle') : t('ch_statusTitle')} subtitle={t('ch_createdSub')}>
      <div className="grid gap-4 md:grid-cols-2 md:items-start">
        <section className="rounded-3xl border border-accent/40 bg-card/70 p-4 sm:p-5 flex flex-col items-center text-center">
          <Mascot state="celebrate" className="w-24 sm:w-28 short:w-14" />
          <p className="mt-2 text-lg sm:text-xl font-black">{t('ch_codeLead')} <span className="text-primary">{t('ch_codeTail')}</span></p>
          <div className="mt-2 flex items-stretch gap-2 w-full max-w-sm">
            <span className="flex-1 rounded-2xl border border-border bg-muted/30 py-2.5 font-mono font-black text-2xl sm:text-3xl tracking-[0.45em] pl-[0.45em]">{challenge.code}</span>
            <button onClick={copy} className="rounded-2xl border border-accent/60 text-accent px-3 font-bold text-sm hover:bg-accent/10 active:scale-95">
              {copied ? '✓' : '📋'} <span className="hidden min-[420px]:inline">{copied ? t('ch_copied') : t('ch_copy')}</span>
            </button>
          </div>
          <button onClick={share} className="mt-3 w-full max-w-sm rounded-2xl py-3 border-2 border-accent text-accent font-black hover:bg-accent/10 active:scale-[0.98]">
            🔗 {t('ch_share')}
          </button>
          <p className="mt-1.5 text-[11px] sm:text-xs text-muted-foreground">{t('ch_shareHint')}</p>
        </section>

        <div className="flex flex-col gap-4">
          {conditions}
          <section className="rounded-3xl border border-border bg-card/70 p-4 sm:p-5">
            <h2 className="text-lg sm:text-xl font-black mb-3">👥 {t('ch_participants')}</h2>
            <div className="flex flex-col gap-2">
              <Participant name={t('ch_you')} status={youStatus} me />
              <Participant name={rival?.name ?? t('ch_yourFriend')} status={rivalStatus} />
            </div>
          </section>
        </div>
      </div>

      <p className="mt-4 rounded-2xl border border-border bg-muted/20 p-3 text-center text-xs sm:text-sm">
        ⓘ <b>{t('ch_startNow')}</b> <span className="text-muted-foreground">{t('ch_compareWhenBoth')}</span>
      </p>

      <div className="mt-4 grid gap-2 sm:grid-cols-[1.4fr_1fr]">
        {!meFinished ? (
          <button onClick={() => { playButtonTap(); onPlay(challenge); }} className="btn3d rounded-2xl py-3.5 short:py-2.5 font-black text-lg text-primary-foreground" style={{ background: 'var(--grad-cta)' }}>
            ▶ {t('ch_playMine')}
          </button>
        ) : (
          <div className="rounded-2xl border border-accent/50 bg-accent/10 py-3 text-center font-bold text-accent">
            {detail?.status === 'completed' ? t('ch_resultReady') : t('ch_waitingFriend')}
          </div>
        )}
        <button onClick={() => { playButtonTap(); onBack(); }} className="rounded-2xl py-3 border border-border bg-muted/20 font-bold hover:bg-muted">🏠 {t('ob_backHome')}</button>
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

function Row({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/20 px-3 py-2">
      <span aria-hidden>{icon}</span>
      <span className="flex-1 text-muted-foreground">{label}</span>
      <span className="font-black">{value}</span>
    </div>
  );
}

function Participant({ name, status, me }: { name: string; status: { label: string; cls: string }; me?: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/20 px-3 py-2">
      <Mascot state={me ? 'idle' : 'wink'} className={`w-8 shrink-0 ${me ? '' : 'hue-rotate-[140deg] opacity-80'}`} />
      <span className="flex-1 font-bold truncate">{name}</span>
      <span className={`rounded-full border px-2.5 py-0.5 text-[11px] sm:text-xs font-bold whitespace-nowrap ${status.cls}`}>● {status.label}</span>
    </div>
  );
}
