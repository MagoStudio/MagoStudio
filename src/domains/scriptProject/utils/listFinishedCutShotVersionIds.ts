import { ProjectCut } from "@schemas/scriptProject";

export const listFinishedCutShotVersionIds = (
  cut: Pick<ProjectCut, "shots" | "hidden_shots">
): string[] =>
  [...cut.shots, ...cut.hidden_shots]
    .flatMap((cutShot) => cutShot.versions)
    .filter((version) => version.ready)
    .map((version) => version.asset_id);
