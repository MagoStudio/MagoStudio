export const comfyWebSocketUrl = (
  endpoint: string,
  clientId: string
): string => {
  const url = new URL(endpoint);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = `${url.pathname.replace(/\/$/, "")}/ws`;
  url.search = new URLSearchParams({ clientId }).toString();
  return url.toString();
};
