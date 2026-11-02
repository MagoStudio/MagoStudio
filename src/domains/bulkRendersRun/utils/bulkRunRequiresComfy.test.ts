import { VideoEngine } from "@models/video/types";
import { CreateBulkRendersRunRequest } from "@schemas/bulkRendersRun";
import { describe, expect, it } from "vitest";

import { bulkRunRequiresComfy } from "./bulkRunRequiresComfy";

const cloud: CreateBulkRendersRunRequest = {
  project_id: "project",
  timeline_ids: ["shot"],
  video_settings: { engine: VideoEngine.seedance_2 },
  img2img_settings: { render_model: "gpt_image_2" }
};

describe("bulkRunRequiresComfy", () => {
  it("allows cloud image and video models without local setup", () => {
    expect(bulkRunRequiresComfy(cloud)).toBe(false);
  });
  it("requires local setup for a local video model", () => {
    expect(
      bulkRunRequiresComfy({
        ...cloud,
        video_settings: { engine: VideoEngine.minimax_h3_local }
      })
    ).toBe(true);
  });
  it("requires local setup for a shot's local image override", () => {
    expect(
      bulkRunRequiresComfy({
        ...cloud,
        shot_overrides: {
          shot: { img2img_settings: { render_model: "qwen" } }
        }
      })
    ).toBe(true);
  });
  it("does not require an unused local image model for supplied frames", () => {
    expect(
      bulkRunRequiresComfy({
        ...cloud,
        img2img_settings: { render_model: "qwen" },
        shot_overrides: {
          shot: { images: [{ asset_id: "uploaded", type: "reference_frame" }] }
        }
      })
    ).toBe(false);
  });
  it("uses a cloud image override instead of the local master model", () => {
    expect(
      bulkRunRequiresComfy({
        ...cloud,
        img2img_settings: { render_model: "qwen" },
        shot_overrides: {
          shot: { img2img_settings: { render_model: "nanobanana_2" } }
        }
      })
    ).toBe(false);
  });
});
