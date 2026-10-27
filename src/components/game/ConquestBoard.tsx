import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '@/i18n';
import { playButtonTap, playClick } from '@/lib/sounds';
import { trackEvent } from '@/lib/analytics';
import {
  activeMission, championsOf, conqServerNow, fetchActivity, fetchStandings, formatTimeLeft, markSeen, useConqMap, useConqTerritory,
  type ConqBlock, type ConqErrorCode, type ConqEvent, type ConqMap, type ConqSeasonStandings, type ConqTerritory, type ConqTerritoryDetail,
} from '@/lib/conquest';
import {
  boardLayer, conqCountryName, countryBounds, describeEvent, myStanding, pickTerritory, playerStyles, sheetLayer, timeAgo, zoneOf,
  ZONE_BOUNDS, type BoardZone, type PlayerStyle,
} from '@/lib/conquestMap';
import { askConquestPermissionOnce, syncConquestReminders } from '@/lib/conquestReminders';
import { fireCelebration } from '@/lib/confetti';
import { playShareSuccess, playVictory } from '@/lib/sounds';
import { CONQUEST_COUNTRIES } from '@/data/conquestCatalog';
import { CONQ } from '@/lib/theme';
import { appNumberLocale } from '@/lib/format';
import ScreenHeader from '@/components/ui/ScreenHeader';
import Mascot from './Mascot';
import WorldMapCanvas from './WorldMapCanvas';
import { BackHome, Card, ConqFace, CtaButton, ErrorBox, Page, Swatch, errCode, useErrText } from './ConquestParts';

/**
 * Conquista el mapa — fase C4 (docs/GeoSpeed_Conquista_Plan.md): P1 tablero (mapa con el color de cada dueño, leyenda,
 * lista accesible con los mismos 10 países, cuenta regresiva, mis territorios, puesto y misiones de hoy) y P2 ficha del
 * territorio (dueño o libre, marca, misión, cupos, espera y por qué está bloqueado; practicar). C6: pestañas Mapa ·
 * Actividad (P5: conquistas y pérdidas con fecha, filtro "Míos", Recuperar) · Temporada (P6: clasificación en vivo o final
 * con desempates, premio, campeón, historial y la próxima temporada desde la sala). El servidor decide todo: aquí solo se
 * muestra lo que responden conq_map, conq_territory, conq_activity y conq_standings.
 */

type BoardTab = 'map' | 'activity' | 'season';

/** Lo que el jugador necesita para practicar: el país y qué habría que superar */
export interface PracticeTarget { kind: 'capture' | 'attack' | 'own'; mark: number; ownerName: string | null }

interface ConquestBoardScreenProps {
  seasonId: string;
  /** Abre directamente la ficha de este país (al volver de la práctica) */
  initialIso?: string | null;
  onBack: (groupId: string | null) => void;
  onOpenGroup: (groupId: string) => void;
  onPractice: (iso: string, target: PracticeTarget) => void;
  /** Misión oficial nueva en ese país (ya confirmada) */
  onStart: (iso: string) => void;
  /** Retomar la misión en curso (la de este u otro teléfono) */
  onResume: (attemptId: string) => void;
  /** Elegir el título "Conquistador" (vitrina de logros) */
  onOpenTitles?: () => void;
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

export function ConquestBoardScreen({ seasonId, initialIso = null, onBack, onOpenGroup, onPractice, onStart, onResume, onOpenTitles }: ConquestBoardScreenProps) {
  const { t } = useI18n();
  const errText = useErrText();
  const { map, error, refresh } = useConqMap(seasonId);
  const [selected, setSelected] = useState<string | null>(initialIso);
  const [sheet, setSheet] = useState<string | null>(initialIso);
  const [zone, setZone] = useState<BoardZone>(() => (initialIso ? zoneOf(initialIso) : typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'all' : 'america'));
  // Pestaña elegida; mientras no se elija, una temporada cerrada abre en su clasificación final
  const [tabPick, setTabPick] = useState<BoardTab | null>(null);
  useTick(30_000);

  const styles = useMemo(() => playerStyles(map?.players ?? [], map?.my_id ?? null), [map?.players, map?.my_id]);
  const layer = useMemo(() => (map ? boardLayer(map.territories, styles, selected) : null), [map, styles, selected]);
  // Recordatorios 24 h y 1 h antes del cierre (y el permiso en la app instalada, una vez)
  const remind = map ? `${map.season.id}|${map.season.status}|${map.season.ends_at}|${map.me?.in_roster ?? false}` : '';
  useEffect(() => {
    if (!map) return;
    const playing = map.season.status === 'active' && !!map.me?.in_roster;
    void syncConquestReminders([{ seasonId: map.season.id, groupId: map.season.group_id, endsAt: map.season.ends_at, active: map.season.status === 'active', inRoster: !!map.me?.in_roster }]);
    if (playing) void askConquestPermissionOnce();
  }, [remind]); // eslint-disable-line react-hooks/exhaustive-deps
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
        onPractice={onPractice} onStart={onStart} onResume={onResume} />
    );
  }

  const groupId = map.season.group_id;
  const mine = myStanding(map);
  const active = map.season.status === 'active';
  const sel = selected ? map.territories.find((x) => x.iso === selected) ?? null : null;
  const retiredOnBoard = map.territories.some((x) => x.retired);
  const legend = [...styles.values()].sort((a, b) => Number(b.me) - Number(a.me) || a.slot - b.slot);
  const tab: BoardTab = tabPick ?? (map.final ? 'season' : 'map');
  const tabs: { k: BoardTab; icon: string; label: string; badge?: number }[] = [
    { k: 'map', icon: '🗺️', label: t('cq_tabMap') },
    { k: 'activity', icon: '📣', label: t('cq_tabActivity'), badge: map.unread },
    { k: 'season', icon: '🏆', label: t('cq_tabSeason') },
  ];

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
      {/* Misión en curso (recarga, app cerrada, otro teléfono): el reloj del servidor sigue corriendo */}
      {active && map.me?.active_attempt && (
        <ActiveBanner attemptId={map.me.active_attempt} onResume={onResume} />
      )}

      {/* Mapa · Actividad · Temporada (como la barra de las maquetas, aquí arriba: abajo va la navegación del juego) */}
      <div className="grid grid-cols-3 gap-1 rounded-2xl border-2 border-accent/40 bg-card/60 p-1" role="tablist" aria-label={t('cq_boardTitle')}>
        {tabs.map((x) => (
          <button key={x.k} role="tab" aria-selected={tab === x.k} onClick={() => { playButtonTap(); setTabPick(x.k); }}
            className={`relative rounded-xl py-2 text-[13px] min-[400px]:text-sm sm:text-base font-black whitespace-nowrap transition-colors ${tab === x.k ? 'bg-primary text-primary-foreground' : 'text-foreground/85 hover:bg-accent/10'}`}>
            <span aria-hidden>{x.icon}</span> {x.label}
            {!!x.badge && x.badge > 0 && tab !== x.k && <span className="absolute -top-1.5 -right-1 min-w-[1.25rem] rounded-full bg-destructive text-white text-[11px] font-black px-1.5 py-0.5" aria-label={t('cq_unread', { n: x.badge })}>{x.badge}</span>}
          </button>
        ))}
      </div>

      {tab === 'activity' && <ActivityPanel map={map} styles={styles} onRecover={openSheet} onSeen={refresh} />}
      {tab === 'season' && <SeasonPanel map={map} styles={styles} onOpenGroup={() => onOpenGroup(groupId)} onOpenTitles={onOpenTitles} />}

      {tab === 'map' && <div className="grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] items-start">
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
        </div>
      </div>}
    </Page>
  );
}

// ═══════════════════════════════════════ P5 Actividad del grupo ═══════════════════════════════════════
const PAGE = 30;
function ActivityPanel({ map, styles, onRecover, onSeen }: { map: ConqMap; styles: Map<string, PlayerStyle>; onRecover: (iso: string) => void; onSeen: () => void }) {
  const { t, locale } = useI18n();
  const errText = useErrText();
  const [mine, setMine] = useState(false);
  const [events, setEvents] = useState<ConqEvent[] | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [err, setErr] = useState<ConqErrorCode | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const sid = map.season.id;

  const load = useCallback(async (before: number | null) => {
    try {
      const list = await fetchActivity(sid, mine, before, PAGE);
      setEvents((cur) => (before == null ? list : [...(cur ?? []), ...list.filter((e) => !(cur ?? []).some((c) => c.id === e.id))]));
      setHasMore(list.length === PAGE);
      setErr(null);
    } catch (e) {
      setErr(errCode(e));
    }
  }, [sid, mine]);
  // Al abrir, al cambiar el filtro y cada vez que el tablero trae algo nuevo
  useEffect(() => { setEvents(null); void load(null); }, [load]);
  useEffect(() => { if (events) void load(null); }, [map.data_version]); // eslint-disable-line react-hooks/exhaustive-deps
  // Lo más nuevo queda como visto (apaga el contador de la pestaña)
  const top = events?.[0]?.id ?? 0;
  useEffect(() => {
    if (!top || mine) return;
    markSeen(sid, top).then(onSeen).catch(() => {});
  }, [top, mine, sid]); // eslint-disable-line react-hooks/exhaustive-deps

  const name = (id: string | null) => {
    const p = id ? styles.get(id) : undefined;
    return p?.me ? t('cq_you') : p?.name ?? t('cq_retired');
  };
  const fmt = (n: number) => n.toLocaleString(appNumberLocale());
  const now = conqServerNow();
  const TONE: Record<string, string> = {
    lost: 'border-2 border-primary bg-primary/10', me: 'border border-primary/40 bg-card/80', held: 'border border-accent/60 bg-accent/10',
    other: 'border border-accent/25 bg-card/70', system: 'border border-dashed border-accent/30 bg-background/30',
  };

  return (
    <Card className="!p-3 sm:!p-4">
      <div className="flex items-center justify-between gap-2 mb-2">
        <h2 className="font-extrabold text-lg">{t('cq_activityTitle')}</h2>
        <div className="flex rounded-full border border-accent/40 p-0.5 text-xs font-bold" role="group" aria-label={t('cq_activityFilter')}>
          {[false, true].map((m) => (
            <button key={String(m)} onClick={() => { playButtonTap(); setMine(m); }} aria-pressed={mine === m}
              className={`rounded-full px-3 py-1 ${mine === m ? 'bg-accent text-accent-foreground' : 'text-foreground/80'}`}>{m ? t('cq_activityMine') : t('cq_activityAll')}</button>
          ))}
        </div>
      </div>
      {err && <ErrorBox text={errText(err)} />}
      {!events ? <p className="py-6 text-center text-muted-foreground">{t('loading')}</p>
        : events.length === 0 ? <p className="py-6 text-center text-foreground/80">{mine ? t('cq_activityEmptyMine') : t('cq_activityEmpty')}</p>
        : (
          <ol className="flex flex-col gap-2" aria-live="polite">
            {events.map((e) => {
              const country = e.country ? conqCountryName(e.country, locale) : '';
              const line = describeEvent(e, map.my_id, name, country, map.season.rules.threshold ?? 2000, fmt);
              return (
                <li key={e.id} className={`rounded-2xl px-3 py-2.5 flex items-start gap-3 ${TONE[line.tone]}`}>
                  {e.country ? <IsoFlag iso={e.country} className="w-9 mt-0.5" /> : <span className="text-2xl leading-none" aria-hidden>{e.type === 'season_close' ? '🏁' : '🚀'}</span>}
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold leading-tight">{t(line.title[0] as never, line.title[1])}</span>
                    {line.sub && <span className="block text-sm text-foreground/80">{t(line.sub[0] as never, line.sub[1])}</span>}
                    <span className="block text-xs text-muted-foreground mt-0.5">🕒 {timeAgo(e.at, now, locale)}</span>
                    {e.can_recover && e.country && (
                      <button onClick={() => { trackEvent('conq_recover_tap', { iso: e.country }); onRecover(e.country!); }}
                        className="btn3d mt-2 rounded-xl px-4 py-2 font-black text-sm uppercase text-primary-foreground" style={{ background: 'var(--grad-cta)' }}>
                        {t('cq_recoverCta', { country })}
                      </button>
                    )}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      {hasMore && events && (
        <button disabled={loadingMore} onClick={async () => { playButtonTap(); setLoadingMore(true); await load(events[events.length - 1]?.id ?? null); setLoadingMore(false); }}
          className="mt-2 w-full rounded-2xl border-2 border-accent/50 py-2 font-bold text-accent hover:bg-accent/10">{loadingMore ? '…' : t('cq_loadMore')}</button>
      )}
    </Card>
  );
}

// ═══════════════════════════════════════ P6 Temporada ═══════════════════════════════════════
function SeasonPanel({ map, styles, onOpenGroup, onOpenTitles }: { map: ConqMap; styles: Map<string, PlayerStyle>; onOpenGroup: () => void; onOpenTitles?: () => void }) {
  const { t, locale } = useI18n();
  const errText = useErrText();
  const [st, setSt] = useState<ConqSeasonStandings | null>(null);
  const [err, setErr] = useState<ConqErrorCode | null>(null);
  const sid = map.season.id;
  useEffect(() => {
    let alive = true;
    fetchStandings(sid).then((x) => { if (alive) { setSt(x); setErr(null); } }).catch((e) => { if (alive) setErr(errCode(e)); });
    return () => { alive = false; };
  }, [sid, map.data_version, map.final]);

  const final = st?.final ?? map.final;
  const rows = st?.standings ?? map.standings;
  const champs = final ? championsOf(rows) : [];
  const meRow = rows.find((x) => x.user_id === map.my_id) ?? null;
  const iWon = champs.some((c) => c.user_id === map.my_id);
  const fmt = (n: number) => n.toLocaleString(appNumberLocale());
  const dateFmt = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString(locale === 'en' ? 'en' : 'es', { day: 'numeric', month: 'short' }) : '');

  // Celebración una sola vez por temporada ganada
  useEffect(() => {
    if (!final || !iWon) return;
    const k = `geospeed_conq_champion_seen_${sid}`;
    try { if (localStorage.getItem(k)) return; localStorage.setItem(k, '1'); } catch { /* sin almacenamiento */ }
    playVictory();
    fireCelebration();
    trackEvent('conq_champion_view', {});
  }, [final, iWon, sid]);

  const share = async () => {
    playButtonTap();
    const text = iWon ? t('cq_shareChampion', { n: meRow?.territories ?? 0 }) : t('cq_shareSeason', { rank: t('cq_rankN', { n: meRow?.rank ?? 0 }), n: meRow?.territories ?? 0 });
    const url = typeof window !== 'undefined' ? window.location.origin : 'https://geospeed-challenge.vercel.app';
    try {
      if ('share' in navigator) { await navigator.share({ text, url }); playShareSuccess(); trackEvent('conq_share_season', { method: 'native' }); return; }
    } catch { return; }
    window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`, '_blank', 'noopener');
    trackEvent('conq_share_season', { method: 'whatsapp' });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] items-start">
      <div className="min-w-0 flex flex-col gap-3">
        <Card className={final ? 'border-primary/70 shadow-[0_0_24px_hsl(var(--primary)/0.15)]' : ''}>
          <h2 className="font-black text-2xl sm:text-3xl leading-tight">
            {final ? t('cq_seasonDone', { n: map.season.number }) : t('cq_seasonLive', { n: map.season.number })}
          </h2>
          <p className="text-sm sm:text-base text-foreground/80">
            {final ? t('cq_seasonClosedOn', { date: dateFmt(st?.ends_at ?? map.season.ends_at) }) : t('cq_endsIn', { time: left(map.season.ends_at) })}
          </p>
          {final && (
            champs.length ? (
              <div className="mt-3 flex items-center gap-3 rounded-2xl border border-primary/50 bg-primary/10 px-3 py-3">
                <span className="text-5xl" aria-hidden>🏆</span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap gap-1.5 mb-1">{champs.map((c) => <ConqFace key={c.user_id} player={c} color={styles.get(c.user_id)?.color} />)}</span>
                  <span className="block font-black text-lg leading-tight">{champs.map((c) => (c.user_id === map.my_id ? t('cq_you') : c.name ?? t('cq_retired'))).join(' · ')}</span>
                  <span className="block text-sm text-primary font-bold">{t(champs.length > 1 ? 'cq_championsTie' : 'cq_championLine', { n: champs[0].territories })}</span>
                </span>
              </div>
            ) : <p className="mt-3 rounded-2xl border border-accent/30 bg-background/40 px-3 py-3 text-sm">{t('cq_noChampion')}</p>
          )}
        </Card>

        {/* Premio: insignia de campeón y título (sin vidas, compras ni XP) */}
        {iWon ? (
          <Card className="flex flex-wrap items-center gap-3 border-primary">
            <span className="text-4xl" aria-hidden>🎖️</span>
            <span className="min-w-0 flex-1 basis-48">
              <span className="block font-extrabold">{t('cq_rewardTitle')}</span>
              <span className="block text-sm text-foreground/85">{t('cq_rewardDesc')}</span>
            </span>
            {onOpenTitles && <button onClick={() => { playButtonTap(); onOpenTitles(); }} className="w-full sm:w-auto shrink-0 rounded-xl border-2 border-primary px-3 py-2 font-black text-sm text-primary hover:bg-primary/10">{t('cq_useTitle')}</button>}
          </Card>
        ) : !final && (
          <p className="rounded-2xl border border-accent/30 bg-card/70 px-3 py-2.5 text-sm">🎖️ {t('cq_prizeLive')}</p>
        )}

        {final && (
          <div className="flex flex-col gap-2">
            <CtaButton onClick={() => { playButtonTap(); onOpenGroup(); }}>{t('cq_nextSeason')}</CtaButton>
            {meRow && <button onClick={() => void share()} className="w-full rounded-2xl py-3 border-2 border-accent text-accent font-black hover:bg-accent/10">📤 {t('cq_shareSeasonCta')}</button>}
            <p className="text-center text-xs text-muted-foreground">{t('cq_mapResets')}</p>
          </div>
        )}
      </div>

      <div className="min-w-0 flex flex-col gap-3">
        {err && <ErrorBox text={errText(err)} />}
        <Card className="!p-3 sm:!p-4">
          <h2 className="font-extrabold text-base sm:text-lg">{final ? t('cq_standingsFinal') : t('cq_standingsLive')}</h2>
          <p className="text-xs text-muted-foreground mb-2">{t('cq_standingsRule')}</p>
          <div className="grid grid-cols-[2rem_minmax(0,1fr)_3.5rem_4.5rem] gap-x-2 px-2 pb-1 text-[11px] font-bold text-muted-foreground uppercase">
            <span>#</span><span>{t('cq_colPlayer')}</span><span className="text-right">🚩</span><span className="text-right">{t('cq_colMarks')}</span>
          </div>
          <ol className="flex flex-col gap-1.5">
            {rows.map((x) => {
              const p = styles.get(x.user_id);
              return (
                <li key={x.user_id} className={`grid grid-cols-[2rem_minmax(0,1fr)_3.5rem_4.5rem] gap-x-2 items-center rounded-xl px-2 py-1.5 text-sm ${p?.me ? 'bg-primary/15 border border-primary/50' : 'bg-background/40'}`}>
                  <span className={`text-center font-black ${x.rank === 1 ? 'text-primary' : 'text-muted-foreground'}`}>{x.rank}</span>
                  <span className="min-w-0 flex items-center gap-2">
                    <ConqFace player={{ avatar: x.avatar, slot: x.slot }} color={p?.color} />
                    <span className="truncate font-semibold">{x.name ?? t('cq_retired')}{p?.me ? ` · ${t('cq_you')}` : ''}</span>
                  </span>
                  <span className="text-right font-black">{x.territories}</span>
                  <span className="text-right text-xs text-muted-foreground tabular-nums">{fmt(x.defense_sum)}</span>
                </li>
              );
            })}
          </ol>
        </Card>
        {!!st?.history.filter((h) => h.season_id !== sid).length && (
          <Card className="!p-3 sm:!p-4">
            <h2 className="font-extrabold text-base mb-2">{t('cq_historyTitle')}</h2>
            <ul className="flex flex-col gap-1 text-sm">
              {st.history.filter((h) => h.season_id !== sid).map((h) => (
                <li key={h.season_id} className="flex items-center justify-between gap-2 rounded-xl bg-background/40 px-3 py-1.5">
                  <span className="font-bold">{t('cq_historyRow', { n: h.number, date: dateFmt(h.closed_at) })}</span>
                  <span className="truncate text-foreground/85">{h.champions.filter(Boolean).length ? `🏆 ${h.champions.filter(Boolean).join(', ')}` : t('cq_historyNone')}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}

function ActiveBanner({ attemptId, onResume }: { attemptId: string; onResume: (id: string) => void }) {
  const { t, locale } = useI18n();
  const local = activeMission();
  const where = local?.attemptId === attemptId ? conqCountryName(local.iso, locale) : null;
  return (
    <div className="rounded-2xl border-2 border-primary bg-primary/10 px-3 py-2.5 flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-center sm:text-left" role="status">
      <span className="text-2xl" aria-hidden>⚔️</span>
      <p className="min-w-0 flex-1 font-bold">{where ? t('cq_activeBannerIn', { country: where }) : t('cq_activeBanner')}</p>
      <button onClick={() => { playButtonTap(); onResume(attemptId); }} className="btn3d shrink-0 rounded-xl px-4 py-2 font-black text-primary-foreground" style={{ background: 'var(--grad-cta)' }}>{t('cq_continueMission')}</button>
    </div>
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

// ═══════════════════════════════════════ P2 Ficha del territorio ═══════════════════════════════════════
interface TerritorySheetProps {
  map: ConqMap;
  iso: string;
  styles: Map<string, PlayerStyle>;
  onBack: () => void;
  onPractice: (iso: string, target: PracticeTarget) => void;
  onStart: (iso: string) => void;
  onResume: (attemptId: string) => void;
}

function TerritorySheet({ map, iso, styles, onBack, onPractice, onStart, onResume }: TerritorySheetProps) {
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
  // Mi misión en curso (aquí o en otro país): el botón la retoma en vez de iniciar otra
  const resumeId = me?.active_attempt && (reason === 'attempt_active' || reason === 'reserved') ? me.active_attempt : null;
  const start = () => {
    playButtonTap();
    if (resumeId) { onResume(resumeId); return; }
    if (!window.confirm(t('cq_startConfirm2', { country: name, n: me?.missions_left ?? 0, total: me?.missions_per_day ?? 5 }))) return;
    onStart(iso);
  };

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
          {reason && !resumeId && (
            <p className="rounded-2xl border border-primary/50 bg-primary/10 px-3 py-2.5 text-sm sm:text-base text-center font-semibold" role="status">{why(reason)}</p>
          )}
          {resumeId && <p className="rounded-2xl border border-primary/50 bg-primary/10 px-3 py-2.5 text-sm sm:text-base text-center font-semibold" role="status">{t('cq_activeBanner')}</p>}
          <p className="text-xs sm:text-sm text-muted-foreground text-center">{t('cq_practiceNote')}</p>
        </div>
      </div>

      {/* Barra fija: comenzar (o por qué no) y practicar */}
      <div className="sticky bottom-0 z-10 -mx-3 sm:-mx-4 md:-mx-6 px-3 sm:px-4 md:px-6 pt-3 flex flex-col items-center gap-1.5 bg-gradient-to-t from-background via-background/95 to-transparent"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 12px)' }}>
        {kind !== 'own' && (
          <div className="w-full max-w-xl">
            <CtaButton onClick={start} disabled={!detail?.can_start && !resumeId}>⚔️ {resumeId ? t('cq_continueMission') : ctaLabel}</CtaButton>
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

