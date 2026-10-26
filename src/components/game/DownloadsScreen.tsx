import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useI18n } from '@/i18n';
import { playButtonTap } from '@/lib/sounds';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { isNativeApp } from '@/lib/assetUrl';
import {
  PACK_EMOJI, baseReady, canPlayOffline, deletePack, downloadPack, fetchOfflineManifest, formatMB, packProgress, packsSupported,
  storageUsed, useOnline, type OfflineManifest, type OfflinePack, type PackId,
} from '@/lib/offline';

interface DownloadsScreenProps { onBack: () => void; onOpenStore: () => void }

/**
 * Descargas (Fase 11): el paquete base (siempre guardado: el juego, los mapas y los datos funcionan sin señal) y los
 * packs de fotos, cada uno con su tamaño, para verlas sin conexión; se pueden borrar para liberar espacio.
 */
export default function DownloadsScreen({ onBack, onOpenStore }: DownloadsScreenProps) {
  const { t, locale } = useI18n();
  const tt = t as (k: string, p?: Record<string, string | number>) => string;
  const online = useOnline();
  const [m, setM] = useState<OfflineManifest | null | undefined>(undefined);
  const [base, setBase] = useState<boolean | null>(null);
  const [have, setHave] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState<PackId | null>(null);
  const [used, setUsed] = useState<{ used: number; quota: number } | null>(null);
  const abort = useRef<AbortController | null>(null);
  const supported = packsSupported();
  const allowed = canPlayOffline();

  const refresh = async (man: OfflineManifest) => {
    const counts: Record<string, number> = {};
    for (const p of man.packs) counts[p.id] = await packProgress(p);
    setHave(counts);
    setUsed(await storageUsed());
  };
  useEffect(() => {
    fetchOfflineManifest().then(async (man) => {
      setM(man);
      if (man) { setBase(await baseReady(man)); await refresh(man); }
    });
    return () => abort.current?.abort();
  }, []);

  const download = async (p: OfflinePack) => {
    playButtonTap();
    if (!online) { toast(t('offline_needsConnection')); return; }
    if (!allowed) { toast(t('dl_proOnly')); return; }
    abort.current?.abort();
    const ctl = new AbortController();
    abort.current = ctl;
    setBusy(p.id);
    const ok = await downloadPack(p, (n) => setHave((h) => ({ ...h, [p.id]: n })), ctl.signal);
    setBusy(null);
    if (!ctl.signal.aborted) toast(ok ? tt('dl_done', { name: t(`dl_pack_${p.id}` as never) }) : t('dl_failed'));
    if (m) await refresh(m);
  };
  const remove = async (p: OfflinePack) => {
    playButtonTap();
    if (busy === p.id) abort.current?.abort();
    await deletePack(p.id);
    toast(tt('dl_deleted', { size: formatMB(p.bytes, locale) }));
    if (m) await refresh(m);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center game-bg overflow-y-auto px-3 py-4 sm:px-4 sm:py-6 md:px-6">
      <div className="w-full max-w-2xl animate-fade-in-up pb-6" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 8px)' }}>
        <ScreenHeader onBack={onBack} title={t('dl_title')} subtitle={t('dl_subtitle')} />

        {!allowed && (
          <section className="mb-3 rounded-3xl border-2 border-primary/60 bg-primary/10 p-4 text-center">
            <p className="font-extrabold">✈️ {t('offline_proPitch')}</p>
            <p className="text-sm text-foreground/80 mt-0.5">{t('dl_proPitchDesc')}</p>
            <button onClick={() => { playButtonTap(); onOpenStore(); }} className="btn3d mt-3 rounded-2xl px-6 py-2.5 font-black text-primary-foreground" style={{ background: 'var(--grad-cta)' }}>{t('dl_seePro')}</button>
          </section>
        )}

        <section className="rounded-3xl border-2 border-accent/40 bg-card/75 p-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl" aria-hidden>🎮</span>
            <span className="flex-1 min-w-0">
              <span className="block font-extrabold">{t('dl_base')}</span>
              <span className="block text-xs text-muted-foreground">{t('dl_baseDesc')}</span>
            </span>
            <span className="text-right text-sm font-bold">
              {m ? formatMB(m.baseBytes, locale) : ''}
              <span className={`block text-[11px] ${base || isNativeApp() ? 'text-accent' : 'text-muted-foreground'}`}>{isNativeApp() ? t('dl_inApp') : base ? `✓ ${t('dl_saved')}` : base === false ? t('dl_baseSaving') : ''}</span>
            </span>
          </div>
        </section>

        <h2 className="mt-4 mb-2 font-extrabold text-lg">📷 {t('dl_photos')}</h2>
        {!supported ? (
          <p className="rounded-2xl border border-foreground/15 bg-card/50 p-3 text-sm text-muted-foreground">{isNativeApp() ? t('dl_nativeSoon') : t('dl_unsupported')}</p>
        ) : m === undefined ? (
          <p className="text-sm text-muted-foreground">{t('loading')}</p>
        ) : m === null ? (
          <p className="rounded-2xl border border-foreground/15 bg-card/50 p-3 text-sm text-muted-foreground">{t('dl_noManifest')}</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {m.packs.map((p) => {
              const n = have[p.id] ?? 0;
              const done = n >= p.files.length && p.files.length > 0;
              const pct = p.files.length ? Math.round((n / p.files.length) * 100) : 0;
              return (
                <section key={p.id} className={`rounded-2xl border-2 p-3 ${done ? 'border-accent/50 bg-card/75' : 'border-foreground/15 bg-card/60'}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl" aria-hidden>{PACK_EMOJI[p.id]}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block font-extrabold leading-tight">{t(`dl_pack_${p.id}` as never)}</span>
                      <span className="block text-xs text-muted-foreground">{tt('dl_packMeta', { n: p.files.length, size: formatMB(p.bytes, locale) })}</span>
                    </span>
                    {done ? (
                      <button onClick={() => remove(p)} className="shrink-0 rounded-xl border-2 border-foreground/20 px-3 py-1.5 text-sm font-bold text-destructive/90">🗑 {t('dl_delete')}</button>
                    ) : busy === p.id ? (
                      <button onClick={() => { playButtonTap(); abort.current?.abort(); }} className="shrink-0 rounded-xl border-2 border-foreground/20 px-3 py-1.5 text-sm font-bold">{t('dl_cancel')}</button>
                    ) : (
                      <button onClick={() => download(p)} disabled={!!busy} className="shrink-0 rounded-xl border-2 border-accent/60 px-3 py-1.5 text-sm font-bold text-accent disabled:opacity-50">⬇ {n > 0 ? t('dl_resume') : t('dl_download')}</button>
                    )}
                  </div>
                  {(busy === p.id || (n > 0 && !done)) && (
                    <div className="mt-2">
                      <div className="h-2 rounded-full bg-foreground/10 overflow-hidden"><div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} /></div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{pct}%</p>
                    </div>
                  )}
                  {done && <p className="mt-1 text-[11px] font-bold text-accent">✓ {t('dl_saved')}</p>}
                </section>
              );
            })}
          </div>
        )}

        {used && <p className="mt-4 text-center text-xs text-muted-foreground">{tt('dl_storage', { used: formatMB(used.used, locale), quota: formatMB(used.quota, locale) })}</p>}
        <p className="mt-2 text-center text-xs text-muted-foreground">{t('dl_rankingNote')}</p>
      </div>
    </div>
  );
}
