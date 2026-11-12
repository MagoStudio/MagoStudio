export const findFilenameIgnoringCase = (
  filenames: readonly string[],
  wantedFilename: string
): string | undefined => {
  const wantedLowercase = wantedFilename.toLowerCase();
  return (
    filenames.find((filename) => filename === wantedFilename) ??
    filenames.find((filename) => filename.toLowerCase() === wantedLowercase)
  );
};
