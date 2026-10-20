/**
 * Juice por nivel de combo (puntaje v2, especificación §7). Sonido, vibración y música se disparan en el
 * mismo instante del clic (< 100 ms); lo visual lo pinta `ComboFx` con el mismo nivel.
 *
 * | Nivel            | Sonido                          | Visual                                   | Vibración   |
 * | acierto normal   | ding base                       | número salta, onda en el pin              | ligera      |
 * | ×1,2 Buen ritmo  | tono +6 %                       | número turquesa, chispas en el pin        | ligera      |
 * | ×1,5 ¡Imparable! | tono +12 %                      | brillo en los bordes, el contador crece   | media       |
 * | ×2,0 ¡Turbo!     | tono +18 % + capa rítmica       | estela del cursor, pulso del fondo        | media       |
 * | ×2,5 ¡EN LLAMAS! | tono +24 % + música completa    | fuego en el contador, mascota, leve zoom  | fuerte      |
 * | combo roto       | campana descendente suave       | temblor corto (150 ms), contador se apaga | doble ligera|
 */
import { playComboDing, playComboBreak, playCoinSparkle, playComboRhythm } from './sounds';
import { hapticCombo } from './haptics';
import { setMusicIntensity } from '@/hooks/useBackgroundMusic';
import type { Quality } from './scoring';

export function playComboFeedback(
  r: { quality: Quality; comboLevel: number; broke: boolean },
  prevLevel: number,
  opts: { perfect?: boolean; ding?: boolean } = {},
) {
  if (r.quality !== 'miss') {
    if (opts.ding !== false) playComboDing(r.comboLevel);
    if (opts.perfect) playCoinSparkle();
    if (r.comboLevel >= 3 && r.comboLevel > prevLevel) playComboRhythm(r.comboLevel);
    hapticCombo(r.comboLevel);
  } else if (r.broke) {
    playComboBreak();
    hapticCombo('broke');
  }
  // Un regular mantiene el nivel; un fallo lo apaga
  setMusicIntensity(r.quality === 'miss' ? 0 : r.comboLevel);
}

/** Al empezar o terminar una partida la música vuelve a su estado normal */
export function resetComboJuice() {
  setMusicIntensity(0);
}
