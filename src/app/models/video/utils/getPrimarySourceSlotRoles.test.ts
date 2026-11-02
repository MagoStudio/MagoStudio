import { VideoModelDefinition } from "@models/video/types";
import { describe, expect, it } from "vitest";

import { kling2_6MotionControlModel } from "../kling2_6MotionControlModel";
import { klingO1Model } from "../klingO1Model";
import { magoV3_4_0RenderModel } from "../magoV3_4_0VideoModel";
import { magoV5_0_0RenderModel } from "../magoV5_0_0VideoModel";

import { getPrimarySourceSlotRoles } from "./getPrimarySourceSlotRoles";

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

describe("getPrimarySourceSlotRoles", () => {
  it("returns the single declared role of the primary slot (MAGO V3.4.0)", () => {
    expect(getPrimarySourceSlotRoles(magoV3_4_0RenderModel)).toEqual([
      "key_frame"
    ]);
  });

  it("returns every declared role, in order, when the slot declares several (MAGO V5.0.0)", () => {
    expect(getPrimarySourceSlotRoles(magoV5_0_0RenderModel)).toEqual([
      "key_frame",
      "style_reference"
    ]);
  });

  it("returns motion_reference for the Kling motion-control character slot", () => {
    expect(getPrimarySourceSlotRoles(kling2_6MotionControlModel)).toEqual([
      "motion_reference"
    ]);
  });

  it("returns an empty array for a model with no primary source slot at all", () => {
    expect(getPrimarySourceSlotRoles(klingO1Model)).toEqual([]);
  });

  it("ignores a primary slot that declares no valid role", () => {
    expect(
      getPrimarySourceSlotRoles(modelWithPrimarySlotDeclaring(["not_a_role"]))
    ).toEqual([]);
  });
});
