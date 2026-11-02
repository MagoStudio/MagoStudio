import { useProject } from "@domains/project/useProject";
import { ProjectType } from "@schemas/scriptProject";
/* oxlint-disable custom-react/no-use-effect -- legitimate external sync: routing away once the loaded project turns out to open in the other UI */
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { buildProjectHrefForType } from "./utils/buildProjectHrefForType";

export const useProjectTypeRedirect = (
  projectId: string | undefined,
  uiProjectType: ProjectType
) => {
  const router = useRouter();
  const { data: loadedProjectType } = useProject(
    projectId,
    (project) => project.type
  );

  /* oxlint-disable react-you-might-not-need-an-effect/no-event-handler -- the project type arrives from a fetch, not a user event, so navigating away is external sync rather than a handler the caller could own */
  useEffect(() => {
    if (!projectId || !loadedProjectType) return;
    if (loadedProjectType === uiProjectType) return;
    router.replace(buildProjectHrefForType(projectId, loadedProjectType));
  }, [projectId, loadedProjectType, uiProjectType, router]);
  /* oxlint-enable react-you-might-not-need-an-effect/no-event-handler */
};
