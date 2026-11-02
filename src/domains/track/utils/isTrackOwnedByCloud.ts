import { isLocalProjectTrackOwnedByCloud } from "./isLocalProjectTrackOwnedByCloud";

export const isTrackOwnedByCloud = async ({
  projectId,
  trackId
}: {
  projectId: string | undefined;
  trackId: string;
}): Promise<boolean> => {
  if (!projectId || typeof window === "undefined" || !window.mago) return false;
  return isLocalProjectTrackOwnedByCloud(
    await window.mago.projects.get(projectId),
    trackId
  );
};
