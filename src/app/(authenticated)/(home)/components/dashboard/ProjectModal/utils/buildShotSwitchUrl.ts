import { ROUTES } from "@config/constants";
import { parseTool } from "@hooks/tool/parseTool";
import { TOOL_URL_PARAM } from "@hooks/tool/useTool";

export function buildShotSwitchUrl(
  projectId: string | undefined,
  shotId: string,
  tool?: string | null
): string {
  return `${ROUTES.PROJECT}?projectId=${projectId}&timelineId=${shotId}&${TOOL_URL_PARAM}=${parseTool(tool)}`;
}
