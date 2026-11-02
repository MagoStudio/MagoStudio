import { SequentialPromptDefaults } from "@schemas/scriptProject";

import { ResolvedSequentialShotConfig } from "./resolveSequentialShotConfig";

export const resolveDefaultSequentialPrompt = (
  defaults: SequentialPromptDefaults | null,
  sequential: Pick<ResolvedSequentialShotConfig, "mode" | "opening_frame">
): string | null => {
  const text =
    sequential.mode === "last_frame"
      ? defaults?.last_frame?.[sequential.opening_frame]
      : defaults?.[sequential.mode];
  return text ?? null;
};
