import { isNativeApp } from './assetUrl';

/**
 * Compartir dentro de la app nativa. El WebView de Android no trae `navigator.share`, así que todos los botones de
 * compartir (resultado con imagen o video, retos, sala en vivo, quizzes, Conquista, diario, invitaciones) caían en su
 * plan B (descargar el archivo o copiar), que dentro de la app no hace nada visible. Aquí se instala un
 * `navigator.share` que abre la hoja de compartir de Android con el complemento Share; las imágenes y los videos se
 * guardan antes en la caché de la app (complemento Filesystem), porque la hoja de Android solo comparte archivos.
 * Así ningún botón necesita saber si corre en la app o en la web.
 */
export function installNativeShare(): void {
  if (typeof navigator === 'undefined' || !isNativeApp()) return;

  const share = async (data: ShareData = {}): Promise<void> => {
    const { Share } = await import('@capacitor/share');
    const files = data.files && data.files.length ? await cacheFiles(data.files) : undefined;
    // Muchos textos ya traen el enlace: en Android el complemento los junta y saldría repetido
    const url = data.url && !(data.text ?? '').includes(data.url) ? data.url : undefined;
    try {
      await Share.share({ title: data.title, text: data.text, url, files, dialogTitle: data.title });
    } catch (e) {
      const msg = String((e as Error)?.message ?? e);
      // Cerrar la hoja sin elegir app es "cancelar" (AbortError, como en la web): así no se activa el plan B
      throw new DOMException(msg, /cancel/i.test(msg) ? 'AbortError' : 'DataError');
    }
  };

  try {
    Object.defineProperty(navigator, 'share', { value: share, configurable: true, writable: true });
    Object.defineProperty(navigator, 'canShare', { value: () => true, configurable: true, writable: true });
  } catch (e) {
    console.warn('[compartir] no se pudo instalar', e);
  }
}

async function cacheFiles(list: File[]): Promise<string[]> {
  const { Filesystem, Directory } = await import('@capacitor/filesystem');
  const uris: string[] = [];
  for (const file of list) {
    const name = file.name.replace(/[^\w.-]+/g, '_') || 'geospeed';
    const res = await Filesystem.writeFile({
      path: `compartir/${Date.now()}-${name}`,
      data: await toBase64(file),
      directory: Directory.Cache,
      recursive: true,
    });
    uris.push(res.uri);
  }
  return uris;
}

function toBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const s = String(reader.result);
      resolve(s.slice(s.indexOf(',') + 1));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
