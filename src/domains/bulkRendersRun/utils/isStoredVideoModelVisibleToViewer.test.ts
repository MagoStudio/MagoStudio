import { VideoEngine, VideoModelDefinition } from "@models/video/types";
import { describe, expect, it } from "vitest";

import { isStoredVideoModelVisibleToViewer } from "./isStoredVideoModelVisibleToViewer";

const buildModel = (
  overrides: Partial<VideoModelDefinition> = {}
): VideoModelDefinition =>
  ({
    name: VideoEngine.V3_4_0,
    status: "active",
    capabilities: {},
    ...overrides
  }) as VideoModelDefinition;

const generalPublic = { isTeamMember: false };
const teamMember = { isTeamMember: true };

describe("isStoredVideoModelVisibleToViewer", () => {
  it("shows an active model to anyone", () => {
    expect(isStoredVideoModelVisibleToViewer(buildModel(), generalPublic)).toBe(
      true
    );
  });

  it("shows a hidden model regardless of audience", () => {
    expect(
      isStoredVideoModelVisibleToViewer(
        buildModel({ status: "hidden" }),
        generalPublic
      )
    ).toBe(true);
  });

  it("shows a deprecated model regardless of audience", () => {
    expect(
      isStoredVideoModelVisibleToViewer(
        buildModel({ status: "deprecated" }),
        generalPublic
      )
    ).toBe(true);
  });

  it("shows a model that does not support bulk rendering, since selection is a different question", () => {
    expect(
      isStoredVideoModelVisibleToViewer(
        buildModel({ capabilities: {} }),
        generalPublic
      )
    ).toBe(true);
  });

  it("hides a team-only model from the general public and reveals it to team members", () => {
    const model = buildModel({ status: "team_only" });

    expect(isStoredVideoModelVisibleToViewer(model, generalPublic)).toBe(false);
    expect(isStoredVideoModelVisibleToViewer(model, teamMember)).toBe(true);
  });
});
