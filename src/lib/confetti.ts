/**
 * Lightweight confetti burst using a temporary fullscreen canvas.
 * No external dependencies. Auto-cleans up after animation.
 */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  opacity: number;
}

const GOLD_PALETTE = ['#f5c842', '#ecdda2', '#c9b977', '#ffd700', '#fff4b8', '#e6c200'];
const RAINBOW_PALETTE = ['#f5c842', '#4ade80', '#38bdf8', '#f472b6', '#fbbf24', '#a78bfa', '#fb923c'];

export function fireConfetti(options?: {
  intensity?: 'light' | 'medium' | 'heavy';
  palette?: 'gold' | 'rainbow';
  /** Origin point in viewport pixels (default: center of screen) */
  origin?: { x: number; y: number };
}) {
  const intensity = options?.intensity ?? 'medium';
  const palette = options?.palette === 'rainbow' ? RAINBOW_PALETTE : GOLD_PALETTE;

  const count = intensity === 'light' ? 40 : intensity === 'heavy' ? 120 : 70;
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;z-index:9999;pointer-events:none;width:100vw;height:100vh;';
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);
  const W = window.innerWidth;
  const H = window.innerHeight;

  // Origin: use provided coords or fallback to center
  const ox = options?.origin?.x ?? W * 0.5;
  const oy = options?.origin?.y ?? H * 0.5;

  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: ox + (Math.random() - 0.5) * 30,
      y: oy,
      vx: (Math.random() - 0.5) * 16,
      vy: -Math.random() * 18 - 6,
      w: 4 + Math.random() * 6,
      h: 6 + Math.random() * 10,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.3,
      color: palette[Math.floor(Math.random() * palette.length)],
      opacity: 1,
    });
  }

  const gravity = 0.35;
  const drag = 0.98;
  const fadeStart = 60; // frame to start fading
  let frame = 0;
  const maxFrames = 120;

  function animate() {
    frame++;
    if (frame > maxFrames) {
      canvas.remove();
      return;
    }

    ctx.clearRect(0, 0, W, H);

    for (const p of particles) {
      p.vy += gravity;
      p.vx *= drag;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;

      if (frame > fadeStart) {
        p.opacity = Math.max(0, 1 - (frame - fadeStart) / (maxFrames - fadeStart));
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}

/** Tier S — Perfect (<50km): rainbow heavy burst from click point */
export function fireStarBurst(origin?: { x: number; y: number }) {
  fireConfetti({ intensity: 'heavy', palette: 'rainbow', origin });
}

/** Tier A — Excellent (50-300km): gold medium burst from click point */
export function fireGoldBurst(origin?: { x: number; y: number }) {
  fireConfetti({ intensity: 'medium', palette: 'gold', origin });
}

/** Fire a full celebration (for new records, origin optional) */
export function fireCelebration(origin?: { x: number; y: number }) {
  fireConfetti({ intensity: 'heavy', palette: 'rainbow', origin });
}

// ── Tier F — Bad answer (>2000km): red explosion burst ──

const RED_PALETTE = ['#ef4444', '#dc2626', '#f87171', '#b91c1c', '#fca5a5', '#991b1b'];

export function fireRedBurst(origin?: { x: number; y: number }) {
  fireConfetti({ intensity: 'medium', palette: 'gold', origin });
  // Override with red palette by creating a separate red burst
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;z-index:9999;pointer-events:none;width:100vw;height:100vh;';
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);
  const W = window.innerWidth;
  const H = window.innerHeight;
  const ox = origin?.x ?? W * 0.5;
  const oy = origin?.y ?? H * 0.5;

  const particles: Particle[] = [];
  for (let i = 0; i < 50; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 12;
    particles.push({
      x: ox, y: oy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      w: 3 + Math.random() * 5,
      h: 3 + Math.random() * 5,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.4,
      color: RED_PALETTE[Math.floor(Math.random() * RED_PALETTE.length)],
      opacity: 1,
    });
  }

  let frame = 0;
  const maxFrames = 60;
  function animate() {
    frame++;
    if (frame > maxFrames) { canvas.remove(); return; }
    ctx.clearRect(0, 0, W, H);
    for (const p of particles) {
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;
      p.opacity = Math.max(0, 1 - frame / maxFrames);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
}

// ── Distance reveal — giant number with screen shake for >5000km ──

export function fireDistanceReveal(distanceKm: number) {
  if (distanceKm < 5000) return;

  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 9998; pointer-events: none;
    display: flex; align-items: center; justify-content: center;
    animation: distance-reveal-in 0.3s ease-out;
  `;

  const distText = Math.round(distanceKm).toLocaleString();
  overlay.innerHTML = `
    <div style="text-align: center; animation: distance-reveal-scale 1.2s ease-out forwards;">
      <div style="font-size: clamp(60px, 15vw, 140px); font-weight: 900; font-family: Impact, system-ui;
        color: #ef4444; text-shadow: 0 0 40px rgba(239,68,68,0.6), 0 4px 20px rgba(0,0,0,0.5);
        line-height: 1;">
        ${distText} km
      </div>
      <div style="font-size: clamp(14px, 3vw, 24px); font-weight: 700; color: #fca5a5;
        margin-top: 8px; letter-spacing: 0.2em; text-transform: uppercase;">
        ¡Al otro lado del mundo!
      </div>
    </div>
  `;

  // Inject keyframes
  if (!document.getElementById('distance-reveal-css')) {
    const style = document.createElement('style');
    style.id = 'distance-reveal-css';
    style.textContent = `
      @keyframes distance-reveal-scale {
        0% { transform: scale(0.3); opacity: 0; }
        20% { transform: scale(1.15); opacity: 1; }
        35% { transform: scale(0.95); }
        50% { transform: scale(1); }
        80% { opacity: 1; }
        100% { transform: scale(0.9); opacity: 0; }
      }
      @keyframes distance-reveal-in {
        0% { background: rgba(239,68,68,0.15); }
        100% { background: transparent; }
      }
      @keyframes screen-shake {
        0%, 100% { transform: translate(0); }
        10% { transform: translate(-6px, 4px); }
        20% { transform: translate(5px, -3px); }
        30% { transform: translate(-4px, 5px); }
        40% { transform: translate(6px, -2px); }
        50% { transform: translate(-3px, 3px); }
        60% { transform: translate(4px, -4px); }
        70% { transform: translate(-2px, 2px); }
        80% { transform: translate(3px, -1px); }
        90% { transform: translate(-1px, 1px); }
      }
    `;
    document.head.appendChild(style);
  }

  // Screen shake on the game container
  const gameEl = document.querySelector('[data-game-container]') as HTMLElement;
  if (gameEl) {
    gameEl.style.animation = 'screen-shake 0.5s ease-out';
    setTimeout(() => { gameEl.style.animation = ''; }, 600);
  }

  document.body.appendChild(overlay);
  setTimeout(() => overlay.remove(), 1400);
}
