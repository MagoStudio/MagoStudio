import { VideoModelDefinition } from "@models/video/types";
import { describe, expect, it } from "vitest";

import { klingO1Model } from "../klingO1Model";
import { magoV3_4_0RenderModel } from "../magoV3_4_0VideoModel";
import { magoV5_0_0RenderModel } from "../magoV5_0_0VideoModel";
import { v5_1_0InpaintingRenderModel } from "../v5_1_0InpaintingVideoModel";

import { getPrimarySourceSlotRole } from "./getPrimarySourceSlotRole";

const modelWithPrimarySlotDeclaring = (
  sourceRoles: string[]
): VideoModelDefinition =>
  ({
    settingsGroups: [
      {
        name: "Basic",
        level: "main",
        sections: [
          {
            name: undefined,
            settings: [
              {
                key: "source_image_slot",
                type: "string",
                label: "Character input",
                ui: "FileUploaderWithStylizeButton",
                specificConfig: { sourceRoles, isPrimarySourceSlot: true }
              }
            ]
          }
        ]
      }
    ]
  }) as unknown as VideoModelDefinition;

describe("getPrimarySourceSlotRole", () => {
  it("reads the declared role off the model's primary source slot (MAGO V3.4.0)", () => {
    expect(getPrimarySourceSlotRole(magoV3_4_0RenderModel)).toBe("key_frame");
  });

  it("returns the first declared role when the slot declares several (MAGO V5.0.0)", () => {
    expect(getPrimarySourceSlotRole(magoV5_0_0RenderModel)).toBe("key_frame");
  });

  it("returns the reference_frame role for the inpainting model's frame slot", () => {
    expect(getPrimarySourceSlotRole(v5_1_0InpaintingRenderModel)).toBe(
      "reference_frame"
    );
  });

  it("returns undefined for a model with no primary source slot at all", () => {
    expect(getPrimarySourceSlotRole(klingO1Model)).toBeUndefined();
  });

  it("does not depend on the UI component name, only on the declaration", () => {
    expect(
      getPrimarySourceSlotRole(
        modelWithPrimarySlotDeclaring(["motion_reference"])
      )
    ).toBe("motion_reference");
  });

  it("ignores a primary slot that declares no valid role", () => {
    expect(
      getPrimarySourceSlotRole(modelWithPrimarySlotDeclaring(["not_a_role"]))
    ).toBeUndefined();
  });
});
