import { X509Certificate } from "node:crypto";
import { once } from "node:events";
import { createServer } from "node:https";
import { connect } from "node:tls";

import { describe, expect, it } from "vitest";

import {
  fingerprintOf,
  generateSelfSignedCertificate
} from "./selfSignedCertificate";

const HOSTNAME = "desktop.app.mago.studio";

describe("generateSelfSignedCertificate", () => {
  it("produces a certificate OpenSSL can parse", () => {
    const { certificatePem } = generateSelfSignedCertificate({
      hostname: HOSTNAME
    });
    const certificate = new X509Certificate(certificatePem);

    expect(certificate.subject).toContain(HOSTNAME);
    expect(certificate.issuer).toContain(HOSTNAME);
    expect(certificate.subjectAltName).toBe(`DNS:${HOSTNAME}`);
  });

  it("is self-signed and verifies against its own public key", () => {
    const { certificatePem } = generateSelfSignedCertificate({
      hostname: HOSTNAME
    });
    const certificate = new X509Certificate(certificatePem);

    expect(certificate.verify(certificate.publicKey)).toBe(true);
    expect(certificate.checkHost(HOSTNAME)).toBe(HOSTNAME);
  });

  it("matches the private key it was generated with", () => {
    const { certificatePem, privateKeyPem } = generateSelfSignedCertificate({
      hostname: HOSTNAME
    });
    // Node parses the PKCS#8 PEM only if the key really is well formed.
    const certificate = new X509Certificate(certificatePem);

    expect(privateKeyPem).toContain("BEGIN PRIVATE KEY");
    expect(certificate.publicKey.asymmetricKeyType).toBe("rsa");
  });

  it("reports a fingerprint that matches one derived from the PEM", () => {
    const { certificatePem, fingerprint } = generateSelfSignedCertificate({
      hostname: HOSTNAME
    });

    expect(fingerprintOf(certificatePem)).toBe(fingerprint);
  });

  it("backdates notBefore so clock skew cannot reject a fresh certificate", () => {
    const now = new Date("2026-06-01T12:00:00.000Z");
    const { certificatePem } = generateSelfSignedCertificate({
      hostname: HOSTNAME,
      now,
      validityDays: 30
    });
    const certificate = new X509Certificate(certificatePem);

    expect(new Date(certificate.validFrom).getTime()).toBeLessThan(
      now.getTime()
    );
    expect(new Date(certificate.validTo).getTime()).toBeGreaterThan(
      now.getTime()
    );
  });

  it("issues a distinct serial number each time", () => {
    const first = new X509Certificate(
      generateSelfSignedCertificate({ hostname: HOSTNAME }).certificatePem
    );
    const second = new X509Certificate(
      generateSelfSignedCertificate({ hostname: HOSTNAME }).certificatePem
    );

    expect(first.serialNumber).not.toBe(second.serialNumber);
  });

  it("refuses hostnames that are not plausible DNS names", () => {
    for (const hostname of ["", "not a host", "../escape", "host/path"]) {
      expect(() => generateSelfSignedCertificate({ hostname })).toThrow(
        /Refusing to issue/
      );
    }
  });

  it("completes a real TLS handshake and presents the pinned certificate", async () => {
    const { certificatePem, privateKeyPem, fingerprint } =
      generateSelfSignedCertificate({ hostname: HOSTNAME });

    const server = createServer(
      { cert: certificatePem, key: privateKeyPem },
      (_request, response) => response.writeHead(204).end()
    );
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    if (address === null || typeof address === "string") {
      throw new Error("Expected a TCP address");
    }

    try {
      const socket = connect({
        host: "127.0.0.1",
        port: address.port,
        servername: HOSTNAME,
        // Self-signed by design; the pin below is what actually authenticates it.
        rejectUnauthorized: false
      });
      await once(socket, "secureConnect");

      const presented = socket.getPeerX509Certificate();
      expect(presented).toBeDefined();
      expect(fingerprintOf(presented!.toString())).toBe(fingerprint);
      expect(presented!.checkHost(HOSTNAME)).toBe(HOSTNAME);

      socket.destroy();
    } finally {
      server.close();
      await once(server, "close");
    }
  });
});
