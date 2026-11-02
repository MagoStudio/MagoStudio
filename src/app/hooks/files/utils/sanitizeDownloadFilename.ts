const MAX_SANITIZED_FILENAME_SEGMENT_BYTES = 100;

const PATH_SEPARATOR_OR_RESERVED_CHARACTERS_PATTERN = /[\\/:*?"<>|]/g;
// oxlint-disable-next-line no-control-regex -- deliberately stripping filesystem-hostile control characters
const CONTROL_CHARACTERS_PATTERN = /[\x00-\x1f\x7f]/g;
const BIDI_CONTROL_CHARACTERS_PATTERN =
  /[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g;
const LEADING_DOTS_PATTERN = /^\.+/;
const WINDOWS_RESERVED_DEVICE_NAME_PATTERN =
  /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;

const clampToByteBudget = (value: string, maxBytes: number): string => {
  const encoder = new TextEncoder();
  let clamped = "";
  let byteLength = 0;
  for (const codePoint of value) {
    const codePointByteLength = encoder.encode(codePoint).length;
    if (byteLength + codePointByteLength > maxBytes) break;
    clamped += codePoint;
    byteLength += codePointByteLength;
  }
  return clamped;
};

const avoidWindowsReservedDeviceName = (value: string): string =>
  WINDOWS_RESERVED_DEVICE_NAME_PATTERN.test(value) ? `_${value}` : value;

export const sanitizeDownloadFilename = (
  rawFilenameSegment: string,
  {
    maxBytes = MAX_SANITIZED_FILENAME_SEGMENT_BYTES
  }: { maxBytes?: number } = {}
): string => {
  const withSafeCharacters = rawFilenameSegment
    .replace(PATH_SEPARATOR_OR_RESERVED_CHARACTERS_PATTERN, "_")
    .replace(CONTROL_CHARACTERS_PATTERN, "_")
    .replace(BIDI_CONTROL_CHARACTERS_PATTERN, "")
    .replace(LEADING_DOTS_PATTERN, "");

  return clampToByteBudget(
    avoidWindowsReservedDeviceName(withSafeCharacters),
    maxBytes
  );
};
