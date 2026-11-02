const MATCH_DELIMITERS = ["_", " ", "-"];

const stripExtension = (fileName: string): string =>
  fileName.replace(/\.[^./]+$/, "");

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const matchesFilenameToShotName = (
  fileName: string,
  shotName: string
): boolean => {
  const strippedName = stripExtension(fileName).toLowerCase();
  const escapedShotName = escapeRegExp(shotName.toLowerCase());
  const delimiterPattern = MATCH_DELIMITERS.map(escapeRegExp).join("");
  const pattern = new RegExp(`^${escapedShotName}([${delimiterPattern}]|$)`);
  return pattern.test(strippedName);
};

export interface UploadedShotImage {
  uploadKey: string;
  fileName: string;
}

export interface ShotImageAssignment {
  shotId: string;
  status: "matched" | "needs_review" | "unmatched";
  matchedUploadKey?: string;
  candidateUploadKeys: string[];
}

interface MatchShotImagesToFilenamesArgs {
  shots: Array<{ id: string; name: string }>;
  uploads: UploadedShotImage[];
  manualOverrides: Record<string, string | null>;
}

interface MatchShotImagesToFilenamesResult {
  assignments: ShotImageAssignment[];
  unmatchedUploads: UploadedShotImage[];
}

export const matchShotImagesToFilenames = ({
  shots,
  uploads,
  manualOverrides
}: MatchShotImagesToFilenamesArgs): MatchShotImagesToFilenamesResult => {
  const uploadsByUploadKey = new Map(
    uploads.map((upload) => [upload.uploadKey, upload])
  );

  const overridesByShot = shots.map((shot) => {
    const manualOverride = manualOverrides[shot.id];
    const hasValidManualOverride =
      manualOverride !== undefined &&
      (manualOverride === null || uploadsByUploadKey.has(manualOverride));
    return { shot, manualOverride, hasValidManualOverride };
  });

  const manuallyClaimedUploadKeys = new Set(
    overridesByShot
      .filter(({ hasValidManualOverride, manualOverride }) =>
        hasValidManualOverride ? manualOverride !== null : false
      )
      .map(({ manualOverride }) => manualOverride as string)
  );

  const shotMatches = overridesByShot.map(
    ({ shot, manualOverride, hasValidManualOverride }) => {
      const candidateUploadKeys = uploads
        .filter((upload) =>
          matchesFilenameToShotName(upload.fileName, shot.name)
        )
        .filter(
          (upload) =>
            hasValidManualOverride ||
            !manuallyClaimedUploadKeys.has(upload.uploadKey)
        )
        .map((upload) => upload.uploadKey);
      return {
        shot,
        candidateUploadKeys,
        manualOverride,
        hasValidManualOverride
      };
    }
  );

  const autoMatchClaimCounts = new Map<string, number>();
  for (const { candidateUploadKeys, hasValidManualOverride } of shotMatches) {
    if (hasValidManualOverride || candidateUploadKeys.length !== 1) continue;
    const uploadKey = candidateUploadKeys[0];
    autoMatchClaimCounts.set(
      uploadKey,
      (autoMatchClaimCounts.get(uploadKey) ?? 0) + 1
    );
  }

  const assignedUploadKeys = new Set<string>();

  const assignments = shotMatches.map(
    ({
      shot,
      candidateUploadKeys,
      manualOverride,
      hasValidManualOverride
    }): ShotImageAssignment => {
      if (hasValidManualOverride) {
        if (manualOverride === null) {
          return {
            shotId: shot.id,
            status: "unmatched",
            candidateUploadKeys
          };
        }
        assignedUploadKeys.add(manualOverride);
        return {
          shotId: shot.id,
          status: "matched",
          matchedUploadKey: manualOverride,
          candidateUploadKeys
        };
      }

      if (candidateUploadKeys.length === 1) {
        const uploadKey = candidateUploadKeys[0];
        const isClaimedByMultipleShots =
          (autoMatchClaimCounts.get(uploadKey) ?? 0) > 1;
        if (isClaimedByMultipleShots) {
          return {
            shotId: shot.id,
            status: "needs_review",
            candidateUploadKeys
          };
        }
        assignedUploadKeys.add(uploadKey);
        return {
          shotId: shot.id,
          status: "matched",
          matchedUploadKey: uploadKey,
          candidateUploadKeys
        };
      }

      if (candidateUploadKeys.length > 1) {
        return {
          shotId: shot.id,
          status: "needs_review",
          candidateUploadKeys
        };
      }

      return {
        shotId: shot.id,
        status: "unmatched",
        candidateUploadKeys
      };
    }
  );

  const unmatchedUploads = uploads.filter(
    (upload) =>
      !assignedUploadKeys.has(upload.uploadKey) &&
      !assignments.some((assignment) =>
        assignment.candidateUploadKeys.includes(upload.uploadKey)
      )
  );

  return { assignments, unmatchedUploads };
};
