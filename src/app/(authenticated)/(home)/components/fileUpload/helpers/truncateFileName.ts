const DEFAULT_MAX_FILENAME_LENGTH = 24;
const DEFAULT_CHARS_AT_START = 10;
const DEFAULT_CHARS_AT_END = 5;

const MIN_CHARS_EACH_END = 3;
const ELLIPSIS_LENGTH = 3;
const FILENAME_START_WEIGHT_RATIO = 0.6;
const MIN_START_LENGTH = 1;
const BOTH_ENDS_MULTIPLIER = 2;

function truncateFileName(
  fileName: string,
  maxLength: number = DEFAULT_MAX_FILENAME_LENGTH,
  charsAtStart: number = DEFAULT_CHARS_AT_START,
  charsAtEnd: number = DEFAULT_CHARS_AT_END
): string {
  if (!fileName || fileName.length <= maxLength) {
    return fileName;
  }

  const lastDotIndex = fileName.lastIndexOf(".");
  let extension = "";
  let name = fileName;

  if (lastDotIndex !== -1) {
    extension = fileName.substring(lastDotIndex);
    name = fileName.substring(0, lastDotIndex);
  }

  const availableLength = maxLength - extension.length;

  if (
    availableLength <=
    BOTH_ENDS_MULTIPLIER * MIN_CHARS_EACH_END + ELLIPSIS_LENGTH
  ) {
    const startLength = Math.max(
      MIN_START_LENGTH,
      availableLength - ELLIPSIS_LENGTH
    );
    return fileName.substring(0, startLength) + "..." + extension;
  }

  const availableForBothEnds = availableLength - ELLIPSIS_LENGTH;

  const useCharsAtStart = Math.min(
    charsAtStart,
    Math.floor(availableForBothEnds * FILENAME_START_WEIGHT_RATIO)
  );
  const useCharsAtEnd = Math.min(
    charsAtEnd,
    availableForBothEnds - useCharsAtStart
  );

  const startPart = name.substring(0, useCharsAtStart);
  const endPart = name.substring(name.length - useCharsAtEnd);

  return `${startPart}...${endPart}${extension}`;
}

export function truncateFileNameFixed(
  fileName: string,
  charsAtStart: number,
  charsAtEnd: number = 0
): string {
  if (!fileName) return fileName;
  const lastDotIndex = fileName.lastIndexOf(".");
  const extension = lastDotIndex !== -1 ? fileName.substring(lastDotIndex) : "";
  const maxLength =
    charsAtStart + charsAtEnd + extension.length + ELLIPSIS_LENGTH;

  return truncateFileName(fileName, maxLength, charsAtStart, charsAtEnd);
}
