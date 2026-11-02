import { describe, expect, it } from "vitest";

import { magoV4_0_0RenderModel } from "./magoV4_0_0VideoModel";

describe("magoV4_0_0RenderModel", () => {
  it("hides the masking_prompt section while the background is kept", () => {
    const qualityGroup = magoV4_0_0RenderModel.settingsGroups.find(
      (group) => group.level === "quality"
    );
    const maskingPromptSection = qualityGroup?.sections.find((section) =>
      section.settings.some((setting) => setting.key === "masking_prompt")
    );

    expect(
      maskingPromptSection?.hidingCondition?.({ keep_background: true }, false)
    ).toBe(true);
    expect(
      maskingPromptSection?.hidingCondition?.({ keep_background: false }, false)
    ).toBe(false);
  });
});
