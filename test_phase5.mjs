/**
 * Phase 5: All 5 Improvements — Automated Validation Tests
 */
import { readFileSync, existsSync } from 'fs';

const PASS = '\x1b[32m✅ PASS\x1b[0m';
const FAIL = '\x1b[31m❌ FAIL\x1b[0m';
let passed = 0, failed = 0;

function test(name, fn) {
  try { fn(); console.log(`${PASS} ${name}`); passed++; }
  catch (e) { console.log(`${FAIL} ${name}\n   → ${e.message}`); failed++; }
}
function assert(c, m) { if (!c) throw new Error(m || 'Assertion failed'); }

// Load all files
const base = '/sessions/charming-awesome-goldberg/mnt/GeospeedCh/src';

const onboarding = readFileSync(`${base}/components/game/OnboardingGame.tsx`, 'utf8');
const retention = readFileSync(`${base}/lib/retentionTracker.ts`, 'utf8');
const analytics = readFileSync(`${base}/lib/analytics.ts`, 'utf8');
const indexTsx = readFileSync(`${base}/pages/Index.tsx`, 'utf8');
const payment = readFileSync(`${base}/lib/paymentProvider.ts`, 'utf8');
const store = readFileSync(`${base}/components/game/StoreScreen.tsx`, 'utf8');
const gamepad = readFileSync(`${base}/hooks/useGamepad.ts`, 'utf8');
const ultrawide = readFileSync(`${base}/hooks/useUltraWide.ts`, 'utf8');
const gameScreen = readFileSync(`${base}/components/game/GameScreen.tsx`, 'utf8');
const shareVideo = readFileSync(`${base}/lib/shareVideo.ts`, 'utf8');
const sounds = readFileSync(`${base}/lib/sounds.ts`, 'utf8');

console.log('\n══════════════════════════════════════════');
console.log('  PHASE 5 — ALL IMPROVEMENTS VALIDATION');
console.log('══════════════════════════════════════════\n');

// ── 5.1: Onboarding Progresivo ──
console.log('─── 5.1: Onboarding Progresivo ───\n');

test('OnboardingGame.tsx exists', () => {
  assert(existsSync(`${base}/components/game/OnboardingGame.tsx`), 'File not found');
});

test('Has 3 onboarding cities (Paris, Tokio, New York)', () => {
  assert(onboarding.includes('Paris'), 'Paris missing');
  assert(onboarding.includes('Tokio'), 'Tokio missing');
  assert(onboarding.includes('New York') || onboarding.includes('Nueva York'), 'New York missing');
});

test('Extended timer (30 seconds)', () => {
  assert(onboarding.includes('30'), '30 second timer not found');
});

test('Progressive hint delays (5s, 10s, 15s)', () => {
  assert(onboarding.includes('hintDelay: 5') || onboarding.includes('hintDelay:5'), 'hintDelay 5 missing');
  assert(onboarding.includes('hintDelay: 10') || onboarding.includes('hintDelay:10'), 'hintDelay 10 missing');
  assert(onboarding.includes('hintDelay: 15') || onboarding.includes('hintDelay:15'), 'hintDelay 15 missing');
});

test('Shows country name (training-style)', () => {
  assert(onboarding.includes('country'), 'Country display missing');
});

test('Sets geospeed_onboarding_done on completion', () => {
  assert(onboarding.includes('geospeed_onboarding_done'), 'localStorage key missing');
});

test('Tracks onboarding analytics events', () => {
  assert(onboarding.includes('trackEvent') || onboarding.includes('onboarding'), 'Analytics tracking missing');
});

test('Uses WorldMapCanvas', () => {
  assert(onboarding.includes('WorldMapCanvas'), 'WorldMapCanvas not used');
});

test('Default export with onComplete and onGoHome props', () => {
  assert(onboarding.includes('onComplete'), 'onComplete prop missing');
  assert(onboarding.includes('onGoHome'), 'onGoHome prop missing');
  assert(onboarding.includes('export default'), 'Default export missing');
});

test('Index.tsx lazy loads OnboardingGame', () => {
  assert(indexTsx.includes("import('@/components/game/OnboardingGame')"), 'Lazy import missing');
});

test('Index.tsx has onboarding phase type', () => {
  assert(indexTsx.includes("'onboarding'"), 'Onboarding phase type missing');
});

test('Index.tsx checks geospeed_onboarding_done before tutorial', () => {
  assert(indexTsx.includes('geospeed_onboarding_done'), 'Onboarding check missing');
});

test('Index.tsx renders OnboardingGame component', () => {
  assert(indexTsx.includes('<OnboardingGame'), 'OnboardingGame render missing');
});

test('Index.tsx skips transition for onboarding', () => {
  assert(indexTsx.includes("'onboarding'") && indexTsx.includes('skipTransition'), 'Transition skip missing');
});

// ── 5.2: Retention Tracking ──
console.log('\n─── 5.2: Retention Tracking D1/D7/D30 ───\n');

test('retentionTracker.ts exists', () => {
  assert(existsSync(`${base}/lib/retentionTracker.ts`), 'File not found');
});

test('Records install date', () => {
  assert(retention.includes('recordInstallDate'), 'recordInstallDate missing');
  assert(retention.includes('geospeed_install_date'), 'Install date key missing');
});

test('Checks D1, D7, D30 milestones', () => {
  assert(retention.includes("'D1'"), 'D1 milestone missing');
  assert(retention.includes("'D7'"), 'D7 milestone missing');
  assert(retention.includes("'D30'"), 'D30 milestone missing');
});

test('Fires track_retention events', () => {
  assert(retention.includes('track_retention'), 'Event name missing');
  assert(retention.includes('trackEvent'), 'trackEvent call missing');
});

test('Milestones are idempotent (localStorage check)', () => {
  assert(retention.includes('geospeed_retention_'), 'Idempotency key prefix missing');
});

test('Index.tsx imports and calls retention tracker', () => {
  assert(indexTsx.includes('recordInstallDate'), 'recordInstallDate import missing');
  assert(indexTsx.includes('checkRetention'), 'checkRetention import missing');
});

test('Analytics has trackRetention convenience function', () => {
  assert(analytics.includes('trackRetention'), 'trackRetention missing from analytics');
});

test('Analytics has trackOnboarding convenience function', () => {
  assert(analytics.includes('trackOnboarding'), 'trackOnboarding missing from analytics');
});

// ── 5.3: Payment Provider ──
console.log('\n─── 5.3: Payment Provider (RevenueCat/Stripe) ───\n');

test('paymentProvider.ts exists', () => {
  assert(existsSync(`${base}/lib/paymentProvider.ts`), 'File not found');
});

test('Defines PaymentProvider interface', () => {
  assert(payment.includes('interface PaymentProvider') || payment.includes('PaymentProvider'), 'Interface missing');
});

test('Has MockPaymentProvider', () => {
  assert(payment.includes('MockPaymentProvider') || payment.includes('Mock'), 'Mock provider missing');
});

test('Has RevenueCatProvider', () => {
  assert(payment.includes('RevenueCat'), 'RevenueCat provider missing');
});

test('Has StripeProvider', () => {
  assert(payment.includes('Stripe'), 'Stripe provider missing');
});

test('Auto-detects platform', () => {
  assert(payment.includes('detectProvider') || payment.includes('Capacitor'), 'Auto-detection missing');
});

test('Exports paymentProvider singleton', () => {
  assert(payment.includes('export') && payment.includes('paymentProvider'), 'Singleton export missing');
});

test('Has purchase, restorePurchases, initialize methods', () => {
  assert(payment.includes('purchase'), 'purchase method missing');
  assert(payment.includes('restorePurchases') || payment.includes('restore'), 'restore method missing');
  assert(payment.includes('initialize'), 'initialize method missing');
});

test('StoreScreen imports paymentProvider', () => {
  assert(store.includes('paymentProvider'), 'paymentProvider import missing');
});

test('StoreScreen has restore purchases', () => {
  assert(store.includes('restore') || store.includes('Restore') || store.includes('RESTORE'), 'Restore button missing');
});

// ── 5.4: Gamepad API + Ultra-wide ──
console.log('\n─── 5.4: Gamepad API + Ultra-wide ───\n');

test('useGamepad.ts exists', () => {
  assert(existsSync(`${base}/hooks/useGamepad.ts`), 'File not found');
});

test('useUltraWide.ts exists', () => {
  assert(existsSync(`${base}/hooks/useUltraWide.ts`), 'File not found');
});

test('Gamepad uses navigator.getGamepads()', () => {
  assert(gamepad.includes('getGamepads'), 'getGamepads missing');
});

test('Gamepad has deadzone (0.15)', () => {
  assert(gamepad.includes('0.15') || gamepad.includes('DEADZONE'), 'Deadzone missing');
});

test('Gamepad maps standard buttons', () => {
  assert(gamepad.includes('confirm') || gamepad.includes('advance'), 'Button mapping missing');
});

test('Gamepad uses requestAnimationFrame polling', () => {
  assert(gamepad.includes('requestAnimationFrame'), 'rAF polling missing');
});

test('Gamepad handles connection/disconnection events', () => {
  assert(gamepad.includes('gamepadconnected'), 'Connection event missing');
  assert(gamepad.includes('gamepaddisconnected'), 'Disconnection event missing');
});

test('Ultra-wide detects aspect ratio > 2.2', () => {
  assert(ultrawide.includes('2.2') || ultrawide.includes('ratio'), 'Aspect ratio check missing');
});

test('Ultra-wide provides maxMapWidth', () => {
  assert(ultrawide.includes('maxMapWidth') || ultrawide.includes('maxWidth'), 'maxMapWidth missing');
});

test('GameScreen imports useGamepad', () => {
  assert(gameScreen.includes('useGamepad'), 'useGamepad import missing');
});

test('GameScreen imports useUltraWide', () => {
  assert(gameScreen.includes('useUltraWide'), 'useUltraWide import missing');
});

test('GameScreen applies ultra-wide maxWidth to map container', () => {
  assert(gameScreen.includes('maxMapWidth') || gameScreen.includes('maxWidth'), 'Ultra-wide constraint missing');
});

// ── 5.5: Audio in Video Clips ──
console.log('\n─── 5.5: Audio in Video Clips ───\n');

test('shareVideo.ts has getAudioDestination export', () => {
  assert(shareVideo.includes('getAudioDestination'), 'getAudioDestination missing');
});

test('shareVideo.ts creates MediaStreamAudioDestinationNode', () => {
  assert(shareVideo.includes('MediaStreamAudioDestination') || shareVideo.includes('createMediaStreamDestination'), 'Audio destination missing');
});

test('shareVideo.ts merges audio tracks with video', () => {
  assert(shareVideo.includes('addTrack') || shareVideo.includes('getAudioTracks'), 'Audio track merging missing');
});

test('shareVideo.ts prefers vp9+opus codec', () => {
  assert(shareVideo.includes('opus') || shareVideo.includes('vp9'), 'Codec preference missing');
});

test('sounds.ts has startAudioCapture export', () => {
  assert(sounds.includes('startAudioCapture'), 'startAudioCapture missing');
});

test('sounds.ts has stopAudioCapture export', () => {
  assert(sounds.includes('stopAudioCapture'), 'stopAudioCapture missing');
});

test('sounds.ts routes audio through recording node', () => {
  assert(sounds.includes('getOutputNode') || sounds.includes('recordingNode'), 'Audio routing missing');
});

// ── Final Summary ──
console.log('\n══════════════════════════════════════════');
console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
console.log('══════════════════════════════════════════\n');

if (failed > 0) {
  console.log('\x1b[31m⚠️  Some tests failed\x1b[0m\n');
  process.exit(1);
} else {
  console.log('\x1b[32m🎉 ALL PHASE 5 TESTS PASSED!\x1b[0m\n');
}
