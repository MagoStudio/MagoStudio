import { ProjectState } from "@schemas/scriptProject";

import { isStoryboardSheetGroup } from "./isStoryboardSheetGroup";

export const withoutStoryboardSheetGroups = (
  projectState: ProjectState
): ProjectState => ({
  ...projectState,
  keys: projectState.keys.filter(
    (sheetGroup) => !isStoryboardSheetGroup(sheetGroup)
  )
});
