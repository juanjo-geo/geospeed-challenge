import { useI18n } from '@/i18n';
import { formatNumber } from '@/lib/format';
import { playButtonTap } from '@/lib/sounds';

/**
 * Carrera contra el fantasma (Fase 3, docs/GeoSpeed_Plan_Competencia.md §8): piezas de la partida de un reto
 * cuando el rival ya jugó. GameScreen decide cuándo se ven; aquí solo se dibujan.
 *  - GhostSideCard / GhostChip: "Tú vs Juanjo" con los dos puntajes acumulados y la ventaja.
 *  - GhostPulse: "Juanjo ya respondió · 2,1 s" en el segundo exacto (sin decir dónde).
 *  - GhostCompare: después de responder, distancia · tiempo · puntos de los dos y la ventaja de la ronda.
 *  - GhostResultPanel: al terminar, quién ganó y el botón a la comparación por ciudad (con revancha).
 */

/** Cara del rival: su emoji si eligió uno; si no, el Explorador en turquesa (el color del rival en el mapa) */
export function GhostFace({ avatar, className = 'w-7 h-7' }: { avatar: string | null; className?: string }) {
  const emoji = avatar && avatar !== 'mascot' ? avatar : null;
  return (
    <span className={`relative inline-flex shrink-0 items-center justify-center rounded-full border-2 border-accent bg-brand-navy-deep overflow-hidden ${className}`} aria-hidden>
      {emoji ? <span className="text-[0.95em] leading-none">{emoji}</span> : (
        <span className="inline-flex w-[82%] h-[82%]" style={{ filter: 'hue-rotate(150deg) saturate(1.3)' }}>
          <img src="/mascot/explorer-logo.webp" alt="" className="w-full h-full object-contain" />
        </span>
      )}
    </span>
  );
}

const signed = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : '±'}${formatNumber(Math.abs(n))}`;

/** Panel lateral (escritorio / tableta): debajo de PUNTOS, mismo estilo de tarjeta */
export function GhostSideCard({ name, avatar, rivalScore, myScore, pulse }: { name: string; avatar: string | null; rivalScore: number; myScore: number; pulse: boolean }) {
  const lead = myScore - rivalScore;
  return (
    <div className={`relative w-full shrink-0 rounded-2xl border-2 bg-background/40 px-[5cqi] py-[3cqi] flex items-center gap-[4cqi] transition-colors ${pulse ? 'border-accent' : 'border-accent/30'}`}>
      <span className="relative inline-flex">
        <GhostFace avatar={avatar} className="w-[13cqi] h-[13cqi] text-[8cqi]" />
        {pulse && <span className="absolute inset-0 rounded-full border-2 border-accent animate-ping" aria-hidden />}
      </span>
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block text-[6.6cqi] font-semibold uppercase tracking-wide truncate">{name}</span>
        <span className="block text-[9.5cqi] font-extrabold leading-none text-accent">{formatNumber(rivalScore)}</span>
      </span>
      <LeadBadge lead={lead} className="text-[6.4cqi] px-[2.6cqi] py-[0.8cqi]" />
    </div>
  );
}

function LeadBadge({ lead, className }: { lead: number; className: string }) {
  const { t } = useI18n();
  const tone = lead > 0 ? 'border-accent/70 text-accent' : lead < 0 ? 'border-destructive/70 text-destructive' : 'border-foreground/30 text-foreground/80';
  return (
    <span className={`shrink-0 rounded-full border-2 font-extrabold whitespace-nowrap ${tone} ${className}`} title={lead > 0 ? t('ghost_lead', { n: formatNumber(lead) }) : lead < 0 ? t('ghost_behind', { n: formatNumber(-lead) }) : t('ghost_tied')}>
      {lead === 0 ? '=' : signed(lead)}
    </span>
  );
}

/** Encabezado compacto (celular horizontal): ficha "🟢 Juanjo 3.980 · +340" */
export function GhostChip({ name, avatar, rivalScore, myScore, pulse }: { name: string; avatar: string | null; rivalScore: number; myScore: number; pulse: boolean }) {
  const lead = myScore - rivalScore;
  return (
    <span className={`relative inline-flex items-center gap-1 rounded-full pl-0.5 pr-1.5 py-0.5 border backdrop-blur-md whitespace-nowrap transition-colors ${pulse ? 'border-accent' : 'border-accent/40'}`} style={{ background: 'hsl(var(--brand-navy-deep) / 0.75)' }} aria-label={`${name} ${formatNumber(rivalScore)}`}>
      <span className="relative inline-flex">
        <GhostFace avatar={avatar} className="w-4 h-4 text-[9px] border" />
        {pulse && <span className="absolute inset-0 rounded-full border border-accent animate-ping" aria-hidden />}
      </span>
      <span className="max-w-[64px] truncate text-foreground/90">{name}</span>
      <span className="font-black text-accent">{formatNumber(rivalScore)}</span>
      <LeadBadge lead={lead} className="text-[10px] px-1 py-0 border" />
    </span>
  );
}

/** Aviso sobre el mapa cuando el rival respondió esta ciudad (no dice dónde) */
export function GhostPulse({ name, avatar, seconds }: { name: string; avatar: string | null; seconds: number }) {
  const { t } = useI18n();
  return (
    <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 z-20 animate-fade-in" style={{ top: 'max(0.6rem, var(--sat))' }} role="status" aria-live="polite">
      <div className="flex items-center gap-2 rounded-full border-2 border-accent bg-brand-navy-deep/90 pl-1 pr-3.5 py-1 shadow-[0_0_18px_hsl(var(--accent)/0.45)] backdrop-blur-md">
        <span className="relative inline-flex">
          <GhostFace avatar={avatar} className="w-7 h-7 text-base" />
          <span className="absolute inset-0 rounded-full border-2 border-accent animate-ping" aria-hidden />
        </span>
        <span className="text-sm font-extrabold whitespace-nowrap">{t('ghost_answered', { name, s: formatNumber(seconds, 1) })}</span>
      </div>
    </div>
  );
}

export interface GhostSide { km: number | null; seconds: number | null; points: number }

/** Comparación de la ronda dentro de la tarjeta de respuesta */
export function GhostCompare({ name, avatar, me, rival }: { name: string; avatar: string | null; me: GhostSide; rival: GhostSide | null }) {
  const { t } = useI18n();
  const line = (s: GhostSide) => [s.km != null ? `${formatNumber(Math.round(s.km))} km` : null, s.seconds != null ? `${formatNumber(s.seconds, 1)} s` : null, `+${formatNumber(s.points)}`].filter(Boolean).join(' · ');
  if (!rival) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-accent/40 bg-background/40 px-3 py-2 text-xs sm:text-sm">
        <GhostFace avatar={avatar} className="w-6 h-6 text-sm" />
        <span className="font-semibold text-foreground/85">{t('ghost_noRound', { name })}</span>
      </div>
    );
  }
  const dPts = me.points - rival.points;
  const dS = me.seconds != null && rival.seconds != null ? Math.round((me.seconds - rival.seconds) * 10) / 10 : null;
  return (
    <div className="rounded-xl border border-accent/40 bg-background/40 px-3 py-2 text-xs sm:text-sm">
      <div className="grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-1">
        <span className="font-extrabold text-primary">{t('ch_you')}</span>
        <span className="font-semibold text-foreground/90 truncate">{line(me)}</span>
        <span className="flex items-center gap-1.5 font-extrabold text-accent min-w-0"><GhostFace avatar={avatar} className="w-5 h-5 text-xs border" /><span className="truncate max-w-[90px]">{name}</span></span>
        <span className="font-semibold text-foreground/90 truncate">{line(rival)}</span>
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <span className={`rounded-full border-2 px-2 py-0.5 font-extrabold ${dPts >= 0 ? 'border-accent/70 text-accent' : 'border-destructive/70 text-destructive'}`}>{signed(dPts)} pts</span>
        {dS != null && dS !== 0 && (
          <span className={`rounded-full border-2 px-2 py-0.5 font-extrabold ${dS < 0 ? 'border-accent/70 text-accent' : 'border-destructive/70 text-destructive'}`}>
            {dS < 0 ? t('ghost_faster', { s: formatNumber(-dS, 1) }) : t('ghost_slower', { s: formatNumber(dS, 1) })}
          </span>
        )}
      </div>
    </div>
  );
}

/** Cierre de la partida del reto: resultado de la carrera y la comparación por ciudad (con revancha) */
export function GhostResultPanel({ name, avatar, myScore, rivalScore, citiesWon, total, onCompare }: { name: string; avatar: string | null; myScore: number; rivalScore: number; citiesWon: number; total: number; onCompare?: () => void }) {
  const { t } = useI18n();
  const diff = myScore - rivalScore;
  const title = diff > 0 ? t('ghost_resultWin', { name }) : diff < 0 ? t('ghost_resultLose', { name, n: formatNumber(-diff) }) : t('ghost_resultTie', { name });
  return (
    <div className={`rounded-2xl border-2 p-4 ${diff > 0 ? 'border-accent/70' : diff < 0 ? 'border-destructive/50' : 'border-primary/60'} bg-background/40`}>
      <div className="flex items-center gap-3">
        <GhostFace avatar={avatar} className="w-11 h-11 text-2xl" />
        <div className="min-w-0">
          <p className={`text-lg sm:text-xl font-extrabold leading-tight ${diff > 0 ? 'text-accent' : diff < 0 ? 'text-foreground' : 'text-primary'}`}>{title}</p>
          <p className="text-sm text-foreground/85">
            <span className="font-bold text-primary">{t('ch_you')} {formatNumber(myScore)}</span> · <span className="font-bold text-accent">{name} {formatNumber(rivalScore)}</span>
          </p>
        </div>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{t('ghost_citiesWon', { n: citiesWon, total })}</p>
      {onCompare && (
        <button onClick={() => { playButtonTap(); onCompare(); }} className="btn3d mt-3 w-full rounded-2xl py-3 font-black text-primary-foreground" style={{ background: 'var(--grad-cta)' }}>
          {t('ghost_seeCompare')}
        </button>
      )}
    </div>
  );
}
