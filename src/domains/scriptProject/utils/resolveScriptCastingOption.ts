import { Plan } from "@schemas/plan";
import { ScriptVersion } from "@schemas/scriptProject";

export type ScriptCastingOption =
  | "atomic_shots"
  | "sequential_shots"
  | "split_alts"
  | "separate_style"
  | "separate_camera";

/** The submitted plan is authoritative for old local casts whose version metadata inferred
 * options from model output. Newer local casts and cloud casts also persist the request on the
 * version itself, which remains the fallback when plan detail is unavailable. */
export const resolveScriptCastingOption = (
  version: ScriptVersion | undefined,
  plan: Plan | undefined,
  option: ScriptCastingOption
): boolean | undefined => {
  const castingStep = plan?.steps?.find(
    (step) => step.tool_name === "submit_script_casting"
  );
  const submittedValue = castingStep?.tool_args?.[option];
  if (typeof submittedValue === "boolean") return submittedValue;

  return version?.[option];
};
