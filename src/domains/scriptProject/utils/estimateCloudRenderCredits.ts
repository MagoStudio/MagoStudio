import {
  UNRECORDED_RENDER_SHOT_RENDER_ENGINE,
  DEFAULT_SHEET_RENDER_MODEL,
  SHOT_RENDER_ENGINES,
  SHEET_RENDER_MODELS,
  SheetRenderModel,
  ShotRenderEngine
} from "@domains/scriptProject/constants";
import { Project } from "@schemas/project";
import { ProjectCut, ProjectState } from "@schemas/scriptProject";

import { estimateSheetImageCredits } from "./estimateSheetImageCredits";
import { estimateShotRenderCredits } from "./estimateShotRenderCredits";
import { snapShotSecondsToFrames } from "./snapShotFrames";

const VIDEO_FRAMES_PER_SECOND = 24;

const record = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const outputSize = (value: unknown): [number, number] | null =>
  Array.isArray(value) &&
  value.length === 2 &&
  value.every(
    (edge) => typeof edge === "number" && Number.isFinite(edge) && edge > 0
  )
    ? [value[0] as number, value[1] as number]
    : null;

const durationSeconds = (settings: Record<string, unknown>): number | null => {
  if (typeof settings.duration_s === "number" && settings.duration_s > 0) {
    return settings.duration_s;
  }
  const nested = record(settings.settings);
  if (typeof nested?.duration_s === "number" && nested.duration_s > 0) {
    return nested.duration_s;
  }
  const range = settings.frame_range ?? nested?.frame_range;
  return Array.isArray(range) &&
    range.length === 2 &&
    typeof range[0] === "number" &&
    typeof range[1] === "number" &&
    range[1] >= range[0]
    ? (range[1] - range[0] + 1) / VIDEO_FRAMES_PER_SECOND
    : null;
};

const sheetModel = (value: unknown): SheetRenderModel | null =>
  typeof value === "string" &&
  SHEET_RENDER_MODELS.includes(value as SheetRenderModel)
    ? (value as SheetRenderModel)
    : null;

const shotEngine = (value: unknown): ShotRenderEngine =>
  typeof value === "string" &&
  (SHOT_RENDER_ENGINES as readonly string[]).includes(value)
    ? (value as ShotRenderEngine)
    : UNRECORDED_RENDER_SHOT_RENDER_ENGINE;

const referenceImageCount = (
  settings: Record<string, unknown> | null
): number => {
  const references = record(settings?.references);
  return references
    ? Object.values(references).reduce<number>(
        (count, value) => count + (Array.isArray(value) ? value.length : 0),
        0
      )
    : 0;
};

/** Reconstructs backend credit estimates from each completed version's frozen settings. */
export const estimateCloudRenderCredits = (
  projectState: ProjectState | undefined,
  cut: ProjectCut | undefined,
  origin: Project["origin"] | undefined = "cloud"
): number => {
  let credits = 0;
  const assets = new Set<string>();
  for (const group of projectState?.keys ?? []) {
    for (const image of group.images) {
      if (image.source !== "render" || assets.has(image.asset_id)) continue;
      const settings =
        image.render_spec ?? image.input_settings ?? image._local_render_spec;
      const size = outputSize(settings?.output_size);
      const model = sheetModel(settings?.render_model);
      const billableModel =
        model ?? (origin === "cloud" ? DEFAULT_SHEET_RENDER_MODEL : null);
      if (!size || !billableModel) continue;
      assets.add(image.asset_id);
      credits += estimateSheetImageCredits(billableModel, size);
    }
  }

  if (origin !== "cloud") return credits;
  for (const shot of [...(cut?.shots ?? []), ...(cut?.hidden_shots ?? [])]) {
    for (const version of shot.versions) {
      const completed =
        version.ready ||
        !!version.url ||
        ["success", "available", "finished"].includes(
          version.status.toLowerCase()
        );
      if (
        assets.has(version.asset_id) ||
        version.timeline_upscale_of ||
        !completed
      ) {
        continue;
      }
      const primary = record(version.render_spec);
      const fallback = record(version.input_settings);
      const size = outputSize(primary?.output_size ?? fallback?.output_size);
      const duration =
        (primary ? durationSeconds(primary) : null) ??
        (fallback ? durationSeconds(fallback) : null);
      if (!size || !duration) continue;
      const engineSettings = record(primary?.settings) ?? primary ?? fallback;
      assets.add(version.asset_id);
      credits += estimateShotRenderCredits({
        shotEngine: shotEngine(engineSettings?.engine),
        outputSize: size,
        shotFrames: snapShotSecondsToFrames(duration),
        referenceImageCount: referenceImageCount(primary)
      });
    }
  }
  return credits;
};
