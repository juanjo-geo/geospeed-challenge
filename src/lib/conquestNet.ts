/**
 * Conquista (C7): cuánto pesa la red en el tiempo de cada ronda. Por la regla aprobada, el servidor mide desde que abre
 * la ronda hasta que recibe el toque, así que el jugador pierde el viaje de la pregunta hasta el teléfono y el del toque
 * de vuelta. Aquí se compara el tiempo que el jugador tuvo la pregunta en pantalla (reloj del teléfono) con el que contó
 * el servidor: la diferencia es el retraso de la red, y con la fórmula se estima cuántos puntos costó. Se envía a GA4
 * (`conq_latency`) y los teléfonos de prueba lo ven al final de cada misión. Si en QA distorsiona, se compensa con otra
 * versión de reglas entre temporadas, nunca dentro de una.
 */
import { Capacitor } from '@capacitor/core';
import { conqPoints } from './conquest';
import { trackEvent } from './analytics';

/** Una ronda respondida en este teléfono (no se mide la que se retomó tras recargar: falta cuándo apareció) */
export interface NetSample {
  idx: number;
  /** Desde pedir la ronda hasta tenerla (la pregunta aparece en ese momento) */
  openRttMs: number;
  /** Pregunta en pantalla → toque, con el reloj del teléfono */
  thinkMs: number;
  /** Toque → confirmación del servidor */
  answerRttMs: number;
  /** Tiempo que contó el servidor */
  serverS: number;
  km: number | null;
}
export interface NetSummary { rounds: number; avgDelayMs: number; maxDelayMs: number; avgRttMs: number; lostPoints: number }
export interface NetRecord extends NetSummary { at: number; iso: string; net: string; native: boolean }

const LOG_KEY = 'geospeed_conq_net';
const SENT_KEY = 'geospeed_conq_net_sent';
const LOG_MAX = 30;

/** Lo que el servidor contó de más en una ronda */
export const roundDelayMs = (s: NetSample) => Math.max(0, Math.round(s.serverS * 1000 - s.thinkMs));

/** Puntos que habría dado la ronda con el tiempo que vio el jugador, menos los que dio el servidor */
export function lostPoints(s: NetSample, seconds = 15): number {
  if (s.km == null) return 0;
  return Math.max(0, conqPoints(s.km, s.thinkMs / 1000, seconds) - conqPoints(s.km, s.serverS, seconds));
}

export function summarizeNet(samples: NetSample[], seconds = 15): NetSummary | null {
  if (!samples.length) return null;
  const delays = samples.map(roundDelayMs);
  const rtts = samples.map((s) => (s.openRttMs + s.answerRttMs) / 2);
  const avg = (xs: number[]) => Math.round(xs.reduce((a, b) => a + b, 0) / xs.length);
  return {
    rounds: samples.length,
    avgDelayMs: avg(delays),
    maxDelayMs: Math.max(...delays),
    avgRttMs: avg(rtts),
    lostPoints: samples.reduce((a, s) => a + lostPoints(s, seconds), 0),
  };
}

export function connectionType(): string {
  try {
    const c = (navigator as Navigator & { connection?: { effectiveType?: string } }).connection;
    return c?.effectiveType ?? 'unknown';
  } catch { return 'unknown'; }
}
const isNative = () => { try { return Capacitor.isNativePlatform(); } catch { return false; } };

export function netLog(): NetRecord[] {
  try {
    const v = JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
    return Array.isArray(v) ? v : [];
  } catch { return []; }
}

/** Promedio de las últimas misiones medidas en este teléfono */
export function netAverage(log: NetRecord[] = netLog()): { missions: number; avgDelayMs: number; lostPoints: number } | null {
  if (!log.length) return null;
  const rounds = log.reduce((a, r) => a + r.rounds, 0);
  return {
    missions: log.length,
    avgDelayMs: Math.round(log.reduce((a, r) => a + r.avgDelayMs * r.rounds, 0) / Math.max(1, rounds)),
    lostPoints: Math.round(log.reduce((a, r) => a + r.lostPoints, 0) / log.length),
  };
}

/** Guarda y envía la medición de una misión una sola vez (el resultado puede volver a montarse) */
export function reportMissionNet(attemptId: string, iso: string, samples: NetSample[], seconds = 15): NetSummary | null {
  const sum = summarizeNet(samples, seconds);
  if (!sum) return null;
  try {
    const sent: string[] = JSON.parse(localStorage.getItem(SENT_KEY) || '[]');
    if (sent.includes(attemptId)) return sum;
    localStorage.setItem(SENT_KEY, JSON.stringify([...sent, attemptId].slice(-LOG_MAX)));
    const rec: NetRecord = { ...sum, at: Date.now(), iso, net: connectionType(), native: isNative() };
    localStorage.setItem(LOG_KEY, JSON.stringify([...netLog(), rec].slice(-LOG_MAX)));
    trackEvent('conq_latency', {
      rounds: sum.rounds, avg_delay_ms: sum.avgDelayMs, max_delay_ms: sum.maxDelayMs, avg_rtt_ms: sum.avgRttMs,
      lost_points: sum.lostPoints, net: rec.net, native: rec.native, iso,
    });
  } catch { /* sin almacenamiento: solo se muestra */ }
  return sum;
}
