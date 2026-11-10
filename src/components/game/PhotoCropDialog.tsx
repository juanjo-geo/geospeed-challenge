import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '@/i18n';
import { BACK_LAYER, useBackHandler } from '@/lib/backNav';
import { clampCrop, coverScale, cropRect, renderCrop, setProfilePhoto, type CropPos } from '@/lib/profilePhoto';
import { playButtonTap } from '@/lib/sounds';

const MAX_ZOOM = 4;

/** Ajustar la foto de perfil: se arrastra dentro del círculo y se acerca con la barra. Se ve tal como quedará. */
export default function PhotoCropDialog({ file, onClose, onSaved }: { file: File; onClose: () => void; onSaved: () => void }) {
  const { t } = useI18n();
  useBackHandler(onClose, { layer: BACK_LAYER.modal });
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [failed, setFailed] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState<CropPos>({ x: 0, y: 0 });
  const [box, setBox] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; startX: number; startY: number; from: CropPos } | null>(null);

  useEffect(() => {
    let alive = true;
    const url = URL.createObjectURL(file);
    const el = new Image();
    el.onload = () => { if (alive) setImg(el); };
    el.onerror = () => { if (alive) setFailed(true); };
    el.src = url;
    return () => { alive = false; URL.revokeObjectURL(url); };
  }, [file]);

  useLayoutEffect(() => {
    const node = boxRef.current;
    if (!node) return;
    const measure = () => setBox(node.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [failed]);

  const w = img?.naturalWidth || 1;
  const h = img?.naturalHeight || 1;
  const scale = box ? coverScale(w, h, box) * zoom : 0;
  const shown = clampCrop(pos, w, h, box, zoom);

  const save = () => {
    if (!img || !box) return;
    playButtonTap();
    try {
      if (setProfilePhoto(renderCrop(img, cropRect(shown, w, h, box, zoom)))) onSaved();
      else setFailed(true);
    } catch { setFailed(true); }
  };

  const panel = failed ? (
    <div className="text-center">
      <p className="font-bold">{t('profile_photoError')}</p>
      <button onClick={() => { playButtonTap(); onClose(); }} className="mt-4 rounded-xl px-5 py-2.5 text-sm font-bold border-2 border-accent/50 hover:bg-accent/10">{t('cancel')}</button>
    </div>
  ) : (
    <div className="flex flex-col items-center gap-3 short:flex-row short:gap-5">
      <div
        ref={boxRef}
        className="relative shrink-0 aspect-square w-[min(68vw,42dvh,16rem)] short:w-[min(34vw,74dvh)] rounded-full overflow-hidden border-[4px] border-primary bg-brand-navy-deep touch-none select-none cursor-grab active:cursor-grabbing"
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); drag.current = { id: e.pointerId, startX: e.clientX, startY: e.clientY, from: shown }; }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (d && d.id === e.pointerId) setPos({ x: d.from.x + e.clientX - d.startX, y: d.from.y + e.clientY - d.startY });
        }}
        onPointerUp={() => { drag.current = null; setPos(shown); }}
        onPointerCancel={() => { drag.current = null; setPos(shown); }}
      >
        {img && box > 0 && (
          <img
            src={img.src}
            alt=""
            draggable={false}
            className="absolute left-1/2 top-1/2 max-w-none pointer-events-none"
            style={{ width: w * scale, height: h * scale, transform: `translate(calc(-50% + ${shown.x}px), calc(-50% + ${shown.y}px))` }}
          />
        )}
      </div>
      <div className="w-full min-w-0 flex flex-col gap-2 text-center">
        <h2 id="photo-title" className="font-black text-xl leading-tight">{t('profile_photoTitle')}</h2>
        <p className="text-xs text-foreground/70">{t('profile_photoHint')}</p>
        <label className="flex items-center gap-3 text-xs font-bold">
          <span className="shrink-0">{t('profile_photoZoom')}</span>
          <input
            type="range"
            min={1}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 min-w-0 accent-[hsl(var(--primary))]"
          />
        </label>
        <div className="flex gap-2 mt-1">
          <button onClick={() => { playButtonTap(); onClose(); }} className="flex-1 rounded-xl py-2.5 text-sm font-bold border-2 border-accent/50 hover:bg-accent/10">{t('cancel')}</button>
          <button onClick={save} disabled={!img} className="btn3d flex-1 rounded-xl py-2.5 text-sm font-black text-primary-foreground disabled:opacity-50" style={{ background: 'var(--grad-cta)' }}>{t('profile_photoUse')}</button>
        </div>
      </div>
    </div>
  );

  return createPortal(
    <div className="modal-layer z-[120] bg-black/75 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="photo-title">
      <div className="modal-panel w-full max-w-sm short:max-w-lg rounded-3xl border-2 border-accent/50 bg-card p-5 short:p-3 shadow-2xl">{panel}</div>
    </div>,
    document.body,
  );
}
