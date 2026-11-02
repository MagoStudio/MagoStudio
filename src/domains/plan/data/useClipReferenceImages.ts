import { useProject } from "@domains/project/useProject";
import { Project } from "@schemas/project";

const selectReferenceImagesByAssetId = (
  project: Project
): Map<string, string[]> => {
  const referenceImagesByAssetId = new Map<string, string[]>();
  for (const timeline of project.timelines ?? []) {
    for (const layer of timeline.layers) {
      for (const clip of layer.clips) {
        const refs = (clip.data as Record<string, unknown> | undefined)
          ?.settings as Record<string, unknown> | undefined;
        const referenceImages = refs?.reference_images;
        if (Array.isArray(referenceImages)) {
          referenceImagesByAssetId.set(
            clip.asset_id,
            referenceImages.filter((id): id is string => typeof id === "string")
          );
        }
      }
    }
  }
  return referenceImagesByAssetId;
};

export const useClipReferenceImages = (
  resultAssetId: string | undefined,
  projectId: string | undefined
): string[] => {
  const { data } = useProject(projectId, selectReferenceImagesByAssetId);
  if (!resultAssetId) return [];
  return data?.get(resultAssetId) ?? [];
};
