import { useMemo, useState } from 'react';
import { useI18n } from '@/i18n';
import { useSprintStatus, refreshSprintStatus, setMyCountry, countryOptions, isoName, defaultCountry } from '@/lib/sprint';
import { IsoFlag } from './SprintScreen';

/**
 * País del jugador para el ranking del Sprint por país (Fase 5; decisión de JuanJo: se elige en el perfil, con el
 * del teléfono por defecto). Solo para cuentas registradas.
 */
export default function CountryPicker() {
  const { t, locale } = useI18n();
  const st = useSprintStatus();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const options = useMemo(() => countryOptions(locale), [locale]);
  const iso = st?.country ?? null;
  const suggested = iso ? null : defaultCountry();

  const choose = async (value: string | null) => {
    setSaving(true);
    await setMyCountry(value);
    await refreshSprintStatus(true);
    setSaving(false);
    setOpen(false);
  };

  return (
    <div className="w-full mt-3 rounded-2xl border border-accent/40 bg-background/40 px-3 py-2 text-left">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-bold text-muted-foreground shrink-0">{t('profile_country')}</span>
        <IsoFlag iso={iso ?? suggested} />
        <span className="font-bold truncate flex-1 min-w-0">{iso ? isoName(iso, locale) : suggested ? `${isoName(suggested, locale)} · ${t('profile_countrySuggested')}` : '—'}</span>
        {suggested && !open ? (
          <button disabled={saving} onClick={() => choose(suggested)} className="shrink-0 text-xs font-black text-primary hover:underline">{t('profile_countryConfirm')}</button>
        ) : null}
        <button onClick={() => setOpen((v) => !v)} className="shrink-0 text-xs font-bold text-accent hover:underline">{t('sprint_changeCountry')}</button>
      </div>
      {open && (
        <select
          className="mt-2 w-full rounded-xl border-2 border-accent/50 bg-background px-3 py-2 text-sm font-semibold"
          value={iso ?? ''}
          disabled={saving}
          onChange={(e) => choose(e.target.value || null)}
          aria-label={t('sprint_changeCountry')}
        >
          <option value="">—</option>
          {options.map((o) => <option key={o.iso} value={o.iso}>{o.name}</option>)}
        </select>
      )}
      <p className="mt-1 text-[11px] text-muted-foreground">{t('profile_countryHint')}</p>
    </div>
  );
}
