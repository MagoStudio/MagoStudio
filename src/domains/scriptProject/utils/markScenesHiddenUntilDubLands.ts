import { ProjectCut } from "@schemas/scriptProject";

import { isSceneHiddenUntilDubLands } from "./isSceneHiddenUntilDubLands";

export const markScenesHiddenUntilDubLands = (cut: ProjectCut): ProjectCut => ({
  ...cut,
  shots: cut.shots.map((shot) => ({
    ...shot,
    isSceneHiddenUntilDubLands: isSceneHiddenUntilDubLands(shot)
  }))
});
