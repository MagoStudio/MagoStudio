export const hasCompleteCropIdentifiers = ({
  userId,
  projectId,
  shotId
}: {
  userId: string;
  projectId: string;
  shotId: string;
}): boolean => Boolean(userId && projectId && shotId);
