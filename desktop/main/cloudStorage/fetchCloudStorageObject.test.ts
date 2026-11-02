import { describe, expect, it, vi } from "vitest";

import { fetchCloudStorageObject } from "./fetchCloudStorageObject";

const ALLOWED_HOSTS = [
  "mago-s3-prod.s3.amazonaws.com",
  "mago-s3-prod.s3.eu-north-1.amazonaws.com"
];
const OBJECT_URL = "https://mago-s3-prod.s3.amazonaws.com/a/video.mp4?sig=1";
const REGIONAL_URL =
  "https://mago-s3-prod.s3.eu-north-1.amazonaws.com/a/video.mp4?sig=1";

const redirectTo = (location: string) =>
  new Response(null, { status: 307, headers: { location } });

describe("fetchCloudStorageObject", () => {
  it("fetches an allowed object without credentials and without following redirects blindly", async () => {
    const fetchFromCloudStorage = vi
      .fn()
      .mockResolvedValue(new Response("bytes", { status: 200 }));

    const response = await fetchCloudStorageObject({
      url: OBJECT_URL,
      allowedHosts: ALLOWED_HOSTS,
      range: "bytes=0-99",
      fetchFromCloudStorage
    });

    expect(await response.text()).toBe("bytes");
    const [requestedUrl, init] = fetchFromCloudStorage.mock.calls[0]!;
    expect(String(requestedUrl)).toBe(OBJECT_URL);
    expect(init).toMatchObject({
      method: "GET",
      headers: { range: "bytes=0-99" },
      redirect: "manual",
      credentials: "omit"
    });
  });

  it("never contacts a host outside the allowlist", async () => {
    const fetchFromCloudStorage = vi.fn();

    await expect(
      fetchCloudStorageObject({
        url: "https://169.254.169.254/latest/meta-data",
        allowedHosts: ALLOWED_HOSTS,
        fetchFromCloudStorage
      })
    ).rejects.toThrow("not Mago cloud storage");
    expect(fetchFromCloudStorage).not.toHaveBeenCalled();
  });

  it("follows a redirect between allowed bucket endpoints", async () => {
    const fetchFromCloudStorage = vi
      .fn()
      .mockResolvedValueOnce(redirectTo(REGIONAL_URL))
      .mockResolvedValueOnce(new Response("bytes", { status: 200 }));

    const response = await fetchCloudStorageObject({
      url: OBJECT_URL,
      allowedHosts: ALLOWED_HOSTS,
      fetchFromCloudStorage
    });

    expect(response.status).toBe(200);
    expect(String(fetchFromCloudStorage.mock.calls[1]![0])).toBe(REGIONAL_URL);
  });

  it("refuses a redirect that leaves the allowlist", async () => {
    const fetchFromCloudStorage = vi
      .fn()
      .mockResolvedValueOnce(redirectTo("https://evil.example/steal"));

    await expect(
      fetchCloudStorageObject({
        url: OBJECT_URL,
        allowedHosts: ALLOWED_HOSTS,
        fetchFromCloudStorage
      })
    ).rejects.toThrow("not Mago cloud storage");
    expect(fetchFromCloudStorage).toHaveBeenCalledTimes(1);
  });

  it("gives up after a bounded number of redirects", async () => {
    const fetchFromCloudStorage = vi.fn(() =>
      Promise.resolve(redirectTo(OBJECT_URL))
    );

    await expect(
      fetchCloudStorageObject({
        url: OBJECT_URL,
        allowedHosts: ALLOWED_HOSTS,
        fetchFromCloudStorage
      })
    ).rejects.toThrow("Too many redirects");
    expect(fetchFromCloudStorage).toHaveBeenCalledTimes(4);
  });

  it("hands back an error status rather than hiding it", async () => {
    const fetchFromCloudStorage = vi
      .fn()
      .mockResolvedValue(new Response("expired", { status: 403 }));

    const response = await fetchCloudStorageObject({
      url: OBJECT_URL,
      allowedHosts: ALLOWED_HOSTS,
      fetchFromCloudStorage
    });

    expect(response.status).toBe(403);
  });
});
