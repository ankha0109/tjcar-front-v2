"use client";

export const PREMIUM_INFO_CHANNEL = "premium-info:open";

/**
 * Ask the app-level `PremiumInfoModalRoot` to explain Premium membership.
 *
 * The modal cannot live inside its trigger: `PremiumBadge` renders inside the
 * card `<Link>`, and React portals bubble events through the React tree, not
 * the DOM — so a modal mounted under the badge would send every click inside
 * it (close button, CTA, mask) straight to that `<Link>` and navigate away.
 * Dispatching instead keeps the modal mounted outside every card.
 */
export function openPremiumInfo() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(PREMIUM_INFO_CHANNEL));
}
