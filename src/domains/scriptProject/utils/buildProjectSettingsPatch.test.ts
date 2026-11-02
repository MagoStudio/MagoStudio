import { Project } from "@schemas/project";
import { describe, expect, it } from "vitest";

import { buildProjectSettingsPatch } from "./buildProjectSettingsPatch";

const baseProject: Project = {
  id: "p1",
  name: "A Project",
  description: null,
  active: true,
  type: "script_to_shots",
  settings: {
    sheet_render_model: "seedream_5_pro_t2i",
    output_size: [1080, 1920]
  }
};

describe("buildProjectSettingsPatch", () => {
  it("keeps an unrelated existing setting when patching a different one", () => {
    const patched = buildProjectSettingsPatch(baseProject, {
      agent_script: "Scene one."
    });

    expect(patched.sheet_render_model).toBe("seedream_5_pro_t2i");
    expect(patched.output_size).toEqual([1080, 1920]);
  });

  it("applies the patched fields", () => {
    const patched = buildProjectSettingsPatch(baseProject, {
      agent_script: "Scene one."
    });

    expect(patched.agent_script).toBe("Scene one.");
  });

  it("lets the patch overwrite an existing field", () => {
    const patched = buildProjectSettingsPatch(baseProject, {
      sheet_render_model: "gpt_image_2_t2i"
    });

    expect(patched.sheet_render_model).toBe("gpt_image_2_t2i");
  });
});
