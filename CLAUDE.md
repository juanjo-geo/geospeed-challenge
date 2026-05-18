# GeoSpeed IQ Challenge — Project Memory

## Owner
JuanJo Grimar (juanjogrimar@gmail.com) — Senior Manager BPO, Colombia. 550 people under management. Focused on profitability and AI/automation. This project started academic but is transitioning to a monetizable product.

## What Is GeoSpeed
Geography quiz game: locate cities on an interactive world map combining speed + precision. Tagline: "How well do you know the world?" Dark premium aesthetic (#07130a bg, #f5c842 gold accents). Optimized for mobile landscape + desktop.

## Tech Stack
- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **Rendering:** Canvas 2D (WorldMapCanvas.tsx) — custom map, no Google Maps API
- **Backend:** Supabase (auth, DB, Edge Functions, Realtime for multiplayer)
- **Hosting:** Vercel (free tier, CDN global)
- **Payments:** RevenueCat (mobile IAP) + Stripe (web) via paymentProvider.ts
- **Analytics:** Google Analytics GA4 via analytics.ts
- **Ads:** AdMob/AdSense via adSystem.ts (rewarded + interstitial)
- **Native:** Capacitor (iOS + Android) — capacitor.config.ts ready
- **A/B Testing:** Feature flags via Supabase (featureFlags.ts)

## Game Modes (5)
1. **Classic:** 13 rounds, 15s timer per round. Time runs out = game over.
2. **Time Attack:** 60s global clock, infinite cities, max accuracy.
3. **1v1 Duel:** Real-time multiplayer via Supabase Realtime. 5-char room codes.
4. **Daily Challenge:** Deterministic seed (YYYY-MM-DD), same cities for everyone worldwide.
5. **Regional:** Each mode playable in World, Europe, Asia, Americas, Africa.

## Scoring System
- <50km: 1000pts | 50-200km: 800 | 200-500km: 500 | 500-1000km: 300 | 1000-2000km: 100 | >2000km: 50 | >8000km: 0
- Speed multiplier: <4s = x2, 4-9s = x1, >9s = x0.5

## Key Architecture Files

### Pages
- `src/pages/Index.tsx` — Main game orchestrator (phases: home, game, results, store, etc.)
- `src/pages/Privacy.tsx` — Privacy policy (ES/EN), required by App Store/Play
- `src/pages/Support.tsx` — FAQ + contact, required by App Store/Play
- `src/pages/Auth.tsx` — Supabase auth page

### Core Game Components
- `src/components/game/GameScreen.tsx` — Main gameplay (uses useGamepad + useUltraWide)
- `src/components/game/WorldMapCanvas.tsx` — Canvas 2D map renderer
- `src/components/game/HomeScreen.tsx` — Mode selection, stats, ranking
- `src/components/game/FinalResultScreen.tsx` — End-of-game scores + share
- `src/components/game/OnboardingGame.tsx` — 3 guided rounds (Paris, Tokyo, NY) with progressive hints
- `src/components/game/StoreScreen.tsx` — IAP store (uses paymentProvider)
- `src/components/game/NoLivesModal.tsx` — Rewarded ad + purchase + Pro upsell
- `src/components/game/BattlePassScreen.tsx` — Seasonal cosmetics
- `src/components/game/TimeAttackScreen.tsx` — 60s mode
- `src/components/game/MultiplayerLobby.tsx` — 1v1 matchmaking
- `src/components/game/FrustrationOfferModal.tsx` — Smart rage-quit intervention

### Systems (src/lib/)
- `adSystem.ts` — Rewarded + interstitial ad management (AdMob/AdSense)
- `analytics.ts` — GA4 event tracking + convenience functions
- `energySystem.ts` — Lives system (max 5, regen 1/20min)
- `featureFlags.ts` — 15 remote flags, 3 AB groups, Supabase-backed, 5min cache
- `frustrationDetector.ts` — Detects rage, offers contextual help (max 4/session, 90s cooldown)
- `paymentProvider.ts` — Unified interface: Mock/RevenueCat/Stripe, auto-detect platform
- `retentionTracker.ts` — D1/D7/D30 milestone tracking (idempotent, localStorage + GA4)
- `shareVideo.ts` — 5s gameplay clips with audio (MediaRecorder + AudioDestination)
- `sounds.ts` — Web Audio API with recording node routing for video capture
- `dailyStreak.ts` — Daily streak system with FOMO hooks
- `streakSystem.ts` — Streak tracking and rewards
- `referralSystem.ts` — Deep link referral system
- `confetti.ts` — Particle effects for celebrations
- `juiceAnimations.ts` — Score fly, multiplier mega-feedback, particle burst
- `levelSystem.ts` — 10 levels from Novato to Deidad Geo (0-100K XP)
- `cosmetics.ts` — Battle Pass cosmetics system
- `gameUtils.ts` — City selection, scoring, distance calculation

### Hooks
- `useGamepad.ts` — Gamepad API with rAF polling, deadzone 0.15, standard button mapping
- `useUltraWide.ts` — Aspect ratio >2.2 detection, maxMapWidth constraint

### Data
- `src/data/cities.ts` — Extensive catalog: Easy/Medium/Expert, 5 continents
- `src/data/countries.ts` — Country data for regional modes

### Config
- `capacitor.config.ts` — App ID: com.geospeed.challenge, dark theme, SplashScreen
- `vercel.json` — Security headers (A+ Mozilla Observatory, 125/100) + SPA rewrites
- `.env` — Supabase, RevenueCat, Stripe, GA4, payment mode keys
- `store-listing/metadata.json` — iOS + Android store metadata, bilingual, ASO keywords
- `supabase/migrations/20260517_feature_flags.sql` — Feature flags table + RLS

### Scripts
- `scripts/check-security-headers.mjs` — Validates security headers offline or live (--live URL)

### Docs (in docs/)
- `GeoSpeed_Analisis_Mercado_Financiero.docx` — Market analysis, competition, financial projections
- `GeoSpeed_Guia_Lanzamiento.docx` — Launch guide with manual steps, costs, marketing, security

## Current Status (May 2026)
- **Audit Score:** 9.4/10
- **Security:** A+ (125/100) on Mozilla Observatory — 10/10 tests
- **Deploy:** Live on Vercel at geospeed-challenge.vercel.app
- **Git:** github.com/juanjo-geo/geospeed-challenge (main branch)
- **Code:** Complete — all 5 game modes, multiplayer, monetization, analytics, ads, onboarding
- **Stores:** NOT yet published — needs Apple Developer ($99) + Google Play ($25) accounts

## Phases Completed
1. **Phase 1-2:** Core game, 5 modes, multiplayer, scoring, cities DB
2. **Phase 3:** Monetization (ads, IAP, Battle Pass, streaks, frustration detector, referrals, funnel analytics)
3. **Phase 4:** Visual polish (multiplier mega-feedback, score fly, round transitions, canvas polish)
4. **Phase 5:** Production readiness (onboarding, D1/D7/D30 retention, payment providers, gamepad, ultra-wide, audio in video clips)
5. **Phase 6:** Launch prep (Capacitor, A/B testing, store listing, security headers A+, privacy/support pages)

## What's Pending (JuanJo's Manual Tasks)
1. Create accounts: Apple Developer, Google Play, RevenueCat, Stripe, GA4, AdMob
2. Set real API keys in .env (replace placeholders)
3. Build iOS/Android with Capacitor, submit to stores
4. Take screenshots for store listings
5. Create TikTok/Instagram profiles for GeoSpeed
6. Soft launch in Colombia + Mexico + Chile

## What's Pending (Technical)
1. SEO meta tags + Open Graph (preview when sharing on social)
2. Snyk dependency audit
3. Lighthouse performance optimization (target 90+)
4. PWA manifest + service worker (installable from Chrome)

## Market Analysis Summary
- GeoGuessr = $17M/year, 21M visits/month, subscription model ($3.99-9.99)
- GeoSpeed = different niche: fast quiz (2-5min sessions) vs immersive exploration (15-30min)
- No API costs (custom Canvas map, no Google Maps)
- Hybrid monetization: rewarded ads (40-50%), interstitials (15-20%), IAP (30-40%)
- Launch investment: ~$140 USD total
- Revenue projection (base case): $1,300/month net at 10K DAU, $3,300/month at 25K DAU
- EBITDA margin: 59-97% due to minimal fixed costs
- Decision: LAUNCH as product. Validate retention first (D1 > 35%), then scale marketing.

## Important Patterns
- Git lock files: FUSE mount creates .git/*.lock files. Delete with `del "path\.git\HEAD.lock"` before commits.
- Git plumbing: Used write-tree/commit-tree/direct ref writes to bypass FUSE locks in previous sessions.
- Feature flags: Change any game parameter remotely via Supabase without app update.
- Payment mode: VITE_PAYMENT_MODE=mock for dev, 'auto' for production (auto-detects platform).
