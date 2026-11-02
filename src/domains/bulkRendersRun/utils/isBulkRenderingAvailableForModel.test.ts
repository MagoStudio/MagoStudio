import { RENDER_MODELS } from "@models/video/constants";
import { VideoEngine, VideoModelDefinition } from "@models/video/types";
import { describe, expect, it } from "vitest";

import { isBulkRenderingAvailableForModel } from "./isBulkRenderingAvailableForModel";

const buildModel = (
  overrides: Partial<VideoModelDefinition> = {}
): VideoModelDefinition =>
  ({
    name: VideoEngine.V3_4_0,
    status: "active",
    capabilities: { supportsBulkRendering: true },
    ...overrides
  }) as VideoModelDefinition;

const generalPublic = { isTeamMember: false };
const teamMember = { isTeamMember: true };

const ENGINES_SUPPORTING_BULK_RENDERING = [
  VideoEngine.V3_4_0,
  VideoEngine.V4_0_0,
  VideoEngine.V4_1_0,
  VideoEngine.V5_0_0
];

describe("isBulkRenderingAvailableForModel", () => {
  it("includes an active model that declares support", () => {
    expect(isBulkRenderingAvailableForModel(buildModel(), generalPublic)).toBe(
      true
    );
  });

  it("excludes a model that declares nothing, so support is never inherited by omission", () => {
    const model = buildModel({ capabilities: {} });

    expect(isBulkRenderingAvailableForModel(model, generalPublic)).toBe(false);
  });

  it("keeps an undeclared model excluded even for a team member", () => {
    const model = buildModel({ status: "team_only", capabilities: {} });

    expect(isBulkRenderingAvailableForModel(model, teamMember)).toBe(false);
  });

  it("excludes deprecated and hidden models from everyone, despite the declaration", () => {
    expect(
      isBulkRenderingAvailableForModel(
        buildModel({ status: "deprecated" }),
        teamMember
      )
    ).toBe(false);
    expect(
      isBulkRenderingAvailableForModel(
        buildModel({ status: "hidden" }),
        teamMember
      )
    ).toBe(false);
  });

  it("reveals a declaring team-only model to team members only", () => {
    const model = buildModel({ status: "team_only" });

    expect(isBulkRenderingAvailableForModel(model, generalPublic)).toBe(false);
    expect(isBulkRenderingAvailableForModel(model, teamMember)).toBe(true);
  });

  it("excludes an upscale model by kind, even when it declares support", () => {
    const model = buildModel({ name: VideoEngine.v1_0_0_upscaler });

    expect(isBulkRenderingAvailableForModel(model, generalPublic)).toBe(false);
    expect(isBulkRenderingAvailableForModel(model, teamMember)).toBe(false);
  });

  it("excludes the mask model", () => {
    const model = buildModel({
      name: VideoEngine.v1_0_0_mask,
      status: "hidden"
    });

    expect(isBulkRenderingAvailableForModel(model, generalPublic)).toBe(false);
    expect(isBulkRenderingAvailableForModel(model, teamMember)).toBe(false);
  });

  it("is declared by exactly the five Mago engines the product allows", () => {
    const declaringEngines = RENDER_MODELS.filter(
      (model) => model.capabilities.supportsBulkRendering
    ).map((model) => model.name);

    expect(declaringEngines.sort()).toEqual(
      [...ENGINES_SUPPORTING_BULK_RENDERING].sort()
    );
  });

  it("leaves every integrated engine out of the Bulk rendering entry", () => {
    const excludedEngines = [
      VideoEngine.kling_o1,
      VideoEngine.kling_o3_edit_pro,
      VideoEngine.kling_2_6_motion_control,
      VideoEngine.kling_3_motion_control,
      VideoEngine.seedance_2,
      VideoEngine.seedance_2_5,
      VideoEngine.happy_horse_1
    ];

    const unexpectedlyAvailable = RENDER_MODELS.filter(
      (model) =>
        excludedEngines.includes(model.name) &&
        isBulkRenderingAvailableForModel(model, teamMember)
    ).map((model) => model.name);

    expect(unexpectedlyAvailable).toEqual([]);
  });
});
