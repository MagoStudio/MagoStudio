import { createPrivateKey, X509Certificate } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("electron", () => ({ app: { getPath: () => "/unused" } }));

import { ensureRendererCertificate } from "./rendererOrigin";
import { generateSelfSignedCertificate } from "./selfSignedCertificate";

const directories: string[] = [];
afterEach(async () => {
  await Promise.all(
    directories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true }))
  );
});

describe("renderer certificate recovery", () => {
  it.each(["mismatched", "truncated"])(
    "replaces a %s key left by an interrupted write",
    async (kind) => {
      const directory = await mkdtemp(
        path.join(tmpdir(), "mago-cert-recovery-")
      );
      directories.push(directory);
      const hostname = "desktop.app.mago.studio";
      const first = generateSelfSignedCertificate({ hostname });
      const other = generateSelfSignedCertificate({ hostname });
      await writeFile(
        path.join(directory, "renderer-cert.pem"),
        first.certificatePem
      );
      await writeFile(
        path.join(directory, "renderer-key.pem"),
        kind === "mismatched" ? other.privateKeyPem : "incomplete"
      );

      const recovered = await ensureRendererCertificate(hostname, directory);
      expect(
        new X509Certificate(recovered.certificatePem).checkPrivateKey(
          createPrivateKey(recovered.privateKeyPem)
        )
      ).toBe(true);
      expect(recovered.certificatePem).not.toBe(first.certificatePem);
      expect(
        await readFile(path.join(directory, "renderer-key.pem"), "utf8")
      ).toBe(recovered.privateKeyPem);
    }
  );
});
