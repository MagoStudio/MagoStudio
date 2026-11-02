import { afterEach, describe, expect, it, vi } from "vitest";

// vitest.setup.ts mocks the identity facade for every other test file. This one
// is testing the facade itself, so it needs the real module.
vi.unmock("@platform/identity");

import { readIdentityMode } from "./identity";

const setBridge = (value: unknown) => {
  Object.defineProperty(window, "mago", {
    value,
    configurable: true,
    writable: true
  });
};

afterEach(() => {
  setBridge(undefined);
});

describe("readIdentityMode", () => {
  it("uses Clerk only when the window was created in cloud mode", () => {
    setBridge({ account: { mode: "cloud" } });

    expect(readIdentityMode()).toBe("cloud");
  });

  it("stays offline for an explicit offline window", () => {
    setBridge({ account: { mode: "offline" } });

    expect(readIdentityMode()).toBe("offline");
  });

  it("uses cloud before the sign-in gate has been answered", () => {
    // First launch shows Clerk's own sign-in form as the very first screen, so
    // Clerk has to be the implementation before the user has answered. The
    // price is that clerk-js loads before any choice is made; skipping persists
    // offline mode and rebuilds the window, and nothing reaches the network
    // from then on.
    setBridge({ account: { mode: "unchosen" } });

    expect(readIdentityMode()).toBe("cloud");
  });

  it("stays offline outside the desktop shell", () => {
    // Unit tests, Storybook and `next dev` in a browser have no bridge.
    setBridge(undefined);
    expect(readIdentityMode()).toBe("offline");

    setBridge({});
    expect(readIdentityMode()).toBe("offline");
  });

  it("treats an unexpected mode value as offline rather than trusting it", () => {
    for (const mode of [null, 42, "CLOUD", "cloud ", { mode: "cloud" }]) {
      setBridge({ account: { mode } });
      expect(readIdentityMode()).toBe("offline");
    }
  });
});
