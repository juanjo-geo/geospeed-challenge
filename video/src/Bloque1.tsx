/**
 * Video de lanzamiento · bloque 1 (escenas 1 a 3 del storyboard, 10 s, 1920×1080, 30 fps):
 *  1 · 0,0–3,0 s  Pregunta: el globo gira hasta Asia, "¿Dónde está Katmandú?" y el reloj
 *  2 · 3,0–6,0 s  Respuesta: cae el pin, ¡PERFECTO! +2.191, y entra el teléfono con la tarjeta real
 *  3 · 6,0–10 s   Combo: tres aciertos reales seguidos (×1,5 → ×2,0 → ×2,5 ¡EN LLAMAS!)
 * Lo que se ve en el teléfono es la partida grabada (video/rec/clasico, semilla 1012): los números de los
 * textos de afuera son los de esa partida.
 */
import { useEffect, useState } from 'react';
import { AbsoluteFill, Audio, Easing, continueRender, delayRender, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { MUSIC_VOLUME, Sfx, type Cue } from './Sfx';
import { LangCtx, getL, useL, type Lang } from './lang';
import { BRAND, faceRotation, loadBrandFonts, seeded } from './brand';
import { Embers, GamePhone, Globe, Shockwave, Stars, SurfacePin } from './scene3d';

export const BLOQUE1_FRAMES = 306;

const KTM = { lat: 27.72, lon: 85.32 };
// Los tres aciertos del combo (rondas 5, 6 y 8 de la grabación)
const HITS = [
  { name: 'Budapest', lat: 47.5, lon: 19.04, tapVideo: 33.033, mult: '×1,5', label: '¡Imparable!', color: BRAND.turquoise },
  { name: 'Dakar', lat: 14.69, lon: -17.44, tapVideo: 39.167, mult: '×2,0', label: '¡Turbo!', color: BRAND.yellow },
  { name: 'Varsovia', lat: 52.23, lon: 21.01, tapVideo: 50.967, mult: '×2,5', label: '¡EN LLAMAS!', color: '#FF8A3D' },
];
const T = {
  pinDrop: 90,        // el pin toca Nepal
  phoneIn: 132,       // el globo se corre y entra el teléfono con la tarjeta real
  combo: 180,         // empieza la escena 3
  seg: [186, 222, 258], // inicio de cada acierto del combo
  tapAt: 13,          // cuadros desde el inicio del segmento hasta el toque
};
const CARD_VIDEO = 11.75; // segundo del video en que empieza a entrar la tarjeta de Katmandú
const VIDEO_LAG = 0;     // tapVideo ya es el cuadro exacto en que la partida grabada reacciona al toque

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const ease = Easing.bezier(0.65, 0, 0.35, 1);
const display: React.CSSProperties = { fontFamily: 'Poppins, sans-serif', fontWeight: 900, letterSpacing: '-0.01em' };
const lerpAngle = (a: number, b: number, k: number) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * k;

function useFonts() {
  const [handle] = useState(() => delayRender('Fuentes de la marca'));
  useEffect(() => { loadBrandFonts().then(() => continueRender(handle)); }, [handle]);
}

const noise = seeded(99);
const SHAKE = Array.from({ length: 40 }, () => [noise() - 0.5, noise() - 0.5]);

// Efectos de sonido del bloque (cuadro, archivo, volumen)
export const BLOQUE1_CUES: Cue[] = [
  [0, 'whoosh-long', 0.45],
  [20, 'tick', 0.35], [35, 'tock', 0.35], [50, 'tick', 0.35], [65, 'tock', 0.35], [80, 'tick', 0.35],   // el reloj de la pregunta
  [88, 'thud', 0.8], [92, 'perfect', 0.6], [96, 'count', 0.35],                                          // cae el pin: ¡PERFECTO!
  [131, 'whoosh', 0.5],                                                                                   // entra el teléfono
  [183, 'whoosh', 0.4], [199, 'ding-1', 0.6], [219, 'whoosh', 0.35], [235, 'ding-2', 0.6],                // combo: la campana sube de tono
  [255, 'whoosh', 0.35], [271, 'ding-4', 0.55], [272, 'fire', 0.6],                                      // ¡EN LLAMAS!
];

/** solo = el bloque se ve aparte (lleva su propia música); dentro del video completo la música va por fuera */
export const Bloque1 = ({ solo = true, lang = 'es' }: { solo?: boolean; lang?: Lang }) => {
  useFonts();
  const { rec, t } = getL(lang);
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // ── Globo ──
  const rotA = faceRotation(12, -35);          // arranca sobre el Atlántico
  const rotB = faceRotation(20, 80);           // Nepal un poco arriba del centro
  const rotC = faceRotation(30, 4);            // Europa y África para los tres pines del combo
  const k1 = interpolate(frame, [0, T.pinDrop - 10], [0, 1], { ...clamp, easing: Easing.bezier(0.3, 0, 0.2, 1) });
  const k2 = interpolate(frame, [T.combo - 6, T.combo + 26], [0, 1], { ...clamp, easing: ease });
  const drift = Math.max(0, frame - T.pinDrop) * 0.0016 * (1 - k2);
  const rotY = lerpAngle(lerpAngle(rotA.y, rotB.y, k1) + drift, rotC.y, k2) + Math.max(0, frame - T.combo - 26) * 0.0012;
  const rotX = interpolate(k2, [0, 1], [interpolate(k1, [0, 1], [rotA.x, rotB.x]), rotC.x]);
  const push = interpolate(frame, [0, T.phoneIn], [0.9, 1.04], clamp);      // la cámara se acerca despacio
  const aside = interpolate(frame, [T.phoneIn, T.phoneIn + 36], [0, 1], { ...clamp, easing: ease });
  const globeScale = push * interpolate(aside, [0, 1], [1, 0.73]) * interpolate(k2, [0, 1], [1, 0.8]);
  const globeX = interpolate(k2, [0, 1], [-3.35 * aside, -3.95]);
  const globeY = interpolate(k2, [0, 1], [-0.3 * aside, -1.12]);

  // ── Pin de Katmandú ──
  const pinS = spring({ frame: frame - (T.pinDrop - 12), fps, config: { damping: 9, stiffness: 140, mass: 0.6 } });
  const pinDrop = (1 - pinS) * 1.6;

  // ── Teléfono ──
  const phoneK = spring({ frame: frame - T.phoneIn, fps, config: { damping: 18, stiffness: 70, mass: 1.1 } });
  const big = interpolate(frame, [T.combo - 4, T.combo + 22], [0, 1], { ...clamp, easing: ease });
  const phoneX = interpolate(big, [0, 1], [interpolate(phoneK, [0, 1], [10, 1.82]), 1.62]);
  const phoneY = interpolate(big, [0, 1], [-0.42, -0.5]) + Math.sin(frame / 22) * 0.05;
  const phoneZ = interpolate(big, [0, 1], [interpolate(phoneK, [0, 1], [-3, 0.6]), 0.2]);
  const phoneScale = interpolate(big, [0, 1], [1.2, 1.4]);
  const phoneRotY = interpolate(big, [0, 1], [interpolate(phoneK, [0, 1], [-1.25, -0.3]), -0.13]) + Math.sin(frame / 38) * 0.025;
  const phoneRotZ = interpolate(phoneK, [0, 1], [0.22, 0]) + Math.sin(frame / 31) * 0.01;

  // Qué cuadro de la partida grabada se ve
  let videoT = rec.game.cardWide / 30 + (frame - T.phoneIn) / fps;
  let seg = -1;
  for (let i = 0; i < 3; i++) if (frame >= T.seg[i]) seg = i;
  if (seg >= 0) videoT = rec.game.hits[seg] / 30 + (frame - T.seg[seg] - T.tapAt) / fps;
  const cut = seg >= 0 ? frame - T.seg[seg] : 99;                    // cuadros desde el último corte
  const flash = interpolate(cut, [0, 5], [0.7, 0], clamp);
  const sheen = interpolate(frame, [T.phoneIn + 26, T.phoneIn + 50], [0, 1], clamp);

  // ── EN LLAMAS: sacudida, borde de fuego, chispas ──
  const fireFrom = T.seg[2] + T.tapAt;
  const fireT = frame - fireFrom;
  const shakeAmp = interpolate(fireT, [0, 2, 14], [0, 1, 0], clamp);
  const [sx, sy] = SHAKE[Math.max(0, Math.min(39, fireT))];
  const fire = interpolate(fireT, [0, 8], [0, 1], clamp);

  return (
    <LangCtx.Provider value={lang}>
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 45%, #12345E 0%, ${BRAND.navy} 45%, ${BRAND.navyDeep} 100%)` }}>
      {solo && (<Audio
        src={staticFile('music/track-video.wav')}
        volume={(f) => interpolate(f, [0, 12, BLOQUE1_FRAMES - 24, BLOQUE1_FRAMES], [0, MUSIC_VOLUME, MUSIC_VOLUME, 0], clamp)}
      />)}
      {solo && <Sfx cues={BLOQUE1_CUES} />}
      <ThreeCanvas width={width} height={height} camera={{ position: [0, 0, 10], fov: 35 }} gl={{ antialias: true }}>
        <ambientLight intensity={0.85} />
        <directionalLight position={[-6, 4, 6]} intensity={1.9} />
        <directionalLight position={[6, -2, 3]} intensity={0.5} color={BRAND.turquoise} />
        <Stars spin={frame * 0.0006} />
        <group position={[sx * shakeAmp * 0.22, sy * shakeAmp * 0.22, 0]}>
          <group position={[globeX, globeY, 0]} scale={globeScale}>
            <Globe rotY={rotY} rotX={rotX}>
              {frame >= T.pinDrop - 12 && <SurfacePin lat={KTM.lat} lon={KTM.lon} drop={pinDrop} rotX={rotX} rotY={rotY} scale={1.15} />}
              <Shockwave lat={KTM.lat} lon={KTM.lon} t={(frame - T.pinDrop) / 34} />
              <Shockwave lat={KTM.lat} lon={KTM.lon} t={(frame - T.pinDrop - 9) / 34} />
              {HITS.map((h, i) => {
                const at = T.seg[i] + T.tapAt;
                if (frame < at - 10) return null;
                const s = spring({ frame: frame - (at - 10), fps, config: { damping: 9, stiffness: 150, mass: 0.6 } });
                return (
                  <group key={h.name}>
                    <SurfacePin lat={h.lat} lon={h.lon} drop={(1 - s) * 1.5} rotX={rotX} rotY={rotY} scale={1.25} />
                    <Shockwave lat={h.lat} lon={h.lon} t={(frame - at) / 30} />
                  </group>
                );
              })}
            </Globe>
          </group>
          {frame >= T.phoneIn - 1 && (
            <group position={[phoneX, phoneY, phoneZ]} rotation={[0.04 + Math.sin(frame / 27) * 0.015, phoneRotY, phoneRotZ]} scale={phoneScale}>
              <GamePhone dir={rec.game.dir} videoFrame={videoT * 30} sheen={sheen} flash={flash} />
              {fireT >= 0 && <Embers t={fireT} width={4.9} height={2.6} />}
            </group>
          )}
        </group>
      </ThreeCanvas>

      <QuestionPill frame={frame} />
      <ScorePop frame={frame} fps={fps} />
      {/* Entra con la tarjeta de ¡PERFECTO! (21 km · 1,6 s) y se queda hasta el combo: 2,5 s en pantalla */}
      <Caption frame={frame} from={T.pinDrop + 14} to={T.combo - 2}>
        {t.cap2[0]}<span style={{ color: BRAND.yellow }}>{t.cap2[1]}</span>
      </Caption>
      <Caption frame={frame} from={T.combo + 6} to={BLOQUE1_FRAMES + 30}>
        {t.cap3[0]}<span style={{ color: BRAND.yellow }}>{t.cap3[1]}</span>
      </Caption>
      <ComboCounter frame={frame} fps={fps} />
      {/* Borde de fuego */}
      <AbsoluteFill style={{ boxShadow: `inset 0 0 ${150 + Math.sin(frame / 3) * 30}px rgba(255,110,30,${0.75 * fire})`, pointerEvents: 'none' }} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(3,10,22,0.55) 100%)', pointerEvents: 'none' }} />
    </AbsoluteFill>
    </LangCtx.Provider>
  );
};

const fade = (frame: number, a: number, b: number, c: number, d: number) => interpolate(frame, [a, b, c, d], [0, 1, 1, 0], clamp);

function QuestionPill({ frame }: { frame: number }) {
  const L = useL();
  // Se va apenas cae el pin: deja el sitio a la frase, que necesita tiempo para leerse
  const o = fade(frame, 4, 14, T.pinDrop + 8, T.pinDrop + 16);
  const s = interpolate(frame, [4, 18], [0.88, 1], { ...clamp, easing: Easing.out(Easing.back(1.6)) });
  // Reloj de la partida: se detiene al responder (1,6 s de 15)
  const timeLeft = interpolate(frame, [14, T.pinDrop], [1, 0.89], clamp);
  return (
    <AbsoluteFill style={{ alignItems: 'center', paddingTop: 50, opacity: o }}>
      <div style={{ transform: `scale(${s})`, padding: '18px 48px 22px', borderRadius: 999, background: 'rgba(7,20,38,0.9)', border: `3px solid ${BRAND.turquoise}`, boxShadow: '0 0 44px rgba(25,230,210,0.4)', minWidth: 780 }}>
        <div style={{ ...display, fontWeight: 800, fontSize: 56, color: BRAND.white, textAlign: 'center' }}>
          {L.t.whereA}<span style={{ color: BRAND.yellow }}>{L.t.city}</span>{L.t.whereB}
        </div>
        <div style={{ marginTop: 12, height: 10, borderRadius: 99, background: 'rgba(255,255,255,0.12)', overflow: 'hidden' }}>
          <div style={{ width: `${timeLeft * 100}%`, height: '100%', background: BRAND.turquoise, borderRadius: 99 }} />
        </div>
      </div>
    </AbsoluteFill>
  );
}

function ScorePop({ frame, fps }: { frame: number; fps: number }) {
  const L = useL();
  const start = T.pinDrop + 4;
  const s = spring({ frame: frame - start, fps, config: { damping: 11, stiffness: 160 } });
  const o = fade(frame, start, start + 4, T.phoneIn - 4, T.phoneIn + 8);
  const pts = Math.round(interpolate(frame, [start + 3, start + 22], [0, L.t.score1], { ...clamp, easing: Easing.out(Easing.cubic) }));
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <div style={{ position: 'absolute', left: 1130, top: 372, padding: '22px 34px 24px', borderRadius: 28, background: 'rgba(7,20,38,0.8)', border: '2px solid rgba(25,230,210,0.45)', transform: `scale(${0.6 + 0.4 * s})`, transformOrigin: 'left center' }}>
        <div style={{ ...display, fontSize: 64, color: BRAND.turquoise, textShadow: '0 0 30px rgba(25,230,210,0.6), 0 4px 16px rgba(0,0,0,0.5)' }}>{L.t.perfect}</div>
        <div style={{ ...display, fontSize: 92, color: BRAND.yellow, lineHeight: 1, textShadow: '0 6px 24px rgba(0,0,0,0.5)' }}>
          +{L.num(pts)} <span style={{ fontSize: 46, fontWeight: 800 }}>{L.t.pts}</span>
        </div>
        <div style={{ ...display, fontWeight: 600, fontSize: 34, color: BRAND.sky, marginTop: 10 }}>{L.t.stat1}</div>
      </div>
    </AbsoluteFill>
  );
}

function Caption({ frame, from, to, children }: { frame: number; from: number; to: number; children: React.ReactNode }) {
  const o = fade(frame, from, from + 10, to - 8, to);
  const y = interpolate(frame, [from, from + 14], [26, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
  if (o <= 0) return null;
  return (
    <AbsoluteFill style={{ alignItems: 'center', paddingTop: 52, opacity: o }}>
      <div style={{ ...display, fontSize: 70, color: BRAND.white, transform: `translateY(${y}px)`, textShadow: '0 6px 30px rgba(0,0,0,0.6)' }}>{children}</div>
    </AbsoluteFill>
  );
}

/** Multiplicador del combo, grande, a la izquierda sobre el globo: cambia con cada acierto */
function ComboCounter({ frame, fps }: { frame: number; fps: number }) {
  const L = useL();
  let idx = -1;
  for (let i = 0; i < 3; i++) if (frame >= T.seg[i] + T.tapAt) idx = i;
  if (idx < 0) return null;
  const h = HITS[idx];
  const since = frame - (T.seg[idx] + T.tapAt);
  const s = spring({ frame: since, fps, config: { damping: 8, stiffness: 190, mass: 0.7 } });
  const onFire = idx === 2;
  const glow = onFire ? `0 0 50px rgba(255,120,30,0.9), 0 0 110px rgba(255,90,20,0.6)` : `0 0 40px ${h.color}66`;
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 60, top: 188, width: 470, textAlign: 'center', transform: `scale(${0.55 + 0.45 * s}) rotate(${(1 - s) * -8}deg)` }}>
        <div style={{ ...display, fontSize: 176, lineHeight: 1, color: h.color, textShadow: `${glow}, 0 8px 0 rgba(4,12,26,0.6)` }}>{L.t.mult[idx]}</div>
        <div style={{ ...display, fontWeight: 800, fontSize: 50, marginTop: 6, color: onFire ? '#FFD27A' : BRAND.white, textShadow: `${onFire ? glow : '0 4px 18px rgba(0,0,0,0.6)'}` }}>
          {onFire ? '🔥 ' : ''}{L.t.comboLabel[idx]}
        </div>
      </div>
    </AbsoluteFill>
  );
}
