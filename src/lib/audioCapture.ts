// Destino de audio para grabar el video para compartir (shareVideo.ts). Vive aparte para que sounds.ts,
// que va en la carga inicial, no arrastre shareVideo y con él los polígonos del mapa (data-countries).
let audioDestination: MediaStreamAudioDestinationNode | null = null;

/** Crea (o reutiliza) el nodo que captura la salida de Web Audio para la grabación. */
export function getAudioDestination(ctx: AudioContext): MediaStreamAudioDestinationNode {
  if (!audioDestination || audioDestination.context !== ctx) {
    audioDestination = ctx.createMediaStreamDestination();
  }
  return audioDestination;
}

/** El nodo actual, si sounds.ts ya enrutó audio hacia él; no crea uno nuevo. */
export function currentAudioDestination(): MediaStreamAudioDestinationNode | null {
  return audioDestination;
}
