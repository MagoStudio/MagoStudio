import {
  createServer as createHttpServer,
  Server as HttpServer
} from "node:http";
import { request as requestHttps } from "node:https";
import { AddressInfo } from "node:net";
import path from "node:path";
import { connect as connectTls } from "node:tls";

import { describe, expect, it, vi } from "vitest";

vi.mock("electron", () => ({
  app: {
    getPath: () => "/tmp/mago-test",
    commandLine: { appendSwitch: vi.fn() }
  }
}));

import {
  bundleCacheControl,
  buildContentSecurityPolicy,
  resolveBundlePath,
  startRendererOrigin
} from "./rendererOrigin";
import { generateSelfSignedCertificate } from "./selfSignedCertificate";

const CONFIG = {
  rendererHost: "desktop.app.mago.studio",
  clerkPublishableKey: "pk_live_Y2xlcmsuYXBwLm1hZ28uc3R1ZGlvJA",
  backendUrl: "https://app.mago.studio/api/v02",
  mediaHosts: ["https://img.clerk.com"],
  signInNavigationHosts: ["accounts.google.com"],
  cloudStatusUrl: "https://mago-state-25qdhq4f4q-uc.a.run.app/state",
  cloudStorageHosts: ["mago-s3-prod.s3.eu-north-1.amazonaws.com"],
  voicePreviewSources: ["https://storage.googleapis.com/eleven-public-prod/"]
};

const ROOT = path.resolve("/renderer/out");

const listen = async (server: HttpServer): Promise<number> => {
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  return (server.address() as AddressInfo).port;
};

const close = (server: HttpServer): Promise<void> =>
  new Promise((resolve) => server.close(() => resolve()));

describe("resolveBundlePath", () => {
  it("maps the root to index.html", () => {
    expect(resolveBundlePath(ROOT, "/")).toBe(path.join(ROOT, "index.html"));
  });

  it("maps an extensionless route to its exported index", () => {
    expect(resolveBundlePath(ROOT, "/payment/")).toBe(
      path.join(ROOT, "payment", "index.html")
    );
  });

  it("serves assets with an extension directly", () => {
    expect(resolveBundlePath(ROOT, "/_next/static/app.js")).toBe(
      path.join(ROOT, "_next", "static", "app.js")
    );
  });

  it("ignores the query string", () => {
    expect(resolveBundlePath(ROOT, "/app.js?v=2")).toBe(
      path.join(ROOT, "app.js")
    );
  });

  it("refuses traversal out of the bundle", () => {
    for (const attempt of [
      "/../secrets.txt",
      "/../../etc/passwd",
      "/%2e%2e/%2e%2e/etc/passwd",
      "/a/../../outside.js"
    ]) {
      expect(resolveBundlePath(ROOT, attempt)).toBeNull();
    }
  });

  it("refuses malformed encodings and null bytes", () => {
    expect(resolveBundlePath(ROOT, "/%ZZ")).toBeNull();
    expect(resolveBundlePath(ROOT, "/a%00.js")).toBeNull();
  });
});

describe("bundleCacheControl", () => {
  it("caches content-hashed Next assets but never the route HTML", () => {
    expect(bundleCacheControl("/_next/static/chunks/app-123.js")).toBe(
      "public, max-age=31536000, immutable"
    );
    expect(bundleCacheControl("/_next/static/css/app.css?v=1")).toBe(
      "public, max-age=31536000, immutable"
    );
    expect(bundleCacheControl("/")).toBe("no-store");
    expect(bundleCacheControl("/script-project")).toBe("no-store");
  });
});

describe("buildContentSecurityPolicy", () => {
  it("allows Clerk's frontend API for scripts and connections", () => {
    const policy = buildContentSecurityPolicy(CONFIG);

    expect(policy).toContain(
      "script-src 'self' 'unsafe-inline' https://clerk.app.mago.studio"
    );
    expect(policy).toContain("https://clerk.app.mago.studio");
  });

  it("allows the backend origin for connections but not for scripts", () => {
    const policy = buildContentSecurityPolicy(CONFIG);
    const connect = policy
      .split("; ")
      .find((directive: string) => directive.startsWith("connect-src"));
    const script = policy
      .split("; ")
      .find((directive: string) => directive.startsWith("script-src"));

    expect(connect).toContain("https://app.mago.studio");
    expect(script).not.toContain("https://app.mago.studio/api");
  });

  it("allows the cloud status host for connections so maintenance can be detected", () => {
    const policy = buildContentSecurityPolicy(CONFIG);
    const connect = policy
      .split("; ")
      .find((directive: string) => directive.startsWith("connect-src"));

    expect(connect).toContain("https://mago-state-25qdhq4f4q-uc.a.run.app");
  });

  it("keeps local media and the hardening directives", () => {
    const policy = buildContentSecurityPolicy(CONFIG);

    expect(policy).toContain("media-src 'self' blob: mago-media:");
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("base-uri 'none'");
    expect(policy).toContain("frame-ancestors 'none'");
  });

  it("lets voice previews play from Mago's storage and the ElevenLabs bucket", () => {
    const media = buildContentSecurityPolicy(CONFIG)
      .split("; ")
      .find((directive: string) => directive.startsWith("media-src"));

    expect(media).toBe(
      "media-src 'self' blob: mago-media: https://mago-s3-prod.s3.eu-north-1.amazonaws.com https://storage.googleapis.com/eleven-public-prod/"
    );
  });

  it("omits remote origins entirely when no cloud is configured", () => {
    const policy = buildContentSecurityPolicy({
      ...CONFIG,
      clerkPublishableKey: "",
      backendUrl: "",
      mediaHosts: [],
      signInNavigationHosts: [],
      cloudStatusUrl: ""
    });

    expect(policy).not.toContain("https://");
    expect(policy).toContain("connect-src 'self' mago-media: data:");
  });
});

describe("development renderer proxy", () => {
  it("serves the Next upstream through the pinned HTTPS origin", async () => {
    let forwardedHost = "";
    const upstream = createHttpServer((request, response) => {
      forwardedHost = request.headers.host ?? "";
      response.writeHead(200, { "Content-Type": "text/plain" }).end("proxied");
    });
    const upstreamPort = await listen(upstream);
    const certificate = generateSelfSignedCertificate({
      hostname: CONFIG.rendererHost
    });
    const origin = await startRendererOrigin({
      upstreamUrl: `http://127.0.0.1:${upstreamPort}`,
      certificate,
      port: 0,
      config: CONFIG
    });

    try {
      const result = await new Promise<{ body: string; status: number }>(
        (resolve, reject) => {
          const request = requestHttps(
            {
              host: "127.0.0.1",
              port: origin.port,
              path: "/test?value=1",
              servername: CONFIG.rendererHost,
              rejectUnauthorized: false,
              headers: { host: CONFIG.rendererHost }
            },
            (response) => {
              let body = "";
              response.setEncoding("utf8");
              response.on("data", (chunk) => (body += chunk));
              response.on("end", () =>
                resolve({ body, status: response.statusCode ?? 0 })
              );
            }
          );
          request.on("error", reject).end();
        }
      );

      expect(result).toEqual({ body: "proxied", status: 200 });
      expect(forwardedHost).toBe(`127.0.0.1:${upstreamPort}`);
    } finally {
      await origin.close();
      await close(upstream);
    }
  });

  it("proxies WebSocket upgrades used by Next hot reload", async () => {
    const upstream = createHttpServer();
    upstream.on("upgrade", (_request, socket) => {
      socket.end(
        "HTTP/1.1 101 Switching Protocols\r\n" +
          "Upgrade: websocket\r\n" +
          "Connection: Upgrade\r\n" +
          "X-Proxy-Test: forwarded\r\n\r\nhello"
      );
    });
    const upstreamPort = await listen(upstream);
    const certificate = generateSelfSignedCertificate({
      hostname: CONFIG.rendererHost
    });
    const origin = await startRendererOrigin({
      upstreamUrl: `http://127.0.0.1:${upstreamPort}`,
      certificate,
      port: 0,
      config: CONFIG
    });

    try {
      const response = await new Promise<string>((resolve, reject) => {
        const socket = connectTls({
          host: "127.0.0.1",
          port: origin.port,
          servername: CONFIG.rendererHost,
          rejectUnauthorized: false
        });
        let received = "";
        socket.setEncoding("utf8");
        socket.once("secureConnect", () => {
          socket.write(
            "GET /_next/hmr HTTP/1.1\r\n" +
              `Host: ${CONFIG.rendererHost}\r\n` +
              "Connection: Upgrade\r\n" +
              "Upgrade: websocket\r\n\r\n"
          );
        });
        socket.on("data", (chunk) => (received += chunk));
        socket.once("end", () => resolve(received));
        socket.once("error", reject);
      });

      expect(response).toContain("HTTP/1.1 101 Switching Protocols");
      expect(response).toContain("Upgrade: websocket");
      expect(response).toContain("X-Proxy-Test: forwarded");
      expect(response.endsWith("hello")).toBe(true);
    } finally {
      await origin.close();
      await close(upstream);
    }
  });
});
