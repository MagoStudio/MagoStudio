const SECURE_RESULT_URL_PREFIXES = ["https://", "blob:"];

export function getBulkRendersRunSecureResultUrl(
  resultUrl: unknown
): string | undefined {
  if (typeof resultUrl !== "string") return undefined;
  return SECURE_RESULT_URL_PREFIXES.some((prefix) =>
    resultUrl.startsWith(prefix)
  )
    ? resultUrl
    : undefined;
}
