import { SKIP_REASON_USER_IMAGE_PINNED } from "../constants";

export const partitionSkippedAsPinnedUpload = <T extends { reason: string }>(
  skipped: T[]
): { skippedAsPinnedUploadEntries: T[]; otherSkippedEntries: T[] } => ({
  skippedAsPinnedUploadEntries: skipped.filter(
    (entry) => entry.reason === SKIP_REASON_USER_IMAGE_PINNED
  ),
  otherSkippedEntries: skipped.filter(
    (entry) => entry.reason !== SKIP_REASON_USER_IMAGE_PINNED
  )
});
