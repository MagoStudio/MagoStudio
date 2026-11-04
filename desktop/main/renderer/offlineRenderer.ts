import path from "node:path";
import { pathToFileURL } from "node:url";

import { net, type Session } from "electron";

import type { CloudConfig } from "../../shared/cloudConfig";

import {
  buildContentSecurityPolicy,
  bundleCacheControl,
  resolveBundlePath
} from "./rendererOrigin";

/** Keep the existing origin/storage, but read the offline UI without DNS or TLS. */
export const installOfflineRenderer = (
  session: Session,
  rendererRoot: string,
  config: CloudConfig
): void => {
  const origin = `https://${config.rendererHost}`;
  const policy = buildContentSecurityPolicy(config);
  session.protocol.handle("https", async (request) => {
    const url = new URL(request.url);
    if (url.origin !== origin) {
      return net.fetch(request, { bypassCustomProtocolHandlers: true });
    }
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method not allowed", { status: 405 });
    }
    const filePath = resolveBundlePath(rendererRoot, url.pathname);
    if (!filePath) return new Response("Forbidden", { status: 403 });
    try {
      const file = await net.fetch(pathToFileURL(filePath).href);
      const headers = new Headers(file.headers);
      headers.set("Content-Security-Policy", policy);
      headers.set("X-Content-Type-Options", "nosniff");
      headers.set("Cache-Control", bundleCacheControl(url.pathname));
      // Chromium's file loader may infer a different type for exported routes.
      if (path.extname(filePath) === ".html") {
        headers.set("Content-Type", "text/html; charset=utf-8");
      }
      return new Response(request.method === "HEAD" ? null : file.body, {
        status: file.status,
        headers
      });
    } catch {
      return new Response("Not found", { status: 404 });
    }
  });
};
