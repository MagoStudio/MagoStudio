import { Layer } from "@schemas/layer";

import { getLocalDesktopApi } from "@/platform/localDesktop";

export const readMirroredLayer = async (
  projectId: string,
  layerId: string
): Promise<Layer | undefined> => {
  const project = (await getLocalDesktopApi().projects.get(projectId)) as {
    timelines?: { layers?: Layer[] }[];
  } | null;
  return project?.timelines
    ?.flatMap((timeline) => timeline.layers ?? [])
    .find((layer) => layer.id === layerId);
};
