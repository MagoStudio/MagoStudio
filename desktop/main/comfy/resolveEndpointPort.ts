const HTTP_DEFAULT_PORT = 80;
const HTTPS_DEFAULT_PORT = 443;

export const resolveEndpointPort = (endpoint: string): number => {
  const { port, protocol } = new URL(endpoint);
  if (port) return Number(port);
  return protocol === "https:" ? HTTPS_DEFAULT_PORT : HTTP_DEFAULT_PORT;
};
