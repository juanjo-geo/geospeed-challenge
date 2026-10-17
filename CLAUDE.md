# GeoSpeed Challenge — Project Memory

## Owner
JuanJo Grimar (juanjogrimar@gmail.com) — Senior Manager BPO, Colombia. 550 people under management. Focused on profitability and AI/automation. Started academic, now a monetizable product.

## What Is GeoSpeed
Geography quiz game: locate cities (or a footballer's country) on an interactive world map combining speed + precision. Tagline: "How well do you know the world?" Dark premium aesthetic (#07130a bg, #f5c842 gold). Optimized for mobile landscape + desktop. App name: **GeoSpeed Challenge** (store listing still says "GeoSpeed IQ Challenge").

## Tech Stack
- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS. Bilingual ES/EN via `src/i18n/`.
- **Rendering:** Canvas 2D (`WorldMapCanvas.tsx`), custom map, no Google Maps API. Two-finger pan + zoom, 3x Retina resolution.
- **Backend:** Supabase (auth, DB, Edge Functions, Realtime + polling fallback for duels, web push).
- **Hosting:** Vercel (free tier), auto-deploy from GitHub `main`.
- **Payments:** `paymentProvider.ts` picks the provider by platform: **Mercado Pago** on web (Stripe does NOT operate in Colombia; Edge Functions `mercadopago-checkout` / `mercadopago-webhook`) and **RevenueCat / Google Play Billing** inside the native app (Google rejects Mercado Pago for digital goods in the APK). Mock provider for dev.
- **Analytics:** GA4 via `analytics.ts`. **Ads:** `adSystem.ts` (web overlay today; native AdMob plugin NOT yet installed).
- **Native:** Capacitor 8 (`android/` committed, generated with `npx cap add android`). iOS not started.
- **A/B Testing:** feature flags in Supabase (`featureFlags.ts`).

## Game Modes
1. **Clásico:** 13 rounds, 15s per round (`GameScreen.tsx`). Time out = game over.
2. **60s de Caos (Time Attack):** 60s global clock, infinite cities (`TimeAttackScreen.tsx`).
3. **Duelo 1v1:** real-time via Supabase Realtime with polling fallback, 5-char room codes, spectator mode, emoji chat.
4. **Desafío Diario:** deterministic seed (YYYY-MM-DD), same cities worldwide.
5. **Mundial:** given a footballer's name, tap their country (`WorldChallengeScreen.tsx`, `worldChallenge.ts`, `src/data/players.ts`, `countryAdjacency.ts`). Scoring by territory bands: exact 1000 / neighbour 600 / same continent 300 / other continent 50 / ocean 0. Spec in `docs/GeoSpeed_Modulo_Mundial_Spec.md`.
6. **Regional:** every mode playable in World, Europe, Asia, Americas, Africa.

**Difficulties** (`DIFFICULTY_MULTIPLIER` in `gameUtils.ts`): basic Turista x1.0 · easy Rookie x1.1 · medium Crack x1.25 · hard Leyenda x1.5. Mundial labels: Suplente / Titular / Crack / Balón de Oro. Rankings are per difficulty.

## Scoring (real formulas)
- Distance: `max(0, 1000 × (1 − d/7000)^1.5)` → 50km=989, 500km=832, 2000km=366, 7000km+=0.
- Speed multiplier: `clamp(0.4, 2.2 − t×0.13, 2.2)` → 1s=x2.07, 5s=x1.55, 10s=x0.90, 14s+=x0.40.
- Streak bonus: +10% per level from streak ≥2, cap x1.60. Miss (>1500km) halves the streak instead of resetting it.
- Final score × difficulty multiplier.

## Key Architecture Files

### Pages (`src/pages/`)
`Index.tsx` (orchestrator: home, game, results, store, profile…), `Auth.tsx`, `Privacy.tsx`, `Terms.tsx`, `Support.tsx`, `NotFound.tsx`.

### Game components (`src/components/game/`)
- `GameScreen.tsx` (Clásico), `TimeAttackScreen.tsx`, `WorldChallengeScreen.tsx`, `WorldMapCanvas.tsx`, `GameLayout.tsx` (fluid sidebar with container queries / cqi), `FloatingHUD.tsx`, `TimerBar.tsx`, `EnergyBar.tsx`.
- `HomeScreen.tsx`, `ProfileScreen.tsx`, `FinalResultScreen.tsx`, `RoundBreakdown.tsx`, `ReplayMap.tsx`.
- **Juice:** `Mascot.tsx` (5 reactive states: idle / celebrate / on fire / sad / wink, images in `public/`, sources in `mascot/`), `CountdownIntro.tsx` (3-2-1-GO in all modes), `DailyChestModal.tsx` (variable reward chest, replaced the streak popup), `SplashScreen.tsx`.
- **Onboarding:** `OnboardingGame.tsx` (Paris, Tokyo, NY with hints), `TutorialOverlay.tsx`, `AutoDemo.tsx`.
- **Multiplayer:** `MultiplayerLobby.tsx`, `WaitingRoom.tsx`, `SpectatorScreen.tsx`, `MultiplayerResultScreen.tsx`, `EmojiChat.tsx`.
- **Monetization:** `StoreScreen.tsx` (countdown + glow on offers), `NoLivesModal.tsx` (mascot + rewarded ad + Pro upsell), `FrustrationOfferModal.tsx`, `BattlePassScreen.tsx`.
- A11y: `ScreenReaderAnnouncer.tsx`, `ThemeToggle.tsx`.

### Systems (`src/lib/`)
`gameUtils.ts` (scoring, leaderboard, stats, history) · `worldChallenge.ts` · `multiplayerUtils.ts` · `paymentProvider.ts` · `premiumSystem.ts` (Pro state) · `energySystem.ts` (5 lives, +1/20min) · `adSystem.ts` · `analytics.ts` · `featureFlags.ts` · `frustrationDetector.ts` · `retentionTracker.ts` (D1/D7/D30) · `dailyStreak.ts` · `streakSystem.ts` · `levelSystem.ts` · `cosmetics.ts` · `referralSystem.ts` · `notifications.ts` (web push, VAPID) · `cloudSync.ts` · `sounds.ts` (Web Audio, music as AudioBuffer, mediaSession, iOS interruption recovery) · `haptics.ts` · `confetti.ts` · `juiceAnimations.ts` · `shareCard.ts` · `shareVideo.ts` · `gameI18n.ts`.

### Hooks (`src/hooks/`)
`useAuth`, `useBackgroundMusic`, `useGamepad` (rAF polling, deadzone 0.15), `useUltraWide` (aspect >2.2), `useKeyboardShortcuts`, `useAccessibility`, `useOnlineStatus`, `useTheme`, `use-mobile`, `use-toast`.

### Data (`src/data/`)
`cities.ts` (Easy/Medium/Expert, 5 continents), `countries.ts`, `countryAdjacency.ts`, `players.ts`.

### Supabase
- Edge Functions: `create-game-room`, `update-game-room`, `submit-score`, `send-push`, `mercadopago-checkout`, `mercadopago-webhook`.
- Migrations up to `20260707_push_subscriptions.sql` (player_data, feature_flags, push_subscriptions…).
- Project: `motyvjfhupmvmfpgftku` (new project since mid-2026; `supabase/config.toml` and `.env` agree). `supabase/.temp/` is gitignored.

### Config & assets
- `capacitor.config.ts` — appId `com.geospeed.challenge`, appName "GeoSpeed Challenge".
- `android/` — Capacitor project. `build/`, `.gradle/`, `local.properties`, `*.aab/*.apk` are gitignored. versionCode 1 / versionName 1.0. Keystore is NOT in the repo (keep it that way).
- `vercel.json` — security headers (A+ Mozilla Observatory) + SPA rewrites. `public/sw.js` — PWA service worker (`CACHE_NAME` currently `geospeed-v82`).
- `.env` — tracked in git on purpose; contains ONLY public `VITE_*` keys (Supabase anon, GA4, AdMob IDs, payment mode, RevenueCat/Stripe placeholders). Never put secrets there; server secrets live in Supabase Edge Function secrets.
- `store-listing/metadata.json` — iOS + Android store metadata, ASO keywords.
- `scripts/check-security-headers.mjs` — header validation (`--live URL`).

### Docs (`docs/`)
- `GeoSpeed_Build_Nativo_Android.md` — Capacitor → Play Console step by step (keystore, AAB, soft launch).
- `GeoSpeed_RevenueCat_Setup.md` — product IDs (`lives_5`, `lives_15`, `lives_50`, `pro_monthly`, `pro_yearly`, `pro_lifetime`), entitlement `pro`, console steps.
- `GeoSpeed_Modulo_Mundial_Spec.md` — Mundial mode spec (implemented).
- `Protocolo_Juice_GeoSpeed_vs_Duolingo.md` + two audit `.docx` — 9-layer game-feel rubric. Score went 2.31 → 2.62 on 2026-07-06; the remaining gaps (chest, monetization juice, shake on miss) were closed in later commits.
- `GeoSpeed_Analisis_Mercado_Financiero.docx`, `GeoSpeed_Guia_Lanzamiento.docx` — market analysis, launch guide.

## Redesign v2 (started October 17, 2026)
JuanJo ran a design audit with the dev team and approved 83 mockups (new palette: ocean blue / turquoise / warm yellow, "Explorador" pin mascot, persistent nav, settings screen, async friend challenges). Two documents govern this work:
- `docs/GeoSpeed_Ajustes_y_Sugerencias_Desarrollo_v1.md` — the consolidated change requests + approval log (source of truth for what was approved; it did NOT audit the code).
- `docs/GeoSpeed_Plan_Rediseno_v2.md` — code audit vs. each request, bugs found, blocking product decisions (D1–D11), target data model, 6-phase plan with estimates. **Read this before touching anything related to the redesign.**
- `docs/maquetas/` — the 80 approved mockups as 1400px JPGs (`vigentes/`, `historicas_NO_implementar/`), the isotype PNG, `INDICE.csv` and the approval log. Originals (139 MB PNG) live only in JuanJo's zip `GeoSpeed_Maquetas_Aprobadas_2026-10-17.zip`.
- Decisions closed 2026-10-17: D1 anonymous sign-in (on condition of zero cost → lazy session + weekly cleanup + Turnstile), D2 explicit city list stored per challenge (not a seed), D5 ranking = best game per region×difficulty×mode, D7 country photos in feedback/review/Mundial/comparison. Details in plan §4.0–4.1.
- Visual direction from the mockups: **dark navy + yellow + turquoise** (an evolution of the current `neon` theme, not a light theme), multicolor continent map with labels, 5-tab bottom nav (Inicio · Progreso · Tienda · Pass · Perfil), mascot = yellow pin with turquoise gem (the hat/jacket variant in Ajustes/Login/Crear cuenta is NOT the master).

Key facts the audit established (so nobody re-discovers them):
- **No persistent player identity for guests** (no anonymous auth, no device id). Blocks challenges, cloud history, personal rank. Recommended: Supabase Anonymous Sign-in (decision D1).
- **Server stores only aggregate scores.** Per-round detail (`RoundResult`) lives in memory only. History is localStorage, capped at 20; XP is derived from that capped list.
- Live 1v1 duel: room `status` never leaves `waiting`, rooms never deleted, no resume, no user_id. The redesign **replaces** it with async challenges (decision 31 of the consolidado). Plan: hide behind a feature flag, don't extend it.
- "Reta a un amigo" link is **broken** (generates a new seed, friend plays different cities) — `Index.tsx:574-579`.
- `submit-score` rejects `mode: 'mundial'` → Mundial scores never reach the cloud leaderboard.
- Dead code: `GameLayout.tsx`, `FloatingHUD.tsx`, `ThemeToggle.tsx`, `ReplayMap.tsx` (imported, never rendered), `showMoreModes` state.
- No settings screen, no password recovery flow, no links to /privacy /support from inside the game, Auth + Splash hardcoded in Spanish.
- Daily seed uses UTC date (rolls over 19:00 Colombia).
- `countries.ts` has no ISO codes; 195 country photos (catalog done by JuanJo, outside the repo) need ISO mapping before integration.

### F0 Fundaciones — done 2026-10-17 (branch `feat/f0-fundaciones`)
- **Design tokens:** single palette in `src/index.css` `:root` (`--brand-*` + shadcn semantics; `.light`/`.neon` overrides removed, the `neon` class on `<html>` is inert). Canvas/JS code uses the hex mirror in `src/lib/theme.ts` (`BRAND`, `BRAND_RGB`, `rgba()`). `var(--grad-wordmark)`, `var(--grad-cta)`, `--btn3d-lip`, `--primary-deep` replace the old hardcoded gradients/lips. **Rule: no brand hex in `src/` outside `theme.ts`** (legal pages and `countries.ts` are the only exceptions left).
- **Wordmark:** `src/components/ui/Wordmark.tsx` (GEO white + SPEED turquoise). Use it instead of gradient text.
- **Preferences:** `src/lib/prefs.ts` → localStorage `geospeed_prefs` {sfx, haptics, reduceMotion}. `sounds.ts` play* functions check `isSfxEnabled()`, `haptics.ts` checks `isHapticsEnabled()`, confetti/juiceAnimations/AutoDemo/WorldMapCanvas check `prefersReducedMotion()` (pref OR OS media query; also toggles `reduce-motion` class on `<html>`). Music keeps its own key (`geospeed_music_muted`).
- **Settings screen:** `SettingsScreen.tsx` (phase `settings`, gear in Home top bar). Music, SFX, vibration, reduce motion, colorblind, language, How to play, Support, Privacy, Terms, account.
- **Persistent nav:** `AppNav.tsx` — 5 tabs (Inicio · Progreso · Tienda · Pass · Perfil), bottom on mobile, top bar on md+. Shown only in `NAV_PHASES` (home, profile, store, battlepass, settings); content wrapped in `.with-app-nav`. "Progreso" opens ProfileScreen on the History tab until F5 builds the real hub.
- **Bugs fixed:** B1 challenge link now shares the real game seed (`gameSeedRef` in Index; button hidden after "Otra vez"/revenge/training); B2 `submit-score` accepts `mode: 'mundial'` (**redeploy the Edge Function**). Dead code deleted (GameLayout, FloatingHUD, ThemeToggle, useTheme, NavLink). Auth, Splash, notif prompt, error boundary, 60s final screen, streak banner, nudges → i18n. `Translations` type is now `{[K in TranslationKey]: string}` so `tsc` no longer flags en.ts.
- **Known pre-existing `tsc` errors (not F0):** stale `src/integrations/supabase/types.ts` (push_subscriptions, player_data Json) and `WorldChallengeScreen.tsx:294`. `npm run build` is clean. Fix in F1 with `supabase gen types`.
- Local dev server for the browser pane: `.claude/launch.json` → `geospeed-dev` (port 5173).

### F1 Identidad y persistencia — code done 2026-10-17 (branch `feat/f1-identidad`), dashboard steps pending
- **Migration** `supabase/migrations/20261017120000_game_results.sql`: tables `game_results` (one row per game of any type, immutable, idempotent by `client_id`) and `game_rounds` (per-city detail, private); `profiles.avatar` + `profiles.xp_legacy`; RPCs `save_game_result(jsonb)`, `my_progress()`, `my_rank(mode,difficulty,period)`, `leaderboard_top(...)` (SECURITY DEFINER, exposes only display_name/avatar), `import_legacy_history(jsonb)`, `update_my_profile`, `cleanup_anonymous_users()` (schedule weekly with pg_cron once enabled). RLS: own rows; other players' **non-challenge** results readable for ranking; challenge results (`challenge_id` not null) stay private for F3.
- **Client** `src/lib/gameResults.ts`: `saveGameResult()` is called at the end of every mode (classic/training/speeddemon/challenge in `handleGameOver`, daily, 60s Caos, Mundial, duel). Fire-and-forget; without a session or on network failure the payload goes to the `geospeed_pending_results` queue and `flushPendingResults()` retries after login/app start. `importLegacyHistoryOnce(userId)` uploads the ≤20 local history entries + local XP as `xp_legacy` once per device (flag `geospeed_legacy_imported_<uid>`). Read helpers for F5 already exist: `fetchMyProgress`, `fetchMyHistory`, `fetchLeaderboardTop`, `fetchMyRank`.
- **Local stats/history (gameUtils) keep being written**: still the source for guests without a session and the offline fallback. F5 switches the UI to the server reads.
- **Account**: `/reset-password` page (`ResetPassword.tsx`, states checking/form/success/invalid, signs out after success), "Olvidé mi contraseña" mode in `Auth.tsx` (generic "check your email" whether or not the account exists), confirm-password field, `PASSWORD_MIN = 8` for new passwords (`src/lib/authRules.ts`; login does not enforce length), generic error messages (B5 fixed: sign-up with an existing email shows the same confirmation screen).
- **Types**: `src/integrations/supabase/types.ts` hand-updated (game_results, game_rounds, push_subscriptions, feature_flags, finished flags, profiles.avatar/xp_legacy, Functions). `tsc -p tsconfig.app.json --noEmit` is clean again. Regenerate with `supabase gen types` once the remote DB has all migrations.
- **Still needed from JuanJo (dashboard):** `npx supabase db push` (applies this migration + the missing feature_flags one); Auth → Anonymous Sign-ins ON + "Allow manual linking" ON; Auth → URL Configuration → add `https://geospeed-challenge.vercel.app/reset-password` and `http://localhost:5173/reset-password` to Redirect URLs; enable `pg_cron` and schedule `cleanup_anonymous_users()`.
- **Not done yet in F1 (needs anonymous auth ON):** lazy anonymous session creation in `useAuth` (after first finished game), account linking flow (`updateUser`/`linkIdentity`) with migration of the anonymous user's results on email conflict, avatar picker with the explorer set.

### F2 Rediseño visual — in progress (branch `feat/f2-home-v2`, started 2026-10-17)
- **Done: Home v2** (`HomeScreen.tsx` rewritten): header (lives · brand · account · gear), "¿Cómo se juega?" banner with AutoDemo + 3 steps + "Ver tutorial", "Tu próxima aventura" card with region/difficulty **dropdowns that open `SelectorSheet`** (bottom sheet on mobile, modal on md+; locks shown with padlock per D12), persisted selection (`geospeed_last_selection`), yellow CTA, 2×2 access cards (Diario · Jugar con amigos · Más modos · Campo de tiro — the 4th becomes "Mis retos" in F4), level card with Ranking (collapsible, still local leaderboard until F5) · Historial (→ Profile history tab) · badges, referral card. New-player gating removed (D13). Desktop: two columns (banner | aventura) + 4 cards row.
- **Done:** `MoreModesScreen.tsx` (Caos · Imposible Nv5 · Mundial, phase `more-modes`), `HowToPlayScreen.tsx` (3 steps, "Entendido" returns without starting a game per HELP-01, Boot camp secondary; phase `howto`, also opened from Settings). `AutoDemo` has `hideTagline`. `mode_world` label is now "Mundo" in ES.
- **Done (block 2, branch `feat/f2-partida-cierres`):** rotate overlay now shows **before** the countdown and the countdown pauses while portrait (`showRotateOverlay` gates the tick effect); `RotateOverlay` redesigned per mockup with "Volver al inicio" (cancelling during countdown refunds the life via `handleCancelCountdown`); `CountdownIntro` shows "¡Prepárate!", label "Clásico · Mundo · Turista", mascot and Cancel; `GameScreen` no longer counts paused time (portrait/hidden) toward the speed multiplier (`pausedMsRef`); timeout `onGameOver` moved out of the state updater (React warning). `FinalResultScreen` rewritten: 3 outcomes (record > timeout > complete) with mascot celebrate/sad/wink, two columns on md+ (summary | "¿Lo intentamos de nuevo?"), **Nueva partida** (`onNewGame` → `handleNewGame`, consumes a life, new seed), Repetir estas ciudades (free), share/challenge row, revenge, Pro link, guest nudge. `RoundBreakdown` i18n'd.
- **Done (block 3, branch `feat/f2-partida-mapa`):** `WorldMapCanvas` multicolor map per continent (`getColorGroup`: NorthAmerica teal · SouthAmerica coral · Europe lavender · Asia orange · Africa yellow · Oceania sky blue · Ice gray; white borders; continent labels in dark navy, ocean labels italic light blue), continent-hint dimming softened, zoom buttons −/+/⌖ (`showZoomControls`, no auto-reset), pin labels "Tu respuesta"/"Ciudad correcta" (`pinLabels` prop), user pin yellow (default cosmetic `pin_classic` is now yellow) and correct pin turquoise, crosshair cursor yellow. `GameScreen` HUD per mockup: compact (phones landscape, now also `touch && height<500` → compact in `use-mobile`) = two-row top bar (logo · "¿Dónde está? City" pill · sound · ×; mode·difficulty · Ronda · timer · ⭐ pts) + streak pill bottom-left + "Toca el mapa para responder"; sidebar modes = wordmark + mode pill + "¿Dónde está?" card + PUNTOS + RONDA + streak + mascot + timer, sound/× top-right. `RoundFeedbackCard` replaces both old popups (mascot, phrase, city, +pts, Distancia/Tiempo tiles, "Ver cálculo" breakdown base×velocidad×racha×dificultad, SIGUIENTE, "Avanza en N s"). Music toggle moved into the game HUD for GameScreen phases (`GAME_SCREEN_PHASES` hides Index's floating button). Exit × asks confirmation then `onExit`.
- **Gotcha fixed in block 3:** `WorldMapCanvas`'s trail/beacon effect depends on `userClick`/`correctLocation`/`pinLabels` by identity. `GameScreen` used to pass fresh objects every render, so each auto-advance tick restarted the arc animation and the correct-city beacon/labels never appeared. They are now `useMemo`'d on `lastResult`; keep it that way (TimeAttack/WorldChallenge pass state objects, which are stable).
- **Done (block 4, branch `feat/f2-caos-mundial`):** 60s de Caos and Mundial now share Clásico's look. `TimeAttackScreen`: sidebar with Wordmark + mode pill + "¿Dónde está?" card, compact two-row HUD (logo · city pill · sound · × / mode·diff · cities · global timer · ⭐ pts), "Toca el mapa", zoom buttons, `pinLabels`, `CountdownIntro` with Cancel; props `onExit`/`musicMuted`/`onToggleMusic`; its rounds now have the `RoundResult` shape (click, base, multiplier) and `onGameOver` is deferred out of the state updater. `WorldChallengeScreen`: v2 two-row top bar, rotate overlay per mockup, feedback panel in the card style, zoom hidden during feedback; its old inline end stage, initials form and share code are gone. **`FinalResultScreen` has `variant` ('classic' | 'timeattack' | 'mundial')** plus `tiles`, `previousBestOverride`, `countDistancesInStats`; `onPlayAgain` is optional (Caos/Mundial show RETRY / PLAY AGAIN via `onNewGame`); the challenge button hides when `onShareChallenge` is absent. Caos skips `updatePlayerStats` and the city leaderboard (its score scale would inflate the global record), as before. Closing sound now comes only from FinalResultScreen. Index's inline `ta-final` screen was replaced; `ta-playing`/`wc-playing` are in `GAME_SCREEN_PHASES`. Map zoom aria-labels i18n'd.
- **Pending in F2:** splash (needs mascot/globe art), per-city review (`ReplayMap` per city + hints C1 + flags C5), re-skin Store/NoLives/Chest/BattlePass/Profile (D11).

## Current Status (October 13, 2026)
- **Code:** feature-complete for web. Last feature work 2026-07-15. Deployed at geospeed-challenge.vercel.app. Git: github.com/juanjo-geo/geospeed-challenge (`main`).
- **Security:** A+ Mozilla Observatory. Secret test links/gestures were removed before launch (commit d8a4e52).
- **Native:** `android/` exists and an AAB was built on 2026-06-15, but it predates all July commits → must be rebuilt before uploading.
- **Working tree cleanup 2026-10-13:** Capacitor deps + android/ committed, Supabase project switch committed, loose docs moved into `docs/`, obsolete Stripe stubs and Vite temp files deleted, `screenshots/` gitignored.

## Accounts & Services
| Service | Status | Details |
|---------|--------|---------|
| Google Play Console | CREATED | $25 paid, developer: GeoSpeed Games. No build uploaded yet. |
| Google Analytics GA4 | CONFIGURED | G-V0L6R02VG0 |
| Google AdMob | CONFIGURED | App ca-app-pub-9803010593449601~3668014353; rewarded …/2163360991; interstitial …/5565522179. Native plugin not integrated. |
| Supabase | ACTIVE | Project motyvjfhupmvmfpgftku |
| Vercel / GitHub | ACTIVE | Auto-deploy from main |
| Mercado Pago | CODE READY | Web checkout + webhook Edge Functions. Verify production credentials in Supabase secrets of the NEW project. |
| RevenueCat | PENDING | Plugin installed; `VITE_REVENUECAT_API_KEY` is a placeholder. Needs account + Play products. |
| Stripe | DROPPED | Not available in Colombia. Replaced by Mercado Pago. |
| Apple Developer | PENDING | $99/year, not created. |

## What's Pending — Technical
1. Native AdMob: install `@capacitor-community/admob` and wire the "future AdMob" points in `adSystem.ts`.
2. RevenueCat: real key in `.env` once the account exists; test purchases in Play internal testing.
3. Rebuild native: `npm run build && npx cap sync android`, bump `versionCode`, sign AAB.
4. New store screenshots + 1024×500 feature graphic (June captures predate mascot/Mundial).
5. Lighthouse performance pass (target 90+).
6. Store listing name: decide "GeoSpeed Challenge" vs "GeoSpeed IQ Challenge" and align `store-listing/metadata.json`.

## What's Pending — JuanJo (manual)
1. Create and back up the release keystore (2 locations). Losing it = cannot update the app ever.
2. Upload AAB to Play Console internal testing, then create the 6 in-app products (IDs above).
3. Create RevenueCat account, Google Play app, entitlement `pro`, paste API key.
4. Confirm Mercado Pago production credentials in the new Supabase project.
5. Apple Developer account; TikTok/Instagram profiles; soft launch Colombia + Mexico + Chile.
6. AdMob payment profile (needed at $100+).

## Market Summary
GeoGuessr = $17M/year, subscription. GeoSpeed niche: 2–5 min fast quiz sessions, zero map API cost. Hybrid monetization: rewarded ads 40-50%, interstitials 15-20%, IAP 30-40%. Base case $1,300/month net at 10K DAU, $3,300 at 25K DAU. Decision: launch, validate D1 > 35%, then scale marketing.

## Working Conventions (Windows / Claude Code desktop)
- Normal Edit/Write tools work fine here. The old Cowork/FUSE rules (lock files, no Edit/Write, git plumbing) no longer apply.
- Line endings: repo files are LF; git prints CRLF warnings on Windows. Harmless, do not "fix" them.
- **Before any `git push`:**
  1. `npm run build` must pass (Vite). Optionally `npx tsc -p tsconfig.app.json --noEmit`.
  2. Bump `CACHE_NAME` in `public/sw.js` whenever app code changes (PWA clients cache aggressively).
  3. `git add` with an explicit file list. Never `git add -A` (avoids `android/` build output, screenshots, stray files).
  4. `.env` changes are reviewed by JuanJo before committing (it is tracked; public keys only).
- Feature flags let you change game parameters remotely without a deploy.
- Payment mode: `VITE_PAYMENT_MODE=auto` in production (platform auto-detect); `mock` for local dev.
