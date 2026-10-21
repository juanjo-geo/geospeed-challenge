import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n';
import { playButtonTap, playShareSuccess } from '@/lib/sounds';
import { trackEvent } from '@/lib/analytics';
import {
  dailyShareText, gridEmojis, markBadgesSeen, milestoneOf, type DailyInvite, type DailyStatus,
} from '@/lib/dailyChallenge';
import { requestOpenStreak } from './StreakChip';

export interface DailyFinish {
  dailyNo: number;
  hits: number;
  total: number;
  timeMs: number;
  grid: string;
}

interface Props {
  result: DailyFinish;
  /** Estado del servidor tras guardar (racha nueva, insignias); null mientras llega o sin sesión */
  status: DailyStatus | null;
  /** Llegó por el link de un amigo: su resultado para comparar */
  invite: DailyInvite | null;
  playerName: string;
  isGuest: boolean;
  onCreateAccount?: () => void;
}

/**
 * Cierre del desafío diario (Fase 2): cuadritos 🟩🟨🟥 sin revelar ciudades, racha 🔥 (del servidor),
 * hito ganado con su premio, comparación con quien envió el link y botones para compartir:
 * WhatsApp (principal), más opciones (menú del sistema) y copiar.
 */
export default function DailyResultPanel({ result, status, invite, playerName, isGuest, onCreateAccount }: Props) {
  const { t, locale } = useI18n();
  const [copied, setCopied] = useState(false);
  const streak = status?.current_streak ?? 0;
  const newBadges = (status?.badges ?? []).filter((b) => !b.seen).map((b) => milestoneOf(b.id)).filter(Boolean);

  // Las insignias nuevas se celebran una vez
  useEffect(() => {
    const ids = (status?.badges ?? []).filter((b) => !b.seen).map((b) => b.id);
    if (ids.length) markBadgesSeen(ids);
  }, [status]);

  const share = { dailyNo: result.dailyNo, hits: result.hits, total: result.total, timeMs: result.timeMs, grid: result.grid, streak, name: playerName, lang: locale };
  const text = dailyShareText(share, t as never);

  const shareWhatsApp = () => {
    playShareSuccess();
    trackEvent('daily_share', { channel: 'whatsapp', daily_no: result.dailyNo });
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  };
  const shareMore = async () => {
    playButtonTap();
    trackEvent('daily_share', { channel: 'native', daily_no: result.dailyNo });
    if (navigator.share) {
      try { await navigator.share({ text }); return; } catch { /* cancelado: se copia */ }
    }
    await copy();
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* sin portapapeles */ }
    trackEvent('daily_share', { channel: 'copy', daily_no: result.dailyNo });
  };

  const mySeconds = Math.round(result.timeMs / 1000);
  const beat = invite ? (result.hits > invite.hits || (result.hits === invite.hits && mySeconds < invite.timeS)) : false;
  const tie = invite ? result.hits === invite.hits && mySeconds === invite.timeS : false;

  return (
    <section className="rounded-3xl border-2 border-primary/50 bg-card/80 p-4 shadow-[0_0_24px_hsl(var(--primary)/0.15)] mb-4" aria-label={t('daily_resultTitle', { n: result.dailyNo })}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-extrabold text-lg">{t('daily_resultTitle', { n: result.dailyNo })}</h2>
        <button onClick={() => { playButtonTap(); requestOpenStreak(); }} className="rounded-full border-2 border-primary/60 px-2.5 py-0.5 text-sm font-extrabold text-primary" aria-label={t('streak_chipAria', { n: streak })}>
          🔥 {status ? streak : '…'}
        </button>
      </div>
      <p className="mt-1 text-2xl font-black">{result.hits}/{result.total} <span className="text-base font-bold text-muted-foreground">· {mySeconds} s</span></p>
      <p className="mt-1 text-xl tracking-[0.12em] leading-snug break-all" aria-label={t('daily_gridAria', { hits: result.hits, total: result.total })}>{gridEmojis(result.grid)}</p>
      <p className="text-[11px] text-muted-foreground">{t('daily_gridLegend')}</p>

      {newBadges.map((m) => (
        <div key={m!.badge} className="mt-3 rounded-2xl border-2 border-primary bg-primary/15 p-3 flex items-center gap-3 animate-score-pop">
          <span className="text-4xl" aria-hidden>{m!.emoji}</span>
          <span>
            <span className="block text-xs font-bold uppercase tracking-wide text-primary">{t('streak_newBadge')}</span>
            <span className="block font-extrabold">{t(m!.nameKey as never)}</span>
            <span className="block text-xs text-foreground/80">{t(m!.rewardKey as never)}</span>
          </span>
        </div>
      ))}

      {invite && (
        <div className="mt-3 rounded-2xl border border-accent/50 bg-accent/10 p-3 text-sm">
          <p className="font-bold">{tie ? t('daily_inviteTie', { name: invite.name }) : beat ? t('daily_inviteWin', { name: invite.name }) : t('daily_inviteLose', { name: invite.name })}</p>
          <p className="mt-0.5 text-foreground/80">{t('daily_inviteCompare', { hits: result.hits, total: result.total, s: mySeconds, name: invite.name, ohits: invite.hits, os: invite.timeS })}</p>
          {isGuest && onCreateAccount && (
            <button onClick={() => { playButtonTap(); onCreateAccount(); }} className="mt-2 text-accent font-bold underline">{t('daily_inviteSignup')}</button>
          )}
        </div>
      )}

      <div className="mt-3 grid grid-cols-[1fr_auto_auto] gap-2">
        <button onClick={shareWhatsApp} className="btn3d rounded-2xl py-2.5 font-black text-primary-foreground flex items-center justify-center gap-2" style={{ background: 'var(--grad-cta)' }}>
          <WhatsAppIcon className="w-5 h-5" /> {t('daily_shareWhatsApp')}
        </button>
        <button onClick={shareMore} className="rounded-2xl border-2 border-accent/50 px-3 font-bold hover:bg-accent/10" aria-label={t('daily_shareMore')} title={t('daily_shareMore')}>
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4" /></svg>
        </button>
        <button onClick={copy} className="rounded-2xl border-2 border-accent/50 px-3 font-bold hover:bg-accent/10 text-sm" aria-label={t('daily_copy')}>
          {copied ? '✓' : t('daily_copy')}
        </button>
      </div>
    </section>
  );
}

function WhatsAppIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4a.5.5 0 0 0 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7a2.8 2.8 0 0 0 1.8-1.3 2.3 2.3 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3Z" />
    </svg>
  );
}
