import { useState, useMemo } from 'react';
import {
  BATTLE_PASS_LEVELS,
  ALL_COSMETICS,
  getBattlePassState,
  getBattlePassLevel,
  getCosmeticState,
  getCosmeticById,
  claimPremiumReward,
  equipCosmetic,
  getEquipped,
  isUnlocked,
  RARITY_COLORS,
  RARITY_LABELS,
  type Cosmetic,
  type CosmeticCategory,
} from '@/lib/cosmetics';
import { getProStatus } from '@/lib/premiumSystem';
import { playButtonTap, playLevelUp, playShareSuccess } from '@/lib/sounds';
import { useI18n } from '@/i18n';
import { tCategory, tRarity, tCosmeticName, tCosmeticDesc } from '@/lib/gameI18n';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { appNumberLocale } from '@/lib/format';

interface BattlePassScreenProps {
  onClose: () => void;
  onOpenStore?: () => void;
}

const CATEGORY_LABELS: Record<CosmeticCategory, string> = {
  pin: '📍 Pins',
  trail: '〰️ Estelas',
  frame: '🖼️ Marcos',
  mapTheme: '🗺️ Mapas',
};

export default function BattlePassScreen({ onClose, onOpenStore }: BattlePassScreenProps) {
  const { t: tr, locale } = useI18n();
  const [tab, setTab] = useState<'pass' | 'collection'>('pass');
  const [selectedCategory, setSelectedCategory] = useState<CosmeticCategory>('pin');
  const [, setRefresh] = useState(0);
  const forceRefresh = () => setRefresh(n => n + 1);

  const bp = getBattlePassState();
  const bpLevel = getBattlePassLevel(bp);
  const isPro = getProStatus().isPro;
  const cosmeticState = getCosmeticState();

  const categoryCosmetics = useMemo(() => {
    return ALL_COSMETICS.filter(c => c.category === selectedCategory);
  }, [selectedCategory]);

  const handleClaimPremium = (level: number) => {
    playLevelUp();
    claimPremiumReward(level);
    forceRefresh();
  };

  const handleEquip = (id: string) => {
    playButtonTap();
    equipCosmetic(id);
    forceRefresh();
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center game-bg overflow-y-auto px-3 py-4 sm:px-4 sm:py-6 md:px-6">
     <div className="w-full max-w-3xl animate-fade-in-up" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 8px)' }}>
      <ScreenHeader onBack={onClose} title={tr('bp_title')} subtitle={tr('bp_subtitle')} />

      {/* Pestañas */}
      <div className="flex gap-1 p-1 rounded-2xl border border-border bg-card/60">
        {(['pass', 'collection'] as const).map(t => (
          <button
            key={t}
            onClick={() => { playButtonTap(); setTab(t); }}
            className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-black transition-all ${
              tab === t
                ? 'bg-accent/15 text-accent border border-accent/50'
                : 'text-muted-foreground border border-transparent hover:text-foreground'
            }`}
          >
            {t === 'pass' ? tr('bp_tabPass') : tr('bp_tabCollection')}
          </button>
        ))}
      </div>

      {tab === 'pass' ? (
        <div className="py-3 space-y-3">
          {/* Progreso */}
          <div className="bg-card/70 rounded-2xl p-3 sm:p-4 border border-border">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-bold text-foreground">{tr('bp_level')} {bpLevel.level}</span>
              <span className="text-xs text-muted-foreground">
                {bpLevel.xpForNext > 0
                  ? `${bpLevel.xpInLevel.toLocaleString(appNumberLocale())} / ${bpLevel.xpForNext.toLocaleString(appNumberLocale())} XP`
                  : tr('bp_max')}
              </span>
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: bpLevel.xpForNext > 0 ? `${(bpLevel.xpInLevel / bpLevel.xpForNext) * 100}%` : '100%',
                  background: 'linear-gradient(90deg, hsl(var(--accent)), hsl(var(--primary)))',
                }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {tr('bp_season')} {bp.seasonId} · {tr('bp_totalXp')}: {bpLevel.totalXP.toLocaleString(appNumberLocale())}
            </p>
          </div>

          {/* Level rewards */}
          <div className="space-y-2">
            {BATTLE_PASS_LEVELS.map(lvl => {
              const reached = bpLevel.level >= lvl.level;
              const freeCosmetic = lvl.freeReward ? getCosmeticById(lvl.freeReward) : null;
              const premCosmetic = lvl.premiumReward ? getCosmeticById(lvl.premiumReward) : null;
              const freeClaimed = bp.claimedFree.includes(lvl.level);
              const premClaimed = bp.claimedPremium.includes(lvl.level);

              return (
                <div
                  key={lvl.level}
                  className={`flex items-center gap-2 p-2.5 sm:p-3 rounded-2xl border transition-all ${
                    reached
                      ? 'bg-card/80 border-primary/40'
                      : 'bg-card/40 border-border/40 opacity-60'
                  }`}
                >
                  {/* Level number */}
                  <div
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-xs sm:text-sm font-black shrink-0"
                    style={{
                      background: reached ? 'var(--grad-cta)' : 'hsl(var(--muted))',
                      color: reached ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
                    }}
                  >
                    {lvl.level}
                  </div>

                  {/* Free reward */}
                  <div className="flex-1 min-w-0">
                    {freeCosmetic ? (
                      <RewardPill
                        cosmetic={freeCosmetic}
                        reached={reached}
                        claimed={freeClaimed || isUnlocked(freeCosmetic.id)}
                        label={tr('bp_free')}
                      />
                    ) : (
                      <span className="text-[10px] text-muted-foreground/50">—</span>
                    )}
                  </div>

                  {/* Premium reward */}
                  <div className="flex-1 min-w-0">
                    {premCosmetic ? (
                      <div className="relative">
                        <RewardPill
                          cosmetic={premCosmetic}
                          reached={reached}
                          claimed={premClaimed || isUnlocked(premCosmetic.id)}
                          label={tr('bp_pro')}
                          isPremium
                        />
                        {reached && isPro && !premClaimed && !isUnlocked(premCosmetic.id) && (
                          <button
                            onClick={() => handleClaimPremium(lvl.level)}
                            className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[8px] font-bold px-1.5 py-0.5 rounded-full animate-pulse"
                          >
                            {tr('bp_claimShort')}
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] text-muted-foreground/50">—</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {!isPro && (
            <button
              onClick={() => { playButtonTap(); if (onOpenStore) onOpenStore(); }}
              className="w-full rounded-2xl p-3 sm:p-4 border-2 border-primary/60 bg-primary/10 text-center transition-all active:scale-[0.98] hover:border-primary"
            >
              <p className="text-sm sm:text-base font-black text-primary">{tr('bp_goPro')}</p>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-1">{tr('bp_goProDesc')}</p>
            </button>
          )}
        </div>
      ) : (
        /* Collection tab */
        <div className="py-3 space-y-3">
          {/* Categorías */}
          <div className="flex gap-1">
            {(Object.keys(CATEGORY_LABELS) as CosmeticCategory[]).map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex-1 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-bold transition-all ${
                  selectedCategory === cat
                    ? 'bg-accent/15 text-accent border border-accent/50'
                    : 'bg-card/50 text-muted-foreground border border-border/40'
                }`}
              >
                {tCategory(cat, CATEGORY_LABELS[cat], locale)}
              </button>
            ))}
          </div>

          {/* Cosmetics grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            {categoryCosmetics.map(cosmetic => {
              const unlocked = isUnlocked(cosmetic.id);
              const equipped = getEquipped(cosmetic.category).id === cosmetic.id;

              return (
                <div
                  key={cosmetic.id}
                  className={`relative p-3 rounded-2xl border transition-all ${
                    equipped
                      ? 'border-primary/60 bg-primary/10 shadow-[0_0_12px_hsl(var(--primary)/0.2)]'
                      : unlocked
                      ? 'border-border/40 bg-card/60 hover:border-border'
                      : 'border-border/20 bg-card/30 opacity-50'
                  }`}
                >
                  {equipped && (
                    <span className="absolute top-1.5 right-1.5 text-[8px] font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                      {tr('bp_equipped')}
                    </span>
                  )}

                  <div className="text-center mb-2">
                    <span className="text-2xl">{cosmetic.emoji}</span>
                  </div>

                  <p className="text-xs font-bold text-foreground text-center">{tCosmeticName(cosmetic.id, cosmetic.name, locale)}</p>
                  <p className="text-[9px] text-muted-foreground text-center mt-0.5">{tCosmeticDesc(cosmetic.id, cosmetic.description, locale)}</p>

                  <div className="flex justify-center mt-1.5">
                    <span
                      className="text-[8px] font-bold px-2 py-0.5 rounded-full"
                      style={{
                        color: RARITY_COLORS[cosmetic.rarity],
                        background: `${RARITY_COLORS[cosmetic.rarity]}20`,
                        border: `1px solid ${RARITY_COLORS[cosmetic.rarity]}40`,
                      }}
                    >
                      {tRarity(cosmetic.rarity, RARITY_LABELS[cosmetic.rarity], locale)}
                    </span>
                  </div>

                  {unlocked && !equipped && (
                    <button
                      onClick={() => handleEquip(cosmetic.id)}
                      className="w-full mt-2 py-1.5 rounded-xl text-[11px] font-bold bg-accent/15 text-accent border border-accent/50 active:scale-[0.97]"
                    >
                      {tr('bp_equip')}
                    </button>
                  )}

                  {!unlocked && cosmetic.source === 'store' && cosmetic.priceCents && (
                    <p className="text-[9px] text-center mt-2 text-muted-foreground">
                      💰 ${(cosmetic.priceCents / 100).toFixed(2)}
                    </p>
                  )}

                  {!unlocked && cosmetic.source.startsWith('battlepass') && (
                    <p className="text-[9px] text-center mt-2 text-muted-foreground">
                      🎖️ Battle Pass {cosmetic.source === 'battlepass_premium' ? '(Pro)' : ''}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
     </div>
    </div>
  );
}

/** Small pill showing a reward cosmetic */
function RewardPill({ cosmetic, reached, claimed, label, isPremium }: {
  cosmetic: Cosmetic;
  reached: boolean;
  claimed: boolean;
  label: string;
  isPremium?: boolean;
}) {
  const { locale } = useI18n();
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm">{claimed ? cosmetic.emoji : '❓'}</span>
      <div className="min-w-0">
        <p className={`text-[10px] font-bold truncate ${claimed ? 'text-foreground' : 'text-muted-foreground/50'}`}>
          {claimed ? tCosmeticName(cosmetic.id, cosmetic.name, locale) : '???'}
        </p>
        <span
          className="text-[7px] font-bold px-1 py-0.5 rounded"
          style={{
            background: isPremium ? 'hsl(var(--primary) / 0.18)' : 'hsl(var(--accent) / 0.18)',
            color: isPremium ? 'hsl(var(--primary))' : 'hsl(var(--accent))',
          }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}
