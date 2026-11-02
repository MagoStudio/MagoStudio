import { isDummyProject } from "@domains/project/utils/isDummyProject";
import { useUser } from "@platform/identity";
import { Project, ProjectSchema } from "@schemas/project";
import { useQuery } from "@tanstack/react-query";

import { backendApiClient } from "@/lib/backend-api-client";
import { getLocalDesktopApi, isLocalApp } from "@/platform/localDesktop";
import { queryKeys } from "@/queryKeys";

const fetchProjects = async (): Promise<Project[]> => {
  const response = isLocalApp
    ? await getLocalDesktopApi().projects.listAll()
    : (await backendApiClient.get(`/v03/projects`, {})).data;
  const parsed = response.map((project: unknown) => {
    const result = ProjectSchema.safeParse(project);
    if (!result.success) {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "[useProjects] project failed schema validation",
          result.error
        );
      }
      return project as Project;
    }
    return result.data;
  });
  return parsed.filter((project: Project) => project.active);
};

const projectsQueryOptions = {
  queryKey: queryKeys.projects.all,
  queryFn: fetchProjects,
  staleTime: isLocalApp ? 0 : Infinity,
  refetchOnMount: isLocalApp ? ("always" as const) : (false as const),
  refetchOnWindowFocus: false as const,
  refetchOnReconnect: isLocalApp
};

const useProjects = <T = Project[]>(select?: (projects: Project[]) => T) => {
  const { user } = useUser();
  return useQuery({
    ...projectsQueryOptions,
    select: (projects: Project[]) => {
      const filtered = projects.filter((p) => !isDummyProject(p, user?.id));
      return (select ? select(filtered) : filtered) as T;
    }
  });
};

export { useProjects, projectsQueryOptions };
