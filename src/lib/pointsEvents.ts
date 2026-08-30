const POINTS_CHANGED_EVENT = "twt:points-changed";

/** Fired by anything that just earned reward points (check-in, wine
 * rating) so GlobalTierCelebration can check for a newly crossed tier
 * right away instead of waiting for its periodic timer. */
export function notifyPointsChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(POINTS_CHANGED_EVENT));
}

export function onPointsChanged(handler: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(POINTS_CHANGED_EVENT, handler);
  return () => window.removeEventListener(POINTS_CHANGED_EVENT, handler);
}
