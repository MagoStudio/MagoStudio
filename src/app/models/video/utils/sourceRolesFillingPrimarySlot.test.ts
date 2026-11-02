import { describe, expect, it } from "vitest";

import { kling2_6MotionControlModel } from "../kling2_6MotionControlModel";
import { klingO1Model } from "../klingO1Model";
import { magoV3_4_0RenderModel } from "../magoV3_4_0VideoModel";
import { magoV5_0_0RenderModel } from "../magoV5_0_0VideoModel";

import { sourceRolesFillingPrimarySlot } from "./sourceRolesFillingPrimarySlot";

describe("sourceRolesFillingPrimarySlot", () => {
  it("unions the declared slot roles with the roles the model round-trips on the wire (MAGO V3.4.0)", () => {
    expect(sourceRolesFillingPrimarySlot(magoV3_4_0RenderModel)).toEqual([
      "key_frame",
      "reference_frame",
      "key_frame"
    ]);
  });

  it("keeps the slot's own roles first so the declared primary role wins (MAGO V5.0.0)", () => {
    expect(sourceRolesFillingPrimarySlot(magoV5_0_0RenderModel)).toEqual([
      "key_frame",
      "style_reference",
      "reference_frame"
    ]);
  });

  it("returns only the slot role for a model that round-trips nothing extra", () => {
    expect(sourceRolesFillingPrimarySlot(kling2_6MotionControlModel)).toEqual([
      "motion_reference"
    ]);
  });

  it("returns an empty array for a model with no primary slot and no wire roles", () => {
    expect(sourceRolesFillingPrimarySlot(klingO1Model)).toEqual([]);
  });
});
