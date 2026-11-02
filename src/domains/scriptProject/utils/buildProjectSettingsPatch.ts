import { Project } from "@schemas/project";

/** Guards the `PUT /projects/:id` full-replace hazard — see CONTEXT.md's "Project Update
 * Contract". Every write to the Project must build its `settings` payload through this. */
export const buildProjectSettingsPatch = (
  project: Project,
  patch: Partial<Project["settings"]>
): Project["settings"] => ({
  ...project.settings,
  ...patch
});
