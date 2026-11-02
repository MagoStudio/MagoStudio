import { BulkRendersRunStep } from "@schemas/bulkRendersRun";
import { describe, expect, it } from "vitest";

import {
  IMAGE_CHAIN_TOOL_NAMES,
  VIDEO_CHAIN_TOOL_NAMES
} from "./bulkRendersRunToolChains";
import { deriveBulkRendersRunShotStepProgress } from "./deriveBulkRendersRunShotStepProgress";

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

describe("deriveBulkRendersRunShotStepProgress", () => {
  it("reports zero completed and zero total for a Shot with no steps yet", () => {
    const progress = deriveBulkRendersRunShotStepProgress({
      shotIds: ["shot-1"],
      steps: []
    });

    expect(progress["shot-1"]).toEqual({
      completedStepCount: 0,
      totalStepCount: 0
    });
  });

  it("counts COMPLETED and SKIPPED steps as completed, other statuses as not", () => {
    const progress = deriveBulkRendersRunShotStepProgress({
      shotIds: ["shot-1"],
      steps: [
        buildStep({ status: "COMPLETED" }),
        buildStep({ status: "SKIPPED" }),
        buildStep({ status: "RUNNING" }),
        buildStep({ status: "PENDING" }),
        buildStep({ status: "FAILED" })
      ]
    });

    expect(progress["shot-1"]).toEqual({
      completedStepCount: 2,
      totalStepCount: 5
    });
  });

  it("scopes counts to each Shot's own steps", () => {
    const progress = deriveBulkRendersRunShotStepProgress({
      shotIds: ["shot-1", "shot-2"],
      steps: [
        buildStep({ timeline_id: "shot-1", status: "COMPLETED" }),
        buildStep({ timeline_id: "shot-2", status: "PENDING" }),
        buildStep({ timeline_id: "shot-2", status: "COMPLETED" })
      ]
    });

    expect(progress["shot-1"]).toEqual({
      completedStepCount: 1,
      totalStepCount: 1
    });
    expect(progress["shot-2"]).toEqual({
      completedStepCount: 1,
      totalStepCount: 2
    });
  });

  it("excludes a finalize step with no timeline_id from every Shot's counts", () => {
    const progress = deriveBulkRendersRunShotStepProgress({
      shotIds: ["shot-1"],
      steps: [
        buildStep({
          timeline_id: null,
          tool_name: "run_summary",
          status: "COMPLETED"
        })
      ]
    });

    expect(progress["shot-1"]).toEqual({
      completedStepCount: 0,
      totalStepCount: 0
    });
  });

  it("scopes counts to only the steps in the given chain when chainToolNames is passed", () => {
    const progress = deriveBulkRendersRunShotStepProgress({
      shotIds: ["shot-1"],
      steps: [
        buildStep({ tool_name: "submit_img2img", status: "COMPLETED" }),
        buildStep({ tool_name: "poll_img2img", status: "PENDING" }),
        buildStep({ tool_name: "submit_video_render", status: "COMPLETED" }),
        buildStep({ tool_name: "poll_video_render", status: "COMPLETED" })
      ],
      chainToolNames: IMAGE_CHAIN_TOOL_NAMES
    });

    expect(progress["shot-1"]).toEqual({
      completedStepCount: 1,
      totalStepCount: 2
    });
  });

  it("scopes counts to the video chain independently of the image chain", () => {
    const progress = deriveBulkRendersRunShotStepProgress({
      shotIds: ["shot-1"],
      steps: [
        buildStep({ tool_name: "submit_img2img", status: "COMPLETED" }),
        buildStep({ tool_name: "submit_video_render", status: "COMPLETED" }),
        buildStep({ tool_name: "poll_video_render", status: "RUNNING" })
      ],
      chainToolNames: VIDEO_CHAIN_TOOL_NAMES
    });

    expect(progress["shot-1"]).toEqual({
      completedStepCount: 1,
      totalStepCount: 2
    });
  });

  it("counts every step when no chainToolNames filter is given", () => {
    const progress = deriveBulkRendersRunShotStepProgress({
      shotIds: ["shot-1"],
      steps: [
        buildStep({ tool_name: "submit_img2img", status: "COMPLETED" }),
        buildStep({ tool_name: "submit_video_render", status: "COMPLETED" })
      ]
    });

    expect(progress["shot-1"]).toEqual({
      completedStepCount: 2,
      totalStepCount: 2
    });
  });

  it("gives a Shot literally named __proto__ its own entry rather than reassigning the object prototype", () => {
    const progress = deriveBulkRendersRunShotStepProgress({
      shotIds: ["__proto__"],
      steps: [buildStep({ timeline_id: "__proto__", status: "COMPLETED" })]
    });

    expect(progress["__proto__"]).toEqual({
      completedStepCount: 1,
      totalStepCount: 1
    });
    expect(Object.getPrototypeOf(progress)).toBeNull();
  });
});
