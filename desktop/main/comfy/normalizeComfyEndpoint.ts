export const normalizeComfyEndpoint = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) throw new Error("Enter a ComfyUI API endpoint");
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error("Enter a valid ComfyUI API endpoint");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:")
    throw new Error("ComfyUI endpoint must use http or https");
  if (url.username || url.password || url.search || url.hash)
    throw new Error("ComfyUI endpoint cannot contain credentials or a query");
  return url.toString().replace(/\/$/, "");
};
