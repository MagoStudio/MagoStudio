import { ROUTES } from "@config/constants";
import { TOOL_URL_PARAM } from "@hooks/tool/useTool";

export function buildShotRenderVideoUrl(
  projectId: string,
  shotId: string
): string {
  return `${ROUTES.PROJECT}?projectId=${projectId}&timelineId=${shotId}&${TOOL_URL_PARAM}=render-video`;
}
