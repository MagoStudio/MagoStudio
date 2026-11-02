import { TrimMetadata } from "@schemas/video";

const SECONDS_TO_MILLISECONDS = 1000;

export const buildTrimMetadataFile = (trimMetadata: TrimMetadata): File => {
  const metadataJson = {
    "trim-start": Math.floor(trimMetadata.trimStart * SECONDS_TO_MILLISECONDS),
    "trim-end": Math.floor(trimMetadata.trimEnd * SECONDS_TO_MILLISECONDS)
  };

  const metadataBlob = new Blob([JSON.stringify(metadataJson)], {
    type: "application/json"
  });

  return new File([metadataBlob], "metadata.json", {
    type: "application/json"
  });
};
