import { isVideoModelAvailableForMode } from "@domains/renders/utils/isVideoModelAvailableForMode";
import { VideoModelDefinition } from "@models/video/types";

type BulkRenderingAudience = {
  isTeamMember: boolean;
};

export function isBulkRenderingAvailableForModel(
  model: VideoModelDefinition,
  audience: BulkRenderingAudience
): boolean {
  if (!model.capabilities.supportsBulkRendering) return false;
  return isVideoModelAvailableForMode(model, "normal", audience);
}
