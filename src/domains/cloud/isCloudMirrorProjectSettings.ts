export const isCloudMirrorProjectSettings = (settings: unknown): boolean => {
  if (!settings || typeof settings !== "object") return false;
  const { mirroredLocalProjectId } = settings as {
    mirroredLocalProjectId?: unknown;
  };
  return typeof mirroredLocalProjectId === "string" && !!mirroredLocalProjectId;
};
