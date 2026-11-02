import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { resumableDownload } from "./resumableDownload";
let directory: string;
let destination: string;
const url = "https://example.com/model";
const hash = (text: string) => createHash("sha256").update(text).digest("hex");
beforeEach(async () => {
  directory = await mkdtemp(path.join(os.tmpdir(), "mago-resume-"));
  destination = path.join(directory, "model.bin");
});
afterEach(async () => {
  vi.unstubAllGlobals();
  await rm(directory, { recursive: true, force: true });
});
const partial = async (contents = "abc", expectedHash = hash(contents)) => {
  await writeFile(destination + ".mago-part", contents);
  await writeFile(
    destination + ".mago-part.json",
    JSON.stringify({
      url,
      validator: '"v1"',
      size: 6,
      checksum: hash("abcdef"),
      partialHash: expectedHash
    })
  );
};
describe("resumable downloads", () => {
  it("resumes an unchanged partial with If-Range and verifies SHA-256", async () => {
    await partial();
    const fetcher = vi.fn(
      async () =>
        new Response("def", {
          status: 206,
          headers: { "content-range": "bytes 3-5/6", etag: '"v1"' }
        })
    );
    vi.stubGlobal("fetch", fetcher);
    await resumableDownload(url, destination);
    expect(fetcher.mock.calls[0]).toEqual([
      url,
      expect.objectContaining({
        headers: expect.objectContaining({
          Range: "bytes=3-",
          "If-Range": '"v1"'
        })
      })
    ]);
    expect(await readFile(destination, "utf8")).toBe("abcdef");
  });
  it("restarts when the server ignores Range", async () => {
    await partial();
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response("new version", { headers: { "content-length": "11" } })
      )
    );
    await resumableDownload(url, destination);
    expect(await readFile(destination, "utf8")).toBe("new version");
  });
  it("does not append to a locally modified partial", async () => {
    await partial("bad", hash("abc"));
    const fetcher = vi.fn(async () => new Response("abcdef"));
    vi.stubGlobal("fetch", fetcher);
    await resumableDownload(url, destination);
    expect(fetcher.mock.calls[0]).toEqual([
      url,
      expect.objectContaining({ headers: { "Accept-Encoding": "identity" } })
    ]);
  });
  it("rejects a bad server checksum without publishing the file", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response("bad", {
            headers: { "x-checksum-sha256": hash("good") }
          })
      )
    );
    await expect(resumableDownload(url, destination)).rejects.toThrow(
      "SHA-256"
    );
    await expect(readFile(destination)).rejects.toThrow();
  });
  it("retains verified partials when paused", async () => {
    const controller = new AbortController();
    let delivered = false;
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            new ReadableStream({
              pull(stream) {
                if (!delivered) {
                  delivered = true;
                  stream.enqueue(new TextEncoder().encode("abc"));
                } else
                  return new Promise<void>((resolve) =>
                    setTimeout(() => {
                      controller.abort();
                      resolve();
                    }, 20)
                  );
              }
            }),
            { headers: { etag: '"v1"', "content-length": "6" } }
          )
      )
    );
    await expect(
      resumableDownload(url, destination, controller.signal)
    ).rejects.toThrow("Paused");
    const contents = await readFile(destination + ".mago-part", "utf8");
    const metadata = JSON.parse(
      await readFile(destination + ".mago-part.json", "utf8")
    );
    expect(metadata.partialHash).toBe(hash(contents));
    await expect(readFile(destination)).rejects.toThrow();
  });
});
