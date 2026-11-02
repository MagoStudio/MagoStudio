import {
  matchShotImagesToFilenames,
  UploadedShotImage
} from "./matchShotImagesToFilenames";

interface UploadLike {
  status: string;
  assetId?: string;
  fileName: string;
}

interface GetSelectedShotImageAssignmentsArgs {
  shots: Array<{ id: string; name: string }>;
  timelineIds: string[];
  uploads: UploadLike[];
  manualOverrides: Record<string, string | null>;
}

export const getSelectedShotImageAssignments = ({
  shots,
  timelineIds,
  uploads,
  manualOverrides
}: GetSelectedShotImageAssignmentsArgs) => {
  const selectedShots = shots.filter((shot) => timelineIds.includes(shot.id));
  const doneUploads: UploadedShotImage[] = uploads
    .filter((upload) => upload.status === "done" && upload.assetId)
    .map((upload) => ({
      uploadKey: upload.assetId as string,
      fileName: upload.fileName
    }));
  const hasPendingUploads = uploads.some(
    (upload) => upload.status === "uploading"
  );

  return {
    ...matchShotImagesToFilenames({
      shots: selectedShots,
      uploads: doneUploads,
      manualOverrides
    }),
    selectedShots,
    doneUploads,
    hasPendingUploads
  };
};
