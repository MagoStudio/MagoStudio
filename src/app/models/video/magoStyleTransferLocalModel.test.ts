import { describe, expect, it } from "vitest";

import { magoAnimateModel } from "./magoAnimateModel";
import { magoStyleTransferLocalModel } from "./magoStyleTransferLocalModel";
import { wanAnimate22Model } from "./wanAnimate22Model";
import { wanVace21Model } from "./wanVace21Model";

const promptSetting = (model: typeof magoStyleTransferLocalModel) =>
  model.settingsGroups
    .flatMap((group) => group.sections)
    .flatMap((section) => section.settings)
    .find((setting) => setting.key === "prompt");

describe("local Comfy video prompt tools", () => {
  it.each([
    ["Mago Style Transfer", magoStyleTransferLocalModel],
    ["Mago Animate", magoAnimateModel],
    ["Wan Animate", wanAnimate22Model],
    ["Wan VACE", wanVace21Model]
  ])("exposes AutoPrompt and Optimize Prompt for %s", (_name, model) => {
    const prompt = promptSetting(model);
    expect(prompt?.ui).toBe("PromptWithEnhancePromptButton");
    expect(prompt?.specificConfig?.hideAutoPrompt).not.toBe(true);
  });
});
