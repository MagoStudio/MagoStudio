import { ProjectType } from "@schemas/scriptProject";

export const PROJECT_NAME_MAX_LENGTH = 200;

export const AUTO_PROJECT_NAME_LENGTH = 10;

export const PROJECT_TYPES_IN_NAVIGATION_ORDER: readonly ProjectType[] = [
  "timeline",
  "script_to_shots"
];
