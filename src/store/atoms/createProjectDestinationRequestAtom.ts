import { ProjectType } from "@schemas/scriptProject";
import { atom } from "jotai";

export const createProjectDestinationRequestAtom = atom<ProjectType | null>(
  null
);
