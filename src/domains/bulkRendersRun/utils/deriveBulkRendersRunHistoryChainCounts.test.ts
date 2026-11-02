import { BulkRendersRunStep } from "@schemas/bulkRendersRun";
import { describe, expect, it } from "vitest";

import { deriveBulkRendersRunHistoryChainCounts } from "./deriveBulkRendersRunHistoryChainCounts";

const buildStep = (overrides: {
  timelineId: string;
  toolName: string;
  status: BulkRendersRunStep["status"];
  result?: unknown;
}): BulkRendersRunStep => ({
  id: `${overrides.timelineId}-${overrides.toolName}`,
  plan_id: "run-1",
  timeline_id: overrides.timelineId,
  step_order: 0,
  tool_name: overrides.toolName,
  status: overrides.status,
  result: overrides.result ?? null,
  error: null,
  retry_count: null,
  started_at: null,
  finished_at: null
});

describe("deriveBulkRendersRunHistoryChainCounts", () => {
  it("counts a Shot as produced when its image chain reached ready", () => {
    const steps: BulkRendersRunStep[] = [
      buildStep({
        timelineId: "shot-1",
        toolName: "poll_img2img",
        status: "COMPLETED",
        result: { asset_id: "asset-1" }
      }),
      buildStep({
        timelineId: "shot-2",
        toolName: "poll_img2img",
        status: "RUNNING"
      })
    ];

    const counts = deriveBulkRendersRunHistoryChainCounts({
      shotIds: ["shot-1", "shot-2"],
      videoShotIds: [],
      steps
    });

    expect(counts.imageChainCompletedCount).toBe(1);
  });

  it("counts a Shot as an error, not produced, when its image chain's terminal step failed quality despite an earlier resolvable asset", () => {
    const steps: BulkRendersRunStep[] = [
      buildStep({
        timelineId: "shot-1",
        toolName: "poll_img2img",
        status: "COMPLETED",
        result: { asset_id: "rendered-but-quality-failed-asset" }
      }),
      buildStep({
        timelineId: "shot-1",
        toolName: "img_quality_final",
        status: "FAILED"
      })
    ];

    const counts = deriveBulkRendersRunHistoryChainCounts({
      shotIds: ["shot-1"],
      videoShotIds: [],
      steps
    });

    expect(counts.imageChainCompletedCount).toBe(0);
    expect(counts.imageChainErrorCount).toBe(1);
  });

  it("counts a FAILED step on the chain as an error, whether quality or infrastructure", () => {
    const steps: BulkRendersRunStep[] = [
      buildStep({
        timelineId: "shot-1",
        toolName: "img_quality_final",
        status: "FAILED"
      }),
      buildStep({
        timelineId: "shot-2",
        toolName: "poll_img2img",
        status: "FAILED"
      }),
      buildStep({
        timelineId: "shot-3",
        toolName: "poll_img2img",
        status: "COMPLETED",
        result: { asset_id: "asset-3" }
      })
    ];

    const counts = deriveBulkRendersRunHistoryChainCounts({
      shotIds: ["shot-1", "shot-2", "shot-3"],
      videoShotIds: [],
      steps
    });

    expect(counts.imageChainErrorCount).toBe(2);
  });

  it("counts a video as produced independently of whether it was ever quality-scored", () => {
    const steps: BulkRendersRunStep[] = [
      buildStep({
        timelineId: "shot-1",
        toolName: "poll_video_render",
        status: "COMPLETED",
        result: { render_asset_id: "video-asset-1" }
      })
    ];

    const counts = deriveBulkRendersRunHistoryChainCounts({
      shotIds: ["shot-1"],
      videoShotIds: ["shot-1"],
      steps
    });

    expect(counts.videoChainCompletedCount).toBe(1);
    expect(counts.videoChainErrorCount).toBe(0);
  });

  it("counts a video infrastructure failure as an error just like a quality failure", () => {
    const steps: BulkRendersRunStep[] = [
      buildStep({
        timelineId: "shot-1",
        toolName: "poll_video_render",
        status: "FAILED"
      }),
      buildStep({
        timelineId: "shot-2",
        toolName: "vid_quality_gate",
        status: "FAILED"
      })
    ];

    const counts = deriveBulkRendersRunHistoryChainCounts({
      shotIds: ["shot-1", "shot-2"],
      videoShotIds: ["shot-1", "shot-2"],
      steps
    });

    expect(counts.videoChainErrorCount).toBe(2);
  });

  it("counts a Shot as an error, not produced, when its video chain's quality gate failed despite a resolvable render asset", () => {
    const steps: BulkRendersRunStep[] = [
      buildStep({
        timelineId: "shot-1",
        toolName: "poll_video_render",
        status: "COMPLETED",
        result: { render_asset_id: "rendered-but-quality-failed-video-asset" }
      }),
      buildStep({
        timelineId: "shot-1",
        toolName: "vid_quality_gate",
        status: "FAILED"
      })
    ];

    const counts = deriveBulkRendersRunHistoryChainCounts({
      shotIds: [],
      videoShotIds: ["shot-1"],
      steps
    });

    expect(counts.videoChainCompletedCount).toBe(0);
    expect(counts.videoChainErrorCount).toBe(1);
  });

  it("partitions every terminal Shot exactly once: produced plus errors equals the Shot count", () => {
    const shotIds = ["shot-produced", "shot-quality-error", "shot-infra-error"];
    const steps: BulkRendersRunStep[] = [
      buildStep({
        timelineId: "shot-produced",
        toolName: "poll_img2img",
        status: "COMPLETED",
        result: { asset_id: "asset-produced" }
      }),
      buildStep({
        timelineId: "shot-quality-error",
        toolName: "poll_img2img",
        status: "COMPLETED",
        result: { asset_id: "asset-quality-error" }
      }),
      buildStep({
        timelineId: "shot-quality-error",
        toolName: "img_quality_final",
        status: "FAILED"
      }),
      buildStep({
        timelineId: "shot-infra-error",
        toolName: "poll_img2img",
        status: "FAILED"
      })
    ];

    const counts = deriveBulkRendersRunHistoryChainCounts({
      shotIds,
      videoShotIds: [],
      steps
    });

    expect(counts.imageChainCompletedCount + counts.imageChainErrorCount).toBe(
      shotIds.length
    );
    expect(counts.imageChainCompletedCount).toBe(1);
    expect(counts.imageChainErrorCount).toBe(2);
  });

  it("reports zero counts for an empty Shot list without inspecting steps", () => {
    const counts = deriveBulkRendersRunHistoryChainCounts({
      shotIds: [],
      videoShotIds: [],
      steps: []
    });

    expect(counts).toEqual({
      imageChainCompletedCount: 0,
      imageChainErrorCount: 0,
      videoChainCompletedCount: 0,
      videoChainErrorCount: 0
    });
  });
});
