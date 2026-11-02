import { ProjectCut, ProjectState } from "@schemas/scriptProject";
import { describe, expect, it } from "vitest";

import { buildOriginAwareScriptProjectStatsSummary } from "./buildOriginAwareScriptProjectStatsSummary";

const buildRenderedImageState = (renderModel: string) =>
  ({
    project_id: "project-1",
    sheets_timeline_id: null,
    sequential_prompt_defaults: null,
    shots: [
      { timeline_id: "kept", sequence_id: 1, dropped: false },
      { timeline_id: "dropped", sequence_id: 2, dropped: true }
    ],
    keys: [
      {
        images: [
          {
            asset_id: "image-1",
            source: "render",
            status: "success",
            render_spec: {
              render_model: renderModel,
              output_size: [1024, 1024]
            }
          }
        ]
      }
    ]
  }) as unknown as ProjectState;

const cutWithKeptAndDroppedShots = {
  project_id: "project-1",
  missing: [],
  missing_timeline_ids: [],
  hidden_shots: [],
  export: null,
  shots: [
    {
      timeline_id: "kept",
      asset_id: "video-kept",
      url: "https://cdn/kept.mp4",
      versions: []
    },
    {
      timeline_id: "dropped",
      asset_id: "video-dropped",
      url: "https://cdn/dropped.mp4",
      versions: []
    }
  ]
} as unknown as ProjectCut;

describe("buildOriginAwareScriptProjectStatsSummary", () => {
  it("counts durable local script renders even when the current cut has fewer versions", () => {
    const summary = buildOriginAwareScriptProjectStatsSummary({
      origin: "local",
      renderStats: {
        "local-script-asset-1": {
          success: true,
          cost: 0,
          render_time_in_seconds: 10
        } as never,
        "local-script-asset-2": {
          success: true,
          cost: 0,
          render_time_in_seconds: 20
        } as never
      }
    });

    expect(summary.renderedVideoCount).toBe(2);
  });

  it("counts Mago Cloud spend without including Fal spend", () => {
    const summary = buildOriginAwareScriptProjectStatsSummary({
      origin: "local",
      queueItems: [
        {
          project_id: "project-1",
          render_provider: "local-fal",
          price: 1000
        },
        {
          project_id: "project-1",
          render_provider: "mago-cloud",
          price: 25
        }
      ] as never
    });

    expect(summary.magoCloudCredits).toBe(25);
    expect(summary).not.toHaveProperty("falCostUsd");
  });

  it("prices rendered images for a cloud project", () => {
    const summary = buildOriginAwareScriptProjectStatsSummary({
      origin: "cloud",
      projectState: buildRenderedImageState("gpt_image_2_t2i")
    });

    expect(summary.estimatedCloudImageCredits).toBeGreaterThan(0);
  });

  it("shows no image or video credit rows on a local project", () => {
    const summary = buildOriginAwareScriptProjectStatsSummary({
      origin: "local",
      projectState: buildRenderedImageState("gpt_image_2_t2i")
    });

    expect(summary.estimatedCloudImageCredits).toBe(0);
    expect(summary.estimatedCloudVideoCredits).toBe(0);
  });

  it("never prices local renders as cloud images or videos", () => {
    const summary = buildOriginAwareScriptProjectStatsSummary({
      origin: "local",
      projectState: buildRenderedImageState("qwen_image_2512_local"),
      cut: cutWithKeptAndDroppedShots
    });

    expect(summary.estimatedCloudImageCredits).toBe(0);
    expect(summary.estimatedCloudVideoCredits).toBe(0);
    expect(summary.magoCloudCredits).toBe(0);
  });

  it("leaves dropped Shots' videos out of the count", () => {
    const summary = buildOriginAwareScriptProjectStatsSummary({
      origin: "cloud",
      projectState: buildRenderedImageState("gpt_image_2_t2i"),
      cut: cutWithKeptAndDroppedShots
    });

    expect(summary.renderedVideoCount).toBe(1);
  });
});
