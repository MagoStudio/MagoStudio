import { VideoModelDefinition } from "@models/video/types";

type BulkRenderingRunViewerAudience = {
  isTeamMember: boolean;
};

export function isStoredVideoModelVisibleToViewer(
  model: VideoModelDefinition,
  { isTeamMember }: BulkRenderingRunViewerAudience
): boolean {
  if (model.status === "team_only" && !isTeamMember) return false;
  return true;
}
