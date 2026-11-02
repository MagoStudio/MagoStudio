import { VideoModelDefinition } from "@models/video/types";

import { isMaskModel } from "./isMaskModel";
import { isUpscaleModel } from "./isUpscaleModel";

export type VideoModelSelectionMode = "normal" | "upscale" | "mask";

export interface VideoModelSelectionAudience {
  isTeamMember: boolean;
}

export const isVideoModelAvailableForMode = (
  model: VideoModelDefinition,
  mode: VideoModelSelectionMode,
  { isTeamMember }: VideoModelSelectionAudience
): boolean => {
  if (mode === "mask") {
    return isMaskModel(model.name);
  }
  if ((mode === "upscale") !== isUpscaleModel(model.name)) return false;
  if (model.status === "deprecated") return false;
  if (model.status === "hidden") return false;
  if (model.status === "team_only" && !isTeamMember) return false;
  return true;
};
