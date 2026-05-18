// Centralizes pre-paywall constants and the Pro-status hook so the rest of
// the app can already wire paywall surfaces (top-right upgrade chip, sidebar
// CTA, free-tier signaling) before real billing exists. When you integrate
// RevenueCat / StoreKit / Stripe, you only have to change this file.

export const FREE_TIER_ALERT_LIMIT = 100;

/**
 * Returns whether the current user is on Wick Pro. Stubbed to `false` until
 * real billing is wired up — every paywall surface in the app reads from
 * here, so flipping this single source of truth lights everything up.
 */
export function useIsPro(): boolean {
  return false;
}
