import { ProjectState } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { estimateRenderedImageCredits } from "./estimateRenderedImageCredits";
import { estimateSheetImageCredits } from "./estimateSheetImageCredits";

const buildProjectState = (images: unknown[]): ProjectState =>
  ({
    project_id: "project-1",
    sheets_timeline_id: null,
    keys: [{ images }],
    shots: []
  }) as unknown as ProjectState;

const SQUARE_SIZE: [number, number] = [1024, 1024];

describe("estimateRenderedImageCredits", () => {
  it("returns zero without a project state", () => {
    expect(estimateRenderedImageCredits(undefined)).toBe(0);
  });

  it("prices a rendered image by its recorded model and output size", () => {
    const credits = estimateRenderedImageCredits(
      buildProjectState([
        {
          asset_id: "a",
          source: "render",
          render_spec: {
            render_model: "seedream_5_pro_t2i",
            output_size: SQUARE_SIZE
          }
        }
      ])
    );

    expect(credits).toBe(
      estimateSheetImageCredits("seedream_5_pro_t2i", SQUARE_SIZE)
    );
  });

  it("falls back to the default sheet model when the spec names none", () => {
    const credits = estimateRenderedImageCredits(
      buildProjectState([
        {
          asset_id: "a",
          source: "render",
          render_spec: { output_size: SQUARE_SIZE }
        }
      ])
    );

    expect(credits).toBe(
      estimateSheetImageCredits("gpt_image_2_t2i", SQUARE_SIZE)
    );
  });

  it("skips uploads, images without an output size, and repeated assets", () => {
    const pricedImage = {
      asset_id: "a",
      source: "render",
      render_spec: { output_size: SQUARE_SIZE }
    };
    const credits = estimateRenderedImageCredits(
      buildProjectState([
        pricedImage,
        pricedImage,
        { asset_id: "b", source: "upload", render_spec: null },
        { asset_id: "c", source: "render", render_spec: { prompt: "x" } }
      ])
    );

    expect(credits).toBe(
      estimateSheetImageCredits("gpt_image_2_t2i", SQUARE_SIZE)
    );
  });
});
