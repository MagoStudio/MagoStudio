export const parseAllowedCloudStorageUrl = (
  value: unknown,
  allowedHosts: readonly string[]
): URL => {
  if (typeof value !== "string" || !value) {
    throw new Error("The cloud storage URL must be a non-empty string");
  }
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("The cloud storage URL is not a valid URL");
  }
  const isHttps = url.protocol === "https:";
  const carriesCredentials = url.username !== "" || url.password !== "";
  const usesDefaultHttpsPort = url.port === "";
  const isAllowedCloudStorageHost = allowedHosts.some(
    (host) => host.toLowerCase() === url.hostname
  );
  if (
    !isHttps ||
    carriesCredentials ||
    !usesDefaultHttpsPort ||
    !isAllowedCloudStorageHost
  ) {
    throw new Error(
      "Refusing to read from a host that is not Mago cloud storage"
    );
  }
  return url;
};
