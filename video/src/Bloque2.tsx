/**
 * Video de lanzamiento · bloque 2 (escenas 4 a 6 del storyboard, 9 s, 1920×1080, 30 fps):
 *  4 · 0–3 s  Categorías: el globo se detiene tres veces — una bandera (el país sube en relieve), un río que se
 *             enciende y la foto de un monumento
 *  5 · 3–6 s  Regiones: vuelo hasta Colombia, los departamentos suben uno por uno y pasa el teléfono con una
 *             pregunta real del pack (Antioquia)
 *  6 · 6–9 s  Diario: teléfono de pie con el desafío de hoy, las 13 fichas, la racha y el mensaje para compartir
 * Empieza donde termina el bloque 1 (globo a la izquierda, teléfono grande en llamas).
 */
import { useEffect, useState } from 'react';
import { AbsoluteFill, Audio, Easing, Img, continueRender, delayRender, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { MUSIC_VOLUME, Sfx, type Cue } from './Sfx';
import { LangCtx, getL, useL, type Lang } from './lang';
import * as THREE from 'three';
import { BRAND, faceRotation, latLonToVec, loadBrandFonts } from './brand';
import { GLOBE_R, GamePhone, Globe, Phone, Shockwave, Stars, SurfacePin, useTextures } from './scene3d';
import { CountryRelief, DEPARTMENT_COUNT, DailyChips, Departments, River, SouthAmericaPatch } from './scene3dB';

export const BLOQUE2_FRAMES = 276;

const T = {
  flag: 14, river: 40, monument: 70,   // llegada a cada parada de la escena 4
  fly: 90, land: 122,                  // vuelo a Colombia
  rise: 114,                           // empiezan a subir los departamentos
  phoneIn: 126, tap: 152, phoneOut: 174,
  daily: 180, dailyIn: 200,
  chips: 194, flip: 222, streak: 240, bubble: 248,
};
const AUSTRALIA = { lonMin: 108, lonMax: 158, latMin: -46, latMax: -8 };
const MACHU = { lat: -13.16, lon: -72.55 };
const ANTIOQUIA = { lat: 6.92, lon: -75.58 };
const TILT = 36;                // grados que se inclina Colombia respecto de la cámara
const TAP_VIDEO_FRAME = 173;    // cuadro de la grabación del pack en que reacciona al toque
export const DAILY_PATTERN = 'GGYGGRGGYGGRG'; // 11/13: 9 rápidas, 2 lentas, 2 fallos

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const ease = Easing.bezier(0.65, 0, 0.35, 1);
const display: React.CSSProperties = { fontFamily: 'Poppins, sans-serif', fontWeight: 900, letterSpacing: '-0.01em' };
const lerpAngle = (a: number, b: number, k: number) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * k;
const mix = (a: number, b: number, k: number) => a + (b - a) * k;
const fade = (frame: number, a: number, b: number, c: number, d: number) => interpolate(frame, [a, b, c, d], [0, 1, 1, 0], clamp);

// Cámara de la escena: en (0, 0, 10) mirando al origen, 35° de campo vertical
const CAM_Z = 10;
const FOCAL = 540 / Math.tan((35 / 2) * (Math.PI / 180));
export interface GlobeState { x: number; y: number; z: number; scale: number; rotX: number; rotY: number }
/** Punto del globo (lat, lon, a r radios) → píxel de pantalla */
export function onScreen(lat: number, lon: number, g: GlobeState, r = 1) {
  const v = new THREE.Vector3(...latLonToVec(lat, lon, GLOBE_R * r));
  v.applyAxisAngle(new THREE.Vector3(0, 1, 0), g.rotY).applyAxisAngle(new THREE.Vector3(1, 0, 0), g.rotX).multiplyScalar(g.scale);
  v.add(new THREE.Vector3(g.x, g.y, g.z));
  const d = CAM_Z - v.z;
  return { x: 960 + (v.x * FOCAL) / d, y: 540 - (v.y * FOCAL) / d, front: v.z - g.z > 0 };
}

function useFonts() {
  const [handle] = useState(() => delayRender('Fuentes de la marca'));
  useEffect(() => { loadBrandFonts().then(() => continueRender(handle)); }, [handle]);
}

export function globeAt(frame: number): GlobeState {
  // Giro: una cadena de paradas, cada una con su tramo de cuadros
  const start = faceRotation(30, 4);
  let rotY = start.y + 0.1128, rotX = start.x;
  const stops: [number, number, { y: number; x: number }][] = [
    [0, T.flag, faceRotation(-14, 134)],
    [T.river - 10, T.river + 2, faceRotation(13, 30)],
    [T.monument - 10, T.monument + 2, faceRotation(-6, -70)],
    [T.fly, T.land, faceRotation(4.5 - TILT, -73.2)],
    [T.daily, T.dailyIn, faceRotation(8, -62)],
  ];
  for (const [a, b, to] of stops) {
    const k = interpolate(frame, [a, b], [0, 1], { ...clamp, easing: ease });
    rotY = lerpAngle(rotY, to.y, k);
    rotX = mix(rotX, to.x, k);
  }
  rotY += Math.max(0, frame - T.dailyIn) * 0.0015;
  const k0 = interpolate(frame, [0, T.flag], [0, 1], { ...clamp, easing: ease });
  const k1 = interpolate(frame, [T.fly, T.land], [0, 1], { ...clamp, easing: ease });
  const k2 = interpolate(frame, [T.daily, T.dailyIn], [0, 1], { ...clamp, easing: ease });
  const R = GLOBE_R * 3.05;
  return {
    rotX, rotY,
    scale: mix(mix(mix(0.607, 1, k0), 3.05, k1), 1.3, k2),
    x: mix(mix(mix(-3.95, 0, k0), -1.15, k1), 0.9, k2),
    y: mix(mix(mix(-1.12, -0.2, k0), -R * Math.sin(TILT * Math.PI / 180) - 0.2, k1), -0.1, k2),
    z: mix(0, -4.5, k2),
  };
}

// Efectos de sonido del bloque (cuadro, archivo, volumen)
export const BLOQUE2_CUES: Cue[] = [
  [0, 'whoosh-long', 0.45], [12, 'thud', 0.45], [16, 'pop', 0.45],          // Australia sube y sale su bandera
  [30, 'whoosh', 0.4], [39, 'sparkle', 0.45], [46, 'pop', 0.4],             // el Nilo se enciende
  [60, 'whoosh', 0.4], [73, 'thud', 0.6], [75, 'pop', 0.45],                // pin y foto de Machu Picchu
  [90, 'whoosh-deep', 0.6], [114, 'cascade', 0.4], [126, 'whoosh', 0.35],   // vuelo a Colombia, suben los departamentos
  [152, 'ding-2', 0.55], [153, 'pop', 0.4], [174, 'whoosh', 0.3],           // Antioquia
  [180, 'whoosh-long', 0.45], [201, 'chips-fall', 0.5], [226, 'chips-flip', 0.45],
  [240, 'streak', 0.55], [248, 'message', 0.6],
];

/** solo = el bloque se ve aparte (lleva su propia música); dentro del video completo la música va por fuera */
export const Bloque2 = ({ solo = true, lang = 'es' }: { solo?: boolean; lang?: Lang }) => {
  useFonts();
  const { rec, t } = getL(lang);
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const g = globeAt(frame);

  // Lo que venía del bloque 1 se va en los primeros cuadros
  const leave = interpolate(frame, [0, 12], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const oldPins = 1 - interpolate(frame, [0, 10], [0, 1], clamp);

  // Escena 4
  const flagRise = spring({ frame: frame - (T.flag - 3), fps, config: { damping: 10, stiffness: 130 } }) * (1 - interpolate(frame, [T.river - 12, T.river - 6], [0, 1], clamp));
  const riverK = interpolate(frame, [T.river - 2, T.river + 13], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) }) * (frame < T.fly + 6 ? 1 : 0);
  const pinS = spring({ frame: frame - (T.monument - 4), fps, config: { damping: 9, stiffness: 150, mass: 0.6 } });
  const showMachuPin = frame >= T.monument - 4 && frame < T.fly + 8;

  // Escena 5
  const patch = fade(frame, T.fly - 6, T.fly + 8, T.dailyIn + 2, T.dailyIn + 10);
  const sink = 1 - interpolate(frame, [T.daily - 2, T.daily + 8], [0, 1], clamp);
  const rise = (i: number) => spring({ frame: frame - (T.rise + i * 1.25), fps, config: { damping: 9, stiffness: 160, mass: 0.7 } }) * sink;
  const hk = spring({ frame: frame - T.tap, fps, config: { damping: 9, stiffness: 170 } }) * sink;
  const phoneK = spring({ frame: frame - T.phoneIn, fps, config: { damping: 16, stiffness: 90 } });
  const phoneGo = interpolate(frame, [T.phoneOut, T.phoneOut + 12], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const showCoPhone = frame >= T.phoneIn - 1 && frame < T.phoneOut + 13;

  // Escena 6
  const dim = interpolate(frame, [T.daily + 2, T.dailyIn], [0, 0.62], clamp);
  const dailyK = spring({ frame: frame - (T.daily + 6), fps, config: { damping: 17, stiffness: 80 } });
  const drop = (i: number) => spring({ frame: frame - (T.chips + i * 2), fps, config: { damping: 11, stiffness: 150, mass: 0.8 } });
  const flip = (i: number) => interpolate(frame, [T.flip + i * 1.6, T.flip + i * 1.6 + 8], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });

  return (
    <LangCtx.Provider value={lang}>
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 45%, #12345E 0%, ${BRAND.navy} 45%, ${BRAND.navyDeep} 100%)` }}>
      {solo && (<Audio src={staticFile('music/track-video.wav')} startFrom={300} volume={(f) => interpolate(f, [0, 8, BLOQUE2_FRAMES - 24, BLOQUE2_FRAMES], [MUSIC_VOLUME, MUSIC_VOLUME, MUSIC_VOLUME, 0], clamp)} />)}
      {solo && <Sfx cues={BLOQUE2_CUES} />}
      <ThreeCanvas width={width} height={height} camera={{ position: [0, 0, 10], fov: 35 }} gl={{ antialias: true }}>
        <ambientLight intensity={0.85} />
        <directionalLight position={[-6, 4, 6]} intensity={1.9} />
        <directionalLight position={[6, -2, 3]} intensity={0.5} color={BRAND.turquoise} />
        <Stars spin={(frame + 300) * 0.0006} />

        <group position={[g.x, g.y, g.z]} scale={g.scale}>
          <Globe rotY={g.rotY} rotX={g.rotX}>
            {oldPins > 0 && [[27.72, 85.32], [47.5, 19.04], [14.69, -17.44], [52.23, 21.01]].map(([lat, lon]) => (
              <SurfacePin key={lat} lat={lat} lon={lon} drop={0} rotX={g.rotX} rotY={g.rotY} scale={1.2 * oldPins} />
            ))}
            <CountryRelief name="Australia" window={AUSTRALIA} rise={flagRise} />
            <River id="feat:nilo" progress={riverK} />
            {showMachuPin && <SurfacePin lat={MACHU.lat} lon={MACHU.lon} drop={(1 - pinS) * 1.5} rotX={g.rotX} rotY={g.rotY} scale={1.2 * (1 - interpolate(frame, [T.fly, T.fly + 8], [0, 1], clamp))} />}
            <Shockwave lat={MACHU.lat} lon={MACHU.lon} t={(frame - T.monument - 6) / 30} />
            <SouthAmericaPatch opacity={patch} />
            {frame >= T.rise - 2 && sink > 0 && <Departments rise={rise} highlight={{ id: rec.pack.dept.id, k: hk }} />}
          </Globe>
        </group>

        {/* Teléfono del bloque 1, saliendo */}
        {leave < 1 && (
          <group position={[1.62 + leave * 9, -0.5 + leave * 1.2, 0.2]} rotation={[0.04, -0.13 - leave * 0.6, leave * 0.25]} scale={1.4}>
            <GamePhone dir={rec.game.dir} videoFrame={rec.game.leave} sheen={0} flash={0} />
          </group>
        )}

        {/* Escena 5: teléfono con la pregunta real del pack Colombia, delante del mapa */}
        {showCoPhone && (
          <group
            position={[mix(3.2, 0.68, phoneK) + phoneGo * 2.6, -0.33 + Math.sin(frame / 20) * 0.012, 7.6]}
            rotation={[0.03, mix(-1.1, -0.2, phoneK) - phoneGo * 0.5, mix(0.2, 0, phoneK)]}
            scale={0.255}
          >
            <GamePhone dir={rec.pack.dir} videoFrame={Math.max(rec.pack.lo, Math.min(rec.pack.hi, rec.pack.tap + (frame - T.tap)))} sheen={interpolate(frame, [T.phoneIn + 14, T.phoneIn + 34], [0, 1], clamp)} flash={0} />
          </group>
        )}

        {/* Escena 6: el globo queda de fondo, atenuado */}
        {dim > 0 && (
          <mesh position={[0, 0, -1.4]}>
            <planeGeometry args={[40, 24]} />
            <meshBasicMaterial color={BRAND.navyDeep} transparent opacity={dim} depthWrite={false} toneMapped={false} />
          </mesh>
        )}
        {frame >= T.daily + 5 && (
          <group position={[mix(-9, -3.25, dailyK), -0.12 + Math.sin(frame / 24) * 0.04, 1]} rotation={[0, mix(1.1, 0.3, dailyK), mix(-0.15, 0, dailyK)]}>
            <DailyPhone src={rec.screens.daily} sheen={interpolate(frame, [T.dailyIn + 4, T.dailyIn + 26], [0, 1], clamp)} />
          </group>
        )}
        {frame >= T.chips - 1 && (
          <group position={[1.78, 0.98, 1]} rotation={[-0.12, -0.1, 0]}>
            <DailyChips pattern={DAILY_PATTERN} drop={drop} flip={flip} />
          </group>
        )}
      </ThreeCanvas>

      {/* Lo que quedaba del bloque 1 */}
      <AbsoluteFill style={{ boxShadow: `inset 0 0 160px rgba(255,110,30,${0.75 * (1 - interpolate(frame, [0, 8], [0, 1], clamp))})`, pointerEvents: 'none' }} />

      <CategoryCaption frame={frame} fps={fps} />
      <FlagCard frame={frame} fps={fps} g={g} />
      <RiverCard frame={frame} fps={fps} g={g} />
      <MonumentCard frame={frame} fps={fps} g={g} />

      <Caption frame={frame} from={T.fly + 6} to={T.phoneOut + 2}>
        {t.cap5[0]}<span style={{ color: BRAND.yellow }}>{t.cap5[1]}</span>
      </Caption>
      <DeptLabel frame={frame} fps={fps} g={g} />

      <Caption frame={frame} from={T.daily + 8} to={BLOQUE2_FRAMES + 40}>
        {t.cap6[0]}<span style={{ color: BRAND.yellow }}>{t.cap6[1]}</span>
      </Caption>
      <Streak frame={frame} fps={fps} />
      <ShareBubble frame={frame} fps={fps} />

      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(3,10,22,0.55) 100%)', pointerEvents: 'none' }} />
    </AbsoluteFill>
    </LangCtx.Provider>
  );
};

/** Teléfono de pie con la pantalla real del desafío de hoy */
export function DailyPhone({ sheen, src = 'screens/diario.jpg' }: { sheen: number; src?: string }) {
  const [tex] = useTextures([src]);
  return <Phone texture={tex} aspect={1179 / 2556} screenW={2.02} sheen={sheen} flash={0} />;
}

export function Caption({ frame, from, to, children }: { frame: number; from: number; to: number; children: React.ReactNode }) {
  const o = fade(frame, from, from + 10, to - 8, to);
  const y = interpolate(frame, [from, from + 14], [26, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
  if (o <= 0) return null;
  return (
    <AbsoluteFill style={{ alignItems: 'center', paddingTop: 52, opacity: o }}>
      <div style={{ ...display, fontSize: 70, color: BRAND.white, transform: `translateY(${y}px)`, textShadow: '0 6px 30px rgba(0,0,0,0.6)' }}>{children}</div>
    </AbsoluteFill>
  );
}

/** "Ciudades, banderas, lugares y monumentos": cada palabra entra con su parada y la actual va en amarillo */
function CategoryCaption({ frame, fps }: { frame: number; fps: number }) {
  const L = useL();
  const words = [
    { t: L.t.cats[0], at: 3 },
    { t: L.t.cats[1], at: T.flag - 2 },
    { t: L.t.cats[2], at: T.river - 2 },
    { t: L.t.cats[3], at: T.monument - 2 },
  ];
  const out = interpolate(frame, [T.fly - 2, T.fly + 8], [1, 0], clamp);
  if (out <= 0) return null;
  let current = 0;
  words.forEach((w, i) => { if (frame >= w.at) current = i; });
  return (
    <AbsoluteFill style={{ alignItems: 'center', paddingTop: 54, opacity: out }}>
      <div style={{ display: 'flex', gap: 22 }}>
        {words.map((w, i) => {
          const s = spring({ frame: frame - w.at, fps, config: { damping: 12, stiffness: 170 } });
          return (
            <span key={w.t} style={{ ...display, fontSize: 68, display: 'inline-block', color: i === current ? BRAND.yellow : BRAND.white, opacity: Math.min(1, s * 1.5), transform: `translateY(${(1 - s) * 34}px) scale(${0.85 + 0.15 * s})`, textShadow: '0 6px 28px rgba(0,0,0,0.6)' }}>
              {w.t}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

const card: React.CSSProperties = { position: 'absolute', background: 'rgba(7,20,38,0.9)', border: '2px solid rgba(25,230,210,0.55)', borderRadius: 26, boxShadow: '0 18px 50px rgba(0,0,0,0.5), 0 0 40px rgba(25,230,210,0.25)' };

function FlagCard({ frame, fps, g }: { frame: number; fps: number; g: GlobeState }) {
  const L = useL();
  const s = spring({ frame: frame - (T.flag + 1), fps, config: { damping: 11, stiffness: 150 } });
  const o = fade(frame, T.flag + 1, T.flag + 4, T.river - 13, T.river - 8);
  if (o <= 0) return null;
  const p = onScreen(-10, 134, g, 1.06);
  return (
    <div style={{ ...card, left: p.x - 170, top: p.y - 330, width: 340, padding: 18, opacity: o, transform: `scale(${0.5 + 0.5 * s}) rotate(${-4 + (1 - s) * 10}deg)`, transformOrigin: '50% 100%' }}>
      <Img src={staticFile('flags/AU.svg')} style={{ width: '100%', borderRadius: 12, display: 'block' }} />
      <div style={{ ...display, fontWeight: 800, fontSize: L.lang === 'en' ? 27 : 32, color: BRAND.white, textAlign: 'center', marginTop: 12, whiteSpace: 'nowrap' }}>{L.t.flagQ}</div>
    </div>
  );
}

function RiverCard({ frame, fps, g }: { frame: number; fps: number; g: GlobeState }) {
  const L = useL();
  const s = spring({ frame: frame - (T.river + 5), fps, config: { damping: 11, stiffness: 150 } });
  const o = fade(frame, T.river + 5, T.river + 8, T.monument - 13, T.monument - 8);
  if (o <= 0) return null;
  const p = onScreen(18, 33, g, 1.02);
  return (
    <div style={{ ...card, left: p.x + 70, top: p.y - 70, padding: '18px 30px 20px', opacity: o, transform: `scale(${0.5 + 0.5 * s})`, transformOrigin: '0% 50%' }}>
      <div style={{ ...display, fontSize: 54, color: BRAND.turquoise, lineHeight: 1.05, whiteSpace: 'nowrap' }}>{L.t.river[0]}</div>
      <div style={{ ...display, fontWeight: 600, fontSize: 30, color: BRAND.sky, marginTop: 4, whiteSpace: 'nowrap' }}>{L.t.river[1]}</div>
    </div>
  );
}

function MonumentCard({ frame, fps, g }: { frame: number; fps: number; g: GlobeState }) {
  const L = useL();
  const s = spring({ frame: frame - (T.monument + 4), fps, config: { damping: 11, stiffness: 150 } });
  const o = fade(frame, T.monument + 4, T.monument + 7, T.fly + 2, T.fly + 10);
  if (o <= 0) return null;
  const p = onScreen(MACHU.lat, MACHU.lon, g, 1.12);
  return (
    <div style={{ ...card, left: p.x + 40, top: p.y - 330, width: 420, padding: 14, opacity: o, transform: `scale(${0.5 + 0.5 * s}) rotate(${3 - (1 - s) * 10}deg)`, transformOrigin: '0% 100%' }}>
      <Img src={staticFile('photos/machu-picchu.webp')} style={{ width: '100%', height: 262, objectFit: 'cover', borderRadius: 14, display: 'block' }} />
      <div style={{ ...display, fontWeight: 800, fontSize: 34, color: BRAND.white, marginTop: 10, paddingLeft: 6 }}>
        {L.t.machu[0]} <span style={{ color: BRAND.sky, fontWeight: 600, fontSize: 28 }}>{L.t.machu[1]}</span>
      </div>
    </div>
  );
}

function DeptLabel({ frame, fps, g }: { frame: number; fps: number; g: GlobeState }) {
  const L = useL();
  const s = spring({ frame: frame - (T.tap + 2), fps, config: { damping: 10, stiffness: 170 } });
  const o = fade(frame, T.tap + 2, T.tap + 5, T.phoneOut - 2, T.phoneOut + 6);
  if (o <= 0) return null;
  const p = onScreen(L.rec.pack.dept.lat + 0.4, L.rec.pack.dept.lon, g, 1.08);
  return (
    <div style={{ position: 'absolute', left: p.x, top: p.y - 96, transform: `translateX(-50%) scale(${0.5 + 0.5 * s})`, transformOrigin: '50% 100%', opacity: o, padding: '10px 28px 12px', borderRadius: 999, background: 'rgba(7,20,38,0.92)', border: `3px solid ${BRAND.turquoise}`, boxShadow: '0 0 34px rgba(25,230,210,0.5)', whiteSpace: 'nowrap' }}>
      <span style={{ ...display, fontSize: 44, color: BRAND.turquoise }}>✓ {L.rec.pack.dept.name}</span>
    </div>
  );
}

export function Streak({ frame, fps }: { frame: number; fps: number }) {
  const L = useL();
  const inS = spring({ frame: frame - (T.streak - 12), fps, config: { damping: 13, stiffness: 140 } });
  if (frame < T.streak - 12) return null;
  const bump = spring({ frame: frame - T.streak, fps, config: { damping: 7, stiffness: 220, mass: 0.6 } });
  const n = frame >= T.streak ? 7 : 6;
  return (
    <div style={{ position: 'absolute', left: 850, top: 606, display: 'flex', alignItems: 'center', gap: 18, padding: '16px 34px 18px 26px', borderRadius: 30, background: 'rgba(7,20,38,0.9)', border: '2px solid rgba(255,138,61,0.7)', boxShadow: '0 0 40px rgba(255,120,30,0.35)', opacity: Math.min(1, inS * 1.5), transform: `translateY(${(1 - inS) * 40}px)` }}>
      <span style={{ fontSize: 86, lineHeight: 1 }}>🔥</span>
      <div>
        <div style={{ ...display, fontSize: 96, lineHeight: 0.95, color: '#FFB347', transform: `scale(${1 + (frame >= T.streak ? (1 - bump) * 0.5 : 0)})`, transformOrigin: '0% 60%', textShadow: '0 0 30px rgba(255,120,30,0.6)' }}>{n}</div>
        <div style={{ ...display, fontWeight: 700, fontSize: 30, color: BRAND.white, whiteSpace: 'nowrap' }}>{L.t.streak}</div>
      </div>
    </div>
  );
}

export function ShareBubble({ frame, fps }: { frame: number; fps: number }) {
  const L = useL();
  const s = spring({ frame: frame - T.bubble, fps, config: { damping: 11, stiffness: 160 } });
  if (frame < T.bubble) return null;
  const colors = { G: BRAND.turquoise, Y: BRAND.yellow, R: BRAND.coral } as const;
  return (
    <div style={{ position: 'absolute', left: 1320, top: 600, width: 470, padding: '20px 26px 22px', borderRadius: '30px 30px 30px 8px', background: '#E7FBE9', boxShadow: '0 18px 50px rgba(0,0,0,0.5)', transform: `scale(${0.4 + 0.6 * s})`, transformOrigin: '0% 100%', opacity: Math.min(1, s * 1.6) }}>
      <div style={{ ...display, fontWeight: 800, fontSize: 36, color: '#0B1F3A' }}>{L.t.bubble[0]}</div>
      <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
        {DAILY_PATTERN.split('').map((c, i) => (
          <div key={i} style={{ width: 26, height: 26, borderRadius: 6, background: colors[c as keyof typeof colors] }} />
        ))}
      </div>
      <div style={{ ...display, fontWeight: 600, fontSize: 30, color: '#0B1F3A', marginTop: 12 }}>{L.t.bubble[1]}</div>
    </div>
  );
}
