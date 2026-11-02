export const toCloudRenderOutputLinkData = ({
  cloudOutputLayerId,
  isImage
}: {
  cloudOutputLayerId: string | null;
  isImage: boolean;
}): Record<string, unknown> => ({
  origin: "cloud",
  status: "ingested",
  ...(cloudOutputLayerId ? { cloudLayerId: cloudOutputLayerId } : {}),
  ...(isImage ? { kind: "image" } : {})
});
