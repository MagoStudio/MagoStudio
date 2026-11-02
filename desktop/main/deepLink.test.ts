import { describe, expect, it, vi } from "vitest";

vi.mock("electron", () => ({
  app: {
    setAsDefaultProtocolClient: vi.fn(),
    requestSingleInstanceLock: vi.fn(),
    on: vi.fn()
  }
}));

import { findDeepLink, parseDeepLink } from "./deepLink";

describe("parseDeepLink", () => {
  it("reads the action and parameters from a host-style link", () => {
    expect(parseDeepLink("mago://auth?ticket=abc&state=xyz")).toEqual({
      action: "auth",
      params: { ticket: "abc", state: "xyz" }
    });
  });

  it("reads a path-style link the same way", () => {
    expect(parseDeepLink("mago:///auth?ticket=abc")).toEqual({
      action: "auth",
      params: { ticket: "abc" }
    });
  });

  it("handles an action with no parameters", () => {
    expect(parseDeepLink("mago://auth")).toEqual({
      action: "auth",
      params: {}
    });
  });

  it("url-decodes parameter values", () => {
    expect(parseDeepLink("mago://auth?next=%2Fproject%2F1")).toEqual({
      action: "auth",
      params: { next: "/project/1" }
    });
  });

  it("rejects other schemes", () => {
    for (const value of [
      "https://desktop.app.mago.studio/auth",
      "magox://auth",
      "file:///etc/passwd",
      "javascript:alert(1)"
    ]) {
      expect(parseDeepLink(value)).toBeNull();
    }
  });

  it("rejects unparseable input and implausible actions", () => {
    for (const value of ["", "mago://", "not a url", "mago://../escape"]) {
      expect(parseDeepLink(value)).toBeNull();
    }
  });
});

describe("findDeepLink", () => {
  it("picks the link out of a process argv", () => {
    expect(
      findDeepLink(["C:/app/mago.exe", "--flag", "mago://auth?ticket=1"])
    ).toBe("mago://auth?ticket=1");
  });

  it("returns null when argv carries no link", () => {
    expect(findDeepLink(["C:/app/mago.exe", "--flag"])).toBeNull();
  });
});
