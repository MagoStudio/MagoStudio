export const getFileExtension = (filename: string): string => {
  const lastDotIndex = filename.lastIndexOf(".");
  return lastDotIndex !== -1
    ? filename.substring(lastDotIndex + 1).toLowerCase()
    : "";
};
