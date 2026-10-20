import { useState } from 'react';
import { type RoundResult } from './GameScreen';
import { formatDistance } from '@/lib/gameUtils';
import { useI18n } from '@/i18n';
import Mascot, { type MascotState } from './Mascot';
import Flag from '@/components/ui/Flag';
import CountryPhoto from '@/components/ui/CountryPhoto';
import { hasCountryPhoto } from '@/lib/countryPhotos';
import { playAccordion } from '@/lib/sounds';
import { appNumberLocale } from '@/lib/format';
import { COMBO_LEVELS } from '@/lib/scoring';

interface RoundFeedbackCardProps {
  result: RoundResult;
  feedback: { emoji: string; phrase: string; color: string };
  mascot: MascotState;
  nearMissMsg: string | null;
  autoAdvanceTimer: number;
  onNext: () => void;
  /** Tiempo ya formateado ("4,7 s"); si falta se usa timeUsed */
  timeLabel?: string;
  size?: 'md' | 'lg';
  /** Alto natural (sin tope ni scroll): lo usa FitToBox para escalar la tarjeta a la pantalla */
  natural?: boolean;
  /** 60s de Caos: el reloj global sigue corriendo, así que sin "Ver cálculo" ni "Avanza en N s" */
  quick?: boolean;
  /** Desafío Mundial: título (país correcto), subtítulo (futbolista), color de la frase y primera ficha */
  title?: string;
  subtitle?: string;
  phraseColor?: string;
  firstTile?: { label: string; value: string };
  /** Etiqueta de la base en "Ver cálculo" (Mundial: por zona, no por distancia) */
  baseLabel?: string;
}

/**
 * Tarjeta de feedback de ronda (maqueta Feedback_Movil/Computador_APROBADA_v1):
 * mascota + frase · ciudad · +puntos · Distancia / Tiempo · "Ver cálculo" · SIGUIENTE · "Avanza en N s".
 * Puntaje v2: el combo y el desglose (cercanía × rapidez × combo × dificultad) salen del propio resultado.
 */
export default function RoundFeedbackCard({ result, feedback, mascot, nearMissMsg, autoAdvanceTimer, onNext, timeLabel, size = 'md', natural = false, quick = false, title, subtitle, phraseColor: phraseColorProp, firstTile, baseLabel }: RoundFeedbackCardProps) {
  const { t, locale } = useI18n();
  const [showCalc, setShowCalc] = useState(false);
  const lg = size === 'lg';
  const numberLocale = locale === 'en' ? 'en-US' : 'es-CO';
  const time = timeLabel ?? `${result.timeUsed} s`;
  // Maqueta: las respuestas buenas en turquesa; las lejanas conservan su color de advertencia
  const phraseColor = phraseColorProp ?? (result.distance < 1000 ? 'text-accent' : feedback.color);
  const heading = title ?? result.city.name;
  const subheading = subtitle ?? result.city.country;
  const hasPhoto = hasCountryPhoto(result.city.country);
  const fmtX = (n: number) => `× ${n.toLocaleString(numberLocale, { minimumFractionDigits: n % 1 ? 1 : 0, maximumFractionDigits: 2 })}`;
  const comboLevel = result.comboLevel ?? 0;
  const comboKey = COMBO_LEVELS[comboLevel]?.key;
  const comboMult = result.comboMult ?? 1;
  const diffMult = result.diffMult ?? 1;
  // "🔥 ¡Imparable! × 1,5 · 5 aciertos seguidos" o, si se rompió, el aviso suave
  const comboLine = comboKey
    ? <>🔥 {t(comboKey)} {fmtX(comboMult)} · {t('game_streakCount', { n: result.combo ?? 0 })}</>
    : result.brokeCombo ? <span className="text-muted-foreground">💨 {t('combo_broken')}</span> : null;

  return (
    <div className={`flex flex-col gap-2 rounded-3xl border-2 border-accent/40 bg-card/90 shadow-2xl backdrop-blur-md overflow-y-auto w-full ${lg ? `p-5 gap-3 ${natural ? '' : 'max-h-[92%]'}` : `p-3 sm:p-4 ${natural ? '' : 'max-h-full'} [@media(max-height:420px)]:gap-1 [@media(max-height:420px)]:p-2`}`}>
      {/* Foto del país (D7) arriba y la mascota medio encima: así caben las dos también en un iPhone en
          horizontal (antes ambas se ocultaban con alto ≤ 420 px, p.ej. iPhone 16 Pro). Solo se quita la
          foto en pantallas diminutas (≤ 330 px de alto). */}
      <CountryPhoto country={result.city.country} size="sm" className={`rounded-t-3xl ${lg ? '-mx-5 -mt-5 h-24' : '-mx-3 -mt-3 sm:-mx-4 sm:-mt-4 h-20 [@media(max-height:420px)]:-mx-2 [@media(max-height:420px)]:-mt-2 [@media(max-height:420px)]:h-16 [@media(max-height:330px)]:hidden'}`} />
      {lg ? (
        <>
          <div className="flex items-center gap-4">
            <Mascot state={mascot} className="w-24 xl:w-28 shrink-0 drop-shadow-[0_8px_18px_hsl(var(--brand-navy-deep)/0.6)]" />
            <div className="min-w-0">
              <p className={`font-extrabold leading-none text-[2.4rem] ${phraseColor}`}>{feedback.phrase}</p>
              <h3 className="font-extrabold text-2xl mt-2 leading-tight">{heading}</h3>
              <p className="text-muted-foreground text-base font-semibold"><Flag country={result.city.country} className="w-5 inline-block align-[-3px] mr-1.5" />{subheading}</p>
            </div>
          </div>
          {(comboLine || nearMissMsg) && (
            <div className="text-center -my-1">
              {comboLine && (
                <p className="animate-score-pop font-bold text-primary text-sm">{comboLine}</p>
              )}
              {nearMissMsg && <p className="font-bold text-primary/90 animate-pulse text-sm">💨 {nearMissMsg}</p>}
            </div>
          )}
          <div className="rounded-2xl border-2 border-accent/30 bg-background/40 py-3 text-center">
            <p className="font-extrabold text-primary text-5xl leading-none" style={{ textShadow: '0 0 18px hsl(var(--primary)/0.35)' }}>
              +{result.totalPoints.toLocaleString(numberLocale)} {t('game_pointsWord')}
            </p>
          </div>
        </>
      ) : (
        <div className="text-center">
          <div className={`relative z-10 w-fit mx-auto ${hasPhoto ? '-mt-10 sm:-mt-11 [@media(max-height:420px)]:-mt-8 [@media(max-height:330px)]:!mt-0' : ''}`}>
            <Mascot state={mascot} className="w-14 sm:w-16 [@media(max-height:420px)]:w-11 drop-shadow-[0_6px_14px_hsl(var(--brand-navy-deep)/0.7)]" />
            <span className="absolute -left-4 top-1 text-primary text-xs [@media(max-height:420px)]:hidden" aria-hidden>✦</span>
            <span className="absolute -right-4 top-3 text-primary text-[10px] [@media(max-height:420px)]:hidden" aria-hidden>✦</span>
          </div>
          <p className={`font-extrabold ${phraseColor} text-2xl sm:text-3xl [@media(max-height:420px)]:text-lg leading-tight`}>{feedback.phrase}</p>
          {comboLine && (
            <p className="animate-score-pop font-bold text-primary text-[11px] sm:text-xs">{comboLine}</p>
          )}
          {nearMissMsg && (
            <p className="font-bold text-primary/90 animate-pulse text-[11px] sm:text-xs">💨 {nearMissMsg}</p>
          )}
          {/* En pantallas muy bajas el país va en la misma línea que la ciudad */}
          <h3 className="font-extrabold mt-0.5 text-lg sm:text-xl [@media(max-height:420px)]:text-base [@media(max-height:420px)]:mt-0">
            {heading}
            <span className="hidden [@media(max-height:420px)]:inline text-xs font-semibold text-muted-foreground"> · {subheading}</span>
          </h3>
          <p className="text-muted-foreground font-semibold text-xs sm:text-sm [@media(max-height:420px)]:hidden"><Flag country={result.city.country} className="w-4 inline-block align-[-2px] mr-1" />{subheading}</p>
          <p className="font-extrabold text-primary text-3xl sm:text-4xl [@media(max-height:420px)]:text-xl leading-tight mt-0.5" style={{ textShadow: '0 0 14px hsl(var(--primary)/0.4)' }}>
            +{result.totalPoints.toLocaleString(numberLocale)} {t('game_pointsWord')}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Tile lg={lg} label={firstTile?.label ?? t('game_distance')} value={firstTile?.value ?? formatDistance(result.distance)} icon={<path d="M12 22s7-7.2 7-12.5A7 7 0 0 0 5 9.5C5 14.8 12 22 12 22Zm0-9.6a2.9 2.9 0 1 0 0-5.8 2.9 2.9 0 0 0 0 5.8Z" fill="currentColor" stroke="none" />} />
        <Tile lg={lg} label={t('game_time')} value={time} icon={<><circle cx="12" cy="13.5" r="7.5" /><path d="M12 9.5v4l2.5 1.8" /><path d="M9.5 2.5h5" /><path d="M12 2.5v3.5" /></>} />
      </div>

      {!quick && <>
      <button
        onClick={() => { playAccordion(!showCalc); setShowCalc(v => !v); }}
        className="text-xs sm:text-sm font-bold text-accent hover:underline flex items-center justify-center gap-1"
        aria-expanded={showCalc}
      >
        {t('game_seeCalc')} <span className={`transition-transform ${showCalc ? 'rotate-180' : ''}`}>⌄</span>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${showCalc ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="rounded-2xl border border-border bg-muted/20 px-3 py-2 text-xs sm:text-sm font-mono">
          <CalcRow label={baseLabel ?? t('game_calcBase')} value={result.basePoints.toLocaleString(numberLocale)} />
          <CalcRow label={`${t('game_calcSpeed')} · ${time}`} value={fmtX(result.multiplier)} />
          <CalcRow label={comboKey ? `${t('game_calcStreak')} · ${t(comboKey)}` : t('game_calcStreak')} value={fmtX(comboMult)} />
          {diffMult !== 1 && <CalcRow label={t('game_calcDifficulty')} value={fmtX(diffMult)} />}
          <div className="flex justify-between border-t border-border/60 mt-1 pt-1 font-black text-primary">
            <span>{t('game_total')}</span><span>{result.totalPoints.toLocaleString(appNumberLocale())}</span>
          </div>
        </div>
      </div>
      </>}

      <button
        onClick={onNext}
        className={`btn3d w-full rounded-2xl font-black text-primary-foreground tracking-wide ${lg ? 'py-4 text-xl' : 'py-2.5 sm:py-3 text-base sm:text-lg [@media(max-height:420px)]:py-2 [@media(max-height:420px)]:text-sm'}`}
        style={{ background: 'var(--grad-cta)' }}
        aria-label={quick ? t('game_next') : `${t('game_next')}, ${t('game_advanceIn', { seconds: autoAdvanceTimer })}`}
      >
        {t('game_next')} →
        {!lg && !quick && <span className="hidden [@media(max-height:420px)]:inline font-semibold opacity-75"> · {autoAdvanceTimer} s</span>}
      </button>
      {!quick && <p className={`text-center text-muted-foreground ${lg ? 'text-sm' : 'text-[11px] sm:text-xs [@media(max-height:420px)]:hidden'}`}>{t('game_advanceIn', { seconds: autoAdvanceTimer })}</p>}
    </div>
  );
}

function CalcRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2 py-0.5">
      <span className="text-muted-foreground truncate">{label}</span>
      <span className="font-bold shrink-0">{value}</span>
    </div>
  );
}

function Tile({ lg, label, value, icon }: { lg: boolean; label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className={`rounded-2xl border border-accent/30 bg-background/40 flex items-center gap-2.5 ${lg ? 'px-4 py-3' : 'p-2 sm:p-2.5 [@media(max-height:420px)]:p-1.5'}`}>
      <svg viewBox="0 0 24 24" className={`text-accent shrink-0 ${lg ? 'w-8 h-8' : 'w-5 h-5 sm:w-6 sm:h-6'}`} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{icon}</svg>
      <span className="min-w-0">
        <span className={`block text-muted-foreground ${lg ? 'text-sm' : 'text-[10px] sm:text-xs'}`}>{label}</span>
        <span className={`block font-extrabold leading-tight ${lg ? 'text-2xl' : 'text-sm sm:text-base'}`}>{value}</span>
      </span>
    </div>
  );
}
