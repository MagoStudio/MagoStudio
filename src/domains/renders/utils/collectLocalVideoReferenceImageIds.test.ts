import { VideoEngine } from "@models/video/types";
import { describe, expect, it } from "vitest";

import { collectLocalVideoReferenceImageIds } from "./collectLocalVideoReferenceImageIds";

describe("collectLocalVideoReferenceImageIds", () => {
  it("reads Happy Horse's dedicated reference list", () => {
    expect(
      collectLocalVideoReferenceImageIds(VideoEngine.happy_horse_1, {
        reference_image_ids: ["a", "b"],
        image_ids: ["ignored"]
      })
    ).toEqual(["a", "b"]);
  });

  it("reads the start and end frames for the Image-to-Video models", () => {
    for (const model of [
      VideoEngine.seedance_2_i2v,
      VideoEngine.seedance_2_i2v_fast
    ]) {
      expect(
        collectLocalVideoReferenceImageIds(model, {
          image_id: "start",
          end_image_id: "end",
          image_ids: ["ignored"]
        })
      ).toEqual(["start", "end"]);
      expect(
        collectLocalVideoReferenceImageIds(model, {
          image_id: "start",
          end_image_id: undefined
        })
      ).toEqual(["start"]);
    }
  });

  it("reads image_ids for Seedance", () => {
    expect(
      collectLocalVideoReferenceImageIds(VideoEngine.seedance_2, {
        image_ids: ["a", 3, "b"]
      })
    ).toEqual(["a", "b"]);
  });

  it("collects gallery, character and element images for Kling, without duplicates", () => {
    expect(
      collectLocalVideoReferenceImageIds(VideoEngine.kling_o1, {
        image_ids: ["gallery-1", "shared"],
        elements: [
          {
            reference_image_id: ["shared"],
            frontal_image_id: "frontal-1"
          }
        ]
      })
    ).toEqual(["gallery-1", "shared", "frontal-1"]);
  });

  it("collects the single character image for Kling motion control", () => {
    expect(
      collectLocalVideoReferenceImageIds(VideoEngine.kling_3_motion_control, {
        image_id: "character-1"
      })
    ).toEqual(["character-1"]);
  });

  it("returns an empty list when nothing is referenced", () => {
    expect(
      collectLocalVideoReferenceImageIds(
        VideoEngine.kling_2_6_motion_control,
        {}
      )
    ).toEqual([]);
  });

  it("ignores an empty MiniMax H3 edited frame id", () => {
    expect(
      collectLocalVideoReferenceImageIds(VideoEngine.minimax_h3_local, {
        vfx_edited_frame_id: "",
        image_ids: ["head"]
      })
    ).toEqual(["head"]);
  });
});
