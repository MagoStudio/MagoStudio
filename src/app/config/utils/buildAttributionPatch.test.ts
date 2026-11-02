import { describe, expect, test } from "vitest";

import { buildAttributionPatch } from "./buildAttributionPatch";
import { UtmMetadata } from "./normalizeUtm";

const utm: UtmMetadata = {
  utm_source: "newsletter",
  utm_medium: null,
  utm_campaign: null,
  utm_term: null,
  utm_content: null
};

const sessions = [
  { id: "sess_other", latestActivity: { country: "DE" } },
  { id: "sess_current", latestActivity: { country: "US" } }
];

describe("buildAttributionPatch", () => {
  test("returns null when there is nothing to write", () => {
    expect(
      buildAttributionPatch({
        pendingUtm: null,
        sessions: [],
        currentSessionId: "sess_current",
        storedCountry: "US"
      })
    ).toBeNull();
  });

  test("includes utm and the current session's country", () => {
    expect(
      buildAttributionPatch({
        pendingUtm: utm,
        sessions,
        currentSessionId: "sess_current"
      })
    ).toEqual({ utm, country: "US" });
  });

  test("matches country by current session id, not the first session", () => {
    const patch = buildAttributionPatch({
      pendingUtm: null,
      sessions,
      currentSessionId: "sess_current"
    });

    expect(patch).toEqual({ country: "US" });
  });

  test("falls back to the first session when the id does not match", () => {
    const patch = buildAttributionPatch({
      pendingUtm: null,
      sessions,
      currentSessionId: "sess_unknown"
    });

    expect(patch).toEqual({ country: "DE" });
  });

  test("skips country when one is already stored", () => {
    expect(
      buildAttributionPatch({
        pendingUtm: utm,
        sessions,
        currentSessionId: "sess_current",
        storedCountry: "FR"
      })
    ).toEqual({ utm });
  });

  test("omits country when no session reports one", () => {
    expect(
      buildAttributionPatch({
        pendingUtm: utm,
        sessions: [{ id: "sess_current" }],
        currentSessionId: "sess_current"
      })
    ).toEqual({ utm });
  });
});
