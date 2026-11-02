import { extractDefaultVideoSettings } from "@models/video/extractDefaultVideoSettings";
import { magoV4_1_0RenderModel } from "@models/video/magoV4_1_0VideoModel";
import { describe, expect, it } from "vitest";

import { buildBulkRenderingMasterVideoSettingsSummary } from "./buildBulkRenderingMasterVideoSettingsSummary";

describe("buildBulkRenderingMasterVideoSettingsSummary", () => {
  it("excludes the prompt and negative prompt from the summary", () => {
    const videoSettings = extractDefaultVideoSettings(
      magoV4_1_0RenderModel,
      false
    );

    const entries = buildBulkRenderingMasterVideoSettingsSummary({
      videoModel: magoV4_1_0RenderModel,
      videoSettings,
      isTeamMember: false
    });

    expect(entries.some((entry) => entry.key === "prompt")).toBe(false);
    expect(entries.some((entry) => entry.key === "negative_prompt")).toBe(
      false
    );
  });

  it("includes a numeric setting with its resolved value", () => {
    const videoSettings = extractDefaultVideoSettings(
      magoV4_1_0RenderModel,
      false
    );

    const entries = buildBulkRenderingMasterVideoSettingsSummary({
      videoModel: magoV4_1_0RenderModel,
      videoSettings,
      isTeamMember: false
    });

    const stepsEntry = entries.find((entry) => entry.key === "steps");
    expect(stepsEntry).toBeDefined();
    expect(stepsEntry?.value).toBe(`${videoSettings.steps as number}`);
  });

  it("resolves an enum setting to its option label, not its raw value", () => {
    const videoSettings = extractDefaultVideoSettings(
      magoV4_1_0RenderModel,
      false
    );

    const entries = buildBulkRenderingMasterVideoSettingsSummary({
      videoModel: magoV4_1_0RenderModel,
      videoSettings,
      isTeamMember: false
    });

    const imageFormatEntry = entries.find(
      (entry) => entry.key === "image_sequence_export"
    );
    expect(imageFormatEntry?.value).toBe("PNG");
  });

  it("omits a setting whose value is undefined", () => {
    const videoSettings = extractDefaultVideoSettings(
      magoV4_1_0RenderModel,
      false
    );

    const entries = buildBulkRenderingMasterVideoSettingsSummary({
      videoModel: magoV4_1_0RenderModel,
      videoSettings: { ...videoSettings, steps: undefined },
      isTeamMember: false
    });

    expect(entries.some((entry) => entry.key === "steps")).toBe(false);
  });
});
