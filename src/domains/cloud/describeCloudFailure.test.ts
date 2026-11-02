import { describe, expect, it } from "vitest";

import { clerkFrontendApiHost } from "@/platform/clerkHost";

import { describeCloudFailure } from "./describeCloudFailure";

const DEV_KEY = "pk_test_ZGVjaWRpbmctYm94ZXItMzUuY2xlcmsuYWNjb3VudHMuZGV2JA";
const CLERK_HOST = "deciding-boxer-35.clerk.accounts.dev";

describe("clerkFrontendApiHost", () => {
  it("derives the host from a publishable key, as the main process does", () => {
    expect(clerkFrontendApiHost(DEV_KEY)).toBe(CLERK_HOST);
    expect(clerkFrontendApiHost("pk_live_Y2xlcmsuYXBwLm1hZ28uc3R1ZGlvJA")).toBe(
      "clerk.app.mago.studio"
    );
  });

  it("returns null for anything that is not a publishable key", () => {
    for (const key of ["", "not-a-key", "pk_test_"]) {
      expect(clerkFrontendApiHost(key)).toBeNull();
    }
  });
});

describe("describeCloudFailure", () => {
  it("names a blocked script as a build problem, not a network one", () => {
    // The failure that cost a debugging round trip: the bundle loaded dev Clerk
    // while the CSP allowed only production, so the script was blocked and the
    // app reported that it could not reach the cloud.
    const failure = describeCloudFailure({
      blockedHosts: [CLERK_HOST],
      clerkHost: CLERK_HOST,
      online: true
    });

    expect(failure.kind).toBe("blocked");
    expect(failure.message).toMatch(/security policy/i);
    // The host makes the mismatch obvious in a bug report.
    expect(failure.detail).toContain(CLERK_HOST);
    expect(failure.detail).toMatch(/waiting will not/i);
  });

  it("reports being offline when there is no network", () => {
    const failure = describeCloudFailure({
      blockedHosts: [],
      clerkHost: CLERK_HOST,
      online: false
    });

    expect(failure.kind).toBe("offline");
    expect(failure.message).toMatch(/offline/i);
    expect(failure.detail).toBeUndefined();
  });

  it("reports plain unreachability when the network is up", () => {
    const failure = describeCloudFailure({
      blockedHosts: [],
      clerkHost: CLERK_HOST,
      online: true
    });

    expect(failure.kind).toBe("unreachable");
  });

  it("prefers the blocked diagnosis over being offline", () => {
    // A blocked script is not fixed by reconnecting, so it must win.
    expect(
      describeCloudFailure({
        blockedHosts: [CLERK_HOST],
        clerkHost: CLERK_HOST,
        online: false
      }).kind
    ).toBe("blocked");
  });

  it("ignores violations for hosts unrelated to signing in", () => {
    expect(
      describeCloudFailure({
        blockedHosts: ["clerk-telemetry.com", "fonts.googleapis.com"],
        clerkHost: CLERK_HOST,
        online: true
      }).kind
    ).toBe("unreachable");
  });

  it("does not claim a build problem when the expected host is unknown", () => {
    expect(
      describeCloudFailure({
        blockedHosts: ["anything"],
        clerkHost: null,
        online: true
      }).kind
    ).toBe("unreachable");
  });
});
