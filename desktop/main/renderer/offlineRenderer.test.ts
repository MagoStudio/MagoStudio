import path from "node:path";
import { pathToFileURL } from "node:url";

import type { Session } from "electron";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ fetch: vi.fn() }));
vi.mock("electron", () => ({ net: { fetch: mocks.fetch }, app: {} }));

import { resolveCloudConfig } from "../../shared/cloudConfig";

import { installOfflineRenderer } from "./offlineRenderer";

const config = resolveCloudConfig();
const root = path.resolve("offline-test-bundle");
const origin = `https://${config.rendererHost}`;
let handler: (request: Request) => Promise<Response>;

beforeEach(() => {
  mocks.fetch.mockReset();
  const handle = vi.fn((_scheme, callback) => {
    handler = callback;
  });
  installOfflineRenderer(
    { protocol: { handle } } as unknown as Session,
    root,
    config
  );
});

describe("offline renderer", () => {
  it("reads exported routes directly from disk with CSP and no network connection", async () => {
    mocks.fetch.mockResolvedValue(new Response("<html>offline</html>"));
    const response = await handler(
      new Request(`${origin}/projects/?projectId=123`)
    );
    expect(await response.text()).toBe("<html>offline</html>");
    expect(mocks.fetch).toHaveBeenCalledExactlyOnceWith(
      pathToFileURL(path.join(root, "projects", "index.html")).href
    );
    expect(response.headers.get("Content-Type")).toBe(
      "text/html; charset=utf-8"
    );
    expect(response.headers.get("Content-Security-Policy")).toContain(
      "object-src 'none'"
    );
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("preserves immutable caching and MIME types for hashed assets", async () => {
    mocks.fetch.mockResolvedValue(
      new Response("js", {
        headers: { "Content-Type": "application/javascript" }
      })
    );
    const response = await handler(
      new Request(`${origin}/_next/static/chunks/app.js`)
    );
    expect(response.headers.get("Content-Type")).toBe("application/javascript");
    expect(response.headers.get("Cache-Control")).toContain("immutable");
  });

  it("forwards other origins without re-entering its own handler", async () => {
    const remote = new Response("remote");
    mocks.fetch.mockResolvedValue(remote);
    const request = new Request("https://example.com/");
    expect(await handler(request)).toBe(remote);
    expect(mocks.fetch).toHaveBeenCalledExactlyOnceWith(request, {
      bypassCustomProtocolHandlers: true
    });
  });

  it("refuses traversal and writes without reading any file", async () => {
    expect(
      (await handler(new Request(`${origin}/%2e%2e%2fsecret.txt`))).status
    ).toBe(403);
    // Backslashes are path separators only on Windows.
    if (process.platform === "win32") {
      expect(
        (await handler(new Request(`${origin}/%5c..%5csecret.txt`))).status
      ).toBe(403);
    }
    expect(
      (await handler(new Request(`${origin}/`, { method: "POST" }))).status
    ).toBe(405);
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it("returns 404 for a missing file and no body for HEAD", async () => {
    mocks.fetch.mockRejectedValueOnce(new Error("missing"));
    expect((await handler(new Request(`${origin}/missing.js`))).status).toBe(
      404
    );
    mocks.fetch.mockResolvedValue(new Response("html"));
    expect(
      await (await handler(new Request(origin, { method: "HEAD" }))).text()
    ).toBe("");
  });
});
