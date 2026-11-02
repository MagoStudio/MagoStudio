/* oxlint-disable eslint/no-magic-numbers -- backend score and frame-sampling bounds */
import { z } from "zod";

import { extractJsonObject } from "./promptJson";
import {
  IMAGE_TO_VIDEO_METRICS_INSTRUCTION,
  VIDEO_METRICS_PROMPT,
  VIDEO_METRICS_RESPONSE_SCHEMA
} from "./prompts/videoMetrics.generated";

export type ShotVideoEvaluationInput = {
  sourcePath: string;
  prompt: string;
  durationSeconds: number;
  referencePaths: string[];
};

const scoreFields = [
  "vid_score",
  "vid_style",
  "vid_content",
  "vid_identity",
  "vid_lighting",
  "vid_quality",
  "vid_temporal_style",
  "vid_temporal_identity"
] as const;
const score = z.number().finite();
const resultSchema = z.object({
  vid_score: score,
  vid_pass: z.boolean(),
  vid_style: score,
  vid_content: score,
  vid_identity: score,
  vid_lighting: score,
  vid_quality: score,
  vid_temporal_style: score,
  vid_temporal_identity: score,
  vid_issues: z.array(z.string()).default([]),
  vid_per_frame_notes: z.array(z.string()).default([]),
  vid_next_prompt: z.string()
});

/** Backend _sample_timestamps, including Python's ties-to-even rounding. */
export const sampleMetricsTimestamps = (duration: number): number[] => {
  if (!Number.isFinite(duration) || duration <= 0)
    throw new Error("Video metrics require a positive duration");
  const floor = Math.floor(duration);
  const rounded =
    duration - floor === 0.5 ? floor + (floor % 2) : Math.round(duration);
  const count = Math.max(3, Math.min(8, rounded));
  return Array.from({ length: count }, (_, index) =>
    Number(((index * duration) / (count - 1)).toFixed(3))
  );
};

export const parseVideoMetrics = (text: string) => {
  const result = resultSchema.parse(extractJsonObject(text));
  const warnings: string[] = [];
  for (const field of scoreFields) {
    const raw = result[field];
    result[field] = Math.max(0, Math.min(10, raw));
    if (result[field] !== raw)
      warnings.push(`${field}=${raw} clamped to ${result[field]}`);
  }
  if (result.vid_pass && result.vid_issues.length)
    warnings.push("VLM returned vid_pass=true with non-empty vid_issues");
  if (!result.vid_next_prompt.trim())
    warnings.push("VLM returned an empty vid_next_prompt");
  return { ...result, warnings };
};

/** Montages preserve all samples within the local caption node's four-image limit. */
export const buildVideoMetricsPrompt = (
  prompt: string,
  timestamps: number[],
  hasReferences: boolean
): string =>
  [
    VIDEO_METRICS_PROMPT,
    IMAGE_TO_VIDEO_METRICS_INSTRUCTION,
    hasReferences
      ? "Image 1 is a grid of reference assets in their original order (read left to right, then top to bottom). These are the generation references, not video frames."
      : "No reference assets were supplied.",
    ...Array.from(
      { length: Math.ceil(timestamps.length / 4) },
      (_, grid) =>
        `Image ${grid + (hasReferences ? 2 : 1)} is a 2x2 grid of generated video frames, read left to right, then top to bottom: ` +
        timestamps
          .slice(grid * 4, grid * 4 + 4)
          .map(
            (time, index) =>
              `frame ${grid * 4 + index + 1}/${timestamps.length} (t=${time.toFixed(2)}s)`
          )
          .join(", ") +
        ". Ignore any unused black cells. There are no source video frames."
    ),
    `Prompt that was used: ${JSON.stringify(prompt)}`,
    `Return only JSON matching this schema: ${JSON.stringify(VIDEO_METRICS_RESPONSE_SCHEMA)}`
  ].join("\n\n");
