export const isLocalVideoUrl = (
  url: string | null | undefined
): url is string => {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "mago-media:" &&
      (parsed.hostname === "asset" || parsed.hostname === "script-project")
    );
  } catch {
    return false;
  }
};
