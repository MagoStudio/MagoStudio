import {
  CutShotVersion,
  ShotDialogueTurn,
  ShotDialogueTurnSchema
} from "@schemas/scriptProject";

import { SHOT_FPS } from "./snapShotFrames";

export type CutShotVersionSettings = {
  videoPrompt: string | undefined;
  dialogue: ShotDialogueTurn[];
  durationSeconds: number | undefined;
  referenceAssetIds: string[];
};

const SHOT_REFERENCE_CATEGORIES = [
  "characters",
  "environments",
  "props"
] as const;

const readRecord = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

const readDurationSeconds = (
  renderSettings: Record<string, unknown>
): number | undefined => {
  const { duration_s: durationSeconds, frame_range: frameRange } =
    renderSettings;
  if (typeof durationSeconds === "number")
    return durationSeconds > 0 ? durationSeconds : undefined;
  if (
    !Array.isArray(frameRange) ||
    typeof frameRange[0] !== "number" ||
    typeof frameRange[1] !== "number"
  )
    return undefined;
  const inclusiveFrameCount = frameRange[1] - frameRange[0] + 1;
  return inclusiveFrameCount > 0 ? inclusiveFrameCount / SHOT_FPS : undefined;
};

export const readCutShotVersionSettings = (
  version: Pick<CutShotVersion, "render_spec" | "input_settings">
): CutShotVersionSettings | null => {
  const renderSpec =
    readRecord(version.render_spec) ?? readRecord(version.input_settings);
  if (!renderSpec) return null;
  const renderSettings = readRecord(renderSpec.settings) ?? renderSpec;
  const referencesByCategory = readRecord(renderSpec.references) ?? {};
  const parsedDialogue = ShotDialogueTurnSchema.array().safeParse(
    renderSpec.dialogue ?? []
  );
  const { video_prompt: videoPrompt } = renderSpec;
  return {
    videoPrompt:
      typeof videoPrompt === "string" && videoPrompt.trim()
        ? videoPrompt
        : undefined,
    dialogue: parsedDialogue.success ? parsedDialogue.data : [],
    durationSeconds: readDurationSeconds(renderSettings),
    referenceAssetIds: SHOT_REFERENCE_CATEGORIES.flatMap((category) => {
      const assetIds = referencesByCategory[category];
      return Array.isArray(assetIds)
        ? assetIds.filter((assetId) => typeof assetId === "string")
        : [];
    })
  };
};
