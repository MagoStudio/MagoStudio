export const DEFAULT_ACCEPTED_IMAGE_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp"
];

export interface FilterFilesByAcceptedTypeResult {
  acceptedFiles: File[];
  firstRejectedFile: File | undefined;
}

export const filterFilesByAcceptedType = (
  files: File[],
  acceptedFileTypes: string[]
): FilterFilesByAcceptedTypeResult => {
  const acceptedFiles = files.filter((file) =>
    acceptedFileTypes.includes(file.type)
  );
  const firstRejectedFile = files.find(
    (file) => !acceptedFileTypes.includes(file.type)
  );

  return { acceptedFiles, firstRejectedFile };
};
