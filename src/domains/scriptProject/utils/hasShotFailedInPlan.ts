import { CutShot } from "@schemas/scriptProject";

/** A Shot whose plan branch failed before any Render Track landed.
 *
 * `hasShotRenderFailed` reads the Shot's versions, so it cannot see this case: a branch that
 * dies at prompt adaptation never reaches `create_render_layer` and leaves no version at all.
 *
 * A Shot that does have a version is excluded on purpose. A step can fail well after the render
 * landed — quality evaluation did so on 24 of 54 Shots on 2026-09-08 — and a missing score is
 * not a failed render. */
export const hasShotFailedInPlan = ({
  cutShot,
  hasFailedPlanStep
}: {
  cutShot: CutShot | undefined;
  hasFailedPlanStep: boolean;
}): boolean => hasFailedPlanStep && (cutShot?.versions ?? []).length === 0;
