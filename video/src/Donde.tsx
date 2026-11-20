/**
 * Serie "¿Dónde queda esto?" para TikTok e Instagram (9:16, 16 s, 30 fps).
 *  0–5 s     una toma "de dron" del lugar con la cuenta 5…1 y una pista. La toma es una foto real con licencia libre
 *            (Wikimedia Commons: dominio público, CC0 o CC BY) animada con Higgsfield (Seedance 2.0).
 *  5–11 s    la respuesta en el globo del juego: gira hasta el lugar, cae el pin, nombre, bandera y el dato curioso
 *            del juego (src/data/placeTrivia.json), con una reacción del Explorador.
 *  11–16 s   cierre: "¿Cuántas ubicas tú?", logo y JUEGA GRATIS.
 * Las tomas están como imágenes en public/donde/<id>/f000.jpg (24 cuadros por segundo; ver README.md).
 * Créditos de cada foto: DONDE[id].credit (van en el texto de la publicación).
 */
import { useEffect, useState } from 'react';
import { AbsoluteFill, Audio, Easing, Img, Sequence, continueRender, delayRender, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { BRAND, faceRotation, loadBrandFonts } from './brand';
import { Globe, Shockwave, Stars, SurfacePin } from './scene3d';
import { MUSIC_VOLUME, Sfx, type Cue } from './Sfx';
import { MascotClip, clipFrameAt, type ClipId } from './MascotClip';
import type { Lang } from './lang';

export const DONDE_FRAMES = 480;
const T = { reveal: 150, pin: 200, card: 214, fact: 236, end: 330 };

type Two = Record<Lang, string>;
export interface DondeDef {
  name: Two; country: Two; flags: string[]; lat: number; lon: number;
  hint: Two; fact: Two; react: ClipId; credit: string;
}
// Datos curiosos: los mismos del juego (placeTrivia.json)
export const DONDE = {
  'abu-simbel': {
    name: { es: 'Abu Simbel', en: 'Abu Simbel' }, country: { es: 'Egipto', en: 'Egypt' }, flags: ['EG'], lat: 22.3369, lon: 31.6256,
    hint: { es: 'Pista: está junto a un lago enorme', en: 'Hint: it sits by a huge lake' },
    fact: { es: 'En los años 60 lo cortaron en bloques y lo subieron a un terreno más alto para salvarlo de las aguas de la presa de Asuán.', en: 'In the 1960s it was cut into blocks and moved to higher ground to save it from the waters of the Aswan High Dam.' },
    react: 'sorpresa', credit: 'Foto: Olaf Tausch, Wikimedia Commons, dominio público',
  },
  'ait-ben-haddou': {
    name: { es: 'Ait Ben Haddou', en: 'Aït Benhaddou' }, country: { es: 'Marruecos', en: 'Morocco' }, flags: ['MA'], lat: 31.05, lon: -7.1333,
    hint: { es: 'Pista: salió en Gladiator', en: 'Hint: it was in Gladiator' },
    fact: { es: 'Este pueblo fortificado de adobe fue parada de caravanas y escenario de películas como Gladiator y de la serie Juego de tronos.', en: 'This fortified mud-brick village was a caravan stop and a filming location for Gladiator and the series Game of Thrones.' },
    react: 'idea', credit: 'Foto: Wonker (Flickr), Wikimedia Commons, CC BY 2.0',
  },
  bagan: {
    name: { es: 'Bagan', en: 'Bagan' }, country: { es: 'Myanmar', en: 'Myanmar' }, flags: ['MM'], lat: 21.172, lon: 94.86,
    hint: { es: 'Pista: está en Asia', en: 'Hint: it is in Asia' },
    fact: { es: 'Entre los siglos XI y XIII se levantaron allí más de 10.000 templos budistas, y hoy sobreviven más de 2.000.', en: 'Over 10,000 Buddhist temples were built there between the 11th and 13th centuries, and more than 2,000 survive today.' },
    react: 'sorpresa', credit: 'Foto: Vyacheslav Argenberg, Wikimedia Commons, CC BY 4.0',
  },
  'ciudad-perdida': {
    name: { es: 'Ciudad Perdida', en: 'Ciudad Perdida' }, country: { es: 'Colombia', en: 'Colombia' }, flags: ['CO'], lat: 11.038, lon: -73.9252,
    hint: { es: 'Pista: no es Machu Picchu', en: 'Hint: it is not Machu Picchu' },
    fact: { es: 'Los taironas la fundaron hacia el año 800, siglos antes que Machu Picchu, y para llegar hay que caminar varios días por la selva.', en: 'The Tairona founded it around AD 800, centuries before Machu Picchu, and reaching it takes a trek of several days through the jungle.' },
    react: 'mapa', credit: 'Foto: Gavin Rough (Flickr), Wikimedia Commons, CC BY 2.0',
  },
  'fitz-roy': {
    name: { es: 'Monte Fitz Roy', en: 'Mount Fitz Roy' }, country: { es: 'Argentina y Chile', en: 'Argentina and Chile' }, flags: ['AR', 'CL'], lat: -49.271, lon: -73.043,
    hint: { es: 'Pista: está en la Patagonia', en: 'Hint: it is in Patagonia' },
    fact: { es: 'Los tehuelches lo llamaban Chaltén, montaña humeante; Perito Moreno lo rebautizó por el capitán del Beagle.', en: 'The Tehuelche called it Chaltén, smoking mountain; explorer Perito Moreno renamed it after the captain of the Beagle.' },
    react: 'idea', credit: 'Foto: Prissantenbär, Wikimedia Commons, dominio público',
  },
  iguazu: {
    name: { es: 'Cataratas del Iguazú', en: 'Iguazu Falls' }, country: { es: 'Argentina y Brasil', en: 'Argentina and Brazil' }, flags: ['AR', 'BR'], lat: -25.695, lon: -54.437,
    hint: { es: 'Pista: está entre dos países', en: 'Hint: it sits between two countries' },
    fact: { es: 'Su nombre viene del guaraní y significa agua grande, y su salto más impresionante se llama la Garganta del Diablo.', en: "Its name comes from the Guarani for big water, and its most dramatic drop is called the Devil's Throat." },
    react: 'sorpresa', credit: 'Foto: DINOCBA, Wikimedia Commons, CC BY 3.0',
  },
  'mont-saint-michel': {
    name: { es: 'Mont Saint-Michel', en: 'Mont-Saint-Michel' }, country: { es: 'Francia', en: 'France' }, flags: ['FR'], lat: 48.6358, lon: -1.5103,
    hint: { es: 'Pista: con la marea alta es una isla', en: 'Hint: at high tide it becomes an island' },
    fact: { es: 'Con la marea alta queda rodeado por el mar; las mareas de su bahía están entre las más fuertes de Europa.', en: 'At high tide it is surrounded by the sea; the tides in its bay are among the strongest in Europe.' },
    react: 'idea', credit: 'Foto: Diliff, Wikimedia Commons, dominio público',
  },
  neuschwanstein: {
    name: { es: 'Castillo de Neuschwanstein', en: 'Neuschwanstein Castle' }, country: { es: 'Alemania', en: 'Germany' }, flags: ['DE'], lat: 47.5575, lon: 10.7494,
    hint: { es: 'Pista: inspiró un castillo de Disney', en: 'Hint: it inspired a Disney castle' },
    fact: { es: 'Lo mandó construir el rey Luis II de Baviera, y sirvió de inspiración para el castillo de La bella durmiente de Disney.', en: "King Ludwig II of Bavaria had it built, and it inspired the castle of Disney's Sleeping Beauty." },
    react: 'mapa', credit: 'Foto: Wilfredor, Wikimedia Commons, CC0',
  },
} satisfies Record<string, DondeDef>;
export type DondeId = keyof typeof DONDE;

const TXT = {
  es: { q: ['¿Dónde queda', 'esto?'], comment: 'Comenta tu respuesta', answer: 'Respuesta', fact: 'DATO CURIOSO', end: ['¿Cuántos lugares', 'ubicas tú?'], cta: 'JUEGA GRATIS', tag: 'Ciudades · banderas · lugares · monumentos' },
  en: { q: ['Where is', 'this?'], comment: 'Comment your answer', answer: 'Answer', fact: 'FUN FACT', end: ['How many places', 'can you find?'], cta: 'PLAY FREE', tag: 'Cities · flags · places · landmarks' },
};

const CUES: Cue[] = [
  [0, 'whoosh-long', 0.4], [60, 'pop', 0.4], [30, 'tock', 0.45], [54, 'tock', 0.45], [78, 'tock', 0.5], [102, 'tock', 0.5], [126, 'tock', 0.55],
  [T.reveal - 2, 'whoosh-deep', 0.55], [T.pin - 4, 'thud', 0.8], [T.pin, 'perfect', 0.55], [T.card, 'pop', 0.4], [T.fact, 'sparkle', 0.35],
  [T.end - 2, 'whoosh-long', 0.45], [T.end + 12, 'jump', 0.45], [T.end + 22, 'finale', 0.7],
];

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const ease = Easing.bezier(0.65, 0, 0.35, 1);
const display: React.CSSProperties = { fontFamily: 'Poppins, sans-serif', fontWeight: 900, letterSpacing: '-0.01em' };
const fade = (f: number, a: number, b: number, c: number, d: number) => interpolate(f, [a, b, c, d], [0, 1, 1, 0], clamp);

function useFonts() {
  const [handle] = useState(() => delayRender('Fuentes de la marca'));
  useEffect(() => { loadBrandFonts().then(() => continueRender(handle)); }, [handle]);
}

/** La toma del lugar a pantalla completa, a velocidad real */
function DroneShot({ id, frame }: { id: DondeId; frame: number }) {
  const n = Math.max(0, Math.min(120, Math.round(frame * 0.8)));
  return (
    <AbsoluteFill style={{ background: BRAND.navyDeep, overflow: 'hidden' }}>
      <Img src={staticFile(`donde/${id}/f${String(n).padStart(3, '0')}.jpg`)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(3,10,22,0.7) 0%, rgba(3,10,22,0) 32%, rgba(3,10,22,0) 70%, rgba(3,10,22,0.55) 100%)' }} />
    </AbsoluteFill>
  );
}

function Question({ frame, lang, def }: { frame: number; lang: Lang; def: DondeDef }) {
  const { fps } = useVideoConfig();
  const t = TXT[lang];
  const o = fade(frame, 4, 12, T.reveal - 6, T.reveal);
  const s = spring({ frame: frame - 4, fps, config: { damping: 11, stiffness: 160 } });
  const hint = spring({ frame: frame - 60, fps, config: { damping: 12, stiffness: 180 } });
  // Cuenta 5…1 en el último segundo y medio de cada número
  const idx = Math.floor(interpolate(frame, [30, T.reveal], [0, 5], clamp));
  const k = spring({ frame: frame - (30 + idx * 24), fps, config: { damping: 9, stiffness: 200, mass: 0.6 } });
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 170 }}>
        <div style={{ ...display, fontSize: 104, lineHeight: 1.05, color: BRAND.white, textShadow: '0 6px 30px rgba(0,0,0,0.7)', transform: `scale(${0.75 + 0.25 * s})`, textAlign: 'center' }}>
          {t.q[0]}<br /><span style={{ color: BRAND.yellow }}>{t.q[1]}</span>
        </div>
        {frame >= 60 && (
          <div style={{ ...display, fontWeight: 800, fontSize: 44, color: '#0B1F3A', background: BRAND.turquoise, padding: '12px 34px 14px', borderRadius: 999, marginTop: 30, transform: `scale(${0.6 + 0.4 * hint})`, opacity: Math.min(1, hint * 1.6), boxShadow: '0 0 40px rgba(25,230,210,0.5)', whiteSpace: 'nowrap' }}>
            {def.hint[lang]}
          </div>
        )}
        <div style={{ ...display, fontWeight: 800, fontSize: 40, color: BRAND.white, textShadow: '0 4px 18px rgba(0,0,0,0.85)', marginTop: 22, opacity: interpolate(frame, [70, 80], [0, 1], clamp) }}>{t.comment}</div>
      </AbsoluteFill>
      {frame >= 30 && idx < 5 && (
        <div style={{ position: 'absolute', left: 445, top: 1330, width: 190, height: 190, borderRadius: '50%', background: 'rgba(7,20,38,0.88)', border: `6px solid ${BRAND.yellow}`, boxShadow: '0 0 50px rgba(255,217,59,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${0.6 + 0.4 * k})` }}>
          <span style={{ ...display, fontSize: 130, lineHeight: 1, color: BRAND.yellow }}>{5 - idx}</span>
        </div>
      )}
    </AbsoluteFill>
  );
}

function Reveal({ frame, lang, def }: { frame: number; lang: Lang; def: DondeDef }) {
  const { fps, width, height } = useVideoConfig();
  const t = TXT[lang];
  const target = faceRotation(def.lat, def.lon);
  const k = interpolate(frame, [T.reveal, T.pin - 6], [0, 1], { ...clamp, easing: Easing.bezier(0.2, 0, 0.1, 1) });
  const rotY = target.y - (1 - k) * Math.PI * 1.4;   // llega girando
  const rotX = target.x * k;
  const pinS = spring({ frame: frame - (T.pin - 12), fps, config: { damping: 9, stiffness: 140, mass: 0.6 } });
  const zoom = interpolate(frame, [T.reveal, T.pin, T.end], [0.66, 0.84, 0.9], { ...clamp, easing: ease });
  // El nombre en una línea: el tamaño sale del ancho que dejan las banderas
  const name = def.name[lang];
  const nameSize = Math.min(76, (860 - def.flags.length * 106) / (name.length * 0.6));
  const card = spring({ frame: frame - T.card, fps, config: { damping: 13, stiffness: 140 } });
  const fact = interpolate(frame, [T.fact, T.fact + 12], [0, 1], clamp);
  const react = spring({ frame: frame - (T.pin + 6), fps, config: { damping: 11, stiffness: 120 } });
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 35%, #12345E 0%, ${BRAND.navy} 45%, ${BRAND.navyDeep} 100%)` }}>
      <ThreeCanvas width={width} height={height} camera={{ position: [0, 0, 17.8], fov: 35 }} gl={{ antialias: true }}>
        <ambientLight intensity={0.85} />
        <directionalLight position={[-6, 4, 6]} intensity={1.9} />
        <directionalLight position={[6, -2, 3]} intensity={0.5} color={BRAND.turquoise} />
        <Stars spin={frame * 0.0006} />
        <group position={[0, 1.9, 0]} scale={zoom}>
          <Globe rotY={rotY} rotX={rotX}>
            {frame >= T.pin - 12 && <SurfacePin lat={def.lat} lon={def.lon} drop={(1 - pinS) * 1.6} rotX={rotX} rotY={rotY} scale={1.5} />}
            <Shockwave lat={def.lat} lon={def.lon} t={(frame - T.pin) / 34} />
            <Shockwave lat={def.lat} lon={def.lon} t={(frame - T.pin - 10) / 34} />
          </Globe>
        </group>
      </ThreeCanvas>
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 150, opacity: fade(frame, T.reveal + 4, T.reveal + 12, 999, 1000) }}>
        <div style={{ ...display, fontWeight: 800, fontSize: 46, color: BRAND.sky, letterSpacing: '0.12em' }}>{t.answer.toUpperCase()}</div>
      </AbsoluteFill>
      {frame >= T.card && (
        <div style={{ position: 'absolute', left: 70, top: 1020, width: 940, padding: '30px 40px 36px', borderRadius: 40, background: 'rgba(7,20,38,0.92)', border: `3px solid ${BRAND.turquoise}`, boxShadow: '0 0 60px rgba(25,230,210,0.35)', transform: `translateY(${(1 - card) * 120}px) scale(${0.85 + 0.15 * card})`, opacity: Math.min(1, card * 1.6) }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              {def.flags.map((f) => <Img key={f} src={staticFile(`flags/${f}.svg`)} style={{ height: 64, borderRadius: 8, boxShadow: '0 4px 14px rgba(0,0,0,0.5)' }} />)}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ ...display, fontSize: nameSize, lineHeight: 1.05, color: BRAND.yellow, whiteSpace: 'nowrap' }}>{name}</div>
              <div style={{ ...display, fontWeight: 800, fontSize: 44, color: BRAND.white }}>{def.country[lang]}</div>
            </div>
          </div>
          <div style={{ marginTop: 26, opacity: fact }}>
            <div style={{ ...display, fontWeight: 800, fontSize: 32, color: BRAND.turquoise, letterSpacing: '0.1em' }}>{t.fact}</div>
            <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 42, lineHeight: 1.3, color: BRAND.white, marginTop: 8 }}>{def.fact[lang]}</div>
          </div>
        </div>
      )}
      {frame >= T.pin && (
        <div style={{ position: 'absolute', right: 40, top: 760, opacity: Math.min(1, react * 1.5), transform: `translateY(${(1 - react) * 80}px)` }}>
          <MascotClip clip={def.react} box={250} clipFrame={clipFrameAt(def.react, frame - T.pin, T.end - T.pin)} style={{ filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.5))' }} />
        </div>
      )}
    </AbsoluteFill>
  );
}

function EndCard({ frame, lang }: { frame: number; lang: Lang }) {
  const { fps } = useVideoConfig();
  const t = TXT[lang];
  const k = interpolate(frame, [T.end, T.end + 16], [0, 1], { ...clamp, easing: ease });
  if (k <= 0) return null;
  const mascot = spring({ frame: frame - (T.end + 8), fps, config: { damping: 10, stiffness: 120 } });
  const word = spring({ frame: frame - (T.end + 18), fps, config: { damping: 14, stiffness: 120 } });
  const cta = spring({ frame: frame - (T.end + 34), fps, config: { damping: 11, stiffness: 150 } });
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 42%, rgba(18,52,94,${k}) 0%, rgba(7,20,38,${k}) 70%)`, alignItems: 'center', paddingTop: 240 }}>
      <div style={{ ...display, fontSize: 84, lineHeight: 1.08, color: BRAND.white, textAlign: 'center', opacity: k }}>
        {t.end[0]}<br /><span style={{ color: BRAND.yellow }}>{t.end[1]}</span>
      </div>
      <MascotClip clip="te-reta" box={400} clipFrame={clipFrameAt('te-reta', frame - (T.end + 8), DONDE_FRAMES - T.end)} style={{ marginTop: 70, transform: `translateY(${(1 - mascot) * 140}px) scale(${0.5 + 0.5 * mascot})`, opacity: Math.min(1, mascot * 1.5), filter: 'drop-shadow(0 18px 30px rgba(0,0,0,0.45))' }} />
      <div style={{ fontFamily: 'Fredoka, Poppins, sans-serif', fontWeight: 700, fontSize: 160, lineHeight: 1, marginTop: 6, transform: `scale(${0.7 + 0.3 * word})`, opacity: Math.min(1, word * 1.6), filter: 'drop-shadow(0 8px 0 rgba(4,12,26,0.65))', whiteSpace: 'nowrap' }}>
        <span style={{ backgroundImage: `linear-gradient(180deg, ${BRAND.white} 0%, ${BRAND.white} 48%, #C3CFDD 100%)`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>GEO</span>
        <span style={{ backgroundImage: `linear-gradient(180deg, #8FFBFF 0%, ${BRAND.turquoise} 52%, #0EA89A 100%)`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>SPEED</span>
      </div>
      <div style={{ ...display, fontWeight: 600, fontSize: 36, color: BRAND.sky, marginTop: 20, opacity: word }}>{t.tag}</div>
      <div style={{ ...display, fontSize: 58, color: '#0B1F3A', marginTop: 40, padding: '18px 54px 20px', borderRadius: 999, background: `linear-gradient(180deg, #FFE566 0%, ${BRAND.yellow} 100%)`, boxShadow: `0 8px 0 ${BRAND.yellowDeep}, 0 20px 40px rgba(0,0,0,0.4)`, opacity: Math.min(1, cta * 1.5), transform: `scale(${0.6 + 0.4 * cta})` }}>
        {t.cta}
      </div>
    </AbsoluteFill>
  );
}

export const Donde = ({ lang = 'es', id = 'abu-simbel' }: { lang?: Lang; id?: DondeId }) => {
  useFonts();
  const frame = useCurrentFrame();
  const def: DondeDef = DONDE[id];
  const flash = interpolate(frame, [T.reveal - 3, T.reveal, T.reveal + 6], [0, 0.6, 0], clamp);
  return (
    <AbsoluteFill style={{ background: BRAND.navyDeep }}>
      <Audio src={staticFile('music/track-video.wav')} volume={(f) => interpolate(f, [0, 8, DONDE_FRAMES - 30, DONDE_FRAMES], [0, MUSIC_VOLUME, MUSIC_VOLUME, 0], clamp)} />
      <Sfx cues={CUES} />
      <Sequence durationInFrames={T.reveal}>
        <DroneShot id={id} frame={frame} />
        <Question frame={frame} lang={lang} def={def} />
      </Sequence>
      <Sequence from={T.reveal}>
        <Reveal frame={frame} lang={lang} def={def} />
        <EndCard frame={frame} lang={lang} />
      </Sequence>
      {flash > 0 && <AbsoluteFill style={{ background: '#FFFFFF', opacity: flash }} />}
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, transparent 60%, rgba(3,10,22,0.45) 100%)', pointerEvents: 'none' }} />
    </AbsoluteFill>
  );
};
