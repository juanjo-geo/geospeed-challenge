import { MODE_CONFIG, getMapBounds } from '@/data/cities';
import { countries } from '@/data/countries';
import { getPlayerLevel } from './levelSystem';

interface RoundData {
  clickLat: number;
  clickLon: number;
  cityLat: number;
  cityLon: number;
  distance: number;
}

interface ShareCardData {
  playerName: string;
  score: number;
  mode: string;
  difficulty: string;
  avgDistance: string;
  cities: number;
  totalCities: number;
  rounds?: RoundData[];
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
  const hasMap = data.rounds && data.rounds.length > 0;
  const MAP_H = 160;
  const H = hasMap ? 380 + MAP_H + 20 : 380;
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

  // ── Mini-map with round results ──
  if (hasMap && data.rounds) {
    const mapX = 30;
    const mapY = 320;
    const mapW = W - 60;
    const mapH = MAP_H;

    // Map label
    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('📍 TU PARTIDA EN EL MAPA', W / 2, mapY - 6);

    // Map background (ocean)
    ctx.fillStyle = `rgba(${tier.accentRgb}, 0.06)`;
    ctx.beginPath();
    ctx.roundRect(mapX, mapY, mapW, mapH, 8);
    ctx.fill();
    ctx.strokeStyle = `rgba(${tier.accentRgb}, 0.2)`;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Clip to map area
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(mapX, mapY, mapW, mapH, 8);
    ctx.clip();

    // Ocean fill
    ctx.fillStyle = tier.bgTop === '#0a0a2e' ? '#0d0d35' : tier.bgTop === '#1a1400' ? '#1a1800' : tier.bgTop === '#0f1318' ? '#0f151c' : '#1a1210';
    ctx.fillRect(mapX, mapY, mapW, mapH);

    // Simplified country outlines
    const bounds = getMapBounds((data.mode as any) || 'world');
    const lonRange = bounds.lonMax - bounds.lonMin;
    const latRange = bounds.latMax - bounds.latMin;
    const mScale = Math.min(mapW / lonRange, mapH / latRange);
    const mOffX = mapX + (mapW - lonRange * mScale) / 2;
    const mOffY = mapY + (mapH - latRange * mScale) / 2;
    const toMX = (lon: number) => mOffX + (lon - bounds.lonMin) * mScale;
    const toMY = (lat: number) => mOffY + (bounds.latMax - lat) * mScale;

    ctx.fillStyle = `rgba(${tier.accentRgb}, 0.12)`;
    ctx.strokeStyle = `rgba(${tier.accentRgb}, 0.08)`;
    ctx.lineWidth = 0.5;
    for (const country of countries) {
      for (const polygon of country.polygons) {
        if (polygon.length < 3) continue;
        ctx.beginPath();
        let vis = false;
        for (let i = 0; i < polygon.length; i++) {
          const x = toMX(polygon[i][0]);
          const y = toMY(polygon[i][1]);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          if (x >= mapX - 10 && x <= mapX + mapW + 10 && y >= mapY - 10 && y <= mapY + mapH + 10) vis = true;
        }
        if (vis) { ctx.closePath(); ctx.fill(); ctx.stroke(); }
      }
    }

    // Draw round connections
    const getColor = (dist: number) => {
      if (dist < 200) return '#22c55e';
      if (dist < 500) return '#eab308';
      if (dist < 1000) return '#f97316';
      return '#ef4444';
    };

    for (let i = 0; i < data.rounds.length; i++) {
      const r = data.rounds[i];
      const ux = toMX(r.clickLon);
      const uy = toMY(r.clickLat);
      const cx = toMX(r.cityLon);
      const cy = toMY(r.cityLat);
      const color = getColor(r.distance);

      // Arc
      const mx2 = (ux + cx) / 2;
      const my2 = (uy + cy) / 2;
      const dx = cx - ux;
      const dy = cy - uy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const bulge = Math.min(dist * 0.15, 20);
      const cpx = mx2 - (dy / (dist || 1)) * bulge;
      const cpy = my2 + (dx / (dist || 1)) * bulge;

      ctx.strokeStyle = color + '88';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 2]);
      ctx.beginPath();
      ctx.moveTo(ux, uy);
      ctx.quadraticCurveTo(cpx, cpy, cx, cy);
      ctx.stroke();
      ctx.setLineDash([]);

      // Click dot
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(ux, uy, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // City dot (gold star)
      ctx.fillStyle = '#f5c842';
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Round number
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 7px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${i + 1}`, cx, cy);
    }

    ctx.restore(); // unclip
  }

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
        text: `Hice ${data.score.toLocaleString()} puntos en GeoSpeed. ¿Puedes superarlo? 🌍`,
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
