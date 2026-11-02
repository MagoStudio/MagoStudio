import { projectsQueryOptions } from "@domains/project/useProjects";
import { isDummyProject } from "@domains/project/utils/isDummyProject";
import { useUser } from "@platform/identity";
import { useQuery } from "@tanstack/react-query";

export const useDummyProject = () => {
  const { user } = useUser();

  return useQuery({
    ...projectsQueryOptions,
    select: (projects) => projects.find((p) => isDummyProject(p, user?.id))
  });
};
