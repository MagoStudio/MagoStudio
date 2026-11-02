import { describe, expect, it } from "vitest";

import { happyHorse1Model } from "../happyHorse1Model";
import { kling2_6MotionControlModel } from "../kling2_6MotionControlModel";
import { kling3_0MotionControlModel } from "../kling3_0MotionControlModel";
import { klingO1Model } from "../klingO1Model";
import { magoV2_5_0RenderModel } from "../magoV2_5_0VideoModel";
import { magoV3_4_0RenderModel } from "../magoV3_4_0VideoModel";
import { magoV4_0_0RenderModel } from "../magoV4_0_0VideoModel";
import { magoV5_0_0RenderModel } from "../magoV5_0_0VideoModel";
import { seedance2Model } from "../seedance2Model";
import { v5_1_0InpaintingRenderModel } from "../v5_1_0InpaintingVideoModel";

import { modelSupportedSourceRoles } from "./modelSupportedSourceRoles";

describe("modelSupportedSourceRoles", () => {
  it("Mago V2.5.0 (declares key_frame, no wireSourceRoles): only key_frame", () => {
    expect(modelSupportedSourceRoles(magoV2_5_0RenderModel)).toEqual(
      new Set(["key_frame"])
    );
  });

  it("Mago Transform (V3.4.0) unions its slot role with its declared wireSourceRoles", () => {
    expect(modelSupportedSourceRoles(magoV3_4_0RenderModel)).toEqual(
      new Set(["key_frame", "reference_frame"])
    );
  });

  it("Mago V4.0.0 unions its slot role with its declared wireSourceRoles", () => {
    expect(modelSupportedSourceRoles(magoV4_0_0RenderModel)).toEqual(
      new Set(["key_frame", "reference_frame"])
    );
  });

  it("Mago V5.0.0 declares both slot roles (style_reference + key_frame) plus its wireSourceRoles", () => {
    expect(modelSupportedSourceRoles(magoV5_0_0RenderModel)).toEqual(
      new Set(["style_reference", "key_frame", "reference_frame"])
    );
  });

  it("V5.1.0 Inpainting: only reference_frame", () => {
    expect(modelSupportedSourceRoles(v5_1_0InpaintingRenderModel)).toEqual(
      new Set(["reference_frame"])
    );
  });

  it("Kling 2.6 Motion Control: only motion_reference", () => {
    expect(modelSupportedSourceRoles(kling2_6MotionControlModel)).toEqual(
      new Set(["motion_reference"])
    );
  });

  it("Kling 3.0 Motion Control: motion_reference + element pair", () => {
    expect(modelSupportedSourceRoles(kling3_0MotionControlModel)).toEqual(
      new Set(["motion_reference", "element_reference", "element_frontal"])
    );
  });

  it("Kling O1: reference_frame + element pair", () => {
    expect(modelSupportedSourceRoles(klingO1Model)).toEqual(
      new Set(["reference_frame", "element_reference", "element_frontal"])
    );
  });

  it("Seedance 2.0: only reference_frame", () => {
    expect(modelSupportedSourceRoles(seedance2Model)).toEqual(
      new Set(["reference_frame"])
    );
  });

  it("Happy Horse 1.0: only reference_frame", () => {
    expect(modelSupportedSourceRoles(happyHorse1Model)).toEqual(
      new Set(["reference_frame"])
    );
  });
});
