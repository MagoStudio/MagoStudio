import { deriveBulkRendersRunHistoryChainCounts } from "@domains/bulkRendersRun/utils/deriveBulkRendersRunHistoryChainCounts";
import { BulkRendersRunStep } from "@schemas/bulkRendersRun";
import { describe, expect, it } from "vitest";

import { BulkRenderingShotCardSource } from "../types";

import { mapBulkRendersRunStepsToShotCardRows } from "./mapBulkRendersRunStepsToShotCardRows";

const buildStep = (
  overrides: Partial<BulkRendersRunStep>
): BulkRendersRunStep => ({
  id: `${overrides.timeline_id}-${overrides.tool_name}`,
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

const isErrorCard = (row: BulkRenderingShotCardSource): boolean =>
  row.status === "failedQualityTest" || row.status === "unknownError";

describe("history row counts agree with the per-Shot cards shown below them", () => {
  const shotIds = [
    "shot-loaded",
    "shot-quality-failure",
    "shot-infra-failure",
    "shot-loading",
    "shot-unavailable"
  ];

  const buildChainSteps = ({
    prefix,
    pollToolName,
    qualityFinalToolName,
    resultKey
  }: {
    prefix: string;
    pollToolName: string;
    qualityFinalToolName: string;
    resultKey: "asset_id" | "render_asset_id";
  }): BulkRendersRunStep[] => [
    buildStep({
      timeline_id: "shot-loaded",
      tool_name: pollToolName,
      status: "COMPLETED",
      result: { [resultKey]: `${prefix}-asset-loaded` }
    }),
    buildStep({
      timeline_id: "shot-quality-failure",
      tool_name: qualityFinalToolName,
      status: "FAILED"
    }),
    buildStep({
      timeline_id: "shot-infra-failure",
      tool_name: pollToolName,
      status: "FAILED"
    }),
    buildStep({
      timeline_id: "shot-loading",
      tool_name: pollToolName,
      status: "RUNNING"
    }),
    buildStep({
      timeline_id: "shot-unavailable",
      tool_name: pollToolName,
      status: "COMPLETED",
      result: { [resultKey]: `${prefix}-asset-unresolvable` }
    })
  ];

  const imageSteps = buildChainSteps({
    prefix: "image",
    pollToolName: "poll_img2img",
    qualityFinalToolName: "img_quality_final",
    resultKey: "asset_id"
  });
  const videoSteps = buildChainSteps({
    prefix: "video",
    pollToolName: "poll_video_render",
    qualityFinalToolName: "vid_quality_gate",
    resultKey: "render_asset_id"
  });
  const steps = [...imageSteps, ...videoSteps];

  const shotNameById = new Map(shotIds.map((shotId) => [shotId, shotId]));
  const resultUrlByAssetId = new Map([
    ["image-asset-loaded", "https://example.com/image.png"],
    ["video-asset-loaded", "https://example.com/video.png"]
  ]);

  it("counts as many image errors as the image tab shows error cards", () => {
    const historyCounts = deriveBulkRendersRunHistoryChainCounts({
      shotIds,
      videoShotIds: shotIds,
      steps
    });
    const imageCardRows = mapBulkRendersRunStepsToShotCardRows({
      stepId: "image",
      shotIds,
      shotNameById,
      steps,
      resultUrlByAssetId
    });

    expect(historyCounts.imageChainErrorCount).toBe(
      imageCardRows.filter(isErrorCard).length
    );
    expect(historyCounts.imageChainErrorCount).toBe(2);
  });

  it("counts as many video errors as the video tab shows error cards", () => {
    const historyCounts = deriveBulkRendersRunHistoryChainCounts({
      shotIds,
      videoShotIds: shotIds,
      steps
    });
    const videoCardRows = mapBulkRendersRunStepsToShotCardRows({
      stepId: "video",
      shotIds,
      shotNameById,
      steps,
      resultUrlByAssetId
    });

    expect(historyCounts.videoChainErrorCount).toBe(
      videoCardRows.filter(isErrorCard).length
    );
    expect(historyCounts.videoChainErrorCount).toBe(2);
  });

  it("classifies every terminal Shot exactly once: produced plus errors equals the Shot count", () => {
    const terminalShotIds = [
      "shot-loaded",
      "shot-quality-failure",
      "shot-infra-failure",
      "shot-unavailable"
    ];
    const historyCounts = deriveBulkRendersRunHistoryChainCounts({
      shotIds: terminalShotIds,
      videoShotIds: terminalShotIds,
      steps
    });

    expect(
      historyCounts.imageChainCompletedCount +
        historyCounts.imageChainErrorCount
    ).toBe(terminalShotIds.length);
    expect(
      historyCounts.videoChainCompletedCount +
        historyCounts.videoChainErrorCount
    ).toBe(terminalShotIds.length);
  });

  it("never double-classifies a Shot that both resolved an asset and failed quality", () => {
    const doubleClassifiableShotId = "shot-quality-failure-with-asset";
    const doubleClassifiableSteps: BulkRendersRunStep[] = [
      buildStep({
        timeline_id: doubleClassifiableShotId,
        tool_name: "poll_img2img",
        status: "COMPLETED",
        result: { asset_id: "quality-failed-but-rendered-asset" }
      }),
      buildStep({
        timeline_id: doubleClassifiableShotId,
        tool_name: "img_quality_final",
        status: "FAILED"
      }),
      buildStep({
        timeline_id: doubleClassifiableShotId,
        tool_name: "poll_video_render",
        status: "COMPLETED",
        result: { render_asset_id: "quality-failed-but-rendered-video-asset" }
      }),
      buildStep({
        timeline_id: doubleClassifiableShotId,
        tool_name: "vid_quality_gate",
        status: "FAILED"
      })
    ];

    const historyCounts = deriveBulkRendersRunHistoryChainCounts({
      shotIds: [doubleClassifiableShotId],
      videoShotIds: [doubleClassifiableShotId],
      steps: doubleClassifiableSteps
    });

    expect(historyCounts.imageChainCompletedCount).toBe(0);
    expect(historyCounts.imageChainErrorCount).toBe(1);
    expect(historyCounts.videoChainCompletedCount).toBe(0);
    expect(historyCounts.videoChainErrorCount).toBe(1);
  });
});
