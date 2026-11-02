import { ShotGenerateResult } from "@schemas/scriptProject";

import {
  SKIP_REASON_DROPPED,
  SKIP_REASON_RENDER_IN_PROGRESS
} from "../constants";

const SKIP_REASON_ALREADY_RENDERED = "already rendered with these inputs";

const DESCRIPTION_KEY_BY_SKIP_REASON: Record<string, string> = {
  [SKIP_REASON_RENDER_IN_PROGRESS]:
    "script_project.shot_run_refused_in_progress.description",
  [SKIP_REASON_ALREADY_RENDERED]:
    "script_project.shot_run_refused_unchanged.description",
  [SKIP_REASON_DROPPED]: "script_project.shot_run_refused_dropped.description"
};

const UNKNOWN_REFUSAL_DESCRIPTION_KEY =
  "script_project.shot_run_refused_unknown.description";

/** Why a Generate or Re-render press started nothing, or null when it started a plan.
 *
 * The endpoint answers 200 with `plan_id: null` when it declines every Shot it was asked about,
 * so the press succeeds and nothing happens. Without this the Re-render button was a silent
 * no-op for the whole 2h13m of the run of 2026-09-08.
 *
 * Only one reason is described: the user pressed one button and wants one sentence back. The
 * blocked list comes first because a missing reference is the one the user can act on. */
export const getShotRunRefusalDescriptionKey = (
  result: ShotGenerateResult
): string | null => {
  if (result.plan_id) return null;

  if (result.blocked.length > 0) {
    return "script_project.shot_run_refused_blocked.description";
  }

  const [skipped] = result.skipped;
  if (!skipped) return UNKNOWN_REFUSAL_DESCRIPTION_KEY;

  return (
    DESCRIPTION_KEY_BY_SKIP_REASON[skipped.reason] ??
    UNKNOWN_REFUSAL_DESCRIPTION_KEY
  );
};
