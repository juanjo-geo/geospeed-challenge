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
    <div className="min-h-[100dvh] flex flex-col bg-background game-bg overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 pt-[env(safe-area-inset-top,12px)] pb-3 border-b border-border/50" style={{ paddingTop: 'max(env(safe-area-inset-top, 12px), 48px)' }}>
        <button
          onClick={() => { playButtonTap(); onClose(); }}
          className="text-xs sm:text-sm font-bold text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg border border-border/60 hover:border-border bg-card/50 active:scale-[0.97]"
        >
          ← {tr('back')}
        </button>
        <h1 className="text-base sm:text-lg font-bold" style={{ color: '#f5c842' }}>
          🏆 Battle Pass
        </h1>
        <div className="w-16" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 pt-3">
        {(['pass', 'collection'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              tab === t
                ? 'bg-[#f5c842]/20 text-[#f5c842] border border-[#f5c842]/40'
                : 'bg-card/50 text-muted-foreground border border-border/30'
            }`}
          >
            {t === 'pass' ? tr('bp_tabPass') : tr('bp_tabCollection')}
          </button>
        ))}
      </div>

      {tab === 'pass' ? (
        <div className="px-4 py-3 space-y-3">
          {/* Progress bar */}
          <div className="bg-card/60 rounded-xl p-3 border border-border/30">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-bold text-foreground">{tr('bp_level')} {bpLevel.level}</span>
              <span className="text-xs text-muted-foreground">
                {bpLevel.xpForNext > 0
                  ? `${bpLevel.xpInLevel.toLocaleString()} / ${bpLevel.xpForNext.toLocaleString()} XP`
                  : tr('bp_max')}
              </span>
            </div>
            <div className="h-3 rounded-full bg-border/30 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: bpLevel.xpForNext > 0 ? `${(bpLevel.xpInLevel / bpLevel.xpForNext) * 100}%` : '100%',
                  background: 'linear-gradient(90deg, #f5c842, #ef4444)',
                }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {tr('bp_season')} {bp.seasonId} · {tr('bp_totalXp')}: {bpLevel.totalXP.toLocaleString()}
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
                  className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${
                    reached
                      ? 'bg-card/80 border-[#f5c842]/30'
                      : 'bg-card/30 border-border/20 opacity-60'
                  }`}
                >
                  {/* Level number */}
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                    style={{
                      background: reached ? 'linear-gradient(135deg, #f5c842, #ef4444)' : 'rgba(100,116,139,0.2)',
                      color: reached ? '#0A0E18' : '#64748b',
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
                            className="absolute -top-1 -right-1 bg-[#f5c842] text-[#0A0E18] text-[8px] font-bold px-1.5 py-0.5 rounded-full animate-pulse"
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
              className="w-full bg-gradient-to-r from-purple-900/40 to-pink-900/40 rounded-xl p-3 border border-purple-500/30 text-center transition-all active:scale-[0.97] hover:border-purple-400/60"
            >
              <p className="text-sm font-bold text-purple-300">{tr('bp_goPro')}</p>
              <p className="text-[10px] text-purple-300/70 mt-1">{tr('bp_goProDesc')}</p>
            </button>
          )}
        </div>
      ) : (
        /* Collection tab */
        <div className="px-4 py-3 space-y-3">
          {/* Category filter */}
          <div className="flex gap-1">
            {(Object.keys(CATEGORY_LABELS) as CosmeticCategory[]).map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex-1 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${
                  selectedCategory === cat
                    ? 'bg-[#f5c842]/20 text-[#f5c842] border border-[#f5c842]/40'
                    : 'bg-card/50 text-muted-foreground border border-border/30'
                }`}
              >
                {tCategory(cat, CATEGORY_LABELS[cat], locale)}
              </button>
            ))}
          </div>

          {/* Cosmetics grid */}
          <div className="grid grid-cols-2 gap-2">
            {categoryCosmetics.map(cosmetic => {
              const unlocked = isUnlocked(cosmetic.id);
              const equipped = getEquipped(cosmetic.category).id === cosmetic.id;

              return (
                <div
                  key={cosmetic.id}
                  className={`relative p-3 rounded-xl border transition-all ${
                    equipped
                      ? 'border-[#f5c842]/60 bg-[#f5c842]/10 shadow-[0_0_12px_rgba(245,200,66,0.2)]'
                      : unlocked
                      ? 'border-border/40 bg-card/60 hover:border-border'
                      : 'border-border/20 bg-card/30 opacity-50'
                  }`}
                >
                  {equipped && (
                    <span className="absolute top-1.5 right-1.5 text-[8px] font-bold bg-[#f5c842] text-[#0A0E18] px-1.5 py-0.5 rounded-full">
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
                      className="w-full mt-2 py-1 rounded-lg text-[10px] font-bold bg-[#f5c842]/20 text-[#f5c842] border border-[#f5c842]/30 active:scale-[0.97]"
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
            background: isPremium ? 'rgba(167,139,250,0.2)' : 'rgba(74,222,128,0.2)',
            color: isPremium ? '#a78bfa' : '#4ade80',
          }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}
