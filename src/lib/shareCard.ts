import { MODE_CONFIG } from '@/data/cities';
import { getPlayerLevel } from './levelSystem';

interface ShareCardData {
  playerName: string;
  score: number;
  mode: string;
  difficulty: string;
  avgDistance: string;
  cities: number;
  totalCities: number;
}

const DIFF_LABELS: Record<string, string> = {
  easy: 'Fácil',
  medium: 'Medio',
  hard: 'Experto',
};

// Score tier — determines the visual theme of the share card
interface ScoreTier {
  name: string;
  emoji: string;
  bgTop: string;
  bgBottom: string;
  accent: string;
  accentRgb: string;
  scoreColor: string;
  dotColor: string;
}

function getScoreTier(score: number): ScoreTier {
  if (score >= 10000) return {
    name: 'Diamante', emoji: '💎',
    bgTop: '#0a0a2e', bgBottom: '#1a0a3d',
    accent: '#a78bfa', accentRgb: '167, 139, 250',
    scoreColor: '#c4b5fd', dotColor: 'rgba(167, 139, 250, 0.05)',
  };
  if (score >= 6000) return {
    name: 'Oro', emoji: '🏆',
    bgTop: '#1a1400', bgBottom: '#2a1f00',
    accent: '#fbbf24', accentRgb: '251, 191, 36',
    scoreColor: '#fde68a', dotColor: 'rgba(251, 191, 36, 0.05)',
  };
  if (score >= 3000) return {
    name: 'Plata', emoji: '🥈',
    bgTop: '#0f1318', bgBottom: '#1a1f28',
    accent: '#94a3b8', accentRgb: '148, 163, 184',
    scoreColor: '#cbd5e1', dotColor: 'rgba(148, 163, 184, 0.05)',
  };
  return {
    name: 'Bronce', emoji: '🥉',
    bgTop: '#1a0f0a', bgBottom: '#2a1a10',
    accent: '#f97316', accentRgb: '249, 115, 22',
    scoreColor: '#fdba74', dotColor: 'rgba(249, 115, 22, 0.05)',
  };
}

export async function generateShareCard(data: ShareCardData): Promise<Blob> {
  const W = 600;
  const H = 380;
  const canvas = document.createElement('canvas');
  canvas.width = W * 2;
  canvas.height = H * 2;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(2, 2);

  const tier = getScoreTier(data.score);

  // Background gradient — tier-specific
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, tier.bgTop);
  bg.addColorStop(1, tier.bgBottom);
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.roundRect(0, 0, W, H, 16);
  ctx.fill();

  // Subtle pattern (dots) — tier colored
  ctx.fillStyle = tier.dotColor;
  for (let x = 20; x < W; x += 24) {
    for (let y = 20; y < H; y += 24) {
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Top accent line — tier colored
  const accent = ctx.createLinearGradient(40, 0, W - 40, 0);
  accent.addColorStop(0, `rgba(${tier.accentRgb}, 0)`);
  accent.addColorStop(0.5, `rgba(${tier.accentRgb}, 0.6)`);
  accent.addColorStop(1, `rgba(${tier.accentRgb}, 0)`);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(40, 20);
  ctx.lineTo(W - 40, 20);
  ctx.stroke();

  // Brand
  ctx.fillStyle = tier.accent;
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('📍 GEOSPEED IQ CHALLENGE', W / 2, 48);

  // Player name + level
  const level = getPlayerLevel();
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '600 13px system-ui, sans-serif';
  ctx.fillText(`${data.playerName || 'Jugador'} · ${level.emoji} ${level.title} Nv.${level.level}`, W / 2, 72);

  // Score — tier colored
  ctx.fillStyle = tier.scoreColor;
  ctx.font = 'bold 64px "Courier New", monospace';
  ctx.fillText(data.score.toLocaleString(), W / 2, 148);

  // Tier badge
  ctx.fillStyle = `rgba(${tier.accentRgb}, 0.15)`;
  const badgeText = `${tier.emoji} ${tier.name.toUpperCase()}`;
  ctx.font = 'bold 11px system-ui, sans-serif';
  const badgeW = ctx.measureText(badgeText).width + 20;
  ctx.beginPath();
  ctx.roundRect(W / 2 - badgeW / 2, 155, badgeW, 20, 10);
  ctx.fill();
  ctx.fillStyle = tier.accent;
  ctx.fillText(badgeText, W / 2, 169);

  // Stats row — shifted down for tier badge
  const modeInfo = MODE_CONFIG.find(m => m.key === data.mode);
  const modeLabel = modeInfo ? `${modeInfo.emoji} ${modeInfo.label}` : data.mode;
  const diffLabel = DIFF_LABELS[data.difficulty] || data.difficulty;

  const stats = [
    { label: 'MODO', value: modeLabel },
    { label: 'DIFICULTAD', value: diffLabel },
    { label: 'CIUDADES', value: `${data.cities}/${data.totalCities}` },
    { label: 'DIST. PROM.', value: data.avgDistance },
  ];

  const colW = (W - 80) / stats.length;
  stats.forEach((stat, i) => {
    const x = 40 + colW * i + colW / 2;
    const y = 220;

    ctx.fillStyle = `rgba(${tier.accentRgb}, 0.06)`;
    ctx.beginPath();
    ctx.roundRect(40 + colW * i + 4, y - 18, colW - 8, 52, 8);
    ctx.fill();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(stat.label, x, y);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillText(stat.value, x, y + 24);
  });

  // Level progress bar — tier colored
  const barY = 288;
  const barW = W - 160;
  const barH = 8;
  const barX = 80;
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.beginPath();
  ctx.roundRect(barX, barY, barW, barH, 4);
  ctx.fill();
  ctx.fillStyle = tier.accent;
  ctx.beginPath();
  ctx.roundRect(barX, barY, barW * (level.progress / 100), barH, 4);
  ctx.fill();
  ctx.fillStyle = '#64748b';
  ctx.font = '9px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${level.emoji} Nv.${level.level} ${level.title} — ${level.xp.toLocaleString()} XP`, W / 2, barY + 24);

  // Bottom accent line — tier colored
  ctx.strokeStyle = accent;
  ctx.beginPath();
  ctx.moveTo(40, H - 40);
  ctx.lineTo(W - 40, H - 40);
  ctx.stroke();

  // Footer
  ctx.fillStyle = '#64748b';
  ctx.font = '10px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('¿Puedes superarlo? 🌍 geospeed.app', W / 2, H - 20);

  return new Promise<Blob>((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/png');
  });
}

export async function shareResult(data: ShareCardData) {
  const blob = await generateShareCard(data);
  const file = new File([blob], `geospeed-${data.score}-pts.png`, { type: 'image/png' });

  // Try Web Share API first
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        title: `📍 GeoSpeed — ${data.score.toLocaleString()} pts`,
        text: `Hice ${data.score.toLocaleString()} puntos en GeoSpeed IQ Challenge. ¿Puedes superarlo? 🌍`,
        files: [file],
      });
      return;
    } catch (e) {
      // User cancelled or share failed — fall through to download
      if ((e as Error).name === 'AbortError') return;
    }
  }

  // Fallback: download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `geospeed-${data.score}-pts.png`;
  a.click();
  URL.revokeObjectURL(url);
}

// Keep backward compat
export const downloadShareCard = shareResult;
