import { isIngestedCloudSourceVideoUploadOfTrim } from "./isIngestedCloudSourceVideoUploadOfTrim";

interface CloudSourceVideoLink {
  data: Record<string, unknown>;
}

export const isCloudSourceVideoLinkReusable = (
  link: CloudSourceVideoLink | null | undefined,
  requested: { sourceVideoTrimKey: string; cloudTimelineId: string }
): boolean => {
  if (!link) return false;
  const isSourceVideoOwnedByCloud = link.data.origin === "cloud";
  if (isSourceVideoOwnedByCloud) return true;
  const isSourceVideoOnRequestedCloudTimeline =
    link.data.cloudTimelineId === requested.cloudTimelineId;
  return (
    isSourceVideoOnRequestedCloudTimeline &&
    isIngestedCloudSourceVideoUploadOfTrim(link, requested.sourceVideoTrimKey)
  );
};
