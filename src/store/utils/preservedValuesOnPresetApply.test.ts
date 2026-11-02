import { extractDefaultVideoSettings } from "@models/video/extractDefaultVideoSettings";
import { magoV3_4_0RenderModel } from "@models/video/magoV3_4_0VideoModel";
import { magoV5_0_0RenderModel } from "@models/video/magoV5_0_0VideoModel";
import { VideoSettings } from "@models/video/types";
import { describe, expect, it } from "vitest";

import { preservedValuesOnPresetApply } from "./preservedValuesOnPresetApply";

describe("preservedValuesOnPresetApply", () => {
  it("preserves an always-visible current value (prompt) not overridden by the preset", () => {
    const currentValues = {
      ...(extractDefaultVideoSettings(magoV5_0_0RenderModel) as VideoSettings),
      prompt: "a custom prompt",
      negative_prompt: "a custom negative prompt"
    };

    const result = preservedValuesOnPresetApply(
      magoV3_4_0RenderModel,
      currentValues,
      { control_type: "pose" }
    );

    expect(result.prompt).toBe("a custom prompt");
    expect(result.negative_prompt).toBe("a custom negative prompt");
  });

  it("lets a preset override win over a preserved always-visible current value", () => {
    const currentValues = {
      ...(extractDefaultVideoSettings(magoV3_4_0RenderModel) as VideoSettings),
      control_type: "depth"
    };

    const result = preservedValuesOnPresetApply(
      magoV3_4_0RenderModel,
      currentValues,
      { control_type: "pose" }
    );

    expect(result.control_type).toBe("pose");
  });

  it("applies the target model's defaults for keys the current model does not share", () => {
    const currentValues = extractDefaultVideoSettings(
      magoV5_0_0RenderModel
    ) as VideoSettings;

    const result = preservedValuesOnPresetApply(
      magoV3_4_0RenderModel,
      currentValues,
      {}
    );

    expect(result.control_type).toBe(
      (extractDefaultVideoSettings(magoV3_4_0RenderModel) as VideoSettings)
        .control_type
    );
  });

  it("does not preserve a non-always-visible current value (cfg) across the switch", () => {
    const currentValues = {
      ...(extractDefaultVideoSettings(magoV3_4_0RenderModel) as VideoSettings),
      cfg: 5
    };

    const result = preservedValuesOnPresetApply(
      magoV3_4_0RenderModel,
      currentValues,
      {}
    );

    expect(result.cfg).toBe(
      (extractDefaultVideoSettings(magoV3_4_0RenderModel) as VideoSettings).cfg
    );
  });

  it("applies an advanced-level preset override even though it is not always-visible", () => {
    const currentValues = extractDefaultVideoSettings(
      magoV3_4_0RenderModel
    ) as VideoSettings;

    const result = preservedValuesOnPresetApply(
      magoV3_4_0RenderModel,
      currentValues,
      { cfg: 3 }
    );

    expect(result.cfg).toBe(3);
  });
});
