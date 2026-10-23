/** Contornos de los lugares geográficos (Fase 6b) para dibujarlos: null hasta que lleguen; el componente se vuelve a pintar entonces. */
import { useEffect, useState } from 'react';
import { getFeatureShapes, loadFeatureShapes, type FeatureShapes } from '@/lib/featureScoring';

export function useFeatureShapes(enabled = true): FeatureShapes | null {
  const [s, setS] = useState<FeatureShapes | null>(getFeatureShapes);
  useEffect(() => {
    if (!enabled || s) return;
    let alive = true;
    loadFeatureShapes().then((v) => { if (alive) setS(v); }).catch(() => {});
    return () => { alive = false; };
  }, [enabled, s]);
  return s;
}
