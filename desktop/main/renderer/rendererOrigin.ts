import { createPrivateKey, X509Certificate } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, readFile, stat } from "node:fs/promises";
import { request as requestHttp } from "node:http";
import { createServer, request as requestHttps, Server } from "node:https";
import { AddressInfo } from "node:net";
import path from "node:path";

import { app, Session } from "electron";

import {
  CloudConfig,
  cloudOrigins,
  resolveCloudConfig
} from "../../shared/cloudConfig";
import { atomicWriteFile } from "../storage/atomicFile";

import {
  fingerprintOf,
  generateSelfSignedCertificate
} from "./selfSignedCertificate";

/**
 * Serves the packaged renderer from a real https origin.
 *
 * The renderer needs a genuine https origin that is a subdomain of the Clerk
 * primary domain, otherwise Clerk cannot hold its session cookies and OAuth
 * cannot work. Rather than intercepting the https scheme — which cannot forward
 * top-level cross-origin navigation, and so breaks OAuth outright — a single
 * hostname is mapped to this loopback TLS listener with Chromium's
 * host-resolver-rules. Every other request stays on Chromium's own network
 * stack and behaves exactly as it does in a browser.
 */

const CERTIFICATE_DIRECTORY = "origin";
const CERTIFICATE_FILE = "renderer-cert.pem";
const PRIVATE_KEY_FILE = "renderer-key.pem";
const OWNER_ONLY = 0o600;
const RENEW_WITHIN_DAYS = 30;
const MAX_PORT_EXCLUSIVE = 65536;
const HTTP_OK = 200;
const HTTP_SWITCHING_PROTOCOLS = 101;
const HTTP_BAD_GATEWAY = 502;
const HTTP_FORBIDDEN = 403;
const HTTP_NOT_FOUND = 404;
const MS_PER_DAY = 86_400_000;
const IMMUTABLE_ASSET_CACHE_CONTROL = "public, max-age=31536000, immutable";

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".map": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".wasm": "application/wasm"
};

export interface RendererCertificate {
  certificatePem: string;
  privateKeyPem: string;
  fingerprint: string;
}

const isUsable = (certificatePem: string, hostname: string): boolean => {
  try {
    const certificate = new X509Certificate(certificatePem);
    if (certificate.checkHost(hostname) !== hostname) return false;
    const expiresAt = new Date(certificate.validTo).getTime();
    return expiresAt - Date.now() > RENEW_WITHIN_DAYS * MS_PER_DAY;
  } catch {
    return false;
  }
};

/**
 * Loads the per-install certificate, generating one on first run. Nothing is
 * shipped: the key is created on this machine and never leaves it.
 */
export const ensureRendererCertificate = async (
  hostname: string,
  directory = path.join(app.getPath("userData"), CERTIFICATE_DIRECTORY)
): Promise<RendererCertificate> => {
  const certificatePath = path.join(directory, CERTIFICATE_FILE);
  const privateKeyPath = path.join(directory, PRIVATE_KEY_FILE);

  try {
    const [certificatePem, privateKeyPem] = await Promise.all([
      readFile(certificatePath, "utf8"),
      readFile(privateKeyPath, "utf8")
    ]);
    if (
      isUsable(certificatePem, hostname) &&
      new X509Certificate(certificatePem).checkPrivateKey(
        createPrivateKey(privateKeyPem)
      )
    ) {
      return {
        certificatePem,
        privateKeyPem,
        fingerprint: fingerprintOf(certificatePem)
      };
    }
  } catch {
    // No usable certificate on disk yet; fall through and issue one.
  }

  const issued = generateSelfSignedCertificate({ hostname });
  await mkdir(directory, { recursive: true });
  await atomicWriteFile(certificatePath, issued.certificatePem, {
    mode: OWNER_ONLY
  });
  await atomicWriteFile(privateKeyPath, issued.privateKeyPem, {
    mode: OWNER_ONLY
  });
  return {
    certificatePem: issued.certificatePem,
    privateKeyPem: issued.privateKeyPem,
    fingerprint: issued.fingerprint
  };
};

export const buildContentSecurityPolicy = (config: CloudConfig): string => {
  const { clerk, backend, cloudStatus, media, voicePreviewAudio } =
    cloudOrigins(config);
  const remote = (...values: (string | null)[]) =>
    values.filter((value): value is string => value !== null).join(" ");

  return [
    "default-src 'self'",
    // Clerk loads clerk-js from its frontend API; Next's static export carries
    // small inline bootstrap scripts.
    `script-src 'self' 'unsafe-inline' ${remote(clerk)}`.trim(),
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: mago-media: ${remote(clerk, ...media)}`.trim(),
    "font-src 'self' data:",
    `media-src 'self' blob: mago-media: ${remote(...voicePreviewAudio)}`.trim(),
    "worker-src 'self' blob:",
    `connect-src 'self' mago-media: data: ${remote(clerk, backend, cloudStatus)}`.trim(),
    // Clerk renders parts of some flows in an iframe on its own origin.
    `frame-src 'self' ${remote(clerk)}`.trim(),
    "object-src 'none'",
    "base-uri 'none'",
    "frame-ancestors 'none'"
  ].join("; ");
};

/** Resolve a request path inside the bundle, refusing anything that escapes it. */
export const resolveBundlePath = (
  rendererRoot: string,
  requestPath: string
): string | null => {
  const withoutQuery = requestPath.split("?")[0] ?? "/";
  let decoded: string;
  try {
    decoded = decodeURIComponent(withoutQuery);
  } catch {
    return null;
  }
  if (decoded.includes("\0")) return null;

  const relative = decoded === "/" ? "index.html" : decoded.replace(/^\/+/, "");
  // Next exports directories with trailing slashes; map those to their index.
  const candidate = path.extname(relative)
    ? relative
    : path.join(relative, "index.html");

  const resolved = path.resolve(rendererRoot, candidate);
  const root = path.resolve(rendererRoot);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) return null;
  return resolved;
};

export const bundleCacheControl = (requestPath: string): string =>
  (requestPath.split("?")[0] ?? "").startsWith("/_next/static/")
    ? IMMUTABLE_ASSET_CACHE_CONTROL
    : "no-store";

export interface RendererOrigin {
  host: string;
  port: number;
  url: string;
  fingerprint: string;
  close: () => Promise<void>;
}

type RendererSource =
  | { rendererRoot: string; upstreamUrl?: never }
  | { rendererRoot?: never; upstreamUrl: string };

/**
 * Fixed rather than ephemeral, because `installHostResolverRule` has to run
 * synchronously at module load — Chromium reads the switch while starting its
 * network service, long before an async bind could report a port. Overridable
 * for the rare case where something else already holds this port.
 */
export const DEFAULT_RENDERER_PORT = 47821;

export const rendererPort = (
  environment: Record<string, string | undefined> = process.env
): number => {
  const configured = Number(environment.MAGO_RENDERER_PORT);
  return Number.isInteger(configured) &&
    configured > 0 &&
    configured < MAX_PORT_EXCLUSIVE
    ? configured
    : DEFAULT_RENDERER_PORT;
};

/**
 * Starts the loopback listener on the port the resolver rule already points at.
 */
export const startRendererOrigin = async (
  options: {
    certificate: RendererCertificate;
    port: number;
    config?: CloudConfig;
  } & RendererSource
): Promise<RendererOrigin> => {
  const config = options.config ?? resolveCloudConfig();
  const contentSecurityPolicy = buildContentSecurityPolicy(config);
  const { certificate } = options;
  const rendererRoot = options.rendererRoot;
  const upstream = options.upstreamUrl ? new URL(options.upstreamUrl) : null;
  if (
    upstream &&
    upstream.protocol !== "http:" &&
    upstream.protocol !== "https:"
  ) {
    throw new Error(
      `Unsupported renderer upstream protocol: ${upstream.protocol}`
    );
  }
  const requestUpstream =
    upstream?.protocol === "https:" ? requestHttps : requestHttp;
  const upstreamPath = (requestPath: string): string => {
    if (!upstream || upstream.pathname === "/") return requestPath;
    return `${upstream.pathname.replace(/\/$/, "")}${requestPath}`;
  };

  const server: Server = createServer(
    { cert: certificate.certificatePem, key: certificate.privateKeyPem },
    (request, response) => {
      if (upstream) {
        const proxyRequest = requestUpstream(
          upstream,
          {
            method: request.method,
            path: upstreamPath(request.url ?? "/"),
            headers: { ...request.headers, host: upstream.host }
          },
          (proxyResponse) => {
            response.writeHead(
              proxyResponse.statusCode ?? HTTP_BAD_GATEWAY,
              proxyResponse.headers
            );
            proxyResponse.pipe(response);
          }
        );
        proxyRequest.on("error", (error) => {
          if (response.headersSent) {
            response.destroy(error);
            return;
          }
          response.writeHead(HTTP_BAD_GATEWAY).end("Renderer unavailable");
        });
        request.pipe(proxyRequest);
        return;
      }

      void (async () => {
        if (!rendererRoot) {
          response.writeHead(HTTP_BAD_GATEWAY).end("Renderer unavailable");
          return;
        }
        const filePath = resolveBundlePath(rendererRoot, request.url ?? "/");
        if (!filePath) {
          response.writeHead(HTTP_FORBIDDEN).end("Forbidden");
          return;
        }
        try {
          const stats = await stat(filePath);
          if (!stats.isFile()) {
            response.writeHead(HTTP_NOT_FOUND).end("Not found");
            return;
          }
          response.writeHead(HTTP_OK, {
            "Content-Type":
              MIME_TYPES[path.extname(filePath).toLowerCase()] ??
              "application/octet-stream",
            "Content-Length": String(stats.size),
            "Content-Security-Policy": contentSecurityPolicy,
            "X-Content-Type-Options": "nosniff",
            // Next content-hashes everything under _next/static, so those files are safe across
            // launches. HTML remains uncached so an app upgrade always selects the new hashes.
            "Cache-Control": bundleCacheControl(request.url ?? "/")
          });
          createReadStream(filePath).pipe(response);
        } catch {
          response.writeHead(HTTP_NOT_FOUND).end("Not found");
        }
      })();
    }
  );

  if (upstream) {
    server.on("upgrade", (request, socket, head) => {
      const proxyRequest = requestUpstream({
        protocol: upstream.protocol,
        hostname: upstream.hostname,
        port: upstream.port,
        method: request.method,
        path: upstreamPath(request.url ?? "/"),
        headers: { ...request.headers, host: upstream.host }
      });
      proxyRequest.on("upgrade", (proxyResponse, proxySocket, proxyHead) => {
        const statusCode = proxyResponse.statusCode ?? HTTP_SWITCHING_PROTOCOLS;
        const statusMessage =
          proxyResponse.statusMessage ?? "Switching Protocols";
        const headers: string[] = [];
        for (
          let index = 0;
          index < proxyResponse.rawHeaders.length;
          index += 2
        ) {
          headers.push(
            `${proxyResponse.rawHeaders[index]}: ${proxyResponse.rawHeaders[index + 1]}`
          );
        }
        socket.write(
          `HTTP/1.1 ${statusCode} ${statusMessage}\r\n${headers.join("\r\n")}\r\n\r\n`
        );
        if (proxyHead.length > 0) socket.write(proxyHead);
        if (head.length > 0) proxySocket.write(head);
        socket.once("close", () => proxySocket.destroy());
        socket.once("error", () => proxySocket.destroy());
        proxySocket.once("close", () => socket.destroy());
        proxySocket.once("error", () => socket.destroy());
        proxySocket.pipe(socket).pipe(proxySocket);
      });
      proxyRequest.on("response", (proxyResponse) => {
        socket.write(
          `HTTP/1.1 ${proxyResponse.statusCode ?? HTTP_BAD_GATEWAY} ` +
            `${proxyResponse.statusMessage ?? "Bad Gateway"}\r\n\r\n`
        );
        socket.destroy();
      });
      proxyRequest.on("error", () => {
        socket.end("HTTP/1.1 502 Bad Gateway\r\n\r\n");
      });
      proxyRequest.end();
    });
  }

  await new Promise<void>((resolve, reject) => {
    server.once("error", (error: NodeJS.ErrnoException) => {
      reject(
        error.code === "EADDRINUSE"
          ? new Error(
              `Port ${options.port} is already in use, so the Mago window cannot be served. ` +
                `Set MAGO_RENDERER_PORT to a free port and restart.`
            )
          : error
      );
    });
    // Loopback only: the host-resolver rule is the sole route to this listener.
    server.listen(options.port, "127.0.0.1", () => {
      server.removeAllListeners("error");
      resolve();
    });
  });

  const address = server.address() as AddressInfo;
  return {
    host: config.rendererHost,
    port: address.port,
    url: `https://${config.rendererHost}/`,
    fingerprint: certificate.fingerprint,
    close: () => new Promise<void>((resolve) => server.close(() => resolve()))
  };
};

/** Point the renderer hostname at the loopback listener, and nothing else. */
export const installHostResolverRule = (origin: {
  host: string;
  port: number;
}): void => {
  app.commandLine.appendSwitch(
    "host-resolver-rules",
    `MAP ${origin.host} 127.0.0.1:${origin.port}`
  );
};

/**
 * Trust the per-install certificate for the renderer host only, and only when
 * the presented certificate is exactly the one we issued. Trusting by hostname
 * alone would accept anything that reached that name.
 */
export const pinRendererCertificate = (
  session: Session,
  origin: { host: string; fingerprint: string }
): void => {
  session.setCertificateVerifyProc((request, callback) => {
    const USE_CHROMIUM_RESULT = -3;
    const ACCEPT = 0;
    const REJECT = -2;

    if (request.hostname !== origin.host) {
      callback(USE_CHROMIUM_RESULT);
      return;
    }
    const presented = request.certificate?.data
      ? fingerprintOf(request.certificate.data)
      : null;
    callback(presented === origin.fingerprint ? ACCEPT : REJECT);
  });
};
