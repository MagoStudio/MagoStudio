import { matchShotImagesToFilenames } from "@domains/plan/utils/matchShotImagesToFilenames";

export interface BulkRenderingUploadCandidate {
  candidateKey: string;
  fileName: string;
}

export interface AssignBulkRenderingUploadedFirstFramesResult {
  candidateKeyByShotId: Record<string, string>;
}

export const assignBulkRenderingUploadedFirstFrames = ({
  shots,
  uploadCandidates
}: {
  shots: Array<{ id: string; name: string }>;
  uploadCandidates: BulkRenderingUploadCandidate[];
}): AssignBulkRenderingUploadedFirstFramesResult => {
  const { assignments } = matchShotImagesToFilenames({
    shots,
    uploads: uploadCandidates.map((uploadCandidate) => ({
      uploadKey: uploadCandidate.candidateKey,
      fileName: uploadCandidate.fileName
    })),
    manualOverrides: {}
  });

  const candidateKeyByShotId = Object.fromEntries(
    assignments
      .filter((assignment) => assignment.status === "matched")
      .map((assignment) => [
        assignment.shotId,
        assignment.matchedUploadKey as string
      ])
  );

  return { candidateKeyByShotId };
};
