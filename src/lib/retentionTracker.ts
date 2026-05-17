/**
 * GeoSpeed — Retention Tracker
 *
 * Tracks D1, D7, D30 retention by recording install date
 * and firing analytics events on qualifying days.
 */

import { trackEvent } from './analytics';

const INSTALL_KEY = 'geospeed_install_date';
const RETENTION_PREFIX = 'geospeed_retention_';

/**
 * Record install date if not already set.
 * Call this on every app launch.
 */
export function recordInstallDate(): void {
  if (!localStorage.getItem(INSTALL_KEY)) {
    localStorage.setItem(INSTALL_KEY, new Date().toISOString().split('T')[0]);
  }
}

/**
 * Check and fire retention events.
 * Should be called once per session (on app launch after recordInstallDate).
 *
 * Fires track_retention event for D1, D7, D30 milestones.
 * Each milestone fires only once (idempotent).
 */
export function checkRetention(): void {
  const installStr = localStorage.getItem(INSTALL_KEY);
  if (!installStr) return;

  const install = new Date(installStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - install.getTime()) / (1000 * 60 * 60 * 24));

  const milestones = [
    { day: 1, label: 'D1' },
    { day: 7, label: 'D7' },
    { day: 30, label: 'D30' },
  ];

  for (const { day, label } of milestones) {
    const key = `${RETENTION_PREFIX}${label}`;
    if (diffDays >= day && !localStorage.getItem(key)) {
      localStorage.setItem(key, new Date().toISOString());
      trackEvent('track_retention', {
        milestone: label,
        days_since_install: diffDays,
        install_date: installStr,
      });
    }
  }
}

/**
 * Get retention status for display/debugging.
 */
export function getRetentionStatus(): {
  installDate: string | null;
  daysSinceInstall: number;
  milestonesHit: string[];
} {
  const installStr = localStorage.getItem(INSTALL_KEY);
  if (!installStr) return { installDate: null, daysSinceInstall: 0, milestonesHit: [] };

  const install = new Date(installStr);
  const diffDays = Math.floor((Date.now() - install.getTime()) / (1000 * 60 * 60 * 24));

  const milestonesHit: string[] = [];
  for (const label of ['D1', 'D7', 'D30']) {
    if (localStorage.getItem(`${RETENTION_PREFIX}${label}`)) {
      milestonesHit.push(label);
    }
  }

  return { installDate: installStr, daysSinceInstall: diffDays, milestonesHit };
}
