import path from "node:path";

import { app } from "electron";

/**
 * The `mago://` scheme, used to hand control back to the app after work that has
 * to happen in the user's real browser.
 *
 * Registration is only half of it: on Windows and Linux a second launch of the
 * executable carries the URL in argv rather than reaching the running instance,
 * so the app needs the single-instance lock to forward it. macOS delivers it
 * through the `open-url` event instead.
 */

export const DEEP_LINK_SCHEME = "mago";

export const registerDeepLinkScheme = (): void => {
  if (process.defaultApp && process.argv.length >= 2) {
    // Unpackaged: the executable is Electron itself, so the registration has to
    // name the script it should run.
    app.setAsDefaultProtocolClient(DEEP_LINK_SCHEME, process.execPath, [
      path.resolve(process.argv[1] ?? "")
    ]);
    return;
  }
  app.setAsDefaultProtocolClient(DEEP_LINK_SCHEME);
};

export const findDeepLink = (argv: readonly string[]): string | null =>
  argv.find((value) => value.startsWith(`${DEEP_LINK_SCHEME}://`)) ?? null;

export interface DeepLink {
  action: string;
  params: Record<string, string>;
}

/**
 * Parses `mago://action?key=value`. Returns null for anything unrecognised
 * rather than guessing, because these URLs arrive from outside the app.
 */
export const parseDeepLink = (value: string): DeepLink | null => {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== `${DEEP_LINK_SCHEME}:`) return null;

  // mago://auth?x=1 parses with hostname "auth"; mago:///auth?x=1 with pathname.
  const action = (url.hostname || url.pathname.replace(/^\/+/, "")).replace(
    /\/+$/,
    ""
  );
  if (!/^[a-z0-9-]+$/i.test(action)) return null;

  const params: Record<string, string> = {};
  for (const [key, parameter] of url.searchParams) params[key] = parameter;
  return { action, params };
};

/**
 * Wires up every route a deep link can arrive by. `onLink` may be called before
 * a window exists, so callers must be able to queue.
 */
export const listenForDeepLinks = (
  onLink: (link: DeepLink) => void
): boolean => {
  const gotLock = app.requestSingleInstanceLock();
  if (!gotLock) return false;

  const handle = (value: string | null) => {
    if (!value) return;
    const link = parseDeepLink(value);
    if (link) onLink(link);
  };

  // Windows and Linux: the second launch hands its argv to the first instance.
  app.on("second-instance", (_event, argv) => handle(findDeepLink(argv)));
  // macOS.
  app.on("open-url", (event, url) => {
    event.preventDefault();
    handle(url);
  });
  // A cold start caused by the link itself.
  handle(findDeepLink(process.argv));

  return true;
};
