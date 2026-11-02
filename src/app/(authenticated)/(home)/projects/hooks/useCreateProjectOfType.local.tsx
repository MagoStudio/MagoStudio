import { ProjectType } from "@schemas/scriptProject";
import { createProjectDestinationRequestAtom } from "@store/atoms/createProjectDestinationRequestAtom";
import { useSetAtom } from "jotai";

export const useCreateProjectOfType = (projectType: ProjectType) => {
  const requestProjectDestination = useSetAtom(
    createProjectDestinationRequestAtom
  );

  return {
    createProjectOfType: () => requestProjectDestination(projectType),
    isCreatingProjectOfType: false,
    newVideoProjectModal: null
  };
};
