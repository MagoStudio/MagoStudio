import type { LocalScriptProjectSnapshot } from "../../../shared/contracts";
import { sequentialPrompt } from "../casting/editShot";

import { buildProjectCutView } from "./projectCutView";
import { sequentialPromptDefaults } from "./sequentialContinuation";

/**
 * GET /state and GET /cut as the cloud answers them, from the stored local
 * snapshot.
 */

type JsonRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is JsonRecord =>
  !!value && typeof value === "object" && !Array.isArray(value);
const records = (value: unknown): JsonRecord[] =>
  Array.isArray(value) ? value.filter(isRecord) : [];

export const shotReadView = (shot: JsonRecord): JsonRecord => ({
  ...shot,
  hidden: !!shot.hidden,
  manual: !!shot.manual,
  sequential_prompt: sequentialPrompt(shot)
});

export const withProjectReadViews = (
  projectId: string,
  snapshot: LocalScriptProjectSnapshot
): LocalScriptProjectSnapshot => {
  if (!snapshot.state) return snapshot;
  const stateShots = records(snapshot.state.shots);
  return {
    ...snapshot,
    state: {
      ...snapshot.state,
      shots: stateShots.map(shotReadView),
      sequential_prompt_defaults: sequentialPromptDefaults()
    },
    cut: snapshot.cut
      ? buildProjectCutView({
          projectId,
          stateShots,
          storedCut: snapshot.cut
        })
      : snapshot.cut
  };
};
