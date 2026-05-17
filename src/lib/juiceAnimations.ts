/**
 * ═══════════════════════════════════════════════════════════════════
 * GeoSpeed — JUICE ANIMATIONS (Phase 4: Polish AAA)
 * ═══════════════════════════════════════════════════════════════════
 *
 * DOM-based visual effects that overlay the game canvas:
 * 1. Multiplier mega-feedback — giant "×2.0!" text
 * 2. Score fly — points arc from click to score counter
 * 3. Round flash — mini "+820pts" between rounds
 *
 * All animations self-clean from the DOM after completion.
 */

// ── Inject shared keyframes (once) ──────────────────────────────────

let cssInjected = false;

function injectCSS() {
  if (cssInjected) return;
  cssInjected = true;
  const style = document.createElement('style');
  style.id = 'geospeed-juice-css';
  style.textContent = `
    @keyframes juice-mult-in {
      0%   { transform: scale(0.3) rotate(-8deg); opacity: 0; }
      40%  { transform: scale(1.25) rotate(3deg); opacity: 1; }
      60%  { transform: scale(0.92) rotate(-1deg); }
      80%  { transform: scale(1.05) rotate(0deg); }
      100% { transform: scale(1) rotate(0deg); opacity: 1; }
    }
    @keyframes juice-mult-out {
      0%   { transform: scale(1) translateY(0); opacity: 1; }
      100% { transform: scale(0.7) translateY(-30px); opacity: 0; }
    }
    @keyframes juice-mult-glow {
      0%, 100% { text-shadow: 0 0 20px rgba(245,200,66,0.6), 0 0 60px rgba(245,200,66,0.2); }
      50%      { text-shadow: 0 0 40px rgba(245,200,66,0.9), 0 0 80px rgba(245,200,66,0.4), 0 0 120px rgba(245,200,66,0.15); }
    }
    @keyframes juice-score-fly {
      0%   { opacity: 1; }
      85%  { opacity: 1; }
      100% { opacity: 0; }
    }
    @keyframes juice-combo-pulse {
      0%   { transform: scale(1); }
      50%  { transform: scale(1.15); }
      100% { transform: scale(1); }
    }
    @keyframes juice-flash-in {
      0%   { transform: translateY(20px) scale(0.8); opacity: 0; }
      100% { transform: translateY(0) scale(1); opacity: 1; }
    }
    @keyframes juice-flash-out {
      0%   { transform: translateY(0) scale(1); opacity: 1; }
      100% { transform: translateY(-20px) scale(0.85); opacity: 0; }
    }
    @keyframes juice-countdown-tick {
      0%   { transform: scale(2.5); opacity: 0; }
      30%  { transform: scale(1); opacity: 1; }
      80%  { transform: scale(1); opacity: 1; }
      100% { transform: scale(0.8); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

// ── 1. MULTIPLIER MEGA-FEEDBACK ─────────────────────────────────────

/**
 * Shows a giant animated multiplier overlay (e.g. "×2.0!") when multiplier >= 1.5
 * Includes emoji tier and optional combo streak count.
 *
 * @param multiplier - The multiplier value (e.g. 2.07)
 * @param streak - Current combo streak count (0 = no combo shown)
 * @param origin - Viewport pixel coords to anchor the animation near the click
 */
export function fireMultiplierFeedback(
  multiplier: number,
  streak: number = 0,
  origin?: { x: number; y: number }
) {
  if (multiplier < 1.5) return; // Only show for impressive multipliers
  injectCSS();

  const tier = multiplier >= 2.0 ? 'S' : multiplier >= 1.8 ? 'A' : 'B';
  const emoji = tier === 'S' ? '🚀' : tier === 'A' ? '⚡' : '🎯';
  const color = tier === 'S' ? '#fbbf24' : tier === 'A' ? '#f59e0b' : '#f5c842';
  const fontSize = tier === 'S' ? 'clamp(48px, 10vw, 80px)' : tier === 'A' ? 'clamp(40px, 8vw, 68px)' : 'clamp(34px, 7vw, 56px)';

  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 9990; pointer-events: none;
    display: flex; align-items: center; justify-content: center;
    flex-direction: column; gap: 6px;
  `;

  // Main multiplier text
  const multText = `×${multiplier.toFixed(1)}!`;
  overlay.innerHTML = `
    <div style="
      font-size: ${fontSize}; font-weight: 900; font-family: Impact, system-ui, sans-serif;
      color: ${color}; letter-spacing: -0.02em; line-height: 1;
      text-shadow: 0 0 30px rgba(245,200,66,0.7), 0 4px 15px rgba(0,0,0,0.5);
      animation: juice-mult-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards,
                 juice-mult-glow 0.8s ease-in-out 0.5s 2,
                 juice-mult-out 0.4s ease-in 1.8s forwards;
    ">
      ${emoji} ${multText}
    </div>
    ${streak >= 3 ? `
      <div style="
        font-size: clamp(16px, 3vw, 24px); font-weight: 800; font-family: system-ui;
        color: #f97316; letter-spacing: 0.1em; text-transform: uppercase;
        text-shadow: 0 2px 8px rgba(0,0,0,0.5);
        animation: juice-combo-pulse 0.4s ease-in-out 0.6s 3;
      ">
        🔥 COMBO ×${streak}
      </div>
    ` : ''}
  `;

  document.body.appendChild(overlay);
  setTimeout(() => overlay.remove(), 2400);
}

// ── 2. SCORE FLY ANIMATION ──────────────────────────────────────────

/**
 * Animates score points flying from click position to score counter.
 * Uses quadratic bezier for natural arc trajectory.
 *
 * @param points - Score to display (e.g. 820)
 * @param from - Viewport pixel coords of the map click
 * @param to - Viewport pixel coords of the score counter element
 */
export function fireScoreFly(
  points: number,
  from: { x: number; y: number },
  to: { x: number; y: number }
) {
  if (points <= 0) return;
  injectCSS();

  const el = document.createElement('div');

  // Color based on score tier
  const color = points >= 800 ? '#4ade80' : points >= 400 ? '#fbbf24' : points >= 100 ? '#fb923c' : '#ef4444';

  el.style.cssText = `
    position: fixed; z-index: 9991; pointer-events: none;
    font-size: clamp(18px, 4vw, 28px); font-weight: 900; font-family: Impact, system-ui;
    color: ${color};
    text-shadow: 0 2px 8px rgba(0,0,0,0.6), 0 0 20px ${color}44;
    left: ${from.x}px; top: ${from.y}px;
    animation: juice-score-fly 0.9s ease-out forwards;
    white-space: nowrap;
  `;
  el.textContent = `+${points.toLocaleString()}`;
  document.body.appendChild(el);

  // Bezier arc animation via JS (CSS can't do arbitrary paths)
  const duration = 900;
  const startTime = performance.now();

  // Control point for arc (above midpoint)
  const cpx = (from.x + to.x) / 2;
  const cpy = Math.min(from.y, to.y) - 80; // arc upward

  function animate(now: number) {
    const elapsed = now - startTime;
    const t = Math.min(elapsed / duration, 1);
    // Ease-out cubic
    const eased = 1 - Math.pow(1 - t, 3);

    // Quadratic bezier
    const u = 1 - eased;
    const x = u * u * from.x + 2 * u * eased * cpx + eased * eased * to.x;
    const y = u * u * from.y + 2 * u * eased * cpy + eased * eased * to.y;

    // Scale down as it approaches target
    const scale = 1 - eased * 0.4;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.transform = `translate(-50%, -50%) scale(${scale})`;

    if (t < 1) {
      requestAnimationFrame(animate);
    } else {
      el.remove();
    }
  }

  requestAnimationFrame(animate);
}

// ── 3. ROUND FLASH SUMMARY ─────────────────────────────────────────

/**
 * Quick flash overlay showing round summary between rounds.
 * e.g. "+820 pts" with the city name.
 *
 * @param points - Score earned in the round
 * @param cityName - Name of the city that was just played
 * @param isGood - Whether this was a good result (affects color)
 */
export function fireRoundFlash(
  points: number,
  cityName: string,
  isGood: boolean
) {
  injectCSS();

  const color = isGood ? '#4ade80' : '#f97316';
  const el = document.createElement('div');
  el.style.cssText = `
    position: fixed; inset: 0; z-index: 9989; pointer-events: none;
    display: flex; align-items: center; justify-content: center;
    flex-direction: column; gap: 4px;
  `;

  el.innerHTML = `
    <div style="
      font-size: clamp(14px, 2.5vw, 18px); font-weight: 600; font-family: system-ui;
      color: rgba(255,255,255,0.7); letter-spacing: 0.05em;
      animation: juice-flash-in 0.3s ease-out forwards, juice-flash-out 0.3s ease-in 0.6s forwards;
    ">
      ${cityName}
    </div>
    <div style="
      font-size: clamp(28px, 6vw, 44px); font-weight: 900; font-family: Impact, system-ui;
      color: ${color};
      text-shadow: 0 0 20px ${color}66, 0 3px 10px rgba(0,0,0,0.5);
      animation: juice-flash-in 0.25s ease-out 0.05s forwards, juice-flash-out 0.3s ease-in 0.65s forwards;
      opacity: 0;
    ">
      +${points.toLocaleString()}
    </div>
  `;

  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1100);
}

// ── 4. COUNTDOWN (First round) ──────────────────────────────────────

/**
 * Shows a "3-2-1-GO!" countdown before the first round starts.
 * Returns a promise that resolves when the countdown finishes.
 */
export function fireCountdown(): Promise<void> {
  injectCSS();

  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed; inset: 0; z-index: 9995; pointer-events: none;
      display: flex; align-items: center; justify-content: center;
      background: rgba(0,0,0,0.3);
    `;
    document.body.appendChild(overlay);

    const steps = ['3', '2', '1', '🌍'];
    let i = 0;

    function showNext() {
      if (i >= steps.length) {
        overlay.remove();
        resolve();
        return;
      }

      const isGo = i === steps.length - 1;
      const color = isGo ? '#f5c842' : '#ffffff';
      const size = isGo ? 'clamp(50px, 12vw, 90px)' : 'clamp(60px, 14vw, 100px)';

      overlay.innerHTML = `
        <div style="
          font-size: ${size}; font-weight: 900; font-family: Impact, system-ui;
          color: ${color};
          text-shadow: 0 0 40px ${color}88, 0 4px 20px rgba(0,0,0,0.5);
          animation: juice-countdown-tick 0.7s ease-out forwards;
        ">
          ${steps[i]}
        </div>
      `;

      i++;
      setTimeout(showNext, 650);
    }

    showNext();
  });
}

// ── 5. STREAK FIRE BORDER ───────────────────────────────────────────

/**
 * Adds a brief fire-border glow around the game container when on a streak.
 * Uses the [data-game-container] element.
 *
 * @param streak - Current streak count
 */
export function fireStreakBorder(streak: number) {
  if (streak < 3) return;

  const container = document.querySelector('[data-game-container]') as HTMLElement;
  if (!container) return;

  const intensity = Math.min(streak - 2, 5); // 1..5
  const alpha = 0.15 + intensity * 0.08; // 0.23..0.55
  const spread = 8 + intensity * 4; // 12..28px

  container.style.boxShadow = `inset 0 0 ${spread}px rgba(245,200,66,${alpha}), 0 0 ${spread * 2}px rgba(249,115,22,${alpha * 0.5})`;
  container.style.transition = 'box-shadow 0.4s ease-out';

  // Fade out after 1.5s
  setTimeout(() => {
    container.style.boxShadow = 'none';
    container.style.transition = 'box-shadow 1s ease-out';
  }, 1500);
}
