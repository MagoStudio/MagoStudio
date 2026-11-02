import { toSourceVideoTrimKey } from "../../../desktop/shared/toSourceVideoTrimKey";

interface CloudSourceVideoLink {
  data: Record<string, unknown>;
}

const untrimmedSourceVideoTrimKey = toSourceVideoTrimKey({});

const readLinkedSourceVideoTrimKey = (link: CloudSourceVideoLink): string => {
  const { sourceVideoTrimKey } = link.data;
  const isLinkFromBeforeTrimWasKeyed = sourceVideoTrimKey === undefined;
  if (isLinkFromBeforeTrimWasKeyed) return untrimmedSourceVideoTrimKey;
  return typeof sourceVideoTrimKey === "string" ? sourceVideoTrimKey : "";
};

export const isIngestedCloudSourceVideoUploadOfTrim = (
  link: CloudSourceVideoLink | null | undefined,
  requestedSourceVideoTrimKey: string
): boolean => {
  if (!link) return false;
  const isSourceVideoFullyIngested = link.data.status === "ingested";
  const isLinkedUploadOfRequestedTrim =
    readLinkedSourceVideoTrimKey(link) === requestedSourceVideoTrimKey;
  return isSourceVideoFullyIngested && isLinkedUploadOfRequestedTrim;
};
