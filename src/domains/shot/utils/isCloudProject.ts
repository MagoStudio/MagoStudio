/** Whether a project belongs to cloud Mago rather than the local library. In
 * the desktop app a cloud project is a mirror, so changes to its shots must go
 * to the cloud and be mirrored back, not written to the local database. */
export const isCloudProject = async (
  projectId: string | undefined
): Promise<boolean> => {
  if (!projectId || typeof window === "undefined" || !window.mago) return false;
  return (await window.mago.projects.get(projectId))?.origin === "cloud";
};
