import { seedance2Model } from "@models/video/seedance2Model";
import { VideoSettings } from "@models/video/types";
import { describe, expect, it } from "vitest";

import { canRenderBulkRendersRunShotVideoSettings } from "./canRenderBulkRendersRunShotVideoSettings";

describe("canRenderBulkRendersRunShotVideoSettings", () => {
  it("parses a Shot's stored settings that genuinely match its model's declared types", () => {
    const canRender = canRenderBulkRendersRunShotVideoSettings(seedance2Model, {
      mago_engine: seedance2Model.name,
      prompt: "a valid prompt",
      generate_audio: false,
      resolution: "1080p"
    } as VideoSettings);

    expect(canRender).toBe(true);
  });

  it("fails to parse a stored setting of the wrong type, rather than throwing inside a control", () => {
    const canRender = canRenderBulkRendersRunShotVideoSettings(seedance2Model, {
      mago_engine: seedance2Model.name,
      generate_audio: "not-a-boolean"
    } as unknown as VideoSettings);

    expect(canRender).toBe(false);
  });

  it("fails to parse a stored enum value the model's schema does not declare", () => {
    const canRender = canRenderBulkRendersRunShotVideoSettings(seedance2Model, {
      mago_engine: seedance2Model.name,
      resolution: "8k"
    } as unknown as VideoSettings);

    expect(canRender).toBe(false);
  });

  it("never fails on a setting that is simply absent — the run view's stored settings are wire-shaped and legitimately omit frontend-only slots", () => {
    const canRender = canRenderBulkRendersRunShotVideoSettings(seedance2Model, {
      mago_engine: seedance2Model.name
    } as VideoSettings);

    expect(canRender).toBe(true);
  });

  it("never fails a model requiring a source image just because source_image_slot is absent — that key never survives the wire round trip", () => {
    const canRender = canRenderBulkRendersRunShotVideoSettings(seedance2Model, {
      mago_engine: seedance2Model.name,
      prompt: "a valid prompt"
    } as VideoSettings);

    expect(canRender).toBe(true);
  });
});
