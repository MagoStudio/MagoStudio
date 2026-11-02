import { Layer } from "@schemas/layer";
import { Project } from "@schemas/project";

export const buildUpdatedProjectAfterTrackPut = (
  project: Project | undefined,
  selectedShotId: string | undefined,
  updatedLayer: Layer
): Project | undefined => {
  if (!project) return project;

  const shot = project.timelines?.find((t) => t.id === selectedShotId);
  if (!shot) return project;

  const updatedShot = {
    ...shot,
    layers: shot.layers.map((layer) =>
      layer.id === updatedLayer.id ? { ...layer, ...updatedLayer } : layer
    )
  };

  return {
    ...project,
    timelines: project.timelines?.map((t) =>
      t.id === selectedShotId ? updatedShot : t
    )
  };
};
