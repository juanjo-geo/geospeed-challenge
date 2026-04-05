/**
 * Haptic feedback module for mobile devices.
 * Uses the Vibration API (navigator.vibrate) which is widely supported
 * on Android and partially on iOS (via WebKit).
 * Gracefully degrades — no-ops on unsupported browsers/desktop.
 */

function canVibrate(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
}

/** Light tap — map click, button press */
export function hapticTap() {
  if (canVibrate()) navigator.vibrate(15);
}

/** Medium pulse — correct answer, good result */
export function hapticSuccess() {
  if (canVibrate()) navigator.vibrate([30, 50, 30]);
}

/** Strong buzz — wrong answer, time's up */
export function hapticError() {
  if (canVibrate()) navigator.vibrate([60, 40, 80]);
}

/** Double tap — new record, achievement unlocked */
export function hapticCelebration() {
  if (canVibrate()) navigator.vibrate([20, 40, 20, 40, 60]);
}

/** Quick tick — timer warning */
export function hapticTick() {
  if (canVibrate()) navigator.vibrate(8);
}
