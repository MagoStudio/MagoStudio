import { useProject } from "@domains/project/useProject";

export const useImageToVideoContainerShotId = (
  projectId: string | undefined
) => {
  const { data: containerShotId, isLoading } = useProject(
    projectId,
    (project) => project.settings?.betaI2vShotId
  );

  return { containerShotId, isContainerShotIdLoading: isLoading };
};
