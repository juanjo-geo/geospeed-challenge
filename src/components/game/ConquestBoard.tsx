import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '@/i18n';
import { playButtonTap, playClick } from '@/lib/sounds';
import { trackEvent } from '@/lib/analytics';
import {
  conqServerNow, formatTimeLeft, useConqMap, useConqTerritory,
  type ConqBlock, type ConqMap, type ConqTerritory, type ConqTerritoryDetail,
} from '@/lib/conquest';
import {
  boardLayer, conqCountryName, countryBounds, myStanding, pickTerritory, playerStyles, sheetLayer, zoneOf,
  ZONE_BOUNDS, type BoardZone, type PlayerStyle,
} from '@/lib/conquestMap';
import { CONQUEST_COUNTRIES } from '@/data/conquestCatalog';
import { CONQ } from '@/lib/theme';
import { appNumberLocale } from '@/lib/format';
import ScreenHeader from '@/components/ui/ScreenHeader';
import Mascot from './Mascot';
import WorldMapCanvas from './WorldMapCanvas';
import { BackHome, Card, ConqFace, CtaButton, ErrorBox, Page, Swatch, useErrText } from './ConquestParts';

/**
 * Conquista el mapa — fase C4 (docs/GeoSpeed_Conquista_Plan.md): P1 tablero (mapa con el color de cada dueño, leyenda,
 * lista accesible con los mismos 10 países, cuenta regresiva, mis territorios, puesto y misiones de hoy) y P2 ficha del
 * territorio (dueño o libre, marca, misión, cupos, espera y por qué está bloqueado; practicar). El servidor decide todo:
 * aquí solo se muestra lo que responden conq_map y conq_territory.
 */

/** Lo que el jugador necesita para practicar: el país y qué habría que superar */
export interface PracticeTarget { kind: 'capture' | 'attack' | 'own'; mark: number; ownerName: string | null }

interface ConquestBoardScreenProps {
  seasonId: string;
  /** Abre directamente la ficha de este país (al volver de la práctica) */
  initialIso?: string | null;
  onBack: (groupId: string | null) => void;
  onOpenGroup: (groupId: string) => void;
  onPractice: (iso: string, target: PracticeTarget) => void;
  onStart: (iso: string) => void;
}

/** Fuerza un re-render cada `ms` (cuentas regresivas que dependen del reloj del servidor) */
function useTick(ms: number) {
  const [, set] = useState(0);
  useEffect(() => { const id = setInterval(() => set((n) => n + 1), ms); return () => clearInterval(id); }, [ms]);
}
const left = (iso: string | null | undefined) => formatTimeLeft((iso ? Date.parse(iso) : 0) - conqServerNow());
const IsoFlag = ({ iso, className = 'w-7' }: { iso: string; className?: string }) => (
  <img src={`/flags/${iso}.svg`} alt="" aria-hidden className={`aspect-[3/2] object-cover rounded-[3px] shadow-sm ring-1 ring-black/20 shrink-0 ${className}`} />
);

export function ConquestBoardScreen({ seasonId, initialIso = null, onBack, onOpenGroup, onPractice, onStart }: ConquestBoardScreenProps) {
  const { t } = useI18n();
  const errText = useErrText();
  const { map, error, refresh } = useConqMap(seasonId);
  const [selected, setSelected] = useState<string | null>(initialIso);
  const [sheet, setSheet] = useState<string | null>(initialIso);
  const [zone, setZone] = useState<BoardZone>(() => (initialIso ? zoneOf(initialIso) : typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'all' : 'america'));
  useTick(30_000);

  const styles = useMemo(() => playerStyles(map?.players ?? [], map?.my_id ?? null), [map?.players, map?.my_id]);
  const layer = useMemo(() => (map ? boardLayer(map.territories, styles, selected) : null), [map, styles, selected]);
  const mapBox = useRef<HTMLDivElement>(null);
  const onMapClick = useCallback((lat: number, lon: number) => {
    // Tolerancia ≈ 18 px a la escala de la zona (en "Todo" un píxel son decenas de km)
    const b = ZONE_BOUNDS[zone];
    const kmPerPx = ((b.lonMax - b.lonMin) * 95) / Math.max(200, mapBox.current?.clientWidth ?? 400);
    const iso = pickTerritory(lat, lon, Math.max(60, Math.min(400, kmPerPx * 18)));
    if (!iso) return;
    playClick();
    setSelected(iso);
  }, [zone]);
  const openSheet = (iso: string) => { playButtonTap(); setSelected(iso); setSheet(iso); trackEvent('conq_territory_open', { iso }); };

  if (!map) {
    return (
      <Page>
        <ScreenHeader onBack={() => onBack(null)} title={t('cq_boardTitle')} />
        <Card className="flex flex-col items-center gap-3 text-center">
          {error ? (
            <>
              <Mascot state="sad" className="w-20" />
              <p className="font-extrabold text-lg">{errText(error.code)}</p>
              <div className="flex gap-2">
                <button onClick={() => { playButtonTap(); void refresh(); }} className="rounded-2xl border-2 border-accent px-5 py-2.5 font-bold text-accent hover:bg-accent/10">{t('retry')}</button>
                <BackHome onClick={() => onBack(null)} />
              </div>
            </>
          ) : <p className="py-8 text-muted-foreground">{t('loading')}</p>}
        </Card>
      </Page>
    );
  }

  if (sheet) {
    return (
      <TerritorySheet map={map} iso={sheet} styles={styles}
        onBack={() => { playButtonTap(); setSheet(null); void refresh(); }}
        onPractice={onPractice} onStart={onStart} />
    );
  }

  const groupId = map.season.group_id;
  const mine = myStanding(map);
  const active = map.season.status === 'active';
  const sel = selected ? map.territories.find((x) => x.iso === selected) ?? null : null;
  const retiredOnBoard = map.territories.some((x) => x.retired);
  const legend = [...styles.values()].sort((a, b) => Number(b.me) - Number(a.me) || a.slot - b.slot);

  return (
    <Page wide>
      <ScreenHeader onBack={() => onBack(groupId)} title={t('cq_boardTitle')} />
      <div className="-mt-2 flex flex-wrap items-center justify-center gap-2">
        <span className="rounded-full border border-accent/50 px-3 py-1 text-xs sm:text-sm font-bold">
          📅 {active ? t('cq_seasonChip', { n: map.season.number, time: left(map.season.ends_at) }) : t('cq_seasonClosedChip', { n: map.season.number })}
        </span>
        <button onClick={() => { playButtonTap(); onOpenGroup(groupId); }} className="rounded-full border border-accent/50 px-3 py-1 text-xs sm:text-sm font-bold hover:bg-accent/10">
          👥 {t('cq_groupChip', { n: map.players.length })} ›
        </button>
      </div>

      {map.final && <p className="rounded-2xl border border-primary/50 bg-primary/10 px-3 py-2 text-sm text-center font-bold">🏁 {t('cq_seasonOverBoard')}</p>}
      {active && map.me && !map.me.in_roster && <p className="rounded-2xl border border-accent/40 bg-accent/10 px-3 py-2 text-sm text-center">{t('cq_notInRosterBoard')}</p>}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] items-start">
        {/* P1: mapa con dueños, zonas y leyenda (min-w-0: si no, el lienzo ensancha la columna de la cuadrícula) */}
        <div className="min-w-0 flex flex-col gap-2">
          <div ref={mapBox} className="relative rounded-3xl overflow-hidden border-2 border-accent/40 h-[clamp(16rem,52dvh,30rem)] short:h-[78dvh] lg:h-[min(66dvh,36rem)]" role="region" aria-label={t('cq_mapAria')}>
            <WorldMapCanvas onMapClick={onMapClick} gameMode="world" viewBounds={ZONE_BOUNDS[zone]} territories={layer} showZoomControls />
            <div className="absolute left-2 top-2 flex gap-1.5" role="group" aria-label={t('cq_zones')}>
              {(['america', 'europe', 'all'] as BoardZone[]).map((z) => (
                <button key={z} onClick={() => { playButtonTap(); setZone(z); }} aria-pressed={zone === z}
                  className={`rounded-full px-3 py-1 text-xs font-bold border backdrop-blur-md ${zone === z ? 'bg-primary text-primary-foreground border-primary' : 'border-accent/50 text-foreground'}`}
                  style={zone === z ? undefined : { background: 'hsl(var(--brand-navy-deep) / 0.8)' }}>
                  {t(z === 'america' ? 'cq_zoneAmerica' : z === 'europe' ? 'cq_zoneEurope' : 'cq_zoneAll')}
                </button>
              ))}
            </div>
          </div>
          {/* Leyenda: cada jugador con su color y trama (también para daltonismo), libres y retirados */}
          <ul className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-1 text-xs sm:text-sm" aria-label={t('cq_legend')}>
            {legend.map((p) => (
              <li key={p.user_id} className="flex items-center gap-1.5"><Swatch color={p.color} pattern={p.pattern} /><span className={p.me ? 'font-bold' : ''}>{p.me ? t('cq_you') : p.name ?? t('cq_retired')}</span></li>
            ))}
            <li className="flex items-center gap-1.5"><Swatch color={CONQ.free} /><span>{t('cq_legendFree')}</span></li>
            {retiredOnBoard && <li className="flex items-center gap-1.5"><Swatch color={CONQ.retired} pattern="stripes" /><span>{t('cq_retired')}</span></li>}
          </ul>
        </div>

        <div className="min-w-0 flex flex-col gap-3">
          {/* Mis números */}
          <div className="grid grid-cols-3 gap-2">
            <Stat icon="🚩" value={mine ? String(mine.territories) : '–'} label={t('cq_statTerritories')} />
            <Stat icon="🏆" value={mine ? t('cq_rankN', { n: mine.rank }) : '–'} label={t('cq_statRank')} />
            <Stat icon="⚔️" value={map.me ? `${map.me.missions_left}/${map.me.missions_per_day}` : '–'} label={t('cq_statMissions')} />
          </div>

          {/* País elegido (como la maqueta: dueño, marca y el botón que abre la ficha) */}
          {sel ? <SelectedCard terr={sel} styles={styles} onOpen={() => openSheet(sel.iso)} />
            : <p className="rounded-2xl border border-dashed border-accent/40 px-3 py-4 text-sm text-center text-foreground/80">{t('cq_tapHint')}</p>}

          {/* Lista accesible: los mismos 10 países con dueño, marca y estado */}
          <Card className="!p-3 sm:!p-4">
            <h2 className="font-extrabold text-base sm:text-lg mb-2">{t('cq_listTitle')}</h2>
            <ul className="flex flex-col gap-1.5">
              {CONQUEST_COUNTRIES.map((c) => {
                const terr = map.territories.find((x) => x.iso === c.iso);
                if (!terr) return null;
                return <TerritoryRow key={c.iso} terr={terr} styles={styles} selected={selected === c.iso} onOpen={() => openSheet(c.iso)} />;
              })}
            </ul>
          </Card>

          <Standings map={map} styles={styles} />
        </div>
      </div>
    </Page>
  );
}

function Stat({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <div className="rounded-2xl border-2 border-accent/40 bg-card/70 px-2 py-2.5 text-center">
      <p className="font-black text-xl sm:text-2xl leading-tight"><span aria-hidden className="mr-1 text-base">{icon}</span>{value}</p>
      <p className="text-[11px] sm:text-xs text-muted-foreground leading-tight">{label}</p>
    </div>
  );
}

/** Dueño de un país en una línea ("En poder de Paola", "Es tuyo", "Libre", "Jugador retirado") */
function useOwnerLine() {
  const { t } = useI18n();
  return (terr: Pick<ConqTerritory, 'owner_id' | 'retired'>, styles: Map<string, PlayerStyle>) => {
    const o = terr.owner_id ? styles.get(terr.owner_id) : undefined;
    if (o?.me) return t('cq_ownedByYou');
    if (o) return t('cq_ownedBy', { name: o.name ?? t('cq_retired') });
    return terr.retired ? t('cq_retired') : t('cq_free');
  };
}

function SelectedCard({ terr, styles, onOpen }: { terr: ConqTerritory; styles: Map<string, PlayerStyle>; onOpen: () => void }) {
  const { t, locale } = useI18n();
  const ownerLine = useOwnerLine();
  const o = terr.owner_id ? styles.get(terr.owner_id) : undefined;
  const free = !terr.owner_id && !terr.retired;
  const fmt = (n: number) => n.toLocaleString(appNumberLocale());
  const action = o?.me ? t('cq_actOwn') : free ? t('cq_actCapture') : t('cq_actAttack');
  return (
    <Card className="!p-3 sm:!p-4 flex flex-col gap-2.5 border-primary/50">
      <button onClick={onOpen} className="flex items-center gap-3 text-left">
        <IsoFlag iso={terr.iso} className="w-12" />
        <span className="min-w-0 flex-1">
          <span className="block font-black text-xl leading-tight">{conqCountryName(terr.iso, locale)}</span>
          <span className="block text-sm text-foreground/85 truncate">{ownerLine(terr, styles)}</span>
          <span className="block text-sm text-muted-foreground">{free ? t('cq_toCapture', { n: fmt(2000) }) : t('cq_mark', { n: fmt(terr.defense) })}</span>
        </span>
        {terr.reserved_until && <span className="shrink-0 rounded-full border border-primary/60 px-2 py-0.5 text-[11px] font-bold text-primary">⚔️ {t('cq_inDispute')}</span>}
        <span aria-hidden className="text-2xl text-foreground/70">›</span>
      </button>
      <CtaButton onClick={onOpen}>{action}</CtaButton>
    </Card>
  );
}

function TerritoryRow({ terr, styles, selected, onOpen }: { terr: ConqTerritory; styles: Map<string, PlayerStyle>; selected: boolean; onOpen: () => void }) {
  const { t, locale } = useI18n();
  const ownerLine = useOwnerLine();
  const o = terr.owner_id ? styles.get(terr.owner_id) : undefined;
  const free = !terr.owner_id && !terr.retired;
  const name = conqCountryName(terr.iso, locale);
  const mark = free ? t('cq_noMark') : terr.defense.toLocaleString(appNumberLocale());
  return (
    <li>
      <button onClick={onOpen} aria-label={`${name}: ${ownerLine(terr, styles)}, ${free ? t('cq_noMark') : t('cq_mark', { n: mark })}`}
        className={`w-full flex items-center gap-2.5 rounded-2xl border px-2.5 py-2 text-left transition-colors ${selected ? 'border-primary bg-primary/10' : 'border-accent/25 bg-background/40 hover:bg-accent/10'}`}>
        <IsoFlag iso={terr.iso} />
        <span className="min-w-0 flex-1">
          <span className="block font-bold text-sm sm:text-base truncate">{name}</span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
            {o ? <Swatch color={o.color} pattern={o.pattern} /> : <Swatch color={terr.retired ? CONQ.retired : CONQ.free} pattern={terr.retired ? 'stripes' : null} />}
            <span className="truncate">{ownerLine(terr, styles)}</span>
          </span>
        </span>
        {terr.reserved_until && <span className="shrink-0 text-[11px] font-bold text-primary" title={t('cq_inDispute')}>⚔️</span>}
        <span className={`shrink-0 text-sm font-black tabular-nums ${free ? 'text-muted-foreground font-semibold' : ''}`}>{mark}</span>
        <span aria-hidden className="text-lg text-foreground/60">›</span>
      </button>
    </li>
  );
}

/** Clasificación (en vivo o final): territorios y, si empatan, la suma de marcas; los empates comparten puesto */
function Standings({ map, styles }: { map: ConqMap; styles: Map<string, PlayerStyle> }) {
  const { t } = useI18n();
  const fmt = (n: number) => n.toLocaleString(appNumberLocale());
  return (
    <Card className="!p-3 sm:!p-4">
      <h2 className="font-extrabold text-base sm:text-lg">{map.final ? t('cq_standingsFinal') : t('cq_standingsLive')}</h2>
      <p className="text-xs text-muted-foreground mb-2">{t('cq_standingsRule')}</p>
      <ol className="flex flex-col gap-1.5">
        {map.standings.map((s) => {
          const st = styles.get(s.user_id);
          return (
            <li key={s.user_id} className={`flex items-center gap-2.5 rounded-xl px-2 py-1.5 text-sm ${st?.me ? 'bg-primary/15 border border-primary/50' : 'bg-background/40'}`}>
              <span className="w-8 text-center font-black text-muted-foreground">{t('cq_rankN', { n: s.rank })}</span>
              <ConqFace player={{ avatar: s.avatar, slot: s.slot }} color={st?.color} />
              <span className="min-w-0 flex-1 truncate font-semibold">{s.name ?? t('cq_retired')}{st?.me ? ` · ${t('cq_you')}` : ''}</span>
              <span className="text-right text-xs leading-tight"><span className="block font-black text-sm">🚩 {s.territories}</span><span className="block text-muted-foreground">{fmt(s.defense_sum)}</span></span>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

// ═══════════════════════════════════════ P2 Ficha del territorio ═══════════════════════════════════════
interface TerritorySheetProps {
  map: ConqMap;
  iso: string;
  styles: Map<string, PlayerStyle>;
  onBack: () => void;
  onPractice: (iso: string, target: PracticeTarget) => void;
  onStart: (iso: string) => void;
}

function TerritorySheet({ map, iso, styles, onBack, onPractice, onStart }: TerritorySheetProps) {
  const { t, locale } = useI18n();
  const errText = useErrText();
  const { detail, error } = useConqTerritory(map.season.id, iso);
  useTick(10_000);
  const fallback = map.territories.find((x) => x.iso === iso) ?? null;
  const terr: Pick<ConqTerritoryDetail, 'owner_id' | 'retired' | 'defense'> | null = detail ?? fallback;
  const owner = terr?.owner_id ? styles.get(terr.owner_id) : undefined;
  const mine = !!owner?.me;
  const free = !!terr && !terr.owner_id && !terr.retired;
  const kind = mine ? 'own' : detail?.kind ?? (free ? 'capture' : 'attack');
  const threshold = detail?.threshold ?? map.season.rules.threshold ?? 2000;
  const fmt = (n: number) => n.toLocaleString(appNumberLocale());
  const name = conqCountryName(iso, locale);
  const layer = useMemo(() => sheetLayer(fallback, iso, styles), [fallback, iso, styles]);
  const bounds = useMemo(() => countryBounds(iso, 0.08), [iso]);
  const title = kind === 'own' ? t('cq_sheetOwn', { country: name }) : kind === 'capture' ? t('cq_sheetCapture', { country: name })
    : kind === 'recover' ? t('cq_sheetRecover', { country: name }) : t('cq_sheetAttack', { country: name });
  const me = detail?.me ?? map.me;
  const reason = detail ? detail.reason : null;
  const target: PracticeTarget = { kind: kind === 'own' ? 'own' : free ? 'capture' : 'attack', mark: free ? threshold : terr?.defense ?? 0, ownerName: owner?.name ?? (terr?.retired ? t('cq_retired') : null) };

  const why = (r: ConqBlock): string => {
    const reset = left(me?.next_reset_at);
    switch (r) {
      case 'reserved': return t('cq_why_reserved', { time: left(detail?.reserved_until) });
      case 'daily_limit': return t('cq_why_daily_limit', { n: me?.missions_per_day ?? 5, time: reset });
      case 'country_limit': return t('cq_why_country_limit', { n: detail?.per_country_daily ?? 2, time: reset });
      case 'cooldown': return t('cq_why_cooldown', { time: left(detail?.cooldown_until) });
      default: return t(`cq_why_${r}` as never);
    }
  };
  const ctaLabel = kind === 'recover' ? t('cq_startRecover') : kind === 'capture' ? t('cq_startCapture') : t('cq_startMission');

  return (
    <Page wide>
      <ScreenHeader onBack={onBack} title={title} titleAside={<IsoFlag iso={iso} className="w-12 sm:w-16" />} />

      <div className="grid gap-4 lg:grid-cols-2 items-start">
        <div className="min-w-0 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            {/* Miniatura del país (sin tocar: la página sigue desplazándose encima) */}
            <div className="relative min-w-0 rounded-3xl overflow-hidden border-2 border-accent/40 aspect-square pointer-events-none" aria-hidden>
              <WorldMapCanvas onMapClick={() => {}} clickDisabled gameMode="world" viewBounds={bounds} territories={layer} showZoomControls={false} />
            </div>
            {/* Quién lo tiene y su marca */}
            <Card className="!p-3 flex flex-col items-center justify-center gap-1.5 text-center">
              {owner ? (
                <>
                  <p className="text-xs sm:text-sm text-muted-foreground">{mine ? t('cq_yourMark') : t('cq_defendedBy')}</p>
                  <ConqFace player={owner} color={owner.color} size="lg" />
                  <p className="font-bold leading-tight">{mine ? t('cq_you') : owner.name ?? t('cq_retired')}</p>
                  <p className="font-black text-xl text-primary tabular-nums leading-tight">{t('cq_points', { n: fmt(terr?.defense ?? 0) })}</p>
                </>
              ) : terr?.retired ? (
                <>
                  <p className="text-xs sm:text-sm text-muted-foreground">{t('cq_defendedBy')}</p>
                  <span className="text-4xl" aria-hidden>🏳️</span>
                  <p className="font-bold leading-tight">{t('cq_retired')}</p>
                  <p className="font-black text-xl text-primary tabular-nums leading-tight">{t('cq_points', { n: fmt(terr.defense) })}</p>
                </>
              ) : (
                <>
                  <span className="text-4xl" aria-hidden>🏳️</span>
                  <p className="font-extrabold leading-tight">{t('cq_freeTitle')}</p>
                  <p className="text-sm text-foreground/85">{t('cq_freeDesc', { n: fmt(threshold), max: fmt(5000) })}</p>
                </>
              )}
            </Card>
          </div>

          <Card>
            <h2 className="font-extrabold text-xl mb-2">{t('cq_missionTitle')}</h2>
            <ul className="flex flex-col gap-2">
              {[['📍', t('cq_missionCities', { n: detail?.rounds ?? 5 })], ['⏱️', t('cq_missionSeconds', { s: detail?.seconds ?? 15 })], ['⚖️', t('cq_missionSame')]].map(([icon, text]) => (
                <li key={icon} className="flex items-center gap-3 rounded-2xl border border-accent/25 bg-background/40 px-3 py-2 font-bold"><span aria-hidden className="text-xl">{icon}</span>{text}</li>
              ))}
            </ul>
            <p className="mt-3 text-sm sm:text-base text-foreground/90">
              {kind === 'own' ? t('cq_goalOwn') : kind === 'capture' ? t('cq_goalCapture', { n: fmt(threshold) }) : t('cq_goalAttack', { n: fmt(terr?.defense ?? 0) })}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">🎯 {t('cq_goalTip')}</p>
          </Card>
        </div>

        <div className="min-w-0 flex flex-col gap-4">
          {/* Cupos de hoy y esperas */}
          {me && map.season.status === 'active' && (
            <Card>
              <h2 className="font-extrabold text-lg mb-1">{t('cq_todayTitle')}</h2>
              <ul className="flex flex-col gap-1 text-sm sm:text-base">
                <li>⚔️ {t('cq_todayLeft', { n: me.missions_left, total: me.missions_per_day })}</li>
                {detail && <li>🗺️ {t('cq_todayCountry', { n: detail.my_country_today, max: detail.per_country_daily })}</li>}
                <li className="text-muted-foreground">🔄 {t('cq_resetIn', { time: left(me.next_reset_at) })}</li>
                {detail?.cooldown_until && <li className="text-muted-foreground">⏳ {t('cq_cooldownIn', { time: left(detail.cooldown_until) })}</li>}
              </ul>
            </Card>
          )}
          {error && <ErrorBox text={errText(error.code)} />}
          {reason && (
            <p className="rounded-2xl border border-primary/50 bg-primary/10 px-3 py-2.5 text-sm sm:text-base text-center font-semibold" role="status">{why(reason)}</p>
          )}
          <p className="text-xs sm:text-sm text-muted-foreground text-center">{t('cq_practiceNote')}</p>
        </div>
      </div>

      {/* Barra fija: comenzar (o por qué no) y practicar */}
      <div className="sticky bottom-0 z-10 -mx-3 sm:-mx-4 md:-mx-6 px-3 sm:px-4 md:px-6 pt-3 flex flex-col items-center gap-1.5 bg-gradient-to-t from-background via-background/95 to-transparent"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 12px)' }}>
        {kind !== 'own' && (
          <div className="w-full max-w-xl">
            <CtaButton onClick={() => { playButtonTap(); onStart(iso); }} disabled={!detail?.can_start}>⚔️ {ctaLabel}</CtaButton>
          </div>
        )}
        <button onClick={() => { playButtonTap(); trackEvent('conq_practice_open', { iso }); onPractice(iso, target); }}
          className={kind === 'own' ? 'w-full max-w-xl rounded-2xl py-3 border-2 border-accent text-accent font-black text-lg hover:bg-accent/10' : 'py-1.5 font-bold text-accent underline-offset-4 hover:underline'}>
          🎯 {t('cq_practiceFirst')}
        </button>
      </div>
    </Page>
  );
}

