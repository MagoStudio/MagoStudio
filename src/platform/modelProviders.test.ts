import { VideoEngine } from "@models/video/types";
import { describe, expect, it } from "vitest";

import {
  PROVIDER_LABEL,
  providersForVideoModel,
  providersForImageModel,
  runsOnMagoCredits,
  supportsProvider
} from "./modelProviders";

const BACKEND_INTEGRATED_MODELS = [
  "kling_o1",
  "kling_2_6_motion_control",
  "kling_3_motion_control",
  "kling_o3_edit_pro",
  "seedance_2",
  "happy_horse_1",
  "seedance_2_i2v",
  "seedance_2_i2v_fast"
];

describe("providersForVideoModel", () => {
  it("keeps the Comfy models local, since the cloud has no equivalent", () => {
    for (const model of [
      VideoEngine.wan_animate_2_2,
      VideoEngine.wan_vace_2_1,
      VideoEngine.mago_style_transfer_local,
      VideoEngine.mago_animate,
      VideoEngine.ltx_2_3_spatial_upscaler
    ]) {
      expect(providersForVideoModel(model)).toEqual(["local-comfy"]);
    }
  });

  it("lets the third-party models run only on Mago credits", () => {
    for (const model of BACKEND_INTEGRATED_MODELS) {
      expect(providersForVideoModel(model)).toEqual(["mago-cloud"]);
    }
  });

  it("keeps Mago's own engines cloud-only", () => {
    for (const model of [
      VideoEngine.V8_0_0,
      VideoEngine.V7_0_0,
      VideoEngine.V3_4_0,
      VideoEngine.v1_0_0_upscaler,
      VideoEngine.v1_0_0_mask
    ]) {
      expect(providersForVideoModel(model)).toEqual(["mago-cloud"]);
    }
  });

  it("treats an unknown model as cloud-only rather than assuming a local key", () => {
    expect(providersForVideoModel("brand_new_model")).toEqual(["mago-cloud"]);
    expect(providersForVideoModel(undefined)).toEqual(["mago-cloud"]);
  });
});

describe("Mago Cloud integrations and the backend's integrated list", () => {
  it("stay in step, so no fal model is offered that the cloud cannot run", () => {
    // If a fal-wired model is added locally that the backend does not list as
    // integrated, this fails -- which is the point. Offering it as "Mago cloud"
    // would produce a submission the backend rejects.
    const dualCapable = BACKEND_INTEGRATED_MODELS.filter((model) =>
      supportsProvider(model, "mago-cloud")
    );

    expect(dualCapable.sort()).toEqual([...BACKEND_INTEGRATED_MODELS].sort());
  });

  it("never claims cloud support for a Comfy model", () => {
    for (const model of [
      VideoEngine.wan_animate_2_2,
      VideoEngine.mago_animate
    ]) {
      expect(runsOnMagoCredits(model)).toBe(false);
    }
  });
});

describe("PROVIDER_LABEL", () => {
  it("names each provider by what it costs the user", () => {
    expect(PROVIDER_LABEL["local-comfy"]).toBe("Local");
    expect(PROVIDER_LABEL["mago-cloud"]).toBe("Mago cloud");
  });
});

describe("image providers", () => {
  it("preserves fal-backed image models exclusively through Mago Cloud", () => {
    for (const model of [
      "gpt_image_2",
      "seedream_5_pro",
      "nanobanana_pro",
      "nanobanana_2"
    ])
      expect(providersForImageModel(model)).toEqual(["mago-cloud"]);
    expect(providersForImageModel("qwen")).toEqual(["local-comfy"]);
  });
});
