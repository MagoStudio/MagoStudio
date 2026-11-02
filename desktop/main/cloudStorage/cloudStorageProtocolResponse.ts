import {
  fetchCloudStorageObject,
  type FetchCloudStorage
} from "./fetchCloudStorageObject";
import { parseAllowedCloudStorageUrl } from "./parseAllowedCloudStorageUrl";

const HTTP_FORBIDDEN = 403;
const HTTP_METHOD_NOT_ALLOWED = 405;
const HTTP_BAD_GATEWAY = 502;

const FORWARDED_RESPONSE_HEADERS = [
  "accept-ranges",
  "content-range",
  "content-type",
  "etag",
  "last-modified"
];

const buildForwardedHeaders = (upstream: Response): Headers => {
  const headers = new Headers({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Expose-Headers":
      "Accept-Ranges, Content-Length, Content-Range",
    "Cache-Control": "no-store"
  });
  for (const name of FORWARDED_RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  const contentLength = upstream.headers.get("content-length");
  const isBodyDecodedInTransit = upstream.headers.has("content-encoding");
  if (contentLength && !isBodyDecodedInTransit) {
    headers.set("content-length", contentLength);
  }
  return headers;
};

export const cloudStorageProtocolResponse = async (
  request: Request,
  allowedHosts: readonly string[],
  fetchFromCloudStorage?: FetchCloudStorage
): Promise<Response> => {
  const isReadRequest = request.method === "GET" || request.method === "HEAD";
  if (!isReadRequest) {
    return new Response("Method not allowed", {
      status: HTTP_METHOD_NOT_ALLOWED
    });
  }

  const objectUrl = new URL(request.url).searchParams.get("url");
  try {
    parseAllowedCloudStorageUrl(objectUrl, allowedHosts);
  } catch {
    return new Response("Forbidden", { status: HTTP_FORBIDDEN });
  }

  let upstream: Response;
  try {
    upstream = await fetchCloudStorageObject({
      url: objectUrl,
      allowedHosts,
      method: request.method === "HEAD" ? "HEAD" : "GET",
      range: request.headers.get("range") ?? undefined,
      signal: request.signal,
      fetchFromCloudStorage
    });
  } catch {
    return new Response("Mago cloud storage is unreachable", {
      status: HTTP_BAD_GATEWAY
    });
  }

  return new Response(request.method === "HEAD" ? null : upstream.body, {
    status: upstream.status,
    headers: buildForwardedHeaders(upstream)
  });
};
