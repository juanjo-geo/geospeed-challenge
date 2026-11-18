/**
 * Escena de prueba del video de lanzamiento (13 s, 1920×1080, 30 fps):
 *  0,0–3,0 s  globo 3D con el mapa del juego + "¿Cuánto conoces el mundo?"
 *  3,0–6,0 s  "¿Dónde está Buenos Aires?" → el pin cae, onda, ¡PERFECTO! +2.005
 *  6,0–10 s   el globo se corre y entra el teléfono 3D con la partida real (pregunta → respuesta)
 *  10–13 s    cierre: Explorador + GEOSPEED + lema
 */
import { useEffect, useState } from 'react';
import {
  AbsoluteFill, Audio, Easing, Img, continueRender, delayRender, interpolate, spring, staticFile,
  useCurrentFrame, useVideoConfig,
} from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { BRAND, faceRotation, loadBrandFonts } from './brand';
import { Globe, StillPhone as Phone, Shockwave, Stars, SurfacePin } from './scene3d';

export const ESCENA_FRAMES = 390;

const BA = { lat: -34.6, lon: -58.4 };
const T = {
  pinDrop: 128,       // el pin toca el suelo (respuesta en 1,5 s, como la captura)
  globeAside: 172,    // el globo se corre a la izquierda
  phoneIn: 182,
  swap: 262,          // la pantalla pasa de la pregunta a la respuesta
  end: 304,           // cierre
};

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const ease = Easing.bezier(0.65, 0, 0.35, 1);

function useFonts() {
  const [handle] = useState(() => delayRender('Fuentes de la marca'));
  useEffect(() => { loadBrandFonts().then(() => continueRender(handle)); }, [handle]);
}

export const EscenaPrueba = () => {
  useFonts();
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // ── Cierre: la escena 3D se aleja y se oscurece ──
  const endK = interpolate(frame, [T.end, T.end + 26], [0, 1], { ...clamp, easing: ease });

  // ── Globo: gira desde África hasta dejar Buenos Aires de frente, luego sigue despacio ──
  const startRot = faceRotation(10, 25);
  const baRot = faceRotation(-22, -50); // Buenos Aires queda un poco abajo a la izquierda del centro
  const k = interpolate(frame, [0, T.pinDrop - 8], [0, 1], { ...clamp, easing: ease });
  const drift = Math.max(0, frame - T.pinDrop) * 0.0022;
  // camino corto entre ángulos
  let dy = baRot.y - startRot.y;
  dy = Math.atan2(Math.sin(dy), Math.cos(dy));
  const rotY = startRot.y + dy * k + drift;
  const rotX = interpolate(k, [0, 1], [startRot.x, baRot.x]);
  const intro = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 70 });
  const aside = interpolate(frame, [T.globeAside, T.globeAside + 40], [0, 1], { ...clamp, easing: ease });
  const globeScale = (0.82 + 0.18 * intro) * (1 - 0.24 * aside);
  const globeX = -3.35 * aside * (1 - endK);
  const globeY = interpolate(intro, [0, 1], [-0.6, 0]) - 0.3 * aside * (1 - endK);

  // ── Pin + onda ──
  const pinSpring = spring({ frame: frame - (T.pinDrop - 12), fps, config: { damping: 9, stiffness: 140, mass: 0.6 } });
  const pinDrop = frame < T.pinDrop - 12 ? 99 : (1 - pinSpring) * 1.6;
  const showPin = frame >= T.pinDrop - 12;
  const wave1 = (frame - T.pinDrop) / 34;
  const wave2 = (frame - T.pinDrop - 9) / 34;

  // ── Teléfono ──
  const phoneK = spring({ frame: frame - T.phoneIn, fps, config: { damping: 18, stiffness: 70, mass: 1.1 } });
  const phoneX = interpolate(phoneK, [0, 1], [10, 1.82]);
  const phoneZ = interpolate(phoneK, [0, 1], [-3, 0.6]);
  const phoneRotY = interpolate(phoneK, [0, 1], [-1.25, -0.3]) + Math.sin(frame / 38) * 0.03;
  const phoneRotZ = interpolate(phoneK, [0, 1], [0.22, 0]) + Math.sin(frame / 31) * 0.012;
  const phoneFloat = Math.sin(frame / 22) * 0.06;
  const sheenA = interpolate(frame, [T.phoneIn + 30, T.phoneIn + 58], [0, 1], clamp);
  const sheenB = interpolate(frame, [T.swap + 4, T.swap + 30], [0, 1], clamp);
  const sheen = frame < T.swap ? sheenA : sheenB;
  const flash = interpolate(frame, [T.swap - 3, T.swap, T.swap + 10], [0, 0.85, 0], clamp);

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 45%, #12345E 0%, ${BRAND.navy} 45%, ${BRAND.navyDeep} 100%)` }}>
      <Audio
        src={staticFile('music/track-video.wav')}
        volume={(f) => interpolate(f, [0, 20, ESCENA_FRAMES - 30, ESCENA_FRAMES], [0, 0.8, 0.8, 0], clamp)}
      />
      <ThreeCanvas width={width} height={height} camera={{ position: [0, 0, 10], fov: 35 }} gl={{ antialias: true }}>
        <ambientLight intensity={0.85} />
        <directionalLight position={[-6, 4, 6]} intensity={1.9} />
        <directionalLight position={[6, -2, 3]} intensity={0.5} color={BRAND.turquoise} />
        <Stars spin={frame * 0.0006} />
        <group position={[0, 0, -endK * 4]}>
          <group position={[globeX, globeY, 0]} scale={globeScale}>
            <Globe rotY={rotY} rotX={rotX}>
              {showPin && <SurfacePin lat={BA.lat} lon={BA.lon} drop={pinDrop} rotX={rotX} rotY={rotY} scale={1.15} />}
              <Shockwave lat={BA.lat} lon={BA.lon} t={wave1} />
              <Shockwave lat={BA.lat} lon={BA.lon} t={wave2} />
            </Globe>
          </group>
          {frame >= T.phoneIn - 2 && (
            <Phone
              position={[phoneX + endK * 9, phoneFloat - 0.42, phoneZ]}
              scale={1.2}
              rotation={[0.04 + Math.sin(frame / 27) * 0.02, phoneRotY, phoneRotZ]}
              screen={frame >= T.swap ? 1 : 0}
              sheen={sheen}
              flash={flash}
            />
          )}
        </group>
      </ThreeCanvas>

      <IntroTitle frame={frame} />
      <QuestionPill frame={frame} />
      <ScorePop frame={frame} fps={fps} />
      <Tagline frame={frame} fps={fps} />
      <EndCard frame={frame} fps={fps} k={endK} />
      {/* Viñeta: centra la mirada */}
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(3,10,22,0.55) 100%)', pointerEvents: 'none' }} />
    </AbsoluteFill>
  );
};

const display: React.CSSProperties = { fontFamily: 'Poppins, sans-serif', fontWeight: 900, letterSpacing: '-0.01em' };

function fadeInOut(frame: number, a: number, b: number, c: number, d: number) {
  return interpolate(frame, [a, b, c, d], [0, 1, 1, 0], clamp);
}

function IntroTitle({ frame }: { frame: number }) {
  const o = fadeInOut(frame, 6, 22, 78, 92);
  const y = interpolate(frame, [6, 30], [24, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill style={{ alignItems: 'center', paddingTop: 58, opacity: o }}>
      <div style={{ ...display, fontSize: 78, color: BRAND.white, transform: `translateY(${y}px)`, textShadow: '0 6px 30px rgba(0,0,0,0.5)' }}>
        ¿Cuánto conoces <span style={{ color: BRAND.yellow }}>el mundo?</span>
      </div>
    </AbsoluteFill>
  );
}

function QuestionPill({ frame }: { frame: number }) {
  const o = fadeInOut(frame, 92, 104, T.globeAside - 4, T.globeAside + 8);
  const s = interpolate(frame, [92, 106], [0.9, 1], { ...clamp, easing: Easing.out(Easing.back(1.6)) });
  // Barra de tiempo: 15 s de juego comprimidos; se congela al responder
  const timeLeft = interpolate(frame, [100, T.pinDrop], [1, 0.9], clamp);
  return (
    <AbsoluteFill style={{ alignItems: 'center', paddingTop: 54, opacity: o }}>
      <div style={{ transform: `scale(${s})`, padding: '18px 44px 22px', borderRadius: 999, background: 'rgba(7,20,38,0.88)', border: `3px solid ${BRAND.turquoise}`, boxShadow: `0 0 40px rgba(25,230,210,0.35)`, minWidth: 760 }}>
        <div style={{ ...display, fontWeight: 800, fontSize: 52, color: BRAND.white, textAlign: 'center' }}>
          ¿Dónde está <span style={{ color: BRAND.yellow }}>Buenos Aires</span>?
        </div>
        <div style={{ marginTop: 12, height: 10, borderRadius: 99, background: 'rgba(255,255,255,0.12)', overflow: 'hidden' }}>
          <div style={{ width: `${timeLeft * 100}%`, height: '100%', background: BRAND.turquoise, borderRadius: 99 }} />
        </div>
      </div>
    </AbsoluteFill>
  );
}

function ScorePop({ frame, fps }: { frame: number; fps: number }) {
  const start = T.pinDrop + 4;
  const s = spring({ frame: frame - start, fps, config: { damping: 11, stiffness: 160 } });
  const o = fadeInOut(frame, start, start + 4, T.globeAside - 2, T.globeAside + 10);
  const pts = Math.round(interpolate(frame, [start + 4, start + 26], [0, 2005], { ...clamp, easing: Easing.out(Easing.cubic) }));
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <div style={{ position: 'absolute', left: 1090, top: 392, padding: '22px 34px 24px', borderRadius: 28, background: 'rgba(7,20,38,0.78)', border: '2px solid rgba(25,230,210,0.45)', transform: `scale(${0.6 + 0.4 * s})`, transformOrigin: 'left center' }}>
        <div style={{ ...display, fontSize: 64, color: BRAND.turquoise, textShadow: '0 0 30px rgba(25,230,210,0.6), 0 4px 16px rgba(0,0,0,0.5)' }}>¡PERFECTO!</div>
        <div style={{ ...display, fontSize: 92, color: BRAND.yellow, lineHeight: 1, textShadow: '0 6px 24px rgba(0,0,0,0.5)' }}>
          +{pts.toLocaleString('es-CO')} <span style={{ fontSize: 46, fontWeight: 800 }}>pts</span>
        </div>
        <div style={{ ...display, fontWeight: 600, fontSize: 34, color: BRAND.sky, marginTop: 10 }}>13 km · 1,5 s</div>
      </div>
    </AbsoluteFill>
  );
}

function Tagline({ frame, fps }: { frame: number; fps: number }) {
  const words = [
    { t: 'Ubica.', c: BRAND.white, at: T.phoneIn + 26 },
    { t: 'Rápido.', c: BRAND.turquoise, at: T.phoneIn + 38 },
    { t: 'Preciso.', c: BRAND.yellow, at: T.phoneIn + 50 },
  ];
  const out = interpolate(frame, [T.end - 8, T.end + 6], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ alignItems: 'center', paddingTop: 64, opacity: out }}>
      <div style={{ display: 'flex', gap: 30 }}>
        {words.map((w) => {
          const s = spring({ frame: frame - w.at, fps, config: { damping: 13, stiffness: 150 } });
          return (
            <span key={w.t} style={{ ...display, fontSize: 84, color: w.c, opacity: Math.min(1, s * 1.4), transform: `translateY(${(1 - s) * 40}px) scale(${0.8 + 0.2 * s})`, display: 'inline-block', textShadow: '0 6px 28px rgba(0,0,0,0.55)' }}>
              {w.t}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

function EndCard({ frame, fps, k }: { frame: number; fps: number; k: number }) {
  if (k <= 0) return null;
  const mascot = spring({ frame: frame - (T.end + 8), fps, config: { damping: 10, stiffness: 120 } });
  const word = spring({ frame: frame - (T.end + 18), fps, config: { damping: 14, stiffness: 120 } });
  const tag = interpolate(frame, [T.end + 34, T.end + 50], [0, 1], clamp);
  const bob = Math.sin(frame / 12) * 6;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 50%, rgba(18,52,94,${0.75 * k}) 0%, rgba(7,20,38,${0.93 * k}) 70%)`, alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', width: 620, height: 620, borderRadius: '50%', background: 'radial-gradient(circle, rgba(25,230,210,0.32) 0%, rgba(25,230,210,0) 65%)', top: 120, opacity: mascot }} />
      <Img src={staticFile('mascot/cheer.webp')} style={{ width: 330, transform: `translateY(${(1 - mascot) * 120 + bob}px) scale(${0.5 + 0.5 * mascot})`, opacity: Math.min(1, mascot * 1.5), filter: 'drop-shadow(0 18px 30px rgba(0,0,0,0.45))' }} />
      <div style={{ fontFamily: 'Fredoka, Poppins, sans-serif', fontWeight: 700, fontSize: 150, lineHeight: 1, marginTop: 6, transform: `scale(${0.7 + 0.3 * word})`, opacity: Math.min(1, word * 1.6), filter: 'drop-shadow(0 8px 0 rgba(4,12,26,0.65)) drop-shadow(0 4px 24px rgba(4,12,26,0.6))' }}>
        <span style={{ backgroundImage: `linear-gradient(180deg, ${BRAND.white} 0%, ${BRAND.white} 48%, #C3CFDD 100%)`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>GEO</span>
        <span style={{ backgroundImage: `linear-gradient(180deg, #8FFBFF 0%, ${BRAND.turquoise} 52%, #0EA89A 100%)`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>SPEED</span>
      </div>
      <div style={{ ...display, fontWeight: 800, fontSize: 54, color: BRAND.white, marginTop: 22, opacity: tag, transform: `translateY(${(1 - tag) * 16}px)` }}>
        ¿Cuánto conoces <span style={{ color: BRAND.yellow }}>el mundo?</span>
      </div>
      <div style={{ ...display, fontWeight: 600, fontSize: 30, color: BRAND.sky, marginTop: 18, opacity: tag, letterSpacing: '0.08em' }}>
        ANDROID · WEB
      </div>
    </AbsoluteFill>
  );
}
