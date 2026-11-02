export const toCloudMirrorProjectSettings = (
  localProjectId: string
): { mirroredLocalProjectId: string } => ({
  mirroredLocalProjectId: localProjectId
});
