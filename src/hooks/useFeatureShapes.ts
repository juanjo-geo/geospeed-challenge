/**
 * Contornos para dibujar (Fase 6b/7): null hasta que lleguen; el componente se vuelve a pintar entonces.
 * useFeatureShapes = lugares geográficos; usePackShapes = departamentos y fronteras internas de los packs.
 */
import { useCallback, useEffect, useState } from 'react';
import { getFeatureShapes, loadFeatureShapes, getPackShapes, loadPackShapes, type FeatureShapes } from '@/lib/featureScoring';

function useShapes(get: () => FeatureShapes | null, load: () => Promise<FeatureShapes>, enabled: boolean): FeatureShapes | null {
  const [s, setS] = useState<FeatureShapes | null>(get);
  useEffect(() => {
    if (!enabled || s) return;
    let alive = true;
    load().then((v) => { if (alive) setS(v); }).catch(() => {});
    return () => { alive = false; };
  }, [enabled, s, load]);
  return s;
}

export const useFeatureShapes = (enabled = true) => useShapes(getFeatureShapes, loadFeatureShapes, enabled);
/** Divisiones de un pack: `modeOrId` = el modo ('colombia', 'andes'…) o el id de una división; null = no cargar */
export function usePackShapes(modeOrId: string | null | undefined): FeatureShapes | null {
  const key = modeOrId ?? 'colombia';
  const get = useCallback(() => getPackShapes(key), [key]);
  const load = useCallback(() => loadPackShapes(key), [key]);
  return useShapes(get, load, !!modeOrId);
}
