import { AgentScriptDocument } from "@schemas/scriptProject";

import { formatScreenplay } from "./formatScreenplay";
import { joinScriptScenes } from "./joinScriptScenes";

export const buildAgentScriptText = (
  document: Pick<AgentScriptDocument, "scenes" | "screenplay_scenes">
): string => {
  const isScreenplayDocument = document.screenplay_scenes.length > 0;
  return isScreenplayDocument
    ? formatScreenplay(document.screenplay_scenes)
    : joinScriptScenes(document.scenes);
};
