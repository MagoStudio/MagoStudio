import { type ProjectType, ProjectTypeSchema } from "@schemas/scriptProject";

export const resolveProjectTypeFromSearchParam = (
  searchParamValue: string | null
): ProjectType => ProjectTypeSchema.parse(searchParamValue);
