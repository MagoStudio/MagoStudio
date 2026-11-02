import { BulkRendersRunStep } from "@schemas/bulkRendersRun";
import { describe, expect, it } from "vitest";

import { deriveBulkRendersRunShotPhases } from "./deriveBulkRendersRunShotPhases";

const buildStep = (
  overrides: Partial<BulkRendersRunStep>
): BulkRendersRunStep => ({
  id: "step-1",
  plan_id: "run-1",
  timeline_id: "shot-1",
  step_order: 0,
  tool_name: "get_timeline_info",
  status: "PENDING",
  result: null,
  error: null,
  retry_count: 0,
  started_at: null,
  finished_at: null,
  ...overrides
});

describe("deriveBulkRendersRunShotPhases", () => {
  it("marks a Shot with no steps yet as pending", () => {
    const { byShotId } = deriveBulkRendersRunShotPhases({
      shotIds: ["shot-1"],
      steps: []
    });

    expect(byShotId["shot-1"]).toBe("pending");
  });

  it("marks a Shot pending while its steps are all still PENDING", () => {
    const { byShotId } = deriveBulkRendersRunShotPhases({
      shotIds: ["shot-1"],
      steps: [
        buildStep({ tool_name: "get_timeline_info", status: "PENDING" }),
        buildStep({ tool_name: "submit_img2img", status: "PENDING" })
      ]
    });

    expect(byShotId["shot-1"]).toBe("pending");
  });

  it("marks a Shot in the image phase once an image-chain step has started", () => {
    const { byShotId } = deriveBulkRendersRunShotPhases({
      shotIds: ["shot-1"],
      steps: [
        buildStep({ tool_name: "get_timeline_info", status: "COMPLETED" }),
        buildStep({ tool_name: "submit_img2img", status: "RUNNING" }),
        buildStep({ tool_name: "create_render_layer", status: "PENDING" })
      ]
    });

    expect(byShotId["shot-1"]).toBe("image");
  });

  it("marks a Shot in the video phase once a video-chain step has started", () => {
    const { byShotId } = deriveBulkRendersRunShotPhases({
      shotIds: ["shot-1"],
      steps: [
        buildStep({ tool_name: "img_quality_final", status: "COMPLETED" }),
        buildStep({ tool_name: "create_render_layer", status: "COMPLETED" }),
        buildStep({ tool_name: "submit_video_render", status: "RUNNING" })
      ]
    });

    expect(byShotId["shot-1"]).toBe("video");
  });

  it("marks a Shot failed when any of its steps failed, regardless of other steps", () => {
    const { byShotId } = deriveBulkRendersRunShotPhases({
      shotIds: ["shot-1"],
      steps: [
        buildStep({ tool_name: "submit_img2img", status: "COMPLETED" }),
        buildStep({ tool_name: "poll_img2img", status: "FAILED" }),
        buildStep({ tool_name: "create_render_layer", status: "RUNNING" })
      ]
    });

    expect(byShotId["shot-1"]).toBe("failed");
  });

  it("leaves a Shot pending when its image chain was skipped and no video step has started", () => {
    const { byShotId, aggregate } = deriveBulkRendersRunShotPhases({
      shotIds: ["shot-1"],
      steps: [
        buildStep({
          tool_name: "use_provided_reference_frame",
          status: "COMPLETED"
        }),
        buildStep({ tool_name: "submit_img2img", status: "SKIPPED" }),
        buildStep({ tool_name: "poll_img2img", status: "SKIPPED" }),
        buildStep({ tool_name: "submit_video_render", status: "PENDING" })
      ]
    });

    expect(byShotId["shot-1"]).toBe("pending");
    expect(aggregate).toBe("pending");
  });

  it("reports a run that failed before writing any step as failed, not pending", () => {
    const { aggregate } = deriveBulkRendersRunShotPhases({
      shotIds: ["shot-1"],
      steps: [],
      hasRunFailed: true
    });

    expect(aggregate).toBe("failed");
  });

  it("marks a Shot completed when every step is completed or skipped", () => {
    const { byShotId } = deriveBulkRendersRunShotPhases({
      shotIds: ["shot-1"],
      steps: [
        buildStep({ tool_name: "submit_img2img", status: "COMPLETED" }),
        buildStep({ tool_name: "poll_img_retry", status: "SKIPPED" }),
        buildStep({ tool_name: "submit_video_render", status: "COMPLETED" })
      ]
    });

    expect(byShotId["shot-1"]).toBe("completed");
  });

  it("does not let get_timeline_info alone shift the phase off pending, since it is the shared preamble for both chains", () => {
    const { byShotId } = deriveBulkRendersRunShotPhases({
      shotIds: ["shot-1"],
      steps: [buildStep({ tool_name: "get_timeline_info", status: "RUNNING" })]
    });

    expect(byShotId["shot-1"]).toBe("pending");
  });

  it("does not let an unrecognised tool name shift the phase off pending", () => {
    const { byShotId } = deriveBulkRendersRunShotPhases({
      shotIds: ["shot-1"],
      steps: [buildStep({ tool_name: "some_future_tool", status: "RUNNING" })]
    });

    expect(byShotId["shot-1"]).toBe("pending");
  });

  it("still counts an unrecognised tool name toward the completed rule", () => {
    const { byShotId } = deriveBulkRendersRunShotPhases({
      shotIds: ["shot-1"],
      steps: [buildStep({ tool_name: "some_future_tool", status: "COMPLETED" })]
    });

    expect(byShotId["shot-1"]).toBe("completed");
  });

  it("still counts an unrecognised tool name toward the failed rule", () => {
    const { byShotId } = deriveBulkRendersRunShotPhases({
      shotIds: ["shot-1"],
      steps: [buildStep({ tool_name: "some_future_tool", status: "FAILED" })]
    });

    expect(byShotId["shot-1"]).toBe("failed");
  });

  it("excludes a finalize step with no timeline_id from every Shot's steps", () => {
    const { byShotId } = deriveBulkRendersRunShotPhases({
      shotIds: ["shot-1"],
      steps: [
        buildStep({
          timeline_id: null,
          tool_name: "run_summary",
          status: "COMPLETED"
        })
      ]
    });

    expect(byShotId["shot-1"]).toBe("pending");
  });

  it("derives one phase per Shot independently", () => {
    const { byShotId } = deriveBulkRendersRunShotPhases({
      shotIds: ["shot-1", "shot-2"],
      steps: [
        buildStep({
          timeline_id: "shot-1",
          tool_name: "submit_video_render",
          status: "RUNNING"
        }),
        buildStep({
          timeline_id: "shot-2",
          tool_name: "submit_img2img",
          status: "RUNNING"
        })
      ]
    });

    expect(byShotId["shot-1"]).toBe("video");
    expect(byShotId["shot-2"]).toBe("image");
  });

  it("aggregates to image when one Shot is still on images and the rest are on video", () => {
    const { aggregate } = deriveBulkRendersRunShotPhases({
      shotIds: ["shot-1", "shot-2"],
      steps: [
        buildStep({
          timeline_id: "shot-1",
          tool_name: "submit_img2img",
          status: "RUNNING"
        }),
        buildStep({
          timeline_id: "shot-2",
          tool_name: "submit_video_render",
          status: "RUNNING"
        })
      ]
    });

    expect(aggregate).toBe("image");
  });

  it("aggregates to completed once every Shot is completed or failed", () => {
    const { aggregate } = deriveBulkRendersRunShotPhases({
      shotIds: ["shot-1", "shot-2"],
      steps: [
        buildStep({
          timeline_id: "shot-1",
          tool_name: "submit_video_render",
          status: "COMPLETED"
        }),
        buildStep({
          timeline_id: "shot-2",
          tool_name: "submit_img2img",
          status: "FAILED"
        })
      ]
    });

    expect(aggregate).toBe("completed");
  });

  it("aggregates to pending when every Shot supplied its own reference frame, so one skipped image chain does not move the whole run onto images", () => {
    const { byShotId, aggregate } = deriveBulkRendersRunShotPhases({
      shotIds: ["shot-1", "shot-2"],
      steps: ["shot-1", "shot-2"].flatMap((shotId) => [
        buildStep({
          timeline_id: shotId,
          tool_name: "use_provided_reference_frame",
          status: "COMPLETED"
        }),
        buildStep({
          timeline_id: shotId,
          tool_name: "submit_img2img",
          status: "SKIPPED"
        }),
        buildStep({
          timeline_id: shotId,
          tool_name: "poll_img2img",
          status: "SKIPPED"
        }),
        buildStep({
          timeline_id: shotId,
          tool_name: "submit_video_render",
          status: "PENDING"
        })
      ])
    });

    expect(byShotId["shot-1"]).toBe("pending");
    expect(byShotId["shot-2"]).toBe("pending");
    expect(aggregate).toBe("pending");
  });

  it("aggregates to pending for an empty selection", () => {
    const { aggregate } = deriveBulkRendersRunShotPhases({
      shotIds: [],
      steps: []
    });

    expect(aggregate).toBe("pending");
  });

  it("resolves to the video phase when a Shot has a started step in both chains, since video passing means images already gated it through", () => {
    const { byShotId } = deriveBulkRendersRunShotPhases({
      shotIds: ["shot-1"],
      steps: [
        buildStep({ tool_name: "submit_img2img", status: "RUNNING" }),
        buildStep({ tool_name: "submit_video_render", status: "RUNNING" })
      ]
    });

    expect(byShotId["shot-1"]).toBe("video");
  });

  it("gives a Shot literally named __proto__ its own entry rather than reassigning the object prototype", () => {
    const { byShotId } = deriveBulkRendersRunShotPhases({
      shotIds: ["__proto__"],
      steps: [
        buildStep({
          timeline_id: "__proto__",
          tool_name: "submit_video_render",
          status: "RUNNING"
        })
      ]
    });

    expect(byShotId["__proto__"]).toBe("video");
    expect(Object.getPrototypeOf(byShotId)).toBeNull();
  });

  it("aggregates to completed when every Shot has failed, per the earliest-active-phase rule folding failed Shots into the terminal bucket", () => {
    const { aggregate } = deriveBulkRendersRunShotPhases({
      shotIds: ["shot-1", "shot-2"],
      steps: [
        buildStep({
          timeline_id: "shot-1",
          tool_name: "submit_img2img",
          status: "FAILED"
        }),
        buildStep({
          timeline_id: "shot-2",
          tool_name: "submit_video_render",
          status: "FAILED"
        })
      ]
    });

    expect(aggregate).toBe("completed");
  });

  it("aggregates to the active Shot's phase when a pending Shot sits alongside one already in the image phase", () => {
    const { aggregate } = deriveBulkRendersRunShotPhases({
      shotIds: ["shot-1", "shot-2"],
      steps: [
        buildStep({
          timeline_id: "shot-2",
          tool_name: "submit_img2img",
          status: "RUNNING"
        })
      ]
    });

    expect(aggregate).toBe("image");
  });

  it("aggregates to the active Shot's phase when a failed Shot sits alongside one still running video", () => {
    const { aggregate } = deriveBulkRendersRunShotPhases({
      shotIds: ["shot-1", "shot-2"],
      steps: [
        buildStep({
          timeline_id: "shot-1",
          tool_name: "submit_img2img",
          status: "FAILED"
        }),
        buildStep({
          timeline_id: "shot-2",
          tool_name: "submit_video_render",
          status: "RUNNING"
        })
      ]
    });

    expect(aggregate).toBe("video");
  });
});
