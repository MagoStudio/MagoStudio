import { Layer } from "@schemas/layer";
import { Project } from "@schemas/project";

export const buildUpdatedProjectAfterRender = (
  project: Project | undefined,
  selectedShotId: string | undefined,
  updatedLayer: Layer
): Project | undefined => {
  if (!project) return project;

  const shot = project.timelines?.find((t) => t.id === selectedShotId);
  if (!shot) return project;

  return {
    ...project,
    timelines: project.timelines?.map((t) => {
      if (t.id !== selectedShotId) return t;
      return {
        ...t,
        layers: t.layers.map((layer) =>
          layer.id === updatedLayer.id ? updatedLayer : layer
        )
      };
    })
  };
};
