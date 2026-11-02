import { describe, expect, it } from "vitest";

import { mergeBackendOwnedProjectSettings } from "./mergeBackendOwnedProjectSettings";

describe("mergeBackendOwnedProjectSettings", () => {
  it("keeps the stored backend-owned keys a client left out", () => {
    expect(
      mergeBackendOwnedProjectSettings({
        storedSettings: {
          type: "script_to_shots",
          pinnedTrackIds: { "shot-1": "track-1" },
          mirroredLocalProjectId: "local-1",
          folders: [{ id: "folder-1" }]
        },
        incomingSettings: { rangeMin: 0 }
      })
    ).toEqual({
      rangeMin: 0,
      type: "script_to_shots",
      pinnedTrackIds: { "shot-1": "track-1" },
      mirroredLocalProjectId: "local-1",
      origin: "local"
    });
  });

  it("takes a backend-owned key from the client when it sends one", () => {
    expect(
      mergeBackendOwnedProjectSettings({
        storedSettings: { pinnedTrackIds: { "shot-1": "track-1" } },
        incomingSettings: { pinnedTrackIds: {} }
      })
    ).toEqual({ pinnedTrackIds: {}, origin: "local" });
  });

  it("never takes script_flow from the client", () => {
    expect(
      mergeBackendOwnedProjectSettings({
        storedSettings: { script_flow: { version: 2 } },
        incomingSettings: { script_flow: { version: 1 } }
      })
    ).toEqual({ script_flow: { version: 2 }, origin: "local" });
    expect(
      mergeBackendOwnedProjectSettings({
        storedSettings: {},
        incomingSettings: { script_flow: { version: 1 } }
      })
    ).toEqual({ origin: "local" });
  });

  it("never lets a client turn a script project into another type", () => {
    expect(
      mergeBackendOwnedProjectSettings({
        storedSettings: { type: "script_to_shots" },
        incomingSettings: { type: "timeline" }
      })
    ).toEqual({ type: "script_to_shots", origin: "local" });
  });

  it("keeps the library-owned origin and cloud summary", () => {
    expect(
      mergeBackendOwnedProjectSettings({
        storedSettings: { origin: "cloud", cloudSummary: { total_renders: 4 } },
        incomingSettings: { origin: "local", cloudSummary: "forged" }
      })
    ).toEqual({ origin: "cloud", cloudSummary: { total_renders: 4 } });
  });
});
