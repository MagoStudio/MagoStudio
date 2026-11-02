const CLAUSE_KEY_BY_BACKEND_REASON: Record<string, string> = {
  disabled: "script_project.shot_blocked_disabled.label",
  "no image": "script_project.shot_blocked_no_image.label"
};

const UNKNOWN_REASON_CLAUSE_KEY =
  "script_project.shot_blocked_unavailable.label";

/** Always a translation key, never a passthrough.
 *
 * The map is keyed on two exact lowercase strings the backend happens to send today. A reason it
 * adds, or capitalises differently, falls back to generic copy rather than reaching the Shot's
 * blocked line as untranslated wire text. */
export const getShotBlockedClauseLabelKey = (
  reason: string | null | undefined
): string => {
  if (!reason) return UNKNOWN_REASON_CLAUSE_KEY;
  return CLAUSE_KEY_BY_BACKEND_REASON[reason] ?? UNKNOWN_REASON_CLAUSE_KEY;
};
