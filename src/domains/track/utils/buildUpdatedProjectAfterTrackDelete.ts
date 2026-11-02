import { Layer } from "@schemas/layer";
import { Project } from "@schemas/project";
import { Shot } from "@schemas/shot";

export const buildUpdatedProjectAfterTrackDelete = (
  project: Project | undefined,
  shotId: Shot["id"] | undefined,
  trackId: Layer["id"]
): Project | undefined => {
  if (!project) return project;

  const shot = project.timelines?.find((t) => t.id === shotId);
  if (!shot) return project;

  const updatedShot = {
    ...shot,
    layers: shot.layers.filter((track) => track.id !== trackId)
  };

  return {
    ...project,
    timelines: project.timelines?.map((t) =>
      t.id === shotId ? updatedShot : t
    )
  };
};
