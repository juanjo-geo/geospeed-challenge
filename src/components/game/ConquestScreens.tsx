import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useI18n } from '@/i18n';
import { playButtonTap, playShareSuccess } from '@/lib/sounds';
import { trackEvent } from '@/lib/analytics';
import {
  CONQ_MAX_PLAYERS, CONQ_MIN_PLAYERS, CONQ_NAME_MIN, CONQ_NAME_MAX, CONQ_RULES_V1, ConqError, acceptInvite, cancelGroup, cleanGroupName,
  conqServerNow, conquestLink, conquestMockEnabled, createGroup, fetchMyGroups, formatTimeLeft, isConqCode, leaveGroup, normalizeConqCode,
  previewInvite, regenerateInvite, removeMember, setMuted, setParticipation, startSeason, useConqGroup,
  type ConqErrorCode, type ConqGroup, type ConqGroupSummary, type ConqMember, type ConqPreview,
} from '@/lib/conquest';
import { appNumberLocale } from '@/lib/format';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { HomeIcon } from '@/components/ui/icons';
import Mascot from './Mascot';
import { PlayerFace } from './RoomParts';

/**
 * Conquista el mapa — fase C3 (docs/GeoSpeed_Conquista_Plan.md): A1 Crear o unirse (con la lista de mis grupos),
 * la invitación por enlace o código y A2 Sala de espera. Las reglas son las aprobadas (especificación v1.1); el servidor
 * hace cumplir todo (cupos, plantilla congelada, quién inicia).
 */

function useErrText() {
  const { t } = useI18n();
  return useCallback((code: ConqErrorCode | null | undefined) => (code ? t(`cq_err_${code}` as never) : ''), [t]);
}
const errCode = (e: unknown): ConqErrorCode => (e instanceof ConqError ? e.code : 'network');

function Page({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center game-bg px-3 pt-4 sm:px-4 sm:pt-6 md:px-6">
      <div className={`w-full ${wide ? 'max-w-5xl' : 'max-w-3xl'} animate-fade-in-up flex flex-col gap-4 pb-6`} style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 8px)' }}>
        {children}
      </div>
    </div>
  );
}
const Card = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <section className={`rounded-3xl border-2 border-accent/50 bg-card/80 p-4 sm:p-5 ${className}`}>{children}</section>
);
const ErrorBox = ({ text }: { text: string }) => (text ? <p className="rounded-xl border border-destructive/50 bg-destructive/10 p-2.5 text-sm text-center" role="alert">{text}</p> : null);
const CtaButton = ({ children, onClick, disabled = false, type = 'button' }: { children: ReactNode; onClick?: () => void; disabled?: boolean; type?: 'button' | 'submit' }) => (
  <button type={type} onClick={onClick} disabled={disabled} className="btn3d w-full rounded-2xl py-3.5 short:py-2.5 font-black text-lg text-primary-foreground disabled:opacity-50" style={{ background: 'var(--grad-cta)' }}>
    {children}
  </button>
);

/** Las reglas aprobadas, en cinco líneas (se muestran antes de iniciar) */
function RulesCard() {
  const { t } = useI18n();
  const r = CONQ_RULES_V1;
  const rows: [string, string][] = [
    ['👥', t('cq_rule1', { min: CONQ_MIN_PLAYERS, max: CONQ_MAX_PLAYERS, days: r.season_days })],
    ['🗺️', t('cq_rule2', { rounds: r.rounds, seconds: r.seconds })],
    ['🚩', t('cq_rule3', { threshold: r.threshold.toLocaleString(appNumberLocale()) })],
    ['⚔️', t('cq_rule4', { missions: r.daily_missions, perCountry: r.per_country_daily })],
    ['⚖️', t('cq_rule5')],
  ];
  return (
    <Card>
      <h2 className="font-extrabold text-lg mb-2">{t('cq_howTitle')}</h2>
      <ul className="flex flex-col gap-2">
        {rows.map(([icon, text]) => (
          <li key={icon} className="flex items-start gap-2.5 text-sm sm:text-base"><span aria-hidden className="text-lg leading-6">{icon}</span><span>{text}</span></li>
        ))}
      </ul>
    </Card>
  );
}

function AccountGate({ onSignIn }: { onSignIn: () => void }) {
  const { t } = useI18n();
  return (
    <Card className="text-center flex flex-col items-center gap-3">
      <Mascot state="wink" className="w-20" />
      <p className="font-extrabold text-lg sm:text-xl">{t('cq_accountTitle')}</p>
      <p className="text-sm sm:text-base text-foreground/80 max-w-md">{t('cq_accountDesc')}</p>
      <button onClick={() => { playButtonTap(); onSignIn(); }} className="btn3d rounded-2xl px-6 py-3 font-black text-primary-foreground" style={{ background: 'var(--grad-cta)' }}>
        {t('cq_accountCta')}
      </button>
    </Card>
  );
}

// ═══════════════════════════════════════ A1 · Crear o unirse ═══════════════════════════════════════
interface ConquestHomeScreenProps {
  isRegistered: boolean;
  onBack: () => void;
  onSignIn: () => void;
  onOpenGroup: (id: string) => void;
  onOpenCode: (code: string) => void;
}

export function ConquestHomeScreen({ isRegistered, onBack, onSignIn, onOpenGroup, onOpenCode }: ConquestHomeScreenProps) {
  const { t } = useI18n();
  const errText = useErrText();
  const canPlay = isRegistered || conquestMockEnabled();
  const [groups, setGroups] = useState<ConqGroupSummary[] | null>(null);
  const [listError, setListError] = useState<ConqErrorCode | null>(null);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<ConqErrorCode | null>(null);
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const [code, setCode] = useState('');

  useEffect(() => {
    if (!canPlay) return;
    let alive = true;
    fetchMyGroups().then((g) => { if (alive) setGroups(g); }).catch((e) => { if (alive) setListError(errCode(e)); });
    return () => { alive = false; };
  }, [canPlay]);

  const create = async () => {
    const n = name.trim();
    if (creating || n.length < CONQ_NAME_MIN) return;
    playButtonTap();
    setCreating(true);
    setCreateError(null);
    try {
      const g = await createGroup(n, requestId);
      setRequestId(crypto.randomUUID());
      trackEvent('conq_group_create', {});
      onOpenGroup(g.id);
    } catch (e) {
      setCreateError(errCode(e));
    } finally {
      setCreating(false);
    }
  };
  const normalized = normalizeConqCode(code);

  return (
    <Page wide>
      <ScreenHeader onBack={onBack} title={t('cq_title')} subtitle={t('cq_subtitle')} />
      {!canPlay ? (
        <div className="grid gap-4 md:grid-cols-2 items-start">
          <AccountGate onSignIn={onSignIn} />
          <RulesCard />
        </div>
      ) : (
        <>
          {/* Mis grupos */}
          <Card>
            <h2 className="font-extrabold text-lg mb-2">{t('cq_myGroups')}</h2>
            {listError ? <ErrorBox text={errText(listError)} />
              : !groups ? <p className="text-muted-foreground text-sm py-2">{t('loading')}</p>
              : groups.length === 0 ? <p className="text-foreground/80 text-sm sm:text-base py-1">{t('cq_noGroups')}</p>
              : (
                <ul className="flex flex-col gap-2">
                  {groups.map((g) => <GroupRow key={g.id} g={g} onOpen={() => { playButtonTap(); onOpenGroup(g.id); }} />)}
                </ul>
              )}
          </Card>

          <div className="grid gap-4 md:grid-cols-2 items-stretch">
            <Card className="flex flex-col gap-3">
              <div>
                <h2 className="font-extrabold text-lg">{t('cq_createTitle')}</h2>
                <p className="text-sm text-foreground/80">{t('cq_createDesc', { max: CONQ_MAX_PLAYERS - 1 })}</p>
              </div>
              <form className="flex flex-col gap-2.5 mt-auto" onSubmit={(e) => { e.preventDefault(); void create(); }}>
                <label className="sr-only" htmlFor="cq-name">{t('cq_namePlaceholder')}</label>
                <input id="cq-name" value={name} onChange={(e) => setName(cleanGroupName(e.target.value))} placeholder={t('cq_namePlaceholder')} maxLength={CONQ_NAME_MAX}
                  autoComplete="off" className="w-full rounded-2xl border-2 border-foreground/20 bg-background/50 px-4 py-3 font-bold text-lg focus:outline-none focus:ring-2 focus:ring-accent" />
                <ErrorBox text={errText(createError)} />
                <CtaButton type="submit" disabled={creating || name.trim().length < CONQ_NAME_MIN}>{creating ? '⏳' : '🚩'} {t('cq_create')}</CtaButton>
              </form>
            </Card>
            <Card className="flex flex-col gap-3">
              <div>
                <h2 className="font-extrabold text-lg">{t('cq_joinTitle')}</h2>
                <p className="text-sm text-foreground/80">{t('cq_joinDesc')}</p>
              </div>
              <form className="flex flex-col gap-2.5 mt-auto" onSubmit={(e) => { e.preventDefault(); if (isConqCode(normalized)) { playButtonTap(); onOpenCode(normalized); } }}>
                <label className="sr-only" htmlFor="cq-code">{t('cq_codePlaceholder')}</label>
                <input id="cq-code" value={code} onChange={(e) => setCode(normalizeConqCode(e.target.value))} placeholder={t('cq_codePlaceholder')} maxLength={6}
                  autoCapitalize="characters" autoComplete="off" spellCheck={false}
                  className="w-full rounded-2xl border-2 border-foreground/20 bg-background/50 px-4 py-3 font-extrabold text-lg tracking-[0.35em] uppercase placeholder:tracking-normal placeholder:normal-case placeholder:font-medium placeholder:text-base focus:outline-none focus:ring-2 focus:ring-accent" />
                <button type="submit" disabled={!isConqCode(normalized)} className="w-full rounded-2xl py-3.5 short:py-2.5 border-2 border-accent text-accent font-black text-lg hover:bg-accent/10 transition-colors disabled:opacity-45">
                  {t('cq_seeInvite')}
                </button>
              </form>
            </Card>
          </div>
          <RulesCard />
        </>
      )}
    </Page>
  );
}

function GroupRow({ g, onOpen }: { g: ConqGroupSummary; onOpen: () => void }) {
  const { t } = useI18n();
  const s = g.season;
  const status = !s ? '' : s.status === 'active'
    ? t('cq_groupActive', { n: s.number, time: formatTimeLeft((s.ends_at ? Date.parse(s.ends_at) : 0) - conqServerNow()) })
    : t('cq_groupLobby', { n: s.number });
  return (
    <li>
      <button onClick={onOpen} className="w-full flex items-center gap-3 rounded-2xl border border-accent/30 bg-background/40 px-3 py-2.5 text-left hover:bg-accent/10 transition-colors">
        <span className="text-2xl" aria-hidden>{s?.status === 'active' ? '⚔️' : '⏳'}</span>
        <span className="min-w-0 flex-1">
          <span className="block font-bold truncate">{g.name}</span>
          <span className="block text-xs sm:text-sm text-muted-foreground truncate">
            {status} · {t('cq_membersN', { n: g.members_count, max: CONQ_MAX_PLAYERS })}
            {g.me && s?.status === 'active' ? ` · ${t('cq_myStanding', { n: g.me.territories, rank: g.me.rank })}` : ''}
          </span>
        </span>
        {g.unread > 0 && <span className="shrink-0 rounded-full bg-primary text-primary-foreground text-xs font-black px-2 py-0.5">{g.unread}</span>}
        <span aria-hidden className="text-xl text-foreground/70">›</span>
      </button>
    </li>
  );
}

// ═══════════════════════════════════════ Invitación (enlace o código) ═══════════════════════════════════════
interface ConquestInviteScreenProps {
  code: string;
  isRegistered: boolean;
  onBack: () => void;
  onSignIn: () => void;
  onJoined: (groupId: string) => void;
}

export function ConquestInviteScreen({ code, isRegistered, onBack, onSignIn, onJoined }: ConquestInviteScreenProps) {
  const { t } = useI18n();
  const errText = useErrText();
  const canPlay = isRegistered || conquestMockEnabled();
  const [preview, setPreview] = useState<ConqPreview | null>(null);
  const [loadError, setLoadError] = useState<ConqErrorCode | null>(null);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<ConqErrorCode | null>(null);

  useEffect(() => {
    let alive = true;
    previewInvite(code).then((p) => { if (alive) setPreview(p); }).catch((e) => { if (alive) setLoadError(errCode(e)); });
    return () => { alive = false; };
  }, [code]);

  // Aceptar requiere una acción explícita: abrir el enlace no inscribe a nadie
  const join = async () => {
    if (joining) return;
    playButtonTap();
    setJoining(true);
    setError(null);
    try {
      const g = await acceptInvite(code);
      trackEvent('conq_join', { members: g.members.length });
      onJoined(g.id);
    } catch (e) {
      setError(errCode(e));
    } finally {
      setJoining(false);
    }
  };

  return (
    <Page>
      <ScreenHeader onBack={onBack} title={t('cq_inviteTitle')} subtitle={t('cq_inviteCode', { code })} />
      <Card className="flex flex-col items-center gap-3 text-center">
        {loadError ? (
          <><Mascot state="sad" className="w-20" /><p className="font-extrabold text-lg">{errText(loadError)}</p><BackHome onClick={onBack} /></>
        ) : !preview ? (
          <p className="py-8 text-muted-foreground">{t('loading')}</p>
        ) : (
          <>
            <Mascot state={preview.state === 'open' || preview.state === 'member' ? 'celebrate' : 'wink'} className="w-20" />
            <p className="font-extrabold text-lg sm:text-xl">{preview.admin_name ? t('cq_inviteFrom', { name: preview.admin_name, group: preview.name }) : `«${preview.name}»`}</p>
            <p className="text-sm text-muted-foreground">{t('cq_membersN', { n: preview.members_count, max: preview.max_players })}</p>
            {preview.state === 'member' && preview.group_id ? (
              <CtaButton onClick={() => { playButtonTap(); onJoined(preview.group_id!); }}>{t('cq_inviteOpen')}</CtaButton>
            ) : preview.state === 'full' ? (
              <p className="font-bold">{t('cq_err_group_full')}</p>
            ) : preview.state === 'season_active' ? (
              <p className="font-bold">{t('cq_err_season_active')}</p>
            ) : !canPlay ? (
              <AccountGate onSignIn={onSignIn} />
            ) : (
              <>
                <ErrorBox text={errText(error)} />
                <CtaButton onClick={() => void join()} disabled={joining}>{joining ? '⏳' : '🚪'} {t('cq_inviteJoin')}</CtaButton>
              </>
            )}
          </>
        )}
      </Card>
      <RulesCard />
    </Page>
  );
}

// ═══════════════════════════════════════ A2 · Sala de espera ═══════════════════════════════════════
interface ConquestLobbyScreenProps {
  groupId: string;
  onBack: () => void;
  /** Temporada en curso: abrir el tablero (fase C4) */
  onOpenMap: (seasonId: string) => void;
}

export function ConquestLobbyScreen({ groupId, onBack, onOpenMap }: ConquestLobbyScreenProps) {
  const { t } = useI18n();
  const errText = useErrText();
  const { group, setGroup, error } = useConqGroup(groupId);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<ConqErrorCode | null>(null);
  const [copied, setCopied] = useState(false);

  const run = async (fn: () => Promise<ConqGroup | void>, after?: () => void) => {
    if (busy) return;
    setBusy(true);
    setActionError(null);
    try {
      const g = await fn();
      if (g) setGroup(g);
      after?.();
    } catch (e) {
      setActionError(errCode(e));
    } finally {
      setBusy(false);
    }
  };

  if (!group) {
    return (
      <Page>
        <ScreenHeader onBack={onBack} title={t('cq_title')} />
        <Card className="flex flex-col items-center gap-3 text-center">
          {error ? <><Mascot state="sad" className="w-20" /><p className="font-extrabold text-lg">{errText(error.code)}</p><BackHome onClick={onBack} /></>
            : <p className="py-8 text-muted-foreground">{t('loading')}</p>}
        </Card>
      </Page>
    );
  }

  const season = group.season;
  const admin = group.members.find((m) => m.role === 'admin') ?? null;
  const confirmed = group.members.filter((m) => m.confirmed).length;
  const me = group.members.find((m) => m.me) ?? null;
  const active = season?.status === 'active';

  if (group.status === 'archived') {
    return (
      <Page>
        <ScreenHeader onBack={onBack} title={group.name} />
        <Card className="flex flex-col items-center gap-3 text-center"><Mascot state="sad" className="w-20" /><p className="font-extrabold text-lg">{t('cq_archived')}</p><BackHome onClick={onBack} /></Card>
      </Page>
    );
  }

  const link = group.invite_code ? conquestLink(group.invite_code) : '';
  const shareText = t('cq_shareText', { group: group.name, link });
  const copy = async () => {
    playButtonTap();
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* sin portapapeles */ }
  };
  const nativeShare = async () => {
    playButtonTap();
    try { await navigator.share({ title: group.name, text: shareText, url: link }); playShareSuccess(); trackEvent('conq_share', { method: 'native' }); } catch { /* cancelado */ }
  };

  const start = () => {
    playButtonTap();
    if (!window.confirm(t('cq_startConfirm', { n: season?.number ?? 1, days: CONQ_RULES_V1.season_days }))) return;
    void run(() => startSeason(group.id), () => trackEvent('conq_season_start', { players: confirmed }));
  };
  const leave = () => {
    playButtonTap();
    if (!window.confirm(t('cq_leaveConfirm', { group: group.name }))) return;
    void run(() => leaveGroup(group.id), onBack);
  };
  const cancel = () => {
    playButtonTap();
    if (!window.confirm(t('cq_cancelConfirm', { group: group.name }))) return;
    void run(() => cancelGroup(group.id), onBack);
  };
  const remove = (m: ConqMember) => {
    playButtonTap();
    if (!window.confirm(t('cq_removeConfirm', { name: m.name ?? t('cq_retired') }))) return;
    void run(() => removeMember(group.id, m.user_id));
  };
  const regenerate = () => {
    playButtonTap();
    if (!window.confirm(t('cq_regenerateConfirm'))) return;
    void run(() => regenerateInvite(group.id));
  };

  const endsIn = active && season?.ends_at ? formatTimeLeft(Date.parse(season.ends_at) - conqServerNow()) : '';
  return (
    <Page wide>
      <ScreenHeader onBack={onBack} title={group.name} subtitle={season ? (active ? t('cq_seasonActive', { n: season.number }) : t('cq_lobbyTitle', { n: season.number })) : ''} />

      {active && season && (
        <Card className="flex flex-col sm:flex-row items-center gap-3 sm:gap-5 border-primary/60 shadow-[0_0_24px_hsl(var(--primary)/0.15)]">
          <span className="text-5xl" aria-hidden>⚔️</span>
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="font-extrabold text-xl">{t('cq_seasonActive', { n: season.number })}</p>
            <p className="text-sm sm:text-base text-foreground/80">{t('cq_endsIn', { time: endsIn })}{season.in_roster ? '' : ` · ${t('cq_notInRoster')}`}</p>
          </div>
          <div className="w-full sm:w-auto"><CtaButton onClick={() => { playButtonTap(); onOpenMap(season.id); }}>🗺️ {t('cq_openMap')}</CtaButton></div>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] items-start">
        {/* Participantes (hasta 5) */}
        <Card>
          <p className="flex items-center justify-between mb-2">
            <span className="font-extrabold text-lg">{t('cq_members')}</span>
            <span className="rounded-full border border-accent/50 px-3 py-0.5 text-sm font-bold text-accent">{group.members.length}/{CONQ_MAX_PLAYERS}</span>
          </p>
          <ul className="flex flex-col gap-2" aria-live="polite">
            {group.members.map((m, i) => (
              <li key={m.user_id} className={`flex items-center gap-3 rounded-2xl border px-3 py-2 ${m.me ? 'border-primary bg-primary/10' : 'border-accent/30 bg-background/40'}`}>
                <PlayerFace player={{ avatar: m.avatar, slot: i }} />
                <span className="min-w-0 flex-1">
                  <span className="block font-bold truncate">{m.name ?? t('cq_retired')}{m.me ? ` · ${t('cq_you')}` : ''}</span>
                  <span className="block text-xs text-muted-foreground">
                    {m.role === 'admin' ? `👑 ${t('cq_admin')}` : ''}{m.role === 'admin' && !active ? ' · ' : ''}
                    {!active && (m.confirmed ? `✓ ${t('cq_confirmed')}` : t('cq_pending'))}
                  </span>
                </span>
                {group.is_admin && !active && !m.me && (
                  <button onClick={() => remove(m)} className="shrink-0 w-8 h-8 rounded-full border border-destructive/60 text-destructive font-black hover:bg-destructive/10" aria-label={t('cq_remove', { name: m.name ?? '' })}>×</button>
                )}
              </li>
            ))}
            {!active && Array.from({ length: CONQ_MAX_PLAYERS - group.members.length }).map((_, i) => (
              <li key={`e${i}`} className="rounded-2xl border border-dashed border-accent/25 px-3 py-3 text-sm text-muted-foreground text-center">{t('cq_emptySlot')}</li>
            ))}
          </ul>
          {group.last_closed && (
            <p className="mt-3 text-sm text-center text-foreground/80">🏆 {group.last_closed.champions.filter(Boolean).length
              ? t('cq_lastChampion', { n: group.last_closed.number, names: group.last_closed.champions.filter(Boolean).join(', ') })
              : t('cq_lastNoChampion', { n: group.last_closed.number })}</p>
          )}
        </Card>

        <div className="flex flex-col gap-4">
          {/* Invitar: solo el administrador ve el código */}
          {!active && group.is_admin && group.invite_code && (
            <Card className="flex flex-col items-center gap-2.5 text-center border-primary/60">
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{t('cq_inviteCodeLabel')}</p>
              <p className="font-black text-4xl sm:text-5xl tracking-[0.18em] text-primary">{group.invite_code}</p>
              <p className="text-xs text-muted-foreground break-all">{link.replace(/^https?:\/\//, '')}</p>
              <div className="grid grid-cols-3 gap-2 w-full">
                <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer" onClick={() => { playButtonTap(); trackEvent('conq_share', { method: 'whatsapp' }); }}
                  className="rounded-2xl border-2 border-accent/50 py-2.5 font-bold text-sm hover:bg-accent/10 flex flex-col items-center gap-0.5"><span aria-hidden className="text-xl">💬</span>WhatsApp</a>
                <button onClick={copy} className="rounded-2xl border-2 border-accent/50 py-2.5 font-bold text-sm hover:bg-accent/10 flex flex-col items-center gap-0.5">
                  <span aria-hidden className="text-xl">{copied ? '✅' : '🔗'}</span>{copied ? t('cq_copied') : t('cq_copy')}
                </button>
                {typeof navigator !== 'undefined' && 'share' in navigator ? (
                  <button onClick={nativeShare} className="rounded-2xl border-2 border-accent/50 py-2.5 font-bold text-sm hover:bg-accent/10 flex flex-col items-center gap-0.5"><span aria-hidden className="text-xl">📤</span>{t('cq_share')}</button>
                ) : <span />}
              </div>
              <button onClick={regenerate} disabled={busy} className="text-xs text-muted-foreground underline hover:text-foreground">{t('cq_regenerate')}</button>
            </Card>
          )}
          {/* Participar en la próxima temporada (quien entró ya quedó confirmado; aquí puede cambiarlo) */}
          {!active && me && !group.is_admin && (
            <Card>
              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <span className="min-w-0">
                  <span className="block font-bold">{t('cq_participate', { n: season?.number ?? 1 })}</span>
                  <span className="block text-xs sm:text-sm text-muted-foreground">{me.confirmed ? t('cq_participateOn') : t('cq_participateOff')}</span>
                </span>
                <input type="checkbox" className="sr-only peer" checked={me.confirmed} disabled={busy} onChange={(e) => { playButtonTap(); void run(() => setParticipation(group.id, e.target.checked)); }} />
                <span className="relative shrink-0 w-14 h-8 rounded-full bg-muted peer-checked:bg-accent transition-colors after:absolute after:top-1 after:left-1 after:w-6 after:h-6 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-6" aria-hidden />
              </label>
            </Card>
          )}
          {active && me && (
            <Card>
              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <span className="min-w-0">
                  <span className="block font-bold">{t('cq_mute')}</span>
                  <span className="block text-xs sm:text-sm text-muted-foreground">{t('cq_muteDesc')}</span>
                </span>
                <input type="checkbox" className="sr-only peer" checked={!!group.muted} disabled={busy} onChange={(e) => { playButtonTap(); void run(() => setMuted(group.id, e.target.checked)); }} />
                <span className="relative shrink-0 w-14 h-8 rounded-full bg-muted peer-checked:bg-accent transition-colors after:absolute after:top-1 after:left-1 after:w-6 after:h-6 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-6" aria-hidden />
              </label>
            </Card>
          )}
          <RulesCard />
          {!active && (
            <div className="flex flex-col items-center gap-1.5">
              {group.is_admin
                ? <button onClick={cancel} disabled={busy} className="text-sm text-muted-foreground underline hover:text-foreground">{t('cq_cancel')}</button>
                : <button onClick={leave} disabled={busy} className="text-sm text-muted-foreground underline hover:text-foreground">{t('cq_leave')}</button>}
            </div>
          )}
        </div>
      </div>

      <ErrorBox text={errText(actionError)} />

      {/* Barra fija abajo (como la sala en vivo): iniciar o esperar al administrador */}
      {!active && (
        <div className="sticky bottom-0 z-10 -mx-3 sm:-mx-4 md:-mx-6 pl-3 sm:pl-4 md:px-6 pr-[60px] pt-3 flex flex-col items-center gap-1.5 text-center bg-gradient-to-t from-background via-background/95 to-transparent"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 12px)' }}>
          {group.is_admin ? (
            <>
              <div className="w-full max-w-xl"><CtaButton onClick={start} disabled={busy || confirmed < CONQ_MIN_PLAYERS}>{busy ? '⏳' : '⚔️'} {t('cq_start', { n: season?.number ?? 1 })}</CtaButton></div>
              <p className="text-sm text-muted-foreground">{confirmed < CONQ_MIN_PLAYERS ? t('cq_err_not_enough_players') : t('cq_startHint', { n: confirmed, days: CONQ_RULES_V1.season_days })}</p>
            </>
          ) : (
            <p className="font-bold text-lg animate-pulse">⏳ {t('cq_waitingAdmin', { name: admin?.name ?? t('cq_admin') })}</p>
          )}
        </div>
      )}
    </Page>
  );
}

function BackHome({ onClick }: { onClick: () => void }) {
  const { t } = useI18n();
  return (
    <button onClick={() => { playButtonTap(); onClick(); }} className="mt-1 inline-flex items-center gap-2 rounded-2xl border-2 border-foreground/30 px-5 py-2.5 font-bold hover:bg-muted/50">
      <HomeIcon className="w-5 h-5" /> {t('cq_back')}
    </button>
  );
}
