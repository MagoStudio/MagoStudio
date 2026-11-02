import { readAxiosErrorBody } from "@domains/renders/utils/readAxiosErrorBody";
import { isAxiosError } from "axios";

const MISSING_REFERENCE_ASSET_PATTERN =
  /reference asset ([0-9a-f-]{36}) not found/i;

export const findMissingReferenceCloudAssetId = (
  error: unknown
): string | null => {
  const message = isAxiosError(error)
    ? readAxiosErrorBody(error.response?.data)
    : error instanceof Error
      ? error.message
      : "";
  return MISSING_REFERENCE_ASSET_PATTERN.exec(message)?.[1] ?? null;
};
