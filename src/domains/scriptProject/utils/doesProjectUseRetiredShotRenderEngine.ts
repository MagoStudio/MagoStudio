import { Project } from "@schemas/project";

import { SCRIPT_TO_SHOTS_PROJECT_TYPE } from "../constants";

import { isSelectableShotRenderEngine } from "./isSelectableShotRenderEngine";

export const doesProjectUseRetiredShotRenderEngine = (
  project: Pick<Project, "type" | "settings" | "origin"> | undefined
): boolean =>
  project?.type === SCRIPT_TO_SHOTS_PROJECT_TYPE &&
  project.origin !== "local" &&
  !isSelectableShotRenderEngine(project.settings.shot_engine);
