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

export async function generateShareCard(data: ShareCardData): Promise<Blob> {
  const W = 600;
  const H = 380;
  const canvas = document.createElement('canvas');
  canvas.width = W * 2;
  canvas.height = H * 2;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(2, 2);

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#0a1a10');
  bg.addColorStop(1, '#0d2418');
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.roundRect(0, 0, W, H, 16);
  ctx.fill();

  // Subtle pattern (dots)
  ctx.fillStyle = 'rgba(74, 222, 128, 0.04)';
  for (let x = 20; x < W; x += 24) {
    for (let y = 20; y < H; y += 24) {
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Top accent line
  const accent = ctx.createLinearGradient(40, 0, W - 40, 0);
  accent.addColorStop(0, 'rgba(74, 222, 128, 0)');
  accent.addColorStop(0.5, 'rgba(74, 222, 128, 0.6)');
  accent.addColorStop(1, 'rgba(74, 222, 128, 0)');
  ctx.strokeStyle = accent;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(40, 20);
  ctx.lineTo(W - 40, 20);
  ctx.stroke();

  // Brand
  ctx.fillStyle = '#4ade80';
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('📍 GEOSPEED IQ CHALLENGE', W / 2, 48);

  // Player name + level
  const level = getPlayerLevel();
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '600 13px system-ui, sans-serif';
  ctx.fillText(`${data.playerName || 'Jugador'} · ${level.emoji} ${level.title} Nv.${level.level}`, W / 2, 72);

  // Score
  ctx.fillStyle = '#4ade80';
  ctx.font = 'bold 64px "Courier New", monospace';
  ctx.fillText(data.score.toLocaleString(), W / 2, 148);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillText('PUNTUACIÓN', W / 2, 168);

  // Stats row
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
    const y = 210;

    ctx.fillStyle = 'rgba(74, 222, 128, 0.06)';
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

  // Level progress bar
  const barY = 278;
  const barW = W - 160;
  const barH = 8;
  const barX = 80;
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.beginPath();
  ctx.roundRect(barX, barY, barW, barH, 4);
  ctx.fill();
  ctx.fillStyle = '#4ade80';
  ctx.beginPath();
  ctx.roundRect(barX, barY, barW * (level.progress / 100), barH, 4);
  ctx.fill();
  ctx.fillStyle = '#64748b';
  ctx.font = '9px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${level.emoji} Nv.${level.level} ${level.title} — ${level.xp.toLocaleString()} XP`, W / 2, barY + 24);

  // Bottom accent line
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
