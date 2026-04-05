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

export function fireConfetti(options?: { intensity?: 'light' | 'medium' | 'heavy'; palette?: 'gold' | 'rainbow' }) {
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

  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: W * (0.3 + Math.random() * 0.4),
      y: H * 0.5,
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

/** Fire a small star burst (for perfect 1000pt rounds) */
export function fireStarBurst() {
  fireConfetti({ intensity: 'light', palette: 'gold' });
}

/** Fire a full celebration (for new records) */
export function fireCelebration() {
  fireConfetti({ intensity: 'heavy', palette: 'rainbow' });
}
