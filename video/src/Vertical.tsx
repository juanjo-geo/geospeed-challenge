/**
 * Corte vertical para redes (9:16, 1080×1920, 15 s, 30 fps): TikTok, Reels y Shorts.
 *  0–4 s    "¿La ubicas en 5 segundos?": la pregunta de Katmandú, con cuenta 5… 4… 3…
 *  4–7 s    cae el pin: ¡PERFECTO!, 21 km en 1,6 s, +2.191 puntos (tarjeta real en el teléfono)
 *  7–10 s   combo: tres aciertos reales hasta ¡EN LLAMAS!
 *  10–13 s  un desafío nuevo cada día: fichas, racha y mensaje
 *  13–15 s  cierre: Explorador, logo, "Juega gratis" (en redes sí se puede decir)
 * El juego se juega de lado: arriba va el texto, al centro el globo y abajo el teléfono acostado con la partida real.
 * Zonas libres para los botones de las apps: 130 px arriba, 370 px abajo y 120 px a la derecha.
 * Ganchos (prop hook): solo cambian los primeros 3,8 s; el resto del video es el mismo.
 *  a  "¿La ubicas en 5 segundos?" (el de arriba)
 *  b  "Mi amiga me retó y esto pasó": la carrera real contra Valentina en el teléfono, su aviso y el marcador
 *  c  "Ubiqué 13 ciudades en 30 segundos": el globo da una vuelta y caen 13 pines seguidos con su contador
 */
import { useEffect, useState } from 'react';
import { AbsoluteFill, Audio, Easing, Img, continueRender, delayRender, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { BRAND, faceRotation, loadBrandFonts, seeded } from './brand';
import { Embers, GamePhone, Globe, Shockwave, Stars, SurfacePin } from './scene3d';
import { DailyChips } from './scene3dB';
import { DAILY_PATTERN, ShareBubble, Streak } from './Bloque2';
import { MUSIC_VOLUME, Sfx, type Cue } from './Sfx';
import { LangCtx, getL, useL, type Lang } from './lang';
import { MascotClip, clipFrameAt, type ClipId } from './MascotClip';

export const VERTICAL_FRAMES = 450;

const KTM = { lat: 27.72, lon: 85.32 };
// Los tres aciertos del combo: cuadro de la grabación en que la partida reacciona al toque
const HITS = [
  { lat: 47.5, lon: 19.04, video: 991, mult: '×1,5', label: '¡Imparable!', color: BRAND.turquoise },
  { lat: 14.69, lon: -17.44, video: 1175, mult: '×2,0', label: '¡Turbo!', color: BRAND.yellow },
  { lat: 52.23, lon: 21.01, video: 1529, mult: '×2,5', label: '¡EN LLAMAS!', color: '#FF8A3D' },
];
const T = {
  count: [24, 54, 84],     // 5… 4… 3…
  pin: 114,                // el toque: cae el pin
  card: 150,               // el teléfono salta a la tarjeta de respuesta
  combo: 210, seg: [214, 242, 270], tapAt: 10,
  daily: 300, chips: 306, flip: 330, streak: 348, bubble: 356,
  end: 390,
};
// Grabación de la partida (public/frames): pregunta estable desde el cuadro 209, el toque se ve en el 265
const Q_START = 212, TAP_VIDEO = 265, CARD_VIDEO = 362;

export type Hook = 'a' | 'b' | 'c';
// Gancho c: 13 ciudades del juego en el orden en que el globo las va mostrando al girar hacia el este
const TOUR = [
  { lat: 35.68, lon: 139.69, at: 9 }, { lat: -33.87, lon: 151.21, at: 15 }, { lat: 21.31, lon: -157.86, at: 26 },
  { lat: 49.28, lon: -123.12, at: 36 }, { lat: 19.43, lon: -99.13, at: 43 }, { lat: 4.71, lon: -74.07, at: 49 },
  { lat: 40.71, lon: -74.01, at: 53 }, { lat: -34.6, lon: -58.38, at: 57 }, { lat: -22.91, lon: -43.17, at: 61 },
  { lat: 38.72, lon: -9.14, at: 68 }, { lat: 48.86, lon: 2.35, at: 72 }, { lat: 30.04, lon: 31.24, at: 79 }, { lat: 28.61, lon: 77.21, at: 92 },
];
const TOUR_END = 98;      // el globo termina la vuelta mirando a Nepal
const RACE_AT = 10;       // gancho b: cuadro en que arranca la carrera grabada
const HOOK_CUES: Record<Hook, Cue[]> = {
  a: [[0, 'whoosh-long', 0.45], [24, 'tock', 0.55], [54, 'tock', 0.55], [84, 'tock', 0.55]],
  b: [[0, 'whoosh-long', 0.45], [24, 'notify', 0.65], [51, 'ding-2', 0.55], [56, 'count', 0.3], [100, 'whoosh', 0.35]],
  c: [[0, 'whoosh-long', 0.45], ...TOUR.map((c, i): Cue => [c.at, i === 12 ? 'ding-4' : 'pop', i === 12 ? 0.55 : 0.4]), [98, 'whoosh', 0.35]],
};
const CUES: Cue[] = [
  [112, 'thud', 0.8], [116, 'perfect', 0.6], [120, 'count', 0.35], [149, 'whoosh', 0.4],
  [211, 'whoosh', 0.4], [224, 'ding-1', 0.6], [239, 'whoosh', 0.35], [252, 'ding-2', 0.6], [267, 'whoosh', 0.35], [280, 'ding-4', 0.55], [281, 'fire', 0.6],
  [298, 'whoosh-long', 0.45], [313, 'chips-fall', 0.5], [334, 'chips-flip', 0.45], [348, 'streak', 0.55], [356, 'message', 0.6],
  [388, 'whoosh-long', 0.4], [398, 'jump', 0.5], [406, 'finale', 0.75], [424, 'sparkle', 0.35],
];

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const ease = Easing.bezier(0.65, 0, 0.35, 1);
const display: React.CSSProperties = { fontFamily: 'Poppins, sans-serif', fontWeight: 900, letterSpacing: '-0.01em' };
const lerpAngle = (a: number, b: number, k: number) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * k;
const mix = (a: number, b: number, k: number) => a + (b - a) * k;
const fade = (frame: number, a: number, b: number, c: number, d: number) => interpolate(frame, [a, b, c, d], [0, 1, 1, 0], clamp);

function useFonts() {
  const [handle] = useState(() => delayRender('Fuentes de la marca'));
  useEffect(() => { loadBrandFonts().then(() => continueRender(handle)); }, [handle]);
}
const noise = seeded(77);
const SHAKE = Array.from({ length: 40 }, () => [noise() - 0.5, noise() - 0.5]);

/** music = false y headlineOn: cuando va después de una toma de persona (Redes.tsx), que ya trae la música y el titular */
/** hookText: reemplaza el titular del gancho (Ganchos.tsx, cuando la toma de persona cuenta otra historia) */
export const Vertical = ({ lang = 'es', mascot = 'a', hook = 'a', music = true, headlineOn = false, hookText }: { lang?: Lang; mascot?: ClipId; hook?: Hook; music?: boolean; headlineOn?: boolean; hookText?: readonly [string, string] }) => {
  useFonts();
  const { rec, t } = getL(lang);
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // ── Globo ──
  const rotA = faceRotation(12, -30), rotB = faceRotation(18, 82), rotC = faceRotation(34, 4), rotD = faceRotation(8, -62);
  const k1 = interpolate(frame, [0, T.pin - 12], [0, 1], { ...clamp, easing: Easing.bezier(0.3, 0, 0.2, 1) });
  const k2 = interpolate(frame, [T.combo - 6, T.combo + 16], [0, 1], { ...clamp, easing: ease });
  const k3 = interpolate(frame, [T.daily - 4, T.daily + 18], [0, 1], { ...clamp, easing: ease });
  const k4 = interpolate(frame, [T.end - 4, T.end + 20], [0, 1], { ...clamp, easing: ease });
  // Gancho c: una vuelta completa hacia el este (340°) que termina mirando a Nepal
  const perDeg = faceRotation(18, 83).y - faceRotation(18, 82).y;
  const tourY = rotB.y + perDeg * interpolate(frame, [4, TOUR_END], [-340, 0], clamp);
  const startY = hook === 'c' ? tourY : lerpAngle(rotA.y, rotB.y, k1);
  const rotY = lerpAngle(lerpAngle(startY, rotC.y, k2), rotD.y, k3) + Math.max(0, frame - T.daily) * 0.003;
  const rotX = mix(mix(hook === 'c' ? rotB.x : mix(rotA.x, rotB.x, k1), rotC.x, k2), rotD.x, k3);
  const tourK = hook === 'c' ? 1 - interpolate(frame, [TOUR_END - 8, T.pin - 4], [0, 1], { ...clamp, easing: ease }) : 0;   // 1 durante la vuelta
  const globeScale = mix(mix(mix(interpolate(frame, [0, T.pin], [0.72, 0.8], clamp), 0.98, tourK), 0.8, k3), 1.0, k4);
  const globeY = mix(mix(1.55, 0.5, tourK), 1.2, k4);

  // ── Pin de Katmandú ──
  const pinS = spring({ frame: frame - (T.pin - 12), fps, config: { damping: 9, stiffness: 140, mass: 0.6 } });

  // ── Teléfono con la partida real ──
  const phoneAt = hook === 'c' ? 98 : 2;   // en el gancho c el teléfono entra al final de la vuelta
  const phoneIn = spring({ frame: frame - phoneAt, fps, config: { damping: 17, stiffness: 80 } });
  const phoneOut = interpolate(frame, [T.daily - 4, T.daily + 10], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  let seg = -1;
  for (let i = 0; i < 3; i++) if (frame >= T.seg[i]) seg = i;
  let vf: number;
  if (seg >= 0) vf = rec.game.hits[seg] + (frame - T.seg[seg] - T.tapAt);
  else if (frame >= T.card) vf = rec.game.cardTall + (frame - T.card);
  else if (frame >= T.pin) vf = rec.game.tap1 + (frame - T.pin);
  else if (hook === 'b') vf = rec.race.raceStart + Math.max(0, Math.min(99, frame - RACE_AT));   // la carrera real contra la rival
  else vf = mix(rec.game.qStart, rec.game.tap1 - 1, Math.max(0, frame - phoneAt + 2) / (T.pin - 1 - phoneAt + 2)); // la pregunta, en cámara lenta, hasta el toque
  const phoneDir = hook === 'b' && frame < T.pin ? rec.race.dir : rec.game.dir;
  const raceTap = RACE_AT + rec.race.tap - rec.race.raceStart;   // cuadro del video en que respondo en la carrera
  const cutAt = seg >= 0 ? T.seg[seg] : frame >= T.card ? T.card : hook === 'b' && frame >= T.pin ? T.pin : -99;
  const flash = interpolate(frame - cutAt, [0, 5], [0.7, 0], clamp);

  // ── EN LLAMAS ──
  const fireT = frame - (T.seg[2] + T.tapAt);
  const fireOn = fireT >= 0 && frame < T.daily + 8;
  const fire = fireOn ? interpolate(fireT, [0, 8], [0, 1], clamp) * (1 - interpolate(frame, [T.daily - 4, T.daily + 6], [0, 1], clamp)) : 0;
  const shakeAmp = interpolate(fireT, [0, 2, 14], [0, 1, 0], clamp);
  const [sx, sy] = SHAKE[Math.max(0, Math.min(39, fireT))];

  // ── Diario ──
  const dim = interpolate(frame, [T.daily, T.daily + 16, T.end - 4, T.end + 8], [0, 0.6, 0.6, 0], clamp);
  const chipsOut = interpolate(frame, [T.end - 6, T.end + 6], [0, 1], clamp);
  const drop = (i: number) => spring({ frame: frame - (T.chips + i * 2), fps, config: { damping: 11, stiffness: 150, mass: 0.8 } });
  const flip = (i: number) => interpolate(frame, [T.flip + i * 1.6, T.flip + i * 1.6 + 8], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });

  return (
    <LangCtx.Provider value={lang}>
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 40%, #12345E 0%, ${BRAND.navy} 45%, ${BRAND.navyDeep} 100%)` }}>
      {music && <Audio src={staticFile('music/track-video.wav')} volume={(f) => interpolate(f, [0, 10, VERTICAL_FRAMES - 30, VERTICAL_FRAMES], [0, MUSIC_VOLUME, MUSIC_VOLUME, 0], clamp)} />}
      <Sfx cues={[...HOOK_CUES[hook], ...CUES]} />
      {/* Cámara más lejos que en el horizontal: en 9:16 el cuadro es angosto */}
      <ThreeCanvas width={width} height={height} camera={{ position: [0, 0, 17.8], fov: 35 }} gl={{ antialias: true }}>
        <ambientLight intensity={0.85} />
        <directionalLight position={[-6, 4, 6]} intensity={1.9} />
        <directionalLight position={[6, -2, 3]} intensity={0.5} color={BRAND.turquoise} />
        <Stars spin={frame * 0.0006} />
        <group position={[sx * shakeAmp * 0.2, sy * shakeAmp * 0.2, 0]}>
          <group position={[0, globeY, mix(0, -3, k4)]} scale={globeScale}>
            <Globe rotY={rotY} rotX={rotX}>
              {frame >= T.pin - 12 && frame < T.daily && <SurfacePin lat={KTM.lat} lon={KTM.lon} drop={(1 - pinS) * 1.6} rotX={rotX} rotY={rotY} scale={1.35} />}
              <Shockwave lat={KTM.lat} lon={KTM.lon} t={(frame - T.pin) / 34} />
              <Shockwave lat={KTM.lat} lon={KTM.lon} t={(frame - T.pin - 9) / 34} />
              {hook === 'c' && frame < TOUR_END + 12 && TOUR.map((c, i) => {
                if (frame < c.at - 8) return null;
                const s = spring({ frame: frame - (c.at - 8), fps, config: { damping: 9, stiffness: 170, mass: 0.5 } });
                return (
                  <group key={`tour${i}`}>
                    <SurfacePin lat={c.lat} lon={c.lon} drop={(1 - s) * 1.4} rotX={rotX} rotY={rotY} scale={1.15 * (1 - interpolate(frame, [TOUR_END + 2, TOUR_END + 10], [0, 1], clamp))} />
                    <Shockwave lat={c.lat} lon={c.lon} t={(frame - c.at) / 26} />
                  </group>
                );
              })}
              {frame < T.daily + 10 && HITS.map((h, i) => {
                const at = T.seg[i] + T.tapAt;
                if (frame < at - 10) return null;
                const s = spring({ frame: frame - (at - 10), fps, config: { damping: 9, stiffness: 150, mass: 0.6 } });
                return (
                  <group key={i}>
                    <SurfacePin lat={h.lat} lon={h.lon} drop={(1 - s) * 1.5} rotX={rotX} rotY={rotY} scale={1.4 * (1 - interpolate(frame, [T.daily - 2, T.daily + 8], [0, 1], clamp))} />
                    <Shockwave lat={h.lat} lon={h.lon} t={(frame - at) / 30} />
                  </group>
                );
              })}
            </Globe>
          </group>
          {phoneOut < 1 && (
            <group position={[-0.12, mix(-9, -2.05, phoneIn) - phoneOut * 8, 0.6]} rotation={[-0.2 + Math.sin(frame / 27) * 0.012, Math.sin(frame / 38) * 0.04, Math.sin(frame / 31) * 0.008]} scale={1.12}>
              <GamePhone dir={phoneDir} videoFrame={vf} sheen={interpolate(frame, [phoneAt + 16, phoneAt + 40], [0, 1], clamp)} flash={flash} />
              {fireOn && <Embers t={fireT} width={4.9} height={2.6} />}
            </group>
          )}
        </group>
        {dim > 0 && (
          <mesh position={[0, 0, 1.0]}>
            <planeGeometry args={[40, 40]} />
            <meshBasicMaterial color={BRAND.navyDeep} transparent opacity={dim} depthWrite={false} toneMapped={false} />
          </mesh>
        )}
        {frame >= T.chips - 1 && chipsOut < 1 && (
          <group position={[0, 2.25 + chipsOut * 2, 2]} rotation={[-0.14, 0, 0]} scale={1.22 * (1 - chipsOut)}>
            <DailyChips pattern={DAILY_PATTERN} drop={drop} flip={flip} />
          </group>
        )}
      </ThreeCanvas>

      {hookText && <Headline frame={frame} from={headlineOn ? -40 : 4} to={T.pin + 2} a={hookText[0]} b={hookText[1]} fit />}
      {!hookText && hook === 'a' && <Headline frame={frame} from={headlineOn ? -40 : 4} to={T.pin + 2} a={t.v1[0]} b={t.v1[1]} />}
      {!hookText && hook === 'b' && <Headline frame={frame} from={headlineOn ? -40 : 4} to={T.pin + 2} a={t.hookB[0]} b={t.hookB[1]} fit />}
      {!hookText && hook === 'c' && <Headline frame={frame} from={4} to={T.pin + 2} a={t.hookC[0]} b={t.hookC[1]} fit />}
      <Headline frame={frame} from={T.pin + 6} to={T.combo - 2} a={t.v2[0]} b={t.v2[1]} />
      <Headline frame={frame} from={T.combo + 4} to={T.daily - 2} a={t.v3[0]} b={t.v3[1]} bColor="#FF8A3D" />
      <Headline frame={frame} from={T.daily + 6} to={T.end - 2} a={t.v4[0]} b={t.v4[1]} />

      <QuestionPill frame={frame} from={hook === 'a' ? 10 : T.pin - 12} />
      {hook === 'a' && <Countdown frame={frame} fps={fps} />}
      {hook === 'b' && <RaceOverlay frame={frame} fps={fps} tapAt={raceTap} />}
      {hook === 'c' && <TourCounter frame={frame} fps={fps} />}
      <ScorePop frame={frame} fps={fps} />
      <ComboCounter frame={frame} fps={fps} />

      {/* Racha y mensaje: los mismos del horizontal, reubicados */}
      {frame >= T.streak - 12 && frame < T.end + 8 && (
        <AbsoluteFill style={{ opacity: 1 - interpolate(frame, [T.end - 4, T.end + 6], [0, 1], clamp) }}>
          <div style={{ position: 'absolute', left: 90 - 850, top: 930 - 606 }}><Streak frame={frame - T.streak + 240} fps={fps} /></div>
          <div style={{ position: 'absolute', left: 500 - 1320, top: 1150 - 600 }}><ShareBubble frame={frame - T.bubble + 248} fps={fps} /></div>
        </AbsoluteFill>
      )}

      <AbsoluteFill style={{ boxShadow: `inset 0 0 ${150 + Math.sin(frame / 3) * 30}px rgba(255,110,30,${0.75 * fire})`, pointerEvents: 'none' }} />
      <EndCard frame={frame} fps={fps} clip={mascot} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, transparent 60%, rgba(3,10,22,0.5) 100%)', pointerEvents: 'none' }} />
    </AbsoluteFill>
    </LangCtx.Provider>
  );
};

/** Titular de dos líneas arriba (debajo de la zona que tapa la app) */
export function Headline({ frame, from, to, a, b, bColor = BRAND.yellow, fit = false }: { frame: number; from: number; to: number; a: string; b: string; bColor?: string; fit?: boolean }) {
  // fit: frases más largas (ganchos b y c) se encogen para caber en el ancho
  const sizeA = fit ? Math.min(88, 980 / (a.length * 0.58)) : 88;
  const sizeB = fit ? Math.min(108, 980 / (b.length * 0.6)) : 108;
  const o = fade(frame, from, from + 8, to - 6, to);
  if (o <= 0) return null;
  const y = interpolate(frame, [from, from + 12], [30, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
  const s2 = interpolate(frame, [from + 5, from + 16], [0.8, 1], { ...clamp, easing: Easing.out(Easing.back(1.8)) });
  return (
    <AbsoluteFill style={{ alignItems: 'center', paddingTop: 150, opacity: o }}>
      <div style={{ ...display, fontSize: sizeA, lineHeight: 1.08, color: BRAND.white, transform: `translateY(${y}px)`, textShadow: '0 6px 30px rgba(0,0,0,0.6)', whiteSpace: 'nowrap' }}>{a}</div>
      <div style={{ ...display, fontSize: sizeB, lineHeight: 1.08, color: bColor, transform: `translateY(${y}px) scale(${s2})`, textShadow: '0 6px 30px rgba(0,0,0,0.6)', whiteSpace: 'nowrap' }}>{b}</div>
    </AbsoluteFill>
  );
}

function QuestionPill({ frame, from }: { frame: number; from: number }) {
  const L = useL();
  const o = fade(frame, from, from + 10, T.pin + 20, T.pin + 30);
  if (o <= 0) return null;
  const s = interpolate(frame, [from, from + 14], [0.88, 1], { ...clamp, easing: Easing.out(Easing.back(1.6)) });
  const timeLeft = interpolate(frame, [from + 10, T.pin], [1, 0.89], clamp);
  return (
    <AbsoluteFill style={{ alignItems: 'center', paddingTop: 398, opacity: o }}>
      <div style={{ transform: `scale(${s})`, padding: '16px 40px 20px', borderRadius: 999, background: 'rgba(7,20,38,0.92)', border: `3px solid ${BRAND.turquoise}`, boxShadow: '0 0 44px rgba(25,230,210,0.4)' }}>
        <div style={{ ...display, fontWeight: 800, fontSize: 54, color: BRAND.white, textAlign: 'center', whiteSpace: 'nowrap' }}>
          {L.t.whereA}<span style={{ color: BRAND.yellow }}>{L.t.city}</span>{L.t.whereB}
        </div>
        <div style={{ marginTop: 10, height: 10, borderRadius: 99, background: 'rgba(255,255,255,0.12)', overflow: 'hidden' }}>
          <div style={{ width: `${timeLeft * 100}%`, height: '100%', background: BRAND.turquoise, borderRadius: 99 }} />
        </div>
      </div>
    </AbsoluteFill>
  );
}

/** 5… 4… 3…: el reto a quien mira */
function Countdown({ frame, fps }: { frame: number; fps: number }) {
  let idx = -1;
  T.count.forEach((at, i) => { if (frame >= at) idx = i; });
  if (idx < 0 || frame >= T.pin) return null;
  const s = spring({ frame: frame - T.count[idx], fps, config: { damping: 9, stiffness: 200, mass: 0.6 } });
  const o = interpolate(frame, [T.pin - 6, T.pin], [1, 0], clamp);
  return (
    <div style={{ position: 'absolute', left: 720, top: 800, width: 190, height: 190, borderRadius: '50%', background: 'rgba(7,20,38,0.92)', border: `6px solid ${BRAND.yellow}`, boxShadow: '0 0 50px rgba(255,217,59,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: o, transform: `scale(${0.6 + 0.4 * s})` }}>
      <span style={{ ...display, fontSize: 130, lineHeight: 1, color: BRAND.yellow }}>{5 - idx}</span>
    </div>
  );
}

/** Gancho b: el aviso de que la rival ya respondió y, cuando respondo, el marcador de la carrera */
function RaceOverlay({ frame, fps, tapAt }: { frame: number; fps: number; tapAt: number }) {
  const L = useL();
  const toastAt = RACE_AT + 14;
  const toast = spring({ frame: frame - toastAt, fps, config: { damping: 11, stiffness: 180 } });
  const toastO = fade(frame, toastAt, toastAt + 4, tapAt, tapAt + 6);
  const vsAt = tapAt + 4;
  const vs = spring({ frame: frame - vsAt, fps, config: { damping: 11, stiffness: 160 } });
  const vsO = fade(frame, vsAt, vsAt + 4, T.pin - 8, T.pin);
  const k = interpolate(frame, [vsAt + 2, vsAt + 18], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const [me, rival] = L.rec.race.vs[0];
  const side = (name: string, pts: number, color: string, lead: boolean) => (
    <div style={{ flex: 1, textAlign: 'center', padding: '14px 10px 16px', borderRadius: 26, background: 'rgba(7,20,38,0.9)', border: `3px solid ${color}`, boxShadow: lead ? `0 0 40px ${color}66` : 'none' }}>
      <div style={{ ...display, fontWeight: 800, fontSize: 40, color: BRAND.white }}>{lead ? '👑 ' : ''}{name}</div>
      <div style={{ ...display, fontSize: 84, lineHeight: 1.05, color }}>{L.num(Math.round(pts * k))}</div>
    </div>
  );
  return (
    <>
      {toastO > 0 && (
        <div style={{ position: 'absolute', left: 140, top: 842, width: 800, textAlign: 'center', opacity: toastO, transform: `scale(${0.6 + 0.4 * toast})` }}>
          <span style={{ ...display, fontWeight: 800, fontSize: 56, color: '#0B1F3A', padding: '16px 40px 18px', borderRadius: 999, background: BRAND.turquoise, boxShadow: '0 0 50px rgba(25,230,210,0.55)', whiteSpace: 'nowrap' }}>{L.t.rivalDone}</span>
        </div>
      )}
      {vsO > 0 && (
        <div style={{ position: 'absolute', left: 110, top: 800, width: 860, display: 'flex', alignItems: 'center', gap: 18, opacity: vsO, transform: `scale(${0.6 + 0.4 * vs})` }}>
          {side(L.t.you, me, BRAND.yellow, me >= rival)}
          <div style={{ ...display, fontSize: 46, color: BRAND.sky }}>VS</div>
          {side('Valentina', rival, BRAND.turquoise, rival > me)}
        </div>
      )}
    </>
  );
}

/** Gancho c: contador de ciudades ubicadas, debajo del globo */
function TourCounter({ frame, fps }: { frame: number; fps: number }) {
  const L = useL();
  let n = 0;
  TOUR.forEach((c) => { if (frame >= c.at) n++; });
  if (n === 0 || frame >= T.pin) return null;
  const s = spring({ frame: frame - TOUR[n - 1].at, fps, config: { damping: 8, stiffness: 220, mass: 0.5 } });
  const o = interpolate(frame, [TOUR_END, TOUR_END + 8], [1, 0], clamp);
  const hot = n >= 8;
  const color = n === 13 ? '#FF8A3D' : hot ? BRAND.yellow : BRAND.turquoise;
  return (
    <div style={{ position: 'absolute', left: 290, top: 1262, width: 500, textAlign: 'center', padding: '10px 20px 18px', borderRadius: 34, background: 'rgba(7,20,38,0.88)', border: `4px solid ${color}`, boxShadow: `0 0 ${hot ? 60 : 36}px ${color}77`, opacity: o, transform: `scale(${0.82 + 0.18 * s})` }}>
      <div style={{ ...display, fontSize: 150, lineHeight: 1, color }}>{n}<span style={{ fontSize: 84, color: BRAND.white }}>/13</span></div>
      <div style={{ ...display, fontWeight: 800, fontSize: 44, color: BRAND.white }}>{L.t.citiesWord}</div>
    </div>
  );
}

function ScorePop({ frame, fps }: { frame: number; fps: number }) {
  const L = useL();
  const start = T.pin + 4;
  const s = spring({ frame: frame - start, fps, config: { damping: 11, stiffness: 160 } });
  const o = fade(frame, start, start + 4, T.combo - 8, T.combo);
  if (o <= 0) return null;
  const pts = Math.round(interpolate(frame, [start + 3, start + 22], [0, L.t.score1], { ...clamp, easing: Easing.out(Easing.cubic) }));
  return (
    <div style={{ position: 'absolute', left: 250, top: 860, width: 580, textAlign: 'center', padding: '20px 30px 24px', borderRadius: 30, background: 'rgba(7,20,38,0.86)', border: '2px solid rgba(25,230,210,0.5)', opacity: o, transform: `scale(${0.6 + 0.4 * s})` }}>
      <div style={{ ...display, fontSize: 70, color: BRAND.turquoise, textShadow: '0 0 30px rgba(25,230,210,0.6)' }}>{L.t.perfect}</div>
      <div style={{ ...display, fontSize: 104, color: BRAND.yellow, lineHeight: 1 }}>
        +{L.num(pts)} <span style={{ fontSize: 50, fontWeight: 800 }}>{L.t.pts}</span>
      </div>
    </div>
  );
}

function ComboCounter({ frame, fps }: { frame: number; fps: number }) {
  const L = useL();
  let idx = -1;
  for (let i = 0; i < 3; i++) if (frame >= T.seg[i] + T.tapAt) idx = i;
  if (idx < 0 || frame >= T.daily + 4) return null;
  const h = HITS[idx];
  const s = spring({ frame: frame - (T.seg[idx] + T.tapAt), fps, config: { damping: 8, stiffness: 190, mass: 0.7 } });
  const onFire = idx === 2;
  const glow = onFire ? '0 0 50px rgba(255,120,30,0.9), 0 0 110px rgba(255,90,20,0.6)' : `0 0 40px ${h.color}66`;
  const o = 1 - interpolate(frame, [T.daily - 4, T.daily + 4], [0, 1], clamp);
  return (
    <div style={{ position: 'absolute', left: 190, top: 800, width: 700, textAlign: 'center', padding: '14px 20px 20px', borderRadius: 34, background: 'rgba(7,20,38,0.82)', opacity: o, transform: `scale(${0.55 + 0.45 * s}) rotate(${(1 - s) * -8}deg)` }}>
      <div style={{ ...display, fontSize: 190, lineHeight: 1, color: h.color, textShadow: `${glow}, 0 8px 0 rgba(4,12,26,0.6)` }}>{L.t.mult[idx]}</div>
      <div style={{ ...display, fontWeight: 800, fontSize: 60, color: onFire ? '#FFD27A' : BRAND.white, textShadow: onFire ? glow : '0 4px 18px rgba(0,0,0,0.6)' }}>
        {onFire ? '🔥 ' : ''}{L.t.comboLabel[idx]}
      </div>
    </div>
  );
}

function EndCard({ frame, fps, clip }: { frame: number; fps: number; clip: ClipId }) {
  const L = useL();
  const k = interpolate(frame, [T.end, T.end + 18], [0, 1], { ...clamp, easing: ease });
  if (k <= 0) return null;
  const mascot = spring({ frame: frame - (T.end + 8), fps, config: { damping: 10, stiffness: 120 } });
  const word = spring({ frame: frame - (T.end + 16), fps, config: { damping: 14, stiffness: 120 } });
  const tag = interpolate(frame, [T.end + 28, T.end + 40], [0, 1], clamp);
  const cta = spring({ frame: frame - (T.end + 36), fps, config: { damping: 11, stiffness: 150 } });
  const start = T.end + 8;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 42%, rgba(18,52,94,${0.75 * k}) 0%, rgba(7,20,38,${0.93 * k}) 70%)`, alignItems: 'center', paddingTop: 380 }}>
      <div style={{ position: 'absolute', width: 760, height: 760, borderRadius: '50%', background: 'radial-gradient(circle, rgba(25,230,210,0.32) 0%, rgba(25,230,210,0) 65%)', top: 250, opacity: mascot }} />
      <MascotClip clip={clip} box={420} clipFrame={clipFrameAt(clip, frame - start, VERTICAL_FRAMES - start, true)} style={{ transform: `translateY(${(1 - mascot) * 140}px) scale(${0.5 + 0.5 * mascot})`, opacity: Math.min(1, mascot * 1.5), filter: 'drop-shadow(0 18px 30px rgba(0,0,0,0.45))' }} />
      <div style={{ fontFamily: 'Fredoka, Poppins, sans-serif', fontWeight: 700, fontSize: 172, lineHeight: 1, marginTop: 10, transform: `scale(${0.7 + 0.3 * word})`, opacity: Math.min(1, word * 1.6), filter: 'drop-shadow(0 8px 0 rgba(4,12,26,0.65)) drop-shadow(0 4px 24px rgba(4,12,26,0.6))', whiteSpace: 'nowrap' }}>
        <span style={{ backgroundImage: `linear-gradient(180deg, ${BRAND.white} 0%, ${BRAND.white} 48%, #C3CFDD 100%)`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>GEO</span>
        <span style={{ backgroundImage: `linear-gradient(180deg, #8FFBFF 0%, ${BRAND.turquoise} 52%, #0EA89A 100%)`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>SPEED</span>
      </div>
      <div style={{ ...display, fontWeight: 800, fontSize: 62, color: BRAND.white, marginTop: 26, opacity: tag, textAlign: 'center', lineHeight: 1.15 }}>
        {L.t.tagline[0]}<br /><span style={{ color: BRAND.yellow }}>{L.t.tagline[1]}</span>
      </div>
      <div style={{ ...display, fontSize: 58, color: '#0B1F3A', marginTop: 44, padding: '18px 54px 20px', borderRadius: 999, background: `linear-gradient(180deg, #FFE566 0%, ${BRAND.yellow} 100%)`, boxShadow: `0 8px 0 ${BRAND.yellowDeep}, 0 20px 40px rgba(0,0,0,0.4)`, opacity: Math.min(1, cta * 1.5), transform: `scale(${0.6 + 0.4 * cta})` }}>
        {L.t.cta}
      </div>
      <div style={{ ...display, fontWeight: 600, fontSize: 34, color: BRAND.sky, marginTop: 34, opacity: tag, letterSpacing: '0.08em' }}>{L.t.platforms}</div>
    </AbsoluteFill>
  );
}
