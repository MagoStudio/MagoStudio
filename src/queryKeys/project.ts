import { ProjectType } from "@schemas/scriptProject";

type ProjectListParams = {
  perPage: number;
  sortBy: "updated_at" | "name";
  sortOrder: "asc" | "desc";
  projectType?: ProjectType;
};

export const project = {
  all: ["project"] as const,
  byId: (id: string | null | undefined) => [...project.all, id] as const
};

export const projects = {
  all: ["projects"] as const
};

export const projectList = {
  all: ["projectList"] as const,
  paginated: (params: ProjectListParams) =>
    [...projectList.all, params] as const
};

export const homepage = {
  all: ["homepage"] as const
};

export const projectStats = {
  byProjectId: (projectId: string | undefined) =>
    ["project-stats", projectId] as const
};

export const timelineList = {
  all: ["timelineList"] as const,
  byProjectId: (projectId: string | undefined) =>
    [...timelineList.all, projectId] as const
};
