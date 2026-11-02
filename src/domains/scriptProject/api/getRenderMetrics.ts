import { z } from "zod";

import { backendApiClient } from "@/lib/backend-api-client";

import {
  RenderMetrics,
  RenderMetricsAxisName,
  RenderMetricsKind
} from "../utils/renderMetricsTypes";

const OptionalScoreSchema = z.number().nullable().optional();

const EvaluationErrorSchema = z
  .object({
    message: z.string().default(""),
    stage: z.string().default("")
  })
  .nullable()
  .optional();

const ImageMetricsWireSchema = z.object({
  status: z.string().nullable().optional(),
  eval_mode: z.string().nullable().optional(),
  error: EvaluationErrorSchema,
  score: OptionalScoreSchema,
  pass: z.boolean().nullable().optional(),
  style: OptionalScoreSchema,
  content: OptionalScoreSchema,
  identity: OptionalScoreSchema,
  lighting: OptionalScoreSchema,
  quality: OptionalScoreSchema,
  prompt_adherence: OptionalScoreSchema,
  coherence: OptionalScoreSchema,
  usability: OptionalScoreSchema,
  issues: z.array(z.string()).default([]),
  next_prompt: z.string().nullable().optional()
});

const VideoMetricsWireSchema = z.object({
  status: z.string().nullable().optional(),
  eval_mode: z.string().nullable().optional(),
  error: EvaluationErrorSchema,
  vid_score: OptionalScoreSchema,
  vid_pass: z.boolean().nullable().optional(),
  vid_style: OptionalScoreSchema,
  vid_content: OptionalScoreSchema,
  vid_identity: OptionalScoreSchema,
  vid_lighting: OptionalScoreSchema,
  vid_quality: OptionalScoreSchema,
  vid_temporal_style: OptionalScoreSchema,
  vid_temporal_identity: OptionalScoreSchema,
  vid_issues: z.array(z.string()).default([]),
  vid_next_prompt: z.string().nullable().optional()
});

const toNumberOrUndefined = (score: number | null | undefined) =>
  typeof score === "number" ? score : undefined;

const dropAbsentAxes = (
  scoreByAxis: Partial<Record<RenderMetricsAxisName, number | undefined>>
): Partial<Record<RenderMetricsAxisName, number>> =>
  Object.fromEntries(
    Object.entries(scoreByAxis).filter(([, score]) => score !== undefined)
  ) as Partial<Record<RenderMetricsAxisName, number>>;

const METRICS_PATH_BY_KIND: Record<RenderMetricsKind, string> = {
  image: "metrics",
  video: "metrics/video"
};

export const getRenderMetrics = async (
  assetId: string,
  kind: RenderMetricsKind
): Promise<RenderMetrics> => {
  const response = await backendApiClient.get(
    `/assets/${assetId}/${METRICS_PATH_BY_KIND[kind]}`
  );
  return parseRenderMetrics(response.data, kind);
};

export const parseRenderMetrics = (
  data: unknown,
  kind: RenderMetricsKind
): RenderMetrics => {
  if (kind === "image") {
    const wire = ImageMetricsWireSchema.parse(data);
    return {
      status: wire.status ?? null,
      evalMode: wire.eval_mode ?? null,
      score: wire.score ?? null,
      hasEvaluatorPassed: wire.pass ?? null,
      scoreByAxis: dropAbsentAxes({
        style: toNumberOrUndefined(wire.style),
        content: toNumberOrUndefined(wire.content),
        identity: toNumberOrUndefined(wire.identity),
        lighting: toNumberOrUndefined(wire.lighting),
        quality: toNumberOrUndefined(wire.quality),
        promptAdherence: toNumberOrUndefined(wire.prompt_adherence),
        coherence: toNumberOrUndefined(wire.coherence),
        usability: toNumberOrUndefined(wire.usability)
      }),
      issues: wire.issues,
      nextPrompt: wire.next_prompt ?? null,
      evaluationError: wire.error ?? null
    };
  }

  const wire = VideoMetricsWireSchema.parse(data);
  return {
    status: wire.status ?? null,
    evalMode: wire.eval_mode ?? null,
    score: wire.vid_score ?? null,
    hasEvaluatorPassed: wire.vid_pass ?? null,
    scoreByAxis: dropAbsentAxes({
      style: toNumberOrUndefined(wire.vid_style),
      content: toNumberOrUndefined(wire.vid_content),
      identity: toNumberOrUndefined(wire.vid_identity),
      lighting: toNumberOrUndefined(wire.vid_lighting),
      quality: toNumberOrUndefined(wire.vid_quality),
      temporalStyle: toNumberOrUndefined(wire.vid_temporal_style),
      temporalIdentity: toNumberOrUndefined(wire.vid_temporal_identity)
    }),
    issues: wire.vid_issues,
    nextPrompt: wire.vid_next_prompt ?? null,
    evaluationError: wire.error ?? null
  };
};
