import { useCreateNewProject } from "@domains/project/useCreateNewProject";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ProjectCreationTarget } from "@/domains/project/projectCreationTarget";

import { NEW_PROJECT_SHOT_RENDER_ENGINE } from "./constants";
import { useSaveProjectSettingsPatch } from "./useSaveProjectSettingsPatch";
import { buildScriptProjectHref } from "./utils/buildScriptProjectHref";

export const useCreateScriptProject = () => {
  const { createNewProject } = useCreateNewProject();
  const { saveProjectSettingsPatchAsync } =
    useSaveProjectSettingsPatch(undefined);
  const router = useRouter();
  const [isCreatingScriptProject, setIsCreatingScriptProject] = useState(false);

  const createScriptProject = async (
    creationTarget?: ProjectCreationTarget
  ) => {
    setIsCreatingScriptProject(true);
    try {
      const newProject = await createNewProject({
        projectType: "script_to_shots",
        creationTarget
      });
      if (!newProject) return;

      await saveProjectSettingsPatchAsync(
        { shot_engine: NEW_PROJECT_SHOT_RENDER_ENGINE },
        newProject
      )?.catch(() => undefined);

      router.push(buildScriptProjectHref(newProject.id));
    } finally {
      setIsCreatingScriptProject(false);
    }
  };

  return { createScriptProject, isCreatingScriptProject };
};
