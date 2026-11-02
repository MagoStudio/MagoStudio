/**
 * The Clerk frontend API host a publishable key points at.
 *
 * A publishable key is `pk_test_` or `pk_live_` followed by base64 of the host
 * with a trailing `$`, so the host never has to be configured separately.
 *
 * The same rule exists in `desktop/shared/cloudConfig.ts`, which the main process
 * uses to build the Content Security Policy. It cannot be shared: that file
 * reads from `node:fs` and lives outside the renderer's build. Both are tested;
 * if this rule ever changes, both change.
 */
export const clerkFrontendApiHost = (publishableKey: string): string | null => {
  const encoded = publishableKey.replace(/^pk_(test|live)_/, "");
  if (encoded === publishableKey || !encoded) return null;
  try {
    const decoded =
      typeof atob === "function"
        ? atob(encoded)
        : Buffer.from(encoded, "base64").toString("utf8");
    const host = decoded.replace(/\$$/, "");
    return /^[a-z0-9.-]+$/i.test(host) ? host : null;
  } catch {
    return null;
  }
};
