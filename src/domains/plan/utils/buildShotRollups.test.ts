import { PlanStep, ToolName } from "@schemas/plan";
import { describe, expect, it } from "vitest";

import { buildShotRollups } from "./buildShotRollups";

let counter = 0;

const step = (
  timelineId: string,
  toolName: ToolName,
  overrides: Partial<PlanStep> = {}
): PlanStep => ({
  id: `step-${counter++}`,
  plan_id: "plan-1",
  timeline_id: timelineId,
  step_order: overrides.step_order ?? counter,
  tool_name: toolName,
  status: overrides.status ?? "COMPLETED",
  ...overrides
});

describe("buildShotRollups", () => {
  it("orders lanes by timelineOrder, appending unknown groups last", () => {
    const steps = [
      step("b", "submit_img2img"),
      step("a", "submit_img2img"),
      step("c", "submit_img2img")
    ];

    const rollups = buildShotRollups(steps, ["a", "b"]);

    expect(rollups.map((r) => r.timelineId)).toEqual(["a", "b", "c"]);
  });

  it("pulls img2img input, references, and result from the right steps", () => {
    const steps = [
      step("a", "submit_img2img", {
        step_order: 1,
        tool_args: { settings: { reference_images: ["ref-1", "ref-2"] } }
      }),
      step("a", "poll_img2img", {
        step_order: 2,
        result: {
          input_image_id: "input-1",
          asset_id: "out-1",
          output_url: "u"
        }
      })
    ];

    const { img2img } = buildShotRollups(steps, ["a"])[0];

    expect(img2img.inputImageIds).toEqual(["input-1"]);
    expect(img2img.referenceImageIds).toEqual(["ref-1", "ref-2"]);
    expect(img2img.resultAssetId).toBe("out-1");
    expect(img2img.resultUrl).toBe("u");
    expect(img2img.isRendering).toBe(false);
  });

  it("collects multiple, de-duplicated img2img input images", () => {
    const steps = [
      step("a", "submit_img2img", {
        step_order: 1,
        tool_args: {
          settings: { input_image_ids: ["in-1", "in-2"] }
        },
        result: { input_image_id: "in-1" }
      })
    ];

    expect(buildShotRollups(steps, ["a"])[0].img2img.inputImageIds).toEqual([
      "in-1",
      "in-2"
    ]);
  });

  it("falls back to plan-level style refs when the step carries none", () => {
    const steps = [step("a", "submit_img2img", { tool_args: {} })];

    expect(
      buildShotRollups(steps, ["a"], ["style-1", "style-2"])[0].img2img
        .referenceImageIds
    ).toEqual(["style-1", "style-2"]);
  });

  it("prefers the step's own references (style + prev shot) over the fallback", () => {
    const steps = [
      step("a", "submit_img2img", {
        tool_args: { settings: { reference_images: ["style-1", "prev-shot"] } }
      })
    ];

    expect(
      buildShotRollups(steps, ["a"], ["fallback-only"])[0].img2img
        .referenceImageIds
    ).toEqual(["style-1", "prev-shot"]);
  });

  it("resolves a $prev token to the previous shot's keyframe handoff", () => {
    const steps = [
      step("a", "submit_img2img", {
        step_order: 1,
        result: { input_image_id: "a-input" }
      }),
      step("a", "poll_pick_keyframes", {
        step_order: 2,
        result: { shot_reference_image_id: "a-keyframe" }
      }),
      step("b", "submit_img2img", {
        step_order: 3,
        tool_args: {
          settings: { reference_images: ["user-ref", "$prev.input_image_id"] }
        }
      })
    ];

    const [, shotB] = buildShotRollups(steps, ["a", "b"]);

    expect(shotB.img2img.referenceImageIds).toEqual(["user-ref", "a-keyframe"]);
  });

  it("falls back to the previous shot's result, then input, when no keyframe", () => {
    const steps = [
      step("a", "poll_img2img", {
        step_order: 1,
        result: { asset_id: "a-result" }
      }),
      step("b", "submit_img2img", {
        step_order: 2,
        tool_args: { settings: { reference_images: ["$prev.input_image_id"] } }
      })
    ];

    const [, shotB] = buildShotRollups(steps, ["a", "b"]);

    expect(shotB.img2img.referenceImageIds).toEqual(["a-result"]);
  });

  it("drops an unresolvable $prev token on the first shot", () => {
    const steps = [
      step("a", "submit_img2img", {
        tool_args: { settings: { reference_images: ["$prev.input_image_id"] } }
      })
    ];

    expect(buildShotRollups(steps, ["a"])[0].img2img.referenceImageIds).toEqual(
      []
    );
  });

  it("flags img2img as rendering while poll runs without a result", () => {
    const steps = [
      step("a", "poll_img2img", {
        step_order: 1,
        status: "RUNNING",
        result: null
      })
    ];

    expect(buildShotRollups(steps, ["a"])[0].img2img.isRendering).toBe(true);
  });

  it("includes ref_asset_ids from poll_img_metrics alongside step-carried references", () => {
    const steps = [
      step("a", "submit_img2img", {
        step_order: 1,
        tool_args: { settings: { reference_images: ["style-1"] } }
      }),
      step("a", "poll_img_metrics", {
        step_order: 2,
        result: { ref_asset_ids: ["style-1", "judge-ref"] }
      })
    ];

    expect(buildShotRollups(steps, ["a"])[0].img2img.referenceImageIds).toEqual(
      ["style-1", "judge-ref"]
    );
  });

  it("derives the metric chip from poll_img_metrics", () => {
    const steps = [
      step("a", "poll_img_metrics", {
        result: { metrics: { status: "COMPLETED", pass: true, score: 0.9 } }
      })
    ];

    expect(buildShotRollups(steps, ["a"])[0].img2img.metric?.kind).toBe("pass");
  });

  it("marks video present and reads its render asset", () => {
    const steps = [
      step("a", "submit_video_render", { step_order: 1 }),
      step("a", "poll_video_render", {
        step_order: 2,
        result: { render_asset_id: "vid-1" }
      }),
      step("a", "poll_vid_metrics", {
        step_order: 3,
        result: { video_metrics: { status: "FAILED" } }
      })
    ];

    const { video } = buildShotRollups(steps, ["a"])[0];

    expect(video.present).toBe(true);
    expect(video.resultAssetId).toBe("vid-1");
    expect(video.metric?.kind).toBe("unscored");
  });

  it("reports video absent when there are no video steps", () => {
    const steps = [step("a", "submit_img2img")];
    expect(buildShotRollups(steps, ["a"])[0].video.present).toBe(false);
  });

  it("surfaces the previous-shot gate state", () => {
    const waiting = [
      step("b", "poll_prev_shot_complete", { status: "RUNNING" })
    ];
    expect(buildShotRollups(waiting, ["b"])[0].waitingForPrev).toBe(true);

    const failed = [step("b", "poll_prev_shot_complete", { status: "FAILED" })];
    expect(buildShotRollups(failed, ["b"])[0].prevShotFailed).toBe(true);
  });

  it("picks the running step as the current tool", () => {
    const steps = [
      step("a", "submit_img2img", { step_order: 1, status: "COMPLETED" }),
      step("a", "poll_img2img", { step_order: 2, status: "RUNNING" })
    ];

    expect(buildShotRollups(steps, ["a"])[0].currentToolName).toBe(
      "poll_img2img"
    );
  });

  it("reads the keyframe handoff asset for the next shot", () => {
    const steps = [
      step("a", "poll_pick_keyframes", {
        result: { shot_reference_image_id: "kf-1" }
      })
    ];

    expect(buildShotRollups(steps, ["a"])[0].keyframeHandoffAssetId).toBe(
      "kf-1"
    );
  });
});
