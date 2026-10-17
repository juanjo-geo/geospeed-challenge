import { useState } from 'react';
import { type RoundResult } from './GameScreen';
import { formatDistance } from '@/lib/gameUtils';
import { useI18n } from '@/i18n';
import Mascot, { type MascotState } from './Mascot';
import Flag from '@/components/ui/Flag';
import CountryPhoto from '@/components/ui/CountryPhoto';
import { playAccordion } from '@/lib/sounds';

interface RoundFeedbackCardProps {
  result: RoundResult;
  feedback: { emoji: string; phrase: string; color: string };
  mascot: MascotState;
  streak: number;
  streakBonus: number;
  diffMult: number;
  multLabel: string;
  nearMissMsg: string | null;
  autoAdvanceTimer: number;
  onNext: () => void;
  size?: 'md' | 'lg';
}

/**
 * Tarjeta de feedback de ronda (maqueta Feedback_Movil/Computador_APROBADA_v1):
 * mascota + frase · ciudad · +puntos · Distancia / Tiempo · "Ver cálculo" · SIGUIENTE · "Avanza en N s".
 */
export default function RoundFeedbackCard({ result, feedback, mascot, streak, streakBonus, diffMult, multLabel, nearMissMsg, autoAdvanceTimer, onNext, size = 'md' }: RoundFeedbackCardProps) {
  const { t } = useI18n();
  const [showCalc, setShowCalc] = useState(false);
  const lg = size === 'lg';

  return (
    <div className={`flex flex-col gap-2 rounded-3xl border border-border/80 bg-card/85 shadow-2xl backdrop-blur-md overflow-y-auto w-full ${lg ? 'p-5 gap-3 max-h-[90%]' : 'p-3 sm:p-4 max-h-full [@media(max-height:420px)]:gap-1 [@media(max-height:420px)]:p-2'}`}>
      {/* Foto del país (D7): solo si existe el archivo; oculta en pantallas bajas */}
      <CountryPhoto country={result.city.country} size="sm" className={`-mx-3 -mt-3 sm:-mx-4 sm:-mt-4 h-20 rounded-t-3xl ${lg ? '' : '[@media(max-height:420px)]:hidden'}`} />
      <div className="text-center">
        <Mascot state={mascot} className={`mx-auto ${lg ? 'w-20' : 'w-12 sm:w-16 [@media(max-height:420px)]:hidden'}`} />
        <p className={`font-black ${feedback.color} ${lg ? 'text-3xl mt-1' : 'text-lg sm:text-2xl [@media(max-height:420px)]:text-base'}`}>{feedback.phrase}</p>
        {streak >= 2 && (
          <p className={`animate-score-pop font-bold text-primary ${lg ? 'text-sm' : 'text-[11px] sm:text-xs'}`}>
            🔥 {t('game_streakCount', { n: streak })}{streakBonus > 1 && ` · +${Math.round((streakBonus - 1) * 100)}%`}
          </p>
        )}
        {nearMissMsg && (
          <p className={`font-bold text-primary/90 animate-pulse ${lg ? 'text-sm' : 'text-[11px] sm:text-xs'}`}>💨 {nearMissMsg}</p>
        )}
        {/* En pantallas muy bajas el país va en la misma línea que la ciudad */}
        <h3 className={`font-black mt-1 ${lg ? 'text-2xl' : 'text-base sm:text-xl [@media(max-height:420px)]:mt-0'}`}>
          {result.city.name}
          {!lg && <span className="hidden [@media(max-height:420px)]:inline text-xs font-semibold text-muted-foreground"> · {result.city.country}</span>}
        </h3>
        <p className={`text-muted-foreground ${lg ? 'text-sm' : 'text-[11px] sm:text-xs [@media(max-height:420px)]:hidden'}`}><Flag country={result.city.country} className="w-4 inline-block align-[-2px] mr-1" />{result.city.country}</p>
        <p className={`font-black font-mono text-primary ${lg ? 'text-4xl mt-1' : 'text-2xl sm:text-3xl [@media(max-height:420px)]:text-xl'}`} style={{ textShadow: '0 0 14px hsl(var(--primary)/0.4)' }}>
          +{result.totalPoints.toLocaleString()} <span className={`font-bold text-foreground ${lg ? 'text-lg' : 'text-sm'}`}>pts</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl border border-border bg-muted/30 p-2 sm:p-2.5 [@media(max-height:420px)]:p-1.5 flex items-center gap-2">
          <span className={lg ? 'text-2xl' : 'text-lg'} aria-hidden>📍</span>
          <span>
            <span className="block text-[10px] text-muted-foreground">{t('game_distance')}</span>
            <span className={`block font-mono font-black ${lg ? 'text-xl' : 'text-sm sm:text-base'}`}>{formatDistance(result.distance)}</span>
          </span>
        </div>
        <div className="rounded-2xl border border-border bg-muted/30 p-2 sm:p-2.5 [@media(max-height:420px)]:p-1.5 flex items-center gap-2">
          <span className={lg ? 'text-2xl' : 'text-lg'} aria-hidden>⏱️</span>
          <span>
            <span className="block text-[10px] text-muted-foreground">{t('game_time')}</span>
            <span className={`block font-mono font-black ${lg ? 'text-xl' : 'text-sm sm:text-base'}`}>{result.timeUsed} s</span>
          </span>
        </div>
      </div>

      <button
        onClick={() => { playAccordion(!showCalc); setShowCalc(v => !v); }}
        className="text-xs sm:text-sm font-bold text-accent hover:underline flex items-center justify-center gap-1"
        aria-expanded={showCalc}
      >
        {t('game_seeCalc')} <span className={`transition-transform ${showCalc ? 'rotate-180' : ''}`}>⌄</span>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${showCalc ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="rounded-2xl border border-border bg-muted/20 px-3 py-2 text-xs sm:text-sm font-mono">
          <CalcRow label={t('game_calcBase')} value={`${result.basePoints}`} />
          <CalcRow label={`${t('game_calcSpeed')} · ${result.timeUsed} s`} value={`× ${result.multiplier.toFixed(2)}`} hint={multLabel} />
          {streakBonus > 1 && <CalcRow label={t('game_calcStreak')} value={`× ${streakBonus.toFixed(2)}`} />}
          {diffMult !== 1 && <CalcRow label={t('game_calcDifficulty')} value={`× ${diffMult.toFixed(2)}`} />}
          <div className="flex justify-between border-t border-border/60 mt-1 pt-1 font-black text-primary">
            <span>{t('game_total')}</span><span>{result.totalPoints.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <button
        onClick={onNext}
        className={`btn3d w-full rounded-2xl font-black text-primary-foreground ${lg ? 'py-3.5 text-lg' : 'py-2.5 sm:py-3 text-sm sm:text-base [@media(max-height:420px)]:py-2'}`}
        style={{ background: 'var(--grad-cta)' }}
        aria-label={`${t('game_next')}, ${t('game_advanceIn', { seconds: autoAdvanceTimer })}`}
      >
        {t('game_next')} →
        {!lg && <span className="hidden [@media(max-height:420px)]:inline font-semibold opacity-75"> · {autoAdvanceTimer} s</span>}
      </button>
      <p className={`text-center text-[10px] sm:text-xs text-muted-foreground ${lg ? '' : '[@media(max-height:420px)]:hidden'}`}>{t('game_advanceIn', { seconds: autoAdvanceTimer })}</p>
    </div>
  );
}

function CalcRow({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex justify-between gap-2 py-0.5">
      <span className="text-muted-foreground truncate">{label}{hint ? <span className="ml-1 opacity-70">({hint})</span> : null}</span>
      <span className="font-bold shrink-0">{value}</span>
    </div>
  );
}
