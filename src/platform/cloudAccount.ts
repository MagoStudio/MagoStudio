/**
 * Whether there is a cloud Mago account behind this session.
 *
 * Distinct from `isCloudRenderAvailable`, which asks whether a *render* can be
 * submitted. Credits, prices, subscriptions and the paywall are all about the
 * account, and they should be as available in a signed-in desktop app as they are
 * on the web.
 *
 * Outside the desktop shell — the cloud web app, unit tests, Storybook — there is
 * always an account. Inside it, only when the user signed in rather than choosing
 * to work offline. This is the same trap as model availability: reading identity
 * mode directly would report "offline" for the web app, which has no bridge.
 */
export const isCloudAccountActive = (): boolean => {
  if (typeof window === "undefined") return true;
  if (!window.mago) return true;
  return window.mago.account?.mode === "cloud";
};

/**
 * Opens a URL outside the app.
 *
 * Stripe blocks embedded webviews, and a checkout or billing portal belongs in
 * the user's real browser where they can see the address bar. In the desktop app
 * `window.open` reaches the main process, which hands the URL to the system
 * browser and refuses to open a window; on the web it is an ordinary navigation.
 */
export const openExternalUrl = (url: string): void => {
  if (typeof window === "undefined") return;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return;
  }
  if (parsed.protocol !== "https:") return;

  if (window.mago) {
    window.open(parsed.href, "_blank", "noopener,noreferrer");
    return;
  }
  window.location.assign(parsed.href);
};
