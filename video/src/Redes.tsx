/**
 * Variantes para redes con tomas de personas generadas con IA (Higgsfield, Seedance 2.0). No van en la ficha de
 * Google Play: ahí el video muestra solo el juego.
 *  - VerticalIntro: el corte vertical con 2,2 s de persona antes del gancho.
 *      hook a → la chica del bus (de concentrada a sonriente) con "¿La ubicas en 5 segundos?"
 *      hook b → los amigos en el sofá con "Mi amiga me retó y esto pasó"
 *  - FriendsCut: 1,5 s de los amigos (16:9) antes de la escena de retos del video horizontal.
 * Las tomas están como secuencias de imágenes en public/people/<carpeta>/f000.jpg (24 cuadros por segundo).
 */
import { useEffect, useState } from 'react';
import { AbsoluteFill, Audio, Img, Sequence, continueRender, delayRender, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { BRAND, loadBrandFonts } from './brand';
import { MUSIC_VOLUME, Sfx } from './Sfx';
import { Caption } from './Bloque2';
import { Headline, Vertical, VERTICAL_FRAMES } from './Vertical';
import { LangCtx, getL, type Lang } from './lang';

export const INTRO_FRAMES = 66;        // 2,2 s de persona antes del gancho (vertical)
export const FRIENDS_CUT_FRAMES = 45;  // 1,5 s de amigos antes de la escena de retos (horizontal)
// El bloque 3 empieza 12 cuadros antes de que termine la toma: en esos cuadros todavía salen de pantalla el teléfono
// y las fichas del diario, y sin esto se verían de nuevo después de los amigos
export const FRIENDS_OVERLAP = 12;
export const VERTICAL_INTRO_FRAMES = INTRO_FRAMES + VERTICAL_FRAMES;

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

// Las tomas van antes de que se monte cualquier bloque del juego: cargan ellas las fuentes de la marca
function useFonts() {
  const [handle] = useState(() => delayRender('Fuentes de la marca'));
  useEffect(() => { loadBrandFonts().then(() => continueRender(handle)); }, [handle]);
}

// Tramo de cada toma: cuadro inicial del clip y cuántos cuadros del clip avanzan por cuadro del video
const SHOTS = {
  bus: { dir: 'bus', from: 0, rate: 1.08, last: 96 },         // ceño fruncido → se le ilumina la cara
  amigos_v: { dir: 'amigos_v', from: 34, rate: 0.8, last: 120 },   // risas y el puño arriba
  amigos_h: { dir: 'amigos_h', from: 68, rate: 0.85, last: 120 },  // el puño arriba
} as const;

/** La toma a pantalla completa, con un acercamiento lento y sombra arriba para que el texto se lea */
function PeopleShot({ shot, frame, frames }: { shot: keyof typeof SHOTS; frame: number; frames: number }) {
  const s = SHOTS[shot];
  const n = Math.max(0, Math.min(s.last, Math.round(s.from + frame * s.rate)));
  const zoom = interpolate(frame, [0, frames], [1.0, 1.07], clamp);
  return (
    <AbsoluteFill style={{ background: BRAND.navyDeep, overflow: 'hidden' }}>
      <Img src={staticFile(`people/${s.dir}/f${String(n).padStart(3, '0')}.jpg`)} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${zoom})` }} />
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(3,10,22,0.82) 0%, rgba(3,10,22,0.35) 26%, rgba(3,10,22,0) 46%, rgba(3,10,22,0) 78%, rgba(3,10,22,0.45) 100%)' }} />
    </AbsoluteFill>
  );
}

/** Destello corto en el corte de la persona al juego */
function CutFlash({ frame, at }: { frame: number; at: number }) {
  const o = interpolate(frame, [at - 3, at, at + 6], [0, 0.55, 0], clamp);
  return o > 0 ? <AbsoluteFill style={{ background: '#FFFFFF', opacity: o, pointerEvents: 'none' }} /> : null;
}

export const VerticalIntro = ({ lang = 'es', hook = 'a' }: { lang?: Lang; hook?: 'a' | 'b' }) => {
  useFonts();
  const frame = useCurrentFrame();
  const { t } = getL(lang);
  const [a, b] = hook === 'a' ? t.v1 : t.hookB;
  return (
    <LangCtx.Provider value={lang}>
      <AbsoluteFill style={{ background: BRAND.navyDeep }}>
        <Audio src={staticFile('music/track-video.wav')} volume={(f) => interpolate(f, [0, 10, VERTICAL_INTRO_FRAMES - 30, VERTICAL_INTRO_FRAMES], [0, MUSIC_VOLUME, MUSIC_VOLUME, 0], clamp)} />
        <Sfx cues={[[0, 'whoosh', 0.4], [INTRO_FRAMES - 4, 'whoosh-long', 0.45]]} />
        <Sequence durationInFrames={INTRO_FRAMES}>
          <PeopleShot shot={hook === 'a' ? 'bus' : 'amigos_v'} frame={frame} frames={INTRO_FRAMES} />
          <Headline frame={frame} from={3} to={INTRO_FRAMES + 40} a={a} b={b} fit={hook === 'b'} />
        </Sequence>
        {/* El titular ya está en pantalla cuando empieza el juego: no vuelve a entrar */}
        <Sequence from={INTRO_FRAMES}>
          <Vertical lang={lang} hook={hook} music={false} headlineOn />
        </Sequence>
        <CutFlash frame={frame} at={INTRO_FRAMES} />
      </AbsoluteFill>
    </LangCtx.Provider>
  );
};

/** Horizontal: los amigos en el sofá justo antes de "Reta a tus amigos" */
export const FriendsCut = ({ lang = 'es' }: { lang?: Lang }) => {
  useFonts();
  const frame = useCurrentFrame();
  const { t } = getL(lang);
  return (
    <AbsoluteFill>
      <PeopleShot shot="amigos_h" frame={frame} frames={FRIENDS_CUT_FRAMES} />
      <Caption frame={frame} from={3} to={FRIENDS_CUT_FRAMES + 40}>{t.cap7[0]}</Caption>
      <CutFlash frame={frame} at={0} />
    </AbsoluteFill>
  );
};
