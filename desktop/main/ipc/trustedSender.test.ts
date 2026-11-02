import { describe, expect, it, vi } from "vitest";

vi.mock("electron", () => ({ app: { isPackaged: true } }));

import { isTrustedSenderUrl } from "./trustedSender";

const HOST = "desktop.app.mago.studio";

describe("isTrustedSenderUrl", () => {
  it("accepts the renderer origin over https", () => {
    expect(isTrustedSenderUrl(`https://${HOST}/`, HOST, false)).toBe(true);
    expect(isTrustedSenderUrl(`https://${HOST}/payment/`, HOST, false)).toBe(
      true
    );
  });

  it("rejects a lookalike host that merely starts with the renderer host", () => {
    // The bug a prefix comparison would have: a different site entirely.
    expect(
      isTrustedSenderUrl(`https://${HOST}.example.com/`, HOST, false)
    ).toBe(false);
    expect(
      isTrustedSenderUrl(`https://evil.com/?x=https://${HOST}/`, HOST, false)
    ).toBe(false);
  });

  it("rejects the renderer host over plain http", () => {
    expect(isTrustedSenderUrl(`http://${HOST}/`, HOST, false)).toBe(false);
    expect(isTrustedSenderUrl(`http://${HOST}/`, HOST, true)).toBe(false);
  });

  it("accepts loopback only when development is allowed", () => {
    expect(isTrustedSenderUrl("http://127.0.0.1:3000/", HOST, true)).toBe(true);
    expect(isTrustedSenderUrl("http://localhost:3000/", HOST, true)).toBe(true);
    expect(isTrustedSenderUrl("http://127.0.0.1:3000/", HOST, false)).toBe(
      false
    );
    expect(isTrustedSenderUrl("http://localhost:3000/", HOST, false)).toBe(
      false
    );
  });

  it("rejects other schemes and unparseable senders", () => {
    for (const senderUrl of [
      "",
      "about:blank",
      "file:///C:/Windows/system32",
      "mago-app://bundle/",
      "not a url",
      `ftp://${HOST}/`
    ]) {
      expect(isTrustedSenderUrl(senderUrl, HOST, true)).toBe(false);
    }
  });
});
