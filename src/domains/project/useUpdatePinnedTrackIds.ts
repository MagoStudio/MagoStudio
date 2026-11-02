import { Project } from "@schemas/project";
import { useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/queryKeys";

import { useProject } from "./useProject";
import { useUpdateProject } from "./useUpdateProject";

export const useUpdatePinnedTrackIds = (projectId: string | undefined) => {
  const { data: project } = useProject(projectId);
  const queryClient = useQueryClient();

  const mutation = useUpdateProject({
    onMutate: async (updatedProject: Project) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.project.byId(projectId)
      });

      queryClient.setQueryData(
        queryKeys.project.byId(projectId),
        (oldProject: Project | undefined) => {
          if (!oldProject) return oldProject;
          return {
            ...oldProject,
            settings: updatedProject.settings
          };
        }
      );
    }
  });

  const updatePinnedTrackIds = async (newPinned: Record<string, string>) => {
    if (!project) return;

    await mutation.mutateAsync({
      projectId: project.id,
      projectName: project.name,
      projectDescription: project.description,
      settings: {
        ...project.settings,
        pinnedTrackIds: newPinned
      },
      settingsPatch: { pinnedTrackIds: newPinned },
      settingsMergeBase: {
        pinnedTrackIds: project.settings.pinnedTrackIds ?? {}
      }
    });
  };

  const pinTrack = async (shotId: string, layerId: string) => {
    const currentPinned = project?.settings?.pinnedTrackIds ?? {};
    await updatePinnedTrackIds({ ...currentPinned, [shotId]: layerId });
  };

  const unpinTrack = async (shotId: string) => {
    const { [shotId]: _, ...newPinned } =
      project?.settings?.pinnedTrackIds ?? {};
    await updatePinnedTrackIds(newPinned);
  };

  return { pinTrack, unpinTrack };
};
