/**
 * GeoSpeed — Animated Share Video Generator
 *
 * Generates a 4-second WebM video clip showing the best round replay:
 * - Map with country silhouettes
 * - City name dramatic reveal
 * - Click pin → bezier arc → correct pin
 * - Score + distance overlay
 *
 * Falls back to static PNG share card on unsupported browsers (iOS Safari).
 */

import { countries } from '@/data/countries';
import { getMapBounds } from '@/data/cities';
import { getPlayerLevel } from './levelSystem';

interface VideoRoundData {
  clickLat: number;
  clickLon: number;
  cityLat: number;
  cityLon: number;
  cityName: string;
  distance: number;
  score: number;
}

interface ShareVideoData {
  playerName: string;
  totalScore: number;
  mode: string;
  difficulty: string;
  bestRound: VideoRoundData;
  totalCities: number;
}

// ── Feature detection ──
export function canRecordVideo(): boolean {
  try {
    return (
      typeof MediaRecorder !== 'undefined' &&
      typeof HTMLCanvasElement.prototype.captureStream === 'function' &&
      MediaRecorder.isTypeSupported('video/webm')
    );
  } catch {
    return false;
  }
}

// ── Continent colors (matching WorldMapCanvas neon palette) ──
const CONTINENT_COUNTRIES: Record<string, Set<string>> = {
  Europe: new Set(['Albania','Austria','Belarus','Belgium','Bosnia and Herz.','Bulgaria','Croatia','Cyprus','Czechia','Denmark','Estonia','Finland','France','Germany','Greece','Hungary','Iceland','Ireland','Italy','Kosovo','Latvia','Lithuania','Luxembourg','Moldova','Montenegro','Netherlands','North Macedonia','Norway','Poland','Portugal','Romania','Russia','Serbia','Slovakia','Slovenia','Spain','Sweden','Switzerland','Ukraine','United Kingdom']),
  Asia: new Set(['Afghanistan','Armenia','Azerbaijan','Bangladesh','Bhutan','Cambodia','China','Georgia','India','Indonesia','Iran','Iraq','Israel','Japan','Jordan','Kazakhstan','Kuwait','Kyrgyzstan','Laos','Lebanon','Malaysia','Mongolia','Myanmar','Nepal','North Korea','Oman','Pakistan','Philippines','Qatar','Saudi Arabia','Singapore','South Korea','Sri Lanka','Syria','Taiwan','Tajikistan','Thailand','Turkey','Turkmenistan','United Arab Emirates','Uzbekistan','Vietnam','Yemen']),
  Africa: new Set(['Algeria','Angola','Benin','Botswana','Burkina Faso','Burundi','Cameroon','Central African Rep.','Chad','Congo','Côte d\'Ivoire','Dem. Rep. Congo','Egypt','Eq. Guinea','Eritrea','eSwatini','Ethiopia','Gabon','Ghana','Guinea','Kenya','Lesotho','Liberia','Libya','Madagascar','Malawi','Mali','Mauritania','Morocco','Mozambique','Namibia','Niger','Nigeria','Rwanda','Senegal','Sierra Leone','Somalia','South Africa','South Sudan','Sudan','Tanzania','Togo','Tunisia','Uganda','W. Sahara','Zambia','Zimbabwe']),
  Americas: new Set(['Argentina','Belize','Bolivia','Brazil','Canada','Chile','Colombia','Costa Rica','Cuba','Dominican Rep.','Ecuador','El Salvador','Guatemala','Guyana','Haiti','Honduras','Jamaica','Mexico','Nicaragua','Panama','Paraguay','Peru','Puerto Rico','Suriname','Trinidad and Tobago','United States of America','Uruguay','Venezuela']),
  Oceania: new Set(['Australia','Fiji','New Caledonia','New Zealand','Papua New Guinea','Solomon Is.']),
};

const CONTINENT_COLORS: Record<string, string> = {
  Europe: '#C87828',
  Asia: '#D45020',
  Africa: '#D4A030',
  Americas: '#1A8870',
  Oceania: '#20786C',
};

function getCountryColor(name: string): string {
  for (const [continent, set] of Object.entries(CONTINENT_COUNTRIES)) {
    if (set.has(name)) return CONTINENT_COLORS[continent] || '#3A4858';
  }
  return '#3A4858';
}

// ── Easing functions ──
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOutQuad = (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

// ── Score tier for visual theme ──
function getScoreTier(score: number) {
  if (score >= 800) return { emoji: '💎', color: '#a78bfa', label: 'PERFECT' };
  if (score >= 500) return { emoji: '🥇', color: '#f5c842', label: 'GREAT' };
  if (score >= 300) return { emoji: '🥈', color: '#94a3b8', label: 'GOOD' };
  return { emoji: '🥉', color: '#f97316', label: 'OK' };
}

// ── Main video generator ──
export async function generateShareVideo(data: ShareVideoData): Promise<Blob> {
  const W = 540;   // 9:16 vertical (TikTok/Reels optimized)
  const H = 960;
  const FPS = 30;
  const DURATION = 4; // seconds
  const TOTAL_FRAMES = FPS * DURATION;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Map projection setup — show world with some padding
  const bounds = getMapBounds('world');
  const mapY = 180;          // map starts at this Y
  const mapH = 400;          // map height on video canvas
  const mapW = W - 40;       // map width with side margins
  const mapX = 20;           // left margin

  const lonRange = bounds.lonMax - bounds.lonMin;
  const latRange = bounds.latMax - bounds.latMin;
  const mapScale = Math.min(mapW / lonRange, mapH / latRange);
  const mapOffX = mapX + (mapW - lonRange * mapScale) / 2;
  const mapOffY = mapY + (mapH - latRange * mapScale) / 2;

  const lonToX = (lon: number) => mapOffX + (lon - bounds.lonMin) * mapScale;
  const latToY = (lat: number) => mapOffY + (bounds.latMax - lat) * mapScale;

  const { bestRound } = data;
  const ux = lonToX(bestRound.clickLon);
  const uy = latToY(bestRound.clickLat);
  const cx = lonToX(bestRound.cityLon);
  const cy = latToY(bestRound.cityLat);

  // Bezier control point
  const mx = (ux + cx) / 2;
  const my = (uy + cy) / 2;
  const dx = cx - ux;
  const dy = cy - uy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const bulge = Math.min(dist * 0.2, 60);
  const cpx = mx - (dy / (dist || 1)) * bulge;
  const cpy = my + (dx / (dist || 1)) * bulge;

  const bezierPt = (t: number) => {
    const u = 1 - t;
    return {
      x: u * u * ux + 2 * u * t * cpx + t * t * cx,
      y: u * u * uy + 2 * u * t * cpy + t * t * cy,
    };
  };

  const tier = getScoreTier(bestRound.score);
  const level = getPlayerLevel();

  // ── Draw a single frame ──
  function drawFrame(frame: number) {
    const t = frame / TOTAL_FRAMES; // 0..1 over full duration

    // Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#0A0E18');
    bgGrad.addColorStop(0.5, '#0C1020');
    bgGrad.addColorStop(1, '#080C16');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // ── Phase 1: Title reveal (0-0.5s) ──
    const titleProgress = Math.min(t / 0.125, 1); // 0-0.5s = 0-0.125 of total
    const titleAlpha = easeOutCubic(titleProgress);

    // Logo text
    ctx.globalAlpha = titleAlpha;
    ctx.fillStyle = '#f5c842';
    ctx.font = 'bold 28px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('📍 GEOSPEED', W / 2, 50);

    // Player name + level
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText(`${data.playerName} · ${level.title}`, W / 2, 80);

    // City name - dramatic reveal
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px system-ui, sans-serif';
    const cityText = `¿Dónde está ${bestRound.cityName}?`;
    ctx.fillText(cityText, W / 2, 120);

    // Mode + difficulty badge
    ctx.fillStyle = '#64748b';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText(`${data.mode.toUpperCase()} · ${data.difficulty.toUpperCase()}`, W / 2, 145);
    ctx.globalAlpha = 1;

    // ── Draw map (always visible after phase 1) ──
    const mapAlpha = Math.min(titleProgress, 1);
    ctx.globalAlpha = mapAlpha;

    // Ocean background for map area
    ctx.fillStyle = '#0A0E18';
    ctx.fillRect(mapX, mapY, mapW, mapH);

    // Draw countries (simplified)
    for (const country of countries) {
      const fillColor = getCountryColor(country.name);
      ctx.fillStyle = fillColor;
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 0.5;
      for (const polygon of country.polygons) {
        if (polygon.length < 3) continue;
        ctx.beginPath();
        const startX = lonToX(polygon[0][0]);
        const startY = latToY(polygon[0][1]);
        ctx.moveTo(startX, startY);
        for (let i = 1; i < polygon.length; i++) {
          ctx.lineTo(lonToX(polygon[i][0]), latToY(polygon[i][1]));
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;

    // ── Phase 2: Click pin appears (0.5-1.0s) ──
    const clickPhase = Math.max(0, (t - 0.125) / 0.125); // 0.5-1.0s
    if (clickPhase > 0) {
      const clickProgress = easeOutCubic(Math.min(clickPhase, 1));
      const pinScale = clickProgress;

      // User click pin — cyan pulsing
      ctx.save();
      ctx.translate(ux, uy);
      ctx.scale(pinScale, pinScale);
      ctx.fillStyle = '#00D4AA';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // "Tu click" label
      if (clickProgress > 0.5) {
        ctx.globalAlpha = (clickProgress - 0.5) * 2;
        ctx.fillStyle = '#00D4AA';
        ctx.font = 'bold 11px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('📌 Tu click', ux, uy - 14);
        ctx.globalAlpha = 1;
      }
    }

    // ── Phase 3: Bezier arc animation (1.0-2.5s) ──
    const arcPhase = Math.max(0, (t - 0.25) / 0.375); // 1.0-2.5s
    if (arcPhase > 0) {
      const arcProgress = easeOutCubic(Math.min(arcPhase, 1));

      // Draw trail
      const steps = Math.max(Math.floor(arcProgress * 60), 2);
      for (let i = 0; i < steps - 1; i++) {
        const t0 = (i / steps) * arcProgress;
        const t1 = ((i + 1) / steps) * arcProgress;
        const p0 = bezierPt(t0);
        const p1 = bezierPt(t1);
        const alpha = 0.3 + 0.7 * (i / steps);
        ctx.strokeStyle = `rgba(240,160,48,${alpha})`;
        ctx.lineWidth = 2.5;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.stroke();
      }

      // Glowing tip
      if (arcProgress < 1) {
        const tip = bezierPt(arcProgress);
        const glow = ctx.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, 12);
        glow.addColorStop(0, 'rgba(240,160,48,0.9)');
        glow.addColorStop(0.5, 'rgba(240,160,48,0.3)');
        glow.addColorStop(1, 'rgba(240,160,48,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(tip.x, tip.y, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FF8C00';
        ctx.beginPath();
        ctx.arc(tip.x, tip.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Correct city pin (gold star) — appears when arc completes
      if (arcProgress >= 1) {
        drawStar(ctx, cx, cy, 5, 10, 5, '#f5c842');

        // Distance label on arc midpoint
        const labelPt = bezierPt(0.5);
        const distText = `${Math.round(bestRound.distance).toLocaleString()} km`;
        ctx.font = 'bold 13px system-ui, sans-serif';
        const tw = ctx.measureText(distText).width;
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        const bx = labelPt.x - tw / 2 - 8;
        const by = labelPt.y - 12;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(bx, by, tw + 16, 24, 6);
        else ctx.rect(bx, by, tw + 16, 24);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(distText, labelPt.x, labelPt.y);
        ctx.textBaseline = 'alphabetic';
      }
    }

    // ── Phase 4: Score reveal (2.5-4.0s) ──
    const scorePhase = Math.max(0, (t - 0.625) / 0.375); // 2.5-4.0s
    if (scorePhase > 0) {
      const scoreProgress = easeOutCubic(Math.min(scorePhase, 1));
      const scoreY = mapY + mapH + 40;

      ctx.globalAlpha = scoreProgress;

      // Score tier badge
      ctx.fillStyle = tier.color;
      ctx.font = 'bold 42px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(tier.emoji, W / 2, scoreY + 10);

      // Round score
      ctx.fillStyle = '#f5c842';
      ctx.font = 'bold 48px system-ui, sans-serif';
      ctx.fillText(`${bestRound.score.toLocaleString()}`, W / 2, scoreY + 65);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px system-ui, sans-serif';
      ctx.fillText('PUNTOS EN ESTA RONDA', W / 2, scoreY + 88);

      // Total score
      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 24px system-ui, sans-serif';
      ctx.fillText(`Total: ${data.totalScore.toLocaleString()} pts`, W / 2, scoreY + 130);

      // Cities completed
      ctx.fillStyle = '#64748b';
      ctx.font = '14px system-ui, sans-serif';
      ctx.fillText(`${data.totalCities} ciudades · ${data.mode}`, W / 2, scoreY + 158);

      // CTA
      if (scoreProgress > 0.5) {
        const ctaAlpha = (scoreProgress - 0.5) * 2;
        ctx.globalAlpha = ctaAlpha;
        ctx.fillStyle = '#f5c842';
        ctx.font = 'bold 16px system-ui, sans-serif';
        ctx.fillText('¿Puedes superarlo? 🌍', W / 2, H - 60);
        ctx.fillStyle = '#64748b';
        ctx.font = '13px system-ui, sans-serif';
        ctx.fillText('geospeed-challenge.vercel.app', W / 2, H - 35);
      }

      ctx.globalAlpha = 1;

      // Particle sparkles around score
      if (scoreProgress > 0.3) {
        const sparkleCount = 8;
        for (let i = 0; i < sparkleCount; i++) {
          const angle = (i / sparkleCount) * Math.PI * 2 + t * 4;
          const radius = 80 + Math.sin(t * 6 + i) * 20;
          const sx = W / 2 + Math.cos(angle) * radius * scoreProgress;
          const sy = scoreY + 50 + Math.sin(angle) * radius * 0.5 * scoreProgress;
          const sparkleAlpha = 0.3 + 0.4 * Math.sin(t * 8 + i * 2);
          ctx.fillStyle = `rgba(245, 200, 66, ${sparkleAlpha})`;
          ctx.beginPath();
          ctx.arc(sx, sy, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  // ── Record the animation ──
  const stream = canvas.captureStream(FPS);
  const recorder = new MediaRecorder(stream, {
    mimeType: 'video/webm;codecs=vp9',
    videoBitsPerSecond: 2_500_000,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

  return new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: 'video/webm' }));
    };
    recorder.onerror = () => reject(new Error('Recording failed'));

    recorder.start();

    let frame = 0;
    const renderLoop = () => {
      drawFrame(frame);
      frame++;
      if (frame < TOTAL_FRAMES) {
        requestAnimationFrame(renderLoop);
      } else {
        // One extra frame to ensure last frame is captured
        setTimeout(() => recorder.stop(), 100);
      }
    };
    requestAnimationFrame(renderLoop);
  });
}

// ── Share the video ──
export async function shareVideo(data: ShareVideoData): Promise<boolean> {
  if (!canRecordVideo()) return false;

  try {
    const blob = await generateShareVideo(data);
    const file = new File([blob], `geospeed-${data.totalScore}pts.webm`, { type: 'video/webm' });

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        title: `📍 GeoSpeed — ${data.totalScore.toLocaleString()} pts`,
        text: `Hice ${data.totalScore.toLocaleString()} puntos en GeoSpeed. ¿Puedes superarlo? 🌍`,
        files: [file],
      });
      return true;
    }

    // Fallback: download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `geospeed-${data.totalScore}pts.webm`;
    a.click();
    URL.revokeObjectURL(url);
    return true;
  } catch (e) {
    if ((e as Error).name === 'AbortError') return true; // User cancelled
    console.warn('Video share failed:', e);
    return false;
  }
}

// ── Helper: draw 5-pointed star ──
function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  spikes: number, outerR: number, innerR: number,
  color: string,
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  let rot = -Math.PI / 2;
  for (let i = 0; i < spikes; i++) {
    ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
    rot += Math.PI / spikes;
    ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
    rot += Math.PI / spikes;
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
