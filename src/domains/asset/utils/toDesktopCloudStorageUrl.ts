const S3_VIRTUAL_HOSTED_BUCKET_HOSTNAME =
  /^[a-z0-9][a-z0-9.-]*\.s3(?:[.-][a-z0-9-]+)?\.amazonaws\.com$/;

export const DESKTOP_CLOUD_STORAGE_URL_PREFIX =
  "mago-media://cloud-storage/?url=";

export const toDesktopCloudStorageUrl = (url: string): string => {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return url;
  }
  const isS3ObjectUrl =
    parsedUrl.protocol === "https:" &&
    S3_VIRTUAL_HOSTED_BUCKET_HOSTNAME.test(parsedUrl.hostname);
  if (!isS3ObjectUrl) return url;
  return `${DESKTOP_CLOUD_STORAGE_URL_PREFIX}${encodeURIComponent(url)}`;
};
