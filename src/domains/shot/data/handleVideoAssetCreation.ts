import { Shot } from "@schemas/shot";

import { useCreateVideoAsset } from "../../asset/useCreateVideoAsset";

const getVideoFileExtension = (file: File): string => {
  const mimeType = file.type.toLowerCase();
  if (mimeType.startsWith("video/")) {
    const subtype = mimeType.split("/")[1];
    switch (subtype) {
      case "quicktime":
        return "mov";
      case "x-msvideo":
        return "avi";
      case "x-matroska":
        return "mkv";
      case "x-ms-wmv":
        return "wmv";
      default:
        return subtype;
    }
  }

  const filename = file.name.toLowerCase();
  const match = filename.match(/\.([^.]+)$/);
  if (match) {
    return match[1];
  }

  throw new Error("Could not determine video file extension");
};

export const handleVideoAssetCreation = async ({
  selectedFile,
  selectedShotId,
  createVideoAsset
}: {
  selectedFile: File | null;
  selectedShotId: Shot["id"] | undefined;
  createVideoAsset: ReturnType<typeof useCreateVideoAsset>["mutateAsync"];
}) => {
  if (!selectedFile) {
    return;
  }

  if (!selectedShotId) {
    return;
  }

  const extension = getVideoFileExtension(selectedFile);

  try {
    const createVideoAssetResponse = await createVideoAsset({
      originalFileName: selectedFile.name,
      extension,
      timelineId: selectedShotId
    });

    return createVideoAssetResponse;
  } catch (error) {
    console.error("Error uploading video", error);
  }
};
