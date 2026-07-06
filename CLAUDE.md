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

## Current Status (May 18, 2026)
- **Audit Score:** 9.4/10
- **Security:** A+ (125/100) on Mozilla Observatory — 10/10 tests
- **Deploy:** Live on Vercel at geospeed-challenge.vercel.app
- **Git:** github.com/juanjo-geo/geospeed-challenge (main branch)
- **Code:** Complete — all 5 game modes, multiplayer, monetization, analytics, ads, onboarding
- **Legal Pages:** /privacy, /terms, /support — all live and bilingual (ES/EN)
- **SEO:** OG meta tags, Twitter Card, og-image.png, canonical URL
- **PWA:** manifest.json + sw.js v5 (network-first, push notifications, SPA fallback)

## Accounts & Services Status
| Service | Status | Details |
|---------|--------|---------|
| Google Play Console | CREATED | $25 paid, developer: GeoSpeed Games |
| Google Analytics (GA4) | CONFIGURED | Measurement ID: G-V0L6R02VG0, stream: GeoSpeed Web |
| Google AdMob | CONFIGURED | App ID: ca-app-pub-9803010593449601~3668014353 |
| AdMob Rewarded | CONFIGURED | ca-app-pub-9803010593449601/2163360991 (gives lives) |
| AdMob Interstitial | CONFIGURED | ca-app-pub-9803010593449601/5565522179 (between games) |
| AdSense Publisher | CONFIGURED | pub-9803010593449601 |
| Supabase | ACTIVE | Auth, DB, Edge Functions, Realtime |
| Vercel | ACTIVE | Free tier, CDN, auto-deploy from GitHub |
| GitHub | ACTIVE | juanjo-geo/geospeed-challenge |
| Apple Developer | PENDING | $99/year — not yet created |
| RevenueCat | PENDING | Free tier — needs Apple + Google connected |
| Stripe | PENDING | Free — needs account creation |

## .env Configuration
- VITE_SUPABASE_*: Real keys configured
- VITE_GA_MEASUREMENT_ID: G-V0L6R02VG0 (real)
- VITE_ADMOB_APP_ID: ca-app-pub-9803010593449601~3668014353 (real)
- VITE_ADMOB_REWARDED_ID: ca-app-pub-9803010593449601/2163360991 (real)
- VITE_ADMOB_INTERSTITIAL_ID: ca-app-pub-9803010593449601/5565522179 (real)
- VITE_REVENUECAT_API_KEY: placeholder (pending)
- VITE_STRIPE_PUBLISHABLE_KEY: placeholder (pending)
- VITE_PAYMENT_MODE: mock (change to 'auto' for production)

## Phases Completed
1. **Phase 1-2:** Core game, 5 modes, multiplayer, scoring, cities DB
2. **Phase 3:** Monetization (ads, IAP, Battle Pass, streaks, frustration detector, referrals, funnel analytics)
3. **Phase 4:** Visual polish (multiplier mega-feedback, score fly, round transitions, canvas polish)
4. **Phase 5:** Production readiness (onboarding, D1/D7/D30 retention, payment providers, gamepad, ultra-wide, audio in video clips)
5. **Phase 6:** Launch prep (Capacitor, A/B testing, store listing, security headers A+, privacy/support/terms pages)
6. **Phase 7:** Account setup (Google Play Console, GA4, AdMob — all configured with real keys)

## What's Pending (JuanJo's Manual Tasks)
1. ~~Create Google Play Console~~ DONE
2. ~~Create GA4 property~~ DONE
3. ~~Create AdMob account + ad units~~ DONE
4. Create Apple Developer account ($99/year)
5. Create RevenueCat account (connect Apple + Google)
6. Create Stripe account (web payments)
7. Complete AdMob payment profile (bank account — not urgent, needed at $100+)
8. Build iOS/Android with Capacitor, submit to stores
9. Take screenshots for store listings
10. Create TikTok/Instagram profiles for GeoSpeed
11. Soft launch in Colombia + Mexico + Chile

## What's Pending (Technical)
1. ~~SEO meta tags + Open Graph~~ DONE
2. ~~Snyk dependency audit~~ DONE (0 known vulnerabilities)
3. ~~PWA manifest + service worker~~ DONE
4. Lighthouse performance optimization (target 90+)
5. Configure Capacitor build for Android APK/AAB

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

---

## ⚠️ PROTOCOLO DE VERIFICACIÓN PRE-PUBLICACIÓN (OBLIGATORIO)

**Antes de darle a JuanJo cualquier comando de `git push`, Claude DEBE hacer una revisión profunda para que nada se rompa. No entregar comandos de push hasta completar TODO esto:**

1. **Sintaxis:** validar con `@babel/parser` (plugins `typescript` + `jsx`) TODOS los archivos tocados.
2. **Grafo de imports/exports:** correr el chequeo sobre todo `src/` de que ningún `import` apunte a un export inexistente. Esto es lo que rompe el build de Vite/Rollup (ej. saga `gameUtils`/`revenuecat`). Verificar también que no haya imports a archivos que no existen.
3. **Reproducir el build cuando se pueda:** `vite build` da SIGBUS en el sandbox (binario SWC nativo), pero **esbuild SÍ corre**. Exportar el árbol commiteado con `git archive HEAD | tar -x -C /tmp/…` (evita el disco corrupto por FUSE), `npm install`, y `esbuild src/main.tsx --bundle --tsconfig=tsconfig.app.json --external:@revenuecat/purchases-capacitor --format=esm` → debe dar exit 0 limpio.
4. **Anti-truncado FUSE:** NUNCA usar las herramientas Edit/Write sobre archivos del repo montado (truncan). Usar `python`/`sed`/`cat > heredoc` y **verificar conteos de bytes/líneas** tras cada cambio. Si algo se trunca, recuperar con `git show HEAD:archivo`.
5. **Índice de git corrupto:** tras el commit, revisar la salida — que NO aparezca ningún `delete mode` de un archivo que siga en uso (rompió el build con `gameI18n.ts`). Si aparece, restaurar ese archivo y volver a commitear.
6. **Service worker:** subir la versión de `CACHE_NAME` en `public/sw.js` (evita que la PWA sirva caché vieja).
7. **Lista explícita de archivos:** dar el `git add` con la lista exacta de archivos tocados. NUNCA `git add -A` (evita subir `.env`, `package.json`, configs no deseadas). Recordar el baile de candados (`del .git\...lock`) por el bug FUSE.
8. Solo tras completar 1–7, entregar los comandos de commit/push.

**Notas del entorno para las validaciones:** correr `node` desde `/tmp` (el `package.json` del repo da `ERR_INVALID_PACKAGE_CONFIG` a node). Instalar `@babel/parser` en `/tmp` si no está.
