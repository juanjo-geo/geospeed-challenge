/**
 * Video de lanzamiento · bloque 3 (escenas 7 a 9 del storyboard, 11,2 s, 1920×1080, 30 fps):
 *  7 · 0–4 s     Amigos: dos teléfonos con la carrera real contra Valentina (su aviso de "ya respondió" y la
 *                comparación), el marcador, y un televisor con la sala en vivo de 20 jugadores
 *  8 · 4–7 s     Aprende: de vuelta en el pin de Katmandú, su foto y su dato curioso, con la reseña real del juego
 *  9 · 7–11,2 s  Cierre: el Explorador, el logo y el lema
 * Empieza donde termina el bloque 2 (teléfono de pie del diario, fichas, racha y mensaje).
 * El rival y los jugadores de la sala son los del simulador de desarrollo del juego; las pantallas son las reales.
 */
import { useEffect, useMemo, useState } from 'react';
import { AbsoluteFill, Audio, Easing, Img, continueRender, delayRender, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { MUSIC_VOLUME, Sfx, type Cue } from './Sfx';
import { LangCtx, getL, useL, type Lang } from './lang';
import { MascotClip, clipFrameAt, type ClipId } from './MascotClip';
import * as THREE from 'three';
import { BRAND, faceRotation, loadBrandFonts } from './brand';
import { GamePhone, Globe, Phone, Shockwave, Stars, SurfacePin, useTextures } from './scene3d';
import { DailyChips } from './scene3dB';
import { Caption, DAILY_PATTERN, DailyPhone, type GlobeState, ShareBubble, Streak, globeAt, onScreen } from './Bloque2';

export const BLOQUE3_FRAMES = 336;
const PREV_END = 270; // cuadro del bloque 2 en que se corta

const T = {
  raceIn: 4, cardIn: 26, pulse: 18, tap: 45,   // escena 7: los dos teléfonos
  tv: 62, tvOut: 114,                          // televisor de la sala
  learn: 120, photo: 138, fact: 150, learnOut: 204,
  end: 210,
};
const KTM = { lat: 27.72, lon: 85.32 };
// Cuadros de la grabación del reto (video/rec/reto)
const RACE_START = 228, CARD_START = 592;

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

function globeNow(frame: number): GlobeState {
  const g0 = globeAt(PREV_END);
  const k7 = interpolate(frame, [0, 22], [0, 1], { ...clamp, easing: ease });
  const k8 = interpolate(frame, [T.learn - 10, T.learn + 18], [0, 1], { ...clamp, easing: ease });
  const k9 = interpolate(frame, [T.end - 6, T.end + 22], [0, 1], { ...clamp, easing: ease });
  const nepal = faceRotation(20, 82);
  const spin = g0.rotY + Math.min(frame, T.learn) * 0.006; // gira despacio detrás de los teléfonos
  const rotY = lerpAngle(spin, nepal.y, k8) + Math.max(0, frame - T.end) * 0.004 * k9;
  return {
    rotY,
    rotX: mix(mix(g0.rotX, 0.25, k7), nepal.x, k8),
    scale: mix(mix(mix(g0.scale, 1.0, k7), 0.86, k8), 1.05, k9),
    x: mix(mix(mix(g0.x, 0, k7), -3.35, k8), 0, k9),
    y: mix(mix(mix(g0.y, -0.2, k7), -0.25, k8), 0, k9),
    z: mix(mix(mix(g0.z, -2.5, k7), 0, k8), -4, k9),
  };
}

// Efectos de sonido del bloque (cuadro, archivo, volumen)
export const BLOQUE3_CUES: Cue[] = [
  [0, 'whoosh', 0.4], [4, 'whoosh', 0.35], [18, 'notify', 0.6], [26, 'whoosh', 0.35],   // la carrera: Valentina ya respondió
  [45, 'ding-1', 0.55], [49, 'count', 0.3],
  [60, 'whoosh-long', 0.4], [68, 'pop', 0.4], [78, 'pop', 0.45],                        // el televisor de la sala
  [112, 'whoosh-long', 0.4], [135, 'thud', 0.6], [138, 'pop', 0.45], [150, 'pop', 0.35], // Katmandú: pin, foto, dato
  [204, 'whoosh-long', 0.4], [218, 'jump', 0.5], [228, 'finale', 0.75], [246, 'sparkle', 0.35], // cierre
];

/** captionOn: el primer texto ya viene en pantalla desde la toma de los amigos (versión para redes) */
export const Bloque3 = ({ solo = true, lang = 'es', mascot = 'a', captionOn = false }: { solo?: boolean; lang?: Lang; mascot?: ClipId; captionOn?: boolean }) => {
  useFonts();
  const { rec, t } = getL(lang);
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const g = globeNow(frame);

  // Lo que venía del bloque 2 se va
  const leave = interpolate(frame, [0, 12], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const dim = interpolate(frame, [0, 20, T.learn - 8, T.learn + 6], [0.62, 0.3, 0.3, 0], clamp);

  // Escena 7: teléfonos de la carrera
  const inL = spring({ frame: frame - T.raceIn, fps, config: { damping: 17, stiffness: 85 } });
  const inR = spring({ frame: frame - T.cardIn, fps, config: { damping: 17, stiffness: 85 } });
  const outP = interpolate(frame, [T.tv - 4, T.tv + 12], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const showPhones = frame >= T.raceIn - 1 && frame < T.tv + 13;
  // Televisor
  const tvK = spring({ frame: frame - T.tv, fps, config: { damping: 15, stiffness: 90 } });
  const tvOut = interpolate(frame, [T.tvOut, T.tvOut + 12], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const showTv = frame >= T.tv - 1 && frame < T.tvOut + 13;

  // Escena 8
  const pinS = spring({ frame: frame - (T.learn + 8), fps, config: { damping: 9, stiffness: 150, mass: 0.6 } });
  const learnK = spring({ frame: frame - (T.learn + 4), fps, config: { damping: 17, stiffness: 80 } });
  const learnOut = interpolate(frame, [T.learnOut, T.learnOut + 12], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const showStory = frame >= T.learn + 3 && frame < T.learnOut + 13;

  // Escena 9
  const endK = interpolate(frame, [T.end, T.end + 24], [0, 1], { ...clamp, easing: ease });

  return (
    <LangCtx.Provider value={lang}>
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 45%, #12345E 0%, ${BRAND.navy} 45%, ${BRAND.navyDeep} 100%)` }}>
      {solo && (
        <Audio src={staticFile('music/track-video.wav')} startFrom={570} volume={(f) => interpolate(f, [0, 8, BLOQUE3_FRAMES - 36, BLOQUE3_FRAMES], [MUSIC_VOLUME, MUSIC_VOLUME, MUSIC_VOLUME, 0], clamp)} />
      )}
      {solo && <Sfx cues={BLOQUE3_CUES} />}
      <ThreeCanvas width={width} height={height} camera={{ position: [0, 0, 10], fov: 35 }} gl={{ antialias: true }}>
        <ambientLight intensity={0.85} />
        <directionalLight position={[-6, 4, 6]} intensity={1.9} />
        <directionalLight position={[6, -2, 3]} intensity={0.5} color={BRAND.turquoise} />
        <Stars spin={(frame + 570) * 0.0006} />

        <group position={[g.x, g.y, g.z]} scale={g.scale}>
          <Globe rotY={g.rotY} rotX={g.rotX}>
            {frame >= T.learn + 8 && frame < T.end + 20 && (
              <SurfacePin lat={KTM.lat} lon={KTM.lon} drop={(1 - pinS) * 1.5} rotX={g.rotX} rotY={g.rotY} scale={1.25 * (1 - interpolate(frame, [T.end, T.end + 14], [0, 1], clamp))} />
            )}
            <Shockwave lat={KTM.lat} lon={KTM.lon} t={(frame - T.learn - 20) / 30} />
          </Globe>
        </group>
        {dim > 0 && (
          <mesh position={[0, 0, -1.4]}>
            <planeGeometry args={[40, 24]} />
            <meshBasicMaterial color={BRAND.navyDeep} transparent opacity={dim} depthWrite={false} toneMapped={false} />
          </mesh>
        )}

        {/* Lo que quedaba del bloque 2: el teléfono del diario y las fichas, saliendo */}
        {leave < 1 && (
          <>
            <group position={[-3.25 - leave * 7, -0.12, 1]} rotation={[0, 0.3 + leave * 0.6, 0]}>
              <DailyPhone src={rec.screens.daily} sheen={0} />
            </group>
            <group position={[1.78, 0.98 + leave * 1.5, 1]} rotation={[-0.12, -0.1, 0]} scale={1 - leave}>
              <DailyChips pattern={DAILY_PATTERN} drop={() => 1} flip={() => 1} />
            </group>
          </>
        )}

        {/* Escena 7: la carrera (izquierda) y la comparación (derecha) */}
        {showPhones && (
          <>
            <group position={[mix(-10, -2.4, inL) - outP * 8, 0.42 + Math.sin(frame / 22) * 0.04, 0.6]} rotation={[0.03, mix(1.2, 0.22, inL), mix(-0.2, 0, inL)]} scale={0.98}>
              <GamePhone dir={rec.race.dir} videoFrame={Math.min(rec.race.raceEnd, rec.race.raceStart + Math.max(0, frame - T.raceIn))} sheen={interpolate(frame, [T.raceIn + 16, T.raceIn + 36], [0, 1], clamp)} flash={0} />
            </group>
            {frame >= T.cardIn - 1 && (
              <group position={[mix(10, 2.4, inR) + outP * 8, -0.5 + Math.sin(frame / 22 + 2) * 0.04, 0.6]} rotation={[0.03, mix(-1.2, -0.22, inR), mix(0.2, 0, inR)]} scale={0.98}>
                <GamePhone dir={rec.race.dir} videoFrame={Math.min(rec.race.cardEnd, rec.race.cardStart + Math.max(0, frame - T.cardIn))} sheen={interpolate(frame, [T.cardIn + 16, T.cardIn + 36], [0, 1], clamp)} flash={0} />
              </group>
            )}
          </>
        )}

        {/* Sala en vivo en un televisor */}
        {showTv && (
          <group position={[0, mix(-7, -0.55, tvK) - tvOut * 7, 1.2]} rotation={[mix(0.5, 0.02, tvK), Math.sin(frame / 30) * 0.06, 0]} scale={0.92}>
            <Tv src={rec.screens.room} />
          </group>
        )}

        {/* Escena 8: la reseña real de Katmandú */}
        {showStory && (
          <group position={[mix(10, 2.05, learnK) + learnOut * 9, -0.45 + Math.sin(frame / 22) * 0.04, 0.6]} rotation={[0.03, mix(-1.2, -0.24, learnK), mix(0.2, 0, learnK)]} scale={1.22}>
            <StoryPhone src={rec.screens.story} sheen={interpolate(frame, [T.learn + 22, T.learn + 44], [0, 1], clamp)} />
          </group>
        )}
      </ThreeCanvas>

      {/* Lo que quedaba del bloque 2 */}
      {leave < 1 && (
        <AbsoluteFill style={{ opacity: 1 - interpolate(frame, [0, 8], [0, 1], clamp) }}>
          <Streak frame={PREV_END} fps={fps} />
          <ShareBubble frame={PREV_END} fps={fps} />
        </AbsoluteFill>
      )}

      <Caption frame={frame} from={captionOn ? -40 : 8} to={T.tvOut + 4}>
        {t.cap7[0]}
        <span style={{ color: BRAND.yellow, opacity: interpolate(frame, [T.tv - 2, T.tv + 8], [0, 1], clamp) }}>{t.cap7[1]}</span>
      </Caption>
      <Versus frame={frame} fps={fps} />
      <TvBadge frame={frame} fps={fps} />

      <Caption frame={frame} from={T.learn + 6} to={T.learnOut + 4}>
        {t.cap8[0]}<span style={{ color: BRAND.yellow }}>{t.cap8[1]}</span>
      </Caption>
      <PhotoCard frame={frame} fps={fps} g={g} />
      <FactCard frame={frame} fps={fps} />

      <EndCard frame={frame} fps={fps} k={endK} clip={mascot} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(3,10,22,0.55) 100%)', pointerEvents: 'none' }} />
    </AbsoluteFill>
    </LangCtx.Provider>
  );
};

/** Televisor: la pantalla para proyectar de la sala (captura real), con marco y pie */
function Tv({ src }: { src: string }) {
  const [tex] = useTextures([src]);
  const stand = useMemo(() => new THREE.MeshStandardMaterial({ color: '#0A111C', roughness: 0.35, metalness: 0.5 }), []);
  return (
    <group>
      <Phone texture={tex} aspect={16 / 9} screenW={6.5} sheen={0} flash={0} />
      <mesh position={[0, -2.08, -0.05]} material={stand}>
        <boxGeometry args={[0.5, 0.5, 0.12]} />
      </mesh>
      <mesh position={[0, -2.36, 0.05]} material={stand}>
        <boxGeometry args={[2.4, 0.09, 0.9]} />
      </mesh>
    </group>
  );
}

function StoryPhone({ sheen, src }: { sheen: number; src: string }) {
  const [tex] = useTextures([src]);
  return <Phone texture={tex} aspect={1704 / 786} sheen={sheen} flash={0} />;
}

/** Marcador de la carrera: los puntos reales de las dos primeras rondas de la grabación */
function Versus({ frame, fps }: { frame: number; fps: number }) {
  const L = useL();
  const s = spring({ frame: frame - (T.raceIn + 10), fps, config: { damping: 13, stiffness: 130 } });
  const o = fade(frame, T.raceIn + 10, T.raceIn + 16, T.tv - 6, T.tv + 2);
  if (o <= 0) return null;
  // Tras la ronda 1: 1.625 – 1.603; tras la ronda 2: 4.109 – 3.385
  const k = interpolate(frame, [T.tap + 4, T.tap + 18], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const [[me0, rival0], [me1, rival1]] = L.rec.race.vs;
  const me = Math.round(mix(me0, me1, k)), rival = Math.round(mix(rival0, rival1, k));
  const fmt = L.num;
  const side = (name: string, pts: number, color: string, hue: boolean) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexDirection: hue ? 'row-reverse' : 'row' }}>
      <div style={{ width: 84, height: 84, borderRadius: '50%', border: `4px solid ${color}`, background: 'rgba(7,20,38,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <Img src={staticFile('mascot/explorer.webp')} style={{ width: 62, filter: hue ? 'hue-rotate(130deg) saturate(1.4)' : undefined }} />
      </div>
      <div style={{ textAlign: hue ? 'right' : 'left' }}>
        <div style={{ ...display, fontWeight: 700, fontSize: 30, color: BRAND.white, lineHeight: 1 }}>{name}</div>
        <div style={{ ...display, fontSize: 58, color, lineHeight: 1.05 }}>{fmt(pts)}</div>
      </div>
    </div>
  );
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 46, opacity: o }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 44, padding: '18px 40px', borderRadius: 34, background: 'rgba(7,20,38,0.88)', border: '2px solid rgba(25,230,210,0.5)', boxShadow: '0 0 44px rgba(25,230,210,0.25)', transform: `translateY(${(1 - s) * 60}px) scale(${0.8 + 0.2 * s})` }}>
        {side(L.t.you, me, BRAND.yellow, false)}
        <div style={{ ...display, fontSize: 40, color: BRAND.sky }}>VS</div>
        {side('Valentina', rival, BRAND.turquoise, true)}
      </div>
    </AbsoluteFill>
  );
}

function TvBadge({ frame, fps }: { frame: number; fps: number }) {
  const L = useL();
  const s = spring({ frame: frame - (T.tv + 16), fps, config: { damping: 11, stiffness: 160 } });
  const o = fade(frame, T.tv + 16, T.tv + 20, T.tvOut - 2, T.tvOut + 6);
  if (o <= 0) return null;
  return (
    <div style={{ position: 'absolute', left: 1390, top: 196, opacity: o, transform: `scale(${0.5 + 0.5 * s}) rotate(${6 - (1 - s) * 14}deg)`, padding: '14px 30px 16px', borderRadius: 26, background: BRAND.yellow, boxShadow: '0 14px 40px rgba(0,0,0,0.45)' }}>
      <div style={{ ...display, fontSize: 46, color: '#0B1F3A', lineHeight: 1, whiteSpace: 'nowrap' }}>{L.t.tvBadge[0]}</div>
      <div style={{ ...display, fontWeight: 700, fontSize: 28, color: '#0B1F3A', marginTop: 4, whiteSpace: 'nowrap' }}>{L.t.tvBadge[1]}</div>
    </div>
  );
}

/** Foto real de Katmandú (CC0), saliendo del pin */
function PhotoCard({ frame, fps, g }: { frame: number; fps: number; g: GlobeState }) {
  const L = useL();
  const s = spring({ frame: frame - T.photo, fps, config: { damping: 11, stiffness: 150 } });
  const o = fade(frame, T.photo, T.photo + 3, T.learnOut - 2, T.learnOut + 8);
  if (o <= 0) return null;
  const p = onScreen(KTM.lat, KTM.lon, g, 1.1);
  return (
    <div style={{ position: 'absolute', left: Math.max(36, p.x - 330), top: p.y - 330, width: 330, padding: '12px 12px 14px', background: '#F4F7FB', borderRadius: 14, boxShadow: '0 20px 50px rgba(0,0,0,0.55)', opacity: o, transform: `scale(${0.3 + 0.7 * s}) rotate(${-7 + (1 - s) * 16}deg)`, transformOrigin: '80% 100%' }}>
      <Img src={staticFile('photos/katmandu.webp')} style={{ width: '100%', height: 220, objectFit: 'cover', borderRadius: 8, display: 'block' }} />
      <div style={{ ...display, fontWeight: 800, fontSize: 30, color: '#0B1F3A', marginTop: 8, textAlign: 'center' }}>{L.t.photo}</div>
    </div>
  );
}

function FactCard({ frame, fps }: { frame: number; fps: number }) {
  const L = useL();
  const s = spring({ frame: frame - T.fact, fps, config: { damping: 13, stiffness: 140 } });
  const o = fade(frame, T.fact, T.fact + 4, T.learnOut - 2, T.learnOut + 8);
  if (o <= 0) return null;
  return (
    <div style={{ position: 'absolute', left: 60, top: 812, width: 690, padding: '18px 26px 20px', borderRadius: 26, background: 'rgba(7,20,38,0.92)', border: '2px solid rgba(255,217,59,0.6)', boxShadow: '0 0 40px rgba(255,217,59,0.2)', opacity: o, transform: `translateY(${(1 - s) * 50}px)` }}>
      <div style={{ ...display, fontSize: 30, color: BRAND.yellow }}>{L.t.factTitle}</div>
      <div style={{ ...display, fontWeight: 600, fontSize: 28, lineHeight: 1.28, color: BRAND.white, marginTop: 6 }}>
        {L.t.fact}
      </div>
    </div>
  );
}

function EndCard({ frame, fps, k, clip }: { frame: number; fps: number; k: number; clip: ClipId }) {
  const L = useL();
  if (k <= 0) return null;
  const mascot = spring({ frame: frame - (T.end + 8), fps, config: { damping: 10, stiffness: 120 } });
  const word = spring({ frame: frame - (T.end + 18), fps, config: { damping: 14, stiffness: 120 } });
  const tag = interpolate(frame, [T.end + 34, T.end + 50], [0, 1], clamp);
  const start = T.end + 8;   // el Explorador animado arranca al aparecer y termina en su pose justo antes del final
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 50%, rgba(18,52,94,${0.75 * k}) 0%, rgba(7,20,38,${0.93 * k}) 70%)`, alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', width: 620, height: 620, borderRadius: '50%', background: 'radial-gradient(circle, rgba(25,230,210,0.32) 0%, rgba(25,230,210,0) 65%)', top: 120, opacity: mascot }} />
      <MascotClip clip={clip} box={330} clipFrame={clipFrameAt(clip, frame - start, BLOQUE3_FRAMES - start)} style={{ transform: `translateY(${(1 - mascot) * 120}px) scale(${0.5 + 0.5 * mascot})`, opacity: Math.min(1, mascot * 1.5), filter: 'drop-shadow(0 18px 30px rgba(0,0,0,0.45))' }} />
      <div style={{ fontFamily: 'Fredoka, Poppins, sans-serif', fontWeight: 700, fontSize: 150, lineHeight: 1, marginTop: 6, transform: `scale(${0.7 + 0.3 * word})`, opacity: Math.min(1, word * 1.6), filter: 'drop-shadow(0 8px 0 rgba(4,12,26,0.65)) drop-shadow(0 4px 24px rgba(4,12,26,0.6))' }}>
        <span style={{ backgroundImage: `linear-gradient(180deg, ${BRAND.white} 0%, ${BRAND.white} 48%, #C3CFDD 100%)`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>GEO</span>
        <span style={{ backgroundImage: `linear-gradient(180deg, #8FFBFF 0%, ${BRAND.turquoise} 52%, #0EA89A 100%)`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>SPEED</span>
      </div>
      <div style={{ ...display, fontWeight: 800, fontSize: 54, color: BRAND.white, marginTop: 22, opacity: tag, transform: `translateY(${(1 - tag) * 16}px)` }}>
        {L.t.tagline[0]}<span style={{ color: BRAND.yellow }}>{L.t.tagline[1]}</span>
      </div>
      <div style={{ ...display, fontWeight: 600, fontSize: 30, color: BRAND.sky, marginTop: 18, opacity: tag, letterSpacing: '0.08em' }}>
        {L.t.platforms}
      </div>
    </AbsoluteFill>
  );
}
