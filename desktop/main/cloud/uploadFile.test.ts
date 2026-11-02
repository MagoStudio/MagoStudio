// @vitest-environment node
//
// Main-process code is Node, not a browser. Under the project's default jsdom
// environment, fs read streams fail with EINVAL on Windows, so this suite -- which
// streams a real file over a real TLS connection -- runs in the node environment.
import { once } from "node:events";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer, Server } from "node:https";
import { Agent } from "node:https";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("electron", () => ({ app: { getPath: () => tmpdir() } }));

import { generateSelfSignedCertificate } from "../renderer/selfSignedCertificate";

import {
  assertUploadUrl,
  uploadBytesToPresignedUrl,
  uploadFileToPresignedUrl,
  uploadHeaders
} from "./uploadFile";

const directories: string[] = [];
const servers: Server[] = [];

afterEach(async () => {
  for (const server of servers.splice(0)) {
    server.close();
    await once(server, "close").catch(() => {});
  }
  await Promise.all(
    directories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true }))
  );
});

const writeTemporaryFile = async (contents: string) => {
  const directory = await mkdtemp(path.join(tmpdir(), "mago-upload-"));
  directories.push(directory);
  const filePath = path.join(directory, "upload.mp4");
  await writeFile(filePath, contents);
  return filePath;
};

/** A real TLS listener, using the app's own certificate generator. */
const startReceiver = async (
  handler: (received: {
    method?: string;
    headers: Record<string, unknown>;
    body: Buffer;
  }) => { status: number; body?: string }
) => {
  const { certificatePem, privateKeyPem } = generateSelfSignedCertificate({
    hostname: "localhost"
  });
  const server = createServer(
    { cert: certificatePem, key: privateKeyPem },
    (request, response) => {
      const chunks: Buffer[] = [];
      request.on("data", (chunk: Buffer) => chunks.push(chunk));
      request.once("end", () => {
        const result = handler({
          method: request.method,
          headers: request.headers as Record<string, unknown>,
          body: Buffer.concat(chunks)
        });
        response.writeHead(result.status).end(result.body ?? "");
      });
    }
  );
  servers.push(server);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (address === null || typeof address === "string") {
    throw new Error("Expected a TCP address");
  }
  return {
    url: `https://localhost:${address.port}/upload`,
    // Self-signed by design: the pinning that matters happens in the renderer
    // session, not here.
    agent: new Agent({ rejectUnauthorized: false })
  };
};

describe("assertUploadUrl", () => {
  it("accepts an https URL", () => {
    expect(
      assertUploadUrl("https://bucket.s3.amazonaws.com/key?sig=1").host
    ).toBe("bucket.s3.amazonaws.com");
  });

  it("refuses anything that is not https", () => {
    for (const value of [
      "http://bucket.s3.amazonaws.com/key",
      "file:///C:/secrets",
      "ftp://host/key"
    ]) {
      expect(() => assertUploadUrl(value)).toThrow(/anything but https/);
    }
  });

  it("refuses a value that is not a URL at all", () => {
    expect(() => assertUploadUrl("not a url")).toThrow(/not a valid URL/);
  });
});

describe("uploadHeaders", () => {
  it("sends an explicit length, because S3 rejects chunked uploads", () => {
    expect(uploadHeaders("video/mp4", 1234)).toEqual({
      "content-type": "video/mp4",
      "content-length": 1234
    });
  });
});

describe("uploadFileToPresignedUrl", () => {
  it("PUTs the file with the declared type and length", async () => {
    const filePath = await writeTemporaryFile("hello-video-bytes");
    let received: {
      method?: string;
      headers: Record<string, unknown>;
      body: Buffer;
    } | null = null;
    const { url, agent } = await startReceiver((request) => {
      received = request;
      return { status: 200 };
    });

    await uploadFileToPresignedUrl({
      filePath,
      presignedUrl: url,
      contentType: "video/mp4",
      agent
    });

    expect(received!.method).toBe("PUT");
    expect(received!.headers["content-type"]).toBe("video/mp4");
    expect(received!.headers["content-length"]).toBe("17");
    expect(received!.body.toString()).toBe("hello-video-bytes");
  });

  it("reports progress that ends at one", async () => {
    const filePath = await writeTemporaryFile("x".repeat(2048));
    const { url, agent } = await startReceiver(() => ({ status: 200 }));
    const fractions: number[] = [];

    await uploadFileToPresignedUrl({
      filePath,
      presignedUrl: url,
      contentType: "video/mp4",
      onProgress: (fraction) => fractions.push(fraction),
      agent
    });

    expect(fractions.length).toBeGreaterThan(0);
    expect(fractions.at(-1)).toBe(1);
    expect(Math.min(...fractions)).toBeGreaterThan(0);
  });

  it("surfaces the server's rejection, including its body", async () => {
    const filePath = await writeTemporaryFile("bytes");
    const { url, agent } = await startReceiver(() => ({
      status: 403,
      body: "<Error><Code>SignatureDoesNotMatch</Code></Error>"
    }));

    await expect(
      uploadFileToPresignedUrl({
        filePath,
        presignedUrl: url,
        contentType: "video/mp4",
        agent
      })
    ).rejects.toThrow(/status 403.*SignatureDoesNotMatch/s);
  });

  it("refuses to upload an empty file", async () => {
    const filePath = await writeTemporaryFile("");
    const { url, agent } = await startReceiver(() => ({ status: 200 }));

    await expect(
      uploadFileToPresignedUrl({
        filePath,
        presignedUrl: url,
        contentType: "video/mp4",
        agent
      })
    ).rejects.toThrow(/empty file/);
  });

  it("fails clearly when the prepared file is missing", async () => {
    const { url, agent } = await startReceiver(() => ({ status: 200 }));

    await expect(
      uploadFileToPresignedUrl({
        filePath: path.join(tmpdir(), "mago-does-not-exist.mp4"),
        presignedUrl: url,
        contentType: "video/mp4",
        agent
      })
    ).rejects.toThrow();
  });
});

describe("uploadBytesToPresignedUrl", () => {
  it("PUTs in-memory bytes with the declared type and length", async () => {
    let received: {
      method?: string;
      headers: Record<string, unknown>;
      body: Buffer;
    } | null = null;
    const { url, agent } = await startReceiver((request) => {
      received = request;
      return { status: 200 };
    });

    await uploadBytesToPresignedUrl({
      bytes: Buffer.from("trimmed-video"),
      presignedUrl: url,
      contentType: "video/mp4",
      agent
    });

    expect(received!.method).toBe("PUT");
    expect(received!.headers["content-type"]).toBe("video/mp4");
    expect(received!.headers["content-length"]).toBe("13");
    expect(received!.body.toString()).toBe("trimmed-video");
  });

  it("refuses to start an upload that was already cancelled", async () => {
    const { url, agent } = await startReceiver(() => ({ status: 200 }));
    const controller = new AbortController();
    controller.abort();

    await expect(
      uploadBytesToPresignedUrl({
        bytes: Buffer.from("bytes"),
        presignedUrl: url,
        contentType: "video/mp4",
        signal: controller.signal,
        agent
      })
    ).rejects.toThrow("cancelled");
  });

  it("refuses an empty body", async () => {
    await expect(
      uploadBytesToPresignedUrl({
        bytes: Buffer.alloc(0),
        presignedUrl: "https://example.com/upload",
        contentType: "video/mp4"
      })
    ).rejects.toThrow("empty");
  });
});
