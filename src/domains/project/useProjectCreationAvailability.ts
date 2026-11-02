import { ProjectCreationAvailability } from "./projectCreationTarget";

/** The web app only creates cloud projects and does not need an origin picker. */
export const useProjectCreationAvailability = (): {
  availability: ProjectCreationAvailability;
  isChecking: boolean;
} => ({
  availability: { local: false, cloud: false },
  isChecking: false
});
