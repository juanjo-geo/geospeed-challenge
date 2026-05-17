/**
 * Referral system — invite friends, earn rewards.
 *
 * - Each player gets a unique referral code (6 chars)
 * - Share link: geospeed-challenge.vercel.app/?ref=XXXXXX
 * - Track referral count locally + mark rewards claimed
 * - Reward tiers: 1 invite = 2 lives, 3 invites = 5 lives + exclusive skin, 5 = 10 lives + pin
 */

import { addLives } from './energySystem';

const REF_CODE_KEY = 'geospeed_ref_code';
const REF_COUNT_KEY = 'geospeed_ref_count';
const REF_CLAIMED_KEY = 'geospeed_ref_claimed';
const REFERRED_BY_KEY = 'geospeed_referred_by';

// Generate a random 6-char alphanumeric code
function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1 to avoid confusion
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/** Get or create the player's referral code */
export function getReferralCode(): string {
  let code = localStorage.getItem(REF_CODE_KEY);
  if (!code) {
    code = generateCode();
    localStorage.setItem(REF_CODE_KEY, code);
  }
  return code;
}

/** Get the full referral link */
export function getReferralLink(): string {
  const code = getReferralCode();
  const base = window.location.origin;
  return `${base}/?ref=${code}`;
}

/** Check URL for referral parameter and store it (call on app load) */
export function checkIncomingReferral(): void {
  const params = new URLSearchParams(window.location.search);
  const ref = params.get('ref');
  if (ref && ref.length >= 4 && ref.length <= 8) {
    // Don't self-refer
    const myCode = localStorage.getItem(REF_CODE_KEY);
    if (ref !== myCode) {
      const existing = localStorage.getItem(REFERRED_BY_KEY);
      if (!existing) {
        localStorage.setItem(REFERRED_BY_KEY, ref);
        // Increment the referrer's count (only works if same browser — for cross-device,
        // this would need server-side tracking. Good enough for MVP.)
        incrementReferralCount();
      }
    }
    // Clean URL
    const url = new URL(window.location.href);
    url.searchParams.delete('ref');
    window.history.replaceState({}, '', url.pathname);
  }
}

/** Get referral count */
export function getReferralCount(): number {
  return parseInt(localStorage.getItem(REF_COUNT_KEY) || '0', 10);
}

/** Increment referral count (called when someone arrives via ref link) */
function incrementReferralCount(): void {
  const count = getReferralCount() + 1;
  localStorage.setItem(REF_COUNT_KEY, String(count));
}

/** Simulate adding a referral (for testing or when server confirms) */
export function addReferral(): void {
  incrementReferralCount();
}

export interface ReferralReward {
  tier: 1 | 2 | 3;
  label: string;
  lives: number;
  bonus: string;
  threshold: number;
}

export const REFERRAL_TIERS: ReferralReward[] = [
  { tier: 1, label: 'Embajador Novato', lives: 2, bonus: '', threshold: 1 },
  { tier: 2, label: 'Embajador Pro', lives: 5, bonus: 'Pin Exclusivo 🌟', threshold: 3 },
  { tier: 3, label: 'Embajador Leyenda', lives: 10, bonus: 'Skin Dorada ✨', threshold: 5 },
];

/** Get the highest claimable tier that hasn't been claimed yet */
export function getClaimableReward(): ReferralReward | null {
  const count = getReferralCount();
  const claimed = JSON.parse(localStorage.getItem(REF_CLAIMED_KEY) || '[]') as number[];

  // Find highest unclaimed tier the user qualifies for
  for (let i = REFERRAL_TIERS.length - 1; i >= 0; i--) {
    const tier = REFERRAL_TIERS[i];
    if (count >= tier.threshold && !claimed.includes(tier.tier)) {
      return tier;
    }
  }
  return null;
}

/** Claim a referral reward */
export function claimReferralReward(tier: number): void {
  const reward = REFERRAL_TIERS.find(t => t.tier === tier);
  if (!reward) return;

  // Add lives
  addLives(reward.lives);

  // Mark as claimed
  const claimed = JSON.parse(localStorage.getItem(REF_CLAIMED_KEY) || '[]') as number[];
  if (!claimed.includes(tier)) {
    claimed.push(tier);
    localStorage.setItem(REF_CLAIMED_KEY, JSON.stringify(claimed));
  }
}

/** Get progress info for the referral section */
export function getReferralProgress(): {
  code: string;
  link: string;
  count: number;
  nextTier: ReferralReward | null;
  claimable: ReferralReward | null;
} {
  const count = getReferralCount();
  const claimable = getClaimableReward();
  const claimed = JSON.parse(localStorage.getItem(REF_CLAIMED_KEY) || '[]') as number[];

  // Next unclaimed tier
  const nextTier = REFERRAL_TIERS.find(t => count < t.threshold && !claimed.includes(t.tier)) || null;

  return {
    code: getReferralCode(),
    link: getReferralLink(),
    count,
    nextTier,
    claimable,
  };
}
