import { PlanStep, ToolName } from "@schemas/plan";

import { getMetricChip, PlanMetric } from "./getMetricChip";
import {
  groupPlanStepsByTimeline,
  summarizeTimelineSteps,
  TimelineSummaryKind
} from "./groupPlanStepsByTimeline";

export interface ShotImgPhase {
  inputImageIds: string[];
  referenceImageIds: string[];
  resultAssetId?: string;
  resultUrl?: string;
  isRendering: boolean;
  metric?: PlanMetric;
}

export interface ShotVideoPhase {
  present: boolean;
  resultAssetId?: string;
  isRendering: boolean;
  metric?: PlanMetric;
}

export interface ShotRollup {
  timelineId: string;
  steps: PlanStep[];
  status: TimelineSummaryKind;
  currentToolName?: ToolName;
  waitingForPrev: boolean;
  prevShotFailed: boolean;
  isSequential: boolean;
  img2img: ShotImgPhase;
  video: ShotVideoPhase;
  keyframeHandoffAssetId?: string;
}

const asString = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined;

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((v): v is string => typeof v === "string")
    : [];

const readPath = (record: unknown, ...keys: string[]): unknown => {
  let current: unknown = record;
  for (const key of keys) {
    if (!current || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
};

const imgSources = (
  submitImg: PlanStep | undefined,
  pollImg: PlanStep | undefined
): unknown[] => [
  pollImg?.result,
  submitImg?.result,
  readPath(submitImg?.tool_args, "settings"),
  submitImg?.tool_args
];

const collectInputImageIds = (
  submitImg: PlanStep | undefined,
  pollImg: PlanStep | undefined
): string[] => {
  const ids = new Set<string>();
  for (const source of imgSources(submitImg, pollImg)) {
    const scalar = asString(readPath(source, "input_image_id"));
    if (scalar) ids.add(scalar);
    for (const id of asStringArray(readPath(source, "input_image_ids"))) {
      ids.add(id);
    }
    for (const id of asStringArray(readPath(source, "input_images"))) {
      ids.add(id);
    }
  }
  return [...ids];
};

const collectReferenceImageIds = (
  submitImg: PlanStep | undefined,
  pollImg: PlanStep | undefined,
  pollImgMetrics: PlanStep | undefined,
  fallback: string[]
): string[] => {
  const ids = new Set<string>();
  for (const source of imgSources(submitImg, pollImg)) {
    for (const id of asStringArray(readPath(source, "reference_images"))) {
      ids.add(id);
    }
    for (const id of asStringArray(readPath(source, "reference_image_ids"))) {
      ids.add(id);
    }
  }
  for (const id of asStringArray(
    readPath(pollImgMetrics?.result, "ref_asset_ids")
  )) {
    ids.add(id);
  }
  if (ids.size === 0) fallback.forEach((id) => ids.add(id));
  return [...ids];
};

const findByTool = (steps: PlanStep[], tool: ToolName): PlanStep | undefined =>
  steps.find((step) => step.tool_name === tool);

const isRunningWithoutResult = (step: PlanStep | undefined): boolean =>
  step?.status === "RUNNING" &&
  (!step.result || Object.keys(step.result).length === 0);

const pickCurrentStep = (steps: PlanStep[]): PlanStep | undefined => {
  const running = steps.find((step) => step.status === "RUNNING");
  if (running) return running;
  const advanced = steps
    .filter((step) => step.status !== "PENDING")
    .sort((a, b) => b.step_order - a.step_order);
  return advanced[0];
};

const buildShotRollup = (
  timelineId: string,
  steps: PlanStep[],
  fallbackReferenceImageIds: string[]
): ShotRollup => {
  const ordered = [...steps].sort((a, b) => a.step_order - b.step_order);

  const submitImg = findByTool(ordered, "submit_img2img");
  const pollImg = findByTool(ordered, "poll_img2img");
  const pollImgMetrics = findByTool(ordered, "poll_img_metrics");
  const pollVideo = findByTool(ordered, "poll_video_render");
  const submitVideo = findByTool(ordered, "submit_video_render");
  const pollVidMetrics = findByTool(ordered, "poll_vid_metrics");
  const prevGate = findByTool(ordered, "poll_prev_shot_complete");
  const pickKeyframes = findByTool(ordered, "poll_pick_keyframes");

  const img2img: ShotImgPhase = {
    inputImageIds: collectInputImageIds(submitImg, pollImg),
    referenceImageIds: collectReferenceImageIds(
      submitImg,
      pollImg,
      pollImgMetrics,
      fallbackReferenceImageIds
    ),
    resultAssetId: asString(readPath(pollImg?.result, "asset_id")),
    resultUrl: asString(readPath(pollImg?.result, "output_url")),
    isRendering: isRunningWithoutResult(pollImg ?? submitImg),
    metric: getMetricChip(readPath(pollImgMetrics?.result, "metrics"), "pass")
  };

  const video: ShotVideoPhase = {
    present: !!(submitVideo || pollVideo),
    resultAssetId: asString(readPath(pollVideo?.result, "render_asset_id")),
    isRendering: isRunningWithoutResult(pollVideo ?? submitVideo),
    metric: getMetricChip(
      readPath(pollVidMetrics?.result, "video_metrics"),
      "vid_pass"
    )
  };

  return {
    timelineId,
    steps: ordered,
    status: summarizeTimelineSteps(ordered).kind,
    currentToolName: pickCurrentStep(ordered)?.tool_name,
    waitingForPrev:
      prevGate?.status === "RUNNING" || prevGate?.status === "PENDING",
    prevShotFailed: prevGate?.status === "FAILED",
    isSequential: !!prevGate,
    img2img,
    video,
    keyframeHandoffAssetId: asString(
      readPath(pickKeyframes?.result, "shot_reference_image_id")
    )
  };
};

const pickShotHandoffAssetId = (shot: ShotRollup): string | undefined =>
  shot.keyframeHandoffAssetId ??
  shot.img2img.resultAssetId ??
  shot.img2img.inputImageIds[0];

const resolvePrevReference = (
  ref: string,
  prev: ShotRollup | undefined
): string | undefined => {
  const isUnresolvedTemplateToken = ref.startsWith("$");
  if (!isUnresolvedTemplateToken) return ref;
  return prev ? pickShotHandoffAssetId(prev) : undefined;
};

export function buildShotRollups(
  steps: PlanStep[],
  timelineOrder: string[],
  fallbackReferenceImageIds: string[] = []
): ShotRollup[] {
  const groups = groupPlanStepsByTimeline(steps);
  const orderedIds = [
    ...timelineOrder.filter((id) => groups.has(id)),
    ...Array.from(groups.keys()).filter((id) => !timelineOrder.includes(id))
  ];

  const rollups: ShotRollup[] = [];
  for (const id of orderedIds) {
    const rollup = buildShotRollup(
      id,
      groups.get(id) ?? [],
      fallbackReferenceImageIds
    );
    const prev = rollups[rollups.length - 1];

    const resolved = rollup.img2img.referenceImageIds
      .map((ref) => resolvePrevReference(ref, prev))
      .filter((resolved): resolved is string => !!resolved);

    const prevShotRef =
      rollup.isSequential && prev ? pickShotHandoffAssetId(prev) : undefined;

    rollup.img2img.referenceImageIds = [
      ...new Set([...resolved, ...(prevShotRef ? [prevShotRef] : [])])
    ];

    rollups.push(rollup);
  }
  return rollups;
}
