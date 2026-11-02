import { useProject } from "@domains/project/useProject";
import { useSelectedProjectId } from "@domains/project/useSelectedProjectId";

import { useBulkRendersRunsForProject } from "./data/useBulkRendersRuns";
import { buildDefaultBulkRendersRunName } from "./utils/buildDefaultBulkRendersRunName";

export const useDefaultBulkRendersRunName = (): string | undefined => {
  const selectedProjectId = useSelectedProjectId();
  const { data: project } = useProject(selectedProjectId);
  const { data: existingRuns } =
    useBulkRendersRunsForProject(selectedProjectId);

  if (!project || !existingRuns) return undefined;

  return buildDefaultBulkRendersRunName({
    existingRunCount: existingRuns.length,
    projectName: project.name
  });
};
