import { VideoEngine } from "@models/video/types";

const TAGS_IN_PROMPT_ENGINES = new Set<string>([
  VideoEngine.happy_horse_1,
  VideoEngine.seedance_2,
  VideoEngine.seedance_2_5,
  VideoEngine.kling_o1,
  VideoEngine.kling_o3_edit_pro
]);

export const doesModelSupportTagsInPrompt = (
  engine: VideoEngine | string | undefined
): boolean => {
  if (!engine) return false;
  return TAGS_IN_PROMPT_ENGINES.has(engine);
};
