export type ProjectCreationTarget = "local" | "cloud";

export type ProjectCreationAvailability = Record<
  ProjectCreationTarget,
  boolean
>;
