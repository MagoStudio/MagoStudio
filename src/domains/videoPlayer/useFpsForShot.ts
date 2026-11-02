import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";

import { useProject } from "../project/useProject";

import { extractFpsFromShot } from "./utils/extractFpsFromShot";

const DEFAULT_FPS = 24;

export function useFpsForShot() {
  const selectedProjectId = useSelectedProjectId();
  const { data: selectedProject } = useProject(selectedProjectId);

  let fps = DEFAULT_FPS;
  const currentShot = selectedProject?.timelines?.[0];

  if (currentShot) {
    const shotFps = extractFpsFromShot(currentShot);
    if (shotFps !== undefined && shotFps !== null) {
      fps = shotFps;
    }
  }

  return {
    fps
  };
}
