import { describe, expect, it } from "vitest";

import { happyHorse1Model } from "../happyHorse1Model";
import { klingO1Model } from "../klingO1Model";
import { klingO3EditProModel } from "../klingO3EditProModel";
import { magoV5_0_0RenderModel } from "../magoV5_0_0VideoModel";
import { magoV8_0_0RenderModel } from "../magoV8_0_0VideoModel";
import { seedance2_5Model } from "../seedance2_5Model";
import { seedance2Model } from "../seedance2Model";
import { v1_0_0_maskRenderModel } from "../v1_0_0_maskVideoModel";

import { isAutoPromptAvailableForModel } from "./isAutoPromptAvailableForModel";

const MODELS_HIDING_AUTO_PROMPT = [
  { displayName: "Kling O1 Pro", model: klingO1Model },
  { displayName: "Kling O3 Edit Pro", model: klingO3EditProModel },
  { displayName: "Seedance 2.0", model: seedance2Model },
  { displayName: "Seedance 2.5", model: seedance2_5Model },
  { displayName: "Happy Horse 1.0", model: happyHorse1Model },
  { displayName: "Mask video 1.0.0", model: v1_0_0_maskRenderModel }
];

const MODELS_OFFERING_AUTO_PROMPT = [
  { displayName: "Mago 5.0.0", model: magoV5_0_0RenderModel },
  { displayName: "Mago 8.0.0", model: magoV8_0_0RenderModel }
];

describe("isAutoPromptAvailableForModel", () => {
  it.each(MODELS_HIDING_AUTO_PROMPT)(
    "$displayName sets hideAutoPrompt, so auto-prompt is unavailable",
    ({ model }) => {
      expect(isAutoPromptAvailableForModel(model)).toBe(false);
    }
  );

  it.each(MODELS_OFFERING_AUTO_PROMPT)(
    "$displayName leaves hideAutoPrompt unset, so auto-prompt is available",
    ({ model }) => {
      expect(isAutoPromptAvailableForModel(model)).toBe(true);
    }
  );

  it("treats a missing model as offering no auto-prompt", () => {
    expect(isAutoPromptAvailableForModel(undefined)).toBe(false);
  });

  it("treats a model with no prompt setting as offering no auto-prompt", () => {
    expect(isAutoPromptAvailableForModel({ settingsGroups: [] })).toBe(false);
  });
});
