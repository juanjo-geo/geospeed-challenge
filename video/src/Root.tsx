import { AbsoluteFill, Audio, Composition, Sequence, interpolate, staticFile } from 'remotion';
import { EscenaPrueba, ESCENA_FRAMES } from './EscenaPrueba';
import { Bloque1, BLOQUE1_CUES } from './Bloque1';
import { Bloque2, BLOQUE2_CUES, BLOQUE2_FRAMES } from './Bloque2';
import { BLOQUE1_FRAMES } from './Bloque1';
import { Bloque3, BLOQUE3_CUES, BLOQUE3_FRAMES } from './Bloque3';
import { MUSIC_VOLUME, Sfx } from './Sfx';
import { Vertical, VERTICAL_FRAMES, type Hook } from './Vertical';
import type { Lang } from './lang';
import type { ClipId } from './MascotClip';
import { FRIENDS_CUT_FRAMES, FRIENDS_OVERLAP, FriendsCut, VERTICAL_INTRO_FRAMES, VerticalIntro } from './Redes';

// Los bloques se unen por corte: cada uno empieza donde termina el anterior
const CUT_1 = 300;          // fin del bloque 1 (escenas 1 a 3)
const CUT_2 = CUT_1 + 270;  // fin del bloque 2 (escenas 4 a 6)
const TOTAL = CUT_2 + BLOQUE3_FRAMES;

/**
 * El video completo (30 s): las 9 escenas con una sola pista de música.
 * friends: versión para redes, con 1,5 s de amigos jugando (toma con IA) antes de la escena de retos. No va en Google Play.
 */
const Lanzamiento = ({ lang = 'es', mascot = 'a', friends = false }: { lang?: Lang; mascot?: ClipId; friends?: boolean }) => {
  const extra = friends ? FRIENDS_CUT_FRAMES - FRIENDS_OVERLAP : 0;   // cuánto se corre el bloque 3
  const total = TOTAL + extra;
  return (
  <AbsoluteFill>
    <Audio src={staticFile('music/track-video.wav')} volume={(f) => interpolate(f, [0, 12, total - 40, total], [0, MUSIC_VOLUME, MUSIC_VOLUME, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })} />
    {/* Los efectos van aquí, no dentro de cada bloque: así el corte entre bloques no les corta la cola */}
    <Sfx cues={BLOQUE1_CUES} />
    <Sfx cues={BLOQUE2_CUES} offset={CUT_1} />
    <Sfx cues={BLOQUE3_CUES} offset={CUT_2 + extra} />
    {friends && <Sfx cues={[[0, 'whoosh', 0.4]]} offset={CUT_2} />}
    <Sequence durationInFrames={CUT_1}><Bloque1 solo={false} lang={lang} /></Sequence>
    <Sequence from={CUT_1} durationInFrames={CUT_2 - CUT_1}><Bloque2 solo={false} lang={lang} /></Sequence>
    <Sequence from={CUT_2 + extra}><Bloque3 solo={false} lang={lang} mascot={mascot} captionOn={friends} /></Sequence>
    {/* Encima del arranque del bloque 3 */}
    {friends && <Sequence from={CUT_2} durationInFrames={FRIENDS_CUT_FRAMES}><FriendsCut lang={lang} /></Sequence>}
  </AbsoluteFill>
  );
};

export const RemotionRoot = () => (
  <>
    <Composition id="Lanzamiento" component={Lanzamiento} durationInFrames={TOTAL} fps={30} width={1920} height={1080} defaultProps={{ lang: 'es' as Lang }} />
    <Composition id="LanzamientoEN" component={Lanzamiento} durationInFrames={TOTAL} fps={30} width={1920} height={1080} defaultProps={{ lang: 'en' as Lang }} />
    <Composition id="Vertical" component={Vertical} durationInFrames={VERTICAL_FRAMES} fps={30} width={1080} height={1920} defaultProps={{ lang: 'es' as Lang }} />
    <Composition id="VerticalEN" component={Vertical} durationInFrames={VERTICAL_FRAMES} fps={30} width={1080} height={1920} defaultProps={{ lang: 'en' as Lang }} />
    {(['b', 'c'] as Hook[]).flatMap((hook) => (['es', 'en'] as Lang[]).map((lang) => (
      <Composition key={hook + lang} id={`Vertical${hook.toUpperCase()}${lang === 'en' ? 'EN' : ''}`} component={Vertical} durationInFrames={VERTICAL_FRAMES} fps={30} width={1080} height={1920} defaultProps={{ lang, hook }} />
    )))}
    {/* Para redes: con tomas de personas generadas con IA */}
    {(['es', 'en'] as Lang[]).map((lang) => (
      <Composition key={'redes' + lang} id={`LanzamientoRedes${lang === 'en' ? 'EN' : ''}`} component={Lanzamiento} durationInFrames={TOTAL + FRIENDS_CUT_FRAMES - FRIENDS_OVERLAP} fps={30} width={1920} height={1080} defaultProps={{ lang, friends: true }} />
    ))}
    {(['a', 'b'] as const).flatMap((hook) => (['es', 'en'] as Lang[]).map((lang) => (
      <Composition key={'intro' + hook + lang} id={`VerticalIntro${hook.toUpperCase()}${lang === 'en' ? 'EN' : ''}`} component={VerticalIntro} durationInFrames={VERTICAL_INTRO_FRAMES} fps={30} width={1080} height={1920} defaultProps={{ lang, hook }} />
    )))}
    <Composition id="Bloque3" component={Bloque3} durationInFrames={BLOQUE3_FRAMES} fps={30} width={1920} height={1080} defaultProps={{ solo: true, lang: 'es' as Lang }} />
    <Composition id="Bloque1" component={Bloque1} durationInFrames={BLOQUE1_FRAMES} fps={30} width={1920} height={1080} defaultProps={{ solo: true, lang: 'es' as Lang }} />
    <Composition id="Bloque2" component={Bloque2} durationInFrames={BLOQUE2_FRAMES} fps={30} width={1920} height={1080} defaultProps={{ solo: true, lang: 'es' as Lang }} />
    <Composition id="EscenaPrueba" component={EscenaPrueba} durationInFrames={ESCENA_FRAMES} fps={30} width={1920} height={1080} />
  </>
);
