interface CloudAssetLink {
  data: Record<string, unknown>;
}

export const isCloudAssetLinkReusable = (
  link: CloudAssetLink | null | undefined
): boolean => {
  if (!link) return false;
  const isAssetFullyIngested = link.data.status === "ingested";
  const isAssetOwnedByCloud = link.data.origin === "cloud";
  return isAssetFullyIngested || isAssetOwnedByCloud;
};
