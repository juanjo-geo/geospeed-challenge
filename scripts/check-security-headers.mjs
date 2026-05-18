#!/usr/bin/env node
/**
 * GeoSpeed — Security Headers Validator
 *
 * Validates vercel.json headers against Mozilla Observatory best practices.
 * Run: node scripts/check-security-headers.mjs [--live https://geospeed.app]
 */

import { readFileSync } from 'fs';

const PASS = '\x1b[32m✅ PASS\x1b[0m';
const FAIL = '\x1b[31m❌ FAIL\x1b[0m';
const WARN = '\x1b[33m⚠️  WARN\x1b[0m';
let passed = 0, failed = 0, warned = 0;

function test(name, fn) {
  try {
    const result = fn();
    if (result === 'warn') {
      console.log(`${WARN} ${name}`);
      warned++;
    } else {
      console.log(`${PASS} ${name}`);
      passed++;
    }
  } catch (e) {
    console.log(`${FAIL} ${name}\n   → ${e.message}`);
    failed++;
  }
}

function assert(c, m) { if (!c) throw new Error(m || 'Assertion failed'); }

// ── Mode: local (vercel.json) or live (URL fetch) ──
const args = process.argv.slice(2);
const liveUrl = args.includes('--live') ? args[args.indexOf('--live') + 1] : null;

let headers = {};

if (liveUrl) {
  console.log(`\n🌐 Fetching headers from: ${liveUrl}\n`);
  const res = await fetch(liveUrl);
  for (const [key, value] of res.headers.entries()) {
    headers[key.toLowerCase()] = value;
  }
} else {
  console.log('\n📄 Validating vercel.json headers (offline)\n');
  const vercelJson = JSON.parse(readFileSync('vercel.json', 'utf8'));
  const headerBlock = vercelJson.headers?.[0]?.headers || [];
  for (const h of headerBlock) {
    headers[h.key.toLowerCase()] = h.value;
  }
}

console.log('══════════════════════════════════════════');
console.log('  SECURITY HEADERS VALIDATION');
console.log('══════════════════════════════════════════\n');

// ── Content-Security-Policy ──
console.log('─── Content-Security-Policy ───\n');

const csp = headers['content-security-policy'] || '';
test('CSP header exists', () => assert(csp.length > 0, 'Missing Content-Security-Policy'));
test('CSP: default-src is restrictive', () => assert(csp.includes("default-src 'self'"), "default-src should be 'self'"));
test('CSP: object-src is none', () => assert(csp.includes("object-src 'none'"), "object-src should be 'none' (blocks Flash/Java)"));
test('CSP: base-uri is self', () => assert(csp.includes("base-uri 'self'"), "base-uri should be 'self' (prevents base tag injection)"));
test('CSP: frame-ancestors is none', () => assert(csp.includes("frame-ancestors 'none'"), "frame-ancestors 'none' prevents clickjacking"));
test('CSP: form-action is self', () => assert(csp.includes("form-action 'self'"), "form-action should be 'self'"));
test('CSP: upgrade-insecure-requests', () => assert(csp.includes('upgrade-insecure-requests'), 'Should force HTTPS'));

test('CSP: script-src allows required services', () => {
  assert(csp.includes('googletagmanager.com'), 'GA4 needs googletagmanager.com');
  assert(csp.includes('js.stripe.com'), 'Stripe needs js.stripe.com');
});

test('CSP: connect-src allows Supabase', () => {
  assert(csp.includes('supabase.co'), 'Supabase API needs connect-src');
  assert(csp.includes('wss://'), 'Supabase Realtime needs WebSocket');
});

// ── Transport Security ──
console.log('\n─── Transport Security ───\n');

const hsts = headers['strict-transport-security'] || '';
test('HSTS header exists', () => assert(hsts.length > 0, 'Missing Strict-Transport-Security'));
test('HSTS: max-age >= 2 years (63072000)', () => {
  const match = hsts.match(/max-age=(\d+)/);
  assert(match && parseInt(match[1]) >= 63072000, 'max-age should be >= 63072000 (2 years)');
});
test('HSTS: includeSubDomains', () => assert(hsts.includes('includeSubDomains'), 'Should include subdomains'));
test('HSTS: preload', () => assert(hsts.includes('preload'), 'Should include preload for HSTS preload list'));

// ── Other Headers ──
console.log('\n─── Protective Headers ───\n');

test('X-Content-Type-Options: nosniff', () => {
  const val = headers['x-content-type-options'] || '';
  assert(val === 'nosniff', `Expected 'nosniff', got '${val}'`);
});

test('X-Frame-Options: DENY', () => {
  const val = headers['x-frame-options'] || '';
  assert(val === 'DENY', `Expected 'DENY', got '${val}'`);
});

test('X-XSS-Protection: 1; mode=block', () => {
  const val = headers['x-xss-protection'] || '';
  assert(val.includes('1') && val.includes('mode=block'), `Expected '1; mode=block', got '${val}'`);
});

test('Referrer-Policy is set', () => {
  const val = headers['referrer-policy'] || '';
  const safe = ['strict-origin-when-cross-origin', 'strict-origin', 'no-referrer', 'same-origin'];
  assert(safe.some(s => val.includes(s)), `Should be one of: ${safe.join(', ')}`);
});

test('Permissions-Policy is set', () => {
  const val = headers['permissions-policy'] || '';
  assert(val.length > 0, 'Missing Permissions-Policy');
  assert(val.includes('camera=()'), 'camera should be disabled');
  assert(val.includes('microphone=()'), 'microphone should be disabled');
  assert(val.includes('geolocation=()'), 'geolocation should be disabled');
});

test('Permissions-Policy: gamepad allowed for self', () => {
  const val = headers['permissions-policy'] || '';
  assert(val.includes('gamepad=(self)'), 'gamepad should be allowed for self (Gamepad API)');
});

test('Permissions-Policy: payment allowed for self', () => {
  const val = headers['permissions-policy'] || '';
  assert(val.includes('payment=(self)'), 'payment should be allowed for self (Stripe)');
});

// ── Cross-Origin Policies ──
console.log('\n─── Cross-Origin Policies ───\n');

test('Cross-Origin-Opener-Policy: same-origin', () => {
  const val = headers['cross-origin-opener-policy'] || '';
  assert(val === 'same-origin', `Expected 'same-origin', got '${val}'`);
});

test('Cross-Origin-Embedder-Policy is set', () => {
  const val = headers['cross-origin-embedder-policy'] || '';
  assert(val.length > 0, `Missing COEP. Use 'credentialless' or 'require-corp'`);
});

test('Cross-Origin-Resource-Policy: same-origin', () => {
  const val = headers['cross-origin-resource-policy'] || '';
  assert(val === 'same-origin', `Expected 'same-origin', got '${val}'`);
});

// ── Summary ──
console.log('\n══════════════════════════════════════════');
console.log(`  RESULTS: ${passed} passed, ${failed} failed, ${warned} warnings`);
console.log('══════════════════════════════════════════\n');

if (failed > 0) {
  console.log('\x1b[31m⚠️  Some checks failed — fix before deploying\x1b[0m\n');
  process.exit(1);
} else if (warned > 0) {
  console.log('\x1b[33m⚠️  All critical checks passed with warnings\x1b[0m\n');
} else {
  console.log('\x1b[32m🔒 ALL SECURITY CHECKS PASSED — ready for Mozilla Observatory\x1b[0m\n');
}

console.log('Next steps:');
console.log('  1. Deploy to Vercel: git push origin main');
console.log('  2. Run Mozilla Observatory: https://observatory.mozilla.org');
console.log('  3. Run SSL Labs: https://www.ssllabs.com/ssltest/');
console.log('  4. Run Snyk: npx snyk test (or snyk.io)');
console.log('');
