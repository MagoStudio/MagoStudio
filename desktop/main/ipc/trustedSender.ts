import { app, type IpcMainInvokeEvent } from "electron";

import { resolveCloudConfig } from "../../shared/cloudConfig";

/**
 * Single gate for every IPC handler: only the renderer we serve may drive the
 * desktop bridge.
 *
 * Compares parsed origins rather than URL prefixes. A prefix test against a bare
 * hostname would accept `https://desktop.app.mago.studio.example.com/`, which is
 * a different site entirely.
 */

const DEVELOPMENT_HOSTNAMES = new Set(["127.0.0.1", "localhost"]);

export const isTrustedSenderUrl = (
  senderUrl: string,
  rendererHost: string,
  allowDevelopment: boolean
): boolean => {
  let url: URL;
  try {
    url = new URL(senderUrl);
  } catch {
    return false;
  }
  if (url.protocol === "https:" && url.hostname === rendererHost) return true;
  return (
    allowDevelopment &&
    url.protocol === "http:" &&
    DEVELOPMENT_HOSTNAMES.has(url.hostname)
  );
};

export const requireTrustedSender = (event: IpcMainInvokeEvent): void => {
  const senderUrl = event.senderFrame?.url ?? "";
  const trusted = isTrustedSenderUrl(
    senderUrl,
    resolveCloudConfig().rendererHost,
    !app.isPackaged
  );
  if (!trusted) {
    throw new Error("Blocked desktop request from an untrusted renderer");
  }
};
