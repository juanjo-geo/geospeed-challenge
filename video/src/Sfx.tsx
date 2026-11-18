/**
 * Efectos de sonido: cada señal es [cuadro, archivo de public/sfx, volumen]. Los archivos los genera
 * scripts/make-sfx.mjs (sintetizados, sin licencias de terceros).
 */
import { Audio, Sequence, staticFile } from 'remotion';

export type Cue = [frame: number, name: string, volume?: number];

export const Sfx = ({ cues, offset = 0 }: { cues: Cue[]; offset?: number }) => (
  <>
    {cues.map(([at, name, volume = 0.6], i) => (
      <Sequence key={`${offset}-${i}`} from={offset + at} layout="none">
        <Audio src={staticFile(`sfx/${name}.wav`)} volume={volume * SFX_GAIN} />
      </Sequence>
    ))}
  </>
);

/**
 * Volumen de la música (public/music/track-video.wav). La canción del juego viene grabada muy bajita (pico 0,04):
 * track-video.wav es la misma canción subida 16 veces; el juego la sube con su propio control de volumen.
 */
export const MUSIC_VOLUME = 0.7;
/** Volumen general de los efectos: que la suma con la música no sature */
const SFX_GAIN = 1.17;
