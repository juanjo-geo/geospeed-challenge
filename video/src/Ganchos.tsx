/**
 * Serie para TikTok e Instagram (noviembre 2026): 2,5 s de una toma con personas (hecha con IA en Higgsfield,
 * Seedance 2.0) con un texto al estilo de la app, y después el corte vertical del juego real (Vertical.tsx) con
 * un cierre del Explorador de la biblioteca. Las tomas con personas obligan a marcar el video como hecho con IA.
 * Las tomas están como secuencias de imágenes en public/people/<toma>/f000.jpg (24 cuadros por segundo).
 */
import { useEffect, useState } from 'react';
import { AbsoluteFill, Audio, Img, Sequence, continueRender, delayRender, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { BRAND, loadBrandFonts } from './brand';
import { MUSIC_VOLUME, Sfx } from './Sfx';
import { Vertical, VERTICAL_FRAMES, type Hook } from './Vertical';
import { LangCtx, type Lang } from './lang';
import type { ClipId } from './MascotClip';

export const GANCHO_INTRO = 75;    // 2,5 s de persona
export const GANCHO_FRAMES = GANCHO_INTRO + VERTICAL_FRAMES;

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

type Two = readonly [string, string];
export interface GanchoDef {
  /** carpeta en public/people */
  shot: string;
  /** primer cuadro del clip y cuántos cuadros del clip avanzan por cuadro del video (0,8 = velocidad real) */
  from: number; rate: number;
  /** texto sobre la persona (estilo TikTok) */
  caption: Record<Lang, Two>;
  /** qué gancho del juego sigue y, si cambia, su titular */
  hook: Hook;
  hookText?: Record<Lang, Two>;
  mascot: ClipId;
}

export const GANCHOS = {
  profe: {
    shot: 'profe-clase', from: 58, rate: 0.82, hook: 'a', mascot: 'saluda',
    caption: { es: ['La profe proyectó esto en clase', 'y nadie quiso salir al recreo'], en: ['Our teacher put this on the projector', 'and nobody wanted to go to recess'] },
  },
  pareja: {
    shot: 'pareja-cena', from: 40, rate: 1.05, hook: 'b', mascot: 'risa',
    caption: { es: ['Valentina me retó en plena cena', 'spoiler: perdí'], en: ['Valentina challenged me at dinner', 'spoiler: I lost'] },
    hookText: { es: ['Así fue', 'la carrera'], en: ["Here's how", 'the race went'] },
  },
  sofa: {
    shot: 'sofa-grito', from: 52, rate: 0.88, hook: 'a', mascot: 'celebra',
    caption: { es: ['POV: por fin le atinas', 'a una ciudad difícil'], en: ['POV: you finally nail', 'a hard city'] },
  },
  abuelo: {
    shot: 'abuelo-nieto', from: 46, rate: 0.98, hook: 'c', mascot: 'baile',
    caption: { es: ['Reté a mi abuelo en geografía', 'y no me lo esperaba'], en: ['I challenged my grandpa at geography', "and I didn't see this coming"] },
    hookText: { es: ['Él ubicó 13 ciudades', 'en 30 segundos'], en: ['He found 13 cities', 'in 30 seconds'] },
  },
  cafe: {
    shot: 'cafe-otra', from: 8, rate: 1.2, hook: 'a', mascot: 'te-reta',
    caption: { es: ['Mi pausa del café:', '“solo una partida más”'], en: ['My coffee break:', '“just one more game”'] },
  },
} satisfies Record<string, GanchoDef>;
export type GanchoId = keyof typeof GANCHOS;

function useFonts() {
  const [handle] = useState(() => delayRender('Fuentes de la marca'));
  useEffect(() => { loadBrandFonts().then(() => continueRender(handle)); }, [handle]);
}

function Shot({ def, frame }: { def: GanchoDef; frame: number }) {
  const n = Math.max(0, Math.min(120, Math.round(def.from + frame * def.rate)));
  const zoom = interpolate(frame, [0, GANCHO_INTRO], [1.0, 1.06], clamp);
  return (
    <AbsoluteFill style={{ background: BRAND.navyDeep, overflow: 'hidden' }}>
      <Img src={staticFile(`people/${def.shot}/f${String(n).padStart(3, '0')}.jpg`)} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${zoom})` }} />
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(3,10,22,0.35) 0%, rgba(3,10,22,0) 30%)' }} />
    </AbsoluteFill>
  );
}

/** Texto como el de las propias apps: líneas en recuadros blancos, letra negra */
function NativeCaption({ lines, frame }: { lines: Two; frame: number }) {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ alignItems: 'center', paddingTop: 250, gap: 4 }}>
      {lines.map((line, i) => {
        const s = spring({ frame: frame - 2 - i * 5, fps, config: { damping: 12, stiffness: 200, mass: 0.6 } });
        const size = Math.min(62, 940 / (line.length * 0.56));
        return (
          <div key={i} style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: size, lineHeight: 1.2, color: '#111', background: '#FFFFFF', padding: '8px 24px 10px', borderRadius: 18, whiteSpace: 'nowrap', boxShadow: '0 6px 24px rgba(0,0,0,0.25)', transform: `scale(${0.7 + 0.3 * s})`, opacity: Math.min(1, s * 1.8) }}>
            {line}
          </div>
        );
      })}
    </AbsoluteFill>
  );
}

function CutFlash({ frame, at }: { frame: number; at: number }) {
  const o = interpolate(frame, [at - 3, at, at + 6], [0, 0.55, 0], clamp);
  return o > 0 ? <AbsoluteFill style={{ background: '#FFFFFF', opacity: o, pointerEvents: 'none' }} /> : null;
}

export const Gancho = ({ lang = 'es', id = 'profe' }: { lang?: Lang; id?: GanchoId }) => {
  useFonts();
  const frame = useCurrentFrame();
  const def: GanchoDef = GANCHOS[id];
  return (
    <LangCtx.Provider value={lang}>
      <AbsoluteFill style={{ background: BRAND.navyDeep }}>
        <Audio src={staticFile('music/track-video.wav')} volume={(f) => interpolate(f, [0, 8, GANCHO_FRAMES - 30, GANCHO_FRAMES], [0, MUSIC_VOLUME, MUSIC_VOLUME, 0], clamp)} />
        <Sfx cues={[[2, 'pop', 0.45], [GANCHO_INTRO - 4, 'whoosh-long', 0.45]]} />
        <Sequence durationInFrames={GANCHO_INTRO}>
          <Shot def={def} frame={frame} />
          <NativeCaption lines={def.caption[lang]} frame={frame} />
        </Sequence>
        <Sequence from={GANCHO_INTRO}>
          <Vertical lang={lang} hook={def.hook} music={false} mascot={def.mascot} hookText={def.hookText?.[lang]} />
        </Sequence>
        <CutFlash frame={frame} at={GANCHO_INTRO} />
      </AbsoluteFill>
    </LangCtx.Provider>
  );
};
