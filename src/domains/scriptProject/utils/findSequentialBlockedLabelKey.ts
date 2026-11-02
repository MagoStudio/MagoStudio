import { ShotGenerateResult, ShotState } from "@schemas/scriptProject";

const UNSUPPORTED_ENGINE_LABEL_KEY =
  "script_project.shot_blocked_sequential_unsupported_engine.label";

const PREDECESSOR_NOT_RENDERED_LABEL_KEY =
  "script_project.shot_blocked_sequential_no_predecessor_render.label";

const UNSUPPORTED_SEQUENTIAL_MODE_LABEL_KEY =
  "script_project.shot_blocked_sequential_unsupported_mode.label";

const UNSUPPORTED_OPENING_FRAME_LABEL_KEY =
  "script_project.shot_blocked_sequential_unsupported_opening_frame.label";

export const findSequentialBlockedLabelKey = (
  dryRun: ShotGenerateResult | undefined,
  shot: ShotState
): string | null => {
  const blockedEntry = dryRun?.blocked.find(
    (entry) => entry.timeline_id === shot.timeline_id
  );

  switch (blockedEntry?.reason_code) {
    case "unsupported_engine":
      return UNSUPPORTED_ENGINE_LABEL_KEY;
    case "predecessor_not_rendered":
      return PREDECESSOR_NOT_RENDERED_LABEL_KEY;
    case "unsupported_sequential_mode":
      return UNSUPPORTED_SEQUENTIAL_MODE_LABEL_KEY;
    case "unsupported_opening_frame":
      return UNSUPPORTED_OPENING_FRAME_LABEL_KEY;
    default:
      return null;
  }
};
