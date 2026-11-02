import { BulkRendersRunStep } from "@schemas/bulkRendersRun";
import { describe, expect, it } from "vitest";

import { resolveBulkRendersRunRemainingShotIds } from "./resolveBulkRendersRunRemainingShotIds";

const buildStep = (overrides: {
  timelineId: string;
  toolName: string;
  status: BulkRendersRunStep["status"];
}): BulkRendersRunStep => ({
  id: `${overrides.timelineId}-${overrides.toolName}`,
  plan_id: "plan-1",
  timeline_id: overrides.timelineId,
  step_order: 0,
  tool_name: overrides.toolName,
  status: overrides.status,
  result: null,
  error: null,
  retry_count: null,
  started_at: null,
  finished_at: null
});

describe("resolveBulkRendersRunRemainingShotIds", () => {
  it("owes both an image and a video render for a Shot with no steps yet", () => {
    const result = resolveBulkRendersRunRemainingShotIds({
      shotIds: ["shot-1"],
      steps: []
    });

    expect(result).toEqual({
      shotIdsOwingImageRender: ["shot-1"],
      shotIdsOwingVideoRender: ["shot-1"]
    });
  });

  it("owes nothing for a Shot whose image and video chains have both completed", () => {
    const steps = [
      buildStep({
        timelineId: "shot-1",
        toolName: "img_quality_final",
        status: "COMPLETED"
      }),
      buildStep({
        timelineId: "shot-1",
        toolName: "poll_vid_retry",
        status: "SKIPPED"
      })
    ];

    const result = resolveBulkRendersRunRemainingShotIds({
      shotIds: ["shot-1"],
      steps
    });

    expect(result).toEqual({
      shotIdsOwingImageRender: [],
      shotIdsOwingVideoRender: []
    });
  });

  it("owes only a video render for a Shot whose image chain finished but video has not started", () => {
    const steps = [
      buildStep({
        timelineId: "shot-1",
        toolName: "img_quality_final",
        status: "COMPLETED"
      })
    ];

    const result = resolveBulkRendersRunRemainingShotIds({
      shotIds: ["shot-1"],
      steps
    });

    expect(result).toEqual({
      shotIdsOwingImageRender: [],
      shotIdsOwingVideoRender: ["shot-1"]
    });
  });

  it("keeps each Shot's remaining state independent across a mixed run", () => {
    const steps = [
      buildStep({
        timelineId: "shot-done",
        toolName: "img_quality_final",
        status: "COMPLETED"
      }),
      buildStep({
        timelineId: "shot-done",
        toolName: "poll_vid_retry",
        status: "COMPLETED"
      }),
      buildStep({
        timelineId: "shot-in-progress",
        toolName: "poll_img2img",
        status: "RUNNING"
      })
    ];

    const result = resolveBulkRendersRunRemainingShotIds({
      shotIds: ["shot-done", "shot-in-progress"],
      steps
    });

    expect(result).toEqual({
      shotIdsOwingImageRender: ["shot-in-progress"],
      shotIdsOwingVideoRender: ["shot-in-progress"]
    });
  });
});
