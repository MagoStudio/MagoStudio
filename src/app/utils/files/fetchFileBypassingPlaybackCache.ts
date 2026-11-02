export const fetchFileBypassingPlaybackCache = (
  url: string
): Promise<Response> => fetch(url, { cache: "no-store" });
